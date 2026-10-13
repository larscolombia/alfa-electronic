package finance

import (
	"database/sql"
	"errors"
	"time"
)

const (
	maxAccountsListLimit = 500
	maxPaymentsListLimit = 500
	maxInvoicesListLimit = 500
)

var (
	errAccountIDRequired          = errors.New("el id de la cuenta es obligatorio")
	errAccountNotFound            = errors.New("cuenta no encontrada")
	errAccountTypeInvalid         = errors.New("tipo de cuenta invalido")
	errAccountBankNameRequired    = errors.New("el nombre del banco es obligatorio para cuentas tipo Banco")
	errAccountHolderNameRequired  = errors.New("el titular de la cuenta es obligatorio")
	errAccountNumberRequired      = errors.New("el numero de cuenta es obligatorio")
	errAccountProductTypeInvalid  = errors.New("producto de cuenta invalido")
	errAccountCurrencyInvalid     = errors.New("moneda invalida")
	errAccountBalanceInvalid      = errors.New("el saldo inicial no puede ser negativo")
	errAccountStatusInvalid       = errors.New("estado de cuenta invalido")
	errListLimitInvalid           = errors.New("el limite debe ser mayor que cero")
	errPaymentIDRequired          = errors.New("el id del pago es obligatorio")
	errPaymentNotFound            = errors.New("pago no encontrado")
	errPaymentInvoiceRequired     = errors.New("la factura asociada al pago es obligatoria")
	errPaymentDateInvalid         = errors.New("la fecha del pago es invalida")
	errPaymentAmountInvalid       = errors.New("el valor del pago debe ser mayor que cero")
	errPaymentStatusInvalid       = errors.New("estado de pago invalido")
	errPaymentCurrencyInvalid     = errors.New("moneda del pago invalida")
	errPaymentExchangeInvalid     = errors.New("la tasa de cambio del pago debe ser mayor que cero")
	errInvoiceIDRequired          = errors.New("el id de la factura es obligatorio")
	errInvoiceNotFound            = errors.New("factura no encontrada")
	errInvoiceClientRequired      = errors.New("el cliente de la factura es obligatorio")
	errInvoiceSequenceInvalid     = errors.New("el numero de la factura debe ser mayor que cero")
	errInvoiceDateInvalid         = errors.New("las fechas de la factura son invalidas")
	errInvoiceDueDateInvalid      = errors.New("la fecha de vencimiento no puede ser anterior a la fecha de la factura")
	errInvoiceCurrencyInvalid     = errors.New("moneda de factura invalida")
	errInvoiceExchangeInvalid     = errors.New("la tasa de cambio debe ser mayor que cero")
	errInvoiceDiscountInvalid     = errors.New("el descuento de la factura es invalido")
	errInvoiceDiscountModeInvalid = errors.New("modo de descuento de factura invalido")
	errInvoiceTaxCalcInvalid      = errors.New("calculo de impuesto de factura invalido")
	errInvoicePaymentInvalid      = errors.New("el valor pagado de la factura es invalido")
	errInvoiceSourceInvalid       = errors.New("origen de factura invalido")
	errInvoiceStatusInvalid       = errors.New("estado de la factura invalido")
	errInvoiceItemsRequired       = errors.New("la factura debe tener al menos un item")
	errInvoiceItemAmountInvalid   = errors.New("los items de la factura deben tener cantidad y precio mayores que cero")
	errRecurringIDRequired        = errors.New("el id de la factura recurrente es obligatorio")
	errRecurringNotFound          = errors.New("factura recurrente no encontrada")
	errRecurringClientRequired    = errors.New("el cliente de la factura recurrente es obligatorio")
	errRecurringStatusInvalid     = errors.New("estado de la factura recurrente invalido")
	errRecurringCurrencyInvalid   = errors.New("moneda de factura recurrente invalida")
	errRecurringTaxCalcInvalid    = errors.New("calculo de impuesto de factura recurrente invalido")
	errRecurringDiscountInvalid   = errors.New("el descuento de la factura recurrente es invalido")
	errRecurringDiscountMode      = errors.New("modo de descuento de factura recurrente invalido")
	errRecurringFrequencyInvalid  = errors.New("frecuencia de la factura recurrente invalida")
	errRecurringDateInvalid       = errors.New("las fechas de la factura recurrente son invalidas")
	errRecurringNextDateInvalid   = errors.New("la proxima fecha de factura no puede ser anterior al inicio")
	errRecurringCyclesInvalid     = errors.New("los ciclos deben ser -1 o un numero entero positivo")
	errRecurringItemsRequired     = errors.New("la factura recurrente debe tener al menos un item")
	errRecurringItemAmountInvalid = errors.New("los items de la factura recurrente deben tener cantidad y precio mayores que cero")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

func (s *Service) GetOasisExport(companyID string) []OasisExportRecord {
	rows, err := s.db.Query(`SELECT reference_code, project_name, issue_date, subtotal, tax_total, total, billing_address, note FROM invoices WHERE company_id = $1 AND status != 'Cancelado' ORDER BY issue_date DESC`, companyID)
	if err != nil {
		return []OasisExportRecord{}
	}
	defer rows.Close()

	var records []OasisExportRecord
	for rows.Next() {
		var r OasisExportRecord
		rows.Scan(&r.InvoiceNumber, &r.Concept, &r.Date, &r.Subtotal, &r.IVA, &r.Total, &r.PostalCode, &r.NIT)
		records = append(records, r)
	}
	return records
}

type PortfolioItem struct {
	InvoiceID  int64   `json:"invoiceId"`
	Reference  string  `json:"referenceCode"`
	ClientName string  `json:"clientName"`
	Total      float64 `json:"total"`
	Balance    float64 `json:"balanceAmount"`
	DueDate    string  `json:"dueDate"`
	Status     string  `json:"status"`
	Overdue    bool    `json:"overdue"`
}

func (s *Service) GetPortfolio(companyID string, status string) []PortfolioItem {
	query := `SELECT id, reference_code, client_name, total, balance_amount, due_date, status FROM invoices WHERE company_id = $1 AND status IN ('Pendiente', 'Pago parcial')`
	args := []any{companyID}

	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY due_date ASC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return []PortfolioItem{}
	}
	defer rows.Close()

	var items []PortfolioItem
	for rows.Next() {
		var item PortfolioItem
		rows.Scan(&item.InvoiceID, &item.Reference, &item.ClientName, &item.Total, &item.Balance, &item.DueDate, &item.Status)
		if item.DueDate != "" {
			item.Overdue = item.DueDate < time.Now().UTC().Format("2006-01-02")
		}
		items = append(items, item)
	}
	return items
}
