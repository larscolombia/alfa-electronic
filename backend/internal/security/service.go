package security

import (
	"database/sql"
	"errors"
)

var (
	errCompanyIDRequired      = errors.New("company id is required")
	errSubjectTypeInvalid     = errors.New("subject type must be 'user' or 'role'")
	errSubjectValueRequired   = errors.New("subject value is required")
	errRoleRequired           = errors.New("role is required")
	errRoleInvalid            = errors.New("role is invalid")
	errRestrictedRuleNetworks = errors.New("restricted rule requires at least one allowed IP or MAC")
	errInvalidIPToken         = errors.New("invalid IP token")
	errInvalidMACToken        = errors.New("invalid MAC token")
)

var allowedRoles = map[string]struct{}{
	"superadmin": {},
	"admin":      {},
	"lider":      {},
	"analista":   {},
	"tecnico":    {},
	"invitado":   {},
}

type Service struct {
	db *sql.DB
}

type restrictionMatcher struct {
	allowedIPs  []string
	allowedMACs []string
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
