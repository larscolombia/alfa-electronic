package database

func migrationStatementsPurchaseLinesEquipment() []string {
	return []string{
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS project_id TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS equipment_tag TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS modified_by_purchases BOOLEAN NOT NULL DEFAULT FALSE;`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS modified_by TEXT NOT NULL DEFAULT '';`,
		`ALTER TABLE inventory_purchase_lines ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;`,
		`CREATE INDEX IF NOT EXISTS idx_inventory_purchase_lines_equipment ON inventory_purchase_lines(company_id, equipment_tag);`,
	}
}
