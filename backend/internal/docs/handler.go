package docs

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
	group.GET("/documents", h.listDocuments)
	group.POST("/documents", h.createDocument)
	group.GET("/backups", h.listBackups)
	group.POST("/backups", h.createBackup)
	group.GET("/backups/model/:model", h.getBackupForModel)
}

func (h *Handler) listDocuments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	docs, err := h.service.ListDocuments(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": docs})
}

func (h *Handler) createDocument(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var doc Document
	if err := c.Bind(&doc); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	result, err := h.service.CreateDocument(companyID, doc)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) listBackups(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	backups, err := h.service.ListBackups(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, map[string]any{"items": backups})
}

func (h *Handler) createBackup(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	var backup SoftwareBackup
	if err := c.Bind(&backup); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "cuerpo invalido"})
	}
	result, err := h.service.CreateBackup(companyID, backup)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, result)
}

func (h *Handler) getBackupForModel(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	model := c.Param("model")
	backup, err := h.service.GetBackupForModel(companyID, model)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	if backup == nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "backup no encontrado"})
	}
	return c.JSON(http.StatusOK, backup)
}
