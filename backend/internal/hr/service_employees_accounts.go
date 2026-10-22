package hr

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"pika.software.net.co/backend/internal/auth"
)

// Identidad unificada (pedido del dueño: "email y contraseña obligatorios, bajo
// ninguna circunstancia empleados sin usuarios; la estructura estándar es
// user -> role -> profile -> permissions"). users es la cuenta de login;
// hr_employees es el perfil; user_id es el vínculo. Todo el alta ocurre en la
// MISMA transacción para que no pueda quedar un empleado sin cuenta ni una
// cuenta huérfana.

// SetRoleReadiness registra el callback que asegura los roles ACL de la empresa
// antes de validar el rol de acceso de una cuenta nueva (misma siembra perezosa
// que usa auth para POST /users).
func (s *Service) SetRoleReadiness(fn func(ctx context.Context, companyID string) error) {
	s.roleReadiness = fn
}

// ensureAccessRole valida el rol de ACCESO (users.role) contra el ACL de la
// empresa. Es distinto del cargo (hr_employees.role = puesto de RRHH): un
// empleado puede ser "Tecnico de campo" y tener rol de acceso "tecnico".
func (s *Service) ensureAccessRole(ctx context.Context, companyID, role string) error {
	if strings.TrimSpace(role) == "" {
		return errEmployeeAccessRoleRequired
	}
	if s.roleReadiness != nil {
		if err := s.roleReadiness(ctx, companyID); err != nil {
			return err
		}
	}
	var count int
	err := s.db.QueryRowContext(ctx, `
SELECT COUNT(*)
FROM acl_roles
WHERE company_id = $1 AND LOWER(name) = LOWER($2);
`, companyID, strings.TrimSpace(role)).Scan(&count)
	if err != nil {
		return err
	}
	if count == 0 {
		return errEmployeeAccessRoleUnknown
	}
	return nil
}

// validateAccessPassword aplica la MISMA política del login: una sola política
// de contraseñas en todo el sistema, no dos que divergen.
func validateAccessPassword(password string) error {
	if strings.TrimSpace(password) == "" {
		return errEmployeePasswordRequired
	}
	return auth.ValidatePasswordStrength(password)
}

// resolveOrCreateAccessUser devuelve el id de la cuenta de login del correo,
// creándola si no existe. Si la cuenta YA existe (p. ej. la persona entró antes
// por el signup público) se ENLAZA en vez de fallar, y la contraseña enviada
// pisa el hash sólo si viene no vacía. Corre dentro de la transacción del
// llamador: empleado y cuenta son atómicos.
func resolveOrCreateAccessUser(ctx context.Context, tx *sql.Tx, companyID, email, name, role, password string, active bool) (string, error) {
	var userID string
	err := tx.QueryRowContext(ctx, `
SELECT id
FROM users
WHERE company_id = $1 AND LOWER(email) = $2;
`, companyID, email).Scan(&userID)
	if err == nil {
		if strings.TrimSpace(password) != "" {
			hashed, hashErr := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			if hashErr != nil {
				return "", hashErr
			}
			if _, updErr := tx.ExecContext(ctx, `
UPDATE users SET password_hash = $1, is_active = $2, updated_at = NOW()
WHERE id = $3;
`, string(hashed), active, userID); updErr != nil {
				return "", updErr
			}
		}
		return userID, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	userID = uuid.NewString()
	if _, err := tx.ExecContext(ctx, `
INSERT INTO users (id, company_id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
`, userID, companyID, email, string(hashed), name, role, active); err != nil {
		if isDuplicateUserEmail(err) {
			return "", errEmployeeEmailExists
		}
		return "", err
	}
	return userID, nil
}

// syncAccessAccount sincroniza la cuenta enlazada dentro de la transacción del
// llamador: correo (es el identificador de login), contraseña si viene,
// rol ACL si viene, y is_active derivado del estado del empleado (Inactivo o
// borrado => no puede entrar, que es lo que Authenticate exige).
func syncAccessAccount(ctx context.Context, tx *sql.Tx, userID, companyID, email, password, role string, active bool) error {
	if strings.TrimSpace(email) != "" {
		if _, err := tx.ExecContext(ctx, `
UPDATE users SET email = $1, updated_at = NOW()
WHERE id = $2 AND company_id = $3;
`, email, userID, companyID); err != nil {
			if isDuplicateUserEmail(err) {
				return errEmployeeEmailExists
			}
			return err
		}
	}
	if strings.TrimSpace(password) != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `
UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2;
`, string(hashed), userID); err != nil {
			return err
		}
	}
	if strings.TrimSpace(role) != "" {
		if _, err := tx.ExecContext(ctx, `
UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2;
`, strings.TrimSpace(role), userID); err != nil {
			return err
		}
	}
	if _, err := tx.ExecContext(ctx, `
UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2;
`, active, userID); err != nil {
		return err
	}
	return nil
}

// isDuplicateUserEmail detecta la violación del índice único global de users
// (LOWER(email)): el correo es identidad de login y no puede repetirse ni
// siquiera entre empresas.
func isDuplicateUserEmail(err error) bool {
	return err != nil &&
		strings.Contains(err.Error(), "duplicate key") &&
		strings.Contains(err.Error(), "users_email_lower_key")
}

// isDuplicateEmployeeEmail detecta el índice único por empresa de hr_employees:
// dos empleados de la misma empresa no pueden compartir casilla, porque esa
// casilla es una sola cuenta de login.
func isDuplicateEmployeeEmail(err error) bool {
	return err != nil &&
		strings.Contains(err.Error(), "duplicate key") &&
		strings.Contains(err.Error(), "hr_employees_email_company_key")
}

// generateTemporaryPassword arma una clave descartable que cumple la política
// del login. Se devuelve UNA sola vez en la respuesta de restablecimiento; RRHH
// la entrega y el colaborador la cambia al entrar.
func generateTemporaryPassword() (string, error) {
	buf := make([]byte, 6)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return fmt.Sprintf("Tmp-%s-Aa1!", hex.EncodeToString(buf)), nil
}
