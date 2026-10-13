package crm

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func (h *Handler) listClientContacts(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")

	contacts, err := h.service.ListClientContacts(companyID, clientID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los contactos del cliente"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": contacts})
}

func (h *Handler) createClientContact(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")

	var req UpsertClientContactRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	created, err := h.service.CreateClientContact(companyID, clientID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve), errors.Is(err, errContactNameRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errClientNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el contacto"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateClientContact(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")
	contactID := c.Param("contactID")

	var req UpsertClientContactRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	updated, err := h.service.UpdateClientContact(companyID, clientID, contactID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve), errors.Is(err, errContactNameRequired), errors.Is(err, errContactIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errContactNotFound), errors.Is(err, errClientNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el contacto"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) deleteClientContact(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")
	contactID := c.Param("contactID")

	err := h.service.DeleteClientContact(companyID, clientID, contactID)
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
