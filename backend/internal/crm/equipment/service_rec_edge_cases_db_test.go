package equipment

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

func faceEvidencePhotos() []EvidencePhoto {
	photos := make([]EvidencePhoto, 0, len(requiredEvidenceFaces))
	for _, face := range requiredEvidenceFaces {
		photos = append(photos, EvidencePhoto{ID: face, EvidenceType: face})
	}
	return photos
}

func TestUpsertDraftWithoutFinalizeRec09(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)

	stamp := time.Now().UnixNano()
	recordID := fmt.Sprintf("rec09-draft-%d", stamp)
	t.Cleanup(func() { cleanupEquipmentRecords(t, db, recordID) })

	record := Record{
		ID:           recordID,
		ProspectID:   "0",
		CompanyName:  fmt.Sprintf("ClienteRec09-%d", stamp),
		ReceptionDay: "26", ReceptionMonth: "10", ReceptionYear: "2026",
		Items: []Item{{ID: "item-rec09", Marca: "QA", Tipo: "HMI", ReceivedIdentifier: fmt.Sprintf("ID-REC09-%d", stamp)}},
	}

	saved, err := service.UpsertRecord(testEquipmentCompanyID, record)
	if err != nil {
		t.Fatalf("UpsertRecord (borrador sin caras): %v", err)
	}
	if len(saved.Items) != 1 {
		t.Fatalf("items = %d, esperaba 1", len(saved.Items))
	}
	if saved.Items[0].RepairStatus != "recibido" {
		t.Errorf("estado = %q, esperaba no finalizado 'recibido'", saved.Items[0].RepairStatus)
	}

	fetched, err := service.GetRecord(testEquipmentCompanyID, recordID, false)
	if err != nil {
		t.Fatalf("GetRecord: %v", err)
	}
	if len(fetched.Items) != 1 || len(fetched.Items[0].EvidencePhotos) != 0 {
		t.Errorf("el borrador no debe exigir evidencias: %+v", fetched.Items)
	}

	if _, err := service.FinalizeRecord(testEquipmentCompanyID, recordID); !errors.Is(err, errFinalizeEvidenceFacesRequired) {
		t.Errorf("FinalizeRecord = %v, esperaba errFinalizeEvidenceFacesRequired", err)
	}
}

func TestUpsertTransportadoraRequiresReceivedAtRec05(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)

	stamp := time.Now().UnixNano()
	recordID := fmt.Sprintf("rec05-%d", stamp)
	t.Cleanup(func() { cleanupEquipmentRecords(t, db, recordID) })

	incomplete := Record{
		ID:           recordID,
		ProspectID:   "0",
		CompanyName:  fmt.Sprintf("ClienteRec05-%d", stamp),
		IntakeMethod: "transportadora", IntakeCarrier: "Servientrega", IntakeTrackingNumber: "GU-123",
		Items: []Item{{ID: "item-rec05", ReceivedIdentifier: fmt.Sprintf("ID-REC05-%d", stamp)}},
	}
	if _, err := service.UpsertRecord(testEquipmentCompanyID, incomplete); !errors.Is(err, errIntakeTransportadoraRequired) {
		t.Fatalf("UpsertRecord sin fecha de recibido = %v, esperaba errIntakeTransportadoraRequired", err)
	}

	incomplete.IntakeReceivedAt = "2026-10-26T09:00:00Z"
	saved, err := service.UpsertRecord(testEquipmentCompanyID, incomplete)
	if err != nil {
		t.Fatalf("UpsertRecord completo: %v", err)
	}
	if saved.IntakeReceivedAt == "" {
		t.Error("intakeReceivedAt no se persistio")
	}
	if _, err := service.FinalizeRecord(testEquipmentCompanyID, recordID); !errors.Is(err, errFinalizeEvidenceFacesRequired) {
		t.Errorf("finalize con caras faltantes = %v, esperaba errFinalizeEvidenceFacesRequired", err)
	}
}

func TestDuplicateIdentifierRec14(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)

	stamp := time.Now().UnixNano()
	firstID := fmt.Sprintf("rec14-a-%d", stamp)
	secondID := fmt.Sprintf("rec14-b-%d", stamp)
	t.Cleanup(func() { cleanupEquipmentRecords(t, db, firstID, secondID) })

	identifier := fmt.Sprintf("ID-DUP-%d", stamp)
	newRecord := func(id, itemID string, confirm *DuplicateConfirm) Record {
		return Record{
			ID: id, ProspectID: "0", CompanyName: fmt.Sprintf("ClienteRec14-%d", stamp),
			Items: []Item{{ID: itemID, ReceivedIdentifier: identifier, DuplicateConfirm: confirm}},
		}
	}

	if _, err := service.UpsertRecord(testEquipmentCompanyID, newRecord(firstID, "item-a", nil)); err != nil {
		t.Fatalf("UpsertRecord primero: %v", err)
	}

	// Re-guardar el PROPIO registro no se rechaza a si mismo.
	if _, err := service.UpsertRecord(testEquipmentCompanyID, newRecord(firstID, "item-a", nil)); err != nil {
		t.Fatalf("re-guardado del propio registro: %v", err)
	}

	// Mismo identificador en OTRO registro sin confirmacion: 409.
	_, err := service.UpsertRecord(testEquipmentCompanyID, newRecord(secondID, "item-b", nil))
	var duplicateErr *DuplicateIdentifierError
	if !errors.As(err, &duplicateErr) {
		t.Fatalf("UpsertRecord duplicado = %v, esperaba *DuplicateIdentifierError", err)
	}
	if duplicateErr.ExistingRecordID != firstID {
		t.Errorf("existingRecordId = %q, esperaba %q", duplicateErr.ExistingRecordID, firstID)
	}

	// Con confirmacion valida se permite y persiste.
	confirmed := newRecord(secondID, "item-b", &DuplicateConfirm{Reason: "reingreso del cliente", Relation: "reingreso"})
	saved, err := service.UpsertRecord(testEquipmentCompanyID, confirmed)
	if err != nil {
		t.Fatalf("UpsertRecord con confirmacion: %v", err)
	}
	if saved.Items[0].DuplicateConfirm == nil || saved.Items[0].DuplicateConfirm.Relation != "reingreso" {
		t.Errorf("duplicateConfirm no persistio: %+v", saved.Items[0].DuplicateConfirm)
	}

	// El finalize tambien detecta el duplicado de un tercer registro.
	thirdID := fmt.Sprintf("rec14-c-%d", stamp)
	t.Cleanup(func() { cleanupEquipmentRecords(t, db, thirdID) })
	third := newRecord(thirdID, "item-c", nil)
	third.Items[0].EvidencePhotos = faceEvidencePhotos()
	if _, err := service.UpsertRecord(testEquipmentCompanyID, third); err != nil {
		// el upsert ya lo rechaza: tambien es un resultado valido del caso
		if !errors.As(err, &duplicateErr) {
			t.Fatalf("UpsertRecord tercero = %v, esperaba duplicado", err)
		}
	} else if _, err := service.FinalizeRecord(testEquipmentCompanyID, thirdID); !errors.As(err, &duplicateErr) {
		t.Errorf("FinalizeRecord duplicado = %v, esperaba *DuplicateIdentifierError", err)
	}
}

func TestFinalizeEdgeEvidenceRec060710(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)

	stamp := time.Now().UnixNano()
	recordID := fmt.Sprintf("rec0610-%d", stamp)
	t.Cleanup(func() { cleanupEquipmentRecords(t, db, recordID) })

	item := Item{
		ID: "item-edge", ReceivedIdentifier: fmt.Sprintf("ID-EDGE-%d", stamp),
		IdentifierLabelIssue: true, Accessories: "cable usb", VisibleDamageReported: true,
		EvidencePhotos: faceEvidencePhotos(),
	}
	record := Record{
		ID: recordID, ProspectID: "0", CompanyName: fmt.Sprintf("ClienteEdge-%d", stamp),
		Items: []Item{item},
	}
	if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
		t.Fatalf("UpsertRecord: %v", err)
	}

	if _, err := service.FinalizeRecord(testEquipmentCompanyID, recordID); !errors.Is(err, errSerialPlateEvidenceRequired) {
		t.Fatalf("finalize sin placa = %v, esperaba errSerialPlateEvidenceRequired", err)
	}

	record.Items[0].EvidencePhotos = append(record.Items[0].EvidencePhotos, EvidencePhoto{ID: "p", EvidenceType: "serial-plate"})
	record.Items[0].SerieExceptionReason = "placa borrada"
	if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
		t.Fatalf("UpsertRecord con placa: %v", err)
	}
	if _, err := service.FinalizeRecord(testEquipmentCompanyID, recordID); !errors.Is(err, errAccessoriesEvidenceRequired) {
		t.Fatalf("finalize sin accesorios = %v, esperaba errAccessoriesEvidenceRequired", err)
	}

	record.Items[0].EvidencePhotos = append(record.Items[0].EvidencePhotos, EvidencePhoto{ID: "a", EvidenceType: "accessories"})
	if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
		t.Fatalf("UpsertRecord con accesorios: %v", err)
	}
	if _, err := service.FinalizeRecord(testEquipmentCompanyID, recordID); !errors.Is(err, errVisibleDamageEvidenceRequired) {
		t.Fatalf("finalize sin dano confirmado = %v, esperaba errVisibleDamageEvidenceRequired", err)
	}

	record.Items[0].EvidencePhotos = append(record.Items[0].EvidencePhotos, EvidencePhoto{ID: "d", EvidenceType: "visible-damage", Notes: "golpe carcasa"})
	record.Items[0].VisibleDamageConfirmed = true
	if _, err := service.UpsertRecord(testEquipmentCompanyID, record); err != nil {
		t.Fatalf("UpsertRecord completo: %v", err)
	}
	if _, err := service.FinalizeRecord(testEquipmentCompanyID, recordID); err != nil {
		t.Fatalf("finalize completo = %v, esperaba nil", err)
	}
}

func TestAssignTechnicianRejectsSenderUnknownRec03(t *testing.T) {
	db := openEquipmentTestDB(t)
	service := NewService(db, nil)

	stamp := time.Now().UnixNano()
	recordID := fmt.Sprintf("rec03-%d", stamp)
	employeeID := fmt.Sprintf("qar03-%d", stamp%1000000)
	t.Cleanup(func() {
		cleanupEquipmentRecords(t, db, recordID)
		if _, err := db.Exec(`DELETE FROM hr_employees WHERE company_id = $1 AND id = $2;`, testEquipmentCompanyID, employeeID); err != nil {
			t.Logf("cleanup empleado: %v", err)
		}
	})

	if _, err := db.Exec(`
INSERT INTO hr_employees (company_id, id, name, role, department, manager, status, soft_delete, created_at, updated_at)
VALUES ($1, $2, 'QA Rec03 Tecnico', 'Tecnico soporte', 'Operaciones', 'Direccion General', 'Activo', false, NOW(), NOW());
`, testEquipmentCompanyID, employeeID); err != nil {
		t.Fatalf("sembrar tecnico: %v", err)
	}

	record := Record{
		ID: recordID, ProspectID: "0", CompanyName: fmt.Sprintf("ClienteRec03-%d", stamp),
		Items: []Item{{
			ID:                 "item-unknown",
			ReceivedIdentifier: fmt.Sprintf("ID-REC03-%d", stamp),
			SenderUnknown:      true,
			CustodyIncident: &CustodyIncident{
				PhotosNote: "fotos de la caja y del equipo", Responsible: "recepcionista QA",
			},
		}},
	}
	saved, err := service.UpsertRecord(testEquipmentCompanyID, record)
	if err != nil {
		t.Fatalf("UpsertRecord: %v", err)
	}
	if saved.Items[0].CustodyIncident == nil || saved.Items[0].CustodyIncident.CreatedAt == "" {
		t.Errorf("custodyIncident no persistio con createdAt: %+v", saved.Items[0].CustodyIncident)
	}
	if saved.Items[0].FailurePending {
		t.Error("failurePending no debe marcarse con remitente desconocido")
	}

	_, err = service.AssignItemTechnician(testEquipmentCompanyID, recordID, "item-unknown", AssignTechnicianRequest{
		AssignedToID: employeeID, AssignedTo: "QA Rec03 Tecnico",
	})
	if !errors.Is(err, errSenderUnknownAssignment) {
		t.Errorf("AssignItemTechnician = %v, esperaba errSenderUnknownAssignment", err)
	}
}
