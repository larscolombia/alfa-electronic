package inventory

import (
	"fmt"
	"strings"
	"time"
)

func (s *Service) insertReference(companyID string, req CreateReferenceRequest, actor, ref, desig string) (StockReference, error) {
	family := strings.TrimSpace(req.Family)
	if family == "" {
		family = "Sin familia"
	}
	brand := strings.TrimSpace(req.Brand)
	if brand == "" {
		brand = "Sin marca"
	}
	location := strings.TrimSpace(req.Location)
	if location == "" {
		location = "Sin ubicacion"
	}
	unitMeasure := strings.TrimSpace(req.UnitMeasure)
	if unitMeasure == "" {
		unitMeasure = "unidad"
	}

	internalCode := strings.TrimSpace(req.InternalCode)
	if internalCode == "" {
		var count int
		_ = s.db.QueryRow(`SELECT COUNT(*) FROM inventory_references WHERE company_id = $1`, companyID).Scan(&count)
		internalCode = generateInternalCode(family, count)
	}

	criticality := strings.TrimSpace(req.Criticality)
	if criticality == "" {
		criticality = "media"
	}

	now := time.Now().UTC()
	_, err := s.db.Exec(`
		INSERT INTO inventory_references (company_id, reference, internal_code, manufacturer_reference, designation,
			family, subfamily, brand, location, unit_measure, compatible_equipment, criticality,
			preferred_supplier_name, lead_time_days, technical_notes, supplier_code,
			current_stock, min_stock, target_stock, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0,$17,$18,$19,$20)
	`, companyID, ref, internalCode, strings.TrimSpace(req.ManufacturerReference), desig,
		family, strings.TrimSpace(req.Subfamily), brand, location, unitMeasure,
		strings.TrimSpace(req.CompatibleEquipment), criticality,
		strings.TrimSpace(req.PreferredSupplierName), maxInt(0, req.LeadTimeDays),
		strings.TrimSpace(req.TechnicalNotes), strings.TrimSpace(req.SupplierCode),
		maxInt(0, req.MinStock), maxInt(0, req.TargetStock), now, now)
	if err != nil {
		return StockReference{}, err
	}

	created, _ := s.GetReference(companyID, ref)
	// INV-05/INV-10: una ficha que nace bajo el minimo (stock 0 < minimo) debe
	// generar su item de reposicion de inmediato, sin esperar al primer
	// movimiento. Con minimo 0 no hay alerta que crear.
	if created.MinStock > 0 {
		_ = s.syncReplenishmentForReference(companyID, ref, actor)
	}
	return created, nil
}

func (s *Service) forceCreateReference(companyID string, req CreateReferenceRequest, actor, ref, desig string, candidates []DuplicateCandidate, forceReason string) (StockReference, OperationResult, error) {
	created, err := s.insertReference(companyID, req, actor, ref, desig)
	if err != nil {
		return StockReference{}, OperationResult{}, err
	}

	candidateRefs := make([]string, 0, len(candidates))
	for _, c := range candidates {
		candidateRefs = append(candidateRefs, c.Reference)
	}
	s.pushAudit(companyID, actor, "REFERENCE_FORCE_CREATED",
		fmt.Sprintf("Referencia %s creada forzosamente: %s. Candidatos: %s", ref, forceReason, strings.Join(candidateRefs, ", ")))
	return created, OperationResult{OK: true, Message: fmt.Sprintf("Ficha %s creada correctamente.", ref)}, nil
}
