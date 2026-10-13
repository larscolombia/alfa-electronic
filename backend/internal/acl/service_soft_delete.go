package acl

import (
	"context"
	"strings"
	"time"
)

func (s *Service) SoftDeleteUsers(companyID string, payloads []UserSoftDeletePayload) (int, error) {
	ctx := context.Background()

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}

	processed := 0
	for _, payload := range payloads {
		email := strings.ToLower(strings.TrimSpace(payload.UserEmail))
		if email == "" {
			continue
		}

		requestedAt := time.Now().UTC()
		if payload.RequestedAt != "" {
			if parsed, parseErr := time.Parse(time.RFC3339, payload.RequestedAt); parseErr == nil {
				requestedAt = parsed.UTC()
			}
		}

		action := payload.Action
		if strings.TrimSpace(action) == "" {
			action = "SOFT_DELETE"
		}

		status := payload.Status
		if strings.TrimSpace(status) == "" {
			status = "INACTIVE"
		}

		source := payload.Source
		if strings.TrimSpace(source) == "" {
			source = "company-user-roles"
		}

		if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_user_soft_delete_events (
company_id, user_email, action, status, soft_delete, requested_at, source
)
VALUES ($1, $2, $3, $4, $5, $6, $7);
`, companyID, email, action, status, payload.SoftDelete, requestedAt, source); err != nil {
			tx.Rollback()
			return 0, err
		}

		processed++
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return processed, nil
}
