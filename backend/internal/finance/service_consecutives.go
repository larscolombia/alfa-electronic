package finance

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// FASE 6 — Consecutivos y prefijos de serie generados en el servidor.
//
// Antes el navegador calculaba MAX()+1 y lo enviaba: dos usuarios (o dos
// pestañas) podían recibir el mismo número, y la vista previa del "próximo
// número" era mentira en cuanto otro guardaba. Ahora el contador vive en
// document_sequences y se avanza dentro de la MISMA sentencia que lo lee
// (INSERT ... ON CONFLICT ... RETURNING), así las creaciones concurrentes
// siempre reciben números distintos.
//
// La asignación es auto-reparadora: toma un piso contra el
// MAX(sequence_number) real del periodo, por lo que los overrides explícitos
// (números manuales de Oasis) nunca causan colisiones y no hace falta siembra
// inicial en el arranque.

type sequenceQuerier interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

const commercialDocumentPrefixesKey = "commercial.document-prefixes"

// invoiceMaxSequenceSQL: máximo real del periodo (año de issue_date). Se
// reutiliza en el INSERT y en la rama ON CONFLICT; $1=empresa, $2=periodo.
const invoiceMaxSequenceSQL = `COALESCE((SELECT MAX(sequence_number) FROM finance_invoices WHERE company_id = $1 AND soft_delete = false AND to_char(issue_date, 'YYYY') = $2), 0)`

// allocateInvoiceSequence consume el siguiente número de factura del periodo
// de forma atómica. Sin filas devuelve 1; con max=5 devuelve 6; si un override
// manual dejó max=9 y el contador estaba en 6 devuelve 10 (salta el 9).
func allocateInvoiceSequence(ctx context.Context, q sequenceQuerier, companyID, period string) (int, error) {
	var sequence int
	// $2::text es obligatorio: sin el cast explícito Postgres no unifica los
	// tipos deducidos para el parámetro (varchar(10) de la columna vs text de
	// to_char en el subquery) y falla con 42P08 "inconsistent types deduced".
	err := q.QueryRowContext(ctx, `
INSERT INTO document_sequences (company_id, doc_type, period, next_value)
VALUES ($1, 'invoice', $2::text, GREATEST(2, `+invoiceMaxSequenceSQL+` + 2))
ON CONFLICT (company_id, doc_type, period)
DO UPDATE SET next_value = GREATEST(document_sequences.next_value, `+invoiceMaxSequenceSQL+` + 1) + 1
RETURNING next_value - 1;
`, companyID, period).Scan(&sequence)
	if err != nil {
		return 0, err
	}
	return sequence, nil
}

// peekInvoiceSequence devuelve el número que recibiría la próxima factura
// SIN consumirlo (vista previa del formulario).
func peekInvoiceSequence(ctx context.Context, q sequenceQuerier, companyID, period string) (int, error) {
	var maxSequence int
	if err := q.QueryRowContext(ctx, `SELECT `+invoiceMaxSequenceSQL+`;`, companyID, period).Scan(&maxSequence); err != nil {
		return 0, err
	}

	var nextValue int
	err := q.QueryRowContext(ctx, `
SELECT next_value
FROM document_sequences
WHERE company_id = $1 AND doc_type = 'invoice' AND period = $2;
`, companyID, period).Scan(&nextValue)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return maxSequence + 1, nil
		}
		return 0, err
	}
	if nextValue > maxSequence+1 {
		return nextValue, nil
	}
	return maxSequence + 1, nil
}

// resolveInvoiceSeriesPrefix resuelve el prefijo de serie en este orden:
// base configurada en company_settings (commercial.document-prefixes) → serie
// de la factura más reciente (continuidad con documentos existentes) →
// "FAC-<año>-" por defecto.
func resolveInvoiceSeriesPrefix(ctx context.Context, q sequenceQuerier, companyID string, issueDate time.Time) (string, error) {
	year := strconv.Itoa(issueDate.Year())

	var raw []byte
	err := q.QueryRowContext(ctx, `
SELECT value_json
FROM company_settings
WHERE company_id = $1 AND setting_key = $2;
`, companyID, commercialDocumentPrefixesKey).Scan(&raw)
	if err == nil {
		var prefixes struct {
			Invoice string `json:"invoice"`
		}
		if json.Unmarshal(raw, &prefixes) == nil {
			base := sanitizeCommercialPrefix(prefixes.Invoice)
			if base != "" {
				return base + "-" + year + "-", nil
			}
		}
	} else if !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	var lastPrefix string
	err = q.QueryRowContext(ctx, `
SELECT series_prefix
FROM finance_invoices
WHERE company_id = $1 AND soft_delete = false AND series_prefix <> ''
ORDER BY created_at DESC, id DESC
LIMIT 1;
`, companyID).Scan(&lastPrefix)
	if err == nil {
		return lastPrefix, nil
	} else if !errors.Is(err, sql.ErrNoRows) {
		return "", err
	}

	return "FAC-" + year + "-", nil
}

var (
	commercialPrefixInvalidChars = regexp.MustCompile(`[^A-Z0-9-]`)
	commercialPrefixDashRuns     = regexp.MustCompile(`-+`)
)

// sanitizeCommercialPrefix espeja al frontend: mayúsculas, caracteres
// inválidos → "-", guiones consecutivos colapsados y sin guiones en los
// extremos. Devuelve "" si no queda nada (el llamador aplica su fallback).
func sanitizeCommercialPrefix(value string) string {
	normalized := strings.ToUpper(strings.TrimSpace(value))
	normalized = commercialPrefixInvalidChars.ReplaceAllString(normalized, "-")
	normalized = commercialPrefixDashRuns.ReplaceAllString(normalized, "-")
	return strings.Trim(normalized, "-")
}

// invoiceSequencePeriod: año de la fecha de emisión (semántica FAC-<año>-NNN);
// si la fecha falta o es inválida usa el año actual.
func invoiceSequencePeriod(issueDate string) string {
	if parsed, err := time.Parse("2006-01-02", strings.TrimSpace(issueDate)); err == nil {
		return strconv.Itoa(parsed.Year())
	}
	return strconv.Itoa(time.Now().UTC().Year())
}

// parseInvoiceIssueTime es el par temporal de invoiceSequencePeriod para las
// resoluciones que necesitan un time.Time (prefijo de serie).
func parseInvoiceIssueTime(issueDate string) time.Time {
	if parsed, err := time.Parse("2006-01-02", strings.TrimSpace(issueDate)); err == nil {
		return parsed
	}
	return time.Now().UTC()
}

// InvoiceSequencePreview es la respuesta de POST /finance/invoices/allocate-sequence.
type InvoiceSequencePreview struct {
	SeriesPrefix   string `json:"seriesPrefix"`
	SequenceNumber int    `json:"sequenceNumber"`
}

// PeekInvoiceSequence calcula el prefijo y número que recibiría la próxima
// factura sin consumir el contador (el consumo real ocurre en CreateInvoice).
func (s *Service) PeekInvoiceSequence(companyID, date string) (InvoiceSequencePreview, error) {
	ctx := context.Background()
	issueDate := time.Now().UTC()
	if trimmed := strings.TrimSpace(date); trimmed != "" {
		parsed, err := time.Parse("2006-01-02", trimmed)
		if err != nil {
			return InvoiceSequencePreview{}, errInvoiceDateInvalid
		}
		issueDate = parsed
	}

	sequence, err := peekInvoiceSequence(ctx, s.db, companyID, strconv.Itoa(issueDate.Year()))
	if err != nil {
		return InvoiceSequencePreview{}, err
	}
	prefix, err := resolveInvoiceSeriesPrefix(ctx, s.db, companyID, issueDate)
	if err != nil {
		return InvoiceSequencePreview{}, err
	}
	return InvoiceSequencePreview{SeriesPrefix: prefix, SequenceNumber: sequence}, nil
}
