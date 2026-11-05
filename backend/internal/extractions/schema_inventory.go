package extractions

// inventoryTables declara las tablas de inventario y compras consultables.
func inventoryTables() []TableDef {
	const moduleInv = "inventario"
	const labelInv = "Inventario"
	const moduleCompras = "compras"
	const labelCompras = "Compras"

	return []TableDef{
		{
			Name: "inventory_references", Label: "Fichas de stock",
			ModuleSlug: moduleInv, ModuleLabel: labelInv,
			PrimaryKey: []string{"company_id", "reference"},
			Columns: []ColumnDef{
				{Name: "reference", Label: "Referencia", Kind: KindText},
				{Name: "internal_code", Label: "Código interno", Kind: KindText},
				{Name: "manufacturer_reference", Label: "Referencia fabricante", Kind: KindText},
				{Name: "designation", Label: "Designación", Kind: KindText},
				{Name: "family", Label: "Familia", Kind: KindText},
				{Name: "brand", Label: "Marca", Kind: KindText},
				{Name: "location", Label: "Ubicación", Kind: KindText},
				{Name: "unit_measure", Label: "Unidad de medida", Kind: KindText},
				{Name: "preferred_supplier_name", Label: "Proveedor preferido", Kind: KindText},
				{Name: "current_stock", Label: "Stock actual", Kind: KindNumber},
				{Name: "min_stock", Label: "Stock mínimo", Kind: KindNumber},
				{Name: "target_stock", Label: "Stock objetivo", Kind: KindNumber},
				{Name: "lead_time_days", Label: "Plazo de entrega (días)", Kind: KindNumber},
				{Name: "created_at", Label: "Fecha de registro", Kind: KindDate},
			},
		},
		{
			Name: "inventory_movements", Label: "Movimientos de inventario",
			ModuleSlug: moduleInv, ModuleLabel: labelInv,
			PrimaryKey: []string{"company_id", "id"},
			Columns: []ColumnDef{
				{Name: "type", Label: "Tipo", Kind: KindText},
				{Name: "reference", Label: "Referencia", Kind: KindText},
				{Name: "quantity", Label: "Cantidad", Kind: KindNumber},
				{Name: "reason", Label: "Motivo", Kind: KindText},
				{Name: "work_order", Label: "Orden de trabajo", Kind: KindText},
				{Name: "movement_category", Label: "Categoría", Kind: KindText},
				{Name: "requested_by", Label: "Solicitado por", Kind: KindText},
				{Name: "requested_at", Label: "Fecha del movimiento", Kind: KindDate},
			},
		},
		{
			Name: "inventory_purchase_lines", Label: "Líneas de compra",
			ModuleSlug: moduleCompras, ModuleLabel: labelCompras,
			PrimaryKey: []string{"company_id", "id"},
			Columns: []ColumnDef{
				{Name: "reference", Label: "Referencia", Kind: KindText},
				{Name: "description", Label: "Descripción", Kind: KindText},
				{Name: "supplier", Label: "Proveedor", Kind: KindText},
				{Name: "quantity", Label: "Cantidad", Kind: KindNumber},
				{Name: "received_quantity", Label: "Cantidad recibida", Kind: KindNumber},
				{Name: "expected_date", Label: "Fecha esperada", Kind: KindText},
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "approval_status", Label: "Estado de aprobación", Kind: KindText},
				{Name: "generated_by", Label: "Generado por", Kind: KindText},
				{Name: "generated_at", Label: "Fecha de generación", Kind: KindDate},
			},
		},
		{
			Name: "purchase_requests", Label: "Solicitudes de compra",
			ModuleSlug: moduleCompras, ModuleLabel: labelCompras,
			PrimaryKey: []string{"company_id", "id"},
			Columns: []ColumnDef{
				{Name: "reference", Label: "Referencia", Kind: KindText},
				{Name: "description", Label: "Descripción", Kind: KindText},
				{Name: "supplier", Label: "Proveedor", Kind: KindText},
				{Name: "quantity", Label: "Cantidad", Kind: KindNumber},
				{Name: "estimated_cost", Label: "Costo estimado", Kind: KindMoney},
				{Name: "lead_time_days", Label: "Plazo (días)", Kind: KindNumber},
				{Name: "urgency", Label: "Urgencia", Kind: KindText},
				{Name: "status", Label: "Estado", Kind: KindText},
				{Name: "requested_by", Label: "Solicitado por", Kind: KindText},
				{Name: "requested_at", Label: "Fecha de solicitud", Kind: KindDate},
			},
		},
	}
}

// inventoryEdges relaciones reales: referencia compuesta por company_id y, en
// el caso de compras, la cadena supplier_orders que ya existe en el esquema.
func inventoryEdges() []RelationEdge {
	return []RelationEdge{
		{
			From: "inventory_movements",
			FromCols: []string{"company_id", "reference"},
			To: "inventory_references", ToCols: []string{"company_id", "reference"},
		},
		{
			From: "inventory_purchase_lines",
			FromCols: []string{"company_id", "reference"},
			To: "inventory_references", ToCols: []string{"company_id", "reference"},
		},
		{
			From: "inventory_purchase_lines",
			FromCols: []string{"linked_order_id"},
			To: "supplier_orders", ToCols: []string{"id"},
		},
	}
}
