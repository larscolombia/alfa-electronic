package hr

import (
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// qaAccessPassword cumple la política única de contraseñas del login (8+
// caracteres, mayúscula, minúscula, dígito y especial) que la identidad
// unificada exige al crear o anexar la cuenta de un empleado.
const qaAccessPassword = "Qa#12345abc"

// seedQAAccessRole siembra el rol ACL 'qa-access' para la empresa (Create y
// UpdateEmployee validan req.AccessRole contra acl_roles) y registra la limpieza
// del rol y de las cuentas users de QA. Llamar ANTES de registrar limpiezas de
// empleados: los t.Cleanup corren en orden LIFO.
func seedQAAccessRole(t *testing.T, db *sql.DB, companyID string) string {
	t.Helper()
	if _, err := db.Exec(`
INSERT INTO acl_roles (id, company_id, name, description, is_active, created_at, updated_at)
VALUES ($1, $2, 'qa-access', 'Rol de acceso para pruebas QA', true, NOW(), NOW())
ON CONFLICT DO NOTHING;
`, uuid.NewString(), companyID); err != nil {
		t.Fatalf("seed qa-access role: %v", err)
	}
	t.Cleanup(func() {
		cleanupQAAccessUsers(t, db, companyID)
		if _, err := db.Exec(`DELETE FROM acl_roles WHERE company_id = $1 AND name = 'qa-access';`, companyID); err != nil {
			t.Logf("cleanup qa-access role failed: %v", err)
		}
	})
	return "qa-access"
}

// qaEmail devuelve correos de prueba bajo el prefijo qa.ident. que
// cleanupQAAccessUsers reconoce para no dejar cuentas residuales.
func qaEmail(suffix string) string {
	return fmt.Sprintf("qa.ident.%s@example.com", suffix)
}

func cleanupQAAccessUsers(t *testing.T, db *sql.DB, companyID string) {
	t.Helper()
	if _, err := db.Exec(`DELETE FROM users WHERE company_id = $1 AND email LIKE 'qa.ident.%';`, companyID); err != nil {
		t.Logf("cleanup qa users failed: %v", err)
	}
}

func TestCreateEmployeeAccessIdentityRequired(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)
	accessRole := seedQAAccessRole(t, db, testCompanyID)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	base := CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Identidad %s", suffix),
		Role:       fmt.Sprintf("QA Cargo Ident %s", suffix),
		Department: fmt.Sprintf("QA Dept Ident %s", suffix),
		Status:     "Activo",
		Email:      qaEmail(suffix),
		Password:   qaAccessPassword,
		AccessRole: accessRole,
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, "__none__", base.Role, base.Department) })

	t.Run("sin email devuelve errEmployeeEmailRequired", func(t *testing.T) {
		req := base
		req.Email = "   "
		if _, err := service.CreateEmployee(testCompanyID, req); !errors.Is(err, errEmployeeEmailRequired) {
			t.Fatalf("expected errEmployeeEmailRequired, got %v", err)
		}
	})

	t.Run("sin password devuelve errEmployeePasswordRequired", func(t *testing.T) {
		req := base
		req.Password = ""
		if _, err := service.CreateEmployee(testCompanyID, req); !errors.Is(err, errEmployeePasswordRequired) {
			t.Fatalf("expected errEmployeePasswordRequired, got %v", err)
		}
	})

	t.Run("password debil devuelve error de politica", func(t *testing.T) {
		req := base
		req.Password = "abc"
		err := func() error {
			_, err := service.CreateEmployee(testCompanyID, req)
			return err
		}()
		if err == nil {
			t.Fatal("expected password policy error, got nil")
		}
	})

	t.Run("sin accessRole devuelve errEmployeeAccessRoleRequired", func(t *testing.T) {
		req := base
		req.AccessRole = ""
		if _, err := service.CreateEmployee(testCompanyID, req); !errors.Is(err, errEmployeeAccessRoleRequired) {
			t.Fatalf("expected errEmployeeAccessRoleRequired, got %v", err)
		}
	})

	t.Run("accessRole inexistente devuelve errEmployeeAccessRoleUnknown", func(t *testing.T) {
		req := base
		req.AccessRole = "rol-qa-inexistente"
		if _, err := service.CreateEmployee(testCompanyID, req); !errors.Is(err, errEmployeeAccessRoleUnknown) {
			t.Fatalf("expected errEmployeeAccessRoleUnknown, got %v", err)
		}
	})
}

func TestCreateEmployeeAccessIdentityHappyPath(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)
	accessRole := seedQAAccessRole(t, db, testCompanyID)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Cuenta %s", suffix)
	department := fmt.Sprintf("QA Dept Cuenta %s", suffix)
	email := qaEmail(suffix)

	created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Cuenta %s", suffix),
		Role:       role,
		Department: department,
		Status:     "Activo",
		Email:      email,
		Password:   qaAccessPassword,
		AccessRole: accessRole,
	})
	if err != nil {
		t.Fatalf("CreateEmployee returned error: %v", err)
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, role, department) })

	t.Run("crea la cuenta users con bcrypt y enlaza hr_employees.user_id", func(t *testing.T) {
		if created.UserID == "" {
			t.Fatal("expected non-empty UserID in create response")
		}
		var userID, passwordHash, userRole string
		var isActive bool
		if err := db.QueryRow(`
SELECT id, password_hash, role, is_active FROM users WHERE company_id = $1 AND LOWER(email) = $2;
`, testCompanyID, email).Scan(&userID, &passwordHash, &userRole, &isActive); err != nil {
			t.Fatalf("query users row: %v", err)
		}
		if userID != created.UserID {
			t.Fatalf("users.id %q != employee.UserID %q", userID, created.UserID)
		}
		if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(qaAccessPassword)); err != nil {
			t.Fatalf("bcrypt verify of qaAccessPassword failed: %v", err)
		}
		if userRole != accessRole {
			t.Fatalf("expected users.role %q, got %q", accessRole, userRole)
		}
		if !isActive {
			t.Fatal("expected users.is_active = true for Activo employee")
		}
		var linkedID string
		if err := db.QueryRow(`
SELECT COALESCE(user_id, '') FROM hr_employees WHERE company_id = $1 AND id = $2;
`, testCompanyID, created.ID).Scan(&linkedID); err != nil {
			t.Fatalf("query hr_employees.user_id: %v", err)
		}
		if linkedID != userID {
			t.Fatalf("hr_employees.user_id %q != users.id %q", linkedID, userID)
		}
	})

	t.Run("segundo empleado con el mismo email devuelve errEmployeeEmailExists", func(t *testing.T) {
		_, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:       fmt.Sprintf("QA Cuenta Duplicada %s", suffix),
			Role:       role,
			Department: department,
			Status:     "Activo",
			Email:      email,
			Password:   qaAccessPassword,
			AccessRole: accessRole,
		})
		if !errors.Is(err, errEmployeeEmailExists) {
			t.Fatalf("expected errEmployeeEmailExists, got %v", err)
		}
	})

	t.Run("SoftDeleteEmployees desactiva la cuenta enlazada", func(t *testing.T) {
		processed, err := service.SoftDeleteEmployees(testCompanyID, []EmployeeSoftDeletePayload{{EmployeeID: created.ID}})
		if err != nil {
			t.Fatalf("SoftDeleteEmployees returned error: %v", err)
		}
		if processed != 1 {
			t.Fatalf("expected 1 processed employee, got %d", processed)
		}
		var isActive bool
		if err := db.QueryRow(`SELECT is_active FROM users WHERE id = $1;`, created.UserID).Scan(&isActive); err != nil {
			t.Fatalf("query users.is_active: %v", err)
		}
		if isActive {
			t.Fatal("expected users.is_active = false after soft delete")
		}
	})
}
