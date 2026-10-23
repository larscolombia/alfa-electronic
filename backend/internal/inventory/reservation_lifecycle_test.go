package inventory

import (
	"database/sql"
	"errors"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Nota: openInventoryTestDB, seedInventoryForReceive y stockFor se definen en
// purchase_receive_test.go (mismo paquete); se reutilizan aquí sin duplicar.

func cleanupReservationTest(t *testing.T, db *sql.DB, companyID string) {
	t.Helper()
	for _, table := range []string{"inventory_reservations", "inventory_movements"} {
		if _, err := db.Exec(`DELETE FROM `+table+` WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup de %s: %v", table, err)
		}
	}
}

// Caso central del requerimiento: una reserva creada desde el proyecto (con ID de cliente)
// y consumida debe dejar stock realmente disminuido Y un movimiento de salida en BD
// vinculado a la reserva. Antes de esta corrección el frontend generaba IDs huérfanos,
// el consumo fallaba silenciosamente en servidor y NINGUNO de estos dos efectos ocurría.
func TestReservationConsumeRegistersStockAndMovement(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-reservas-1"
	t.Cleanup(func() { cleanupReservationTest(t, db, companyID) })

	reference := "RES-QA-TORX"
	clientID := "res-qa-lifecycle-1"
	seedInventoryForReceive(t, db, companyID, reference, 5)

	reservation, result, err := svc.CreateReservation(companyID, CreateReservationRequest{
		ID:         clientID,
		Reference:  reference,
		Quantity:   2,
		AssignedTo: "tecnico-qa",
		Purpose:    "prueba de ciclo completo",
	}, "qa")
	if err != nil {
		t.Fatalf("crear reserva: %v", err)
	}
	if !result.OK {
		t.Fatalf("crear reserva no ok: %s", result.Message)
	}
	if reservation.ID != clientID {
		t.Fatalf("el servidor debe respetar el ID del cliente: got %q, queria %q", reservation.ID, clientID)
	}

	consumed, err := svc.ConsumeReservation(companyID, clientID, "qa")
	if err != nil {
		t.Fatalf("consumir reserva: %v (%s)", err, consumed.Message)
	}
	if !consumed.OK {
		t.Fatalf("consuming no ok: %s", consumed.Message)
	}

	if got := stockFor(t, db, companyID, reference); got != 3 {
		t.Fatalf("stock tras consumo = %d, queria 3 (5 - 2)", got)
	}

	var movementCount int
	err = db.QueryRow(`SELECT COUNT(*) FROM inventory_movements WHERE company_id = $1 AND evidence_ref = $2 AND type = 'salida'`,
		companyID, clientID).Scan(&movementCount)
	if err != nil {
		t.Fatalf("leer movimientos: %v", err)
	}
	if movementCount != 1 {
		t.Fatalf("movimientos de salida vinculados a la reserva = %d, queria 1", movementCount)
	}

	var status string
	err = db.QueryRow(`SELECT status FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, clientID).Scan(&status)
	if err != nil {
		t.Fatalf("leer estado de la reserva: %v", err)
	}
	if status != "liberada" {
		t.Fatalf("estado de la reserva tras consumo = %q, queria 'liberada'", status)
	}
}

// Idempotencia: un reintento con el mismo ID de cliente NO debe duplicar la reserva;
// devuelve la existente. Esto protege contra doble clic / reenvio en el frontend.
func TestCreateReservationWithSameClientIDIsIdempotent(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-reservas-2"
	t.Cleanup(func() { cleanupReservationTest(t, db, companyID) })

	reference := "RES-QA-IDEM"
	clientID := "res-qa-idem-1"
	seedInventoryForReceive(t, db, companyID, reference, 4)

	req := CreateReservationRequest{ID: clientID, Reference: reference, Quantity: 2, AssignedTo: "tecnico-qa", Purpose: "idempotencia"}
	first, resFirst, err := svc.CreateReservation(companyID, req, "qa")
	if err != nil {
		t.Fatalf("primera creacion falló: %v", err)
	}
	if !resFirst.OK {
		t.Fatalf("primera creacion no ok: %s", resFirst.Message)
	}

	second, resSecond, err := svc.CreateReservation(companyID, req, "qa")
	if err != nil {
		t.Fatalf("reintento falló: %v", err)
	}
	if !resSecond.OK || second.ID != first.ID {
		t.Fatalf("el reintento debe devolver la misma reserva (id %q); got id=%q ok=%v msg=%s", first.ID, second.ID, resSecond.OK, resSecond.Message)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, clientID).Scan(&count); err != nil {
		t.Fatalf("leer conteo: %v", err)
	}
	if count != 1 {
		t.Fatalf("reservas con la misma identidad = %d, queria 1 (no duplicar)", count)
	}
}

// No se puede apartar stock que no existe en bodega; el flujo para material faltante es la compra.
func TestCreateReservationRejectsInsufficientStock(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-reservas-3"
	t.Cleanup(func() { cleanupReservationTest(t, db, companyID) })

	reference := "RES-QA-SINSTOCK"
	seedInventoryForReceive(t, db, companyID, reference, 0)

	_, result, err := svc.CreateReservation(companyID, CreateReservationRequest{
		ID:         "res-qa-sin-stock",
		Reference:  reference,
		Quantity:   3,
		AssignedTo: "tecnico-qa",
		Purpose:    "sin stock",
	}, "qa")
	if !errors.Is(err, errInsufficientStock) {
		t.Fatalf("se esperaba errInsufficientStock, got %v", err)
	}
	if result.OK {
		t.Fatal("no debe reportar ok cuando no hay stock suficiente")
	}

	var count int
	if e := db.QueryRow(`SELECT COUNT(*) FROM inventory_reservations WHERE company_id = $1`, companyID).Scan(&count); e != nil {
		t.Fatalf("leer conteo: %v", e)
	}
	if count != 0 {
		t.Fatalf("no debe haberse creado ninguna reserva, got %d", count)
	}
}
