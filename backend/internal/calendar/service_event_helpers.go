package calendar

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

type normalizedEventInput struct {
	Title       string
	StartAt     time.Time
	EndAt       *time.Time
	AllDay      bool
	Description string
	ClassName   string
}

func normalizeEventPayload(req CreateEventRequest) (normalizedEventInput, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		return normalizedEventInput{}, errEventTitleRequired
	}

	startRaw := strings.TrimSpace(req.Start)
	if startRaw == "" {
		return normalizedEventInput{}, errEventStartRequired
	}

	startAt, err := parseCalendarDateTime(startRaw)
	if err != nil {
		return normalizedEventInput{}, err
	}

	allDay := req.AllDay
	if allDay {
		startAt = normalizeAllDayStart(startAt)
	}

	var endAt *time.Time
	if !allDay {
		if endRaw := strings.TrimSpace(req.End); endRaw != "" {
			parsedEnd, parseErr := parseCalendarDateTime(endRaw)
			if parseErr != nil {
				return normalizedEventInput{}, parseErr
			}
			endAt = &parsedEnd
		}

		if endAt == nil || !endAt.After(startAt) {
			fallbackEnd := startAt.Add(time.Hour)
			endAt = &fallbackEnd
		}
	}

	className := strings.TrimSpace(req.ClassName)
	if className == "" {
		className = defaultClassName(allDay)
	}

	return normalizedEventInput{
		Title:       title,
		StartAt:     startAt,
		EndAt:       endAt,
		AllDay:      allDay,
		Description: strings.TrimSpace(req.Description),
		ClassName:   className,
	}, nil
}

func defaultClassName(allDay bool) string {
	if allDay {
		return defaultClassNameAllDay
	}
	return defaultClassNameTimed
}

func parseCalendarDateTime(raw string) (time.Time, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return time.Time{}, fmt.Errorf("%w: empty value", errEventTimeInvalid)
	}

	for _, layout := range []string{time.RFC3339Nano, time.RFC3339} {
		if parsed, err := time.Parse(layout, trimmed); err == nil {
			return parsed.UTC(), nil
		}
	}

	for _, layout := range []string{"2006-01-02T15:04:05", "2006-01-02T15:04", "2006-01-02"} {
		if parsed, err := time.ParseInLocation(layout, trimmed, time.UTC); err == nil {
			return parsed.UTC(), nil
		}
	}

	return time.Time{}, fmt.Errorf("%w: %s", errEventTimeInvalid, raw)
}

func normalizeAllDayStart(value time.Time) time.Time {
	year, month, day := value.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

func formatCalendarDateTime(value time.Time) string {
	return value.UTC().Format("2006-01-02T15:04:05")
}

func scanEvent(scanner interface{ Scan(dest ...any) error }) (Event, error) {
	var (
		id          string
		title       string
		startAt     time.Time
		endAt       sql.NullTime
		allDay      bool
		description string
		className   string
		createdAt   time.Time
		updatedAt   time.Time
	)

	if err := scanner.Scan(
		&id,
		&title,
		&startAt,
		&endAt,
		&allDay,
		&description,
		&className,
		&createdAt,
		&updatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Event{}, errEventNotFound
		}
		return Event{}, err
	}

	item := Event{
		ID:          id,
		Title:       title,
		Start:       formatCalendarDateTime(startAt),
		AllDay:      allDay,
		Description: description,
		ClassName:   className,
		CreatedAt:   formatCalendarDateTime(createdAt),
		UpdatedAt:   formatCalendarDateTime(updatedAt),
	}

	if endAt.Valid {
		formattedEnd := formatCalendarDateTime(endAt.Time)
		item.End = &formattedEnd
	}

	return item, nil
}
