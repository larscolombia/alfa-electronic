package auth

import (
	"context"
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"

	"pika.software.net.co/backend/internal/platform/company"
)

var (
	errInvalidCredentials = errors.New("invalid email or password")
	errInvalidPayload     = errors.New("email and password are required")
	// errJWTSecretRequired: sin secreto no hay tokens firmados con garantia. Se
	// eliminó a proposito el fallback a un secreto de desarrollo hardcoded: con él,
	// cualquiera que leyera el repo podia firmar un JWT de admin valido.
	errJWTSecretRequired = errors.New("JWT_SECRET es obligatorio: defina un secreto largo y aleatorio en el entorno (backend/.env o variable de entorno)")
	errAdminNotSeeded    = errors.New("no se pudo garantizar la cuenta admin configurada")
)

const (
	defaultIssuer        = "pika-backend"
	defaultAdminEmail    = "admin@alfa.com"
	defaultAdminPassword = "1234"
	defaultAdminName     = "Administrador PIKA"
	defaultAdminRole     = "admin"
	defaultTokenTTL      = 12 * time.Hour

	// defaultSignupRole es el rol NO privilegiado que recibe un signup cuando ya
	// existe algun usuario (ver createUserFromSignup). Debe coincidir con un nombre
	// de acl_roles de la empresa; si no coincide, el middleware ACL no resuelve
	// permisos y el usuario queda sin acceso (falla cerrado, nunca hacia arriba).
	defaultSignupRole = "ventas"

	// dummyPasswordHash se compara contra la clave recibida cuando el email no
	// existe, para que el tiempo de respuesta no revele si una cuenta esta
	// registrada (enumeracion de usuarios). Es un hash bcrypt valido de una cadena
	// que ninguna persona conoce.
	dummyPasswordHash = "$2a$10$iB.w1/AuM8KAoOuhnj..V.k59vr9W5NQ2k9Lacl8h1ZdOioQ.PNZa"
)

type Config struct {
	DB            *sql.DB
	JWTSecret     string
	Issuer        string
	TokenTTL      time.Duration
	AdminEmail    string
	AdminPassword string
	AdminName     string
	AdminRole     string
	// AdminCompanyID es la empresa de la cuenta admin sembrada (default
	// company.DefaultCompanyID). La cuenta admin debe vivir en una empresa real
	// porque el ACL resuelve roles por company_id.
	AdminCompanyID string
	// SignupRole es el rol no privilegiado que reciben los registros nuevos cuando
	// la tabla users ya tiene usuarios. Vacio => defaultSignupRole.
	SignupRole string
}

type Service struct {
	db             *sql.DB
	jwtSecret      []byte
	issuer         string
	tokenTTL       time.Duration
	adminEmail     string
	adminPassword  string
	adminName      string
	adminRole      string
	adminCompanyID string
	signupRole     string

	// roleReadiness siembra/asegura los roles ACL de una empresa antes de validar
	// que un rol exista (el ACL siembra sus roles por defecto de forma perezosa).
	// Se inyecta desde main.go para que auth no dependa del paquete acl.
	roleReadiness func(ctx context.Context, companyID string) error
}

type tokenClaims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	// CompanyID es la empresa del usuario autenticado. El middleware la publica en
	// company.ContextKey para que la empresa deje de elegirla el navegador.
	CompanyID string `json:"companyId,omitempty"`
	jwt.RegisteredClaims
}

// NewService valida la configuracion y garantiza la cuenta admin (ver
// EnsureAdminUser). Devuelve error si falta JWT_SECRET o si no se pudo asegurar el
// admin: en ambos casos arrancar seria dejar al sistema sin autenticación real o
// al dueño fuera.
func NewService(cfg Config) (*Service, error) {
	issuer := strings.TrimSpace(cfg.Issuer)
	if issuer == "" {
		issuer = defaultIssuer
	}

	jwtSecret := strings.TrimSpace(cfg.JWTSecret)
	if jwtSecret == "" {
		return nil, errJWTSecretRequired
	}

	tokenTTL := cfg.TokenTTL
	if tokenTTL <= 0 {
		tokenTTL = defaultTokenTTL
	}

	adminEmail := strings.ToLower(strings.TrimSpace(cfg.AdminEmail))
	if adminEmail == "" {
		adminEmail = defaultAdminEmail
	}

	adminPassword := cfg.AdminPassword
	if adminPassword == "" {
		adminPassword = defaultAdminPassword
	}

	adminName := strings.TrimSpace(cfg.AdminName)
	if adminName == "" {
		adminName = defaultAdminName
	}

	adminRole := strings.TrimSpace(cfg.AdminRole)
	if adminRole == "" {
		adminRole = defaultAdminRole
	}

	adminCompanyID := strings.TrimSpace(cfg.AdminCompanyID)
	if adminCompanyID == "" {
		adminCompanyID = company.DefaultCompanyID
	}

	signupRole := strings.TrimSpace(cfg.SignupRole)
	if signupRole == "" {
		signupRole = defaultSignupRole
	}

	s := &Service{
		db:             cfg.DB,
		jwtSecret:      []byte(jwtSecret),
		issuer:         issuer,
		tokenTTL:       tokenTTL,
		adminEmail:     adminEmail,
		adminPassword:  adminPassword,
		adminName:      adminName,
		adminRole:      adminRole,
		adminCompanyID: adminCompanyID,
		signupRole:     signupRole,
	}

	if s.db != nil {
		if err := s.EnsureAdminUser(context.Background()); err != nil {
			return nil, err
		}
		if err := s.EnsureTechnicianUser(context.Background()); err != nil {
			return nil, err
		}
	}

	return s, nil
}

// SetRoleReadiness registra el callback que asegura los roles ACL de una empresa.
func (s *Service) SetRoleReadiness(fn func(ctx context.Context, companyID string) error) {
	s.roleReadiness = fn
}

// EnsureAdminUser crea la cuenta admin del entorno solo si ese email no existe
// todavia. Es idempotente: si el usuario ya existe NO se toca nada (en particular
// no se sobreescribe el password_hash), para que un cambio de clave hecho por el
// dueño no se revierta en cada arranque y para que reiniciar el servicio nunca
// deje al propietario fuera.
func (s *Service) EnsureAdminUser(ctx context.Context) error {
	if err := s.ensureDB(); err != nil {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(s.adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.Join(errAdminNotSeeded, err)
	}

	res, err := s.db.ExecContext(ctx, `
INSERT INTO users (id, company_id, email, password_hash, name, role, is_active, created_at, updated_at)
SELECT $1, $2, $3, $4, $5, $6, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = LOWER($3));
`, uuid.NewString(), s.adminCompanyID, s.adminEmail, string(hashedPassword), s.adminName, s.adminRole)
	if err != nil {
		return errors.Join(errAdminNotSeeded, err)
	}

	affected, _ := res.RowsAffected()
	if affected == 0 {
		// Ya existia: comprobar que sigue util (activo). Si alguien lo desactivo,
		// reactivarlo garantiza que el dueño no pierda el acceso.
		if _, err := s.db.ExecContext(ctx, `
UPDATE users SET is_active = true, updated_at = NOW()
WHERE LOWER(email) = LOWER($1) AND is_active = false;
`, s.adminEmail); err != nil {
			return errors.Join(errAdminNotSeeded, err)
		}
	}

	return nil
}

// userRow es la fila de users que necesita el login.
type userRow struct {
	ID           string
	CompanyID    string
	Email        string
	PasswordHash string
	Name         string
	Role         string
	IsActive     bool
}

// Authenticate valida las credenciales contra la tabla users y emite un token con
// el rol DEL usuario y su empresa. Credencial invalida, usuario inexistente y
// usuario inactivo devuelven exactamente el mismo error: no se revela si el correo
// esta registrado.
func (s *Service) Authenticate(ctx context.Context, req LoginRequest) (LoginResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || strings.TrimSpace(req.Password) == "" {
		return LoginResponse{}, errInvalidPayload
	}

	row, err := s.findUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			// Comparar contra un hash real para igualar el tiempo de respuesta.
			_ = bcrypt.CompareHashAndPassword([]byte(dummyPasswordHash), []byte(req.Password))
			return LoginResponse{}, errInvalidCredentials
		}
		return LoginResponse{}, err
	}

	if !row.IsActive {
		return LoginResponse{}, errInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(row.PasswordHash), []byte(req.Password)); err != nil {
		return LoginResponse{}, errInvalidCredentials
	}

	return s.issueToken(row)
}

func (s *Service) findUserByEmail(ctx context.Context, email string) (userRow, error) {
	if err := s.ensureDB(); err != nil {
		return userRow{}, err
	}

	var row userRow
	err := s.db.QueryRowContext(ctx, `
SELECT id, company_id, email, password_hash, name, role, is_active
FROM users
WHERE LOWER(email) = $1;
`, email).Scan(&row.ID, &row.CompanyID, &row.Email, &row.PasswordHash, &row.Name, &row.Role, &row.IsActive)
	return row, err
}

func (s *Service) issueToken(row userRow) (LoginResponse, error) {
	now := time.Now().UTC()
	expiresAt := now.Add(s.tokenTTL)

	claims := tokenClaims{
		Email:     row.Email,
		Role:      row.Role,
		CompanyID: row.CompanyID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   row.Email,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return LoginResponse{}, err
	}

	return LoginResponse{
		AccessToken: signedToken,
		TokenType:   "Bearer",
		ExpiresIn:   int64(s.tokenTTL.Seconds()),
		User: User{
			ID:        row.ID,
			Email:     row.Email,
			Name:      row.Name,
			Role:      row.Role,
			CompanyID: row.CompanyID,
		},
	}, nil
}

func (s *Service) JWTMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			tokenString, err := parseBearerToken(c.Request().Header.Get(echo.HeaderAuthorization))
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing or invalid bearer token"})
			}

			claims := &tokenClaims{}
			token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
				if token.Method == nil || token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
					return nil, errors.New("unexpected signing method")
				}
				return s.jwtSecret, nil
			}, jwt.WithIssuer(s.issuer))
			if err != nil || !token.Valid {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid or expired token"})
			}

			c.Set("auth.email", claims.Email)
			c.Set("auth.role", claims.Role)
			// La empresa del token manda sobre la cabecera X-Company-Id: cierra el
			// agujero de aislamiento multi-tenant. Tokens antiguos sin el claim lo
			// dejan vacio y company.IDFromRequest cae a la cabecera como antes.
			c.Set(company.ContextKey, claims.CompanyID)

			return next(c)
		}
	}
}

func parseBearerToken(header string) (string, error) {
	value := strings.TrimSpace(header)
	if value == "" {
		return "", errors.New("authorization header is empty")
	}

	parts := strings.SplitN(value, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("authorization header must be a bearer token")
	}

	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", errors.New("bearer token is empty")
	}

	return token, nil
}
