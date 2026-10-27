package equipment

import (
	"errors"
	"fmt"
	"sort"
	"strings"
)

var errFinalizeEvidenceFacesRequired = errors.New("faltan evidencias por cara obligatorias")

var requiredEvidenceFaces = []string{"face-front", "face-back", "face-left", "face-right"}

func (s *Service) FinalizeRecord(companyID, recordID string) (Record, error) {
	normalizedRecordID := strings.TrimSpace(recordID)
	if normalizedRecordID == "" {
		return Record{}, errRecordIDRequired
	}

	record, err := s.GetRecord(companyID, normalizedRecordID, false)
	if err != nil {
		return Record{}, err
	}

	if err := validateIntakeTransportadora(record); err != nil {
		return Record{}, err
	}

	if err := validateRequiredFaceEvidence(record.Items); err != nil {
		return Record{}, err
	}

	if err := validateItemEdgeEvidence(record.Items); err != nil {
		return Record{}, err
	}

	if err := s.checkDuplicateIdentifiers(companyID, record); err != nil {
		return Record{}, err
	}

	return record, nil
}

func validateRequiredFaceEvidence(items []Item) error {
	for _, item := range items {
		missing := missingRequiredFaceEvidence(item.EvidencePhotos)
		if len(missing) == 0 {
			continue
		}

		return fmt.Errorf("%w: %s (%s)", errFinalizeEvidenceFacesRequired, strings.Join(missing, ", "), itemLabel(item))
	}

	return nil
}

func itemLabel(item Item) string {
	label := strings.TrimSpace(item.ReceivedIdentifier)
	if label == "" {
		label = strings.TrimSpace(item.Serie)
	}
	if label == "" {
		label = strings.TrimSpace(item.ID)
	}
	if label == "" {
		label = "equipo"
	}
	return label
}

func missingRequiredFaceEvidence(photos []EvidencePhoto) []string {
	if len(requiredEvidenceFaces) == 0 {
		return nil
	}

	seen := make(map[string]bool, len(photos))
	for _, photo := range photos {
		evidenceType := strings.TrimSpace(strings.ToLower(photo.EvidenceType))
		if evidenceType == "" {
			continue
		}
		seen[evidenceType] = true
	}

	missing := make([]string, 0, len(requiredEvidenceFaces))
	for _, requiredType := range requiredEvidenceFaces {
		if seen[requiredType] {
			continue
		}
		missing = append(missing, requiredType)
	}

	sort.Strings(missing)
	return missing
}
