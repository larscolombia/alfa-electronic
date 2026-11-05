package extractions

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// CanViewModule chequea si un rol puede "ver" un módulo ACL. Lo inyecta el
// paquete acl desde main.go para no crear una dependencia circular.
type CanViewModule func(ctx context.Context, companyID, role, moduleSlug string) (bool, error)

type Service struct {
	db      *sql.DB
	reg     *registry
	canView CanViewModule
}

func NewService(db *sql.DB, canView CanViewModule) *Service {
	return &Service{db: db, reg: newRegistry(), canView: canView}
}

// Catalog lista módulos y tablas visibles para el rol. Solo se exponen tablas
// de módulos donde el rol tiene permiso de "ver" (doble chequeo ACL).
func (s *Service) Catalog(ctx context.Context, companyID, role string) ([]ModuleCatalog, error) {
	modules := s.reg.modulesGroup()
	slugs := make([]string, 0, len(modules))
	for slug := range modules {
		slugs = append(slugs, slug)
	}
	sortStrings(slugs)

	out := make([]ModuleCatalog, 0, len(slugs))
	for _, slug := range slugs {
		allowed, err := s.canView(ctx, companyID, role, slug)
		if err != nil {
			return nil, fmt.Errorf("no se pudieron evaluar permisos del módulo %s: %w", slug, err)
		}
		if !allowed {
			continue
		}
		out = append(out, ModuleCatalog{
			Slug:  slug,
			Label: modules[slug],
			Tables: s.tablesForModule(slug),
		})
	}
	return out, nil
}

func (s *Service) tablesForModule(slug string) []TableCatalog {
	tables := make([]TableCatalog, 0)
	for name, table := range s.reg.tables {
		if table.ModuleSlug != slug {
			continue
		}
		columns := make([]ColumnCatalog, 0, len(table.Columns))
		for _, column := range table.Columns {
			columns = append(columns, ColumnCatalog{Name: column.Name, Label: column.Label, Kind: string(column.Kind)})
		}
		tables = append(tables, TableCatalog{Name: name, Label: table.Label, Module: table.ModuleLabel, Columns: columns})
	}
	sortTableCatalogs(tables)
	return tables
}

// Query ejecuta la extracción personalizada validando permisos por tabla.
func (s *Service) Query(ctx context.Context, companyID, role string, req QueryRequest) (*QueryResponse, error) {
	if len(req.Tables) == 0 {
		return nil, fmt.Errorf("selecciona al menos una tabla")
	}
	if len(req.Columns) == 0 {
		return nil, fmt.Errorf("selecciona al menos una columna")
	}

	// Doble chequeo: cada tabla origen exige "ver" sobre su módulo.
	forbidden := make([]string, 0)
	for _, name := range req.Tables {
		table, ok := s.reg.table(name)
		if !ok {
			return nil, fmt.Errorf("tabla desconocida: %s", name)
		}
		allowed, err := s.canView(ctx, companyID, role, table.ModuleSlug)
		if err != nil {
			return nil, fmt.Errorf("no se pudieron evaluar permisos del módulo %s: %w", table.ModuleSlug, err)
		}
		if !allowed {
			forbidden = append(forbidden, table.ModuleLabel)
		}
	}
	if len(forbidden) > 0 {
		return nil, &ForbiddenError{Modules: sortedCopy(forbidden)}
	}

	plan, err := buildJoinPlan(s.reg, req.Tables)
	if err != nil {
		return nil, err
	}

	limit := req.Limit
	if limit <= 0 {
		limit = defaultRowLimit
	}
	if limit > maxRowLimit {
		limit = maxRowLimit
	}

	querySQL, args, err := buildSelectSQL(s.reg, plan, req, limit)
	if err != nil {
		return nil, err
	}
	args[0] = companyID

	rows, err := s.db.QueryContext(ctx, querySQL, args...)
	if err != nil {
		return nil, fmt.Errorf("no se pudo ejecutar la consulta: %w", err)
	}
	result, truncated, err := scanRows(rows, req.Columns, limit)
	rows.Close()
	if err != nil {
		return nil, err
	}

	totals, err := s.runTotals(ctx, companyID, plan, req)
	if err != nil {
		return nil, err
	}

	return &QueryResponse{
		Columns:   columnsCatalog(s.reg, req.Columns),
		Rows:      result,
		Totals:    totals,
		RowCount:  len(result),
		Truncated: truncated,
	}, nil
}

// runTotals calcula cada suma pedida sobre el mismo grafo filtrado, con
// deduplicación por PK de la tabla dueña (ver buildTotalsSQL).
func (s *Service) runTotals(ctx context.Context, companyID string, plan *joinPlan, req QueryRequest) ([]TotalResult, error) {
	totals := make([]TotalResult, 0, len(req.Totals))
	for _, ref := range req.Totals {
		_, column, ok := s.reg.column(ref.Table, ref.Column)
		if !ok {
			return nil, fmt.Errorf("columna de total desconocida: %s.%s", ref.Table, ref.Column)
		}
		totalSQL, args, err := buildTotalsSQL(s.reg, plan, req, ref)
		if err != nil {
			return nil, err
		}
		args[0] = companyID

		var sum float64
		if err := s.db.QueryRowContext(ctx, totalSQL, args...).Scan(&sum); err != nil {
			return nil, fmt.Errorf("no se pudo calcular el total de %s.%s: %w", ref.Table, ref.Column, err)
		}
		totals = append(totals, TotalResult{
			Table:  ref.Table,
			Column: ref.Column,
			Label:  column.Label,
			Kind:   string(column.Kind),
			Sum:    sum,
		})
	}
	return totals, nil
}

// ForbiddenError se devuelve cuando el rol no tiene "ver" en algún módulo origen.
type ForbiddenError struct {
	Modules []string
}

func (e *ForbiddenError) Error() string {
	return "el rol no tiene permiso de consultar los módulos: " + joinStrings(e.Modules, ", ")
}

// scanRows convierte el resultado a mapas "tabla.columna" -> valor. Se pidió
// limit+1 filas: la fila extra indica truncamiento y se descarta.
func scanRows(rows *sql.Rows, columns []FieldRef, limit int) ([]map[string]any, bool, error) {
	names := make([]string, 0, len(columns))
	for _, ref := range columns {
		names = append(names, ref.Table+"."+ref.Column)
	}

	result := make([]map[string]any, 0, limit)
	truncated := false
	for rows.Next() {
		if len(result) >= limit {
			truncated = true
			break
		}
		values := make([]any, len(names))
		targets := make([]any, len(names))
		for i := range values {
			targets[i] = &values[i]
		}
		if err := rows.Scan(targets...); err != nil {
			return nil, false, fmt.Errorf("no se pudieron leer los resultados: %w", err)
		}
		row := make(map[string]any, len(names))
		for i, name := range names {
			row[name] = normalizeValue(values[i])
		}
		result = append(result, row)
	}
	if err := rows.Err(); err != nil {
		return nil, false, fmt.Errorf("no se pudieron leer los resultados: %w", err)
	}

	return result, truncated, nil
}

// normalizeValue convierte tipos del driver a valores JSON amigables.
func normalizeValue(value any) any {
	switch v := value.(type) {
	case nil:
		return nil
	case []byte:
		return string(v)
	case time.Time:
		return v.Format("2006-01-02")
	default:
		return v
	}
}

func columnsCatalog(r *registry, refs []FieldRef) []ColumnCatalog {
	out := make([]ColumnCatalog, 0, len(refs))
	for _, ref := range refs {
		if _, column, ok := r.column(ref.Table, ref.Column); ok {
			out = append(out, ColumnCatalog{
				Name:  ref.Table + "." + ref.Column,
				Label: column.Label,
				Kind:  string(column.Kind),
			})
		}
	}
	return out
}
