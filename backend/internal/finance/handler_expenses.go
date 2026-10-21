package finance

import (
	"encoding/csv"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

func (h *Handler) listExpenses(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListExpenses(companyID, ListExpensesQuery{Limit: limit})
	if err != nil {
		if errors.Is(err, errListLimitInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los gastos"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getExpense(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	expenseID, err := parseNumericID(c.Param("expenseID"), errExpenseIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errExpenseIDRequired.Error()})
	}

	item, err := h.service.GetExpense(companyID, expenseID)
	if err != nil {
		switch {
		case errors.Is(err, errExpenseIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errExpenseNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el gasto"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createExpense(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req UpsertExpenseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreateExpense(companyID, h.currentUserID(c), req)
	if err != nil {
		if isExpenseValidationError(err) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el gasto"})
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateExpense(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	expenseID, err := parseNumericID(c.Param("expenseID"), errExpenseIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errExpenseIDRequired.Error()})
	}

	var req UpsertExpenseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdateExpense(companyID, h.currentUserID(c), expenseID, req)
	if err != nil {
		switch {
		case errors.Is(err, errExpenseIDRequired), isExpenseValidationError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errExpenseNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el gasto"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteExpense(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	expenseID, err := parseNumericID(c.Param("expenseID"), errExpenseIDRequired)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": errExpenseIDRequired.Error()})
	}

	deleted, err := h.service.DeleteExpense(companyID, expenseID)
	if err != nil {
		if errors.Is(err, errExpenseIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el gasto"})
	}
	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "gasto no encontrado"})
	}

	return c.NoContent(http.StatusNoContent)
}

// exportExpensesCSV genera el CSV simple para la contadora con los gastos de
// caja menor de la empresa.
func (h *Handler) exportExpensesCSV(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListExpenses(companyID, ListExpensesQuery{})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los gastos"})
	}

	c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=caja-menor-gastos.csv")

	writer := csv.NewWriter(c.Response())
	_ = writer.Write([]string{"Fecha", "Item", "Concepto", "Categoria", "Empleado", "Proyecto", "Proveedor", "Cuenta", "Moneda", "Tasa", "Valor", "Valor en COP", "Recibo", "Creado por"})
	for _, item := range items {
		_ = writer.Write([]string{
			item.PaidAt,
			item.ItemName,
			item.Concept,
			item.Category,
			item.Employee,
			item.Project,
			item.Vendor,
			item.AccountName,
			item.CurrencyCode,
			strconv.FormatFloat(item.ExchangeRate, 'f', -1, 64),
			strconv.FormatFloat(item.Amount, 'f', 2, 64),
			strconv.FormatFloat(item.ValueInCop, 'f', 2, 64),
			item.ReceiptFileName,
			item.CreatedBy,
		})
	}
	writer.Flush()
	return nil
}

func (h *Handler) getCashCounts(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.GetCashCounts(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el arqueo"})
	}

	countedAt := ""
	if len(items) > 0 {
		countedAt = items[0].CountedAt
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items, "countedAt": countedAt})
}

func (h *Handler) saveCashCounts(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req SaveCashCountsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	items, err := h.service.SaveCashCounts(companyID, h.currentUserID(c), req)
	if err != nil {
		if errors.Is(err, errCashCountEntryInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo guardar el arqueo"})
	}

	countedAt := ""
	if len(items) > 0 {
		countedAt = items[0].CountedAt
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items, "countedAt": countedAt})
}
