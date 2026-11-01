package database

// migrationStatementsCRMDropSource removes the "fuente del prospecto" field from
// every table that stored it. The field was retired from the UI and API, so no
// active feature reads or writes it; dropping the column keeps the schema honest.
func migrationStatementsCRMDropSource() []string {
	return []string{
		`ALTER TABLE crm_prospects DROP COLUMN IF EXISTS source;`,
		`ALTER TABLE crm_accounts DROP COLUMN IF EXISTS source;`,
		`DELETE FROM crm_catalog_items WHERE catalog_type = 'sources';`,
	}
}
