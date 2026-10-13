package crm

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) convertProspectToClient(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	prospectID := c.Param("prospectID")

	client, created, err := h.service.ConvertProspectToClient(companyID, prospectID)
	if err != nil {
		switch {
		case errors.Is(err, errProspectIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errProspectNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo convertir el prospecto a cliente"})
		}
	}

	status := http.StatusCreated
	if !created {
		status = http.StatusOK
	}

	return c.JSON(status, map[string]any{"client": client, "created": created})
}

func (h *Handler) listClientRelatedContacts(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")

	contacts, err := h.service.ListClientRelatedContacts(companyID, clientID)
	if err != nil {
		if errors.Is(err, errClientNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los contactos relacionados del cliente"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": contacts})
}
