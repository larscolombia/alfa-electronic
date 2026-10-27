package auth

import (
	"context"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const (
	defaultTechnicianEmail    = "tecnico@alfa.com"
	defaultTechnicianPassword = "1234"
	defaultTechnicianName     = "Técnico QA"
	defaultTechnicianRole     = "Técnico"
)

// EnsureTechnicianUser siembra la cuenta tecnica de prueba en la misma empresa
// del admin, solo si no existe. Es idempotente: nunca sobreescribe la clave y
// reactiva la cuenta si fue deshabilitada (mismo contrato que EnsureAdminUser).
func (s *Service) EnsureTechnicianUser(ctx context.Context) error {
	if err := s.ensureDB(); err != nil {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(defaultTechnicianPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	res, err := s.db.ExecContext(ctx, `
INSERT INTO users (id, company_id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT $1, $2, $3, $4, $5, $6, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER($3));
`, uuid.NewString(), s.adminCompanyID, defaultTechnicianEmail, string(hashedPassword), defaultTechnicianName, defaultTechnicianRole)
	if err != nil {
		return err
	}

	if affected, _ := res.RowsAffected(); affected == 0 {
		_, err := s.db.ExecContext(ctx, `
UPDATE users SET is_active = true, updated_at = NOW()
WHERE LOWER(email) = LOWER($1) AND is_active = false;
`, defaultTechnicianEmail)
		return err
	}

	return nil
}
