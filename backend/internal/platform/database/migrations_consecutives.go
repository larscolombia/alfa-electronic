package database

// migrationStatementsConsecutives (Fase 6): consecutivos generados en el
// servidor, no en el navegador.
//
// document_sequences: contador atómico por (empresa, tipo de documento,
// periodo). El INSERT ... ON CONFLICT ... RETURNING dentro de la misma
// sentencia hace que dos usuarios concurrentes nunca reciban el mismo número
// (los helpers anteriores hacían MAX()+1 en dos pasos: lectura y escritura,
// con la carrera en medio).
//
// remission_sequences: la tabla original tenía company_id como única PK, así
// que el contador NUNCA se reiniciaba por mes y E-CO-AAMM-NNNN desbordaba el
// %04d pasado 9999. Se añade period (AAMM) a la clave primaria; las filas
// existentes se reetiquetan con el periodo actual para no perder el contador.
func migrationStatementsConsecutives() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS document_sequences (
			company_id TEXT NOT NULL,
			doc_type VARCHAR(20) NOT NULL,
			period VARCHAR(10) NOT NULL,
			next_value INT NOT NULL DEFAULT 1,
			PRIMARY KEY (company_id, doc_type, period)
		);`,
		`ALTER TABLE remission_sequences ADD COLUMN IF NOT EXISTS period VARCHAR(4) NOT NULL DEFAULT '';`,
		`UPDATE remission_sequences SET period = to_char(NOW(), 'YYMM') WHERE period = '';`,
		`ALTER TABLE remission_sequences DROP CONSTRAINT IF EXISTS remission_sequences_pkey;`,
		`ALTER TABLE remission_sequences ADD PRIMARY KEY (company_id, period);`,
	}
}
