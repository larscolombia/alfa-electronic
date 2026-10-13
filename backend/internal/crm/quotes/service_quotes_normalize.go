package quotes

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"

	"github.com/google/uuid"
)

func normalizeQuote(input Quote) (Quote, error) {
	normalized := input
	normalized.ID = strings.TrimSpace(normalized.ID)
	if normalized.ID == "" {
		normalized.ID = uuid.NewString()
	}

	normalized.Token = strings.TrimSpace(normalized.Token)
	if normalized.Token == "" {
		normalized.Token = randomHex(32)
	}

	normalized.Codigo = strings.TrimSpace(normalized.Codigo)
	if normalized.Codigo == "" {
		return Quote{}, errQuoteCodeRequired
	}

	normalized.Prospecto = strings.TrimSpace(normalized.Prospecto)
	if normalized.Prospecto == "" {
		return Quote{}, errQuoteProspectNeeded
	}

	status, err := normalizeQuoteStatus(normalized.Estado)
	if err != nil {
		return Quote{}, err
	}
	normalized.Estado = status

	decision, err := normalizeClientDecision(normalized.EstadoCliente)
	if err != nil {
		return Quote{}, err
	}
	normalized.EstadoCliente = decision

	normalized.Moneda = normalizeCurrency(normalized.Moneda)
	normalized.DescuentoTipo = normalizeDiscountType(normalized.DescuentoTipo)
	normalized.Empresa = strings.TrimSpace(normalized.Empresa)
	normalized.Correo = strings.TrimSpace(normalized.Correo)
	normalized.Movil = strings.TrimSpace(normalized.Movil)
	normalized.Fecha = strings.TrimSpace(normalized.Fecha)
	normalized.ValidoHasta = strings.TrimSpace(normalized.ValidoHasta)
	normalized.Nota = strings.TrimSpace(normalized.Nota)
	normalized.Terminos = strings.TrimSpace(normalized.Terminos)
	normalized.FechaDecision = strings.TrimSpace(normalized.FechaDecision)
	normalized.FirmadoPor = strings.TrimSpace(normalized.FirmadoPor)
	normalized.FirmanteCorreo = strings.TrimSpace(normalized.FirmanteCorreo)
	normalized.LugarFirma = strings.TrimSpace(normalized.LugarFirma)
	normalized.FirmaBase64 = strings.TrimSpace(normalized.FirmaBase64)
	normalized.Descripcion = strings.TrimSpace(normalized.Descripcion)
	normalized.TaxMode = normalizeTaxMode(normalized.TaxMode)
	normalized.Zone = strings.TrimSpace(normalized.Zone)
	normalized.PurchaseOrderNumber = strings.TrimSpace(normalized.PurchaseOrderNumber)
	normalized.PurchaseOrderFileName = strings.TrimSpace(normalized.PurchaseOrderFileName)
	normalized.PurchaseOrderFileDataURL = strings.TrimSpace(normalized.PurchaseOrderFileDataURL)
	normalized.PurchaseOrderDate = strings.TrimSpace(normalized.PurchaseOrderDate)
	normalized.PurchaseOrderUploadedAt = strings.TrimSpace(normalized.PurchaseOrderUploadedAt)
	normalized.SelectedEquipmentIDs = normalizeStringSlice(normalized.SelectedEquipmentIDs)
	if normalized.Lineas == nil {
		normalized.Lineas = []Line{}
	}

	if len(normalized.PurchaseOrderNumber) > 120 {
		return Quote{}, errPurchaseOrderNumberTooLong
	}
	if len(normalized.PurchaseOrderFileName) > 255 {
		return Quote{}, errPurchaseOrderFileNameTooLong
	}
	if len(normalized.PurchaseOrderFileDataURL) > 10_000_000 {
		return Quote{}, errPurchaseOrderFileTooLarge
	}
	if normalized.PurchaseOrderDate != "" {
		if _, err := time.Parse("2006-01-02", normalized.PurchaseOrderDate); err != nil {
			return Quote{}, errPurchaseOrderDateInvalid
		}
	}

	if normalized.PurchaseOrderNumber == "" {
		if normalized.PurchaseOrderDate != "" || normalized.PurchaseOrderFileName != "" || normalized.PurchaseOrderFileDataURL != "" {
			return Quote{}, errPurchaseOrderNumberRequired
		}
		normalized.PurchaseOrderUploadedAt = ""
	} else {
		if normalized.PurchaseOrderDate == "" {
			return Quote{}, errPurchaseOrderDateRequired
		}
		if normalized.PurchaseOrderFileName == "" && normalized.PurchaseOrderFileDataURL == "" {
			return Quote{}, errPurchaseOrderFileRequired
		}

		normalized.Estado = "Aprobado"
		if normalized.PurchaseOrderUploadedAt == "" {
			normalized.PurchaseOrderUploadedAt = time.Now().UTC().Format(time.RFC3339)
		}
	}

	if normalized.PurchaseOrderUploadedAt != "" {
		if _, err := time.Parse(time.RFC3339, normalized.PurchaseOrderUploadedAt); err != nil {
			return Quote{}, errPurchaseOrderUploadedAtInvalid
		}
	}

	for i := range normalized.Lineas {
		normalized.Lineas[i] = normalizeQuoteLine(normalized.Lineas[i])
	}

	normalized.DescuentoValor = clampNonNegative(normalized.DescuentoValor)
	normalized.Subtotal = clampNonNegative(normalized.Subtotal)
	normalized.TaxTotal = clampNonNegative(normalized.TaxTotal)
	normalized.Total = clampNonNegative(normalized.Total)

	normalized.CreatedAt = defaultRFC3339(normalized.CreatedAt)
	normalized.UpdatedAt = defaultRFC3339(normalized.UpdatedAt)

	return normalized, nil
}

func normalizeQuoteLine(line Line) Line {
	normalized := line
	normalized.Servicio = strings.TrimSpace(normalized.Servicio)
	normalized.Descripcion = strings.TrimSpace(normalized.Descripcion)
	normalized.Unidad = strings.TrimSpace(normalized.Unidad)
	normalized.Cantidad = clampNonNegative(normalized.Cantidad)
	normalized.PrecioUnitario = clampNonNegative(normalized.PrecioUnitario)
	normalized.Impuesto = clampNonNegative(normalized.Impuesto)
	return normalized
}

func clampNonNegative(value float64) float64 {
	if value < 0 {
		return 0
	}
	return value
}

func defaultRFC3339(value string) string {
	if value == "" {
		return time.Now().UTC().Format(time.RFC3339)
	}
	return value
}

func normalizeQuoteStatus(value string) (string, error) {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "borrador", "draft":
		return "Borrador", nil
	case "enviado", "sent":
		return "Enviado", nil
	case "aprobado", "approved":
		return "Aprobado", nil
	default:
		return "", errQuoteStatusInvalid
	}
}

func normalizeClientDecision(value string) (string, error) {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "", "pendiente", "pending":
		return "Pendiente", nil
	case "aceptada", "accepted":
		return "Aceptada", nil
	case "rechazada", "rejected":
		return "Rechazada", nil
	default:
		return "", errDecisionInvalid
	}
}

func normalizeCurrency(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "USD") {
		return "USD"
	}
	return "COP"
}

func normalizeDiscountType(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "COP") {
		return "COP"
	}
	return "%"
}

func normalizeTaxMode(value string) string {
	normalized := strings.TrimSpace(strings.ToLower(value))
	if normalized == "before-discount" {
		return "before-discount"
	}
	return "after-discount"
}

func normalizeStringSlice(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	result := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func randomHex(length int) string {
	if length <= 0 {
		return ""
	}

	byteCount := (length + 1) / 2
	bytes := make([]byte, byteCount)
	if _, err := rand.Read(bytes); err != nil {
		return uuid.NewString()
	}

	hexValue := hex.EncodeToString(bytes)
	if len(hexValue) > length {
		return hexValue[:length]
	}
	return hexValue
}
