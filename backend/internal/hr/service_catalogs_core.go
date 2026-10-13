package hr

import (
	"context"

	"github.com/google/uuid"
)

func (s *Service) Catalogs(companyID string) (CatalogsResponse, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return CatalogsResponse{}, err
	}

	positions, err := s.listPositions(ctx, companyID)
	if err != nil {
		return CatalogsResponse{}, err
	}

	departments, err := s.listDepartments(ctx, companyID)
	if err != nil {
		return CatalogsResponse{}, err
	}

	return CatalogsResponse{
		Positions:   positions,
		Departments: departments,
	}, nil
}

func (s *Service) SyncCatalogs(companyID string, req CatalogSyncRequest) (CatalogsResponse, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return CatalogsResponse{}, err
	}

	positions := normalizeCatalogNames(req.Positions, defaultPositionNames())
	departments := normalizeCatalogNames(req.Departments, defaultDepartmentNames())

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CatalogsResponse{}, err
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM hr_positions
WHERE company_id = $1;
`, companyID); err != nil {
		tx.Rollback()
		return CatalogsResponse{}, err
	}

	for _, name := range positions {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, uuid.NewString(), companyID, name); err != nil {
			tx.Rollback()
			return CatalogsResponse{}, err
		}
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM hr_departments
WHERE company_id = $1;
`, companyID); err != nil {
		tx.Rollback()
		return CatalogsResponse{}, err
	}

	for _, name := range departments {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_departments (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, uuid.NewString(), companyID, name); err != nil {
			tx.Rollback()
			return CatalogsResponse{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return CatalogsResponse{}, err
	}

	return s.Catalogs(companyID)
}
