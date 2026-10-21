package finance

import (
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
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
	// Identidad real (Fase 2b): generated_by sale del JWT, nunca del cliente.
	req.GeneratedBy = h.currentUserID(c)

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

// peekInvoiceSequence previsualiza el consecutivo que se asignaría para la
// fecha indicada SIN consumirlo (FASE 6): el frontend lo usa para mostrar el
// número en borrador; la asignación real ocurre atómica al guardar.
func (h *Handler) peekInvoiceSequence(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req struct {
		Date string `json:"date"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	preview, err := h.service.PeekInvoiceSequence(companyID, req.Date)
	if err != nil {
		switch {
		case errors.Is(err, errInvoiceDateInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo calcular el consecutivo de factura"})
		}
	}

	return c.JSON(http.StatusOK, preview)
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
		case errors.Is(err, errInvoiceLocked):
			// Factura emitida: "no hay reversa"; la única vía es nota crédito.
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la factura"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

// createInvoiceFromQuote convierte una cotización aprobada/aceptada en
// factura (POST /finance/invoices/from-quote/:quoteID). Idempotente: si la
// cotización ya fue convertida responde 409 con la factura existente en el
// cuerpo, sin duplicarla.
func (h *Handler) createInvoiceFromQuote(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	quoteID := strings.TrimSpace(c.Param("quoteID"))

	item, err := h.service.ConvertQuoteToInvoice(companyID, quoteID, h.currentUserID(c))
	if err != nil {
		switch {
		case errors.Is(err, errQuoteIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errQuoteNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errQuoteAlreadyInvoiced):
			return c.JSON(http.StatusConflict, map[string]any{"error": err.Error(), "invoice": item})
		case errors.Is(err, errQuoteNotApprovable), errors.Is(err, errQuoteLinesRequired), isInvoiceValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo convertir la cotizacion en factura"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

// createCreditNote emite una nota crédito contra una factura existente
// (POST /finance/invoices/credit-note) y ajusta su saldo pendiente.
func (h *Handler) createCreditNote(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req CreditNoteRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreateCreditNote(companyID, h.currentUserID(c), req)
	if err != nil {
		switch {
		case errors.Is(err, errInvoiceNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errCreditNoteInvoiceRequired),
			errors.Is(err, errCreditNoteAmountInvalid),
			errors.Is(err, errCreditNoteExceedsBalance),
			errors.Is(err, errCreditNoteDocumentInvalid),
			errors.Is(err, errCreditNoteDateInvalid),
			isInvoiceValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la nota credito"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) deleteInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	invoiceID, err := parseNumericID(c.Param("invoiceID"), errInvoiceIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errInvoiceIDRequired.Error()})
	}

	deleted, err := h.service.DeleteInvoice(companyID, invoiceID)
	if err != nil {
		switch {
		case errors.Is(err, errInvoiceIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errInvoiceLocked):
			// Factura emitida: no se borra ("no hay reversa"); solo nota crédito.
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar la factura"})
		}
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
