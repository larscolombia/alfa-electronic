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
	tables      map[string]TableDef
	edges       []RelationEdge
	equivalents []EquivalentField
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
	r.equivalents = validEquivalents(r, crmEquivalents())
	return r
}

// validEquivalents conserva solo pares cuyas columnas existen en el catálogo
// de ambas tablas: el registro es la fuente de verdad de las equivalencias.
func validEquivalents(r *registry, pairs []EquivalentField) []EquivalentField {
	valid := make([]EquivalentField, 0, len(pairs))
	for _, pair := range pairs {
		if _, _, ok := r.column(pair.TableA, pair.ColumnA); !ok {
			continue
		}
		if _, _, ok := r.column(pair.TableB, pair.ColumnB); !ok {
			continue
		}
		valid = append(valid, pair)
	}
	return valid
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

// equivalent devuelve el par de equivalencia que contiene la columna dada,
// sin importar el lado (busca en A y en B). Orden-independiente.
func (r *registry) equivalent(tableName, columnName string) (EquivalentField, bool) {
	for _, pair := range r.equivalents {
		if pair.TableA == tableName && pair.ColumnA == columnName {
			return pair, true
		}
		if pair.TableB == tableName && pair.ColumnB == columnName {
			return pair, true
		}
	}
	return EquivalentField{}, false
}

// equivalentOther devuelve tabla y columna del otro lado del par.
func equivalentOther(pair EquivalentField, tableName, columnName string) (string, string) {
	if pair.TableA == tableName && pair.ColumnA == columnName {
		return pair.TableB, pair.ColumnB
	}
	return pair.TableA, pair.ColumnA
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
