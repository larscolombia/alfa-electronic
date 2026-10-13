package remissions

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
)

func (s *Service) Update(companyID, id string, req UpsertRemissionRequest) (*Remission, error) {
	itemsJSON, err := json.Marshal(req.Items)
	if err != nil {
		return nil, fmt.Errorf("serializar items: %w", err)
	}
	photosJSON, err := json.Marshal(req.DispatchPhotos)
	if err != nil {
		return nil, fmt.Errorf("serializar fotos: %w", err)
	}

	res, err := s.db.Exec(`
		UPDATE remissions SET
			client_name = $3, client_nit = $4, dispatch_type = $5,
			carrier_name = $6, guide_number = $7, purchase_order = $8,
			youtube_link = $9, dispatch_photos = $10, items = $11,
			valued = $12, total_value = $13, warranty_months = $14,
			notes = $15, updated_at = NOW()
		WHERE company_id = $1 AND id = $2`,
		companyID, id,
		req.ClientName, req.ClientNIT, req.DispatchType,
		req.CarrierName, req.GuideNumber, req.PurchaseOrder,
		req.YoutubeLink, photosJSON, itemsJSON,
		req.Valued, computeTotalValue(req.Items), req.WarrantyMonths,
		req.Notes,
	)
	if err != nil {
		return nil, fmt.Errorf("actualizar remision: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return nil, err
	}
	if affected == 0 {
		return nil, errRemissionNotFound
	}
	return s.Get(companyID, id)
}

func (s *Service) UpdateDeliveryStatus(companyID, id, status string) (*Remission, error) {
	if status != "entregado" && status != "pendiente" {
		return nil, fmt.Errorf("estado de entrega invalido: %s", status)
	}

	tx, err := s.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var current string
	err = tx.QueryRow(
		`SELECT delivery_status FROM remissions WHERE company_id = $1 AND id = $2 FOR UPDATE`,
		companyID, id,
	).Scan(&current)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errRemissionNotFound
	}
	if err != nil {
		return nil, err
	}
	if current == "entregado" && status == "pendiente" {
		return nil, fmt.Errorf("no se puede revertir una remision ya entregada")
	}

	if _, err := tx.Exec(
		`UPDATE remissions SET delivery_status = $3, updated_at = NOW() WHERE company_id = $1 AND id = $2`,
		companyID, id, status,
	); err != nil {
		return nil, fmt.Errorf("actualizar estado de entrega: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return s.Get(companyID, id)
}

func (s *Service) Delete(companyID, id string) error {
	res, err := s.db.Exec(
		`DELETE FROM remissions WHERE company_id = $1 AND id = $2`,
		companyID, id,
	)
	if err != nil {
		return fmt.Errorf("eliminar remision: %w", err)
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return errRemissionNotFound
	}
	return nil
}
