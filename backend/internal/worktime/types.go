package worktime

// Fase 4: modelos de horas de trabajo, telemetria de uso, pruebas funcionales
// y festivos. Los nombres JSON coinciden con los que ya usaba el frontend en
// localStorage (work-time-tracker.service.ts y work-test-batch.service.ts).

// WorkTimeEntry es una entrada de timesheet. TotalHours se calcula en el
// servidor (redondeo hacia arriba a cuartos de hora, igual que el frontend) y
// nunca se acepta del cliente.
type WorkTimeEntry struct {
	ID          string  `json:"id"`
	UserID      string  `json:"userId"`
	Employee    string  `json:"employee"`
	ProjectID   string  `json:"projectId"`
	EquipmentID string  `json:"equipmentId"`
	Task        string  `json:"task"`
	EntryType   string  `json:"entryType"`
	Memo        string  `json:"memo"`
	StartAt     string  `json:"startAt"`
	EndAt       string  `json:"endAt"`
	TotalHours  float64 `json:"totalHours"`
	CreatedAt   string  `json:"createdAt"`
}

// EntryRequest es el cuerpo de POST/PUT de una entrada. ID es opcional: solo lo
// envia la migracion unica desde localStorage para que reintentar no duplique.
type EntryRequest struct {
	ID          string `json:"id"`
	Employee    string `json:"employee"`
	ProjectID   string `json:"projectId"`
	EquipmentID string `json:"equipmentId"`
	Task        string `json:"task"`
	EntryType   string `json:"entryType"`
	Memo        string `json:"memo"`
	StartAt     string `json:"startAt"`
	EndAt       string `json:"endAt"`
}

// EntryFilters son los filtros de GET /worktime/entries.
type EntryFilters struct {
	Employee    string
	EquipmentID string
	ProjectID   string
	From        string // fecha o RFC3339, inclusivo
	To          string // fecha o RFC3339, inclusivo
}

// WeeklyEmployeeTotal agrupa horas por empleado y semana ISO.
type WeeklyEmployeeTotal struct {
	Employee   string  `json:"employee"`
	WeekStart  string  `json:"weekStart"`
	ISOWeek    string  `json:"isoWeek"`
	TotalHours float64 `json:"totalHours"`
	EntryCount int     `json:"entryCount"`
}

// EquipmentTotal agrupa horas por equipo.
type EquipmentTotal struct {
	EquipmentID string  `json:"equipmentId"`
	TotalHours  float64 `json:"totalHours"`
	EntryCount  int     `json:"entryCount"`
}

// SummaryResponse es lo que pinta la UI de RRHH.
type SummaryResponse struct {
	Weekly      []WeeklyEmployeeTotal `json:"weekly"`
	ByEquipment []EquipmentTotal      `json:"byEquipment"`
}

// DeviationResponse cruza la estimacion de horas del diagnostico (projects.
// properties_json -> estimatedHours) con las horas reales registradas en
// work_time_entries para el mismo proyecto. G6: reporte "estimado vs real".
type DeviationResponse struct {
	ProjectID      string   `json:"projectId"`
	EstimatedHours *float64 `json:"estimatedHours"` // null si no hay estimacion
	ActualHours    float64  `json:"actualHours"`
	Deviation      float64  `json:"deviation"` // real - estimado (real si no hay estimacion)
	EntryCount     int      `json:"entryCount"`
}

// PageUsage es el uso agregado de una pagina dentro de un dia.
type PageUsage struct {
	Path          string `json:"path"`
	DurationMs    int64  `json:"durationMs"`
	Visits        int    `json:"visits"`
	LastVisitedAt string `json:"lastVisitedAt"`
}

// DailyUsage es el agregado diario de telemetria (UPSERT por usuario+dia).
type DailyUsage struct {
	Date               string      `json:"date"`
	UserID             string      `json:"userId"`
	PlatformDurationMs int64       `json:"platformDurationMs"`
	Pages              []PageUsage `json:"pages"`
	UpdatedAt          string      `json:"updatedAt"`
}

// Holiday es un festivo del calendario laboral.
type Holiday struct {
	ID      string `json:"id"`
	Country string `json:"country"`
	Date    string `json:"date"`
	Name    string `json:"name"`
	Paid    bool   `json:"paid"`
}

// HolidayRequest es el cuerpo del PUT de festivos (upsert por country+date).
type HolidayRequest struct {
	ID      string `json:"id"`
	Country string `json:"country"`
	Date    string `json:"date"`
	Name    string `json:"name"`
	Paid    *bool  `json:"paid"`
}

// ── Pruebas funcionales (forma identica a work-test-batch.models.ts) ────────

type TestQuestionOption struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type TestQuestion struct {
	ID         string             `json:"id"`
	Label      string             `json:"label"`
	Type       string             `json:"type"`
	Required   bool               `json:"required"`
	HelperText string             `json:"helperText"`
	Options    []TestQuestionOption `json:"options,omitempty"`
}

type TestBatch struct {
	ID          string         `json:"id"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Active      bool           `json:"active"`
	Questions   []TestQuestion `json:"questions"`
	UpdatedAt   string         `json:"updatedAt"`
}

type TestFlowRule struct {
	ID                 string   `json:"id"`
	Name               string   `json:"name"`
	FromStatusID       string   `json:"fromStatusId"`
	ToStatusID         string   `json:"toStatusId"`
	BatchIDs           []string `json:"batchIds"`
	RequiredToContinue bool     `json:"requiredToContinue"`
	TriggerMode        string   `json:"triggerMode"`
	Active             bool     `json:"active"`
	UpdatedAt          string   `json:"updatedAt"`
}

// TestBatchState es el estado completo que el frontend tenia en localStorage.
type TestBatchState struct {
	Batches   []TestBatch    `json:"batches"`
	FlowRules []TestFlowRule `json:"flowRules"`
}
