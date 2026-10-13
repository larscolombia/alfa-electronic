package suppliers

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	errSupplierNotFound  = errors.New("proveedor no encontrado")
	errOrderNotFound     = errors.New("pedido no encontrado")
	errLegalNameRequired = errors.New("razon social es obligatoria")
	errInvalidGrade      = errors.New("grado de confianza invalido (use A, B, C o D)")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// ─── SUPPLIERS ───────────────────────────────────────────────────────────────

func (s *Service) ListSuppliers(companyID string) ([]Supplier, error) {
	rows, err := s.db.Query(`
		SELECT id, supplier_number, legal_name, main_address, address_extra, postal_code,
			city, country, tax_identification, intra_vat_number, language, currency,
			default_contact, title, last_name, first_name, mobile_phone, contact_role,
			accounts_payable_account, sector, rse_compliant, subscription_active, notes,
			accounting_number, payment_terms, shipping_terms, minimum_order, tax_rate,
			responsible_person, confidence_grade, performance_notes, created_at, updated_at
		FROM suppliers WHERE company_id = $1 ORDER BY id ASC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]Supplier, 0)
	for rows.Next() {
		sup, scanErr := scanSupplier(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, sup)
	}
	return items, rows.Err()
}

func (s *Service) GetSupplier(companyID string, id int64) (Supplier, error) {
	row := s.db.QueryRow(`
		SELECT id, supplier_number, legal_name, main_address, address_extra, postal_code,
			city, country, tax_identification, intra_vat_number, language, currency,
			default_contact, title, last_name, first_name, mobile_phone, contact_role,
			accounts_payable_account, sector, rse_compliant, subscription_active, notes,
			accounting_number, payment_terms, shipping_terms, minimum_order, tax_rate,
			responsible_person, confidence_grade, performance_notes, created_at, updated_at
		FROM suppliers WHERE company_id = $1 AND id = $2
	`, companyID, id)

	return scanSupplier(row)
}

func (s *Service) CreateSupplier(companyID string, draft SupplierDraft) (Supplier, error) {
	legalName := strings.TrimSpace(draft.LegalName)
	if legalName == "" {
		return Supplier{}, errLegalNameRequired
	}

	grade := normalizeGrade(draft.ConfidenceGrade)
	title := normalizeTitle(draft.Title)
	language := strings.TrimSpace(draft.Language)
	if language == "" {
		language = "Espanol"
	}
	currency := strings.TrimSpace(draft.Currency)
	if currency == "" {
		currency = "Pesos"
	}
	paymentTerms := strings.TrimSpace(draft.PaymentTerms)
	if paymentTerms == "" {
		paymentTerms = "Transferencia a 45 dias"
	}

	now := time.Now().UTC()
	var id int64
	err := s.db.QueryRow(`
		INSERT INTO suppliers (company_id, supplier_number, legal_name, main_address, address_extra,
			postal_code, city, country, tax_identification, intra_vat_number, language, currency,
			default_contact, title, last_name, first_name, mobile_phone, contact_role,
			accounts_payable_account, sector, rse_compliant, subscription_active, notes,
			accounting_number, payment_terms, shipping_terms, minimum_order, tax_rate,
			responsible_person, confidence_grade, performance_notes, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)
		RETURNING id
	`, companyID,
		strings.TrimSpace(draft.SupplierNumber), legalName,
		strings.TrimSpace(draft.MainAddress), strings.TrimSpace(draft.AddressExtra),
		strings.TrimSpace(draft.PostalCode), strings.TrimSpace(draft.City),
		strings.TrimSpace(draft.Country), strings.TrimSpace(draft.TaxIdentification),
		strings.TrimSpace(draft.IntraVatNumber), language, currency,
		strings.TrimSpace(draft.DefaultContact), title,
		strings.TrimSpace(draft.LastName), strings.TrimSpace(draft.FirstName),
		strings.TrimSpace(draft.MobilePhone), strings.TrimSpace(draft.ContactRole),
		strings.TrimSpace(draft.AccountsPayableAccount), strings.TrimSpace(draft.Sector),
		draft.RSECompliant, draft.SubscriptionActive, strings.TrimSpace(draft.Notes),
		strings.TrimSpace(draft.AccountingNumber), paymentTerms,
		strings.TrimSpace(draft.ShippingTerms), draft.MinimumOrder, draft.TaxRate,
		strings.TrimSpace(draft.ResponsiblePerson), grade,
		strings.TrimSpace(draft.PerformanceNotes), now, now,
	).Scan(&id)
	if err != nil {
		return Supplier{}, err
	}

	return s.GetSupplier(companyID, id)
}

func (s *Service) UpdateSupplier(companyID string, id int64, draft SupplierDraft) (Supplier, error) {
	_, err := s.GetSupplier(companyID, id)
	if err != nil {
		return Supplier{}, err
	}

	legalName := strings.TrimSpace(draft.LegalName)
	if legalName == "" {
		return Supplier{}, errLegalNameRequired
	}

	grade := normalizeGrade(draft.ConfidenceGrade)
	title := normalizeTitle(draft.Title)
	language := strings.TrimSpace(draft.Language)
	if language == "" {
		language = "Espanol"
	}
	currency := strings.TrimSpace(draft.Currency)
	if currency == "" {
		currency = "Pesos"
	}
	paymentTerms := strings.TrimSpace(draft.PaymentTerms)
	if paymentTerms == "" {
		paymentTerms = "Transferencia a 45 dias"
	}

	now := time.Now().UTC()
	_, err = s.db.Exec(`
		UPDATE suppliers SET supplier_number = $1, legal_name = $2, main_address = $3,
			address_extra = $4, postal_code = $5, city = $6, country = $7,
			tax_identification = $8, intra_vat_number = $9, language = $10, currency = $11,
			default_contact = $12, title = $13, last_name = $14, first_name = $15,
			mobile_phone = $16, contact_role = $17, accounts_payable_account = $18,
			sector = $19, rse_compliant = $20, subscription_active = $21, notes = $22,
			accounting_number = $23, payment_terms = $24, shipping_terms = $25,
			minimum_order = $26, tax_rate = $27, responsible_person = $28,
			confidence_grade = $29, performance_notes = $30, updated_at = $31
		WHERE company_id = $32 AND id = $33
	`,
		strings.TrimSpace(draft.SupplierNumber), legalName,
		strings.TrimSpace(draft.MainAddress), strings.TrimSpace(draft.AddressExtra),
		strings.TrimSpace(draft.PostalCode), strings.TrimSpace(draft.City),
		strings.TrimSpace(draft.Country), strings.TrimSpace(draft.TaxIdentification),
		strings.TrimSpace(draft.IntraVatNumber), language, currency,
		strings.TrimSpace(draft.DefaultContact), title,
		strings.TrimSpace(draft.LastName), strings.TrimSpace(draft.FirstName),
		strings.TrimSpace(draft.MobilePhone), strings.TrimSpace(draft.ContactRole),
		strings.TrimSpace(draft.AccountsPayableAccount), strings.TrimSpace(draft.Sector),
		draft.RSECompliant, draft.SubscriptionActive, strings.TrimSpace(draft.Notes),
		strings.TrimSpace(draft.AccountingNumber), paymentTerms,
		strings.TrimSpace(draft.ShippingTerms), draft.MinimumOrder, draft.TaxRate,
		strings.TrimSpace(draft.ResponsiblePerson), grade,
		strings.TrimSpace(draft.PerformanceNotes), now,
		companyID, id,
	)
	if err != nil {
		return Supplier{}, err
	}

	return s.GetSupplier(companyID, id)
}

func (s *Service) DeleteSupplier(companyID string, id int64) error {
	result, err := s.db.Exec(`DELETE FROM suppliers WHERE company_id = $1 AND id = $2`, companyID, id)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return errSupplierNotFound
	}
	return nil
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────

func (s *Service) ListOrders(companyID string, supplierID int64) ([]SupplierOrder, error) {
	query := `
		SELECT id, order_number, supplier_id, requested_by, equipment, purpose, quantity,
			request_date, status, customer_name, machine_model, board_reference, diagnosis,
			repair_objective, urgency, commercial_notes, created_at, updated_at
		FROM supplier_orders WHERE company_id = $1`
	args := []any{companyID}

	if supplierID > 0 {
		query += ` AND supplier_id = $2`
		args = append(args, supplierID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	orders := make([]SupplierOrder, 0)
	for rows.Next() {
		order, scanErr := scanOrder(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		orders = append(orders, order)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range orders {
		items, err := s.listOrderItems(companyID, orders[i].ID)
		if err != nil {
			return nil, err
		}
		orders[i].Items = items

		traces, err := s.listOrderTraces(companyID, orders[i].ID)
		if err != nil {
			return nil, err
		}
		orders[i].Traces = traces
	}

	return orders, nil
}

func (s *Service) GetOrder(companyID string, orderID int64) (SupplierOrder, error) {
	row := s.db.QueryRow(`
		SELECT id, order_number, supplier_id, requested_by, equipment, purpose, quantity,
			request_date, status, customer_name, machine_model, board_reference, diagnosis,
			repair_objective, urgency, commercial_notes, created_at, updated_at
		FROM supplier_orders WHERE company_id = $1 AND id = $2
	`, companyID, orderID)

	order, err := scanOrder(row)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return SupplierOrder{}, errOrderNotFound
		}
		return SupplierOrder{}, err
	}

	items, err := s.listOrderItems(companyID, order.ID)
	if err != nil {
		return SupplierOrder{}, err
	}
	order.Items = items

	traces, err := s.listOrderTraces(companyID, order.ID)
	if err != nil {
		return SupplierOrder{}, err
	}
	order.Traces = traces

	return order, nil
}

func (s *Service) CreateOrder(companyID string, req SupplierOrderRequest, actor string) (SupplierOrder, error) {
	orderNumber := strings.TrimSpace(req.OrderNumber)
	if orderNumber == "" {
		orderNumber = fmt.Sprintf("OC-%d", time.Now().UnixMilli())
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = "Borrador"
	}
	urgency := strings.TrimSpace(req.Urgency)
	if urgency == "" {
		urgency = "Normal"
	}

	now := time.Now().UTC()
	var orderID int64
	err := s.db.QueryRow(`
		INSERT INTO supplier_orders (company_id, order_number, supplier_id, requested_by, equipment,
			purpose, quantity, request_date, status, customer_name, machine_model, board_reference,
			diagnosis, repair_objective, urgency, commercial_notes, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
		RETURNING id
	`, companyID, orderNumber, req.SupplierID,
		strings.TrimSpace(req.RequestedBy), strings.TrimSpace(req.Equipment),
		strings.TrimSpace(req.Purpose), req.Quantity, strings.TrimSpace(req.RequestDate),
		status, strings.TrimSpace(req.CustomerName), strings.TrimSpace(req.MachineModel),
		strings.TrimSpace(req.BoardReference), strings.TrimSpace(req.Diagnosis),
		strings.TrimSpace(req.RepairObjective), urgency, strings.TrimSpace(req.CommercialNotes),
		now, now,
	).Scan(&orderID)
	if err != nil {
		return SupplierOrder{}, err
	}

	for _, item := range req.Items {
		_, err := s.db.Exec(`
			INSERT INTO supplier_order_items (company_id, order_id, type, description, part_number,
				target_board, quantity, unit, unit_cost, notes)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		`, companyID, orderID, strings.TrimSpace(item.Type), strings.TrimSpace(item.Description),
			strings.TrimSpace(item.PartNumber), strings.TrimSpace(item.TargetBoard),
			item.Quantity, strings.TrimSpace(item.Unit), item.UnitCost, strings.TrimSpace(item.Notes))
		if err != nil {
			return SupplierOrder{}, err
		}
	}

	s.addTrace(companyID, orderID, actor, "CREAR_PEDIDO", status, "Pedido creado")

	return s.GetOrder(companyID, orderID)
}

func (s *Service) UpdateOrder(companyID string, orderID int64, req SupplierOrderRequest, actor string) (SupplierOrder, error) {
	existing, err := s.GetOrder(companyID, orderID)
	if err != nil {
		return SupplierOrder{}, err
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = existing.Status
	}
	urgency := strings.TrimSpace(req.Urgency)
	if urgency == "" {
		urgency = existing.Urgency
	}
	orderNumber := strings.TrimSpace(req.OrderNumber)
	if orderNumber == "" {
		orderNumber = existing.OrderNumber
	}

	now := time.Now().UTC()
	_, err = s.db.Exec(`
		UPDATE supplier_orders SET order_number = $1, supplier_id = $2, requested_by = $3,
			equipment = $4, purpose = $5, quantity = $6, request_date = $7, status = $8,
			customer_name = $9, machine_model = $10, board_reference = $11, diagnosis = $12,
			repair_objective = $13, urgency = $14, commercial_notes = $15, updated_at = $16
		WHERE company_id = $17 AND id = $18
	`, orderNumber, req.SupplierID, strings.TrimSpace(req.RequestedBy),
		strings.TrimSpace(req.Equipment), strings.TrimSpace(req.Purpose), req.Quantity,
		strings.TrimSpace(req.RequestDate), status, strings.TrimSpace(req.CustomerName),
		strings.TrimSpace(req.MachineModel), strings.TrimSpace(req.BoardReference),
		strings.TrimSpace(req.Diagnosis), strings.TrimSpace(req.RepairObjective),
		urgency, strings.TrimSpace(req.CommercialNotes), now, companyID, orderID)
	if err != nil {
		return SupplierOrder{}, err
	}

	_, _ = s.db.Exec(`DELETE FROM supplier_order_items WHERE company_id = $1 AND order_id = $2`, companyID, orderID)
	for _, item := range req.Items {
		_, err := s.db.Exec(`
			INSERT INTO supplier_order_items (company_id, order_id, type, description, part_number,
				target_board, quantity, unit, unit_cost, notes)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
		`, companyID, orderID, strings.TrimSpace(item.Type), strings.TrimSpace(item.Description),
			strings.TrimSpace(item.PartNumber), strings.TrimSpace(item.TargetBoard),
			item.Quantity, strings.TrimSpace(item.Unit), item.UnitCost, strings.TrimSpace(item.Notes))
		if err != nil {
			return SupplierOrder{}, err
		}
	}

	if status != existing.Status {
		s.addTrace(companyID, orderID, actor, "CAMBIAR_ESTADO", status, fmt.Sprintf("Estado cambiado de %s a %s", existing.Status, status))
	}

	return s.GetOrder(companyID, orderID)
}

func (s *Service) DeleteOrder(companyID string, orderID int64) error {
	_, _ = s.db.Exec(`DELETE FROM supplier_order_items WHERE company_id = $1 AND order_id = $2`, companyID, orderID)
	_, _ = s.db.Exec(`DELETE FROM supplier_order_traces WHERE company_id = $1 AND order_id = $2`, companyID, orderID)
	result, err := s.db.Exec(`DELETE FROM supplier_orders WHERE company_id = $1 AND id = $2`, companyID, orderID)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return errOrderNotFound
	}
	return nil
}

func (s *Service) AddOrderTrace(companyID string, orderID int64, actor, action, notes string) (OrderTrace, error) {
	_, err := s.GetOrder(companyID, orderID)
	if err != nil {
		return OrderTrace{}, err
	}

	var order SupplierOrder
	row := s.db.QueryRow(`SELECT status FROM supplier_orders WHERE company_id = $1 AND id = $2`, companyID, orderID)
	if err := row.Scan(&order.Status); err != nil {
		return OrderTrace{}, err
	}

	traceID, err := s.addTrace(companyID, orderID, actor, action, order.Status, notes)
	if err != nil {
		return OrderTrace{}, err
	}

	return s.getTrace(companyID, traceID)
}

// ─── PRIVATE HELPERS ─────────────────────────────────────────────────────────

func (s *Service) listOrderItems(companyID string, orderID int64) ([]SupplierOrderItem, error) {
	rows, err := s.db.Query(`
		SELECT id, order_id, type, description, part_number, target_board, quantity, unit, unit_cost, notes
		FROM supplier_order_items WHERE company_id = $1 AND order_id = $2 ORDER BY id ASC
	`, companyID, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]SupplierOrderItem, 0)
	for rows.Next() {
		var item SupplierOrderItem
		if err := rows.Scan(&item.ID, &item.OrderID, &item.Type, &item.Description,
			&item.PartNumber, &item.TargetBoard, &item.Quantity, &item.Unit,
			&item.UnitCost, &item.Notes); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Service) listOrderTraces(companyID string, orderID int64) ([]OrderTrace, error) {
	rows, err := s.db.Query(`
		SELECT id, order_id, timestamp, actor, action, status, notes
		FROM supplier_order_traces WHERE company_id = $1 AND order_id = $2 ORDER BY timestamp DESC
	`, companyID, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	traces := make([]OrderTrace, 0)
	for rows.Next() {
		var t OrderTrace
		var ts time.Time
		if err := rows.Scan(&t.ID, &t.OrderID, &ts, &t.Actor, &t.Action, &t.Status, &t.Notes); err != nil {
			return nil, err
		}
		t.Timestamp = ts.UTC().Format(time.RFC3339)
		traces = append(traces, t)
	}
	return traces, rows.Err()
}

func (s *Service) addTrace(companyID string, orderID int64, actor, action, status, notes string) (int64, error) {
	var traceID int64
	err := s.db.QueryRow(`
		INSERT INTO supplier_order_traces (company_id, order_id, timestamp, actor, action, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
	`, companyID, orderID, time.Now().UTC(), actor, action, status, strings.TrimSpace(notes)).Scan(&traceID)
	return traceID, err
}

func (s *Service) getTrace(companyID string, traceID int64) (OrderTrace, error) {
	var t OrderTrace
	var ts time.Time
	err := s.db.QueryRow(`
		SELECT id, order_id, timestamp, actor, action, status, notes
		FROM supplier_order_traces WHERE company_id = $1 AND id = $2
	`, companyID, traceID).Scan(&t.ID, &t.OrderID, &ts, &t.Actor, &t.Action, &t.Status, &t.Notes)
	if err != nil {
		return OrderTrace{}, err
	}
	t.Timestamp = ts.UTC().Format(time.RFC3339)
	return t, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanSupplier(row scanner) (Supplier, error) {
	var s Supplier
	var createdAt, updatedAt time.Time
	if err := row.Scan(&s.ID, &s.SupplierNumber, &s.LegalName, &s.MainAddress, &s.AddressExtra,
		&s.PostalCode, &s.City, &s.Country, &s.TaxIdentification, &s.IntraVatNumber,
		&s.Language, &s.Currency, &s.DefaultContact, &s.Title, &s.LastName, &s.FirstName,
		&s.MobilePhone, &s.ContactRole, &s.AccountsPayableAccount, &s.Sector,
		&s.RSECompliant, &s.SubscriptionActive, &s.Notes, &s.AccountingNumber,
		&s.PaymentTerms, &s.ShippingTerms, &s.MinimumOrder, &s.TaxRate,
		&s.ResponsiblePerson, &s.ConfidenceGrade, &s.PerformanceNotes,
		&createdAt, &updatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Supplier{}, errSupplierNotFound
		}
		return Supplier{}, err
	}
	s.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	s.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return s, nil
}

func scanOrder(row scanner) (SupplierOrder, error) {
	var o SupplierOrder
	var createdAt, updatedAt time.Time
	if err := row.Scan(&o.ID, &o.OrderNumber, &o.SupplierID, &o.RequestedBy, &o.Equipment,
		&o.Purpose, &o.Quantity, &o.RequestDate, &o.Status, &o.CustomerName, &o.MachineModel,
		&o.BoardReference, &o.Diagnosis, &o.RepairObjective, &o.Urgency, &o.CommercialNotes,
		&createdAt, &updatedAt); err != nil {
		return SupplierOrder{}, err
	}
	o.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	o.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return o, nil
}

func normalizeGrade(value string) string {
	v := strings.TrimSpace(strings.ToUpper(value))
	switch v {
	case "A", "B", "C", "D":
		return v
	default:
		return "A"
	}
}

func normalizeTitle(value string) string {
	v := strings.TrimSpace(value)
	if v == "Sra." {
		return "Sra."
	}
	return "Sr."
}
