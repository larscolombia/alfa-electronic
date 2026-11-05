package extractions

// ColumnKind clasifica una columna para el frontend (filtros y totales).
type ColumnKind string

const (
	KindText   ColumnKind = "text"
	KindNumber ColumnKind = "number"
	KindMoney  ColumnKind = "money"
	KindDate   ColumnKind = "date"
)

// ColumnDef describe una columna consultable de una tabla existente.
// Expr permite columnas calculadas (p. ej. armar la fecha de recepción a
// partir de reception_day/month/year); Name siempre es la clave pública.
type ColumnDef struct {
	Name  string
	Label string
	Kind  ColumnKind
	Expr  string
}

// TableDef describe una tabla existente consultable por la extracción
// personalizada. No crea ni replica nada: solo declara metadatos de lectura.
type TableDef struct {
	Name        string
	Label       string
	ModuleSlug  string
	ModuleLabel string
	PrimaryKey  []string
	SoftDelete  bool // tiene columna soft_delete: se excluyen las dadas de baja
	Archived    bool // crm_equipment_records usa archived en lugar de soft_delete
	Columns     []ColumnDef
}

// EdgeConst fija una columna de la arista a un valor constante en el JOIN
// (p. ej. crm_account_legacy_ids.legacy_type = 'prospect').
type EdgeConst struct {
	Col   string
	Value string
}

// RelationEdge es una relación real y conocida entre dos tablas existentes.
// Los pares de columnas se igualan en el JOIN junto con company_id; Const
// agrega condiciones constantes (puentes como legacy_ids) sobre la tabla
// ConstTable (el lado To declarado; lo rellena el planificador al orientar).
type RelationEdge struct {
	From       string
	FromCols   []string
	To         string
	ToCols     []string
	Const      []EdgeConst
	ConstTable string
}

// FieldRef referencia una columna concreta de una tabla.
type FieldRef struct {
	Table  string `json:"table"`
	Column string `json:"column"`
}

// Filter es un predicado sobre una columna. Op: equals | contains | different | between.
type Filter struct {
	Table  string `json:"table"`
	Column string `json:"column"`
	Op     string `json:"op"`
	Value  string `json:"value,omitempty"`
	From   string `json:"from,omitempty"`
	To     string `json:"to,omitempty"`
}

// QueryRequest es la consulta personalizada enviada por el frontend.
type QueryRequest struct {
	Tables  []string   `json:"tables"`
	Columns []FieldRef `json:"columns"`
	Filters []Filter   `json:"filters"`
	Totals  []FieldRef `json:"totals"`
	Limit   int        `json:"limit"`
}

// ColumnCatalog expone una columna al frontend.
type ColumnCatalog struct {
	Name  string `json:"name"`
	Label string `json:"label"`
	Kind  string `json:"kind"`
}

// TableCatalog expone una tabla y sus columnas al frontend.
type TableCatalog struct {
	Name    string          `json:"name"`
	Label   string          `json:"label"`
	Module  string          `json:"module"`
	Columns []ColumnCatalog `json:"columns"`
}

// ModuleCatalog agrupa las tablas visibles de un módulo.
type ModuleCatalog struct {
	Slug   string         `json:"slug"`
	Label  string         `json:"label"`
	Tables []TableCatalog `json:"tables"`
}

// TotalResult es la suma de una columna numérica sobre el resultado filtrado.
type TotalResult struct {
	Table  string  `json:"table"`
	Column string  `json:"column"`
	Label  string  `json:"label"`
	Kind   string  `json:"kind"`
	Sum    float64 `json:"sum"`
}

// QueryResponse entrega filas combinadas y totales en un mismo resultado.
type QueryResponse struct {
	Columns   []ColumnCatalog  `json:"columns"`
	Rows      []map[string]any `json:"rows"`
	Totals    []TotalResult    `json:"totals"`
	RowCount  int              `json:"rowCount"`
	Truncated bool             `json:"truncated"`
}
