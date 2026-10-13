package database

func migrationStatementsCRMAttachments() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS crm_prospect_attachments (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			prospect_id TEXT NOT NULL,
			filename VARCHAR(255) NOT NULL,
			mime_type VARCHAR(120) NOT NULL DEFAULT '',
			file_size_bytes BIGINT NOT NULL DEFAULT 0,
			storage_url TEXT NOT NULL DEFAULT '',
			uploaded_by VARCHAR(180) NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_crm_prospect_attachments_prospect ON crm_prospect_attachments(company_id, prospect_id);`,
	}
}
