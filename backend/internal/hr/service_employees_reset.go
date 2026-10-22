package hr

import (
	"context"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

// ResetEmployeePassword genera una clave temporal para la cuenta de login del
// empleado (users) y la devuelve UNA sola vez para que RRHH la entregue.
//
// Antes buscaba el correo en auth_signup_submissions (la tabla del signup
// público), que no tiene nada que ver con users: un empleado creado por RRHH
// —y también un usuario creado por POST /users— terminaba en
// errEmployeeAccessAccountMissing aunque tuviera cuenta. Ahora la cuenta se
// resuelve por el vínculo empleado→usuario.
func (s *Service) ResetEmployeePassword(ctx context.Context, companyID, id string) (ResetEmployeePasswordResponse, error) {
	if err := s.ensureCompanyDefaults(ctx, companyID); err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	employee, err := s.findEmployee(ctx, companyID, strings.TrimSpace(id))
	if err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	userID := strings.TrimSpace(employee.UserID)
	if userID == "" {
		// Legacy sin cuenta enlazada: se le anexa al editar la ficha
		// (email+contraseña+rol). Sin cuenta no hay nada que restablecer.
		return ResetEmployeePasswordResponse{}, errEmployeeAccessAccountMissing
	}

	temporaryPassword, err := generateTemporaryPassword()
	if err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(temporaryPassword), bcrypt.DefaultCost)
	if err != nil {
		return ResetEmployeePasswordResponse{}, err
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE users SET password_hash = $1, updated_at = NOW()
WHERE id = $2 AND company_id = $3;
`, string(hashed), userID, companyID)
	if err != nil {
		return ResetEmployeePasswordResponse{}, err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return ResetEmployeePasswordResponse{}, errEmployeeAccessAccountMissing
	}

	return ResetEmployeePasswordResponse{
		Message:           "Clave temporal generada: entregala al colaborador para que la cambie al entrar.",
		TemporaryPassword: temporaryPassword,
	}, nil
}
