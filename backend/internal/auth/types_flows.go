package auth

import "time"

type SignupRequest struct {
	FirstName       string `json:"firstName"`
	LastName        string `json:"lastName"`
	Email           string `json:"email"`
	CountryCode     string `json:"countryCode"`
	Phone           string `json:"phone"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
}

type SignupRecord struct {
	ID          string    `json:"id"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	Email       string    `json:"email"`
	CountryCode string    `json:"countryCode"`
	Phone       string    `json:"phone"`
	SignupType  string    `json:"signupType"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type SignupSuccessRequest struct {
	SignupType string `json:"signupType"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email"`
}

type ForgotPasswordResponse struct {
	Message    string    `json:"message"`
	ResetToken string    `json:"resetToken"`
	ExpiresAt  time.Time `json:"expiresAt"`
}

type ChangePasswordRequest struct {
	ResetToken      string `json:"resetToken"`
	NewPassword     string `json:"newPassword"`
	ConfirmPassword string `json:"confirmPassword"`
}

type OnboardingUpsertRequest struct {
	SignupID            string `json:"signupId"`
	DisplayName         string `json:"displayName"`
	BusinessDomain      string `json:"businessDomain"`
	Theme               string `json:"theme"`
	Country             string `json:"country"`
	PhotoDataURL        string `json:"photoDataUrl"`
	SummaryAcknowledged bool   `json:"summaryAcknowledged"`
}

type OnboardingCompleteRequest struct {
	SignupID string `json:"signupId"`
	Country  string `json:"country"`
}

type OnboardingRecord struct {
	SignupID            string     `json:"signupId"`
	DisplayName         string     `json:"displayName"`
	BusinessDomain      string     `json:"businessDomain"`
	Theme               string     `json:"theme"`
	Country             string     `json:"country"`
	PhotoDataURL        string     `json:"photoDataUrl"`
	SummaryAcknowledged bool       `json:"summaryAcknowledged"`
	CompletedAt         *time.Time `json:"completedAt,omitempty"`
	CreatedAt           time.Time  `json:"createdAt"`
	UpdatedAt           time.Time  `json:"updatedAt"`
}
