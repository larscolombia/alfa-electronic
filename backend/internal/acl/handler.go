package acl

import (
	"errors"
	"net/http"

	"pika.software.net.co/backend/internal/platform/company"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(group *echo.Group) {
	group.GET("/modules", h.listModules)
	group.GET("/roles", h.listRoles)
	group.POST("/roles", h.createRole)
	group.GET("/roles/:roleID/permissions", h.getRolePermissions)
	group.PUT("/roles/:roleID/permissions", h.updateRolePermissions)
}

func (h *Handler) RegisterUserRoutes(group *echo.Group) {
	group.PATCH("/soft-delete", h.softDeleteUsers)
}

func (h *Handler) listModules(c echo.Context) error {
	modules, err := h.service.ListModules()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load ACL modules"})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"items": modules,
	})
}

func (h *Handler) listRoles(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	roles, err := h.service.ListRoles(companyID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load ACL roles"})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"items": roles,
	})
}

func (h *Handler) createRole(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var req CreateRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	created, err := h.service.CreateRole(companyID, req)
	if err != nil {
		switch {
		case errors.Is(err, errRoleNameRequired), errors.Is(err, errRoleNameTooLong), errors.Is(err, errRoleNotAllowed):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		case errors.Is(err, errRoleAlreadyExist):
			return c.JSON(http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "unexpected role creation error"})
		}
	}

	return c.JSON(http.StatusCreated, created)
}

func (h *Handler) getRolePermissions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	roleID := c.Param("roleID")

	permissions, err := h.service.GetRolePermissions(companyID, roleID)
	if err != nil {
		switch {
		case errors.Is(err, errRoleNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to load role permissions"})
		}
	}

	return c.JSON(http.StatusOK, permissions)
}

func (h *Handler) updateRolePermissions(c echo.Context) error {
	companyID := company.IDFromRequest(c)
	roleID := c.Param("roleID")

	var req UpdateRolePermissionsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	err := h.service.UpdateRolePermissions(companyID, roleID, req)
	if err != nil {
		switch {
		case errors.Is(err, errRoleNotFound):
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		case errors.Is(err, errInvalidRolePermissions),
			errors.Is(err, errModuleNotFound),
			errors.Is(err, errActionNotFound),
			errors.Is(err, errScopeNotFound),
			errors.Is(err, errFieldNotFound),
			errors.Is(err, errFieldPermissionUnknown):
			return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to update role permissions"})
		}
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) softDeleteUsers(c echo.Context) error {
	companyID := company.IDFromRequest(c)

	var payloads []UserSoftDeletePayload
	if err := c.Bind(&payloads); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	processed, err := h.service.SoftDeleteUsers(companyID, payloads)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to process user soft-delete"})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"processed": processed,
	})
}
