package equipment

type EvidencePhoto struct {
	ID                string   `json:"id"`
	EvidenceType      string   `json:"evidenceType"`
	Notes             string   `json:"notes"`
	FileName          string   `json:"fileName"`
	MIMEType          string   `json:"mimeType"`
	SizeBytes         int64    `json:"sizeBytes"`
	Width             int      `json:"width"`
	Height            int      `json:"height"`
	CapturedAt        string   `json:"capturedAt"`
	CapturedAtSource  string   `json:"capturedAtSource"`
	SelectedAt        string   `json:"selectedAt"`
	DeviceMake        string   `json:"deviceMake"`
	DeviceModel       string   `json:"deviceModel"`
	Latitude          *float64 `json:"latitude"`
	Longitude         *float64 `json:"longitude"`
	GPSAvailable      bool     `json:"gpsAvailable"`
	SHA256            string   `json:"sha256"`
	ThumbnailDataURL  string   `json:"thumbnailDataUrl"`
	BackendSyncStatus string   `json:"backendSyncStatus"`
}

type Attachment struct {
	ID             string `json:"id"`
	AttachmentType string `json:"attachmentType,omitempty"`
	FileName       string `json:"fileName"`
	MIMEType       string `json:"mimeType"`
	SizeBytes      int64  `json:"sizeBytes"`
	DataURL        string `json:"dataUrl"`
	Notes          string `json:"notes"`
	UploadedAt     string `json:"uploadedAt"`
	UploadedBy     string `json:"uploadedBy"`
	SHA256         string `json:"sha256"`
}

type Item struct {
	ID                             string              `json:"id"`
	RegistrationMode               string              `json:"registrationMode"`
	EquipmentModelID               string              `json:"equipmentModelId"`
	IsIndustrial                   *bool               `json:"isIndustrial,omitempty"`
	ServiceTypeID                  string              `json:"serviceTypeId"`
	ServiceTypeName                string              `json:"serviceTypeName"`
	StorageLocationID              string              `json:"storageLocationId"`
	StorageLocationName            string              `json:"storageLocationName"`
	FamilyID                       string              `json:"familyId"`
	FamilyName                     string              `json:"familyName"`
	Marca                          string              `json:"marca"`
	Tipo                           string              `json:"tipo"`
	Serie                          string              `json:"serie"`
	ReceivedIdentifier             string              `json:"receivedIdentifier"`
	ReceivedIdentifierType         string              `json:"receivedIdentifierType"`
	ReceivedIdentifierSource       string              `json:"receivedIdentifierSource"`
	ReceivedIdentifierCaptured     string              `json:"receivedIdentifierCapturedAt"`
	CustomerShipmentReference      string              `json:"customerShipmentReference"`
	Accessories                    string              `json:"accessories"`
	BorrowedEquipments             []BorrowedEquipment `json:"borrowedEquipments"`
	FailureDescription             string              `json:"failureDescription"`
	SerieExceptionReason           string              `json:"serieExceptionReason,omitempty"`
	SenderUnknown                  bool                `json:"senderUnknown,omitempty"`
	CustodyIncident                *CustodyIncident    `json:"custodyIncident,omitempty"`
	VisibleDamageReported          bool                `json:"visibleDamageReported,omitempty"`
	VisibleDamageConfirmed         bool                `json:"visibleDamageConfirmed,omitempty"`
	FailurePending                 bool                `json:"failurePending,omitempty"`
	SoftwareSuspicion              bool                `json:"softwareSuspicion,omitempty"`
	PreviousIntervention           bool                `json:"previousIntervention,omitempty"`
	DuplicateConfirm               *DuplicateConfirm   `json:"duplicateConfirm,omitempty"`
	AssignedTo                     string              `json:"assignedTo"`
	AssignedToID                   string              `json:"assignedToId"`
	AssignedAt                     string              `json:"assignedAt"`
	AssignedBy                     string              `json:"assignedBy"`
	PendingHomologation            bool                `json:"pendingHomologation"`
	IndustrialOverrideAuthorizedBy string              `json:"industrialOverrideAuthorizedBy"`
	IndustrialOverrideReason       string              `json:"industrialOverrideReason"`
	IndustrialOverrideAt           string              `json:"industrialOverrideAuthorizedAt"`
	EstimatedData                  bool                `json:"estimatedData"`
	IdentifierLabelIssue           bool                `json:"identifierLabelIssue"`
	EvidencePhotos                 []EvidencePhoto     `json:"evidencePhotos"`
	Attachments                    []Attachment        `json:"attachments"`
	Answers                        map[string]string   `json:"answers"`
	RepairStatus                   string              `json:"repairStatus"`
	RepairStatusUpdatedAt          string              `json:"repairStatusUpdatedAt"`
	RepairStatusUpdatedBy          string              `json:"repairStatusUpdatedBy"`
	YouTubeLink                    string              `json:"youtubeLink"`
	DispatchPhotos                 []Attachment        `json:"dispatchPhotos"`
	PriorityBilling                bool                `json:"priorityBilling"`
	SuccessPercent                 *int                `json:"successPercent,omitempty"`
	DiagnosisMemo                  string              `json:"diagnosisMemo"`
	RepairMemo                     string              `json:"repairMemo"`
	SoftwareBackupAvailable        bool                `json:"softwareBackupAvailable"`
}

type Record struct {
	ID                   string `json:"id"`
	ProspectID           string `json:"prospectId"`
	ProspectName         string `json:"prospectName"`
	ReceptionDay         string `json:"receptionDay"`
	ReceptionMonth       string `json:"receptionMonth"`
	ReceptionYear        string `json:"receptionYear"`
	IntakeMethod         string `json:"intakeMethod"`
	IntakeCarrier        string `json:"intakeCarrier"`
	IntakeTrackingNumber string `json:"intakeTrackingNumber"`
	IntakeReceivedAt     string `json:"intakeReceivedAt"`
	CompanyName          string `json:"companyName"`
	SourceBranchName     string `json:"sourceBranchName"`
	NIT                  string `json:"nit"`
	Phone                string `json:"phone"`
	Address              string `json:"address"`
	City                 string `json:"city"`
	Country              string `json:"country"`
	ContactName          string `json:"contactName"`
	ContactRole          string `json:"contactRole"`
	Cellphone            string `json:"cellphone"`
	Email                string `json:"email"`
	ClientSignature      string `json:"clientSignature"`
	PikaSignature        string `json:"pikaSignature"`
	CreatedAt            string `json:"createdAt"`
	UpdatedAt            string `json:"updatedAt"`
	Archived             bool   `json:"archived"`
	ArchivedAt           string `json:"archivedAt"`
	SourceContext        string `json:"sourceContext"`
	AssignedTo           string `json:"assignedTo"`
	Items                []Item `json:"items"`
}

type Summary struct {
	RecordID                  string   `json:"recordId"`
	ItemID                    string   `json:"itemId"`
	ProspectID                string   `json:"prospectId"`
	ProspectName              string   `json:"prospectName"`
	ReceptionLabel            string   `json:"receptionLabel"`
	ServiceTypeName           string   `json:"serviceTypeName"`
	StorageLocationID         string   `json:"storageLocationId"`
	StorageLocationName       string   `json:"storageLocationName"`
	FamilyName                string   `json:"familyName"`
	Marca                     string   `json:"marca"`
	Tipo                      string   `json:"tipo"`
	Serie                     string   `json:"serie"`
	ReceivedIdentifier        string   `json:"receivedIdentifier"`
	CustomerShipmentReference string   `json:"customerShipmentReference"`
	Accessories               string   `json:"accessories"`
	BorrowedEquipments        []string `json:"borrowedEquipments"`
	FailureDescription        string   `json:"failureDescription"`
	EvidenceCount             int      `json:"evidenceCount"`
	DisplayName               string   `json:"displayName"`
	RepairStatus              string   `json:"repairStatus"`
	RepairStatusLabel         string   `json:"repairStatusLabel"`
	RepairStatusUpdatedAt     string   `json:"repairStatusUpdatedAt"`
	// Fase 5b: facturación urgente — el listado de equipos y el dashboard de
	// facturación marcan los ítems con priorityBilling.
	PriorityBilling bool `json:"priorityBilling"`
}

type ListRecordsQuery struct {
	ProspectID      string
	ClientNIT       string
	ClientName      string
	IncludeArchived bool
	Identifier      string
	AssignedToID    string
	// Fase 5c: restringe a registros con al menos un ítem marcado para
	// facturación urgente. Es un filtro de registro (EXISTS sobre el JSONB);
	// el recorte a los ítems marcados lo hace ListItems.
	PriorityBilling bool
}

type ListItemsQuery struct {
	ProspectID      string
	ClientNIT       string
	ClientName      string
	IncludeArchived bool
	Identifier      string
	AssignedToID    string
	// Fase 5c: campanita de facturación urgente. Con true el endpoint devuelve
	// SOLO los ítems marcados con priorityBilling, no todos los ítems de los
	// registros que tengan alguno marcado — que es el conteo que el dashboard
	// de facturación muestra en la campanita.
	PriorityBilling bool
	// La ficha "Nueva cotización" usa esto para no re-ofrecer equipos ya
	// vinculados a una cotización existente (selected_equipment_ids_json).
	// Al editar una cotización, ExceptQuoteID deja visibles los equipos de ESA
	// misma cotización para poder revisarlos y mantenerlos seleccionados.
	ExcludeQuoted bool
	ExceptQuoteID string
}

type InsightQuery struct {
	Reference       string
	Identifier      string
	IncludeArchived bool
}

type RecurrentFailureInsight struct {
	Label      string `json:"label"`
	Count      int    `json:"count"`
	Percentage int    `json:"percentage"`
	Evidence   string `json:"evidence"`
}

type EquipmentInsight struct {
	Source            string                    `json:"source"`
	Model             string                    `json:"model"`
	Reference         string                    `json:"reference"`
	Identifier        string                    `json:"identifier"`
	AnalyzedCases     int                       `json:"analyzedCases"`
	PresumedFailure   string                    `json:"presumedFailure"`
	Summary           string                    `json:"summary"`
	RecurrentFailures []RecurrentFailureInsight `json:"recurrentFailures"`
	Fallback          bool                      `json:"fallback"`
	GeneratedAt       string                    `json:"generatedAt"`
}

type ArchiveRequest struct {
	Archived bool `json:"archived"`
}

type TechnicianSummary struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Role        string `json:"role"`
	Department  string `json:"department"`
	ActiveItems int    `json:"activeItems"`
}

type AssignTechnicianRequest struct {
	AssignedToID string `json:"assignedToId"`
	AssignedTo   string `json:"assignedTo"`
	AssignedAt   string `json:"assignedAt"`
	AssignedBy   string `json:"assignedBy"`
}
