package security

import (
	"context"
	"strings"
)

func (s *Service) ReplaceRules(ctx context.Context, companyID string, req ReplaceRulesRequest) error {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return errCompanyIDRequired
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM security_access_global_rules WHERE company_id = $1;`, companyID); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `DELETE FROM security_access_restrictions WHERE company_id = $1;`, companyID); err != nil {
		return err
	}

	for _, globalRule := range req.GlobalAccess {
		subjectType, subjectValue, err := normalizeSubject(globalRule.SubjectType, globalRule.SubjectValue)
		if err != nil {
			return err
		}

		role, err := normalizeRole(globalRule.Role)
		if err != nil {
			return err
		}

		reason := strings.TrimSpace(globalRule.Reason)
		isActive := true
		if globalRule.IsActive != nil {
			isActive = *globalRule.IsActive
		}

		if _, err := tx.ExecContext(ctx, `
INSERT INTO security_access_global_rules (
	company_id,
	subject_type,
	subject_value,
	role,
	reason,
	is_active,
	created_at,
	updated_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());
`, companyID, subjectType, subjectValue, role, reason, isActive); err != nil {
			return err
		}
	}

	for _, restrictedRule := range req.RestrictedAccess {
		subjectType, subjectValue, err := normalizeSubject(restrictedRule.SubjectType, restrictedRule.SubjectValue)
		if err != nil {
			return err
		}

		role, err := normalizeRole(restrictedRule.Role)
		if err != nil {
			return err
		}

		allowedIPs, err := normalizeIPTokens(restrictedRule.AllowedIPs)
		if err != nil {
			return err
		}

		allowedMACs, err := normalizeMACTokens(restrictedRule.AllowedMACs)
		if err != nil {
			return err
		}

		if len(allowedIPs) == 0 && len(allowedMACs) == 0 {
			return errRestrictedRuleNetworks
		}

		office := strings.TrimSpace(restrictedRule.Office)
		if office == "" {
			office = "Oficina principal"
		}

		isActive := true
		if restrictedRule.IsActive != nil {
			isActive = *restrictedRule.IsActive
		}

		var restrictionID int64
		if err := tx.QueryRowContext(ctx, `
INSERT INTO security_access_restrictions (
	company_id,
	subject_type,
	subject_value,
	role,
	office,
	is_active,
	created_at,
	updated_at
) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
RETURNING id;
`, companyID, subjectType, subjectValue, role, office, isActive).Scan(&restrictionID); err != nil {
			return err
		}

		for _, ipToken := range allowedIPs {
			if _, err := tx.ExecContext(ctx, `
INSERT INTO security_access_restriction_entries (
	restriction_id,
	entry_type,
	entry_value,
	created_at
) VALUES ($1, $2, $3, NOW());
`, restrictionID, NetworkTypeIP, ipToken); err != nil {
				return err
			}
		}

		for _, macToken := range allowedMACs {
			if _, err := tx.ExecContext(ctx, `
INSERT INTO security_access_restriction_entries (
	restriction_id,
	entry_type,
	entry_value,
	created_at
) VALUES ($1, $2, $3, NOW());
`, restrictionID, NetworkTypeMAC, macToken); err != nil {
				return err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}
