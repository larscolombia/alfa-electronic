import * as XLSX from "xlsx";

import { DataRow, ExtractionColumnDef } from "./extractions.model";

/** Valor de celda normalizado para exportar (booleanos legibles, vacíos limpios). */
export function cellValue(row: DataRow, key: string): string | number {
    const value = row[key];
    if (value === null || value === undefined) {
        return "";
    }
    if (typeof value === "boolean") {
        return value ? "Sí" : "No";
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : "";
    }
    return String(value);
}

function escapeCsvField(field: string): string {
    if (/[",\n\r;]/.test(field)) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

/**
 * CSV con BOM UTF-8 y CRLF para que Excel lo abra sin mojigangas ni
 * problemas de acentos. Las comillas internas se duplican (RFC 4180).
 */
export function buildCsv(rows: DataRow[], columns: ExtractionColumnDef[]): string {
    const header = columns.map(column => escapeCsvField(column.label)).join(",");
    const lines = rows.map(row =>
        columns.map(column => escapeCsvField(String(cellValue(row, column.key)))).join(","),
    );

    return `\uFEFF${[header, ...lines].join("\r\n")}\r\n`;
}

export function buildExportFileName(queryName: string, entityId: string, extension: "csv" | "xlsx"): string {
    const stamp = new Date().toISOString().slice(0, 10);
    const safeQuery = queryName.trim()
        ? queryName.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 60)
        : entityId;

    return `${safeQuery}_${stamp}.${extension}`;
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Descarga el resultado actual como .csv en el navegador. */
export function downloadCsv(rows: DataRow[], columns: ExtractionColumnDef[], fileName: string): void {
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("No hay columnas seleccionadas para exportar.");
    }

    const blob = new Blob([buildCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
    triggerBrowserDownload(blob, fileName);
}

/** Construye el libro de Excel (hoja única) a partir de columnas y filas. */
export function buildXlsxWorkbook(rows: DataRow[], columns: ExtractionColumnDef[]): XLSX.WorkBook {
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("No hay columnas seleccionadas para exportar.");
    }

    const header = columns.map(column => column.label);
    const body = rows.map(row => columns.map(column => cellValue(row, column.key)));

    const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
    sheet["!cols"] = columns.map(() => ({ wch: 24 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Resultados");
    return workbook;
}

/** Descarga el resultado actual como .xlsx usando la librería xlsx del repo. */
export function downloadXlsx(rows: DataRow[], columns: ExtractionColumnDef[], fileName: string): void {
    const workbook = buildXlsxWorkbook(rows, columns);
    XLSX.writeFile(workbook, fileName);
}
