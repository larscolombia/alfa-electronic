package equipment

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

// ErrCodeDuplicateIdentifier es el código estable del 409 de REC-14; los tests
// de Playwright lo buscan en el JSON de respuesta.
const ErrCodeDuplicateIdentifier = "DUPLICATE_IDENTIFIER"

// DuplicateIdentifierError se devuelve cuando un ítem trae un identificador
// que ya existe en OTRO registro de la misma empresa y no trae confirmación
// válida (motivo + relación reingreso/garantia/evento_nuevo).
type DuplicateIdentifierError struct {
	Identifier       string
	ExistingRecordID string
}

func (e *DuplicateIdentifierError) Error() string {
	return fmt.Sprintf("el identificador %q ya esta registrado en otro equipo (registro %s): confirme si es reingreso, garantia o evento nuevo", e.Identifier, e.ExistingRecordID)
}

// checkDuplicateIdentifiers revisa los identificadores de los ítems contra los
// demás registros de la empresa. El propio registro se excluye: re-guardar un
// ítem ya registrado por esta vía no se rechaza a sí mismo.
func (s *Service) checkDuplicateIdentifiers(companyID string, record Record) error {
	for _, item := range record.Items {
		identifier := strings.TrimSpace(item.ReceivedIdentifier)
		if identifier == "" {
			continue
		}

		existingRecordID, err := s.findRecordWithIdentifier(companyID, record.ID, identifier)
		if err != nil {
			return err
		}
		if existingRecordID == "" || duplicateConfirmValid(item.DuplicateConfirm) {
			continue
		}

		return &DuplicateIdentifierError{Identifier: identifier, ExistingRecordID: existingRecordID}
	}

	return nil
}

func (s *Service) findRecordWithIdentifier(companyID, excludeRecordID, identifier string) (string, error) {
	ctx := context.Background()

	row := s.db.QueryRowContext(ctx, `
SELECT id
FROM crm_equipment_records
WHERE company_id = $1
  AND id <> $2
  AND EXISTS (
	SELECT 1
	FROM jsonb_array_elements(items_json) AS item
	WHERE lower(btrim(coalesce(item->>'receivedIdentifier', ''))) = lower(btrim($3::text))
  )
LIMIT 1;
`, companyID, excludeRecordID, identifier)

	var recordID string
	if err := row.Scan(&recordID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "", nil
		}
		return "", err
	}

	return recordID, nil
}
