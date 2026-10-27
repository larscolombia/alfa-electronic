package crm

import (
	"context"
	"strings"
)

func (s *Service) UpdateProspectNote(companyID, prospectID, note string) (string, error) {
	normalizedProspectID := strings.TrimSpace(prospectID)
	if normalizedProspectID == "" {
		return "", errProspectIDRequired
	}

	normalizedNote := strings.TrimSpace(note)
	if len(normalizedNote) > 5000 {
		return "", errProspectNoteTooLong
	}

	result, err := s.db.ExecContext(context.Background(), `
		UPDATE crm_prospects
		SET note = $1,
			updated_at = NOW()
		WHERE company_id = $2
		  AND id = $3
		  AND soft_delete = false
	`, normalizedNote, companyID, normalizedProspectID)
	if err != nil {
		return "", err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return "", err
	}
	if affected == 0 {
		return "", errProspectNotFound
	}

	return normalizedNote, nil
}
