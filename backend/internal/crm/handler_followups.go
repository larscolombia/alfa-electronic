package crm

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func isSuperAdminRole(c echo.Context) bool {
	role, _ := c.Get("auth.role").(string)
	return strings.EqualFold(strings.TrimSpace(role), "superadmin")
}

func (h *Handler) listProspectFollowups(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	items, err := h.service.ListProspectFollowups(companyID, prospectID, isSuperAdminRole(c))
	if err != nil {
		switch {
		case errors.Is(err, errProspectIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los seguimientos"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createProspectFollowup(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	var req UpsertProspectFollowupRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	created, err := h.service.CreateProspectFollowup(companyID, prospectID, req)
	if err != nil {
		switch {
		case isFollowupValidationError(err),
			errors.Is(err, errProspectIDRequired),
			errors.Is(err, errFollowupTypeRequired),
			errors.Is(err, errFollowupDateRequired),
			errors.Is(err, errFollowupTimeRequired),
			errors.Is(err, errFollowupStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el seguimiento"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateProspectFollowup(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")
	followupID := c.Param("followupID")

	var req UpsertProspectFollowupRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	updated, err := h.service.UpdateProspectFollowup(companyID, prospectID, followupID, req)
	if err != nil {
		switch {
		case isFollowupValidationError(err),
			errors.Is(err, errProspectIDRequired),
			errors.Is(err, errFollowupIDRequired),
			errors.Is(err, errFollowupTypeRequired),
			errors.Is(err, errFollowupDateRequired),
			errors.Is(err, errFollowupTimeRequired),
			errors.Is(err, errFollowupStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errFollowupNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el seguimiento"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) deleteProspectFollowup(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")
	followupID := c.Param("followupID")

	err := h.service.DeleteProspectFollowup(companyID, prospectID, followupID)
	if err != nil {
		switch {
		case errors.Is(err, errProspectIDRequired), errors.Is(err, errFollowupIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errFollowupNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el seguimiento"})
		}
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) updateProspectNote(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	var req UpdateProspectNoteRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	note, err := h.service.UpdateProspectNote(companyID, prospectID, req.Note)
	if err != nil {
		switch {
		case errors.Is(err, errProspectIDRequired), errors.Is(err, errProspectNoteTooLong):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProspectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo guardar la nota del prospecto"})
		}
	}

	return c.JSON(http.StatusOK, map[string]string{"note": note})
}
