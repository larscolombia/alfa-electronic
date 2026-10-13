package auth

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"pika.software.net.co/backend/internal/security"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service         *Service
	securityService *security.Service
}

func NewHandler(service *Service, securityService *security.Service) *Handler {
	return &Handler{service: service, securityService: securityService}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.POST("/login", h.login)
	group.POST("/signup", h.signup)
	group.GET("/signup/:signupID", h.getSignup)
	group.POST("/signup/:signupID/success", h.signupSuccess)
	group.POST("/forgot-password", h.forgotPassword)
	group.POST("/change-password", h.changePassword)
	group.POST("/onboarding", h.upsertOnboarding)
	group.GET("/onboarding/:signupID", h.getOnboarding)
	group.POST("/onboarding/complete", h.completeOnboarding)
}

func (h *Handler) login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	response, err := h.service.Authenticate(req)
	if err != nil {
		switch {
		case errors.Is(err, errInvalidPayload):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errInvalidCredentials):
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to generate access token"})
		}
	}

	if h.securityService != nil {
		decision, evalErr := h.securityService.Evaluate(c.Request().Context(), security.Subject{
			CompanyID: company.IDFromRequest(c),
			Email:     response.User.Email,
			Role:      response.User.Role,
		}, security.SourceFromEcho(c))
		if evalErr != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to evaluate advanced security restrictions"})
		}

		if !decision.Allowed {
			return c.JSON(http.StatusForbidden, map[string]string{"error": decision.Reason})
		}
	}

	return c.JSON(http.StatusOK, response)
}

func (h *Handler) signup(c echo.Context) error {
	var req SignupRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	record, err := h.service.Signup(c.Request().Context(), company.IDFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errCompanyIDRequired),
			errors.Is(err, errSignupFirstNameRequired),
			errors.Is(err, errSignupLastNameRequired),
			errors.Is(err, errSignupEmailInvalid),
			errors.Is(err, errSignupCountryCodeInvalid),
			errors.Is(err, errSignupPhoneInvalid),
			errors.Is(err, errPasswordRequired),
			errors.Is(err, errPasswordMismatch),
			errors.Is(err, errPasswordWeak):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errSignupEmailExists):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to persist signup"})
		}
	}

	return c.JSON(http.StatusCreated, record)
}

func (h *Handler) getSignup(c echo.Context) error {
	record, err := h.service.GetSignup(c.Request().Context(), company.IDFromRequest(c), c.Param("signupID"))
	if err != nil {
		switch {
		case errors.Is(err, errSignupIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errSignupNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load signup"})
		}
	}

	return c.JSON(http.StatusOK, record)
}

func (h *Handler) signupSuccess(c echo.Context) error {
	var req SignupSuccessRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	record, err := h.service.UpdateSignupSuccess(c.Request().Context(), company.IDFromRequest(c), c.Param("signupID"), req)
	if err != nil {
		switch {
		case errors.Is(err, errSignupIDRequired), errors.Is(err, errSignupTypeInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errSignupNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to update signup selection"})
		}
	}

	return c.JSON(http.StatusOK, record)
}

func (h *Handler) forgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	response, err := h.service.RequestPasswordReset(c.Request().Context(), company.IDFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errForgotPasswordEmailInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errSignupNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create password reset token"})
		}
	}

	return c.JSON(http.StatusOK, response)
}

func (h *Handler) changePassword(c echo.Context) error {
	var req ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	err := h.service.ChangePassword(c.Request().Context(), company.IDFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errResetTokenRequired),
			errors.Is(err, errPasswordRequired),
			errors.Is(err, errPasswordMismatch),
			errors.Is(err, errPasswordWeak):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errResetTokenInvalid):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to change password"})
		}
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "password updated"})
}

func (h *Handler) upsertOnboarding(c echo.Context) error {
	var req OnboardingUpsertRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	record, err := h.service.UpsertOnboarding(c.Request().Context(), company.IDFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errSignupIDRequired),
			errors.Is(err, errOnboardingDisplayNameRequired),
			errors.Is(err, errOnboardingBusinessDomainInvalid),
			errors.Is(err, errOnboardingThemeInvalid),
			errors.Is(err, errOnboardingCountryInvalid),
			errors.Is(err, errOnboardingPhotoTooLarge):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errSignupNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to save onboarding"})
		}
	}

	return c.JSON(http.StatusOK, record)
}

func (h *Handler) getOnboarding(c echo.Context) error {
	record, err := h.service.GetOnboarding(c.Request().Context(), company.IDFromRequest(c), c.Param("signupID"))
	if err != nil {
		switch {
		case errors.Is(err, errSignupIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errOnboardingNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load onboarding"})
		}
	}

	return c.JSON(http.StatusOK, record)
}

func (h *Handler) completeOnboarding(c echo.Context) error {
	var req OnboardingCompleteRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	record, err := h.service.CompleteOnboarding(c.Request().Context(), company.IDFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errSignupIDRequired), errors.Is(err, errOnboardingCountryInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errOnboardingNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to complete onboarding"})
		}
	}

	return c.JSON(http.StatusOK, record)
}
