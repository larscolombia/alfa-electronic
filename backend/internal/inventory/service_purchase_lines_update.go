package inventory

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	errNoUpdateFields = errors.New("debes enviar al menos un campo para actualizar")
	errInvalidPrice   = errors.New("precio unitario invalido")
)

// PurchaseLineEditNotification es el aviso que se emite cuando compras modifica
// marca o referencia de una linea solicitada por un tecnico.
type PurchaseLineEditNotification struct {
	Technician string
	Type       string
	Title      string
	Message    string
	TargetRole string
}

// PurchaseLineEditNotifier cablea el aviso hacia el modulo de notificaciones
// (se inyecta desde main para evitar acoplar inventory con projects).
type PurchaseLineEditNotifier func(companyID string, n PurchaseLineEditNotification)

// SetPurchaseLineEditNotifier registra el hook invocado tras una edicion relevante.
func (s *Service) SetPurchaseLineEditNotifier(notifier PurchaseLineEditNotifier) {
	s.purchaseLineEditNotifier = notifier
}

// validateUpdatePurchaseLineRequest aplica las reglas puras del PATCH.
func validateUpdatePurchaseLineRequest(req UpdatePurchaseLineRequest) error {
	if req.Reference == nil && req.Brand == nil && req.UnitPrice == nil && req.Quantity == nil {
		return errNoUpdateFields
	}
	if req.Reference != nil && strings.TrimSpace(*req.Reference) == "" {
		return errReferenceRequired
	}
	if req.Quantity != nil && *req.Quantity < 1 {
		return errInvalidQuantity
	}
	if req.UnitPrice != nil && *req.UnitPrice < 0 {
		return errInvalidPrice
	}
	return nil
}

func updateValidationMessage(err error) string {
	switch {
	case errors.Is(err, errNoUpdateFields):
		return "Debes enviar al menos un campo para actualizar."
	case errors.Is(err, errReferenceRequired):
		return "La referencia no puede quedar vacia."
	case errors.Is(err, errInvalidQuantity):
		return "La cantidad debe ser al menos 1."
	case errors.Is(err, errInvalidPrice):
		return "El precio unitario no puede ser negativo."
	}
	return "Solicitud invalida."
}

// purchaseLineEditableStatus sigue la misma regla que send/close:
// solo lineas pendientes pueden modificarse (enviada o cerrada quedan bloqueadas).
func purchaseLineEditableStatus(status string) bool {
	return status == "pendiente"
}

// detectRelevantChanges indica si cambio marca o referencia (lo que le importa
// al tecnico solicitante). Cambios de solo precio/cantidad o cosmeticos no cuentan.
func detectRelevantChanges(oldLine, newLine PurchaseLine) bool {
	return normalizeToken(oldLine.Brand) != normalizeToken(newLine.Brand) ||
		normalizeToken(oldLine.Reference) != normalizeToken(newLine.Reference)
}

// resolveUpdatedPurchaseLine aplica los campos enviados sobre la linea actual.
func resolveUpdatedPurchaseLine(oldLine PurchaseLine, req UpdatePurchaseLineRequest) PurchaseLine {
	updated := oldLine
	if req.Reference != nil {
		updated.Reference = strings.TrimSpace(*req.Reference)
	}
	if req.Brand != nil {
		updated.Brand = strings.TrimSpace(*req.Brand)
	}
	if req.UnitPrice != nil {
		updated.UnitPrice = *req.UnitPrice
	}
	if req.Quantity != nil {
		updated.Quantity = *req.Quantity
	}
	return updated
}

// UpdatePurchaseLine edita marca/referencia/precio/cantidad de una linea no cerrada.
// Marca la linea como modificada por compras y, si cambio marca o referencia,
// notifica al tecnico solicitante a traves del hook registrado.
func (s *Service) UpdatePurchaseLine(companyID, lineID string, req UpdatePurchaseLineRequest, actor string) (PurchaseLine, OperationResult, error) {
	if err := validateUpdatePurchaseLineRequest(req); err != nil {
		return PurchaseLine{}, OperationResult{OK: false, Message: updateValidationMessage(err)}, err
	}

	var line PurchaseLine
	var generatedAt time.Time
	var modifiedAt sql.NullTime
	err := s.db.QueryRow(`
		SELECT id, reference, component, type, brand, description, supplier, quantity, unit_price, needed_by,
			source, expected_date, request_reason, generated_at, generated_by, status,
			project_id, equipment_tag, modified_by_purchases, modified_by, modified_at
		FROM inventory_purchase_lines WHERE company_id = $1 AND id = $2
	`, companyID, lineID).Scan(&line.ID, &line.Reference, &line.Component, &line.Type, &line.Brand, &line.Description,
		&line.Supplier, &line.Quantity, &line.UnitPrice, &line.NeededBy, &line.Source, &line.ExpectedDate,
		&line.RequestReason, &generatedAt, &line.GeneratedBy, &line.Status,
		&line.ProjectID, &line.EquipmentTag, &line.ModifiedByPurchases, &line.ModifiedBy, &modifiedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return PurchaseLine{}, OperationResult{OK: false, Message: "La linea de compra no existe."}, errPurchaseLineNotFound
		}
		return PurchaseLine{}, OperationResult{}, err
	}
	line.GeneratedAt = generatedAt.UTC().Format(time.RFC3339)
	if modifiedAt.Valid {
		line.ModifiedAt = modifiedAt.Time.UTC().Format(time.RFC3339)
	}

	if !purchaseLineEditableStatus(line.Status) {
		return PurchaseLine{}, OperationResult{OK: false, Message: "Solo se pueden editar lineas pendientes (no enviadas ni cerradas)."}, errInvalidStatus
	}

	updated := resolveUpdatedPurchaseLine(line, req)
	now := time.Now().UTC()

	_, err = s.db.Exec(`
		UPDATE inventory_purchase_lines
		SET reference = $1, brand = $2, unit_price = $3, quantity = $4,
			modified_by_purchases = TRUE, modified_by = $5, modified_at = $6
		WHERE company_id = $7 AND id = $8
	`, updated.Reference, updated.Brand, updated.UnitPrice, updated.Quantity, actor, now, companyID, lineID)
	if err != nil {
		return PurchaseLine{}, OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "UPDATE_PURCHASE_LINE",
		fmt.Sprintf("Linea %s modificada por compras: %s (%s) x%d.", lineID, updated.Reference, updated.Brand, updated.Quantity))

	if detectRelevantChanges(line, updated) && s.purchaseLineEditNotifier != nil {
		s.purchaseLineEditNotifier(companyID, PurchaseLineEditNotification{
			Technician: line.GeneratedBy,
			Type:       "purchase-line-modified",
			Title:      "Compras modifico tu solicitud de repuesto",
			Message: fmt.Sprintf("La linea %s solicitada por %s fue modificada por compras: referencia %s -> %s, marca %s -> %s.",
				lineID, line.GeneratedBy, line.Reference, updated.Reference, line.Brand, updated.Brand),
			TargetRole: "tecnico",
		})
	}

	updated.ModifiedByPurchases = true
	updated.ModifiedBy = actor
	updated.ModifiedAt = now.Format(time.RFC3339)
	return updated, OperationResult{OK: true, Message: fmt.Sprintf("Linea de compra %s actualizada.", updated.Reference)}, nil
}
