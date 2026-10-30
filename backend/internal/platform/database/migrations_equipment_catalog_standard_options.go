package database

// Las opciones operativas de recepción son un vocabulario común, no una
// configuración por navegador. Se insertan para cada empresa existente sin
// sobrescribir catálogos locales ni IDs ya usados por equipos históricos.
func migrationStatementsEquipmentCatalogStandardOptions() []string {
	return []string{
		`INSERT INTO company_equipment_families (company_id, id, name, description, active)
		 SELECT c.company_id, v.id, v.name, v.description, true
		 FROM (SELECT DISTINCT company_id FROM users WHERE company_id IS NOT NULL AND company_id <> '') c
		 CROSS JOIN (VALUES
			('family-a-alimentacion', 'A - Alimentacion', 'Familia de alimentación.'),
			('family-ce-tarjeta-electronica', 'CE - Tarjeta Electrónica', 'Familia de tarjetas electrónicas.')
		 ) AS v(id, name, description)
		 ON CONFLICT (company_id, id) DO NOTHING;`,
		`INSERT INTO company_equipment_service_types (company_id, id, name, description, active)
		 SELECT c.company_id, v.id, v.name, '', true
		 FROM (SELECT DISTINCT company_id FROM users WHERE company_id IS NOT NULL AND company_id <> '') c
		 CROSS JOIN (VALUES
			('service-reparacion', 'Reparación'),
			('service-intervencion-sitio', 'intervención en sitio'),
			('service-venta-nuevo', 'Venta Nuevo'),
			('service-venta-usado', 'Venta Usado'),
			('service-prestamo', 'Préstamo'),
			('service-manufactura', 'Manufactura'),
			('service-intercambio', 'Intercambio')
		 ) AS v(id, name)
		 ON CONFLICT (company_id, id) DO NOTHING;`,
	}
}
