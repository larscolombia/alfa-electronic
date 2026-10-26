package inventory

import (
	"database/sql"
	"errors"
	"os"
	"strings"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
	"pika.software.net.co/backend/internal/platform/database"
)

// openInventoryTestDB abre la BD de pruebas (mismo patron que los tests SLA):
// se omite sin RUN_DB_TESTS para no requerir Postgres en cada corrida unitaria.
func openInventoryTestDB(t *testing.T) *sql.DB {
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
	return db
}

func stockFor(t *testing.T, db *sql.DB, companyID, reference string) int {
	t.Helper()
	var stock int
	err := db.QueryRow(`SELECT current_stock FROM inventory_references WHERE company_id = $1 AND reference = $2`,
		companyID, reference).Scan(&stock)
	if err != nil {
		t.Fatalf("leer stock de %s: %v", reference, err)
	}
	return stock
}

func receivedFor(t *testing.T, db *sql.DB, companyID, lineID string) int {
	t.Helper()
	var received int
	err := db.QueryRow(`SELECT received_quantity FROM inventory_purchase_lines WHERE company_id = $1 AND id = $2`,
		companyID, lineID).Scan(&received)
	if err != nil {
		t.Fatalf("leer received_quantity de %s: %v", lineID, err)
	}
	return received
}

func seedInventoryForReceive(t *testing.T, db *sql.DB, companyID, reference string, stock int) {
	t.Helper()
	if _, err := db.Exec(`
		INSERT INTO inventory_references (company_id, reference, current_stock)
		VALUES ($1, $2, $3)
		ON CONFLICT (company_id, reference) DO UPDATE SET current_stock = EXCLUDED.current_stock`,
		companyID, reference, stock); err != nil {
		t.Fatalf("sembrar referencia: %v", err)
	}
}

func seedPurchaseLine(t *testing.T, db *sql.DB, companyID, lineID, reference string, quantity int, status string) {
	t.Helper()
	if _, err := db.Exec(`
		INSERT INTO inventory_purchase_lines (company_id, id, reference, component, type, brand, description, supplier,
			quantity, unit_price, needed_by, source, expected_date, request_reason, generated_at, generated_by, status,
			project_id, equipment_tag, approval_status)
		VALUES ($1,$2,$3,'','','','prueba de recibo','', $4,0,'','manual','','razon qa', now(), 'qa', $5, '', '', 'aprobada')
		ON CONFLICT (company_id, id) DO UPDATE SET quantity = EXCLUDED.quantity, status = EXCLUDED.status, received_quantity = 0`,
		companyID, lineID, reference, quantity, status); err != nil {
		t.Fatalf("sembrar linea de compra: %v", err)
	}
}

func cleanupReceiveTest(t *testing.T, db *sql.DB, companyID string) {
	t.Helper()
	for _, table := range []string{"inventory_purchase_lines", "inventory_references", "inventory_movements"} {
		if _, err := db.Exec(`DELETE FROM `+table+` WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup de %s: %v", table, err)
		}
	}
}

// Caso central del requerimiento: recibo parcial + cierre NO debe doble-contar
// stock. Solicito 5, recibo 3 (stock +3), intento recibir mas (se limita al
// faltante, stock llega a +5), y al cerrar no entra NADA nuevo (faltante = 0).
func TestReceiveThenCloseNeverDoubleCreditsStock(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-recibos-1"
	t.Cleanup(func() { cleanupReceiveTest(t, db, companyID) })

	reference := "REC-QA-IGBT"
	lineID := "linea-q1"
	seedInventoryForReceive(t, db, companyID, reference, 0)
	seedPurchaseLine(t, db, companyID, lineID, reference, 5, "pendiente")

	res, err := svc.ReceivePurchaseLine(companyID, lineID, 3, "qa")
	if err != nil {
		t.Fatalf("recibir 3: %v", err)
	}
	if !res.OK {
		t.Fatalf("recibo 3/5 no ok: %s", res.Message)
	}
	if got := stockFor(t, db, companyID, reference); got != 3 {
		t.Fatalf("stock tras recibo parcial = %d, queria 3", got)
	}
	if got := receivedFor(t, db, companyID, lineID); got != 3 {
		t.Fatalf("received_quantity = %d, queria 3", got)
	}

	// Sobre-entrega: pido 10 mas pero solo faltan 2. Se limita, no explota stock.
	res, err = svc.ReceivePurchaseLine(companyID, lineID, 10, "qa")
	if err != nil {
		t.Fatalf("recibir excedente (debe limitarse): %v", err)
	}
	if !strings.Contains(res.Message, "se limito") {
		t.Errorf("el mensaje no explica el limite: %q", res.Message)
	}
	if got := stockFor(t, db, companyID, reference); got != 5 {
		t.Fatalf("stock tras recibo limitado = %d, queria exactamente 5 (nada mas)", got)
	}

	// Ya recibido al 100%: otro recibo es un error accionable.
	if _, err := svc.ReceivePurchaseLine(companyID, lineID, 1, "qa"); !errors.Is(err, errReceiveQuantity) {
		t.Fatalf("recibo tras totalidad = %v, queria errReceiveQuantity", err)
	}

	// Cierre con faltante cero: NO debe acreditar nada nuevo.
	res, err = svc.ClosePurchaseLine(companyID, lineID, "qa")
	if err != nil {
		t.Fatalf("cerrar linea completa: %v", err)
	}
	if got := stockFor(t, db, companyID, reference); got != 5 {
		t.Fatalf("stock tras cierre con faltante cero = %d, queria 5 (sin doble conteo)", got)
	}

	var status string
	if err := db.QueryRow(`SELECT status FROM inventory_purchase_lines WHERE company_id=$1 AND id=$2`, companyID, lineID).Scan(&status); err != nil {
		t.Fatalf("leer status: %v", err)
	}
	if status != "cerrada" {
		t.Fatalf("status = %q, queria cerrada", status)
	}

	var movements int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_movements WHERE company_id=$1 AND reference=$2 AND type='entrada'`, companyID, reference).Scan(&movements); err != nil {
		t.Fatalf("contar movimientos: %v", err)
	}
	if movements != 2 { // un movimiento por recibo (3 y 2), cero por el cierre sin faltante
		t.Fatalf("movimientos de entrada = %d, queria 2 (los recibos; el cierre no debe agregar)", movements)
	}
}

// Compatibilidad con el flujo antiguo: linea sin recibos que se cierra directo
// sigue acreditando la totalidad al stock.
func TestCloseWithoutReceiptCreditsFullQuantity(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-recibos-2"
	t.Cleanup(func() { cleanupReceiveTest(t, db, companyID) })

	reference := "REC-QA-PAC"
	lineID := "linea-q2"
	seedInventoryForReceive(t, db, companyID, reference, 0)
	seedPurchaseLine(t, db, companyID, lineID, reference, 4, "enviada")

	res, err := svc.ClosePurchaseLine(companyID, lineID, "qa")
	if err != nil {
		t.Fatalf("cerrar linea legacy: %v", err)
	}
	stockAfter := stockFor(t, db, companyID, reference)
	if !res.OK || stockAfter != 4 {
		t.Fatalf("stock tras cierre sin recibos = %d (msg %q), queria 4", stockAfter, res.Message)
	}
}

// Recibo parcial + cierre acredita exactamente el faltante (ni una menos).
func TestPartialReceiveThenCloseCreditsOnlyRemaining(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-recibos-3"
	t.Cleanup(func() { cleanupReceiveTest(t, db, companyID) })

	reference := "REC-QA-MEM"
	lineID := "linea-q3"
	seedInventoryForReceive(t, db, companyID, reference, 10) // stock base 10
	seedPurchaseLine(t, db, companyID, lineID, reference, 6, "pendiente")

	if _, err := svc.ReceivePurchaseLine(companyID, lineID, 2, "qa"); err != nil {
		t.Fatalf("recibir 2: %v", err)
	}
	res, err := svc.ClosePurchaseLine(companyID, lineID, "qa")
	if err != nil {
		t.Fatalf("cerrar tras recibo parcial: %v", err)
	}
	if got := stockFor(t, db, companyID, reference); got != 16 {
		t.Fatalf("stock = %d, queria 10 base + 2 recibo + 4 faltante al cerrar = 16", got)
	}
	if !strings.Contains(res.Message, "Recibos previos: 2") {
		t.Errorf("el mensaje de cierre no refleja los recibos previos: %q", res.Message)
	}
}

// Validaciones defensivas del endpoint.
func TestReceiveValidationErrors(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-recibos-4"
	t.Cleanup(func() { cleanupReceiveTest(t, db, companyID) })

	reference := "REC-QA-ERR"
	lineID := "linea-q4"
	seedInventoryForReceive(t, db, companyID, reference, 0)
	seedPurchaseLine(t, db, companyID, lineID, reference, 2, "pendiente")

	if _, err := svc.ReceivePurchaseLine(companyID, lineID, 0, "qa"); !errors.Is(err, errReceiveQuantity) {
		t.Fatalf("cantidad 0 = %v, queria errReceiveQuantity", err)
	}
	if _, err := svc.ReceivePurchaseLine(companyID, lineID, -3, "qa"); !errors.Is(err, errReceiveQuantity) {
		t.Fatalf("cantidad negativa = %v, queria errReceiveQuantity", err)
	}
	if _, err := svc.ReceivePurchaseLine(companyID, "no-existe", 1, "qa"); !errors.Is(err, errPurchaseLineNotFound) {
		t.Fatalf("linea inexistente = %v, queria errPurchaseLineNotFound", err)
	}

	// Recibo contra linea cerrada: error claro.
	closedID := "linea-q4-cerrada"
	seedPurchaseLine(t, db, companyID, closedID, reference, 2, "cerrada")
	if _, err := svc.ReceivePurchaseLine(companyID, closedID, 1, "qa"); !errors.Is(err, errInvalidStatus) {
		t.Fatalf("recibo sobre cerrada = %v, queria errInvalidStatus", err)
	}
}

// Recibir contra una referencia que NO existe en el catalogo debe rechazarse
// (no marcar received_quantity ni tocar stock): antes respondía 200 con un
// mensaje engañoso y el material se perdia en silencio (hallazgo t08).
func TestReceiveRejectsGhostReference(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-recibos-ghost"
	t.Cleanup(func() { cleanupReceiveTest(t, db, companyID) })

	ghostRef := "REC-QA-FANTASMA"
	lineID := "linea-q-ghost"
	// La linea de compra apunta a una referencia que jamás se creó en catalogo.
	seedPurchaseLine(t, db, companyID, lineID, ghostRef, 3, "pendiente")

	res, err := svc.ReceivePurchaseLine(companyID, lineID, 2, "qa")
	if !errors.Is(err, errReferenceNotFound) {
		t.Fatalf("recibo con referencia fantasma = %v, queria errReferenceNotFound", err)
	}
	if res.OK {
		t.Error("OK=true para un recibo rechazado")
	}
	if !strings.Contains(res.Message, ghostRef) {
		t.Errorf("el mensaje no nombra la referencia: %q", res.Message)
	}

	if got := receivedFor(t, db, companyID, lineID); got != 0 {
		t.Errorf("received_quantity = %d, queria 0 (no se marca lo no recibido)", got)
	}

	var stockCount, movements int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_references WHERE company_id=$1 AND reference=$2`, companyID, ghostRef).Scan(&stockCount); err != nil {
		t.Fatalf("contar referencias: %v", err)
	}
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_movements WHERE company_id=$1 AND reference=$2`, companyID, ghostRef).Scan(&movements); err != nil {
		t.Fatalf("contar movimientos: %v", err)
	}
	if stockCount != 0 || movements != 0 {
		t.Errorf("referencia fantasma tocada: stockCount=%d movements=%d, queria 0/0", stockCount, movements)
	}
}
