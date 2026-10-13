package acl

import "context"

func (s *Service) ensureStaticData(ctx context.Context) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_permission_scopes (id, name, label) VALUES
(0, 'ninguno', 'Ninguno'),
(1, 'propio',  'Propio'),
(2, 'anadido', 'Anadido'),
(3, 'todo',    'Todo')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, label = EXCLUDED.label;
`); err != nil {
		tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_actions (id, name, label, sort_order) VALUES
(1, 'agregar',    'Agregar',    1),
(2, 'ver',        'Ver',        2),
(3, 'actualizar', 'Actualizar', 3)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
label = EXCLUDED.label,
sort_order = EXCLUDED.sort_order;
`); err != nil {
		tx.Rollback()
		return err
	}

	if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_field_permission_types (id, name, label) VALUES
(1, 'ver',        'Ver'),
(2, 'editar',     'Editar'),
(3, 'actualizar', 'Actualizar'),
(4, 'oculto',     'Oculto')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, label = EXCLUDED.label;
`); err != nil {
		tx.Rollback()
		return err
	}

	for _, module := range defaultModules() {
		if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_modules (id, slug, name, description, sort_order, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
slug = EXCLUDED.slug,
name = EXCLUDED.name,
description = EXCLUDED.description,
sort_order = EXCLUDED.sort_order,
updated_at = NOW();
`, module.ID, module.Slug, module.Name, module.Description, module.SortOrder); err != nil {
			tx.Rollback()
			return err
		}

		for _, field := range module.Fields {
			if _, err := tx.ExecContext(ctx, `
INSERT INTO acl_module_fields (id, module_id, slug, label, sort_order, is_active, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
module_id = EXCLUDED.module_id,
slug = EXCLUDED.slug,
label = EXCLUDED.label,
sort_order = EXCLUDED.sort_order,
updated_at = NOW();
`, field.ID, module.ID, field.Slug, field.Label, field.SortOrder); err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}
