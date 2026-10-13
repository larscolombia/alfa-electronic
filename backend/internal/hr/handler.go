package hr

import (
	"errors"
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
	group.GET("/employees", h.listEmployees)
	group.POST("/employees", h.createEmployee)
	group.PATCH("/employees/soft-delete", h.softDeleteEmployees)
	group.GET("/employees/:employeeID", h.getEmployee)
	group.PUT("/employees/:employeeID", h.updateEmployee)
	group.POST("/employees/:employeeID/reset-password", h.resetEmployeePassword)
	group.GET("/employees/:employeeID/documents", h.listEmployeeDocuments)
	group.POST("/employees/:employeeID/documents", h.createEmployeeDocument)
	group.GET("/employees/:employeeID/documents/:documentID/download", h.downloadEmployeeDocument)
	group.DELETE("/employees/:employeeID/documents/:documentID", h.deleteEmployeeDocument)

	group.GET("/positions", h.listPositions)
	group.POST("/positions", h.createPosition)
	group.DELETE("/positions/:id", h.deletePosition)
	group.POST("/positions/restore-defaults", h.restoreDefaultPositions)

	group.GET("/departments", h.listDepartments)
	group.POST("/departments", h.createDepartment)
	group.DELETE("/departments/:id", h.deleteDepartment)
	group.POST("/departments/restore-defaults", h.restoreDefaultDepartments)

	group.POST("/catalogs/sync", h.syncCatalogs)
	group.POST("/catalogs/restore-defaults", h.restoreCatalogsDefaults)
}

func (h *Handler) listPositions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogs, err := h.service.Catalogs(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load positions"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": catalogs.Positions})
}

func (h *Handler) createPosition(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	item, err := h.service.AddPosition(companyID, req.Name)
	if err != nil {
		switch {
		case errors.Is(err, errCatalogNameRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errCatalogNameExists):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unexpected position creation error"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) deletePosition(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	removed, err := h.service.RemovePosition(companyID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete position"})
	}

	if !removed {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "position not found"})
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) restoreDefaultPositions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.RestoreDefaultPositions(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to restore default positions"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) listDepartments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogs, err := h.service.Catalogs(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load departments"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": catalogs.Departments})
}

func (h *Handler) createDepartment(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req struct {
		Name string `json:"name"`
	}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	item, err := h.service.AddDepartment(companyID, req.Name)
	if err != nil {
		switch {
		case errors.Is(err, errCatalogNameRequired):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errCatalogNameExists):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unexpected department creation error"})
		}
	}

	return c.JSON(http.StatusCreated, item)
}

func (h *Handler) deleteDepartment(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	id := c.Param("id")
	removed, err := h.service.RemoveDepartment(companyID, id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete department"})
	}

	if !removed {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "department not found"})
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) restoreDefaultDepartments(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	items, err := h.service.RestoreDefaultDepartments(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to restore default departments"})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}

func (h *Handler) syncCatalogs(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req CatalogSyncRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	catalogs, err := h.service.SyncCatalogs(companyID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to synchronize catalogs"})
	}

	return c.JSON(http.StatusOK, catalogs)
}

func (h *Handler) restoreCatalogsDefaults(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	catalogs, err := h.service.RestoreAllDefaults(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to restore catalog defaults"})
	}

	return c.JSON(http.StatusOK, catalogs)
}
