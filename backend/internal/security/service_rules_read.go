package security

import (
	"context"
	"database/sql"
	"strings"
)

func (s *Service) GetRules(ctx context.Context, companyID string) (RulesResponse, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return RulesResponse{}, errCompanyIDRequired
	}

	response := RulesResponse{
		GlobalAccess:     make([]GlobalAccessRule, 0),
		RestrictedAccess: make([]RestrictedAccessRule, 0),
	}

	globalRows, err := s.db.QueryContext(ctx, `
SELECT id, subject_type, subject_value, role, reason, is_active, created_at, updated_at
FROM security_access_global_rules
WHERE company_id = $1
ORDER BY id ASC;
`, companyID)
	if err != nil {
		return RulesResponse{}, err
	}

	for globalRows.Next() {
		var row GlobalAccessRule
		if err := globalRows.Scan(
			&row.ID,
			&row.SubjectType,
			&row.SubjectValue,
			&row.Role,
			&row.Reason,
			&row.IsActive,
			&row.CreatedAt,
			&row.UpdatedAt,
		); err != nil {
			globalRows.Close()
			return RulesResponse{}, err
		}
		response.GlobalAccess = append(response.GlobalAccess, row)
	}

	if err := globalRows.Err(); err != nil {
		globalRows.Close()
		return RulesResponse{}, err
	}
	globalRows.Close()

	restrictedRows, err := s.db.QueryContext(ctx, `
SELECT
	r.id,
	r.subject_type,
	r.subject_value,
		r.role,
	r.office,
	r.is_active,
	r.created_at,
	r.updated_at,
	e.entry_type,
	e.entry_value
FROM security_access_restrictions r
LEFT JOIN security_access_restriction_entries e ON e.restriction_id = r.id
WHERE r.company_id = $1
ORDER BY r.id ASC, e.id ASC;
`, companyID)
	if err != nil {
		return RulesResponse{}, err
	}

	type restrictedAccumulator struct {
		rule RestrictedAccessRule
	}

	orderedIDs := make([]int64, 0)
	byID := make(map[int64]*restrictedAccumulator)

	for restrictedRows.Next() {
		var (
			ruleID       int64
			subjectType  string
			subjectValue string
			role        string
			office       string
			isActive     bool
			createdAt    sql.NullTime
			updatedAt    sql.NullTime
			entryType    sql.NullString
			entryValue   sql.NullString
		)

		if err := restrictedRows.Scan(
			&ruleID,
			&subjectType,
			&subjectValue,
			&role,
			&office,
			&isActive,
			&createdAt,
			&updatedAt,
			&entryType,
			&entryValue,
		); err != nil {
			restrictedRows.Close()
			return RulesResponse{}, err
		}

		acc, ok := byID[ruleID]
		if !ok {
			rule := RestrictedAccessRule{
				ID:           ruleID,
				SubjectType:  subjectType,
				SubjectValue: subjectValue,
				Role:         role,
				Office:       office,
				IsActive:     isActive,
				AllowedIPs:   make([]string, 0),
				AllowedMACs:  make([]string, 0),
			}
			if createdAt.Valid {
				rule.CreatedAt = createdAt.Time
			}
			if updatedAt.Valid {
				rule.UpdatedAt = updatedAt.Time
			}

			acc = &restrictedAccumulator{rule: rule}
			byID[ruleID] = acc
			orderedIDs = append(orderedIDs, ruleID)
		}

		if !entryType.Valid || !entryValue.Valid {
			continue
		}

		typeToken := strings.ToLower(strings.TrimSpace(entryType.String))
		valueToken := strings.TrimSpace(entryValue.String)
		if valueToken == "" {
			continue
		}

		switch typeToken {
		case NetworkTypeIP:
			acc.rule.AllowedIPs = appendIfMissing(acc.rule.AllowedIPs, valueToken)
		case NetworkTypeMAC:
			acc.rule.AllowedMACs = appendIfMissing(acc.rule.AllowedMACs, valueToken)
		}
	}

	if err := restrictedRows.Err(); err != nil {
		restrictedRows.Close()
		return RulesResponse{}, err
	}
	restrictedRows.Close()

	for _, ruleID := range orderedIDs {
		response.RestrictedAccess = append(response.RestrictedAccess, byID[ruleID].rule)
	}

	return response, nil
}
