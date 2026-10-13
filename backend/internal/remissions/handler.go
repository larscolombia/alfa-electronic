package remissions

import (
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
	group.GET("/remissions", h.listRemissions)
	group.POST("/remissions", h.createRemission)
	group.GET("/remissions/:remissionID", h.getRemission)
	group.PUT("/remissions/:remissionID", h.updateRemission)
	group.PATCH("/remissions/:remissionID/delivery-status", h.updateDeliveryStatus)
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
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, r)
}

func (h *Handler) updateDeliveryStatus(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")
	var req struct {
		DeliveryStatus string `json:"deliveryStatus"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	r, err := h.service.UpdateDeliveryStatus(companyID, id, req.DeliveryStatus)
	if err != nil {
		if err.Error() == "remision no encontrada" {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, r)
}

func (h *Handler) deleteRemission(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("remissionID")
	if err := h.service.Delete(companyID, id); err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]string{"status": "deleted"})
}
