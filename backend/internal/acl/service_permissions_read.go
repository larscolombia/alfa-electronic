package acl

import (
	"context"
	"strings"
)

func (s *Service) GetRolePermissions(companyID, roleID string) (RolePermissionsResponse, error) {
	roleID = strings.TrimSpace(roleID)
	if roleID == "" {
		return RolePermissionsResponse{}, errRoleNotFound
	}

	ctx := context.Background()
	if err := s.ensureStaticData(ctx); err != nil {
		return RolePermissionsResponse{}, err
	}
	if err := s.ensureRoleForCompany(ctx, companyID, roleID); err != nil {
		return RolePermissionsResponse{}, err
	}

	actionRows, err := s.db.QueryContext(ctx, `
SELECT name
FROM acl_actions
ORDER BY sort_order ASC, id ASC;
`)
	if err != nil {
		return RolePermissionsResponse{}, err
	}
	defer actionRows.Close()

	actionOrder := make([]string, 0)
	for actionRows.Next() {
		var actionName string
		if err := actionRows.Scan(&actionName); err != nil {
			return RolePermissionsResponse{}, err
		}
		actionOrder = append(actionOrder, actionName)
	}
	if err := actionRows.Err(); err != nil {
		return RolePermissionsResponse{}, err
	}

	moduleRows, err := s.db.QueryContext(ctx, `
SELECT m.id, m.slug, COALESCE(rma.is_enabled, true)
FROM acl_modules m
LEFT JOIN acl_role_module_access rma ON rma.module_id = m.id AND rma.role_id = $1
WHERE m.is_active = true
ORDER BY m.sort_order ASC;
`, roleID)
	if err != nil {
		return RolePermissionsResponse{}, err
	}
	defer moduleRows.Close()

	modules := make([]RoleModulePermission, 0)
	moduleIndexByID := make(map[string]int)
	actionIndexByModule := make(map[string]map[string]int)
	for moduleRows.Next() {
		var moduleID string
		var moduleSlug string
		var isEnabled bool
		if err := moduleRows.Scan(&moduleID, &moduleSlug, &isEnabled); err != nil {
			return RolePermissionsResponse{}, err
		}

		module := RoleModulePermission{
			ModuleID:   moduleID,
			ModuleSlug: moduleSlug,
			IsEnabled:  isEnabled,
			Actions:    make([]RoleActionPermission, 0, len(actionOrder)),
			Fields:     make([]RoleFieldPermission, 0),
		}

		actionIndexByName := make(map[string]int)
		for _, actionName := range actionOrder {
			actionIndexByName[actionName] = len(module.Actions)
			module.Actions = append(module.Actions, RoleActionPermission{
				Action: actionName,
				Scope:  "ninguno",
			})
		}

		moduleIndexByID[moduleID] = len(modules)
		actionIndexByModule[moduleID] = actionIndexByName
		modules = append(modules, module)
	}
	if err := moduleRows.Err(); err != nil {
		return RolePermissionsResponse{}, err
	}

	fieldRows, err := s.db.QueryContext(ctx, `
SELECT f.id, f.module_id, f.slug
FROM acl_module_fields f
JOIN acl_modules m ON m.id = f.module_id
WHERE f.is_active = true
  AND m.is_active = true
ORDER BY m.sort_order ASC, f.sort_order ASC;
`)
	if err != nil {
		return RolePermissionsResponse{}, err
	}
	defer fieldRows.Close()

	fieldIndexByModule := make(map[string]map[string]int)
	for fieldRows.Next() {
		var fieldID string
		var moduleID string
		var fieldSlug string
		if err := fieldRows.Scan(&fieldID, &moduleID, &fieldSlug); err != nil {
			return RolePermissionsResponse{}, err
		}

		moduleIdx, ok := moduleIndexByID[moduleID]
		if !ok {
			continue
		}

		if _, ok := fieldIndexByModule[moduleID]; !ok {
			fieldIndexByModule[moduleID] = make(map[string]int)
		}

		fieldIndexByModule[moduleID][fieldID] = len(modules[moduleIdx].Fields)
		modules[moduleIdx].Fields = append(modules[moduleIdx].Fields, RoleFieldPermission{
			FieldID:    fieldID,
			FieldSlug:  fieldSlug,
			Permission: "ver",
		})
	}
	if err := fieldRows.Err(); err != nil {
		return RolePermissionsResponse{}, err
	}

	actionPermissionRows, err := s.db.QueryContext(ctx, `
SELECT rp.module_id, a.name, s.name
FROM acl_role_permissions rp
JOIN acl_modules m ON m.id = rp.module_id
JOIN acl_actions a ON a.id = rp.action_id
JOIN acl_permission_scopes s ON s.id = rp.scope_id
WHERE rp.role_id = $1
  AND m.is_active = true;
`, roleID)
	if err != nil {
		return RolePermissionsResponse{}, err
	}
	defer actionPermissionRows.Close()

	for actionPermissionRows.Next() {
		var moduleID string
		var actionName string
		var scopeName string
		if err := actionPermissionRows.Scan(&moduleID, &actionName, &scopeName); err != nil {
			return RolePermissionsResponse{}, err
		}

		moduleIdx, ok := moduleIndexByID[moduleID]
		if !ok {
			continue
		}

		actionIdx, ok := actionIndexByModule[moduleID][actionName]
		if !ok {
			continue
		}

		modules[moduleIdx].Actions[actionIdx].Scope = scopeName
	}
	if err := actionPermissionRows.Err(); err != nil {
		return RolePermissionsResponse{}, err
	}

	fieldPermissionRows, err := s.db.QueryContext(ctx, `
SELECT f.module_id, rf.field_id, pt.name
FROM acl_role_field_permissions rf
JOIN acl_module_fields f ON f.id = rf.field_id
JOIN acl_modules m ON m.id = f.module_id
JOIN acl_field_permission_types pt ON pt.id = rf.field_perm_id
WHERE rf.role_id = $1
  AND m.is_active = true
  AND f.is_active = true;
`, roleID)
	if err != nil {
		return RolePermissionsResponse{}, err
	}
	defer fieldPermissionRows.Close()

	for fieldPermissionRows.Next() {
		var moduleID string
		var fieldID string
		var permission string
		if err := fieldPermissionRows.Scan(&moduleID, &fieldID, &permission); err != nil {
			return RolePermissionsResponse{}, err
		}

		moduleIdx, ok := moduleIndexByID[moduleID]
		if !ok {
			continue
		}

		fieldIdx, ok := fieldIndexByModule[moduleID][fieldID]
		if !ok {
			continue
		}

		modules[moduleIdx].Fields[fieldIdx].Permission = permission
	}
	if err := fieldPermissionRows.Err(); err != nil {
		return RolePermissionsResponse{}, err
	}

	return RolePermissionsResponse{
		RoleID:  roleID,
		Modules: modules,
	}, nil
}

func (s *Service) ensureRoleForCompany(ctx context.Context, companyID, roleID string) error {
	var exists bool
	err := s.db.QueryRowContext(ctx, `
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
