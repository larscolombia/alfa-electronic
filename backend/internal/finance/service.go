package finance

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
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
	errPaymentRetentionInvalid   = errors.New("las retenciones del pago son invalidas")
	errOasisDateInvalid          = errors.New("el rango de fechas del export es invalido (use YYYY-MM-DD)")
	errExpenseIDRequired         = errors.New("el id del gasto es obligatorio")
	errExpenseNotFound           = errors.New("gasto no encontrado")
	errExpenseItemRequired       = errors.New("el nombre del item del gasto es obligatorio")
	errExpenseCategoryRequired   = errors.New("la categoria del gasto es obligatoria")
	errExpenseConceptRequired    = errors.New("el concepto del gasto es obligatorio")
	errExpenseDateInvalid        = errors.New("la fecha del gasto es invalida")
	errExpenseAmountInvalid      = errors.New("el valor del gasto debe ser mayor que cero")
	errExpenseCurrencyInvalid    = errors.New("moneda del gasto invalida")
	errExpenseExchangeInvalid    = errors.New("la tasa de cambio del gasto debe ser mayor que cero")
	errCashCountEntryInvalid     = errors.New("las denominaciones del arqueo son invalidas")
	errWarrantyIDRequired        = errors.New("el id de la garantia es obligatorio")
	errWarrantyNotFound          = errors.New("garantia no encontrada")
	errWarrantyClientRequired    = errors.New("el cliente de la garantia es obligatorio")
	errWarrantyEquipmentRequired = errors.New("el equipo o servicio de la garantia es obligatorio")
	errWarrantyDateInvalid       = errors.New("las fechas de la garantia son invalidas")
	errWarrantyStatusInvalid     = errors.New("estado de garantia invalido")
	errWarrantyPhaseInvalid      = errors.New("fase de garantia invalida")
	errWarrantyDaysInvalid       = errors.New("la ventana de dias debe estar entre 1 y 365")
	errSettingKeyRequired        = errors.New("la clave de configuracion es obligatoria")
	errSettingNotFound           = errors.New("configuracion no encontrada")
	errSettingValueRequired      = errors.New("el valor de la configuracion es obligatorio")
)

type Service struct {
	db *sql.DB
}

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// GetOasisExport construye las líneas del archivo plano 961 (una por ítem de
// factura) a partir de finance_invoices, con el NIT del comprador tomado de
// crm_clients (antes se leía de `note`, que nunca fue un NIT) y filtro opcional
// por rango de fechas de emisión.
func (s *Service) GetOasisExport(companyID string, query OasisExportQuery) ([]OasisExportRecord, error) {
	from := strings.TrimSpace(query.From)
	to := strings.TrimSpace(query.To)
	for _, value := range []string{from, to} {
		if value == "" {
			continue
		}
		if _, err := time.Parse("2006-01-02", value); err != nil {
			return nil, errOasisDateInvalid
		}
	}
	if from != "" && to != "" && from > to {
		return nil, errOasisDateInvalid
	}

	statement := `
SELECT ci.series_prefix, ci.sequence_number, ci.issue_date, ci.due_date,
	ci.client_name, ci.billing_address, ci.total, ci.items_json,
	COALESCE(cc.nit, ''), COALESCE(cc.correo, ''), COALESCE(cc.office_phone, ''),
	COALESCE(cc.address, ''), COALESCE(cc.credit_enabled, false)
FROM finance_invoices ci
LEFT JOIN crm_clients cc
	ON cc.company_id = ci.company_id
	AND ci.client_id = 'crm-client-' || cc.id
WHERE ci.company_id = $1
	AND ci.soft_delete = false
	AND ci.status != 'Cancelado'`
	args := []any{companyID}
	nextArg := 2
	if from != "" {
		statement += fmt.Sprintf(" AND ci.issue_date >= $%d::date", nextArg)
		args = append(args, from)
		nextArg++
	}
	if to != "" {
		statement += fmt.Sprintf(" AND ci.issue_date <= $%d::date", nextArg)
		args = append(args, to)
		nextArg++
	}
	statement += " ORDER BY ci.issue_date DESC, ci.id DESC"

	rows, err := s.db.Query(statement, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	generationDate := time.Now().UTC().Format("2006-01-02")
	records := make([]OasisExportRecord, 0)
	for rows.Next() {
		var seriesPrefix, clientName, billingAddress, buyerNIT, buyerEmail, buyerPhone, buyerAddress string
		var sequenceNumber int
		var issueDate, dueDate sql.NullTime
		var invoiceTotal float64
		var itemsJSON []byte
		var creditEnabled bool
		if err := rows.Scan(&seriesPrefix, &sequenceNumber, &issueDate, &dueDate,
			&clientName, &billingAddress, &invoiceTotal, &itemsJSON,
			&buyerNIT, &buyerEmail, &buyerPhone, &buyerAddress, &creditEnabled); err != nil {
			return nil, err
		}

		var items []InvoiceItem
		if len(itemsJSON) > 0 {
			_ = json.Unmarshal(itemsJSON, &items)
		}

		nit, dv := splitNIT(buyerNIT)
		issueDateText := ""
		if issueDate.Valid {
			issueDateText = issueDate.Time.Format("2006-01-02")
		}
		dueDateText := ""
		if dueDate.Valid {
			dueDateText = dueDate.Time.Format("2006-01-02")
		}
		creditFlag := "1"
		creditMarker := "0"
		if creditEnabled {
			creditFlag = "0"
			creditMarker = "99"
		}
		address := strings.TrimSpace(billingAddress)
		if address == "" {
			address = buyerAddress
		}

		if len(items) == 0 {
			records = append(records, OasisExportRecord{
				BuyerIDType: "NIT", BuyerNIT: nit, BuyerDV: dv, BuyerName: clientName,
				BuyerPhone: buyerPhone, BuyerAddress: address, BuyerBillingEmail: buyerEmail,
				SellerIDType: "NIT",
				InvoiceNumber: fmt.Sprintf("%s%03d", seriesPrefix, sequenceNumber),
				Constant: "2", IssueDate: issueDateText, IssueTime: "00", DueDate: dueDateText,
				CreditFlag: creditFlag, GenerationDate: generationDate,
				LineValue: invoiceTotal, ItemNumber: 1,
				CreditMarker: creditMarker, InvoiceTotal: invoiceTotal,
			})
			continue
		}

		for index, item := range items {
			lineValue := item.Quantity * item.UnitPrice
			ivaValue := lineValue * (item.TaxRate / 100)
			description := strings.TrimSpace(item.Description)
			if description == "" {
				description = item.Name
			}
			records = append(records, OasisExportRecord{
				BuyerIDType: "NIT", BuyerNIT: nit, BuyerDV: dv, BuyerName: clientName,
				BuyerPhone: buyerPhone, BuyerAddress: address, BuyerBillingEmail: buyerEmail,
				SellerIDType: "NIT",
				InvoiceNumber: fmt.Sprintf("%s%03d", seriesPrefix, sequenceNumber),
				Constant: "2", IssueDate: issueDateText, IssueTime: "00", DueDate: dueDateText,
				CreditFlag: creditFlag, GenerationDate: generationDate,
				LineValue: lineValue, ItemNumber: index + 1, EquipmentCode: "",
				Description: description, IVAPercent: item.TaxRate, IVAValue: ivaValue,
				LineTotal: lineValue + ivaValue,
				CreditMarker: creditMarker, InvoiceTotal: invoiceTotal,
			})
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return records, nil
}

// splitNIT separa el NIT del dígito de verificación ("86511911-8" → NIT y DV
// en columnas distintas, como exige el formato 961).
func splitNIT(raw string) (string, string) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return "", ""
	}
	if index := strings.LastIndex(value, "-"); index >= 0 {
		return strings.TrimSpace(value[:index]), strings.TrimSpace(value[index+1:])
	}
	return value, ""
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

func (s *Service) GetPortfolio(companyID string, status string) ([]PortfolioItem, error) {
	query := `SELECT id, reference_code, client_name, total, balance_amount, due_date, status FROM finance_invoices WHERE company_id = $1 AND soft_delete = false AND status IN ('Pendiente', 'Pago parcial')`
	args := []any{companyID}

	if status != "" {
		query += " AND status = $2"
		args = append(args, status)
	}
	query += " ORDER BY due_date ASC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]PortfolioItem, 0)
	for rows.Next() {
		var item PortfolioItem
		var dueDate sql.NullTime
		if err := rows.Scan(&item.InvoiceID, &item.Reference, &item.ClientName, &item.Total, &item.Balance, &dueDate, &item.Status); err != nil {
			return nil, err
		}
		if dueDate.Valid {
			item.DueDate = dueDate.Time.Format("2006-01-02")
			item.Overdue = item.DueDate < time.Now().UTC().Format("2006-01-02")
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return items, nil
}
