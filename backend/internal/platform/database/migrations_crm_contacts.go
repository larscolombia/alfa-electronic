package database

func migrationStatementsCRMContacts() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_prospect_contacts (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			prospect_id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL,
			email VARCHAR(180) NOT NULL DEFAULT '',
			phone VARCHAR(40) NOT NULL DEFAULT '',
			role VARCHAR(120) NOT NULL DEFAULT '',
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospect_contacts_prospect ON crm_prospect_contacts(company_id, prospect_id);`,
	}
}
