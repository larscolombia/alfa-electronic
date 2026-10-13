package database

func migrationStatementsRemissions() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS remissions (
			id TEXT NOT NULL,
			company_id TEXT NOT NULL,
			consecutive VARCHAR(40) NOT NULL DEFAULT '',
			client_name VARCHAR(180) NOT NULL DEFAULT '',
			client_nit VARCHAR(80) NOT NULL DEFAULT '',
			dispatch_type VARCHAR(40) NOT NULL DEFAULT '',
			carrier_name VARCHAR(160) NOT NULL DEFAULT '',
			guide_number VARCHAR(160) NOT NULL DEFAULT '',
			purchase_order VARCHAR(160) NOT NULL DEFAULT '',
			youtube_link TEXT NOT NULL DEFAULT '',
			dispatch_photos JSONB NOT NULL DEFAULT '[]'::jsonb,
			items JSONB NOT NULL DEFAULT '[]'::jsonb,
			valued BOOLEAN NOT NULL DEFAULT false,
			total_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
			warranty_months INT NOT NULL DEFAULT 0,
			notes TEXT NOT NULL DEFAULT '',
			status VARCHAR(20) NOT NULL DEFAULT 'borrador',
			delivery_status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
			created_by VARCHAR(160) NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(company_id, id),
			UNIQUE(company_id, consecutive)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_remissions_company_created ON remissions(company_id, created_at DESC);`,
		`CREATE TABLE IF NOT EXISTS remission_sequences (
			company_id TEXT PRIMARY KEY,
			next_value INT NOT NULL DEFAULT 1
		);`,
	}
}
