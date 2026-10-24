package finance

import (
	"strings"
	"testing"
)

// F1/F2 — tests unitarios sin base de datos: parsing numérico del código de
// factura y la matriz de estados de pago (plan §F2.1 / §F2.3).

func TestParseInvoiceCodeNumeric(t *testing.T) {
	cases := []struct {
		code   string
		prefix string
		seq    int64
		ok     bool
	}{
		{"FAC-2026-31", "FAC-2026-", 31, true},
		{"FAC-2026-031", "FAC-2026-", 31, true},      // el frontend padea a 3 dígitos
		{"FAC-2026-000031", "FAC-2026-", 31, true},   // el test Playwright padea a 6: misma factura
		{"fac-2026-7", "FAC-2026-", 7, true},         // insensible a mayúsculas/minúsculas
		{"  FAC-2026-9  ", "FAC-2026-", 9, true},     // con espacios alrededor
		{"A-B-12", "A-B-", 12, true},                 // prefijos con varios guiones
		{"LARS-101", "LARS-", 101, true},             // formato legacy de la exportación Oasis

		// Inválidos: no parsean como código de factura.
		{"FAC-2026-", "", 0, false},     // termina en no-dígito
		{"", "", 0, false},              // vacío
		{"   ", "", 0, false},           // solo espacios
		{"12345", "", 0, false},         // todo dígito: sin separador de serie
		{"ABC", "", 0, false},           // sin dígito final
		{"FAC-2026-0", "", 0, false},    // secuencia cero es inválida
	}

	for _, tc := range cases {
		prefix, seq, ok := parseInvoiceCode(tc.code)
		if ok != tc.ok || prefix != tc.prefix || seq != tc.seq {
			t.Errorf("parseInvoiceCode(%q) = (%q, %d, %v), esperaba (%q, %d, %v)",
				tc.code, prefix, seq, ok, tc.prefix, tc.seq, tc.ok)
		}

		// seriesKey es la forma canónica que usan las consultas de emparejamiento:
		// sin guion final, en mayúsculas.
		if got := seriesKey(prefix); tc.ok && (got != strings.TrimRight(tc.prefix, "-")) {
			t.Errorf("seriesKey(%q) = %q, esperaba el prefijo sin separador final", prefix, got)
		}
	}
}

func TestDeriveInvoicePaymentStatusMatrix(t *testing.T) {
	const total = 1000000.0

	cases := []struct {
		name     string
		current  InvoiceStatus
		paid     float64
		total    float64
		expected InvoiceStatus
	}{
		// Sin pagos contables: los estados "inocentes" se mantienen...
		{"Borrador sin pagos se mantiene", InvoiceStatusDraft, 0, total, InvoiceStatusDraft},
		{"Pendiente sin pagos se mantiene", InvoiceStatusPending, 0, total, InvoiceStatusPending},
		{"Enviado sin pagos se mantiene", InvoiceStatusSent, 0, total, InvoiceStatusSent},

		// ...y los que afirmaban pago completo se degradan (F2: no puede quedar "Pagado" sin pagos).
		{"Pagado sin pagos contables baja a Pendiente", InvoiceStatusPaid, 0, total, InvoiceStatusPending},
		{"Pago parcial sin pagos contables baja a Pendiente", InvoiceStatusPartial, 0, total, InvoiceStatusPending},

		// Cancelado es inmutable bajo cualquier circunstancia.
		{"Cancelado nunca se toca (aunque haya 'pagos')", InvoiceStatusCancelled, total, total, InvoiceStatusCancelled},
		{"Cancelado sin pagos tampoco se toca", InvoiceStatusCancelled, 0, total, InvoiceStatusCancelled},

		// 0 < pagado < total → Pago parcial, desde cualquier estado no cancelado.
		{"Pago menor a total desde Borrador -> Pago parcial", InvoiceStatusDraft, 400000, total, InvoiceStatusPartial},
		{"Pago menor a total desde Enviado -> Pago parcial", InvoiceStatusSent, 500000, total, InvoiceStatusPartial},
		{"Pago menor a total degrada una factura Pagada a Pago parcial", InvoiceStatusPaid, 400000, total, InvoiceStatusPartial},

		// pagado >= total → Pagado.
		{"Pago completo desde Borrador -> Pagado", InvoiceStatusDraft, total, total, InvoiceStatusPaid},
		{"Sobre-pago (balance a cero) -> Pagado", InvoiceStatusPending, 1500000, total, InvoiceStatusPaid},

		// Fronteras de moneyEpsilon.
		{"Pago dentro del epsilon del total -> Pagado", InvoiceStatusPending, total - 0.005, total, InvoiceStatusPaid},
		{"Pago fuera del epsilon del total -> Pago parcial", InvoiceStatusDraft, total - 100, total, InvoiceStatusPartial},

		// Micro-montos bajo moneyEpsilon no cuentan como pago.
		{"Monto por debajo de moneyEpsilon no cuenta", InvoiceStatusDraft, 0.005, total, InvoiceStatusDraft},

		// Factura de valor cero con cualquier pago contable → Pagado.
		{"Total cero con pago contable -> Pagado", InvoiceStatusDraft, 500, 0, InvoiceStatusPaid},
	}

	for _, tc := range cases {
		if got := deriveInvoicePaymentStatus(tc.current, tc.paid, tc.total); got != tc.expected {
			t.Errorf("%s: derive(%q, %v, %v) = %q, esperaba %q",
				tc.name, tc.current, tc.paid, tc.total, got, tc.expected)
		}
	}
}

func TestOverbalanceErrorIsPaymentValidation(t *testing.T) {
	if errPaymentExceedsBalance == nil {
		t.Fatal("el error canónico de sobre-pago no puede ser nil")
	}
	if !isPaymentValidationError(errPaymentExceedsBalance) {
		t.Error("isPaymentValidationError debe reconocer el sobre-pago (mapa a HTTP 400 en el handler)")
	}
}
