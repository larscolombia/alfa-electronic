package remissions

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

func (s *Service) Update(companyID, id string, req UpsertRemissionRequest) (*Remission, error) {
	if err := validateUpsert(req); err != nil {
		return nil, err
	}

	itemsJSON, err := json.Marshal(req.Items)
	if err != nil {
		return nil, fmt.Errorf("serializar items: %w", err)
	}
	photosJSON, err := json.Marshal(req.DispatchPhotos)
	if err != nil {
		return nil, fmt.Errorf("serializar fotos: %w", err)
	}

	res, err := s.db.Exec(`
		UPDATE remissions SET
			client_name = $3, client_nit = $4, contact_name = $5, dispatch_type = $6,
			carrier_name = $7, guide_number = $8, purchase_order = $9,
			youtube_link = $10, dispatch_photos = $11, items = $12,
			valued = $13, total_value = $14, warranty_months = $15,
			notes = $16, updated_at = NOW(), invoice_id = $17
		WHERE company_id = $1 AND id = $2`,
		companyID, id,
		req.ClientName, req.ClientNIT, strings.TrimSpace(req.ContactName), req.DispatchType,
		req.CarrierName, req.GuideNumber, req.PurchaseOrder,
		req.YoutubeLink, photosJSON, itemsJSON,
		req.Valued, computeTotalValue(req.Items), req.WarrantyMonths,
		req.Notes, normalizeInvoiceID(req.InvoiceID),
	)
	if err != nil {
		return nil, fmt.Errorf("actualizar remision: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, errRemissionNotFound
	}
	return s.Get(companyID, id)
}

// UpdateDeliveryStatus cambia el estado de entrega aplicando la puerta de pago
// de la Fase 5c dentro de la MISMA transacción (el FOR UPDATE sobre la remisión
// evita que dos usuarios despachen a la vez una factura que apenas se pagó).
//
// actor y req.PaymentOverride vienen del JWT y del cuerpo de la petición: el
// override sólo se honra para rol admin y queda grabado con quién y cuándo.
func (s *Service) UpdateDeliveryStatus(companyID, id string, req DeliveryStatusRequest, actor Actor) (*Remission, error) {
	status := strings.TrimSpace(req.DeliveryStatus)
	if status != "entregado" && status != "pendiente" {
		return nil, fmt.Errorf("estado de entrega invalido: %s", req.DeliveryStatus)
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Se lee la remisión completa (no sólo delivery_status) porque la puerta
	// necesita la modalidad, el NIT/nombre del cliente y la factura vinculada.
	current := Remission{CompanyID: companyID, ID: id}
	err = tx.QueryRow(`
		SELECT r.delivery_status, r.dispatch_type, r.client_nit, r.client_name,
			r.invoice_id, r.payment_override,
			COALESCE(cc.credit_enabled, false)
		FROM remissions r
		LEFT JOIN LATERAL (
			SELECT credit_enabled
			FROM crm_clients cc
			WHERE cc.company_id = r.company_id
			  AND cc.soft_delete = false
			  AND (
				(r.client_nit <> '' AND lower(cc.nit) = lower(r.client_nit))
				OR (r.client_name <> ''
					AND (lower(cc.empresa) = lower(r.client_name) OR lower(cc.nombre) = lower(r.client_name)))
			  )
			ORDER BY cc.updated_at DESC
			LIMIT 1
		) cc ON true
		WHERE r.company_id = $1 AND r.id = $2 FOR UPDATE OF r`,
		companyID, id,
	).Scan(
		&current.DeliveryStatus, &current.DispatchType, &current.ClientNIT, &current.ClientName,
		&current.InvoiceID, &current.PaymentOverride, &current.CreditClient,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errRemissionNotFound
	}
	if err != nil {
		return nil, err
	}
	if current.DeliveryStatus == "entregado" && status == "pendiente" {
		return nil, fmt.Errorf("no se puede revertir una remision ya entregada")
	}

	// La puerta sólo aplica al despachar. Revertir a 'pendiente' no libera
	// mercancía, así que no se le exige factura pagada.
	overrideApplied := false
	if status == "entregado" {
		invoiceStatus, linked, err := readInvoiceStatus(tx, companyID, current.InvoiceID)
		if err != nil {
			return nil, err
		}
		current.InvoiceStatus = invoiceStatus
		if linked && current.InvoiceID != nil {
			var reference string
			if refErr := tx.QueryRow(
				`SELECT `+invoiceDisplayCodeSQL+` FROM finance_invoices fi WHERE company_id = $1 AND id = $2`,
				companyID, *current.InvoiceID,
			).Scan(&reference); refErr == nil {
				current.InvoiceReference = reference
			}
		}

		if err := enforcePaymentGate(&current, actor, req.PaymentOverride); err != nil {
			return nil, err
		}

		// Queda rastro sólo cuando el override fue lo que destrabó el despacho:
		// si la factura ya estaba Pagada no hubo nada que autorizar.
		overrideApplied = req.PaymentOverride && !current.PaymentOverride &&
			!invoicePaid(current.InvoiceStatus) && isAdminRole(actor.Role)
	}

	var overrideBy any
	var overrideAt any
	if overrideApplied {
		overrideBy = firstNonEmptyString(actor.Email, "admin")
		overrideAt = time.Now().UTC()
	}

	query := `UPDATE remissions SET delivery_status = $3, updated_at = NOW() WHERE company_id = $1 AND id = $2`
	args := []any{companyID, id, status}
	if overrideApplied {
		query = `UPDATE remissions SET delivery_status = $3, updated_at = NOW(),
			payment_override = true, payment_override_by = $4, payment_override_at = $5
			WHERE company_id = $1 AND id = $2`
		args = append(args, overrideBy, overrideAt)
	}

	if _, err := tx.Exec(query, args...); err != nil {
		return nil, fmt.Errorf("actualizar estado de entrega: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.Get(companyID, id)
}

// invoicePaid reporta si el estado leído ya libera la puerta.
func invoicePaid(status string) bool {
	return strings.EqualFold(strings.TrimSpace(status), InvoiceStatusPaid)
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func (s *Service) Delete(companyID, id string) error {
	res, err := s.db.Exec(
		`DELETE FROM remissions WHERE company_id = $1 AND id = $2`,
		companyID, id,
	)
	if err != nil {
		return fmt.Errorf("eliminar remision: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errRemissionNotFound
	}
	return nil
}
