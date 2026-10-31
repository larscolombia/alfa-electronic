package database

// Contador mensual de códigos internos de equipo (serie CO + YY + MM + NNNN).
// Una fila por empresa+periodo; el incremento es atómico en la query que lo
// consume (service_codes.go), así no hay bloqueos explícitos ni huecos por
// carreras. El periodo se reinicia solo: cada mes es una clave nueva.
func migrationStatementsEquipmentCodeSequences() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS equipment_code_sequences (
			company_id TEXT NOT NULL,
			period CHAR(6) NOT NULL,
			last_value INTEGER NOT NULL DEFAULT 0 CHECK (last_value >= 0),
			PRIMARY KEY(company_id, period)
		);`,
	}
}