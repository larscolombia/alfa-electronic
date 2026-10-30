package database

func migrationStatementsCRMCatalogsAndProspects() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_catalog_items (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			catalog_type VARCHAR(40) NOT NULL,
			name VARCHAR(160) NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(company_id, catalog_type, name)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_catalog_items_company_type ON crm_catalog_items(company_id, catalog_type);`,
		`CREATE TABLE IF NOT EXISTS crm_prospects (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL,
			email VARCHAR(180) NOT NULL DEFAULT '',
			mobile VARCHAR(40) NOT NULL DEFAULT '',
			company VARCHAR(180) NOT NULL DEFAULT '',
			nit VARCHAR(80) NOT NULL DEFAULT '',
			assigned_employee VARCHAR(140) NOT NULL DEFAULT '',
			source VARCHAR(120) NOT NULL DEFAULT '',
			ciiu_code VARCHAR(10) NOT NULL DEFAULT '',
			zone VARCHAR(120) NOT NULL DEFAULT '',
			prospect_value BIGINT NOT NULL DEFAULT 0,
			allow_follow_up BOOLEAN NOT NULL DEFAULT true,
			status VARCHAR(20) NOT NULL CHECK (status IN ('Pendiente', 'En proceso', 'Cerrado')),
			service VARCHAR(120) NOT NULL DEFAULT '',
			note TEXT NOT NULL DEFAULT '',
			website VARCHAR(255) NOT NULL DEFAULT '',
			office_phone VARCHAR(40) NOT NULL DEFAULT '',
			country VARCHAR(120) NOT NULL DEFAULT '',
			city VARCHAR(120) NOT NULL DEFAULT '',
			address TEXT NOT NULL DEFAULT '',
			quotations INTEGER NOT NULL DEFAULT 0,
			soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospects_company_created ON crm_prospects(company_id, created_at DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospects_company_status ON crm_prospects(company_id, status);`,
		`ALTER TABLE crm_prospects ADD COLUMN IF NOT EXISTS nit VARCHAR(80) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_prospects ADD COLUMN IF NOT EXISTS ciiu_code VARCHAR(10) NOT NULL DEFAULT '';`,
	}
}
