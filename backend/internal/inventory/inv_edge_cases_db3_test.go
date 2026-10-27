package inventory

import (
	"errors"
	"testing"
)

// INV-09: discrepancia en sesion en curso; aprobar ajusta el stock una sola vez.
func TestDiscrepancyApproveAdjustsStockOnce(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-disc"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })
	t.Cleanup(func() {
		if _, err := db.Exec(`DELETE FROM inventory_sessions WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup sesiones: %v", err)
		}
		if _, err := db.Exec(`DELETE FROM inventory_discrepancies WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup discrepancias: %v", err)
		}
	})

	reference := "QA-DISC-1"
	seedReferenceFull(t, db, companyID, reference, 10, 0)

	if _, err := svc.CreateSession(companyID, CreateSessionRequest{
		Name: "conteo qa", Scope: "bodega", Owner: "qa", StartDate: "2026-10-26",
	}, "qa"); err != nil {
		t.Fatalf("crear sesion: %v", err)
	}
	var sessionID string
	if err := db.QueryRow(`SELECT id FROM inventory_sessions WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`, companyID).Scan(&sessionID); err != nil {
		t.Fatalf("leer sesion: %v", err)
	}

	// Sesion planificada (no abierta): debe rechazar.
	res, err := svc.CreateDiscrepancy(companyID, sessionID, CreateDiscrepancyRequest{
		Reference: reference, CountedQty: 7, Reason: "faltante",
	}, "qa")
	if !errors.Is(err, errSessionNotFound) {
		t.Fatalf("discrepancia en sesion planificada = %v, queria errSessionNotFound", err)
	}

	if _, err := svc.OpenSession(companyID, sessionID, "qa"); err != nil {
		t.Fatalf("abrir sesion: %v", err)
	}
	res, err = svc.CreateDiscrepancy(companyID, sessionID, CreateDiscrepancyRequest{
		Reference: reference, CountedQty: 7, Reason: "faltante", RootCause: "merma",
	}, "qa")
	if err != nil || !res.OK {
		t.Fatalf("crear discrepancia: %v (%q)", err, res.Message)
	}
	if n := auditCount(t, db, companyID, "DISCREPANCY_CREATED"); n != 1 {
		t.Fatalf("auditoria DISCREPANCY_CREATED = %d, queria 1", n)
	}

	var discID string
	if err := db.QueryRow(`SELECT id FROM inventory_discrepancies WHERE company_id = $1`, companyID).Scan(&discID); err != nil {
		t.Fatalf("leer discrepancia: %v", err)
	}

	res, err = svc.ApproveDiscrepancy(companyID, discID, "qa")
	if err != nil || !res.OK {
		t.Fatalf("aprobar: %v (%q)", err, res.Message)
	}
	if got := stockFor(t, db, companyID, reference); got != 7 {
		t.Fatalf("stock tras aprobar = %d, queria 7 (10 - 3)", got)
	}
	var ajustes int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_movements WHERE company_id = $1 AND reference = $2 AND type = 'ajuste'`, companyID, reference).Scan(&ajustes); err != nil {
		t.Fatalf("contar ajustes: %v", err)
	}
	if ajustes != 1 {
		t.Fatalf("movimientos ajuste = %d, queria 1", ajustes)
	}

	res, err = svc.ApproveDiscrepancy(companyID, discID, "qa")
	if !errors.Is(err, errDiscrepancyAlreadyApproved) {
		t.Fatalf("re-aprobacion = %v, queria errDiscrepancyAlreadyApproved", err)
	}
	if got := stockFor(t, db, companyID, reference); got != 7 {
		t.Fatalf("stock tras doble aprobacion = %d, queria 7 (idempotente)", got)
	}
	if n := auditCount(t, db, companyID, "DISCREPANCY_APPROVED"); n != 1 {
		t.Fatalf("auditoria DISCREPANCY_APPROVED = %d, queria 1", n)
	}
}

// INV-10: el tercer intento escala y el cuarto es 409; la decision cambia de
// proveedor (reinicia) o marca obsoleto.
func TestReplenishmentEscalatedRequiresDecision(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-esc"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-ESC-1"
	seedReferenceFull(t, db, companyID, reference, 0, 5)
	if _, err := db.Exec(`
		INSERT INTO inventory_replenishment_items (company_id, reference, description, supplier, min_stock, current_stock, attempts, status)
		VALUES ($1, $2, 'prueba', 'proveedor viejo', 5, 0, 2, 'en-gestion')
	`, companyID, reference); err != nil {
		t.Fatalf("sembrar item: %v", err)
	}

	attempt := RegisterReplenishmentAttemptRequest{Reference: reference, ResultNote: "sin respuesta"}
	if _, err := svc.RegisterReplenishmentAttempt(companyID, attempt, "qa"); err != nil {
		t.Fatalf("tercer intento: %v", err)
	}
	var status string
	if err := db.QueryRow(`SELECT status FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&status); err != nil {
		t.Fatalf("leer status: %v", err)
	}
	if status != "escalar" {
		t.Fatalf("status tras 3 intentos = %q, queria escalar", status)
	}

	res, err := svc.RegisterReplenishmentAttempt(companyID, attempt, "qa")
	if !errors.Is(err, errReplenishmentEscalated) || res.Message != "item escalado: registre una decision (cambiar proveedor o marcar obsoleto)" {
		t.Fatalf("cuarto intento = %v (%q)", err, res.Message)
	}

	res, err = svc.RegisterReplenishmentDecision(companyID, reference, "qa", ReplenishmentDecisionRequest{
		Action: "cambiar_proveedor", Reason: "el proveedor viejo no cotiza",
	})
	if err == nil || res.OK {
		t.Fatalf("decision sin proveedor debe fallar: %v (%q)", err, res.Message)
	}

	res, err = svc.RegisterReplenishmentDecision(companyID, reference, "qa", ReplenishmentDecisionRequest{
		Action: "cambiar_proveedor", Reason: "el proveedor viejo no cotiza", Provider: "proveedor nuevo",
	})
	if err != nil || !res.OK {
		t.Fatalf("decision cambiar_proveedor: %v (%q)", err, res.Message)
	}
	var attempts int
	var supplier string
	if err := db.QueryRow(`SELECT attempts, supplier FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&attempts, &supplier); err != nil {
		t.Fatalf("leer item: %v", err)
	}
	if attempts != 0 || supplier != "proveedor nuevo" {
		t.Fatalf("attempts=%d supplier=%q, queria 0/'proveedor nuevo'", attempts, supplier)
	}
	if n := auditCount(t, db, companyID, "REPLENISHMENT_DECISION"); n != 1 {
		t.Fatalf("auditoria REPLENISHMENT_DECISION = %d, queria 1", n)
	}

	res, err = svc.RegisterReplenishmentDecision(companyID, reference, "qa", ReplenishmentDecisionRequest{
		Action: "marcar_obsoleto", Reason: "ya no se usa en ningun equipo",
	})
	if err != nil || !res.OK {
		t.Fatalf("decision marcar_obsoleto: %v (%q)", err, res.Message)
	}
	if err := db.QueryRow(`SELECT status FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&status); err != nil {
		t.Fatalf("leer status: %v", err)
	}
	if status != "obsoleto" {
		t.Fatalf("status final = %q, queria obsoleto", status)
	}

}
