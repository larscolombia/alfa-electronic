package acl

import (
	"context"
	"database/sql"
)

func (s *Service) ensureDefaultRoles(ctx context.Context, companyID string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	rows, err := tx.QueryContext(ctx, `
SELECT id, name
FROM acl_roles
WHERE company_id = $1
ORDER BY created_at ASC;
`, companyID)
	if err != nil {
		tx.Rollback()
		return err
	}

	type existingRole struct {
		id   string
		name string
	}

	existingByNormalizedName := make(map[string]existingRole)
	duplicateRoleIDs := make([]string, 0)
	for rows.Next() {
		var row existingRole
		if err := rows.Scan(&row.id, &row.name); err != nil {
			rows.Close()
			tx.Rollback()
			return err
		}

		normalizedName := normalizeRoleName(row.name)
		if _, exists := existingByNormalizedName[normalizedName]; exists {
			duplicateRoleIDs = append(duplicateRoleIDs, row.id)
			continue
		}

		existingByNormalizedName[normalizedName] = row
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		tx.Rollback()
		return err
	}
	rows.Close()

	for _, roleID := range duplicateRoleIDs {
		if _, err := tx.ExecContext(ctx, `
DELETE FROM acl_roles
WHERE id = $1;
`, roleID); err != nil {
			tx.Rollback()
			return err
		}
	}

	allowedSeeds := defaultRoleSeeds()
	allowedSet := make(map[string]roleSeed, len(allowedSeeds))
	for _, seed := range allowedSeeds {
		allowedSet[normalizeRoleName(seed.name)] = seed
	}

	for normalizedName, row := range existingByNormalizedName {
		if _, allowed := allowedSet[normalizedName]; allowed {
			continue
		}

		if _, err := tx.ExecContext(ctx, `
DELETE FROM acl_roles
WHERE id = $1;
`, row.id); err != nil {
			tx.Rollback()
			return err
		}
		delete(existingByNormalizedName, normalizedName)
	}

	for _, seed := range allowedSeeds {
		normalizedName := normalizeRoleName(seed.name)
		existing, exists := existingByNormalizedName[normalizedName]
		if !exists {
			if _, _, err := s.createRoleTx(ctx, tx, companyID, seed.name, seed.description); err != nil {
				tx.Rollback()
				return err
			}
			continue
		}

		if _, err := tx.ExecContext(ctx, `
UPDATE acl_roles
SET name = $1,
	description = $2,
	is_active = true,
	updated_at = NOW()
WHERE id = $3;
`, seed.name, seed.description, existing.id); err != nil {
			tx.Rollback()
			return err
		}

		if _, err := s.seedRolePermissionsTx(ctx, tx, existing.id); err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func (s *Service) seedRolePermissionsTx(ctx context.Context, tx *sql.Tx, roleID string) (RoleSeedSummary, error) {
	moduleAccessResult, err := tx.ExecContext(ctx, `
INSERT INTO acl_role_module_access (role_id, module_id, is_enabled, updated_at)
SELECT $1, m.id, true, NOW()
FROM acl_modules m
WHERE m.is_active = true
ON CONFLICT (role_id, module_id) DO NOTHING;
`, roleID)
	if err != nil {
		return RoleSeedSummary{}, err
	}

	actionPermissionsResult, err := tx.ExecContext(ctx, `
INSERT INTO acl_role_permissions (id, role_id, module_id, action_id, scope_id, created_at, updated_at)
SELECT
CONCAT($1::text, '-', m.id, '-', a.id),
$1::text,
m.id,
a.id,
CASE a.name
WHEN 'ver' THEN 1
ELSE 0
END,
NOW(),
NOW()
FROM acl_modules m
CROSS JOIN acl_actions a
WHERE m.is_active = true
ON CONFLICT (role_id, module_id, action_id) DO NOTHING;
`, roleID)
	if err != nil {
		return RoleSeedSummary{}, err
	}

	fieldPermissionsResult, err := tx.ExecContext(ctx, `
INSERT INTO acl_role_field_permissions (id, role_id, field_id, field_perm_id, created_at, updated_at)
SELECT
CONCAT($1::text, '-', f.id),
$1::text,
f.id,
1,
NOW(),
NOW()
FROM acl_module_fields f
JOIN acl_modules m ON m.id = f.module_id
WHERE m.is_active = true
  AND f.is_active = true
ON CONFLICT (role_id, field_id) DO NOTHING;
`, roleID)
	if err != nil {
		return RoleSeedSummary{}, err
	}

	moduleAccessCount, _ := moduleAccessResult.RowsAffected()
	actionPermissionsCount, _ := actionPermissionsResult.RowsAffected()
	fieldPermissionsCount, _ := fieldPermissionsResult.RowsAffected()

	return RoleSeedSummary{
		ModuleAccess:      int(moduleAccessCount),
		ActionPermissions: int(actionPermissionsCount),
		FieldPermissions:  int(fieldPermissionsCount),
	}, nil
}
