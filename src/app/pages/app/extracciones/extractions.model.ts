import { Observable } from "rxjs";

/** Operadores de filtro soportados por el motor genérico. */
export type FilterOperator = "equals" | "contains" | "different" | "between";

/** Filtro aplicado por el usuario sobre un campo de la entidad activa. */
export interface AppliedFilter {
    fieldKey: string;
    operator: FilterOperator;
    value: string;
    /** Solo para operator "between": límite inferior/inclusivo (YYYY-MM-DD). */
    from?: string;
    /** Solo para operator "between": límite superior inclusivo (YYYY-MM-DD). */
    to?: string;
}

/** Tipo de celda para render en tabla y exportación. */
export type ColumnValueType = "text" | "money" | "number" | "date";

export interface ExtractionColumnDef {
    key: string;
    label: string;
    type?: ColumnValueType;
}

/** Campo disponible en el selector de filtros de la entidad. kind "date" usa
 * el rango Desde/Hasta en lugar de operador + texto. */
export interface ExtractionFieldDef {
    key: string;
    label: string;
    kind?: "text" | "date";
}

export type RowValue = string | number | boolean;

/** Fila normalizada lista para mostrar, filtrar y exportar. */
export type DataRow = Record<string, RowValue>;

/**
 * Contrato de una entidad extraíble: define sus columnas, campos filtrables
 * y cómo cargar filas reales desde el backend. Cada entidad tiene un único
 * provider (ver entities/*.entity.ts) para no duplicar lógica de mapeo.
 */
export interface ExtractionEntityConfig {
    id: string;
    label: string;
    description: string;
    columns: ExtractionColumnDef[];
    defaultSelectedKeys: string[];
    filterFields: ExtractionFieldDef[];
    load(): Observable<DataRow[]>;
}
