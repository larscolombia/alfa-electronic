package acl

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/platform/company"
	"pika.software.net.co/backend/internal/platform/database"
)

func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("RUN_DB_TESTS") == "" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping test database: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrate test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func testCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-acl-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM acl_roles WHERE company_id = $1`, companyID)
	})
	return companyID
}

// newTestApp monta un echo con el middleware ACL y una ruta que responde 200.
// El rol del JWT y la empresa viajan como lo hace el servidor real.
func newTestApp(s *Service, moduleSlug, role, companyID string) *echo.Echo {
	e := echo.New()
	group := e.Group("", func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("auth.role", role)
			return next(c)
		}
	}, s.RequireModule(moduleSlug))
	group.GET("/probe", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	group.POST("/probe", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
	group.PUT("/probe", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	reqCompany := companyID
	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Request().Header.Set(company.HeaderName, reqCompany)
			return next(c)
		}
	})
	return e
}

func doRequest(t *testing.T, e *echo.Echo, method, target string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, target, nil)
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	return rec
}

func TestRequireModuleSeededRole(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "seeded")

	// Siembra modulos y roles por defecto (ver=propio, agregar/actualizar=ninguno).
	if _, err := s.ListRoles(companyID); err != nil {
		t.Fatalf("ListRoles seed: %v", err)
	}

	e := newTestApp(s, "proveedores", "ventas", companyID)

	t.Run("rol con permiso ver -> 200", func(t *testing.T) {
		rec := doRequest(t, e, http.MethodGet, "/probe")
		if rec.Code != http.StatusOK {
			t.Fatalf("GET con rol 'ventas' (ver=propio) devolvio %d, body: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("rol sin permiso agregar -> 403", func(t *testing.T) {
		rec := doRequest(t, e, http.MethodPost, "/probe")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("POST con rol 'ventas' (agregar=ninguno) devolvio %d, body: %s", rec.Code, rec.Body.String())
		}
		if !strings.Contains(rec.Body.String(), "permiso denegado") {
			t.Fatalf("body del 403 no explica el rechazo: %s", rec.Body.String())
		}
	})

	t.Run("rol sin permiso actualizar -> 403", func(t *testing.T) {
		rec := doRequest(t, e, http.MethodPut, "/probe")
		if rec.Code != http.StatusForbidden {
			t.Fatalf("PUT con rol 'ventas' devolvio %d, body: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestRequireModuleGrantedAction(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "granted")

	if _, err := s.ListRoles(companyID); err != nil {
		t.Fatalf("ListRoles seed: %v", err)
	}

	// Concede 'agregar' con scope 'todo' al rol ventas sobre proveedores.
	if _, err := db.Exec(`
UPDATE acl_role_permissions rp
SET scope_id = 3
FROM acl_roles r, acl_modules m, acl_actions a
WHERE rp.role_id = r.id
  AND rp.module_id = m.id
  AND rp.action_id = a.id
  AND r.company_id = $1
  AND LOWER(r.name) = 'ventas'
  AND m.slug = 'proveedores'
  AND a.name = 'agregar';
`, companyID); err != nil {
		t.Fatalf("grant agregar: %v", err)
	}

	e := newTestApp(s, "proveedores", "ventas", companyID)
	rec := doRequest(t, e, http.MethodPost, "/probe")
	if rec.Code != http.StatusOK {
		t.Fatalf("POST con 'agregar' concedido devolvio %d, body: %s", rec.Code, rec.Body.String())
	}
}

func TestRequireModuleAdminBypass(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "admin")

	for _, role := range []string{"admin", "Superadmin"} {
		e := newTestApp(s, "proveedores", role, companyID)
		for _, method := range []string{http.MethodGet, http.MethodPost, http.MethodPut} {
			rec := doRequest(t, e, method, "/probe")
			if rec.Code != http.StatusOK {
				t.Fatalf("%s con rol %q devolvio %d, body: %s (admin no puede quedar bloqueado)", method, role, rec.Code, rec.Body.String())
			}
		}
	}
}

func TestRequireModuleUnknownRoleDenied(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "unknown")

	if _, err := s.ListRoles(companyID); err != nil {
		t.Fatalf("ListRoles seed: %v", err)
	}

	e := newTestApp(s, "proveedores", "rol-fantasma", companyID)
	rec := doRequest(t, e, http.MethodGet, "/probe")
	if rec.Code != http.StatusForbidden {
		t.Fatalf("GET con rol inexistente devolvio %d, body: %s", rec.Code, rec.Body.String())
	}
}

func TestRequireModuleDisabledModuleDenied(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "disabled")

	if _, err := s.ListRoles(companyID); err != nil {
		t.Fatalf("ListRoles seed: %v", err)
	}

	if _, err := db.Exec(`
INSERT INTO acl_role_module_access (role_id, module_id, is_enabled, updated_at)
SELECT r.id, m.id, false, NOW()
FROM acl_roles r, acl_modules m
WHERE r.company_id = $1 AND LOWER(r.name) = 'ventas' AND m.slug = 'proveedores'
ON CONFLICT (role_id, module_id) DO UPDATE SET is_enabled = false;
`, companyID); err != nil {
		t.Fatalf("disable module: %v", err)
	}

	e := newTestApp(s, "proveedores", "ventas", companyID)
	rec := doRequest(t, e, http.MethodGet, "/probe")
	if rec.Code != http.StatusForbidden {
		t.Fatalf("GET con modulo deshabilitado devolvio %d, body: %s", rec.Code, rec.Body.String())
	}
}

func TestRoleFieldPermissionsHidden(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "fields")

	if _, err := s.ListRoles(companyID); err != nil {
		t.Fatalf("ListRoles seed: %v", err)
	}

	// Marca 'documentnumber' (slug del seed para "documentNumber") como oculto
	// para ventas en el modulo administracion.
	if _, err := db.Exec(`
UPDATE acl_role_field_permissions rfp
SET field_perm_id = 4
FROM acl_roles r, acl_module_fields f
WHERE rfp.role_id = r.id
  AND rfp.field_id = f.id
  AND r.company_id = $1
  AND LOWER(r.name) = 'ventas'
  AND f.module_id = 'mod-administracion'
  AND f.slug = 'documentnumber';
`, companyID); err != nil {
		t.Fatalf("hide field: %v", err)
	}

	permissions, err := s.roleFieldPermissions(context.Background(), companyID, "ventas", "administracion")
	if err != nil {
		t.Fatalf("roleFieldPermissions: %v", err)
	}
	if permissions["documentnumber"] != "oculto" {
		t.Fatalf("documentnumber deberia estar 'oculto', got %q", permissions["documentnumber"])
	}
	if permissions["bloodtype"] != "ver" {
		t.Fatalf("bloodtype deberia seguir en 'ver', got %q", permissions["bloodtype"])
	}

	hidden := HiddenFieldSlugs(permissions)
	found := false
	for _, slug := range hidden {
		if slug == "documentnumber" {
			found = true
		}
		if slug == "bloodtype" {
			t.Fatalf("bloodtype no deberia estar oculto")
		}
	}
	if !found {
		t.Fatalf("HiddenFieldSlugs no reporto documentnumber: %v", hidden)
	}
}

func TestSeedCatalogCoversRequiredModules(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)

	modules, err := s.ListModules()
	if err != nil {
		t.Fatalf("ListModules: %v", err)
	}

	required := []string{"tecnico", "cotizaciones", "compras", "crm", "inventario", "remisiones", "administracion", "finanzas"}
	bySlug := make(map[string]Module, len(modules))
	for _, module := range modules {
		bySlug[module.Slug] = module
	}
	for _, slug := range required {
		module, ok := bySlug[slug]
		if !ok {
			t.Fatalf("el catalogo seed no cubre el modulo %q", slug)
		}
		if len(module.Fields) == 0 {
			t.Fatalf("el modulo %q no tiene campos", slug)
		}
	}
}

// Hallazgo t07: el rol "Técnico" debe nacer con 'agregar: propio' sobre el
// módulo inventario (sin eso el técnico recibe 403 al solicitar repuestos).
// El seed es perezoso e idempotente: re-aplicarlo no duplica ni pisa lo que un
// administrador haya concedido o denegado a mano.
func TestTechnicianRoleSeededWithAddOnInventory(t *testing.T) {
	db := openTestDB(t)
	s := NewService(db)
	companyID := testCompany(t, db, "tecnico-inventario")

	ctx := context.Background()
	if _, err := s.ListRoles(companyID); err != nil {
		t.Fatalf("ListRoles (seed): %v", err)
	}

	var scopeID int
	err := db.QueryRow(`
		SELECT rp.scope_id
		FROM acl_role_permissions rp
		JOIN acl_roles r ON r.id = rp.role_id
		JOIN acl_modules m ON m.id = rp.module_id
		JOIN acl_actions a ON a.id = rp.action_id
		WHERE r.company_id = $1 AND r.name = 'Técnico'
		  AND m.slug = 'inventario' AND a.name = 'agregar'
	`, companyID).Scan(&scopeID)
	if err != nil {
		t.Fatalf("consultar permiso agregar/inventario del Técnico: %v", err)
	}
	if scopeID != 1 { // 1 = propio
		t.Errorf("scope_id = %d, esperaba 1 (propio)", scopeID)
	}

	// El middleware lo ejerce de punta a punta: POST (agregar) pasa, y los demás
	// módulos no administrativos quedan como antes (sólo 'ver').
	e := newTestApp(s, "inventario", "Técnico", companyID)
	if rec := doRequest(t, e, http.MethodPost, "/probe"); rec.Code != http.StatusOK {
		t.Fatalf("POST inventario con rol Técnico devolvio %d, body: %s", rec.Code, rec.Body.String())
	}

	// Re-seed idempotente: mismos permisos, sin filas duplicadas.
	if err := s.ensureDefaultRoles(ctx, companyID); err != nil {
		t.Fatalf("ensureDefaultRoles (re-aplicado): %v", err)
	}
	var count int
	if err := db.QueryRow(`
		SELECT COUNT(*)
		FROM acl_role_permissions rp
		JOIN acl_roles r ON r.id = rp.role_id
		WHERE r.company_id = $1 AND r.name = 'Técnico'
	`, companyID).Scan(&count); err != nil {
		t.Fatalf("contar permisos del Técnico: %v", err)
	}
	var moduleCount, actionCount int
	if err := db.QueryRow(`SELECT COUNT(*) FROM acl_modules WHERE is_active = true`).Scan(&moduleCount); err != nil {
		t.Fatalf("contar modulos: %v", err)
	}
	if err := db.QueryRow(`SELECT COUNT(*) FROM acl_actions`).Scan(&actionCount); err != nil {
		t.Fatalf("contar acciones: %v", err)
	}
	if expected := moduleCount * actionCount; count != expected {
		t.Errorf("permisos del Técnico = %d, esperaba %d (modulos x acciones, sin duplicados)", count, expected)
	}
}
