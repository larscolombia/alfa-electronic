package extractions

import (
	"errors"
	"fmt"
	"sort"
	"strings"
)

// registry es el catálogo declarativo en memoria: tablas existentes y las
// relaciones conocidas entre ellas. No hay esquema nuevo en la base de datos.
type registry struct {
	tables map[string]TableDef
	edges  []RelationEdge
}

func newRegistry() *registry {
	r := &registry{tables: make(map[string]TableDef)}
	for _, table := range crmTables() {
		r.tables[table.Name] = table
	}
	for _, table := range inventoryTables() {
		r.tables[table.Name] = table
	}
	for _, table := range financeTables() {
		r.tables[table.Name] = table
	}
	r.edges = append(r.edges, crmEdges()...)
	r.edges = append(r.edges, inventoryEdges()...)
	r.edges = append(r.edges, financeEdges()...)
	return r
}

func (r *registry) table(name string) (TableDef, bool) {
	table, ok := r.tables[name]
	return table, ok
}

// column devuelve la definición de una columna pública de una tabla.
func (r *registry) column(tableName, columnName string) (TableDef, ColumnDef, bool) {
	table, ok := r.table(tableName)
	if !ok {
		return TableDef{}, ColumnDef{}, false
	}
	for _, column := range table.Columns {
		if column.Name == columnName {
			return table, column, true
		}
	}
	return TableDef{}, ColumnDef{}, false
}

// modulesGroup lista los módulos (slug + label) con al menos una tabla.
func (r *registry) modulesGroup() map[string]string {
	modules := make(map[string]string)
	for _, table := range r.tables {
		modules[table.ModuleSlug] = table.ModuleLabel
	}
	return modules
}

// errUnconnectedTables se devuelve cuando la selección no forma un grafo conexo.
var errUnconnectedTables = errors.New("las tablas seleccionadas no tienen una cadena de relaciones directas")

// unconnectedError nombra las tablas que no se pudieron conectar.
type unconnectedError struct {
	tables []string
}

func (e *unconnectedError) Error() string {
	return fmt.Sprintf("%v: %v", errUnconnectedTables.Error(), e.tables)
}

func (e *unconnectedError) Unwrap() error { return errUnconnectedTables }

// sortStrings ordena un slice de cadenas en el lugar.
func sortStrings(values []string) {
	sort.Strings(values)
}

// sortTableCatalogs ordena tablas por nombre para un catálogo estable.
func sortTableCatalogs(tables []TableCatalog) {
	sort.Slice(tables, func(i, j int) bool { return tables[i].Name < tables[j].Name })
}

// sortedCopy devuelve una copia ordenada para mensajes estables al usuario.
func sortedCopy(values []string) []string {
	out := append([]string(nil), values...)
	sort.Strings(out)
	return out
}

// joinStrings une cadenas con un separador.
func joinStrings(values []string, separator string) string {
	return strings.Join(values, separator)
}
