package hr

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

func TestGetEmployeeIntegration(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Get %s", suffix)
	department := fmt.Sprintf("QA Dept Get %s", suffix)

	created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:           fmt.Sprintf("QA Empleado Get %s", suffix),
		Role:           role,
		Department:     department,
		Status:         "Licencia",
		DocumentNumber: fmt.Sprintf("DOC-%s", suffix),
		Email:          fmt.Sprintf("qa.get.%s@example.com", suffix),
	})
	if err != nil {
		t.Fatalf("CreateEmployee returned error: %v", err)
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, role, department) })

	t.Run("devuelve el empleado existente con documento y email", func(t *testing.T) {
		found, err := service.GetEmployee(testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("GetEmployee returned error: %v", err)
		}
		if found.ID != created.ID || found.Name != created.Name {
			t.Fatalf("unexpected employee: %+v", found)
		}
		if found.Status != "Licencia" {
			t.Fatalf("expected status Licencia, got %q", found.Status)
		}
		if found.DocumentNumber != fmt.Sprintf("DOC-%s", suffix) {
			t.Fatalf("expected documentNumber DOC-%s, got %q", suffix, found.DocumentNumber)
		}
		if found.Email != fmt.Sprintf("qa.get.%s@example.com", suffix) {
			t.Fatalf("unexpected email %q", found.Email)
		}
	})

	t.Run("devuelve errEmployeeNotFound para id inexistente", func(t *testing.T) {
		_, err := service.GetEmployee(testCompanyID, "EMP-999999")
		if !errors.Is(err, errEmployeeNotFound) {
			t.Fatalf("expected errEmployeeNotFound, got %v", err)
		}
	})
}

func TestUpdateEmployeeIntegration(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Upd %s", suffix)
	department := fmt.Sprintf("QA Dept Upd %s", suffix)

	created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
		Name:       fmt.Sprintf("QA Empleado Upd %s", suffix),
		Role:       role,
		Department: department,
	})
	if err != nil {
		t.Fatalf("CreateEmployee returned error: %v", err)
	}
	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, role, department) })

	t.Run("actualiza campos y persiste con catalogos nuevos", func(t *testing.T) {
		newRole := fmt.Sprintf("QA Cargo Nuevo %s", suffix)
		newDepartment := fmt.Sprintf("QA Dept Nuevo %s", suffix)
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, "__none__", newRole, newDepartment) })

		updated, err := service.UpdateEmployee(testCompanyID, created.ID, UpdateEmployeeRequest{
			Name:           fmt.Sprintf("QA Empleado Editado %s", suffix),
			Role:           newRole,
			Department:     newDepartment,
			Manager:        "QA Manager",
			Status:         "Inactivo",
			DocumentNumber: fmt.Sprintf("DOC-EDIT-%s", suffix),
			Email:          fmt.Sprintf("qa.edit.%s@example.com", suffix),
			FileComplete:   true,
		})
		if err != nil {
			t.Fatalf("UpdateEmployee returned error: %v", err)
		}
		if updated.ID != created.ID {
			t.Fatalf("expected same ID %s, got %s", created.ID, updated.ID)
		}

		reloaded, err := service.GetEmployee(testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("GetEmployee after update returned error: %v", err)
		}
		if reloaded.Name != updated.Name || reloaded.Role != newRole || reloaded.Department != newDepartment {
			t.Fatalf("unexpected persisted values: %+v", reloaded)
		}
		if reloaded.Manager != "QA Manager" || reloaded.Status != "Inactivo" || !reloaded.FileComplete {
			t.Fatalf("unexpected manager/status/fileComplete: %+v", reloaded)
		}
		if reloaded.DocumentNumber != fmt.Sprintf("DOC-EDIT-%s", suffix) {
			t.Fatalf("unexpected documentNumber %q", reloaded.DocumentNumber)
		}
		if reloaded.Email != fmt.Sprintf("qa.edit.%s@example.com", suffix) {
			t.Fatalf("unexpected email %q", reloaded.Email)
		}

		var positionCount, departmentCount int
		if err := db.QueryRow(
			`SELECT COUNT(*) FROM hr_positions WHERE company_id = $1 AND LOWER(name) = LOWER($2);`,
			testCompanyID, newRole,
		).Scan(&positionCount); err != nil {
			t.Fatalf("count positions: %v", err)
		}
		if err := db.QueryRow(
			`SELECT COUNT(*) FROM hr_departments WHERE company_id = $1 AND LOWER(name) = LOWER($2);`,
			testCompanyID, newDepartment,
		).Scan(&departmentCount); err != nil {
			t.Fatalf("count departments: %v", err)
		}
		if positionCount != 1 || departmentCount != 1 {
			t.Fatalf("catalogs duplicated: positions=%d departments=%d", positionCount, departmentCount)
		}
	})

	t.Run("rechaza nombre vacio", func(t *testing.T) {
		_, err := service.UpdateEmployee(testCompanyID, created.ID, UpdateEmployeeRequest{Name: "  "})
		if !errors.Is(err, errEmployeeNameMissing) {
			t.Fatalf("expected errEmployeeNameMissing, got %v", err)
		}
	})

	t.Run("rechaza estado invalido", func(t *testing.T) {
		_, err := service.UpdateEmployee(testCompanyID, created.ID, UpdateEmployeeRequest{
			Name:   "QA Empleado Estado",
			Status: "Suspendido",
		})
		if !errors.Is(err, errEmployeeStatusInvalid) {
			t.Fatalf("expected errEmployeeStatusInvalid, got %v", err)
		}
	})

	t.Run("rechaza email con formato invalido", func(t *testing.T) {
		_, err := service.UpdateEmployee(testCompanyID, created.ID, UpdateEmployeeRequest{
			Name:  "QA Empleado Email",
			Email: "no-es-un-correo",
		})
		if !errors.Is(err, errEmployeeEmailInvalid) {
			t.Fatalf("expected errEmployeeEmailInvalid, got %v", err)
		}
	})

	t.Run("devuelve errEmployeeNotFound para id inexistente", func(t *testing.T) {
		_, err := service.UpdateEmployee(testCompanyID, "EMP-999999", UpdateEmployeeRequest{Name: "QA Nadie"})
		if !errors.Is(err, errEmployeeNotFound) {
			t.Fatalf("expected errEmployeeNotFound, got %v", err)
		}
	})
}
