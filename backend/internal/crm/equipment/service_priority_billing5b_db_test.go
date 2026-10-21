package equipment

import (
	"fmt"
	"testing"
	"time"

	"pika.software.net.co/backend/internal/platform/database"
)

// FASE 5b — priorityBilling persiste de verdad. Los ítems de equipo no tienen
// tabla propia: viven en crm_equipment_records.items_json (JSONB), así que el
// round-trip se verifica sobre UpsertRecord/GetRecord y sobre el Summary de
// ListItems (que alimenta el listado de equipos y el dashboard de facturación).
func TestPriorityBillingRoundTrip5b(t *testing.T) {
	db := openEquipmentTestDB(t)
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	service := NewService(db, nil)

	recordID := fmt.Sprintf("rec5b-%d", time.Now().UnixNano())
	defer cleanupEquipmentRecords(t, db, recordID)

	record := Record{
		ID:             recordID,
		ProspectID:     "0",
		CompanyName:    "Cliente 5b",
		ReceptionDay:   "20",
		ReceptionMonth: "10",
		ReceptionYear:  "2026",
		Items: []Item{
			{ID: "item-5b-1", Marca: "Kayser", Tipo: "HMI", Serie: "S5B1", ReceivedIdentifier: "S5B1", PriorityBilling: true},
			{ID: "item-5b-2", Marca: "Kayser", Tipo: "HMI", Serie: "S5B2", ReceivedIdentifier: "S5B2"},
		},
	}

	saved, err := service.UpsertRecord(testEquipmentCompanyID, record)
	if err != nil {
		t.Fatalf("UpsertRecord: %v", err)
	}
	if len(saved.Items) != 2 {
		t.Fatalf("Items = %d, esperaba 2", len(saved.Items))
	}
	byID := map[string]Item{}
	for _, item := range saved.Items {
		byID[item.ID] = item
	}
	if !byID["item-5b-1"].PriorityBilling {
		t.Errorf("item-5b-1 perdio priorityBilling al persistir: %+v", byID["item-5b-1"])
	}
	if byID["item-5b-2"].PriorityBilling {
		t.Errorf("item-5b-2 quedo marcado sin pedirlo")
	}

	// Relectura independiente (GetRecord).
	fetched, err := service.GetRecord(testEquipmentCompanyID, recordID, true)
	if err != nil {
		t.Fatalf("GetRecord: %v", err)
	}
	if len(fetched.Items) != 2 || !fetched.Items[0].PriorityBilling {
		t.Errorf("GetRecord no devolvio priorityBilling: %+v", fetched.Items)
	}

	// El listado de ítems (Summary) expone la marca para badges/dashboard.
	// El filtro por identificador es a nivel de registro: devuelve todos los
	// ítems del registro que coincide, así que se aserta sobre el ítem buscado.
	summaries, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{Identifier: "S5B1"})
	if err != nil {
		t.Fatalf("ListItems: %v", err)
	}
	if len(summaries) != 2 {
		t.Fatalf("ListItems devolvio %d summaries, esperaba 2", len(summaries))
	}
	foundMarked, foundUnmarked := false, false
	for _, summary := range summaries {
		switch summary.ItemID {
		case "item-5b-1":
			foundMarked = summary.PriorityBilling
		case "item-5b-2":
			foundUnmarked = summary.PriorityBilling
		}
	}
	if !foundMarked {
		t.Errorf("Summary de item-5b-1 con PriorityBilling = false, esperaba true")
	}
	if foundUnmarked {
		t.Errorf("Summary de item-5b-2 con PriorityBilling = true, esperaba false")
	}

	// Update: se apaga la marca y persiste.
	record.Items[0].PriorityBilling = false
	record.Items[0].RepairStatus = saved.Items[0].RepairStatus
	updated, err := service.UpsertRecord(testEquipmentCompanyID, record)
	if err != nil {
		t.Fatalf("UpsertRecord (update): %v", err)
	}
	for _, item := range updated.Items {
		if item.ID == "item-5b-1" && item.PriorityBilling {
			t.Errorf("item-5b-1 siguio marcado tras apagarlo")
		}
	}
}
