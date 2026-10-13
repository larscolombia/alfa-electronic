package finance

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listInvoices(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListInvoices(companyID, ListInvoicesQuery{Status: c.QueryParam("status"), Limit: limit})
	if err != nil {
		switch {
		case errors.Is(err, errListLimitInvalid), errors.Is(err, errInvoiceStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las facturas"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	invoiceID, err := parseNumericID(c.Param("invoiceID"), errInvoiceIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errInvoiceIDRequired.Error()})
	}

	item, err := h.service.GetInvoice(companyID, invoiceID)
	if err != nil {
		switch {
		case errors.Is(err, errInvoiceIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errInvoiceNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la factura"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req UpsertInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreateInvoice(companyID, req)
	if err != nil {
		switch {
		case isInvoiceValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la factura"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	invoiceID, err := parseNumericID(c.Param("invoiceID"), errInvoiceIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errInvoiceIDRequired.Error()})
	}

	var req UpsertInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdateInvoice(companyID, invoiceID, req)
	if err != nil {
		switch {
		case errors.Is(err, errInvoiceIDRequired), isInvoiceValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errInvoiceNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la factura"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	invoiceID, err := parseNumericID(c.Param("invoiceID"), errInvoiceIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errInvoiceIDRequired.Error()})
	}

	deleted, err := h.service.DeleteInvoice(companyID, invoiceID)
	if err != nil {
		if errors.Is(err, errInvoiceIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar la factura"})
	}
	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "factura no encontrada"})
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) listRecurringInvoices(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListRecurringInvoices(companyID, ListRecurringInvoicesQuery{Status: c.QueryParam("status"), Limit: limit})
	if err != nil {
		switch {
		case errors.Is(err, errListLimitInvalid), errors.Is(err, errRecurringStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las facturas recurrentes"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getRecurringInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recurringID, err := parseNumericID(c.Param("recurringID"), errRecurringIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errRecurringIDRequired.Error()})
	}

	item, err := h.service.GetRecurringInvoice(companyID, recurringID)
	if err != nil {
		switch {
		case errors.Is(err, errRecurringIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecurringNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la factura recurrente"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createRecurringInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req UpsertRecurringInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreateRecurringInvoice(companyID, req)
	if err != nil {
		switch {
		case isRecurringValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la factura recurrente"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateRecurringInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recurringID, err := parseNumericID(c.Param("recurringID"), errRecurringIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errRecurringIDRequired.Error()})
	}

	var req UpsertRecurringInvoiceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdateRecurringInvoice(companyID, recurringID, req)
	if err != nil {
		switch {
		case errors.Is(err, errRecurringIDRequired), isRecurringValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRecurringNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la factura recurrente"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteRecurringInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	recurringID, err := parseNumericID(c.Param("recurringID"), errRecurringIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errRecurringIDRequired.Error()})
	}

	deleted, err := h.service.DeleteRecurringInvoice(companyID, recurringID)
	if err != nil {
		if errors.Is(err, errRecurringIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar la factura recurrente"})
	}
	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "factura recurrente no encontrada"})
	}

	return c.NoContent(http.StatusNoContent)
}
