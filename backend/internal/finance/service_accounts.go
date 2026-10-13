package finance

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

const accountSelectColumns = `id, account_type, bank_name, holder_name, account_number, product_type, currency_code, contact_number, initial_balance, status, logo_file_name, created_at, updated_at`

func (s *Service) ListAccounts(companyID string, query ListAccountsQuery) ([]Account, error) {
	ctx := context.Background()

	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxAccountsListLimit {
		limit = maxAccountsListLimit
	}

	statement := fmt.Sprintf(`
SELECT %s
FROM finance_accounts
WHERE company_id = $1
  AND soft_delete = false
ORDER BY created_at DESC
`, accountSelectColumns)
	args := []any{companyID}

	if limit > 0 {
		statement += "LIMIT $2"
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Account, 0)
	for rows.Next() {
		item, scanErr := scanAccount(rows)
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

func (s *Service) GetAccount(companyID string, accountID int64) (Account, error) {
	ctx := context.Background()
	if accountID <= 0 {
		return Account{}, errAccountIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_accounts
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, accountSelectColumns), companyID, accountID)

	item, err := scanAccount(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Account{}, errAccountNotFound
		}
		return Account{}, err
	}

	return item, nil
}

func (s *Service) CreateAccount(companyID string, req UpsertAccountRequest) (Account, error) {
	ctx := context.Background()

	payload, err := normalizeAccountPayload(req)
	if err != nil {
		return Account{}, err
	}

	var accountID int64
	if err := s.db.QueryRowContext(ctx, `
INSERT INTO finance_accounts (
	company_id, account_type, bank_name, holder_name, account_number,
	product_type, currency_code, contact_number, initial_balance, status,
	logo_file_name, soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5,
	$6, $7, $8, $9, $10,
	$11, false, NOW(), NOW()
)
RETURNING id;
`,
		companyID,
		payload.AccountType,
		payload.BankName,
		payload.HolderName,
		payload.AccountNumber,
		payload.ProductType,
		payload.CurrencyCode,
		payload.ContactNumber,
		payload.InitialBalance,
		payload.Status,
		payload.LogoFileName,
	).Scan(&accountID); err != nil {
		return Account{}, err
	}

	return s.GetAccount(companyID, accountID)
}

func (s *Service) UpdateAccount(companyID string, accountID int64, req UpsertAccountRequest) (Account, error) {
	ctx := context.Background()
	if accountID <= 0 {
		return Account{}, errAccountIDRequired
	}

	payload, err := normalizeAccountPayload(req)
	if err != nil {
		return Account{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_accounts
SET account_type = $1,
	bank_name = $2,
	holder_name = $3,
	account_number = $4,
	product_type = $5,
	currency_code = $6,
	contact_number = $7,
	initial_balance = $8,
	status = $9,
	logo_file_name = $10,
	updated_at = NOW()
WHERE company_id = $11
  AND id = $12
  AND soft_delete = false;
`,
		payload.AccountType,
		payload.BankName,
		payload.HolderName,
		payload.AccountNumber,
		payload.ProductType,
		payload.CurrencyCode,
		payload.ContactNumber,
		payload.InitialBalance,
		payload.Status,
		payload.LogoFileName,
		companyID,
		accountID,
	)
	if err != nil {
		return Account{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return Account{}, errAccountNotFound
	}

	return s.GetAccount(companyID, accountID)
}

func (s *Service) DeleteAccount(companyID string, accountID int64) (bool, error) {
	ctx := context.Background()
	if accountID <= 0 {
		return false, errAccountIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_accounts
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, accountID)
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	return affected > 0, nil
}

func scanAccount(scanner interface {
	Scan(dest ...any) error
}) (Account, error) {
	var item Account
	var accountType string
	var productType string
	var status string
	var createdAt time.Time
	var updatedAt time.Time

	if err := scanner.Scan(
		&item.ID,
		&accountType,
		&item.BankName,
		&item.HolderName,
		&item.AccountNumber,
		&productType,
		&item.CurrencyCode,
		&item.ContactNumber,
		&item.InitialBalance,
		&status,
		&item.LogoFileName,
		&createdAt,
		&updatedAt,
	); err != nil {
		return Account{}, err
	}

	item.AccountType = AccountType(accountType)
	item.ProductType = AccountProductType(productType)
	item.Status = AccountStatus(status)
	item.BankName = strings.TrimSpace(item.BankName)
	item.HolderName = strings.TrimSpace(item.HolderName)
	item.AccountNumber = strings.TrimSpace(item.AccountNumber)
	item.CurrencyCode = strings.TrimSpace(item.CurrencyCode)
	item.ContactNumber = strings.TrimSpace(item.ContactNumber)
	item.LogoFileName = strings.TrimSpace(item.LogoFileName)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return item, nil
}
