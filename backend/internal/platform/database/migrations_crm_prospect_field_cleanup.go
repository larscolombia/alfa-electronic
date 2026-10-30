package database

// migrationStatementsCRMProspectFieldCleanup removes fields superseded by the
// CIIU classification once legacy data has been imported into crm_accounts.
func migrationStatementsCRMProspectFieldCleanup() []string {
	return []string{
		`ALTER TABLE crm_prospects DROP COLUMN IF EXISTS salutation;`,
		`ALTER TABLE crm_prospects DROP COLUMN IF EXISTS category;`,
		`ALTER TABLE crm_accounts ADD COLUMN IF NOT EXISTS ciiu_code VARCHAR(10) NOT NULL DEFAULT '';`,
		`ALTER TABLE crm_accounts DROP COLUMN IF EXISTS salutation;`,
		`ALTER TABLE crm_accounts DROP COLUMN IF EXISTS category;`,
	}
}
