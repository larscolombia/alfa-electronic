package hr

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// insertLegacyEmployeeWithoutUser simula una fila anterior a la migración de
// identidad unificada: un empleado sin cuenta de login enlazada (user_id NULL).
func insertLegacyEmployeeWithoutUser(t *testing.T, db *sql.DB, id, email string) {
	t.Helper()
	if _, err := db.Exec(`
INSERT INTO hr_employees (company_id, id, name, role, department, manager, status, email, soft_delete, created_at, updated_at)
VALUES ($1, $2, 'QA Legacy', 'QA Cargo Legacy', 'QA Dept Legacy', 'Direccion General', 'Activo', $3, false, NOW(), NOW());
`, testCompanyID, id, email); err != nil {
		t.Fatalf("insert legacy employee: %v", err)
	}
	t.Cleanup(func() {
		if _, err := db.Exec(`DELETE FROM hr_employees WHERE company_id = $1 AND id = $2;`, testCompanyID, id); err != nil {
			t.Logf("cleanup legacy employee failed: %v", err)
		}
	})
}

func TestResetEmployeePasswordIntegration(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)
	ctx := context.Background()
	accessRole := seedQAAccessRole(t, db, testCompanyID)

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Reset %s", suffix)
	department := fmt.Sprintf("QA Dept Reset %s", suffix)

	t.Run("empleado con cuenta recibe clave temporal hasheada en users", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:       fmt.Sprintf("QA Empleado Reset %s", suffix),
			Role:       role,
			Department: department,
			Status:     "Activo",
			Email:      qaEmail(suffix + "-reset"),
			Password:   qaAccessPassword,
			AccessRole: accessRole,
		})
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, "__none__", "__none__") })

		response, err := service.ResetEmployeePassword(ctx, testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("ResetEmployeePassword returned error: %v", err)
		}
		if response.TemporaryPassword == "" {
			t.Fatal("expected non-empty TemporaryPassword")
		}
		if response.Message == "" {
			t.Fatal("expected non-empty Message")
		}

		var passwordHash string
		if err := db.QueryRow(`
SELECT password_hash FROM users WHERE id = $1 AND company_id = $2;
`, created.UserID, testCompanyID).Scan(&passwordHash); err != nil {
			t.Fatalf("query users.password_hash: %v", err)
		}
		if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(response.TemporaryPassword)); err != nil {
			t.Fatalf("temporary password does not match stored bcrypt hash: %v", err)
		}

		second, err := service.ResetEmployeePassword(ctx, testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("second ResetEmployeePassword returned error: %v", err)
		}
		if second.TemporaryPassword == response.TemporaryPassword {
			t.Fatal("expected a different temporary password on second reset")
		}
	})

	t.Run("empleado legacy sin user_id devuelve errEmployeeAccessAccountMissing", func(t *testing.T) {
		legacyID := fmt.Sprintf("EMP-LEG-%s", suffix[len(suffix)-6:])
		insertLegacyEmployeeWithoutUser(t, db, legacyID, qaEmail(suffix+"-legacy"))

		_, err := service.ResetEmployeePassword(ctx, testCompanyID, legacyID)
		if !errors.Is(err, errEmployeeAccessAccountMissing) {
			t.Fatalf("expected errEmployeeAccessAccountMissing, got %v", err)
		}
	})

	t.Run("empleado inexistente devuelve errEmployeeNotFound", func(t *testing.T) {
		_, err := service.ResetEmployeePassword(ctx, testCompanyID, "EMP-999999")
		if !errors.Is(err, errEmployeeNotFound) {
			t.Fatalf("expected errEmployeeNotFound, got %v", err)
		}
	})

	t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, "__none__", role, department) })
}
