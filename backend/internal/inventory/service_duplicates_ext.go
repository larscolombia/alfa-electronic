package inventory

import (
	"math"
	"strings"
)

const duplicateRejectMessage = "Posible referencia duplicada: revisa la referencia, el codigo interno o el proveedor antes de crear. Usa la entrada a stock sobre la ficha existente o confirma con forzar creacion."

// scoreDuplicateCandidates compara una ficha candidata contra el catalogo
// existente: similitud de referencia/designacion, codigo interno exacto y
// proveedor exacto (case-insensitive) son senales de duplicado.
func scoreDuplicateCandidates(refs []StockReference, reference, internalCode, designation, supplier string) []DuplicateCandidate {
	normRef := normalizeToken(reference)
	normDesig := normalizeToken(designation)
	normInternal := normalizeToken(internalCode)
	normSupplier := strings.ToLower(strings.TrimSpace(supplier))

	if normRef == "" {
		return []DuplicateCandidate{}
	}

	type candidate struct {
		ref    string
		desig  string
		score  float64
		reason string
	}

	candidates := make([]candidate, 0)
	for _, item := range refs {
		itemRef := normalizeToken(item.Reference)
		itemDesig := normalizeToken(item.Designation)

		exactMatch := itemRef == normRef
		refSim := similarity(itemRef, normRef)
		desigSim := 0.0
		if normDesig != "" {
			desigSim = similarity(itemDesig, normDesig)
		}
		prefixMatch := strings.HasPrefix(itemRef, normRef) || strings.HasPrefix(normRef, itemRef)

		score := 0.0
		reason := ""
		switch {
		case exactMatch:
			score, reason = 1.0, "Coincidencia exacta"
		case normInternal != "" && normalizeToken(item.InternalCode) == normInternal:
			score, reason = 1.0, "Codigo interno identico"
		case normSupplier != "" && strings.ToLower(strings.TrimSpace(item.PreferredSupplierName)) == normSupplier:
			score, reason = 1.0, "Proveedor identico"
		default:
			score = math.Max(refSim, math.Max(func() float64 {
				if prefixMatch {
					return 0.9
				}
				return 0
			}(), (refSim+desigSim)/2))
			switch {
			case prefixMatch:
				reason = "Prefijo/sufijo similar"
			case desigSim >= 0.8:
				reason = "Designacion con alta similitud"
			default:
				reason = "Referencia similar"
			}
		}

		if score < 0.72 {
			continue
		}
		candidates = append(candidates, candidate{ref: item.Reference, desig: item.Designation, score: score, reason: reason})
	}

	for i := 0; i < len(candidates); i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[j].score > candidates[i].score {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	limit := 5
	if len(candidates) < limit {
		limit = len(candidates)
	}
	result := make([]DuplicateCandidate, limit)
	for i := 0; i < limit; i++ {
		result[i] = DuplicateCandidate{
			Reference:   candidates[i].ref,
			Designation: candidates[i].desig,
			Similarity:  math.Round(candidates[i].score*100) / 100,
			Reason:      candidates[i].reason,
		}
	}
	return result
}
