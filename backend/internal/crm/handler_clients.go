package crm

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listClients(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListClients(companyID, ClientListQuery{
		Search: c.QueryParam("search"),
		Status: c.QueryParam("status"),
		Limit:  limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, errClientStatusInvalid), errors.Is(err, errListLimitInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los clientes de CRM"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getClient(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")

	item, err := h.service.GetClient(companyID, clientID)
	if err != nil {
		switch {
		case errors.Is(err, errClientIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errClientNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el cliente de CRM"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createClient(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req UpsertClientRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	created, err := h.service.CreateClient(companyID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve),
			errors.Is(err, errClientNameRequired),
			errors.Is(err, errClientCompanyRequired),
			errors.Is(err, errClientZoneRequired),
			errors.Is(err, errClientStatusInvalid),
			errors.Is(err, errClientCreditLimitInvalid),
			errors.Is(err, errClientCreditUsageInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el cliente de CRM"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) updateClient(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")

	var req UpsertClientRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	updated, err := h.service.UpdateClient(companyID, clientID, req)
	if err != nil {
		var ve *validationError
		switch {
		case errors.As(err, &ve),
			errors.Is(err, errClientIDRequired),
			errors.Is(err, errClientNameRequired),
			errors.Is(err, errClientCompanyRequired),
			errors.Is(err, errClientZoneRequired),
			errors.Is(err, errClientStatusInvalid),
			errors.Is(err, errClientCreditLimitInvalid),
			errors.Is(err, errClientCreditUsageInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errClientNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el cliente de CRM"})
		}
	}

	return c.JSON(http.StatusOK, updated)
}

func (h *Handler) deleteClient(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	clientID := c.Param("clientID")

	deleted, err := h.service.DeleteClient(companyID, clientID)
	if err != nil {
		if errors.Is(err, errClientIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el cliente de CRM"})
	}

	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "cliente no encontrado"})
	}

	return c.NoContent(http.StatusNoContent)
}
