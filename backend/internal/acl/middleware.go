package acl

import (
	"context"
	"net/http"
	"strings"
	"sync"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
)

// Nombres de acciones y permisos de campo definidos en el seed de datos estaticos.
const (
	actionAdd    = "agregar"
	actionView   = "ver"
	actionUpdate = "actualizar"

	fieldPermissionHidden = "oculto"

	contextKeyFieldPermissions = "acl.fieldPermissions"
)

// adminRoles son los roles de JWT que tienen acceso total (ruta de escape del
// propietario): nunca pueden quedar bloqueados por la configuracion del panel.
var adminRoles = map[string]bool{"admin": true, "superadmin": true}

var (
	ensureMu          sync.Mutex
	staticDataReady   bool
	rolesReadyCompany = make(map[string]bool)
)

func isAdminRole(role string) bool {
	return adminRoles[strings.ToLower(strings.TrimSpace(role))]
}

// actionForMethod mapea el metodo HTTP a la accion del catalogo ACL.
func actionForMethod(method string) string {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return actionView
	case http.MethodPost:
		return actionAdd
	case http.MethodPut, http.MethodPatch, http.MethodDelete:
		return actionUpdate
	default:
		return ""
	}
}

// RequireModule autoriza las rutas del grupo segun el modulo ACL y deriva la
// accion del metodo HTTP (GET=ver, POST=agregar, PUT/PATCH/DELETE=actualizar).
func (s *Service) RequireModule(moduleSlug string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			action := actionForMethod(c.Request().Method)
			if action == "" {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "metodo no permitido por el ACL"})
			}
			return s.authorize(c, moduleSlug, action, next)
		}
	}
}

// RequirePermission autoriza una accion explicita sobre un modulo ACL.
func (s *Service) RequirePermission(moduleSlug, action string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			return s.authorize(c, moduleSlug, action, next)
		}
	}
}

func (s *Service) authorize(c echo.Context, moduleSlug, action string, next echo.HandlerFunc) error {
	role, _ := c.Get("auth.role").(string)
	if isAdminRole(role) {
		// Admin/superadmin ven todo: sin permisos de campo en contexto => sin enmascarado.
		return next(c)
	}

	companyID := company.IDFromRequest(c)
	ctx := c.Request().Context()
	if err := s.ensureAccessReady(ctx, companyID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to prepare ACL data"})
	}

	allowed, err := s.roleAllows(ctx, companyID, role, moduleSlug, action)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to evaluate ACL permissions"})
	}
	if !allowed {
		return c.JSON(http.StatusForbidden, map[string]string{
			"error": "permiso denegado: el rol '" + role + "' no tiene '" + action + "' sobre el modulo '" + moduleSlug + "'",
		})
	}

	fieldPermissions, err := s.roleFieldPermissions(ctx, companyID, role, moduleSlug)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to evaluate ACL field permissions"})
	}
	c.Set(contextKeyFieldPermissions, fieldPermissions)

	return next(c)
}

// roleAllows verifica que el rol exista para la empresa, que el modulo este
// habilitado y que la accion tenga un scope distinto de "ninguno".
func (s *Service) roleAllows(ctx context.Context, companyID, role, moduleSlug, action string) (bool, error) {
	var allowed bool
	err := s.db.QueryRowContext(ctx, `
SELECT EXISTS(
	SELECT 1
	FROM acl_roles r
	JOIN acl_modules m ON m.slug = $3 AND m.is_active = true
	LEFT JOIN acl_role_module_access rma ON rma.role_id = r.id AND rma.module_id = m.id
	JOIN acl_actions a ON a.name = $4
	JOIN acl_role_permissions rp ON rp.role_id = r.id AND rp.module_id = m.id AND rp.action_id = a.id
	WHERE r.company_id = $1
	  AND LOWER(r.name) = LOWER($2)
	  AND r.is_active = true
	  AND COALESCE(rma.is_enabled, true) = true
	  AND rp.scope_id <> 0
);
`, companyID, role, moduleSlug, action).Scan(&allowed)
	if err != nil {
		return false, err
	}
	return allowed, nil
}

// roleFieldPermissions devuelve el permiso (ver/editar/actualizar/oculto) por
// slug de campo del modulo para el rol. Los campos sin fila explícita siguen la
// convencion de GetRolePermissions y se consideran "ver".
func (s *Service) roleFieldPermissions(ctx context.Context, companyID, role, moduleSlug string) (map[string]string, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT f.slug, pt.name
FROM acl_roles r
JOIN acl_modules m ON m.slug = $3 AND m.is_active = true
JOIN acl_module_fields f ON f.module_id = m.id AND f.is_active = true
JOIN acl_role_field_permissions rfp ON rfp.role_id = r.id AND rfp.field_id = f.id
JOIN acl_field_permission_types pt ON pt.id = rfp.field_perm_id
WHERE r.company_id = $1
  AND LOWER(r.name) = LOWER($2)
  AND r.is_active = true;
`, companyID, role, moduleSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	permissions := make(map[string]string)
	for rows.Next() {
		var slug string
		var permission string
		if err := rows.Scan(&slug, &permission); err != nil {
			return nil, err
		}
		permissions[slug] = permission
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return permissions, nil
}

// ensureAccessReady siembra modulos y roles por defecto una vez por proceso,
// evitando re-ejecutar el seed en cada request del middleware.
func (s *Service) ensureAccessReady(ctx context.Context, companyID string) error {
	ensureMu.Lock()
	defer ensureMu.Unlock()

	if !staticDataReady {
		if err := s.ensureStaticData(ctx); err != nil {
			return err
		}
		staticDataReady = true
	}

	if !rolesReadyCompany[companyID] {
		if err := s.ensureDefaultRoles(ctx, companyID); err != nil {
			return err
		}
		rolesReadyCompany[companyID] = true
	}

	return nil
}

// FieldPermissionsFromContext expone los permisos de campo resueltos por el
// middleware para que los handlers enmascaren las respuestas.
func FieldPermissionsFromContext(c echo.Context) map[string]string {
	permissions, _ := c.Get(contextKeyFieldPermissions).(map[string]string)
	return permissions
}

// HiddenFieldSlugs devuelve los slugs de campo que el rol tiene marcados como
// "oculto" y que por tanto no deben aparecer en la respuesta.
func HiddenFieldSlugs(permissions map[string]string) []string {
	hidden := make([]string, 0)
	for slug, permission := range permissions {
		if normalizePermissionToken(permission) == fieldPermissionHidden {
			hidden = append(hidden, slug)
		}
	}
	return hidden
}
