package crm

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) ListProspects(companyID string, query ProspectListQuery) ([]Prospect, error) {
	ctx := context.Background()
	if err := s.ensureCatalogDefaults(ctx, companyID); err != nil {
		return nil, err
	}

	filters := []string{"company_id = $1", "soft_delete = false"}
	args := []any{companyID}
	nextArg := 2

	if status := strings.TrimSpace(query.Status); status != "" {
		normalizedStatus, err := normalizeProspectStatus(status)
		if err != nil {
			return nil, err
		}
		filters = append(filters, fmt.Sprintf("status = $%d", nextArg))
		args = append(args, normalizedStatus)
		nextArg++
	}

	if search := strings.TrimSpace(query.Search); search != "" {
		searchPattern := "%" + strings.ToLower(search) + "%"
		filters = append(filters, fmt.Sprintf("(LOWER(name) LIKE $%d OR LOWER(email) LIKE $%d OR LOWER(company) LIKE $%d OR LOWER(nit) LIKE $%d)", nextArg, nextArg, nextArg, nextArg))
		args = append(args, searchPattern)
		nextArg++
	}

	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxProspectsListLimit {
		limit = maxProspectsListLimit
	}

	statement := buildProspectsListStatement(filters, 0)
	if limit > 0 {
		statement = buildProspectsListStatement(filters, nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Prospect, 0)
	for rows.Next() {
		item, err := scanProspect(rows)
		if err != nil {
			return nil, err
		}

		item.Branches, err = s.listProspectBranches(ctx, companyID, item.ID)
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

func (s *Service) GetProspect(companyID, prospectID string) (Prospect, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(prospectID)
	if normalizedID == "" {
		return Prospect{}, errProspectIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM crm_prospects
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, prospectSelectColumns), companyID, normalizedID)

	item, err := scanProspect(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Prospect{}, errProspectNotFound
		}
		return Prospect{}, err
	}

	item.Branches, err = s.listProspectBranches(ctx, companyID, item.ID)
	if err != nil {
		return Prospect{}, err
	}

	return item, nil
}

// ensureActiveNITAvailable bloquea crear/renombrar una cuenta con un NIT que
// ya ocupa otra cuenta activa (prospecto o cliente) de la misma empresa.
// Es la guarda de "Duplicados activos por company_id + NIT: 0" de la
// unificación de cuentas: el índice existe, pero la unicidad real la impone
// el servicio hasta que los datos legados se fusionen explícitamente.
func (s *Service) ensureActiveNITAvailable(ctx context.Context, companyID, nit, excludeProspectID string) error {
	trimmed := strings.TrimSpace(nit)
	if trimmed == "" {
		return nil
	}
	var occupied bool
	err := s.db.QueryRowContext(ctx, `
SELECT EXISTS(
    SELECT 1 FROM crm_accounts
    WHERE company_id = $1 AND soft_delete = false AND lifecycle_status <> 'inactivo'
      AND LOWER(TRIM(nit)) = LOWER(TRIM($2))
) OR EXISTS(
    SELECT 1 FROM crm_prospects
    WHERE company_id = $1 AND soft_delete = false
      AND ($3 = '' OR id <> $3)
      AND LOWER(TRIM(nit)) = LOWER(TRIM($2))
)`, companyID, trimmed, excludeProspectID).Scan(&occupied)
	if err != nil {
		return err
	}
	if occupied {
		return newValidationError(fmt.Sprintf("ya existe una cuenta activa con el NIT %s: no se puede crear otra cuenta con el mismo NIT", trimmed))
	}
	return nil
}

func (s *Service) CreateProspect(companyID string, req UpsertProspectRequest) (Prospect, error) {
	ctx := context.Background()
	if err := s.ensureCatalogDefaults(ctx, companyID); err != nil {
		return Prospect{}, err
	}

	payload, err := s.normalizeProspectPayload(req)
	if err != nil {
		return Prospect{}, err
	}

	if err := s.ensureActiveNITAvailable(ctx, companyID, payload.Nit, ""); err != nil {
		return Prospect{}, err
	}

	prospectID := uuid.NewString()
	if _, err := s.db.ExecContext(ctx, `
	INSERT INTO crm_prospects (
		id, company_id, name, email, mobile, company, nit, assigned_employee, source,
		ciiu_code, zone, prospect_value, allow_follow_up, status, service, note, website,
	office_phone, country, city, address, quotations, soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9,
	$10, $11, $12, $13, $14, $15, $16, $17,
	$18, $19, $20, $21, $22, false, NOW(), NOW()
);
`,
		prospectID,
		companyID,
		payload.Name,
		payload.Email,
		payload.Mobile,
		payload.Company,
		payload.Nit,
		payload.AssignedEmployee,
		payload.Source,
		payload.CiiuCode,
		payload.Zone,
		payload.ProspectValue,
		payload.AllowFollowUp,
		payload.Status,
		payload.Service,
		payload.Note,
		payload.Website,
		payload.OfficePhone,
		payload.Country,
		payload.City,
		payload.Address,
		payload.Quotations,
	); err != nil {
		return Prospect{}, err
	}

	if err := s.replaceProspectBranches(ctx, companyID, prospectID, payload.Branches); err != nil {
		return Prospect{}, err
	}

	s.refreshGlobalSearch(ctx) // el buscador global debe encontrar el prospecto recién creado
	return s.GetProspect(companyID, prospectID)
}

func (s *Service) UpdateProspect(companyID, prospectID string, req UpsertProspectRequest) (Prospect, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(prospectID)
	if normalizedID == "" {
		return Prospect{}, errProspectIDRequired
	}

	if err := s.ensureCatalogDefaults(ctx, companyID); err != nil {
		return Prospect{}, err
	}

	payload, err := s.normalizeProspectPayload(req)
	if err != nil {
		return Prospect{}, err
	}

	if err := s.ensureActiveNITAvailable(ctx, companyID, payload.Nit, normalizedID); err != nil {
		return Prospect{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_prospects
	SET name = $1,
	email = $2,
	mobile = $3,
	company = $4,
	nit = $5,
	assigned_employee = $6,
	source = $7,
	ciiu_code = $8,
	zone = $9,
	prospect_value = $10,
	allow_follow_up = $11,
	status = $12,
	service = $13,
	note = $14,
	website = $15,
	office_phone = $16,
	country = $17,
	city = $18,
	address = $19,
	quotations = $20,
	updated_at = NOW()
WHERE company_id = $21
  AND id = $22
  AND soft_delete = false;
`,
		payload.Name,
		payload.Email,
		payload.Mobile,
		payload.Company,
		payload.Nit,
		payload.AssignedEmployee,
		payload.Source,
		payload.CiiuCode,
		payload.Zone,
		payload.ProspectValue,
		payload.AllowFollowUp,
		payload.Status,
		payload.Service,
		payload.Note,
		payload.Website,
		payload.OfficePhone,
		payload.Country,
		payload.City,
		payload.Address,
		payload.Quotations,
		companyID,
		normalizedID,
	)
	if err != nil {
		return Prospect{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return Prospect{}, errProspectNotFound
	}

	if err := s.replaceProspectBranches(ctx, companyID, normalizedID, payload.Branches); err != nil {
		return Prospect{}, err
	}

	s.refreshGlobalSearch(ctx) // el buscador global debe reflejar los datos actualizados
	return s.GetProspect(companyID, normalizedID)
}
