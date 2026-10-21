package finance

import (
	"database/sql"
	"encoding/json"
	"time"
)

func scanInvoice(scanner interface{ Scan(dest ...any) error }) (Invoice, error) {
	var item Invoice
	var itemsRaw []byte
	var issueDate sql.NullTime
	var dueDate sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time

	if err := scanner.Scan(
		&item.ID,
		&item.ReferenceCode,
		&item.SeriesPrefix,
		&item.SequenceNumber,
		&item.ProjectID,
		&item.ProjectName,
		&item.ClientID,
		&item.ClientName,
		&item.BillingAddress,
		&item.ShippingAddr,
		&issueDate,
		&dueDate,
		&item.CurrencyCode,
		&item.ExchangeRate,
		&item.BankAccountID,
		&item.BankAccount,
		&item.TaxCalc,
		&item.GeneratedBy,
		&itemsRaw,
		&item.DiscountValue,
		&item.DiscountMode,
		&item.Subtotal,
		&item.TaxTotal,
		&item.Total,
		&item.PaidAmount,
		&item.BalanceAmount,
		&item.Status,
		&item.Note,
		&item.Terms,
		&item.AttachmentName,
		&item.ReceivedPay,
		&item.Source,
		&item.ExternalNumber,
		&item.DocumentType,
		&item.CreditNoteRef,
		&item.Locked,
		&item.SourceQuoteID,
		&createdAt,
		&updatedAt,
	); err != nil {
		return Invoice{}, err
	}

	if issueDate.Valid {
		item.IssueDate = issueDate.Time.Format("2006-01-02")
	}
	if dueDate.Valid {
		item.DueDate = dueDate.Time.Format("2006-01-02")
	}
	if len(itemsRaw) > 0 {
		if err := json.Unmarshal(itemsRaw, &item.Items); err != nil {
			return Invoice{}, err
		}
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}

func scanRecurringInvoice(scanner interface{ Scan(dest ...any) error }) (RecurringInvoice, error) {
	var item RecurringInvoice
	var itemsRaw []byte
	var startDate sql.NullTime
	var nextIssueDate sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time

	if err := scanner.Scan(
		&item.ID,
		&item.ClientID,
		&item.ClientName,
		&item.ProjectID,
		&item.ProjectName,
		&item.CurrencyCode,
		&item.TaxCalc,
		&item.BankAccountID,
		&item.BankAccountName,
		&item.Frequency,
		&startDate,
		&nextIssueDate,
		&item.Cycles,
		&item.AllowClientStop,
		&item.ShowShipAddr,
		&item.GeneratedBy,
		&itemsRaw,
		&item.DiscountValue,
		&item.DiscountMode,
		&item.Subtotal,
		&item.TaxTotal,
		&item.Total,
		&item.Status,
		&item.Note,
		&item.Terms,
		&createdAt,
		&updatedAt,
	); err != nil {
		return RecurringInvoice{}, err
	}

	if startDate.Valid {
		item.StartDate = startDate.Time.Format("2006-01-02")
	}
	if nextIssueDate.Valid {
		item.NextIssueDate = nextIssueDate.Time.Format("2006-01-02")
	}
	if len(itemsRaw) > 0 {
		if err := json.Unmarshal(itemsRaw, &item.Items); err != nil {
			return RecurringInvoice{}, err
		}
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
	return item, nil
}
