/**
 * Prefill "Guardar y cotizar": puente entre la ficha del proyecto (kanban) y
 * el formulario de cotizaciones.
 *
 * Por qué un store en vez de router state: `Router.getCurrentNavigation()`
 * devuelve null para rutas lazy una vez que la activación terminó, así que
 * leer extras.state dentro de ngOnInit es una carrera de tiempos. Este
 * singleton vive en memoria durante el salto de vista (una microtarea) y se
 * consume exactamente una vez; si no hay navegación entre set y consume,
 * `consumeQuotePrefill` deja null y nada ocurre. Sin DI, sin providers.
 */

export interface QuotePrefillReference {
    budget?: number | null;
    partsBudgetUsd?: number | null;
    estimatedMaterialCost?: number | null;
    estimatedHours?: number | null;
}

export interface QuotePrefillFromProject {
    /** Nombre del cliente en el proyecto; se empareja case-insensitive contra prospectos CRM. */
    prospectoName: string;
    currency: "COP" | "USD";
    /** ISO yyyy-mm-dd o vacío (sin plazo / default del formulario). */
    validUntil: string;
    /** Síntoma de la falla → borrador editable de descripción general y línea 1. */
    description: string;
    /** Budget del proyecto (>0) como precio unitario sugerido de la línea 1. */
    linePrice?: number | null;
    /** itemId del equipo vinculado al caso, si está en la lista del prospecto. */
    equipmentItemId: string;
    sourceTitle: string;
    /** SOLO visual (ficha de referencia): nunca entra al payload ni al PDF. */
    reference?: QuotePrefillReference | null;
}

const state: { prefill: QuotePrefillFromProject | null } = { prefill: null };

export function setQuotePrefill(prefill: QuotePrefillFromProject): void {
    state.prefill = prefill;
}

/** Devuelve el prefill pendiente y lo limpia (one-shot). */
export function consumeQuotePrefill(): QuotePrefillFromProject | null {
    const current = state.prefill;
    state.prefill = null;
    return current;
}
