package finance

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"
)

// FASE 5b — Tests de integración contra Postgres real (RUN_DB_TESTS=1).
// Reutiliza openTestDB/testCompany de service_gaps_db_test.go.

func seedQuote5b(t *testing.T, db *sql.DB, companyID, quoteID, estado, estadoCliente, empresa, correo string) {
	t.Helper()
	t.Cleanup(func() {
		if _, err := db.Exec(`DELETE FROM crm_quotes WHERE company_id = $1 AND id = $2`, companyID, quoteID); err != nil {
			t.Logf("cleanup crm_quotes %s: %v", quoteID, err)
		}
	})

	_, err := db.Exec(`
INSERT INTO crm_quotes (
	company_id, id, token, codigo, prospecto, empresa, correo,
	estado, estado_cliente, moneda, descuento_tipo, descuento_valor,
	lineas_json, tax_mode, subtotal, tax_total, total
)
VALUES (
	$1, $2, $3, $4, 'Contacto Prueba 5b', $5, $6,
	$7, $8, 'COP', '%', 10,
	'[{"servicio":"Reparacion","descripcion":"Cambio de fuente","cantidad":2,"unidad":"Servicio","precioUnitario":500000,"impuesto":19}]',
	'after-discount', 1000000, 171000, 1071000
);
`, companyID, quoteID, "tok-"+quoteID, "COT-5B-"+quoteID, empresa, correo, estado, estadoCliente)
	if err != nil {
		t.Fatalf("seed crm_quotes %s: %v", quoteID, err)
	}
}

func TestConvertQuoteToInvoice5b(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "conv5b")

	quoteID := fmt.Sprintf("q5b-aprobada-%d", time.Now().UnixNano())
	seedQuote5b(t, db, companyID, quoteID, "Aprobado", "Pendiente", "Empresa Prueba 5b", "prueba5b@example.com")

	invoice, err := s.ConvertQuoteToInvoice(companyID, quoteID, "tester@alfa.local")
	if err != nil {
		t.Fatalf("ConvertQuoteToInvoice: %v", err)
	}

	// Totales recalculados server-side: subtotal 1.000.000, descuento 10%
	// (100.000), IVA 19% sobre 900.000 = 171.000, total 1.071.000.
	if invoice.Subtotal != 1000000 {
		t.Errorf("Subtotal = %v, esperaba 1000000", invoice.Subtotal)
	}
	if invoice.TaxTotal != 171000 {
		t.Errorf("TaxTotal = %v, esperaba 171000", invoice.TaxTotal)
	}
	if invoice.Total != 1071000 {
		t.Errorf("Total = %v, esperaba 1071000", invoice.Total)
	}
	if invoice.BalanceAmount != 1071000 || invoice.PaidAmount != 0 {
		t.Errorf("Balance/Paid = %v/%v, esperaba 1071000/0", invoice.BalanceAmount, invoice.PaidAmount)
	}
	if invoice.Source != "quote" || invoice.SourceQuoteID != quoteID {
		t.Errorf("Source/SourceQuoteID = %q/%q", invoice.Source, invoice.SourceQuoteID)
	}
	if invoice.DocumentType != "factura" {
		t.Errorf("DocumentType = %q, esperaba factura", invoice.DocumentType)
	}
	if invoice.Status != InvoiceStatusDraft || invoice.Locked {
		t.Errorf("Status/Locked = %v/%v, esperaba Borrador/false", invoice.Status, invoice.Locked)
	}
	if invoice.CurrencyCode != "COP" || invoice.DiscountMode != "percent" || invoice.DiscountValue != 10 {
		t.Errorf("moneda/descuento no mapeados: %+v", invoice)
	}
	if invoice.TaxCalc != "Despues del descuento" {
		t.Errorf("TaxCalc = %q", invoice.TaxCalc)
	}
	if invoice.ClientName != "Empresa Prueba 5b" {
		t.Errorf("ClientName = %q", invoice.ClientName)
	}
	if invoice.GeneratedBy != "tester@alfa.local" {
		t.Errorf("GeneratedBy = %q, esperaba la identidad del JWT", invoice.GeneratedBy)
	}
	if invoice.SequenceNumber < 1 || invoice.SeriesPrefix == "" {
		t.Errorf("consecutivo server-side invalido: %q%d", invoice.SeriesPrefix, invoice.SequenceNumber)
	}
	if len(invoice.Items) != 1 {
		t.Fatalf("Items = %d, esperaba 1", len(invoice.Items))
	}
	item := invoice.Items[0]
	if item.Name != "Reparacion" || item.Quantity != 2 || item.UnitPrice != 500000 || item.TaxRate != 19 {
		t.Errorf("linea no mapeada: %+v", item)
	}
	if item.UnitLabel != "Servicio" || item.Description != "Cambio de fuente" {
		t.Errorf("unidad/descripcion no mapeadas: %+v", item)
	}

	// La cotización queda marcada como facturada.
	var markedInvoiceID sql.NullInt64
	var invoicedAt sql.NullTime
	if err := db.QueryRow(`SELECT invoice_id, invoiced_at FROM crm_quotes WHERE company_id = $1 AND id = $2`, companyID, quoteID).Scan(&markedInvoiceID, &invoicedAt); err != nil {
		t.Fatalf("leer marca de facturacion: %v", err)
	}
	if !markedInvoiceID.Valid || markedInvoiceID.Int64 != invoice.ID {
		t.Errorf("crm_quotes.invoice_id = %v, esperaba %d", markedInvoiceID, invoice.ID)
	}
	if !invoicedAt.Valid {
		t.Errorf("crm_quotes.invoiced_at quedo NULL")
	}

	// Idempotencia: convertir dos veces no duplica; devuelve la existente.
	again, err := s.ConvertQuoteToInvoice(companyID, quoteID, "tester@alfa.local")
	if !errors.Is(err, errQuoteAlreadyInvoiced) {
		t.Fatalf("segunda conversion err = %v, esperaba errQuoteAlreadyInvoiced", err)
	}
	if again.ID != invoice.ID {
		t.Errorf("segunda conversion devolvio la factura %d, esperaba %d", again.ID, invoice.ID)
	}
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM finance_invoices WHERE company_id = $1 AND source_quote_id = $2`, companyID, quoteID).Scan(&count); err != nil {
		t.Fatalf("contar facturas de la cotizacion: %v", err)
	}
	if count != 1 {
		t.Errorf("COUNT(facturas por cotizacion) = %d, esperaba 1", count)
	}

	// Cotización no aprobada: rechazo.
	draftQuoteID := fmt.Sprintf("q5b-borrador-%d", time.Now().UnixNano())
	seedQuote5b(t, db, companyID, draftQuoteID, "Borrador", "Pendiente", "Empresa Prueba 5b", "prueba5b@example.com")
	if _, err := s.ConvertQuoteToInvoice(companyID, draftQuoteID, "tester@alfa.local"); !errors.Is(err, errQuoteNotApprovable) {
		t.Errorf("borrador: err = %v, esperaba errQuoteNotApprovable", err)
	}

	// Cotización aceptada por el cliente (aún en estado Enviado): convertible.
	acceptedQuoteID := fmt.Sprintf("q5b-aceptada-%d", time.Now().UnixNano())
	seedQuote5b(t, db, companyID, acceptedQuoteID, "Enviado", "Aceptada", "Empresa Prueba 5b", "prueba5b@example.com")
	acceptedInvoice, err := s.ConvertQuoteToInvoice(companyID, acceptedQuoteID, "tester@alfa.local")
	if err != nil {
		t.Fatalf("conversion de aceptada: %v", err)
	}
	if acceptedInvoice.SequenceNumber <= invoice.SequenceNumber {
		t.Errorf("consecutivo no avanzo: %d tras %d", acceptedInvoice.SequenceNumber, invoice.SequenceNumber)
	}

	// Cotización inexistente: 404 de servicio.
	if _, err := s.ConvertQuoteToInvoice(companyID, "no-existe", "tester@alfa.local"); !errors.Is(err, errQuoteNotFound) {
		t.Errorf("inexistente: err = %v, esperaba errQuoteNotFound", err)
	}
}

func sampleInvoice5b(clientID, clientName string, status InvoiceStatus, total float64) UpsertInvoiceRequest {
	today := time.Now().UTC().Format("2006-01-02")
	due := time.Now().UTC().AddDate(0, 0, 30).Format("2006-01-02")
	return UpsertInvoiceRequest{
		ClientID:       clientID,
		ClientName:     clientName,
		SeriesPrefix:   "FAC-TEST-",
		SequenceNumber: 1,
		IssueDate:      today,
		DueDate:        due,
		CurrencyCode:   "COP",
		ExchangeRate:   1,
		TaxCalc:        "Sin impuesto",
		Items: []InvoiceItem{{
			ID: "item-5b-1", Name: "Servicio tecnico", Quantity: 1,
			UnitLabel: "Unidad", UnitPrice: total, TaxRate: 0,
		}},
		DiscountMode: "percent",
		Status:       status,
		Source:       "manual",
	}
}

func TestCreditNote5b(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "nc5b")

	origin, err := s.CreateInvoice(companyID, sampleInvoice5b("c-nc", "Cliente NC 5b", InvoiceStatusPending, 1000000))
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}
	if origin.Total != 1000000 || origin.BalanceAmount != 1000000 || origin.Locked {
		t.Fatalf("factura origen inesperada: %+v", origin)
	}

	// Nota crédito parcial: ajusta el saldo y bloquea la factura origen.
	note, err := s.CreateCreditNote(companyID, "tester@alfa.local", CreditNoteRequest{InvoiceID: origin.ID, Amount: 400000, Note: "Descuento postventa"})
	if err != nil {
		t.Fatalf("CreateCreditNote: %v", err)
	}
	if note.DocumentType != "nota_credito" {
		t.Errorf("DocumentType = %q", note.DocumentType)
	}
	if note.CreditNoteRef == nil || *note.CreditNoteRef != origin.ID {
		t.Errorf("CreditNoteRef = %v, esperaba %d", note.CreditNoteRef, origin.ID)
	}
	if note.Total != 400000 || note.BalanceAmount != 0 {
		t.Errorf("NC Total/Balance = %v/%v", note.Total, note.BalanceAmount)
	}
	if note.Status != InvoiceStatusPaid || !note.Locked {
		t.Errorf("NC nace aplicada: Status/Locked = %v/%v", note.Status, note.Locked)
	}

	adjusted, err := s.GetInvoice(companyID, origin.ID)
	if err != nil {
		t.Fatalf("GetInvoice tras NC: %v", err)
	}
	if adjusted.BalanceAmount != 600000 {
		t.Errorf("BalanceAmount = %v, esperaba 600000", adjusted.BalanceAmount)
	}
	if adjusted.Status != InvoiceStatusPartial || !adjusted.Locked {
		t.Errorf("Status/Locked = %v/%v, esperaba 'Pago parcial'/true", adjusted.Status, adjusted.Locked)
	}

	// No puede exceder el saldo pendiente.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: origin.ID, Amount: 700000}); !errors.Is(err, errCreditNoteExceedsBalance) {
		t.Errorf("exceder saldo: err = %v, esperaba errCreditNoteExceedsBalance", err)
	}
	// Valor inválido.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: origin.ID, Amount: 0}); !errors.Is(err, errCreditNoteAmountInvalid) {
		t.Errorf("monto 0: err = %v, esperaba errCreditNoteAmountInvalid", err)
	}
	// Factura inexistente.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: 99999999, Amount: 10}); !errors.Is(err, errInvoiceNotFound) {
		t.Errorf("inexistente: err = %v, esperaba errInvoiceNotFound", err)
	}
	// NC contra NC: rechazada.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: note.ID, Amount: 10}); !errors.Is(err, errCreditNoteDocumentInvalid) {
		t.Errorf("NC contra NC: err = %v, esperaba errCreditNoteDocumentInvalid", err)
	}

	// NC por el saldo restante: la factura origen queda Pagado y con saldo 0.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: origin.ID, Amount: 600000}); err != nil {
		t.Fatalf("NC final: %v", err)
	}
	final, err := s.GetInvoice(companyID, origin.ID)
	if err != nil {
		t.Fatalf("GetInvoice final: %v", err)
	}
	if final.BalanceAmount != 0 || final.Status != InvoiceStatusPaid {
		t.Errorf("saldo final = %v (status %v), esperaba 0/Pagado", final.BalanceAmount, final.Status)
	}
	// Sin saldo pendiente no hay más notas crédito.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: origin.ID, Amount: 1}); !errors.Is(err, errCreditNoteExceedsBalance) {
		t.Errorf("NC sin saldo: err = %v, esperaba errCreditNoteExceedsBalance", err)
	}
}

func TestLockedInvoice5b(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "lock5b")

	// Factura enviada: nace bloqueada.
	sent, err := s.CreateInvoice(companyID, sampleInvoice5b("c-lock", "Cliente Lock 5b", InvoiceStatusSent, 500000))
	if err != nil {
		t.Fatalf("CreateInvoice Enviado: %v", err)
	}
	if !sent.Locked {
		t.Fatalf("factura Enviado no quedo bloqueada: %+v", sent)
	}

	// PUT sobre bloqueada → errInvoiceLocked (el handler responde 409).
	payload := sent
	payload.Note = "intento de edicion"
	if _, err := s.UpdateInvoice(companyID, sent.ID, payload); !errors.Is(err, errInvoiceLocked) {
		t.Errorf("UpdateInvoice: err = %v, esperaba errInvoiceLocked", err)
	}
	// DELETE sobre bloqueada → errInvoiceLocked (409), sin borrar.
	deleted, err := s.DeleteInvoice(companyID, sent.ID)
	if !errors.Is(err, errInvoiceLocked) {
		t.Errorf("DeleteInvoice: err = %v, esperaba errInvoiceLocked", err)
	}
	if deleted {
		t.Errorf("DeleteInvoice borro una factura bloqueada")
	}
	stillThere, err := s.GetInvoice(companyID, sent.ID)
	if err != nil || stillThere.ID != sent.ID {
		t.Errorf("la factura bloqueada desaparecio: %v", err)
	}

	// Borrador editable; al pasar a Enviado se bloquea.
	draft, err := s.CreateInvoice(companyID, sampleInvoice5b("c-draft", "Cliente Draft 5b", InvoiceStatusDraft, 300000))
	if err != nil {
		t.Fatalf("CreateInvoice Borrador: %v", err)
	}
	if draft.Locked {
		t.Fatalf("borrador nacio bloqueado: %+v", draft)
	}
	draftUpdate := draft
	draftUpdate.Note = "nota editable"
	if _, err := s.UpdateInvoice(companyID, draft.ID, draftUpdate); err != nil {
		t.Fatalf("UpdateInvoice sobre borrador: %v", err)
	}
	emit := draftUpdate
	emit.Status = InvoiceStatusSent
	emitted, err := s.UpdateInvoice(companyID, draft.ID, emit)
	if err != nil {
		t.Fatalf("emitir borrador: %v", err)
	}
	if !emitted.Locked {
		t.Errorf("al pasar a Enviado no se bloqueo: %+v", emitted)
	}
	if _, err := s.UpdateInvoice(companyID, draft.ID, emitted); !errors.Is(err, errInvoiceLocked) {
		t.Errorf("segunda edicion: err = %v, esperaba errInvoiceLocked", err)
	}

	// El número externo Oasis es editable mientras no esté bloqueada.
	ext := sampleInvoice5b("c-ext", "Cliente Ext 5b", InvoiceStatusDraft, 200000)
	ext.ExternalNumber = "OAS-000123"
	ext.SequenceNumber = 77
	createdExt, err := s.CreateInvoice(companyID, ext)
	if err != nil {
		t.Fatalf("CreateInvoice con external: %v", err)
	}
	if createdExt.ExternalNumber != "OAS-000123" {
		t.Errorf("ExternalNumber = %q", createdExt.ExternalNumber)
	}
	updateExt := createdExt
	updateExt.ExternalNumber = "OAS-000456"
	updatedExt, err := s.UpdateInvoice(companyID, createdExt.ID, updateExt)
	if err != nil {
		t.Fatalf("UpdateInvoice external: %v", err)
	}
	if updatedExt.ExternalNumber != "OAS-000456" {
		t.Errorf("ExternalNumber tras update = %q", updatedExt.ExternalNumber)
	}
}

func TestOasisExportFiscal5b(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "oasis5b")

	clientID := fmt.Sprintf("cli5b-%d", time.Now().UnixNano())
	if _, err := db.Exec(`
INSERT INTO crm_clients (
	company_id, id, nombre, correo, empresa, nit, zona, estado,
	office_phone, country, city, address,
	dv, postal_code, billing_email, grand_contributor, id_type
)
VALUES ($1, $2, 'Contacto Fiscal', 'general@fiscal5b.example', 'Fiscal 5b SAS', '900123456-7', 'Zona Centro', 'Activo',
	'6011234567', 'Colombia', 'Bogota', 'Calle 1 #2-3',
	'8', '110111', 'facturacion@fiscal5b.example', true, 'CE');
`, companyID, clientID); err != nil {
		t.Fatalf("seed crm_clients: %v", err)
	}

	invoice, err := s.CreateInvoice(companyID, sampleInvoice5b("crm-client-"+clientID, "Fiscal 5b SAS", InvoiceStatusPending, 800000))
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}
	upd := invoice
	upd.ExternalNumber = "OAS-999"
	if _, err := s.UpdateInvoice(companyID, invoice.ID, upd); err != nil {
		t.Fatalf("UpdateInvoice external: %v", err)
	}

	records, err := s.GetOasisExport(companyID, OasisExportQuery{})
	if err != nil {
		t.Fatalf("GetOasisExport: %v", err)
	}
	if len(records) != 1 {
		t.Fatalf("records = %d, esperaba 1", len(records))
	}
	record := records[0]
	if record.InvoiceNumber != "OAS-999" {
		t.Errorf("InvoiceNumber = %q, esperaba el numero externo OAS-999", record.InvoiceNumber)
	}
	if record.BuyerIDType != "CE" {
		t.Errorf("BuyerIDType = %q, esperaba CE", record.BuyerIDType)
	}
	if record.BuyerNIT != "900123456" || record.BuyerDV != "8" {
		t.Errorf("NIT/DV = %q/%q, esperaba 900123456/8 (DV explicito manda)", record.BuyerNIT, record.BuyerDV)
	}
	if record.BuyerPostalCode != "110111" {
		t.Errorf("BuyerPostalCode = %q", record.BuyerPostalCode)
	}
	if record.BuyerBillingEmail != "facturacion@fiscal5b.example" {
		t.Errorf("BuyerBillingEmail = %q, esperaba el correo de facturacion electronica", record.BuyerBillingEmail)
	}

	// Una nota crédito contra esa factura NO entra en el export 961.
	if _, err := s.CreateCreditNote(companyID, "tester", CreditNoteRequest{InvoiceID: invoice.ID, Amount: 100000}); err != nil {
		t.Fatalf("CreateCreditNote: %v", err)
	}
	recordsAfter, err := s.GetOasisExport(companyID, OasisExportQuery{})
	if err != nil {
		t.Fatalf("GetOasisExport tras NC: %v", err)
	}
	if len(recordsAfter) != 1 {
		t.Errorf("records tras NC = %d, esperaba 1 (solo facturas)", len(recordsAfter))
	}
}
