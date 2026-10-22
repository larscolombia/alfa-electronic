package hr

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
	"pika.software.net.co/backend/internal/acl"
	"pika.software.net.co/backend/internal/platform/company"
	"pika.software.net.co/backend/internal/platform/database"
)

// newACLTestApp monta /hr tras el middleware ACL de administracion, igual que main.go.
func newACLTestApp(hrService *Service, aclService *acl.Service, role, companyID string) *echo.Echo {
	e := echo.New()
	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Request().Header.Set(company.HeaderName, companyID)
			c.Set("auth.role", role)
			return next(c)
		}
	})
	handler := NewHandler(hrService)
	handler.RegisterRoutes(e.Group("/hr", aclService.RequireModule("administracion")))
	return e
}

func TestEmployeeResponsesNeverLeakEmailPassword(t *testing.T) {
	db := openTestDB(t)
	if err := database.Migrate(db); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	hrService := NewService(db)
	aclService := acl.NewService(db)

	companyID := fmt.Sprintf("qa-hr-acl-%d", time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM acl_roles WHERE company_id = $1`, companyID)
	})
	accessRole := seedQAAccessRole(t, db, companyID)

	const secretPassword = "ClaveSecreta#123"
	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Mask %s", suffix)
	department := fmt.Sprintf("QA Dept Mask %s", suffix)
	employeeEmail := qaEmail(suffix + "-mask")

	created, err := hrService.CreateEmployee(companyID, CreateEmployeeRequest{
		Name:           fmt.Sprintf("QA Mask %s", suffix),
		Role:           role,
		Department:     department,
		DocumentNumber: "DOC-MASK-1",
		EmailPassword:  secretPassword,
		Email:          employeeEmail,
		Password:       qaAccessPassword,
		AccessRole:     accessRole,
	})
	if err != nil {
		t.Fatalf("CreateEmployee: %v", err)
	}
	t.Cleanup(func() {
		db.Exec(`DELETE FROM hr_employees WHERE company_id = $1 AND id = $2`, companyID, created.ID)
		db.Exec(`DELETE FROM hr_positions WHERE company_id = $1 AND name = $2`, companyID, role)
		db.Exec(`DELETE FROM hr_departments WHERE company_id = $1 AND name = $2`, companyID, department)
	})

	// La clave queda persistida en DB (entra, no sale).
	var stored string
	if err := db.QueryRow(`SELECT email_password FROM hr_employees WHERE company_id = $1 AND id = $2`, companyID, created.ID).Scan(&stored); err != nil {
		t.Fatalf("leer email_password de DB: %v", err)
	}
	if stored != secretPassword {
		t.Fatalf("email_password no se persistio: got %q", stored)
	}

	t.Run("admin: GET empleado no incluye emailPassword ni reseteo de secretos", func(t *testing.T) {
		e := newACLTestApp(hrService, aclService, "admin", companyID)
		req := httptest.NewRequest(http.MethodGet, "/hr/employees/"+created.ID, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET admin devolvio %d: %s", rec.Code, rec.Body.String())
		}
		body := rec.Body.String()
		if strings.Contains(body, "emailPassword") || strings.Contains(body, secretPassword) {
			t.Fatalf("la respuesta filtra el secreto: %s", body)
		}
		var payload map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("json invalido: %v", err)
		}
		if payload["documentNumber"] != "DOC-MASK-1" {
			t.Fatalf("admin deberia ver documentNumber sin enmascarar: %v", payload["documentNumber"])
		}
	})

	t.Run("admin: listado no incluye emailPassword", func(t *testing.T) {
		e := newACLTestApp(hrService, aclService, "admin", companyID)
		req := httptest.NewRequest(http.MethodGet, "/hr/employees", nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET listado devolvio %d: %s", rec.Code, rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "emailPassword") || strings.Contains(rec.Body.String(), secretPassword) {
			t.Fatalf("el listado filtra el secreto: %s", rec.Body.String())
		}
	})

	t.Run("ventas: campo oculto por ACL no sale en la respuesta", func(t *testing.T) {
		// Siembra modulos y roles por defecto para la empresa antes de configurar
		// permisos de campo (el middleware los sembraria al primer request, pero el
		// UPDATE de abajo necesita que el rol 'ventas' ya exista).
		if _, err := aclService.ListRoles(companyID); err != nil {
			t.Fatalf("ListRoles seed: %v", err)
		}

		// El seed deniega 'administracion' a los roles no admin (datos personales de
		// empleados), asi que el acceso se concede de forma explicita igual que lo
		// haria el administrador desde el panel. De paso queda probada la ruta de
		// concesion, no solo la de denegacion.
		grant, err := db.Exec(`
UPDATE acl_role_permissions rp
SET scope_id = 1, updated_at = NOW()
FROM acl_roles r, acl_modules m, acl_actions a
WHERE rp.role_id = r.id
  AND rp.module_id = m.id
  AND rp.action_id = a.id
  AND r.company_id = $1
  AND LOWER(r.name) = 'ventas'
  AND m.slug = 'administracion'
  AND a.name = 'ver';
`, companyID)
		if err != nil {
			t.Fatalf("conceder ver a ventas: %v", err)
		}
		if affected, _ := grant.RowsAffected(); affected == 0 {
			t.Fatalf("no se concedio el permiso: el seed no creo la fila de permiso")
		}

		// Marca documentnumber (slug del seed) como 'oculto' para el rol ventas.
		result, err := db.Exec(`
UPDATE acl_role_field_permissions rfp
SET field_perm_id = 4
FROM acl_roles r, acl_module_fields f
WHERE rfp.role_id = r.id
  AND rfp.field_id = f.id
  AND r.company_id = $1
  AND LOWER(r.name) = 'ventas'
  AND f.module_id = 'mod-administracion'
  AND f.slug = 'documentnumber';
`, companyID)
		if err != nil {
			t.Fatalf("ocultar campo: %v", err)
		}
		if affected, _ := result.RowsAffected(); affected == 0 {
			t.Fatalf("no se oculto ningun campo: el seed no creo la fila de permiso")
		}

		e := newACLTestApp(hrService, aclService, "ventas", companyID)
		req := httptest.NewRequest(http.MethodGet, "/hr/employees/"+created.ID, nil)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET ventas devolvio %d: %s", rec.Code, rec.Body.String())
		}
		var payload map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("json invalido: %v", err)
		}
		if _, exists := payload["documentNumber"]; exists {
			t.Fatalf("documentNumber debio ser enmascarado para ventas: %s", rec.Body.String())
		}
		if payload["name"] == nil {
			t.Fatalf("los campos no sensibles deben seguir visibles: %s", rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "emailPassword") {
			t.Fatalf("la respuesta filtrada tambien debe excluir emailPassword: %s", rec.Body.String())
		}
	})

	t.Run("PUT sin emailPassword preserva el secreto guardado", func(t *testing.T) {
		e := newACLTestApp(hrService, aclService, "admin", companyID)
		// UpdateEmployee exige email no vacío (identidad unificada); password y
		// accessRole son opcionales cuando el empleado ya tiene cuenta enlazada.
		body := fmt.Sprintf(`{"name":"QA Mask Editado %s","role":%q,"department":%q,"status":"Activo","documentNumber":"DOC-MASK-2","email":%q}`, suffix, role, department, employeeEmail)
		req := httptest.NewRequest(http.MethodPut, "/hr/employees/"+created.ID, strings.NewReader(body))
		req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("PUT admin devolvio %d: %s", rec.Code, rec.Body.String())
		}
		if strings.Contains(rec.Body.String(), "emailPassword") || strings.Contains(rec.Body.String(), secretPassword) {
			t.Fatalf("el PUT filtra el secreto: %s", rec.Body.String())
		}

		var stored2 string
		if err := db.QueryRow(`SELECT email_password FROM hr_employees WHERE company_id = $1 AND id = $2`, companyID, created.ID).Scan(&stored2); err != nil {
			t.Fatalf("leer email_password tras PUT: %v", err)
		}
		if stored2 != secretPassword {
			t.Fatalf("el PUT sin clave borro el secreto guardado: got %q", stored2)
		}
	})
}

func TestHREmployeeJSONHasNoPasswordKey(t *testing.T) {
	// Garantiza a nivel de tipo que Employee no serializa ninguna clave.
	raw, err := json.Marshal(Employee{Name: "QA", Email: "qa@example.com"})
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if strings.Contains(strings.ToLower(string(raw)), "password") {
		t.Fatalf("Employee serializa un campo de password: %s", raw)
	}
}
