package calendar

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

func (s *Service) ListEvents(companyID string, query ListEventsQuery) ([]Event, error) {
	ctx := context.Background()
	predicates := []string{"company_id = $1"}
	args := []any{companyID}
	nextArg := 2

	if fromRaw := strings.TrimSpace(query.From); fromRaw != "" {
		from, err := parseCalendarDateTime(fromRaw)
		if err != nil {
			return nil, err
		}
		predicates = append(predicates, fmt.Sprintf("start_at >= $%d", nextArg))
		args = append(args, from)
		nextArg++
	}

	if toRaw := strings.TrimSpace(query.To); toRaw != "" {
		to, err := parseCalendarDateTime(toRaw)
		if err != nil {
			return nil, err
		}
		predicates = append(predicates, fmt.Sprintf("start_at <= $%d", nextArg))
		args = append(args, to)
		nextArg++
	}

	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxListLimit {
		limit = maxListLimit
	}

	statement := fmt.Sprintf(`
SELECT id, title, start_at, end_at, all_day, description, class_name, created_at, updated_at
FROM calendar_events
WHERE %s
ORDER BY start_at DESC, created_at DESC
`, strings.Join(predicates, " AND "))

	if limit > 0 {
		statement = fmt.Sprintf("%s\nLIMIT $%d", statement, nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Event, 0)
	for rows.Next() {
		item, err := scanEvent(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) GetEvent(companyID, eventID string) (Event, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(eventID)
	if normalizedID == "" {
		return Event{}, errEventIDRequired
	}

	row := s.db.QueryRowContext(ctx, `
SELECT id, title, start_at, end_at, all_day, description, class_name, created_at, updated_at
FROM calendar_events
WHERE company_id = $1
  AND id = $2;
`, companyID, normalizedID)

	item, err := scanEvent(row)
	if err != nil {
		return Event{}, err
	}

	return item, nil
}

func (s *Service) CreateEvent(companyID string, req CreateEventRequest) (Event, error) {
	ctx := context.Background()
	payload, err := normalizeEventPayload(req)
	if err != nil {
		return Event{}, err
	}

	eventID := uuid.NewString()
	var endAt any
	if payload.EndAt != nil {
		endAt = *payload.EndAt
	}

	if _, err := s.db.ExecContext(ctx, `
INSERT INTO calendar_events (
	id,
	company_id,
	title,
	start_at,
	end_at,
	all_day,
	description,
	class_name,
	created_at,
	updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW());
`, eventID, companyID, payload.Title, payload.StartAt, endAt, payload.AllDay, payload.Description, payload.ClassName); err != nil {
		return Event{}, err
	}

	return s.GetEvent(companyID, eventID)
}

func (s *Service) UpdateEvent(companyID, eventID string, req CreateEventRequest) (Event, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(eventID)
	if normalizedID == "" {
		return Event{}, errEventIDRequired
	}

	payload, err := normalizeEventPayload(req)
	if err != nil {
		return Event{}, err
	}

	var endAt any
	if payload.EndAt != nil {
		endAt = *payload.EndAt
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE calendar_events
SET title = $1,
	start_at = $2,
	end_at = $3,
	all_day = $4,
	description = $5,
	class_name = $6,
	updated_at = NOW()
WHERE company_id = $7
  AND id = $8;
`, payload.Title, payload.StartAt, endAt, payload.AllDay, payload.Description, payload.ClassName, companyID, normalizedID)
	if err != nil {
		return Event{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return Event{}, errEventNotFound
	}

	return s.GetEvent(companyID, normalizedID)
}

func (s *Service) DeleteEvent(companyID, eventID string) (bool, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(eventID)
	if normalizedID == "" {
		return false, errEventIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
DELETE FROM calendar_events
WHERE company_id = $1
  AND id = $2;
`, companyID, normalizedID)
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	return affected > 0, nil
}
