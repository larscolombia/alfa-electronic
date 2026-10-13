package equipment

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

func buildListRecordsStatement(filters []string) string {
	return fmt.Sprintf(`
SELECT %s
FROM crm_equipment_records
WHERE %s
ORDER BY updated_at DESC, created_at DESC;
`, equipmentRecordSelectColumns, strings.Join(filters, " AND "))
}

func buildGetRecordStatement(includeArchived bool) string {
	statement := fmt.Sprintf(`
SELECT %s
FROM crm_equipment_records
WHERE company_id = $1
  AND id = $2`, equipmentRecordSelectColumns)

	if !includeArchived {
		statement += "\n  AND archived = false"
	}

	return statement + ";"
}

func parseOptionalTimestampValue(value string) any {
	if parsed, err := parseOptionalISO(value); err == nil {
		return parsed
	}
	return nil
}

func parseArchivedAtValue(value string) any {
	return parseOptionalTimestampValue(value)
}

func parseIntakeReceivedAtValue(value string) any {
	return parseOptionalTimestampValue(value)
}

func scanRecord(scanner interface{ Scan(dest ...any) error }) (Record, error) {
	var (
		record           Record
		rawItems         []byte
		archivedAt       sql.NullTime
		intakeReceivedAt sql.NullTime
		createdAt        time.Time
		updatedAt        time.Time
	)

	if err := scanner.Scan(
		&record.ID,
		&record.ProspectID,
		&record.ProspectName,
		&record.ReceptionDay,
		&record.ReceptionMonth,
		&record.ReceptionYear,
		&record.IntakeMethod,
		&record.IntakeCarrier,
		&record.IntakeTrackingNumber,
		&intakeReceivedAt,
		&record.CompanyName,
		&record.SourceBranchName,
		&record.NIT,
		&record.Phone,
		&record.Address,
		&record.City,
		&record.ContactName,
		&record.ContactRole,
		&record.Cellphone,
		&record.Email,
		&record.ClientSignature,
		&record.PikaSignature,
		&rawItems,
		&record.Archived,
		&archivedAt,
		&record.SourceContext,
		&record.AssignedTo,
		&createdAt,
		&updatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Record{}, errRecordNotFound
		}
		return Record{}, err
	}

	record.SourceContext = normalizeSourceContext(record.SourceContext)
	record.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	record.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	if archivedAt.Valid {
		record.ArchivedAt = archivedAt.Time.UTC().Format(time.RFC3339)
	}

	if intakeReceivedAt.Valid {
		record.IntakeReceivedAt = intakeReceivedAt.Time.UTC().Format(time.RFC3339)
	}

	if len(rawItems) == 0 {
		record.Items = make([]Item, 0)
		return record, nil
	}

	if err := json.Unmarshal(rawItems, &record.Items); err != nil {
		return Record{}, err
	}

	record.Items = normalizeItems(record.Items)
	return record, nil
}
