package inventory

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"
)

var (
	errReferenceRequired     = errors.New("referencia y designacion son obligatorias")
	errReferenceNotFound     = errors.New("referencia no encontrada")
	errDuplicateReference    = errors.New("ya existe una referencia muy similar")
	errInvalidQuantity       = errors.New("cantidad invalida")
	errInsufficientStock     = errors.New("stock insuficiente")
	errRequestNotFound       = errors.New("solicitud no encontrada")
	errReservationNotFound   = errors.New("reserva no encontrada")
	errSessionNotFound       = errors.New("sesion no encontrada")
	errBagNotFound           = errors.New("bolsa no encontrada")
	errPurchaseLineNotFound  = errors.New("linea de compra no encontrada")
	errReplenishmentNotFound = errors.New("item de reposicion no encontrado")
	errInvalidMovementType   = errors.New("tipo de movimiento invalido")
	errInvalidStatus         = errors.New("estado invalido")
	errReceiveQuantity       = errors.New("cantidad de recibo invalida")
	errBagAlreadyActive      = errors.New("ya existe una bolsa activa con ese codigo")
)

type Service struct {
	db                       *sql.DB
	purchaseLineEditNotifier PurchaseLineEditNotifier
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────

func (s *Service) GetConfig(companyID string) (InventoryConfig, error) {
	row := s.db.QueryRow(`SELECT max_reserve_days, updated_at FROM inventory_config WHERE company_id = $1`, companyID)
	var cfg InventoryConfig
	var updatedAt time.Time
	if err := row.Scan(&cfg.MaxReserveDays, &updatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return InventoryConfig{MaxReserveDays: 5, UpdatedAt: time.Now().UTC().Format(time.RFC3339)}, nil
		}
		return cfg, err
	}
	cfg.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return cfg, nil
}

func (s *Service) SetMaxReserveDays(companyID string, days int, actor string) (InventoryConfig, error) {
	// 0 dias es un valor valido: fuerza el vencimiento inmediato de las reservas
	// existentes (INV-03) y equivale a "no se permiten reservas".
	if days < 0 {
		days = 0
	}
	now := time.Now().UTC()
	row := s.db.QueryRow(`
		INSERT INTO inventory_config (company_id, max_reserve_days, updated_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (company_id) DO UPDATE SET max_reserve_days = EXCLUDED.max_reserve_days, updated_at = EXCLUDED.updated_at
		RETURNING max_reserve_days, updated_at
	`, companyID, days, now)
	var cfg InventoryConfig
	var updatedAt time.Time
	if err := row.Scan(&cfg.MaxReserveDays, &updatedAt); err != nil {
		return cfg, err
	}
	cfg.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	// Bajar la politica envejece las reservas activas: su vencimiento se recalcula
	// como reserved_at + dias (solo se acorta, nunca se alarga) y las que queden
	// en el pasado se marcan vencidas de inmediato, sin esperar al GET full state.
	if _, err := s.db.Exec(`
		UPDATE inventory_reservations
		SET expires_at = reserved_at + make_interval(days => $2)
		WHERE company_id = $1 AND status = 'activa'
		  AND reserved_at + make_interval(days => $2) < expires_at
	`, companyID, days); err != nil {
		return cfg, err
	}
	if _, err := s.RefreshExpiredReservations(companyID); err != nil {
		return cfg, err
	}
	s.pushAudit(companyID, actor, "SET_MAX_RESERVE_DAYS", fmt.Sprintf("Politica de reserva actualizada a %d dia(s).", days))
	return cfg, nil
}

// ─── FULL STATE ──────────────────────────────────────────────────────────────

func (s *Service) GetFullState(companyID string) (InventoryStateResponse, error) {
	state := InventoryStateResponse{}

	if _, err := s.RefreshExpiredReservations(companyID); err != nil {
		return state, err
	}

	refs, err := s.ListReferences(companyID)
	if err != nil {
		return state, err
	}
	state.References = refs

	movs, err := s.ListMovements(companyID)
	if err != nil {
		return state, err
	}
	state.Movements = movs

	reqs, err := s.ListAdjustmentRequests(companyID)
	if err != nil {
		return state, err
	}
	state.AdjustmentRequests = reqs

	reservations, err := s.ListReservations(companyID)
	if err != nil {
		return state, err
	}
	state.Reservations = reservations

	cfg, err := s.GetConfig(companyID)
	if err != nil {
		return state, err
	}
	state.MaxReserveDays = cfg.MaxReserveDays

	repl, err := s.ListReplenishmentItems(companyID)
	if err != nil {
		return state, err
	}
	state.ReplenishmentItems = repl

	lines, err := s.ListPurchaseLines(companyID)
	if err != nil {
		return state, err
	}
	state.PurchaseLines = lines

	snaps, err := s.ListWeeklySnapshots(companyID)
	if err != nil {
		return state, err
	}
	state.WeeklySnapshots = snaps

	bags, err := s.ListBagTraces(companyID)
	if err != nil {
		return state, err
	}
	state.BagTraces = bags

	sessions, err := s.ListSessions(companyID)
	if err != nil {
		return state, err
	}
	state.Sessions = sessions

	discs, err := s.ListDiscrepancies(companyID)
	if err != nil {
		return state, err
	}
	state.Discrepancies = discs

	audit, err := s.ListAuditTrail(companyID)
	if err != nil {
		return state, err
	}
	state.AuditTrail = audit

	return state, nil
}

// ─── REFERENCES ──────────────────────────────────────────────────────────────

func (s *Service) ListReferences(companyID string) ([]StockReference, error) {
	rows, err := s.db.Query(`
		SELECT reference, internal_code, manufacturer_reference, designation, family, subfamily,
			brand, location, unit_measure, compatible_equipment, criticality, preferred_supplier_name,
			lead_time_days, technical_notes, supplier_code, current_stock, min_stock, target_stock,
			condition, last_used_test, created_at, updated_at
		FROM inventory_references WHERE company_id = $1 ORDER BY updated_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]StockReference, 0)
	for rows.Next() {
		var r StockReference
		var createdAt, updatedAt time.Time
		var testRaw sql.NullString
		if err := rows.Scan(
			&r.Reference, &r.InternalCode, &r.ManufacturerReference, &r.Designation,
			&r.Family, &r.Subfamily, &r.Brand, &r.Location, &r.UnitMeasure,
			&r.CompatibleEquipment, &r.Criticality, &r.PreferredSupplierName,
			&r.LeadTimeDays, &r.TechnicalNotes, &r.SupplierCode,
			&r.CurrentStock, &r.MinStock, &r.TargetStock,
			&r.Condition, &testRaw, &createdAt, &updatedAt,
		); err != nil {
			return nil, err
		}
		if testRaw.Valid && testRaw.String != "" {
			var t UsedTestRecord
			if json.Unmarshal([]byte(testRaw.String), &t) == nil {
				r.LastUsedTest = &t
			}
		}
		r.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		r.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, r)
	}
	return items, rows.Err()
}

func (s *Service) GetReference(companyID, reference string) (StockReference, error) {
	row := s.db.QueryRow(`
		SELECT reference, internal_code, manufacturer_reference, designation, family, subfamily,
			brand, location, unit_measure, compatible_equipment, criticality, preferred_supplier_name,
			lead_time_days, technical_notes, supplier_code, current_stock, min_stock, target_stock,
			condition, last_used_test, created_at, updated_at
		FROM inventory_references WHERE company_id = $1 AND reference = $2
	`, companyID, reference)

	var r StockReference
	var createdAt, updatedAt time.Time
	var testRaw sql.NullString
	if err := row.Scan(
		&r.Reference, &r.InternalCode, &r.ManufacturerReference, &r.Designation,
		&r.Family, &r.Subfamily, &r.Brand, &r.Location, &r.UnitMeasure,
		&r.CompatibleEquipment, &r.Criticality, &r.PreferredSupplierName,
		&r.LeadTimeDays, &r.TechnicalNotes, &r.SupplierCode,
		&r.CurrentStock, &r.MinStock, &r.TargetStock,
		&r.Condition, &testRaw, &createdAt, &updatedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return StockReference{}, errReferenceNotFound
		}
		return StockReference{}, err
	}
	if testRaw.Valid && testRaw.String != "" {
		var t UsedTestRecord
		if json.Unmarshal([]byte(testRaw.String), &t) == nil {
			r.LastUsedTest = &t
		}
	}
	r.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	r.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return r, nil
}

func (s *Service) CreateReference(companyID string, req CreateReferenceRequest, actor string) (StockReference, OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)
	desig := strings.TrimSpace(req.Designation)
	if ref == "" || desig == "" {
		return StockReference{}, OperationResult{OK: false, Message: "Referencia y designacion son obligatorias."}, errReferenceRequired
	}

	candidates, _ := s.FindDuplicateCandidates(companyID, ref, strings.TrimSpace(req.InternalCode), desig, strings.TrimSpace(req.PreferredSupplierName))
	blocking := make([]DuplicateCandidate, 0)
	for _, c := range candidates {
		if c.Similarity >= 0.9 {
			blocking = append(blocking, c)
		}
	}
	if len(blocking) > 0 {
		if !req.ForceCreate {
			return StockReference{}, OperationResult{OK: false, Message: duplicateRejectMessage}, errDuplicateReference
		}
		forceReason := strings.TrimSpace(req.ForceReason)
		if forceReason == "" {
			return StockReference{}, OperationResult{OK: false, Message: "Para forzar la creacion debes indicar el motivo (forceReason)."}, errReferenceRequired
		}
		return s.forceCreateReference(companyID, req, actor, ref, desig, candidates, forceReason)
	}

	created, err := s.insertReference(companyID, req, actor, ref, desig)
	if err != nil {
		return StockReference{}, OperationResult{}, err
	}
	s.pushAudit(companyID, actor, "CREATE_REFERENCE", fmt.Sprintf("Referencia %s creada.", ref))
	return created, OperationResult{OK: true, Message: fmt.Sprintf("Ficha %s creada correctamente.", ref)}, nil
}

// ─── STOCK ENTRY ─────────────────────────────────────────────────────────────

func (s *Service) RegisterStockEntry(companyID string, req RegisterStockEntryRequest, actor string) (OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)
	qty := req.Quantity
	if ref == "" || qty <= 0 {
		return OperationResult{OK: false, Message: "Selecciona una referencia y una cantidad valida."}, errInvalidQuantity
	}

	condition := strings.TrimSpace(req.Condition)
	if condition == "" {
		condition = conditionNew
	}
	if condition != conditionNew && condition != conditionUsed {
		return OperationResult{OK: false, Message: "Condicion invalida (use nuevo o usado)."}, errInvalidCondition
	}
	if condition == conditionUsed && strings.TrimSpace(req.UsedTestNote) == "" {
		return OperationResult{OK: false, Message: "La entrada de un componente usado requiere nota de prueba/origen (usedTestNote)."}, errInvalidCondition
	}

	existing, err := s.GetReference(companyID, ref)
	if err != nil {
		return OperationResult{OK: false, Message: "No se encontro la referencia seleccionada."}, err
	}

	supplierLabel := formatSupplierLabel(strings.TrimSpace(req.SupplierCode), strings.TrimSpace(req.SupplierName))
	if supplierLabel == "" {
		supplierLabel = "Proveedor no informado"
	}

	docType := strings.TrimSpace(req.DocumentType)
	docNum := strings.TrimSpace(req.DocumentNumber)
	batch := strings.TrimSpace(req.BatchOrSerial)
	receivedBy := strings.TrimSpace(req.ReceivedBy)
	if receivedBy == "" {
		receivedBy = actor
	}
	receivedAt := strings.TrimSpace(req.ReceivedAt)
	if receivedAt == "" {
		receivedAt = time.Now().UTC().Format(time.RFC3339)
	}

	reason := fmt.Sprintf("Entrada por %s %s", docType, docNum)
	if batch != "" {
		reason += fmt.Sprintf(", lote/serial %s", batch)
	}

	evidenceRef := receivedBy
	if receivedAt != "" {
		evidenceRef += " / " + receivedAt
	}
	if req.UnitCost > 0 {
		evidenceRef += fmt.Sprintf(" / costo %.2f", req.UnitCost)
	}

	newStock := existing.CurrentStock + qty
	newLocation := existing.Location
	if strings.TrimSpace(req.Location) != "" {
		newLocation = strings.TrimSpace(req.Location)
	}

	newSupplierName := existing.PreferredSupplierName
	if strings.TrimSpace(req.SupplierName) != "" {
		newSupplierName = strings.TrimSpace(req.SupplierName)
	}
	newSupplierCode := existing.SupplierCode
	if strings.TrimSpace(req.SupplierCode) != "" {
		newSupplierCode = strings.TrimSpace(req.SupplierCode)
	}

	now := time.Now().UTC()
	movID := buildID("mov")

	_, err = s.db.Exec(`
		UPDATE inventory_references SET current_stock = $1, location = $2,
			preferred_supplier_name = $3, supplier_code = $4, updated_at = $5
		WHERE company_id = $6 AND reference = $7
	`, newStock, newLocation, newSupplierName, newSupplierCode, now, companyID, ref)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`
		INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
			equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
		VALUES ($1,$2,'entrada',$3,$4,$5,'','',$6,'recepcion-stock',$7,$8,$9)
	`, companyID, movID, ref, qty, reason, supplierLabel, evidenceRef, receivedBy, now)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "REGISTER_STOCK_ENTRY", fmt.Sprintf("Entrada de %d unidad(es) en %s.", qty, ref))
	if condition == conditionUsed {
		_, _ = s.db.Exec(`UPDATE inventory_references SET condition = 'usado', updated_at = $1 WHERE company_id = $2 AND reference = $3`, time.Now().UTC(), companyID, ref)
		s.pushAudit(companyID, actor, "STOCK_ENTRY_USED", fmt.Sprintf("Entrada de %d unidad(es) USADAS en %s. Declaracion: %s", qty, ref, strings.TrimSpace(req.UsedTestNote)))
	}
	_ = s.syncReplenishmentForReference(companyID, ref, actor)
	return OperationResult{OK: true, Message: fmt.Sprintf("Entrada registrada: %d unidad(es) en %s.", qty, ref)}, nil
}

// ─── MOVEMENTS ───────────────────────────────────────────────────────────────

func (s *Service) ListMovements(companyID string) ([]MovementRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, type, reference, quantity, reason, work_order, equipment_tag, customer_site,
			movement_category, evidence_ref, requested_by, requested_at
		FROM inventory_movements WHERE company_id = $1 ORDER BY requested_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]MovementRecord, 0)
	for rows.Next() {
		var m MovementRecord
		var requestedAt time.Time
		if err := rows.Scan(&m.ID, &m.Type, &m.Reference, &m.Quantity, &m.Reason,
			&m.WorkOrder, &m.EquipmentTag, &m.CustomerSite, &m.MovementCategory,
			&m.EvidenceRef, &m.RequestedBy, &requestedAt); err != nil {
			return nil, err
		}
		m.RequestedAt = requestedAt.UTC().Format(time.RFC3339)
		items = append(items, m)
	}
	return items, rows.Err()
}

func (s *Service) SubmitMovement(companyID string, req SubmitMovementRequest, actor string) (OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)
	reason := strings.TrimSpace(req.Reason)
	qty := req.Quantity
	movType := strings.TrimSpace(req.Type)

	if ref == "" || reason == "" || qty <= 0 {
		return OperationResult{OK: false, Message: "Completa referencia, motivo y cantidad valida."}, errInvalidQuantity
	}

	if movType != "salida" && movType != "entrada" && movType != "ajuste" {
		return OperationResult{OK: false, Message: "Tipo de movimiento invalido."}, errInvalidMovementType
	}

	existing, err := s.GetReference(companyID, ref)
	if err != nil {
		return OperationResult{OK: false, Message: "La referencia indicada no existe en el catalogo."}, err
	}

	if movType == "salida" {
		available, reserved, availErr := s.AvailableStock(companyID, ref)
		if availErr != nil {
			return OperationResult{OK: false, Message: "La referencia indicada no existe en el catalogo."}, availErr
		}
		if available < qty {
			return OperationResult{OK: false, Message: insufficientStockMessage(available, reserved, qty)}, errInsufficientStock
		}
		if condErr := s.requireUsableForInstall(companyID, ref); condErr != nil {
			return OperationResult{OK: false, Message: usedTestRequiredMessage}, condErr
		}
	}

	now := time.Now().UTC()
	movID := buildID("mov")

	var newStock int
	switch movType {
	case "salida":
		newStock = maxInt(0, existing.CurrentStock-qty)
	case "entrada":
		newStock = existing.CurrentStock + qty
	case "ajuste":
		newStock = maxInt(0, existing.CurrentStock+qty)
	}

	_, err = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
		newStock, now, companyID, ref)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`
		INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
			equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, companyID, movID, movType, ref, qty, reason,
		strings.TrimSpace(req.WorkOrder), strings.TrimSpace(req.EquipmentTag),
		strings.TrimSpace(req.CustomerSite), strings.TrimSpace(req.MovementCategory),
		strings.TrimSpace(req.EvidenceRef), actor, now)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "REGISTER_MOVEMENT", fmt.Sprintf("Movimiento %s aplicado en %s (%d).", movType, ref, qty))
	_ = s.syncReplenishmentForReference(companyID, ref, actor)
	return OperationResult{OK: true, Message: "Movimiento registrado correctamente."}, nil
}

// ─── ADJUSTMENT REQUESTS ─────────────────────────────────────────────────────

func (s *Service) ListAdjustmentRequests(companyID string) ([]AdjustmentRequest, error) {
	rows, err := s.db.Query(`
		SELECT id, type, reference, quantity, reason, work_order, equipment_tag, customer_site,
			movement_category, evidence_ref, requested_by, requested_at, status, approved_by, approved_at
		FROM inventory_adjustment_requests WHERE company_id = $1 ORDER BY requested_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AdjustmentRequest, 0)
	for rows.Next() {
		var a AdjustmentRequest
		var requestedAt time.Time
		var approvedAt sql.NullTime
		if err := rows.Scan(&a.ID, &a.Type, &a.Reference, &a.Quantity, &a.Reason,
			&a.WorkOrder, &a.EquipmentTag, &a.CustomerSite, &a.MovementCategory,
			&a.EvidenceRef, &a.RequestedBy, &requestedAt, &a.Status, &a.ApprovedBy, &approvedAt); err != nil {
			return nil, err
		}
		a.RequestedAt = requestedAt.UTC().Format(time.RFC3339)
		if approvedAt.Valid {
			a.ApprovedAt = approvedAt.Time.UTC().Format(time.RFC3339)
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

func (s *Service) CreateAdjustmentRequest(companyID string, req SubmitMovementRequest, actor string) (OperationResult, error) {
	now := time.Now().UTC()
	reqID := buildID("req")

	_, err := s.db.Exec(`
		INSERT INTO inventory_adjustment_requests (company_id, id, type, reference, quantity, reason,
			work_order, equipment_tag, customer_site, movement_category, evidence_ref,
			requested_by, requested_at, status, approved_by)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pendiente','')
	`, companyID, reqID, req.Type, strings.TrimSpace(req.Reference), req.Quantity,
		strings.TrimSpace(req.Reason), strings.TrimSpace(req.WorkOrder),
		strings.TrimSpace(req.EquipmentTag), strings.TrimSpace(req.CustomerSite),
		strings.TrimSpace(req.MovementCategory), strings.TrimSpace(req.EvidenceRef),
		actor, now)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "REQUEST_MOVEMENT_APPROVAL", fmt.Sprintf("Solicitud %s para %s (%d) enviada a aprobacion.", req.Type, req.Reference, req.Quantity))
	return OperationResult{OK: true, Message: "Solicitud enviada para aprobacion del responsable de inventario."}, nil
}

func (s *Service) ApproveMovementRequest(companyID, requestID, actor string) (OperationResult, error) {
	var req AdjustmentRequest
	var requestedAt time.Time
	var approvedAt sql.NullTime
	err := s.db.QueryRow(`
		SELECT id, type, reference, quantity, reason, work_order, equipment_tag, customer_site,
			movement_category, evidence_ref, requested_by, requested_at, status, approved_by, approved_at
		FROM inventory_adjustment_requests WHERE company_id = $1 AND id = $2
	`, companyID, requestID).Scan(&req.ID, &req.Type, &req.Reference, &req.Quantity, &req.Reason,
		&req.WorkOrder, &req.EquipmentTag, &req.CustomerSite, &req.MovementCategory,
		&req.EvidenceRef, &req.RequestedBy, &requestedAt, &req.Status, &req.ApprovedBy, &approvedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La solicitud no existe o ya fue aprobada."}, errRequestNotFound
		}
		return OperationResult{}, err
	}

	if req.Status != "pendiente" {
		return OperationResult{OK: false, Message: "La solicitud no existe o ya fue aprobada."}, errRequestNotFound
	}

	existing, err := s.GetReference(companyID, req.Reference)
	if err != nil {
		return OperationResult{OK: false, Message: "La referencia de la solicitud ya no existe."}, err
	}

	if req.Type == "salida" && existing.CurrentStock < req.Quantity {
		return OperationResult{OK: false, Message: "No hay stock suficiente para aplicar el movimiento aprobado."}, errInsufficientStock
	}

	now := time.Now().UTC()
	var newStock int
	switch req.Type {
	case "entrada":
		newStock = existing.CurrentStock + req.Quantity
	case "ajuste":
		newStock = maxInt(0, existing.CurrentStock+req.Quantity)
	default:
		newStock = maxInt(0, existing.CurrentStock-req.Quantity)
	}

	movID := buildID("mov")

	_, err = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
		newStock, now, companyID, req.Reference)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`
		INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
			equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, companyID, movID, req.Type, req.Reference, req.Quantity, req.Reason,
		req.WorkOrder, req.EquipmentTag, req.CustomerSite, req.MovementCategory,
		req.EvidenceRef, req.RequestedBy, now)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`UPDATE inventory_adjustment_requests SET status = 'aprobada', approved_by = $1, approved_at = $2 WHERE company_id = $3 AND id = $4`,
		actor, now, companyID, requestID)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "APPROVE_MOVEMENT_REQUEST", fmt.Sprintf("Solicitud %s aprobada y aplicada para %s.", requestID, req.Reference))
	_ = s.syncReplenishmentForReference(companyID, req.Reference, actor)
	return OperationResult{OK: true, Message: "Solicitud aprobada y movimiento aplicado."}, nil
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────────

func (s *Service) ListReservations(companyID string) ([]ReservationRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, reference, quantity, assigned_to, purpose, work_order, equipment_tag, customer_site,
			priority, commitment_date, reserved_at, expires_at, status
		FROM inventory_reservations WHERE company_id = $1 ORDER BY reserved_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ReservationRecord, 0)
	for rows.Next() {
		var r ReservationRecord
		var reservedAt, expiresAt time.Time
		if err := rows.Scan(&r.ID, &r.Reference, &r.Quantity, &r.AssignedTo, &r.Purpose,
			&r.WorkOrder, &r.EquipmentTag, &r.CustomerSite, &r.Priority, &r.CommitmentDate,
			&reservedAt, &expiresAt, &r.Status); err != nil {
			return nil, err
		}
		r.ReservedAt = reservedAt.UTC().Format(time.RFC3339)
		r.ExpiresAt = expiresAt.UTC().Format(time.RFC3339)
		items = append(items, r)
	}
	return items, rows.Err()
}

func (s *Service) CreateReservation(companyID string, req CreateReservationRequest, actor string) (ReservationRecord, OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)
	assignedTo := strings.TrimSpace(req.AssignedTo)
	purpose := strings.TrimSpace(req.Purpose)
	qty := req.Quantity

	if ref == "" || assignedTo == "" || purpose == "" || qty <= 0 {
		return ReservationRecord{}, OperationResult{OK: false, Message: "Completa referencia, tecnico, motivo y cantidad valida."}, errInvalidQuantity
	}

	resID := normalizeClientReservationID(req.ID)
	if resID != "" {
		// Idempotencia: si la identidad del cliente ya existe, devolver la reserva existente en vez de duplicarla.
		var current ReservationRecord
		var reservedAt, rowExpires time.Time
		err := s.db.QueryRow(`
			SELECT id, reference, quantity, assigned_to, purpose, work_order, equipment_tag, customer_site,
				priority, commitment_date, reserved_at, expires_at, status
			FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, resID).Scan(
			&current.ID, &current.Reference, &current.Quantity, &current.AssignedTo, &current.Purpose,
			&current.WorkOrder, &current.EquipmentTag, &current.CustomerSite, &current.Priority, &current.CommitmentDate,
			&reservedAt, &rowExpires, &current.Status)
		if err == nil {
			current.ReservedAt = reservedAt.UTC().Format(time.RFC3339)
			current.ExpiresAt = rowExpires.UTC().Format(time.RFC3339)
			return current, OperationResult{OK: true, Message: "Reserva ya existente; se devolvio la misma."}, nil
		}
		if !errors.Is(err, sql.ErrNoRows) {
			return ReservationRecord{}, OperationResult{}, err
		}
	} else {
		resID = buildID("res")
	}

	if _, err := s.GetReference(companyID, ref); err != nil {
		return ReservationRecord{}, OperationResult{OK: false, Message: "La referencia de la reserva no existe."}, err
	}
	// No se puede apartar lo que no esta en bodega; el flujo para material faltante es la solicitud de compra.
	available, reserved, availErr := s.AvailableStock(companyID, ref)
	if availErr != nil {
		return ReservationRecord{}, OperationResult{OK: false, Message: "La referencia de la reserva no existe."}, availErr
	}
	if available < qty {
		return ReservationRecord{}, OperationResult{OK: false, Message: insufficientStockMessage(available, reserved, qty) + ". Si falta material usa el flujo de compra."}, errInsufficientStock
	}

	cfg, _ := s.GetConfig(companyID)
	now := time.Now().UTC()
	expiresAt := now.AddDate(0, 0, cfg.MaxReserveDays)

	priority := strings.TrimSpace(req.Priority)
	if priority == "" {
		priority = "media"
	}

	workOrder := strings.TrimSpace(req.WorkOrder)
	equipmentTag := strings.TrimSpace(req.EquipmentTag)
	customerSite := strings.TrimSpace(req.CustomerSite)
	commitmentDate := strings.TrimSpace(req.CommitmentDate)

	record := ReservationRecord{
		ID:             resID,
		Reference:      ref,
		Quantity:       qty,
		AssignedTo:     assignedTo,
		Purpose:        purpose,
		WorkOrder:      workOrder,
		EquipmentTag:   equipmentTag,
		CustomerSite:   customerSite,
		Priority:       priority,
		CommitmentDate: commitmentDate,
		ReservedAt:     now.UTC().Format(time.RFC3339),
		ExpiresAt:      expiresAt.UTC().Format(time.RFC3339),
		Status:         "activa",
	}

	_, err := s.db.Exec(`
		INSERT INTO inventory_reservations (company_id, id, reference, quantity, assigned_to, purpose,
			work_order, equipment_tag, customer_site, priority, commitment_date, reserved_at, expires_at, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'activa')
	`, companyID, resID, ref, qty, assignedTo, purpose,
		workOrder, equipmentTag, customerSite, priority,
		commitmentDate, now, expiresAt)
	if err != nil {
		return ReservationRecord{}, OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "CREATE_RESERVATION", fmt.Sprintf("Reserva creada para %s (%d).", ref, qty))
	return record, OperationResult{OK: true, Message: "Reserva creada correctamente."}, nil
}

func (s *Service) ReleaseReservation(companyID, reservationID, actor string) (OperationResult, error) {
	result, err := s.db.Exec(`UPDATE inventory_reservations SET status = 'liberada' WHERE company_id = $1 AND id = $2 AND status IN ('activa', 'vencida')`, companyID, reservationID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La reserva no esta activa o no existe."}, errReservationNotFound
	}
	s.pushAudit(companyID, actor, "RELEASE_RESERVATION", fmt.Sprintf("Reserva %s liberada.", reservationID))
	return OperationResult{OK: true, Message: "Reserva liberada."}, nil
}

func (s *Service) ExtendReservation(companyID, reservationID, actor string) (OperationResult, error) {
	cfg, _ := s.GetConfig(companyID)

	var status string
	var currentExpires time.Time
	err := s.db.QueryRow(`SELECT status, expires_at FROM inventory_reservations WHERE company_id = $1 AND id = $2`, companyID, reservationID).Scan(&status, &currentExpires)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La reserva no existe."}, errReservationNotFound
		}
		return OperationResult{}, err
	}

	now := time.Now().UTC()
	var newExpires time.Time
	switch status {
	case "activa":
		newExpires = currentExpires.AddDate(0, 0, cfg.MaxReserveDays)
	case "vencida":
		// Reactivar: la reserva vuelve a correr desde hoy con la politica completa.
		newExpires = now.AddDate(0, 0, cfg.MaxReserveDays)
	default:
		return OperationResult{OK: false, Message: "La reserva no esta activa o no existe."}, errReservationNotFound
	}

	_, err = s.db.Exec(`UPDATE inventory_reservations SET expires_at = $1, status = 'activa' WHERE company_id = $2 AND id = $3`, newExpires, companyID, reservationID)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "RESERVATION_EXTENDED", fmt.Sprintf("Reserva %s renovada hasta %s.", reservationID, newExpires.UTC().Format(time.RFC3339)))
	return OperationResult{OK: true, Message: "Reserva renovada."}, nil
}

func (s *Service) ConsumeReservation(companyID, reservationID, actor string) (OperationResult, error) {
	var res ReservationRecord
	var reservedAt, expiresAt time.Time
	err := s.db.QueryRow(`
		SELECT id, reference, quantity, assigned_to, purpose, work_order, equipment_tag, customer_site,
			priority, commitment_date, reserved_at, expires_at, status
		FROM inventory_reservations WHERE company_id = $1 AND id = $2
	`, companyID, reservationID).Scan(&res.ID, &res.Reference, &res.Quantity, &res.AssignedTo, &res.Purpose,
		&res.WorkOrder, &res.EquipmentTag, &res.CustomerSite, &res.Priority, &res.CommitmentDate,
		&reservedAt, &expiresAt, &res.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La reserva no existe."}, errReservationNotFound
		}
		return OperationResult{}, err
	}

	if res.Status == "vencida" {
		return OperationResult{OK: false, Message: "La reserva esta vencida: renovala o liberela antes de consumirla."}, errInvalidStatus
	}
	if res.Status != "activa" {
		return OperationResult{OK: false, Message: "Solo se pueden consumir reservas activas."}, errInvalidStatus
	}

	if condErr := s.requireUsableForInstall(companyID, res.Reference); condErr != nil {
		return OperationResult{OK: false, Message: usedTestRequiredMessage}, condErr
	}

	available, reserved, availErr := s.AvailableStock(companyID, res.Reference)
	if availErr != nil || available < res.Quantity {
		if availErr != nil {
			return OperationResult{}, availErr
		}
		return OperationResult{OK: false, Message: insufficientStockMessage(available, reserved, res.Quantity)}, errInsufficientStock
	}

	existing, err := s.GetReference(companyID, res.Reference)
	if err != nil {
		return OperationResult{}, err
	}

	now := time.Now().UTC()
	newStock := existing.CurrentStock - res.Quantity
	movID := buildID("mov")

	_, err = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
		newStock, now, companyID, res.Reference)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`
		INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
			equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
		VALUES ($1,$2,'salida',$3,$4,'Consumo confirmado desde reserva '||$5,$6,$7,$8,'consumo-tecnico',$9,$10,$11)
	`, companyID, movID, res.Reference, res.Quantity, reservationID,
		res.WorkOrder, res.EquipmentTag, res.CustomerSite, reservationID, actor, now)
	if err != nil {
		return OperationResult{}, err
	}

	_, err = s.db.Exec(`UPDATE inventory_reservations SET status = 'liberada' WHERE company_id = $1 AND id = $2`, companyID, reservationID)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "CONSUME_RESERVATION", fmt.Sprintf("Reserva %s consumida: %dx %s.", reservationID, res.Quantity, res.Reference))
	_ = s.syncReplenishmentForReference(companyID, res.Reference, actor)
	return OperationResult{OK: true, Message: fmt.Sprintf("%dx %s consumidos y salida registrada automaticamente.", res.Quantity, res.Reference)}, nil
}

func (s *Service) RefreshExpiredReservations(companyID string) (int, error) {
	rows, err := s.db.Query(`SELECT id FROM inventory_reservations WHERE company_id = $1 AND status = 'activa' AND expires_at < NOW()`, companyID)
	if err != nil {
		return 0, err
	}
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return 0, err
		}
		ids = append(ids, id)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}

	for _, id := range ids {
		if _, err := s.db.Exec(`UPDATE inventory_reservations SET status = 'vencida' WHERE company_id = $1 AND id = $2 AND status = 'activa'`, companyID, id); err != nil {
			return 0, err
		}
		s.pushAudit(companyID, "system", "RESERVATION_EXPIRED", "Reserva "+id+" vencida por politica de reserva.")
	}
	return len(ids), nil
}

// ─── REPLENISHMENT ───────────────────────────────────────────────────────────

func (s *Service) ListReplenishmentItems(companyID string) ([]ReplenishmentItem, error) {
	rows, err := s.db.Query(`
		SELECT reference, description, supplier, alternate_supplier, procurement_owner,
			estimated_lead_days, last_quoted_unit_cost, shortage_reason, min_stock, current_stock,
			first_insufficient_at, last_attempt_at, attempts, status, updated_at
		FROM inventory_replenishment_items WHERE company_id = $1 ORDER BY first_insufficient_at ASC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]ReplenishmentItem, 0)
	for rows.Next() {
		var r ReplenishmentItem
		var firstAt, lastAt, updatedAt time.Time
		if err := rows.Scan(&r.Reference, &r.Description, &r.Supplier, &r.AlternateSupplier,
			&r.ProcurementOwner, &r.EstimatedLeadDays, &r.LastQuotedUnitCost, &r.ShortageReason,
			&r.MinStock, &r.CurrentStock, &firstAt, &lastAt, &r.Attempts, &r.Status, &updatedAt); err != nil {
			return nil, err
		}
		r.FirstInsufficientAt = firstAt.UTC().Format(time.RFC3339)
		r.LastAttemptAt = lastAt.UTC().Format(time.RFC3339)
		r.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		items = append(items, r)
	}
	return items, rows.Err()
}

func (s *Service) RebuildReplenishmentItems(companyID string) (int, error) {
	refs, err := s.ListReferences(companyID)
	if err != nil {
		return 0, err
	}

	existing, err := s.ListReplenishmentItems(companyID)
	if err != nil {
		return 0, err
	}
	existingMap := make(map[string]ReplenishmentItem)
	for _, item := range existing {
		existingMap[item.Reference] = item
	}

	now := time.Now().UTC()
	changed := 0

	for _, ref := range refs {
		if ref.CurrentStock > ref.MinStock {
			if _, exists := existingMap[ref.Reference]; exists {
				_, err := s.db.Exec(`DELETE FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2`, companyID, ref.Reference)
				if err != nil {
					return changed, err
				}
				changed++
			}
			continue
		}

		prev, hasPrev := existingMap[ref.Reference]
		status := "pendiente"
		attempts := 0
		firstAt := now
		if hasPrev {
			if prev.Status == "obsoleto" {
				continue
			}
			status = prev.Status
			attempts = prev.Attempts
			firstAtParsed, _ := time.Parse(time.RFC3339, prev.FirstInsufficientAt)
			if !firstAtParsed.IsZero() {
				firstAt = firstAtParsed
			}
		}
		if attempts >= 3 && status != "obsoleto" {
			status = "escalar"
		}

		supplier := ref.SupplierCode
		if hasPrev && prev.Supplier != "" {
			supplier = prev.Supplier
		}

		_, err := s.db.Exec(`
			INSERT INTO inventory_replenishment_items (company_id, reference, description, supplier,
				min_stock, current_stock, first_insufficient_at, last_attempt_at, attempts, status, updated_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
			ON CONFLICT (company_id, reference) DO UPDATE SET
				current_stock = EXCLUDED.current_stock,
				status = EXCLUDED.status,
				updated_at = EXCLUDED.updated_at
		`, companyID, ref.Reference, ref.Designation, supplier,
			ref.MinStock, ref.CurrentStock, firstAt, now, attempts, status, now)
		if err != nil {
			return changed, err
		}
		changed++
	}

	return changed, nil
}

func (s *Service) RegisterReplenishmentAttempt(companyID string, req RegisterReplenishmentAttemptRequest, actor string) (OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)

	var current ReplenishmentItem
	var firstAt, lastAt, updatedAt time.Time
	err := s.db.QueryRow(`
		SELECT reference, description, supplier, alternate_supplier, procurement_owner,
			estimated_lead_days, last_quoted_unit_cost, shortage_reason, min_stock, current_stock,
			first_insufficient_at, last_attempt_at, attempts, status, updated_at
		FROM inventory_replenishment_items WHERE company_id = $1 AND reference = $2
	`, companyID, ref).Scan(&current.Reference, &current.Description, &current.Supplier, &current.AlternateSupplier,
		&current.ProcurementOwner, &current.EstimatedLeadDays, &current.LastQuotedUnitCost, &current.ShortageReason,
		&current.MinStock, &current.CurrentStock, &firstAt, &lastAt, &current.Attempts, &current.Status, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "El item no existe o ya esta marcado como obsoleto."}, errReplenishmentNotFound
		}
		return OperationResult{}, err
	}

	if current.Status == "obsoleto" {
		return OperationResult{OK: false, Message: "El item no existe o ya esta marcado como obsoleto."}, errReplenishmentNotFound
	}

	if current.Status == "escalar" {
		return OperationResult{OK: false, Message: "item escalado: registre una decision (cambiar proveedor o marcar obsoleto)"}, errReplenishmentEscalated
	}

	now := time.Now().UTC()
	newAttempts := current.Attempts + 1
	newStatus := "en-gestion"
	if newAttempts >= 3 {
		newStatus = "escalar"
	}

	supplier := current.Supplier
	if strings.TrimSpace(req.Supplier) != "" {
		supplier = strings.TrimSpace(req.Supplier)
	}
	altSupplier := current.AlternateSupplier
	if strings.TrimSpace(req.AlternateSupplier) != "" {
		altSupplier = strings.TrimSpace(req.AlternateSupplier)
	}
	procOwner := current.ProcurementOwner
	if strings.TrimSpace(req.ProcurementOwner) != "" {
		procOwner = strings.TrimSpace(req.ProcurementOwner)
	}
	leadDays := current.EstimatedLeadDays
	if req.EstimatedLeadDays > 0 {
		leadDays = req.EstimatedLeadDays
	}
	unitCost := current.LastQuotedUnitCost
	if req.QuotedUnitCost > 0 {
		unitCost = req.QuotedUnitCost
	}
	reason := current.ShortageReason
	if strings.TrimSpace(req.ResultNote) != "" {
		reason = strings.TrimSpace(req.ResultNote)
	}

	_, err = s.db.Exec(`
		UPDATE inventory_replenishment_items SET
			supplier = $1, alternate_supplier = $2, procurement_owner = $3,
			estimated_lead_days = $4, last_quoted_unit_cost = $5, shortage_reason = $6,
			attempts = $7, last_attempt_at = $8, status = $9, updated_at = $10
		WHERE company_id = $11 AND reference = $12
	`, supplier, altSupplier, procOwner, leadDays, unitCost, reason,
		newAttempts, now, newStatus, now, companyID, ref)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "REGISTER_REPLENISHMENT_ATTEMPT", fmt.Sprintf("Intento de compra registrado para %s.", ref))
	return OperationResult{OK: true, Message: "Intento de compra registrado."}, nil
}

func (s *Service) MarkReplenishmentObsolete(companyID, reference, actor string) (OperationResult, error) {
	now := time.Now().UTC()
	result, err := s.db.Exec(`UPDATE inventory_replenishment_items SET status = 'obsoleto', updated_at = $1 WHERE company_id = $2 AND reference = $3 AND status != 'obsoleto'`, now, companyID, reference)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "El item no existe o ya esta marcado como obsoleto."}, errReplenishmentNotFound
	}
	s.pushAudit(companyID, actor, "MARK_REPLENISHMENT_OBSOLETE", fmt.Sprintf("Referencia %s marcada como obsoleta.", reference))
	return OperationResult{OK: true, Message: "Referencia marcada como obsoleta."}, nil
}

// ─── PURCHASE LINES ──────────────────────────────────────────────────────────

func (s *Service) ListPurchaseLines(companyID string) ([]PurchaseLine, error) {
	rows, err := s.db.Query(`
		SELECT id, reference, component, type, brand, description, supplier, quantity, received_quantity, unit_price, needed_by, source, expected_date,
			request_reason, generated_at, generated_by, status, project_id, equipment_tag,
			modified_by_purchases, modified_by, modified_at,
			approval_status, approved_by, approved_at
		FROM inventory_purchase_lines WHERE company_id = $1 ORDER BY generated_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]PurchaseLine, 0)
	for rows.Next() {
		var p PurchaseLine
		var generatedAt time.Time
		var modifiedAt sql.NullTime
		var approvedAt sql.NullTime
		var unitPrice float64
		if err := rows.Scan(&p.ID, &p.Reference, &p.Component, &p.Type, &p.Brand, &p.Description, &p.Supplier, &p.Quantity,
			&p.ReceivedQuantity, &unitPrice, &p.NeededBy, &p.Source, &p.ExpectedDate, &p.RequestReason, &generatedAt, &p.GeneratedBy, &p.Status,
			&p.ProjectID, &p.EquipmentTag, &p.ModifiedByPurchases, &p.ModifiedBy, &modifiedAt,
			&p.ApprovalStatus, &p.ApprovedBy, &approvedAt); err != nil {
			return nil, err
		}
		p.UnitPrice = unitPrice
		p.GeneratedAt = generatedAt.UTC().Format(time.RFC3339)
		if modifiedAt.Valid {
			p.ModifiedAt = modifiedAt.Time.UTC().Format(time.RFC3339)
		}
		if approvedAt.Valid {
			p.ApprovedAt = approvedAt.Time.UTC().Format(time.RFC3339)
		}
		items = append(items, p)
	}
	return items, rows.Err()
}

func (s *Service) GeneratePurchaseLines(companyID string, actor string, manual bool) (OperationResult, error) {
	items, err := s.ListReplenishmentItems(companyID)
	if err != nil {
		return OperationResult{}, err
	}

	lines, err := s.ListPurchaseLines(companyID)
	if err != nil {
		return OperationResult{}, err
	}

	openByRef := make(map[string]bool)
	for _, line := range lines {
		if line.Status != "cerrada" {
			openByRef[line.Reference] = true
		}
	}

	created := 0
	now := time.Now().UTC()

	for _, item := range items {
		if item.Status == "obsoleto" {
			continue
		}
		if !manual && item.Status == "escalar" {
			continue
		}
		if openByRef[item.Reference] {
			continue
		}

		qty := item.MinStock - item.CurrentStock
		if qty < 1 {
			qty = 1
		}

		source := "minimo"
		if manual {
			source = "manual"
		} else if item.Status == "escalar" {
			source = "escalamiento"
		}

		lineID := buildID("po")
		_, err := s.db.Exec(`
			INSERT INTO inventory_purchase_lines (company_id, id, reference, description, supplier,
				quantity, source, expected_date, request_reason, generated_at, generated_by, status)
			VALUES ($1,$2,$3,$4,$5,$6,$7,'',$8,$9,$10,'pendiente')
		`, companyID, lineID, item.Reference, item.Description, item.Supplier,
			qty, source, item.ShortageReason, now, actor)
		if err != nil {
			return OperationResult{}, err
		}

		newStatus := "en-gestion"
		if item.Attempts >= 3 {
			newStatus = "escalar"
		}
		_, err = s.db.Exec(`UPDATE inventory_replenishment_items SET last_attempt_at = $1, status = $2, updated_at = $1 WHERE company_id = $3 AND reference = $4`,
			now, newStatus, companyID, item.Reference)
		if err != nil {
			return OperationResult{}, err
		}

		openByRef[item.Reference] = true
		created++
	}

	if created > 0 {
		s.pushAudit(companyID, actor, "GENERATE_PURCHASE_LINES", fmt.Sprintf("Generacion %s: %d linea(s) creadas.", map[bool]string{true: "manual", false: "automatica"}[manual], created))
	}

	if created == 0 {
		return OperationResult{OK: true, Message: "No se generaron lineas nuevas (ya existen lineas abiertas o no hay insuficiencias)."}, nil
	}
	return OperationResult{OK: true, Message: fmt.Sprintf("Se generaron %d linea(s) de compra.", created)}, nil
}

func (s *Service) CreatePurchaseLine(companyID string, req CreatePurchaseLineRequest, actor string) (PurchaseLine, OperationResult, error) {
	reference := strings.TrimSpace(req.Reference)
	if reference == "" {
		return PurchaseLine{}, OperationResult{OK: false, Message: "La referencia es obligatoria."}, nil
	}
	if req.Quantity < 1 {
		return PurchaseLine{}, OperationResult{OK: false, Message: "La cantidad debe ser al menos 1."}, nil
	}

	lineID := buildID("po")
	now := time.Now().UTC()
	component := strings.TrimSpace(req.Component)
	typeName := strings.TrimSpace(req.Type)
	brand := strings.TrimSpace(req.Brand)
	description := strings.TrimSpace(req.Description)
	supplier := strings.TrimSpace(req.Supplier)
	reason := strings.TrimSpace(req.RequestReason)
	neededBy := strings.TrimSpace(req.NeededBy)
	projectID := strings.TrimSpace(req.ProjectID)
	equipmentTag := strings.TrimSpace(req.EquipmentTag)

	_, err := s.db.Exec(`
		INSERT INTO inventory_purchase_lines (company_id, id, reference, component, type, brand, description, supplier,
			quantity, unit_price, needed_by, source, expected_date, request_reason, generated_at, generated_by, status,
			project_id, equipment_tag, approval_status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'manual','',$12,$13,$14,'pendiente',$15,$16,'pendiente')
	`, companyID, lineID, reference, component, typeName, brand, description, supplier, req.Quantity, req.UnitPrice, neededBy, reason, now, actor, projectID, equipmentTag)
	if err != nil {
		return PurchaseLine{}, OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "CREATE_PURCHASE_LINE",
		fmt.Sprintf("Linea manual creada: %s x%d por %s", reference, req.Quantity, actor))

	line := PurchaseLine{
		ID:             lineID,
		Reference:      reference,
		Component:      component,
		Type:           typeName,
		Brand:          brand,
		Description:    description,
		Supplier:       supplier,
		Quantity:       req.Quantity,
		UnitPrice:      req.UnitPrice,
		NeededBy:       neededBy,
		Source:         "manual",
		RequestReason:  reason,
		GeneratedAt:    now.Format(time.RFC3339),
		GeneratedBy:    actor,
		Status:         "pendiente",
		ProjectID:      projectID,
		EquipmentTag:   equipmentTag,
		ApprovalStatus: "pendiente",
	}
	return line, OperationResult{OK: true, Message: fmt.Sprintf("Linea de compra creada para %s.", reference)}, nil
}

func (s *Service) MarkPurchaseLineSent(companyID, lineID, actor string) (OperationResult, error) {
	result, err := s.db.Exec(`UPDATE inventory_purchase_lines SET status = 'enviada' WHERE company_id = $1 AND id = $2 AND status = 'pendiente'`, companyID, lineID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La linea no existe o no esta pendiente."}, errPurchaseLineNotFound
	}
	s.pushAudit(companyID, actor, "SEND_PURCHASE_LINE", fmt.Sprintf("Linea %s enviada a proveedor.", lineID))
	return OperationResult{OK: true, Message: "Linea de compra marcada como enviada."}, nil
}

// ReceivePurchaseLine registra un recibo parcial (o total) de material del
// proveedor contra una linea abierta. Cada recibo acredita a stock SOLO las
// unidades recibidas y deja la traza en inventory_movements; cerrar la linea
// mas tarde acredita el faltante restante, asi ninguna unidad entra dos veces.
func (s *Service) ReceivePurchaseLine(companyID, lineID string, qty int, actor string) (OperationResult, error) {
	if qty < 1 {
		return OperationResult{OK: false, Message: "La cantidad recibida debe ser de al menos 1 unidad."}, errReceiveQuantity
	}

	var reference, supplier, status string
	var quantity, received int
	err := s.db.QueryRow(`
		SELECT reference, supplier, quantity, received_quantity, status
		FROM inventory_purchase_lines WHERE company_id = $1 AND id = $2`, companyID, lineID).Scan(
		&reference, &supplier, &quantity, &received, &status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La linea de compra no existe."}, errPurchaseLineNotFound
		}
		return OperationResult{}, err
	}

	if status == "cerrada" {
		return OperationResult{OK: false, Message: "La linea ya esta cerrada; el recibo debe registrarse antes del cierre."}, errInvalidStatus
	}

	remaining := quantity - received
	if remaining < 1 {
		return OperationResult{OK: false, Message: fmt.Sprintf("Ya se recibio la totalidad de %s (x%d).", reference, quantity)}, errReceiveQuantity
	}
	capped := ""
	if qty > remaining {
		qty = remaining // sin sobre-entrega: no entran mas unidades que las solicitadas
		capped = fmt.Sprintf(" (se limito a %d porque solo faltaban %d)", remaining, remaining)
	}

	// La referencia DEBE existir en el catalogo antes de tocar nada: recibir
	// contra una referencia fantasma marcaba received_quantity pero el material
	// se perdia en silencio (200 OK sin acreditar stock ni dejar movimiento).
	// Se valida antes del UPDATE para que el rechazo no deje efectos parciales.
	if _, refErr := s.GetReference(companyID, reference); refErr != nil {
		if errors.Is(refErr, errReferenceNotFound) {
			return OperationResult{OK: false, Message: fmt.Sprintf(
				"La referencia '%s' no existe en el catalogo de inventario. Cree la ficha primero o corrija la linea de compra.",
				reference)}, errReferenceNotFound
		}
		return OperationResult{}, refErr
	}

	now := time.Now().UTC()
	if _, err := s.db.Exec(`UPDATE inventory_purchase_lines SET received_quantity = $1 WHERE company_id = $2 AND id = $3`,
		received+qty, companyID, lineID); err != nil {
		return OperationResult{}, err
	}

	stockNote := ""
	// La referencia ya se validó arriba: aquí siempre existe y el recibo
	// acredita stock + deja la traza en inventory_movements.
	if existing, refErr := s.GetReference(companyID, reference); refErr == nil {
		newStock := existing.CurrentStock + qty
		movID := buildID("mov")
		_, _ = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
			newStock, now, companyID, reference)
		_, _ = s.db.Exec(`
			INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
				equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
			VALUES ($1,$2,'entrada',$3,$4,$5,'','','','regularizacion',$6,$7,$8)
		`, companyID, movID, reference, qty,
			fmt.Sprintf("Recibo de la linea %s (proveedor: %s)", lineID, supplier),
			lineID, actor, now)
		stockNote = fmt.Sprintf(" Stock actualizado a %d unidades.", newStock)
	}

	newTotal := received + qty
	s.pushAudit(companyID, actor, "RECEIVE_PURCHASE_LINE", fmt.Sprintf("Linea %s: recibido %d/%d de %s.", lineID, newTotal, quantity, reference))
	_ = s.syncReplenishmentForReference(companyID, reference, actor)
	msg := fmt.Sprintf("Recibo registrado: %s x%d. Recibido total %d de %d solicitados.%s%s", reference, qty, newTotal, quantity, stockNote, capped)
	return OperationResult{OK: true, Message: msg}, nil
}

func (s *Service) ClosePurchaseLine(companyID, lineID, actor string) (OperationResult, error) {
	var line PurchaseLine
	var generatedAt time.Time
	err := s.db.QueryRow(`
		SELECT id, reference, description, supplier, quantity, received_quantity, source, expected_date,
			request_reason, generated_at, generated_by, status
		FROM inventory_purchase_lines WHERE company_id = $1 AND id = $2
	`, companyID, lineID).Scan(&line.ID, &line.Reference, &line.Description, &line.Supplier, &line.Quantity,
		&line.ReceivedQuantity, &line.Source, &line.ExpectedDate, &line.RequestReason, &generatedAt, &line.GeneratedBy, &line.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return OperationResult{OK: false, Message: "La linea no existe o ya esta cerrada."}, errPurchaseLineNotFound
		}
		return OperationResult{}, err
	}

	if line.Status == "cerrada" {
		return OperationResult{OK: false, Message: "La linea no existe o ya esta cerrada."}, errInvalidStatus
	}

	now := time.Now().UTC()
	remaining := line.Quantity - line.ReceivedQuantity
	if remaining < 0 {
		remaining = 0
	}

	_, err = s.db.Exec(`UPDATE inventory_purchase_lines SET status = 'cerrada' WHERE company_id = $1 AND id = $2`, companyID, lineID)
	if err != nil {
		return OperationResult{}, err
	}

	var message string
	if existing, refErr := s.GetReference(companyID, line.Reference); refErr == nil && remaining > 0 {
		newStock := existing.CurrentStock + remaining
		movID := buildID("mov")

		_, _ = s.db.Exec(`UPDATE inventory_references SET current_stock = $1, updated_at = $2 WHERE company_id = $3 AND reference = $4`,
			newStock, now, companyID, line.Reference)

		reason := "Entrada automatica por cierre de linea de compra"
		if line.ReceivedQuantity > 0 {
			reason = fmt.Sprintf("Faltante recibido al cerrar la linea (recibos previos: %d/%d)", line.ReceivedQuantity, line.Quantity)
		}

		_, _ = s.db.Exec(`
			INSERT INTO inventory_movements (company_id, id, type, reference, quantity, reason, work_order,
				equipment_tag, customer_site, movement_category, evidence_ref, requested_by, requested_at)
			VALUES ($1,$2,'entrada',$3,$4,$5,'','','','regularizacion',$6,$7,$8)
		`, companyID, movID, line.Reference, remaining,
			fmt.Sprintf("%s %s", reason, lineID),
			lineID, actor, now)

		if line.ReceivedQuantity > 0 {
			message = fmt.Sprintf("Linea cerrada. Recibos previos: %d; faltante de %d unidades ingresado a stock (%s).", line.ReceivedQuantity, remaining, line.Reference)
		} else {
			message = fmt.Sprintf("Linea cerrada y %d unidades de %s ingresadas automaticamente a stock.", remaining, line.Reference)
		}
	} else if line.ReceivedQuantity > 0 {
		message = fmt.Sprintf("Linea cerrada: ya se habian recibido las %d unidades solicitadas de %s (stock actualizado con los recibos).", line.Quantity, line.Reference)
	} else {
		message = fmt.Sprintf("Linea cerrada. (%d unidades solicitadas de %s no entraron a stock porque la referencia no esta en el catalogo; registrala primero si corresponde.)", line.Quantity, line.Reference)
	}

	s.pushAudit(companyID, actor, "CLOSE_PURCHASE_LINE", fmt.Sprintf("Linea %s cerrada. Recibido total %d/%d de %s.", lineID, line.ReceivedQuantity+remaining, line.Quantity, line.Reference))
	_ = s.syncReplenishmentForReference(companyID, line.Reference, actor)
	return OperationResult{OK: true, Message: message}, nil
}

// ─── WEEKLY SNAPSHOTS ────────────────────────────────────────────────────────

func (s *Service) ListWeeklySnapshots(companyID string) ([]WeeklySnapshot, error) {
	rows, err := s.db.Query(`
		SELECT id, week_key, generated_at, generated_by, total_insufficient, escalated,
			average_waiting_days, critical_references
		FROM inventory_weekly_snapshots WHERE company_id = $1 ORDER BY generated_at DESC LIMIT 26
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]WeeklySnapshot, 0)
	for rows.Next() {
		var w WeeklySnapshot
		var generatedAt time.Time
		var critRaw []byte
		if err := rows.Scan(&w.ID, &w.WeekKey, &generatedAt, &w.GeneratedBy,
			&w.TotalInsufficient, &w.Escalated, &w.AverageWaitingDays, &critRaw); err != nil {
			return nil, err
		}
		w.GeneratedAt = generatedAt.UTC().Format(time.RFC3339)
		w.CriticalReferences = []string{}
		if len(critRaw) > 0 {
			_ = json.Unmarshal(critRaw, &w.CriticalReferences)
		}
		items = append(items, w)
	}
	return items, rows.Err()
}

func (s *Service) GenerateWeeklySnapshot(companyID, actor string) (OperationResult, error) {
	items, err := s.ListReplenishmentItems(companyID)
	if err != nil {
		return OperationResult{}, err
	}

	active := make([]ReplenishmentItem, 0)
	for _, item := range items {
		if item.Status != "obsoleto" {
			active = append(active, item)
		}
	}

	escalated := 0
	totalWaitingDays := 0
	now := time.Now()
	for _, item := range active {
		if item.Status == "escalar" {
			escalated++
		}
		firstAt, _ := time.Parse(time.RFC3339, item.FirstInsufficientAt)
		if !firstAt.IsZero() {
			totalWaitingDays += int(now.Sub(firstAt).Hours() / 24)
		}
	}
	avgWaiting := 0
	if len(active) > 0 {
		avgWaiting = totalWaitingDays / len(active)
	}

	criticalRefs := make([]string, 0)
	if len(active) > 0 {
		// Simple sort by shortage severity
		type scored struct {
			ref   string
			score int
		}
		scored_items := make([]scored, len(active))
		for i, item := range active {
			waitDays := 0
			firstAt, _ := time.Parse(time.RFC3339, item.FirstInsufficientAt)
			if !firstAt.IsZero() {
				waitDays = int(now.Sub(firstAt).Hours() / 24)
			}
			scored_items[i] = scored{ref: item.Reference, score: (item.MinStock - item.CurrentStock) + item.Attempts + waitDays/7}
		}
		// Simple bubble sort for top 3
		for i := 0; i < len(scored_items); i++ {
			for j := i + 1; j < len(scored_items); j++ {
				if scored_items[j].score > scored_items[i].score {
					scored_items[i], scored_items[j] = scored_items[j], scored_items[i]
				}
			}
		}
		limit := 3
		if len(scored_items) < limit {
			limit = len(scored_items)
		}
		for i := 0; i < limit; i++ {
			criticalRefs = append(criticalRefs, scored_items[i].ref)
		}
	}

	critJSON, _ := json.Marshal(criticalRefs)
	weekKey := isoWeekKey(now)

	_, err = s.db.Exec(`
		INSERT INTO inventory_weekly_snapshots (company_id, id, week_key, generated_at, generated_by,
			total_insufficient, escalated, average_waiting_days, critical_references)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
	`, companyID, fmt.Sprintf("week-%d", now.UnixMilli()), weekKey, time.Now().UTC(), actor,
		len(active), escalated, avgWaiting, string(critJSON))
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "GENERATE_WEEKLY_SHORTAGE_REPORT", fmt.Sprintf("Reporte semanal %s generado.", weekKey))
	return OperationResult{OK: true, Message: "Seguimiento semanal de faltantes generado."}, nil
}

// ─── BAG TRACES ──────────────────────────────────────────────────────────────

func (s *Service) ListBagTraces(companyID string) ([]TechnicianBagTrace, error) {
	rows, err := s.db.Query(`
		SELECT id, bag_code, reference, quantity, technician, work_order, seal_code,
			origin_area, reception_document, received_by, received_at, status,
			released_by, COALESCE(released_at, '1970-01-01'::timestamptz), notes
		FROM inventory_bag_traces WHERE company_id = $1 ORDER BY received_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]TechnicianBagTrace, 0)
	for rows.Next() {
		var b TechnicianBagTrace
		var receivedAt time.Time
		var releasedAt time.Time
		if err := rows.Scan(&b.ID, &b.BagCode, &b.Reference, &b.Quantity, &b.Technician,
			&b.WorkOrder, &b.SealCode, &b.OriginArea, &b.ReceptionDocument,
			&b.ReceivedBy, &receivedAt, &b.Status, &b.ReleasedBy, &releasedAt, &b.Notes); err != nil {
			return nil, err
		}
		b.ReceivedAt = receivedAt.UTC().Format(time.RFC3339)
		if !releasedAt.IsZero() && releasedAt.Year() > 1970 {
			b.ReleasedAt = releasedAt.UTC().Format(time.RFC3339)
		}
		items = append(items, b)
	}
	return items, rows.Err()
}

// ─── SESSIONS ────────────────────────────────────────────────────────────────

func (s *Service) ListSessions(companyID string) ([]CountSession, error) {
	rows, err := s.db.Query(`
		SELECT id, name, scope, owner, location, cutoff_date, counting_method, qa_lead,
			start_date, end_date, status, created_at
		FROM inventory_sessions WHERE company_id = $1 ORDER BY created_at DESC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]CountSession, 0)
	for rows.Next() {
		var cs CountSession
		var createdAt time.Time
		if err := rows.Scan(&cs.ID, &cs.Name, &cs.Scope, &cs.Owner, &cs.Location,
			&cs.CutoffDate, &cs.CountingMethod, &cs.QALead, &cs.StartDate,
			&cs.EndDate, &cs.Status, &createdAt); err != nil {
			return nil, err
		}
		cs.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		items = append(items, cs)
	}
	return items, rows.Err()
}

func (s *Service) CreateSession(companyID string, req CreateSessionRequest, actor string) (OperationResult, error) {
	name := strings.TrimSpace(req.Name)
	scope := strings.TrimSpace(req.Scope)
	owner := strings.TrimSpace(req.Owner)
	startDate := strings.TrimSpace(req.StartDate)

	if name == "" || scope == "" || owner == "" || startDate == "" {
		return OperationResult{OK: false, Message: "Nombre, alcance, responsable y fecha inicio son obligatorios."}, errReferenceRequired
	}

	now := time.Now().UTC()
	sessID := buildID("ses")

	_, err := s.db.Exec(`
		INSERT INTO inventory_sessions (company_id, id, name, scope, owner, location, cutoff_date,
			counting_method, qa_lead, start_date, end_date, status, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'','planificada',$11)
	`, companyID, sessID, name, scope, owner, strings.TrimSpace(req.Location),
		strings.TrimSpace(req.CutoffDate), strings.TrimSpace(req.CountingMethod),
		strings.TrimSpace(req.QALead), startDate, now)
	if err != nil {
		return OperationResult{}, err
	}

	s.pushAudit(companyID, owner, "CREATE_SESSION", fmt.Sprintf("Sesion %s creada para %s.", name, scope))
	return OperationResult{OK: true, Message: "Sesion creada correctamente."}, nil
}

func (s *Service) OpenSession(companyID, sessionID, actor string) (OperationResult, error) {
	result, err := s.db.Exec(`UPDATE inventory_sessions SET status = 'en-curso' WHERE company_id = $1 AND id = $2 AND status = 'planificada'`, companyID, sessionID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La sesion no existe o no esta en estado planificado."}, errSessionNotFound
	}
	s.pushAudit(companyID, actor, "OPEN_SESSION", fmt.Sprintf("Sesion %s iniciada.", sessionID))
	return OperationResult{OK: true, Message: "Sesion iniciada."}, nil
}

func (s *Service) CloseSession(companyID, sessionID, actor string) (OperationResult, error) {
	nowDate := time.Now().UTC().Format("2006-01-02")
	result, err := s.db.Exec(`UPDATE inventory_sessions SET status = 'cerrada', end_date = $1 WHERE company_id = $2 AND id = $3 AND status = 'en-curso'`, nowDate, companyID, sessionID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La sesion no existe o no esta en curso."}, errSessionNotFound
	}
	s.pushAudit(companyID, actor, "CLOSE_SESSION", fmt.Sprintf("Sesion %s cerrada.", sessionID))
	return OperationResult{OK: true, Message: "Sesion cerrada con acta disponible para exportar."}, nil
}

// ─── DISCREPANCIES ───────────────────────────────────────────────────────────

func (s *Service) ListDiscrepancies(companyID string) ([]DiscrepancyRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, session_id, reference, location, expected, counted, reason, root_cause,
			count_sheet, approved_by, COALESCE(approved_at, '1970-01-01'::timestamptz)
		FROM inventory_discrepancies WHERE company_id = $1 ORDER BY reference ASC
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DiscrepancyRecord, 0)
	for rows.Next() {
		var d DiscrepancyRecord
		var approvedAt time.Time
		if err := rows.Scan(&d.ID, &d.SessionID, &d.Reference, &d.Location, &d.Expected,
			&d.Counted, &d.Reason, &d.RootCause, &d.CountSheet, &d.ApprovedBy, &approvedAt); err != nil {
			return nil, err
		}
		if !approvedAt.IsZero() && approvedAt.Year() > 1970 {
			d.ApprovedAt = approvedAt.UTC().Format(time.RFC3339)
		}
		items = append(items, d)
	}
	return items, rows.Err()
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────

func (s *Service) ListAuditTrail(companyID string) ([]AuditEvent, error) {
	rows, err := s.db.Query(`
		SELECT id, created_at, actor, action, detail
		FROM inventory_audit_trail WHERE company_id = $1 ORDER BY created_at DESC LIMIT 500
	`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]AuditEvent, 0)
	for rows.Next() {
		var a AuditEvent
		var createdAt time.Time
		if err := rows.Scan(&a.ID, &createdAt, &a.User, &a.Action, &a.Detail); err != nil {
			return nil, err
		}
		a.When = createdAt.UTC().Format(time.RFC3339)
		items = append(items, a)
	}
	return items, rows.Err()
}

func (s *Service) pushAudit(companyID, actor, action, detail string) {
	_, _ = s.db.Exec(`
		INSERT INTO inventory_audit_trail (company_id, created_at, actor, action, detail)
		VALUES ($1, $2, $3, $4, $5)
	`, companyID, time.Now().UTC(), actor, action, detail)
}

// ─── DUPLICATE DETECTION ─────────────────────────────────────────────────────

func (s *Service) FindDuplicateCandidates(companyID, reference, internalCode, designation, supplier string) ([]DuplicateCandidate, error) {
	refs, err := s.ListReferences(companyID)
	if err != nil {
		return nil, err
	}
	return scoreDuplicateCandidates(refs, reference, internalCode, designation, supplier), nil
}

type DuplicateCandidate struct {
	Reference   string  `json:"reference"`
	Designation string  `json:"designation"`
	Similarity  float64 `json:"similarity"`
	Reason      string  `json:"reason"`
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

func buildID(prefix string) string {
	return fmt.Sprintf("%s-%d-%s", prefix, time.Now().UnixMilli(), randomSuffix())
}

// normalizeClientReservationID valida un ID de reserva generado por el cliente (mismo alfabeto que buildID).
// Devuelve cadena vacia si es inutilizable para que el servidor genere uno propio.
func normalizeClientReservationID(id string) string {
	id = strings.TrimSpace(id)
	if id == "" || len(id) > 80 {
		return ""
	}
	for i := 0; i < len(id); i++ {
		c := id[i]
		ok := (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_'
		if !ok {
			return ""
		}
	}
	return id
}

func randomSuffix() string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 5)
	for i := range b {
		b[i] = chars[time.Now().UnixNano()%int64(len(chars))]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}

func formatSupplierLabel(code, name string) string {
	code = strings.TrimSpace(code)
	name = strings.TrimSpace(name)
	if code != "" && name != "" {
		return code + " - " + name
	}
	if code != "" {
		return code
	}
	return name
}

func generateInternalCode(family string, count int) string {
	fam := strings.ToUpper(family)
	if len(fam) > 3 {
		fam = fam[:3]
	}
	return fmt.Sprintf("INV-%s-%05d", fam, count+1)
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func normalizeToken(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			return r
		}
		return -1
	}, value)
	return value
}

func similarity(left, right string) float64 {
	if left == "" || right == "" {
		return 0
	}
	if left == right {
		return 1
	}
	distance := levenshtein(left, right)
	maxLen := len(left)
	if len(right) > maxLen {
		maxLen = len(right)
	}
	if maxLen == 0 {
		return 1
	}
	return float64(maxLen-distance) / float64(maxLen)
}

func levenshtein(left, right string) int {
	rows := len(left) + 1
	cols := len(right) + 1
	matrix := make([][]int, rows)
	for i := range matrix {
		matrix[i] = make([]int, cols)
		matrix[i][0] = i
	}
	for j := 0; j < cols; j++ {
		matrix[0][j] = j
	}
	for i := 1; i < rows; i++ {
		for j := 1; j < cols; j++ {
			cost := 0
			if left[i-1] != right[j-1] {
				cost = 1
			}
			matrix[i][j] = matrix[i-1][j] + 1
			if matrix[i][j-1]+1 < matrix[i][j] {
				matrix[i][j] = matrix[i][j-1] + 1
			}
			if matrix[i-1][j-1]+cost < matrix[i][j] {
				matrix[i][j] = matrix[i-1][j-1] + cost
			}
		}
	}
	return matrix[rows-1][cols-1]
}

func isoWeekKey(t time.Time) string {
	year, week := t.ISOWeek()
	return fmt.Sprintf("%d-W%02d", year, week)
}

// ─── PURCHASE REQUESTS (Gap 5) ──────────────────────────────────────────────

func (s *Service) ListPurchaseRequests(companyID string, projectID string) ([]PurchaseRequest, error) {
	query := `SELECT id, reference, description, quantity, supplier, estimated_cost, lead_time_days,
		urgency, memo, project_id, equipment_tag, requested_by, requested_at, status,
		reviewed_by, COALESCE(reviewed_at, '1970-01-01'::timestamptz), review_notes, purchase_line_id
		FROM purchase_requests WHERE company_id = $1`
	args := []any{companyID}
	if projectID != "" {
		query += ` AND project_id = $2`
		args = append(args, projectID)
	}
	query += ` ORDER BY requested_at DESC`

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]PurchaseRequest, 0)
	for rows.Next() {
		var pr PurchaseRequest
		var requestedAt time.Time
		var reviewedAt time.Time
		if err := rows.Scan(&pr.ID, &pr.Reference, &pr.Description, &pr.Quantity, &pr.Supplier,
			&pr.EstimatedCost, &pr.LeadTimeDays, &pr.Urgency, &pr.Memo, &pr.ProjectID,
			&pr.EquipmentTag, &pr.RequestedBy, &requestedAt, &pr.Status, &pr.ReviewedBy,
			&reviewedAt, &pr.ReviewNotes, &pr.PurchaseLineID); err != nil {
			return nil, err
		}
		pr.RequestedAt = requestedAt.UTC().Format(time.RFC3339)
		if !reviewedAt.IsZero() && reviewedAt.Year() > 1970 {
			pr.ReviewedAt = reviewedAt.UTC().Format(time.RFC3339)
		}
		items = append(items, pr)
	}
	return items, rows.Err()
}

func (s *Service) CreatePurchaseRequest(companyID string, req CreatePurchaseRequestRequest, actor string) (PurchaseRequest, OperationResult, error) {
	ref := strings.TrimSpace(req.Reference)
	desc := strings.TrimSpace(req.Description)
	qty := req.Quantity
	if ref == "" || desc == "" || qty <= 0 {
		return PurchaseRequest{}, OperationResult{OK: false, Message: "Referencia, descripcion y cantidad son obligatorias."}, errInvalidQuantity
	}

	urgency := strings.TrimSpace(req.Urgency)
	if urgency == "" {
		urgency = "normal"
	}

	now := time.Now().UTC()
	prID := buildID("pr")

	_, err := s.db.Exec(`
		INSERT INTO purchase_requests (company_id, id, reference, description, quantity, supplier,
			estimated_cost, lead_time_days, urgency, memo, project_id, equipment_tag,
			requested_by, requested_at, status, reviewed_by, review_notes, purchase_line_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pendiente','','','')
	`, companyID, prID, ref, desc, qty, strings.TrimSpace(req.Supplier),
		req.EstimatedCost, maxInt(0, req.LeadTimeDays), urgency, strings.TrimSpace(req.Memo),
		strings.TrimSpace(req.ProjectID), strings.TrimSpace(req.EquipmentTag),
		actor, now)
	if err != nil {
		return PurchaseRequest{}, OperationResult{}, err
	}

	s.pushAudit(companyID, actor, "CREATE_PURCHASE_REQUEST", fmt.Sprintf("Solicitud de compra %s creada para %s (%d).", prID, ref, qty))

	pr := PurchaseRequest{
		ID: prID, Reference: ref, Description: desc, Quantity: qty,
		Supplier: strings.TrimSpace(req.Supplier), EstimatedCost: req.EstimatedCost,
		LeadTimeDays: req.LeadTimeDays, Urgency: urgency, Memo: strings.TrimSpace(req.Memo),
		ProjectID: strings.TrimSpace(req.ProjectID), EquipmentTag: strings.TrimSpace(req.EquipmentTag),
		RequestedBy: actor, RequestedAt: now.Format(time.RFC3339), Status: "pendiente",
	}
	return pr, OperationResult{OK: true, Message: "Solicitud de compra creada."}, nil
}

func (s *Service) ReviewPurchaseRequest(companyID, requestID, actor string, req ReviewPurchaseRequestRequest) (OperationResult, error) {
	action := strings.TrimSpace(req.Action)
	if action != "aprobar" && action != "rechazar" {
		return OperationResult{OK: false, Message: "Accion invalida (use aprobar o rechazar)."}, errInvalidStatus
	}

	now := time.Now().UTC()
	newStatus := "aprobada"
	if action == "rechazar" {
		newStatus = "rechazada"
	}

	result, err := s.db.Exec(`
		UPDATE purchase_requests SET status = $1, reviewed_by = $2, reviewed_at = $3, review_notes = $4
		WHERE company_id = $5 AND id = $6 AND status = 'pendiente'
	`, newStatus, actor, now, strings.TrimSpace(req.ReviewNotes), companyID, requestID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La solicitud no existe o ya fue revisada."}, errRequestNotFound
	}

	if action == "aprobar" {
		var pr PurchaseRequest
		var requestedAt time.Time
		var reviewedAt sql.NullTime
		err := s.db.QueryRow(`
			SELECT id, reference, description, quantity, supplier, estimated_cost, lead_time_days,
				urgency, memo, project_id, equipment_tag, requested_by, requested_at, status,
				reviewed_by, reviewed_at, review_notes, purchase_line_id
			FROM purchase_requests WHERE company_id = $1 AND id = $2
		`, companyID, requestID).Scan(&pr.ID, &pr.Reference, &pr.Description, &pr.Quantity, &pr.Supplier,
			&pr.EstimatedCost, &pr.LeadTimeDays, &pr.Urgency, &pr.Memo, &pr.ProjectID,
			&pr.EquipmentTag, &pr.RequestedBy, &requestedAt, &pr.Status, &pr.ReviewedBy,
			&reviewedAt, &pr.ReviewNotes, &pr.PurchaseLineID)
		if err == nil && pr.Status == "aprobada" {
			lineID := buildID("po")
			_, _ = s.db.Exec(`
				INSERT INTO inventory_purchase_lines (company_id, id, reference, description, supplier,
					quantity, source, expected_date, request_reason, generated_at, generated_by, status,
					approval_status, approved_by, approved_at)
				VALUES ($1,$2,$3,$4,$5,$6,'manual','',$7,$8,$9,'pendiente','aprobada',$10,$11)
			`, companyID, lineID, pr.Reference, pr.Description, pr.Supplier,
				pr.Quantity, pr.Memo, now, actor, actor, now)

			_, _ = s.db.Exec(`UPDATE purchase_requests SET purchase_line_id = $1 WHERE company_id = $2 AND id = $3`,
				lineID, companyID, requestID)
		}
	}

	s.pushAudit(companyID, actor, "REVIEW_PURCHASE_REQUEST", fmt.Sprintf("Solicitud %s %s.", requestID, newStatus))
	return OperationResult{OK: true, Message: fmt.Sprintf("Solicitud %s.", newStatus)}, nil
}

// ─── CONSOLIDATION BY SUPPLIER (Gap 3) ───────────────────────────────────────

func (s *Service) ConsolidatePurchaseLinesBySupplier(companyID string) ([]SupplierConsolidation, error) {
	lines, err := s.ListPurchaseLines(companyID)
	if err != nil {
		return nil, err
	}

	grouped := make(map[string][]PurchaseLine)
	for _, line := range lines {
		if line.Status == "cerrada" {
			continue
		}
		supplier := line.Supplier
		if supplier == "" {
			supplier = "(sin proveedor)"
		}
		grouped[supplier] = append(grouped[supplier], line)
	}

	result := make([]SupplierConsolidation, 0, len(grouped))
	for supplier, supplierLines := range grouped {
		totalQty := 0
		for _, l := range supplierLines {
			totalQty += l.Quantity
		}
		result = append(result, SupplierConsolidation{
			Supplier:      supplier,
			Lines:         supplierLines,
			TotalItems:    len(supplierLines),
			TotalQuantity: totalQty,
		})
	}

	return result, nil
}

// ─── APPROVAL WORKFLOW (Gap 2) ───────────────────────────────────────────────

func (s *Service) ApprovePurchaseLine(companyID, lineID, actor string) (OperationResult, error) {
	now := time.Now().UTC()
	result, err := s.db.Exec(`
		UPDATE inventory_purchase_lines SET approval_status = 'aprobada', approved_by = $1, approved_at = $2
		WHERE company_id = $3 AND id = $4 AND approval_status = 'pendiente'
	`, actor, now, companyID, lineID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La linea no existe o ya fue aprobada."}, errPurchaseLineNotFound
	}
	s.pushAudit(companyID, actor, "APPROVE_PURCHASE_LINE", fmt.Sprintf("Linea %s aprobada.", lineID))
	return OperationResult{OK: true, Message: "Linea de compra aprobada."}, nil
}

func (s *Service) RejectPurchaseLine(companyID, lineID, actor string) (OperationResult, error) {
	now := time.Now().UTC()
	result, err := s.db.Exec(`
		UPDATE inventory_purchase_lines SET approval_status = 'rechazada', approved_by = $1, approved_at = $2
		WHERE company_id = $3 AND id = $4 AND approval_status = 'pendiente'
	`, actor, now, companyID, lineID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La linea no existe o ya fue revisada."}, errPurchaseLineNotFound
	}
	s.pushAudit(companyID, actor, "REJECT_PURCHASE_LINE", fmt.Sprintf("Linea %s rechazada.", lineID))
	return OperationResult{OK: true, Message: "Linea de compra rechazada."}, nil
}

// ─── LINK PURCHASE LINE TO ORDER (Gap 1) ─────────────────────────────────────

func (s *Service) LinkPurchaseLineToOrder(companyID, lineID string, orderID int64, actor string) (OperationResult, error) {
	result, err := s.db.Exec(`UPDATE inventory_purchase_lines SET linked_order_id = $1 WHERE company_id = $2 AND id = $3`,
		orderID, companyID, lineID)
	if err != nil {
		return OperationResult{}, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return OperationResult{OK: false, Message: "La linea no existe."}, errPurchaseLineNotFound
	}

	_, _ = s.db.Exec(`UPDATE supplier_order_items SET purchase_line_id = $1 WHERE company_id = $2 AND order_id = $3`,
		lineID, companyID, orderID)

	s.pushAudit(companyID, actor, "LINK_PURCHASE_LINE_TO_ORDER", fmt.Sprintf("Linea %s vinculada a orden %d.", lineID, orderID))
	return OperationResult{OK: true, Message: "Linea vinculada a orden de compra."}, nil
}
