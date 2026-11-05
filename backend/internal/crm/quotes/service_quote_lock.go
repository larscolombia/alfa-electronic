package quotes

import (
	"context"
	"database/sql"
	"errors"
)

var errQuoteLockedByRepair = errors.New("no se puede editar ni anular una cotizacion con equipos en reparacion")

func (s *Service) quoteHasRepairingEquipment(ctx context.Context, companyID, quoteID string) (bool, error) {
	var locked bool
	err := s.db.QueryRowContext(ctx, `
SELECT EXISTS (
  SELECT 1 FROM crm_quotes q
  CROSS JOIN LATERAL jsonb_array_elements_text(q.selected_equipment_ids_json) equipment_id
  JOIN crm_equipment_records records ON records.company_id = q.company_id
  CROSS JOIN LATERAL jsonb_array_elements(records.items_json) equipment
  WHERE q.company_id = $1 AND q.id = $2 AND q.soft_delete = false
    AND equipment->>'id' = equipment_id
    AND lower(coalesce(equipment->>'repairStatus', '')) = 'reparacion'
)`, companyID, quoteID).Scan(&locked)
	if errors.Is(err, sql.ErrNoRows) { return false, nil }
	return locked, err
}
