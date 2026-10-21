package finance

import (
	"encoding/csv"
	"errors"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// currentUserID resuelve la identidad SOLO desde el JWT (claim email publicado
// por el middleware de auth en "auth.email"). El cliente no puede impersonar a
// otro usuario: ningun endpoint acepta createdBy en el cuerpo.
func (h *Handler) currentUserID(c echo.Context) string {
	companyID := company.IDFromRequest(c)
	email, _ := c.Get("auth.email").(string)
	return h.service.ResolveUserID(companyID, email)
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/accounts", h.listAccounts)
	group.POST("/accounts", h.createAccount)
	group.GET("/accounts/:accountID", h.getAccount)
	group.PUT("/accounts/:accountID", h.updateAccount)
	group.DELETE("/accounts/:accountID", h.deleteAccount)

	group.GET("/payments", h.listPayments)
	group.POST("/payments", h.createPayment)
	group.GET("/payments/:paymentID", h.getPayment)
	group.PUT("/payments/:paymentID", h.updatePayment)
	group.DELETE("/payments/:paymentID", h.deletePayment)

	group.GET("/invoices", h.listInvoices)
	group.POST("/invoices", h.createInvoice)
	// Fase 5b: conversión cotización→factura (idempotente) y nota crédito
	// (única reversa de una factura emitida/bloqueada).
	group.POST("/invoices/from-quote/:quoteID", h.createInvoiceFromQuote)
	group.POST("/invoices/credit-note", h.createCreditNote)
	group.GET("/invoices/:invoiceID", h.getInvoice)
	group.PUT("/invoices/:invoiceID", h.updateInvoice)
	group.DELETE("/invoices/:invoiceID", h.deleteInvoice)

	group.GET("/recurring-invoices", h.listRecurringInvoices)
	group.POST("/recurring-invoices", h.createRecurringInvoice)
	group.GET("/recurring-invoices/:recurringID", h.getRecurringInvoice)
	group.PUT("/recurring-invoices/:recurringID", h.updateRecurringInvoice)
	group.DELETE("/recurring-invoices/:recurringID", h.deleteRecurringInvoice)

	// Caja menor: gastos + arqueo de billetes/monedas + CSV para contadora.
	group.GET("/expenses", h.listExpenses)
	group.POST("/expenses", h.createExpense)
	group.GET("/expenses/export.csv", h.exportExpensesCSV)
	group.GET("/expenses/:expenseID", h.getExpense)
	group.PUT("/expenses/:expenseID", h.updateExpense)
	group.DELETE("/expenses/:expenseID", h.deleteExpense)
	group.GET("/cash-counts", h.getCashCounts)
	group.POST("/cash-counts", h.saveCashCounts)

	// Garantías.
	group.GET("/warranties", h.listWarranties)
	group.GET("/warranties/expiring", h.listExpiringWarranties)
	group.POST("/warranties", h.createWarranty)
	group.GET("/warranties/:warrantyID", h.getWarranty)
	group.PUT("/warranties/:warrantyID", h.updateWarranty)
	group.DELETE("/warranties/:warrantyID", h.deleteWarranty)

	// Configuración por empresa (tarifa horaria; la Fase 6 la extiende).
	group.GET("/settings/:settingKey", h.getSetting)
	group.PUT("/settings/:settingKey", h.putSetting)

	group.GET("/export-oasis", h.exportOasis)
	group.GET("/export-oasis/csv", h.exportOasisCSV)
	group.GET("/export-oasis/txt", h.exportOasisTXT)
	group.GET("/portfolio", h.getPortfolio)
}

func (h *Handler) oasisQuery(c echo.Context) OasisExportQuery {
	return OasisExportQuery{From: c.QueryParam("from"), To: c.QueryParam("to")}
}

func (h *Handler) exportOasis(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	records, err := h.service.GetOasisExport(companyID, h.oasisQuery(c))
	if err != nil {
		if errors.Is(err, errOasisDateInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo generar el export Oasis"})
	}
	return c.JSON(http.StatusOK, records)
}

func (h *Handler) exportOasisCSV(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	records, err := h.service.GetOasisExport(companyID, h.oasisQuery(c))
	if err != nil {
		if errors.Is(err, errOasisDateInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo generar el export Oasis"})
	}

	c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=oasis-961.csv")

	writer := csv.NewWriter(c.Response())
	_ = writer.Write(oasisHeader())
	for _, record := range records {
		_ = writer.Write(oasisRow(record))
	}
	writer.Flush()
	return nil
}

// exportOasisTXT entrega el archivo plano 961 (sin cabecera, separado por
// comas) que se carga en el software de facturación electrónica. Antes el
// botón TXT del frontend abría la misma URL del CSV: ahora es un endpoint y un
// contenido distintos.
func (h *Handler) exportOasisTXT(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	records, err := h.service.GetOasisExport(companyID, h.oasisQuery(c))
	if err != nil {
		if errors.Is(err, errOasisDateInvalid) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo generar el export Oasis"})
	}

	c.Response().Header().Set("Content-Type", "text/plain; charset=utf-8")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=oasis-961.txt")

	writer := csv.NewWriter(c.Response())
	for _, record := range records {
		_ = writer.Write(oasisRow(record))
	}
	writer.Flush()
	return nil
}

// oasisHeader/oasisRow definen las ~30 columnas del formato 961 en el orden
// descrito por el cliente (NIT y DV en columnas propias, ítem por línea,
// totales de factura repetidos en cada línea).
func oasisHeader() []string {
	return []string{
		"TipoIdentificacionComprador", "NIT", "DV", "RazonSocialComprador", "CodigoPostalComprador",
		"TelefonoComprador", "DireccionComprador", "CorreoFacturacionElectronica",
		"TipoIdentificacionVendedor", "NITVendedor", "DVVendedor", "RazonSocialVendedor",
		"CodigoPostalVendedor", "DireccionVendedor",
		"NumeroFactura", "Constante2", "FechaFactura", "HoraFactura", "FechaVencimiento",
		"FlagCredito", "OrdenCompra", "FechaGeneracion",
		"ValorLinea", "NumeroItem", "CodigoEquipo", "Descripcion",
		"PorcentajeIVA", "ValorIVA", "TotalLinea", "MarcaCredito99", "TotalFactura",
	}
}

func oasisRow(record OasisExportRecord) []string {
	money := func(value float64) string { return strconv.FormatFloat(value, 'f', 2, 64) }
	return []string{
		record.BuyerIDType, record.BuyerNIT, record.BuyerDV, record.BuyerName, record.BuyerPostalCode,
		record.BuyerPhone, record.BuyerAddress, record.BuyerBillingEmail,
		record.SellerIDType, record.SellerNIT, record.SellerDV, record.SellerName,
		record.SellerPostalCode, record.SellerAddress,
		record.InvoiceNumber, record.Constant, record.IssueDate, record.IssueTime, record.DueDate,
		record.CreditFlag, record.PurchaseOrder, record.GenerationDate,
		money(record.LineValue), strconv.Itoa(record.ItemNumber), record.EquipmentCode, record.Description,
		strconv.FormatFloat(record.IVAPercent, 'f', -1, 64), money(record.IVAValue), money(record.LineTotal),
		record.CreditMarker, money(record.InvoiceTotal),
	}
}

func (h *Handler) getPortfolio(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	status := c.QueryParam("status")
	portfolio, err := h.service.GetPortfolio(companyID, status)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la cartera"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": portfolio})
}
