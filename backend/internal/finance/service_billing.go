package finance

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

const invoiceSelectColumns = `id, reference_code, series_prefix, sequence_number, project_id, project_name, client_id, client_name,
	billing_address, shipping_address, issue_date, due_date, currency_code, exchange_rate, bank_account_id, bank_account_name,
	tax_calculation, generated_by, items_json, discount_value, discount_mode, subtotal, tax_total, total,
	paid_amount, balance_amount, status, note, terms, attachment_name, received_payment, source,
	COALESCE(external_number, ''), document_type, credit_note_ref, locked, COALESCE(source_quote_id, ''), created_at, updated_at`

const recurringSelectColumns = `id, client_id, client_name, project_id, project_name, currency_code, tax_calculation,
	bank_account_id, bank_account_name, frequency, start_date, next_issue_date, cycles, allow_client_stop,
	show_shipping_address, generated_by, items_json, discount_value, discount_mode, subtotal, tax_total, total,
	status, note, terms, created_at, updated_at`

func (s *Service) ListInvoices(companyID string, query ListInvoicesQuery) ([]Invoice, error) {
	ctx := context.Background()
	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxInvoicesListLimit {
		limit = maxInvoicesListLimit
	}

	filters := []string{"company_id = $1", "soft_delete = false"}
	args := []any{companyID}
	nextArg := 2

	status := normalizeInvoiceStatus(query.Status)
	if strings.TrimSpace(query.Status) != "" {
		if status == "" {
			return nil, errInvoiceStatusInvalid
		}
		filters = append(filters, fmt.Sprintf("status = $%d", nextArg))
		args = append(args, status)
		nextArg++
	}

	statement := fmt.Sprintf(`
SELECT %s
FROM finance_invoices
WHERE %s
ORDER BY created_at DESC
`, invoiceSelectColumns, strings.Join(filters, " AND "))
	if limit > 0 {
		statement += fmt.Sprintf("LIMIT $%d", nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Invoice, 0)
	for rows.Next() {
		item, scanErr := scanInvoice(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) GetInvoice(companyID string, invoiceID int64) (Invoice, error) {
	ctx := context.Background()
	if invoiceID <= 0 {
		return Invoice{}, errInvoiceIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_invoices
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, invoiceSelectColumns), companyID, invoiceID)

	item, err := scanInvoice(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Invoice{}, errInvoiceNotFound
		}
		return Invoice{}, err
	}

	return item, nil
}

func (s *Service) CreateInvoice(companyID string, req UpsertInvoiceRequest) (Invoice, error) {
	ctx := context.Background()
	payload, err := normalizeInvoice(req)
	if err != nil {
		return Invoice{}, err
	}

	itemsRaw, err := json.Marshal(payload.Items)
	if err != nil {
		return Invoice{}, err
	}

	var invoiceID int64
	err = s.db.QueryRowContext(ctx, `
INSERT INTO finance_invoices (
	company_id, reference_code, series_prefix, sequence_number, project_id, project_name, client_id, client_name,
	billing_address, shipping_address, issue_date, due_date, currency_code, exchange_rate, bank_account_id, bank_account_name,
	tax_calculation, generated_by, items_json, discount_value, discount_mode, subtotal, tax_total, total,
	paid_amount, balance_amount, status, note, terms, attachment_name, received_payment, source,
	external_number, document_type, credit_note_ref, locked, source_quote_id,
	soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8,
	$9, $10, NULLIF($11, '')::date, NULLIF($12, '')::date, $13, $14, $15, $16,
	$17, $18, $19::jsonb, $20, $21, $22, $23, $24,
	$25, $26, $27, $28, $29, $30, $31, $32,
	$33, $34, $35, $36, $37,
	false, NOW(), NOW()
)
RETURNING id;
`,
		companyID, payload.ReferenceCode, payload.SeriesPrefix, payload.SequenceNumber, payload.ProjectID, payload.ProjectName, payload.ClientID, payload.ClientName,
		payload.BillingAddress, payload.ShippingAddr, payload.IssueDate, payload.DueDate, payload.CurrencyCode, payload.ExchangeRate, payload.BankAccountID, payload.BankAccount,
		payload.TaxCalc, payload.GeneratedBy, string(itemsRaw), payload.DiscountValue, payload.DiscountMode, payload.Subtotal, payload.TaxTotal, payload.Total,
		payload.PaidAmount, payload.BalanceAmount, payload.Status, payload.Note, payload.Terms, payload.AttachmentName, payload.ReceivedPay, payload.Source,
		payload.ExternalNumber, payload.DocumentType, payload.CreditNoteRef, payload.Locked, payload.SourceQuoteID,
	).Scan(&invoiceID)
	if err != nil {
		return Invoice{}, err
	}

	return s.GetInvoice(companyID, invoiceID)
}

func (s *Service) UpdateInvoice(companyID string, invoiceID int64, req UpsertInvoiceRequest) (Invoice, error) {
	ctx := context.Background()
	if invoiceID <= 0 {
		return Invoice{}, errInvoiceIDRequired
	}

	// Bloqueo de factura emitida ("no hay reversa"): una factura con estado
	// Enviado/Pagado/Pago parcial queda locked=true y no admite edición; la
	// única vía de ajuste es una nota crédito. El generated_by se conserva:
	// la identidad la fija el JWT al crear, no el cliente al editar.
	current, err := s.GetInvoice(companyID, invoiceID)
	if err != nil {
		return Invoice{}, err
	}
	if current.Locked {
		return Invoice{}, errInvoiceLocked
	}

	payload, err := normalizeInvoice(req)
	if err != nil {
		return Invoice{}, err
	}
	payload.GeneratedBy = current.GeneratedBy

	itemsRaw, err := json.Marshal(payload.Items)
	if err != nil {
		return Invoice{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_invoices
SET reference_code = $1,
	series_prefix = $2,
	sequence_number = $3,
	project_id = $4,
	project_name = $5,
	client_id = $6,
	client_name = $7,
	billing_address = $8,
	shipping_address = $9,
	issue_date = NULLIF($10, '')::date,
	due_date = NULLIF($11, '')::date,
	currency_code = $12,
	exchange_rate = $13,
	bank_account_id = $14,
	bank_account_name = $15,
	tax_calculation = $16,
	generated_by = $17,
	items_json = $18::jsonb,
	discount_value = $19,
	discount_mode = $20,
	subtotal = $21,
	tax_total = $22,
	total = $23,
	paid_amount = $24,
	balance_amount = $25,
	status = $26,
	note = $27,
	terms = $28,
	attachment_name = $29,
	received_payment = $30,
	source = $31,
	external_number = $32,
	document_type = $33,
	credit_note_ref = $34,
	locked = $35,
	source_quote_id = $36,
	updated_at = NOW()
WHERE company_id = $37
  AND id = $38
  AND soft_delete = false
  AND locked = false;
`,
		payload.ReferenceCode, payload.SeriesPrefix, payload.SequenceNumber, payload.ProjectID, payload.ProjectName, payload.ClientID, payload.ClientName,
		payload.BillingAddress, payload.ShippingAddr, payload.IssueDate, payload.DueDate, payload.CurrencyCode, payload.ExchangeRate, payload.BankAccountID, payload.BankAccount,
		payload.TaxCalc, payload.GeneratedBy, string(itemsRaw), payload.DiscountValue, payload.DiscountMode, payload.Subtotal, payload.TaxTotal, payload.Total,
		payload.PaidAmount, payload.BalanceAmount, payload.Status, payload.Note, payload.Terms, payload.AttachmentName, payload.ReceivedPay, payload.Source,
		payload.ExternalNumber, payload.DocumentType, payload.CreditNoteRef, payload.Locked, payload.SourceQuoteID,
		companyID, invoiceID,
	)
	if err != nil {
		return Invoice{}, err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		// Carrera: otra petición bloqueó la factura entre el SELECT y el UPDATE.
		if latest, getErr := s.GetInvoice(companyID, invoiceID); getErr == nil && latest.Locked {
			return Invoice{}, errInvoiceLocked
		}
		return Invoice{}, errInvoiceNotFound
	}

	return s.GetInvoice(companyID, invoiceID)
}

func (s *Service) DeleteInvoice(companyID string, invoiceID int64) (bool, error) {
	ctx := context.Background()
	if invoiceID <= 0 {
		return false, errInvoiceIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_invoices
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false
  AND locked = false;
`, companyID, invoiceID)
	if err != nil {
		return false, err
	}
	rows, _ := result.RowsAffected()
	if rows > 0 {
		return true, nil
	}

	// Distinguir "no encontrada" de "bloqueada": una factura emitida no se
	// borra ("no hay reversa"); se responde 409 con mensaje claro.
	var locked bool
	err = s.db.QueryRowContext(ctx, `
SELECT locked
FROM finance_invoices
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, invoiceID).Scan(&locked)
	if err != nil {
		return false, nil
	}
	if locked {
		return false, errInvoiceLocked
	}
	return false, nil
}
