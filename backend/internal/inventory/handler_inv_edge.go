package inventory

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func (h *Handler) recordUsedTest(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	ref := c.Param("reference")
	var req RecordUsedTestRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.RecordUsedTest(companyID, ref, actorFromRequest(c), req)
	if err != nil {
		if errors.Is(err, errReferenceNotFound) || errors.Is(err, errInvalidStatus) {
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar la prueba"})
	}
	return c.JSON(http.StatusOK, result)
}

func (h *Handler) createDiscrepancy(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	sessionID := c.Param("id")
	var req CreateDiscrepancyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.CreateDiscrepancy(companyID, sessionID, req, actorFromRequest(c))
	if err != nil {
		switch {
		case errors.Is(err, errSessionNotFound), errors.Is(err, errReferenceNotFound),
			errors.Is(err, errInvalidQuantity), errors.Is(err, errReferenceRequired):
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar la diferencia"})
		}
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) registerReplenishmentDecision(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	ref := c.Param("reference")
	var req ReplenishmentDecisionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	result, err := h.service.RegisterReplenishmentDecision(companyID, ref, actorFromRequest(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errReplenishmentNotFound):
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		case errors.Is(err, errInvalidStatus), errors.Is(err, errReferenceRequired):
			return c.JSON(http.StatusBadRequest, map[string]any{"error": result.Message, "ok": false})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo registrar la decision"})
		}
	}
	return c.JSON(http.StatusOK, result)
}
