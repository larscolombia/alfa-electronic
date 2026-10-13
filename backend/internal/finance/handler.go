package finance

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
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
	group.GET("/invoices/:invoiceID", h.getInvoice)
	group.PUT("/invoices/:invoiceID", h.updateInvoice)
	group.DELETE("/invoices/:invoiceID", h.deleteInvoice)

	group.GET("/recurring-invoices", h.listRecurringInvoices)
	group.POST("/recurring-invoices", h.createRecurringInvoice)
	group.GET("/recurring-invoices/:recurringID", h.getRecurringInvoice)
	group.PUT("/recurring-invoices/:recurringID", h.updateRecurringInvoice)
	group.DELETE("/recurring-invoices/:recurringID", h.deleteRecurringInvoice)

	group.GET("/export-oasis", h.exportOasis)
	group.GET("/export-oasis/csv", h.exportOasisCSV)
	group.GET("/portfolio", h.getPortfolio)
}

func (h *Handler) exportOasis(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	records := h.service.GetOasisExport(companyID)
	return c.JSON(http.StatusOK, records)
}

func (h *Handler) exportOasisCSV(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	records := h.service.GetOasisExport(companyID)

	c.Response().Header().Set("Content-Type", "text/csv")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=oasis-export.csv")

	for _, r := range records {
		line := fmt.Sprintf("%s;%s;%s;%.0f;%.0f;%.0f;%s;%s\n",
			r.NIT, r.InvoiceNumber, r.Date, r.Subtotal, r.IVA, r.Total, r.PostalCode, r.Concept)
		c.Response().Write([]byte(line))
	}
	return nil
}

func (h *Handler) getPortfolio(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	status := c.QueryParam("status")
	portfolio := h.service.GetPortfolio(companyID, status)
	return c.JSON(http.StatusOK, map[string]any{"items": portfolio})
}
