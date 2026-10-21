package equipment

import (
	"fmt"
	"testing"
	"time"

	"pika.software.net.co/backend/internal/platform/database"
)

// FASE 5c — filtro `priorityBilling=true` en GET /crm-equipment/items.
//
// La Fase 5b hizo que el flag persistiera; la campanita que pidió el cliente
// necesita contarlo. Sin este filtro el frontend traía TODOS los ítems y
// filtraba en el navegador, que es justo el patrón que el plan prohíbe.
//
// El punto delicado: los ítems viven en un JSONB por registro, así que un
// filtro a nivel de registro devuelve también los ítems no marcados del mismo
// registro. La campanita cuenta equipos, no recepciones — de ahí el recorte
// por ítem que este test fija.
func TestListItemsPriorityBillingFilter5c(t *testing.T) {
	db := openEquipmentTestDB(t)
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	service := NewService(db, nil)

	stamp := time.Now().UnixNano()
	mixedRecordID := fmt.Sprintf("rec5c-mix-%d", stamp)
	plainRecordID := fmt.Sprintf("rec5c-plain-%d", stamp)
	defer cleanupEquipmentRecords(t, db, mixedRecordID, plainRecordID)

	// Nombre único por corrida: el filtro clientName es coincidencia EXACTA
	// sobre company_name (buildProspectMatchFilters), así que se usa el mismo
	// nombre en los dos registros para poder consultarlos juntos y a la vez
	// quedar aislado de otros datos de demo-company.
	clientName := fmt.Sprintf("Cliente5c-%d", stamp)

	// Registro MIXTO: un ítem urgente y uno que no. Es el caso que distingue
	// filtrar por registro de filtrar por ítem.
	mixed := Record{
		ID:           mixedRecordID,
		ProspectID:   "0",
		CompanyName:  clientName,
		ReceptionDay: "20", ReceptionMonth: "10", ReceptionYear: "2026",
		Items: []Item{
			{ID: "item-5c-urgent", Marca: "Kayser", Tipo: "HMI", Serie: "S5CU", ReceivedIdentifier: "S5CU", PriorityBilling: true},
			{ID: "item-5c-normal", Marca: "Kayser", Tipo: "VFD", Serie: "S5CN", ReceivedIdentifier: "S5CN"},
		},
	}
	// Registro sin nada marcado: no debe aparecer.
	plain := Record{
		ID:           plainRecordID,
		ProspectID:   "0",
		CompanyName:  clientName,
		ReceptionDay: "20", ReceptionMonth: "10", ReceptionYear: "2026",
		Items: []Item{
			{ID: "item-5c-other", Marca: "Siemens", Tipo: "PLC", Serie: "S5CO", ReceivedIdentifier: "S5CO"},
		},
	}

	for _, record := range []Record{mixed, plain} {
		if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
			t.Fatalf("UpsertRecord %s: %v", record.ID, err)
		}
	}

	// Con el filtro: sólo los ítems marcados, no todos los del registro.
	marked, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{
		PriorityBilling: true,
		ClientName:      clientName,
	})
	if err != nil {
		t.Fatalf("ListItems(priorityBilling=true): %v", err)
	}
	if len(marked) != 1 {
		for _, summary := range marked {
			t.Logf("  summary devuelta: %s (priorityBilling=%v)", summary.ItemID, summary.PriorityBilling)
		}
		t.Fatalf("ListItems(priorityBilling=true) devolvio %d items, esperaba 1", len(marked))
	}
	if marked[0].ItemID != "item-5c-urgent" {
		t.Errorf("item = %s, esperaba item-5c-urgent", marked[0].ItemID)
	}
	if !marked[0].PriorityBilling {
		t.Error("el item devuelto no trae priorityBilling=true")
	}

	// Sin el filtro: el mismo cliente devuelve los tres ítems. El filtro no
	// debe haber roto el listado normal.
	all, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{ClientName: clientName})
	if err != nil {
		t.Fatalf("ListItems(sin filtro): %v", err)
	}
	if len(all) != 3 {
		t.Errorf("ListItems(sin filtro) devolvio %d items, esperaba 3", len(all))
	}

	// La marca se puede apagar y el filtro lo refleja: es lo que hace que la
	// campanita deje de sonar cuando ya se facturó.
	mixed.Items[0].PriorityBilling = false
	if _, err := service.UpsertRecord(testEquipmentCompanyID, mixed); err != nil {
		t.Fatalf("UpsertRecord (apagar marca): %v", err)
	}

	after, err := service.ListItems(testEquipmentCompanyID, ListItemsQuery{
		PriorityBilling: true,
		ClientName:      clientName,
	})
	if err != nil {
		t.Fatalf("ListItems tras apagar: %v", err)
	}
	if len(after) != 0 {
		t.Errorf("siguieron apareciendo %d items urgentes tras apagar la marca", len(after))
	}
}
