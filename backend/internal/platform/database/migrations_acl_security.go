package database

func migrationStatementsACLAndSecurity() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS acl_modules (
			id TEXT PRIMARY KEY,
			slug VARCHAR(80) NOT NULL UNIQUE,
			name VARCHAR(120) NOT NULL,
			description TEXT NOT NULL,
			sort_order SMALLINT NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS acl_module_fields (
			id TEXT PRIMARY KEY,
			module_id TEXT NOT NULL REFERENCES acl_modules(id) ON DELETE CASCADE,
			slug VARCHAR(120) NOT NULL,
			label VARCHAR(255) NOT NULL,
			sort_order SMALLINT NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(module_id, slug)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_acl_module_fields_module_id ON acl_module_fields(module_id);`,
		`CREATE TABLE IF NOT EXISTS acl_permission_scopes (
			id SMALLINT PRIMARY KEY,
			name VARCHAR(20) NOT NULL UNIQUE,
			label VARCHAR(50) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS acl_actions (
			id SMALLINT PRIMARY KEY,
			name VARCHAR(20) NOT NULL UNIQUE,
			label VARCHAR(50) NOT NULL,
			sort_order SMALLINT NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS acl_field_permission_types (
			id SMALLINT PRIMARY KEY,
			name VARCHAR(20) NOT NULL UNIQUE,
			label VARCHAR(50) NOT NULL
		);`,
		`CREATE TABLE IF NOT EXISTS acl_roles (
			id TEXT PRIMARY KEY,
			company_id TEXT NOT NULL,
			name VARCHAR(80) NOT NULL,
			description TEXT NOT NULL,
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(company_id, name)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_acl_roles_company_id ON acl_roles(company_id);`,
		`CREATE TABLE IF NOT EXISTS acl_role_module_access (
			role_id TEXT NOT NULL REFERENCES acl_roles(id) ON DELETE CASCADE,
			module_id TEXT NOT NULL REFERENCES acl_modules(id) ON DELETE CASCADE,
			is_enabled BOOLEAN NOT NULL DEFAULT true,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY(role_id, module_id)
		);`,
		`CREATE TABLE IF NOT EXISTS acl_role_permissions (
			id TEXT PRIMARY KEY,
			role_id TEXT NOT NULL REFERENCES acl_roles(id) ON DELETE CASCADE,
			module_id TEXT NOT NULL REFERENCES acl_modules(id) ON DELETE CASCADE,
			action_id SMALLINT NOT NULL REFERENCES acl_actions(id) ON DELETE RESTRICT,
			scope_id SMALLINT NOT NULL REFERENCES acl_permission_scopes(id) ON DELETE RESTRICT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(role_id, module_id, action_id)
		);`,
		`CREATE TABLE IF NOT EXISTS acl_role_field_permissions (
			id TEXT PRIMARY KEY,
			role_id TEXT NOT NULL REFERENCES acl_roles(id) ON DELETE CASCADE,
			field_id TEXT NOT NULL REFERENCES acl_module_fields(id) ON DELETE CASCADE,
			field_perm_id SMALLINT NOT NULL REFERENCES acl_field_permission_types(id) ON DELETE RESTRICT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(role_id, field_id)
		);`,
		`CREATE TABLE IF NOT EXISTS acl_user_soft_delete_events (
			id BIGSERIAL PRIMARY KEY,
			company_id TEXT NOT NULL,
			user_email VARCHAR(255) NOT NULL,
			action VARCHAR(32) NOT NULL,
			status VARCHAR(32) NOT NULL,
			soft_delete BOOLEAN NOT NULL,
			requested_at TIMESTAMPTZ NOT NULL,
			source VARCHAR(120) NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_acl_user_soft_delete_company ON acl_user_soft_delete_events(company_id);`,
		`CREATE TABLE IF NOT EXISTS security_access_global_rules (
			id BIGSERIAL PRIMARY KEY,
			company_id TEXT NOT NULL,
			subject_type VARCHAR(12) NOT NULL CHECK (subject_type IN ('user', 'role')),
			subject_value VARCHAR(255) NOT NULL,
			reason TEXT NOT NULL DEFAULT '',
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(company_id, subject_type, subject_value)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_security_access_global_company ON security_access_global_rules(company_id);`,
		`CREATE TABLE IF NOT EXISTS security_access_restrictions (
			id BIGSERIAL PRIMARY KEY,
			company_id TEXT NOT NULL,
			subject_type VARCHAR(12) NOT NULL CHECK (subject_type IN ('user', 'role')),
			subject_value VARCHAR(255) NOT NULL,
			office VARCHAR(160) NOT NULL DEFAULT 'Oficina principal',
			is_active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_security_access_restrictions_company ON security_access_restrictions(company_id);`,
		`CREATE TABLE IF NOT EXISTS security_access_restriction_entries (
			id BIGSERIAL PRIMARY KEY,
			restriction_id BIGINT NOT NULL REFERENCES security_access_restrictions(id) ON DELETE CASCADE,
			entry_type VARCHAR(8) NOT NULL CHECK (entry_type IN ('ip', 'mac')),
			entry_value VARCHAR(160) NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			UNIQUE(restriction_id, entry_type, entry_value)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_security_access_entries_restriction ON security_access_restriction_entries(restriction_id);`,
	}
}
