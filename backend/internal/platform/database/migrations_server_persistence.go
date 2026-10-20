package database

// Tablas que reemplazan los stores en memoria del backend (projects y docs),
// que perdían todo su contenido al reiniciar el servicio.
func migrationStatementsServerPersistence() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS project_sla_configs (
			company_id TEXT NOT NULL,
			stage TEXT NOT NULL,
			green_days INTEGER NOT NULL DEFAULT 0,
			yellow_days INTEGER NOT NULL DEFAULT 0,
			position INTEGER NOT NULL DEFAULT 0,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, stage)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_project_sla_configs_company
			ON project_sla_configs(company_id, position);`,

		`CREATE TABLE IF NOT EXISTS project_notifications (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT '',
			title TEXT NOT NULL DEFAULT '',
			message TEXT NOT NULL DEFAULT '',
			read BOOLEAN NOT NULL DEFAULT FALSE,
			target_role TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_project_notifications_company_created
			ON project_notifications(company_id, created_at DESC);`,

		`CREATE TABLE IF NOT EXISTS project_technical_reports (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			project_id TEXT NOT NULL DEFAULT '',
			payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
			created_by TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_project_technical_reports_company_created
			ON project_technical_reports(company_id, created_at DESC);`,

		`CREATE TABLE IF NOT EXISTS documents (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			title TEXT NOT NULL DEFAULT '',
			doc_type TEXT NOT NULL DEFAULT '',
			equipment_model TEXT NOT NULL DEFAULT '',
			url TEXT NOT NULL DEFAULT '',
			file_name TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			deletable BOOLEAN NOT NULL DEFAULT FALSE,
			created_by TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_documents_company_created
			ON documents(company_id, created_at DESC);`,

		`CREATE TABLE IF NOT EXISTS software_backups (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			equipment_model TEXT NOT NULL DEFAULT '',
			file_name TEXT NOT NULL DEFAULT '',
			file_size BIGINT NOT NULL DEFAULT 0,
			url TEXT NOT NULL DEFAULT '',
			version TEXT NOT NULL DEFAULT '',
			uploaded_by TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_software_backups_company_model
			ON software_backups(company_id, equipment_model, created_at DESC);`,
	}
}
