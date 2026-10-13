package acl

import (
	"context"
	"database/sql"
)

type permissionCatalog struct {
	moduleOrder             []string
	moduleByID              map[string]string
	actionOrder             []string
	actionIDByName          map[string]int
	scopeIDByName           map[string]int
	fieldPermissionIDByName map[string]int
	fieldsByModuleID        map[string][]string
	fieldModuleByID         map[string]string
}

func loadPermissionCatalogTx(ctx context.Context, tx *sql.Tx) (permissionCatalog, error) {
	catalog := permissionCatalog{
		moduleOrder:             make([]string, 0),
		moduleByID:              make(map[string]string),
		actionOrder:             make([]string, 0),
		actionIDByName:          make(map[string]int),
		scopeIDByName:           make(map[string]int),
		fieldPermissionIDByName: make(map[string]int),
		fieldsByModuleID:        make(map[string][]string),
		fieldModuleByID:         make(map[string]string),
	}

	moduleRows, err := tx.QueryContext(ctx, `
SELECT id, slug
FROM acl_modules
WHERE is_active = true
ORDER BY sort_order ASC;
`)
	if err != nil {
		return permissionCatalog{}, err
	}
	for moduleRows.Next() {
		var moduleID string
		var moduleSlug string
		if err := moduleRows.Scan(&moduleID, &moduleSlug); err != nil {
			moduleRows.Close()
			return permissionCatalog{}, err
		}
		catalog.moduleOrder = append(catalog.moduleOrder, moduleID)
		catalog.moduleByID[moduleID] = moduleSlug
	}
	if err := moduleRows.Err(); err != nil {
		moduleRows.Close()
		return permissionCatalog{}, err
	}
	moduleRows.Close()

	actionRows, err := tx.QueryContext(ctx, `
SELECT id, name
FROM acl_actions
ORDER BY sort_order ASC, id ASC;
`)
	if err != nil {
		return permissionCatalog{}, err
	}
	for actionRows.Next() {
		var actionID int
		var actionName string
		if err := actionRows.Scan(&actionID, &actionName); err != nil {
			actionRows.Close()
			return permissionCatalog{}, err
		}
		catalog.actionOrder = append(catalog.actionOrder, actionName)
		catalog.actionIDByName[actionName] = actionID
	}
	if err := actionRows.Err(); err != nil {
		actionRows.Close()
		return permissionCatalog{}, err
	}
	actionRows.Close()

	scopeRows, err := tx.QueryContext(ctx, `
SELECT id, name
FROM acl_permission_scopes;
`)
	if err != nil {
		return permissionCatalog{}, err
	}
	for scopeRows.Next() {
		var scopeID int
		var scopeName string
		if err := scopeRows.Scan(&scopeID, &scopeName); err != nil {
			scopeRows.Close()
			return permissionCatalog{}, err
		}
		catalog.scopeIDByName[scopeName] = scopeID
	}
	if err := scopeRows.Err(); err != nil {
		scopeRows.Close()
		return permissionCatalog{}, err
	}
	scopeRows.Close()

	fieldPermissionRows, err := tx.QueryContext(ctx, `
SELECT id, name
FROM acl_field_permission_types;
`)
	if err != nil {
		return permissionCatalog{}, err
	}
	for fieldPermissionRows.Next() {
		var fieldPermissionID int
		var fieldPermissionName string
		if err := fieldPermissionRows.Scan(&fieldPermissionID, &fieldPermissionName); err != nil {
			fieldPermissionRows.Close()
			return permissionCatalog{}, err
		}
		catalog.fieldPermissionIDByName[fieldPermissionName] = fieldPermissionID
	}
	if err := fieldPermissionRows.Err(); err != nil {
		fieldPermissionRows.Close()
		return permissionCatalog{}, err
	}
	fieldPermissionRows.Close()

	moduleFieldRows, err := tx.QueryContext(ctx, `
SELECT f.id, f.module_id
FROM acl_module_fields f
JOIN acl_modules m ON m.id = f.module_id
WHERE f.is_active = true
  AND m.is_active = true
ORDER BY m.sort_order ASC, f.sort_order ASC;
`)
	if err != nil {
		return permissionCatalog{}, err
	}
	for moduleFieldRows.Next() {
		var fieldID string
		var moduleID string
		if err := moduleFieldRows.Scan(&fieldID, &moduleID); err != nil {
			moduleFieldRows.Close()
			return permissionCatalog{}, err
		}
		catalog.fieldModuleByID[fieldID] = moduleID
		catalog.fieldsByModuleID[moduleID] = append(catalog.fieldsByModuleID[moduleID], fieldID)
	}
	if err := moduleFieldRows.Err(); err != nil {
		moduleFieldRows.Close()
		return permissionCatalog{}, err
	}
	moduleFieldRows.Close()

	return catalog, nil
}
