package database

func migrationStatementsInventoryEdge() []string {
	return []string{
		`ALTER TABLE inventory_references ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'nuevo';`,
		`DO $$
		BEGIN
			IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_references_condition_check') THEN
				ALTER TABLE inventory_references
					ADD CONSTRAINT inventory_references_condition_check CHECK (condition IN ('nuevo', 'usado'));
			END IF;
		END $$;`,
		`ALTER TABLE inventory_references ADD COLUMN IF NOT EXISTS last_used_test JSONB NULL;`,
	}
}
