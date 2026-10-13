/**
 * Lógica pura compartida para repuestos / líneas de compra.
 * Espejada en scripts/test-parts-logic.mjs (mantener en sincronía).
 */

/**
 * Normalización fuerte para búsqueda de referencias:
 * trim + lowercase + NFD sin acentos + elimina todo lo no alfanumérico.
 * "IGBT-FGA25N120" y "igbt fga25n120" producen el mismo token.
 */
export function normalizeSearchToken(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

/**
 * Una línea/ítem matchea la query si su referencia o designación
 * contienen el token normalizado. Query vacía matchea todo.
 */
export function referenceMatches(item: { reference?: string; designation?: string }, query: string): boolean {
    const normalizedQuery = normalizeSearchToken(query);
    if (!normalizedQuery) {
        return true;
    }
    return (
        normalizeSearchToken(item.reference).includes(normalizedQuery) ||
        normalizeSearchToken(item.designation).includes(normalizedQuery)
    );
}

export interface PurchaseLineEditSnapshot {
    reference?: string;
    brand?: string;
    quantity?: number;
    unitPrice?: number;
}

/**
 * Detecta si una edición cambió marca o referencia (los campos relevantes
 * para el técnico solicitante). Cambios de solo precio/cantidad no cuentan.
 * La comparación es normalizada: cambios de mayúsculas/espacios no cuentan.
 */
export function detectRelevantChanges(oldLine: PurchaseLineEditSnapshot, newLine: PurchaseLineEditSnapshot): boolean {
    return (
        normalizeSearchToken(oldLine.brand) !== normalizeSearchToken(newLine.brand) ||
        normalizeSearchToken(oldLine.reference) !== normalizeSearchToken(newLine.reference)
    );
}
