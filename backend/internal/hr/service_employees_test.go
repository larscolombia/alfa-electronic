package hr

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

const testCompanyID = "demo-company"

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
	t.Cleanup(func() { db.Close() })
	return db
}

func cleanupEmployeeArtifacts(t *testing.T, db *sql.DB, employeeID, role, department string) {
	t.Helper()
	statements := []struct {
		query string
		args  []any
	}{
		{`DELETE FROM hr_employees WHERE company_id = $1 AND id = $2;`, []any{testCompanyID, employeeID}},
		{`DELETE FROM hr_positions WHERE company_id = $1 AND name = $2;`, []any{testCompanyID, role}},
		{`DELETE FROM hr_departments WHERE company_id = $1 AND name = $2;`, []any{testCompanyID, department}},
	}
	for _, stmt := range statements {
		if _, err := db.Exec(stmt.query, stmt.args...); err != nil {
			t.Logf("cleanup failed (%s): %v", stmt.query, err)
		}
	}
}

func TestCreateEmployeeIntegration(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo %s", suffix)
	department := fmt.Sprintf("QA Dept %s", suffix)

	var createdID string
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, createdID, role, department) })

	t.Run("crea empleado valido y persiste", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:         fmt.Sprintf("QA Empleado %s", suffix),
			Role:         role,
			Department:   department,
			Status:       "Activo",
			FileComplete: false,
		})
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		createdID = created.ID

		if created.ID == "" {
			t.Fatal("expected generated employee ID, got empty")
		}
		if created.Role != role || created.Department != department {
			t.Fatalf("unexpected role/department: %q / %q", created.Role, created.Department)
		}

		employees, err := service.ListEmployees(testCompanyID)
		if err != nil {
			t.Fatalf("ListEmployees returned error: %v", err)
		}
		found := false
		for _, employee := range employees {
			if employee.ID == created.ID {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("employee %s not found in ListEmployees", created.ID)
		}

		var positionCount, departmentCount int
		if err := db.QueryRow(
			`SELECT COUNT(*) FROM hr_positions WHERE company_id = $1 AND LOWER(name) = LOWER($2);`,
			testCompanyID, role,
		).Scan(&positionCount); err != nil {
			t.Fatalf("count positions: %v", err)
		}
		if err := db.QueryRow(
			`SELECT COUNT(*) FROM hr_departments WHERE company_id = $1 AND LOWER(name) = LOWER($2);`,
			testCompanyID, department,
		).Scan(&departmentCount); err != nil {
			t.Fatalf("count departments: %v", err)
		}
		if positionCount != 1 || departmentCount != 1 {
			t.Fatalf("expected 1 position and 1 department, got %d and %d", positionCount, departmentCount)
		}
	})

	t.Run("reutiliza cargo y departamento existentes sin duplicar", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:       fmt.Sprintf("QA Empleado Dup %s", suffix),
			Role:       role,
			Department: department,
		})
		if err != nil {
			t.Fatalf("CreateEmployee with existing catalogs returned error: %v", err)
		}
		defer cleanupEmployeeArtifacts(t, db, created.ID, "__none__", "__none__")

		var positionCount, departmentCount int
		if err := db.QueryRow(
			`SELECT COUNT(*) FROM hr_positions WHERE company_id = $1 AND LOWER(name) = LOWER($2);`,
			testCompanyID, role,
		).Scan(&positionCount); err != nil {
			t.Fatalf("count positions: %v", err)
		}
		if err := db.QueryRow(
			`SELECT COUNT(*) FROM hr_departments WHERE company_id = $1 AND LOWER(name) = LOWER($2);`,
			testCompanyID, department,
		).Scan(&departmentCount); err != nil {
			t.Fatalf("count departments: %v", err)
		}
		if positionCount != 1 || departmentCount != 1 {
			t.Fatalf("catalogs duplicated: positions=%d departments=%d", positionCount, departmentCount)
		}
	})

	t.Run("rechaza nombre vacio con error de validacion", func(t *testing.T) {
		_, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name: "   ",
			Role: role,
		})
		if err == nil {
			t.Fatal("expected validation error for empty name, got nil")
		}
		if !errors.Is(err, errEmployeeNameMissing) {
			t.Fatalf("expected errEmployeeNameMissing, got %v", err)
		}
	})
}

// TestEmployeeDocumentNumberConflict cubre la guarda que impide que un número
// de documento choque con el de otro empleado o con un id existente: es lo que
// pasó en producción cuando el formulario de "Agregar empleado" abrió
// pre-cargado con la ficha demo y guardó su "EMP-001" como document_number de
// un empleado nuevo.
func TestEmployeeDocumentNumberConflict(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo %s", suffix)
	department := fmt.Sprintf("QA Dept %s", suffix)
	documentNumber := fmt.Sprintf("DOC-QA-%s", suffix)

	first, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:           fmt.Sprintf("QA Uno %s", suffix),
		Role:           role,
		Department:     department,
		Status:         "Activo",
		DocumentNumber: documentNumber,
	})
	if err != nil {
		t.Fatalf("CreateEmployee (primero): %v", err)
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, first.ID, role, department) })

	if _, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:           fmt.Sprintf("QA Dos %s", suffix),
		Role:           role,
		Department:     department,
		Status:         "Activo",
		DocumentNumber: documentNumber,
	}); !errors.Is(err, errEmployeeDocumentNumberConflict) {
		t.Fatalf("documento duplicado: esperaba conflicto, obtuve %v", err)
	}

	// El caso de producción: documento igual al ID de un empleado existente.
	if _, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:           fmt.Sprintf("QA Tres %s", suffix),
		Role:           role,
		Department:     department,
		Status:         "Activo",
		DocumentNumber: first.ID,
	}); !errors.Is(err, errEmployeeDocumentNumberConflict) {
		t.Fatalf("documento igual a un id: esperaba conflicto, obtuve %v", err)
	}

	// Actualizar al propio empleado conservando SU documento debe pasar.
	updated, err := service.UpdateEmployee(testCompanyID, first.ID, UpdateEmployeeRequest{
		Name:           first.Name,
		Role:           role,
		Department:     department,
		Status:         "Activo",
		DocumentNumber: documentNumber,
	})
	if err != nil {
		t.Fatalf("UpdateEmployee con su propio documento: %v", err)
	}
	if updated.DocumentNumber != documentNumber {
		t.Fatalf("documento alterado: %q", updated.DocumentNumber)
	}

	// Pero apropiarse del documento de otro empleado, no.
	second, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Cuatro %s", suffix),
		Role:       role,
		Department: department,
		Status:     "Activo",
	})
	if err != nil {
		t.Fatalf("CreateEmployee (segundo): %v", err)
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, second.ID, role, department) })

	if _, err := service.UpdateEmployee(testCompanyID, second.ID, UpdateEmployeeRequest{
		Name:           second.Name,
		Role:           role,
		Department:     department,
		Status:         "Activo",
		DocumentNumber: documentNumber,
	}); !errors.Is(err, errEmployeeDocumentNumberConflict) {
		t.Fatalf("update con documento ajeno: esperaba conflicto, obtuve %v", err)
	}
}
