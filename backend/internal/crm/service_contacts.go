package crm

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

var (
	errContactIDRequired   = errors.New("el id del contacto es obligatorio")
	errContactNotFound     = errors.New("contacto no encontrado")
	errContactNameRequired = errors.New("el nombre del contacto es obligatorio")
)

func (s *Service) ListProspectContacts(companyID, prospectID string) ([]ProspectContact, error) {
	rows, err := s.db.QueryContext(context.Background(), `
		SELECT id, prospect_id, name, email, phone, role, notes, created_at, updated_at
		FROM crm_prospect_contacts
		WHERE company_id = $1 AND prospect_id = $2
		ORDER BY created_at ASC
	`, companyID, prospectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	contacts := make([]ProspectContact, 0)
	for rows.Next() {
		var c ProspectContact
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&c.ID, &c.ProspectID, &c.Name, &c.Email, &c.Phone, &c.Role, &c.Notes, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		c.CreatedAt = formatCRMDateTime(createdAt)
		c.UpdatedAt = formatCRMDateTime(updatedAt)
		contacts = append(contacts, c)
	}
	return contacts, rows.Err()
}

func validateContactPayload(name, email, phone, role, notes string) error {
	if len(name) > 180 {
		return newValidationError("el nombre del contacto no puede superar 180 caracteres")
	}
	if email != "" {
		if len(email) > 180 {
			return newValidationError("el correo del contacto no puede superar 180 caracteres")
		}
		if !reEmail.MatchString(email) {
			return newValidationError("el formato del correo del contacto no es valido")
		}
	}
	if phone != "" {
		if len(phone) > 40 {
			return newValidationError("el telefono del contacto no puede superar 40 caracteres")
		}
		if !rePhone.MatchString(phone) {
			return newValidationError("el telefono del contacto contiene caracteres no validos")
		}
	}
	if len(role) > 120 {
		return newValidationError("el rol del contacto no puede superar 120 caracteres")
	}
	if len(notes) > 2000 {
		return newValidationError("las notas del contacto no pueden superar 2000 caracteres")
	}
	return nil
}

func (s *Service) CreateProspectContact(companyID, prospectID string, req UpsertProspectContactRequest) (ProspectContact, error) {
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return ProspectContact{}, errContactNameRequired
	}
	email := strings.TrimSpace(req.Email)
	phone := strings.TrimSpace(req.Phone)
	role := strings.TrimSpace(req.Role)
	notes := strings.TrimSpace(req.Notes)
	if err := validateContactPayload(name, email, phone, role, notes); err != nil {
		return ProspectContact{}, err
	}

	id := uuid.NewString()
	now := time.Now()

	_, err := s.db.ExecContext(context.Background(), `
		INSERT INTO crm_prospect_contacts (id, company_id, prospect_id, name, email, phone, role, notes, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
	`, id, companyID, prospectID, name, email, phone, role, notes, now)
	if err != nil {
		return ProspectContact{}, err
	}

	return ProspectContact{
		ID:         id,
		ProspectID: prospectID,
		Name:       name,
		Email:      email,
		Phone:      phone,
		Role:       role,
		Notes:      notes,
		CreatedAt:  formatCRMDateTime(now),
		UpdatedAt:  formatCRMDateTime(now),
	}, nil
}

func (s *Service) UpdateProspectContact(companyID, prospectID, contactID string, req UpsertProspectContactRequest) (ProspectContact, error) {
	if strings.TrimSpace(contactID) == "" {
		return ProspectContact{}, errContactIDRequired
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return ProspectContact{}, errContactNameRequired
	}
	email := strings.TrimSpace(req.Email)
	phone := strings.TrimSpace(req.Phone)
	role := strings.TrimSpace(req.Role)
	notes := strings.TrimSpace(req.Notes)
	if err := validateContactPayload(name, email, phone, role, notes); err != nil {
		return ProspectContact{}, err
	}

	now := time.Now()
	res, err := s.db.ExecContext(context.Background(), `
		UPDATE crm_prospect_contacts
		SET name = $1, email = $2, phone = $3, role = $4, notes = $5, updated_at = $6
		WHERE id = $7 AND company_id = $8 AND prospect_id = $9
	`, name, email, phone, role, notes, now, contactID, companyID, prospectID)
	if err != nil {
		return ProspectContact{}, err
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return ProspectContact{}, err
	}
	if rowsAffected == 0 {
		return ProspectContact{}, errContactNotFound
	}

	return ProspectContact{
		ID:         contactID,
		ProspectID: prospectID,
		Name:       name,
		Email:      strings.TrimSpace(req.Email),
		Phone:      strings.TrimSpace(req.Phone),
		Role:       strings.TrimSpace(req.Role),
		Notes:      strings.TrimSpace(req.Notes),
		UpdatedAt:  formatCRMDateTime(now),
	}, nil
}

func (s *Service) DeleteProspectContact(companyID, prospectID, contactID string) error {
	if strings.TrimSpace(contactID) == "" {
		return errContactIDRequired
	}

	res, err := s.db.ExecContext(context.Background(), `
		DELETE FROM crm_prospect_contacts
		WHERE id = $1 AND company_id = $2 AND prospect_id = $3
	`, contactID, companyID, prospectID)
	if err != nil {
		return err
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return errContactNotFound
	}
	return nil
}
