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
)

var (
	errProjectIDRequired             = errors.New("el id del proyecto es obligatorio")
	errProjectNotFound               = errors.New("proyecto no encontrado")
	errProjectStatusInvalid          = errors.New("estado de proyecto invalido")
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
	"pruebas":                   {},
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

	sqlQuery := fmt.Sprintf(`SELECT %s FROM projects WHERE company_id = $1`, projectSelectColumns)
	args := []any{strings.TrimSpace(companyID)}
	argIndex := 2

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
	{Stage: "pruebas", GreenDays: 1, YellowDays: 1},
	{Stage: "listo-entrega", GreenDays: 1, YellowDays: 1},
}

var slaConfigStore = map[string][]SLAConfig{}
var notificationStore = map[string][]Notification{}
var technicalReportStore = map[string][]map[string]any{}

func (s *Service) GetSLAConfig(companyID string) []SLAConfig {
	if config, ok := slaConfigStore[companyID]; ok {
		return config
	}
	return defaultSLAConfig
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

	slaConfigStore[companyID] = normalized
	return nil
}

func (s *Service) ListNotifications(companyID string) []Notification {
	if notifications, ok := notificationStore[companyID]; ok {
		return notifications
	}
	return []Notification{}
}

func (s *Service) CreateNotification(companyID string, n Notification) {
	notificationStore[companyID] = append([]Notification{n}, notificationStore[companyID]...)
}

func (s *Service) MarkNotificationRead(companyID string, notificationID string) {
	notifications := notificationStore[companyID]
	for i := range notifications {
		if notifications[i].ID == notificationID {
			notifications[i].Read = true
			break
		}
	}
	notificationStore[companyID] = notifications
}

func (s *Service) ListTechnicalReports(companyID string) []map[string]any {
	return technicalReportStore[companyID]
}

func (s *Service) CreateTechnicalReport(companyID string, data map[string]any) map[string]any {
	data["id"] = fmt.Sprintf("report-%d", time.Now().UnixNano())
	data["createdAt"] = time.Now().UTC().Format(time.RFC3339)
	technicalReportStore[companyID] = append([]map[string]any{data}, technicalReportStore[companyID]...)
	return data
}
