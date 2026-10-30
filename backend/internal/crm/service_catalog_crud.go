package crm

import (
	"context"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) Catalogs(companyID string) (CatalogsResponse, error) {
	ctx := context.Background()
	if err := s.ensureCatalogDefaults(ctx, companyID); err != nil {
		return CatalogsResponse{}, err
	}

	employees, err := s.listCatalogItems(ctx, companyID, CatalogTypeEmployees)
	if err != nil {
		return CatalogsResponse{}, err
	}

	sources, err := s.listCatalogItems(ctx, companyID, CatalogTypeSources)
	if err != nil {
		return CatalogsResponse{}, err
	}

	services, err := s.listCatalogItems(ctx, companyID, CatalogTypeServices)
	if err != nil {
		return CatalogsResponse{}, err
	}

	zones, err := s.listCatalogItems(ctx, companyID, CatalogTypeZones)
	if err != nil {
		return CatalogsResponse{}, err
	}

	return CatalogsResponse{
		Employees: employees,
		Sources:   sources,
		Services:  services,
		Zones:     zones,
	}, nil
}

func (s *Service) ListCatalog(companyID, catalogType string) ([]CatalogItem, error) {
	ctx := context.Background()
	normalizedType, err := normalizeCatalogType(catalogType)
	if err != nil {
		return nil, err
	}

	if err := s.ensureCatalogDefaults(ctx, companyID); err != nil {
		return nil, err
	}

	return s.listCatalogItems(ctx, companyID, normalizedType)
}

func (s *Service) AddCatalogItem(companyID, catalogType, name string) (CatalogItem, error) {
	ctx := context.Background()
	normalizedType, err := normalizeCatalogType(catalogType)
	if err != nil {
		return CatalogItem{}, err
	}

	if err := s.ensureCatalogDefaults(ctx, companyID); err != nil {
		return CatalogItem{}, err
	}

	normalizedName := strings.TrimSpace(name)
	if normalizedName == "" {
		return CatalogItem{}, errCatalogNameRequired
	}

	var exists int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM crm_catalog_items
WHERE company_id = $1
  AND catalog_type = $2
  AND LOWER(name) = LOWER($3);
`, companyID, normalizedType, normalizedName).Scan(&exists); err != nil {
		return CatalogItem{}, err
	}

	if exists > 0 {
		return CatalogItem{}, errCatalogNameExists
	}

	item := CatalogItem{
		ID:   uuid.NewString(),
		Name: normalizedName,
	}

	if _, err := s.db.ExecContext(ctx, `
INSERT INTO crm_catalog_items (id, company_id, catalog_type, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, true, NOW(), NOW());
`, item.ID, companyID, normalizedType, item.Name); err != nil {
		return CatalogItem{}, err
	}

	return item, nil
}

func (s *Service) RemoveCatalogItem(companyID, catalogType, itemID string) (bool, error) {
	ctx := context.Background()
	normalizedType, err := normalizeCatalogType(catalogType)
	if err != nil {
		return false, err
	}

	normalizedID := strings.TrimSpace(itemID)
	if normalizedID == "" {
		return false, errCatalogItemIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
DELETE FROM crm_catalog_items
WHERE company_id = $1
  AND catalog_type = $2
  AND id = $3;
`, companyID, normalizedType, normalizedID)
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	return affected > 0, nil
}

func (s *Service) RestoreDefaultCatalog(companyID, catalogType string) ([]CatalogItem, error) {
	ctx := context.Background()
	normalizedType, err := normalizeCatalogType(catalogType)
	if err != nil {
		return nil, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM crm_catalog_items
WHERE company_id = $1
  AND catalog_type = $2;
`, companyID, normalizedType); err != nil {
		tx.Rollback()
		return nil, err
	}

	for _, itemName := range defaultValuesForCatalog(normalizedType) {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO crm_catalog_items (id, company_id, catalog_type, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, true, NOW(), NOW());
`, uuid.NewString(), companyID, normalizedType, itemName); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return s.listCatalogItems(ctx, companyID, normalizedType)
}
