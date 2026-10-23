package equipment

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	errTechnicianIDRequired = errors.New("assignedToId es obligatorio")
	errTechnicianNotFound   = errors.New("tecnico no encontrado")
)

// Contextos de relevancia por donde se muestra el listado. Los roles y
// departamentos en hr_employees son texto libre, así que el filtrado va por
// palabras clave contra rol O departamento (insensible a mayúsculas). Un
// contexto vacío o desconocido devuelve TODOS los activos: compatibilidad con
// llamadores anteriores al filtro.
var technicianContextKeywords = map[string][]string{
	"tecnica":   {"tecnic", "soporte", "operacion", "mantenimient", "taller"},
	"comercial": {"comercial", "venta"},
}

// ListTechniciansForContext aplica el filtro por contexto y devuelve las
// palabras clave activas (vacío si no hay filtro). Separado para testear la
// semántica sin base de datos.
func ListTechniciansForContext(roleContext string) []string {
	return technicianContextKeywords[strings.ToLower(strings.TrimSpace(roleContext))]
}

func (s *Service) ListTechnicians(companyID, speciality, roleContext string) ([]TechnicianSummary, error) {
	ctx := context.Background()
	normalizedSpeciality := strings.TrimSpace(speciality)

	query := `
SELECT
	e.id,
	e.name,
	e.role,
	e.department,
	COALESCE((
		SELECT COUNT(*)
		FROM crm_equipment_records r
		CROSS JOIN LATERAL jsonb_array_elements(r.items_json) AS item
		WHERE r.company_id = e.company_id
		  AND r.archived = false
		  AND lower(btrim(coalesce(item->>'assignedToId', ''))) = lower(btrim(e.id))
		  AND lower(btrim(coalesce(item->>'repairStatus', 'recibido'))) <> 'entregado'
	), 0) AS active_items
FROM hr_employees e
WHERE e.company_id = $1
  AND e.soft_delete = false
  AND e.status = 'Activo'`

	args := []any{companyID}
	if normalizedSpeciality != "" {
		query += `
  AND (
		lower(coalesce(e.role, '')) LIKE lower($2)
		OR lower(coalesce(e.department, '')) LIKE lower($2)
  )`
		args = append(args, "%"+normalizedSpeciality+"%")
	}

	if keywords := ListTechniciansForContext(roleContext); len(keywords) > 0 {
		clauses := make([]string, 0, len(keywords)*2)
		for _, keyword := range keywords {
			param := fmt.Sprintf("%%%s%%", keyword)
			args = append(args, param)
			placeholder := fmt.Sprintf("$%d", len(args))
			clauses = append(clauses,
				fmt.Sprintf("lower(coalesce(e.role, '')) LIKE %s", placeholder),
				fmt.Sprintf("lower(coalesce(e.department, '')) LIKE %s", placeholder),
			)
		}
		query += "\n  AND (" + strings.Join(clauses, " OR ") + ")"
	}

	query += `
ORDER BY active_items ASC, e.name ASC;`

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]TechnicianSummary, 0)
	for rows.Next() {
		var item TechnicianSummary
		if err := rows.Scan(&item.ID, &item.Name, &item.Role, &item.Department, &item.ActiveItems); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) AssignItemTechnician(companyID, recordID, itemID string, req AssignTechnicianRequest) (Item, error) {
	recordID = strings.TrimSpace(recordID)
	itemID = strings.TrimSpace(itemID)
	assignedToID := strings.TrimSpace(req.AssignedToID)
	if recordID == "" {
		return Item{}, errRecordIDRequired
	}
	if itemID == "" {
		return Item{}, errItemIDRequired
	}
	if assignedToID == "" {
		return Item{}, errTechnicianIDRequired
	}

	technician, err := s.lookupTechnician(companyID, assignedToID)
	if err != nil {
		return Item{}, err
	}

	record, err := s.GetRecord(companyID, recordID, false)
	if err != nil {
		return Item{}, err
	}

	assignedAt := time.Now().UTC().Format(time.RFC3339)
	if parsedAssignedAt, parseErr := parseOptionalISO(strings.TrimSpace(req.AssignedAt)); parseErr == nil {
		assignedAt = parsedAssignedAt.UTC().Format(time.RFC3339)
	}

	assignedBy := strings.TrimSpace(req.AssignedBy)
	if assignedBy == "" {
		assignedBy = "jefe-tecnico"
	}

	updated := false
	for index, item := range record.Items {
		if strings.TrimSpace(item.ID) != itemID {
			continue
		}

		item.AssignedToID = technician.ID
		item.AssignedTo = technician.Name
		item.AssignedAt = assignedAt
		item.AssignedBy = assignedBy
		record.Items[index] = item
		record.AssignedTo = technician.Name
		updated = true
		break
	}

	if !updated {
		return Item{}, errItemNotFound
	}

	if _, err := s.UpsertRecord(companyID, record); err != nil {
		return Item{}, err
	}

	refreshedRecord, err := s.GetRecord(companyID, recordID, true)
	if err != nil {
		return Item{}, err
	}

	for _, item := range refreshedRecord.Items {
		if strings.TrimSpace(item.ID) == itemID {
			return item, nil
		}
	}

	return Item{}, errItemNotFound
}

func (s *Service) lookupTechnician(companyID, technicianID string) (TechnicianSummary, error) {
	ctx := context.Background()
	row := s.db.QueryRowContext(ctx, `
SELECT id, name, role, department
FROM hr_employees
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false
  AND status = 'Activo';
`, companyID, technicianID)

	item := TechnicianSummary{}
	if err := row.Scan(&item.ID, &item.Name, &item.Role, &item.Department); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return TechnicianSummary{}, errTechnicianNotFound
		}
		return TechnicianSummary{}, err
	}

	return item, nil
}
