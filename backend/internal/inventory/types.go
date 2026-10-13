package inventory

type StockReference struct {
	Reference             string `json:"reference"`
	InternalCode          string `json:"internalCode"`
	ManufacturerReference string `json:"manufacturerReference"`
	Designation           string `json:"designation"`
	Family                string `json:"family"`
	Subfamily             string `json:"subfamily"`
	Brand                 string `json:"brand"`
	Location              string `json:"location"`
	UnitMeasure           string `json:"unitMeasure"`
	CompatibleEquipment   string `json:"compatibleEquipment"`
	Criticality           string `json:"criticality"`
	PreferredSupplierName string `json:"preferredSupplierName"`
	LeadTimeDays          int    `json:"leadTimeDays"`
	TechnicalNotes        string `json:"technicalNotes"`
	SupplierCode          string `json:"supplierCode"`
	CurrentStock          int    `json:"currentStock"`
	MinStock              int    `json:"minStock"`
	TargetStock           int    `json:"targetStock"`
	CreatedAt             string `json:"createdAt"`
	UpdatedAt             string `json:"updatedAt"`
}

type MovementRecord struct {
	ID               string `json:"id"`
	Type             string `json:"type"`
	Reference        string `json:"reference"`
	Quantity         int    `json:"quantity"`
	Reason           string `json:"reason"`
	WorkOrder        string `json:"workOrder"`
	EquipmentTag     string `json:"equipmentTag"`
	CustomerSite     string `json:"customerSite"`
	MovementCategory string `json:"movementCategory"`
	EvidenceRef      string `json:"evidenceRef"`
	RequestedBy      string `json:"requestedBy"`
	RequestedAt      string `json:"requestedAt"`
}

type AdjustmentRequest struct {
	ID               string `json:"id"`
	Type             string `json:"type"`
	Reference        string `json:"reference"`
	Quantity         int    `json:"quantity"`
	Reason           string `json:"reason"`
	WorkOrder        string `json:"workOrder"`
	EquipmentTag     string `json:"equipmentTag"`
	CustomerSite     string `json:"customerSite"`
	MovementCategory string `json:"movementCategory"`
	EvidenceRef      string `json:"evidenceRef"`
	RequestedBy      string `json:"requestedBy"`
	RequestedAt      string `json:"requestedAt"`
	Status           string `json:"status"`
	ApprovedBy       string `json:"approvedBy"`
	ApprovedAt       string `json:"approvedAt"`
}

type ReservationRecord struct {
	ID             string `json:"id"`
	Reference      string `json:"reference"`
	Quantity       int    `json:"quantity"`
	AssignedTo     string `json:"assignedTo"`
	Purpose        string `json:"purpose"`
	WorkOrder      string `json:"workOrder"`
	EquipmentTag   string `json:"equipmentTag"`
	CustomerSite   string `json:"customerSite"`
	Priority       string `json:"priority"`
	CommitmentDate string `json:"commitmentDate"`
	ReservedAt     string `json:"reservedAt"`
	ExpiresAt      string `json:"expiresAt"`
	Status         string `json:"status"`
}

type ReplenishmentItem struct {
	Reference           string  `json:"reference"`
	Description         string  `json:"description"`
	Supplier            string  `json:"supplier"`
	AlternateSupplier   string  `json:"alternateSupplier"`
	ProcurementOwner    string  `json:"procurementOwner"`
	EstimatedLeadDays   int     `json:"estimatedLeadDays"`
	LastQuotedUnitCost  float64 `json:"lastQuotedUnitCost"`
	ShortageReason      string  `json:"shortageReason"`
	MinStock            int     `json:"minStock"`
	CurrentStock        int     `json:"currentStock"`
	FirstInsufficientAt string  `json:"firstInsufficientAt"`
	LastAttemptAt       string  `json:"lastAttemptAt"`
	Attempts            int     `json:"attempts"`
	Status              string  `json:"status"`
	UpdatedAt           string  `json:"updatedAt"`
}

type PurchaseLine struct {
	ID                  string  `json:"id"`
	Reference           string  `json:"reference"`
	Component           string  `json:"component"`
	Type                string  `json:"type"`
	Brand               string  `json:"brand"`
	Description         string  `json:"description"`
	Supplier            string  `json:"supplier"`
	Quantity            int     `json:"quantity"`
	UnitPrice           float64 `json:"unitPrice"`
	NeededBy            string  `json:"neededBy"`
	Source              string  `json:"source"`
	ExpectedDate        string  `json:"expectedDate"`
	RequestReason       string  `json:"requestReason"`
	GeneratedAt         string  `json:"generatedAt"`
	GeneratedBy         string  `json:"generatedBy"`
	Status              string  `json:"status"`
	ProjectID           string  `json:"projectId"`
	EquipmentTag        string  `json:"equipmentTag"`
	ModifiedByPurchases bool    `json:"modifiedByPurchases"`
	ModifiedBy          string  `json:"modifiedBy"`
	ModifiedAt          string  `json:"modifiedAt"`
	ApprovalStatus      string  `json:"approvalStatus"`
	ApprovedBy          string  `json:"approvedBy"`
	ApprovedAt          string  `json:"approvedAt"`
}

type WeeklySnapshot struct {
	ID                 int64    `json:"id"`
	WeekKey            string   `json:"weekKey"`
	GeneratedAt        string   `json:"generatedAt"`
	GeneratedBy        string   `json:"generatedBy"`
	TotalInsufficient  int      `json:"totalInsufficient"`
	Escalated          int      `json:"escalated"`
	AverageWaitingDays int      `json:"averageWaitingDays"`
	CriticalReferences []string `json:"criticalReferences"`
}

type TechnicianBagTrace struct {
	ID                string `json:"id"`
	BagCode           string `json:"bagCode"`
	Reference         string `json:"reference"`
	Quantity          int    `json:"quantity"`
	Technician        string `json:"technician"`
	WorkOrder         string `json:"workOrder"`
	SealCode          string `json:"sealCode"`
	OriginArea        string `json:"originArea"`
	ReceptionDocument string `json:"receptionDocument"`
	ReceivedBy        string `json:"receivedBy"`
	ReceivedAt        string `json:"receivedAt"`
	Status            string `json:"status"`
	ReleasedBy        string `json:"releasedBy"`
	ReleasedAt        string `json:"releasedAt"`
	Notes             string `json:"notes"`
}

type CountSession struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	Scope          string `json:"scope"`
	Owner          string `json:"owner"`
	Location       string `json:"location"`
	CutoffDate     string `json:"cutoffDate"`
	CountingMethod string `json:"countingMethod"`
	QALead         string `json:"qaLead"`
	StartDate      string `json:"startDate"`
	EndDate        string `json:"endDate"`
	Status         string `json:"status"`
	CreatedAt      string `json:"createdAt"`
}

type DiscrepancyRecord struct {
	ID         string `json:"id"`
	SessionID  string `json:"sessionId"`
	Reference  string `json:"reference"`
	Location   string `json:"location"`
	Expected   int    `json:"expected"`
	Counted    int    `json:"counted"`
	Reason     string `json:"reason"`
	RootCause  string `json:"rootCause"`
	CountSheet string `json:"countSheet"`
	ApprovedBy string `json:"approvedBy"`
	ApprovedAt string `json:"approvedAt"`
}

type AuditEvent struct {
	ID     int64  `json:"id"`
	When   string `json:"when"`
	User   string `json:"user"`
	Action string `json:"action"`
	Detail string `json:"detail"`
}

type InventoryConfig struct {
	MaxReserveDays int    `json:"maxReserveDays"`
	UpdatedAt      string `json:"updatedAt"`
}

type InventoryStateResponse struct {
	References         []StockReference     `json:"references"`
	Movements          []MovementRecord     `json:"movements"`
	AdjustmentRequests []AdjustmentRequest  `json:"adjustmentRequests"`
	Reservations       []ReservationRecord  `json:"reservations"`
	MaxReserveDays     int                  `json:"maxReserveDays"`
	ReplenishmentItems []ReplenishmentItem  `json:"replenishmentItems"`
	PurchaseLines      []PurchaseLine       `json:"purchaseLines"`
	WeeklySnapshots    []WeeklySnapshot     `json:"weeklySnapshots"`
	BagTraces          []TechnicianBagTrace `json:"bagTraces"`
	Sessions           []CountSession       `json:"sessions"`
	Discrepancies      []DiscrepancyRecord  `json:"discrepancies"`
	AuditTrail         []AuditEvent         `json:"auditTrail"`
}

type OperationResult struct {
	OK      bool   `json:"ok"`
	Message string `json:"message"`
}

type CreateReferenceRequest struct {
	Reference             string `json:"reference"`
	InternalCode          string `json:"internalCode"`
	ManufacturerReference string `json:"manufacturerReference"`
	Designation           string `json:"designation"`
	Family                string `json:"family"`
	Subfamily             string `json:"subfamily"`
	Brand                 string `json:"brand"`
	Location              string `json:"location"`
	UnitMeasure           string `json:"unitMeasure"`
	CompatibleEquipment   string `json:"compatibleEquipment"`
	Criticality           string `json:"criticality"`
	PreferredSupplierName string `json:"preferredSupplierName"`
	LeadTimeDays          int    `json:"leadTimeDays"`
	TechnicalNotes        string `json:"technicalNotes"`
	SupplierCode          string `json:"supplierCode"`
	MinStock              int    `json:"minStock"`
	TargetStock           int    `json:"targetStock"`
}

type RegisterStockEntryRequest struct {
	Reference      string  `json:"reference"`
	Quantity       int     `json:"quantity"`
	Location       string  `json:"location"`
	SupplierName   string  `json:"supplierName"`
	SupplierCode   string  `json:"supplierCode"`
	DocumentType   string  `json:"documentType"`
	DocumentNumber string  `json:"documentNumber"`
	BatchOrSerial  string  `json:"batchOrSerial"`
	ReceivedBy     string  `json:"receivedBy"`
	UnitCost       float64 `json:"unitCost"`
	ReceivedAt     string  `json:"receivedAt"`
}

type SubmitMovementRequest struct {
	Type             string `json:"type"`
	Reference        string `json:"reference"`
	Quantity         int    `json:"quantity"`
	Reason           string `json:"reason"`
	WorkOrder        string `json:"workOrder"`
	EquipmentTag     string `json:"equipmentTag"`
	CustomerSite     string `json:"customerSite"`
	MovementCategory string `json:"movementCategory"`
	EvidenceRef      string `json:"evidenceRef"`
}

type CreateReservationRequest struct {
	Reference      string `json:"reference"`
	Quantity       int    `json:"quantity"`
	AssignedTo     string `json:"assignedTo"`
	Purpose        string `json:"purpose"`
	WorkOrder      string `json:"workOrder"`
	EquipmentTag   string `json:"equipmentTag"`
	CustomerSite   string `json:"customerSite"`
	Priority       string `json:"priority"`
	CommitmentDate string `json:"commitmentDate"`
}

type RegisterReplenishmentAttemptRequest struct {
	Reference         string  `json:"reference"`
	Supplier          string  `json:"supplier"`
	AlternateSupplier string  `json:"alternateSupplier"`
	EstimatedLeadDays int     `json:"estimatedLeadDays"`
	QuotedUnitCost    float64 `json:"quotedUnitCost"`
	ResultNote        string  `json:"resultNote"`
	ProcurementOwner  string  `json:"procurementOwner"`
}

type ReceiveTechnicianBagRequest struct {
	BagCode           string `json:"bagCode"`
	Reference         string `json:"reference"`
	Quantity          int    `json:"quantity"`
	Technician        string `json:"technician"`
	Notes             string `json:"notes"`
	WorkOrder         string `json:"workOrder"`
	SealCode          string `json:"sealCode"`
	OriginArea        string `json:"originArea"`
	ReceptionDocument string `json:"receptionDocument"`
}

type CreateSessionRequest struct {
	Name           string `json:"name"`
	Scope          string `json:"scope"`
	Owner          string `json:"owner"`
	StartDate      string `json:"startDate"`
	Location       string `json:"location"`
	CutoffDate     string `json:"cutoffDate"`
	CountingMethod string `json:"countingMethod"`
	QALead         string `json:"qaLead"`
}

type SetMaxReserveDaysRequest struct {
	Days int `json:"days"`
}

type CloseDiagnosisInventoryRequest struct {
	ClosedBy string `json:"closedBy"`
}

type PurchaseRequest struct {
	ID             string  `json:"id"`
	Reference      string  `json:"reference"`
	Description    string  `json:"description"`
	Quantity       int     `json:"quantity"`
	Supplier       string  `json:"supplier"`
	EstimatedCost  float64 `json:"estimatedCost"`
	LeadTimeDays   int     `json:"leadTimeDays"`
	Urgency        string  `json:"urgency"`
	Memo           string  `json:"memo"`
	ProjectID      string  `json:"projectId"`
	EquipmentTag   string  `json:"equipmentTag"`
	RequestedBy    string  `json:"requestedBy"`
	RequestedAt    string  `json:"requestedAt"`
	Status         string  `json:"status"`
	ReviewedBy     string  `json:"reviewedBy"`
	ReviewedAt     string  `json:"reviewedAt"`
	ReviewNotes    string  `json:"reviewNotes"`
	PurchaseLineID string  `json:"purchaseLineId"`
}

type CreatePurchaseRequestRequest struct {
	Reference     string  `json:"reference"`
	Description   string  `json:"description"`
	Quantity      int     `json:"quantity"`
	Supplier      string  `json:"supplier"`
	EstimatedCost float64 `json:"estimatedCost"`
	LeadTimeDays  int     `json:"leadTimeDays"`
	Urgency       string  `json:"urgency"`
	Memo          string  `json:"memo"`
	ProjectID     string  `json:"projectId"`
	EquipmentTag  string  `json:"equipmentTag"`
}

type CreatePurchaseLineRequest struct {
	Reference     string  `json:"reference"`
	Component     string  `json:"component"`
	Type          string  `json:"type"`
	Brand         string  `json:"brand"`
	Description   string  `json:"description"`
	Supplier      string  `json:"supplier"`
	Quantity      int     `json:"quantity"`
	UnitPrice     float64 `json:"unitPrice"`
	NeededBy      string  `json:"neededBy"`
	RequestReason string  `json:"requestReason"`
	ProjectID     string  `json:"projectId"`
	EquipmentTag  string  `json:"equipmentTag"`
}

// UpdatePurchaseLineRequest es el cuerpo del PATCH /purchase-lines/:id.
// Campos puntero: nil significa "no se envia, conservar valor actual".
type UpdatePurchaseLineRequest struct {
	Reference *string  `json:"reference"`
	Brand     *string  `json:"brand"`
	UnitPrice *float64 `json:"unitPrice"`
	Quantity  *int     `json:"quantity"`
}

type ReviewPurchaseRequestRequest struct {
	Action      string `json:"action"`
	ReviewNotes string `json:"reviewNotes"`
}

type SupplierConsolidation struct {
	Supplier      string         `json:"supplier"`
	Lines         []PurchaseLine `json:"lines"`
	TotalItems    int            `json:"totalItems"`
	TotalQuantity int            `json:"totalQuantity"`
}
