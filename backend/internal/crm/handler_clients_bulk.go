package crm

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

type bulkCreateClientsRequest struct {
	Clients []UpsertClientRequest `json:"clients"`
}

func (h *Handler) bulkCreateClients(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req bulkCreateClientsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	result, err := h.service.BulkCreateClients(c.Request().Context(), companyID, req.Clients)
	if err != nil {
		switch {
		case errors.Is(err, errBulkClientsEmpty), errors.Is(err, errBulkClientsLimitExceeded):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron importar los clientes de CRM"})
		}
	}

	return c.JSON(http.StatusOK, result)
}
