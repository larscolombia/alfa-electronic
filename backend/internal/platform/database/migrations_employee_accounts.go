package database

// migrationStatementsEmployeeAccounts (identidad unificada): vincula cada
// empleado de RRHH con su cuenta de login.
//
// Pedido explícito del dueño: "email y contraseña obligatorios, bajo ninguna
// circunstancia empleados sin usuarios; la estructura estándar es
// user -> role -> profile -> permissions". Hasta ahora users (cuenta) y
// hr_employees (ficha) no compartían NINGUNA columna: crear un empleado no
// creaba login, y ResetEmployeePassword buscaba el correo en
// auth_signup_submissions en vez de users.
//
// user_id queda nullable SÓLO para las filas legacy anteriores a esta
// migración; el código nuevo nunca crea un empleado sin usuario (el servicio
// lo exige y lo crea en la misma transacción). El backfill enlaza por
// email+empresa donde ya exista cuenta.
//
// El índice único de correo por empresa impide el edge case de dos empleados
// compartiendo casilla: el correo es la identidad de login y users ya lo exige
// único a nivel global (users_email_lower_key).
func migrationStatementsEmployeeAccounts() []string {
	return []string{
		`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS user_id TEXT;`,
		`CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_user_id_key
			ON hr_employees (user_id) WHERE user_id IS NOT NULL;`,
		`CREATE UNIQUE INDEX IF NOT EXISTS hr_employees_email_company_key
			ON hr_employees (company_id, LOWER(email)) WHERE COALESCE(email, '') <> '';`,
		`UPDATE hr_employees e
			SET user_id = u.id
			FROM users u
			WHERE e.user_id IS NULL
			  AND COALESCE(e.email, '') <> ''
			  AND u.company_id = e.company_id
			  AND LOWER(u.email) = LOWER(e.email);`,
	}
}
