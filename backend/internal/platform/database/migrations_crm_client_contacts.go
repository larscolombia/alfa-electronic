package database

func migrationStatementsCRMClientContacts() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_client_contacts (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			client_id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL,
			role VARCHAR(120) NOT NULL DEFAULT '',
			email VARCHAR(180) NOT NULL DEFAULT '',
			phone VARCHAR(40) NOT NULL DEFAULT '',
			notes TEXT NOT NULL DEFAULT '',
			soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_client_contacts_client ON crm_client_contacts(company_id, client_id);`,
	}
}
