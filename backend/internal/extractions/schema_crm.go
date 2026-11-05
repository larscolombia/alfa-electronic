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
				{Name: "source", Label: "Fuente", Kind: KindText},
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
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "zone", Label: "Zona", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "source", Label: "Fuente", Kind: KindText},
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

// crmEdges relaciones reales del dominio CRM (FK declaradas o índices existentes).
func crmEdges() []RelationEdge {
	return []RelationEdge{
		{From: "crm_account_contacts", FromCols: []string{"account_id"}, To: "crm_accounts", ToCols: []string{"id"}},
		{From: "crm_account_branches", FromCols: []string{"account_id"}, To: "crm_accounts", ToCols: []string{"id"}},
		{From: "crm_prospect_contacts", FromCols: []string{"prospect_id"}, To: "crm_prospects", ToCols: []string{"id"}},
		{From: "crm_clients", FromCols: []string{"prospect_id"}, To: "crm_prospects", ToCols: []string{"id"}},
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
