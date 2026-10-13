package hr

import (
	"context"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) AddPosition(companyID, name string) (CatalogItem, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return CatalogItem{}, err
	}

	normalized := normalizeCatalogName(name)
	if normalized == "" {
		return CatalogItem{}, errCatalogNameRequired
	}

	var exists int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM hr_positions
WHERE company_id = $1
  AND LOWER(name) = LOWER($2)
`, companyID, normalized).Scan(&exists); err != nil {
		return CatalogItem{}, err
	}

	if exists > 0 {
		return CatalogItem{}, errCatalogNameExists
	}

	item := CatalogItem{ID: uuid.NewString(), Name: normalized}
	if _, err := s.db.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, item.ID, companyID, item.Name); err != nil {
		return CatalogItem{}, err
	}

	return item, nil
}

func (s *Service) RemovePosition(companyID, id string) (bool, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return false, err
	}

	result, err := s.db.ExecContext(ctx, `
DELETE FROM hr_positions
WHERE company_id = $1 AND id = $2;
`, companyID, strings.TrimSpace(id))
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	return affected > 0, nil
}

func (s *Service) RestoreDefaultPositions(companyID string) ([]CatalogItem, error) {
	ctx := context.Background()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM hr_positions
WHERE company_id = $1;
`, companyID); err != nil {
		tx.Rollback()
		return nil, err
	}

	for _, name := range defaultPositionNames() {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, uuid.NewString(), companyID, name); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.listPositions(ctx, companyID)
}

func (s *Service) AddDepartment(companyID, name string) (CatalogItem, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return CatalogItem{}, err
	}

	normalized := normalizeCatalogName(name)
	if normalized == "" {
		return CatalogItem{}, errCatalogNameRequired
	}

	var exists int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM hr_departments
WHERE company_id = $1
  AND LOWER(name) = LOWER($2)
`, companyID, normalized).Scan(&exists); err != nil {
		return CatalogItem{}, err
	}

	if exists > 0 {
		return CatalogItem{}, errCatalogNameExists
	}

	item := CatalogItem{ID: uuid.NewString(), Name: normalized}
	if _, err := s.db.ExecContext(ctx, `
INSERT INTO hr_departments (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, item.ID, companyID, item.Name); err != nil {
		return CatalogItem{}, err
	}

	return item, nil
}

func (s *Service) RemoveDepartment(companyID, id string) (bool, error) {
	ctx := context.Background()
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return false, err
	}

	result, err := s.db.ExecContext(ctx, `
DELETE FROM hr_departments
WHERE company_id = $1 AND id = $2;
`, companyID, strings.TrimSpace(id))
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	return affected > 0, nil
}

func (s *Service) RestoreDefaultDepartments(companyID string) ([]CatalogItem, error) {
	ctx := context.Background()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM hr_departments
WHERE company_id = $1;
`, companyID); err != nil {
		tx.Rollback()
		return nil, err
	}

	for _, name := range defaultDepartmentNames() {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_departments (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, uuid.NewString(), companyID, name); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.listDepartments(ctx, companyID)
}

func (s *Service) RestoreAllDefaults(companyID string) (CatalogsResponse, error) {
	ctx := context.Background()
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return CatalogsResponse{}, err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM hr_positions WHERE company_id = $1;`, companyID); err != nil {
		tx.Rollback()
		return CatalogsResponse{}, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM hr_departments WHERE company_id = $1;`, companyID); err != nil {
		tx.Rollback()
		return CatalogsResponse{}, err
	}

	for _, name := range defaultPositionNames() {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW());
`, uuid.NewString(), companyID, name); err != nil {
			tx.Rollback()
			return CatalogsResponse{}, err
		}
	}

	for _, name := range defaultDepartmentNames() {
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
