package suppliers

import (
	"errors"
	"net/http"
	"strconv"
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
	group.GET("", h.listSuppliers)
	group.POST("", h.createSupplier)
	group.GET("/:id", h.getSupplier)
	group.PUT("/:id", h.updateSupplier)
	group.DELETE("/:id", h.deleteSupplier)

	group.GET("/orders", h.listOrders)
	group.POST("/orders", h.createOrder)
	group.GET("/orders/:id", h.getOrder)
	group.PUT("/orders/:id", h.updateOrder)
	group.DELETE("/orders/:id", h.deleteOrder)
	group.POST("/orders/:id/trace", h.addOrderTrace)
}

func actorFromRequest(c echo.Context) string {
	if email, ok := c.Get("auth.email").(string); ok && strings.TrimSpace(email) != "" {
		return strings.TrimSpace(email)
	}
	return "system"
}

func parseID(c echo.Context) (int64, error) {
	raw := strings.TrimSpace(c.Param("id"))
	return strconv.ParseInt(raw, 10, 64)
}

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────

func (h *Handler) listSuppliers(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.ListSuppliers(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los proveedores"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getSupplier(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	item, err := h.service.GetSupplier(companyID, id)
	if err != nil {
		if errors.Is(err, errSupplierNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el proveedor"})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createSupplier(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var draft SupplierDraft
	if err := c.Bind(&draft); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	item, err := h.service.CreateSupplier(companyID, draft)
	if err != nil {
		if errors.Is(err, errLegalNameRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el proveedor"})
	}
	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateSupplier(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	var draft SupplierDraft
	if err := c.Bind(&draft); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	item, err := h.service.UpdateSupplier(companyID, id, draft)
	if err != nil {
		if errors.Is(err, errSupplierNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		if errors.Is(err, errLegalNameRequired) {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el proveedor"})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteSupplier(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	if err := h.service.DeleteSupplier(companyID, id); err != nil {
		if errors.Is(err, errSupplierNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el proveedor"})
	}
	return c.NoContent(http.StatusNoContent)
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

func (h *Handler) listOrders(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	supplierID := int64(0)
	if raw := strings.TrimSpace(c.QueryParam("supplierId")); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil {
			supplierID = parsed
		}
	}
	items, err := h.service.ListOrders(companyID, supplierID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudieron cargar los pedidos"})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) getOrder(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	item, err := h.service.GetOrder(companyID, id)
	if err != nil {
		if errors.Is(err, errOrderNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo cargar el pedido"})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *Handler) createOrder(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var req SupplierOrderRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	item, err := h.service.CreateOrder(companyID, req, actorFromRequest(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo crear el pedido"})
	}
	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateOrder(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	var req SupplierOrderRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	item, err := h.service.UpdateOrder(companyID, id, req, actorFromRequest(c))
	if err != nil {
		if errors.Is(err, errOrderNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo actualizar el pedido"})
	}
	return c.JSON(http.StatusOK, item)
}

func (h *Handler) deleteOrder(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	if err := h.service.DeleteOrder(companyID, id); err != nil {
		if errors.Is(err, errOrderNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo eliminar el pedido"})
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) addOrderTrace(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id, err := parseID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "id invalido"})
	}
	var req OrderTraceRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo de solicitud invalido"})
	}
	trace, err := h.service.AddOrderTrace(companyID, id, actorFromRequest(c), strings.TrimSpace(req.Action), strings.TrimSpace(req.Notes))
	if err != nil {
		if errors.Is(err, errOrderNotFound) {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "no se pudo agregar la trazabilidad"})
	}
	return c.JSON(http.StatusCreated, trace)
}
