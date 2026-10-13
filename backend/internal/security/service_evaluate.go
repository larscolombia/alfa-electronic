package security

import (
	"context"
	"database/sql"
	"strings"
)

func (s *Service) Evaluate(ctx context.Context, subject Subject, source Source) (Decision, error) {
	companyID := strings.TrimSpace(subject.CompanyID)
	if companyID == "" {
		return Decision{}, errCompanyIDRequired
	}

	email := strings.ToLower(strings.TrimSpace(subject.Email))
	role := strings.ToLower(strings.TrimSpace(subject.Role))
	if email == "" && role == "" {
		return Decision{Allowed: false, Reason: "acceso denegado: no se pudo identificar el usuario"}, nil
	}

	var hasGlobalAccess bool
	if err := s.db.QueryRowContext(ctx, `
SELECT EXISTS (
	SELECT 1
	FROM security_access_global_rules
	WHERE company_id = $1
	  AND is_active = true
	  AND (
		(subject_type = 'user' AND LOWER(subject_value) = $2)
		OR
		(subject_type = 'role' AND LOWER(subject_value) = $3)
	  )
);
`, companyID, email, role).Scan(&hasGlobalAccess); err != nil {
		return Decision{}, err
	}

	if hasGlobalAccess {
		return Decision{Allowed: true, Reason: "acceso permitido por regla global"}, nil
	}

	matchers, hasRestrictions, err := s.loadRestrictionMatchers(ctx, companyID, email, role)
	if err != nil {
		return Decision{}, err
	}

	if !hasRestrictions {
		return Decision{Allowed: true, Reason: "acceso permitido: no hay restricciones para el sujeto"}, nil
	}

	sourceIP, hasSourceIP := normalizeIPLiteral(source.IP)
	sourceMAC, hasSourceMAC := normalizeMACToken(source.MAC)

	for _, matcher := range matchers {
		if hasSourceIP {
			for _, token := range matcher.allowedIPs {
				if ipMatchesToken(sourceIP, token) {
					return Decision{Allowed: true, Reason: "acceso permitido por coincidencia de IP"}, nil
				}
			}
		}

		if hasSourceMAC {
			for _, token := range matcher.allowedMACs {
				normalizedToken, ok := normalizeMACToken(token)
				if ok && normalizedToken == sourceMAC {
					return Decision{Allowed: true, Reason: "acceso permitido por coincidencia de MAC"}, nil
				}
			}
		}
	}

	return Decision{Allowed: false, Reason: "acceso denegado: IP/MAC no autorizada para este usuario o rol"}, nil
}

func (s *Service) loadRestrictionMatchers(ctx context.Context, companyID, email, role string) ([]restrictionMatcher, bool, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT r.id, e.entry_type, e.entry_value
FROM security_access_restrictions r
LEFT JOIN security_access_restriction_entries e ON e.restriction_id = r.id
WHERE r.company_id = $1
  AND r.is_active = true
  AND (
	(r.subject_type = 'user' AND LOWER(r.subject_value) = $2)
	OR
	(r.subject_type = 'role' AND LOWER(r.subject_value) = $3)
  )
ORDER BY r.id ASC, e.id ASC;
`, companyID, email, role)
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()

	orderedIDs := make([]int64, 0)
	byRuleID := make(map[int64]*restrictionMatcher)

	for rows.Next() {
		var ruleID int64
		var entryType sql.NullString
		var entryValue sql.NullString
		if err := rows.Scan(&ruleID, &entryType, &entryValue); err != nil {
			return nil, false, err
		}

		matcher, ok := byRuleID[ruleID]
		if !ok {
			matcher = &restrictionMatcher{
				allowedIPs:  make([]string, 0),
				allowedMACs: make([]string, 0),
			}
			byRuleID[ruleID] = matcher
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
			matcher.allowedIPs = appendIfMissing(matcher.allowedIPs, valueToken)
		case NetworkTypeMAC:
			matcher.allowedMACs = appendIfMissing(matcher.allowedMACs, valueToken)
		}
	}

	if err := rows.Err(); err != nil {
		return nil, false, err
	}

	if len(orderedIDs) == 0 {
		return nil, false, nil
	}

	matchers := make([]restrictionMatcher, 0, len(orderedIDs))
	for _, ruleID := range orderedIDs {
		matchers = append(matchers, *byRuleID[ruleID])
	}

	return matchers, true, nil
}
