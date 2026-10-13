package equipment

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"time"
)

type insightCasePayload struct {
	Reference          string `json:"reference"`
	DisplayName        string `json:"displayName"`
	Marca              string `json:"marca"`
	Tipo               string `json:"tipo"`
	FamilyName         string `json:"familyName"`
	Identifier         string `json:"identifier"`
	Serie              string `json:"serie"`
	ServiceTypeName    string `json:"serviceTypeName"`
	FailureDescription string `json:"failureDescription"`
	RepairStatus       string `json:"repairStatus"`
	RepairStatusLabel  string `json:"repairStatusLabel"`
	RepairUpdatedAt    string `json:"repairUpdatedAt"`
}

func (s *Service) BuildInsight(companyID string, query InsightQuery) (EquipmentInsight, error) {
	normalizedReference := strings.TrimSpace(query.Reference)
	normalizedIdentifier := strings.TrimSpace(query.Identifier)
	includeArchived := query.IncludeArchived
	if normalizedReference == "" && normalizedIdentifier == "" {
		return EquipmentInsight{}, fmt.Errorf("reference o identifier son obligatorios")
	}

	records := make([]Record, 0)
	if recordID := parseRecordIDFromReference(normalizedReference); recordID != "" {
		record, err := s.GetRecord(companyID, recordID, includeArchived)
		if err == nil {
			records = append(records, record)
		}
	}

	if normalizedIdentifier != "" {
		matchedRecords, err := s.ListRecords(companyID, ListRecordsQuery{
			IncludeArchived: includeArchived,
			Identifier:      normalizedIdentifier,
		})
		if err != nil {
			return EquipmentInsight{}, err
		}
		records = append(records, matchedRecords...)
	}

	records = uniqueRecords(records)
	summaries := flattenSummaries(records)
	if len(summaries) == 0 {
		return s.fallbackInsight(normalizedReference, normalizedIdentifier, Summary{}, nil, 0, "No se encontraron casos para analizar."), nil
	}

	anchor := findAnchorSummary(summaries, normalizedReference, normalizedIdentifier)
	localRecurrent := aggregateRecurrentFailures(summaries)
	fallback := s.fallbackInsight(normalizedReference, normalizedIdentifier, anchor, localRecurrent, len(summaries), "")

	if s.insightClient == nil {
		return fallback, nil
	}

	payload := map[string]any{
		"identifier": normalizedIdentifier,
		"reference":  normalizedReference,
		"equipment": map[string]string{
			"displayName":     strings.TrimSpace(anchor.DisplayName),
			"marca":           strings.TrimSpace(anchor.Marca),
			"tipo":            strings.TrimSpace(anchor.Tipo),
			"familyName":      strings.TrimSpace(anchor.FamilyName),
			"serviceTypeName": strings.TrimSpace(anchor.ServiceTypeName),
			"receivedIdentifier": strings.TrimSpace(anchor.ReceivedIdentifier),
			"serie":              strings.TrimSpace(anchor.Serie),
		},
		"observedFailure": strings.TrimSpace(anchor.FailureDescription),
		"anchorCase":      buildInsightCasePayload(anchor),
		"requestTimestamp": time.Now().UTC().Format(time.RFC3339),
	}

	rawPayload, err := json.Marshal(payload)
	if err != nil {
		return fallback, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
	defer cancel()

	modelInsight, err := s.insightClient.Analyze(ctx, string(rawPayload))
	if err != nil {
		return fallback, nil
	}

	merged := fallback
	merged.Model = s.insightClient.model
	merged.Fallback = false

	if presumed := strings.TrimSpace(modelInsight.PresumedFailure); presumed != "" {
		merged.PresumedFailure = presumed
	}

	if summary := strings.TrimSpace(modelInsight.Summary); summary != "" {
		merged.Summary = summary
	}

	merged.RecurrentFailures = normalizeModelRecurrent(modelInsight.RecurrentFailure)
	if len(merged.RecurrentFailures) == 0 {
		merged.RecurrentFailures = localRecurrent
		merged.Fallback = true
	}

	return merged, nil
}

func (s *Service) fallbackInsight(
	reference string,
	identifier string,
	anchor Summary,
	recurrent []RecurrentFailureInsight,
	analyzedCases int,
	overrideSummary string,
) EquipmentInsight {
	normalizedIdentifier := strings.TrimSpace(identifier)
	if normalizedIdentifier == "" {
		normalizedIdentifier = strings.TrimSpace(anchor.ReceivedIdentifier)
	}
	if normalizedIdentifier == "" {
		normalizedIdentifier = strings.TrimSpace(anchor.Serie)
	}

	presumedFailure := strings.TrimSpace(anchor.FailureDescription)
	if presumedFailure == "" && len(recurrent) > 0 {
		presumedFailure = recurrent[0].Label
	}
	if presumedFailure == "" {
		presumedFailure = "No hay suficiente informacion para estimar una falla presumida confiable."
	}

	summary := strings.TrimSpace(overrideSummary)
	if summary == "" {
		summary = "Lubot AI preparó un resumen preliminar con reglas locales por falta de respuesta del modelo externo."
	}

	return EquipmentInsight{
		Source:            "Lubot AI",
		Model:             "local-rule",
		Reference:         reference,
		Identifier:        normalizedIdentifier,
		AnalyzedCases:     analyzedCases,
		PresumedFailure:   presumedFailure,
		Summary:           summary,
		RecurrentFailures: recurrent,
		Fallback:          true,
		GeneratedAt:       time.Now().UTC().Format(time.RFC3339),
	}
}

func parseRecordIDFromReference(reference string) string {
	normalized := strings.TrimSpace(reference)
	if normalized == "" {
		return ""
	}
	if !strings.Contains(normalized, "::") {
		return ""
	}
	parts := strings.SplitN(normalized, "::", 2)
	return strings.TrimSpace(parts[0])
}

func uniqueRecords(records []Record) []Record {
	if len(records) == 0 {
		return records
	}

	byID := make(map[string]Record, len(records))
	for _, record := range records {
		id := strings.TrimSpace(record.ID)
		if id == "" {
			continue
		}
		if _, exists := byID[id]; !exists {
			byID[id] = record
		}
	}

	unique := make([]Record, 0, len(byID))
	for _, item := range byID {
		unique = append(unique, item)
	}

	sort.Slice(unique, func(left, right int) bool {
		return strings.Compare(unique[left].UpdatedAt, unique[right].UpdatedAt) > 0
	})

	return unique
}

func findAnchorSummary(summaries []Summary, reference string, identifier string) Summary {
	normalizedReference := strings.TrimSpace(reference)
	if normalizedReference != "" {
		for _, summary := range summaries {
			if summaryReference(summary) == normalizedReference {
				return summary
			}
		}
	}

	normalizedIdentifier := normalizeIdentifier(identifier)
	if normalizedIdentifier != "" {
		for _, summary := range summaries {
			if matchesSummaryIdentifier(summary, normalizedIdentifier) {
				return summary
			}
		}
	}

	return summaries[0]
}

func aggregateRecurrentFailures(summaries []Summary) []RecurrentFailureInsight {
	type failureCounter struct {
		label string
		count int
	}

	counts := make(map[string]*failureCounter)
	total := 0
	for _, summary := range summaries {
		label := normalizeFailureLabel(summary.FailureDescription)
		if label == "" {
			continue
		}

		total++
		key := normalizeIdentifier(label)
		counter, exists := counts[key]
		if !exists {
			counts[key] = &failureCounter{label: label, count: 1}
			continue
		}
		counter.count++
	}

	if total == 0 {
		return nil
	}

	items := make([]failureCounter, 0, len(counts))
	for _, item := range counts {
		items = append(items, *item)
	}

	sort.Slice(items, func(left, right int) bool {
		if items[left].count != items[right].count {
			return items[left].count > items[right].count
		}
		return strings.Compare(items[left].label, items[right].label) < 0
	})

	if len(items) > 5 {
		items = items[:5]
	}

	result := make([]RecurrentFailureInsight, 0, len(items))
	for _, item := range items {
		percentage := int(float64(item.count) / float64(total) * 100)
		if percentage < 1 {
			percentage = 1
		}
		result = append(result, RecurrentFailureInsight{
			Label:      item.label,
			Count:      item.count,
			Percentage: percentage,
			Evidence:   "Patron detectado en historial tecnico",
		})
	}

	return result
}

func normalizeModelRecurrent(modelItems []modelRecurrentFailure) []RecurrentFailureInsight {
	if len(modelItems) == 0 {
		return nil
	}

	result := make([]RecurrentFailureInsight, 0, len(modelItems))
	total := 0
	for _, item := range modelItems {
		label := normalizeFailureLabel(item.Label)
		if label == "" {
			continue
		}

		count := item.Count
		if count <= 0 {
			count = 1
		}

		total += count
		result = append(result, RecurrentFailureInsight{
			Label:      label,
			Count:      count,
			Percentage: 0,
			Evidence:   strings.TrimSpace(item.Evidence),
		})
	}

	if len(result) == 0 {
		return nil
	}

	if len(result) > 5 {
		result = result[:5]
	}

	if total <= 0 {
		total = len(result)
	}
	for index := range result {
		percentage := int(float64(result[index].Count) / float64(total) * 100)
		if percentage < 1 {
			percentage = 1
		}
		result[index].Percentage = percentage
	}

	return result
}

func buildInsightCasesPayload(summaries []Summary) []insightCasePayload {
	items := make([]insightCasePayload, 0, len(summaries))
	for _, summary := range summaries {
		items = append(items, buildInsightCasePayload(summary))
	}
	return items
}

func buildInsightCasePayload(summary Summary) insightCasePayload {
	return insightCasePayload{
		Reference:          summaryReference(summary),
		DisplayName:        strings.TrimSpace(summary.DisplayName),
		Marca:              strings.TrimSpace(summary.Marca),
		Tipo:               strings.TrimSpace(summary.Tipo),
		FamilyName:         strings.TrimSpace(summary.FamilyName),
		Identifier:         strings.TrimSpace(summary.ReceivedIdentifier),
		Serie:              strings.TrimSpace(summary.Serie),
		ServiceTypeName:    strings.TrimSpace(summary.ServiceTypeName),
		FailureDescription: strings.TrimSpace(summary.FailureDescription),
		RepairStatus:       strings.TrimSpace(summary.RepairStatus),
		RepairStatusLabel:  strings.TrimSpace(summary.RepairStatusLabel),
		RepairUpdatedAt:    strings.TrimSpace(summary.RepairStatusUpdatedAt),
	}
}

func summaryReference(summary Summary) string {
	recordID := strings.TrimSpace(summary.RecordID)
	itemID := strings.TrimSpace(summary.ItemID)
	if recordID == "" || itemID == "" {
		return ""
	}
	return recordID + "::" + itemID
}

func matchesSummaryIdentifier(summary Summary, normalizedIdentifier string) bool {
	if normalizedIdentifier == "" {
		return false
	}

	candidates := []string{summary.ReceivedIdentifier, summary.Serie, summary.CustomerShipmentReference}
	for _, candidate := range candidates {
		if normalizeIdentifier(candidate) == normalizedIdentifier {
			return true
		}
	}

	return false
}

func normalizeIdentifier(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func normalizeFailureLabel(value string) string {
	trimmed := strings.TrimSpace(strings.ReplaceAll(value, "\n", " "))
	if trimmed == "" {
		return ""
	}
	trimmed = strings.Join(strings.Fields(trimmed), " ")
	if len(trimmed) <= 130 {
		return trimmed
	}
	return trimmed[:127] + "..."
}
