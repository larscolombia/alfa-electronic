package equipment

import (
	"strings"
	"time"
)

// normalizeItemEdgeFlags aplica las reglas REC-03 y REC-06 a REC-13 sobre el
// ítem ya recortado: banderas derivadas de las respuestas del cliente y del
// estado de identificación del remitente. Idempotente: se reaplica al leer.
func normalizeItemEdgeFlags(entry Item) Item {
	entry.SerieExceptionReason = strings.TrimSpace(entry.SerieExceptionReason)

	if entry.CustodyIncident != nil {
		incident := *entry.CustodyIncident
		incident.PhotosNote = strings.TrimSpace(incident.PhotosNote)
		incident.Responsible = strings.TrimSpace(incident.Responsible)
		incident.CreatedAt = strings.TrimSpace(incident.CreatedAt)
		if incident.CreatedAt == "" {
			incident.CreatedAt = time.Now().UTC().Format(time.RFC3339)
		}
		if incident.PhotosNote == "" && incident.Responsible == "" {
			entry.CustodyIncident = nil
		} else {
			entry.CustodyIncident = &incident
		}
	}

	entry.BorrowedEquipments = normalizeBorrowedEquipments(entry.BorrowedEquipments)

	// REC-11: sin descripción de falla y con remitente identificado, la falla
	// queda pendiente por diligenciar. Con remitente desconocido no aplica.
	entry.FailurePending = entry.FailureDescription == "" && !entry.SenderUnknown

	// REC-12/REC-13: las respuestas del cliente usan "Sí"/"No" (frontend).
	entry.SoftwareSuspicion = answerIsNegative(entry.Answers["softwareIssueRuledOut"])
	entry.PreviousIntervention = answerIsAffirmative(entry.Answers["previousRepairAttempt"]) ||
		answerIsAffirmative(entry.Answers["partsRemovedAsSpare"])

	if entry.DuplicateConfirm != nil {
		confirm := *entry.DuplicateConfirm
		confirm.Reason = strings.TrimSpace(confirm.Reason)
		confirm.Relation = strings.ToLower(strings.TrimSpace(confirm.Relation))
		entry.DuplicateConfirm = &confirm
	}

	return entry
}

func normalizeBorrowedEquipments(items []BorrowedEquipment) []BorrowedEquipment {
	if len(items) == 0 {
		return []BorrowedEquipment{}
	}

	normalized := make([]BorrowedEquipment, 0, len(items))
	for _, raw := range items {
		entry := raw
		entry.Code = strings.TrimSpace(entry.Code)
		entry.Description = strings.TrimSpace(entry.Description)
		if entry.Code == "" && entry.Description == "" {
			continue
		}
		if entry.Code == "" {
			entry.Code = generateBorrowedCode()
		}
		normalized = append(normalized, entry)
	}
	return normalized
}

func answerIsAffirmative(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "sí", "si", "yes", "true", "1":
		return true
	}
	return false
}

func answerIsNegative(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "no", "false", "0":
		return true
	}
	return false
}
