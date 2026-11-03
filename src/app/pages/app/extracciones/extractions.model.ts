import { Observable } from "rxjs";

/** Operadores de filtro soportados por el motor genérico. */
export type FilterOperator = "equals" | "contains" | "different";

/** Filtro aplicado por el usuario sobre un campo de la entidad activa. */
export interface AppliedFilter {
    fieldKey: string;
    operator: FilterOperator;
    value: string;
}

/** Tipo de celda para render en tabla y exportación. */
export type ColumnValueType = "text" | "money" | "number";

export interface ExtractionColumnDef {
    key: string;
    label: string;
    type?: ColumnValueType;
}

/** Campo disponible en el selector de filtros de la entidad. */
export interface ExtractionFieldDef {
    key: string;
    label: string;
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
