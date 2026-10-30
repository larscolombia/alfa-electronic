package equipmentcatalog

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// Service expone los cuatro maestros de equipos por empresa. Todos los métodos
// filtran por companyID: el catálogo es configuración de negocio, no global.
type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

var (
	errCompanyRequired = errors.New("la empresa es obligatoria")
	errIDRequired      = errors.New("el id es obligatorio")
	errReassignTarget  = errors.New("selecciona una nueva ubicacion para reasignar los equipos")
	errNameRequired    = errors.New("el nombre es obligatorio")
	errModelIncomplete = errors.New("el modelo necesita marca o serie")
)

// newID genera un id cuando el cliente no manda ninguno. Se acepta el id del
// cliente porque el CRUD de la UI ya distingue crear de editar por id.
func newID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}

// GetCatalog devuelve los cuatro maestros en una sola consulta por entidad.
func (s *Service) GetCatalog(companyID string) (Catalog, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return Catalog{}, errCompanyRequired
	}

	families, err := s.listFamilies(companyID)
	if err != nil {
		return Catalog{}, err
	}
	models, err := s.listModels(companyID)
	if err != nil {
		return Catalog{}, err
	}
	serviceTypes, err := s.listServiceTypes(companyID)
	if err != nil {
		return Catalog{}, err
	}
	locations, err := s.listLocations(companyID)
	if err != nil {
		return Catalog{}, err
	}

	return Catalog{
		Families:     families,
		Models:       models,
		ServiceTypes: serviceTypes,
		Locations:    locations,
	}, nil
}

// ── Familias ────────────────────────────────────────────────────────────────

func (s *Service) listFamilies(companyID string) ([]Family, error) {
	rows, err := s.db.Query(`
SELECT id, name, description, active, updated_at
FROM company_equipment_families
WHERE company_id = $1
ORDER BY name, id;`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar familias: %w", err)
	}
	defer rows.Close()

	families := []Family{}
	for rows.Next() {
		var item Family
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.Active, &updatedAt); err != nil {
			return nil, fmt.Errorf("leer familia: %w", err)
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		families = append(families, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer familias: %w", err)
	}
	return families, nil
}

// UpsertFamily crea o actualiza una familia. updated_at lo fija el servidor:
// la marca de "cuándo se tocó" es dato del sistema, no del navegador.
func (s *Service) UpsertFamily(companyID string, item Family) (Family, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return Family{}, errCompanyRequired
	}
	item.ID = strings.TrimSpace(item.ID)
	if item.ID == "" {
		item.ID = newID("family")
	}
	item.Name = strings.TrimSpace(item.Name)
	item.Description = strings.TrimSpace(item.Description)
	if item.Name == "" {
		return Family{}, errNameRequired
	}

	var updatedAt time.Time
	err := s.db.QueryRow(`
INSERT INTO company_equipment_families (company_id, id, name, description, active, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
ON CONFLICT (company_id, id)
DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
	active = EXCLUDED.active, updated_at = NOW()
RETURNING updated_at;`,
		companyID, item.ID, item.Name, item.Description, item.Active,
	).Scan(&updatedAt)
	if err != nil {
		return Family{}, fmt.Errorf("guardar familia: %w", err)
	}
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *Service) DeleteFamily(companyID, id string) error {
	return s.deleteRow("company_equipment_families", "familia", companyID, id)
}

// ── Modelos industriales ────────────────────────────────────────────────────

func (s *Service) listModels(companyID string) ([]Model, error) {
	rows, err := s.db.Query(`
SELECT id, family_id, brand, model_type, series, is_industrial, active, notes, updated_at
FROM company_equipment_models
WHERE company_id = $1
ORDER BY brand, series, id;`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar modelos: %w", err)
	}
	defer rows.Close()

	models := []Model{}
	for rows.Next() {
		var item Model
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.FamilyID, &item.Brand, &item.Type, &item.Series,
			&item.IsIndustrial, &item.Active, &item.Notes, &updatedAt); err != nil {
			return nil, fmt.Errorf("leer modelo: %w", err)
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		models = append(models, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer modelos: %w", err)
	}
	return models, nil
}

func (s *Service) UpsertModel(companyID string, item Model) (Model, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return Model{}, errCompanyRequired
	}
	item.ID = strings.TrimSpace(item.ID)
	if item.ID == "" {
		item.ID = newID("model")
	}
	item.FamilyID = strings.TrimSpace(item.FamilyID)
	item.Brand = strings.TrimSpace(item.Brand)
	item.Type = strings.TrimSpace(item.Type)
	item.Series = strings.TrimSpace(item.Series)
	item.Notes = strings.TrimSpace(item.Notes)
	// Sin marca ni serie el registro no identifica nada: sería una fila fantasma
	// en el selector "Modelo industrial".
	if item.Brand == "" && item.Series == "" {
		return Model{}, errModelIncomplete
	}

	var updatedAt time.Time
	err := s.db.QueryRow(`
INSERT INTO company_equipment_models (
	company_id, id, family_id, brand, model_type, series, is_industrial, active, notes, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
ON CONFLICT (company_id, id)
DO UPDATE SET family_id = EXCLUDED.family_id, brand = EXCLUDED.brand,
	model_type = EXCLUDED.model_type, series = EXCLUDED.series,
	is_industrial = EXCLUDED.is_industrial, active = EXCLUDED.active,
	notes = EXCLUDED.notes, updated_at = NOW()
RETURNING updated_at;`,
		companyID, item.ID, item.FamilyID, item.Brand, item.Type, item.Series,
		item.IsIndustrial, item.Active, item.Notes,
	).Scan(&updatedAt)
	if err != nil {
		return Model{}, fmt.Errorf("guardar modelo: %w", err)
	}
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *Service) DeleteModel(companyID, id string) error {
	return s.deleteRow("company_equipment_models", "modelo", companyID, id)
}

// ── Tipos de servicio ───────────────────────────────────────────────────────

func (s *Service) listServiceTypes(companyID string) ([]ServiceType, error) {
	rows, err := s.db.Query(`
SELECT id, name, description, active, updated_at
FROM company_equipment_service_types
WHERE company_id = $1
ORDER BY name, id;`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar tipos de servicio: %w", err)
	}
	defer rows.Close()

	serviceTypes := []ServiceType{}
	for rows.Next() {
		var item ServiceType
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.Active, &updatedAt); err != nil {
			return nil, fmt.Errorf("leer tipo de servicio: %w", err)
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		serviceTypes = append(serviceTypes, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer tipos de servicio: %w", err)
	}
	return serviceTypes, nil
}

func (s *Service) UpsertServiceType(companyID string, item ServiceType) (ServiceType, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return ServiceType{}, errCompanyRequired
	}
	item.ID = strings.TrimSpace(item.ID)
	if item.ID == "" {
		item.ID = newID("service-type")
	}
	item.Name = strings.TrimSpace(item.Name)
	item.Description = strings.TrimSpace(item.Description)
	if item.Name == "" {
		return ServiceType{}, errNameRequired
	}

	var updatedAt time.Time
	err := s.db.QueryRow(`
INSERT INTO company_equipment_service_types (company_id, id, name, description, active, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
ON CONFLICT (company_id, id)
DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
	active = EXCLUDED.active, updated_at = NOW()
RETURNING updated_at;`,
		companyID, item.ID, item.Name, item.Description, item.Active,
	).Scan(&updatedAt)
	if err != nil {
		return ServiceType{}, fmt.Errorf("guardar tipo de servicio: %w", err)
	}
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func (s *Service) DeleteServiceType(companyID, id string) error {
	return s.deleteRow("company_equipment_service_types", "tipo de servicio", companyID, id)
}

// ── Ubicaciones / estanterías ───────────────────────────────────────────────

func (s *Service) listLocations(companyID string) ([]Location, error) {
	rows, err := s.db.Query(`
SELECT id, name, description, active, updated_at
FROM company_equipment_locations
WHERE company_id = $1
ORDER BY name, id;`, companyID)
	if err != nil {
		return nil, fmt.Errorf("listar ubicaciones: %w", err)
	}
	defer rows.Close()

	locations := []Location{}
	for rows.Next() {
		var item Location
		var updatedAt time.Time
		if err := rows.Scan(&item.ID, &item.Name, &item.Description, &item.Active, &updatedAt); err != nil {
			return nil, fmt.Errorf("leer ubicacion: %w", err)
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		locations = append(locations, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer ubicaciones: %w", err)
	}
	return locations, nil
}

func (s *Service) LocationExists(companyID, id string) (bool, error) {
	var exists bool
	err := s.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM company_equipment_locations WHERE company_id = $1 AND id = $2)`, strings.TrimSpace(companyID), strings.TrimSpace(id)).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("consultar ubicacion: %w", err)
	}
	return exists, nil
}

func (s *Service) UpsertLocation(companyID string, item Location) (Location, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return Location{}, errCompanyRequired
	}
	item.ID = strings.TrimSpace(item.ID)
	if item.ID == "" {
		item.ID = newID("location")
	}
	item.Name = strings.TrimSpace(item.Name)
	item.Description = strings.TrimSpace(item.Description)
	if item.Name == "" {
		return Location{}, errNameRequired
	}

	var updatedAt time.Time
	err := s.db.QueryRow(`
INSERT INTO company_equipment_locations (company_id, id, name, description, active, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
ON CONFLICT (company_id, id)
DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
	active = EXCLUDED.active, updated_at = NOW()
RETURNING updated_at;`,
		companyID, item.ID, item.Name, item.Description, item.Active,
	).Scan(&updatedAt)
	if err != nil {
		return Location{}, fmt.Errorf("guardar ubicacion: %w", err)
	}
	// Los equipos guardan el ID como referencia estable y el nombre como una
	// copia para listados/snapshots. Renombrar no cambia el ID, pero actualiza
	// esa copia en todos los módulos que leen crm_equipment_records.
	if err := s.renameLocationReferences(companyID, item.ID, item.Name); err != nil {
		return Location{}, err
	}
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

// DeleteLocation nunca deja equipos apuntando a una ubicación inexistente:
// reasigna primero por ID dentro de la misma transacción y luego elimina el
// maestro. targetID es obligatorio y debe pertenecer a la misma empresa.
func (s *Service) DeleteLocation(companyID, id, targetID string) error {
	companyID = strings.TrimSpace(companyID)
	id = strings.TrimSpace(id)
	targetID = strings.TrimSpace(targetID)
	if companyID == "" {
		return errCompanyRequired
	}
	if id == "" {
		return errIDRequired
	}
	if targetID == "" || id == targetID {
		return errReassignTarget
	}

	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("iniciar reasignacion de ubicacion: %w", err)
	}
	defer tx.Rollback()

	var targetName string
	if err := tx.QueryRow(`SELECT name FROM company_equipment_locations WHERE company_id = $1 AND id = $2`, companyID, targetID).Scan(&targetName); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errReassignTarget
		}
		return fmt.Errorf("consultar nueva ubicacion: %w", err)
	}
	if _, err := tx.Exec(locationReferenceUpdateSQL, targetID, targetName, companyID, id); err != nil {
		return fmt.Errorf("reasignar equipos de ubicacion: %w", err)
	}
	result, err := tx.Exec(`DELETE FROM company_equipment_locations WHERE company_id = $1 AND id = $2`, companyID, id)
	if err != nil {
		return fmt.Errorf("borrar ubicacion: %w", err)
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return errIDRequired
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("confirmar reasignacion de ubicacion: %w", err)
	}
	return nil
}

const locationReferenceUpdateSQL = `
UPDATE crm_equipment_records
SET items_json = (
	SELECT COALESCE(jsonb_agg(
		CASE WHEN item->>'storageLocationId' = $4
			THEN jsonb_set(jsonb_set(item, '{storageLocationId}', to_jsonb($1::text)), '{storageLocationName}', to_jsonb($2::text))
			ELSE item
		END
	), '[]'::jsonb)
	FROM jsonb_array_elements(items_json) AS item
), updated_at = NOW()
WHERE company_id = $3
  AND EXISTS (SELECT 1 FROM jsonb_array_elements(items_json) AS item WHERE item->>'storageLocationId' = $4);`

func (s *Service) renameLocationReferences(companyID, id, name string) error {
	if _, err := s.db.Exec(locationReferenceUpdateSQL, id, name, companyID, id); err != nil {
		return fmt.Errorf("actualizar referencias de ubicacion: %w", err)
	}
	return nil
}

// ── Borrado compartido ──────────────────────────────────────────────────────

// deleteRow borra por (company_id, id). Las tablas se nombran desde constantes
// internas, nunca desde input del cliente, así que no hay inyección.
func (s *Service) deleteRow(table, label, companyID, id string) error {
	companyID = strings.TrimSpace(companyID)
	id = strings.TrimSpace(id)
	if companyID == "" {
		return errCompanyRequired
	}
	if id == "" {
		return errIDRequired
	}

	query := fmt.Sprintf(`DELETE FROM %s WHERE company_id = $1 AND id = $2;`, table)
	if _, err := s.db.Exec(query, companyID, id); err != nil {
		return fmt.Errorf("borrar %s: %w", label, err)
	}
	return nil
}
