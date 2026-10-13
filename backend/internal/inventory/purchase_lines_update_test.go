package inventory

import (
	"errors"
	"testing"
)

func strPtr(s string) *string     { return &s }
func intPtr(i int) *int           { return &i }
func floatPtr(f float64) *float64 { return &f }

func TestValidateUpdatePurchaseLineRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     UpdatePurchaseLineRequest
		wantErr error
	}{
		{"sin campos", UpdatePurchaseLineRequest{}, errNoUpdateFields},
		{"referencia vacia", UpdatePurchaseLineRequest{Reference: strPtr("   ")}, errReferenceRequired},
		{"referencia valida", UpdatePurchaseLineRequest{Reference: strPtr("FGA25N120")}, nil},
		{"cantidad cero", UpdatePurchaseLineRequest{Quantity: intPtr(0)}, errInvalidQuantity},
		{"cantidad negativa", UpdatePurchaseLineRequest{Quantity: intPtr(-3)}, errInvalidQuantity},
		{"cantidad valida", UpdatePurchaseLineRequest{Quantity: intPtr(5)}, nil},
		{"precio negativo", UpdatePurchaseLineRequest{UnitPrice: floatPtr(-1)}, errInvalidPrice},
		{"precio cero valido", UpdatePurchaseLineRequest{UnitPrice: floatPtr(0)}, nil},
		{"marca sola valida", UpdatePurchaseLineRequest{Brand: strPtr("Infineon")}, nil},
		{"todos los campos validos", UpdatePurchaseLineRequest{
			Reference: strPtr("IGBT-FGA25N120"), Brand: strPtr("Infineon"), UnitPrice: floatPtr(15000), Quantity: intPtr(2),
		}, nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateUpdatePurchaseLineRequest(tt.req)
			if tt.wantErr == nil && err != nil {
				t.Fatalf("validateUpdatePurchaseLineRequest() error inesperado: %v", err)
			}
			if tt.wantErr != nil && !errors.Is(err, tt.wantErr) {
				t.Fatalf("validateUpdatePurchaseLineRequest() = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestUpdateValidationMessage(t *testing.T) {
	tests := []struct {
		err      error
		contains string
	}{
		{errNoUpdateFields, "al menos un campo"},
		{errReferenceRequired, "referencia"},
		{errInvalidQuantity, "cantidad"},
		{errInvalidPrice, "precio"},
	}
	for _, tt := range tests {
		msg := updateValidationMessage(tt.err)
		if msg == "" {
			t.Errorf("updateValidationMessage(%v) vacio", tt.err)
		}
	}
}

func TestPurchaseLineEditableStatus(t *testing.T) {
	tests := []struct {
		status   string
		editable bool
	}{
		{"pendiente", true},
		{"enviada", false},
		{"cerrada", false},
		{"", false},
	}
	for _, tt := range tests {
		if got := purchaseLineEditableStatus(tt.status); got != tt.editable {
			t.Errorf("purchaseLineEditableStatus(%q) = %v, want %v", tt.status, got, tt.editable)
		}
	}
}

func TestDetectRelevantChanges(t *testing.T) {
	base := PurchaseLine{Reference: "IGBT-FGA25N120", Brand: "Infineon", Quantity: 2, UnitPrice: 15000}

	tests := []struct {
		name string
		new  PurchaseLine
		want bool
	}{
		{"sin cambios", base, false},
		{"cambio de marca", PurchaseLine{Reference: base.Reference, Brand: "Fairchild", Quantity: base.Quantity, UnitPrice: base.UnitPrice}, true},
		{"cambio de referencia", PurchaseLine{Reference: "FGA25N120ANTD", Brand: base.Brand, Quantity: base.Quantity, UnitPrice: base.UnitPrice}, true},
		{"cambio solo de precio", PurchaseLine{Reference: base.Reference, Brand: base.Brand, Quantity: base.Quantity, UnitPrice: 17500}, false},
		{"cambio solo de cantidad", PurchaseLine{Reference: base.Reference, Brand: base.Brand, Quantity: 9, UnitPrice: base.UnitPrice}, false},
		{"cambio cosmetico de marca", PurchaseLine{Reference: base.Reference, Brand: " infineon ", Quantity: base.Quantity, UnitPrice: base.UnitPrice}, false},
		{"cambio cosmetico de referencia", PurchaseLine{Reference: "igbt fga25n120", Brand: base.Brand, Quantity: base.Quantity, UnitPrice: base.UnitPrice}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := detectRelevantChanges(base, tt.new); got != tt.want {
				t.Errorf("detectRelevantChanges() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestResolveUpdatedPurchaseLine(t *testing.T) {
	old := PurchaseLine{Reference: "LM324N", Brand: "TI", Quantity: 2, UnitPrice: 1000, Supplier: "Mouser"}

	// Sin campos enviados: conserva todo.
	resolved := resolveUpdatedPurchaseLine(old, UpdatePurchaseLineRequest{})
	if resolved != old {
		t.Errorf("resolveUpdatedPurchaseLine sin campos = %+v, want %+v", resolved, old)
	}

	// Aplica solo lo enviado y recorta espacios.
	resolved = resolveUpdatedPurchaseLine(old, UpdatePurchaseLineRequest{
		Reference: strPtr("  LM324ADR  "),
		Quantity:  intPtr(7),
	})
	if resolved.Reference != "LM324ADR" {
		t.Errorf("reference = %q, want %q", resolved.Reference, "LM324ADR")
	}
	if resolved.Quantity != 7 {
		t.Errorf("quantity = %d, want 7", resolved.Quantity)
	}
	if resolved.Brand != "TI" || resolved.UnitPrice != 1000 || resolved.Supplier != "Mouser" {
		t.Errorf("campos no enviados deben conservarse: %+v", resolved)
	}
}
