package finance

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

const expenseSelectColumns = `e.id, e.account_id, e.item_name, e.concept, e.category, e.description,
	e.employee, e.project, e.vendor, e.amount, e.currency, e.exchange_rate, e.value_in_cop,
	e.paid_at, e.receipt_file_name, e.created_by, e.created_at,
	COALESCE(a.bank_name || ' - ' || a.account_number, '')`

const maxExpensesListLimit = 500

// ResolveUserID convierte el email del JWT en el id de la tabla users (mismo
// patrón que internal/worktime). Si el usuario no existe devuelve el email como
// identidad estable. El cliente nunca puede enviar created_by/counted_by.
func (s *Service) ResolveUserID(companyID, email string) string {
	email = strings.TrimSpace(email)
	if email == "" {
		return ""
	}
	var id string
	err := s.db.QueryRow(
		`SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND company_id = $2 LIMIT 1`,
		email, companyID,
	).Scan(&id)
	if err != nil || strings.TrimSpace(id) == "" {
		return email
	}
	return id
}

func (s *Service) ListExpenses(companyID string, query ListExpensesQuery) ([]Expense, error) {
	ctx := context.Background()
	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxExpensesListLimit {
		limit = maxExpensesListLimit
	}

	statement := fmt.Sprintf(`
SELECT %s
FROM finance_expenses e
LEFT JOIN finance_accounts a ON a.id = e.account_id AND a.company_id = e.company_id
WHERE e.company_id = $1 AND e.soft_delete = false
ORDER BY e.paid_at DESC, e.created_at DESC, e.id DESC
`, expenseSelectColumns)
	args := []any{companyID}
	if limit > 0 {
		statement += " LIMIT $2"
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Expense, 0)
	for rows.Next() {
		item, scanErr := scanExpense(rows)
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

func (s *Service) GetExpense(companyID string, expenseID int64) (Expense, error) {
	ctx := context.Background()
	if expenseID <= 0 {
		return Expense{}, errExpenseIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_expenses e
LEFT JOIN finance_accounts a ON a.id = e.account_id AND a.company_id = e.company_id
WHERE e.company_id = $1 AND e.id = $2 AND e.soft_delete = false;
`, expenseSelectColumns), companyID, expenseID)

	item, err := scanExpense(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Expense{}, errExpenseNotFound
		}
		return Expense{}, err
	}
	return item, nil
}

func (s *Service) CreateExpense(companyID, userID string, req UpsertExpenseRequest) (Expense, error) {
	ctx := context.Background()

	payload, err := normalizeExpense(req)
	if err != nil {
		return Expense{}, err
	}

	var expenseID int64
	err = s.db.QueryRowContext(ctx, `
INSERT INTO finance_expenses (
	company_id, account_id, item_name, concept, category, description, employee, project, vendor,
	amount, currency, exchange_rate, value_in_cop, paid_at, receipt_file_name, created_by,
	soft_delete, created_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9,
	$10, $11, $12, $13, NULLIF($14, '')::date, $15, $16,
	false, NOW()
)
RETURNING id;
`,
		companyID, payload.AccountID, payload.ItemName, payload.Concept, payload.Category,
		payload.Description, payload.Employee, payload.Project, payload.Vendor,
		payload.Amount, payload.CurrencyCode, payload.ExchangeRate, payload.Amount*payload.ExchangeRate,
		payload.PaidAt, payload.ReceiptFileName, userID,
	).Scan(&expenseID)
	if err != nil {
		return Expense{}, err
	}

	return s.GetExpense(companyID, expenseID)
}

func (s *Service) UpdateExpense(companyID, userID string, expenseID int64, req UpsertExpenseRequest) (Expense, error) {
	ctx := context.Background()
	if expenseID <= 0 {
		return Expense{}, errExpenseIDRequired
	}

	payload, err := normalizeExpense(req)
	if err != nil {
		return Expense{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_expenses
SET account_id = $1,
	item_name = $2,
	concept = $3,
	category = $4,
	description = $5,
	employee = $6,
	project = $7,
	vendor = $8,
	amount = $9,
	currency = $10,
	exchange_rate = $11,
	value_in_cop = $12,
	paid_at = NULLIF($13, '')::date,
	receipt_file_name = $14
WHERE company_id = $15 AND id = $16 AND soft_delete = false;
`,
		payload.AccountID, payload.ItemName, payload.Concept, payload.Category, payload.Description,
		payload.Employee, payload.Project, payload.Vendor,
		payload.Amount, payload.CurrencyCode, payload.ExchangeRate, payload.Amount*payload.ExchangeRate,
		payload.PaidAt, payload.ReceiptFileName,
		companyID, expenseID,
	)
	if err != nil {
		return Expense{}, err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return Expense{}, errExpenseNotFound
	}
	_ = userID // created_by no se reescribe: el autor original se conserva.
	return s.GetExpense(companyID, expenseID)
}

func (s *Service) DeleteExpense(companyID string, expenseID int64) (bool, error) {
	ctx := context.Background()
	if expenseID <= 0 {
		return false, errExpenseIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_expenses
SET soft_delete = true
WHERE company_id = $1 AND id = $2 AND soft_delete = false;
`, companyID, expenseID)
	if err != nil {
		return false, err
	}
	rows, _ := result.RowsAffected()
	return rows > 0, nil
}

// SaveCashCounts guarda un arqueo completo: todas las denominaciones comparten
// counted_at. El GET devuelve siempre el último arqueo guardado.
func (s *Service) SaveCashCounts(companyID, userID string, req SaveCashCountsRequest) ([]CashCount, error) {
	ctx := context.Background()
	if len(req.Entries) == 0 {
		return nil, errCashCountEntryInvalid
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	countedAt := time.Now().UTC()
	for _, entry := range req.Entries {
		kind := strings.ToLower(strings.TrimSpace(entry.Kind))
		if kind != "billete" && kind != "moneda" {
			return nil, errCashCountEntryInvalid
		}
		if entry.Denomination <= 0 || entry.Quantity < 0 {
			return nil, errCashCountEntryInvalid
		}
		total := entry.Denomination * float64(entry.Quantity)
		_, err := tx.ExecContext(ctx, `
INSERT INTO finance_cash_counts (company_id, account_id, kind, denomination, quantity, total, counted_at, counted_by)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
`, companyID, req.AccountID, kind, entry.Denomination, entry.Quantity, total, countedAt, userID)
		if err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.GetCashCounts(companyID)
}

// GetCashCounts devuelve las filas del arqueo más reciente de la empresa.
func (s *Service) GetCashCounts(companyID string) ([]CashCount, error) {
	ctx := context.Background()
	rows, err := s.db.QueryContext(ctx, `
SELECT id, account_id, kind, denomination, quantity, total, counted_at, counted_by
FROM finance_cash_counts
WHERE company_id = $1
	AND counted_at = (SELECT MAX(counted_at) FROM finance_cash_counts WHERE company_id = $1)
ORDER BY kind, denomination DESC;
`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CashCount, 0)
	for rows.Next() {
		var item CashCount
		var countedAt time.Time
		if err := rows.Scan(&item.ID, &item.AccountID, &item.Kind, &item.Denomination, &item.Quantity, &item.Total, &countedAt, &item.CountedBy); err != nil {
			return nil, err
		}
		item.CountedAt = countedAt.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}

func normalizeExpense(input UpsertExpenseRequest) (UpsertExpenseRequest, error) {
	normalized := input
	normalized.ItemName = strings.TrimSpace(normalized.ItemName)
	normalized.Concept = strings.TrimSpace(normalized.Concept)
	normalized.Category = strings.TrimSpace(normalized.Category)
	normalized.Description = strings.TrimSpace(normalized.Description)
	normalized.Employee = strings.TrimSpace(normalized.Employee)
	normalized.Project = strings.TrimSpace(normalized.Project)
	normalized.Vendor = strings.TrimSpace(normalized.Vendor)
	normalized.PaidAt = strings.TrimSpace(normalized.PaidAt)
	normalized.CurrencyCode = normalizeCurrencyCode(normalized.CurrencyCode)
	normalized.ReceiptFileName = strings.TrimSpace(normalized.ReceiptFileName)

	if normalized.ItemName == "" {
		return UpsertExpenseRequest{}, errExpenseItemRequired
	}
	if normalized.Concept == "" {
		return UpsertExpenseRequest{}, errExpenseConceptRequired
	}
	if normalized.Category == "" {
		return UpsertExpenseRequest{}, errExpenseCategoryRequired
	}
	if normalized.PaidAt == "" {
		return UpsertExpenseRequest{}, errExpenseDateInvalid
	}
	if _, err := time.Parse("2006-01-02", normalized.PaidAt); err != nil {
		return UpsertExpenseRequest{}, errExpenseDateInvalid
	}
	if normalized.Amount <= 0 {
		return UpsertExpenseRequest{}, errExpenseAmountInvalid
	}
	if normalized.CurrencyCode == "" {
		return UpsertExpenseRequest{}, errExpenseCurrencyInvalid
	}
	if normalized.ExchangeRate <= 0 {
		return UpsertExpenseRequest{}, errExpenseExchangeInvalid
	}
	if normalized.AccountID != nil && *normalized.AccountID <= 0 {
		normalized.AccountID = nil
	}
	return normalized, nil
}

func scanExpense(scanner interface{ Scan(dest ...any) error }) (Expense, error) {
	var item Expense
	var paidAt sql.NullTime
	var createdAt time.Time

	if err := scanner.Scan(
		&item.ID,
		&item.AccountID,
		&item.ItemName,
		&item.Concept,
		&item.Category,
		&item.Description,
		&item.Employee,
		&item.Project,
		&item.Vendor,
		&item.Amount,
		&item.CurrencyCode,
		&item.ExchangeRate,
		&item.ValueInCop,
		&paidAt,
		&item.ReceiptFileName,
		&item.CreatedBy,
		&createdAt,
		&item.AccountName,
	); err != nil {
		return Expense{}, err
	}

	if paidAt.Valid {
		item.PaidAt = paidAt.Time.Format("2006-01-02")
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return item, nil
}

func isExpenseValidationError(err error) bool {
	return errors.Is(err, errExpenseItemRequired) ||
		errors.Is(err, errExpenseConceptRequired) ||
		errors.Is(err, errExpenseCategoryRequired) ||
		errors.Is(err, errExpenseDateInvalid) ||
		errors.Is(err, errExpenseAmountInvalid) ||
		errors.Is(err, errExpenseCurrencyInvalid) ||
		errors.Is(err, errExpenseExchangeInvalid) ||
		errors.Is(err, errCashCountEntryInvalid)
}
