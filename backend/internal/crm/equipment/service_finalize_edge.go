package equipment

import (
	"errors"
	"fmt"
	"strings"
)

var (
	errSerialPlateEvidenceRequired   = errors.New("placa o serie ilegible: se requiere foto de placa (serial-plate) y motivo de excepcion")
	errAccessoriesEvidenceRequired   = errors.New("equipo con accesorios: se requiere evidencia fotografica de accesorios")
	errVisibleDamageEvidenceRequired = errors.New("dano visible reportado: se requiere evidencia de dano visible con nota y confirmacion del cliente")
)

// validateItemEdgeEvidence exige, por ítem, la evidencia que acompaña los
// casos de borde declarados en recepción (REC-06, REC-07, REC-10).
func validateItemEdgeEvidence(items []Item) error {
	for _, item := range items {
		label := itemLabel(item)

		if item.IdentifierLabelIssue &&
			(!hasEvidenceType(item.EvidencePhotos, "serial-plate") ||
				strings.TrimSpace(item.SerieExceptionReason) == "") {
			return fmt.Errorf("%w: %s", errSerialPlateEvidenceRequired, label)
		}

		if strings.TrimSpace(item.Accessories) != "" && !hasEvidenceType(item.EvidencePhotos, "accessories") {
			return fmt.Errorf("%w: %s", errAccessoriesEvidenceRequired, label)
		}

		if item.VisibleDamageReported &&
			(!hasVisibleDamageEvidence(item) || !item.VisibleDamageConfirmed) {
			return fmt.Errorf("%w: %s", errVisibleDamageEvidenceRequired, label)
		}
	}

	return nil
}

func hasEvidenceType(photos []EvidencePhoto, evidenceType string) bool {
	for _, photo := range photos {
		if strings.EqualFold(strings.TrimSpace(photo.EvidenceType), evidenceType) {
			return true
		}
	}
	return false
}

func hasVisibleDamageEvidence(item Item) bool {
	for _, photo := range item.EvidencePhotos {
		if strings.EqualFold(strings.TrimSpace(photo.EvidenceType), "visible-damage") &&
			strings.TrimSpace(photo.Notes) != "" {
			return true
		}
	}
	return false
}
