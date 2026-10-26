package acl

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
)

func (s *Service) ListRoles(companyID string) ([]Role, error) {
	ctx := context.Background()
	if err := s.ensureStaticData(ctx); err != nil {
		return nil, err
	}
	if err := s.ensureDefaultRoles(ctx, companyID); err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
SELECT id, company_id, name, description, is_active, created_at, updated_at
FROM acl_roles
WHERE company_id = $1
ORDER BY created_at ASC;
`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	roles := make([]Role, 0)
	for rows.Next() {
		var row Role
		if err := rows.Scan(
			&row.ID,
			&row.CompanyID,
			&row.Name,
			&row.Description,
			&row.IsActive,
			&row.CreatedAt,
			&row.UpdatedAt,
		); err != nil {
			return nil, err
		}
		roles = append(roles, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return roles, nil
}

func (s *Service) CreateRole(companyID string, req CreateRoleRequest) (CreateRoleResponse, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return CreateRoleResponse{}, errRoleNameRequired
	}
	if utf8.RuneCountInString(name) > 80 {
		return CreateRoleResponse{}, errRoleNameTooLong
	}

	seed, ok := roleSeedByName(name)
	if !ok {
		return CreateRoleResponse{}, errRoleNotAllowed
	}

	description := strings.TrimSpace(req.Description)
	if description == "" {
		description = seed.description
	}

	ctx := context.Background()
	if err := s.ensureStaticData(ctx); err != nil {
		return CreateRoleResponse{}, err
	}

	return s.createRoleWithSeed(ctx, companyID, seed.name, description)
}

func (s *Service) createRoleWithSeed(ctx context.Context, companyID, name, description string) (CreateRoleResponse, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CreateRoleResponse{}, err
	}

	role, summary, err := s.createRoleTx(ctx, tx, companyID, name, description)
	if err != nil {
		tx.Rollback()
		return CreateRoleResponse{}, err
	}

	if err := tx.Commit(); err != nil {
		return CreateRoleResponse{}, err
	}

	return CreateRoleResponse{
		Role:        role,
		SeedSummary: summary,
	}, nil
}

func (s *Service) createRoleTx(ctx context.Context, tx *sql.Tx, companyID, name, description string) (Role, RoleSeedSummary, error) {
	var existingID string
	err := tx.QueryRowContext(ctx, `
SELECT id
FROM acl_roles
WHERE company_id = $1 AND LOWER(name) = LOWER($2)
LIMIT 1;
`, companyID, name).Scan(&existingID)
	if err == nil {
		return Role{}, RoleSeedSummary{}, errRoleAlreadyExist
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return Role{}, RoleSeedSummary{}, err
	}

	now := time.Now().UTC()
	role := Role{
		ID:          uuid.NewString(),
		CompanyID:   companyID,
		Name:        name,
		Description: description,
		IsActive:    true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_roles (id, company_id, name, description, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, true, $5, $6);
`, role.ID, role.CompanyID, role.Name, role.Description, role.CreatedAt, role.UpdatedAt); err != nil {
		return Role{}, RoleSeedSummary{}, err
	}

	summary, err := s.seedRolePermissionsTx(ctx, tx, role.ID, role.Name)
	if err != nil {
		return Role{}, RoleSeedSummary{}, err
	}

	return role, summary, nil
}

func defaultRoleSeeds() []roleSeed {
	return []roleSeed{
		{name: "Superadmin", description: "Control total de la plataforma"},
		{name: "ventas", description: "Gestion comercial y seguimiento de clientes"},
		{name: "Técnico", description: "Operacion tecnica y ejecucion de servicios"},
	}
}

func roleSeedByName(name string) (roleSeed, bool) {
	normalizedName := normalizeRoleName(name)
	for _, seed := range defaultRoleSeeds() {
		if normalizeRoleName(seed.name) == normalizedName {
			return seed, true
		}
	}

	return roleSeed{}, false
}

func normalizeRoleName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}
