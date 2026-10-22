package projects

import (
	"fmt"
	"sort"
	"strings"
)

// legalProjectTransitions es la UNICA fuente de reglas de flujo del tablero
// tecnico. Todo cambio de estado que llegue al servidor (guardado desde los
// chips de la ficha, drag & drop entre columnas, cierre de pruebas,
// auto-avance por solicitud de repuestos, confirmacion de despacho o
// vinculacion de OC desde CRM) se valida contra esta tabla antes de escribir.
//
// Antes de esta unificacion cada punto del frontend computaba sus propias
// reglas y el backend solo chequeaba que el estado existiera: nada impedia un
// PUT que saltara de recibido a entregado. Ahora la regla vive en el servidor,
// como ya hacia diagnosis/close.
//
// Evidencia de las reglas codificadas:
//  - Flujo principal bidireccional entre columnas adyacentes:
//    recibido -> diagnostico -> por-cotizar -> pedir-repuestos ->
//    esperando-proveedor -> reparacion -> listo-entrega.
//    La etapa "pruebas" (QA) se elimino del flujo: el cierre directo
//    reparacion -> listo-entrega queda cubierto por la regla de transicion
//    y su checklist de informe de intervencion (flow-reparacion-listo).
//    La bidireccionalidad cubre correcciones y el reverso del drag & drop.
//  - Auto-avance tras solicitud exitosa de repuestos con material disponible
//    (project-auto-transitions.logic.ts: diagnostico/por-cotizar a reparacion),
//    mas su reverso para correcciones.
//  - Entrega: solo desde listo-entrega; el reverso cubre la cancelacion del
//    despacho (el drag escribe al instante y cancelar revierte con un PUT).
//    entregado ademas abre hacia garantia, la puerta documentada de reclamo.
//  - Garantia (TranscriptTecnica0303 @25:52): desde garantia se solicita un
//    componente y el caso pasa a espera de proveedor; al llegar el material
//    vuelve por reparacion -> listo-entrega -> entregado.
//    garantia-espera-reupertino es la pausa visible del mismo estado mientras
//    faltan repuestos, no una etapa independiente.
//  - prestamo NO es una etapa del flujo sino un estado de estacionamiento para
//    accesorios anclados al equipo principal (TranscriptTecnica0303 @20:32),
//    por eso entra y sale de cualquier columna, incluida la remision junto al
//    despacho del caso principal.

var legalProjectTransitions = map[string][]string{
	"recibido":                  {"diagnostico", "prestamo"},
	"diagnostico":               {"recibido", "por-cotizar", "pedir-repuestos", "reparacion", "prestamo"},
	"por-cotizar":               {"diagnostico", "pedir-reupertino", "reparacion", "prestamo"},
	"pedir-reupertino":          {"por-cotizar", "esperando-proveedor", "prestamo"},
	"esperando-proveedor":       {"pedir-reupertino", "reparacion", "garantia", "garantia-espera-reupertino", "prestamo"},
	"reparacion":                {"diagnostico", "por-cotizar", "esperando-proveedor", "listo-entrega", "garantia-espera-reupertino", "prestamo"},
	"listo-entrega":             {"entregado", "prestamo"},
	"entregado":                 {"listo-entrega", "garantia", "prestamo"},
	"garantia":                  {"entregado", "esperando-proveedor", "garantia-espera-reupertino", "prestamo"},
	"garantia-espera-reupertino":  {"garantia", "esperando-proveedor", "reparacion", "prestamo"},
	"prestamo":                  {"recibido", "diagnostico", "por-cotizar", "pedir-reupertino", "esperando-proveedor", "reparacion", "listo-entrega", "entregado", "garantia", "garantia-espera-reupertino"},
}

// canTransition reporta si mover un proyecto desde fromStatus hacia toStatus
// es legal. Moverse al mismo estado siempre lo es (los guardados reenvian el
// status actual como no-op). Un origen vacio o fuera del catalogo se deja pasar:
// son datos heredados que la primera escritura normaliza, y bloquearlos
// impediria corregirlos.
func canTransition(fromStatus, toStatus string) bool {
	from := strings.ToLower(strings.TrimSpace(fromStatus))
	to := strings.ToLower(strings.TrimSpace(toStatus))

	if from == "" || from == to {
		return true
	}

	targets, ok := legalProjectTransitions[from]
	if !ok {
		return true
	}

	for _, target := range targets {
		if target == to {
			return true
		}
	}
	return false
}

// legalTargetsFor devuelve la lista ordenada de destinos legales desde un
// estado, para mensajes de error accionables.
func legalTargetsFor(status string) []string {
	targets := append([]string{}, legalProjectTransitions[strings.ToLower(strings.TrimSpace(status))]...)
	sort.Strings(targets)
	return targets
}

// newTransitionError construye el error de transicion ilegal con la lista de
// destinos legales para que el mensaje llegue accionable a la UI.
func newTransitionError(fromStatus, toStatus string) error {
	from := strings.ToLower(strings.TrimSpace(fromStatus))
	to := strings.ToLower(strings.TrimSpace(toStatus))

	targets := legalTargetsFor(from)
	if len(targets) == 0 {
		return errProjectTransitionInvalid
	}

	return fmt.Errorf("%w: no se puede mover de %q a %q; destinos legales desde %s: %s",
		errProjectTransitionInvalid, from, to, from, strings.Join(targets, ", "))
}
