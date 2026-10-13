package finance

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
	CreatedAt      string        `json:"createdAt"`
	UpdatedAt      string        `json:"updatedAt"`
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

type OasisExportRecord struct {
	NIT           string  `json:"nit"`
	InvoiceNumber string  `json:"invoiceNumber"`
	Date          string  `json:"date"`
	Subtotal      float64 `json:"subtotal"`
	IVA           float64 `json:"iva"`
	Total         float64 `json:"total"`
	PostalCode    string  `json:"postalCode"`
	Concept       string  `json:"concept"`
}
