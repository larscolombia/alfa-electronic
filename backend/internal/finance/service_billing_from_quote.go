package finance

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

// FASE 5b — Conversión cotización→factura y nota crédito.
//
// La cotización se lee por SQL directo desde internal/finance (mismo estilo
// del JOIN existente a crm_clients en GetOasisExport) en vez de inyectar el
// servicio de internal/crm/quotes: ese acoplamiento obligaría a cambiar el
// cableado de main.go, que está fuera del alcance de esta fase. Solo se leen
// las columnas necesarias de crm_quotes.

// quoteConversionRow es la proyección mínima de crm_quotes que necesita la
// conversión (no se importa el struct Quote de internal/crm/quotes).
type quoteConversionRow struct {
	ID              string
	Codigo          string
	Prospecto       string
	Empresa         string
	Correo          string
	Estado          string
	EstadoCliente   string
	Moneda          string
	DescuentoTipo   string
	DescuentoValor  float64
	LineasJSON      []byte
	Nota            string
	Terminos        string
	TaxMode         string
	PurchaseOrderNo string
	InvoiceID       sql.NullInt64
}

// quoteConversionLine replica la línea de cotización (lineas_json).
type quoteConversionLine struct {
	Servicio       string  `json:"servicio"`
	Descripcion    string  `json:"descripcion"`
	Cantidad       float64 `json:"cantidad"`
	Unidad         string  `json:"unidad"`
	PrecioUnitario float64 `json:"precioUnitario"`
	Impuesto       float64 `json:"impuesto"`
}

// ConvertQuoteToInvoice convierte una cotización aprobada/aceptada en una
// factura en borrador (source='quote'). Es idempotente: si la cotización ya
// tiene factura asociada devuelve esa factura junto con errQuoteAlreadyInvoiced
// (el handler responde 409 con la factura existente en el cuerpo, sin duplicar).
// El consecutivo y el prefijo de serie se generan en el servidor.
func (s *Service) ConvertQuoteToInvoice(companyID string, quoteID string, generatedBy string) (Invoice, error) {
	ctx := context.Background()
	normalizedQuoteID := strings.TrimSpace(quoteID)
	if normalizedQuoteID == "" {
		return Invoice{}, errQuoteIDRequired
	}

	// Idempotencia server-side: la fuente de verdad es finance_invoices
	// (source_quote_id), no la marca en la cotización.
	var existingID int64
	err := s.db.QueryRowContext(ctx, `
SELECT id
FROM finance_invoices
WHERE company_id = $1
  AND source_quote_id = $2
  AND document_type = 'factura'
  AND soft_delete = false
ORDER BY id
LIMIT 1;
`, companyID, normalizedQuoteID).Scan(&existingID)
	if err == nil {
		existing, getErr := s.GetInvoice(companyID, existingID)
		if getErr != nil {
			return Invoice{}, getErr
		}
		return existing, errQuoteAlreadyInvoiced
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Invoice{}, err
	}

	var quote quoteConversionRow
	err = s.db.QueryRowContext(ctx, `
SELECT id, codigo, prospecto, empresa, correo, estado, estado_cliente, moneda,
	descuento_tipo, descuento_valor, lineas_json, nota, terminos, tax_mode,
	purchase_order_number, invoice_id
FROM crm_quotes
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, normalizedQuoteID).Scan(
		&quote.ID, &quote.Codigo, &quote.Prospecto, &quote.Empresa, &quote.Correo,
		&quote.Estado, &quote.EstadoCliente, &quote.Moneda,
		&quote.DescuentoTipo, &quote.DescuentoValor, &quote.LineasJSON,
		&quote.Nota, &quote.Terminos, &quote.TaxMode,
		&quote.PurchaseOrderNo, &quote.InvoiceID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Invoice{}, errQuoteNotFound
		}
		return Invoice{}, err
	}

	// Solo cotizaciones aprobadas o aceptadas por el cliente.
	if !strings.EqualFold(quote.Estado, "Aprobado") && !strings.EqualFold(quote.EstadoCliente, "Aceptada") {
		return Invoice{}, errQuoteNotApprovable
	}

	lines := make([]quoteConversionLine, 0)
	if len(quote.LineasJSON) > 0 {
		if err := json.Unmarshal(quote.LineasJSON, &lines); err != nil {
			return Invoice{}, err
		}
	}
	items := make([]InvoiceItem, 0, len(lines))
	for _, line := range lines {
		name := strings.TrimSpace(line.Servicio)
		description := strings.TrimSpace(line.Descripcion)
		if name == "" {
			name = description
		}
		if name == "" && line.Cantidad <= 0 && line.PrecioUnitario <= 0 {
			continue
		}
		if name == "" {
			name = "Servicio cotizado"
		}
		unitLabel := strings.TrimSpace(line.Unidad)
		if unitLabel == "" {
			unitLabel = "Unidad"
		}
		items = append(items, InvoiceItem{
			ID:          fmt.Sprintf("quote-%s-line-%d", normalizedQuoteID, len(items)+1),
			Name:        name,
			Description: description,
			Quantity:    line.Cantidad,
			UnitLabel:   unitLabel,
			UnitPrice:   line.PrecioUnitario,
			TaxRate:     line.Impuesto,
		})
	}
	if len(items) == 0 {
		return Invoice{}, errQuoteLinesRequired
	}

	// Cliente: se intenta resolver contra crm_clients (empresa/NIT/correo) para
	// que la factura quede enlazada al mismo client_id que usa el export Oasis
	// ('crm-client-' || cc.id) y heredar dirección y plazo de pago.
	clientID := "crm-quote-" + normalizedQuoteID
	clientName := strings.TrimSpace(quote.Empresa)
	if clientName == "" {
		clientName = strings.TrimSpace(quote.Prospecto)
	}
	if clientName == "" {
		clientName = strings.TrimSpace(quote.Correo)
	}
	billingAddress := ""
	paymentTermDays := 30
	var matchedID, matchedName, matchedAddress string
	var matchedTerms int
	err = s.db.QueryRowContext(ctx, `
SELECT id, COALESCE(NULLIF(empresa, ''), nombre),
	TRIM(CONCAT_WS(' ', NULLIF(address, ''), NULLIF(city, ''), NULLIF(country, ''))),
	payment_term_days
FROM crm_clients
WHERE company_id = $1
  AND soft_delete = false
  AND (
		($2 <> '' AND LOWER(empresa) = LOWER($2))
		OR ($3 <> '' AND LOWER(correo) = LOWER($3))
  )
ORDER BY created_at
LIMIT 1;
`, companyID, strings.TrimSpace(quote.Empresa), strings.TrimSpace(quote.Correo)).Scan(
		&matchedID, &matchedName, &matchedAddress, &matchedTerms,
	)
	if err == nil && matchedID != "" {
		clientID = "crm-client-" + matchedID
		if matchedName != "" {
			clientName = matchedName
		}
		billingAddress = matchedAddress
		if matchedTerms > 0 {
			paymentTermDays = matchedTerms
		}
	} else if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return Invoice{}, err
	}
	if clientName == "" {
		clientName = "Cliente de cotizacion " + strings.TrimSpace(quote.Codigo)
	}

	discountMode := "percent"
	if strings.EqualFold(strings.TrimSpace(quote.DescuentoTipo), "COP") {
		discountMode = "amount"
	}
	taxCalculation := "Despues del descuento"
	if strings.EqualFold(strings.TrimSpace(quote.TaxMode), "before-discount") {
		taxCalculation = "Antes del descuento"
	}

	issueDate := time.Now().UTC()
	seriesPrefix, sequenceNumber, err := s.nextInvoiceSequence(ctx, companyID, issueDate)
	if err != nil {
		return Invoice{}, err
	}

	referenceCode := strings.TrimSpace(quote.PurchaseOrderNo)
	if referenceCode == "" {
		referenceCode = strings.TrimSpace(quote.Codigo)
	}

	payload := Invoice{
		ReferenceCode:  referenceCode,
		SeriesPrefix:   seriesPrefix,
		SequenceNumber: sequenceNumber,
		ClientID:       clientID,
		ClientName:     clientName,
		BillingAddress: billingAddress,
		IssueDate:      issueDate.Format("2006-01-02"),
		DueDate:        issueDate.AddDate(0, 0, paymentTermDays).Format("2006-01-02"),
		CurrencyCode:   strings.ToUpper(strings.TrimSpace(quote.Moneda)),
		ExchangeRate:   1,
		TaxCalc:        taxCalculation,
		GeneratedBy:    strings.TrimSpace(generatedBy),
		Items:          items,
		DiscountValue:  quote.DescuentoValor,
		DiscountMode:   discountMode,
		// Borrador: la factura convertida se puede revisar/ajustar hasta que se
		// emite (Enviado/Pagado), momento en el que se bloquea.
		Status:        InvoiceStatusDraft,
		Note:          quote.Nota,
		Terms:         quote.Terminos,
		Source:        "quote",
		SourceQuoteID: normalizedQuoteID,
		DocumentType:  "factura",
	}

	created, err := s.CreateInvoice(companyID, payload)
	if err != nil {
		return Invoice{}, err
	}

	// Marca la cotización como facturada (campo añadido por la migración 5b).
	if _, err := s.db.ExecContext(ctx, `
UPDATE crm_quotes
SET invoice_id = $1,
	invoiced_at = NOW(),
	updated_at = NOW()
WHERE company_id = $2
  AND id = $3;
`, created.ID, companyID, normalizedQuoteID); err != nil {
		return Invoice{}, err
	}

	return created, nil
}

// nextInvoiceSequence genera el consecutivo server-side (FASE 6): asignación
// atómica por empresa y año en document_sequences con auto-sanación contra el
// MAX(sequence_number) real; el prefijo de serie se resuelve desde la
// configuración o la factura más reciente (por defecto "FAC-<año>-").
func (s *Service) nextInvoiceSequence(ctx context.Context, companyID string, issueDate time.Time) (string, int, error) {
	sequence, err := allocateInvoiceSequence(ctx, s.db, companyID, strconv.Itoa(issueDate.Year()))
	if err != nil {
		return "", 0, err
	}
	prefix, err := resolveInvoiceSeriesPrefix(ctx, s.db, companyID, issueDate)
	if err != nil {
		return "", 0, err
	}
	return prefix, sequence, nil
}

// CreateCreditNote emite una nota crédito contra una factura existente
// (document_type='nota_credito', credit_note_ref=factura origen) y ajusta el
// balance_amount de la factura origen en la misma transacción. Reglas:
//   - solo contra facturas (no contra otras notas crédito) no canceladas;
//   - el valor no puede exceder el saldo pendiente de la factura origen;
//   - la nota crédito nace aplicada (estado Pagado ⇒ locked: no tiene reversa);
//   - la factura origen queda 'Pagado' si el saldo llega a 0, o 'Pago parcial'
//     si queda saldo (y por tanto bloqueada: ya fue emitida/ajustada).
func (s *Service) CreateCreditNote(companyID string, generatedBy string, req CreditNoteRequest) (Invoice, error) {
	ctx := context.Background()
	if req.InvoiceID <= 0 {
		return Invoice{}, errCreditNoteInvoiceRequired
	}
	if !(req.Amount > 0) {
		return Invoice{}, errCreditNoteAmountInvalid
	}
	issueDate := strings.TrimSpace(req.IssueDate)
	if issueDate == "" {
		issueDate = time.Now().UTC().Format("2006-01-02")
	} else if _, err := time.Parse("2006-01-02", issueDate); err != nil {
		return Invoice{}, errCreditNoteDateInvalid
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Invoice{}, err
	}
	defer func() { _ = tx.Rollback() }()

	var origin Invoice
	row := tx.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_invoices
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false
FOR UPDATE;
`, invoiceSelectColumns), companyID, req.InvoiceID)
	origin, err = scanInvoice(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Invoice{}, errInvoiceNotFound
		}
		return Invoice{}, err
	}
	if origin.DocumentType != "factura" || origin.Status == InvoiceStatusCancelled {
		return Invoice{}, errCreditNoteDocumentInvalid
	}
	// Tolerancia de medio centavo por redondeos NUMERIC(14,2).
	if req.Amount > origin.BalanceAmount+0.005 {
		return Invoice{}, errCreditNoteExceedsBalance
	}

	amount := roundMoney(req.Amount)
	description := strings.TrimSpace(req.Note)
	if description == "" {
		description = fmt.Sprintf("Nota credito contra factura %s%03d", origin.SeriesPrefix, origin.SequenceNumber)
	}

	payload := Invoice{
		ReferenceCode:  origin.ReferenceCode,
		SeriesPrefix:   creditNoteSeriesPrefix(origin.SeriesPrefix),
		SequenceNumber: origin.SequenceNumber, // se recalcula abajo con el consecutivo real
		ProjectID:      origin.ProjectID,
		ProjectName:    origin.ProjectName,
		ClientID:       origin.ClientID,
		ClientName:     origin.ClientName,
		BillingAddress: origin.BillingAddress,
		ShippingAddr:   origin.ShippingAddr,
		IssueDate:      issueDate,
		DueDate:        issueDate,
		CurrencyCode:   origin.CurrencyCode,
		ExchangeRate:   origin.ExchangeRate,
		BankAccountID:  origin.BankAccountID,
		BankAccount:    origin.BankAccount,
		TaxCalc:        "Sin impuesto",
		GeneratedBy:    strings.TrimSpace(generatedBy),
		Items: []InvoiceItem{{
			ID:          fmt.Sprintf("credit-note-%d-1", origin.ID),
			Name:        "Nota credito",
			Description: description,
			Quantity:    1,
			UnitLabel:   "Unidad",
			UnitPrice:   amount,
			TaxRate:     0,
		}},
		DiscountValue: 0,
		DiscountMode:  "percent",
		// Nace aplicada: estado Pagado ⇒ locked=true (sin reversa).
		Status:        InvoiceStatusPaid,
		PaidAmount:    amount,
		BalanceAmount: 0,
		Note:          strings.TrimSpace(req.Note),
		Terms:         origin.Terms,
		Source:        "manual",
		DocumentType:  "nota_credito",
		CreditNoteRef: &origin.ID,
	}

	// FASE 6: asignación atómica dentro de la transacción (mismo helper que
	// CreateInvoice); issueDate ya fue validado como YYYY-MM-DD arriba.
	issueTime, _ := time.Parse("2006-01-02", issueDate)
	nextSequence, err := allocateInvoiceSequence(ctx, tx, companyID, strconv.Itoa(issueTime.Year()))
	if err != nil {
		return Invoice{}, err
	}
	payload.SequenceNumber = nextSequence

	itemsRaw, err := json.Marshal(payload.Items)
	if err != nil {
		return Invoice{}, err
	}
	normalized, err := normalizeInvoice(payload)
	if err != nil {
		return Invoice{}, err
	}

	creditNoteID, err := insertInvoice(ctx, tx, companyID, normalized, itemsRaw)
	if err != nil {
		return Invoice{}, err
	}

	// Ajusta el saldo de la factura origen y su estado/lockeo.
	newBalance := roundMoney(origin.BalanceAmount - amount)
	if newBalance < 0 {
		newBalance = 0
	}
	newStatus := string(InvoiceStatusPartial)
	if newBalance <= 0 {
		newStatus = string(InvoiceStatusPaid)
	}
	if origin.Status == InvoiceStatusPaid {
		// Una factura ya pagada no retrocede a 'Pago parcial' por una NC de
		// valor 0 efectivo; se conserva 'Pagado'.
		newStatus = string(InvoiceStatusPaid)
	}
	if _, err := tx.ExecContext(ctx, `
UPDATE finance_invoices
SET balance_amount = $1,
	status = $2,
	locked = $3,
	updated_at = NOW()
WHERE company_id = $4
  AND id = $5
  AND soft_delete = false;
`, newBalance, newStatus, isInvoiceStatusLocked(InvoiceStatus(newStatus)), companyID, origin.ID); err != nil {
		return Invoice{}, err
	}

	if err := tx.Commit(); err != nil {
		return Invoice{}, err
	}

	return s.GetInvoice(companyID, creditNoteID)
}

// creditNoteSeriesPrefix deriva la serie de la nota crédito: "NC-" delante de
// la serie de la factura origen (o "NC-" si la factura no tenía serie).
func creditNoteSeriesPrefix(originPrefix string) string {
	prefix := strings.TrimSpace(originPrefix)
	if prefix == "" {
		return "NC-"
	}
	if strings.HasPrefix(strings.ToUpper(prefix), "NC-") {
		return prefix
	}
	trimmed := "NC-" + prefix
	if len(trimmed) > 40 {
		trimmed = trimmed[:40]
	}
	return trimmed
}

func roundMoney(value float64) float64 {
	scaled := value * 100
	if scaled < 0 {
		scaled -= 0.5
	} else {
		scaled += 0.5
	}
	return float64(int64(scaled)) / 100
}
