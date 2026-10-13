package database

func migrationStatementsPurchaseLinesFields() []string {
	return []string{
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS component TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS unit_price REAL NOT NULL DEFAULT 0;`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS needed_by TEXT NOT NULL DEFAULT '';`,
	}
}
