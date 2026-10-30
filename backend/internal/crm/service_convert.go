package crm

import (
	"context"
	"strings"
)

// ConvertProspectToClient creates a CRM client from a prospect's data, propagating all
// profile fields. It is idempotent: if a client with the same empresa already exists
// for this company, it returns the existing client instead of creating a duplicate.
func (s *Service) ConvertProspectToClient(companyID, prospectID string) (Client, bool, error) {
	prospect, err := s.GetProspect(companyID, prospectID)
	if err != nil {
		return Client{}, false, err
	}

	// Check for an existing client with matching empresa (case-insensitive).
	empresa := strings.TrimSpace(prospect.Company)
	if empresa == "" {
		empresa = strings.TrimSpace(prospect.Name)
	}

	existing, err := s.findClientByEmpresa(companyID, empresa)
	if err == nil {
		if err := s.markProspectConverted(companyID, prospectID); err != nil {
			return Client{}, false, err
		}
		return existing, false, nil
	}

	// Build the client zone, falling back to a sane default.
	zona := strings.TrimSpace(prospect.Zone)
	if zona == "" {
		zona = "General"
	}

	website := strings.TrimSpace(prospect.Website)
	officePhone := strings.TrimSpace(prospect.OfficePhone)
	country := strings.TrimSpace(prospect.Country)
	city := strings.TrimSpace(prospect.City)
	address := strings.TrimSpace(prospect.Address)

	// Convert prospect branches to client branch requests.
	branchRequests := make([]UpsertBranchRequest, 0, len(prospect.Branches))
	for _, b := range prospect.Branches {
		branchRequests = append(branchRequests, UpsertBranchRequest{
			Name:        b.Name,
			ContactName: b.ContactName,
			ContactRole: b.ContactRole,
			Email:       b.Email,
			Phone:       b.Phone,
			Country:     b.Country,
			City:        b.City,
			Address:     b.Address,
			IsPrimary:   b.IsPrimary,
		})
	}

	req := UpsertClientRequest{
		Nombre:      strings.TrimSpace(prospect.Name),
		Correo:      strings.TrimSpace(prospect.Email),
		Empresa:     empresa,
		Nit:         strings.TrimSpace(prospect.Nit),
		Zona:        zona,
		Estado:      ClientStatusActive,
		Website:     website,
		OfficePhone: officePhone,
		Country:     country,
		City:        city,
		Address:     address,
		Credito: ClientCreditProfile{
			Enabled:         false,
			CreditLimit:     0,
			Consumed:        0,
			LastPaymentDate: "",
			PaymentTermDays: 30,
		},
		Branches: branchRequests,
	}

	created, err := s.CreateClient(companyID, req)
	if err != nil {
		return Client{}, false, err
	}

	if err := s.markProspectConverted(companyID, prospectID); err != nil {
		return Client{}, false, err
	}
	return created, true, nil
}

func (s *Service) markProspectConverted(companyID, prospectID string) error {
	ctx := context.Background()
	result, err := s.db.ExecContext(ctx, `
UPDATE crm_prospects SET soft_delete = true, updated_at = NOW()
WHERE company_id = $1 AND id = $2 AND soft_delete = false;`, companyID, prospectID)
	if err != nil {
		return err
	}
	if affected, _ := result.RowsAffected(); affected == 0 {
		return errProspectNotFound
	}
	_, err = s.db.ExecContext(ctx, `
UPDATE crm_accounts SET lifecycle_status = 'cliente', converted_at = COALESCE(converted_at, NOW()), updated_at = NOW()
WHERE company_id = $1 AND id = $2 AND soft_delete = false;`, companyID, prospectID)
	return err
}

// findClientByEmpresa looks for a non-deleted client matching empresa (case-insensitive).
func (s *Service) findClientByEmpresa(companyID, empresa string) (Client, error) {
	ctx := context.Background()
	normalized := strings.ToLower(strings.TrimSpace(empresa))

	row := s.db.QueryRowContext(ctx, `
SELECT id, nombre, correo, empresa, nit, zona, estado, website, office_phone, country, city, address,
	COALESCE(dv, ''), COALESCE(postal_code, ''), COALESCE(billing_email, ''), grand_contributor, id_type,
	credit_enabled, credit_limit, credit_consumed, last_payment_date, payment_term_days, created_at
FROM crm_clients
WHERE company_id = $1
  AND LOWER(empresa) = $2
  AND soft_delete = false
ORDER BY created_at ASC
LIMIT 1;
`, companyID, normalized)

	item, err := scanClient(row)
	if err != nil {
		return Client{}, err
	}

	item.Branches, err = s.listClientBranches(ctx, companyID, item.ID)
	if err != nil {
		return Client{}, err
	}

	return item, nil
}

// ListClientRelatedContacts returns all prospect contacts in the company that share the
// same empresa name (case-insensitive) as the given client. This aggregates contacts
// from multiple prospects of the same company.
func (s *Service) ListClientRelatedContacts(companyID, clientID string) ([]ProspectContact, error) {
	ctx := context.Background()

	// Resolve client empresa first.
	var empresa string
	err := s.db.QueryRowContext(ctx, `
SELECT empresa FROM crm_clients
WHERE company_id = $1 AND id = $2 AND soft_delete = false;
`, companyID, clientID).Scan(&empresa)
	if err != nil {
		return nil, errClientNotFound
	}

	empresa = strings.TrimSpace(empresa)
	if empresa == "" {
		return []ProspectContact{}, nil
	}

	// Find all prospect IDs with matching company.
	rows, err := s.db.QueryContext(ctx, `
SELECT id FROM crm_prospects
WHERE company_id = $1
  AND LOWER(company) = LOWER($2)
  AND deleted_at IS NULL;
`, companyID, empresa)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var prospectIDs []string
	for rows.Next() {
		var pid string
		if err := rows.Scan(&pid); err != nil {
			return nil, err
		}
		prospectIDs = append(prospectIDs, pid)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(prospectIDs) == 0 {
		return []ProspectContact{}, nil
	}

	// Collect all contacts for those prospects.
	contacts := make([]ProspectContact, 0)
	seen := map[string]struct{}{}

	for _, pid := range prospectIDs {
		batch, err := s.ListProspectContacts(companyID, pid)
		if err != nil {
			continue
		}
		for _, c := range batch {
			dedupeKey := strings.ToLower(c.Name + "|" + c.Email)
			if _, exists := seen[dedupeKey]; exists {
				continue
			}
			seen[dedupeKey] = struct{}{}
			contacts = append(contacts, c)
		}
	}

	return contacts, nil
}
