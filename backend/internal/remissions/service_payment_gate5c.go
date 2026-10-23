package remissions

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
)

// FASE 5c — Puente pago → despacho, POR MODALIDAD.
//
// Palabras del cliente (transcripción 9-mar, ~min 28):
//
//	"primero se le manda la factura y cuando el cliente pague, ahí sí se le
//	 despacha… despachos Servientrega son solo los clientes créditos, los que
//	 sí tienen 30 o 45 días, eso se puede empacar y se despacha de una… si son
//	 contra entregas, se quedan ahí empacaditos en la oficina hasta que el
//	 cliente paga primero."
//
// O sea la puerta NO es "todo despacho espera pago": aplica cuando la
// modalidad es contra-entrega o cuando el cliente no es de crédito. Un cliente
// a crédito (30/45 días) despacha de una, porque su modalidad de cobro es
// justamente esa.
//
// La validación es server-side y dentro de la misma transacción que cambia el
// estado: validar en el navegador sólo habría movido el mismo agujero de sitio.

const (
	// DispatchContraEntrega es la modalidad que el cliente describió como
	// "se quedan ahí empacaditos… hasta que el cliente paga primero".
	DispatchContraEntrega = "contra-entrega"

	// InvoiceStatusPaid es el único estado de factura que libera el despacho.
	// Coincide con finance.InvoiceStatusPaid; se repite la literal para no
	// importar internal/finance desde remissions (mismo criterio de la Fase 5b:
	// lectura cruzada por SQL en vez de acoplar paquetes).
	InvoiceStatusPaid = "Pagado"
)

// Errores de la puerta. Son texto visible para el usuario, así que llevan el
// motivo concreto y no un genérico "operación no permitida".
var (
	ErrInvoiceNotLinked   = errors.New("falta vincular la factura que debe pagarse antes de despachar")
	ErrOverrideNotAllowed = errors.New("solo un administrador puede autorizar el despacho sin el pago confirmado")
	ErrInvoiceNotFound    = errors.New("la factura vinculada no existe o fue eliminada")
)

// Actor es la identidad del JWT que dispara el cambio de estado. Se pasa
// explícitamente (no se lee del contexto dentro del servicio) para que la regla
// de autorización sea testeable sin levantar HTTP.
type Actor struct {
	Email string
	Role  string
}

// isAdminRole replica el criterio de internal/acl: admin y superadmin tienen
// acceso total. Es la ruta de escape del propietario y por eso es la única que
// puede saltar la puerta de pago.
func isAdminRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "admin", "administrador", "superadmin", "super-admin":
		return true
	default:
		return false
	}
}

// requiresPaymentGate decide si la modalidad exige pago antes de despachar.
//
// credit_enabled=false también activa la puerta aunque la modalidad no diga
// "contra-entrega": un cliente sin crédito no tiene 30/45 días, así que cae en
// el caso de "paga primero". Si el cliente no existe en crm_clients el JOIN
// devuelve false, o sea puerta activada — fallo cerrado ante un cliente
// desconocido, que es el lado seguro para un control de plata.
func requiresPaymentGate(dispatchType string, creditClient bool) bool {
	if strings.EqualFold(strings.TrimSpace(dispatchType), DispatchContraEntrega) {
		return true
	}
	return !creditClient
}

// applyPaymentGate rellena los campos computados que la UI muestra
// ("retenida por pago" + estado de la factura). No decide nada: la decisión la
// toma enforcePaymentGate dentro de la transacción.
func applyPaymentGate(r *Remission) {
	if r == nil {
		return
	}

	gate := requiresPaymentGate(r.DispatchType, r.CreditClient)
	r.PaymentGate = gate

	// Ya entregada o ya autorizada por admin ⇒ no está retenida.
	if !gate || r.DeliveryStatus == "entregado" || r.PaymentOverride {
		r.PaymentHeld = false
		r.PaymentHeldReason = ""
		return
	}

	if r.InvoiceID == nil || *r.InvoiceID <= 0 {
		r.PaymentHeld = true
		r.PaymentHeldReason = ErrInvoiceNotLinked.Error()
		return
	}

	if strings.TrimSpace(r.InvoiceStatus) == InvoiceStatusPaid {
		r.PaymentHeld = false
		r.PaymentHeldReason = ""
		return
	}

	r.PaymentHeld = true
	r.PaymentHeldReason = invoiceUnpaidMessage(r.InvoiceReference, r.InvoiceStatus)
}

// invoiceUnpaidMessage nombra el estado actual, que es lo que pidió el diseño:
// "rechazo con mensaje que diga el estado actual".
func invoiceUnpaidMessage(reference, status string) string {
	label := strings.TrimSpace(reference)
	if label == "" {
		label = "la factura vinculada"
	} else {
		label = "la factura " + label
	}

	current := strings.TrimSpace(status)
	if current == "" {
		return label + " no aparece como Pagada: verifique que exista y no esté eliminada"
	}
	return label + " está en estado '" + current + "', y el despacho exige que esté 'Pagado'"
}

// normalizeInvoiceID trata 0 y negativos como "sin vincular": un JSON que
// mande `invoiceId: 0` no debe quedar como una factura inexistente que hace
// fallar el JOIN y confundir el mensaje.
func normalizeInvoiceID(value *int64) *int64 {
	if value == nil {
		return nil
	}
	cleaned := *value
	if cleaned <= 0 {
		return nil
	}
	return &cleaned
}

// readInvoiceStatus lee el estado de la factura vinculada dentro de la
// transacción que ya tiene el FOR UPDATE sobre la remisión.
//
// Devuelve ("", false, nil) cuando no hay factura vinculada, y ("", true, nil)
// cuando está vinculada pero no existe (borrada o de otra empresa): el segundo
// caso es un error de negocio distinto y por eso se distinguen.
func readInvoiceStatus(tx *sql.Tx, companyID string, invoiceID *int64) (string, bool, error) {
	if invoiceID == nil || *invoiceID <= 0 {
		return "", false, nil
	}

	var status string
	err := tx.QueryRow(`
SELECT status
FROM finance_invoices
WHERE company_id = $1 AND id = $2 AND soft_delete = false`,
		companyID, *invoiceID).Scan(&status)
	if errors.Is(err, sql.ErrNoRows) {
		return "", true, nil
	}
	if err != nil {
		return "", true, err
	}
	return strings.TrimSpace(status), true, nil
}

// enforcePaymentGate aplica la regla al despachar. Devuelve el error de negocio
// que el handler traduce a 409/422 con el mensaje textual.
//
// `overrideRequested` viene del cuerpo de la petición; sólo se honra si el
// Actor es admin del JWT. Un override ya grabado en la fila se respeta sin
// volver a pedir el rol: la autorización se dio una vez y quedó con rastro.
func enforcePaymentGate(r *Remission, actor Actor, overrideRequested bool) error {
	if !requiresPaymentGate(r.DispatchType, r.CreditClient) {
		return nil
	}
	if r.PaymentOverride {
		return nil
	}

	invoiceLabel := strings.TrimSpace(r.InvoiceReference)
	if invoiceLabel == "" {
		invoiceLabel = "vinculada"
	}

	if r.InvoiceID == nil || *r.InvoiceID <= 0 {
		if !overrideRequested {
			return ErrInvoiceNotLinked
		}
		if !isAdminRole(actor.Role) {
			return ErrOverrideNotAllowed
		}
		return nil
	}

	if strings.EqualFold(strings.TrimSpace(r.InvoiceStatus), InvoiceStatusPaid) {
		return nil
	}

	if !overrideRequested {
		if strings.TrimSpace(r.InvoiceStatus) == "" {
			return fmt.Errorf("%w (%s)", ErrInvoiceNotFound, invoiceLabel)
		}
		return errors.New(invoiceUnpaidMessage(r.InvoiceReference, r.InvoiceStatus))
	}
	if !isAdminRole(actor.Role) {
		return ErrOverrideNotAllowed
	}
	return nil
}
