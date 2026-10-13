package crm

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listProspects(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListProspects(companyID, ProspectListQuery{
		Search: c.QueryParam("search"),
		Status: c.QueryParam("status"),
		Limit:  limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, errProspectStatusInvalid), errors.Is(err, errListLimitInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los prospectos de CRM"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getProspect(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	item, err := h.service.GetProspect(companyID, prospectID)
	if err != nil {
		switch {
		case errors.Is(err, errProspectIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProspectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el prospecto de CRM"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createProspect(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req UpsertProspectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	created, err := h.service.CreateProspect(companyID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve),
			errors.Is(err, errProspectNameRequired),
			errors.Is(err, errProspectStatusInvalid),
			errors.Is(err, errProspectValueInvalid),
			errors.Is(err, errProspectQuotationsInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el prospecto de CRM"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateProspect(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	var req UpsertProspectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	updated, err := h.service.UpdateProspect(companyID, prospectID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve),
			errors.Is(err, errProspectIDRequired),
			errors.Is(err, errProspectNameRequired),
			errors.Is(err, errProspectStatusInvalid),
			errors.Is(err, errProspectValueInvalid),
			errors.Is(err, errProspectQuotationsInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProspectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el prospecto de CRM"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) deleteProspect(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	deleted, err := h.service.DeleteProspect(companyID, prospectID)
	if err != nil {
		if errors.Is(err, errProspectIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el prospecto de CRM"})
	}

	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "prospecto no encontrado"})
	}

	return c.NoContent(http.StatusNoContent)
}
