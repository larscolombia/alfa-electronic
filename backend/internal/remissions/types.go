package remissions

type Attachment struct {
	Name    string `json:"name"`
	DataURL string `json:"dataUrl"`
}

type Remission struct {
	ID          string `json:"id"`
	Consecutive string `json:"consecutive"`
	CompanyID   string `json:"companyId"`
	ClientName  string `json:"clientName"`
	ClientNIT   string `json:"clientNit"`
	// ContactName es el contacto/ingeniero responsable del cliente. El
	// requerimiento de despacho lo exige: sin él la transacción no se genera.
	ContactName    string          `json:"contactName"`
	DispatchType   string          `json:"dispatchType"`
	CarrierName    string          `json:"carrierName"`
	GuideNumber    string          `json:"guideNumber"`
	Items          []RemissionItem `json:"items"`
	Valued         bool            `json:"valued"`
	TotalValue     float64         `json:"totalValue"`
	WarrantyMonths int             `json:"warrantyMonths"`
	Notes          string          `json:"notes"`
	PurchaseOrder  string          `json:"purchaseOrder"`
	YoutubeLink    string          `json:"youtubeLink"`
	DispatchPhotos []Attachment    `json:"dispatchPhotos"`
	DeliveryStatus string          `json:"deliveryStatus"`
	CreatedAt      string          `json:"createdAt"`
	CreatedBy      string          `json:"createdBy"`
	Status         string          `json:"status"`

	// ── Fase 5c: puente pago → despacho ──────────────────────────────────
	// La regla del cliente es POR MODALIDAD, no universal: "despachos
	// Servientrega son solo los clientes créditos... se despacha de una...
	// si son contra entregas, se quedan ahí empacaditos en la oficina hasta
	// que el cliente paga primero".

	// InvoiceID es la factura que debe estar Pagada antes de despachar.
	InvoiceID *int64 `json:"invoiceId"`
	// PaymentOverride es el escape de admin para saltar la puerta. Persistido
	// con quién y cuándo porque salta un control de plata.
	PaymentOverride   bool   `json:"paymentOverride"`
	PaymentOverrideBy string `json:"paymentOverrideBy"`
	PaymentOverrideAt string `json:"paymentOverrideAt"`

	// Campos COMPUTADOS (JOINs, no tienen columna propia). La UI los necesita
	// para mostrar "retenida por pago" con el estado real de la factura en vez
	// de recalcular la regla en el navegador, que es justo lo que permitía
	// despachar sin pagar.
	InvoiceStatus     string `json:"invoiceStatus"`
	InvoiceReference  string `json:"invoiceReference"`
	CreditClient      bool   `json:"creditClient"`
	PaymentGate       bool   `json:"paymentGate"`
	PaymentHeld       bool   `json:"paymentHeld"`
	PaymentHeldReason string `json:"paymentHeldReason"`
}

type RemissionItem struct {
	EquipmentID    string  `json:"equipmentId"`
	Identifier     string  `json:"identifier"`
	Description    string  `json:"description"`
	WarrantyMonths int     `json:"warrantyMonths"`
	UnitPrice      float64 `json:"unitPrice"`
	Quantity       int     `json:"quantity"`
	Accessories    string  `json:"accessories"`
	AnchoredNote   string  `json:"anchoredNote"`
}

type UpsertRemissionRequest struct {
	ClientName string `json:"clientName"`
	ClientNIT  string `json:"clientNit"`
	// ContactName obligatorio (requerimiento de despacho): el contacto o
	// ingeniero responsable del cliente. Vacío = 400 con mensaje accionable.
	ContactName string `json:"contactName"`
	// AnchoredAccepted es el consentimiento explícito para incluir equipos
	// anclados en préstamo. Se exige SOLO si algún item trae anchoredNote:
	// la alerta amarilla no basta, el requerimiento pide aceptación.
	AnchoredAccepted bool            `json:"anchoredAccepted"`
	DispatchType     string          `json:"dispatchType"`
	CarrierName      string          `json:"carrierName"`
	GuideNumber      string          `json:"guideNumber"`
	Items            []RemissionItem `json:"items"`
	Valued           bool            `json:"valued"`
	WarrantyMonths   int             `json:"warrantyMonths"`
	Notes            string          `json:"notes"`
	PurchaseOrder    string          `json:"purchaseOrder"`
	YoutubeLink      string          `json:"youtubeLink"`
	DispatchPhotos   []Attachment    `json:"dispatchPhotos"`
	// Fase 5c: factura que debe estar Pagada antes de despachar (puente
	// pago→despacho). nil/0 = sin vincular.
	InvoiceID *int64 `json:"invoiceId"`
}

// DeliveryStatusRequest es el cuerpo de PATCH .../delivery-status.
type DeliveryStatusRequest struct {
	DeliveryStatus string `json:"deliveryStatus"`
	// PaymentOverride salta la puerta de pago. Sólo la honra un rol admin del
	// JWT, y queda grabada con quién y cuándo.
	PaymentOverride bool `json:"paymentOverride"`
}
