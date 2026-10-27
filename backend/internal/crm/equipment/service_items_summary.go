package equipment

import (
	"fmt"
	"strings"
)

func flattenSummaries(records []Record) []Summary {
	summaries := make([]Summary, 0)

	for _, record := range records {
		receptionLabel := formatReceptionLabel(record)
		for _, item := range record.Items {
			repairStatus := normalizeRepairStatus(item.RepairStatus)
			repairStatusLabel := repairStatusLabelFor(repairStatus)

			family := strings.TrimSpace(item.FamilyName)
			marca := strings.TrimSpace(item.Marca)
			tipo := strings.TrimSpace(item.Tipo)
			serie := strings.TrimSpace(item.Serie)
			displayName := buildDisplayName(family, marca, tipo, serie)

			summaries = append(summaries, Summary{
				RecordID:                  record.ID,
				ItemID:                    item.ID,
				ProspectID:                record.ProspectID,
				ProspectName:              record.ProspectName,
				ReceptionLabel:            receptionLabel,
				ServiceTypeName:           strings.TrimSpace(item.ServiceTypeName),
				StorageLocationID:         strings.TrimSpace(item.StorageLocationID),
				StorageLocationName:       strings.TrimSpace(item.StorageLocationName),
				FamilyName:                family,
				Marca:                     marca,
				Tipo:                      tipo,
				Serie:                     serie,
				ReceivedIdentifier:        strings.TrimSpace(item.ReceivedIdentifier),
				CustomerShipmentReference: strings.TrimSpace(item.CustomerShipmentReference),
				Accessories:               strings.TrimSpace(item.Accessories),
				BorrowedEquipments:        borrowedDescriptions(item.BorrowedEquipments),
				FailureDescription:        strings.TrimSpace(item.FailureDescription),
				EvidenceCount:             len(item.EvidencePhotos),
				DisplayName:               displayName,
				RepairStatus:              repairStatus,
				RepairStatusLabel:         repairStatusLabel,
				RepairStatusUpdatedAt:     strings.TrimSpace(item.RepairStatusUpdatedAt),
				PriorityBilling:           item.PriorityBilling,
			})
		}
	}

	return summaries
}

func borrowedDescriptions(items []BorrowedEquipment) []string {
	if len(items) == 0 {
		return []string{}
	}
	descriptions := make([]string, 0, len(items))
	for _, item := range items {
		description := strings.TrimSpace(item.Description)
		if description == "" {
			description = strings.TrimSpace(item.Code)
		}
		if description != "" {
			descriptions = append(descriptions, description)
		}
	}
	return descriptions
}

func formatReceptionLabel(record Record) string {
	day := strings.TrimSpace(record.ReceptionDay)
	month := strings.TrimSpace(record.ReceptionMonth)
	year := strings.TrimSpace(record.ReceptionYear)
	if day == "" && month == "" && year == "" {
		return "--/--/----"
	}
	if day == "" {
		day = "--"
	}
	if month == "" {
		month = "--"
	}
	if year == "" {
		year = "----"
	}
	return fmt.Sprintf("%s/%s/%s", day, month, year)
}

func buildDisplayName(family, marca, tipo, serie string) string {
	parts := make([]string, 0, 4)
	for _, value := range []string{family, marca, tipo, serie} {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}

	if len(parts) == 0 {
		return "Equipo"
	}

	return strings.Join(parts, " · ")
}

func repairStatusLabelFor(status string) string {
	if label := repairStatusLabels[status]; label != "" {
		return label
	}
	return repairStatusLabels["recibido"]
}
