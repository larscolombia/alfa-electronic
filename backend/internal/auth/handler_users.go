package auth

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"pika.software.net.co/backend/internal/platform/company"
)

// RegisterUserRoutes monta la gestion minima de usuarios reales (Fase 2b) sobre el
// grupo /users, que en main.go ya lleva RequireModule("administracion"): solo un
// admin puede crear o listar usuarios. Convive con el PATCH /users/soft-delete del
// handler de acl (rutas distintas, mismo prefijo).
func (h *Handler) RegisterUserRoutes(group *echo.Group) {
	group.GET("", h.listUsers)
	group.POST("", h.createUser)
}

func (h *Handler) listUsers(c echo.Context) error {
	users, err := h.service.ListUsers(c.Request().Context(), company.IDFromRequest(c))
	if err != nil {
		switch {
		case errors.Is(err, errCompanyIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errAuthStorageNotConfigured):
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "auth storage is not configured"})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load users"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": users})
}

func (h *Handler) createUser(c echo.Context) error {
	var req CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	created, err := h.service.CreateUser(c.Request().Context(), company.IDFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errCompanyIDRequired),
			errors.Is(err, errUserEmailInvalid),
			errors.Is(err, errUserNameRequired),
			errors.Is(err, errUserRoleRequired),
			errors.Is(err, errUserRoleUnknown),
			errors.Is(err, errPasswordRequired),
			errors.Is(err, errPasswordConfirmBad),
			errors.Is(err, errPasswordWeak):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errUserEmailExists):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		case errors.Is(err, errAuthStorageNotConfigured):
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "auth storage is not configured"})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create user"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}
