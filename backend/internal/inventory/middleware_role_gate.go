package inventory

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

const technicianRoleRejectMessage = "rol tecnico no autorizado para crear fichas o ajustar stock"

func isTechnicianRole(role string) bool {
	return strings.ToLower(strings.TrimSpace(role)) == "técnico"
}

// requireNonTechnician bloquea por ROL (no por ACL) las acciones de creacion de
// fichas y ajuste de stock: el tecnico solicita repuestos, no administra el
// catalogo. Cada rechazo queda en inventory_audit_trail como REJECT_ROLE.
func (h *Handler) requireNonTechnician() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			role, _ := c.Get("auth.role").(string)
			if !isTechnicianRole(role) {
				return next(c)
			}

			companyID := company.IDFromRequest(c)
			actor := actorFromRequest(c)
			h.service.pushAudit(companyID, actor, "REJECT_ROLE",
				"Rol '"+strings.TrimSpace(role)+"' rechazado en "+c.Request().Method+" "+c.Path())

			return c.JSON(http.StatusForbidden, map[string]string{"error": technicianRoleRejectMessage})
		}
	}
}
