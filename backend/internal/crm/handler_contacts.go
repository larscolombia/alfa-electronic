package crm

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listProspectContacts(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	contacts, err := h.service.ListProspectContacts(companyID, prospectID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los contactos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": contacts})
}

func (h *Handler) createProspectContact(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	var req UpsertProspectContactRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	created, err := h.service.CreateProspectContact(companyID, prospectID, req)
	if err != nil {
		var ve *validationError
		if errors.As(err, &ve) || errors.Is(err, errContactNameRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el contacto"})
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateProspectContact(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")
	contactID := c.Param("contactID")

	var req UpsertProspectContactRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	updated, err := h.service.UpdateProspectContact(companyID, prospectID, contactID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve),
			errors.Is(err, errContactNameRequired),
			errors.Is(err, errContactIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errContactNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el contacto"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) deleteProspectContact(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")
	contactID := c.Param("contactID")

	err := h.service.DeleteProspectContact(companyID, prospectID, contactID)
	if err != nil {
		switch {
		case errors.Is(err, errContactIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errContactNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el contacto"})
		}
	}

	return c.NoContent(http.StatusNoContent)
}
