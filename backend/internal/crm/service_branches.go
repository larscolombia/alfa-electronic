package crm

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const maxBranchesPerRecord = 20

type normalizedBranchInput struct {
	Name        string
	ContactName string
	ContactRole string
	Email       string
	Phone       string
	Country     string
	City        string
	Address     string
	IsPrimary   bool
}

func normalizeBranchesInput(branches []UpsertBranchRequest) ([]normalizedBranchInput, error) {
	if len(branches) == 0 {
		return []normalizedBranchInput{}, nil
	}
	if len(branches) > maxBranchesPerRecord {
		return nil, newValidationError("no puedes registrar mas de 20 sucursales por registro")
	}

	normalized := make([]normalizedBranchInput, 0, len(branches))
	primaryCount := 0

	for index, branch := range branches {
		name := strings.TrimSpace(branch.Name)
		contactName := strings.TrimSpace(branch.ContactName)
		contactRole := strings.TrimSpace(branch.ContactRole)
		email := strings.TrimSpace(branch.Email)
		phone := strings.TrimSpace(branch.Phone)
		country := strings.TrimSpace(branch.Country)
		city := strings.TrimSpace(branch.City)
		address := strings.TrimSpace(branch.Address)
		hasContent := name != "" || contactName != "" || contactRole != "" || email != "" || phone != "" || country != "" || city != "" || address != "" || branch.IsPrimary

		if !hasContent {
			continue
		}

		label := fmt.Sprintf("la sucursal #%d", index+1)
		if name == "" {
			return nil, newValidationError(label + " debe tener nombre")
		}
		if len(name) > 180 {
			return nil, newValidationError(label + " no puede superar 180 caracteres en nombre")
		}
		if len(contactName) > 180 {
			return nil, newValidationError(label + " no puede superar 180 caracteres en contacto")
		}
		if len(contactRole) > 120 {
			return nil, newValidationError(label + " no puede superar 120 caracteres en rol de contacto")
		}
		if email != "" {
			if len(email) > 180 {
				return nil, newValidationError(label + " no puede superar 180 caracteres en correo")
			}
			if !reEmail.MatchString(email) {
				return nil, newValidationError(label + " tiene un correo con formato invalido")
			}
		}
		if phone != "" {
			if len(phone) > 40 {
				return nil, newValidationError(label + " no puede superar 40 caracteres en telefono")
			}
			if !rePhone.MatchString(phone) {
				return nil, newValidationError(label + " tiene un telefono con caracteres no validos")
			}
		}
		if len(country) > 120 {
			return nil, newValidationError(label + " no puede superar 120 caracteres en pais")
		}
		if len(city) > 120 {
			return nil, newValidationError(label + " no puede superar 120 caracteres en ciudad")
		}
		if len(address) > 500 {
			return nil, newValidationError(label + " no puede superar 500 caracteres en direccion")
		}

		if branch.IsPrimary {
			primaryCount++
		}

		normalized = append(normalized, normalizedBranchInput{
			Name:        name,
			ContactName: contactName,
			ContactRole: contactRole,
			Email:       email,
			Phone:       phone,
			Country:     country,
			City:        city,
			Address:     address,
			IsPrimary:   branch.IsPrimary,
		})
	}

	if len(normalized) > 0 {
		if primaryCount > 1 {
			return nil, newValidationError("solo una sucursal puede marcarse como principal")
		}
		if primaryCount == 0 {
			normalized[0].IsPrimary = true
		}
	}

	return normalized, nil
}

func (s *Service) listClientBranches(ctx context.Context, companyID, clientID string) ([]Branch, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, name, contact_name, contact_role, email, phone, country, city, address, is_primary, created_at, updated_at
FROM crm_client_branches
WHERE company_id = $1
  AND client_id = $2
ORDER BY is_primary DESC, created_at ASC;
`, companyID, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	branches := make([]Branch, 0)
	for rows.Next() {
		item, err := scanBranch(rows)
		if err != nil {
			return nil, err
		}
		branches = append(branches, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return branches, nil
}

func (s *Service) listProspectBranches(ctx context.Context, companyID, prospectID string) ([]Branch, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, name, contact_name, contact_role, email, phone, country, city, address, is_primary, created_at, updated_at
FROM crm_prospect_branches
WHERE company_id = $1
  AND prospect_id = $2
ORDER BY is_primary DESC, created_at ASC;
`, companyID, prospectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	branches := make([]Branch, 0)
	for rows.Next() {
		item, err := scanBranch(rows)
		if err != nil {
			return nil, err
		}
		branches = append(branches, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return branches, nil
}

func scanBranch(scanner interface{ Scan(dest ...any) error }) (Branch, error) {
	var (
		item      Branch
		createdAt time.Time
		updatedAt time.Time
	)

	if err := scanner.Scan(
		&item.ID,
		&item.Name,
		&item.ContactName,
		&item.ContactRole,
		&item.Email,
		&item.Phone,
		&item.Country,
		&item.City,
		&item.Address,
		&item.IsPrimary,
		&createdAt,
		&updatedAt,
	); err != nil {
		return Branch{}, err
	}

	item.CreatedAt = formatCRMDateTime(createdAt)
	item.UpdatedAt = formatCRMDateTime(updatedAt)
	return item, nil
}

func (s *Service) replaceClientBranches(ctx context.Context, companyID, clientID string, branches []normalizedBranchInput) error {
	if _, err := s.db.ExecContext(ctx, `
DELETE FROM crm_client_branches
WHERE company_id = $1
  AND client_id = $2;
`, companyID, clientID); err != nil {
		return err
	}

	for _, branch := range branches {
		if _, err := s.db.ExecContext(ctx, `
INSERT INTO crm_client_branches (
	company_id, id, client_id, name, contact_name, contact_role, email, phone, country, city, address, is_primary, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
);
`, companyID, uuid.NewString(), clientID, branch.Name, branch.ContactName, branch.ContactRole, branch.Email, branch.Phone, branch.Country, branch.City, branch.Address, branch.IsPrimary); err != nil {
			return err
		}
	}

	return nil
}

func (s *Service) replaceProspectBranches(ctx context.Context, companyID, prospectID string, branches []normalizedBranchInput) error {
	if _, err := s.db.ExecContext(ctx, `
DELETE FROM crm_prospect_branches
WHERE company_id = $1
  AND prospect_id = $2;
`, companyID, prospectID); err != nil {
		return err
	}

	for _, branch := range branches {
		if _, err := s.db.ExecContext(ctx, `
INSERT INTO crm_prospect_branches (
	company_id, id, prospect_id, name, contact_name, contact_role, email, phone, country, city, address, is_primary, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
);
`, companyID, uuid.NewString(), prospectID, branch.Name, branch.ContactName, branch.ContactRole, branch.Email, branch.Phone, branch.Country, branch.City, branch.Address, branch.IsPrimary); err != nil {
			return err
		}
	}

	return nil
}
