package equipment

import (
	"errors"
	"strings"
	"time"
)

func normalizeRecord(record Record) Record {
	record.SourceContext = normalizeSourceContext(record.SourceContext)
	record.ID = strings.TrimSpace(record.ID)
	record.ProspectID = normalizeStoredProspectID(record.ProspectID)
	record.ProspectName = strings.TrimSpace(record.ProspectName)
	record.ReceptionDay = strings.TrimSpace(record.ReceptionDay)
	record.ReceptionMonth = strings.TrimSpace(record.ReceptionMonth)
	record.ReceptionYear = strings.TrimSpace(record.ReceptionYear)
	record.IntakeMethod = normalizeIntakeMethod(record.IntakeMethod)
	record.IntakeCarrier = strings.TrimSpace(record.IntakeCarrier)
	record.IntakeTrackingNumber = strings.TrimSpace(record.IntakeTrackingNumber)
	record.IntakeReceivedAt = strings.TrimSpace(record.IntakeReceivedAt)
	record.CompanyName = strings.TrimSpace(record.CompanyName)
	record.SourceBranchName = strings.TrimSpace(record.SourceBranchName)
	record.NIT = strings.TrimSpace(record.NIT)
	record.Phone = strings.TrimSpace(record.Phone)
	record.Address = strings.TrimSpace(record.Address)
	record.City = strings.TrimSpace(record.City)
	record.ContactName = strings.TrimSpace(record.ContactName)
	record.ContactRole = strings.TrimSpace(record.ContactRole)
	record.Cellphone = strings.TrimSpace(record.Cellphone)
	record.Email = strings.TrimSpace(record.Email)
	record.ClientSignature = strings.TrimSpace(record.ClientSignature)
	record.PikaSignature = strings.TrimSpace(record.PikaSignature)
	record.AssignedTo = strings.TrimSpace(record.AssignedTo)
	record.Items = normalizeItems(record.Items)

	if record.IntakeMethod != "transportadora" {
		record.IntakeCarrier = ""
		record.IntakeTrackingNumber = ""
	}

	if record.CreatedAt == "" {
		record.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	}
	if record.UpdatedAt == "" {
		record.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	}

	return record
}

func normalizeItems(items []Item) []Item {
	normalized := make([]Item, 0, len(items))

	for _, item := range items {
		entry := item
		entry.ID = strings.TrimSpace(entry.ID)
		entry.RegistrationMode = normalizeRegistrationMode(entry.RegistrationMode)
		entry.EquipmentModelID = strings.TrimSpace(entry.EquipmentModelID)
		if entry.IsIndustrial == nil {
			defaultIndustrial := true
			entry.IsIndustrial = &defaultIndustrial
		}
		entry.ServiceTypeID = strings.TrimSpace(entry.ServiceTypeID)
		entry.ServiceTypeName = strings.TrimSpace(entry.ServiceTypeName)
		entry.StorageLocationID = strings.TrimSpace(entry.StorageLocationID)
		entry.StorageLocationName = strings.TrimSpace(entry.StorageLocationName)
		entry.FamilyID = strings.TrimSpace(entry.FamilyID)
		entry.FamilyName = strings.TrimSpace(entry.FamilyName)
		entry.Marca = strings.TrimSpace(entry.Marca)
		entry.Tipo = strings.TrimSpace(entry.Tipo)
		entry.Serie = strings.TrimSpace(entry.Serie)
		entry.ReceivedIdentifier = strings.TrimSpace(entry.ReceivedIdentifier)
		entry.ReceivedIdentifierType = strings.TrimSpace(entry.ReceivedIdentifierType)
		entry.ReceivedIdentifierSource = normalizeIdentifierSource(entry.ReceivedIdentifierSource)
		entry.ReceivedIdentifierCaptured = strings.TrimSpace(entry.ReceivedIdentifierCaptured)
		entry.CustomerShipmentReference = strings.TrimSpace(entry.CustomerShipmentReference)
		entry.Accessories = strings.TrimSpace(entry.Accessories)
		entry.FailureDescription = strings.TrimSpace(entry.FailureDescription)
		entry.AssignedTo = strings.TrimSpace(entry.AssignedTo)
		entry.AssignedToID = strings.TrimSpace(entry.AssignedToID)
		entry.AssignedAt = strings.TrimSpace(entry.AssignedAt)
		entry.AssignedBy = strings.TrimSpace(entry.AssignedBy)
		entry.IndustrialOverrideAuthorizedBy = strings.TrimSpace(entry.IndustrialOverrideAuthorizedBy)
		entry.IndustrialOverrideReason = strings.TrimSpace(entry.IndustrialOverrideReason)
		entry.IndustrialOverrideAt = strings.TrimSpace(entry.IndustrialOverrideAt)
		entry.RepairStatus = normalizeRepairStatus(entry.RepairStatus)
		entry.RepairStatusUpdatedAt = strings.TrimSpace(entry.RepairStatusUpdatedAt)
		entry.RepairStatusUpdatedBy = strings.TrimSpace(entry.RepairStatusUpdatedBy)
		if entry.IndustrialOverrideAuthorizedBy == "" {
			entry.IndustrialOverrideAt = ""
		}
		if entry.Answers == nil {
			entry.Answers = map[string]string{}
		}
		if entry.EvidencePhotos == nil {
			entry.EvidencePhotos = make([]EvidencePhoto, 0)
		}
		entry.Attachments = normalizeAttachments(entry.Attachments)
		entry = normalizeItemEdgeFlags(entry)

		normalized = append(normalized, entry)
	}

	return normalized
}

func normalizeAttachments(items []Attachment) []Attachment {
	if len(items) == 0 {
		return make([]Attachment, 0)
	}
	normalized := make([]Attachment, 0, len(items))
	for _, raw := range items {
		entry := raw
		entry.ID = strings.TrimSpace(entry.ID)
		entry.AttachmentType = strings.TrimSpace(entry.AttachmentType)
		entry.FileName = strings.TrimSpace(entry.FileName)
		entry.MIMEType = strings.TrimSpace(entry.MIMEType)
		entry.Notes = strings.TrimSpace(entry.Notes)
		entry.UploadedAt = strings.TrimSpace(entry.UploadedAt)
		entry.UploadedBy = strings.TrimSpace(entry.UploadedBy)
		entry.SHA256 = strings.TrimSpace(entry.SHA256)
		if entry.SizeBytes < 0 {
			entry.SizeBytes = 0
		}
		if entry.ID == "" || entry.DataURL == "" {
			continue
		}
		normalized = append(normalized, entry)
	}
	return normalized
}

func normalizeSourceContext(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "work") {
		return "work"
	}
	return "crm"
}

// normalizeStoredProspectID normaliza el prospect_id persistido; vacio se
// guarda como "0" (la columna es NOT NULL con default '0').
func normalizeStoredProspectID(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "0"
	}
	return trimmed
}

func normalizeIntakeMethod(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "transportadora") {
		return "transportadora"
	}
	return "personal"
}

func normalizeRegistrationMode(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "manual") {
		return "manual"
	}
	return "catalog"
}

func normalizeIdentifierSource(value string) string {
	if strings.EqualFold(strings.TrimSpace(value), "camera-scan") {
		return "camera-scan"
	}
	return "manual"
}

func normalizeRepairStatus(value string) string {
	normalized := strings.TrimSpace(strings.ToLower(value))
	// Estado legado del flujo QA eliminado: se normaliza al estado vivo mas
	// cercano en vez de caer a 'recibido' (misma semantica que el store CRM).
	if normalized == "pruebas" {
		return "reparacion"
	}
	if _, ok := repairStatusLabels[normalized]; ok {
		return normalized
	}
	return "recibido"
}

func trimValues(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	result := make([]string, 0, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func parseOptionalISO(value string) (time.Time, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return time.Time{}, errors.New("fecha y hora vacias")
	}

	if parsed, err := time.Parse(time.RFC3339Nano, trimmed); err == nil {
		return parsed.UTC(), nil
	}
	if parsed, err := time.Parse(time.RFC3339, trimmed); err == nil {
		return parsed.UTC(), nil
	}

	return time.Time{}, errors.New("fecha y hora invalidas")
}
