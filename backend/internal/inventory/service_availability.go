package inventory

import (
	"database/sql"
	"errors"
	"fmt"
)

// AvailableStock devuelve el stock realmente disponible de una referencia:
// current_stock menos las reservas activas no vencidas. Segundo valor: total
// reservado (activo, no vencido) que se descuenta.
func (s *Service) AvailableStock(companyID, reference string) (available int, reserved int, err error) {
	var current int
	err = s.db.QueryRow(`SELECT current_stock FROM inventory_references WHERE company_id = $1 AND reference = $2`,
		companyID, reference).Scan(&current)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, 0, errReferenceNotFound
		}
		return 0, 0, err
	}

	err = s.db.QueryRow(`
		SELECT COALESCE(SUM(quantity), 0) FROM inventory_reservations
		WHERE company_id = $1 AND reference = $2 AND status = 'activa' AND expires_at >= NOW()
	`, companyID, reference).Scan(&reserved)
	if err != nil {
		return 0, 0, err
	}

	return current - reserved, reserved, nil
}

func insufficientStockMessage(available, reserved, required int) string {
	return fmt.Sprintf("No hay stock suficiente: disponible %d (reservado %d), requerido %d", available, reserved, required)
}
