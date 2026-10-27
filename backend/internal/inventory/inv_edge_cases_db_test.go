package inventory

import (
	"database/sql"
	"errors"
	"strings"
	"testing"
)

func cleanupInvEdge(t *testing.T, db *sql.DB, companyID string) {
	t.Helper()
	for _, table := range []string{
		"inventory_reservations", "inventory_movements", "inventory_references",
		"inventory_replenishment_items", "inventory_audit_trail",
	} {
		if _, err := db.Exec(`DELETE FROM `+table+` WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup de %s: %v", table, err)
		}
	}
}

func auditCount(t *testing.T, db *sql.DB, companyID, action string) int {
	t.Helper()
	var n int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_audit_trail WHERE company_id = $1 AND action = $2`, companyID, action).Scan(&n); err != nil {
		t.Fatalf("contar auditoria %s: %v", action, err)
	}
	return n
}

func seedReferenceFull(t *testing.T, db *sql.DB, companyID, reference string, stock, minStock int) {
	t.Helper()
	if _, err := db.Exec(`
		INSERT INTO inventory_references (company_id, reference, current_stock, min_stock)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (company_id, reference) DO UPDATE SET current_stock = EXCLUDED.current_stock, min_stock = EXCLUDED.min_stock`,
		companyID, reference, stock, minStock); err != nil {
		t.Fatalf("sembrar referencia: %v", err)
	}
}

// INV-02: las reservas activas reducen el disponible; salida/reserva/consumo
// validan contra AvailableStock y el error lleva las cantidades.
func TestAvailableStockDiscountsActiveReservations(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-avail"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-AVAIL-1"
	seedReferenceFull(t, db, companyID, reference, 5, 0)

	if _, _, err := svc.CreateReservation(companyID, CreateReservationRequest{
		Reference: reference, Quantity: 2, AssignedTo: "tec", Purpose: "prueba",
	}, "qa"); err != nil {
		t.Fatalf("crear reserva: %v", err)
	}

	avail, reserved, err := svc.AvailableStock(companyID, reference)
	if err != nil || avail != 3 || reserved != 2 {
		t.Fatalf("AvailableStock = %d/%d err %v, queria 3/2", avail, reserved, err)
	}

	_, result, err := svc.CreateReservation(companyID, CreateReservationRequest{
		Reference: reference, Quantity: 4, AssignedTo: "tec", Purpose: "excede",
	}, "qa")
	if !errors.Is(err, errInsufficientStock) {
		t.Fatalf("segunda reserva = %v, queria errInsufficientStock", err)
	}
	want := "No hay stock suficiente: disponible 3 (reservado 2), requerido 4"
	if result.Message != want+". Si falta material usa el flujo de compra." {
		t.Errorf("mensaje = %q", result.Message)
	}

	res, err := svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 4, Reason: "instalacion",
	}, "qa")
	if !errors.Is(err, errInsufficientStock) || !strings.Contains(res.Message, "disponible 3 (reservado 2), requerido 4") {
		t.Fatalf("salida excedente = %v (%q)", err, res.Message)
	}

	res, err = svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 3, Reason: "instalacion ok",
	}, "qa")
	if err != nil || !res.OK {
		t.Fatalf("salida dentro del disponible = %v (%q)", err, res.Message)
	}
}

// INV-03: GetFullState auto-expira; extend reactiva una vencida; consume de una
// vencida sigue rechazado.
func TestExpiredReservationLifecycle(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-expiry"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-EXP-1"
	seedReferenceFull(t, db, companyID, reference, 5, 0)

	reservation, _, err := svc.CreateReservation(companyID, CreateReservationRequest{
		Reference: reference, Quantity: 2, AssignedTo: "tec", Purpose: "vencimiento",
	}, "qa")
	if err != nil {
		t.Fatalf("crear reserva: %v", err)
	}

	if _, err := db.Exec(`UPDATE inventory_reservations SET expires_at = NOW() - INTERVAL '1 hour' WHERE company_id = $1 AND id = $2`, companyID, reservation.ID); err != nil {
		t.Fatalf("forzar vencimiento: %v", err)
	}

	state, err := svc.GetFullState(companyID)
	if err != nil {
		t.Fatalf("full state: %v", err)
	}
	found := false
	for _, r := range state.Reservations {
		if r.ID == reservation.ID {
			found = true
			if r.Status != "vencida" {
				t.Fatalf("estado tras GetFullState = %q, queria vencida", r.Status)
			}
		}
	}
	if !found {
		t.Fatal("reserva no aparece en el estado")
	}
	if n := auditCount(t, db, companyID, "RESERVATION_EXPIRED"); n != 1 {
		t.Fatalf("auditoria RESERVATION_EXPIRED = %d, queria 1", n)
	}

	res, err := svc.ConsumeReservation(companyID, reservation.ID, "qa")
	if !errors.Is(err, errInvalidStatus) || !strings.Contains(res.Message, "renovala o liberela") {
		t.Fatalf("consume vencida = %v (%q)", err, res.Message)
	}

	res, err = svc.ExtendReservation(companyID, reservation.ID, "qa")
	if err != nil || !res.OK {
		t.Fatalf("extend vencida = %v (%q)", err, res.Message)
	}
	var status string
	if err := db.QueryRow(`SELECT status FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, reservation.ID).Scan(&status); err != nil {
		t.Fatalf("leer estado: %v", err)
	}
	if status != "activa" {
		t.Fatalf("estado tras extend = %q, queria activa", status)
	}
	if n := auditCount(t, db, companyID, "RESERVATION_EXTENDED"); n != 1 {
		t.Fatalf("auditoria RESERVATION_EXTENDED = %d, queria 1", n)
	}

	res, err = svc.ReleaseReservation(companyID, reservation.ID, "qa")
	if err != nil || !res.OK {
		t.Fatalf("release = %v (%q)", err, res.Message)
	}
	if _, err := svc.ReleaseReservation(companyID, reservation.ID, "qa"); err == nil {
		t.Fatal(" segunda liberacion debe fallar")
	}
}

// INV-04: liberar una reserva nunca toca el stock.
func TestReleaseReservationNeverTouchesStock(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-release"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-REL-1"
	seedReferenceFull(t, db, companyID, reference, 5, 0)

	reservation, _, err := svc.CreateReservation(companyID, CreateReservationRequest{
		Reference: reference, Quantity: 2, AssignedTo: "tec", Purpose: "liberar",
	}, "qa")
	if err != nil {
		t.Fatalf("crear reserva: %v", err)
	}
	if got := stockFor(t, db, companyID, reference); got != 5 {
		t.Fatalf("stock tras crear reserva = %d, queria 5 (la reserva no mueve stock)", got)
	}

	if _, err := svc.ReleaseReservation(companyID, reservation.ID, "qa"); err != nil {
		t.Fatalf("liberar: %v", err)
	}
	if got := stockFor(t, db, companyID, reference); got != 5 {
		t.Fatalf("stock tras liberar = %d, queria 5 (liberar nunca toca stock)", got)
	}
}

// INV-05: bajar del minimo crea el item de reposicion; volver arriba lo archiva.
func TestReplenishmentAutoCreatedAndResolved(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-repl"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-REPL-1"
	seedReferenceFull(t, db, companyID, reference, 5, 5)

	if _, err := svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 1, Reason: "instalacion",
	}, "qa"); err != nil {
		t.Fatalf("salida: %v", err)
	}

	var status string
	err := db.QueryRow(`SELECT status FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&status)
	if err != nil || status != "pendiente" {
		t.Fatalf("item de reposicion = %q err %v, queria pendiente", status, err)
	}
	if n := auditCount(t, db, companyID, "REPLENISHMENT_AUTO_CREATED"); n != 1 {
		t.Fatalf("auditoria REPLENISHMENT_AUTO_CREATED = %d, queria 1", n)
	}

	if _, err := svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "entrada", Reference: reference, Quantity: 2, Reason: "compra",
	}, "qa"); err != nil {
		t.Fatalf("entrada: %v", err)
	}
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&count); err != nil {
		t.Fatalf("contar items: %v", err)
	}
	if count != 0 {
		t.Fatalf("item activo tras volver sobre el minimo = %d, queria 0 (archivado)", count)
	}
}

// INV-02 en consume: el consumo valida contra el disponible (otras reservas
// pueden haber comido el stock).
func TestConsumeReservationValidatesAvailableStock(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-consume"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-CONS-1"
	seedReferenceFull(t, db, companyID, reference, 2, 0)

	reservation, _, err := svc.CreateReservation(companyID, CreateReservationRequest{
		Reference: reference, Quantity: 2, AssignedTo: "tec", Purpose: "consumo",
	}, "qa")
	if err != nil {
		t.Fatalf("crear reserva: %v", err)
	}
	// Simula deriva legacy: el stock real bajo despues de creada la reserva.
	if _, err := db.Exec(`UPDATE inventory_references SET current_stock = 1 WHERE company_id = $1 AND reference = $2`, companyID, reference); err != nil {
		t.Fatalf("forzar deriva de stock: %v", err)
	}

	res, err := svc.ConsumeReservation(companyID, reservation.ID, "qa")
	if !errors.Is(err, errInsufficientStock) || !strings.Contains(res.Message, "disponible -1 (reservado 2), requerido 2") {
		t.Fatalf("consume sin stock = %v (%q)", err, res.Message)
	}
}
