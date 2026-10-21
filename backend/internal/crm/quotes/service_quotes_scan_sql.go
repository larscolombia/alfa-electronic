package quotes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

func scanQuote(scanner interface{ Scan(dest ...any) error }) (Quote, error) {
	var (
		item                    Quote
		rawLines                []byte
		rawSelectedEquipment    []byte
		purchaseOrderUploadedAt sql.NullTime
		invoicedAt              sql.NullTime
		createdAt               time.Time
		updatedAt               time.Time
	)

	if err := scanner.Scan(
		&item.ID,
		&item.Token,
		&item.Codigo,
		&item.Prospecto,
		&item.ProspectID,
		&item.Empresa,
		&item.Correo,
		&item.Movil,
		&item.Fecha,
		&item.ValidoHasta,
		&item.Estado,
		&item.Moneda,
		&item.DescuentoTipo,
		&item.DescuentoValor,
		&rawLines,
		&item.Nota,
		&item.Terminos,
		&item.EstadoCliente,
		&item.FechaDecision,
		&item.FirmadoPor,
		&item.FirmanteCorreo,
		&item.LugarFirma,
		&item.FirmaBase64,
		&item.Descripcion,
		&item.TaxMode,
		&item.Zone,
		&item.SignatureRequired,
		&rawSelectedEquipment,
		&item.Subtotal,
		&item.TaxTotal,
		&item.Total,
		&item.PurchaseOrderNumber,
		&item.PurchaseOrderFileName,
		&item.PurchaseOrderFileDataURL,
		&item.PurchaseOrderDate,
		&purchaseOrderUploadedAt,
		&createdAt,
		&updatedAt,
		&item.InvoiceID,
		&invoicedAt,
	); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return Quote{}, errQuoteNotFound
		}
		return Quote{}, err
	}

	item.Estado, _ = normalizeQuoteStatus(item.Estado)
	item.EstadoCliente, _ = normalizeClientDecision(item.EstadoCliente)
	item.Moneda = normalizeCurrency(item.Moneda)
	item.DescuentoTipo = normalizeDiscountType(item.DescuentoTipo)
	item.TaxMode = normalizeTaxMode(item.TaxMode)
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	if purchaseOrderUploadedAt.Valid {
		item.PurchaseOrderUploadedAt = purchaseOrderUploadedAt.Time.UTC().Format(time.RFC3339)
	}
	if invoicedAt.Valid {
		item.InvoicedAt = invoicedAt.Time.UTC().Format(time.RFC3339)
	}

	if len(rawLines) > 0 {
		if err := json.Unmarshal(rawLines, &item.Lineas); err != nil {
			return Quote{}, err
		}
	} else {
		item.Lineas = []Line{}
	}

	if len(rawSelectedEquipment) > 0 {
		if err := json.Unmarshal(rawSelectedEquipment, &item.SelectedEquipmentIDs); err != nil {
			return Quote{}, err
		}
	} else {
		item.SelectedEquipmentIDs = []string{}
	}

	return item, nil
}

func buildListQuotesStatement(filters []string, limitArg int) string {
	statement := fmt.Sprintf(`
SELECT %s
FROM crm_quotes
WHERE %s
ORDER BY updated_at DESC, created_at DESC`, quoteSelectColumns, strings.Join(filters, " AND "))

	if limitArg > 0 {
		statement += fmt.Sprintf("\nLIMIT $%d", limitArg)
	}

	return statement + ";"
}

func buildGetQuoteStatement(fieldName string) string {
	return fmt.Sprintf(`
SELECT %s
FROM crm_quotes
WHERE company_id = $1
  AND %s = $2
  AND soft_delete = false;
`, quoteSelectColumns, fieldName)
}
