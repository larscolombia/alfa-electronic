import { AppliedFilter, DataRow, FilterOperator } from "./extractions.model";

const OPERATOR_LABELS: Record<FilterOperator, string> = {
    equals: "Es igual a",
    contains: "Contiene",
    different: "Es diferente de",
};

export function operatorLabel(operator: FilterOperator): string {
    return OPERATOR_LABELS[operator] ?? String(operator);
}

function normalizeText(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "boolean") {
        return value ? "sí" : "no";
    }
    return String(value).trim().toLowerCase();
}

/** Devuelve el valor numérico si existe; null cuando no es un número. */
function asNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    const parsed = Number(String(value).replace(/[,\s]/g, "").trim());
    return Number.isFinite(parsed) && String(value).trim() !== "" ? parsed : null;
}

/**
 * "Es igual a": comparación numérica cuando ambos lados son números,
 * caso-insensible sobre texto en el resto de casos. Vacíos nunca coinciden.
 */
export function valuesEqual(rowValue: unknown, filterValue: string): boolean {
    if (rowValue === null || rowValue === undefined || String(rowValue).trim() === "") {
        return false;
    }

    const numericRow = asNumber(rowValue);
    const numericFilter = asNumber(filterValue);
    if (numericRow !== null && numericFilter !== null) {
        return numericRow === numericFilter;
    }

    return normalizeText(rowValue) === normalizeText(filterValue.trim());
}

/** "Contiene": subcadena case-insensitive sobre la representación de la celda. */
function valueContains(rowValue: unknown, filterValue: string): boolean {
    const needle = normalizeText(filterValue);
    if (!needle) {
        return true;
    }
    return normalizeText(rowValue).includes(needle);
}

/** "Es diferente de": negación de igualdad (los vacíos siempre pasan). */
function valueDiffers(rowValue: unknown, filterValue: string): boolean {
    if (rowValue === null || rowValue === undefined || String(rowValue).trim() === "") {
        return true;
    }
    return !valuesEqual(rowValue, filterValue);
}

export function matchesFilter(row: DataRow, filter: AppliedFilter): boolean {
    const value = row[filter.fieldKey];

    switch (filter.operator) {
        case "equals":
            return valuesEqual(value, filter.value);
        case "different":
            return valueDiffers(value, filter.value);
        case "contains":
        default:
            return valueContains(value, filter.value);
    }
}

/**
 * Aplica la lista de filtros como conjunción (AND). Los filtros con valor
 * vacío se descartan para no silenciar la consulta.
 */
export function applyFilters(rows: DataRow[], filters: AppliedFilter[]): DataRow[] {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    const active = (filters ?? []).filter(
        filter => filter && typeof filter.fieldKey === "string" && filter.fieldKey !== ""
            && typeof filter.value === "string" && filter.value.trim() !== "",
    );

    if (active.length === 0) {
        return rows;
    }

    return rows.filter(row => active.every(filter => matchesFilter(row, filter)));
}
