package equipment

import (
	"fmt"
	"strings"
)

// buildProspectMatchFilters arma las clausulas (OR) para asociar equipos a un
// prospecto: match directo por prospect_id (UUID en texto) o por datos del
// cliente (nit / nombre de empresa), de modo que las recepciones directas
// (prospect_id = '-9000') del mismo cliente tambien aparezcan.
// Postgres 12: los parametros se referencian con cast explicito $n::text
// porque la columna prospect_id es TEXT y el driver envia tipos ambiguos.
func buildProspectMatchFilters(query ListRecordsQuery, nextArg int) ([]string, []any, int) {
	filters := make([]string, 0, 3)
	args := make([]any, 0, 3)

	prospectID := normalizeProspectIDFilter(query.ProspectID)
	if prospectID != "" {
		filters = append(filters, fmt.Sprintf("prospect_id = $%d::text", nextArg))
		args = append(args, prospectID)
		nextArg++
	}

	clientNIT := strings.TrimSpace(query.ClientNIT)
	if clientNIT != "" {
		filters = append(filters, fmt.Sprintf("nit <> '' AND lower(btrim(nit)) = lower(btrim($%d::text))", nextArg))
		args = append(args, clientNIT)
		nextArg++
	}

	clientName := strings.TrimSpace(query.ClientName)
	if clientName != "" {
		filters = append(filters, fmt.Sprintf("company_name <> '' AND lower(btrim(company_name)) = lower(btrim($%d::text))", nextArg))
		args = append(args, clientName)
		nextArg++
	}

	return filters, args, nextArg
}

// normalizeProspectIDFilter devuelve el prospect_id a filtrar; "" y "0"
// significan "sin filtro por prospecto".
func normalizeProspectIDFilter(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "0" {
		return ""
	}
	return trimmed
}
