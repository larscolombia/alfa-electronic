package security

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/restrictions", h.listRules)
	group.PUT("/restrictions", h.replaceRules)
}

func (h *Handler) listRules(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	rules, err := h.service.GetRules(c.Request().Context(), companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load advanced security rules"})
	}

	return c.JSON(http.StatusOK, rules)
}

func (h *Handler) replaceRules(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req ReplaceRulesRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	if err := h.service.ReplaceRules(c.Request().Context(), companyID, req); err != nil {
		switch {
		case errors.Is(err, errCompanyIDRequired),
			errors.Is(err, errSubjectTypeInvalid),
			errors.Is(err, errSubjectValueRequired),
			errors.Is(err, errRoleRequired),
			errors.Is(err, errRoleInvalid),
			errors.Is(err, errRestrictedRuleNetworks),
			errors.Is(err, errInvalidIPToken),
			errors.Is(err, errInvalidMACToken):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to persist advanced security rules"})
		}
	}

	rules, err := h.service.GetRules(c.Request().Context(), companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "rules persisted but failed to reload snapshot"})
	}

	return c.JSON(http.StatusOK, rules)
}
