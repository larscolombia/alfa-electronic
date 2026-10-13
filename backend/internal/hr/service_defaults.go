package hr

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) ensureCompanyDefaults(ctx context.Context, companyID string) error {
	var positionsCount int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*) FROM hr_positions WHERE company_id = $1;
`, companyID).Scan(&positionsCount); err != nil {
		return err
	}

	if positionsCount == 0 {
		for _, name := range defaultPositionNames() {
			if _, err := s.db.ExecContext(ctx, `
INSERT INTO hr_positions (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW())
ON CONFLICT (company_id, name) DO NOTHING;
`, uuid.NewString(), companyID, name); err != nil {
				return err
			}
		}
	}

	var departmentsCount int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*) FROM hr_departments WHERE company_id = $1;
`, companyID).Scan(&departmentsCount); err != nil {
		return err
	}

	if departmentsCount == 0 {
		for _, name := range defaultDepartmentNames() {
			if _, err := s.db.ExecContext(ctx, `
INSERT INTO hr_departments (id, company_id, name, is_active, created_at, updated_at)
VALUES ($1, $2, $3, true, NOW(), NOW())
ON CONFLICT (company_id, name) DO NOTHING;
`, uuid.NewString(), companyID, name); err != nil {
				return err
			}
		}
	}

	var employeesCount int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*) FROM hr_employees WHERE company_id = $1;
`, companyID).Scan(&employeesCount); err != nil {
		return err
	}

	if employeesCount == 0 {
		for _, employee := range defaultEmployees() {
			if _, err := s.db.ExecContext(ctx, `
INSERT INTO hr_employees (
company_id, id, name, role, department, manager, status, file_complete, soft_delete, created_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())
ON CONFLICT (company_id, id) DO NOTHING;
`, companyID, employee.ID, employee.Name, employee.Role, employee.Department, employee.Manager, employee.Status, employee.FileComplete); err != nil {
				return err
			}
		}
	}

	return nil
}

func (s *Service) listPositions(ctx context.Context, companyID string) ([]CatalogItem, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, name
FROM hr_positions
WHERE company_id = $1
ORDER BY created_at ASC;
`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CatalogItem, 0)
	for rows.Next() {
		var row CatalogItem
		if err := rows.Scan(&row.ID, &row.Name); err != nil {
			return nil, err
		}
		items = append(items, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) listDepartments(ctx context.Context, companyID string) ([]CatalogItem, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, name
FROM hr_departments
WHERE company_id = $1
ORDER BY created_at ASC;
`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CatalogItem, 0)
	for rows.Next() {
		var row CatalogItem
		if err := rows.Scan(&row.ID, &row.Name); err != nil {
			return nil, err
		}
		items = append(items, row)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) nextEmployeeCode(ctx context.Context, companyID string) (string, error) {
	var maxNumber int
	err := s.db.QueryRowContext(ctx, `
SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 5) AS INTEGER)), 0)
FROM hr_employees
WHERE company_id = $1
  AND id ~ '^EMP-[0-9]+$';
`, companyID).Scan(&maxNumber)
	if err != nil {
		return "", err
	}

	next := maxNumber + 1
	return fmt.Sprintf("EMP-%03d", next), nil
}

func defaultPositionNames() []string {
	return []string{"Coordinador SST", "Tecnico soporte", "Tecnico de campo", "Analista RRHH"}
}

func defaultDepartmentNames() []string {
	return []string{"Gestion Humana", "Operaciones", "Comercial", "Finanzas"}
}

func defaultEmployees() []Employee {
	return []Employee{
		{ID: "EMP-001", Name: "Ludwig Angarita", Role: "Coordinador SST", Department: "Gestion Humana", Manager: "Direccion General", Status: "Activo", FileComplete: true},
		{ID: "EMP-002", Name: "Danny Ramirez", Role: "Tecnico soporte", Department: "Operaciones", Manager: "Ludwig Angarita", Status: "Activo", FileComplete: false},
		{ID: "EMP-003", Name: "Elkin Ramirez", Role: "Tecnico de campo", Department: "Operaciones", Manager: "Danny Ramirez", Status: "Activo", FileComplete: true},
		{ID: "EMP-004", Name: "Maria Londono", Role: "Analista RRHH", Department: "Gestion Humana", Manager: "Direccion General", Status: "Licencia", FileComplete: false},
	}
}

func normalizeCatalogNames(values []string, fallback []string) []string {
	unique := make(map[string]bool)
	normalized := make([]string, 0, len(values))

	for _, value := range values {
		name := normalizeCatalogName(value)
		if name == "" {
			continue
		}

		key := strings.ToLower(name)
		if unique[key] {
			continue
		}

		normalized = append(normalized, name)
		unique[key] = true
	}

	if len(normalized) > 0 {
		return normalized
	}

	fallbackCopy := make([]string, len(fallback))
	copy(fallbackCopy, fallback)
	return fallbackCopy
}

func normalizeCatalogName(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func normalizeEmployeeStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "inactivo", "inactive":
		return "Inactivo"
	case "licencia", "leave":
		return "Licencia"
	default:
		return "Activo"
	}
}
