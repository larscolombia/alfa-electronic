package equipment

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

func (s *Service) ListRecords(companyID string, query ListRecordsQuery) ([]Record, error) {
	ctx := context.Background()
	filters := []string{"company_id = $1"}
	args := []any{companyID}
	nextArg := 2

	if !query.IncludeArchived {
		filters = append(filters, "archived = false")
	}

	matchFilters, matchArgs, nextArg := buildProspectMatchFilters(query, nextArg)
	if len(matchFilters) > 0 {
		filters = append(filters, "("+strings.Join(matchFilters, " OR ")+")")
		args = append(args, matchArgs...)
	}

	normalizedIdentifier := strings.TrimSpace(query.Identifier)
	if normalizedIdentifier != "" {
		filters = append(filters, fmt.Sprintf(`EXISTS (
			SELECT 1
			FROM jsonb_array_elements(items_json) AS item
			WHERE lower(btrim(coalesce(item->>'receivedIdentifier', ''))) = lower(btrim($%d::text))
			   OR lower(btrim(coalesce(item->>'serie', ''))) = lower(btrim($%d::text))
			   OR lower(btrim(coalesce(item->>'customerShipmentReference', ''))) = lower(btrim($%d::text))
		)`, nextArg, nextArg, nextArg))
		args = append(args, normalizedIdentifier)
		nextArg++
	}

	// Bandeja "mis equipos": registros con al menos un item asignado al tecnico
	// (por id de asignacion o, como respaldo, por nombre asignado).
	normalizedAssignedToID := strings.TrimSpace(query.AssignedToID)
	if normalizedAssignedToID != "" {
		filters = append(filters, fmt.Sprintf(`EXISTS (
			SELECT 1
			FROM jsonb_array_elements(items_json) AS item
			WHERE lower(btrim(coalesce(item->>'assignedToId', ''))) = lower(btrim($%d::text))
			   OR lower(btrim(coalesce(item->>'assignedTo', ''))) = lower(btrim($%d::text))
		)`, nextArg, nextArg))
		args = append(args, normalizedAssignedToID)
		nextArg++
	}

	// Fase 5c: campanita de facturación urgente. Los ítems viven serializados
	// en items_json, así que el filtro es un EXISTS sobre el JSONB (mismo
	// patrón que el filtro por identificador de arriba): devuelve los REGISTROS
	// con al menos un ítem marcado, y ListItems recorta después a esos ítems.
	if query.PriorityBilling {
		filters = append(filters, `EXISTS (
			SELECT 1
			FROM jsonb_array_elements(items_json) AS item
			WHERE coalesce((item->>'priorityBilling')::boolean, false) = true
		)`)
	}

	statement := buildListRecordsStatement(filters)

	rows, err := s.db.QueryContext(ctx, statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Record, 0)
	for rows.Next() {
		item, scanErr := scanRecord(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func (s *Service) GetRecord(companyID, recordID string, includeArchived bool) (Record, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(recordID)
	if normalizedID == "" {
		return Record{}, errRecordIDRequired
	}

	statement := buildGetRecordStatement(includeArchived)
	args := []any{companyID, normalizedID}

	row := s.db.QueryRowContext(ctx, statement, args...)
	item, err := scanRecord(row)
	if err != nil {
		return Record{}, err
	}

	return item, nil
}

func (s *Service) UpsertRecord(companyID string, record Record) (Record, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(record.ID)
	if normalizedID == "" {
		return Record{}, errRecordIDRequired
	}

	normalizedRecord := normalizeRecord(record)
	normalizedRecord.ID = normalizedID

	itemsRaw, err := json.Marshal(normalizedRecord.Items)
	if err != nil {
		return Record{}, err
	}

	archivedAt := parseArchivedAtValue(normalizedRecord.ArchivedAt)
	intakeReceivedAt := parseIntakeReceivedAtValue(normalizedRecord.IntakeReceivedAt)

	if _, err := s.db.ExecContext(ctx, `
INSERT INTO crm_equipment_records (
	company_id, id, prospect_id, prospect_name,
	reception_day, reception_month, reception_year,
	intake_method, intake_carrier, intake_tracking_number, intake_received_at,
	company_name, source_branch_name, nit, phone, address, city,
	contact_name, contact_role, cellphone, email,
	client_signature, alfa_signature,
	items_json, archived, archived_at,
	source_context, assigned_to,
	created_at, updated_at
)
VALUES (
	$1, $2, $3, $4,
	$5, $6, $7,
	$8, $9, $10, $11,
	$12, $13, $14, $15, $16, $17,
	$18, $19, $20, $21,
	$22, $23,
	$24, $25, $26,
	$27, $28,
	NOW(), NOW()
)
ON CONFLICT (company_id, id)
DO UPDATE SET
	prospect_id = EXCLUDED.prospect_id,
	prospect_name = EXCLUDED.prospect_name,
	reception_day = EXCLUDED.reception_day,
	reception_month = EXCLUDED.reception_month,
	reception_year = EXCLUDED.reception_year,
	intake_method = EXCLUDED.intake_method,
	intake_carrier = EXCLUDED.intake_carrier,
	intake_tracking_number = EXCLUDED.intake_tracking_number,
	intake_received_at = EXCLUDED.intake_received_at,
	company_name = EXCLUDED.company_name,
	source_branch_name = EXCLUDED.source_branch_name,
	nit = EXCLUDED.nit,
	phone = EXCLUDED.phone,
	address = EXCLUDED.address,
	city = EXCLUDED.city,
	contact_name = EXCLUDED.contact_name,
	contact_role = EXCLUDED.contact_role,
	cellphone = EXCLUDED.cellphone,
	email = EXCLUDED.email,
	client_signature = EXCLUDED.client_signature,
	alfa_signature = EXCLUDED.alfa_signature,
	items_json = EXCLUDED.items_json,
	archived = EXCLUDED.archived,
	archived_at = EXCLUDED.archived_at,
	source_context = EXCLUDED.source_context,
	assigned_to = EXCLUDED.assigned_to,
	updated_at = NOW();
`,
		companyID,
		normalizedRecord.ID,
		normalizedRecord.ProspectID,
		normalizedRecord.ProspectName,
		normalizedRecord.ReceptionDay,
		normalizedRecord.ReceptionMonth,
		normalizedRecord.ReceptionYear,
		normalizedRecord.IntakeMethod,
		normalizedRecord.IntakeCarrier,
		normalizedRecord.IntakeTrackingNumber,
		intakeReceivedAt,
		normalizedRecord.CompanyName,
		normalizedRecord.SourceBranchName,
		normalizedRecord.NIT,
		normalizedRecord.Phone,
		normalizedRecord.Address,
		normalizedRecord.City,
		normalizedRecord.ContactName,
		normalizedRecord.ContactRole,
		normalizedRecord.Cellphone,
		normalizedRecord.Email,
		normalizedRecord.ClientSignature,
		normalizedRecord.PikaSignature,
		itemsRaw,
		normalizedRecord.Archived,
		archivedAt,
		normalizedRecord.SourceContext,
		normalizedRecord.AssignedTo,
	); err != nil {
		return Record{}, err
	}

	return s.GetRecord(companyID, normalizedID, true)
}

func (s *Service) SetRecordArchived(companyID, recordID string, archived bool) (Record, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(recordID)
	if normalizedID == "" {
		return Record{}, errRecordIDRequired
	}

	var archivedAt any
	if archived {
		archivedAt = time.Now().UTC()
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_equipment_records
SET archived = $1,
	archived_at = $2,
	updated_at = NOW()
WHERE company_id = $3
  AND id = $4;
`, archived, archivedAt, companyID, normalizedID)
	if err != nil {
		return Record{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return Record{}, errRecordNotFound
	}

	return s.GetRecord(companyID, normalizedID, true)
}

func (s *Service) ListItems(companyID string, query ListItemsQuery) ([]Summary, error) {
	records, err := s.ListRecords(companyID, ListRecordsQuery{
		ProspectID:      query.ProspectID,
		ClientNIT:       query.ClientNIT,
		ClientName:      query.ClientName,
		IncludeArchived: query.IncludeArchived,
		Identifier:      query.Identifier,
		AssignedToID:    query.AssignedToID,
		PriorityBilling: query.PriorityBilling,
	})
	if err != nil {
		return nil, err
	}

	summaries := flattenSummaries(records)

	// Fase 5c: el EXISTS de arriba filtra REGISTROS, y un registro puede
	// mezclar equipos urgentes con equipos que no lo son. La campanita cuenta
	// equipos, no recepciones, así que aquí se recorta a los ítems marcados.
	if query.PriorityBilling {
		marked := make([]Summary, 0, len(summaries))
		for _, summary := range summaries {
			if summary.PriorityBilling {
				marked = append(marked, summary)
			}
		}
		summaries = marked
	}

	// El filtro de tecnico es por item: un registro puede mezclar equipos de
	// varios tecnicos, asi que la bandeja "mis equipos" solo devuelve los items
	// asignados al tecnico consultado.
	normalizedAssignedToID := strings.ToLower(strings.TrimSpace(query.AssignedToID))
	if normalizedAssignedToID == "" {
		return summaries, nil
	}

	filtered := make([]Summary, 0, len(summaries))
	for _, record := range records {
		assignedItemIDs := make(map[string]struct{})
		for _, item := range record.Items {
			if strings.EqualFold(strings.TrimSpace(item.AssignedToID), normalizedAssignedToID) ||
				strings.EqualFold(strings.TrimSpace(item.AssignedTo), normalizedAssignedToID) {
				assignedItemIDs[item.ID] = struct{}{}
			}
		}

		if len(assignedItemIDs) == 0 {
			continue
		}

		for _, summary := range summaries {
			if summary.RecordID == record.ID {
				if _, ok := assignedItemIDs[summary.ItemID]; ok {
					filtered = append(filtered, summary)
				}
			}
		}
	}

	return filtered, nil
}
