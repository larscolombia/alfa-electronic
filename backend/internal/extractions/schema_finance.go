package extractions

// financeTables declara las tablas de finanzas, proveedores y ventas (cotizaciones).
func financeTables() []TableDef {
	const moduleFin = "finanzas"
	const labelFin = "Finanzas"
	const moduleProv = "proveedores"
	const labelProv = "Proveedores"
	const moduleVentas = "cotizaciones"
	const labelVentas = "Ventas (cotizaciones)"

	return []TableDef{
		{
			Name: "finance_invoices", Label: "Facturas",
			ModuleSlug: moduleFin, ModuleLabel: labelFin,
			PrimaryKey: []string{"id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "reference_code", Label: "Número de factura", Kind: KindText},
				{Name: "client_name", Label: "Cliente", Kind: KindText},
				{Name: "issue_date", Label: "Fecha de emisión", Kind: KindDate},
				{Name: "due_date", Label: "Fecha de vencimiento", Kind: KindDate},
				{Name: "currency_code", Label: "Moneda", Kind: KindText},
				{Name: "subtotal", Label: "Subtotal", Kind: KindMoney},
				{Name: "tax_total", Label: "Impuestos", Kind: KindMoney},
				{Name: "total", Label: "Total", Kind: KindMoney},
				{Name: "paid_amount", Label: "Valor pagado", Kind: KindMoney},
				{Name: "balance_amount", Label: "Saldo", Kind: KindMoney},
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "source", Label: "Origen", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "finance_payments", Label: "Pagos",
			ModuleSlug: moduleFin, ModuleLabel: labelFin,
			PrimaryKey: []string{"id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "code", Label: "Código", Kind: KindText},
				{Name: "invoice_number", Label: "Factura", Kind: KindText},
				{Name: "client_name", Label: "Cliente", Kind: KindText},
				{Name: "amount", Label: "Valor", Kind: KindMoney},
				{Name: "paid_at", Label: "Fecha de pago", Kind: KindDate},
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "payment_gateway", Label: "Medio de pago", Kind: KindText},
				{Name: "currency_code", Label: "Moneda", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "finance_accounts", Label: "Cuentas bancarias",
			ModuleSlug: moduleFin, ModuleLabel: labelFin,
			PrimaryKey: []string{"id"},
			Columns: []ColumnDef{
				{Name: "bank_name", Label: "Banco", Kind: KindText},
				{Name: "holder_name", Label: "Titular", Kind: KindText},
				{Name: "account_number", Label: "Número de cuenta", Kind: KindText},
				{Name: "account_type", Label: "Tipo", Kind: KindText},
				{Name: "product_type", Label: "Producto", Kind: KindText},
				{Name: "currency_code", Label: "Moneda", Kind: KindText},
			},
		},
		{
			Name: "finance_expenses", Label: "Gastos",
			ModuleSlug: moduleFin, ModuleLabel: labelFin,
			PrimaryKey: []string{"id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "item_name", Label: "Ítem", Kind: KindText},
				{Name: "concept", Label: "Concepto", Kind: KindText},
				{Name: "category", Label: "Categoría", Kind: KindText},
				{Name: "vendor", Label: "Proveedor", Kind: KindText},
				{Name: "employee", Label: "Empleado", Kind: KindText},
				{Name: "amount", Label: "Valor", Kind: KindMoney},
				{Name: "value_in_cop", Label: "Valor en COP", Kind: KindMoney},
				{Name: "currency", Label: "Moneda", Kind: KindText},
				{Name: "paid_at", Label: "Fecha de pago", Kind: KindDate},
				{Name: "created_by", Label: "Creado por", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "suppliers", Label: "Proveedores",
			ModuleSlug: moduleProv, ModuleLabel: labelProv,
			PrimaryKey: []string{"company_id", "id"},
			Columns: []ColumnDef{
				{Name: "supplier_number", Label: "Número de proveedor", Kind: KindText},
				{Name: "legal_name", Label: "Razón social", Kind: KindText},
				{Name: "tax_identification", Label: "Identificación fiscal", Kind: KindText},
				{Name: "city", Label: "Ciudad", Kind: KindText},
				{Name: "country", Label: "País", Kind: KindText},
				{Name: "sector", Label: "Sector", Kind: KindText},
				{Name: "default_contact", Label: "Contacto principal", Kind: KindText},
				{Name: "mobile_phone", Label: "Celular", Kind: KindText},
				{Name: "payment_terms", Label: "Términos de pago", Kind: KindText},
				{Name: "minimum_order", Label: "Pedido mínimo", Kind: KindMoney},
				{Name: "confidence_grade", Label: "Grado de confianza", Kind: KindText},
				{Name: "responsible_person", Label: "Responsable", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "supplier_orders", Label: "Órdenes de compra a proveedores",
			ModuleSlug: moduleProv, ModuleLabel: labelProv,
			PrimaryKey: []string{"company_id", "id"},
			Columns: []ColumnDef{
				{Name: "order_number", Label: "Número de orden", Kind: KindText},
				{Name: "customer_name", Label: "Cliente", Kind: KindText},
				{Name: "equipment", Label: "Equipo", Kind: KindText},
				{Name: "quantity", Label: "Cantidad", Kind: KindNumber},
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "urgency", Label: "Urgencia", Kind: KindText},
				{Name: "request_date", Label: "Fecha de solicitud", Kind: KindText},
				{Name: "requested_by", Label: "Solicitado por", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "crm_quotes", Label: "Cotizaciones",
			ModuleSlug: moduleVentas, ModuleLabel: labelVentas,
			PrimaryKey: []string{"company_id", "id"}, SoftDelete: true,
			Columns: []ColumnDef{
				{Name: "codigo", Label: "Código", Kind: KindText},
				{Name: "prospecto", Label: "Prospecto", Kind: KindText},
				{Name: "empresa", Label: "Empresa", Kind: KindText},
				{Name: "correo", Label: "Correo", Kind: KindText},
				{Name: "estado", Label: "Estado", Kind: KindText},
				{Name: "estado_cliente", Label: "Decisión del cliente", Kind: KindText},
				{Name: "moneda", Label: "Moneda", Kind: KindText},
				{Name: "subtotal", Label: "Subtotal", Kind: KindMoney},
				{Name: "tax_total", Label: "Impuestos", Kind: KindMoney},
				{Name: "total", Label: "Total", Kind: KindMoney},
				{Name: "descuento_valor", Label: "Descuento", Kind: KindMoney},
				{Name: "purchase_order_number", Label: "Orden de compra", Kind: KindText},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
	}
}

// financeEdges relaciones reales del dominio financiero y de proveedores.
func financeEdges() []RelationEdge {
	return []RelationEdge{
		{
			From: "finance_payments", FromCols: []string{"invoice_number"},
			To: "finance_invoices", ToCols: []string{"reference_code"},
		},
		{
			From: "finance_invoices", FromCols: []string{"bank_account_id"},
			To: "finance_accounts", ToCols: []string{"id"},
		},
		{
			From: "finance_payments", FromCols: []string{"bank_account_id"},
			To: "finance_accounts", ToCols: []string{"id"},
		},
		{
			From: "finance_expenses", FromCols: []string{"account_id"},
			To: "finance_accounts", ToCols: []string{"id"},
		},
		{
			From: "supplier_orders", FromCols: []string{"supplier_id"},
			To: "suppliers", ToCols: []string{"id"},
		},
		{
			From: "inventory_purchase_lines", FromCols: []string{"company_id", "supplier"},
			To: "suppliers", ToCols: []string{"company_id", "legal_name"},
		},
		{
			From: "purchase_requests", FromCols: []string{"company_id", "supplier"},
			To: "suppliers", ToCols: []string{"company_id", "legal_name"},
		},
	}
}
