package database

// migrationStatementsEquipmentCatalog (Fase 6, ítems 1-2): los maestros de
// equipos dejan de vivir en el navegador.
//
// Antes el catálogo (familias, modelos industriales, tipos de servicio y
// ubicaciones/estanterías) salía de los DEFAULT_* hardcodeados en
// company-equipment-config.store.ts bajo la clave de localStorage
// "adminux.company.equipment.catalog.v1". Tres consecuencias: era por
// navegador (cada usuario veía el suyo), se perdía al limpiar caché, y el CRUD
// que lo edita (CompanyEquipmentConfigComponent) no tenía ruta registrada en
// ningún *.routes.ts, así que en la práctica NADIE podía agregar un modelo.
// Prueba: el 100% de los equipmentModelId guardados en crm_equipment_records
// eran uno de los 3 modelos demo.
//
// La siembra del final NO inventa catálogo para empresas nuevas: replica los
// DEFAULT_* sólo en las empresas que YA tienen recepciones apuntando a esos
// ids, para que esos registros no queden con una referencia colgando. Una
// empresa sin recepciones arranca con el catálogo vacío y lo carga desde
// Config. Equipos.
//
// De paso le da sentido al ALTER TABLE huérfano de
// migrations_crm_equipment_quotes.go (is_industrial sobre una tabla que no
// existía).
func migrationStatementsEquipmentCatalog() []string {
	return []string{
		`CREATE TABLE IF NOT EXISTS company_equipment_families (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE TABLE IF NOT EXISTS company_equipment_models (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			family_id TEXT NOT NULL DEFAULT '',
			brand VARCHAR(180) NOT NULL DEFAULT '',
			model_type VARCHAR(180) NOT NULL DEFAULT '',
			series VARCHAR(180) NOT NULL DEFAULT '',
			is_industrial BOOLEAN NOT NULL DEFAULT true,
			active BOOLEAN NOT NULL DEFAULT true,
			notes TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE TABLE IF NOT EXISTS company_equipment_service_types (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE TABLE IF NOT EXISTS company_equipment_locations (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			name VARCHAR(180) NOT NULL DEFAULT '',
			description TEXT NOT NULL DEFAULT '',
			active BOOLEAN NOT NULL DEFAULT true,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (company_id, id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_company_equipment_models_family
			ON company_equipment_models(company_id, family_id);`,
		`CREATE INDEX IF NOT EXISTS idx_company_equipment_models_active
			ON company_equipment_models(company_id, active);`,

		// ── Siembra condicionada: sólo empresas con recepciones existentes ──
		`INSERT INTO company_equipment_families (company_id, id, name, description)
		 SELECT c.company_id, v.id, v.name, v.description
		 FROM (SELECT DISTINCT company_id FROM crm_equipment_records) c
		 CROSS JOIN (VALUES
			('family-servomotores', 'Servomotores', 'Equipos servo y motion control para maquinaria industrial.'),
			('family-variadores', 'Variadores de velocidad', 'Drives AC/DC para control de motores.'),
			('family-plc', 'PLC', 'Controladores lógicos programables y CPUs industriales.')
		 ) AS v(id, name, description)
		 ON CONFLICT (company_id, id) DO NOTHING;`,
		`INSERT INTO company_equipment_models (company_id, id, family_id, brand, model_type, series, is_industrial, active, notes)
		 SELECT c.company_id, v.id, v.family_id, v.brand, v.model_type, v.series, v.is_industrial, v.active, v.notes
		 FROM (SELECT DISTINCT company_id FROM crm_equipment_records) c
		 CROSS JOIN (VALUES
			('model-yaskawa-sgm7j', 'family-servomotores', 'Yaskawa', 'Servomotor', 'SGM7J', true, true,
				'Modelo frecuente en líneas de empaque y ejes de posicionamiento.'),
			('model-siemens-g120', 'family-variadores', 'Siemens', 'Variador', 'SINAMICS G120', true, true,
				'Variador modular para bombas, ventilación y bandas.'),
			('model-allenbradley-compactlogix', 'family-plc', 'Allen-Bradley', 'PLC', 'CompactLogix 5380', true, true,
				'CPU compacta para celdas de manufactura y control distribuido.')
		 ) AS v(id, family_id, brand, model_type, series, is_industrial, active, notes)
		 ON CONFLICT (company_id, id) DO NOTHING;`,
		`INSERT INTO company_equipment_service_types (company_id, id, name, description)
		 SELECT c.company_id, v.id, v.name, v.description
		 FROM (SELECT DISTINCT company_id FROM crm_equipment_records) c
		 CROSS JOIN (VALUES
			('service-reparacion', 'Reparación', 'Diagnóstico, reparación y recuperación funcional del equipo.'),
			('service-venta', 'Venta', 'Suministro o reemplazo comercial del equipo o repuesto.'),
			('service-manufactura', 'Manufactura', 'Fabricación o integración de solución/equipo a medida.'),
			('service-servicio-sitio', 'Servicio en sitio', 'Atención técnica o intervención directamente en planta o instalación del cliente.')
		 ) AS v(id, name, description)
		 ON CONFLICT (company_id, id) DO NOTHING;`,
		`INSERT INTO company_equipment_locations (company_id, id, name, description)
		 SELECT c.company_id, v.id, v.name, v.description
		 FROM (SELECT DISTINCT company_id FROM crm_equipment_records) c
		 CROSS JOIN (VALUES
			('location-interior-1', 'Interior 1', 'Área interior de almacenamiento 1.'),
			('location-interior-2', 'Interior 2', 'Área interior de almacenamiento 2.'),
			('location-interior-3', 'Interior 3', 'Área interior de almacenamiento 3.'),
			('location-estanteria', 'Estantería', 'Estantería principal para equipos recibidos y accesorios.')
		 ) AS v(id, name, description)
		 ON CONFLICT (company_id, id) DO NOTHING;`,
	}
}
