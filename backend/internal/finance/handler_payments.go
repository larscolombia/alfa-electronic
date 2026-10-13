package finance

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func (h *Handler) listPayments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListPayments(companyID, ListPaymentsQuery{Status: c.QueryParam("status"), Limit: limit})
	if err != nil {
		switch {
		case errors.Is(err, errListLimitInvalid), errors.Is(err, errPaymentStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los pagos"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getPayment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	paymentID, err := parseNumericID(c.Param("paymentID"), errPaymentIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errPaymentIDRequired.Error()})
	}

	item, err := h.service.GetPayment(companyID, paymentID)
	if err != nil {
		switch {
		case errors.Is(err, errPaymentIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errPaymentNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el pago"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createPayment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req UpsertPaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreatePayment(companyID, req)
	if err != nil {
		switch {
		case isPaymentValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el pago"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updatePayment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	paymentID, err := parseNumericID(c.Param("paymentID"), errPaymentIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errPaymentIDRequired.Error()})
	}

	var req UpsertPaymentRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdatePayment(companyID, paymentID, req)
	if err != nil {
		switch {
		case errors.Is(err, errPaymentIDRequired), isPaymentValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errPaymentNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el pago"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deletePayment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	paymentID, err := parseNumericID(c.Param("paymentID"), errPaymentIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errPaymentIDRequired.Error()})
	}

	deleted, err := h.service.DeletePayment(companyID, paymentID)
	if err != nil {
		if errors.Is(err, errPaymentIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el pago"})
	}
	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "pago no encontrado"})
	}

	return c.NoContent(http.StatusNoContent)
}
