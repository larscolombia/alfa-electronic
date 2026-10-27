package equipment

import (
	"encoding/json"
	"errors"
	"strings"
	"testing"
)

func TestNormalizeItemEdgeFlags(t *testing.T) {
	cases := []struct {
		name string
		item Item
		want Item
	}{
		{
			name: "REC-11 falla vacia con remitente identificado marca failurePending",
			item: Item{Answers: map[string]string{}},
			want: Item{FailurePending: true},
		},
		{
			name: "REC-11 falla diligenciada no marca failurePending",
			item: Item{FailureDescription: "no enciende"},
			want: Item{FailurePending: false},
		},
		{
			name: "REC-11 remitente desconocido no marca failurePending",
			item: Item{SenderUnknown: true},
			want: Item{SenderUnknown: true, FailurePending: false},
		},
		{
			name: "REC-12 software no descartado marca softwareSuspicion",
			item: Item{FailureDescription: "falla", Answers: map[string]string{"softwareIssueRuledOut": "No"}},
			want: Item{SoftwareSuspicion: true},
		},
		{
			name: "REC-12 software descartado no marca softwareSuspicion",
			item: Item{FailureDescription: "falla", Answers: map[string]string{"softwareIssueRuledOut": "Sí"}},
			want: Item{SoftwareSuspicion: false},
		},
		{
			name: "REC-13 reparacion previa marca previousIntervention",
			item: Item{FailureDescription: "falla", Answers: map[string]string{"previousRepairAttempt": "Sí"}},
			want: Item{PreviousIntervention: true},
		},
		{
			name: "REC-13 repuestos extraidos marca previousIntervention",
			item: Item{FailureDescription: "falla", Answers: map[string]string{"partsRemovedAsSpare": "yes"}},
			want: Item{PreviousIntervention: true},
		},
		{
			name: "REC-13 sin intervencion no marca previousIntervention",
			item: Item{FailureDescription: "falla", Answers: map[string]string{"previousRepairAttempt": "No", "partsRemovedAsSpare": "No"}},
			want: Item{PreviousIntervention: false},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := normalizeItemEdgeFlags(tc.item)
			if got.FailurePending != tc.want.FailurePending {
				t.Errorf("FailurePending = %v, esperaba %v", got.FailurePending, tc.want.FailurePending)
			}
			if got.SoftwareSuspicion != tc.want.SoftwareSuspicion {
				t.Errorf("SoftwareSuspicion = %v, esperaba %v", got.SoftwareSuspicion, tc.want.SoftwareSuspicion)
			}
			if got.PreviousIntervention != tc.want.PreviousIntervention {
				t.Errorf("PreviousIntervention = %v, esperaba %v", got.PreviousIntervention, tc.want.PreviousIntervention)
			}
		})
	}
}

func TestNormalizeItemEdgeFlagsCustodyIncident(t *testing.T) {
	t.Run("incidente completo se conserva y se recorta", func(t *testing.T) {
		item := normalizeItemEdgeFlags(Item{
			SenderUnknown: true,
			CustodyIncident: &CustodyIncident{
				PhotosNote:  "  fotos de la caja  ",
				Responsible: " ana ",
				CreatedAt:   "2026-10-26T10:00:00Z",
			},
		})
		if item.CustodyIncident == nil {
			t.Fatal("custodyIncident se perdio")
		}
		if item.CustodyIncident.Responsible != "ana" || item.CustodyIncident.PhotosNote != "fotos de la caja" {
			t.Errorf("incidente sin recortar: %+v", item.CustodyIncident)
		}
	})

	t.Run("incidente sin datos se descarta y createdAt se genera", func(t *testing.T) {
		item := normalizeItemEdgeFlags(Item{
			CustodyIncident: &CustodyIncident{PhotosNote: " nota "},
		})
		if item.CustodyIncident == nil || item.CustodyIncident.CreatedAt == "" {
			t.Fatalf("createdAt debia generarse: %+v", item.CustodyIncident)
		}
	})
}

func TestBorrowedEquipmentsCompatUnmarshal(t *testing.T) {
	t.Run("array de strings (compatibilidad)", func(t *testing.T) {
		var items []BorrowedEquipment
		raw := `["Cable USB","Fuente 24V"]`
		if err := json.Unmarshal([]byte(raw), &items); err != nil {
			t.Fatalf("unmarshal strings: %v", err)
		}
		if len(items) != 2 || items[0].Description != "Cable USB" || items[0].Code != "" {
			t.Fatalf("items inesperados: %+v", items)
		}
	})

	t.Run("array de objetos", func(t *testing.T) {
		var items []BorrowedEquipment
		raw := `[{"code":"BLD-ABC12345","description":"Fuente 24V"}]`
		if err := json.Unmarshal([]byte(raw), &items); err != nil {
			t.Fatalf("unmarshal objetos: %v", err)
		}
		if len(items) != 1 || items[0].Code != "BLD-ABC12345" {
			t.Fatalf("items inesperados: %+v", items)
		}
	})

	t.Run("REC-08 se normaliza a objetos con codigo generado", func(t *testing.T) {
		var item Item
		raw := `{"id":"i1","borrowedEquipments":["Cable USB",{"description":"Fuente"}]}`
		if err := json.Unmarshal([]byte(raw), &item); err != nil {
			t.Fatalf("unmarshal item: %v", err)
		}

		normalized := normalizeRecord(Record{ID: "r1", Items: []Item{item}})
		borrowed := normalized.Items[0].BorrowedEquipments
		if len(borrowed) != 2 {
			t.Fatalf("borrowedEquipments = %+v, esperaba 2", borrowed)
		}
		for _, entry := range borrowed {
			if !strings.HasPrefix(entry.Code, "BLD-") || len(entry.Code) != len("BLD-XXXXXXXX") {
				t.Errorf("codigo generado invalido: %q", entry.Code)
			}
		}
		if borrowed[0].Description != "Cable USB" || borrowed[1].Description != "Fuente" {
			t.Errorf("descripciones inesperadas: %+v", borrowed)
		}
	})
}

func TestValidateIntakeTransportadora(t *testing.T) {
	cases := []struct {
		name    string
		record  Record
		wantErr error
	}{
		{"personal no exige nada", Record{IntakeMethod: "personal"}, nil},
		{"transportadora completa", Record{IntakeMethod: "transportadora", IntakeCarrier: "Servientrega", IntakeTrackingNumber: "GU-1", IntakeReceivedAt: "2026-10-26T10:00:00Z"}, nil},
		{"falta fecha de recibido", Record{IntakeMethod: "transportadora", IntakeCarrier: "Servientrega", IntakeTrackingNumber: "GU-1"}, errIntakeTransportadoraRequired},
		{"falta transportadora", Record{IntakeMethod: "transportadora", IntakeTrackingNumber: "GU-1", IntakeReceivedAt: "2026-10-26T10:00:00Z"}, errIntakeTransportadoraRequired},
		{"falta guia", Record{IntakeMethod: "transportadora", IntakeCarrier: "Servientrega", IntakeReceivedAt: "2026-10-26T10:00:00Z"}, errIntakeTransportadoraRequired},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateIntakeTransportadora(tc.record)
			if !errors.Is(err, tc.wantErr) {
				t.Errorf("validateIntakeTransportadora = %v, esperaba %v", err, tc.wantErr)
			}
		})
	}
}

func TestValidateItemEdgeEvidence(t *testing.T) {
	faces := func() []EvidencePhoto {
		photos := make([]EvidencePhoto, 0, len(requiredEvidenceFaces))
		for _, face := range requiredEvidenceFaces {
			photos = append(photos, EvidencePhoto{EvidenceType: face})
		}
		return photos
	}

	t.Run("REC-06 placa ilegible sin evidencia ni motivo", func(t *testing.T) {
		item := Item{ID: "i1", IdentifierLabelIssue: true, EvidencePhotos: faces()}
		if err := validateItemEdgeEvidence([]Item{item}); !errors.Is(err, errSerialPlateEvidenceRequired) {
			t.Errorf("err = %v, esperaba errSerialPlateEvidenceRequired", err)
		}
	})

	t.Run("REC-06 con foto de placa y motivo pasa", func(t *testing.T) {
		photos := append(faces(), EvidencePhoto{EvidenceType: "serial-plate"})
		item := Item{ID: "i1", IdentifierLabelIssue: true, SerieExceptionReason: "placa borrada", EvidencePhotos: photos}
		if err := validateItemEdgeEvidence([]Item{item}); err != nil {
			t.Errorf("err = %v, esperaba nil", err)
		}
	})

	t.Run("REC-07 accesorios sin evidencia", func(t *testing.T) {
		item := Item{ID: "i1", Accessories: "cable, fuente", EvidencePhotos: faces()}
		if err := validateItemEdgeEvidence([]Item{item}); !errors.Is(err, errAccessoriesEvidenceRequired) {
			t.Errorf("err = %v, esperaba errAccessoriesEvidenceRequired", err)
		}
	})

	t.Run("REC-07 accesorios con evidencia pasa", func(t *testing.T) {
		photos := append(faces(), EvidencePhoto{EvidenceType: "accessories"})
		item := Item{ID: "i1", Accessories: "cable", EvidencePhotos: photos}
		if err := validateItemEdgeEvidence([]Item{item}); err != nil {
			t.Errorf("err = %v, esperaba nil", err)
		}
	})

	t.Run("REC-10 dano visible sin confirmacion", func(t *testing.T) {
		photos := append(faces(), EvidencePhoto{EvidenceType: "visible-damage", Notes: "golpe en carcasa"})
		item := Item{ID: "i1", VisibleDamageReported: true, EvidencePhotos: photos}
		if err := validateItemEdgeEvidence([]Item{item}); !errors.Is(err, errVisibleDamageEvidenceRequired) {
			t.Errorf("err = %v, esperaba errVisibleDamageEvidenceRequired", err)
		}
	})

	t.Run("REC-10 dano visible sin nota en evidencia", func(t *testing.T) {
		photos := append(faces(), EvidencePhoto{EvidenceType: "visible-damage"})
		item := Item{ID: "i1", VisibleDamageReported: true, VisibleDamageConfirmed: true, EvidencePhotos: photos}
		if err := validateItemEdgeEvidence([]Item{item}); !errors.Is(err, errVisibleDamageEvidenceRequired) {
			t.Errorf("err = %v, esperaba errVisibleDamageEvidenceRequired", err)
		}
	})

	t.Run("REC-10 dano visible confirmado con nota pasa", func(t *testing.T) {
		photos := append(faces(), EvidencePhoto{EvidenceType: "visible-damage", Notes: "golpe"})
		item := Item{ID: "i1", VisibleDamageReported: true, VisibleDamageConfirmed: true, EvidencePhotos: photos}
		if err := validateItemEdgeEvidence([]Item{item}); err != nil {
			t.Errorf("err = %v, esperaba nil", err)
		}
	})

	t.Run("item sin casos de borde pasa", func(t *testing.T) {
		item := Item{ID: "i1", EvidencePhotos: faces()}
		if err := validateItemEdgeEvidence([]Item{item}); err != nil {
			t.Errorf("err = %v, esperaba nil", err)
		}
	})
}

func TestDuplicateConfirmValid(t *testing.T) {
	cases := []struct {
		name    string
		confirm *DuplicateConfirm
		want    bool
	}{
		{"nil no confirma", nil, false},
		{"sin motivo no confirma", &DuplicateConfirm{Relation: "reingreso"}, false},
		{"relacion invalida no confirma", &DuplicateConfirm{Reason: "reingreso del cliente", Relation: "otro"}, false},
		{"reingreso confirma", &DuplicateConfirm{Reason: "reingreso del cliente", Relation: "reingreso"}, true},
		{"garantia confirma", &DuplicateConfirm{Reason: "garantia", Relation: "garantia"}, true},
		{"evento_nuevo confirma", &DuplicateConfirm{Reason: "evento nuevo", Relation: "evento_nuevo"}, true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := duplicateConfirmValid(tc.confirm); got != tc.want {
				t.Errorf("duplicateConfirmValid(%+v) = %v, esperaba %v", tc.confirm, got, tc.want)
			}
		})
	}
}

func TestAttachmentMIMEAllowed(t *testing.T) {
	cases := []struct {
		mime string
		want bool
	}{
		{"image/jpeg", true},
		{"image/png", true},
		{"application/pdf", true},
		{"", true},
		{"application/zip", false},
		{"application/octet-stream", false},
		{"video/mp4", false},
	}
	for _, tc := range cases {
		if got := attachmentMIMEAllowed(tc.mime); got != tc.want {
			t.Errorf("attachmentMIMEAllowed(%q) = %v, esperaba %v", tc.mime, got, tc.want)
		}
	}
}

func TestSenderUnknownAssignmentErrorText(t *testing.T) {
	const want = "Remitente no identificado: no se puede asignar técnico ni cotizar hasta identificar empresa/contacto"
	if errSenderUnknownAssignment.Error() != want {
		t.Errorf("mensaje inestable:\n got: %q\nwant: %q", errSenderUnknownAssignment.Error(), want)
	}
}
