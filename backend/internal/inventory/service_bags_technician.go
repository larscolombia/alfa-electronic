package inventory

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// ReceiveTechnicianBag registra la bolsa que un tecnico devuelve o entrega:
// queda en custodia del tecnico (status recibida) y NO suma a current_stock.
// El stock solo vuelve a bodega cuando se libera la bolsa con el sobrante.
func (s *Service) ReceiveTechnicianBag(companyID string, req ReceiveTechnicianBagRequest, actor string) (OperationResult, error) {
	bagCode := strings.TrimSpace(req.BagCode)
	assignedTo := strings.TrimSpace(req.AssignedTo)
	if assignedTo == "" {
		assignedTo = strings.TrimSpace(req.Technician)
	}
	if bagCode == "" || assignedTo == "" {
		return OperationResult{OK: false, Message: "Completa el codigo de bolsa y el tecnico asignado (assignedTo)."}, errInvalidQuantity
	}

	type item struct {
		reference string
		quantity  int
	}
	items := make([]item, 0)
	if len(req.Items) > 0 {
		for _, it := range req.Items {
			ref := strings.TrimSpace(it.Reference)
			if ref == "" || it.Quantity <= 0 {
				return OperationResult{OK: false, Message: "Cada item de la bolsa necesita referencia y cantidad valida."}, errInvalidQuantity
			}
			if _, err := s.GetReference(companyID, ref); err != nil {
				return OperationResult{OK: false, Message: "La referencia " + ref + " no existe en catalogo."}, err
			}
			items = append(items, item{reference: ref, quantity: it.Quantity})
		}
	} else {
		ref := strings.TrimSpace(req.Reference)
		if ref == "" || req.Quantity <= 0 {
			return OperationResult{OK: false, Message: "Completa bolsa, referencia, tecnico y cantidad valida."}, errInvalidQuantity
		}
		if _, err := s.GetReference(companyID, ref); err != nil {
			return OperationResult{OK: false, Message: "La referencia indicada no existe en catalogo."}, err
		}
		items = append(items, item{reference: ref, quantity: req.Quantity})
	}

	var activeCount int
	_ = s.db.QueryRow(`SELECT COUNT(*) FROM inventory_bag_traces WHERE company_id = $1 AND bag_code = $2 AND status = 'recibida'`, companyID, bagCode).Scan(&activeCount)
	if activeCount > 0 {
		return OperationResult{OK: false, Message: "Ya existe una bolsa activa con ese codigo."}, errBagAlreadyActive
	}

	now := time.Now().UTC()
	summary := make([]string, 0, len(items))
	for i, it := range items {
		traceCode := bagCode
		if len(items) > 1 {
			traceCode = fmt.Sprintf("%s-%d", bagCode, i+1)
		}
		bagID := buildID("bag")
		_, err := s.db.Exec(`
			INSERT INTO inventory_bag_traces (company_id, id, bag_code, reference, quantity, technician,
				work_order, seal_code, origin_area, reception_document, received_by, received_at,
				status, released_by, notes)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'recibida','',$13)
		`, companyID, bagID, traceCode, it.reference, it.quantity, assignedTo,
			strings.TrimSpace(req.WorkOrder), strings.TrimSpace(req.SealCode),
			strings.TrimSpace(req.OriginArea), strings.TrimSpace(req.ReceptionDocument),
			actor, now, strings.TrimSpace(req.Notes))
		if err != nil {
			return OperationResult{}, err
		}
		summary = append(summary, fmt.Sprintf("%s x%d", it.reference, it.quantity))
	}

	s.pushAudit(companyID, actor, "BAG_RECEIVED",
		fmt.Sprintf("Bolsa %s recibida para %s (%s). Custodia del tecnico; no suma a stock.", bagCode, assignedTo, strings.Join(summary, ", ")))
	return OperationResult{OK: true, Message: "Bolsa recibida en custodia del tecnico; no suma a stock hasta la devolucion."}, nil
}

// ReleaseTechnicianBag cierra la custodia: solo el sobrante (leftoverQty) vuelve
// a current_stock con un movimiento de entrada; el resto quedo consumido por el tecnico.
func (s *Service) ReleaseTechnicianBag(companyID, bagID, actor string, leftoverQty int) (OperationResult, error) {
	var bag TechnicianBagTrace
	var receivedAt time.Time
	var releasedAt sql.NullTime
	err := s.db.QueryRow(`
		SELECT id, bag_code, reference, quantity, technician, work_order, seal_code,
			origin_area, reception_document, received_by, received_at, status,
			released_by, released_at, notes
		FROM inventory_bag_traces WHERE company_id = $1 AND id = $2
	`, companyID, bagID).Scan(&bag.ID, &bag.BagCode, &bag.Reference, &bag.Quantity, &bag.Technician,
		&bag.WorkOrder, &bag.SealCode, &bag.OriginArea, &bag.ReceptionDocument,
		&bag.ReceivedBy, &receivedAt, &bag.Status, &bag.ReleasedBy, &releasedAt, &bag.Notes)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La bolsa no existe o ya fue liberada."}, errBagNotFound
		}
		return OperationResult{}, err
	}

	if bag.Status != "recibida" {
		return OperationResult{OK: false, Message: "La bolsa no existe o ya fue liberada."}, errInvalidStatus
	}
	if leftoverQty < 0 || leftoverQty > bag.Quantity {
		return OperationResult{OK: false, Message: fmt.Sprintf("Sobrante invalido: debe estar entre 0 y %d (cantidad recibida).", bag.Quantity)}, errInvalidQuantity
	}

	now := time.Now().UTC()
	_, err = s.db.Exec(`UPDATE inventory_bag_traces SET status = 'liberada', released_by = $1, released_at = $2 WHERE company_id = $3 AND id = $4`,
		actor, now, companyID, bagID)
	if err != nil {
		return OperationResult{}, err
	}

	if leftoverQty > 0 {
		existing, err := s.GetReference(companyID, bag.Reference)
		if err != nil {
			return OperationResult{}, err
		}
		newStock := existing.CurrentStock + leftoverQty
		movID := buildID("mov")
		_, _ = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
			newStock, now, companyID, bag.Reference)
		_, _ = s.db.Exec(`
			INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
				equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
			VALUES ($1,$2,'entrada',$3,$4,$5,'','','','sobrante-bolsa',$6,$7,$8)
		`, companyID, movID, bag.Reference, leftoverQty,
			fmt.Sprintf("sobrante bolsa %s", bagID), bag.ReceptionDocument, actor, now)
		_ = s.syncReplenishmentForReference(companyID, bag.Reference, actor)
	}

	consumed := bag.Quantity - leftoverQty
	s.pushAudit(companyID, actor, "BAG_RELEASED",
		fmt.Sprintf("Bolsa %s liberada para %s: sobrante %d vuelve a stock, %d consumidas por el tecnico.", bag.BagCode, bag.Technician, leftoverQty, consumed))
	return OperationResult{OK: true, Message: fmt.Sprintf("Bolsa liberada: %d unidad(es) devueltas a stock, %d consumidas por el tecnico.", leftoverQty, consumed)}, nil
}
