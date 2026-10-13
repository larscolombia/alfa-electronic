package database

func migrationStatementsCRMBranches() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_client_branches (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			client_id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL,
			contact_name VARCHAR(180) NOT NULL DEFAULT '',
			contact_role VARCHAR(120) NOT NULL DEFAULT '',
			email VARCHAR(180) NOT NULL DEFAULT '',
			phone VARCHAR(40) NOT NULL DEFAULT '',
			country VARCHAR(120) NOT NULL DEFAULT '',
			city VARCHAR(120) NOT NULL DEFAULT '',
			address TEXT NOT NULL DEFAULT '',
			is_primary BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_client_branches_client ON crm_client_branches(company_id, client_id);`,
		`CREATE TABLE IF NOT EXISTS crm_prospect_branches (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			prospect_id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL,
			contact_name VARCHAR(180) NOT NULL DEFAULT '',
			contact_role VARCHAR(120) NOT NULL DEFAULT '',
			email VARCHAR(180) NOT NULL DEFAULT '',
			phone VARCHAR(40) NOT NULL DEFAULT '',
			country VARCHAR(120) NOT NULL DEFAULT '',
			city VARCHAR(120) NOT NULL DEFAULT '',
			address TEXT NOT NULL DEFAULT '',
			is_primary BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospect_branches_prospect ON crm_prospect_branches(company_id, prospect_id);`,
	}
}
