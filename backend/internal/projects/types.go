package projects

// Project stores the minimum backend representation required by Fase 8:
// workflow status + free-form properties payload.
type Project struct {
	ID         string         `json:"id"`
	Status     string         `json:"status"`
	Properties map[string]any `json:"properties"`
	CreatedAt  string         `json:"createdAt"`
	UpdatedAt  string         `json:"updatedAt"`
}

type UpsertProjectRequest struct {
	ID         string         `json:"id"`
	Status     string         `json:"status"`
	Properties map[string]any `json:"properties"`
}

type ListProjectsQuery struct {
	Status string
	Limit  int
}

type CloseDiagnosisRequest struct {
	ClosedBy string `json:"closedBy"`
}

type SLAConfig struct {
	Stage      string `json:"stage"`
	GreenDays  int    `json:"greenDays"`
	YellowDays int    `json:"yellowDays"`
}

type Notification struct {
	ID         string `json:"id"`
	Type       string `json:"type"`
	Title      string `json:"title"`
	Message    string `json:"message"`
	Read       bool   `json:"read"`
	CreatedAt  string `json:"createdAt"`
	TargetRole string `json:"targetRole"`
}
