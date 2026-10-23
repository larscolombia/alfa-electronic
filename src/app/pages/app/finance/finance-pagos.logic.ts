/**
 * Lógica pura — /finance-pagos, campo "Proyecto" del formulario de pago.
 *
 * Regla de negocio (requisito): el selector debe listar TODOS los proyectos
 * del sistema que NO estén pagados en su totalidad. "Pagado" se define con la
 * misma semántica que ya usa la ficha kanban y Remisiones:
 * properties.paymentStatus === 'confirmado' (normalizada, sin distinguir
 * mayúsculas/espacios). Los proyectos 'pendiente', 'parcial' o sin marcar
 * siguen disponibles para cobrar.
 *
 * Adicionalmente se conservan los nombres de proyecto que ya aparecen en las
 * facturas vigentes (comportamiento previo): no romperse el flujo de vincular
 * una factura cuyo proyecto ya esté pagado (pago parcial adicional, edición).
 *
 * Tests deterministas: scripts/test-finance-pagos-logic.mjs (espejo 1:1).
 */

import { projectClientName } from "../remissions/remissions.logic";

/** Mismo criterio que Remisiones/gate de remision: 'confirmado' = pagado. */
export function isProjectPaid(project: any): boolean {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.paymentStatus || "").trim().toLowerCase() === "confirmado";
}

/** Proyectos del sistema que aún no están pagados en su totalidad. */
export function filterUnpaidProjects(projects: any[]): any[] {
    return (projects || []).filter((project) => !isProjectPaid(project));
}

/**
 * Etiqueta estable para el select "Proyecto": código de equipo + cliente,
 * con degradación ordenada si falta uno u otro. Determinista y sin dependencias.
 */
export function projectLabelForPayment(project: any): string {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    const code = String(props.equipmentIdentifier || "").trim()
        || (project?.id ? "#" + String(project.id).slice(-6) : "");
    const client = projectClientName(project);
    if (code && client) return `${code} — ${client}`;
    return code || client || "Proyecto sin datos";
}

/**
 * Opciones finales del selector: union de etiquetas de proyectos no pagados +
 * nombres ya presentes en facturas vigentes, deduplicado y ordenado alfabéticamente.
 */
export function buildPaymentProjectOptions(projects: any[], invoiceProjects?: string[]): string[] {
    const options = new Set<string>();

    for (const project of filterUnpaidProjects(projects)) {
        const label = String(projectLabelForPayment(project) || "").trim();
        if (label) options.add(label);
    }

    for (const rawName of invoiceProjects || []) {
        const name = String(rawName || "").trim();
        if (name && !options.has(name)) options.add(name);
    }

    return Array.from(options).sort((first, second) => first.localeCompare(second));
}
