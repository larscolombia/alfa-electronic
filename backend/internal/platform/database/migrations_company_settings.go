package database

// migrationStatementsCompanySettings: identidad de la empresa (una fila por
// company_id). Alimenta la página pública de cotización, el documento impreso
// de factura y el <title>/favicon del SPA; antes todo eso llevaba texto
// hardcodeado del template ("LARS Software Company"). El seed perezoso lo hace
// service.Get(); la tabla solo necesita existir.
func migrationStatementsCompanySettings() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS company_settings (
			company_id TEXT PRIMARY KEY,
			name VARCHAR(150) NOT NULL DEFAULT '',
			nit VARCHAR(20) NOT NULL DEFAULT '',
			tagline VARCHAR(300) NOT NULL DEFAULT '',
			logo_data_url TEXT NOT NULL DEFAULT '',
			address VARCHAR(200) NOT NULL DEFAULT '',
			phone VARCHAR(100) NOT NULL DEFAULT '',
			email VARCHAR(200) NOT NULL DEFAULT '',
			website VARCHAR(300) NOT NULL DEFAULT '',
			youtube VARCHAR(300) NOT NULL DEFAULT '',
			instagram VARCHAR(300) NOT NULL DEFAULT '',
			facebook VARCHAR(300) NOT NULL DEFAULT '',
			twitter VARCHAR(300) NOT NULL DEFAULT '',
			page_title VARCHAR(80) NOT NULL DEFAULT 'ALFA Electronic',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
	}
}
