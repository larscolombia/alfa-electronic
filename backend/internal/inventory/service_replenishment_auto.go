package inventory

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// syncReplenishmentForReference mantiene el item de reposicion de una referencia
// alineado con su stock despues de cualquier cambio: bajo el minimo crea un item
// pendiente (si no hay uno activo); de vuelta sobre el minimo archiva el activo.
// Los items en estado 'obsoleto' nunca se resucitan ni se borran.
func (s *Service) syncReplenishmentForReference(companyID, reference, actor string) error {
	ref, err := s.GetReference(companyID, reference)
	if err != nil {
		return err
	}

	var status string
	err = s.db.QueryRow(`SELECT status FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference).Scan(&status)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	exists := err == nil

	if ref.CurrentStock > ref.MinStock {
		if exists && status != "obsoleto" {
			if _, err := s.db.Exec(`DELETE FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, reference); err != nil {
				return err
			}
			s.pushAudit(companyID, actor, "REPLENISHMENT_RESOLVED", fmt.Sprintf("Referencia %s volvio sobre el minimo (%d > %d); item archivado.", reference, ref.CurrentStock, ref.MinStock))
		}
		return nil
	}

	if exists {
		if status == "obsoleto" {
			return nil
		}
		_, err := s.db.Exec(`UPDATE inventory_replenishment_items SET current_stock = $1, min_stock = $2, updated_at = $3 WHERE company_id = $4 AND reference = $5`,
			ref.CurrentStock, ref.MinStock, time.Now().UTC(), companyID, reference)
		return err
	}

	now := time.Now().UTC()
	_, err = s.db.Exec(`
		INSERT INTO inventory_replenishment_items (company_id, reference, description, supplier,
			min_stock, current_stock, first_insufficient_at, last_attempt_at, attempts, status, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$7,0,'pendiente',$7)
	`, companyID, reference, ref.Designation, ref.SupplierCode, ref.MinStock, ref.CurrentStock, now)
	if err != nil {
		return err
	}

	s.pushAudit(companyID, actor, "REPLENISHMENT_AUTO_CREATED",
		fmt.Sprintf("Referencia %s bajo el minimo (stock %d, minimo %d): item de reposicion creado.", reference, ref.CurrentStock, ref.MinStock))
	return nil
}
