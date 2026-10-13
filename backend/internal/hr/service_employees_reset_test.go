package hr

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"testing"
	"time"
)

func cleanupSignupArtifacts(t *testing.T, db *sql.DB, signupID string) {
	t.Helper()
	statements := []struct {
		query string
		args  []any
	}{
		{`DELETE FROM auth_password_reset_tokens WHERE company_id = $1 AND signup_id = $2;`, []any{testCompanyID, signupID}},
		{`DELETE FROM auth_signup_submissions WHERE company_id = $1 AND id = $2;`, []any{testCompanyID, signupID}},
	}
	for _, stmt := range statements {
		if _, err := db.Exec(stmt.query, stmt.args...); err != nil {
			t.Logf("cleanup failed (%s): %v", stmt.query, err)
		}
	}
}

func createTestSignup(t *testing.T, db *sql.DB, email string) string {
	t.Helper()
	signupID := fmt.Sprintf("qa-signup-%d", time.Now().UnixNano())
	_, err := db.Exec(`
INSERT INTO auth_signup_submissions (
	company_id, id, first_name, last_name, email, country_code, phone, password_hash, signup_type, created_at, updated_at
) VALUES ($1, $2, 'QA', 'Reset', $3, '+57', '3000000000', 'qa-hash', 'employee', NOW(), NOW());
`, testCompanyID, signupID, email)
	if err != nil {
		t.Fatalf("insert test signup: %v", err)
	}
	t.Cleanup(func() { cleanupSignupArtifacts(t, db, signupID) })
	return signupID
}

func TestResetEmployeePasswordIntegration(t *testing.T) {
	db := openTestDB(t)
	service := NewService(db)
	ctx := context.Background()

	suffix := fmt.Sprintf("%d", time.Now().UnixNano())
	role := fmt.Sprintf("QA Cargo Reset %s", suffix)
	department := fmt.Sprintf("QA Dept Reset %s", suffix)

	t.Run("empleado con email y cuenta existente genera token", func(t *testing.T) {
		email := fmt.Sprintf("qa.reset.%s@example.com", suffix)
		signupID := createTestSignup(t, db, email)

		created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:       fmt.Sprintf("QA Empleado Reset %s", suffix),
			Role:       role,
			Department: department,
			Email:      email,
		})
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, "__none__", "__none__") })

		response, err := service.ResetEmployeePassword(ctx, testCompanyID, created.ID)
		if err != nil {
			t.Fatalf("ResetEmployeePassword returned error: %v", err)
		}
		if response.ResetToken == "" {
			t.Fatal("expected non-empty reset token")
		}
		if response.Message == "" {
			t.Fatal("expected non-empty message")
		}
		if time.Until(response.ExpiresAt) <= 0 {
			t.Fatalf("expected future expiration, got %v", response.ExpiresAt)
		}

		var storedToken, storedSignupID string
		if err := db.QueryRow(
			`SELECT token, signup_id FROM auth_password_reset_tokens WHERE company_id = $1 AND email = $2 ORDER BY created_at DESC LIMIT 1;`,
			testCompanyID, email,
		).Scan(&storedToken, &storedSignupID); err != nil {
			t.Fatalf("query reset token: %v", err)
		}
		if storedToken != response.ResetToken {
			t.Fatalf("stored token mismatch: %q vs %q", storedToken, response.ResetToken)
		}
		if storedSignupID != signupID {
			t.Fatalf("token bound to unexpected signup %q, want %q", storedSignupID, signupID)
		}
	})

	t.Run("empleado sin email devuelve error claro", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:       fmt.Sprintf("QA Empleado Sin Email %s", suffix),
			Role:       role,
			Department: department,
		})
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, "__none__", "__none__") })

		_, err = service.ResetEmployeePassword(ctx, testCompanyID, created.ID)
		if !errors.Is(err, errEmployeeEmailMissing) {
			t.Fatalf("expected errEmployeeEmailMissing, got %v", err)
		}
	})

	t.Run("email sin cuenta de acceso devuelve error claro", func(t *testing.T) {
		created, err := service.CreateEmployee(testCompanyID, CreateEmployeeRequest{
			Name:       fmt.Sprintf("QA Empleado Sin Cuenta %s", suffix),
			Role:       role,
			Department: department,
			Email:      fmt.Sprintf("qa.sin.cuenta.%s@example.com", suffix),
		})
		if err != nil {
			t.Fatalf("CreateEmployee returned error: %v", err)
		}
		t.Cleanup(func() { cleanupEmployeeArtifacts(t, db, created.ID, "__none__", "__none__") })

		_, err = service.ResetEmployeePassword(ctx, testCompanyID, created.ID)
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
