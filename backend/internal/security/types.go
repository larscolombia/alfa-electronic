package security

import "time"

const (
	SubjectTypeUser = "user"
	SubjectTypeRole = "role"

	NetworkTypeIP  = "ip"
	NetworkTypeMAC = "mac"

	HeaderClientMAC = "X-Client-Mac"
)

type Subject struct {
	CompanyID string
	Email     string
	Role      string
}

type Source struct {
	IP  string
	MAC string
}

type Decision struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason"`
}

type GlobalAccessRule struct {
	ID           int64     `json:"id"`
	SubjectType  string    `json:"subjectType"`
	SubjectValue string    `json:"subjectValue"`
	Role         string    `json:"role"`
	Reason       string    `json:"reason"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type RestrictedAccessRule struct {
	ID           int64     `json:"id"`
	SubjectType  string    `json:"subjectType"`
	SubjectValue string    `json:"subjectValue"`
	Role         string    `json:"role"`
	Office       string    `json:"office"`
	AllowedIPs   []string  `json:"allowedIPs"`
	AllowedMACs  []string  `json:"allowedMACs"`
	IsActive     bool      `json:"isActive"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type RulesResponse struct {
	GlobalAccess     []GlobalAccessRule     `json:"globalAccess"`
	RestrictedAccess []RestrictedAccessRule `json:"restrictedAccess"`
}

type GlobalAccessRuleInput struct {
	SubjectType  string `json:"subjectType"`
	SubjectValue string `json:"subjectValue"`
	Role         string `json:"role"`
	Reason       string `json:"reason"`
	IsActive     *bool  `json:"isActive,omitempty"`
}

type RestrictedAccessRuleInput struct {
	SubjectType  string   `json:"subjectType"`
	SubjectValue string   `json:"subjectValue"`
	Role         string   `json:"role"`
	Office       string   `json:"office"`
	AllowedIPs   []string `json:"allowedIPs"`
	AllowedMACs  []string `json:"allowedMACs"`
	IsActive     *bool    `json:"isActive,omitempty"`
}

type ReplaceRulesRequest struct {
	GlobalAccess     []GlobalAccessRuleInput     `json:"globalAccess"`
	RestrictedAccess []RestrictedAccessRuleInput `json:"restrictedAccess"`
}
