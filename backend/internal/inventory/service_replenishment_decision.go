package inventory

import (
	"fmt"
	"strings"
	"time"
)

// RegisterReplenishmentDecision resuelve un item escalado: cambiar_proveedor
// reinicia el ciclo de intentos con un proveedor nuevo; marcar_obsoleto cierra
// el item definitivamente.
func (s *Service) RegisterReplenishmentDecision(companyID, reference, actor string, req ReplenishmentDecisionRequest) (OperationResult, error) {
	ref := strings.TrimSpace(reference)
	action := strings.TrimSpace(req.Action)
	reason := strings.TrimSpace(req.Reason)
	provider := strings.TrimSpace(req.Provider)

	if ref == "" {
		return OperationResult{OK: false, Message: "La referencia es obligatoria."}, errReferenceRequired
	}
	if reason == "" {
		return OperationResult{OK: false, Message: "Debes indicar el motivo de la decision."}, errReferenceRequired
	}

	var currentStatus string
	err := s.db.QueryRow(`SELECT status FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, ref).Scan(&currentStatus)
	if err != nil {
		return OperationResult{OK: false, Message: "El item no existe o ya esta marcado como obsoleto."}, errReplenishmentNotFound
	}

	now := time.Now().UTC()
	switch action {
	case "cambiar_proveedor":
		if provider == "" {
			return OperationResult{OK: false, Message: "cambiar_proveedor exige indicar el nuevo proveedor."}, errReferenceRequired
		}
		if currentStatus == "obsoleto" {
			return OperationResult{OK: false, Message: "El item no existe o ya esta marcado como obsoleto."}, errReplenishmentNotFound
		}
		_, err = s.db.Exec(`
			UPDATE inventory_replenishment_items SET supplier = $1, attempts = 0, status = 'pendiente',
				shortage_reason = $2, updated_at = $3 WHERE company_id = $4 AND reference = $5
		`, provider, reason, now, companyID, ref)
		if err != nil {
			return OperationResult{}, err
		}
	case "marcar_obsoleto":
		if currentStatus == "obsoleto" {
			return OperationResult{OK: false, Message: "El item no existe o ya esta marcado como obsoleto."}, errReplenishmentNotFound
		}
		_, err = s.db.Exec(`UPDATE inventory_replenishment_items SET status = 'obsoleto', updated_at = $1 WHERE company_id = $2 AND reference = $3`, now, companyID, ref)
		if err != nil {
			return OperationResult{}, err
		}
	default:
		return OperationResult{OK: false, Message: "Accion invalida (use cambiar_proveedor o marcar_obsoleto)."}, errInvalidStatus
	}

	s.pushAudit(companyID, actor, "REPLENISHMENT_DECISION",
		fmt.Sprintf("Decision '%s' en %s: %s", action, ref, reason))
	return OperationResult{OK: true, Message: fmt.Sprintf("Decision registrada para %s.", ref)}, nil
}
