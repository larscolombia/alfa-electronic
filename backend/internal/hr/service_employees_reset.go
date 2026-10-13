package hr

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (s *Service) ResetEmployeePassword(ctx context.Context, companyID, id string) (ResetEmployeePasswordResponse, error) {
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	employee, err := s.findEmployee(ctx, companyID, strings.TrimSpace(id))
	if err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	email := strings.ToLower(strings.TrimSpace(employee.Email))
	if email == "" {
		return ResetEmployeePasswordResponse{}, errEmployeeEmailMissing
	}

	var signupID string
	err = s.db.QueryRowContext(ctx, `
SELECT id
FROM auth_signup_submissions
WHERE company_id = $1 AND LOWER(email) = $2;
`, companyID, email).Scan(&signupID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ResetEmployeePasswordResponse{}, errEmployeeAccessAccountMissing
		}
		return ResetEmployeePasswordResponse{}, err
	}

	resetToken, err := generateEmployeeResetToken(24)
	if err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	expiresAt := time.Now().UTC().Add(15 * time.Minute)
	if _, err := s.db.ExecContext(ctx, `
INSERT INTO auth_password_reset_tokens (
	company_id, id, signup_id, email, token, expires_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW());
`, companyID, uuid.NewString(), signupID, email, resetToken, expiresAt); err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	return ResetEmployeePasswordResponse{
		Message:    "Se genero un token de recuperacion valido por 15 minutos. Comparte el enlace con el colaborador.",
		ResetToken: resetToken,
		ExpiresAt:  expiresAt,
	}, nil
}

func generateEmployeeResetToken(sizeBytes int) (string, error) {
	if sizeBytes < 16 {
		sizeBytes = 16
	}
	buf := make([]byte, sizeBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}
