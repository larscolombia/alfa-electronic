package settings

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterPublicRoutes: GET para la página de cotización del cliente (sin
// sesión) y como fuente de datos del <title>/favicon del SPA. Solo expone
// datos públicos de la empresa, no hay nada sensible en el body.
func (h *Handler) RegisterPublicRoutes(group *echo.Group) {
	group.GET("/company-settings", h.getProfile)
}

// RegisterAdminRoutes: solo PUT. El guard de rol lo pone quien lo monta
// (en main.go va tras RequireModule("administracion")).
func (h *Handler) RegisterAdminRoutes(group *echo.Group) {
	group.PUT("/company-settings", h.updateProfile)
}

func (h *Handler) getProfile(c echo.Context) error {
	profile, err := h.service.Get(company.IDFromRequest(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el perfil de la empresa"})
	}
	return c.JSON(http.StatusOK, profile)
}

func (h *Handler) updateProfile(c echo.Context) error {
	var incoming Profile
	if err := c.Bind(&incoming); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "el cuerpo de la petición no es un JSON valido"})
	}
	if err := h.service.Update(company.IDFromRequest(c), incoming); err != nil {
		status := http.StatusInternalServerError
		var validationErr *ValidationError
		if errors.As(err, &validationErr) {
			status = http.StatusUnprocessableEntity // payload invalido: es del cliente
		}
		return c.JSON(status, map[string]string{"error": err.Error()})
	}

	saved, getErr := h.service.Get(company.IDFromRequest(c))
	if getErr != nil {
		// La escritura SÍ ocurrió; no podemos reportar 200 con un body que no
		// pudimos leer. Se reporta el fallo de lectura tal cual: es grave y hay
		// que verlo, no disfrazarlo.
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "se guardo pero no se pudo releer el perfil; revisa el servidor"})
	}
	return c.JSON(http.StatusOK, saved)
}
