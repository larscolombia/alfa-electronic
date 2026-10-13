package auth

import (
	"context"
	"strings"
)

func (s *Service) GetSignup(ctx context.Context, companyID, signupID string) (SignupRecord, error) {
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

	return s.findSignupByID(ctx, normalizedCompanyID, normalizedSignupID)
}

func (s *Service) GetOnboarding(ctx context.Context, companyID, signupID string) (OnboardingRecord, error) {
	if err := s.ensureDB(); err != nil {
		return OnboardingRecord{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return OnboardingRecord{}, err
	}

	normalizedSignupID := strings.TrimSpace(signupID)
	if normalizedSignupID == "" {
		return OnboardingRecord{}, errSignupIDRequired
	}

	return s.getOnboarding(ctx, normalizedCompanyID, normalizedSignupID)
}
