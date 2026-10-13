package finance

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

func (s *Service) ListRecurringInvoices(companyID string, query ListRecurringInvoicesQuery) ([]RecurringInvoice, error) {
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

	status := normalizeRecurringStatus(query.Status)
	if strings.TrimSpace(query.Status) != "" {
		if status == "" {
			return nil, errRecurringStatusInvalid
		}
		filters = append(filters, fmt.Sprintf("status = $%d", nextArg))
		args = append(args, status)
		nextArg++
	}

	statement := fmt.Sprintf(`
SELECT %s
FROM finance_recurring_invoices
WHERE %s
ORDER BY created_at DESC
`, recurringSelectColumns, strings.Join(filters, " AND "))
	if limit > 0 {
		statement += fmt.Sprintf("LIMIT $%d", nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]RecurringInvoice, 0)
	for rows.Next() {
		item, scanErr := scanRecurringInvoice(rows)
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

func (s *Service) GetRecurringInvoice(companyID string, recurringID int64) (RecurringInvoice, error) {
	ctx := context.Background()
	if recurringID <= 0 {
		return RecurringInvoice{}, errRecurringIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_recurring_invoices
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, recurringSelectColumns), companyID, recurringID)

	item, err := scanRecurringInvoice(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return RecurringInvoice{}, errRecurringNotFound
		}
		return RecurringInvoice{}, err
	}
	return item, nil
}

func (s *Service) CreateRecurringInvoice(companyID string, req UpsertRecurringInvoiceRequest) (RecurringInvoice, error) {
	ctx := context.Background()
	payload, err := normalizeRecurring(req)
	if err != nil {
		return RecurringInvoice{}, err
	}

	itemsRaw, err := json.Marshal(payload.Items)
	if err != nil {
		return RecurringInvoice{}, err
	}

	var recurringID int64
	err = s.db.QueryRowContext(ctx, `
INSERT INTO finance_recurring_invoices (
	company_id, client_id, client_name, project_id, project_name, currency_code, tax_calculation,
	bank_account_id, bank_account_name, frequency, start_date, next_issue_date, cycles, allow_client_stop,
	show_shipping_address, generated_by, items_json, discount_value, discount_mode, subtotal, tax_total, total,
	status, note, terms, soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7,
	$8, $9, $10, NULLIF($11, '')::date, NULLIF($12, '')::date, $13, $14,
	$15, $16, $17::jsonb, $18, $19, $20, $21, $22,
	$23, $24, $25, false, NOW(), NOW()
)
RETURNING id;
`,
		companyID, payload.ClientID, payload.ClientName, payload.ProjectID, payload.ProjectName, payload.CurrencyCode, payload.TaxCalc,
		payload.BankAccountID, payload.BankAccountName, payload.Frequency, payload.StartDate, payload.NextIssueDate, payload.Cycles, payload.AllowClientStop,
		payload.ShowShipAddr, payload.GeneratedBy, string(itemsRaw), payload.DiscountValue, payload.DiscountMode, payload.Subtotal, payload.TaxTotal, payload.Total,
		payload.Status, payload.Note, payload.Terms,
	).Scan(&recurringID)
	if err != nil {
		return RecurringInvoice{}, err
	}

	return s.GetRecurringInvoice(companyID, recurringID)
}

func (s *Service) UpdateRecurringInvoice(companyID string, recurringID int64, req UpsertRecurringInvoiceRequest) (RecurringInvoice, error) {
	ctx := context.Background()
	if recurringID <= 0 {
		return RecurringInvoice{}, errRecurringIDRequired
	}

	payload, err := normalizeRecurring(req)
	if err != nil {
		return RecurringInvoice{}, err
	}
	itemsRaw, err := json.Marshal(payload.Items)
	if err != nil {
		return RecurringInvoice{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_recurring_invoices
SET client_id = $1,
	client_name = $2,
	project_id = $3,
	project_name = $4,
	currency_code = $5,
	tax_calculation = $6,
	bank_account_id = $7,
	bank_account_name = $8,
	frequency = $9,
	start_date = NULLIF($10, '')::date,
	next_issue_date = NULLIF($11, '')::date,
	cycles = $12,
	allow_client_stop = $13,
	show_shipping_address = $14,
	generated_by = $15,
	items_json = $16::jsonb,
	discount_value = $17,
	discount_mode = $18,
	subtotal = $19,
	tax_total = $20,
	total = $21,
	status = $22,
	note = $23,
	terms = $24,
	updated_at = NOW()
WHERE company_id = $25
  AND id = $26
  AND soft_delete = false;
`,
		payload.ClientID, payload.ClientName, payload.ProjectID, payload.ProjectName, payload.CurrencyCode, payload.TaxCalc,
		payload.BankAccountID, payload.BankAccountName, payload.Frequency, payload.StartDate, payload.NextIssueDate, payload.Cycles, payload.AllowClientStop,
		payload.ShowShipAddr, payload.GeneratedBy, string(itemsRaw), payload.DiscountValue, payload.DiscountMode, payload.Subtotal, payload.TaxTotal, payload.Total,
		payload.Status, payload.Note, payload.Terms, companyID, recurringID,
	)
	if err != nil {
		return RecurringInvoice{}, err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return RecurringInvoice{}, errRecurringNotFound
	}

	return s.GetRecurringInvoice(companyID, recurringID)
}

func (s *Service) DeleteRecurringInvoice(companyID string, recurringID int64) (bool, error) {
	ctx := context.Background()
	if recurringID <= 0 {
		return false, errRecurringIDRequired
	}
	result, err := s.db.ExecContext(ctx, `
UPDATE finance_recurring_invoices
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, recurringID)
	if err != nil {
		return false, err
	}
	rows, _ := result.RowsAffected()
	return rows > 0, nil
}
