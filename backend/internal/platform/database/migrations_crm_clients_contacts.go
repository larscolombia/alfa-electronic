package database

func migrationStatementsCRMClients() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_clients (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			nombre VARCHAR(180) NOT NULL,
			correo VARCHAR(180) NOT NULL DEFAULT '',
			empresa VARCHAR(180) NOT NULL DEFAULT '',
			nit VARCHAR(80) NOT NULL DEFAULT '',
			zona VARCHAR(120) NOT NULL DEFAULT '',
			estado VARCHAR(20) NOT NULL CHECK (estado IN ('Activo', 'Inactivo')),
			credit_enabled BOOLEAN NOT NULL DEFAULT false,
			credit_limit NUMERIC(14, 2) NOT NULL DEFAULT 0,
			credit_consumed NUMERIC(14, 2) NOT NULL DEFAULT 0,
			last_payment_date DATE NULL,
			payment_term_days INTEGER NOT NULL DEFAULT 30,
			soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_clients_company_created ON crm_clients(company_id, created_at DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_clients_company_status ON crm_clients(company_id, estado);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_clients_company_soft_delete ON crm_clients(company_id, soft_delete);`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS nit VARCHAR(80) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS prospect_id TEXT NULL;`,
		`CREATE INDEX IF NOT EXISTS idx_crm_clients_prospect_id ON crm_clients(company_id, prospect_id);`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS website VARCHAR(255) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS office_phone VARCHAR(40) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS country VARCHAR(120) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS city VARCHAR(120) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS address VARCHAR(500) NOT NULL DEFAULT '';`,
	}
}
