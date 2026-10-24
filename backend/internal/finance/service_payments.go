package finance

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

const paymentSelectColumns = `id, order_number, code, project_name, invoice_number, client_name, purchase_order, amount,
	paid_at, payment_gateway, status, currency_code, exchange_rate, transaction_id,
	bank_account_id, bank_account_name, receipt_file_name, notes,
	rete_fuente, rete_iva, rete_ica, retention_comments, payment_date, created_at, updated_at`

func (s *Service) ListPayments(companyID string, query ListPaymentsQuery) ([]Payment, error) {
	ctx := context.Background()
	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxPaymentsListLimit {
		limit = maxPaymentsListLimit
	}

	filters := []string{"company_id = $1", "soft_delete = false"}
	args := []any{companyID}
	nextArg := 2

	status := normalizePaymentStatus(query.Status)
	if strings.TrimSpace(query.Status) != "" {
		if status == "" {
			return nil, errPaymentStatusInvalid
		}
		filters = append(filters, fmt.Sprintf("status = $%d", nextArg))
		args = append(args, status)
		nextArg++
	}

	statement := fmt.Sprintf(`
SELECT %s
FROM finance_payments
WHERE %s
ORDER BY paid_at DESC, created_at DESC
`, paymentSelectColumns, strings.Join(filters, " AND "))
	if limit > 0 {
		statement += fmt.Sprintf("LIMIT $%d", nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Payment, 0)
	for rows.Next() {
		item, scanErr := scanPayment(rows)
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

func (s *Service) GetPayment(companyID string, paymentID int64) (Payment, error) {
	ctx := context.Background()
	if paymentID <= 0 {
		return Payment{}, errPaymentIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_payments
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, paymentSelectColumns), companyID, paymentID)

	item, err := scanPayment(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Payment{}, errPaymentNotFound
		}
		return Payment{}, err
	}

	return item, nil
}

func (s *Service) CreatePayment(companyID string, req UpsertPaymentRequest) (Payment, error) {
	ctx := context.Background()

	payload, err := normalizePayment(req)
	if err != nil {
		return Payment{}, err
	}

	nextOrder, err := s.getNextPaymentOrderNumber(ctx, companyID)
	if err != nil {
		return Payment{}, err
	}

	orderNumber := payload.OrderNumber
	if orderNumber <= 0 {
		orderNumber = nextOrder
	}

	code := payload.Code
	if code == "" {
		code = buildPaymentCode(orderNumber)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Payment{}, fmt.Errorf("iniciar transaccion de pago: %w", err)
	}
	defer tx.Rollback()

	// F1: guardrail contra sobre-pago (se valida contra el estado previo al insert).
	if err := s.enforceOverbalanceGuard(ctx, tx, companyID, payload.InvoiceNumber, payload.Amount, false, 0); err != nil {
		return Payment{}, err
	}

	var paymentID int64
	err = tx.QueryRowContext(ctx, `
INSERT INTO finance_payments (
	company_id, order_number, code, project_name, invoice_number, client_name, purchase_order, amount,
	paid_at, payment_gateway, status, currency_code, exchange_rate, transaction_id,
	bank_account_id, bank_account_name, receipt_file_name, notes,
	rete_fuente, rete_iva, rete_ica, retention_comments, payment_date,
	soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8,
	NULLIF($9, '')::date, $10, $11, $12, $13, $14,
	$15, $16, $17, $18,
	$19, $20, $21, $22, NULLIF($23, '')::date,
	false, NOW(), NOW()
)
RETURNING id;
`,
		companyID,
		orderNumber,
		code,
		payload.Project,
		payload.InvoiceNumber,
		payload.Client,
		payload.PurchaseOrder,
		payload.Amount,
		payload.PaidAt,
		payload.PaymentGateway,
		payload.Status,
		payload.CurrencyCode,
		payload.ExchangeRate,
		payload.TransactionID,
		payload.BankAccountID,
		payload.BankAccount,
		payload.ReceiptFile,
		payload.Notes,
		payload.ReteFuente,
		payload.ReteIVA,
		payload.ReteICA,
		payload.RetentionComments,
		payload.PaymentDate,
	).Scan(&paymentID)
	if err != nil {
		return Payment{}, err
	}

	// F2: el nuevo pago se refleja en la factura (paid/balance/status/received_payment).
	if err := s.syncInvoicesFromPayments(ctx, tx, companyID, payload.InvoiceNumber); err != nil {
		return Payment{}, err
	}
	if err := tx.Commit(); err != nil {
		return Payment{}, fmt.Errorf("confirmar transaccion de pago: %w", err)
	}

	return s.GetPayment(companyID, paymentID)
}

func (s *Service) UpdatePayment(companyID string, paymentID int64, req UpsertPaymentRequest) (Payment, error) {
	ctx := context.Background()
	if paymentID <= 0 {
		return Payment{}, errPaymentIDRequired
	}

	payload, err := normalizePayment(req)
	if err != nil {
		return Payment{}, err
	}

	current, err := s.GetPayment(companyID, paymentID)
	if err != nil {
		return Payment{}, err
	}

	orderNumber := payload.OrderNumber
	if orderNumber <= 0 {
		orderNumber = current.OrderNumber
	}

	code := payload.Code
	if code == "" {
		code = current.Code
	}
	if strings.TrimSpace(code) == "" {
		code = buildPaymentCode(orderNumber)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return Payment{}, fmt.Errorf("iniciar transaccion de pago: %w", err)
	}
	defer tx.Rollback()

	// F1: al subir el monto se permite agotar el saldo (incluye lo que este pago ya
	// contaba si seguia apuntando a la misma factura); nada mas alla.
	sameInvoice := strings.EqualFold(current.InvoiceNumber, payload.InvoiceNumber)
	countsNow := sameInvoice && (current.Status == PaymentStatusCompleted || current.Status == PaymentStatusPartial)
	if err := s.enforceOverbalanceGuard(ctx, tx, companyID, payload.InvoiceNumber, payload.Amount, countsNow, current.Amount); err != nil {
		return Payment{}, err
	}

	result, err := tx.ExecContext(ctx, `
UPDATE finance_payments
SET order_number = $1,
	code = $2,
	project_name = $3,
	invoice_number = $4,
	client_name = $5,
	purchase_order = $6,
	amount = $7,
	paid_at = NULLIF($8, '')::date,
	payment_gateway = $9,
	status = $10,
	currency_code = $11,
	exchange_rate = $12,
	transaction_id = $13,
	bank_account_id = $14,
	bank_account_name = $15,
	receipt_file_name = $16,
	notes = $17,
	rete_fuente = $18,
	rete_iva = $19,
	rete_ica = $20,
	retention_comments = $21,
	payment_date = NULLIF($22, '')::date,
	updated_at = NOW()
WHERE company_id = $23
  AND id = $24
  AND soft_delete = false;
`,
		orderNumber,
		code,
		payload.Project,
		payload.InvoiceNumber,
		payload.Client,
		payload.PurchaseOrder,
		payload.Amount,
		payload.PaidAt,
		payload.PaymentGateway,
		payload.Status,
		payload.CurrencyCode,
		payload.ExchangeRate,
		payload.TransactionID,
		payload.BankAccountID,
		payload.BankAccount,
		payload.ReceiptFile,
		payload.Notes,
		payload.ReteFuente,
		payload.ReteIVA,
		payload.ReteICA,
		payload.RetentionComments,
		payload.PaymentDate,
		companyID,
		paymentID,
	)
	if err != nil {
		return Payment{}, err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return Payment{}, errPaymentNotFound
	}

	// F2: recalcular la factura del codigo anterior (pudo perder este pago) y la del nuevo.
	if err := s.syncInvoicesFromPayments(ctx, tx, companyID, current.InvoiceNumber, payload.InvoiceNumber); err != nil {
		return Payment{}, err
	}
	if err := tx.Commit(); err != nil {
		return Payment{}, fmt.Errorf("confirmar transaccion de pago: %w", err)
	}

	return s.GetPayment(companyID, paymentID)
}

func (s *Service) DeletePayment(companyID string, paymentID int64) (bool, error) {
	ctx := context.Background()
	if paymentID <= 0 {
		return false, errPaymentIDRequired
	}

	var invoiceNumber string
	err := s.db.QueryRowContext(ctx, `
SELECT COALESCE(invoice_number, '')
FROM finance_payments
WHERE company_id = $1 AND id = $2 AND soft_delete = false;
`, companyID, paymentID).Scan(&invoiceNumber)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil // ya estaba borrado: no hay nada que re-calcular
		}
		return false, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, fmt.Errorf("iniciar transaccion de pago: %w", err)
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx, `
UPDATE finance_payments
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, paymentID)
	if err != nil {
		return false, err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return false, nil
	}

	// F2: el pago borrado deja de contar → recalcular la factura a la que apuntaba.
	if err := s.syncInvoicesFromPayments(ctx, tx, companyID, invoiceNumber); err != nil {
		return false, err
	}
	if err := tx.Commit(); err != nil {
		return false, fmt.Errorf("confirmar transaccion de pago: %w", err)
	}

	return true, nil
}

func (s *Service) getNextPaymentOrderNumber(ctx context.Context, companyID string) (int, error) {
	var maxOrder sql.NullInt64
	if err := s.db.QueryRowContext(ctx, `
SELECT COALESCE(MAX(order_number), 0)
FROM finance_payments
WHERE company_id = $1
  AND soft_delete = false;
`, companyID).Scan(&maxOrder); err != nil {
		return 0, err
	}

	if !maxOrder.Valid {
		return 1, nil
	}

	return int(maxOrder.Int64) + 1, nil
}

func buildPaymentCode(orderNumber int) string {
	next := orderNumber
	if next <= 0 {
		next = 1
	}
	return fmt.Sprintf("PAY-%04d", next)
}

func normalizePaymentStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "completado", "pagado":
		return string(PaymentStatusCompleted)
	case "parcial", "pago parcial":
		return string(PaymentStatusPartial)
	case "pendiente":
		return string(PaymentStatusPending)
	default:
		return ""
	}
}

func normalizePayment(input UpsertPaymentRequest) (UpsertPaymentRequest, error) {
	normalized := input
	if normalized.OrderNumber < 0 {
		normalized.OrderNumber = 0
	}
	normalized.Code = strings.TrimSpace(normalized.Code)
	normalized.Project = strings.TrimSpace(normalized.Project)
	normalized.InvoiceNumber = strings.TrimSpace(normalized.InvoiceNumber)
	normalized.Client = strings.TrimSpace(normalized.Client)
	normalized.PurchaseOrder = strings.TrimSpace(normalized.PurchaseOrder)
	normalized.PaidAt = strings.TrimSpace(normalized.PaidAt)
	normalized.PaymentGateway = strings.TrimSpace(normalized.PaymentGateway)
	normalized.Status = normalizePaymentStatus(normalized.Status)
	normalized.CurrencyCode = normalizeCurrencyCode(normalized.CurrencyCode)
	normalized.TransactionID = strings.TrimSpace(normalized.TransactionID)
	normalized.BankAccount = strings.TrimSpace(normalized.BankAccount)
	normalized.ReceiptFile = strings.TrimSpace(normalized.ReceiptFile)
	normalized.Notes = strings.TrimSpace(normalized.Notes)
	normalized.RetentionComments = strings.TrimSpace(normalized.RetentionComments)
	normalized.PaymentDate = strings.TrimSpace(normalized.PaymentDate)

	if normalized.InvoiceNumber == "" {
		return UpsertPaymentRequest{}, errPaymentInvoiceRequired
	}
	if normalized.PaidAt == "" {
		return UpsertPaymentRequest{}, errPaymentDateInvalid
	}
	if _, err := time.Parse("2006-01-02", normalized.PaidAt); err != nil {
		return UpsertPaymentRequest{}, errPaymentDateInvalid
	}
	if normalized.Amount <= 0 {
		return UpsertPaymentRequest{}, errPaymentAmountInvalid
	}
	if normalized.Status == "" {
		return UpsertPaymentRequest{}, errPaymentStatusInvalid
	}
	if normalized.CurrencyCode == "" {
		return UpsertPaymentRequest{}, errPaymentCurrencyInvalid
	}
	if normalized.ExchangeRate <= 0 {
		return UpsertPaymentRequest{}, errPaymentExchangeInvalid
	}

	// Retenciones: nunca negativas y su suma no puede superar el monto del pago
	// (amount - retenciones = neto debe tener sentido). Un pago antiguo sin
	// retenciones llega con ceros y pasa igual.
	if normalized.ReteFuente < 0 || normalized.ReteIVA < 0 || normalized.ReteICA < 0 {
		return UpsertPaymentRequest{}, errPaymentRetentionInvalid
	}
	if normalized.ReteFuente+normalized.ReteIVA+normalized.ReteICA > normalized.Amount {
		return UpsertPaymentRequest{}, errPaymentRetentionInvalid
	}
	if normalized.PaymentDate != "" {
		if _, err := time.Parse("2006-01-02", normalized.PaymentDate); err != nil {
			return UpsertPaymentRequest{}, errPaymentDateInvalid
		}
	}

	if normalized.Client == "" {
		normalized.Client = "Cliente sin definir"
	}

	return normalized, nil
}

func scanPayment(scanner interface{ Scan(dest ...any) error }) (Payment, error) {
	var item Payment
	var paidAt sql.NullTime
	var paymentDate sql.NullTime
	var status string
	var createdAt time.Time
	var updatedAt time.Time

	if err := scanner.Scan(
		&item.ID,
		&item.OrderNumber,
		&item.Code,
		&item.Project,
		&item.InvoiceNumber,
		&item.Client,
		&item.PurchaseOrder,
		&item.Amount,
		&paidAt,
		&item.PaymentGateway,
		&status,
		&item.CurrencyCode,
		&item.ExchangeRate,
		&item.TransactionID,
		&item.BankAccountID,
		&item.BankAccount,
		&item.ReceiptFile,
		&item.Notes,
		&item.ReteFuente,
		&item.ReteIVA,
		&item.ReteICA,
		&item.RetentionComments,
		&paymentDate,
		&createdAt,
		&updatedAt,
	); err != nil {
		return Payment{}, err
	}

	if paidAt.Valid {
		item.PaidAt = paidAt.Time.Format("2006-01-02")
	}
	if paymentDate.Valid {
		item.PaymentDate = paymentDate.Time.Format("2006-01-02")
	}
	item.Status = PaymentStatus(status)
	item.Code = strings.TrimSpace(item.Code)
	item.Project = strings.TrimSpace(item.Project)
	item.InvoiceNumber = strings.TrimSpace(item.InvoiceNumber)
	item.Client = strings.TrimSpace(item.Client)
	item.PurchaseOrder = strings.TrimSpace(item.PurchaseOrder)
	item.PaymentGateway = strings.TrimSpace(item.PaymentGateway)
	item.CurrencyCode = strings.TrimSpace(item.CurrencyCode)
	item.TransactionID = strings.TrimSpace(item.TransactionID)
	item.BankAccount = strings.TrimSpace(item.BankAccount)
	item.ReceiptFile = strings.TrimSpace(item.ReceiptFile)
	item.Notes = strings.TrimSpace(item.Notes)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return item, nil
}
