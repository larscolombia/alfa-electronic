package quotes

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	crmEquipment "pika.software.net.co/backend/internal/crm/equipment"
)

func (s *Service) UpsertQuote(companyID string, quote Quote) (Quote, error) {
	ctx := context.Background()
	normalized, err := normalizeQuote(quote)
	if err != nil {
		return Quote{}, err
	}

	linesRaw, err := json.Marshal(normalized.Lineas)
	if err != nil {
		return Quote{}, err
	}

	selectedEquipmentRaw, err := json.Marshal(normalizeStringSlice(normalized.SelectedEquipmentIDs))
	if err != nil {
		return Quote{}, err
	}

	var purchaseOrderUploadedAt any
	if normalized.PurchaseOrderUploadedAt != "" {
		parsedUploadedAt, parseErr := time.Parse(time.RFC3339, normalized.PurchaseOrderUploadedAt)
		if parseErr != nil {
			return Quote{}, errPurchaseOrderUploadedAtInvalid
		}
		purchaseOrderUploadedAt = parsedUploadedAt.UTC()
	}

	if _, err := s.db.ExecContext(ctx, `
INSERT INTO crm_quotes (
	company_id, id, token, codigo, prospecto, prospect_id, empresa, correo, movil,
	fecha, valido_hasta, estado, moneda, descuento_tipo, descuento_valor,
	lineas_json, nota, terminos, estado_cliente, fecha_decision, firmado_por,
	firmante_correo, lugar_firma, firma_base64,
	descripcion, tax_mode, zone, signature_required, selected_equipment_ids_json,
	subtotal, tax_total, total,
	purchase_order_number, purchase_order_file_name, purchase_order_file_data_url, purchase_order_date, purchase_order_uploaded_at,
	soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, $6, $7, $8, $9,
	$10, $11, $12, $13, $14, $15,
	$16, $17, $18, $19, $20, $21,
	$22, $23, $24,
	$25, $26, $27, $28, $29,
	$30, $31, $32,
	$33, $34, $35, $36, $37,
	false, NOW(), NOW()
)
ON CONFLICT (company_id, id)
DO UPDATE SET
	token = EXCLUDED.token,
	codigo = EXCLUDED.codigo,
	prospecto = EXCLUDED.prospecto,
	prospect_id = EXCLUDED.prospect_id,
	empresa = EXCLUDED.empresa,
	correo = EXCLUDED.correo,
	movil = EXCLUDED.movil,
	fecha = EXCLUDED.fecha,
	valido_hasta = EXCLUDED.valido_hasta,
	estado = EXCLUDED.estado,
	moneda = EXCLUDED.moneda,
	descuento_tipo = EXCLUDED.descuento_tipo,
	descuento_valor = EXCLUDED.descuento_valor,
	lineas_json = EXCLUDED.lineas_json,
	nota = EXCLUDED.nota,
	terminos = EXCLUDED.terminos,
	estado_cliente = EXCLUDED.estado_cliente,
	fecha_decision = EXCLUDED.fecha_decision,
	firmado_por = EXCLUDED.firmado_por,
	firmante_correo = EXCLUDED.firmante_correo,
	lugar_firma = EXCLUDED.lugar_firma,
	firma_base64 = EXCLUDED.firma_base64,
	descripcion = EXCLUDED.descripcion,
	tax_mode = EXCLUDED.tax_mode,
	zone = EXCLUDED.zone,
	signature_required = EXCLUDED.signature_required,
	selected_equipment_ids_json = EXCLUDED.selected_equipment_ids_json,
	subtotal = EXCLUDED.subtotal,
	tax_total = EXCLUDED.tax_total,
	total = EXCLUDED.total,
	purchase_order_number = EXCLUDED.purchase_order_number,
	purchase_order_file_name = EXCLUDED.purchase_order_file_name,
	purchase_order_file_data_url = EXCLUDED.purchase_order_file_data_url,
	purchase_order_date = EXCLUDED.purchase_order_date,
	purchase_order_uploaded_at = EXCLUDED.purchase_order_uploaded_at,
	soft_delete = false,
	updated_at = NOW();
`,
		companyID,
		normalized.ID,
		normalized.Token,
		normalized.Codigo,
		normalized.Prospecto,
		normalized.ProspectID,
		normalized.Empresa,
		normalized.Correo,
		normalized.Movil,
		normalized.Fecha,
		normalized.ValidoHasta,
		normalized.Estado,
		normalized.Moneda,
		normalized.DescuentoTipo,
		normalized.DescuentoValor,
		linesRaw,
		normalized.Nota,
		normalized.Terminos,
		normalized.EstadoCliente,
		normalized.FechaDecision,
		normalized.FirmadoPor,
		normalized.FirmanteCorreo,
		normalized.LugarFirma,
		normalized.FirmaBase64,
		normalized.Descripcion,
		normalized.TaxMode,
		normalized.Zone,
		normalized.SignatureRequired,
		selectedEquipmentRaw,
		normalized.Subtotal,
		normalized.TaxTotal,
		normalized.Total,
		normalized.PurchaseOrderNumber,
		normalized.PurchaseOrderFileName,
		normalized.PurchaseOrderFileDataURL,
		normalized.PurchaseOrderDate,
		purchaseOrderUploadedAt,
	); err != nil {
		return Quote{}, err
	}

	item, err := s.GetQuote(companyID, normalized.ID)
	if err != nil {
		return Quote{}, err
	}

	if strings.TrimSpace(item.PurchaseOrderNumber) != "" {
		if err := s.ensureClientFromAcceptedQuote(ctx, companyID, item); err != nil {
			return Quote{}, err
		}
		if err := s.applyPurchaseOrderWorkflow(ctx, companyID, item); err != nil {
			return Quote{}, err
		}
	}

	return item, nil
}

func (s *Service) DeleteQuote(companyID, quoteID string) (bool, error) {
	ctx := context.Background()
	normalizedID := strings.TrimSpace(quoteID)
	if normalizedID == "" {
		return false, errQuoteIDRequired
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_quotes
SET soft_delete = true,
	updated_at = NOW()
WHERE company_id = $1
  AND id = $2
  AND soft_delete = false;
`, companyID, normalizedID)
	if err != nil {
		return false, err
	}

	affected, _ := result.RowsAffected()
	return affected > 0, nil
}

func (s *Service) UpdateDecisionByToken(companyID, token string, req DecisionRequest) (Quote, error) {
	ctx := context.Background()
	normalizedToken := strings.TrimSpace(token)
	if normalizedToken == "" {
		return Quote{}, errQuoteTokenRequired
	}

	decision, err := normalizeClientDecision(req.EstadoCliente)
	if err != nil {
		return Quote{}, err
	}

	decisionDate := strings.TrimSpace(req.FechaDecision)
	if decisionDate == "" {
		now := time.Now()
		decisionDate = fmt.Sprintf("%02d/%02d/%04d %02d:%02d", now.Day(), now.Month(), now.Year(), now.Hour(), now.Minute())
	}

	result, err := s.db.ExecContext(ctx, `
UPDATE crm_quotes
SET estado_cliente = $1,
	fecha_decision = $2,
	firmado_por = $3,
	firmante_correo = $4,
	lugar_firma = $5,
	firma_base64 = $6,
	estado = CASE WHEN $1 = 'Aceptada' THEN 'Aprobado' ELSE estado END,
	updated_at = NOW()
WHERE company_id = $7
  AND token = $8
  AND soft_delete = false;
`, decision, decisionDate, strings.TrimSpace(req.FirmadoPor), strings.TrimSpace(req.FirmanteCorreo), strings.TrimSpace(req.LugarFirma), strings.TrimSpace(req.FirmaBase64), companyID, normalizedToken)
	if err != nil {
		return Quote{}, err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return Quote{}, errQuoteNotFound
	}

	item, err := s.GetQuoteByToken(companyID, normalizedToken)
	if err != nil {
		return Quote{}, err
	}

	if decision == "Aceptada" {
		if err := s.ensureClientFromAcceptedQuote(ctx, companyID, item); err != nil {
			return Quote{}, err
		}
		if strings.TrimSpace(item.PurchaseOrderNumber) != "" {
			if err := s.applyPurchaseOrderWorkflow(ctx, companyID, item); err != nil {
				return Quote{}, err
			}
		}
	}

	return item, nil
}

func (s *Service) ensureClientFromAcceptedQuote(ctx context.Context, companyID string, quote Quote) error {
	normalizedCompany := strings.TrimSpace(quote.Empresa)
	normalizedName := strings.TrimSpace(quote.Prospecto)
	normalizedEmail := strings.TrimSpace(quote.Correo)
	normalizedZone := strings.TrimSpace(quote.Zone)

	if normalizedName == "" {
		normalizedName = normalizedCompany
	}
	if normalizedCompany == "" {
		normalizedCompany = normalizedName
	}
	if normalizedZone == "" {
		normalizedZone = "General"
	}

	if normalizedCompany == "" && normalizedName == "" && normalizedEmail == "" {
		return nil
	}

	var existingID string
	err := s.db.QueryRowContext(ctx, `
SELECT id
FROM crm_clients
WHERE company_id = $1
  AND soft_delete = false
  AND (
		($2 <> '' AND LOWER(empresa) = LOWER($2))
		OR ($3 <> '' AND LOWER(correo) = LOWER($3))
		OR ($2 <> '' AND $4 <> '' AND LOWER(empresa) = LOWER($2) AND LOWER(nombre) = LOWER($4))
	)
LIMIT 1;
`, companyID, normalizedCompany, normalizedEmail, normalizedName).Scan(&existingID)
	if err == nil {
		return nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	_, err = s.db.ExecContext(ctx, `
INSERT INTO crm_clients (
	company_id, id, nombre, correo, empresa, nit, zona, estado,
	credit_enabled, credit_limit, credit_consumed, last_payment_date, payment_term_days,
	soft_delete, created_at, updated_at
)
VALUES (
	$1, $2, $3, $4, $5, '', $6, 'Activo',
	false, 0, 0, NULL, 30,
	false, NOW(), NOW()
);
`, companyID, uuid.NewString(), normalizedName, normalizedEmail, normalizedCompany, normalizedZone)

	return err
}

func (s *Service) applyPurchaseOrderWorkflow(ctx context.Context, companyID string, quote Quote) error {
	selectedEquipmentIDs := normalizeStringSlice(quote.SelectedEquipmentIDs)
	if len(selectedEquipmentIDs) == 0 {
		return nil
	}

	trackedIDs := make(map[string]struct{}, len(selectedEquipmentIDs))
	for _, itemID := range selectedEquipmentIDs {
		if itemID == "" {
			continue
		}
		trackedIDs[itemID] = struct{}{}
	}
	if len(trackedIDs) == 0 {
		return nil
	}

	rows, err := s.db.QueryContext(ctx, `
SELECT id, items_json
FROM crm_equipment_records
WHERE company_id = $1
  AND archived = false;
`, companyID)
	if err != nil {
		return err
	}
	defer rows.Close()

	updatedBy := strings.TrimSpace(quote.FirmadoPor)
	if updatedBy == "" {
		updatedBy = "crm-oc"
	}
	updatedAt := time.Now().UTC().Format(time.RFC3339)

	for rows.Next() {
		var recordID string
		var rawItems []byte
		if err := rows.Scan(&recordID, &rawItems); err != nil {
			return err
		}

		if len(rawItems) == 0 {
			continue
		}

		items := make([]crmEquipment.Item, 0)
		if err := json.Unmarshal(rawItems, &items); err != nil {
			return err
		}

		changed := false
		for index := range items {
			itemID := strings.TrimSpace(items[index].ID)
			if _, ok := trackedIDs[itemID]; !ok {
				continue
			}

			if items[index].RepairStatus == "pedir-repuestos" {
				if items[index].RepairStatusUpdatedAt == "" {
					items[index].RepairStatusUpdatedAt = updatedAt
					changed = true
				}
				if items[index].RepairStatusUpdatedBy == "" {
					items[index].RepairStatusUpdatedBy = updatedBy
					changed = true
				}
				continue
			}

			items[index].RepairStatus = "pedir-repuestos"
			items[index].RepairStatusUpdatedAt = updatedAt
			items[index].RepairStatusUpdatedBy = updatedBy
			changed = true
		}

		if !changed {
			continue
		}

		nextRawItems, err := json.Marshal(items)
		if err != nil {
			return err
		}

		if _, err := s.db.ExecContext(ctx, `
UPDATE crm_equipment_records
SET items_json = $1::jsonb,
	updated_at = NOW()
WHERE company_id = $2
  AND id = $3;
`, string(nextRawItems), companyID, recordID); err != nil {
			return err
		}
	}

	return rows.Err()
}
