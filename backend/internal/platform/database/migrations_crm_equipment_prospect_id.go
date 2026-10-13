package database

// Convierte crm_equipment_records.prospect_id a TEXT para poder almacenar
// el UUID real del prospecto (crm_prospects.id es texto). Los valores
// numericos historicos quedan como texto y simplemente no matchean UUIDs.
func migrationStatementsCRMEquipmentProspectIDText() []string {
	return []string{
		`ALTER TABLE crm_equipment_records ALTER COLUMN prospect_id DROP DEFAULT;`,
		`ALTER TABLE crm_equipment_records ALTER COLUMN prospect_id TYPE TEXT USING prospect_id::text;`,
		`ALTER TABLE crm_equipment_records ALTER COLUMN prospect_id SET DEFAULT '0';`,
		// Corrige los ids numericos sinteticos generados por el frontend
		// (parseInt del UUID): los reemplaza por el UUID real del prospecto
		// solo cuando el prefijo numerico identifica un unico prospecto.
		// Los valores de prueba ('0', '1') y las recepciones directas
		// ('-9000') se dejan como estan.
		`UPDATE crm_equipment_records e
SET prospect_id = mapped.real_id
FROM (
	SELECT e2.company_id AS cid, e2.prospect_id AS old_id, MIN(p.id) AS real_id
	FROM crm_equipment_records e2
	JOIN crm_prospects p
		ON p.company_id = e2.company_id
		AND p.id LIKE e2.prospect_id || '%'
	WHERE e2.prospect_id ~ '^[0-9]+$'
		AND e2.prospect_id <> '0'
	GROUP BY e2.company_id, e2.prospect_id
	HAVING COUNT(DISTINCT p.id) = 1
) AS mapped
WHERE e.company_id = mapped.cid
	AND e.prospect_id = mapped.old_id;`,
	}
}
