package database

import (
	"strings"
	"testing"
)

func TestCRMAccountsMigrationDefinesOneCanonicalIdentity(t *testing.T) {
	statements := migrationStatementsCRMAccounts()
	joined := strings.Join(statements, "\n")

	for _, expected := range []string{
		"CREATE TABLE IF NOT EXISTS crm_accounts",
		"lifecycle_status VARCHAR(20) NOT NULL",
		"crm_account_contacts",
		"crm_account_branches",
		"crm_account_followups",
		"crm_account_attachments",
		"crm_account_legacy_ids",
		"UNIQUE(company_id, legacy_type, legacy_id)",
	} {
		if !strings.Contains(joined, expected) {
			t.Fatalf("canonical CRM migration must contain %q", expected)
		}
	}
}
