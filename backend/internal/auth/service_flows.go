package auth

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	errAuthStorageNotConfigured      = errors.New("auth storage is not configured")
	errCompanyIDRequired             = errors.New("company id is required")
	errSignupIDRequired              = errors.New("el id del registro de signup es obligatorio")
	errSignupNotFound                = errors.New("no se encontro un registro de signup con ese id")
	errSignupFirstNameRequired       = errors.New("el nombre es obligatorio")
	errSignupLastNameRequired        = errors.New("el apellido es obligatorio")
	errSignupEmailInvalid            = errors.New("el correo es invalido")
	errSignupCountryCodeInvalid      = errors.New("el codigo de pais es invalido")
	errSignupPhoneInvalid            = errors.New("el telefono es invalido")
	errSignupEmailExists             = errors.New("ya existe un registro con ese correo")
	errSignupTypeInvalid             = errors.New("el tipo de registro debe ser Individual o Business")
	errForgotPasswordEmailInvalid    = errors.New("el correo para recuperar clave es invalido")
	errResetTokenRequired            = errors.New("el token de recuperacion es obligatorio")
	errResetTokenInvalid             = errors.New("token de recuperacion invalido o expirado")
	errPasswordRequired              = errors.New("la nueva clave y su confirmacion son obligatorias")
	errPasswordMismatch              = errors.New("la clave y la confirmacion no coinciden")
	errPasswordWeak                  = errors.New("la clave debe tener al menos 8 caracteres, mayuscula, minuscula, numero y simbolo")
	errOnboardingNotFound            = errors.New("no se encontro onboarding previo para este signup")
	errOnboardingDisplayNameRequired = errors.New("el nombre para mostrar es obligatorio")
	errOnboardingBusinessDomainInvalid = errors.New("el dominio de negocio seleccionado es invalido")
	errOnboardingThemeInvalid          = errors.New("el tema seleccionado es invalido")
	errOnboardingCountryInvalid        = errors.New("el pais es invalido")
	errOnboardingPhotoTooLarge         = errors.New("la foto supera el tamano maximo permitido")
)

func (s *Service) Signup(ctx context.Context, companyID string, req SignupRequest) (SignupRecord, error) {
	if err := s.ensureDB(); err != nil {
		return SignupRecord{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return SignupRecord{}, err
	}

	normalized, err := validateSignupRequest(req)
	if err != nil {
		return SignupRecord{}, err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(normalized.Password), bcrypt.DefaultCost)
	if err != nil {
		return SignupRecord{}, err
	}

	record := SignupRecord{
		ID:          uuid.NewString(),
		FirstName:   normalized.FirstName,
		LastName:    normalized.LastName,
		Email:       normalized.Email,
		CountryCode: normalized.CountryCode,
		Phone:       normalized.Phone,
	}

	err = s.db.QueryRowContext(ctx, `
INSERT INTO auth_signup_submissions (
	company_id, id, first_name, last_name, email, country_code, phone, password_hash, signup_type, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', NOW(), NOW())
RETURNING created_at, updated_at;
`, normalizedCompanyID, record.ID, record.FirstName, record.LastName, record.Email, record.CountryCode, record.Phone, string(hashedPassword)).Scan(&record.CreatedAt, &record.UpdatedAt)
	if err != nil {
		if isDuplicateSignupEmailError(err) {
			return SignupRecord{}, errSignupEmailExists
		}
		return SignupRecord{}, err
	}

	return record, nil
}

func (s *Service) UpdateSignupSuccess(ctx context.Context, companyID, signupID string, req SignupSuccessRequest) (SignupRecord, error) {
	if err := s.ensureDB(); err != nil {
		return SignupRecord{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return SignupRecord{}, err
	}

	normalizedSignupID := strings.TrimSpace(signupID)
	if normalizedSignupID == "" {
		return SignupRecord{}, errSignupIDRequired
	}

	signupType, err := validateSignupType(req.SignupType)
	if err != nil {
		return SignupRecord{}, err
	}

	_, err = s.findSignupByID(ctx, normalizedCompanyID, normalizedSignupID)
	if err != nil {
		return SignupRecord{}, err
	}

	if _, err := s.db.ExecContext(ctx, `
UPDATE auth_signup_submissions
SET signup_type = $3, updated_at = NOW()
WHERE company_id = $1 AND id = $2;
`, normalizedCompanyID, normalizedSignupID, signupType); err != nil {
		return SignupRecord{}, err
	}

	return s.findSignupByID(ctx, normalizedCompanyID, normalizedSignupID)
}

func (s *Service) UpsertOnboarding(ctx context.Context, companyID string, req OnboardingUpsertRequest) (OnboardingRecord, error) {
	if err := s.ensureDB(); err != nil {
		return OnboardingRecord{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return OnboardingRecord{}, err
	}

	normalized, err := validateOnboardingUpsertRequest(req)
	if err != nil {
		return OnboardingRecord{}, err
	}

	if _, err := s.findSignupByID(ctx, normalizedCompanyID, normalized.SignupID); err != nil {
		return OnboardingRecord{}, err
	}

	if _, err := s.db.ExecContext(ctx, `
INSERT INTO auth_onboarding_profiles (
	company_id, signup_id, display_name, business_domain, theme, country, summary_acknowledged, photo_data_url, created_at, updated_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
ON CONFLICT (company_id, signup_id)
DO UPDATE SET
	display_name = EXCLUDED.display_name,
	business_domain = EXCLUDED.business_domain,
	theme = EXCLUDED.theme,
	country = EXCLUDED.country,
	summary_acknowledged = EXCLUDED.summary_acknowledged,
	photo_data_url = EXCLUDED.photo_data_url,
	updated_at = NOW();
`, normalizedCompanyID, normalized.SignupID, normalized.DisplayName, normalized.BusinessDomain, normalized.Theme, normalized.Country, normalized.SummaryAcknowledged, normalized.PhotoDataURL); err != nil {
		return OnboardingRecord{}, err
	}

	return s.getOnboarding(ctx, normalizedCompanyID, normalized.SignupID)
}

func (s *Service) CompleteOnboarding(ctx context.Context, companyID string, req OnboardingCompleteRequest) (OnboardingRecord, error) {
	if err := s.ensureDB(); err != nil {
		return OnboardingRecord{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return OnboardingRecord{}, err
	}

	signupID, country, err := validateOnboardingCompleteRequest(req)
	if err != nil {
		return OnboardingRecord{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE auth_onboarding_profiles
SET country = $3, summary_acknowledged = true, completed_at = COALESCE(completed_at, NOW()), updated_at = NOW()
WHERE company_id = $1 AND signup_id = $2;
`, normalizedCompanyID, signupID, country)
	if err != nil {
		return OnboardingRecord{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OnboardingRecord{}, errOnboardingNotFound
	}

	return s.getOnboarding(ctx, normalizedCompanyID, signupID)
}
