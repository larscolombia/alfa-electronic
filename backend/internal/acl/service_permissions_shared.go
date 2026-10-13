package acl

import (
	"context"
	"database/sql"
	"strings"
)

func normalizePermissionToken(raw string) string {
	return strings.ToLower(strings.TrimSpace(raw))
}

func (s *Service) ensureRoleForCompanyTx(ctx context.Context, tx *sql.Tx, companyID, roleID string) error {
	var exists bool
	err := tx.QueryRowContext(ctx, `
SELECT EXISTS(
	SELECT 1
	FROM acl_roles
	WHERE id = $1
	  AND company_id = $2
);
`, roleID, companyID).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errRoleNotFound
	}

	return nil
}

func (s *Service) clearRolePermissionsTx(ctx context.Context, tx *sql.Tx, roleID string) error {
	if _, err := tx.ExecContext(ctx, `
DELETE FROM acl_role_field_permissions
WHERE role_id = $1;
`, roleID); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM acl_role_permissions
WHERE role_id = $1;
`, roleID); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
DELETE FROM acl_role_module_access
WHERE role_id = $1;
`, roleID); err != nil {
		return err
	}

	return nil
}
