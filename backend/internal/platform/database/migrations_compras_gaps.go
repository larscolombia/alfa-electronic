package database

func migrationStatementsComprasGaps() []string {
	return []string{
		`ALTER TABLE supplier_order_items ADD COLUMN IF NOT EXISTS purchase_line_id TEXT NOT NULL DEFAULT '';`,
		`CREATE INDEX IF NOT EXISTS idx_supplier_order_items_purchase_line ON supplier_order_items(company_id, purchase_line_id);`,

		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'aprobada';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS approved_by TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS linked_order_id BIGINT NOT NULL DEFAULT 0;`,

		// Cantidad recibida del pedido (recibos parciales registrados contra la linea).
		// Invariante: nunca se acredita a stock mas unidades que `quantity`; cada unidad
		// entra o por un recibo (received_quantity) o por el faltante al cerrar, no ambos.
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS received_quantity INTEGER NOT NULL DEFAULT 0;`,
		`CREATE INDEX IF NOT EXISTS idx_inventory_purchase_lines_supplier ON inventory_purchase_lines(company_id, supplier);`,

		`CREATE TABLE IF NOT EXISTS purchase_requests (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			reference TEXT NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			quantity INTEGER NOT NULL DEFAULT 0,
			supplier TEXT NOT NULL DEFAULT '',
			estimated_cost REAL NOT NULL DEFAULT 0,
			lead_time_days INTEGER NOT NULL DEFAULT 0,
			urgency VARCHAR(10) NOT NULL DEFAULT 'normal',
			memo TEXT NOT NULL DEFAULT '',
			project_id TEXT NOT NULL DEFAULT '',
			equipment_tag TEXT NOT NULL DEFAULT '',
			requested_by TEXT NOT NULL DEFAULT '',
			requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
			reviewed_by TEXT NOT NULL DEFAULT '',
			reviewed_at TIMESTAMPTZ,
			review_notes TEXT NOT NULL DEFAULT '',
			purchase_line_id TEXT NOT NULL DEFAULT '',
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_purchase_requests_company ON purchase_requests(company_id);`,
		`CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(company_id, status);`,
		`CREATE INDEX IF NOT EXISTS idx_purchase_requests_project ON purchase_requests(company_id, project_id);`,
	}
}
