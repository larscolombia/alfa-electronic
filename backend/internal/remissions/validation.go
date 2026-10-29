package remissions

import (
	"errors"
	"regexp"
	"strings"
)

var internalEquipmentCodePattern = regexp.MustCompile(`(?i)^EQ-[A-Z0-9]+$`)

// Reglas duras del requerimiento de despacho, validadas en el SERVIDOR.
// El navegador sólo propone: si estas reglas vivieran en el cliente, un fetch
// sin los campos las saltaría igual que antes con la puerta de pago. Mismo
// criterio de la Fase 5c: una sola fuente de verdad, testeable sin HTTP.

// MaxItemsPerRemission: límite técnico del requerimiento — máximo 4 equipos
// por remisión; más de eso se divide en remisiones independientes.
const MaxItemsPerRemission = 4

var (
	errNoItems               = errors.New("una remision sin equipos no se puede generar: agregue al menos un equipo antes de guardar")
	errTooManyItems          = errors.New("maximo 4 equipos por remision: divida el despacho en varias remisiones independientes")
	errContactRequired       = errors.New("el contacto del cliente es obligatorio para despachar: complete la casilla Contacto y vuelva a guardar")
	errAnchoredNotAccepted   = errors.New("la remision incluye equipos con prestamos anclados: confirme su inclusion antes de guardar")
	errCarrierRequired       = errors.New("la transportadora es obligatoria para una entrega por transportadora: complete la casilla Transportadora")
	errGuideRequired         = errors.New("la guia es obligatoria para una entrega por transportadora: complete la casilla Numero de guia")
	errWarrantyRequired      = errors.New("la remision debe incluir una garantia o una excepcion aprobada en Notas / Comentarios")
	errItemWarrantyRequired  = errors.New("cada equipo debe tener un tiempo de garantia: seleccione los meses de garantia de cada equipo antes de guardar")
	errPurchaseOrderRequired = errors.New("la orden de compra debe acompañar el envio: registre el numero de OC antes de guardar")
	errEquipmentMismatch     = errors.New("marca, tipo y serie deben coincidir exactamente con el equipo origen; no se aceptan coincidencias parciales")
)

// hasAnchoredEquipment reporta si algún item lleva préstamos anclados. Es la
// misma señal que el frontend usa para la alerta amarilla (item.anchoredNote):
// si hay nota, existe un equipo anclado y la escritura exige consentimiento.
func hasAnchoredEquipment(items []RemissionItem) bool {
	for _, item := range items {
		if strings.TrimSpace(item.AnchoredNote) != "" {
			return true
		}
	}
	return false
}

// validateUpsert aplica las reglas antes de cualquier escritura. El error es
// el mismo en POST y PUT: una regla es una regla, crear o editar.
func validateUpsert(req UpsertRemissionRequest) error {
	if len(req.Items) == 0 {
		return errNoItems
	}
	if len(req.Items) > MaxItemsPerRemission {
		return errTooManyItems
	}
	if strings.TrimSpace(req.ContactName) == "" {
		return errContactRequired
	}
	dispatchType := strings.ToLower(strings.TrimSpace(req.DispatchType))
	if dispatchType == "servientrega" || dispatchType == "dhl" {
		if strings.TrimSpace(req.CarrierName) == "" {
			return errCarrierRequired
		}
		if strings.TrimSpace(req.GuideNumber) == "" {
			return errGuideRequired
		}
	}
	if req.WarrantyMonths <= 0 && strings.TrimSpace(req.Notes) == "" {
		return errWarrantyRequired
	}
	// La entrega al cliente final inicia la garantía del equipo: cada ítem
	// debe declarar su tiempo de garantía (meses) — sin excepción por notas.
	for _, item := range req.Items {
		if item.WarrantyMonths <= 0 {
			return errItemWarrantyRequired
		}
	}
	if strings.TrimSpace(req.PurchaseOrder) == "" {
		return errPurchaseOrderRequired
	}
	for _, item := range req.Items {
		identifier := strings.TrimSpace(item.Identifier)
		// EQ-* es el código interno del software. La serie de origen se
		// mantiene como trazabilidad separada y puede ser diferente.
		if strings.TrimSpace(item.SourceSeries) != "" && !internalEquipmentCodePattern.MatchString(identifier) && identifier != strings.TrimSpace(item.SourceSeries) {
			return errEquipmentMismatch
		}
	}
	if hasAnchoredEquipment(req.Items) && !req.AnchoredAccepted {
		return errAnchoredNotAccepted
	}
	return nil
}

// isUpsertRuleError distingue violación de regla (400, error del formulario
// del usuario con mensaje accionable) de fallo real de base de datos (500).
func isUpsertRuleError(err error) bool {
	switch {
	case errors.Is(err, errNoItems),
		errors.Is(err, errTooManyItems),
		errors.Is(err, errContactRequired),
		errors.Is(err, errCarrierRequired),
		errors.Is(err, errGuideRequired),
		errors.Is(err, errWarrantyRequired),
		errors.Is(err, errItemWarrantyRequired),
		errors.Is(err, errPurchaseOrderRequired),
		errors.Is(err, errEquipmentMismatch),
		errors.Is(err, errAnchoredNotAccepted):
		return true
	default:
		return false
	}
}
