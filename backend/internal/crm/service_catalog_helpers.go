package crm

import (
	"context"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) ensureCatalogDefaults(ctx context.Context, companyID string) error {
	for _, catalogType := range catalogTypeOrder {
		for _, itemName := range defaultValuesForCatalog(catalogType) {
			if _, err := s.db.ExecContext(ctx, `
INSERT INTO crm_catalog_items (id, company_id, catalog_type, name, is_active, created_at, updated_at)
SELECT $1::text, $2::text, $3::text, $4::text, true, NOW(), NOW()
WHERE NOT EXISTS (
	SELECT 1
	FROM crm_catalog_items
	WHERE company_id = $2::text
	  AND catalog_type = $3::text
	  AND LOWER(name) = LOWER($4::text)
);
`, uuid.NewString(), companyID, catalogType, itemName); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *Service) listCatalogItems(ctx context.Context, companyID, catalogType string) ([]CatalogItem, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, name
FROM crm_catalog_items
WHERE company_id = $1
  AND catalog_type = $2
ORDER BY created_at ASC, name ASC;
`, companyID, catalogType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CatalogItem, 0)
	for rows.Next() {
		var item CatalogItem
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func normalizeCatalogType(raw string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case CatalogTypeEmployees, "empleados", "empleado", "employee":
		return CatalogTypeEmployees, nil
	case CatalogTypeSources, "fuentes", "fuente", "source":
		return CatalogTypeSources, nil
	case CatalogTypeServices, "servicios", "servicio", "service":
		return CatalogTypeServices, nil
	case CatalogTypeZones, "zonas", "zona":
		return CatalogTypeZones, nil
	default:
		return "", errCatalogTypeInvalid
	}
}

func firstDefaultCatalogValue(catalogType string) string {
	items := defaultValuesForCatalog(catalogType)
	if len(items) == 0 {
		return ""
	}
	return items[0]
}

func defaultValuesForCatalog(catalogType string) []string {
	source := defaultCatalogItems[catalogType]
	items := make([]string, len(source))
	copy(items, source)
	return items
}

func normalizeCatalogSelection(value, catalogType string) string {
	return trimOrDefault(value, firstDefaultCatalogValue(catalogType))
}

func trimOrDefault(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}
	return trimmed
}
