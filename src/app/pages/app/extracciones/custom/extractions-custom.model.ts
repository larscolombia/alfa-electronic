/** Modelo de la extracción personalizada (modalidad B). Espejo de los DTOs
 * del backend (internal/extractions/types.go). */

export type CustomColumnKind = "text" | "number" | "money" | "date";

export interface CustomColumnCatalog {
    name: string;
    label: string;
    kind: CustomColumnKind;
}

export interface CustomTableCatalog {
    name: string;
    label: string;
    module: string;
    columns: CustomColumnCatalog[];
}

export interface CustomModuleCatalog {
    slug: string;
    label: string;
    tables: CustomTableCatalog[];
}

export interface CustomFieldRef {
    table: string;
    column: string;
}

export type CustomFilterOp = "equals" | "contains" | "different" | "between";

export interface CustomFilter {
    table: string;
    column: string;
    op: CustomFilterOp;
    value: string;
    from: string;
    to: string;
}

export interface CustomQueryRequest {
    tables: string[];
    columns: CustomFieldRef[];
    filters: CustomFilter[];
    totals: CustomFieldRef[];
    limit: number;
}

export interface CustomTotalResult {
    table: string;
    column: string;
    label: string;
    kind: CustomColumnKind;
    sum: number;
}

export interface CustomQueryResponse {
    columns: CustomColumnCatalog[];
    rows: Array<Record<string, unknown>>;
    totals: CustomTotalResult[];
    rowCount: number;
    truncated: boolean;
}

/** Referencia enriquecida para la UI: columna con su tabla y módulo de origen. */
export interface CustomColumnOption {
    table: string;
    column: string;
    label: string;
    kind: CustomColumnKind;
    tableLabel: string;
    moduleLabel: string;
}

/** Consulta personalizada guardada en el navegador (sin tocar la base de datos). */
export interface SavedCustomQuery {
    id: string;
    name: string;
    savedAt: string;
    tables: string[];
    columns: string[];
    filters: CustomFilter[];
    totals: string[];
}

export function fieldKey(ref: CustomFieldRef): string {
    return `${ref.table}.${ref.column}`;
}
