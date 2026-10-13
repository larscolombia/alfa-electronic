package remissions

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

var errRemissionNotFound = errors.New("remision no encontrada")

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func computeTotalValue(items []RemissionItem) float64 {
	total := 0.0
	for _, item := range items {
		total += item.UnitPrice * float64(item.Quantity)
	}
	return total
}

func formatConsecutive(seq int, now time.Time) string {
	return fmt.Sprintf("E-CO-%02d%02d-%04d", now.Year()%100, now.Month(), seq)
}

const remissionColumns = `id, consecutive, company_id, client_name, client_nit,
	dispatch_type, carrier_name, guide_number, purchase_order, youtube_link,
	dispatch_photos, items, valued, total_value, warranty_months, notes,
	status, delivery_status, created_by, created_at, updated_at`

func scanRemission(row interface{ Scan(...any) error }) (*Remission, error) {
	var r Remission
	var photosJSON, itemsJSON []byte
	var createdAt, updatedAt time.Time
	err := row.Scan(
		&r.ID, &r.Consecutive, &r.CompanyID, &r.ClientName, &r.ClientNIT,
		&r.DispatchType, &r.CarrierName, &r.GuideNumber, &r.PurchaseOrder, &r.YoutubeLink,
		&photosJSON, &itemsJSON, &r.Valued, &r.TotalValue, &r.WarrantyMonths, &r.Notes,
		&r.Status, &r.DeliveryStatus, &r.CreatedBy, &createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(itemsJSON, &r.Items); err != nil {
		return nil, fmt.Errorf("decodificar items: %w", err)
	}
	if err := json.Unmarshal(photosJSON, &r.DispatchPhotos); err != nil {
		return nil, fmt.Errorf("decodificar fotos: %w", err)
	}
	r.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return &r, nil
}

func (s *Service) List(companyID string) ([]Remission, error) {
	rows, err := s.db.Query(
		`SELECT `+remissionColumns+` FROM remissions WHERE company_id = $1 ORDER BY created_at DESC, id DESC`,
		companyID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Remission, 0)
	for rows.Next() {
		r, err := scanRemission(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *r)
	}
	return items, rows.Err()
}

func (s *Service) Get(companyID, id string) (*Remission, error) {
	row := s.db.QueryRow(
		`SELECT `+remissionColumns+` FROM remissions WHERE company_id = $1 AND id = $2`,
		companyID, id,
	)
	r, err := scanRemission(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errRemissionNotFound
	}
	return r, err
}

func (s *Service) Create(companyID string, req UpsertRemissionRequest, createdBy string) (Remission, error) {
	itemsJSON, err := json.Marshal(req.Items)
	if err != nil {
		return Remission{}, fmt.Errorf("serializar items: %w", err)
	}
	photosJSON, err := json.Marshal(req.DispatchPhotos)
	if err != nil {
		return Remission{}, fmt.Errorf("serializar fotos: %w", err)
	}

	tx, err := s.db.Begin()
	if err != nil {
		return Remission{}, err
	}
	defer tx.Rollback()

	var seq int
	err = tx.QueryRow(`
		INSERT INTO remission_sequences (company_id, next_value)
		VALUES ($1, 2)
		ON CONFLICT (company_id)
		DO UPDATE SET next_value = remission_sequences.next_value + 1
		RETURNING next_value - 1`, companyID).Scan(&seq)
	if err != nil {
		return Remission{}, fmt.Errorf("generar consecutivo: %w", err)
	}

	now := time.Now().UTC()
	r := Remission{
		ID:             fmt.Sprintf("rem-%d", now.UnixNano()),
		Consecutive:    formatConsecutive(seq, now),
		CompanyID:      companyID,
		ClientName:     req.ClientName,
		ClientNIT:      req.ClientNIT,
		DispatchType:   req.DispatchType,
		CarrierName:    req.CarrierName,
		GuideNumber:    req.GuideNumber,
		Items:          req.Items,
		Valued:         req.Valued,
		TotalValue:     computeTotalValue(req.Items),
		WarrantyMonths: req.WarrantyMonths,
		Notes:          req.Notes,
		PurchaseOrder:  req.PurchaseOrder,
		YoutubeLink:    req.YoutubeLink,
		DispatchPhotos: req.DispatchPhotos,
		DeliveryStatus: "pendiente",
		CreatedAt:      now.Format(time.RFC3339),
		CreatedBy:      createdBy,
		Status:         "borrador",
	}

	_, err = tx.Exec(`
		INSERT INTO remissions (
			id, company_id, consecutive, client_name, client_nit,
			dispatch_type, carrier_name, guide_number, purchase_order, youtube_link,
			dispatch_photos, items, valued, total_value, warranty_months, notes,
			status, delivery_status, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $20)`,
		r.ID, r.CompanyID, r.Consecutive, r.ClientName, r.ClientNIT,
		r.DispatchType, r.CarrierName, r.GuideNumber, r.PurchaseOrder, r.YoutubeLink,
		photosJSON, itemsJSON, r.Valued, r.TotalValue, r.WarrantyMonths, r.Notes,
		r.Status, r.DeliveryStatus, r.CreatedBy, now,
	)
	if err != nil {
		return Remission{}, fmt.Errorf("insertar remision: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return Remission{}, err
	}
	return r, nil
}
