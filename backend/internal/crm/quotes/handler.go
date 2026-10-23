package quotes

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
	"pika.software.net.co/backend/internal/platform/mailer"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/quotes", h.listQuotes)
	group.POST("/quotes", h.createQuote)
	// Fase 6: previsualización del código sin consumirlo (estático, no
	// colisiona con /quotes/:quoteID).
	group.GET("/quotes/next-code", h.peekQuoteCode)
	group.GET("/quotes/:quoteID", h.getQuote)
	group.PUT("/quotes/:quoteID", h.updateQuote)
	group.DELETE("/quotes/:quoteID", h.deleteQuote)
	// Fase 5c: envío real del correo de la cotización. Es un paso separado del
	// guardado a propósito — guardar no debe fallar por falta de correo, pero
	// la ausencia de correo tampoco puede reportarse como envío exitoso.
	group.POST("/quotes/:quoteID/send", h.sendQuoteEmail)
}

func (h *Handler) RegisterPublicRoutes(group *echo.Group) {
	group.GET("/quotes/public/:token", h.getQuoteByToken)
	group.PATCH("/quotes/public/:token/decision", h.updateDecisionByToken)
}

// peekQuoteCode previsualiza el código que recibiría la próxima cotización
// SIN consumirlo (FASE 6): el frontend lo usa para mostrar el código en el
// formulario; la asignación real ocurre atómica al guardar.
func (h *Handler) peekQuoteCode(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	code, err := h.service.PeekQuoteCode(companyID, c.QueryParam("date"))
	if err != nil {
		log.Printf("quotes: peek quote code failed for company %q: %v", companyID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo calcular el codigo de cotizacion"})
	}

	return c.JSON(http.StatusOK, map[string]string{"code": code})
}

func (h *Handler) listQuotes(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	limit, err := parseLimit(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	items, err := h.service.ListQuotes(companyID, ListQuotesQuery{
		Status: c.QueryParam("status"),
		Limit:  limit,
	})
	if err != nil {
		switch {
		case errors.Is(err, errQuoteStatusInvalid), errors.Is(err, errListLimitInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			log.Printf("quotes: list failed for company %q (status=%q limit=%d): %v", companyID, c.QueryParam("status"), limit, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las cotizaciones de CRM"})
		}
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getQuote(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	quoteID := c.Param("quoteID")

	item, err := h.service.GetQuote(companyID, quoteID)
	if err != nil {
		switch {
		case errors.Is(err, errQuoteIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errQuoteNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			log.Printf("quotes: get failed for company %q quoteID %q: %v", companyID, quoteID, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la cotizacion"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) getQuoteByToken(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	token := c.Param("token")

	item, err := h.service.GetQuoteByToken(companyID, token)
	if err != nil {
		switch {
		case errors.Is(err, errQuoteTokenRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errQuoteNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			log.Printf("quotes: get by token failed for company %q: %v", companyID, err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar la cotizacion"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createQuote(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req Quote
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpsertQuote(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errQuoteCodeRequired),
			errors.Is(err, errQuoteProspectNeeded),
			errors.Is(err, errQuoteStatusInvalid),
			errors.Is(err, errDecisionInvalid),
			errors.Is(err, errPurchaseOrderNumberRequired),
			errors.Is(err, errPurchaseOrderNumberTooLong),
			errors.Is(err, errPurchaseOrderFileNameTooLong),
			errors.Is(err, errPurchaseOrderFileTooLarge),
			errors.Is(err, errPurchaseOrderDateRequired),
			errors.Is(err, errPurchaseOrderFileRequired),
			errors.Is(err, errPurchaseOrderDateInvalid),
			errors.Is(err, errPurchaseOrderUploadedAtInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			log.Printf("quotes: create failed for company %q (codigo=%q): %v", companyID, strings.TrimSpace(req.Codigo), err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la cotizacion"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateQuote(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	quoteID := strings.TrimSpace(c.Param("quoteID"))

	var req Quote
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	req.ID = quoteID

	item, err := h.service.UpsertQuote(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errQuoteIDRequired),
			errors.Is(err, errQuoteCodeRequired),
			errors.Is(err, errQuoteProspectNeeded),
			errors.Is(err, errQuoteStatusInvalid),
			errors.Is(err, errDecisionInvalid),
			errors.Is(err, errPurchaseOrderNumberRequired),
			errors.Is(err, errPurchaseOrderNumberTooLong),
			errors.Is(err, errPurchaseOrderFileNameTooLong),
			errors.Is(err, errPurchaseOrderFileTooLarge),
			errors.Is(err, errPurchaseOrderDateRequired),
			errors.Is(err, errPurchaseOrderFileRequired),
			errors.Is(err, errPurchaseOrderDateInvalid),
			errors.Is(err, errPurchaseOrderUploadedAtInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			log.Printf("quotes: update failed for company %q quoteID %q (codigo=%q): %v", companyID, quoteID, strings.TrimSpace(req.Codigo), err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la cotizacion"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteQuote(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	quoteID := c.Param("quoteID")

	deleted, err := h.service.DeleteQuote(companyID, quoteID)
	if err != nil {
		if errors.Is(err, errQuoteIDRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		log.Printf("quotes: delete failed for company %q quoteID %q: %v", companyID, quoteID, err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar la cotizacion"})
	}

	if !deleted {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "cotizacion no encontrada"})
	}

	return c.NoContent(http.StatusNoContent)
}

// sendQuoteEmail es el disparador de la Fase 5c para "Guardar y enviar".
//
// Devuelve el estado real de la fila del outbox. Ojo con el contrato: encolar
// NO es enviar, así que `delivered` sale false y `emailStatus` dice 'pendiente'
// (hay SMTP, saldrá en el próximo barrido del worker) o 'desactivado' (no hay
// SMTP configurado, el correo no va a salir). La UI usa eso para no mostrar un
// éxito falso.
func (h *Handler) sendQuoteEmail(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	quoteID := strings.TrimSpace(c.Param("quoteID"))

	message, err := h.service.SendQuoteEmail(companyID, quoteID, currentUserEmail(c))
	if err != nil {
		switch {
		case errors.Is(err, errQuoteIDRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errQuoteNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": "cotizacion no encontrada"})
		default:
			return mailer.EnqueueErrorResponse(c, err)
		}
	}

	return c.JSON(http.StatusCreated, mailer.EnqueueResult(message))
}

// currentUserEmail lee la identidad real del JWT (Fase 2b) para el rastro de
// quién disparó el correo.
func currentUserEmail(c echo.Context) string {
	if email, ok := c.Get("auth.email").(string); ok && strings.TrimSpace(email) != "" {
		return strings.TrimSpace(email)
	}
	return "sistema"
}

func (h *Handler) updateDecisionByToken(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	token := c.Param("token")

	var req DecisionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}

	item, err := h.service.UpdateDecisionByToken(companyID, token, req)
	if err != nil {
		switch {
		case errors.Is(err, errQuoteTokenRequired),
			errors.Is(err, errDecisionInvalid):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errQuoteNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			log.Printf("quotes: update decision failed for company %q token=%q estado_cliente=%q: %v", companyID, token, strings.TrimSpace(req.EstadoCliente), err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la decision de la cotizacion"})
		}
	}

	return c.JSON(http.StatusOK, item)
}

func parseLimit(raw string) (int, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, nil
	}

	value, err := strconv.Atoi(trimmed)
	if err != nil || value <= 0 {
		return 0, errListLimitInvalid
	}

	return value, nil
}
