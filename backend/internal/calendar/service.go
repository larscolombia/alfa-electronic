package calendar

import (
	"database/sql"
	"errors"
)

const (
	defaultClassNameTimed  = "bg-theme-1-subtle"
	defaultClassNameAllDay = "bg-success-subtle"
	maxListLimit           = 500
)

var (
	errEventIDRequired    = errors.New("event id is required")
	errEventTitleRequired = errors.New("event title is required")
	errEventStartRequired = errors.New("event start is required")
	errEventNotFound      = errors.New("event not found")
	errEventTimeInvalid   = errors.New("invalid event date/time")
	errListLimitInvalid   = errors.New("limit must be greater than zero")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}
