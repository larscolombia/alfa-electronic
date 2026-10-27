package inventory

import (
	"errors"
	"testing"
)

// INV-06: mismo proveedor bloquea la creacion; forceCreate con motivo crea
// igual y deja auditoria.
func TestDuplicateBySupplierBlocksAndForceCreates(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-dup"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	base := CreateReferenceRequest{
		Reference: "QA-DUP-A", Designation: "Rele industrial",
		PreferredSupplierName: "ACME", MinStock: 0,
	}
	if _, result, err := svc.CreateReference(companyID, base, "qa"); err != nil || !result.OK {
		t.Fatalf("crear base: %v (%q)", err, result.Message)
	}

	dup := CreateReferenceRequest{
		Reference: "QA-DUP-B", Designation: "Rele de control",
		PreferredSupplierName: "acme", MinStock: 0,
	}
	_, result, err := svc.CreateReference(companyID, dup, "qa")
	if !errors.Is(err, errDuplicateReference) {
		t.Fatalf("duplicado por proveedor = %v, queria errDuplicateReference", err)
	}
	if result.Message != duplicateRejectMessage {
		t.Errorf("mensaje = %q", result.Message)
	}

	forced := dup
	forced.ForceCreate = true
	_, result, err = svc.CreateReference(companyID, forced, "qa")
	if err == nil || result.OK {
		t.Fatalf("force sin motivo debe fallar: %v (%q)", err, result.Message)
	}

	forced.ForceReason = "es una variante electrica distinta"
	created, result, err := svc.CreateReference(companyID, forced, "qa")
	if err != nil || !result.OK {
		t.Fatalf("force con motivo: %v (%q)", err, result.Message)
	}
	if created.Reference != "QA-DUP-B" {
		t.Fatalf("referencia creada = %q", created.Reference)
	}
	if n := auditCount(t, db, companyID, "REFERENCE_FORCE_CREATED"); n != 1 {
		t.Fatalf("auditoria REFERENCE_FORCE_CREATED = %d, queria 1", n)
	}
}

// INV-07: entrada usada exige nota; salida/consumo exige prueba aprobada
// reciente; el endpoint used-test registra y habilita la salida.
func TestUsedConditionFlow(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-used"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })

	reference := "QA-USADO-1"
	seedReferenceFull(t, db, companyID, reference, 0, 0)

	res, err := svc.RegisterStockEntry(companyID, RegisterStockEntryRequest{
		Reference: reference, Quantity: 2, Condition: "usado",
	}, "qa")
	if !errors.Is(err, errInvalidCondition) {
		t.Fatalf("entrada usada sin nota = %v, queria errInvalidCondition", err)
	}

	res, err = svc.RegisterStockEntry(companyID, RegisterStockEntryRequest{
		Reference: reference, Quantity: 2, Condition: "usado", UsedTestNote: "proveniente de retiro QA, probado en banco",
	}, "qa")
	if err != nil || !res.OK {
		t.Fatalf("entrada usada con nota: %v (%q)", err, res.Message)
	}
	var condition string
	if err := db.QueryRow(`SELECT condition FROM inventory_references WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&condition); err != nil {
		t.Fatalf("leer condition: %v", err)
	}
	if condition != "usado" {
		t.Fatalf("condition = %q, queria usado", condition)
	}
	if n := auditCount(t, db, companyID, "STOCK_ENTRY_USED"); n != 1 {
		t.Fatalf("auditoria STOCK_ENTRY_USED = %d, queria 1", n)
	}

	res, err = svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 1, Reason: "instalacion",
	}, "qa")
	if !errors.Is(err, errInvalidCondition) || res.Message != usedTestRequiredMessage {
		t.Fatalf("salida sin prueba = %v (%q)", err, res.Message)
	}

	if _, err := svc.RecordUsedTest(companyID, reference, "qa", RecordUsedTestRequest{Result: "rechazada", Note: "falla en banco"}); err != nil {
		t.Fatalf("registrar prueba rechazada: %v", err)
	}
	res, err = svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 1, Reason: "instalacion",
	}, "qa")
	if !errors.Is(err, errInvalidCondition) {
		t.Fatalf("salida con prueba rechazada = %v, queria errInvalidCondition", err)
	}

	if _, err := svc.RecordUsedTest(companyID, reference, "qa", RecordUsedTestRequest{Result: "aprobada", Note: "ok tras recalibrar"}); err != nil {
		t.Fatalf("registrar prueba aprobada: %v", err)
	}
	if n := auditCount(t, db, companyID, "USED_TEST_RECORDED"); n != 2 {
		t.Fatalf("auditoria USED_TEST_RECORDED = %d, queria 2", n)
	}

	res, err = svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 1, Reason: "instalacion",
	}, "qa")
	if err != nil || !res.OK {
		t.Fatalf("salida con prueba aprobada: %v (%q)", err, res.Message)
	}

	// Prueba vieja (>90 dias): vuelve a bloquear.
	if _, err := db.Exec(`UPDATE inventory_references SET last_used_test = jsonb_build_object('testedBy','qa','testedAt', NOW() - INTERVAL '100 days','result','aprobada','note','ok') WHERE company_id = $1 AND reference = $2`, companyID, reference); err != nil {
		t.Fatalf("envejecer prueba: %v", err)
	}
	res, err = svc.SubmitMovement(companyID, SubmitMovementRequest{
		Type: "salida", Reference: reference, Quantity: 1, Reason: "instalacion",
	}, "qa")
	if !errors.Is(err, errInvalidCondition) {
		t.Fatalf("salida con prueba de 100 dias = %v, queria errInvalidCondition", err)
	}
}

// INV-08: la bolsa recibida no suma stock; al liberar solo el sobrante vuelve.
func TestTechnicianBagCustodyFlow(t *testing.T) {
	db := openInventoryTestDB(t)
	svc := NewService(db)

	const companyID = "qa-inv-bags"
	t.Cleanup(func() { cleanupInvEdge(t, db, companyID) })
	t.Cleanup(func() {
		if _, err := db.Exec(`DELETE FROM inventory_bag_traces WHERE company_id = $1`, companyID); err != nil {
			t.Fatalf("cleanup bolsas: %v", err)
		}
	})

	reference := "QA-BAG-1"
	seedReferenceFull(t, db, companyID, reference, 0, 0)

	res, err := svc.ReceiveTechnicianBag(companyID, ReceiveTechnicianBagRequest{
		BagCode: "BOLSA-QA-1", Reference: reference, Quantity: 5,
	}, "qa")
	if err == nil || res.OK {
		t.Fatalf("bolsa sin assignedTo debe fallar: %v (%q)", err, res.Message)
	}

	res, err = svc.ReceiveTechnicianBag(companyID, ReceiveTechnicianBagRequest{
		BagCode: "BOLSA-QA-1", Reference: reference, Quantity: 5, AssignedTo: "tecnico@alfa.com",
	}, "qa")
	if err != nil || !res.OK {
		t.Fatalf("recibir bolsa: %v (%q)", err, res.Message)
	}
	if got := stockFor(t, db, companyID, reference); got != 0 {
		t.Fatalf("stock tras recibir bolsa = %d, queria 0 (custodia, no suma)", got)
	}
	if n := auditCount(t, db, companyID, "BAG_RECEIVED"); n != 1 {
		t.Fatalf("auditoria BAG_RECEIVED = %d, queria 1", n)
	}

	var bagID string
	if err := db.QueryRow(`SELECT id FROM inventory_bag_traces WHERE company_id = $1 AND bag_code = 'BOLSA-QA-1'`, companyID).Scan(&bagID); err != nil {
		t.Fatalf("leer bolsa: %v", err)
	}

	res, err = svc.ReleaseTechnicianBag(companyID, bagID, "qa", 6)
	if !errors.Is(err, errInvalidQuantity) {
		t.Fatalf("sobrante 6 de 5 = %v, queria errInvalidQuantity", err)
	}

	res, err = svc.ReleaseTechnicianBag(companyID, bagID, "qa", 2)
	if err != nil || !res.OK {
		t.Fatalf("liberar con sobrante 2: %v (%q)", err, res.Message)
	}
	if got := stockFor(t, db, companyID, reference); got != 2 {
		t.Fatalf("stock tras liberar = %d, queria 2 (solo el sobrante)", got)
	}
	var movements int
	if err := db.QueryRow(`SELECT COUNT(*) FROM inventory_movements WHERE company_id = $1 AND reference = $2 AND type = 'entrada' AND reason LIKE 'sobrante bolsa%'`, companyID, reference).Scan(&movements); err != nil {
		t.Fatalf("contar movimientos: %v", err)
	}
	if movements != 1 {
		t.Fatalf("movimientos de sobrante = %d, queria 1", movements)
	}
	if n := auditCount(t, db, companyID, "BAG_RELEASED"); n != 1 {
		t.Fatalf("auditoria BAG_RELEASED = %d, queria 1", n)
	}

	if _, err := svc.ReleaseTechnicianBag(companyID, bagID, "qa", 1); err == nil {
		t.Fatal("segunda liberacion debe fallar")
	}
	if got := stockFor(t, db, companyID, reference); got != 2 {
		t.Fatalf("stock tras doble liberacion = %d, queria 2 (sin doble efecto)", got)
	}
}
