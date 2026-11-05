package extractions

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

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/catalog", h.catalog)
	group.POST("/query", h.query)
}

func (h *Handler) catalog(c echo.Context) error {
	role, _ := c.Get("auth.role").(string)
	modules, err := h.service.Catalog(c.Request().Context(), company.IDFromRequest(c), role)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el catálogo de extracciones"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": modules})
}

func (h *Handler) query(c echo.Context) error {
	var req QueryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de consulta inválido"})
	}

	role, _ := c.Get("auth.role").(string)
	response, err := h.service.Query(c.Request().Context(), company.IDFromRequest(c), role, req)
	if err != nil {
		var forbidden *ForbiddenError
		var unconnected *unconnectedError
		switch {
		case errors.As(err, &forbidden):
			return c.JSON(http.StatusForbidden, map[string]string{"error": forbidden.Error()})
		case errors.As(err, &unconnected):
			return c.JSON(http.StatusUnprocessableEntity, map[string]any{
				"error":  err.Error(),
				"tables": unconnected.tables,
			})
		default:
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
	}

	return c.JSON(http.StatusOK, response)
}
