package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"

	"pika.software.net.co/backend/internal/platform/database"
)

const testJWTSecret = "fase-2b-secret-de-prueba-suficientemente-largo"

// openTestDB sigue el patron del repo (internal/remissions/service_db_test.go):
// skip sin RUN_DB_TESTS, abrir BD y migrar.
func openTestDB(t *testing.T) *sql.DB {
	t.Helper()
	if os.Getenv("RUN_DB_TESTS") == "" {
		t.Skip("set RUN_DB_TESTS=1 to run database integration tests")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable"
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}
	if err := db.Ping(); err != nil {
		db.Close()
		t.Fatalf("ping test database: %v", err)
	}
	if err := database.Migrate(db); err != nil {
		db.Close()
		t.Fatalf("migrate test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

// testCompany devuelve un company_id unico y limpia todo lo que el test ensucie.
func testCompany(t *testing.T, db *sql.DB, name string) string {
	t.Helper()
	companyID := fmt.Sprintf("qa-auth-%s-%d", name, time.Now().UnixNano())
	t.Cleanup(func() {
		db.Exec(`DELETE FROM users WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM acl_roles WHERE company_id = $1`, companyID)
		db.Exec(`DELETE FROM auth_signup_submissions WHERE company_id = $1`, companyID)
	})
	return companyID
}

func uniqueEmail(prefix string) string {
	return fmt.Sprintf("%s-%d@alfa.test", prefix, time.Now().UnixNano())
}

func newTestConfig(companyID, adminEmail, adminPassword string) Config {
	return Config{
		JWTSecret:      testJWTSecret,
		AdminEmail:     adminEmail,
		AdminPassword:  adminPassword,
		AdminName:      "Admin de prueba",
		AdminRole:      "admin",
		AdminCompanyID: companyID,
		SignupRole:     "ventas",
	}
}

// newBareService construye el Service sin sembrar el admin, para los tests que
// necesitan controlar exactamente qué hay en la tabla users.
func newBareService(db *sql.DB, cfg Config) *Service {
	return &Service{
		db:             db,
		jwtSecret:      []byte(cfg.JWTSecret),
		issuer:         defaultIssuer,
		tokenTTL:       defaultTokenTTL,
		adminEmail:     strings.ToLower(cfg.AdminEmail),
		adminPassword:  cfg.AdminPassword,
		adminName:      cfg.AdminName,
		adminRole:      cfg.AdminRole,
		adminCompanyID: cfg.AdminCompanyID,
		signupRole:     cfg.SignupRole,
	}
}

// insertUser inserta una fila en users y registra su limpieza.
func insertUser(t *testing.T, db *sql.DB, companyID, email, password, name, role string, active bool) string {
	t.Helper()

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}
	hash := string(hashBytes)

	id := fmt.Sprintf("qa-user-%d", time.Now().UnixNano())
	_, err = db.Exec(`
INSERT INTO users (id, company_id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
`, id, companyID, email, hash, name, role, active)
	if err != nil {
		t.Fatalf("insert user: %v", err)
	}
	t.Cleanup(func() { db.Exec(`DELETE FROM users WHERE id = $1`, id) })
	return id
}

func insertACLRole(t *testing.T, db *sql.DB, companyID, name string) {
	t.Helper()
	roleID := fmt.Sprintf("qa-role-%s-%d", strings.ToLower(name), time.Now().UnixNano())
	_, err := db.Exec(`
INSERT INTO acl_roles (id, company_id, name, description, is_active, created_at, updated_at)
VALUES ($1, $2, $3, '', true, NOW(), NOW());
`, roleID, companyID, name)
	if err != nil {
		t.Fatalf("insert acl role: %v", err)
	}
	t.Cleanup(func() { db.Exec(`DELETE FROM acl_roles WHERE id = $1`, roleID) })
}

// --- Sin BD: JWT_SECRET obligatorio -----------------------------------------

func TestNewServiceRequiresJWTSecret(t *testing.T) {
	cfg := newTestConfig("demo-company", uniqueEmail("admin"), "Passw0rd!x")
	cfg.JWTSecret = "   "

	svc, err := NewService(cfg)
	if err == nil {
		t.Fatalf("esperaba error con JWT_SECRET vacio, obtuve service %+v", svc)
	}
	if svc != nil {
		t.Fatalf("esperaba service nil cuando falta JWT_SECRET")
	}
	if !strings.Contains(err.Error(), "JWT_SECRET") {
		t.Fatalf("el error debe mencionar JWT_SECRET, dice: %v", err)
	}
	t.Logf("error de arranque: %v", err)
}

// --- Con BD ------------------------------------------------------------------

func TestSeedAdminIsIdempotentAndDoesNotOverwritePassword(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "seed")
	adminEmail := uniqueEmail("admin")

	first := newTestConfig(companyID, adminEmail, "Passw0rd!first")
	first.DB = db
	svc1, err := NewService(first)
	if err != nil {
		t.Fatalf("NewService (primer arranque): %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER($1)`, adminEmail).Scan(&count); err != nil {
		t.Fatalf("count users: %v", err)
	}
	if count != 1 {
		t.Fatalf("esperaba 1 admin sembrado, hay %d", count)
	}

	var hashBefore string
	if err := db.QueryRow(`SELECT password_hash FROM users WHERE LOWER(email) = LOWER($1)`, adminEmail).Scan(&hashBefore); err != nil {
		t.Fatalf("read hash: %v", err)
	}

	// Segundo arranque con OTRA clave configurada: no debe duplicar ni sobreescribir.
	second := newTestConfig(companyID, adminEmail, "Passw0rd!second")
	second.DB = db
	if _, err := NewService(second); err != nil {
		t.Fatalf("NewService (segundo arranque): %v", err)
	}

	if err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER($1)`, adminEmail).Scan(&count); err != nil {
		t.Fatalf("count users tras segundo arranque: %v", err)
	}
	if count != 1 {
		t.Fatalf("el seed duplico la cuenta admin: %d filas", count)
	}

	var hashAfter string
	if err := db.QueryRow(`SELECT password_hash FROM users WHERE LOWER(email) = LOWER($1)`, adminEmail).Scan(&hashAfter); err != nil {
		t.Fatalf("read hash tras segundo arranque: %v", err)
	}
	if hashBefore != hashAfter {
		t.Fatalf("el segundo arranque sobreescribio el password_hash del admin")
	}

	// La clave valida sigue siendo la del primer arranque.
	if _, err := svc1.Authenticate(context.Background(), LoginRequest{Email: adminEmail, Password: "Passw0rd!first"}); err != nil {
		t.Fatalf("login con la clave original deberia funcionar: %v", err)
	}
	if _, err := svc1.Authenticate(context.Background(), LoginRequest{Email: adminEmail, Password: "Passw0rd!second"}); err == nil {
		t.Fatalf("la clave del segundo arranque no deberia funcionar (el seed no debe sobreescribir)")
	}
}

func TestSeedAdminReactivatesDisabledOwner(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "reactivate")
	adminEmail := uniqueEmail("admin")
	password := "Passw0rd!x"

	seedCfg := newTestConfig(companyID, adminEmail, password)
	seedCfg.DB = db

	if _, err := NewService(seedCfg); err != nil {
		t.Fatalf("NewService: %v", err)
	}
	if _, err := db.Exec(`UPDATE users SET is_active = false WHERE LOWER(email) = LOWER($1)`, adminEmail); err != nil {
		t.Fatalf("desactivar admin: %v", err)
	}
	if _, err := NewService(seedCfg); err != nil {
		t.Fatalf("NewService (rearranque): %v", err)
	}

	var active bool
	if err := db.QueryRow(`SELECT is_active FROM users WHERE LOWER(email) = LOWER($1)`, adminEmail).Scan(&active); err != nil {
		t.Fatalf("leer is_active: %v", err)
	}
	if !active {
		t.Fatalf("el admin configurado quedo inactivo: riesgo de lockout del dueño")
	}
}

func TestLoginEmitsUserRoleAndCompanyFromDatabase(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "login")
	email := uniqueEmail("tecnico")
	password := "Passw0rd!x"
	insertUser(t, db, companyID, email, password, "Técnico Uno", "Técnico", true)

	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), password))

	resp, err := svc.Authenticate(context.Background(), LoginRequest{Email: strings.ToUpper(email), Password: password})
	if err != nil {
		t.Fatalf("Authenticate: %v", err)
	}
	if resp.User.Role != "Técnico" {
		t.Fatalf("esperaba el rol del usuario (Técnico), obtuve %q", resp.User.Role)
	}
	if resp.User.Role == "admin" {
		t.Fatalf("el login volvio a emitir admin: el ACL no restringiria nada")
	}
	if resp.User.CompanyID != companyID {
		t.Fatalf("esperaba company %q en la respuesta, obtuve %q", companyID, resp.User.CompanyID)
	}

	claims := &tokenClaims{}
	token, err := jwt.ParseWithClaims(resp.AccessToken, claims, func(*jwt.Token) (any, error) {
		return []byte(testJWTSecret), nil
	}, jwt.WithIssuer(defaultIssuer))
	if err != nil || !token.Valid {
		t.Fatalf("token invalido: %v", err)
	}
	if claims.Role != "Técnico" {
		t.Fatalf("claim role = %q, esperaba Técnico", claims.Role)
	}
	if claims.CompanyID != companyID {
		t.Fatalf("claim companyId = %q, esperaba %q", claims.CompanyID, companyID)
	}
}

func TestLoginRejectsUnknownEmailWrongPasswordAndInactiveUser(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "login-fail")
	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), "Passw0rd!x"))

	activeEmail := uniqueEmail("activo")
	insertUser(t, db, companyID, activeEmail, "Passw0rd!x", "Usuario Activo", "ventas", true)
	inactiveEmail := uniqueEmail("inactivo")
	insertUser(t, db, companyID, inactiveEmail, "Passw0rd!x", "Usuario Inactivo", "ventas", false)

	cases := []struct {
		name string
		req  LoginRequest
	}{
		{"email inexistente", LoginRequest{Email: uniqueEmail("fantasma"), Password: "Passw0rd!x"}},
		{"clave incorrecta", LoginRequest{Email: activeEmail, Password: "Passw0rd!mala"}},
		{"usuario inactivo", LoginRequest{Email: inactiveEmail, Password: "Passw0rd!x"}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := svc.Authenticate(context.Background(), tc.req); err != errInvalidCredentials {
				t.Fatalf("esperaba errInvalidCredentials, obtuve %v", err)
			}
		})
	}

	// Los tres casos deben responder igual: ni el error ni el cuerpo revelan si el
	// correo existe o si la cuenta esta desactivada.
	for _, tc := range cases {
		t.Run("handler 401 "+tc.name, func(t *testing.T) {
			code, body := callLogin(t, svc, tc.req)
			if code != http.StatusUnauthorized {
				t.Fatalf("esperaba 401, obtuve %d (%s)", code, body)
			}
			if !strings.Contains(body, "invalid email or password") {
				t.Fatalf("respuesta inesperada: %s", body)
			}
		})
	}
}

func TestLoginValidCredentialsReturns200ThroughHandler(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "login-ok")
	email := uniqueEmail("ventas")
	insertUser(t, db, companyID, email, "Passw0rd!x", "Usuario Ventas", "ventas", true)
	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), "Passw0rd!x"))

	code, body := callLogin(t, svc, LoginRequest{Email: email, Password: "Passw0rd!x"})
	if code != http.StatusOK {
		t.Fatalf("esperaba 200, obtuve %d (%s)", code, body)
	}

	var parsed LoginResponse
	if err := json.Unmarshal([]byte(body), &parsed); err != nil {
		t.Fatalf("decode response: %v (%s)", err, body)
	}
	if parsed.User.Role != "ventas" {
		t.Fatalf("esperaba rol ventas en la respuesta, obtuve %q", parsed.User.Role)
	}
	if parsed.AccessToken == "" {
		t.Fatalf("respuesta sin accessToken: %s", body)
	}
}

func TestSignupBootstrapAdminThenNonPrivilegedRole(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "signup")

	// El bootstrap se decide con la tabla users VACIA (regla global, no por
	// empresa): se guardan las filas existentes y se restauran al terminar.
	saved := snapshotUsers(t, db)
	if _, err := db.Exec(`DELETE FROM users`); err != nil {
		t.Fatalf("vaciar users: %v", err)
	}
	t.Cleanup(func() { restoreUsers(t, db, saved) })

	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), "Passw0rd!x"))

	firstEmail := uniqueEmail("primer")
	firstPassword := "Passw0rd!x"
	if _, err := svc.Signup(context.Background(), companyID, signupRequest(firstEmail, firstPassword)); err != nil {
		t.Fatalf("signup bootstrap: %v", err)
	}
	if role := userRole(t, db, firstEmail); role != "admin" {
		t.Fatalf("el primer usuario de una tabla vacia debe nacer admin (anti-lockout), nacio %q", role)
	}

	secondEmail := uniqueEmail("segundo")
	if _, err := svc.Signup(context.Background(), companyID, signupRequest(secondEmail, firstPassword)); err != nil {
		t.Fatalf("signup normal: %v", err)
	}
	if role := userRole(t, db, secondEmail); role != "ventas" {
		t.Fatalf("el segundo signup debe recibir el rol no privilegiado (ventas), recibio %q", role)
	}

	// El signup debe permitir login real con el rol emitido por la BD.
	resp, err := svc.Authenticate(context.Background(), LoginRequest{Email: secondEmail, Password: firstPassword})
	if err != nil {
		t.Fatalf("login del usuario registrado: %v", err)
	}
	if resp.User.Role != "ventas" {
		t.Fatalf("esperaba rol ventas en el login, obtuve %q", resp.User.Role)
	}
	t.Cleanup(func() {
		db.Exec(`DELETE FROM users WHERE LOWER(email) IN (LOWER($1), LOWER($2))`, firstEmail, secondEmail)
	})
}

func TestSignupDoesNotAcceptRoleFromClient(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "signup-role")
	// La tabla ya tendra usuarios (el admin sembrado u otros), asi que el signup
	// no puede ser bootstrap: aunque el cuerpo intente colar un rol, se ignora.
	insertUser(t, db, companyID, uniqueEmail("otro"), "Passw0rd!x", "Otro", "ventas", true)
	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), "Passw0rd!x"))

	email := uniqueEmail("escalada")
	req := signupRequest(email, "Passw0rd!x")
	if _, err := svc.Signup(context.Background(), companyID, req); err != nil {
		t.Fatalf("signup: %v", err)
	}
	if role := userRole(t, db, email); role != "ventas" {
		t.Fatalf("esperaba rol no privilegiado (ventas), obtuve %q", role)
	}
	t.Cleanup(func() { db.Exec(`DELETE FROM users WHERE LOWER(email) = LOWER($1)`, email) })
}

func TestCreateUserRequiresExistingACLRole(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "create-user")
	insertACLRole(t, db, companyID, "ventas")
	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), "Passw0rd!x"))

	ctx := context.Background()
	email := uniqueEmail("nuevo")

	if _, err := svc.CreateUser(ctx, companyID, CreateUserRequest{
		Email: email, Password: "Passw0rd!x", Name: "Usuario Nuevo", Role: "rol-que-no-existe",
	}); err != errUserRoleUnknown {
		t.Fatalf("esperaba errUserRoleUnknown, obtuve %v", err)
	}

	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER($1)`, email).Scan(&count); err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 0 {
		t.Fatalf("se creo el usuario pese a tener un rol inexistente")
	}

	created, err := svc.CreateUser(ctx, companyID, CreateUserRequest{
		Email: email, Password: "Passw0rd!x", Name: "Usuario Nuevo", Role: "VENTAS",
	})
	if err != nil {
		t.Fatalf("CreateUser con rol valido: %v", err)
	}
	if created.Role != "VENTAS" {
		t.Fatalf("esperaba rol VENTAS, obtuve %q", created.Role)
	}
	t.Cleanup(func() { db.Exec(`DELETE FROM users WHERE LOWER(email) = LOWER($1)`, email) })

	// Duplicado => conflicto.
	if _, err := svc.CreateUser(ctx, companyID, CreateUserRequest{
		Email: strings.ToUpper(email), Password: "Passw0rd!x", Name: "Duplicado", Role: "ventas",
	}); err != errUserEmailExists {
		t.Fatalf("esperaba errUserEmailExists, obtuve %v", err)
	}

	// El usuario creado puede iniciar sesion con el rol elegido por el admin.
	resp, err := svc.Authenticate(ctx, LoginRequest{Email: email, Password: "Passw0rd!x"})
	if err != nil {
		t.Fatalf("login del usuario creado: %v", err)
	}
	if resp.User.Role != "VENTAS" {
		t.Fatalf("esperaba rol VENTAS en el token, obtuve %q", resp.User.Role)
	}

	users, err := svc.ListUsers(ctx, companyID)
	if err != nil {
		t.Fatalf("ListUsers: %v", err)
	}
	if len(users) != 1 || users[0].Email != email {
		t.Fatalf("ListUsers inesperado: %+v", users)
	}
}

func TestCreateUserRejectsWeakPassword(t *testing.T) {
	db := openTestDB(t)
	companyID := testCompany(t, db, "weak-pass")
	insertACLRole(t, db, companyID, "ventas")
	svc := newBareService(db, newTestConfig(companyID, uniqueEmail("admin"), "Passw0rd!x"))

	if _, err := svc.CreateUser(context.Background(), companyID, CreateUserRequest{
		Email: uniqueEmail("debil"), Password: "1234", Name: "Usuario Debil", Role: "ventas",
	}); err != errPasswordWeak {
		t.Fatalf("esperaba errPasswordWeak, obtuve %v", err)
	}
}

// --- helpers -----------------------------------------------------------------

func callLogin(t *testing.T, svc *Service, req LoginRequest) (int, string) {
	t.Helper()

	e := echo.New()
	handler := NewHandler(svc, nil)
	handler.RegisterRoutes(e.Group("/api/v1/auth"))

	body, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	rec := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", strings.NewReader(string(body)))
	request.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	e.ServeHTTP(rec, request)
	return rec.Code, rec.Body.String()
}

func signupRequest(email, password string) SignupRequest {
	return SignupRequest{
		FirstName:       "Usuario",
		LastName:        "DePrueba",
		Email:           email,
		CountryCode:     "+57",
		Phone:           "3001234567",
		Password:        password,
		ConfirmPassword: password,
	}
}

func userRole(t *testing.T, db *sql.DB, email string) string {
	t.Helper()
	var role string
	if err := db.QueryRow(`SELECT role FROM users WHERE LOWER(email) = LOWER($1)`, email).Scan(&role); err != nil {
		t.Fatalf("leer rol de %s: %v", email, err)
	}
	return role
}

type userSnapshot struct {
	ID           string
	CompanyID    string
	Email        string
	PasswordHash string
	Name         string
	Role         string
	IsActive     bool
}

func snapshotUsers(t *testing.T, db *sql.DB) []userSnapshot {
	t.Helper()
	rows, err := db.Query(`SELECT id, company_id, email, password_hash, name, role, is_active FROM users`)
	if err != nil {
		t.Fatalf("snapshot users: %v", err)
	}
	defer rows.Close()

	saved := make([]userSnapshot, 0)
	for rows.Next() {
		var row userSnapshot
		if err := rows.Scan(&row.ID, &row.CompanyID, &row.Email, &row.PasswordHash, &row.Name, &row.Role, &row.IsActive); err != nil {
			t.Fatalf("scan snapshot: %v", err)
		}
		saved = append(saved, row)
	}
	return saved
}

func restoreUsers(t *testing.T, db *sql.DB, saved []userSnapshot) {
	t.Helper()
	for _, row := range saved {
		if _, err := db.Exec(`
INSERT INTO users (id, company_id, email, password_hash, name, role, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
`, row.ID, row.CompanyID, row.Email, row.PasswordHash, row.Name, row.Role, row.IsActive); err != nil {
			t.Errorf("restaurar usuario %s: %v", row.Email, err)
		}
	}
}
