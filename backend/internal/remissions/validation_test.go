package remissions

import (
	"errors"
	"testing"
)

// TestValidateUpsertRules cubre las 4 reglas duras del requerimiento de
// despacho. Pura: no necesita base, la regla es el contrato y el test es su
// espejo. Cada violación devuelve el sentinel exacto (no un genérico), que es
// lo que el handler traduce a 400 con mensaje accionable.

func validRuleRequest() UpsertRemissionRequest {
	return UpsertRemissionRequest{
		ClientName:  "Cliente Demo",
		ContactName: "Juan Contacto",
		Items: []RemissionItem{{
			EquipmentID: "eq-1", Identifier: "MTR-01", Description: "Motor", Quantity: 1,
		}},
	}
}

func TestValidateUpsertRules(t *testing.T) {
	t.Run("request valido pasa", func(t *testing.T) {
		if err := validateUpsert(validRuleRequest()); err != nil {
			t.Fatalf("esperaba sin error, got %v", err)
		}
	})

	t.Run("sin equipos se rechaza", func(t *testing.T) {
		req := validRuleRequest()
		req.Items = nil
		if err := validateUpsert(req); !errors.Is(err, errNoItems) {
			t.Fatalf("esperaba errNoItems, got %v", err)
		}
	})

	t.Run("cinco equipos se rechazan (limite es 4)", func(t *testing.T) {
		req := validRuleRequest()
		for i := 0; i < 4; i++ {
			req.Items = append(req.Items, RemissionItem{Identifier: "EXTRA" + string(rune('A'+i))})
		}
		if err := validateUpsert(req); !errors.Is(err, errTooManyItems) {
			t.Fatalf("esperaba errTooManyItems, got %v", err)
		}
	})

	t.Run("cuatro equipos pasan (el limite es inclusivo)", func(t *testing.T) {
		req := validRuleRequest()
		for i := 0; i < 3; i++ {
			req.Items = append(req.Items, RemissionItem{Identifier: "OK" + string(rune('1'+i))})
		}
		if err := validateUpsert(req); err != nil {
			t.Fatalf("4 items es legal, got %v", err)
		}
	})

	t.Run("contacto vacio se rechaza", func(t *testing.T) {
		req := validRuleRequest()
		req.ContactName = ""
		if err := validateUpsert(req); !errors.Is(err, errContactRequired) {
			t.Fatalf("esperaba errContactRequired, got %v", err)
		}
	})

	t.Run("contacto de solo espacios se rechaza", func(t *testing.T) {
		req := validRuleRequest()
		req.ContactName = "   "
		if err := validateUpsert(req); !errors.Is(err, errContactRequired) {
			t.Fatalf("espacios no son contacto, got %v", err)
		}
	})

	t.Run("anclados sin consentimiento se rechaza", func(t *testing.T) {
		req := validRuleRequest()
		req.Items[0].AnchoredNote = "TV-99 en prestamo"
		if err := validateUpsert(req); !errors.Is(err, errAnchoredNotAccepted) {
			t.Fatalf("esperaba errAnchoredNotAccepted, got %v", err)
		}
	})

	t.Run("anclados con consentimiento pasan", func(t *testing.T) {
		req := validRuleRequest()
		req.Items[0].AnchoredNote = "TV-99 en prestamo"
		req.AnchoredAccepted = true
		if err := validateUpsert(req); err != nil {
			t.Fatalf("consentimiento explicito debe liberar, got %v", err)
		}
	})

	t.Run("anchoredNote de solo espacios no exige consentimiento", func(t *testing.T) {
		req := validRuleRequest()
		req.Items[0].AnchoredNote = "  \t "
		if err := validateUpsert(req); err != nil {
			t.Fatalf("nota vacia no es anclaje, got %v", err)
		}
	})
}

// TestIsUpsertRuleError: el handler depende de esta clasificación para
// decidir 400 (error del usuario) vs 500 (fallo real). Un error arbitrario
// nunca debe caer en el lado 400.
func TestIsUpsertRuleError(t *testing.T) {
	if !isUpsertRuleError(errNoItems) ||
		!isUpsertRuleError(errTooManyItems) ||
		!isUpsertRuleError(errContactRequired) ||
		!isUpsertRuleError(errAnchoredNotAccepted) {
		t.Fatal("los 4 sentinels de regla deben clasificarse como error de usuario")
	}
	if isUpsertRuleError(errors.New("fallo interno")) {
		t.Fatal("un error arbitrario no es violacion de regla")
	}
	if isUpsertRuleError(nil) {
		t.Fatal("nil no es violacion de regla")
	}
}
