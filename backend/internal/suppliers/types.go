package suppliers

type Supplier struct {
	ID                     int64   `json:"id"`
	SupplierNumber         string  `json:"supplierNumber"`
	LegalName              string  `json:"legalName"`
	MainAddress            string  `json:"mainAddress"`
	AddressExtra           string  `json:"addressExtra"`
	PostalCode             string  `json:"postalCode"`
	City                   string  `json:"city"`
	Country                string  `json:"country"`
	TaxIdentification      string  `json:"taxIdentification"`
	IntraVatNumber         string  `json:"intraVatNumber"`
	Language               string  `json:"language"`
	Currency               string  `json:"currency"`
	DefaultContact         string  `json:"defaultContact"`
	Title                  string  `json:"title"`
	LastName               string  `json:"lastName"`
	FirstName              string  `json:"firstName"`
	MobilePhone            string  `json:"mobilePhone"`
	ContactRole            string  `json:"contactRole"`
	AccountsPayableAccount string  `json:"accountsPayableAccount"`
	Sector                 string  `json:"sector"`
	RSECompliant           bool    `json:"rseCompliant"`
	SubscriptionActive     bool    `json:"subscriptionActive"`
	Notes                  string  `json:"notes"`
	AccountingNumber       string  `json:"accountingNumber"`
	PaymentTerms           string  `json:"paymentTerms"`
	ShippingTerms          string  `json:"shippingTerms"`
	MinimumOrder           float64 `json:"minimumOrder"`
	TaxRate                float64 `json:"taxRate"`
	ResponsiblePerson      string  `json:"responsiblePerson"`
	ConfidenceGrade        string  `json:"confidenceGrade"`
	PerformanceNotes       string  `json:"performanceNotes"`
	CreatedAt              string  `json:"createdAt"`
	UpdatedAt              string  `json:"updatedAt"`
}

type SupplierDraft struct {
	SupplierNumber         string  `json:"supplierNumber"`
	LegalName              string  `json:"legalName"`
	MainAddress            string  `json:"mainAddress"`
	AddressExtra           string  `json:"addressExtra"`
	PostalCode             string  `json:"postalCode"`
	City                   string  `json:"city"`
	Country                string  `json:"country"`
	TaxIdentification      string  `json:"taxIdentification"`
	IntraVatNumber         string  `json:"intraVatNumber"`
	Language               string  `json:"language"`
	Currency               string  `json:"currency"`
	DefaultContact         string  `json:"defaultContact"`
	Title                  string  `json:"title"`
	LastName               string  `json:"lastName"`
	FirstName              string  `json:"firstName"`
	MobilePhone            string  `json:"mobilePhone"`
	ContactRole            string  `json:"contactRole"`
	AccountsPayableAccount string  `json:"accountsPayableAccount"`
	Sector                 string  `json:"sector"`
	RSECompliant           bool    `json:"rseCompliant"`
	SubscriptionActive     bool    `json:"subscriptionActive"`
	Notes                  string  `json:"notes"`
	AccountingNumber       string  `json:"accountingNumber"`
	PaymentTerms           string  `json:"paymentTerms"`
	ShippingTerms          string  `json:"shippingTerms"`
	MinimumOrder           float64 `json:"minimumOrder"`
	TaxRate                float64 `json:"taxRate"`
	ResponsiblePerson      string  `json:"responsiblePerson"`
	ConfidenceGrade        string  `json:"confidenceGrade"`
	PerformanceNotes       string  `json:"performanceNotes"`
}

type SupplierOrder struct {
	ID              int64               `json:"id"`
	OrderNumber     string              `json:"orderNumber"`
	SupplierID      int64               `json:"supplierId"`
	RequestedBy     string              `json:"requestedBy"`
	Equipment       string              `json:"equipment"`
	Purpose         string              `json:"purpose"`
	Quantity        int                 `json:"quantity"`
	RequestDate     string              `json:"requestDate"`
	Status          string              `json:"status"`
	CustomerName    string              `json:"customerName"`
	MachineModel    string              `json:"machineModel"`
	BoardReference  string              `json:"boardReference"`
	Diagnosis       string              `json:"diagnosis"`
	RepairObjective string              `json:"repairObjective"`
	Urgency         string              `json:"urgency"`
	CommercialNotes string              `json:"commercialNotes"`
	Items           []SupplierOrderItem `json:"items"`
	Traces          []OrderTrace        `json:"traces"`
	CreatedAt       string              `json:"createdAt"`
	UpdatedAt       string              `json:"updatedAt"`
}

type SupplierOrderItem struct {
	ID          int64   `json:"id"`
	OrderID     int64   `json:"orderId"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	PartNumber  string  `json:"partNumber"`
	TargetBoard string  `json:"targetBoard"`
	Quantity    int     `json:"quantity"`
	Unit        string  `json:"unit"`
	UnitCost    float64 `json:"unitCost"`
	Notes       string  `json:"notes"`
}

type OrderTrace struct {
	ID        int64  `json:"id"`
	OrderID   int64  `json:"orderId"`
	Timestamp string `json:"timestamp"`
	Actor     string `json:"actor"`
	Action    string `json:"action"`
	Status    string `json:"status"`
	Notes     string `json:"notes"`
}

type SupplierOrderRequest struct {
	OrderNumber     string              `json:"orderNumber"`
	SupplierID      int64               `json:"supplierId"`
	RequestedBy     string              `json:"requestedBy"`
	Equipment       string              `json:"equipment"`
	Purpose         string              `json:"purpose"`
	Quantity        int                 `json:"quantity"`
	RequestDate     string              `json:"requestDate"`
	Status          string              `json:"status"`
	CustomerName    string              `json:"customerName"`
	MachineModel    string              `json:"machineModel"`
	BoardReference  string              `json:"boardReference"`
	Diagnosis       string              `json:"diagnosis"`
	RepairObjective string              `json:"repairObjective"`
	Urgency         string              `json:"urgency"`
	CommercialNotes string              `json:"commercialNotes"`
	Items           []SupplierOrderItem `json:"items"`
}

type OrderTraceRequest struct {
	Action string `json:"action"`
	Status string `json:"status"`
	Notes  string `json:"notes"`
}
