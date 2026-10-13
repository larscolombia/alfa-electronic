package acl

import (
	"context"
	"database/sql"
	"strconv"
	"strings"
)

func (s *Service) UpdateRolePermissions(companyID, roleID string, req UpdateRolePermissionsRequest) error {
	roleID = strings.TrimSpace(roleID)
	if roleID == "" {
		return errRoleNotFound
	}
	if len(req.Modules) == 0 {
		return errInvalidRolePermissions
	}

	ctx := context.Background()
	if err := s.ensureStaticData(ctx); err != nil {
		return err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := s.ensureRoleForCompanyTx(ctx, tx, companyID, roleID); err != nil {
		tx.Rollback()
		return err
	}

	catalog, err := loadPermissionCatalogTx(ctx, tx)
	if err != nil {
		tx.Rollback()
		return err
	}

	payloadByModuleID, err := buildRoleModulePayloadByID(req.Modules, catalog.moduleByID, catalog.moduleOrder)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err := s.clearRolePermissionsTx(ctx, tx, roleID); err != nil {
		tx.Rollback()
		return err
	}

	for _, moduleID := range catalog.moduleOrder {
		modulePermission := payloadByModuleID[moduleID]
		if err := upsertModulePermissionsTx(ctx, tx, roleID, moduleID, modulePermission, catalog); err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func buildRoleModulePayloadByID(
	modulePermissions []RoleModulePermission,
	moduleByID map[string]string,
	moduleOrder []string,
) (map[string]RoleModulePermission, error) {
	payloadByModuleID := make(map[string]RoleModulePermission)
	for _, modulePermission := range modulePermissions {
		moduleID := strings.TrimSpace(modulePermission.ModuleID)
		if moduleID == "" {
			return nil, errInvalidRolePermissions
		}

		if _, ok := moduleByID[moduleID]; !ok {
			return nil, errModuleNotFound
		}

		if _, exists := payloadByModuleID[moduleID]; exists {
			return nil, errInvalidRolePermissions
		}

		payloadByModuleID[moduleID] = modulePermission
	}

	if len(payloadByModuleID) != len(moduleOrder) {
		return nil, errInvalidRolePermissions
	}

	return payloadByModuleID, nil
}

func upsertModulePermissionsTx(
	ctx context.Context,
	tx *sql.Tx,
	roleID string,
	moduleID string,
	modulePermission RoleModulePermission,
	catalog permissionCatalog,
) error {
	if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_role_module_access (role_id, module_id, is_enabled, updated_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (role_id, module_id) DO UPDATE SET
is_enabled = EXCLUDED.is_enabled,
updated_at = NOW();
`, roleID, moduleID, modulePermission.IsEnabled); err != nil {
		return err
	}

	actionScopeByName := make(map[string]string)
	for _, actionName := range catalog.actionOrder {
		actionScopeByName[actionName] = "ninguno"
	}

	for _, actionPermission := range modulePermission.Actions {
		actionName := normalizePermissionToken(actionPermission.Action)
		if _, ok := catalog.actionIDByName[actionName]; !ok {
			return errActionNotFound
		}

		scopeName := normalizePermissionToken(actionPermission.Scope)
		if _, ok := catalog.scopeIDByName[scopeName]; !ok {
			return errScopeNotFound
		}

		actionScopeByName[actionName] = scopeName
	}

	for _, actionName := range catalog.actionOrder {
		actionID := catalog.actionIDByName[actionName]
		scopeID := catalog.scopeIDByName[actionScopeByName[actionName]]
		permissionID := roleID + "-" + moduleID + "-" + strconv.Itoa(actionID)

		if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_role_permissions (id, role_id, module_id, action_id, scope_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
ON CONFLICT (role_id, module_id, action_id) DO UPDATE SET
scope_id = EXCLUDED.scope_id,
updated_at = NOW();
`, permissionID, roleID, moduleID, actionID, scopeID); err != nil {
			return err
		}
	}

	fieldPermissionByID := make(map[string]string)
	for _, fieldID := range catalog.fieldsByModuleID[moduleID] {
		fieldPermissionByID[fieldID] = "ver"
	}

	for _, fieldPermission := range modulePermission.Fields {
		fieldID := strings.TrimSpace(fieldPermission.FieldID)
		if fieldID == "" {
			return errInvalidRolePermissions
		}

		expectedModuleID, ok := catalog.fieldModuleByID[fieldID]
		if !ok || expectedModuleID != moduleID {
			return errFieldNotFound
		}

		permissionName := normalizePermissionToken(fieldPermission.Permission)
		if _, ok := catalog.fieldPermissionIDByName[permissionName]; !ok {
			return errFieldPermissionUnknown
		}

		fieldPermissionByID[fieldID] = permissionName
	}

	for _, fieldID := range catalog.fieldsByModuleID[moduleID] {
		permissionName := fieldPermissionByID[fieldID]
		permissionID := catalog.fieldPermissionIDByName[permissionName]
		rowID := roleID + "-" + fieldID

		if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_role_field_permissions (id, role_id, field_id, field_perm_id, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
ON CONFLICT (role_id, field_id) DO UPDATE SET
field_perm_id = EXCLUDED.field_perm_id,
updated_at = NOW();
`, rowID, roleID, fieldID, permissionID); err != nil {
			return err
		}
	}

	return nil
}
