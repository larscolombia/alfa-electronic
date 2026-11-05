package equipment

import "testing"

func TestAssignTechnicianMovesReceivedItemToDiagnosis(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)
	recordID := "qa-assignment-diagnosis"
	if _, err := db.Exec(`DELETE FROM crm_equipment_records WHERE company_id = $1 AND id = $2`, testEquipmentCompanyID, recordID); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = db.Exec(`DELETE FROM crm_equipment_records WHERE company_id = $1 AND id = $2`, testEquipmentCompanyID, recordID) })

	record := Record{ID: recordID, ProspectID: "qa", ProspectName: "QA", Items: []Item{{
		ID: "item-diagnosis", Marca: "Alfa", Tipo: "Prueba", Serie: "QA-1", RepairStatus: "recibido",
	}}}
	if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
		t.Fatalf("preparar recepción: %v", err)
	}

	var technicianID string
	if err := db.QueryRow(`SELECT id FROM hr_employees WHERE company_id = $1 AND status = 'Activo' AND soft_delete = false LIMIT 1`, testEquipmentCompanyID).Scan(&technicianID); err != nil {
		t.Fatalf("obtener técnico activo: %v", err)
	}
	item, err := service.AssignItemTechnician(testEquipmentCompanyID, recordID, "item-diagnosis", AssignTechnicianRequest{AssignedToID: technicianID})
	if err != nil {
		t.Fatalf("asignar técnico: %v", err)
	}
	if item.RepairStatus != "diagnostico" || item.RepairStatusUpdatedAt == "" {
		t.Fatalf("estado tras afectación = %#v; se esperaba diagnóstico con fecha", item)
	}
}
