package remissions

import (
	"errors"
	"net/http"
	"strings"

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
	group.GET("/remissions", h.listRemissions)
	group.POST("/remissions", h.createRemission)
	group.GET("/remissions/:remissionID", h.getRemission)
	group.PUT("/remissions/:remissionID", h.updateRemission)
	group.PATCH("/remissions/:remissionID/delivery-status", h.updateDeliveryStatus)
	// Fase 5c: puente pago→despacho. Vincular la factura que debe pagarse y
	// listar las facturas del cliente para el selector del panel de despacho.
	group.PUT("/remissions/:remissionID/invoice", h.linkInvoice)
	group.GET("/remissions/:remissionID/invoice-options", h.invoiceOptions)
	group.DELETE("/remissions/:remissionID", h.deleteRemission)
}

func (h *Handler) listRemissions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.List(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron listar las remisiones"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) createRemission(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req UpsertRemissionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	r, err := h.service.Create(companyID, req, "user")
	if err != nil {
		// Violación de regla (contacto vacío, más de 4 equipos, anclados sin
		// aceptar) es error del formulario: 400 con el mensaje textual que la
		// UI muestra. Lo demás sí es fallo real y va a 500.
		if isUpsertRuleError(err) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear la remision"})
	}
	return c.JSON(http.StatusCreated, r)
}

func (h *Handler) getRemission(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")
	r, err := h.service.Get(companyID, id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, r)
}

func (h *Handler) updateRemission(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")
	var req UpsertRemissionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	r, err := h.service.Update(companyID, id, req)
	if err != nil {
		switch {
		case errors.Is(err, errRemissionNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		// Misma semántica que en Create: regla violada = 400 accionable.
		case isUpsertRuleError(err):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar la remision"})
		}
	}
	return c.JSON(http.StatusOK, r)
}

func (h *Handler) updateDeliveryStatus(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")

	var req DeliveryStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}

	// Actor del JWT (Fase 2b), no del cuerpo: el override de la puerta de pago
	// se autoriza con el rol real del token, que el navegador no puede fingir.
	actor := Actor{
		Email: strings.TrimSpace(stringFromContext(c, "auth.email")),
		Role:  strings.TrimSpace(stringFromContext(c, "auth.role")),
	}

	r, err := h.service.UpdateDeliveryStatus(companyID, id, req, actor)
	if err != nil {
		switch {
		case errors.Is(err, errRemissionNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		// 409: la remisión existe y está bien formada, pero hay un estado del
		// mundo (la factura sin pagar) que impide el despacho. El mensaje es el
		// que la UI debe mostrar textual.
		case errors.Is(err, ErrInvoiceNotLinked), errors.Is(err, ErrInvoiceNotFound):
			return c.JSON(http.StatusConflict, paymentGateError(c, err, req))
		// 403: pidió override sin ser admin.
		case errors.Is(err, ErrOverrideNotAllowed):
			return c.JSON(http.StatusForbidden, map[string]string{"error": err.Error()})
		case strings.HasPrefix(err.Error(), "estado de entrega invalido"),
			strings.Contains(err.Error(), "no se puede revertir"):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			// La factura en estado distinto de Pagado llega por aquí (error
			// construido con el estado actual en el mensaje).
			if isPaymentGateMessage(err) {
				return c.JSON(http.StatusConflict, paymentGateError(c, err, req))
			}
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
	}
	return c.JSON(http.StatusOK, r)
}

// paymentGateError enriquece el rechazo con lo que la UI necesita para no
// dejar al usuario adivinando: el estado actual de la factura y si un admin
// puede autorizar el despacho de todos modos.
func paymentGateError(c echo.Context, err error, req DeliveryStatusRequest) map[string]any {
	payload := map[string]any{
		"error":       err.Error(),
		"paymentGate": true,
	}
	if !req.PaymentOverride && isAdminRole(stringFromContext(c, "auth.role")) {
		payload["overrideAllowed"] = true
		payload["overrideHint"] = "Un administrador puede autorizar el despacho sin el pago confirmado (queda registrado quien y cuando)."
	}
	return payload
}

// isPaymentGateMessage reconoce el rechazo por factura no pagada, que se
// construye como error de texto (lleva el estado actual de la factura) y no
// como centinela.
func isPaymentGateMessage(err error) bool {
	message := err.Error()
	return strings.Contains(message, "está en estado '") ||
		strings.Contains(message, "no aparece como Pagada")
}

func stringFromContext(c echo.Context, key string) string {
	value, _ := c.Get(key).(string)
	return value
}

// linkInvoice vincula (o desvincula con invoiceId null) la factura que debe
// pagarse antes de despachar. Endpoint propio para que el panel de despacho
// pueda asociar la factura sin reescribir toda la remisión por PUT.
func (h *Handler) linkInvoice(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")

	var req struct {
		InvoiceID *int64 `json:"invoiceId"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}

	r, err := h.service.LinkInvoice(companyID, id, req.InvoiceID)
	if err != nil {
		switch {
		case errors.Is(err, errRemissionNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, ErrInvoiceNotFound):
			return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
	}
	return c.JSON(http.StatusOK, r)
}

// invoiceOptions lista las facturas del cliente de una remisión, que es lo que
// alimenta el selector de factura a vincular en el panel de despacho. Sin este
// endpoint la UI tendría que traer TODAS las facturas y filtrar en el
// navegador por nombre, que es frágil y filtra datos de otros clientes.
func (h *Handler) invoiceOptions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")

	items, err := h.service.InvoiceOptions(companyID, id)
	if err != nil {
		if errors.Is(err, errRemissionNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar las facturas del cliente"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) deleteRemission(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")
	if err := h.service.Delete(companyID, id); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}
