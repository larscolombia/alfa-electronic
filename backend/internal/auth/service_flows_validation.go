package auth

import (
	"errors"
	"regexp"
	"strings"
)

var (
	reAuthEmail       = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	reAuthCountryCode = regexp.MustCompile(`^\+[0-9]{1,4}$`)
	reAuthPhone       = regexp.MustCompile(`^[0-9+\-()\s]{7,40}$`)
	reHasUpper        = regexp.MustCompile(`[A-Z]`)
	reHasLower        = regexp.MustCompile(`[a-z]`)
	reHasDigit        = regexp.MustCompile(`[0-9]`)
	reHasSpecial      = regexp.MustCompile(`[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]`)
)

type normalizedSignupInput struct {
	FirstName   string
	LastName    string
	Email       string
	CountryCode string
	Phone       string
	Password    string
}

type normalizedOnboardingInput struct {
	SignupID            string
	DisplayName         string
	BusinessDomain      string
	Theme               string
	Country             string
	PhotoDataURL        string
	SummaryAcknowledged bool
}

func validateSignupRequest(req SignupRequest) (normalizedSignupInput, error) {
	firstName := strings.TrimSpace(req.FirstName)
	if len(firstName) < 2 {
		return normalizedSignupInput{}, errSignupFirstNameRequired
	}

	lastName := strings.TrimSpace(req.LastName)
	if len(lastName) < 2 {
		return normalizedSignupInput{}, errSignupLastNameRequired
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !reAuthEmail.MatchString(email) {
		return normalizedSignupInput{}, errSignupEmailInvalid
	}

	countryCode := strings.TrimSpace(req.CountryCode)
	if !reAuthCountryCode.MatchString(countryCode) {
		return normalizedSignupInput{}, errSignupCountryCodeInvalid
	}

	phone := strings.TrimSpace(req.Phone)
	if !reAuthPhone.MatchString(phone) {
		return normalizedSignupInput{}, errSignupPhoneInvalid
	}

	password, err := normalizeAndValidatePassword(req.Password, req.ConfirmPassword)
	if err != nil {
		return normalizedSignupInput{}, err
	}

	return normalizedSignupInput{
		FirstName:   firstName,
		LastName:    lastName,
		Email:       email,
		CountryCode: countryCode,
		Phone:       phone,
		Password:    password,
	}, nil
}

func validateSignupType(raw string) (string, error) {
	signupType := strings.TrimSpace(raw)
	switch signupType {
	case "Individual", "Business":
		return signupType, nil
	default:
		return "", errSignupTypeInvalid
	}
}

func validateForgotPasswordRequest(req ForgotPasswordRequest) (string, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !reAuthEmail.MatchString(email) {
		return "", errForgotPasswordEmailInvalid
	}
	return email, nil
}

func validateChangePasswordRequest(req ChangePasswordRequest) (string, string, error) {
	resetToken := strings.TrimSpace(req.ResetToken)
	if resetToken == "" {
		return "", "", errResetTokenRequired
	}

	password, err := normalizeAndValidatePassword(req.NewPassword, req.ConfirmPassword)
	if err != nil {
		return "", "", err
	}

	return resetToken, password, nil
}

func validateOnboardingUpsertRequest(req OnboardingUpsertRequest) (normalizedOnboardingInput, error) {
	signupID := strings.TrimSpace(req.SignupID)
	if signupID == "" {
		return normalizedOnboardingInput{}, errSignupIDRequired
	}

	displayName := strings.TrimSpace(req.DisplayName)
	if len(displayName) < 2 {
		return normalizedOnboardingInput{}, errOnboardingDisplayNameRequired
	}

	businessDomain := strings.TrimSpace(strings.ToLower(req.BusinessDomain))
	switch businessDomain {
	case "finance", "network", "social", "inventory", "learning":
	default:
		return normalizedOnboardingInput{}, errOnboardingBusinessDomainInvalid
	}

	theme := strings.TrimSpace(strings.ToLower(req.Theme))
	switch theme {
	case "theme-blue", "theme-indigo", "theme-purple", "theme-pink", "theme-red", "theme-orange", "theme-yellow", "theme-green", "theme-teal", "theme-cyan":
	default:
		return normalizedOnboardingInput{}, errOnboardingThemeInvalid
	}

	country := strings.TrimSpace(req.Country)
	if len(country) > 120 {
		return normalizedOnboardingInput{}, errOnboardingCountryInvalid
	}

	photoDataURL := strings.TrimSpace(req.PhotoDataURL)
	if len(photoDataURL) > 2*1024*1024 {
		return normalizedOnboardingInput{}, errOnboardingPhotoTooLarge
	}

	return normalizedOnboardingInput{
		SignupID:            signupID,
		DisplayName:         displayName,
		BusinessDomain:      businessDomain,
		Theme:               theme,
		Country:             country,
		PhotoDataURL:        photoDataURL,
		SummaryAcknowledged: req.SummaryAcknowledged,
	}, nil
}

func validateOnboardingCompleteRequest(req OnboardingCompleteRequest) (string, string, error) {
	signupID := strings.TrimSpace(req.SignupID)
	if signupID == "" {
		return "", "", errSignupIDRequired
	}

	country := strings.TrimSpace(req.Country)
	if len(country) < 2 || len(country) > 120 {
		return "", "", errOnboardingCountryInvalid
	}

	return signupID, country, nil
}

func normalizeAndValidatePassword(raw, confirmRaw string) (string, error) {
	password := strings.TrimSpace(raw)
	confirmPassword := strings.TrimSpace(confirmRaw)
	if password == "" || confirmPassword == "" {
		return "", errPasswordRequired
	}

	if password != confirmPassword {
		return "", errPasswordMismatch
	}

	if err := validatePasswordStrength(password); err != nil {
		return "", err
	}

	return password, nil
}

func validatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errPasswordWeak
	}
	if !reHasUpper.MatchString(password) || !reHasLower.MatchString(password) || !reHasDigit.MatchString(password) || !reHasSpecial.MatchString(password) {
		return errPasswordWeak
	}
	return nil
}

func normalizeCompanyID(raw string) (string, error) {
	companyID := strings.TrimSpace(raw)
	if companyID == "" {
		return "", errCompanyIDRequired
	}
	return companyID, nil
}

func isNotFound(err error) bool {
	return errors.Is(err, errSignupNotFound) || errors.Is(err, errOnboardingNotFound)
}
