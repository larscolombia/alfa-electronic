package remissions

import (
	"errors"
	"strings"
)

// FASE 5c — Lecturas de facturación que alimentan el panel de despacho.
//
// Se leen por SQL desde este paquete (mismo criterio que internal/finance usa
// para leer crm_quotes desde la Fase 5b) en vez de importar internal/finance:
// así remissions no se acopla al paquete de finanzas y main.go no necesita
// cablear una dependencia cruzada nueva.

// InvoiceOption es una fila del selector "qué factura debe pagarse antes de
// despachar". Lleva el estado porque la UI muestra "retenida por pago" con el
// estado real, y `paid` para habilitar/deshabilitar sin recalcular nada.
type InvoiceOption struct {
	ID            int64   `json:"id"`
	ReferenceCode string  `json:"referenceCode"`
	ExternalNum   string  `json:"externalNumber"`
	ClientName    string  `json:"clientName"`
	IssueDate     string  `json:"issueDate"`
	Total         float64 `json:"total"`
	Balance       float64 `json:"balanceAmount"`
	Status        string  `json:"status"`
	Paid          bool    `json:"paid"`
}

// InvoiceOptions lista las facturas del cliente de una remisión.
//
// La coincidencia es por NIT y, si la remisión no trae NIT, por nombre/empresa:
// `remissions` no tiene client_id, sólo client_nit y client_name, así que no
// hay un vínculo más fuerte que usar. Es exactamente el mismo criterio del JOIN
// que calcula credit_enabled, para que el selector y la puerta de pago no
// discrepen sobre quién es el cliente.
func (s *Service) InvoiceOptions(companyID, remissionID string) ([]InvoiceOption, error) {
	var clientNIT, clientName string
	err := s.db.QueryRow(
		`SELECT client_nit, client_name FROM remissions WHERE company_id = $1 AND id = $2`,
		companyID, strings.TrimSpace(remissionID),
	).Scan(&clientNIT, &clientName)
	if err != nil {
		return nil, errRemissionNotFound
	}

	clientNIT = strings.TrimSpace(clientNIT)
	clientName = strings.TrimSpace(clientName)
	if clientNIT == "" && clientName == "" {
		return []InvoiceOption{}, nil
	}

	rows, err := s.db.Query(`
SELECT fi.id, COALESCE(fi.reference_code, ''), COALESCE(fi.external_number, ''),
	COALESCE(fi.client_name, ''),
	COALESCE(to_char(fi.issue_date, 'YYYY-MM-DD'), ''),
	COALESCE(fi.total, 0), COALESCE(fi.balance_amount, 0), fi.status
FROM finance_invoices fi
WHERE fi.company_id = $1
  AND fi.soft_delete = false
  AND COALESCE(fi.document_type, 'factura') <> 'nota_credito'
  AND EXISTS (
	SELECT 1 FROM crm_clients cc
	WHERE cc.company_id = fi.company_id
	  AND cc.id = fi.client_id
	  AND cc.soft_delete = false
	  AND (
		($2 <> '' AND lower(cc.nit) = lower($2))
		OR ($2 = '' AND $3 <> '' AND (lower(cc.empresa) = lower($3) OR lower(cc.nombre) = lower($3)))
	  )
  )
ORDER BY fi.issue_date DESC NULLS LAST, fi.id DESC
LIMIT 100`, companyID, clientNIT, clientName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]InvoiceOption, 0)
	for rows.Next() {
		var option InvoiceOption
		if err := rows.Scan(
			&option.ID, &option.ReferenceCode, &option.ExternalNum, &option.ClientName,
			&option.IssueDate, &option.Total, &option.Balance, &option.Status,
		); err != nil {
			return nil, err
		}
		option.Status = strings.TrimSpace(option.Status)
		option.Paid = strings.EqualFold(option.Status, InvoiceStatusPaid)
		items = append(items, option)
	}
	return items, rows.Err()
}

// LinkInvoice vincula la factura que debe pagarse antes de despachar.
//
// Valida que la factura exista y sea de la misma empresa: vincular un id
// inventado dejaría la remisión con un invoice_id que el JOIN no resuelve, y la
// puerta de pago reportaría "no aparece como Pagada" sin que el usuario
// entienda por qué.
func (s *Service) LinkInvoice(companyID, remissionID string, invoiceID *int64) (*Remission, error) {
	id := strings.TrimSpace(remissionID)
	normalized := normalizeInvoiceID(invoiceID)

	if normalized != nil {
		var exists bool
		err := s.db.QueryRow(`
SELECT EXISTS (
	SELECT 1 FROM finance_invoices
	WHERE company_id = $1 AND id = $2 AND soft_delete = false
)`, companyID, *normalized).Scan(&exists)
		if err != nil {
			return nil, err
		}
		if !exists {
			return nil, errors.New("la factura indicada no existe en esta empresa")
		}
	}

	res, err := s.db.Exec(
		`UPDATE remissions SET invoice_id = $3, updated_at = NOW() WHERE company_id = $1 AND id = $2`,
		companyID, id, normalized,
	)
	if err != nil {
		return nil, err
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
