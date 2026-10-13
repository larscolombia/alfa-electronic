package database

func migrationStatementsProjects() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS projects (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			status VARCHAR(40) NOT NULL DEFAULT 'diagnostico',
			properties_json JSONB NOT NULL DEFAULT '{}'::jsonb,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_projects_company_status ON projects(company_id, status);`,
		`CREATE INDEX IF NOT EXISTS idx_projects_company_updated ON projects(company_id, updated_at DESC);`,
	}
}
