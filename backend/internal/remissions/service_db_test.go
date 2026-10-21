package remissions

import (
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("RUN_DB_TESTS") == "" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping test database: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrate test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func testCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-rem-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM remissions WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM remission_sequences WHERE company_id = $1`, companyID)
		// Fase 5c: el puente pago→despacho lee crm_clients y finance_invoices,
		// y el outbox también se siembra desde este paquete.
		db.Exec(`DELETE FROM finance_invoices WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM crm_clients WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM email_outbox WHERE company_id = $1`, companyID)
	})
	return companyID
}

// adminActor es un actor con rol admin del JWT: el único que puede autorizar un
// override de la puerta de pago.
func adminActor() Actor {
	return Actor{Email: "admin@qa.local", Role: "admin"}
}

// operatorActor es un actor sin privilegios: la puerta lo rechaza.
func operatorActor() Actor {
	return Actor{Email: "operario@qa.local", Role: "tecnico"}
}

// deliver es el atajo de los tests para "marcar entregado" sin override.
func deliver(s *Service, companyID, id string, actor Actor) (*Remission, error) {
	return s.UpdateDeliveryStatus(companyID, id, DeliveryStatusRequest{DeliveryStatus: "entregado"}, actor)
}

// seedCreditClient registra un cliente CON crédito habilitado (30/45 días).
//
// Es necesario en los tests de transiciones porque la Fase 5c añadió la puerta
// de pago: sin fila en crm_clients el JOIN resuelve credit_enabled=false y la
// puerta aplica, así que estos tests (que prueban transiciones, no la regla de
// pago) quedarían bloqueados por una regla que no están ejerciendo.
func seedCreditClient(t *testing.T, db *sql.DB, companyID, nit, name string) {
	t.Helper()
	_, err := db.Exec(`
INSERT INTO crm_clients (company_id, id, nombre, empresa, nit, estado, credit_enabled, soft_delete, created_at, updated_at)
VALUES ($1, $2, $3, $3, $4, 'Activo', true, false, NOW(), NOW())`,
		companyID, fmt.Sprintf("cli-%s-%d", name, time.Now().UnixNano()), name, nit)
	if err != nil {
		t.Fatalf("sembrar cliente con credito: %v", err)
	}
}

// seedInvoice inserta una factura de prueba y devuelve su id.
//
// Los casts explícitos son necesarios: $3 aparece en contextos NUMERIC y en un
// CASE con rama entera, y Postgres no logra deducir un tipo único
// ("inconsistent types deduced for parameter $3").
func seedInvoice(t *testing.T, db *sql.DB, companyID, clientID, status string, total float64) int64 {
	t.Helper()
	var id int64
	err := db.QueryRow(`
INSERT INTO finance_invoices (
	company_id, client_id, client_name, reference_code, document_type,
	issue_date, currency_code, subtotal, tax_total, total, paid_amount,
	balance_amount, status, soft_delete, created_at, updated_at
) VALUES ($1, $2, 'Cliente QA', 'FV-QA-' || floor(random()*100000)::int::text, 'factura',
	CURRENT_DATE, 'COP', $3::numeric, 0::numeric, $3::numeric,
	CASE WHEN $4::text = 'Pagado' THEN $3::numeric ELSE 0::numeric END,
	CASE WHEN $4::text = 'Pagado' THEN 0::numeric ELSE $3::numeric END,
	$4::text, false, NOW(), NOW())
RETURNING id`, companyID, clientID, total, status).Scan(&id)
	if err != nil {
		t.Fatalf("sembrar factura: %v", err)
	}
	return id
}

func setInvoiceStatus(t *testing.T, db *sql.DB, companyID string, invoiceID int64, status string) {
	t.Helper()
	if _, err := db.Exec(
		`UPDATE finance_invoices SET status = $3, updated_at = NOW() WHERE company_id = $1 AND id = $2`,
		companyID, invoiceID, status,
	); err != nil {
		t.Fatalf("cambiar estado de factura: %v", err)
	}
}

// invoiceIDPtr existe porque `InvoiceID *int64` no se puede escribir como literal.
func invoiceIDPtr(value int64) *int64 { return &value }

func TestCreateAndGetIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "create")

	req := sampleRequest()
	req.PurchaseOrder = "OC-123"
	req.YoutubeLink = "https://youtube.com/watch?v=abc"
	req.DispatchPhotos = []Attachment{{Name: "sellado.jpg", DataURL: "data:image/jpeg;base64,xx"}}
	req.Items[0].Accessories = "Cable de poder, caja"
	req.Items[0].AnchoredNote = "Incluir motor de pruebas prestado"

	r, err := s.Create(companyID, req, "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if r.DeliveryStatus != "pendiente" || r.Status != "borrador" {
		t.Errorf("estados iniciales = %q/%q", r.DeliveryStatus, r.Status)
	}
	if r.TotalValue != 301 {
		t.Errorf("TotalValue = %v, esperaba 301", r.TotalValue)
	}
	if !regexp.MustCompile(`^E-CO-\d{4}-\d{4,}$`).MatchString(r.Consecutive) {
		t.Errorf("consecutivo invalido: %s", r.Consecutive)
	}

	got, err := s.Get(companyID, r.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.PurchaseOrder != "OC-123" || got.YoutubeLink != req.YoutubeLink {
		t.Errorf("campos de evidencia no persistieron: %+v", got)
	}
	if len(got.DispatchPhotos) != 1 || got.DispatchPhotos[0].Name != "sellado.jpg" {
		t.Errorf("DispatchPhotos = %+v", got.DispatchPhotos)
	}
	if got.Items[0].Accessories != "Cable de poder, caja" || got.Items[0].AnchoredNote == "" {
		t.Errorf("items no persistieron accesorios/nota: %+v", got.Items[0])
	}
	if got.CreatedAt == "" {
		t.Error("CreatedAt vacio")
	}
}

func TestListIsNewestFirstAndCompanyScoped(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyA := testCompany(t, db, "lista")
	companyB := testCompany(t, db, "listb")

	first, err := s.Create(companyA, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create 1: %v", err)
	}
	second, err := s.Create(companyA, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create 2: %v", err)
	}
	if _, err := s.Create(companyB, sampleRequest(), "tester"); err != nil {
		t.Fatalf("Create companyB: %v", err)
	}

	items, err := s.List(companyA)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(items) != 2 {
		t.Fatalf("List devolvio %d items, esperaba 2", len(items))
	}
	if items[0].ID != second.ID || items[1].ID != first.ID {
		t.Errorf("orden esperado newest-first: %s, %s", items[0].ID, items[1].ID)
	}
	if first.Consecutive == second.Consecutive {
		t.Errorf("consecutivos duplicados: %s", first.Consecutive)
	}

	itemsB, err := s.List(companyB)
	if err != nil {
		t.Fatalf("List companyB: %v", err)
	}
	if len(itemsB) != 1 {
		t.Fatalf("List companyB devolvio %d items, esperaba 1", len(itemsB))
	}
	if itemsB[0].Consecutive != first.Consecutive {
		t.Errorf("la secuencia por empresa debe ser independiente: %s vs %s", itemsB[0].Consecutive, first.Consecutive)
	}
}

func TestUpdatePreservesStatusesIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "update")

	// Cliente a crédito: este test prueba que Update preserva los estados, no
	// la puerta de pago de la Fase 5c (esa tiene su propio test).
	seedCreditClient(t, db, companyID, "900123456", "Cliente Demo")

	r, err := s.Create(companyID, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if _, err := deliver(s, companyID, r.ID, operatorActor()); err != nil {
		t.Fatalf("UpdateDeliveryStatus: %v", err)
	}

	req := sampleRequest()
	req.ClientName = "Cliente Editado"
	updated, err := s.Update(companyID, r.ID, req)
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.ClientName != "Cliente Editado" {
		t.Errorf("ClientName = %q", updated.ClientName)
	}
	if updated.Status != "borrador" {
		t.Errorf("Update no debe cambiar Status, quedo %q", updated.Status)
	}
	if updated.DeliveryStatus != "entregado" {
		t.Errorf("Update no debe cambiar DeliveryStatus, quedo %q", updated.DeliveryStatus)
	}
}

func TestDeliveryStatusTransitionsIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "delivery")

	seedCreditClient(t, db, companyID, "900123456", "Cliente Demo")

	r, err := s.Create(companyID, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	for _, status := range []string{"", "despachado", "ENTREGADO"} {
		req := DeliveryStatusRequest{DeliveryStatus: status}
		if _, err := s.UpdateDeliveryStatus(companyID, r.ID, req, operatorActor()); err == nil {
			t.Errorf("esperaba error para estado %q", status)
		}
	}
	if _, err := deliver(s, companyID, r.ID, operatorActor()); err != nil {
		t.Fatalf("pendiente->entregado: %v", err)
	}
	if _, err := deliver(s, companyID, r.ID, operatorActor()); err != nil {
		t.Fatalf("entregado->entregado: %v", err)
	}
	revert := DeliveryStatusRequest{DeliveryStatus: "pendiente"}
	if _, err := s.UpdateDeliveryStatus(companyID, r.ID, revert, operatorActor()); err == nil {
		t.Error("esperaba error al revertir entregado a pendiente")
	}
	if _, err := deliver(s, companyID, "rem-inexistente", operatorActor()); err == nil {
		t.Error("esperaba error para remision inexistente")
	}
}

func TestGetAndDeleteAreCompanyScopedIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyA := testCompany(t, db, "scopea")
	companyB := testCompany(t, db, "scopeb")

	seedCreditClient(t, db, companyA, "900123456", "Cliente Demo")

	r, err := s.Create(companyA, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if _, err := s.Get(companyB, r.ID); err == nil {
		t.Error("Get en otra empresa debe fallar")
	}
	if _, err := deliver(s, companyB, r.ID, operatorActor()); err == nil {
		t.Error("UpdateDeliveryStatus en otra empresa debe fallar")
	}
	if err := s.Delete(companyB, r.ID); err == nil {
		t.Error("Delete en otra empresa debe fallar")
	}
	if err := s.Delete(companyA, r.ID); err != nil {
		t.Fatalf("Delete en empresa correcta: %v", err)
	}
	if _, err := s.Get(companyA, r.ID); err == nil {
		t.Error("Get despues de Delete debe fallar")
	}
}
