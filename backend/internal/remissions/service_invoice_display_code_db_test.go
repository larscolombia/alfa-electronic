package remissions

import (
	"database/sql"
	"strings"
	"testing"
)

// seedSeriesInvoice crea una factura como las que nacen de cotización:
// reference_code = código COT-* (es lo que hoy service_billing_from_quote.go)
// y serie/consecutivo reales. El despacho debe mostrar el número FAC-*, no el
// COT-*: es el número que la sincronización de pagos resuelve y el que el
// usuario reconoce como factura.
func seedSeriesInvoice(t *testing.T, db *sql.DB, companyID, clientID, reference, series string, seq int, external string, status string) int64 {
	t.Helper()
	var id int64
	err := db.QueryRow(`
INSERT INTO finance_invoices (
	company_id, client_id, client_name, reference_code, series_prefix, sequence_number,
	external_number, document_type, issue_date, currency_code, subtotal, tax_total,
	total, paid_amount, balance_amount, status, soft_delete, created_at, updated_at
) VALUES ($1, $2, 'Cliente QA', $3, $4, $5, NULLIF($6, ''), 'factura',
	CURRENT_DATE, 'COP', 100000::numeric, 0::numeric, 100000::numeric,
	CASE WHEN $7::text = 'Pagado' THEN 100000::numeric ELSE 0::numeric END,
	CASE WHEN $7::text = 'Pagado' THEN 0::numeric ELSE 100000::numeric END,
	$7::text, false, NOW(), NOW())
RETURNING id`, companyID, clientID, reference, series, seq, external, status).Scan(&id)
	if err != nil {
		t.Fatalf("sembrar factura con serie: %v", err)
	}
	return id
}

// Regresión t15: el selector "Vincular factura" y el indicador del despacho
// mostraban el reference_code (código COT-* en facturas de cotización) en vez
// del número real de la factura (serie+consecutivo).
func TestInvoiceOptionsShowsSeriesNumberNotQuoteReference(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "gate-display-code")

	clientID := seedClient(t, db, companyID, "900123456", "Cliente Demo", false)
	fromQuote := seedSeriesInvoice(t, db, companyID, "crm-client-"+clientID, "COT-QA-0001", "FAC-2026-", 61, "", InvoiceStatusPaid)
	withExternal := seedSeriesInvoice(t, db, companyID, clientID, "COT-QA-0002", "FAC-2026-", 62, "FV-EXTERNA-77", "Pendiente")
	legacy := seedInvoice(t, db, companyID, clientID, "Pendiente", 500000)

	r := createRemission(t, s, companyID, contraEntrega)

	options, err := s.InvoiceOptions(companyID, r.ID)
	if err != nil {
		t.Fatalf("InvoiceOptions: %v", err)
	}
	byID := make(map[int64]string, len(options))
	for _, o := range options {
		byID[o.ID] = o.ReferenceCode
	}
	if got := byID[fromQuote]; got != "FAC-2026-000061" {
		t.Errorf("factura de cotización: referenceCode = %q, esperaba %q (número de serie, no el COT-*)", got, "FAC-2026-000061")
	}
	if got := byID[withExternal]; got != "FV-EXTERNA-77" {
		t.Errorf("factura con número externo: referenceCode = %q, esperaba %q (el external_number tiene prioridad)", got, "FV-EXTERNA-77")
	}
	if got := byID[legacy]; strings.TrimSpace(got) == "" {
		t.Error("factura legacy sin serie: referenceCode vacío, se esperaba el reference_code como último recurso")
	}

	// Al vincular, la remisión debe exponer el mismo número en invoiceReference
	// (es lo que el indicador "Factura X: Pagado" renderiza).
	linked, err := s.LinkInvoice(companyID, r.ID, invoiceIDPtr(fromQuote))
	if err != nil {
		t.Fatalf("LinkInvoice: %v", err)
	}
	if linked.InvoiceReference != "FAC-2026-000061" {
		t.Errorf("invoiceReference tras vincular = %q, esperaba %q", linked.InvoiceReference, "FAC-2026-000061")
	}
	// El código de referencia crudo (COT-*) viaja aparte para que la UI pueda
	// mostrar ambos: número oficial para pagar + referencia del documento origen.
	if linked.InvoiceReferenceCode != "COT-QA-0001" {
		t.Errorf("invoiceReferenceCode tras vincular = %q, esperaba %q", linked.InvoiceReferenceCode, "COT-QA-0001")
	}
}
