package remissions

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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

// remissionColumns incluye, además de las columnas propias de `remissions`,
// tres valores COMPUTADOS por JOIN que la UI necesita para el puente
// pago→despacho (Fase 5c): el estado y la referencia de la factura vinculada y
// si el cliente es de crédito. Se calculan en el servidor a propósito: dejar
// que el navegador derive la regla es lo que hoy permite marcar "entregado"
// sin que nadie valide el pago.
//
// El JOIN a crm_clients es LATERAL con LIMIT 1 porque `remissions` sólo tiene
// client_nit/client_name (no client_id) y un cliente puede repetir nombre: sin
// el LIMIT una remisión saldría duplicada en el listado.
const remissionColumns = `r.id, r.consecutive, r.company_id, r.client_name, r.client_nit, r.contact_name,
	r.dispatch_type, r.carrier_name, r.guide_number, r.purchase_order, r.youtube_link,
	r.dispatch_photos, r.items, r.valued, r.total_value, r.warranty_months, r.notes,
	r.status, r.delivery_status, r.created_by, r.created_at, r.updated_at,
	r.invoice_id, r.payment_override, r.payment_override_by, r.payment_override_at,
	COALESCE(fi.status, '') AS invoice_status,
	COALESCE(fi.reference_code, '') AS invoice_reference,
	COALESCE(cc.credit_enabled, false) AS client_credit_enabled`

const remissionJoins = `
	LEFT JOIN finance_invoices fi
		ON fi.company_id = r.company_id AND fi.id = r.invoice_id AND fi.soft_delete = false
	LEFT JOIN LATERAL (
		SELECT credit_enabled
		FROM crm_clients cc
		WHERE cc.company_id = r.company_id
		  AND cc.soft_delete = false
		  AND (
			(r.client_nit <> '' AND lower(cc.nit) = lower(r.client_nit))
			OR (r.client_nit = '' AND r.client_name <> ''
				AND (lower(cc.empresa) = lower(r.client_name) OR lower(cc.nombre) = lower(r.client_name)))
		  )
		ORDER BY cc.updated_at DESC
		LIMIT 1
	) cc ON true`

func scanRemission(row interface{ Scan(...any) error }) (*Remission, error) {
	var r Remission
	var photosJSON, itemsJSON []byte
	var createdAt, updatedAt time.Time
	var overrideAt sql.NullTime
	err := row.Scan(
		&r.ID, &r.Consecutive, &r.CompanyID, &r.ClientName, &r.ClientNIT, &r.ContactName,
		&r.DispatchType, &r.CarrierName, &r.GuideNumber, &r.PurchaseOrder, &r.YoutubeLink,
		&photosJSON, &itemsJSON, &r.Valued, &r.TotalValue, &r.WarrantyMonths, &r.Notes,
		&r.Status, &r.DeliveryStatus, &r.CreatedBy, &createdAt, &updatedAt,
		&r.InvoiceID, &r.PaymentOverride, &r.PaymentOverrideBy, &overrideAt,
		&r.InvoiceStatus, &r.InvoiceReference, &r.CreditClient,
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
	if overrideAt.Valid {
		r.PaymentOverrideAt = overrideAt.Time.UTC().Format(time.RFC3339)
	}
	r.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	applyPaymentGate(&r)
	return &r, nil
}

func (s *Service) List(companyID string) ([]Remission, error) {
	rows, err := s.db.Query(
		`SELECT `+remissionColumns+` FROM remissions r`+remissionJoins+
			` WHERE r.company_id = $1 ORDER BY r.created_at DESC, r.id DESC`,
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
		`SELECT `+remissionColumns+` FROM remissions r`+remissionJoins+
			` WHERE r.company_id = $1 AND r.id = $2`,
		companyID, id,
	)
	r, err := scanRemission(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errRemissionNotFound
	}
	return r, err
}

func (s *Service) Create(companyID string, req UpsertRemissionRequest, createdBy string) (Remission, error) {
	if err := validateUpsert(req); err != nil {
		return Remission{}, err
	}

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

	now := time.Now().UTC()
	// FASE 6: el consecutivo se reinicia cada mes (E-CO-YYMM-NNNN); el
	// contador queda claveado por (company_id, periodo YYMM).
	period := fmt.Sprintf("%02d%02d", now.Year()%100, int(now.Month()))
	var seq int
	err = tx.QueryRow(`
		INSERT INTO remission_sequences (company_id, period, next_value)
		VALUES ($1, $2, 2)
		ON CONFLICT (company_id, period)
		DO UPDATE SET next_value = remission_sequences.next_value + 1
		RETURNING next_value - 1`, companyID, period).Scan(&seq)
	if err != nil {
		return Remission{}, fmt.Errorf("generar consecutivo: %w", err)
	}
	r := Remission{
		ID:             fmt.Sprintf("rem-%d", now.UnixNano()),
		Consecutive:    formatConsecutive(seq, now),
		CompanyID:      companyID,
		ClientName:     req.ClientName,
		ClientNIT:      req.ClientNIT,
		ContactName:    strings.TrimSpace(req.ContactName),
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
		// Fase 5c: la factura a cobrar antes de despachar. Una remisión nueva
		// nunca nace con override: el override es un acto explícito de admin.
		InvoiceID: normalizeInvoiceID(req.InvoiceID),
	}

	// updated_at se deja fuera a propósito: la columna trae DEFAULT NOW()
	// (migrations_remissions.go). Incluirlo en la lista de columnas obliga a
	// pasar un 23er valor y rompe el INSERT con SQLSTATE 42601 — bug latente
	// heredado que dejaba 22 columnas contra 21 placeholders.
	_, err = tx.Exec(`
		INSERT INTO remissions (
			id, company_id, consecutive, client_name, client_nit, contact_name,
			dispatch_type, carrier_name, guide_number, purchase_order, youtube_link,
			dispatch_photos, items, valued, total_value, warranty_months, notes,
			status, delivery_status, created_by, created_at, invoice_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
		r.ID, r.CompanyID, r.Consecutive, r.ClientName, r.ClientNIT, r.ContactName,
		r.DispatchType, r.CarrierName, r.GuideNumber, r.PurchaseOrder, r.YoutubeLink,
		photosJSON, itemsJSON, r.Valued, r.TotalValue, r.WarrantyMonths, r.Notes,
		r.Status, r.DeliveryStatus, r.CreatedBy, now, r.InvoiceID,
	)
	if err != nil {
		return Remission{}, fmt.Errorf("insertar remision: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return Remission{}, err
	}

	// Se relee en vez de devolver el struct construido a mano: los campos del
	// puente pago→despacho (paymentGate/paymentHeld/creditClient/invoiceStatus)
	// se calculan con JOINs en scanRemission, así que devolver `r` directamente
	// respondería "sin puerta de pago" para una contra-entrega que SÍ la tiene.
	// Es exactamente el falso negativo que la Fase 5c vino a eliminar.
	created, err := s.Get(companyID, r.ID)
	if err != nil {
		return Remission{}, err
	}
	return *created, nil
}
