package crm

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (s *Service) ListClientContacts(companyID, clientID string) ([]ClientContact, error) {
	rows, err := s.db.QueryContext(context.Background(), `
		SELECT id, client_id, name, role, email, phone, notes, created_at, updated_at
		FROM crm_client_contacts
		WHERE company_id = $1 AND client_id = $2 AND soft_delete = false
		ORDER BY created_at ASC
	`, companyID, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	contacts := make([]ClientContact, 0)
	for rows.Next() {
		var c ClientContact
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&c.ID, &c.ClientID, &c.Name, &c.Role, &c.Email, &c.Phone, &c.Notes, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		c.CreatedAt = formatCRMDateTime(createdAt)
		c.UpdatedAt = formatCRMDateTime(updatedAt)
		contacts = append(contacts, c)
	}
	return contacts, rows.Err()
}

func (s *Service) CreateClientContact(companyID, clientID string, req UpsertClientContactRequest) (ClientContact, error) {
	if err := s.ensureClientExists(companyID, clientID); err != nil {
		return ClientContact{}, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return ClientContact{}, errContactNameRequired
	}
	email := strings.TrimSpace(req.Email)
	phone := strings.TrimSpace(req.Phone)
	role := strings.TrimSpace(req.Role)
	notes := strings.TrimSpace(req.Notes)
	if err := validateContactPayload(name, email, phone, role, notes); err != nil {
		return ClientContact{}, err
	}

	id := uuid.NewString()
	now := time.Now()

	_, err := s.db.ExecContext(context.Background(), `
		INSERT INTO crm_client_contacts (company_id, id, client_id, name, role, email, phone, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
	`, companyID, id, clientID, name, role, email, phone, notes, now)
	if err != nil {
		return ClientContact{}, err
	}

	return ClientContact{
		ID:        id,
		ClientID:  clientID,
		Name:      name,
		Role:      role,
		Email:     email,
		Phone:     phone,
		Notes:     notes,
		CreatedAt: formatCRMDateTime(now),
		UpdatedAt: formatCRMDateTime(now),
	}, nil
}

func (s *Service) UpdateClientContact(companyID, clientID, contactID string, req UpsertClientContactRequest) (ClientContact, error) {
	if strings.TrimSpace(contactID) == "" {
		return ClientContact{}, errContactIDRequired
	}
	if err := s.ensureClientExists(companyID, clientID); err != nil {
		return ClientContact{}, err
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return ClientContact{}, errContactNameRequired
	}
	email := strings.TrimSpace(req.Email)
	phone := strings.TrimSpace(req.Phone)
	role := strings.TrimSpace(req.Role)
	notes := strings.TrimSpace(req.Notes)
	if err := validateContactPayload(name, email, phone, role, notes); err != nil {
		return ClientContact{}, err
	}

	now := time.Now()
	res, err := s.db.ExecContext(context.Background(), `
		UPDATE crm_client_contacts
		SET name = $1, role = $2, email = $3, phone = $4, notes = $5, updated_at = $6
		WHERE company_id = $7 AND client_id = $8 AND id = $9 AND soft_delete = false
	`, name, role, email, phone, notes, now, companyID, clientID, contactID)
	if err != nil {
		return ClientContact{}, err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return ClientContact{}, errContactNotFound
	}

	return ClientContact{
		ID:        contactID,
		ClientID:  clientID,
		Name:      name,
		Role:      role,
		Email:     email,
		Phone:     phone,
		Notes:     notes,
		UpdatedAt: formatCRMDateTime(now),
	}, nil
}

func (s *Service) DeleteClientContact(companyID, clientID, contactID string) error {
	if strings.TrimSpace(contactID) == "" {
		return errContactIDRequired
	}

	res, err := s.db.ExecContext(context.Background(), `
		UPDATE crm_client_contacts
		SET soft_delete = true, updated_at = $1
		WHERE company_id = $2 AND id = $3 AND client_id = $4 AND soft_delete = false
	`, time.Now(), companyID, contactID, clientID)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return errContactNotFound
	}
	return nil
}

// ensureClientExists verifies the client exists for the company and is not soft-deleted.
func (s *Service) ensureClientExists(companyID, clientID string) error {
	var exists bool
	err := s.db.QueryRowContext(context.Background(), `
		SELECT EXISTS(
			SELECT 1 FROM crm_clients
			WHERE company_id = $1 AND id = $2 AND soft_delete = false
		)
	`, companyID, clientID).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return errClientNotFound
	}
	return nil
}
