package inventory

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// CreateDiscrepancy registra una diferencia de conteo fisico contra una sesion
// en curso. El esperado es el current_stock de la referencia en ese momento.
func (s *Service) CreateDiscrepancy(companyID, sessionID string, req CreateDiscrepancyRequest, actor string) (OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)
	reason := strings.TrimSpace(req.Reason)
	counted := req.CountedQty

	if ref == "" || counted < 0 {
		return OperationResult{OK: false, Message: "Referencia y cantidad contada (>= 0) son obligatorias."}, errInvalidQuantity
	}
	if reason == "" {
		return OperationResult{OK: false, Message: "El motivo de la diferencia es obligatorio."}, errReferenceRequired
	}

	var sessionStatus string
	err := s.db.QueryRow(`SELECT status FROM inventory_sessions WHERE company_id = $1 AND id = $2`, companyID, sessionID).Scan(&sessionStatus)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La sesion no existe o no esta en curso."}, errSessionNotFound
		}
		return OperationResult{}, err
	}
	if sessionStatus != "en-curso" {
		return OperationResult{OK: false, Message: "La sesion no existe o no esta en curso."}, errSessionNotFound
	}

	existing, err := s.GetReference(companyID, ref)
	if err != nil {
		return OperationResult{OK: false, Message: "La referencia indicada no existe en catalogo."}, err
	}

	discID := buildID("disc")
	_, err = s.db.Exec(`
		INSERT INTO inventory_discrepancies (company_id, id, session_id, reference, location,
			expected, counted, reason, root_cause, count_sheet, approved_by, approved_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'','',NULL)
	`, companyID, discID, sessionID, ref, existing.Location, existing.CurrentStock, counted, reason, strings.TrimSpace(req.RootCause))
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "DISCREPANCY_CREATED",
		fmt.Sprintf("Diferencia %s en sesion %s: %s esperado %d, contado %d.", discID, sessionID, ref, existing.CurrentStock, counted))
	return OperationResult{OK: true, Message: fmt.Sprintf("Diferencia registrada para %s (esperado %d, contado %d).", ref, existing.CurrentStock, counted)}, nil
}

// ApproveDiscrepancy aprueba la diferencia y aplica el ajuste de stock una sola
// vez: una movement tipo ajuste con delta = contado - esperado. Reaprobar una
// diferencia ya aprobada es un conflicto (409), no un segundo ajuste.
func (s *Service) ApproveDiscrepancy(companyID, discrepancyID, actor string) (OperationResult, error) {
	var ref string
	var expected, counted int
	var approvedAt sql.NullTime
	err := s.db.QueryRow(`SELECT reference, expected, counted, approved_at FROM inventory_discrepancies WHERE company_id = $1 AND id = $2`, companyID, discrepancyID).Scan(&ref, &expected, &counted, &approvedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La diferencia no existe."}, errRequestNotFound
		}
		return OperationResult{}, err
	}
	if approvedAt.Valid {
		return OperationResult{OK: false, Message: "La diferencia ya fue aprobada; el ajuste ya se aplico."}, errDiscrepancyAlreadyApproved
	}

	existing, err := s.GetReference(companyID, ref)
	if err != nil {
		return OperationResult{}, err
	}

	delta := counted - expected
	now := time.Now().UTC()
	newStock := existing.CurrentStock + delta
	movID := buildID("mov")

	_, err = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
		newStock, now, companyID, ref)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`
		INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
			equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
		VALUES ($1,$2,'ajuste',$3,$4,$5,'','','','conteo-fisico',$6,$7,$8)
	`, companyID, movID, ref, delta,
		fmt.Sprintf("Ajuste por conteo fisico (diferencia %s): esperado %d, contado %d", discrepancyID, expected, counted),
		discrepancyID, actor, now)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`UPDATE inventory_discrepancies SET approved_by = $1, approved_at = $2 WHERE company_id = $3 AND id = $4`,
		actor, now, companyID, discrepancyID)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "DISCREPANCY_APPROVED",
		fmt.Sprintf("Diferencia %s aprobada para %s: ajuste aplicado con delta %d (esperado %d, contado %d).", discrepancyID, ref, delta, expected, counted))
	_ = s.syncReplenishmentForReference(companyID, ref, actor)
	return OperationResult{OK: true, Message: fmt.Sprintf("Diferencia aprobada y stock ajustado en %d unidad(es) (%s).", delta, ref)}, nil
}
