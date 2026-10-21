package auth

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	errUserEmailInvalid   = errors.New("el correo del usuario es invalido")
	errUserEmailExists    = errors.New("ya existe un usuario con ese correo")
	errUserRoleRequired   = errors.New("el rol es obligatorio")
	errUserRoleUnknown    = errors.New("el rol indicado no existe en acl_roles de la empresa: creelo oelijalo del panel de roles antes de asignarlo")
	errUserNameRequired   = errors.New("el nombre del usuario es obligatorio")
	errPasswordConfirmBad = errors.New("la clave y su confirmacion no coinciden")
)

// CreateUser crea un usuario con el rol elegido por el administrador. Ruta
// admin-only (montada sobre el grupo /users con RequireModule("administracion")).
//
// El rol se valida contra acl_roles de la empresa ANTES de insertar: el middleware
// ACL resuelve permisos con LOWER(r.name) = LOWER(rol) filtrando por company_id,
// asi que un rol inexistente produciria un usuario sin ningun permiso (todo 403)
// y sin forma obvia de diagnosticarlo desde el login.
func (s *Service) CreateUser(ctx context.Context, companyID string, req CreateUserRequest) (ManagedUser, error) {
	if err := s.ensureDB(); err != nil {
		return ManagedUser{}, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return ManagedUser{}, err
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if !reAuthEmail.MatchString(email) {
		return ManagedUser{}, errUserEmailInvalid
	}

	name := strings.TrimSpace(req.Name)
	if len(name) < 2 {
		return ManagedUser{}, errUserNameRequired
	}

	role := strings.TrimSpace(req.Role)
	if role == "" {
		return ManagedUser{}, errUserRoleRequired
	}

	password := req.Password
	if password == "" {
		return ManagedUser{}, errPasswordRequired
	}
	if err := validatePasswordStrength(password); err != nil {
		return ManagedUser{}, err
	}
	if confirm := strings.TrimSpace(req.ConfirmPassword); confirm != "" && confirm != password {
		return ManagedUser{}, errPasswordConfirmBad
	}

	// Los roles por defecto del ACL se siembran de forma perezosa (al abrir el
	// panel de roles o al autorizar a un usuario no admin), y el propio admin no
	// dispara esa siembra porque isAdminRole hace bypass. Sin este paso, crear el
	// primer usuario con rol "ventas" fallaria con "rol no existe" en una empresa
	// recien creada.
	if s.roleReadiness != nil {
		if err := s.roleReadiness(ctx, normalizedCompanyID); err != nil {
			return ManagedUser{}, err
		}
	}

	roleExists, err := s.roleExists(ctx, normalizedCompanyID, role)
	if err != nil {
		return ManagedUser{}, err
	}
	if !roleExists {
		return ManagedUser{}, errUserRoleUnknown
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return ManagedUser{}, err
	}

	user := ManagedUser{
		ID:        uuid.NewString(),
		CompanyID: normalizedCompanyID,
		Email:     email,
		Name:      name,
		Role:      role,
		IsActive:  true,
	}

	err = s.db.QueryRowContext(ctx, `
INSERT INTO users (id, company_id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
RETURNING created_at, updated_at;
`, user.ID, user.CompanyID, user.Email, string(hashedPassword), user.Name, user.Role).Scan(&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if isDuplicateUserEmailError(err) {
			return ManagedUser{}, errUserEmailExists
		}
		return ManagedUser{}, err
	}

	return user, nil
}

// ListUsers devuelve los usuarios de la empresa, sin password_hash.
func (s *Service) ListUsers(ctx context.Context, companyID string) ([]ManagedUser, error) {
	if err := s.ensureDB(); err != nil {
		return nil, err
	}

	normalizedCompanyID, err := normalizeCompanyID(companyID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.QueryContext(ctx, `
SELECT id, company_id, email, name, role, is_active, created_at, updated_at
FROM users
WHERE company_id = $1
ORDER BY created_at ASC;
`, normalizedCompanyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]ManagedUser, 0)
	for rows.Next() {
		var user ManagedUser
		if err := rows.Scan(&user.ID, &user.CompanyID, &user.Email, &user.Name, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (s *Service) roleExists(ctx context.Context, companyID, role string) (bool, error) {
	var exists bool
	err := s.db.QueryRowContext(ctx, `
SELECT EXISTS(
	SELECT 1 FROM acl_roles
	WHERE company_id = $1 AND LOWER(name) = LOWER($2) AND is_active = true
);
`, companyID, role).Scan(&exists)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return false, err
	}
	return exists, nil
}

func isDuplicateUserEmailError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate key") && strings.Contains(msg, "users_email_lower_key")
}
