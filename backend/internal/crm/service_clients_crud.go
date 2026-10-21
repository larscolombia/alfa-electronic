package crm

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

func (s *Service) ListClients(companyID string, query ClientListQuery) ([]Client, error) {
	ctx := context.Background()

	filters := []string{"company_id = $1", "soft_delete = false"}
	args := []any{companyID}
	nextArg := 2

	if status := strings.TrimSpace(query.Status); status != "" {
		normalizedStatus, err := normalizeClientStatus(status)
		if err != nil {
			return nil, err
		}
		filters = append(filters, fmt.Sprintf("estado = $%d", nextArg))
		args = append(args, normalizedStatus)
		nextArg++
	}

	if search := strings.TrimSpace(query.Search); search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		filters = append(filters, fmt.Sprintf("(LOWER(nombre) LIKE $%d OR LOWER(correo) LIKE $%d OR LOWER(empresa) LIKE $%d OR LOWER(nit) LIKE $%d)", nextArg, nextArg, nextArg, nextArg))
		args = append(args, searchPattern)
		nextArg++
	}

	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxClientsListLimit {
		limit = maxClientsListLimit
	}

	statement := buildClientsListStatement(filters, 0)
	if limit > 0 {
		statement = buildClientsListStatement(filters, nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Client, 0)
	for rows.Next() {
		item, err := scanClient(rows)
		if err != nil {
			return nil, err
		}

		item.Branches, err = s.listClientBranches(ctx, companyID, item.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) GetClient(companyID, clientID string) (Client, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return Client{}, errClientIDRequired
	}

	row := s.db.QueryRowContext(ctx, `
SELECT id, nombre, correo, empresa, nit, zona, estado, website, office_phone, country, city, address,
	COALESCE(dv, ''), COALESCE(postal_code, ''), COALESCE(billing_email, ''), grand_contributor, id_type,
	credit_enabled, credit_limit, credit_consumed, last_payment_date, payment_term_days, created_at
FROM crm_clients
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, normalizedID)

	item, err := scanClient(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Client{}, errClientNotFound
		}
		return Client{}, err
	}

	item.Branches, err = s.listClientBranches(ctx, companyID, item.ID)
	if err != nil {
		return Client{}, err
	}

	return item, nil
}

func (s *Service) CreateClient(companyID string, req UpsertClientRequest) (Client, error) {
	ctx := context.Background()
	payload, err := s.normalizeClientPayload(req)
	if err != nil {
		return Client{}, err
	}

	clientID, err := insertClient(ctx, s.db, companyID, payload)
	if err != nil {
		return Client{}, err
	}

	if err := s.replaceClientBranches(ctx, companyID, clientID, payload.Branches); err != nil {
		return Client{}, err
	}

	return s.GetClient(companyID, clientID)
}

func (s *Service) UpdateClient(companyID, clientID string, req UpsertClientRequest) (Client, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return Client{}, errClientIDRequired
	}

	payload, err := s.normalizeClientPayload(req)
	if err != nil {
		return Client{}, err
	}

	var lastPaymentDate any
	if payload.LastPaymentDate != "" {
		lastPaymentDate = payload.LastPaymentDate
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_clients
SET nombre = $1,
	correo = $2,
	empresa = $3,
	nit = $4,
	zona = $5,
	estado = $6,
	website = $7,
	office_phone = $8,
	country = $9,
	city = $10,
	address = $11,
	dv = $12,
	postal_code = $13,
	billing_email = $14,
	grand_contributor = $15,
	id_type = $16,
	credit_enabled = $17,
	credit_limit = $18,
	credit_consumed = $19,
	last_payment_date = $20,
	payment_term_days = $21,
	updated_at = NOW()
WHERE company_id = $22
  AND id = $23
  AND soft_delete = false;
`,
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
		payload.DV,
		payload.PostalCode,
		payload.BillingEmail,
		payload.GrandContributor,
		payload.IDType,
		payload.CreditEnabled,
		payload.CreditLimit,
		payload.CreditConsumed,
		lastPaymentDate,
		payload.PaymentTermDays,
		companyID,
		normalizedID,
	)
	if err != nil {
		return Client{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return Client{}, errClientNotFound
	}

	if err := s.replaceClientBranches(ctx, companyID, normalizedID, payload.Branches); err != nil {
		return Client{}, err
	}

	return s.GetClient(companyID, normalizedID)
}

func (s *Service) DeleteClient(companyID, clientID string) (bool, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return false, errClientIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_clients
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, normalizedID)
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	if affected > 0 {
		if _, err := s.db.ExecContext(ctx, `
DELETE FROM crm_client_branches
WHERE company_id = $1
  AND client_id = $2;
`, companyID, normalizedID); err != nil {
			return false, err
		}
	}
	return affected > 0, nil
}
