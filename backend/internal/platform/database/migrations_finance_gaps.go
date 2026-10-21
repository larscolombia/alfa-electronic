package database

// FASE 5a — Finanzas: caja menor (gastos + arqueo), garantías, configuración
// por empresa y retenciones de pagos. Todo idempotente: Migrate() corre en cada
// arranque.
func migrationStatementsFinanceGaps() []string {
	return []string{
		// Gastos de caja menor. Además de las columnas del diseño (account_id,
		// category, description, amount, currency, paid_at, receipt_file_name,
		// created_by) se conservan los campos que la UI ya captura
		// (item, concepto, empleado, proyecto, proveedor, tasa de cambio) para
		// no perder información al migrar de memoria a servidor.
		`CREATE TABLE IF NOT EXISTS finance_expenses (
			id BIGSERIAL PRIMARY KEY,
			company_id TEXT NOT NULL,
			account_id BIGINT NULL,
			item_name VARCHAR(180) NOT NULL DEFAULT '',
			concept VARCHAR(180) NOT NULL DEFAULT '',
			category VARCHAR(80) NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			employee VARCHAR(140) NOT NULL DEFAULT '',
			project VARCHAR(180) NOT NULL DEFAULT '',
			vendor VARCHAR(180) NOT NULL DEFAULT '',
			amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
			currency VARCHAR(3) NOT NULL DEFAULT 'COP' CHECK (currency IN ('COP', 'USD', 'EUR')),
			exchange_rate NUMERIC(14, 6) NOT NULL DEFAULT 1,
			value_in_cop NUMERIC(14, 2) NOT NULL DEFAULT 0,
			paid_at DATE NULL,
			receipt_file_name VARCHAR(255) NOT NULL DEFAULT '',
			created_by TEXT NOT NULL DEFAULT '',
			soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_expenses_company_created ON finance_expenses(company_id, created_at DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_expenses_company_soft_delete ON finance_expenses(company_id, soft_delete);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_expenses_company_paid_at ON finance_expenses(company_id, paid_at DESC);`,

		// Arqueo de billetes y monedas: una fila por denominación. Las filas
		// comparten counted_at cuando pertenecen al mismo arqueo.
		`CREATE TABLE IF NOT EXISTS finance_cash_counts (
			id BIGSERIAL PRIMARY KEY,
			company_id TEXT NOT NULL,
			account_id BIGINT NULL,
			kind VARCHAR(10) NOT NULL DEFAULT 'billete' CHECK (kind IN ('billete', 'moneda')),
			denomination NUMERIC(14, 2) NOT NULL,
			quantity INTEGER NOT NULL DEFAULT 0,
			total NUMERIC(14, 2) NOT NULL DEFAULT 0,
			counted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			counted_by TEXT NOT NULL DEFAULT ''
		);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_cash_counts_company_counted ON finance_cash_counts(company_id, counted_at DESC);`,

		// Garantías. A las columnas del diseño (equipment_id,
		// equipment_identifier, client_name, months, start_at, end_at, status,
		// notes) se suman code/follow_up_at/owner/phase que la UI actual ya
		// maneja, para no degradar la pantalla existente.
		`CREATE TABLE IF NOT EXISTS finance_warranty_records (
			id BIGSERIAL PRIMARY KEY,
			company_id TEXT NOT NULL,
			code VARCHAR(40) NOT NULL DEFAULT '',
			equipment_id VARCHAR(80) NOT NULL DEFAULT '',
			equipment_identifier VARCHAR(180) NOT NULL,
			client_name VARCHAR(180) NOT NULL,
			months INTEGER NOT NULL DEFAULT 0,
			start_at DATE NULL,
			end_at DATE NULL,
			follow_up_at DATE NULL,
			owner VARCHAR(140) NOT NULL DEFAULT '',
			phase VARCHAR(40) NOT NULL DEFAULT 'en-revision',
			status VARCHAR(20) NOT NULL DEFAULT 'Vigente' CHECK (status IN ('Vigente', 'Por vencer', 'Vencida', 'Cerrada')),
			notes TEXT NOT NULL DEFAULT '',
			created_by TEXT NOT NULL DEFAULT '',
			soft_delete BOOLEAN NOT NULL DEFAULT false,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_warranty_company_created ON finance_warranty_records(company_id, created_at DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_warranty_company_soft_delete ON finance_warranty_records(company_id, soft_delete);`,
		`CREATE INDEX IF NOT EXISTS idx_finance_warranty_company_end_at ON finance_warranty_records(company_id, end_at);`,

		// Configuración genérica por empresa (tarifa horaria ahora; la Fase 6
		// la extiende). PK (company_id, setting_key).
		`CREATE TABLE IF NOT EXISTS company_settings (
			company_id TEXT NOT NULL,
			setting_key VARCHAR(120) NOT NULL,
			value_json JSONB NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, setting_key)
		);`,

		// Retenciones de pagos: la UI ya las captura pero nunca se guardaban
		// (no existían las columnas). DEFAULT 0 mantiene legibles los pagos
		// antiguos sin retenciones.
		`ALTER TABLE finance_payments ADD COLUMN IF NOT EXISTS rete_fuente NUMERIC(14, 2) NOT NULL DEFAULT 0;`,
		`ALTER TABLE finance_payments ADD COLUMN IF NOT EXISTS rete_iva NUMERIC(14, 2) NOT NULL DEFAULT 0;`,
		`ALTER TABLE finance_payments ADD COLUMN IF NOT EXISTS rete_ica NUMERIC(14, 2) NOT NULL DEFAULT 0;`,
		`ALTER TABLE finance_payments ADD COLUMN IF NOT EXISTS retention_comments TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE finance_payments ADD COLUMN IF NOT EXISTS payment_date DATE NULL;`,
	}
}
