package finance

import "encoding/json"

type AccountType string

type AccountProductType string

type AccountStatus string

const (
	AccountTypeBank AccountType = "Banco"
	AccountTypeCash AccountType = "Efectivo"
)

const (
	AccountProductSavings   AccountProductType = "Ahorros"
	AccountProductChecking  AccountProductType = "Corriente"
	AccountProductPettyCash AccountProductType = "Caja menor"
)

const (
	AccountStatusActive   AccountStatus = "Activa"
	AccountStatusInactive AccountStatus = "Inactiva"
)

type Account struct {
	ID             int64              `json:"id"`
	AccountType    AccountType        `json:"accountType"`
	BankName       string             `json:"bankName"`
	HolderName     string             `json:"holderName"`
	AccountNumber  string             `json:"accountNumber"`
	ProductType    AccountProductType `json:"productType"`
	CurrencyCode   string             `json:"currencyCode"`
	ContactNumber  string             `json:"contactNumber"`
	InitialBalance float64            `json:"initialBalance"`
	Status         AccountStatus      `json:"status"`
	LogoFileName   string             `json:"logoFileName"`
	CreatedAt      string             `json:"createdAt"`
	UpdatedAt      string             `json:"updatedAt"`
}

type UpsertAccountRequest struct {
	AccountType    string  `json:"accountType"`
	BankName       string  `json:"bankName"`
	HolderName     string  `json:"holderName"`
	AccountNumber  string  `json:"accountNumber"`
	ProductType    string  `json:"productType"`
	CurrencyCode   string  `json:"currencyCode"`
	ContactNumber  string  `json:"contactNumber"`
	InitialBalance float64 `json:"initialBalance"`
	Status         string  `json:"status"`
	LogoFileName   string  `json:"logoFileName"`
}

type ListAccountsQuery struct {
	Limit int
}

type PaymentStatus string

const (
	PaymentStatusCompleted PaymentStatus = "Completado"
	PaymentStatusPartial   PaymentStatus = "Parcial"
	PaymentStatusPending   PaymentStatus = "Pendiente"
)

type Payment struct {
	ID                int64         `json:"id"`
	OrderNumber       int           `json:"orderNumber"`
	Code              string        `json:"code"`
	Project           string        `json:"project"`
	InvoiceNumber     string        `json:"invoiceNumber"`
	Client            string        `json:"client"`
	PurchaseOrder     string        `json:"purchaseOrder"`
	Amount            float64       `json:"amount"`
	PaidAt            string        `json:"paidAt"`
	PaymentGateway    string        `json:"paymentGateway"`
	Status            PaymentStatus `json:"status"`
	CurrencyCode      string        `json:"currencyCode"`
	ExchangeRate      float64       `json:"exchangeRate"`
	TransactionID     string        `json:"transactionId"`
	BankAccountID     *int64        `json:"bankAccountId"`
	BankAccount       string        `json:"bankAccountName"`
	ReceiptFile       string        `json:"receiptFileName"`
	Notes             string        `json:"notes"`
	PaymentDate       string        `json:"paymentDate"`
	ExternalInvoice   string        `json:"externalInvoiceNumber"`
	ReteFuente        float64       `json:"reteFuente"`
	ReteIVA           float64       `json:"reteIva"`
	ReteICA           float64       `json:"reteIca"`
	RetentionComments string        `json:"retentionComments"`
	PriorityBilling   bool          `json:"priorityBilling"`
	CreatedAt         string        `json:"createdAt"`
	UpdatedAt         string        `json:"updatedAt"`
}

type UpsertPaymentRequest struct {
	OrderNumber       int     `json:"orderNumber"`
	Code              string  `json:"code"`
	Project           string  `json:"project"`
	InvoiceNumber     string  `json:"invoiceNumber"`
	Client            string  `json:"client"`
	PurchaseOrder     string  `json:"purchaseOrder"`
	Amount            float64 `json:"amount"`
	PaidAt            string  `json:"paidAt"`
	PaymentGateway    string  `json:"paymentGateway"`
	Status            string  `json:"status"`
	CurrencyCode      string  `json:"currencyCode"`
	ExchangeRate      float64 `json:"exchangeRate"`
	TransactionID     string  `json:"transactionId"`
	BankAccountID     *int64  `json:"bankAccountId"`
	BankAccount       string  `json:"bankAccountName"`
	ReceiptFile       string  `json:"receiptFileName"`
	Notes             string  `json:"notes"`
	PaymentDate       string  `json:"paymentDate"`
	ExternalInvoice   string  `json:"externalInvoiceNumber"`
	ReteFuente        float64 `json:"reteFuente"`
	ReteIVA           float64 `json:"reteIva"`
	ReteICA           float64 `json:"reteIca"`
	RetentionComments string  `json:"retentionComments"`
	PriorityBilling   bool    `json:"priorityBilling"`
}

type ListPaymentsQuery struct {
	Status string
	Limit  int
}

type InvoiceStatus string

type RecurringStatus string

const (
	InvoiceStatusDraft     InvoiceStatus = "Borrador"
	InvoiceStatusPending   InvoiceStatus = "Pendiente"
	InvoiceStatusPartial   InvoiceStatus = "Pago parcial"
	InvoiceStatusPaid      InvoiceStatus = "Pagado"
	InvoiceStatusCancelled InvoiceStatus = "Cancelado"
	InvoiceStatusSent      InvoiceStatus = "Enviado"
)

const (
	RecurringStatusActive   RecurringStatus = "Activa"
	RecurringStatusPaused   RecurringStatus = "Pausada"
	RecurringStatusFinished RecurringStatus = "Finalizada"
)

type InvoiceItem struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	Quantity       float64 `json:"quantity"`
	UnitLabel      string  `json:"unitLabel"`
	UnitPrice      float64 `json:"unitPrice"`
	TaxRate        float64 `json:"taxRate"`
	AttachmentName string  `json:"attachmentName"`
}

type Invoice struct {
	ID             int64         `json:"id"`
	ReferenceCode  string        `json:"referenceCode"`
	SeriesPrefix   string        `json:"seriesPrefix"`
	SequenceNumber int           `json:"sequenceNumber"`
	ProjectID      string        `json:"projectId"`
	ProjectName    string        `json:"projectName"`
	ClientID       string        `json:"clientId"`
	ClientName     string        `json:"clientName"`
	BillingAddress string        `json:"billingAddress"`
	ShippingAddr   string        `json:"shippingAddress"`
	IssueDate      string        `json:"issueDate"`
	DueDate        string        `json:"dueDate"`
	CurrencyCode   string        `json:"currencyCode"`
	ExchangeRate   float64       `json:"exchangeRate"`
	BankAccountID  *int64        `json:"bankAccountId"`
	BankAccount    string        `json:"bankAccountName"`
	TaxCalc        string        `json:"taxCalculation"`
	GeneratedBy    string        `json:"generatedBy"`
	Items          []InvoiceItem `json:"items"`
	DiscountValue  float64       `json:"discountValue"`
	DiscountMode   string        `json:"discountMode"`
	Subtotal       float64       `json:"subtotal"`
	TaxTotal       float64       `json:"taxTotal"`
	Total          float64       `json:"total"`
	PaidAmount     float64       `json:"paidAmount"`
	BalanceAmount  float64       `json:"balanceAmount"`
	Status         InvoiceStatus `json:"status"`
	Note           string        `json:"note"`
	Terms          string        `json:"terms"`
	AttachmentName string        `json:"attachmentName"`
	ReceivedPay    bool          `json:"receivedPayment"`
	Source         string        `json:"source"`
	// Fase 5b: número de factura externa Oasis (editable mientras la factura
	// no esté bloqueada), tipo de documento ('factura' | 'nota_credito'),
	// referencia a la factura origen cuando es nota crédito, bloqueo de
	// factura emitida ("no hay reversa": solo nota crédito) y cotización
	// de origen cuando se generó por conversión.
	ExternalNumber string `json:"externalNumber"`
	DocumentType   string `json:"documentType"`
	CreditNoteRef  *int64 `json:"creditNoteRef"`
	Locked         bool   `json:"locked"`
	SourceQuoteID  string `json:"sourceQuoteId"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
}

// CreditNoteRequest es el cuerpo de POST /finance/invoices/credit-note:
// nota crédito que referencia una factura existente y descuenta su saldo
// pendiente al quedar aplicada.
type CreditNoteRequest struct {
	InvoiceID int64   `json:"invoiceId"`
	Amount    float64 `json:"amount"`
	Note      string  `json:"note"`
	IssueDate string  `json:"issueDate"`
}

type RecurringInvoice struct {
	ID              int64           `json:"id"`
	ClientID        string          `json:"clientId"`
	ClientName      string          `json:"clientName"`
	ProjectID       string          `json:"projectId"`
	ProjectName     string          `json:"projectName"`
	CurrencyCode    string          `json:"currencyCode"`
	TaxCalc         string          `json:"taxCalculation"`
	BankAccountID   *int64          `json:"bankAccountId"`
	BankAccountName string          `json:"bankAccountName"`
	Frequency       string          `json:"frequency"`
	StartDate       string          `json:"startDate"`
	NextIssueDate   string          `json:"nextIssueDate"`
	Cycles          int             `json:"cycles"`
	AllowClientStop bool            `json:"allowClientStop"`
	ShowShipAddr    bool            `json:"showShippingAddress"`
	GeneratedBy     string          `json:"generatedBy"`
	Items           []InvoiceItem   `json:"items"`
	DiscountValue   float64         `json:"discountValue"`
	DiscountMode    string          `json:"discountMode"`
	Subtotal        float64         `json:"subtotal"`
	TaxTotal        float64         `json:"taxTotal"`
	Total           float64         `json:"total"`
	Status          RecurringStatus `json:"status"`
	Note            string          `json:"note"`
	Terms           string          `json:"terms"`
	CreatedAt       string          `json:"createdAt"`
	UpdatedAt       string          `json:"updatedAt"`
}

type UpsertInvoiceRequest = Invoice

type UpsertRecurringInvoiceRequest = RecurringInvoice

type ListInvoicesQuery struct {
	Status string
	Limit  int
}

type ListRecurringInvoicesQuery struct {
	Status string
	Limit  int
}

// OasisExportRecord modela una línea del archivo plano 961 (interfaz de
// facturación electrónica de Oasis): una fila por ítem de factura, con el NIT
// del comprador y su dígito de verificación en columnas propias (antes el NIT
// salía de `note` y el código postal de `billing_address`, ambos erróneos).
// Los datos del vendedor y el código postal quedan vacíos hasta exista la
// ficha fiscal de la empresa (Fase 5b).
type OasisExportRecord struct {
	BuyerIDType       string  `json:"buyerIdType"`
	BuyerNIT          string  `json:"buyerNit"`
	BuyerDV           string  `json:"buyerDv"`
	BuyerName         string  `json:"buyerName"`
	BuyerPostalCode   string  `json:"buyerPostalCode"`
	BuyerPhone        string  `json:"buyerPhone"`
	BuyerAddress      string  `json:"buyerAddress"`
	BuyerBillingEmail string  `json:"buyerBillingEmail"`
	SellerIDType      string  `json:"sellerIdType"`
	SellerNIT         string  `json:"sellerNit"`
	SellerDV          string  `json:"sellerDv"`
	SellerName        string  `json:"sellerName"`
	SellerPostalCode  string  `json:"sellerPostalCode"`
	SellerAddress     string  `json:"sellerAddress"`
	InvoiceNumber     string  `json:"invoiceNumber"`
	Constant          string  `json:"constant"`
	IssueDate         string  `json:"issueDate"`
	IssueTime         string  `json:"issueTime"`
	DueDate           string  `json:"dueDate"`
	CreditFlag        string  `json:"creditFlag"`
	PurchaseOrder     string  `json:"purchaseOrder"`
	GenerationDate    string  `json:"generationDate"`
	LineValue         float64 `json:"lineValue"`
	ItemNumber        int     `json:"itemNumber"`
	EquipmentCode     string  `json:"equipmentCode"`
	Description       string  `json:"description"`
	IVAPercent        float64 `json:"ivaPercent"`
	IVAValue          float64 `json:"ivaValue"`
	LineTotal         float64 `json:"lineTotal"`
	CreditMarker      string  `json:"creditMarker"`
	InvoiceTotal      float64 `json:"invoiceTotal"`
}

// OasisExportQuery filtra el export por rango de fechas de emisión (ambas
// opcionales, formato YYYY-MM-DD, inclusivo).
type OasisExportQuery struct {
	From string
	To   string
}

// Expense es un gasto de caja menor.
type Expense struct {
	ID              int64   `json:"id"`
	AccountID       *int64  `json:"accountId"`
	AccountName     string  `json:"accountName"`
	ItemName        string  `json:"itemName"`
	Concept         string  `json:"concept"`
	Category        string  `json:"category"`
	Description     string  `json:"description"`
	Employee        string  `json:"employee"`
	Project         string  `json:"project"`
	Vendor          string  `json:"vendor"`
	Amount          float64 `json:"amount"`
	CurrencyCode    string  `json:"currencyCode"`
	ExchangeRate    float64 `json:"exchangeRate"`
	ValueInCop      float64 `json:"valueInCop"`
	PaidAt          string  `json:"paidAt"`
	ReceiptFileName string  `json:"receiptFileName"`
	CreatedBy       string  `json:"createdBy"`
	CreatedAt       string  `json:"createdAt"`
}

type UpsertExpenseRequest struct {
	AccountID       *int64  `json:"accountId"`
	ItemName        string  `json:"itemName"`
	Concept         string  `json:"concept"`
	Category        string  `json:"category"`
	Description     string  `json:"description"`
	Employee        string  `json:"employee"`
	Project         string  `json:"project"`
	Vendor          string  `json:"vendor"`
	Amount          float64 `json:"amount"`
	CurrencyCode    string  `json:"currencyCode"`
	ExchangeRate    float64 `json:"exchangeRate"`
	PaidAt          string  `json:"paidAt"`
	ReceiptFileName string  `json:"receiptFileName"`
}

type ListExpensesQuery struct {
	Limit int
}

// CashCountEntry es una denominación del arqueo de billetes/monedas.
type CashCountEntry struct {
	Kind         string  `json:"kind"`
	Denomination float64 `json:"denomination"`
	Quantity     int     `json:"quantity"`
	Total        float64 `json:"total"`
}

type CashCount struct {
	ID           int64   `json:"id"`
	AccountID    *int64  `json:"accountId"`
	Kind         string  `json:"kind"`
	Denomination float64 `json:"denomination"`
	Quantity     int     `json:"quantity"`
	Total        float64 `json:"total"`
	CountedAt    string  `json:"countedAt"`
	CountedBy    string  `json:"countedBy"`
}

type SaveCashCountsRequest struct {
	AccountID *int64           `json:"accountId"`
	Entries   []CashCountEntry `json:"entries"`
}

// Warranty es un registro de garantía.
type Warranty struct {
	ID                  int64  `json:"id"`
	Code                string `json:"code"`
	EquipmentID         string `json:"equipmentId"`
	EquipmentIdentifier string `json:"equipmentIdentifier"`
	ClientName          string `json:"clientName"`
	Months              int    `json:"months"`
	StartAt             string `json:"startAt"`
	EndAt               string `json:"endAt"`
	FollowUpAt          string `json:"followUpAt"`
	Owner               string `json:"owner"`
	Phase               string `json:"phase"`
	Status              string `json:"status"`
	Notes               string `json:"notes"`
	CreatedBy           string `json:"createdBy"`
	CreatedAt           string `json:"createdAt"`
	UpdatedAt           string `json:"updatedAt"`
}

type UpsertWarrantyRequest struct {
	Code                string `json:"code"`
	EquipmentID         string `json:"equipmentId"`
	EquipmentIdentifier string `json:"equipmentIdentifier"`
	ClientName          string `json:"clientName"`
	Months              int    `json:"months"`
	StartAt             string `json:"startAt"`
	EndAt               string `json:"endAt"`
	FollowUpAt          string `json:"followUpAt"`
	Owner               string `json:"owner"`
	Phase               string `json:"phase"`
	Status              string `json:"status"`
	Notes               string `json:"notes"`
}

type ListWarrantiesQuery struct {
	Status string
	Limit  int
}

// CompanySetting es una configuración genérica por empresa.
type CompanySetting struct {
	Key       string          `json:"key"`
	Value     json.RawMessage `json:"value"`
	UpdatedAt string          `json:"updatedAt"`
}

type UpsertSettingRequest struct {
	Value json.RawMessage `json:"value"`
}
