package quotes

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"
)

// FASE 6 — Código de cotización (COT-<año>-NNN) generado en el servidor.
//
// El código se asigna dentro de la MISMA transacción que el INSERT de la
// cotización, así las creaciones concurrentes nunca reciben el mismo número.
// El contador vive en document_sequences (compartido con finanzas) y es
// auto-reparador: toma un piso contra el máximo real de códigos guardados,
// por lo que los códigos manuales/legados nunca causan colisiones.

type sequenceQuerier interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

const commercialDocumentPrefixesKey = "commercial.document-prefixes"

// quoteMaxSequenceSQL: máximo real del periodo (año embebido en el código,
// p. ej. COT-2026-014). Los códigos legados sin ese patrón devuelven NULL y
// quedan excluidos del MAX; el cast es seguro porque la regex garantiza
// dígitos. $1=empresa, $2=periodo (año).
const quoteMaxSequenceSQL = `COALESCE((SELECT MAX(substring(codigo from '[0-9]+$')::int) FROM crm_quotes WHERE company_id = $1 AND soft_delete = false AND substring(codigo from '-([0-9]{4})-[0-9]+$') = $2), 0)`

// allocateQuoteCode consume el siguiente código de cotización del periodo de
// forma atómica y lo formatea como <prefijo>-<año>-NNN. Sin filas devuelve
// NNN=001; si un código manual dejó max=9 y el contador estaba en 6 devuelve
// 010 (salta el 9).
func allocateQuoteCode(ctx context.Context, q sequenceQuerier, companyID string, period string) (string, error) {
	var nextValue int
	// $2::text es obligatorio: sin el cast explícito Postgres no unifica los
	// tipos deducidos para el parámetro (varchar(10) de la columna vs text de
	// substring en el subquery) y falla con 42P08 "inconsistent types deduced".
	err := q.QueryRowContext(ctx, `
INSERT INTO document_sequences (company_id, doc_type, period, next_value)
VALUES ($1, 'quote', $2::text, GREATEST(2, `+quoteMaxSequenceSQL+` + 2))
ON CONFLICT (company_id, doc_type, period)
DO UPDATE SET next_value = GREATEST(document_sequences.next_value, `+quoteMaxSequenceSQL+` + 1) + 1
RETURNING next_value - 1;
`, companyID, period).Scan(&nextValue)
	if err != nil {
		return "", err
	}

	prefix, err := quoteCodePrefix(ctx, q, companyID)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s-%03d", prefix, period, nextValue), nil
}

// peekQuoteCode devuelve el código que recibiría la próxima cotización SIN
// consumirlo (vista previa del formulario). Dos consultas separadas: si la
// fila del contador no existe, ErrNoRows no descarta el MAX ya leído.
func peekQuoteCode(ctx context.Context, q sequenceQuerier, companyID string, period string) (string, error) {
	var maxSequence int
	if err := q.QueryRowContext(ctx, `SELECT `+quoteMaxSequenceSQL+`;`, companyID, period).Scan(&maxSequence); err != nil {
		return "", err
	}

	var nextValue int
	err := q.QueryRowContext(ctx, `
SELECT next_value
FROM document_sequences
WHERE company_id = $1 AND doc_type = 'quote' AND period = $2;
`, companyID, period).Scan(&nextValue)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			nextValue = maxSequence + 1
		} else {
			return "", err
		}
	}
	if nextValue < maxSequence+1 {
		nextValue = maxSequence + 1
	}

	prefix, err := quoteCodePrefix(ctx, q, companyID)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s-%03d", prefix, period, nextValue), nil
}

// quoteCodePrefix resuelve el prefijo base desde company_settings
// (commercial.document-prefixes, campo "quote"); sin configuración o con
// valor inválido cae a "COT".
func quoteCodePrefix(ctx context.Context, q sequenceQuerier, companyID string) (string, error) {
	var raw []byte
	err := q.QueryRowContext(ctx, `
SELECT value_json
FROM company_settings
WHERE company_id = $1 AND setting_key = $2;
`, companyID, commercialDocumentPrefixesKey).Scan(&raw)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return "COT", nil
		}
		return "", err
	}

	var prefixes struct {
		Quote string `json:"quote"`
	}
	if json.Unmarshal(raw, &prefixes) != nil {
		return "COT", nil
	}
	base := sanitizeCommercialPrefix(prefixes.Quote)
	if base == "" {
		return "COT", nil
	}
	return base, nil
}

var (
	commercialPrefixInvalidChars = regexp.MustCompile(`[^A-Z0-9-]`)
	commercialPrefixDashRuns     = regexp.MustCompile(`-+`)
)

// sanitizeCommercialPrefix espeja al frontend: mayúsculas, caracteres
// inválidos → "-", guiones consecutivos colapsados y sin guiones en los
// extremos. (Duplicado del de finanzas: los paquetes son independientes.)
func sanitizeCommercialPrefix(value string) string {
	normalized := strings.ToUpper(strings.TrimSpace(value))
	normalized = commercialPrefixInvalidChars.ReplaceAllString(normalized, "-")
	normalized = commercialPrefixDashRuns.ReplaceAllString(normalized, "-")
	return strings.Trim(normalized, "-")
}

// quoteCodePeriod: año de la fecha de la cotización. El frontend envía
// YYYY-MM-DD o DD/MM/YYYY según el campo; sin fecha válida usa el año actual.
func quoteCodePeriod(date string) string {
	trimmed := strings.TrimSpace(date)
	for _, layout := range []string{"2006-01-02", "02/01/2006"} {
		if parsed, err := time.Parse(layout, trimmed); err == nil {
			return fmt.Sprintf("%d", parsed.Year())
		}
	}
	return fmt.Sprintf("%d", time.Now().UTC().Year())
}

// PeekQuoteCode calcula el código que recibiría la próxima cotización sin
// consumirlo (el consumo real ocurre en UpsertQuote).
func (s *Service) PeekQuoteCode(companyID, date string) (string, error) {
	ctx := context.Background()
	return peekQuoteCode(ctx, s.db, companyID, quoteCodePeriod(date))
}
