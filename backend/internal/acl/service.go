package acl

import (
	"database/sql"
	"errors"
	"regexp"
)

var (
	errRoleNameRequired = errors.New("role name is required")
	errRoleNameTooLong  = errors.New("role name exceeds 80 characters")
	errRoleAlreadyExist = errors.New("role already exists for this company")
	errRoleNotAllowed   = errors.New("role name is not allowed")
	errRoleNotFound     = errors.New("role not found")

	errInvalidRolePermissions = errors.New("invalid role permissions payload")
	errModuleNotFound         = errors.New("module is not available")
	errActionNotFound         = errors.New("action is not available")
	errScopeNotFound          = errors.New("scope is not available")
	errFieldNotFound          = errors.New("field is not available")
	errFieldPermissionUnknown = errors.New("field permission is not available")

	nonAlphaNum = regexp.MustCompile(`[^a-z0-9]+`)
)

type roleSeed struct {
	name        string
	description string
}

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
