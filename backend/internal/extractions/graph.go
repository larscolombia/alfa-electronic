package extractions

import "fmt"

// joinStep une una tabla ya presente en el plan con una tabla nueva usando
// una relación declarada. fromAlias/fromTable describen el lado conocido.
// fullOuter preserva las filas no emparejadas del lado destino: se usa cuando
// el destino es una fuente que el usuario seleccionó explícitamente (p. ej.
// Clientes + Prospectos deben mostrar AMBOS conjuntos, no solo los enlazados).
type joinStep struct {
	fromTable string
	fromAlias int
	edge      RelationEdge
	toTable   string
	toAlias   int
	fullOuter bool
}

// joinPlan es el árbol de joins validado: base + pasos LEFT JOIN en orden.
type joinPlan struct {
	base   string
	order  []string // tablas en orden de incorporación (base primero, incluye intermedias)
	alias  map[string]int
	steps  []joinStep
}

// buildJoinPlan conecta las tablas seleccionadas con un árbol mínimo sobre el
// grafo completo de relaciones: la ruta puede pasar por tablas intermedias no
// seleccionadas (p. ej. crm_account_legacy_ids une cuentas y prospectos), pero
// nunca agrega tablas que no conecten seleccionadas (evita fan-out innecesario
// y filas duplicadas). Si alguna seleccionada queda fuera del árbol, devuelve
// un *unconnectedError listándola: no se permiten uniones arbitrarias.
func buildJoinPlan(r *registry, selected []string) (*joinPlan, error) {
	if len(selected) == 0 {
		return nil, fmt.Errorf("selecciona al menos una tabla")
	}
	for _, name := range selected {
		if _, ok := r.table(name); !ok {
			return nil, fmt.Errorf("tabla desconocida: %s", name)
		}
	}

	base := selected[0]
	plan := &joinPlan{
		base:  base,
		alias: map[string]int{base: 0},
		order: []string{base},
	}
	inTree := map[string]bool{base: true}
	selectedSet := make(map[string]bool, len(selected))
	for _, name := range selected {
		selectedSet[name] = true
	}
	nextAlias := 1

	// Prim sobre las seleccionadas: en cada ronda se une la tabla seleccionada
	// más cercana (BFS multi-fuente) con su camino de aristas orientadas.
	for selectedInTree(selected, inTree) < len(selected) {
		target, path := shortestPathToSelected(r, plan.order, selected, inTree)
		if target == "" {
			return nil, &unconnectedError{tables: sortedCopy(missingSelected(selected, inTree))}
		}
		for _, edge := range path {
			if inTree[edge.To] {
				continue
			}
			inTree[edge.To] = true
			plan.alias[edge.To] = nextAlias
			plan.steps = append(plan.steps, joinStep{
				fromTable: edge.From, fromAlias: plan.alias[edge.From],
				edge: edge, toTable: edge.To, toAlias: nextAlias,
				fullOuter: selectedSet[edge.To],
			})
			plan.order = append(plan.order, edge.To)
			nextAlias++
		}
	}

	return plan, nil
}

type prevEdge struct {
	from string
	edge RelationEdge // orientada: from -> tabla destino del paso
}

// shortestPathToSelected hace BFS multi-fuente desde todas las tablas ya en el
// plan hasta la tabla seleccionada NO conectada más cercana, y devuelve el
// camino como aristas orientadas (listas para ser pasos de JOIN).
func shortestPathToSelected(r *registry, sources, selected []string, inTree map[string]bool) (string, []RelationEdge) {
	visited := make(map[string]bool, len(sources))
	queue := append([]string(nil), sources...)
	for _, table := range sources {
		visited[table] = true
	}
	prev := make(map[string]prevEdge)

	for len(queue) > 0 {
		from := queue[0]
		queue = queue[1:]
		for _, edge := range r.edges {
			neighbor, oriented, ok := edgeTowards(edge, from, visited)
			if !ok {
				continue
			}
			visited[neighbor] = true
			prev[neighbor] = prevEdge{from: from, edge: oriented}
			if isSelectedPending(neighbor, selected, inTree) {
				return neighbor, reconstructPath(prev, sources, neighbor)
			}
			queue = append(queue, neighbor)
		}
	}
	return "", nil
}

// edgeTowards devuelve el vecino de `from` a través de la arista (en cualquier
// dirección) si aún no fue visitado, con la arista orientada from -> vecino.
// Las constantes se anclan a ConstTable (el lado To declarado de la arista),
// que tras una inversión queda en el lado From pero sigue siendo la tabla
// dueña de las columnas constantes.
func edgeTowards(edge RelationEdge, from string, visited map[string]bool) (string, RelationEdge, bool) {
	if edge.From == from && !visited[edge.To] {
		oriented := edge
		oriented.ConstTable = edge.To
		return edge.To, oriented, true
	}
	if edge.To == from && !visited[edge.From] {
		return edge.From, RelationEdge{
			From: edge.To, FromCols: edge.ToCols,
			To: edge.From, ToCols: edge.FromCols,
			Const: edge.Const, ConstTable: edge.To,
		}, true
	}
	return "", RelationEdge{}, false
}

func reconstructPath(prev map[string]prevEdge, sources []string, target string) []RelationEdge {
	inSource := make(map[string]bool, len(sources))
	for _, table := range sources {
		inSource[table] = true
	}
	path := make([]RelationEdge, 0, 4)
	for cursor := target; !inSource[cursor]; {
		step := prev[cursor]
		path = append(path, step.edge)
		cursor = step.from
	}
	// Invertir: el paso más profundo va al final.
	for i, j := 0, len(path)-1; i < j; i, j = i+1, j-1 {
		path[i], path[j] = path[j], path[i]
	}
	return path
}

func isSelectedPending(table string, selected []string, inTree map[string]bool) bool {
	if inTree[table] {
		return false
	}
	for _, name := range selected {
		if name == table {
			return true
		}
	}
	return false
}

func selectedInTree(selected []string, inTree map[string]bool) int {
	count := 0
	for _, name := range selected {
		if inTree[name] {
			count++
		}
	}
	return count
}

func missingSelected(selected []string, inTree map[string]bool) []string {
	missing := make([]string, 0)
	for _, name := range selected {
		if !inTree[name] {
			missing = append(missing, name)
		}
	}
	return missing
}
