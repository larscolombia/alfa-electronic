package database

// Endurecimiento de una sola vez sobre datos YA sembrados: el seed antiguo daba
// "ver" a todo rol sobre todo modulo, asi que tecnico y ventas podian leer los
// datos personales de los empleados. El seed nuevo ya lo deniega, pero usa
// ON CONFLICT DO NOTHING y por tanto no corrige las filas existentes.
//
// Migrate() se ejecuta en cada arranque, asi que el UPDATE esta condicionado a
// una fila marcadora: sin esa guarda se volveria a denegar en cada reinicio y el
// administrador nunca podria conceder el acceso desde el panel.
func migrationStatementsACLHardening() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS acl_seed_hardening (
			key TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,

		`UPDATE acl_role_permissions rp
		 SET scope_id = 0, updated_at = NOW()
		 FROM acl_roles r, acl_modules m
		 WHERE rp.role_id = r.id
		   AND rp.module_id = m.id
		   AND m.slug = 'administracion'
		   AND LOWER(r.name) NOT IN ('admin', 'superadmin')
		   AND rp.scope_id <> 0
		   AND NOT EXISTS (
		       SELECT 1 FROM acl_seed_hardening
		       WHERE key = 'administracion-nonadmin-deny-v1'
		   );`,

		// El marcador solo se escribe cuando el modulo ya fue sembrado. Los
		// acl_modules los siembra el servicio ACL de forma perezosa, no esta
		// migracion: si se marcara en una BD aun sin modulos, el UPDATE no
		// habria encontrado nada y el endurecimiento quedaria omitido para
		// siempre.
		`INSERT INTO acl_seed_hardening (key)
		 SELECT 'administracion-nonadmin-deny-v1'
		 WHERE EXISTS (SELECT 1 FROM acl_modules WHERE slug = 'administracion')
		 ON CONFLICT (key) DO NOTHING;`,
	}
}
