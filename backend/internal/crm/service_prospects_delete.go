package crm

import (
	"context"
	"strings"
)

func (s *Service) DeleteProspect(companyID, prospectID string) (bool, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(prospectID)
	if normalizedID == "" {
		return false, errProspectIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_prospects
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, normalizedID)
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	if affected > 0 {
		if _, err := s.db.ExecContext(ctx, `
DELETE FROM crm_prospect_branches
WHERE company_id = $1
  AND prospect_id = $2;
`, companyID, normalizedID); err != nil {
			return false, err
		}
		s.refreshGlobalSearch(ctx) // el borrado debe retirarlo del buscador global
	}
	return affected > 0, nil
}
