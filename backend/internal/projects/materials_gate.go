package projects

import (
	"errors"
	"fmt"
	"strings"
)

// errMaterialsPending es la puerta de materiales: no se puede entrar a
// Reparacion con obligaciones de material abiertas para el proyecto. Es una
// regla de negocio del flujo tecnico, no una validacion de transicion pura:
// por eso vive separada de canTransition pero se evalua en el mismo punto
// (UpsertProject) antes de escribir la fila.
var errMaterialsPending = errors.New("hay materiales pendientes para este proyecto")

// materialsGateItem describe una obligacion de material abierta que bloquea
// la entrada a Reparacion, con etiqueta accionable para la UI.
type materialsGateItem struct {
	kind  string // "reserva activa", "linea de compra abierta", etc.
	label string // p.ej. "ABC-500 x1"
}

func materialLabel(reference string, quantity int) string {
	ref := strings.TrimSpace(reference)
	if ref == "" {
		ref = "(sin referencia)"
	}
	return fmt.Sprintf("%s x%d", ref, quantity)
}

// pendingMaterialsForRepair lista las obligaciones de material abiertas para
// un proyecto. Regla (aprobada en el levantamiento del requerimiento): si el
// equipo no ha recibido la totalidad de sus repuestos no puede entrar a
// Reparacion, porque las lineas de compra debieron entregarse al tecnico.
//
// "Abierto" se define por estado terminal vs. pendiente en cada tabla:
//  - inventory_reservations: 'activa' (apartada sin consumir/entregar) y
//    'vencida' (caduco sin consumo; aun puede consumirse). La 'liberada' NO
//    bloquea: el bloqueo fue resuelto a proposito y, si faltan repuestos, una
//    reserva nueva (activa) vuelve a bloquear hasta su consumo.
//  - inventory_purchase_lines: 'pendiente'/'enviada' sin rechazo de aprobacion,
//    y NO totalmente recibidas (received_quantity < quantity). Se vinculan por
//    project_id directo o via purchase_requests.purchase_line_id (al aprobar una
//    solicitud la linea creada NO hereda project_id).
//    'cerrada', o recibida al 100% sin cerrar, no bloquea: el material ya llego.
//  - purchase_requests: solo 'pendiente' (sin ordenar todavia); al aprobar se
//    convierte en linea y queda cubierta por el punto anterior.
func (s *Service) pendingMaterialsForRepair(companyID, projectID, shortCode string) ([]materialsGateItem, error) {
	companyID = strings.TrimSpace(companyID)
	projectID = strings.TrimSpace(projectID)

	items := make([]materialsGateItem, 0)

	workOrders := []string{projectID}
	if sc := strings.TrimSpace(shortCode); sc != "" && sc != projectID {
		workOrders = append(workOrders, sc)
	}

	// 1) Reservas del proyecto (work_order = shortCode o id, igual que el
	//    frontend al crearlas y filtrarlas en la ficha).
	resQuery := fmt.Sprintf(`
		SELECT reference, quantity, status
		FROM inventory_reservations
		WHERE company_id = $1 AND work_order IN (%s) AND status IN ('activa','vencida')
		ORDER BY reserved_at DESC`, placeholderList(2, len(workOrders)))

	args := append([]any{companyID}, toAnySlice(workOrders)...)
	rows, err := s.db.Query(resQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var ref string
		var qty int
		var status string
		if scanErr := rows.Scan(&ref, &qty, &status); scanErr != nil {
			return nil, scanErr
		}
		label := "reserva activa"
		if status == "vencida" {
			label = "reserva vencida sin consumir"
		}
		items = append(items, materialsGateItem{kind: label, label: materialLabel(ref, qty)})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// 2) Lineas de compra abiertas del proyecto (directa o via solicitud aprobada).
	lineRows, err := s.db.Query(`
		SELECT l.reference, l.quantity
		FROM inventory_purchase_lines l
		WHERE l.company_id = $1
			AND l.status IN ('pendiente','enviada')
			AND COALESCE(l.approval_status, 'pendiente') <> 'rechazada'
			AND l.received_quantity < l.quantity
			AND (
				l.project_id = $2
				OR l.id IN (
					SELECT pr.purchase_line_id FROM purchase_requests pr
					WHERE pr.company_id = $1 AND pr.project_id = $2 AND pr.purchase_line_id <> ''
				)
			)
		ORDER BY l.generated_at DESC`, companyID, projectID)
	if err != nil {
		return nil, err
	}
	defer lineRows.Close()

	for lineRows.Next() {
		var ref string
		var qty int
		if scanErr := lineRows.Scan(&ref, &qty); scanErr != nil {
			return nil, scanErr
		}
		items = append(items, materialsGateItem{kind: "linea de compra abierta", label: materialLabel(ref, qty)})
	}
	if err := lineRows.Err(); err != nil {
		return nil, err
	}

	// 3) Solicitudes de compra pendientes (todavia sin aprobar ni rechazar).
	reqRows, err := s.db.Query(`
		SELECT reference, quantity
		FROM purchase_requests
		WHERE company_id = $1 AND project_id = $2 AND status = 'pendiente'
		ORDER BY requested_at DESC`, companyID, projectID)
	if err != nil {
		return nil, err
	}
	defer reqRows.Close()

	for reqRows.Next() {
		var ref string
		var qty int
		if scanErr := reqRows.Scan(&ref, &qty); scanErr != nil {
			return nil, scanErr
		}
		items = append(items, materialsGateItem{kind: "solicitud de compra pendiente", label: materialLabel(ref, qty)})
	}
	if err := reqRows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// newMaterialsPendingError construye el mensaje accionable que llega a la UI
// (persistProjectDetail lo muestra tal cual en boardActionMessage).
func newMaterialsPendingError(items []materialsGateItem) error {
	details := make([]string, 0, len(items))
	for _, item := range items {
		details = append(details, fmt.Sprintf("%s (%s)", item.label, item.kind))
	}

	return fmt.Errorf("%w: %d material(es) pendiente(s): %s. Consuma la reserva o cierre la linea de compra antes de pasar a Reparacion.",
		errMaterialsPending, len(items), strings.Join(details, "; "))
}

// placeholderList genera N placeholders posicionales seguidos empezando en
// start (p.ej. "$2,$3"). Solo se usa con hasta 2 valores, pero es generico.
func placeholderList(start, count int) string {
	placeholders := make([]string, 0, count)
	for i := 0; i < count; i++ {
		placeholders = append(placeholders, fmt.Sprintf("$%d", start+i))
	}
	return strings.Join(placeholders, ",")
}

func toAnySlice(values []string) []any {
	out := make([]any, 0, len(values))
	for _, v := range values {
		out = append(out, v)
	}
	return out
}
