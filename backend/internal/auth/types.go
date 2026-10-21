package auth

import "time"

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	ID        string `json:"id,omitempty"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	CompanyID string `json:"companyId,omitempty"`
}

type LoginResponse struct {
	AccessToken string `json:"accessToken"`
	TokenType   string `json:"tokenType"`
	ExpiresIn   int64  `json:"expiresIn"`
	User        User   `json:"user"`
}

// CreateUserRequest es la peticion de alta de usuario hecha por un administrador.
// El rol lo elige el admin (nunca el propio usuario) y debe existir en acl_roles de
// la empresa, porque el middleware ACL resuelve permisos por nombre de rol.
type CreateUserRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirmPassword"`
	Name            string `json:"name"`
	Role            string `json:"role"`
}

// ManagedUser es la representacion publica de una fila de users. Nunca incluye
// password_hash.
type ManagedUser struct {
	ID        string    `json:"id"`
	CompanyID string    `json:"companyId"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
