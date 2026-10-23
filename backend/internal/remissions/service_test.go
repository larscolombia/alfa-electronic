package remissions

import (
	"regexp"
	"testing"
	"time"
)

func sampleRequest() UpsertRemissionRequest {
	return UpsertRemissionRequest{
		ClientName:   "Cliente Demo",
		ClientNIT:    "900123456",
		ContactName:  "Juan Contacto",
		DispatchType: "servientrega",
		CarrierName:  "Servientrega",
		GuideNumber:  "GUIA-001",
		Valued:       true,
		Items: []RemissionItem{
			{EquipmentID: "eq-1", Identifier: "MTR-01", Description: "Motor", UnitPrice: 100, Quantity: 2},
			{EquipmentID: "eq-2", Identifier: "PMP-01", Description: "Bomba", UnitPrice: 50.5, Quantity: 2},
		},
	}
}

func TestFormatConsecutive(t *testing.T) {
	re := regexp.MustCompile(`^E-CO-\d{4}-\d{4,}$`)
	now := time.Date(2026, time.August, 18, 10, 0, 0, 0, time.UTC)

	got := formatConsecutive(1, now)
	if !re.MatchString(got) {
		t.Fatalf("consecutivo con formato invalido: %s", got)
	}
	if got != "E-CO-2608-0001" {
		t.Fatalf("consecutivo = %s, esperaba E-CO-2608-0001", got)
	}
}

func TestComputeTotalValue(t *testing.T) {
	cases := []struct {
		name  string
		items []RemissionItem
		want  float64
	}{
		{"sin items", nil, 0},
		{"un item", []RemissionItem{{UnitPrice: 100, Quantity: 2}}, 200},
		{"varios con decimales", []RemissionItem{{UnitPrice: 100, Quantity: 2}, {UnitPrice: 50.5, Quantity: 2}}, 301},
		{"precio cero", []RemissionItem{{UnitPrice: 0, Quantity: 5}}, 0},
		{"mas de cuatro items", []RemissionItem{
			{UnitPrice: 10, Quantity: 1}, {UnitPrice: 10, Quantity: 1},
			{UnitPrice: 10, Quantity: 1}, {UnitPrice: 10, Quantity: 1},
			{UnitPrice: 10, Quantity: 1}, {UnitPrice: 10, Quantity: 1},
		}, 60},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := computeTotalValue(tc.items); got != tc.want {
				t.Fatalf("computeTotalValue = %v, esperaba %v", got, tc.want)
			}
		})
	}
}
