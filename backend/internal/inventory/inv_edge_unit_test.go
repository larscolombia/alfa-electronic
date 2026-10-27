package inventory

import (
	"strings"
	"testing"
	"time"
)

func TestIsTechnicianRole(t *testing.T) {
	for role, want := range map[string]bool{
		"técnico":   true,
		"Técnico":   true,
		" TECNICO ": false, // sin tilde no es el rol del seed/ACL
		"admin":     false,
		"ventas":    false,
		"":          false,
	} {
		if got := isTechnicianRole(role); got != want {
			t.Errorf("isTechnicianRole(%q) = %v, want %v", role, got, want)
		}
	}
}

func TestInsufficientStockMessageIncludesQuantities(t *testing.T) {
	msg := insufficientStockMessage(3, 2, 4)
	if msg != "No hay stock suficiente: disponible 3 (reservado 2), requerido 4" {
		t.Errorf("mensaje inestable: %q", msg)
	}
}

func TestValidateUsedInstall(t *testing.T) {
	now := time.Date(2026, 10, 26, 12, 0, 0, 0, time.UTC)
	fresh := &UsedTestRecord{Result: usedTestApproved, TestedAt: now.AddDate(0, 0, -10).Format(time.RFC3339)}
	old := &UsedTestRecord{Result: usedTestApproved, TestedAt: now.AddDate(0, 0, -100).Format(time.RFC3339)}

	if err := validateUsedInstall(conditionNew, nil, now); err != nil {
		t.Errorf("componente nuevo no debe exigir prueba: %v", err)
	}
	if err := validateUsedInstall(conditionUsed, nil, now); err != errInvalidCondition {
		t.Errorf("usado sin prueba = %v, queria errInvalidCondition", err)
	}
	if err := validateUsedInstall(conditionUsed, &UsedTestRecord{Result: usedTestRejected, TestedAt: fresh.TestedAt}, now); err != errInvalidCondition {
		t.Errorf("usado con prueba rechazada = %v, queria errInvalidCondition", err)
	}
	if err := validateUsedInstall(conditionUsed, fresh, now); err != nil {
		t.Errorf("usado con prueba aprobada reciente = %v, queria nil", err)
	}
	if err := validateUsedInstall(conditionUsed, old, now); err != errInvalidCondition {
		t.Errorf("usado con prueba de 100 dias = %v, queria errInvalidCondition", err)
	}
}

func TestScoreDuplicateCandidatesDetectsInternalCodeAndSupplier(t *testing.T) {
	refs := []StockReference{
		{Reference: "LM324N", InternalCode: "INV-ANA-00001", Designation: "Amplificador operacional", PreferredSupplierName: "DigiKey"},
		{Reference: "BC547B", InternalCode: "INV-TRA-00002", Designation: "Transistor NPN", PreferredSupplierName: "Mouser"},
	}

	byInternal := scoreDuplicateCandidates(refs, "ZZ-999", "inv-ana-00001", "Otro coso", "Farnell")
	if len(byInternal) != 1 || byInternal[0].Reason != "Codigo interno identico" {
		t.Fatalf("por codigo interno = %+v", byInternal)
	}

	bySupplier := scoreDuplicateCandidates(refs, "ZZ-999", "ZZ-INT", "Otro coso", "digIKEY")
	if len(bySupplier) != 1 || bySupplier[0].Reason != "Proveedor identico" {
		t.Fatalf("por proveedor (case-insensitive) = %+v", bySupplier)
	}

	none := scoreDuplicateCandidates(refs, "ZZ-999", "ZZ-INT", "Otro coso", "Farnell")
	if len(none) != 0 {
		t.Fatalf("sin duplicado = %+v", none)
	}
}

func TestScoreDuplicateCandidatesKeepsSimilarity(t *testing.T) {
	refs := []StockReference{{Reference: "LM324N", Designation: "Amplificador"}}
	got := scoreDuplicateCandidates(refs, "LM324N", "", "", "")
	if len(got) != 1 || got[0].Similarity < 0.9 {
		t.Fatalf("coincidencia exacta = %+v", got)
	}
}

func TestDuplicateRejectMessageIsStable(t *testing.T) {
	if !strings.Contains(duplicateRejectMessage, "codigo interno") || !strings.Contains(duplicateRejectMessage, "proveedor") {
		t.Errorf("el mensaje de duplicado debe mencionar revision de referencia/codigo interno/proveedor: %q", duplicateRejectMessage)
	}
}
