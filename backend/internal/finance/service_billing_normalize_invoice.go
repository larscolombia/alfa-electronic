package finance

import (
	"strings"
	"time"
)

func normalizeInvoice(input Invoice) (Invoice, error) {
	n := input
	n.ClientID = strings.TrimSpace(n.ClientID)
	n.ClientName = strings.TrimSpace(n.ClientName)
	n.ProjectID = strings.TrimSpace(n.ProjectID)
	n.ProjectName = strings.TrimSpace(n.ProjectName)
	n.ReferenceCode = strings.TrimSpace(n.ReferenceCode)
	n.SeriesPrefix = strings.TrimSpace(n.SeriesPrefix)
	n.BillingAddress = strings.TrimSpace(n.BillingAddress)
	n.ShippingAddr = strings.TrimSpace(n.ShippingAddr)
	rawTaxCalculation := strings.TrimSpace(n.TaxCalc)
	n.TaxCalc = normalizeInvoiceTaxCalculation(rawTaxCalculation)
	n.GeneratedBy = strings.TrimSpace(n.GeneratedBy)
	rawDiscountMode := strings.TrimSpace(n.DiscountMode)
	n.DiscountMode = normalizeInvoiceDiscountMode(rawDiscountMode)
	n.Note = strings.TrimSpace(n.Note)
	n.Terms = strings.TrimSpace(n.Terms)
	n.AttachmentName = strings.TrimSpace(n.AttachmentName)
	rawSource := strings.TrimSpace(n.Source)
	n.Source = normalizeInvoiceSource(rawSource)
	rawCurrency := strings.TrimSpace(n.CurrencyCode)
	n.CurrencyCode = normalizeCurrencyCode(rawCurrency)
	n.IssueDate = strings.TrimSpace(n.IssueDate)
	n.DueDate = strings.TrimSpace(n.DueDate)
	n.Status = InvoiceStatus(normalizeInvoiceStatus(string(n.Status)))

	if n.ClientID == "" || n.ClientName == "" {
		return Invoice{}, errInvoiceClientRequired
	}
	if n.SequenceNumber <= 0 {
		return Invoice{}, errInvoiceSequenceInvalid
	}
	issueDate, hasIssueDate, err := parseInvoiceDate(n.IssueDate)
	if err != nil {
		return Invoice{}, errInvoiceDateInvalid
	}
	dueDate, hasDueDate, err := parseInvoiceDate(n.DueDate)
	if err != nil {
		return Invoice{}, errInvoiceDateInvalid
	}
	if hasIssueDate && hasDueDate && dueDate.Before(issueDate) {
		return Invoice{}, errInvoiceDueDateInvalid
	}
	if n.Status == "" {
		return Invoice{}, errInvoiceStatusInvalid
	}
	if n.CurrencyCode == "" {
		if rawCurrency != "" {
			return Invoice{}, errInvoiceCurrencyInvalid
		}
		n.CurrencyCode = "COP"
	}
	if n.ExchangeRate <= 0 {
		return Invoice{}, errInvoiceExchangeInvalid
	}
	if n.TaxCalc == "" {
		if rawTaxCalculation != "" {
			return Invoice{}, errInvoiceTaxCalcInvalid
		}
		n.TaxCalc = "Despues del descuento"
	}
	if n.DiscountMode == "" {
		if rawDiscountMode != "" {
			return Invoice{}, errInvoiceDiscountModeInvalid
		}
		n.DiscountMode = "percent"
	}
	if n.DiscountValue < 0 || (n.DiscountMode == "percent" && n.DiscountValue > 100) {
		return Invoice{}, errInvoiceDiscountInvalid
	}
	if n.PaidAmount < 0 || n.BalanceAmount < 0 {
		return Invoice{}, errInvoicePaymentInvalid
	}
	if n.Source == "" {
		if rawSource != "" {
			return Invoice{}, errInvoiceSourceInvalid
		}
		n.Source = "manual"
	}

	items := make([]InvoiceItem, 0, len(n.Items))
	for _, item := range n.Items {
		item.Name = strings.TrimSpace(item.Name)
		item.Description = strings.TrimSpace(item.Description)
		item.UnitLabel = strings.TrimSpace(item.UnitLabel)
		item.AttachmentName = strings.TrimSpace(item.AttachmentName)
		if item.Name == "" && item.Quantity <= 0 && item.UnitPrice <= 0 {
			continue
		}
		if item.Name == "" {
			return Invoice{}, errInvoiceItemsRequired
		}
		if item.Quantity <= 0 || item.UnitPrice <= 0 || item.TaxRate < 0 {
			return Invoice{}, errInvoiceItemAmountInvalid
		}
		if item.UnitLabel == "" {
			item.UnitLabel = "Unidad"
		}
		items = append(items, item)
	}
	if len(items) == 0 {
		return Invoice{}, errInvoiceItemsRequired
	}
	n.Items = items

	if n.ExchangeRate <= 0 {
		n.ExchangeRate = 1
	}
	n.Subtotal, n.TaxTotal, n.Total = calculateInvoiceSummary(n.Items, n.DiscountValue, n.DiscountMode, n.TaxCalc)
	if n.PaidAmount > n.Total {
		n.PaidAmount = n.Total
	}
	n.BalanceAmount = maxFloat(n.Total-n.PaidAmount, 0)
	if n.GeneratedBy == "" {
		n.GeneratedBy = "Equipo comercial"
	}

	return n, nil
}

func parseInvoiceDate(value string) (time.Time, bool, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, false, nil
	}

	parsed, err := time.Parse("2006-01-02", trimmed)
	if err != nil {
		return time.Time{}, false, err
	}

	return parsed, true, nil
}

func normalizeInvoiceTaxCalculation(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "despues del descuento", "después del descuento":
		return "Despues del descuento"
	case "antes del descuento":
		return "Antes del descuento"
	case "sin impuesto":
		return "Sin impuesto"
	default:
		return ""
	}
}

func normalizeInvoiceDiscountMode(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "percent", "porcentaje", "%":
		return "percent"
	case "amount", "valor", "cop":
		return "amount"
	default:
		return ""
	}
}

func normalizeInvoiceSource(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "manual":
		return "manual"
	case "timesheet":
		return "timesheet"
	default:
		return ""
	}
}

func calculateInvoiceSummary(items []InvoiceItem, discountValue float64, discountMode string, taxCalculation string) (float64, float64, float64) {
	subtotal := 0.0
	for _, item := range items {
		subtotal += maxFloat(item.Quantity, 0) * maxFloat(item.UnitPrice, 0)
	}

	discountAmount := discountValue
	if discountMode == "percent" {
		discountAmount = subtotal * (discountValue / 100)
	}
	discountAmount = minFloat(maxFloat(discountAmount, 0), subtotal)

	if subtotal <= 0 || taxCalculation == "Sin impuesto" {
		return subtotal, 0, maxFloat(subtotal-discountAmount, 0)
	}

	taxTotal := 0.0
	for _, item := range items {
		lineSubtotal := maxFloat(item.Quantity, 0) * maxFloat(item.UnitPrice, 0)
		proratedDiscount := 0.0
		if subtotal > 0 {
			proratedDiscount = discountAmount * (lineSubtotal / subtotal)
		}

		baseAmount := lineSubtotal
		if taxCalculation == "Despues del descuento" {
			baseAmount = maxFloat(lineSubtotal-proratedDiscount, 0)
		}
		taxTotal += baseAmount * (maxFloat(item.TaxRate, 0) / 100)
	}

	return subtotal, taxTotal, maxFloat(subtotal-discountAmount, 0) + taxTotal
}

func normalizeInvoiceStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "borrador":
		return string(InvoiceStatusDraft)
	case "pendiente":
		return string(InvoiceStatusPending)
	case "pago parcial":
		return string(InvoiceStatusPartial)
	case "pagado":
		return string(InvoiceStatusPaid)
	case "cancelado":
		return string(InvoiceStatusCancelled)
	case "enviado":
		return string(InvoiceStatusSent)
	default:
		return ""
	}
}
