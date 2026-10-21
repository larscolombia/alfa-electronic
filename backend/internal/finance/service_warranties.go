package finance

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

const warrantySelectColumns = `id, code, equipment_id, equipment_identifier, client_name, months,
	start_at, end_at, follow_up_at, owner, phase, status, notes, created_by, created_at, updated_at`

const maxWarrantiesListLimit = 500

var warrantyStatuses = map[string]bool{"Vigente": true, "Por vencer": true, "Vencida": true, "Cerrada": true}
var warrantyPhases = map[string]bool{"en-revision": true, "esperando-componentes": true, "en-reparacion": true, "lista": true}

func (s *Service) ListWarranties(companyID string, query ListWarrantiesQuery) ([]Warranty, error) {
	ctx := context.Background()
	limit := query.Limit
	if limit < 0 {
		return nil, errListLimitInvalid
	}
	if limit > maxWarrantiesListLimit {
		limit = maxWarrantiesListLimit
	}

	filters := []string{"company_id = $1", "soft_delete = false"}
	args := []any{companyID}
	nextArg := 2

	status := strings.TrimSpace(query.Status)
	if status != "" {
		if !warrantyStatuses[status] {
			return nil, errWarrantyStatusInvalid
		}
		filters = append(filters, fmt.Sprintf("status = $%d", nextArg))
		args = append(args, status)
		nextArg++
	}

	statement := fmt.Sprintf(`
SELECT %s
FROM finance_warranty_records
WHERE %s
ORDER BY end_at ASC NULLS LAST, id DESC
`, warrantySelectColumns, strings.Join(filters, " AND "))
	if limit > 0 {
		statement += fmt.Sprintf("LIMIT $%d", nextArg)
		args = append(args, limit)
	}

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Warranty, 0)
	for rows.Next() {
		item, scanErr := scanWarranty(rows)
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

// ListExpiringWarranties devuelve las garantías no cerradas cuyo end_at cae
// entre hoy y hoy+days (reporte "por vencer").
func (s *Service) ListExpiringWarranties(companyID string, days int) ([]Warranty, error) {
	ctx := context.Background()
	if days <= 0 || days > 365 {
		return nil, errWarrantyDaysInvalid
	}

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_warranty_records
WHERE company_id = $1
	AND soft_delete = false
	AND status != 'Cerrada'
	AND end_at IS NOT NULL
	AND end_at >= (NOW() AT TIME ZONE 'UTC')::date
	AND end_at <= (NOW() AT TIME ZONE 'UTC')::date + make_interval(days => $2)
ORDER BY end_at ASC
`, warrantySelectColumns), companyID, days)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Warranty, 0)
	for rows.Next() {
		item, scanErr := scanWarranty(rows)
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

func (s *Service) GetWarranty(companyID string, warrantyID int64) (Warranty, error) {
	ctx := context.Background()
	if warrantyID <= 0 {
		return Warranty{}, errWarrantyIDRequired
	}

	row := s.db.QueryRowContext(ctx, fmt.Sprintf(`
SELECT %s
FROM finance_warranty_records
WHERE company_id = $1 AND id = $2 AND soft_delete = false;
`, warrantySelectColumns), companyID, warrantyID)

	item, err := scanWarranty(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Warranty{}, errWarrantyNotFound
		}
		return Warranty{}, err
	}
	return item, nil
}

func (s *Service) CreateWarranty(companyID, userID string, req UpsertWarrantyRequest) (Warranty, error) {
	ctx := context.Background()

	payload, err := normalizeWarranty(req)
	if err != nil {
		return Warranty{}, err
	}

	code := payload.Code
	if code == "" {
		code, err = s.nextWarrantyCode(ctx, companyID)
		if err != nil {
			return Warranty{}, err
		}
	}

	var warrantyID int64
	err = s.db.QueryRowContext(ctx, `
INSERT INTO finance_warranty_records (
	company_id, code, equipment_id, equipment_identifier, client_name, months,
	start_at, end_at, follow_up_at, owner, phase, status, notes, created_by,
	soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6,
	NULLIF($7, '')::date, NULLIF($8, '')::date, NULLIF($9, '')::date, $10, $11, $12, $13, $14,
	false, NOW(), NOW()
)
RETURNING id;
`,
		companyID, code, payload.EquipmentID, payload.EquipmentIdentifier, payload.ClientName, payload.Months,
		payload.StartAt, payload.EndAt, payload.FollowUpAt, payload.Owner, payload.Phase, payload.Status,
		payload.Notes, userID,
	).Scan(&warrantyID)
	if err != nil {
		return Warranty{}, err
	}

	return s.GetWarranty(companyID, warrantyID)
}

func (s *Service) UpdateWarranty(companyID string, warrantyID int64, req UpsertWarrantyRequest) (Warranty, error) {
	ctx := context.Background()
	if warrantyID <= 0 {
		return Warranty{}, errWarrantyIDRequired
	}

	payload, err := normalizeWarranty(req)
	if err != nil {
		return Warranty{}, err
	}

	current, err := s.GetWarranty(companyID, warrantyID)
	if err != nil {
		return Warranty{}, err
	}

	code := payload.Code
	if code == "" {
		code = current.Code
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_warranty_records
SET code = $1,
	equipment_id = $2,
	equipment_identifier = $3,
	client_name = $4,
	months = $5,
	start_at = NULLIF($6, '')::date,
	end_at = NULLIF($7, '')::date,
	follow_up_at = NULLIF($8, '')::date,
	owner = $9,
	phase = $10,
	status = $11,
	notes = $12,
	updated_at = NOW()
WHERE company_id = $13 AND id = $14 AND soft_delete = false;
`,
		code, payload.EquipmentID, payload.EquipmentIdentifier, payload.ClientName, payload.Months,
		payload.StartAt, payload.EndAt, payload.FollowUpAt, payload.Owner, payload.Phase,
		payload.Status, payload.Notes,
		companyID, warrantyID,
	)
	if err != nil {
		return Warranty{}, err
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return Warranty{}, errWarrantyNotFound
	}
	return s.GetWarranty(companyID, warrantyID)
}

func (s *Service) DeleteWarranty(companyID string, warrantyID int64) (bool, error) {
	ctx := context.Background()
	if warrantyID <= 0 {
		return false, errWarrantyIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE finance_warranty_records
SET soft_delete = true, updated_at = NOW()
WHERE company_id = $1 AND id = $2 AND soft_delete = false;
`, companyID, warrantyID)
	if err != nil {
		return false, err
	}
	rows, _ := result.RowsAffected()
	return rows > 0, nil
}

func (s *Service) nextWarrantyCode(ctx context.Context, companyID string) (string, error) {
	year := time.Now().UTC().Format("2006")
	prefix := fmt.Sprintf("GAR-%s-", year)
	var count int
	if err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM finance_warranty_records
WHERE company_id = $1 AND code LIKE $2;
`, companyID, prefix+"%").Scan(&count); err != nil {
		return "", err
	}
	return fmt.Sprintf("%s%04d", prefix, count+1), nil
}

func normalizeWarranty(input UpsertWarrantyRequest) (UpsertWarrantyRequest, error) {
	normalized := input
	normalized.Code = strings.TrimSpace(normalized.Code)
	normalized.EquipmentID = strings.TrimSpace(normalized.EquipmentID)
	normalized.EquipmentIdentifier = strings.TrimSpace(normalized.EquipmentIdentifier)
	normalized.ClientName = strings.TrimSpace(normalized.ClientName)
	normalized.StartAt = strings.TrimSpace(normalized.StartAt)
	normalized.EndAt = strings.TrimSpace(normalized.EndAt)
	normalized.FollowUpAt = strings.TrimSpace(normalized.FollowUpAt)
	normalized.Owner = strings.TrimSpace(normalized.Owner)
	normalized.Phase = strings.TrimSpace(normalized.Phase)
	normalized.Status = strings.TrimSpace(normalized.Status)
	normalized.Notes = strings.TrimSpace(normalized.Notes)

	if normalized.ClientName == "" {
		return UpsertWarrantyRequest{}, errWarrantyClientRequired
	}
	if normalized.EquipmentIdentifier == "" {
		return UpsertWarrantyRequest{}, errWarrantyEquipmentRequired
	}
	for _, value := range []string{normalized.StartAt, normalized.EndAt, normalized.FollowUpAt} {
		if value == "" {
			continue
		}
		if _, err := time.Parse("2006-01-02", value); err != nil {
			return UpsertWarrantyRequest{}, errWarrantyDateInvalid
		}
	}
	if normalized.StartAt != "" && normalized.EndAt != "" && normalized.EndAt < normalized.StartAt {
		return UpsertWarrantyRequest{}, errWarrantyDateInvalid
	}
	if normalized.Phase == "" {
		normalized.Phase = "en-revision"
	}
	if !warrantyPhases[normalized.Phase] {
		return UpsertWarrantyRequest{}, errWarrantyPhaseInvalid
	}
	if normalized.Status == "" {
		normalized.Status = "Vigente"
	}
	if !warrantyStatuses[normalized.Status] {
		return UpsertWarrantyRequest{}, errWarrantyStatusInvalid
	}
	if normalized.Months < 0 {
		normalized.Months = 0
	}
	return normalized, nil
}

func scanWarranty(scanner interface{ Scan(dest ...any) error }) (Warranty, error) {
	var item Warranty
	var startAt, endAt, followUpAt sql.NullTime
	var createdAt, updatedAt time.Time

	if err := scanner.Scan(
		&item.ID,
		&item.Code,
		&item.EquipmentID,
		&item.EquipmentIdentifier,
		&item.ClientName,
		&item.Months,
		&startAt,
		&endAt,
		&followUpAt,
		&item.Owner,
		&item.Phase,
		&item.Status,
		&item.Notes,
		&item.CreatedBy,
		&createdAt,
		&updatedAt,
	); err != nil {
		return Warranty{}, err
	}

	if startAt.Valid {
		item.StartAt = startAt.Time.Format("2006-01-02")
	}
	if endAt.Valid {
		item.EndAt = endAt.Time.Format("2006-01-02")
	}
	if followUpAt.Valid {
		item.FollowUpAt = followUpAt.Time.Format("2006-01-02")
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func isWarrantyValidationError(err error) bool {
	return errors.Is(err, errWarrantyClientRequired) ||
		errors.Is(err, errWarrantyEquipmentRequired) ||
		errors.Is(err, errWarrantyDateInvalid) ||
		errors.Is(err, errWarrantyStatusInvalid) ||
		errors.Is(err, errWarrantyPhaseInvalid) ||
		errors.Is(err, errWarrantyDaysInvalid)
}
