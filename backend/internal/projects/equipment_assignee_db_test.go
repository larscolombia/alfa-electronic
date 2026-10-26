package projects

import (
	"testing"
)

// Regresión del hallazgo t03: el wizard de recepción asigna "Técnico
// responsable" por ítem, pero el proyecto de reparación generado nacía con el
// responsable por defecto ("Ana Torres") porque el cliente envía ese default
// en properties.assignee. En la CREACIÓN el técnico del ítem (fuente de verdad
// de la recepción) debe imponerse; en las ACTUALIZACIONES posteriores (p. ej.
// reasignación manual en la ficha del tablero) el assignee enviado se respeta.
func TestNewEquipmentProjectInheritsItemTechnician(t *testing.T) {
	db := openSLATestDB(t)
	s := NewService(db)

	const companyID = "qa-proj-asignee"
	t.Cleanup(func() { cleanupGateRows(t, db, companyID) })

	const recordID = "rec-asignee-1"
	if _, err := db.Exec(`
		INSERT INTO crm_equipment_records (company_id, id, prospect_id, items_json, created_at, updated_at)
		VALUES ($1, $2, '0', $3::jsonb, NOW(), NOW())
		ON CONFLICT (company_id, id) DO UPDATE SET items_json = EXCLUDED.items_json
	`, companyID, recordID, `[
		{"id": "item-1", "serie": "SER-001", "assignedTo": "Tecnico PW", "assignedToId": "emp-1"},
		{"id": "item-2", "serie": "SER-002", "assignedTo": ""}
	]`); err != nil {
		t.Fatalf("sembrar registro de equipos: %v", err)
	}

	// Proyecto nuevo vinculado al ítem CON técnico: el default quemado se corrige.
	created, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:     "proj-asignee-1",
		Status: "recibido",
		Properties: map[string]any{
			"equipmentRecordId": recordID,
			"equipmentItemId":   "item-1",
			"equipmentSerie":    "SER-001",
			"assignee":          "Ana Torres",
		},
	})
	if err != nil {
		t.Fatalf("UpsertProject nuevo: %v", err)
	}
	if got := stringValue(created.Properties["assignee"]); got != "Tecnico PW" {
		t.Errorf("assignee del proyecto nuevo = %q, esperaba %q (técnico del ítem)", got, "Tecnico PW")
	}

	// Proyecto nuevo vinculado al ítem SIN técnico: se conserva el assignee enviado.
	neutral, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:     "proj-asignee-2",
		Status: "recibido",
		Properties: map[string]any{
			"equipmentRecordId": recordID,
			"equipmentItemId":   "item-2",
			"assignee":          "Carlos Mendez",
		},
	})
	if err != nil {
		t.Fatalf("UpsertProject ítem sin técnico: %v", err)
	}
	if got := stringValue(neutral.Properties["assignee"]); got != "Carlos Mendez" {
		t.Errorf("assignee = %q, esperaba %q (el ítem no tiene técnico; se respeta el enviado)", got, "Carlos Mendez")
	}

	// Actualización sobre un proyecto existente: la reasignación manual NO se pisa.
	reassigned, err := s.UpsertProject(companyID, UpsertProjectRequest{
		ID:     "proj-asignee-1",
		Status: "recibido",
		Properties: map[string]any{
			"equipmentRecordId": recordID,
			"equipmentItemId":   "item-1",
			"assignee":          "Otra Persona",
		},
	})
	if err != nil {
		t.Fatalf("UpsertProject reasignación: %v", err)
	}
	if got := stringValue(reassigned.Properties["assignee"]); got != "Otra Persona" {
		t.Errorf("assignee tras reasignación manual = %q, esperaba %q (no se toca en updates)", got, "Otra Persona")
	}
}

func stringValue(value any) string {
	if s, ok := value.(string); ok {
		return s
	}
	return ""
}
