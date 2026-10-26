package finance

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// moneyEpsilon es el margen de tolerancia para comparaciones de dinero en float64.
const moneyEpsilon = 0.01

// queryExecutor lo satisfacen tanto *sql.DB como *sql.Tx, así la misma lógica de
// sincronización corre dentro de una transacción (CRUD de pagos) o aislada (tests).
type queryExecutor interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

// seriesKey normaliza un prefijo de serie para compararlo contra códigos tipo
// "FAC-2026-31": parseInvoiceCode deja un guion separador al final del prefijo y la BD
// puede guardarlo con o sin ese guion ("FAC-2026" / "FAC-2026-"). Homogeneiza ambos lados.
func seriesKey(prefix string) string {
	return strings.TrimRight(strings.ToUpper(strings.TrimSpace(prefix)), "-")
}

// parseInvoiceCode extrae el prefijo de serie y la secuencia numérica de un código
// tipo "FAC-2026-031". Tolerante a padding distinto ("FAC-2026-31", "FAC-2026-000031"):
// el emparejamiento se hace SIEMPRE numérico, nunca por comparación de cadenas.
func parseInvoiceCode(code string) (prefix string, sequence int64, ok bool) {
	trimmed := strings.ToUpper(strings.TrimSpace(code))
	if trimmed == "" {
		return "", 0, false
	}

	digitsStart := len(trimmed)
	for digitsStart > 0 && trimmed[digitsStart-1] >= '0' && trimmed[digitsStart-1] <= '9' {
		digitsStart--
	}
	if digitsStart == len(trimmed) || digitsStart == 0 {
		return "", 0, false // termina en no-dígito o es todo dígito → no parseable como código de factura
	}

	seq, err := strconv.ParseInt(trimmed[digitsStart:], 10, 64)
	if err != nil || seq <= 0 {
		return "", 0, false
	}
	return trimmed[:digitsStart], seq, true
}

// deriveInvoicePaymentStatus aplica la matriz de estados (plan F2 §1.3):
//   - Cancelado → nunca se toca.
//   - Pagos contados >= total → "Pagado".
//   - 0 < pagado < total → "Pago parcial".
//   - Sin pagos contados: "Pagado"/"Pago parcial" bajan a "Pendiente"; el resto se mantiene.
func deriveInvoicePaymentStatus(current InvoiceStatus, paidAmount, invoiceTotal float64) InvoiceStatus {
	if current == InvoiceStatusCancelled {
		return InvoiceStatusCancelled
	}
	if paidAmount > moneyEpsilon {
		if invoiceTotal <= moneyEpsilon || paidAmount >= invoiceTotal-moneyEpsilon {
			return InvoiceStatusPaid
		}
		return InvoiceStatusPartial
	}
	switch current {
	case InvoiceStatusPaid, InvoiceStatusPartial:
		return InvoiceStatusPending // no puede quedar "Pagado" sin ningún pago contable
	default:
		return current // Borrador / Pendiente / Enviado → se mantienen
	}
}

type invoiceSnapshot struct {
	ID             int64
	Status         InvoiceStatus
	Total          float64
	BalanceAmount  float64
	PaidAmount     float64
	DocumentType   string
	SeriesPrefix   string
	SequenceNumber int64
}

// enforceOverbalanceGuard (F1): si el código resuelve a una factura real no cancelada,
// el monto del pago no puede superar lo pendiente por pagar EN EFECTIVO, o sea
// total − Σ(amount) de los pagos contables de la misma factura. En updates, el
// tope incluye el monto actual del propio pago cuando este ya cuenta en el
// acumulado (se puede subir hasta agotar el cupo, no más). Códigos libres /
// facturas canceladas → sin guardrail (compatibilidad legacy).
//
// Decisión de diseño (t14): el tope se mide sobre los MONTOS y no sobre el
// saldo sincronizado, porque el saldo ya descuenta las retenciones valorizadas:
// tras un pago de total−4% con retefuente declarada el saldo es 0, y el pago
// complementario del 4% retenido (que la práctica colombiana registra aparte)
// quedaría bloqueado si el guard mirara el saldo. Las retenciones créditan la
// factura hasta agotarla y el sync las acota al total.
func (s *Service) enforceOverbalanceGuard(ctx context.Context, qe queryExecutor, companyID string, code string, amount float64, includeCurrentAmount bool, currentAmount float64) error {
	code = strings.TrimSpace(code)
	prefix, sequence, ok := parseInvoiceCode(code)
	if !ok {
		return nil
	}

	row := qe.QueryRowContext(ctx, `
SELECT total, status, COALESCE(document_type, 'factura')
FROM finance_invoices
WHERE company_id = $1
  AND soft_delete = false
  AND btrim(upper(trim(series_prefix)), '-') = $2
  AND sequence_number::bigint = $3
ORDER BY id
LIMIT 1;
`, companyID, seriesKey(prefix), sequence)

	var total float64
	var status InvoiceStatus
	var docType string
	if err := row.Scan(&total, &status, &docType); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil // número libre: sin factura real detrás
		}
		return fmt.Errorf("consultar la factura para %q: %w", code, err)
	}
	if status == InvoiceStatusCancelled || docType == "nota_credito" {
		return nil
	}

	var counted float64
	err := qe.QueryRowContext(ctx, `
SELECT COALESCE(SUM(amount), 0)
FROM finance_payments
WHERE company_id = $1
  AND soft_delete = false
  AND status IN ('Completado', 'Parcial')
  AND btrim(upper(regexp_replace(trim(invoice_number), '[0-9]+$', '')), '-') = $2
  AND substring(upper(trim(invoice_number)) FROM '([0-9]+)$')::bigint = $3;
`, companyID, seriesKey(prefix), sequence).Scan(&counted)
	if err != nil {
		return fmt.Errorf("sumar los montos pagados de la factura para %q: %w", code, err)
	}

	maxAllowed := total - counted
	if includeCurrentAmount && currentAmount > 0 {
		maxAllowed += currentAmount
	}
	if amount > maxAllowed+moneyEpsilon {
		return errPaymentExceedsBalance
	}

	return nil
}

func formatMoney(value float64) string {
	return strconv.FormatFloat(value, 'f', -1, 64)
}

// resolveInvoiceForCode empareja un código de pago contra finance_invoices por
// (prefijo, secuencia) numéricos. Devuelve nil si el código no resuelve a una
// factura real de la empresa (números libres legados → sin sincronizar).
func (s *Service) resolveInvoiceForCode(ctx context.Context, qe queryExecutor, companyID, code string) (*invoiceSnapshot, error) {
	prefix, sequence, ok := parseInvoiceCode(code)
	if !ok {
		return nil, nil
	}

	row := qe.QueryRowContext(ctx, `
SELECT id, status, total, balance_amount, paid_amount, COALESCE(document_type, 'factura'), series_prefix, sequence_number
FROM finance_invoices
WHERE company_id = $1
  AND soft_delete = false
  AND btrim(upper(trim(series_prefix)), '-') = $2
  AND sequence_number::bigint = $3
ORDER BY id
LIMIT 1;
`, companyID, seriesKey(prefix), sequence)

	var snap invoiceSnapshot
	if err := row.Scan(&snap.ID, &snap.Status, &snap.Total, &snap.BalanceAmount, &snap.PaidAmount, &snap.DocumentType, &snap.SeriesPrefix, &snap.SequenceNumber); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &snap, nil
}

// syncInvoicesFromPayments recalcula paid_amount / balance_amount / status / received_payment
// de cada factura real referenciada por los códigos dados. Códigos que no resuelven a una
// factura se ignoran (compatibilidad con números libres). Facturas Cancelado o notas crédito
// (document_type='nota_credito') nunca se tocan.
func (s *Service) syncInvoicesFromPayments(ctx context.Context, qe queryExecutor, companyID string, codes ...string) error {
	unique := make(map[string]struct{}, len(codes))
	for _, code := range codes {
		if trimmed := strings.TrimSpace(code); trimmed != "" {
			unique[trimmed] = struct{}{}
		}
	}

	for code := range unique {
		snap, err := s.resolveInvoiceForCode(ctx, qe, companyID, code)
		if err != nil {
			return fmt.Errorf("resolver factura para el codigo %q: %w", code, err)
		}
		if snap == nil || snap.Status == InvoiceStatusCancelled || snap.DocumentType == "nota_credito" {
			// Canceladas y notas crédito nunca se tocan; los demás estados (incluida una
			// factura emitida/bloqueada) SÍ reciben la trazabilidad de pagos: ese es el
			// flujo real (pago confirmado contra factura emitida).
			continue
		}

		// El SUM empareja por (serie normalizada, secuencia) de la factura resuelta:
		// dos series distintas con el mismo número NUNCA se mezclan. La serie puede
		// contener dígitos ("FAC-2026"), así que la secuencia es SIEMPRE el grupo
		// final de dígitos y la serie lo anterior (tolerante a padding).
		//
		// El acumulado suma, además del monto, las retenciones valorizadas: en la
		// práctica contable colombiana la retención practicada por el cliente
		// (reteFuente/reteIVA/reteICA) es parte del pago de la factura — ignorarla
		// dejaba saldo fantasma y obligaba a un segundo pago. Semántica del valor
		// guardado (decisión de diseño): si es <= 100 se interpreta como
		// PORCENTAJE sobre el total de la factura (así lo envía la UI, ej. 4 = 4%)
		// y si es mayor se interpreta como valor ABSOLUTO en COP (formato legacy).
		// La base del porcentaje es el TOTAL de la factura (con IVA), no el
		// subtotal: es la convención que cierra el caso real (total 1.190.000,
		// pago 1.142.400 + 4% = 47.600 → saldo 0) y la más simple de auditar.
		var paid float64
		err = qe.QueryRowContext(ctx, `
SELECT COALESCE(SUM(
	amount
	+ CASE WHEN COALESCE(rete_fuente, 0) <= 100
		THEN COALESCE(rete_fuente, 0) / 100.0 * $4
		ELSE COALESCE(rete_fuente, 0) END
	+ CASE WHEN COALESCE(rete_iva, 0) <= 100
		THEN COALESCE(rete_iva, 0) / 100.0 * $4
		ELSE COALESCE(rete_iva, 0) END
	+ CASE WHEN COALESCE(rete_ica, 0) <= 100
		THEN COALESCE(rete_ica, 0) / 100.0 * $4
		ELSE COALESCE(rete_ica, 0) END
), 0)
FROM finance_payments
WHERE company_id = $1
  AND soft_delete = false
  AND status IN ('Completado', 'Parcial')
  AND btrim(upper(regexp_replace(trim(invoice_number), '[0-9]+$', '')), '-') = $2
  AND substring(upper(trim(invoice_number)) FROM '([0-9]+)$')::bigint = $3;
`, companyID, seriesKey(snap.SeriesPrefix), snap.SequenceNumber, snap.Total).Scan(&paid)
		if err != nil {
			return fmt.Errorf("sumar pagos contables para la factura %d: %w", snap.ID, err)
		}

		// paid_amount nunca se reporta por encima del total: un pago
		// complementario sobre una factura ya saldada (ej. el valor retenido que
		// llega después) no debe inflar el cobrado, sólo el estado ya quedó Pagado.
		storedPaid := paid
		if storedPaid > snap.Total {
			storedPaid = snap.Total
		}
		balance := snap.Total - storedPaid
		if balance < 0 {
			balance = 0
		}
		status := string(deriveInvoicePaymentStatus(snap.Status, paid, snap.Total))

		result, err := qe.ExecContext(ctx, `
UPDATE finance_invoices
SET paid_amount = $1,
    balance_amount = $2,
    status = $3,
    received_payment = ($4 > 0.01),
    updated_at = NOW()
WHERE company_id = $5
  AND id = $6;
`, storedPaid, balance, status, paid, companyID, snap.ID)
		if err != nil {
			return fmt.Errorf("actualizar la factura %d: %w", snap.ID, err)
		}
		if affected, _ := result.RowsAffected(); affected == 0 {
			return fmt.Errorf("la factura %d no se pudo actualizar (puede estar bloqueada)", snap.ID)
		}
	}

	return nil
}

