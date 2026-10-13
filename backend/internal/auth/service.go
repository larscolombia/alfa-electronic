package auth

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

var (
	errInvalidCredentials = errors.New("invalid email or password")
	errInvalidPayload     = errors.New("email and password are required")
)

const (
	defaultIssuer        = "pika-backend"
	defaultAdminEmail    = "admin@alfa.com"
	defaultAdminPassword = "1234"
	defaultAdminName     = "Administrador PIKA"
	defaultAdminRole     = "admin"
	defaultTokenTTL      = 12 * time.Hour
	defaultJWTSecret     = "pika-local-dev-jwt-secret"
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
}

type Service struct {
	db            *sql.DB
	jwtSecret     []byte
	issuer        string
	tokenTTL      time.Duration
	adminEmail    string
	adminPassword string
	adminName     string
	adminRole     string
}

type tokenClaims struct {
	Email string `json:"email"`
	Role  string `json:"role"`
	jwt.RegisteredClaims
}

func NewService(cfg Config) *Service {
	issuer := strings.TrimSpace(cfg.Issuer)
	if issuer == "" {
		issuer = defaultIssuer
	}

	jwtSecret := strings.TrimSpace(cfg.JWTSecret)
	if jwtSecret == "" {
		jwtSecret = defaultJWTSecret
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

	return &Service{
		db:            cfg.DB,
		jwtSecret:     []byte(jwtSecret),
		issuer:        issuer,
		tokenTTL:      tokenTTL,
		adminEmail:    adminEmail,
		adminPassword: adminPassword,
		adminName:     adminName,
		adminRole:     adminRole,
	}
}

func (s *Service) Authenticate(req LoginRequest) (LoginResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || strings.TrimSpace(req.Password) == "" {
		return LoginResponse{}, errInvalidPayload
	}

	if email != s.adminEmail || req.Password != s.adminPassword {
		return LoginResponse{}, errInvalidCredentials
	}

	now := time.Now().UTC()
	expiresAt := now.Add(s.tokenTTL)

	claims := tokenClaims{
		Email: s.adminEmail,
		Role:  s.adminRole,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   s.adminEmail,
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
			Email: s.adminEmail,
			Name:  s.adminName,
			Role:  s.adminRole,
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
