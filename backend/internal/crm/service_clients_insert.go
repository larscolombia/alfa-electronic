package crm

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
)

// clientExecutor abstracts *sql.DB and *sql.Tx so the same insert works
// standalone or inside a per-row transaction (bulk import).
type clientExecutor interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

func insertClient(ctx context.Context, ex clientExecutor, companyID string, payload normalizedClientInput) (string, error) {
	clientID := uuid.NewString()
	var lastPaymentDate any
	if payload.LastPaymentDate != "" {
		lastPaymentDate = payload.LastPaymentDate
	}

	if _, err := ex.ExecContext(ctx, `
INSERT INTO crm_clients (
	company_id, id, nombre, correo, empresa, nit, zona, estado,
	website, office_phone, country, city, address,
	credit_enabled, credit_limit, credit_consumed, last_payment_date, payment_term_days,
	soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8,
	$9, $10, $11, $12, $13,
	$14, $15, $16, $17, $18,
	false, NOW(), NOW()
);
`,
		companyID,
		clientID,
		payload.Nombre,
		payload.Correo,
		payload.Empresa,
		payload.Nit,
		payload.Zona,
		payload.Estado,
		payload.Website,
		payload.OfficePhone,
		payload.Country,
		payload.City,
		payload.Address,
		payload.CreditEnabled,
		payload.CreditLimit,
		payload.CreditConsumed,
		lastPaymentDate,
		payload.PaymentTermDays,
	); err != nil {
		return "", err
	}

	return clientID, nil
}
