package finance

import (
	"errors"
	"strings"
)

func normalizeRecurring(input RecurringInvoice) (RecurringInvoice, error) {
	n := input
	n.ClientID = strings.TrimSpace(n.ClientID)
	n.ClientName = strings.TrimSpace(n.ClientName)
	n.ProjectID = strings.TrimSpace(n.ProjectID)
	n.ProjectName = strings.TrimSpace(n.ProjectName)
	rawCurrency := strings.TrimSpace(n.CurrencyCode)
	n.CurrencyCode = normalizeCurrencyCode(rawCurrency)
	rawTaxCalc := strings.TrimSpace(n.TaxCalc)
	n.TaxCalc = normalizeInvoiceTaxCalculation(rawTaxCalc)
	n.BankAccountName = strings.TrimSpace(n.BankAccountName)
	rawFrequency := strings.TrimSpace(n.Frequency)
	n.Frequency = normalizeRecurringFrequency(rawFrequency)
	n.StartDate = strings.TrimSpace(n.StartDate)
	n.NextIssueDate = strings.TrimSpace(n.NextIssueDate)
	n.GeneratedBy = strings.TrimSpace(n.GeneratedBy)
	rawDiscountMode := strings.TrimSpace(n.DiscountMode)
	n.DiscountMode = normalizeInvoiceDiscountMode(rawDiscountMode)
	n.Note = strings.TrimSpace(n.Note)
	n.Terms = strings.TrimSpace(n.Terms)
	n.Status = RecurringStatus(normalizeRecurringStatus(string(n.Status)))

	if n.ClientID == "" || n.ClientName == "" {
		return RecurringInvoice{}, errRecurringClientRequired
	}
	if n.Status == "" {
		return RecurringInvoice{}, errRecurringStatusInvalid
	}
	if n.CurrencyCode == "" {
		if rawCurrency != "" {
			return RecurringInvoice{}, errRecurringCurrencyInvalid
		}
		n.CurrencyCode = "COP"
	}
	if n.TaxCalc == "" {
		if rawTaxCalc != "" {
			return RecurringInvoice{}, errRecurringTaxCalcInvalid
		}
		n.TaxCalc = "Despues del descuento"
	}
	if n.DiscountMode == "" {
		if rawDiscountMode != "" {
			return RecurringInvoice{}, errRecurringDiscountMode
		}
		n.DiscountMode = "percent"
	}
	if n.DiscountValue < 0 || (n.DiscountMode == "percent" && n.DiscountValue > 100) {
		return RecurringInvoice{}, errRecurringDiscountInvalid
	}
	if n.Frequency == "" {
		return RecurringInvoice{}, errRecurringFrequencyInvalid
	}
	if len(n.Note) > 5000 {
		return RecurringInvoice{}, errors.New("la nota de la factura recurrente no puede superar 5000 caracteres")
	}
	if len(n.Terms) > 5000 {
		return RecurringInvoice{}, errors.New("los terminos de la factura recurrente no pueden superar 5000 caracteres")
	}
	if len(n.GeneratedBy) > 140 {
		return RecurringInvoice{}, errors.New("el campo generado por no puede superar 140 caracteres")
	}

	startDate, hasStartDate, err := parseInvoiceDate(n.StartDate)
	if err != nil {
		return RecurringInvoice{}, errRecurringDateInvalid
	}
	nextIssueDate, hasNextIssueDate, err := parseInvoiceDate(n.NextIssueDate)
	if err != nil {
		return RecurringInvoice{}, errRecurringDateInvalid
	}
	if hasStartDate && hasNextIssueDate && nextIssueDate.Before(startDate) {
		return RecurringInvoice{}, errRecurringNextDateInvalid
	}
	if n.Cycles != -1 && n.Cycles <= 0 {
		return RecurringInvoice{}, errRecurringCyclesInvalid
	}

	items := make([]InvoiceItem, 0, len(n.Items))
	for _, item := range n.Items {
		item.Name = strings.TrimSpace(item.Name)
		item.Description = strings.TrimSpace(item.Description)
		item.UnitLabel = strings.TrimSpace(item.UnitLabel)
		if item.Name == "" && item.Quantity <= 0 && item.UnitPrice <= 0 {
			continue
		}
		if item.Name == "" {
			return RecurringInvoice{}, errRecurringItemsRequired
		}
		if item.Quantity <= 0 || item.UnitPrice <= 0 || item.TaxRate < 0 || item.TaxRate > 100 {
			return RecurringInvoice{}, errRecurringItemAmountInvalid
		}
		if item.UnitLabel == "" {
			item.UnitLabel = "Unidad"
		}
		items = append(items, item)
	}
	if len(items) == 0 {
		return RecurringInvoice{}, errRecurringItemsRequired
	}
	n.Items = items

	if n.CurrencyCode == "" {
		n.CurrencyCode = "COP"
	}
	if n.GeneratedBy == "" {
		n.GeneratedBy = "Equipo comercial"
	}
	n.DiscountValue = clampNonNegativeFloat(n.DiscountValue)
	n.Subtotal, n.TaxTotal, n.Total = calculateInvoiceSummary(n.Items, n.DiscountValue, n.DiscountMode, n.TaxCalc)

	return n, nil
}

func normalizeRecurringFrequency(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "diario":
		return "Diario"
	case "semanal":
		return "Semanal"
	case "quincenal":
		return "Quincenal"
	case "mensual":
		return "Mensual"
	case "bimestral":
		return "Bimestral"
	case "trimestral":
		return "Trimestral"
	case "semestral":
		return "Semestral"
	case "anual":
		return "Anual"
	default:
		return ""
	}
}

func normalizeRecurringStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "activa":
		return string(RecurringStatusActive)
	case "pausada":
		return string(RecurringStatusPaused)
	case "finalizada":
		return string(RecurringStatusFinished)
	default:
		return ""
	}
}

func clampNonNegativeFloat(value float64) float64 {
	if value < 0 {
		return 0
	}
	return value
}

func maxFloat(left float64, right float64) float64 {
	if left > right {
		return left
	}
	return right
}

func minFloat(left float64, right float64) float64 {
	if left < right {
		return left
	}
	return right
}
