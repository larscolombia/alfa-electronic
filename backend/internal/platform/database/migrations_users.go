package database

// migrationStatementsUsers crea la tabla de identidad real del sistema (Fase 2b).
//
// Antes de esta migracion no existia ninguna tabla de usuarios: el login validaba
// una unica pareja de credenciales tomada del entorno y emitia siempre el rol
// admin, asi que el ACL no restringia a nadie.
//
// La unicidad del correo es GLOBAL (LOWER(email)) y no por empresa a proposito:
// el login solo recibe email+password, sin cabecera de empresa fiable, asi que el
// correo debe identificar exactamente un usuario y la empresa sale de SU fila
// (company_id), nunca de lo que diga el navegador. password_hash guarda bcrypt,
// jamas la clave en claro.
func migrationStatementsUsers() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			email TEXT NOT NULL,
			password_hash TEXT NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT '',
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (LOWER(email));`,
		`CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);`,
		`CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(company_id, role);`,
	}
}
