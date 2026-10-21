package finance

import (
	"database/sql"
	"fmt"
	"sync"
	"testing"
	"time"
)

// FASE 6 — Consecutivos de factura generados en el servidor.
//
// Corren contra la base de desarrollo compartida (RUN_DB_TESTS=1), por eso
// cada test usa una empresa única y limpia también document_sequences.

func testConsecutivesCompany(t *testing.T, db *sql.DB) string {
	t.Helper()
	companyID := testCompany(t, db, "consec")
	t.Cleanup(func() {
		db.Exec(`DELETE FROM document_sequences WHERE company_id = $1`, companyID)
	})
	return companyID
}

func sampleInvoiceRequest() UpsertInvoiceRequest {
	now := time.Now().UTC().Format("2006-01-02")
	return UpsertInvoiceRequest{
		ClientID:     "cli-qa",
		ClientName:   "Cliente QA",
		IssueDate:    now,
		DueDate:      now,
		CurrencyCode: "COP",
		ExchangeRate: 1,
		Status:       InvoiceStatusDraft,
		TaxCalc:      "Sin impuesto",
		Items: []InvoiceItem{{
			ID:        "item-qa",
			Name:      "Servicio QA",
			Quantity:  1,
			UnitPrice: 100000,
			TaxRate:   0,
		}},
	}
}

func TestPeekInvoiceSequenceEmpty(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	year := fmt.Sprintf("%d", time.Now().UTC().Year())
	preview, err := s.PeekInvoiceSequence(companyID, "")
	if err != nil {
		t.Fatalf("PeekInvoiceSequence: %v", err)
	}
	if preview.SeriesPrefix != "FAC-"+year+"-" {
		t.Errorf("prefijo = %q, esperado %q", preview.SeriesPrefix, "FAC-"+year+"-")
	}
	if preview.SequenceNumber != 1 {
		t.Errorf("secuencia = %d, esperado 1", preview.SequenceNumber)
	}

	// El peek no consume: una segunda llamada devuelve el mismo valor.
	again, err := s.PeekInvoiceSequence(companyID, "")
	if err != nil {
		t.Fatalf("PeekInvoiceSequence (2da): %v", err)
	}
	if again != preview {
		t.Errorf("el peek está consumiendo: primera %+v, segunda %+v", preview, again)
	}
}

func TestCreateInvoiceAutoSequence(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	year := fmt.Sprintf("%d", time.Now().UTC().Year())

	first, err := s.CreateInvoice(companyID, sampleInvoiceRequest())
	if err != nil {
		t.Fatalf("CreateInvoice #1: %v", err)
	}
	if first.SequenceNumber != 1 {
		t.Errorf("primera secuencia = %d, esperado 1", first.SequenceNumber)
	}
	if first.SeriesPrefix != "FAC-"+year+"-" {
		t.Errorf("primer prefijo = %q, esperado FAC-%s-", first.SeriesPrefix, year)
	}

	second, err := s.CreateInvoice(companyID, sampleInvoiceRequest())
	if err != nil {
		t.Fatalf("CreateInvoice #2: %v", err)
	}
	if second.SequenceNumber != 2 {
		t.Errorf("segunda secuencia = %d, esperado 2", second.SequenceNumber)
	}
}

func TestCreateInvoiceExplicitSequencePreserved(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	req := sampleInvoiceRequest()
	req.SequenceNumber = 99 // override manual estilo Oasis
	explicit, err := s.CreateInvoice(companyID, req)
	if err != nil {
		t.Fatalf("CreateInvoice explicita: %v", err)
	}
	if explicit.SequenceNumber != 99 {
		t.Errorf("secuencia explícita = %d, esperado 99", explicit.SequenceNumber)
	}

	// La siguiente asignación automática debe saltar el override (auto-sanidad).
	next, err := s.CreateInvoice(companyID, sampleInvoiceRequest())
	if err != nil {
		t.Fatalf("CreateInvoice tras override: %v", err)
	}
	if next.SequenceNumber != 100 {
		t.Errorf("secuencia tras override = %d, esperado 100", next.SequenceNumber)
	}
}

func TestCreateInvoiceConcurrentDistinct(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testConsecutivesCompany(t, db)

	const workers = 8
	results := make([]int, workers)
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			invoice, err := s.CreateInvoice(companyID, sampleInvoiceRequest())
			if err != nil {
				t.Errorf("CreateInvoice #%d: %v", idx, err)
				return
			}
			results[idx] = invoice.SequenceNumber
		}(i)
	}
	wg.Wait()

	seen := map[int]bool{}
	for _, seq := range results {
		if seen[seq] {
			t.Errorf("secuencia duplicada %d en creaciones concurrentes: %v", seq, results)
			return
		}
		seen[seq] = true
	}
}
