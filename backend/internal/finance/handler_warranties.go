package finance

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func (h *Handler) listWarranties(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListWarranties(companyID, ListWarrantiesQuery{Status: c.QueryParam("status"), Limit: limit})
	if err != nil {
		switch {
		case errors.Is(err, errListLimitInvalid), errors.Is(err, errWarrantyStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las garantias"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) listExpiringWarranties(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	days := 30
	if raw := c.QueryParam("days"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": errWarrantyDaysInvalid.Error()})
		}
		days = parsed
	}

	items, err := h.service.ListExpiringWarranties(companyID, days)
	if err != nil {
		if errors.Is(err, errWarrantyDaysInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las garantias por vencer"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items, "days": days})
}

func (h *Handler) getWarranty(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	warrantyID, err := parseNumericID(c.Param("warrantyID"), errWarrantyIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errWarrantyIDRequired.Error()})
	}

	item, err := h.service.GetWarranty(companyID, warrantyID)
	if err != nil {
		switch {
		case errors.Is(err, errWarrantyIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errWarrantyNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la garantia"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createWarranty(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req UpsertWarrantyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreateWarranty(companyID, h.currentUserID(c), req)
	if err != nil {
		if isWarrantyValidationError(err) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la garantia"})
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateWarranty(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	warrantyID, err := parseNumericID(c.Param("warrantyID"), errWarrantyIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errWarrantyIDRequired.Error()})
	}

	var req UpsertWarrantyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdateWarranty(companyID, warrantyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errWarrantyIDRequired), isWarrantyValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errWarrantyNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la garantia"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteWarranty(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	warrantyID, err := parseNumericID(c.Param("warrantyID"), errWarrantyIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errWarrantyIDRequired.Error()})
	}

	deleted, err := h.service.DeleteWarranty(companyID, warrantyID)
	if err != nil {
		if errors.Is(err, errWarrantyIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar la garantia"})
	}
	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "garantia no encontrada"})
	}

	return c.NoContent(http.StatusNoContent)
}
