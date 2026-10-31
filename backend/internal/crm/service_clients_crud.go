package crm

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
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

	s.refreshGlobalSearch(ctx) // el buscador global debe encontrar el cliente recién creado
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

	s.refreshGlobalSearch(ctx) // el buscador global debe reflejar los datos actualizados
	return s.GetClient(companyID, normalizedID)
}

func (s *Service) DeleteClient(companyID, clientID string) (bool, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(clientID)
	if normalizedID == "" {
		return false, errClientIDRequired
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	// Leer y bloquear el cliente antes de preparar su devolución a Prospectos.
	var nombre, correo, empresa, nit, zona string
	var website, officePhone, country, city, address string

	err = tx.QueryRowContext(ctx, `
SELECT nombre, correo, empresa, nit, zona,
       website, office_phone, country, city, address
FROM crm_clients
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false
FOR UPDATE;
`, companyID, normalizedID).Scan(
		&nombre, &correo, &empresa, &nit, &zona,
		&website, &officePhone, &country, &city, &address,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}

	nombre = strings.TrimSpace(nombre)
	correo = strings.TrimSpace(correo)
	empresa = strings.TrimSpace(empresa)
	if empresa == "" {
		empresa = nombre
	}
	if zona = strings.TrimSpace(zona); zona == "" {
		zona = "General"
	}

	// Leer las sucursales antes de retirar el cliente.
	rows, err := tx.QueryContext(ctx, `
SELECT name, contact_name, contact_role, email, phone,
       country, city, address, is_primary
FROM crm_client_branches
WHERE company_id = $1 AND client_id = $2
ORDER BY is_primary DESC, created_at ASC;
`, companyID, normalizedID)
	if err != nil {
		return false, err
	}

	type savedBranch struct {
		name, contactName, contactRole, email, phone string
		country, city, address                       string
		isPrimary                                    bool
	}
	branches := make([]savedBranch, 0)
	for rows.Next() {
		var b savedBranch
		if err := rows.Scan(
			&b.name, &b.contactName, &b.contactRole, &b.email, &b.phone,
			&b.country, &b.city, &b.address, &b.isPrimary,
		); err != nil {
			rows.Close()
			return false, err
		}
		branches = append(branches, b)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return false, err
	}
	if err := rows.Close(); err != nil {
		return false, err
	}

	// Si ya existe el prospecto original, reutilizarlo.
	// Si no existe, crear un prospecto con los datos disponibles del cliente.
	var prospectID string
	err = tx.QueryRowContext(ctx, `
SELECT id
FROM crm_prospects
WHERE company_id = $1
  AND soft_delete = false
  AND LOWER(TRIM(company)) = LOWER(TRIM($2))
  AND (
       ($3 <> '' AND LOWER(TRIM(email)) = LOWER(TRIM($3)))
       OR LOWER(TRIM(name)) = LOWER(TRIM($4))
  )
ORDER BY created_at ASC
LIMIT 1
FOR UPDATE;
`, companyID, empresa, correo, nombre).Scan(&prospectID)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return false, err
	}
	if errors.Is(err, sql.ErrNoRows) {
		prospectID = uuid.NewString()
		_, err = tx.ExecContext(ctx, `
INSERT INTO crm_prospects (
    id, company_id, name, email, mobile, company, nit,
    assigned_employee, source, ciiu_code, zone, prospect_value,
    allow_follow_up, status, service, note, website, office_phone,
    country, city, address, quotations, soft_delete, created_at, updated_at
)
VALUES (
    $1, $2, $3, $4, '', $5, $6,
    '', '', '', $7, 0,
    true, 'Pendiente', '', '', $8, $9,
    $10, $11, $12, 0, false, NOW(), NOW()
);
`, prospectID, companyID, nombre, correo, empresa, nit, zona,
			website, officePhone, country, city, address)
		if err != nil {
			return false, err
		}
	}

	// Copiar sucursales que todavía no estén registradas en el prospecto.
	// Así no se duplican las sucursales de un prospecto que ya existía.
	for _, b := range branches {
		_, err = tx.ExecContext(ctx, `
INSERT INTO crm_prospect_branches (
    company_id, id, prospect_id, name, contact_name, contact_role,
    email, phone, country, city, address, is_primary, created_at, updated_at
)
SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1
    FROM crm_prospect_branches
    WHERE company_id = $1
      AND prospect_id = $3
      AND LOWER(TRIM(name)) = LOWER(TRIM($4))
      AND LOWER(TRIM(email)) = LOWER(TRIM($7))
);
`, companyID, uuid.NewString(), prospectID, b.name, b.contactName,
			b.contactRole, b.email, b.phone, b.country, b.city, b.address, b.isPrimary)
		if err != nil {
			return false, err
		}
	}

	result, err := tx.ExecContext(ctx, `
UPDATE crm_clients
SET soft_delete = true, updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, normalizedID)
	if err != nil {
		return false, err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	if affected == 0 {
		return false, nil
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM crm_client_branches
WHERE company_id = $1 AND client_id = $2;
`, companyID, normalizedID); err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}
	s.refreshGlobalSearch(ctx) // el cliente salió del índice y su rollback a prospecto entró
	return true, nil
}
