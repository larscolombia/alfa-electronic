package projects

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const (
	defaultProjectsListLimit = 200
	maxProjectsListLimit     = 1000

	projectSelectColumns = `id, status, properties_json, created_at, updated_at`

	// reservedBoardConfigProjectID almacena la configuracion de columnas del
	// tablero tecnico como una fila reservada de la tabla projects. Reemplaza
	// la persistencia anterior en localStorage del navegador (Fase 3).
	reservedBoardConfigProjectID = "board-config"
)

var (
	errProjectIDRequired             = errors.New("el id del proyecto es obligatorio")
	errProjectNotFound               = errors.New("proyecto no encontrado")
	errProjectStatusInvalid          = errors.New("estado de proyecto invalido")
	errProjectTransitionInvalid      = errors.New("transicion de estado invalida")
	errProjectPropertiesInvalid      = errors.New("las propiedades del proyecto no son validas")
	errProjectsListLimitInvalid      = errors.New("el limite debe ser mayor que cero")
	errDiagnosisFaultRequired        = errors.New("debes marcar falla identificada para cerrar diagnostico")
	errDiagnosisEstimatedHoursNeeded = errors.New("debes registrar horas estimadas mayores que cero para cerrar diagnostico")
	errDiagnosisPartsBudgetNeeded    = errors.New("debes registrar presupuesto de repuestos en USD mayor que cero")
	errSLAConfigInvalid              = errors.New("configuracion SLA invalida: stage es obligatorio y los dias deben ser mayores o iguales a cero")
)

var allowedProjectStatuses = map[string]struct{}{
	"recibido":                  {},
	"diagnostico":               {},
	"por-cotizar":               {},
	"pedir-repuestos":           {},
	"esperando-proveedor":       {},
	"reparacion":                {},
	"garantia":                  {},
	"prestamo":                  {},
	"listo-entrega":             {},
	"entregado":                 {},
	"garantia-espera-repuestos": {},
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) ListProjects(companyID string, query ListProjectsQuery) ([]Project, error) {
	statusFilter := strings.TrimSpace(query.Status)
	if statusFilter != "" {
		normalizedStatus, ok := normalizeStatus(statusFilter)
		if !ok {
			return nil, errProjectStatusInvalid
		}
		statusFilter = normalizedStatus
	}

	limit, err := normalizeListLimit(query.Limit)
	if err != nil {
		return nil, err
	}

	sqlQuery := fmt.Sprintf(`SELECT %s FROM projects WHERE company_id = $1 AND id <> $2`, projectSelectColumns)
	args := []any{strings.TrimSpace(companyID), reservedBoardConfigProjectID}
	argIndex := 3

	if statusFilter != "" {
		sqlQuery += fmt.Sprintf(" AND status = $%d", argIndex)
		args = append(args, statusFilter)
		argIndex++
	}

	sqlQuery += fmt.Sprintf(" ORDER BY updated_at DESC LIMIT $%d", argIndex)
	args = append(args, limit)

	rows, err := s.db.Query(sqlQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Project, 0, limit)
	for rows.Next() {
		item, scanErr := scanProject(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) GetProject(companyID, projectID string) (Project, error) {
	normalizedProjectID := strings.TrimSpace(projectID)
	if normalizedProjectID == "" {
		return Project{}, errProjectIDRequired
	}

	row := s.db.QueryRow(
		fmt.Sprintf(`SELECT %s FROM projects WHERE company_id = $1 AND id = $2`, projectSelectColumns),
		strings.TrimSpace(companyID),
		normalizedProjectID,
	)

	item, err := scanProject(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Project{}, errProjectNotFound
		}
		return Project{}, err
	}

	return item, nil
}

func (s *Service) UpsertProject(companyID string, req UpsertProjectRequest) (Project, error) {
	normalizedProjectID := strings.TrimSpace(req.ID)
	if normalizedProjectID == "" {
		return Project{}, errProjectIDRequired
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = "diagnostico"
	}

	normalizedStatus, ok := normalizeStatus(status)
	if !ok {
		return Project{}, errProjectStatusInvalid
	}

	// La regla de flujo vive en el servidor: todo cambio de estado sobre un
	// proyecto existente se valida contra legalProjectTransitions antes de
	// escribir (transitions.go). Crear no tiene origen que validar, y reenviar
	// el mismo estado es un no-op legitimo. La fila reservada board-config no
	// es un proyecto y queda fuera de la regla.
	if normalizedProjectID != reservedBoardConfigProjectID {
		var currentStatus string
		err := s.db.QueryRow(
			`SELECT status FROM projects WHERE company_id = $1 AND id = $2`,
			strings.TrimSpace(companyID),
			normalizedProjectID,
		).Scan(&currentStatus)
		switch {
		case err == nil:
			if !canTransition(currentStatus, normalizedStatus) {
				return Project{}, newTransitionError(currentStatus, normalizedStatus)
			}
		case errors.Is(err, sql.ErrNoRows):
			// Proyecto nuevo: cualquier estado del catalogo es un inicio legal.
		default:
			return Project{}, err
		}
	}

	properties := req.Properties
	if properties == nil {
		properties = map[string]any{}
	}

	propertiesJSON, err := json.Marshal(properties)
	if err != nil {
		return Project{}, errProjectPropertiesInvalid
	}

	now := time.Now().UTC()
	row := s.db.QueryRow(
		fmt.Sprintf(`
			INSERT INTO projects (company_id, id, status, properties_json, created_at, updated_at)
			VALUES ($1, $2, $3, $4::jsonb, $5, $6)
			ON CONFLICT (company_id, id) DO UPDATE SET
				status = EXCLUDED.status,
				properties_json = EXCLUDED.properties_json,
				updated_at = EXCLUDED.updated_at
			RETURNING %s
		`, projectSelectColumns),
		strings.TrimSpace(companyID),
		normalizedProjectID,
		normalizedStatus,
		string(propertiesJSON),
		now,
		now,
	)

	item, err := scanProject(row)
	if err != nil {
		return Project{}, err
	}

	return item, nil
}

func (s *Service) DeleteProject(companyID, projectID string) error {
	normalizedProjectID := strings.TrimSpace(projectID)
	if normalizedProjectID == "" {
		return errProjectIDRequired
	}

	if normalizedProjectID == reservedBoardConfigProjectID {
		return errProjectIDRequired
	}

	result, err := s.db.Exec(
		`DELETE FROM projects WHERE company_id = $1 AND id = $2`,
		strings.TrimSpace(companyID),
		normalizedProjectID,
	)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errProjectNotFound
	}

	return nil
}

// GetBoardConfig devuelve la configuracion de columnas del tablero tecnico
// persistida para la empresa (mapa vacio cuando aun no existe).
func (s *Service) GetBoardConfig(companyID string) (map[string]any, error) {
	var rawProperties []byte
	err := s.db.QueryRow(
		`SELECT properties_json FROM projects WHERE company_id = $1 AND id = $2`,
		strings.TrimSpace(companyID),
		reservedBoardConfigProjectID,
	).Scan(&rawProperties)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return map[string]any{}, nil
		}
		return nil, err
	}

	config := map[string]any{}
	if len(rawProperties) > 0 {
		if err := json.Unmarshal(rawProperties, &config); err != nil {
			return nil, errProjectPropertiesInvalid
		}
	}
	return config, nil
}

// UpdateBoardConfig persiste la configuracion de columnas del tablero tecnico
// en la fila reservada de projects.
func (s *Service) UpdateBoardConfig(companyID string, config map[string]any) (map[string]any, error) {
	if config == nil {
		config = map[string]any{}
	}

	configJSON, err := json.Marshal(config)
	if err != nil {
		return nil, errProjectPropertiesInvalid
	}

	now := time.Now().UTC()
	_, err = s.db.Exec(
		`INSERT INTO projects (company_id, id, status, properties_json, created_at, updated_at)
		 VALUES ($1, $2, 'recibido', $3::jsonb, $4, $5)
		 ON CONFLICT (company_id, id) DO UPDATE SET
			properties_json = EXCLUDED.properties_json,
			updated_at = EXCLUDED.updated_at`,
		strings.TrimSpace(companyID),
		reservedBoardConfigProjectID,
		string(configJSON),
		now,
		now,
	)
	if err != nil {
		return nil, err
	}

	return config, nil
}

func (s *Service) CloseDiagnosis(companyID, projectID, requestedBy string) (Project, error) {
	item, err := s.GetProject(companyID, projectID)
	if err != nil {
		return Project{}, err
	}

	if item.Properties == nil {
		item.Properties = map[string]any{}
	}

	if strings.EqualFold(strings.TrimSpace(item.Status), "por-cotizar") && strings.TrimSpace(asString(item.Properties["diagnosisClosedAt"])) != "" {
		return item, nil
	}

	if !diagnosisFaultIdentified(item.Properties) {
		return Project{}, errDiagnosisFaultRequired
	}

	if asFloat(item.Properties["estimatedHours"]) <= 0 {
		return Project{}, errDiagnosisEstimatedHoursNeeded
	}

	if asFloat(item.Properties["partsBudgetUsd"]) <= 0 {
		return Project{}, errDiagnosisPartsBudgetNeeded
	}

	now := time.Now().UTC().Format(time.RFC3339)
	item.Properties["diagnosisClosedAt"] = now

	if strings.TrimSpace(asString(item.Properties["diagnosisClosedBy"])) == "" {
		item.Properties["diagnosisClosedBy"] = resolveDiagnosisClosedBy(item.Properties, requestedBy)
	}

	return s.UpsertProject(strings.TrimSpace(companyID), UpsertProjectRequest{
		ID:         item.ID,
		Status:     "por-cotizar",
		Properties: item.Properties,
	})
}

type sqlScanner interface {
	Scan(dest ...any) error
}

func scanProject(scanner sqlScanner) (Project, error) {
	var item Project
	var rawProperties []byte
	var createdAt time.Time
	var updatedAt time.Time

	if err := scanner.Scan(&item.ID, &item.Status, &rawProperties, &createdAt, &updatedAt); err != nil {
		return Project{}, err
	}

	item.Properties = map[string]any{}
	if len(rawProperties) > 0 {
		if err := json.Unmarshal(rawProperties, &item.Properties); err != nil {
			return Project{}, errProjectPropertiesInvalid
		}
	}

	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func normalizeStatus(value string) (string, bool) {
	normalized := strings.TrimSpace(strings.ToLower(value))
	_, ok := allowedProjectStatuses[normalized]
	return normalized, ok
}

func normalizeListLimit(value int) (int, error) {
	if value == 0 {
		return defaultProjectsListLimit, nil
	}

	if value < 0 {
		return 0, errProjectsListLimitInvalid
	}

	if value > maxProjectsListLimit {
		return maxProjectsListLimit, nil
	}

	return value, nil
}

func diagnosisFaultIdentified(properties map[string]any) bool {
	rawInspection, ok := properties["diagnosisInspection"]
	if !ok {
		return false
	}

	inspection, ok := rawInspection.(map[string]any)
	if !ok {
		return false
	}

	return asBool(inspection["faultIdentified"])
}

func resolveDiagnosisClosedBy(properties map[string]any, requestedBy string) string {
	normalizedRequestedBy := strings.TrimSpace(requestedBy)
	if normalizedRequestedBy != "" {
		return normalizedRequestedBy
	}

	if assignee := strings.TrimSpace(asString(properties["assignee"])); assignee != "" {
		return assignee
	}

	return "system"
}

func asString(value any) string {
	switch v := value.(type) {
	case string:
		return v
	case fmt.Stringer:
		return v.String()
	default:
		return ""
	}
}

func asBool(value any) bool {
	switch v := value.(type) {
	case bool:
		return v
	case string:
		normalized := strings.TrimSpace(strings.ToLower(v))
		return normalized == "true" || normalized == "1" || normalized == "yes" || normalized == "si"
	case float64:
		return v != 0
	case int:
		return v != 0
	case int64:
		return v != 0
	default:
		return false
	}
}

func asFloat(value any) float64 {
	switch v := value.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int32:
		return float64(v)
	case int64:
		return float64(v)
	case uint:
		return float64(v)
	case uint32:
		return float64(v)
	case uint64:
		return float64(v)
	case json.Number:
		parsed, err := v.Float64()
		if err != nil {
			return 0
		}
		return parsed
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
		if err != nil {
			return 0
		}
		return parsed
	default:
		return 0
	}
}

var defaultSLAConfig = []SLAConfig{
	{Stage: "diagnostico", GreenDays: 2, YellowDays: 2},
	{Stage: "por-cotizar", GreenDays: 2, YellowDays: 1},
	{Stage: "reparacion", GreenDays: 3, YellowDays: 1},
	{Stage: "listo-entrega", GreenDays: 1, YellowDays: 1},
}

func (s *Service) GetSLAConfig(companyID string) ([]SLAConfig, error) {
	rows, err := s.db.Query(
		`SELECT stage, green_days, yellow_days FROM project_sla_configs
		 WHERE company_id = $1 ORDER BY position`,
		strings.TrimSpace(companyID),
	)
	if err != nil {
		return nil, fmt.Errorf("leer configuracion SLA: %w", err)
	}
	defer rows.Close()

	configs := make([]SLAConfig, 0, len(defaultSLAConfig))
	for rows.Next() {
		var config SLAConfig
		if err := rows.Scan(&config.Stage, &config.GreenDays, &config.YellowDays); err != nil {
			return nil, fmt.Errorf("leer etapa SLA: %w", err)
		}
		configs = append(configs, config)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer configuracion SLA: %w", err)
	}

	if len(configs) == 0 {
		return defaultSLAConfig, nil
	}
	return configs, nil
}

func (s *Service) UpdateSLAConfig(companyID string, configs []SLAConfig) error {
	normalized := make([]SLAConfig, 0, len(configs))
	for _, config := range configs {
		stage := strings.TrimSpace(config.Stage)
		if stage == "" || config.GreenDays < 0 || config.YellowDays < 0 {
			return errSLAConfigInvalid
		}
		normalized = append(normalized, SLAConfig{Stage: stage, GreenDays: config.GreenDays, YellowDays: config.YellowDays})
	}

	company := strings.TrimSpace(companyID)
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("iniciar transaccion SLA: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM project_sla_configs WHERE company_id = $1`, company); err != nil {
		return fmt.Errorf("limpiar configuracion SLA: %w", err)
	}

	for position, config := range normalized {
		_, err := tx.Exec(
			`INSERT INTO project_sla_configs (company_id, stage, green_days, yellow_days, position)
			 VALUES ($1, $2, $3, $4, $5)`,
			company, config.Stage, config.GreenDays, config.YellowDays, position,
		)
		if err != nil {
			return fmt.Errorf("guardar etapa SLA %q: %w", config.Stage, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("confirmar configuracion SLA: %w", err)
	}
	return nil
}

func (s *Service) ListNotifications(companyID string) ([]Notification, error) {
	rows, err := s.db.Query(
		`SELECT id, type, title, message, read, target_role, created_at
		 FROM project_notifications WHERE company_id = $1 ORDER BY created_at DESC`,
		strings.TrimSpace(companyID),
	)
	if err != nil {
		return nil, fmt.Errorf("listar notificaciones: %w", err)
	}
	defer rows.Close()

	notifications := []Notification{}
	for rows.Next() {
		var n Notification
		var createdAt time.Time
		if err := rows.Scan(&n.ID, &n.Type, &n.Title, &n.Message, &n.Read, &n.TargetRole, &createdAt); err != nil {
			return nil, fmt.Errorf("leer notificacion: %w", err)
		}
		n.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		notifications = append(notifications, n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer notificaciones: %w", err)
	}

	return notifications, nil
}

func (s *Service) CreateNotification(companyID string, n Notification) (Notification, error) {
	if strings.TrimSpace(n.ID) == "" {
		n.ID = fmt.Sprintf("notif-%d", time.Now().UnixNano())
	}
	n.Read = false

	var createdAt time.Time
	err := s.db.QueryRow(
		`INSERT INTO project_notifications (company_id, id, type, title, message, read, target_role)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING created_at`,
		strings.TrimSpace(companyID), n.ID, n.Type, n.Title, n.Message, n.Read, n.TargetRole,
	).Scan(&createdAt)
	if err != nil {
		return Notification{}, fmt.Errorf("crear notificacion: %w", err)
	}
	n.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	return n, nil
}

func (s *Service) MarkNotificationRead(companyID string, notificationID string) error {
	_, err := s.db.Exec(
		`UPDATE project_notifications SET read = TRUE WHERE company_id = $1 AND id = $2`,
		strings.TrimSpace(companyID), strings.TrimSpace(notificationID),
	)
	if err != nil {
		return fmt.Errorf("marcar notificacion como leida: %w", err)
	}
	return nil
}

func (s *Service) ListTechnicalReports(companyID string) ([]map[string]any, error) {
	rows, err := s.db.Query(
		`SELECT payload_json FROM project_technical_reports
		 WHERE company_id = $1 ORDER BY created_at DESC`,
		strings.TrimSpace(companyID),
	)
	if err != nil {
		return nil, fmt.Errorf("listar informes tecnicos: %w", err)
	}
	defer rows.Close()

	reports := []map[string]any{}
	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			return nil, fmt.Errorf("leer informe tecnico: %w", err)
		}
		var report map[string]any
		if err := json.Unmarshal(payload, &report); err != nil {
			return nil, fmt.Errorf("decodificar informe tecnico: %w", err)
		}
		reports = append(reports, report)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("recorrer informes tecnicos: %w", err)
	}

	return reports, nil
}

func (s *Service) CreateTechnicalReport(companyID string, data map[string]any) (map[string]any, error) {
	if data == nil {
		data = map[string]any{}
	}
	data["id"] = fmt.Sprintf("report-%d", time.Now().UnixNano())
	data["createdAt"] = time.Now().UTC().Format(time.RFC3339)

	payload, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("serializar informe tecnico: %w", err)
	}

	projectID, _ := data["projectId"].(string)
	createdBy, _ := data["createdBy"].(string)

	_, err = s.db.Exec(
		`INSERT INTO project_technical_reports (company_id, id, project_id, payload_json, created_by)
		 VALUES ($1, $2, $3, $4, $5)`,
		strings.TrimSpace(companyID), data["id"], strings.TrimSpace(projectID), payload, strings.TrimSpace(createdBy),
	)
	if err != nil {
		return nil, fmt.Errorf("crear informe tecnico: %w", err)
	}

	return data, nil
}

