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
	})
	return companyID
}

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

	r, err := s.Create(companyID, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	if _, err := s.UpdateDeliveryStatus(companyID, r.ID, "entregado"); err != nil {
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

	r, err := s.Create(companyID, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}
	for _, status := range []string{"", "despachado", "ENTREGADO"} {
		if _, err := s.UpdateDeliveryStatus(companyID, r.ID, status); err == nil {
			t.Errorf("esperaba error para estado %q", status)
		}
	}
	if _, err := s.UpdateDeliveryStatus(companyID, r.ID, "entregado"); err != nil {
		t.Fatalf("pendiente->entregado: %v", err)
	}
	if _, err := s.UpdateDeliveryStatus(companyID, r.ID, "entregado"); err != nil {
		t.Fatalf("entregado->entregado: %v", err)
	}
	if _, err := s.UpdateDeliveryStatus(companyID, r.ID, "pendiente"); err == nil {
		t.Error("esperaba error al revertir entregado a pendiente")
	}
	if _, err := s.UpdateDeliveryStatus(companyID, "rem-inexistente", "entregado"); err == nil {
		t.Error("esperaba error para remision inexistente")
	}
}

func TestGetAndDeleteAreCompanyScopedIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyA := testCompany(t, db, "scopea")
	companyB := testCompany(t, db, "scopeb")

	r, err := s.Create(companyA, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create: %v", err)
	}

	if _, err := s.Get(companyB, r.ID); err == nil {
		t.Error("Get en otra empresa debe fallar")
	}
	if _, err := s.UpdateDeliveryStatus(companyB, r.ID, "entregado"); err == nil {
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
