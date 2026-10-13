package acl

import "time"

type Module struct {
	ID          string        `json:"id"`
	Slug        string        `json:"slug"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	SortOrder   int           `json:"sortOrder"`
	Fields      []ModuleField `json:"fields"`
}

type ModuleField struct {
	ID        string `json:"id"`
	ModuleID  string `json:"moduleId"`
	Slug      string `json:"slug"`
	Label     string `json:"label"`
	SortOrder int    `json:"sortOrder"`
}

type Role struct {
	ID          string    `json:"id"`
	CompanyID   string    `json:"companyId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CreateRoleRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type RoleSeedSummary struct {
	ModuleAccess      int `json:"moduleAccess"`
	ActionPermissions int `json:"actionPermissions"`
	FieldPermissions  int `json:"fieldPermissions"`
}

type CreateRoleResponse struct {
	Role        Role            `json:"role"`
	SeedSummary RoleSeedSummary `json:"seedSummary"`
}

type RoleActionPermission struct {
	Action string `json:"action"`
	Scope  string `json:"scope"`
}

type RoleFieldPermission struct {
	FieldID    string `json:"fieldId"`
	FieldSlug  string `json:"fieldSlug,omitempty"`
	Permission string `json:"permission"`
}

type RoleModulePermission struct {
	ModuleID   string                 `json:"moduleId"`
	ModuleSlug string                 `json:"moduleSlug,omitempty"`
	IsEnabled  bool                   `json:"isEnabled"`
	Actions    []RoleActionPermission `json:"actions"`
	Fields     []RoleFieldPermission  `json:"fields"`
}

type RolePermissionsResponse struct {
	RoleID  string                 `json:"roleId"`
	Modules []RoleModulePermission `json:"modules"`
}

type UpdateRolePermissionsRequest struct {
	Modules []RoleModulePermission `json:"modules"`
}

type UserSoftDeletePayload struct {
	UserEmail   string `json:"userEmail"`
	Action      string `json:"action"`
	Status      string `json:"status"`
	SoftDelete  bool   `json:"softDelete"`
	RequestedAt string `json:"requestedAt"`
	Source      string `json:"source"`
}
