package database

// migrationStatementsCRMAccountsBackfill imports legacy CRM rows exactly once.
// Legacy ids remain resolvable through crm_account_legacy_ids so dependent records
// can be moved without guessing from names after this migration.
func migrationStatementsCRMAccountsBackfill() []string {
	return []string{
		`INSERT INTO crm_accounts (
			id, company_id, lifecycle_status, salutation, name, email, mobile, company, nit, zone,
			website, office_phone, country, city, address, assigned_employee, source, category,
			service, prospect_status, prospect_value, allow_follow_up, note, quotations,
			soft_delete, created_at, updated_at
		)
		SELECT id, company_id, 'prospecto', salutation, name, email, mobile, company, nit, zone,
			website, office_phone, country, city, address, assigned_employee, source, category,
			service, status, prospect_value, allow_follow_up, note, quotations,
			soft_delete, created_at, updated_at
		FROM crm_prospects
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO crm_account_legacy_ids (company_id, legacy_type, legacy_id, account_id)
		SELECT company_id, 'prospect', id, id FROM crm_prospects
		ON CONFLICT (company_id, legacy_type, legacy_id) DO NOTHING;`,
		`INSERT INTO crm_accounts (
			id, company_id, lifecycle_status, name, email, company, nit, zone, website, office_phone,
			country, city, address, credit_enabled, credit_limit, credit_consumed, last_payment_date,
			payment_term_days, dv, postal_code, billing_email, grand_contributor, id_type,
			converted_at, soft_delete, created_at, updated_at
		)
		SELECT c.id, c.company_id, 'cliente', c.nombre, c.correo, c.empresa, c.nit, c.zona,
			c.website, c.office_phone, c.country, c.city, c.address, c.credit_enabled, c.credit_limit,
			c.credit_consumed, c.last_payment_date, c.payment_term_days, COALESCE(c.dv, ''),
			COALESCE(c.postal_code, ''), COALESCE(c.billing_email, ''), c.grand_contributor, c.id_type,
			c.created_at, c.soft_delete, c.created_at, c.updated_at
		FROM crm_clients c
		WHERE NOT EXISTS (
			SELECT 1 FROM crm_accounts a
			WHERE a.company_id = c.company_id AND (
				(TRIM(c.nit) <> '' AND LOWER(TRIM(a.nit)) = LOWER(TRIM(c.nit))) OR
				(TRIM(c.nit) = '' AND LOWER(TRIM(a.company)) = LOWER(TRIM(c.empresa)) AND LOWER(TRIM(a.email)) = LOWER(TRIM(c.correo)))
			)
		)
		ON CONFLICT (id) DO NOTHING;`,
		`UPDATE crm_accounts a SET lifecycle_status = 'cliente', converted_at = COALESCE(converted_at, c.created_at),
			credit_enabled = c.credit_enabled, credit_limit = c.credit_limit, credit_consumed = c.credit_consumed,
			last_payment_date = c.last_payment_date, payment_term_days = c.payment_term_days, updated_at = GREATEST(a.updated_at, c.updated_at)
		FROM crm_clients c
		WHERE a.company_id = c.company_id AND (
			(TRIM(c.nit) <> '' AND LOWER(TRIM(a.nit)) = LOWER(TRIM(c.nit))) OR
			(TRIM(c.nit) = '' AND LOWER(TRIM(a.company)) = LOWER(TRIM(c.empresa)) AND LOWER(TRIM(a.email)) = LOWER(TRIM(c.correo)))
		);`,
		`INSERT INTO crm_account_legacy_ids (company_id, legacy_type, legacy_id, account_id)
		SELECT c.company_id, 'client', c.id, a.id FROM crm_clients c
		JOIN crm_accounts a ON a.company_id = c.company_id AND (
			(TRIM(c.nit) <> '' AND LOWER(TRIM(a.nit)) = LOWER(TRIM(c.nit))) OR
			(TRIM(c.nit) = '' AND LOWER(TRIM(a.company)) = LOWER(TRIM(c.empresa)) AND LOWER(TRIM(a.email)) = LOWER(TRIM(c.correo)))
		)
		ON CONFLICT (company_id, legacy_type, legacy_id) DO NOTHING;`,
		`INSERT INTO crm_account_contacts (id, company_id, account_id, name, role, email, phone, notes, soft_delete, created_at, updated_at)
		SELECT pc.id, pc.company_id, li.account_id, pc.name, pc.role, pc.email, pc.phone, pc.notes, false, pc.created_at, pc.updated_at
		FROM crm_prospect_contacts pc JOIN crm_account_legacy_ids li ON li.company_id = pc.company_id AND li.legacy_type = 'prospect' AND li.legacy_id = pc.prospect_id
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO crm_account_contacts (id, company_id, account_id, name, role, email, phone, notes, soft_delete, created_at, updated_at)
		SELECT cc.id, cc.company_id, li.account_id, cc.name, cc.role, cc.email, cc.phone, cc.notes, cc.soft_delete, cc.created_at, cc.updated_at
		FROM crm_client_contacts cc JOIN crm_account_legacy_ids li ON li.company_id = cc.company_id AND li.legacy_type = 'client' AND li.legacy_id = cc.client_id
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO crm_account_branches (id, company_id, account_id, name, contact_name, contact_role, email, phone, country, city, address, is_primary, created_at, updated_at)
		SELECT pb.id, pb.company_id, li.account_id, pb.name, pb.contact_name, pb.contact_role, pb.email, pb.phone, pb.country, pb.city, pb.address, pb.is_primary, pb.created_at, pb.updated_at
		FROM crm_prospect_branches pb JOIN crm_account_legacy_ids li ON li.company_id = pb.company_id AND li.legacy_type = 'prospect' AND li.legacy_id = pb.prospect_id
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO crm_account_branches (id, company_id, account_id, name, contact_name, contact_role, email, phone, country, city, address, is_primary, created_at, updated_at)
		SELECT cb.id, cb.company_id, li.account_id, cb.name, cb.contact_name, cb.contact_role, cb.email, cb.phone, cb.country, cb.city, cb.address, cb.is_primary, cb.created_at, cb.updated_at
		FROM crm_client_branches cb JOIN crm_account_legacy_ids li ON li.company_id = cb.company_id AND li.legacy_type = 'client' AND li.legacy_id = cb.client_id
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO crm_account_followups (id, company_id, account_id, tipo, fecha, hora, recordatorio, observacion, estado, registrado_por, contacto_nombre, soft_delete, created_at, updated_at)
		SELECT f.id, f.company_id, li.account_id, f.tipo, f.fecha, f.hora, f.recordatorio, f.observacion, f.estado, f.registrado_por, f.contacto_nombre, f.soft_delete, f.created_at, f.updated_at
		FROM crm_prospect_followups f JOIN crm_account_legacy_ids li ON li.company_id = f.company_id AND li.legacy_type = 'prospect' AND li.legacy_id = f.prospect_id
		ON CONFLICT (id) DO NOTHING;`,
		`INSERT INTO crm_account_attachments (id, company_id, account_id, filename, mime_type, file_size_bytes, storage_url, uploaded_by, created_at)
		SELECT a.id, a.company_id, li.account_id, a.filename, a.mime_type, a.file_size_bytes, a.storage_url, a.uploaded_by, a.created_at
		FROM crm_prospect_attachments a JOIN crm_account_legacy_ids li ON li.company_id = a.company_id AND li.legacy_type = 'prospect' AND li.legacy_id = a.prospect_id
		ON CONFLICT (id) DO NOTHING;`,
	}
}
