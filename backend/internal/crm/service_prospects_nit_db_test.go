package crm

import (
	"errors"
	"fmt"
	"strings"
	"testing"
	"time"

	"pika.software.net.co/backend/internal/platform/database"
)

// Unificación de cuentas — métrica "Duplicados activos por company_id + NIT: 0
// para datos nuevos". El índice de la migración no basta: la unicidad la
// impone el servicio al crear/editar (crm-prospects.component + reception).
func TestCreateProspectRejectsDuplicateActiveNIT(t *testing.T) {
	db := openClientContactsTestDB(t)
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	service := NewService(db)

	companyID := fmt.Sprintf("qa-crm-nitdup-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM crm_prospects WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM crm_accounts WHERE company_id = $1`, companyID)
	})

	first := UpsertProspectRequest{Name: "Cuenta Uno", Email: "uno@example.com", Company: "Empresa Uno", Nit: "900123456-7"}
	if _, err := service.CreateProspect(companyID, first); err != nil {
		t.Fatalf("crear la primera cuenta: %v", err)
	}

	second := UpsertProspectRequest{Name: "Cuenta Dos", Email: "dos@example.com", Company: "Empresa Dos", Nit: "900123456-7"}
	if _, err := service.CreateProspect(companyID, second); err == nil {
		t.Fatal("se creó una segunda cuenta ACTIVA con el mismo NIT: la guarda no existe")
	} else {
		var verr *validationError
		if !errors.As(err, &verr) {
			t.Fatalf("error = %T (%v), esperaba validationError", err, err)
		}
		if !strings.Contains(err.Error(), "NIT") {
			t.Errorf("mensaje = %q, debe mencionar el NIT", err.Error())
		}
	}

	// El bloqueo es por NIT normalizado: espacios y mayúsculas no evaden la guarda.
	third := UpsertProspectRequest{Name: "Cuenta Tres", Email: "tres@example.com", Company: "Empresa Tres", Nit: "  900123456-7 "}
	if _, err := service.CreateProspect(companyID, third); err == nil {
		t.Fatal("un NIT duplicado con espacios/minúsculas evadió la guarda")
	}

	// Un NIT distinto sí puede crear cuenta.
	other := UpsertProspectRequest{Name: "Cuenta Cuatro", Email: "cuatro@example.com", Company: "Empresa Cuatro", Nit: "800999000-1"}
	if _, err := service.CreateProspect(companyID, other); err != nil {
		t.Fatalf("un NIT distinto debe poder crear cuenta: %v", err)
	}

	// Editar la propia cuenta conservando su NIT no se bloquea (exclusión de sí misma).
	updated, err := service.ListProspects(companyID, ProspectListQuery{})
	if err != nil || len(updated) == 0 {
		t.Fatalf("listar para editar: %v (%d)", err, len(updated))
	}
	var firstID string
	for _, p := range updated {
		if p.Nit == "900123456-7" {
			firstID = p.ID
			break
		}
	}
	if firstID == "" {
		t.Fatal("no se encontró la cuenta original para el caso de edición")
	}
	if _, err := service.UpdateProspect(companyID, firstID, first); err != nil {
		t.Fatalf("editar la cuenta conservando su propio NIT no debe bloquearse: %v", err)
	}
}
