package extractions

import (
	"fmt"
	"regexp"
	"strings"
)

const (
	defaultRowLimit = 1000
	maxRowLimit     = 5000
)

var numericPattern = regexp.MustCompile(`^-?\d+(\.\d+)?$`)
var datePattern = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)

func aliasOf(plan *joinPlan, table string) string {
	return fmt.Sprintf("t%d", plan.alias[table])
}

func quotedColumn(column ColumnDef) string {
	if column.Expr != "" {
		return "(" + column.Expr + ")"
	}
	return `"` + column.Name + `"`
}

// selectExpression proyecta una columna con alias "tabla.columna" para que el
// frontend pueda distinguir columnas homónimas de distintas tablas.
func selectExpression(alias string, table TableDef, column ColumnDef) string {
	return fmt.Sprintf("%s.%s AS %s", alias, quotedColumn(column), quoteAlias(table.Name+"."+column.Name))
}

func quoteAlias(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

// buildSelectSQL genera el SELECT principal: base + LEFT JOINs por relaciones
// declaradas + predicados de empresa, bajas y filtros del usuario.
func buildSelectSQL(r *registry, plan *joinPlan, req QueryRequest, limit int) (string, []any, error) {
	var sb strings.Builder
	args := make([]any, 0, 8)
	sb.WriteString("SELECT ")
	for i, ref := range req.Columns {
		table, column, ok := r.column(ref.Table, ref.Column)
		if !ok {
			return "", nil, fmt.Errorf("columna desconocida: %s.%s", ref.Table, ref.Column)
		}
		if i > 0 {
			sb.WriteString(", ")
		}
		sb.WriteString(selectExpression(aliasOf(plan, table.Name), table, column))
	}

	base := r.tables[plan.base]
	writeFrom(&sb, base, aliasOf(plan, base.Name))

	where, whereArgs, err := buildWhere(r, plan, req.Filters, len(args)+1)
	if err != nil {
		return "", nil, err
	}
	args = append(args, whereArgs...)

	writeJoins(&sb, r, plan)

	writeWhereClause(&sb, where)
	sb.WriteString(fmt.Sprintf(" LIMIT %d", limit+1)) // +1 para detectar truncamiento
	return sb.String(), args, nil
}

// buildTotalsSQL suma una columna numérica deduplicando por la PK de la tabla
// dueña: los joins 1:N no inflan los totales.
func buildTotalsSQL(r *registry, plan *joinPlan, req QueryRequest, ref FieldRef) (string, []any, error) {
	table, column, ok := r.column(ref.Table, ref.Column)
	if !ok {
		return "", nil, fmt.Errorf("columna de total desconocida: %s.%s", ref.Table, ref.Column)
	}
	if column.Kind != KindMoney && column.Kind != KindNumber {
		return "", nil, fmt.Errorf("el total de %s.%s requiere una columna numérica o monetaria", ref.Table, ref.Column)
	}

	ownerAlias := aliasOf(plan, table.Name)
	pkCols := make([]string, 0, len(table.PrimaryKey))
	distinctOn := make([]string, 0, len(table.PrimaryKey))
	orderBy := make([]string, 0, len(table.PrimaryKey))
	for _, pk := range table.PrimaryKey {
		pkCols = append(pkCols, ownerAlias+"."+quoteIdent(pk))
	}
	distinctOn = append(distinctOn, pkCols...)
	orderBy = append(orderBy, pkCols...)

	where, args, err := buildWhere(r, plan, req.Filters, 1)
	if err != nil {
		return "", nil, err
	}

	var sb strings.Builder
	sb.WriteString("SELECT COALESCE(SUM(dedup.val), 0) FROM (")
	sb.WriteString("SELECT DISTINCT ON (" + strings.Join(distinctOn, ", ") + ") ")
	sb.WriteString(fmt.Sprintf("%s.%s::double precision AS val", ownerAlias, quotedColumn(column)))

	base := r.tables[plan.base]
	writeFrom(&sb, base, aliasOf(plan, base.Name))
	writeJoins(&sb, r, plan)
	writeWhereClause(&sb, where)
	sb.WriteString(" ORDER BY " + strings.Join(orderBy, ", "))
	sb.WriteString(") dedup")
	return sb.String(), args, nil
}

// writeFrom escribe la tabla base como subconsulta pre-filtrada por empresa y
// bajas. Con FULL OUTER JOINs un WHERE sobre la base descartaría las filas no
// emparejadas del otro lado; al pre-filtrar aquí, ambos conjuntos sobreviven.
func writeFrom(sb *strings.Builder, table TableDef, alias string) {
	sb.WriteString(" FROM (SELECT * FROM " + quoteIdent(table.Name) + " WHERE company_id = $1")
	if table.SoftDelete {
		sb.WriteString(" AND soft_delete = false")
	}
	if table.Archived {
		sb.WriteString(" AND archived = false")
	}
	sb.WriteString(") AS " + alias)
}

// writeWhereClause escribe el WHERE solo cuando hay predicados (filtros del
// usuario); sin filtros no se emite, para no romper los FULL OUTER JOINs.
func writeWhereClause(sb *strings.Builder, where []string) {
	if len(where) == 0 {
		return
	}
	sb.WriteString(" WHERE " + strings.Join(where, " AND "))
}

// writeJoins escribe los JOINs del plan. Los pasos hacia tablas que el usuario
// seleccionó como fuente usan FULL OUTER JOIN con la tabla destino
// pre-filtrada (empresa y bajas) en una subconsulta: así los registros de
// AMBAS fuentes aparecen aunque no estén enlazados (Clientes + Prospectos).
// Los pasos hacia tablas intermedias (puentes) usan LEFT JOIN.
func writeJoins(sb *strings.Builder, r *registry, plan *joinPlan) {
	for _, step := range plan.steps {
		to := r.tables[step.toTable]
		on := make([]string, 0, len(step.edge.FromCols)+len(step.edge.Const))
		for i, fromCol := range step.edge.FromCols {
			on = append(on, fmt.Sprintf("%s.%s = %s.%s",
				aliasOf(plan, step.fromTable), quoteIdent(fromCol),
				aliasOf(plan, step.toTable), quoteIdent(step.edge.ToCols[i])))
		}
		constAlias := aliasOf(plan, step.toTable)
		if step.edge.ConstTable != "" {
			constAlias = aliasOf(plan, step.edge.ConstTable)
		}
		for _, constant := range step.edge.Const {
			on = append(on, fmt.Sprintf("%s.%s = %s", constAlias,
				quoteIdent(constant.Col), quoteLiteral(constant.Value)))
		}
		if step.fullOuter {
			sb.WriteString(fmt.Sprintf(" FULL OUTER JOIN (SELECT * FROM %s WHERE company_id = $1",
				quoteIdent(to.Name)))
			if to.SoftDelete {
				sb.WriteString(" AND soft_delete = false")
			}
			if to.Archived {
				sb.WriteString(" AND archived = false")
			}
			sb.WriteString(fmt.Sprintf(") AS %s ON %s", aliasOf(plan, to.Name), strings.Join(on, " AND ")))
			continue
		}
		// LEFT JOIN: empresa y bajas del lado destino van en el ON para no
		// descartar filas de la base que no tengan relación.
		on = append(on, fmt.Sprintf("%s.company_id = $1", aliasOf(plan, step.toTable)))
		if to.SoftDelete {
			on = append(on, aliasOf(plan, step.toTable)+".soft_delete = false")
		}
		if to.Archived {
			on = append(on, aliasOf(plan, step.toTable)+".archived = false")
		}
		sb.WriteString(fmt.Sprintf(" LEFT JOIN %s AS %s ON %s",
			quoteIdent(to.Name), aliasOf(plan, to.Name), strings.Join(on, " AND ")))
	}
}

// quoteLiteral escapa un valor como literal SQL de texto (simple comilla).
func quoteLiteral(value string) string {
	return `'` + strings.ReplaceAll(value, `'`, `''`) + `'`
}

// Caracteres con tilde/diacríticos que translate() convierte a su base.
const accentFrom = "áàäâÁÀÄÂéèëêÉÈËÊíìïîÍÌÏÎóòöôÓÒÖÔúùüûÚÙÜÛñÑçÇ"
const accentTo = "aaaaAAAAeeeeEEEEiiiiIIIIooooOOOOuuuuUUUUnNcc"

// normalizedText envuelve una expresión SQL para comparar texto de forma
// flexible: minúsculas, sin tildes, puntuación convertida en espacio y
// espacios colapsados. Pure SQL (translate + regexp_replace): sin extensiones
// de PostgreSQL y sin modificar los datos almacenados.
func normalizedText(expr string) string {
	return "trim(both ' ' from regexp_replace(regexp_replace(translate(lower(" + expr + "::text), " +
		quoteLiteral(accentFrom) + ", " + quoteLiteral(accentTo) +
		`), '[^a-z0-9]+', ' ', 'g'), '\s+', ' ', 'g'))`
}

// buildWhere arma únicamente los predicados de los filtros del usuario
// validados contra el registro (nunca se interpola SQL del cliente). La
// empresa y las bajas se resuelven en las subconsultas de FROM/JOIN para no
// romper los FULL OUTER JOINs. El argumento $1 siempre es el company_id.
func buildWhere(r *registry, plan *joinPlan, filters []Filter, firstArg int) ([]string, []any, error) {
	where := make([]string, 0, len(filters))
	args := []any{nil} // placeholder: el company_id real lo pone el servicio

	for _, filter := range filters {
		predicate, values, err := buildFilterPredicate(r, plan, filter, firstArg+len(args))
		if err != nil {
			return nil, nil, err
		}
		if predicate == "" {
			continue
		}
		where = append(where, predicate)
		args = append(args, values...)
	}
	args[0] = "" // el servicio reemplaza el primer argumento por el company_id
	return where, args, nil
}

func buildFilterPredicate(r *registry, plan *joinPlan, filter Filter, firstArg int) (string, []any, error) {
	table, column, ok := r.column(filter.Table, filter.Column)
	if !ok {
		return "", nil, fmt.Errorf("filtro sobre columna desconocida: %s.%s", filter.Table, filter.Column)
	}
	if _, selected := plan.alias[table.Name]; !selected {
		return "", nil, fmt.Errorf("el filtro usa la tabla %s que no está seleccionada", table.Name)
	}

	expr := aliasOf(plan, table.Name) + "." + quotedColumn(column)
	switch filter.Op {
	case "equals", "different":
		value := strings.TrimSpace(filter.Value)
		if value == "" {
			return "", nil, nil
		}
		operator := "="
		if filter.Op == "different" {
			operator = "<>"
		}
		return comparisonPredicate(expr, operator, column.Kind, firstArg), []any{typedValue(column.Kind, value)}, nil
	case "contains":
		value := strings.TrimSpace(filter.Value)
		if value == "" {
			return "", nil, nil
		}
		// "Contiene" flexible: normaliza acentos, puntuación y espacios en
		// ambos lados (sin tocar los datos almacenados). Ver normalizedText.
		return fmt.Sprintf("%s LIKE '%%' || %s || '%%'",
			normalizedText(expr), normalizedText(fmt.Sprintf("$%d", firstArg))), []any{value}, nil
	case "between":
		parts := make([]string, 0, 2)
		values := make([]any, 0, 2)
		if from := strings.TrimSpace(filter.From); from != "" {
			if !datePattern.MatchString(from) {
				return "", nil, fmt.Errorf("fecha 'desde' inválida en %s.%s: %s", table.Name, column.Name, from)
			}
			parts = append(parts, fmt.Sprintf("%s::date >= $%d::date", expr, firstArg+len(values)))
			values = append(values, from)
		}
		if to := strings.TrimSpace(filter.To); to != "" {
			if !datePattern.MatchString(to) {
				return "", nil, fmt.Errorf("fecha 'hasta' inválida en %s.%s: %s", table.Name, column.Name, to)
			}
			parts = append(parts, fmt.Sprintf("%s::date <= $%d::date", expr, firstArg+len(values)))
			values = append(values, to)
		}
		if len(parts) == 0 {
			return "", nil, nil
		}
		return "(" + strings.Join(parts, " AND ") + ")", values, nil
	default:
		return "", nil, fmt.Errorf("operador de filtro no soportado: %s", filter.Op)
	}
}

// comparisonPredicate adapta el operador al tipo para no comparar texto contra
// números (p. ej. '9' > '10' en comparación de cadenas).
func comparisonPredicate(expr, operator string, kind ColumnKind, argIndex int) string {
	switch kind {
	case KindMoney, KindNumber:
		return fmt.Sprintf("%s %s $%d::double precision", expr, operator, argIndex)
	case KindDate:
		return fmt.Sprintf("%s::date %s $%d::date", expr, operator, argIndex)
	default:
		return fmt.Sprintf("%s::text %s $%d", expr, operator, argIndex)
	}
}

// typedValue valida el formato del valor según el tipo antes de parametrizarlo.
func typedValue(kind ColumnKind, value string) any {
	if (kind == KindMoney || kind == KindNumber) && numericPattern.MatchString(value) {
		return value
	}
	return value
}

func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}
