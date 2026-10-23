package remissions

import (
	"strings"
	"testing"
)

// Tests de integracion de las reglas duras del requerimiento de despacho.
// La clave determinista: cada rechazo ocurre ANTES de Begin(), o sea que una
// violacion no consume consecutivo ni deja fila a medias; y el unico Create
// legal queda con contact_name persistido (round-trip por Get).

func TestCreateEnforcesDispatchRulesIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "rules")

	// 1) Más de 4 equipos: rechazado sin escribir.
	tooMany := sampleRequest()
	for i := 0; i < 3; i++ {
		tooMany.Items = append(tooMany.Items, RemissionItem{Identifier: "EXTRA" + string(rune('A'+i))})
	}
	if _, err := s.Create(companyID, tooMany, "tester"); err == nil || !strings.Contains(err.Error(), "maximo 4") {
		t.Fatalf("5 items debe rechazarse con el limite de 4, got %v", err)
	}

	// 2) Contacto vacío: rechazado (el campo es obligatorio por requerimiento).
	noContact := sampleRequest()
	noContact.ContactName = "   "
	if _, err := s.Create(companyID, noContact, "tester"); err == nil || !strings.Contains(err.Error(), "contacto") {
		t.Fatalf("sin contacto debe rechazarse, got %v", err)
	}

	// 3) Sin equipos: rechazado.
	noItems := sampleRequest()
	noItems.Items = nil
	if _, err := s.Create(companyID, noItems, "tester"); err == nil || !strings.Contains(err.Error(), "al menos un equipo") {
		t.Fatalf("sin items debe rechazarse, got %v", err)
	}

	// 4) Anclados sin consentimiento: rechazado.
	anchored := sampleRequest()
	anchored.Items[0].AnchoredNote = "TV-99 en prestamo"
	if _, err := s.Create(companyID, anchored, "tester"); err == nil || !strings.Contains(err.Error(), "prestamos anclados") {
		t.Fatalf("anclados sin aceptar debe rechazarse, got %v", err)
	}

	// 5) Anclados CON consentimiento: legal. Queda el único registro válido y
	//    su contacto debe leerse de vuelta (round-trip de la columna nueva).
	ok := sampleRequest()
	ok.Items[0].AnchoredNote = "TV-99 en prestamo"
	ok.AnchoredAccepted = true
	created, err := s.Create(companyID, ok, "tester")
	if err != nil {
		t.Fatalf("anclados con consentimiento deben pasar: %v", err)
	}

	got, err := s.Get(companyID, created.ID)
	if err != nil {
		t.Fatalf("Get del remision creada: %v", err)
	}
	if got.ContactName != "Juan Contacto" {
		t.Fatalf("contact_name no persistido: %q", got.ContactName)
	}

	// 6) Ningún rechazo anterior dejó fila a medias ni consumió el contador.
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM remissions WHERE company_id = $1`, companyID).Scan(&count); err != nil {
		t.Fatalf("contar remisiones: %v", err)
	}
	if count != 1 {
		t.Fatalf("los rechazos no deben escribir filas: hay %d, esperaba 1", count)
	}
}

func TestUpdateEnforcesDispatchRulesIntegration(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "rulesupdate")

	base, err := s.Create(companyID, sampleRequest(), "tester")
	if err != nil {
		t.Fatalf("Create base: %v", err)
	}

	// Editar quitando todos los equipos: rechazado.
	emptyItems := sampleRequest()
	emptyItems.Items = nil
	if _, err := s.Update(companyID, base.ID, emptyItems); err == nil || !strings.Contains(err.Error(), "al menos un equipo") {
		t.Fatalf("Update sin items debe rechazarse, got %v", err)
	}

	// Editar vaciando el contacto: rechazado.
	noContact := sampleRequest()
	noContact.ContactName = ""
	if _, err := s.Update(companyID, base.ID, noContact); err == nil || !strings.Contains(err.Error(), "contacto") {
		t.Fatalf("Update sin contacto debe rechazarse, got %v", err)
	}

	// Editar agregando un equipo más (2→3, dentro del límite): legal y el
	// contacto actualizado queda persistido.
	more := sampleRequest()
	more.Items = append(more.Items, RemissionItem{Identifier: "PMP-02", Description: "Bomba 2"})
	more.ContactName = "Maria Ingeniera"
	updated, err := s.Update(companyID, base.ID, more)
	if err != nil {
		t.Fatalf("Update dentro de limites debe pasar: %v", err)
	}
	if len(updated.Items) != 3 || updated.ContactName != "Maria Ingeniera" {
		t.Fatalf("Update no reflejo el cambio: items=%d contacto=%q", len(updated.Items), updated.ContactName)
	}

	// La remisión original sigue intacta en estado (ningún UPDATE fallido la tocó).
	still, err := s.Get(companyID, base.ID)
	if err != nil {
		t.Fatalf("Get final: %v", err)
	}
	if still.ContactName != "Maria Ingeniera" {
		t.Fatalf("contacto final inesperado: %q", still.ContactName)
	}
}
