package database

// migrationStatementsCRMAccounts creates the single commercial identity used by
// both lifecycle states. Old CRM tables are only sources for this one-time import;
// new code must use crm_accounts and its account_id relations.
func migrationStatementsCRMAccounts() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_accounts (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			lifecycle_status VARCHAR(20) NOT NULL CHECK (lifecycle_status IN ('prospecto', 'cliente', 'inactivo')),
			name VARCHAR(180) NOT NULL,
			email VARCHAR(180) NOT NULL DEFAULT '',
			mobile VARCHAR(40) NOT NULL DEFAULT '',
			company VARCHAR(180) NOT NULL DEFAULT '',
			nit VARCHAR(80) NOT NULL DEFAULT '',
			zone VARCHAR(120) NOT NULL DEFAULT '',
			website VARCHAR(255) NOT NULL DEFAULT '',
			office_phone VARCHAR(40) NOT NULL DEFAULT '',
			country VARCHAR(120) NOT NULL DEFAULT '', city VARCHAR(120) NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
			assigned_employee VARCHAR(140) NOT NULL DEFAULT '', source VARCHAR(120) NOT NULL DEFAULT '',
			ciiu_code VARCHAR(10) NOT NULL DEFAULT '', service VARCHAR(120) NOT NULL DEFAULT '',
			prospect_status VARCHAR(20) NOT NULL DEFAULT 'Pendiente', prospect_value BIGINT NOT NULL DEFAULT 0,
			allow_follow_up BOOLEAN NOT NULL DEFAULT true, note TEXT NOT NULL DEFAULT '', quotations INTEGER NOT NULL DEFAULT 0,
			credit_enabled BOOLEAN NOT NULL DEFAULT false, credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0,
			credit_consumed NUMERIC(14,2) NOT NULL DEFAULT 0, last_payment_date DATE NULL,
			payment_term_days INTEGER NOT NULL DEFAULT 30, dv VARCHAR(4) NOT NULL DEFAULT '',
			postal_code VARCHAR(20) NOT NULL DEFAULT '', billing_email VARCHAR(180) NOT NULL DEFAULT '',
			grand_contributor BOOLEAN NOT NULL DEFAULT false, id_type VARCHAR(20) NOT NULL DEFAULT 'NIT',
			converted_at TIMESTAMPTZ NULL, converted_by TEXT NOT NULL DEFAULT '', soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_accounts_company_lifecycle ON crm_accounts(company_id, lifecycle_status) WHERE soft_delete = false;`,
		// Existing installations can contain duplicate NITs. Keep the lookup indexed;
		// creation is guarded by the service until records are explicitly merged.
		`CREATE INDEX IF NOT EXISTS idx_crm_accounts_company_nit ON crm_accounts(company_id, LOWER(TRIM(nit))) WHERE TRIM(nit) <> '' AND soft_delete = false;`,
		`CREATE TABLE IF NOT EXISTS crm_account_legacy_ids (
			company_id TEXT NOT NULL, legacy_type VARCHAR(20) NOT NULL CHECK (legacy_type IN ('prospect', 'client')),
			legacy_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES crm_accounts(id),
			PRIMARY KEY(company_id, legacy_type, legacy_id), UNIQUE(company_id, legacy_type, legacy_id)
		);`,
		`CREATE TABLE IF NOT EXISTS crm_account_contacts (
			id TEXT PRIMARY KEY, company_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES crm_accounts(id),
			name VARCHAR(180) NOT NULL, role VARCHAR(120) NOT NULL DEFAULT '', email VARCHAR(180) NOT NULL DEFAULT '',
			phone VARCHAR(40) NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS crm_account_branches (
			id TEXT PRIMARY KEY, company_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES crm_accounts(id),
			name VARCHAR(180) NOT NULL, contact_name VARCHAR(180) NOT NULL DEFAULT '', contact_role VARCHAR(120) NOT NULL DEFAULT '',
			email VARCHAR(180) NOT NULL DEFAULT '', phone VARCHAR(40) NOT NULL DEFAULT '', country VARCHAR(120) NOT NULL DEFAULT '',
			city VARCHAR(120) NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', is_primary BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS crm_account_followups (
			id TEXT PRIMARY KEY, company_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES crm_accounts(id),
			tipo VARCHAR(140) NOT NULL, fecha VARCHAR(10) NOT NULL, hora VARCHAR(5) NOT NULL,
			recordatorio VARCHAR(60) NOT NULL DEFAULT '', observacion TEXT NOT NULL DEFAULT '',
			estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente', registrado_por VARCHAR(180) NOT NULL DEFAULT '',
			contacto_nombre VARCHAR(180) NOT NULL DEFAULT '', soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS crm_account_attachments (
			id TEXT PRIMARY KEY, company_id TEXT NOT NULL, account_id TEXT NOT NULL REFERENCES crm_accounts(id),
			filename VARCHAR(255) NOT NULL, mime_type VARCHAR(120) NOT NULL DEFAULT '', file_size_bytes BIGINT NOT NULL DEFAULT 0,
			storage_url TEXT NOT NULL DEFAULT '', uploaded_by VARCHAR(180) NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
	}
}
