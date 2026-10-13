package remissions

type Attachment struct {
	Name    string `json:"name"`
	DataURL string `json:"dataUrl"`
}

type Remission struct {
	ID              string          `json:"id"`
	Consecutive     string          `json:"consecutive"`
	CompanyID       string          `json:"companyId"`
	ClientName      string          `json:"clientName"`
	ClientNIT       string          `json:"clientNit"`
	DispatchType    string          `json:"dispatchType"`
	CarrierName     string          `json:"carrierName"`
	GuideNumber     string          `json:"guideNumber"`
	Items           []RemissionItem `json:"items"`
	Valued          bool            `json:"valued"`
	TotalValue      float64         `json:"totalValue"`
	WarrantyMonths  int             `json:"warrantyMonths"`
	Notes           string          `json:"notes"`
	PurchaseOrder   string          `json:"purchaseOrder"`
	YoutubeLink     string          `json:"youtubeLink"`
	DispatchPhotos  []Attachment    `json:"dispatchPhotos"`
	DeliveryStatus  string          `json:"deliveryStatus"`
	CreatedAt       string          `json:"createdAt"`
	CreatedBy       string          `json:"createdBy"`
	Status          string          `json:"status"`
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
	ClientName     string          `json:"clientName"`
	ClientNIT      string          `json:"clientNit"`
	DispatchType   string          `json:"dispatchType"`
	CarrierName    string          `json:"carrierName"`
	GuideNumber    string          `json:"guideNumber"`
	Items          []RemissionItem `json:"items"`
	Valued         bool            `json:"valued"`
	WarrantyMonths int             `json:"warrantyMonths"`
	Notes          string          `json:"notes"`
	PurchaseOrder  string          `json:"purchaseOrder"`
	YoutubeLink    string          `json:"youtubeLink"`
	DispatchPhotos []Attachment    `json:"dispatchPhotos"`
}
