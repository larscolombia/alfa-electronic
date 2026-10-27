package crm

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (s *Service) ListProspectFollowups(companyID, prospectID string, includeSoftDeleted bool) ([]ProspectFollowup, error) {
	normalizedProspectID := strings.TrimSpace(prospectID)
	if normalizedProspectID == "" {
		return nil, errProspectIDRequired
	}

	softDeleteFilter := ""
	if !includeSoftDeleted {
		softDeleteFilter = "AND soft_delete = false"
	}

	rows, err := s.db.QueryContext(context.Background(), fmt.Sprintf(`
		SELECT id, prospect_id, tipo, fecha, hora, recordatorio, observacion, estado, registrado_por, contacto_nombre, soft_delete, created_at, updated_at
		FROM crm_prospect_followups
		WHERE company_id = $1 AND prospect_id = $2 %s
		ORDER BY fecha ASC, hora ASC, created_at DESC
	`, softDeleteFilter), companyID, normalizedProspectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ProspectFollowup, 0)
	for rows.Next() {
		var item ProspectFollowup
		var createdAt, updatedAt time.Time
		if err := rows.Scan(
			&item.ID,
			&item.ProspectID,
			&item.Tipo,
			&item.Fecha,
			&item.Hora,
			&item.Recordatorio,
			&item.Observacion,
			&item.Estado,
			&item.RegistradoPor,
			&item.ContactoNombre,
			&item.SoftDelete,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}
		item.CreatedAt = formatCRMDateTime(createdAt)
		item.UpdatedAt = formatCRMDateTime(updatedAt)
		items = append(items, item)
	}

	return items, rows.Err()
}

func (s *Service) CreateProspectFollowup(companyID, prospectID string, req UpsertProspectFollowupRequest) (ProspectFollowup, error) {
	normalizedProspectID := strings.TrimSpace(prospectID)
	if normalizedProspectID == "" {
		return ProspectFollowup{}, errProspectIDRequired
	}

	tipo := strings.TrimSpace(req.Tipo)
	if tipo == "" {
		return ProspectFollowup{}, errFollowupTypeRequired
	}

	fecha := strings.TrimSpace(req.Fecha)
	if fecha == "" {
		return ProspectFollowup{}, errFollowupDateRequired
	}

	hora := strings.TrimSpace(req.Hora)
	if hora == "" {
		return ProspectFollowup{}, errFollowupTimeRequired
	}

	recordatorio := strings.TrimSpace(req.Recordatorio)
	observacion := strings.TrimSpace(req.Observacion)
	registradoPor := strings.TrimSpace(req.RegistradoPor)
	if len(registradoPor) > 180 {
		return ProspectFollowup{}, newValidationError("el nombre de quien registra no puede superar 180 caracteres")
	}
	contactoNombre := strings.TrimSpace(req.ContactoNombre)
	status, err := normalizeFollowupStatus(req.Estado)
	if err != nil {
		return ProspectFollowup{}, err
	}

	if err := validateFollowupPayload(tipo, fecha, hora, recordatorio, observacion, contactoNombre); err != nil {
		return ProspectFollowup{}, err
	}

	id := uuid.NewString()
	now := time.Now()
	_, err = s.db.ExecContext(context.Background(), `
		INSERT INTO crm_prospect_followups (
			id, company_id, prospect_id, tipo, fecha, hora, recordatorio, observacion, estado, registrado_por, contacto_nombre, created_at, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
	`, id, companyID, normalizedProspectID, tipo, fecha, hora, recordatorio, observacion, status, registradoPor, contactoNombre, now)
	if err != nil {
		return ProspectFollowup{}, err
	}

	return ProspectFollowup{
		ID:             id,
		ProspectID:     normalizedProspectID,
		Tipo:           tipo,
		Fecha:          fecha,
		Hora:           hora,
		Recordatorio:   recordatorio,
		Observacion:    observacion,
		Estado:         status,
		RegistradoPor:  registradoPor,
		ContactoNombre: contactoNombre,
		CreatedAt:      formatCRMDateTime(now),
		UpdatedAt:      formatCRMDateTime(now),
	}, nil
}

func (s *Service) UpdateProspectFollowup(companyID, prospectID, followupID string, req UpsertProspectFollowupRequest) (ProspectFollowup, error) {
	normalizedProspectID := strings.TrimSpace(prospectID)
	if normalizedProspectID == "" {
		return ProspectFollowup{}, errProspectIDRequired
	}

	normalizedFollowupID := strings.TrimSpace(followupID)
	if normalizedFollowupID == "" {
		return ProspectFollowup{}, errFollowupIDRequired
	}

	tipo := strings.TrimSpace(req.Tipo)
	if tipo == "" {
		return ProspectFollowup{}, errFollowupTypeRequired
	}

	fecha := strings.TrimSpace(req.Fecha)
	if fecha == "" {
		return ProspectFollowup{}, errFollowupDateRequired
	}

	hora := strings.TrimSpace(req.Hora)
	if hora == "" {
		return ProspectFollowup{}, errFollowupTimeRequired
	}

	recordatorio := strings.TrimSpace(req.Recordatorio)
	observacion := strings.TrimSpace(req.Observacion)
	registradoPor := strings.TrimSpace(req.RegistradoPor)
	if len(registradoPor) > 180 {
		return ProspectFollowup{}, newValidationError("el nombre de quien registra no puede superar 180 caracteres")
	}
	contactoNombre := strings.TrimSpace(req.ContactoNombre)
	status, err := normalizeFollowupStatus(req.Estado)
	if err != nil {
		return ProspectFollowup{}, err
	}

	if err := validateFollowupPayload(tipo, fecha, hora, recordatorio, observacion, contactoNombre); err != nil {
		return ProspectFollowup{}, err
	}

	now := time.Now()
	result, err := s.db.ExecContext(context.Background(), `
		UPDATE crm_prospect_followups
		SET tipo = $1,
			fecha = $2,
			hora = $3,
			recordatorio = $4,
			observacion = $5,
			estado = $6,
			registrado_por = COALESCE(NULLIF($11, ''), registrado_por),
			contacto_nombre = COALESCE(NULLIF($12, ''), contacto_nombre),
			updated_at = $7
		WHERE id = $8
		  AND company_id = $9
		  AND prospect_id = $10
	`, tipo, fecha, hora, recordatorio, observacion, status, now, normalizedFollowupID, companyID, normalizedProspectID, registradoPor, contactoNombre)
	if err != nil {
		return ProspectFollowup{}, err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return ProspectFollowup{}, err
	}
	if affected == 0 {
		return ProspectFollowup{}, errFollowupNotFound
	}

	return ProspectFollowup{
		ID:             normalizedFollowupID,
		ProspectID:     normalizedProspectID,
		Tipo:           tipo,
		Fecha:          fecha,
		Hora:           hora,
		Recordatorio:   recordatorio,
		Observacion:    observacion,
		Estado:         status,
		RegistradoPor:  registradoPor,
		ContactoNombre: contactoNombre,
		UpdatedAt:      formatCRMDateTime(now),
	}, nil
}

func (s *Service) DeleteProspectFollowup(companyID, prospectID, followupID string) error {
	normalizedProspectID := strings.TrimSpace(prospectID)
	if normalizedProspectID == "" {
		return errProspectIDRequired
	}

	normalizedFollowupID := strings.TrimSpace(followupID)
	if normalizedFollowupID == "" {
		return errFollowupIDRequired
	}

	result, err := s.db.ExecContext(context.Background(), `
		UPDATE crm_prospect_followups
		SET soft_delete = true,
		    updated_at = NOW()
		WHERE id = $1
		  AND company_id = $2
		  AND prospect_id = $3
		  AND soft_delete = false
	`, normalizedFollowupID, companyID, normalizedProspectID)
	if err != nil {
		return err
	}

	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errFollowupNotFound
	}

	return nil
}

func isFollowupValidationError(err error) bool {
	var ve *validationError
	return errors.As(err, &ve)
}
