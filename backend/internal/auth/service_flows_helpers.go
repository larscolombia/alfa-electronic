package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
)

type signupLookup struct {
	ID    string
	Email string
}

func (s *Service) ensureDB() error {
	if s.db == nil {
		return errAuthStorageNotConfigured
	}
	return nil
}

func (s *Service) findSignupByID(ctx context.Context, companyID, signupID string) (SignupRecord, error) {
	var row SignupRecord
	err := s.db.QueryRowContext(ctx, `
SELECT id, first_name, last_name, email, country_code, phone, signup_type, created_at, updated_at
FROM auth_signup_submissions
WHERE company_id = $1 AND id = $2;
`, companyID, signupID).Scan(
		&row.ID,
		&row.FirstName,
		&row.LastName,
		&row.Email,
		&row.CountryCode,
		&row.Phone,
		&row.SignupType,
		&row.CreatedAt,
		&row.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return SignupRecord{}, errSignupNotFound
		}
		return SignupRecord{}, err
	}

	return row, nil
}

func (s *Service) findSignupByEmail(ctx context.Context, companyID, email string) (signupLookup, error) {
	var row signupLookup
	err := s.db.QueryRowContext(ctx, `
SELECT id, email
FROM auth_signup_submissions
WHERE company_id = $1 AND LOWER(email) = $2;
`, companyID, strings.ToLower(strings.TrimSpace(email))).Scan(&row.ID, &row.Email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return signupLookup{}, errSignupNotFound
		}
		return signupLookup{}, err
	}

	return row, nil
}

func (s *Service) getOnboarding(ctx context.Context, companyID, signupID string) (OnboardingRecord, error) {
	var (
		row         OnboardingRecord
		completedAt sql.NullTime
	)

	err := s.db.QueryRowContext(ctx, `
SELECT signup_id, display_name, business_domain, theme, country, photo_data_url,
	summary_acknowledged, completed_at, created_at, updated_at
FROM auth_onboarding_profiles
WHERE company_id = $1 AND signup_id = $2;
`, companyID, signupID).Scan(
		&row.SignupID,
		&row.DisplayName,
		&row.BusinessDomain,
		&row.Theme,
		&row.Country,
		&row.PhotoDataURL,
		&row.SummaryAcknowledged,
		&completedAt,
		&row.CreatedAt,
		&row.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OnboardingRecord{}, errOnboardingNotFound
		}
		return OnboardingRecord{}, err
	}

	if completedAt.Valid {
		timeValue := completedAt.Time
		row.CompletedAt = &timeValue
	}

	return row, nil
}

func generateResetToken(sizeBytes int) (string, error) {
	if sizeBytes < 16 {
		sizeBytes = 16
	}
	buf := make([]byte, sizeBytes)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func isDuplicateSignupEmailError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key") && strings.Contains(msg, "auth_signup_submissions") && strings.Contains(msg, "email")
}
