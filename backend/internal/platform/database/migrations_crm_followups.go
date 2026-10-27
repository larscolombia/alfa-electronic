package database

func migrationStatementsCRMFollowups() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_prospect_followups (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			prospect_id TEXT NOT NULL,
			tipo VARCHAR(140) NOT NULL,
			fecha VARCHAR(10) NOT NULL,
			hora VARCHAR(5) NOT NULL,
			recordatorio VARCHAR(60) NOT NULL DEFAULT '',
			observacion TEXT NOT NULL DEFAULT '',
			estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Completado')),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospect_followups_prospect ON crm_prospect_followups(company_id, prospect_id, fecha, hora);`,
		`ALTER TABLE crm_prospect_followups ADD COLUMN IF NOT EXISTS soft_delete BOOLEAN NOT NULL DEFAULT false;`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospect_followups_soft_delete ON crm_prospect_followups(company_id, soft_delete);`,
		`ALTER TABLE crm_prospect_followups ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(180) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_prospect_followups ADD COLUMN IF NOT EXISTS contacto_nombre VARCHAR(180) NOT NULL DEFAULT '';`,
	}
}
