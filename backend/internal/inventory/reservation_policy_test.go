package inventory

import (
	"database/sql"
	"testing"
)

// INV-03: bajar la politica de reserva debe envejecer las reservas activas
// existentes (expires_at se recorta a reserved_at + dias) y marcar vencidas
// las que queden en el pasado, sin esperar al GET full state. Con 0 dias una
// reserva recien creada queda vencida de inmediato.
func TestLoweringReservePolicyExpiresActiveReservations(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-reservas-politica"
	t.Cleanup(func() {
		cleanupReservationTest(t, db, companyID)
		if _, err := db.Exec(`DELETE FROM inventory_config WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup de config: %v", err)
		}
	})

	reference := "RES-QA-POLITICA"
	clientID := "res-qa-politica-1"
	seedInventoryForReceive(t, db, companyID, reference, 5)

	_, result, err := svc.CreateReservation(companyID, CreateReservationRequest{
		ID:         clientID,
		Reference:  reference,
		Quantity:   2,
		AssignedTo: "tecnico-qa",
		Purpose:    "politica bajada",
	}, "qa")
	if err != nil {
		t.Fatalf("crear reserva: %v", err)
	}
	if !result.OK {
		t.Fatalf("crear reserva no ok: %s", result.Message)
	}

	cfg, err := svc.SetMaxReserveDays(companyID, 0, "qa")
	if err != nil {
		t.Fatalf("bajar politica a 0 dias: %v", err)
	}
	if cfg.MaxReserveDays != 0 {
		t.Fatalf("politica = %d, queria 0", cfg.MaxReserveDays)
	}

	assertReservationStatus(t, db, companyID, clientID, "vencida")
}

// Subir la politica no alarga reservas existentes: su expires_at se queda igual.
func TestRaisingReservePolicyKeepsExistingExpirations(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-reservas-politica-subir"
	t.Cleanup(func() {
		cleanupReservationTest(t, db, companyID)
		if _, err := db.Exec(`DELETE FROM inventory_config WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup de config: %v", err)
		}
	})

	reference := "RES-QA-POLITICA-SUBIR"
	clientID := "res-qa-politica-subir-1"
	seedInventoryForReceive(t, db, companyID, reference, 5)

	if _, result, err := svc.CreateReservation(companyID, CreateReservationRequest{
		ID:         clientID,
		Reference:  reference,
		Quantity:   1,
		AssignedTo: "tecnico-qa",
		Purpose:    "politica subida",
	}, "qa"); err != nil || !result.OK {
		t.Fatalf("crear reserva: %v (%s)", err, result.Message)
	}

	var before string
	if err := db.QueryRow(`SELECT expires_at FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, clientID).Scan(&before); err != nil {
		t.Fatalf("leer expires_at inicial: %v", err)
	}

	if _, err := svc.SetMaxReserveDays(companyID, 30, "qa"); err != nil {
		t.Fatalf("subir politica: %v", err)
	}

	var after string
	if err := db.QueryRow(`SELECT expires_at FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, clientID).Scan(&after); err != nil {
		t.Fatalf("leer expires_at tras subir politica: %v", err)
	}
	if before != after {
		t.Fatalf("subir la politica no debe alargar reservas existentes: %s -> %s", before, after)
	}
}

func assertReservationStatus(t *testing.T, db *sql.DB, companyID, id, want string) {
	t.Helper()
	var status string
	if err := db.QueryRow(`SELECT status FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, id).Scan(&status); err != nil {
		t.Fatalf("leer estado de la reserva: %v", err)
	}
	if status != want {
		t.Fatalf("estado de la reserva = %q, queria %q", status, want)
	}
}
