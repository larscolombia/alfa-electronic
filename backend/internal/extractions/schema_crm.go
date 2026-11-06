package extractions

// crmTables declara las tablas del módulo CRM/acounts consultables. Todas son
// tablas existentes; aquí solo se describen columnas y relaciones de lectura.
func crmTables() []TableDef {
	const module = "crm"
	const moduleLabel = "CRM y clientes"

	receptionDateExpr := "CASE WHEN reception_year <> '' AND reception_month <> '' AND reception_day <> '' " +
		"THEN make_date(reception_year::int, reception_month::int, reception_day::int) END"

	return []TableDef{
		{
			Name: "crm_accounts", Label: "Cuentas comerciales",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "name", Label: "Nombre / Razón social", Kind: KindText},
				{Name: "company", Label: "Empresa", Kind: KindText},
				{Name: "nit", Label: "NIT", Kind: KindText},
				{Name: "lifecycle_status", Label: "Estado del ciclo", Kind: KindText},
				{Name: "zone", Label: "Zona", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "country", Label: "País", Kind: KindText},
				{Name: "email", Label: "Correo", Kind: KindText},
				{Name: "office_phone", Label: "Teléfono", Kind: KindText},
				{Name: "service", Label: "Servicio de interés", Kind: KindText},
				{Name: "assigned_employee", Label: "Empleado asignado", Kind: KindText},
				{Name: "prospect_value", Label: "Valor del prospecto", Kind: KindMoney},
				{Name: "credit_limit", Label: "Límite de crédito", Kind: KindMoney},
				{Name: "credit_consumed", Label: "Crédito consumido", Kind: KindMoney},
				{Name: "last_payment_date", Label: "Último pago", Kind: KindDate},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_account_contacts", Label: "Contactos de cuenta",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "name", Label: "Nombre", Kind: KindText},
				{Name: "role", Label: "Cargo", Kind: KindText},
				{Name: "email", Label: "Correo", Kind: KindText},
				{Name: "phone", Label: "Teléfono", Kind: KindText},
				{Name: "notes", Label: "Notas", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_account_branches", Label: "Sucursales de cuenta",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"id"},
			Columns: []ColumnDef{
				{Name: "name", Label: "Nombre", Kind: KindText},
				{Name: "contact_name", Label: "Contacto", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "country", Label: "País", Kind: KindText},
				{Name: "is_primary", Label: "Es principal", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_prospects", Label: "Prospectos",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "name", Label: "Nombre", Kind: KindText},
				{Name: "company", Label: "Empresa", Kind: KindText},
				{Name: "nit", Label: "NIT", Kind: KindText},
				{Name: "email", Label: "Correo", Kind: KindText},
				{Name: "mobile", Label: "Teléfono", Kind: KindText},
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "zone", Label: "Zona", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "country", Label: "País", Kind: KindText},
				{Name: "website", Label: "Sitio web", Kind: KindText},
				{Name: "office_phone", Label: "Teléfono oficina", Kind: KindText},
				{Name: "address", Label: "Dirección", Kind: KindText},
				{Name: "service", Label: "Servicio de interés", Kind: KindText},
				{Name: "prospect_value", Label: "Valor del prospecto", Kind: KindMoney},
				{Name: "quotations", Label: "Cotizaciones", Kind: KindNumber},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_prospect_contacts", Label: "Contactos de prospecto",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"id"},
			Columns: []ColumnDef{
				{Name: "name", Label: "Nombre", Kind: KindText},
				{Name: "role", Label: "Cargo", Kind: KindText},
				{Name: "email", Label: "Correo", Kind: KindText},
				{Name: "phone", Label: "Teléfono", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_clients", Label: "Clientes",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"company_id", "id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "nombre", Label: "Nombre", Kind: KindText},
				{Name: "empresa", Label: "Empresa", Kind: KindText},
				{Name: "nit", Label: "NIT", Kind: KindText},
				{Name: "correo", Label: "Correo", Kind: KindText},
				{Name: "estado", Label: "Estado", Kind: KindText},
				{Name: "zona", Label: "Zona", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "country", Label: "País", Kind: KindText},
				{Name: "website", Label: "Sitio web", Kind: KindText},
				{Name: "office_phone", Label: "Teléfono oficina", Kind: KindText},
				{Name: "address", Label: "Dirección", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_account_legacy_ids", Label: "Mapeo legacy de cuentas",
			ModuleSlug: module, ModuleLabel: moduleLabel,
			PrimaryKey: []string{"company_id", "legacy_type", "legacy_id"},
			Columns: []ColumnDef{
				{Name: "legacy_type", Label: "Tipo legacy", Kind: KindText},
				{Name: "legacy_id", Label: "ID legacy", Kind: KindText},
				{Name: "account_id", Label: "Cuenta", Kind: KindText},
			},
		},
		{
			Name: "crm_equipment_records", Label: "Recepciones de equipos",
			ModuleSlug: "tecnico", ModuleLabel: "Técnico / reparaciones",
			PrimaryKey: []string{"company_id", "id"}, Archived: true,
			Columns: []ColumnDef{
				{Name: "prospect_name", Label: "Cliente / Prospecto", Kind: KindText},
				{Name: "company_name", Label: "Empresa", Kind: KindText},
				{Name: "nit", Label: "NIT", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "reception_date", Label: "Fecha de recepción", Kind: KindDate, Expr: receptionDateExpr},
				{Name: "intake_method", Label: "Método de ingreso", Kind: KindText},
				{Name: "assigned_to", Label: "Técnico asignado", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
	}
}

// crmEquivalents declara los campos equivalentes entre Clientes y Prospectos:
// la misma información de negocio con distinto nombre físico en cada tabla.
// La recuperación bidireccional (COALESCE) solo aplica cuando ambas fuentes
// están unidas en el plan por su relación real (empresa + company_id), así
// que nunca se mezcla información de empresas distintas.
func crmEquivalents() []EquivalentField {
	return []EquivalentField{
		{TableA: "crm_clients", ColumnA: "nombre", TableB: "crm_prospects", ColumnB: "name"},
		{TableA: "crm_clients", ColumnA: "empresa", TableB: "crm_prospects", ColumnB: "company"},
		{TableA: "crm_clients", ColumnA: "nit", TableB: "crm_prospects", ColumnB: "nit"},
		{TableA: "crm_clients", ColumnA: "correo", TableB: "crm_prospects", ColumnB: "email"},
		{TableA: "crm_clients", ColumnA: "estado", TableB: "crm_prospects", ColumnB: "status"},
		{TableA: "crm_clients", ColumnA: "zona", TableB: "crm_prospects", ColumnB: "zone"},
		{TableA: "crm_clients", ColumnA: "city", TableB: "crm_prospects", ColumnB: "city"},
		{TableA: "crm_clients", ColumnA: "country", TableB: "crm_prospects", ColumnB: "country"},
		{TableA: "crm_clients", ColumnA: "website", TableB: "crm_prospects", ColumnB: "website"},
		{TableA: "crm_clients", ColumnA: "office_phone", TableB: "crm_prospects", ColumnB: "office_phone"},
		{TableA: "crm_clients", ColumnA: "address", TableB: "crm_prospects", ColumnB: "address"},
		{TableA: "crm_clients", ColumnA: "created_at", TableB: "crm_prospects", ColumnB: "created_at"},
	}
}

// crmEdges relaciones reales del dominio CRM. La relación Clientes↔Prospectos
// es por empresa (case-insensitive): prospect_id existe como FK pero ningún
// flujo lo escribe (insertClientWithProspect solo recibe ""), mientras que
// ConvertProspectToClient/findClientByEmpresa/ListClientRelatedContacts
// relacionan ambas tablas exactamente por LOWER(empresa)=LOWER(company).
func crmEdges() []RelationEdge {
	return []RelationEdge{
		{From: "crm_account_contacts", FromCols: []string{"account_id"}, To: "crm_accounts", ToCols: []string{"id"}},
		{From: "crm_account_branches", FromCols: []string{"account_id"}, To: "crm_accounts", ToCols: []string{"id"}},
		{From: "crm_prospect_contacts", FromCols: []string{"prospect_id"}, To: "crm_prospects", ToCols: []string{"id"}},
		{
			From: "crm_clients", FromCols: []string{"company_id", "empresa"},
			To: "crm_prospects", ToCols: []string{"company_id", "company"},
			NormalizeText: true,
			// Identificación inteligente (jerarquía C2–C5): además de empresa=company,
			// empareja registros de la MISMA entidad aunque su empresa tenga nombres
			// distintos, por NIT exacto o correo exacto —cada uno único en ambas
			// tablas— o por nombre completo normalizado si es único en ambos lados y
			// no hay contradicción de NIT/correo. Los valores ambiguos (repetidos en
			// una tabla) nunca se emparejan automáticamente; solo cambia la condición
			// del JOIN, sin alterar los datos originales.
			IdentityCriteria: []IdentityCriterion{
				{LeftCol: "nit", RightCol: "nit"},
				{LeftCol: "correo", RightCol: "email"},
				{LeftCol: "nombre", RightCol: "name", FullText: true, Contradictions: [][2]string{{"nit", "nit"}, {"correo", "email"}}},
			},
		},
		{From: "crm_equipment_records", FromCols: []string{"prospect_id"}, To: "crm_prospects", ToCols: []string{"id"}},
		// Puente legacy real: prospectos y clientes antiguos se importaron a
		// cuentas mediante crm_account_legacy_ids (legacy_type diferencia el
		// origen). Sin este puente, cuentas y prospectos no se podrían combinar.
		{
			From: "crm_prospects", FromCols: []string{"company_id", "id"},
			To: "crm_account_legacy_ids", ToCols: []string{"company_id", "legacy_id"},
			Const: []EdgeConst{{Col: "legacy_type", Value: "prospect"}},
		},
		{
			From: "crm_clients", FromCols: []string{"company_id", "id"},
			To: "crm_account_legacy_ids", ToCols: []string{"company_id", "legacy_id"},
			Const: []EdgeConst{{Col: "legacy_type", Value: "client"}},
		},
		{From: "crm_account_legacy_ids", FromCols: []string{"account_id"}, To: "crm_accounts", ToCols: []string{"id"}},
	}
}
