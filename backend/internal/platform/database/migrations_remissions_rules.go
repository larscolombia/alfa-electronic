package database

// migrationStatementsRemissionRules: el requerimiento de despacho exige un
// contacto del cliente obligatorio por remisión. La columna existe desde aquí;
// las filas anteriores quedan con ” y la validación server-side (que sí era
// lo que faltaba) obliga a completarlo en la próxima edición.
func migrationStatementsRemissionRules() []string {
	return []string{
		`ALTER TABLE remissions ADD COLUMN IF NOT EXISTS contact_name VARCHAR(180) NOT NULL DEFAULT '';`,
	}
}
