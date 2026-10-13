package auth

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func (s *Service) RequestPasswordReset(ctx context.Context, companyID string, req ForgotPasswordRequest) (ForgotPasswordResponse, error) {
	if err := s.ensureDB(); err != nil {
		return ForgotPasswordResponse{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return ForgotPasswordResponse{}, err
	}

	email, err := validateForgotPasswordRequest(req)
	if err != nil {
		return ForgotPasswordResponse{}, err
	}

	signup, err := s.findSignupByEmail(ctx, normalizedCompanyID, email)
	if err != nil {
		return ForgotPasswordResponse{}, err
	}

	resetToken, err := generateResetToken(24)
	if err != nil {
		return ForgotPasswordResponse{}, err
	}

	expiresAt := time.Now().UTC().Add(15 * time.Minute)
	if _, err := s.db.ExecContext(ctx, `
INSERT INTO auth_password_reset_tokens (
	company_id, id, signup_id, email, token, expires_at, created_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW());
`, normalizedCompanyID, uuid.NewString(), signup.ID, signup.Email, resetToken, expiresAt); err != nil {
		return ForgotPasswordResponse{}, err
	}

	return ForgotPasswordResponse{
		Message:    "Se genero un token de recuperacion valido por 15 minutos.",
		ResetToken: resetToken,
		ExpiresAt:  expiresAt,
	}, nil
}

func (s *Service) ChangePassword(ctx context.Context, companyID string, req ChangePasswordRequest) error {
	if err := s.ensureDB(); err != nil {
		return err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return err
	}

	resetToken, newPassword, err := validateChangePasswordRequest(req)
	if err != nil {
		return err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var signupID string
	err = tx.QueryRowContext(ctx, `
SELECT signup_id
FROM auth_password_reset_tokens
WHERE company_id = $1 AND token = $2 AND used_at IS NULL AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1
FOR UPDATE;
`, normalizedCompanyID, resetToken).Scan(&signupID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return errResetTokenInvalid
		}
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
UPDATE auth_signup_submissions
SET password_hash = $3, updated_at = NOW()
WHERE company_id = $1 AND id = $2;
`, normalizedCompanyID, signupID, string(hashedPassword)); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
UPDATE auth_password_reset_tokens
SET used_at = NOW()
WHERE company_id = $1 AND token = $2;
`, normalizedCompanyID, resetToken); err != nil {
		return err
	}

	return tx.Commit()
}
