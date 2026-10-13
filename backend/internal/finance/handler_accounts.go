package finance

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

func (h *Handler) listAccounts(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListAccounts(companyID, ListAccountsQuery{Limit: limit})
	if err != nil {
		if errors.Is(err, errListLimitInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las cuentas"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getAccount(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	accountID, err := parseAccountID(c.Param("accountID"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	item, err := h.service.GetAccount(companyID, accountID)
	if err != nil {
		switch {
		case errors.Is(err, errAccountIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errAccountNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la cuenta"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createAccount(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req UpsertAccountRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.CreateAccount(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errAccountTypeInvalid),
			errors.Is(err, errAccountBankNameRequired),
			errors.Is(err, errAccountHolderNameRequired),
			errors.Is(err, errAccountNumberRequired),
			errors.Is(err, errAccountProductTypeInvalid),
			errors.Is(err, errAccountCurrencyInvalid),
			errors.Is(err, errAccountBalanceInvalid),
			errors.Is(err, errAccountStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la cuenta"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateAccount(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	accountID, err := parseAccountID(c.Param("accountID"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	var req UpsertAccountRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdateAccount(companyID, accountID, req)
	if err != nil {
		switch {
		case errors.Is(err, errAccountIDRequired),
			errors.Is(err, errAccountTypeInvalid),
			errors.Is(err, errAccountBankNameRequired),
			errors.Is(err, errAccountHolderNameRequired),
			errors.Is(err, errAccountNumberRequired),
			errors.Is(err, errAccountProductTypeInvalid),
			errors.Is(err, errAccountCurrencyInvalid),
			errors.Is(err, errAccountBalanceInvalid),
			errors.Is(err, errAccountStatusInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errAccountNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la cuenta"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteAccount(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	accountID, err := parseAccountID(c.Param("accountID"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	deleted, err := h.service.DeleteAccount(companyID, accountID)
	if err != nil {
		if errors.Is(err, errAccountIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar la cuenta"})
	}

	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "cuenta no encontrada"})
	}

	return c.NoContent(http.StatusNoContent)
}
