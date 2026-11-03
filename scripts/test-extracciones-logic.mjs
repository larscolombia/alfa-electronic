/**
 * Prueba de lógica del módulo Extracciones (sin runner: convención node scripts/*.mjs).
 * Compila con esbuild los módulos TS reales (filter-engine + export-utils) y aserta
 * su comportamiento: operadores de filtro, CSV RFC 4180 con BOM/CRLF y nombres de archivo.
 */
import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import path from "node:path";

import esbuild from "esbuild";

// Bundles dentro del repo para que los imports bare (xlsx) resuelvan contra node_modules.
const root = new URL("..", import.meta.url).pathname;
const bundleDir = path.join(root, `.tmp-extracciones-logic-${process.pid}`);
const bundlePath = path.join(bundleDir, "export-utils.mjs");

esbuild.buildSync({
    entryPoints: [path.join(root, "src/app/pages/app/extracciones/export-utils.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    external: ["xlsx", "rxjs"],
    outfile: bundlePath,
});

// export-utils re-exporta nada del motor; añadimos el filtro en un segundo bundle.
esbuild.buildSync({
    entryPoints: [path.join(root, "src/app/pages/app/extracciones/filter-engine.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: bundlePath.replace(".mjs", "-filter.mjs"),
});

const filterPath = bundlePath.replace(".mjs", "-filter.mjs");
const { applyFilters } = await import(filterPath);
const { buildCsv, buildExportFileName } = await import(bundlePath);

// ── Filtros: equals (texto case-insensitive) ────────────────────────────────
const rows = [
    { nombre: "Andrés Gómez", ciudad: "Bogotá", saldo: 10 },
    { nombre: "María López", ciudad: "Cali", saldo: 2500 },
    { nombre: "", ciudad: "Medellín", saldo: null },
];

assert.equal(
    applyFilters(rows, [{ fieldKey: "nombre", operator: "equals", value: "andrés gómez" }]).length,
    1,
    "equals debe ignorar mayúsculas y coincidir exactamente",
);
// Comportamiento documentado: filtros con valor vacío se descartan (la UI ya
// impide agregarlos) → la consulta no se silencia.
assert.equal(
    applyFilters(rows, [{ fieldKey: "nombre", operator: "equals", value: "" }]).length,
    rows.length,
    "un filtro con valor vacío debe descartarse y devolver todas las filas",
);
assert.equal(
    applyFilters([{ nombre: "x" }, { nombre: "" }], [{ fieldKey: "nombre", operator: "equals", value: "x" }]).length,
    1,
    "los valores vacíos de celda nunca deben coincidir con equals",
);

// ── Filtros: equals numérico ("10" vs número) ───────────────────────────────
assert.equal(
    applyFilters(rows, [{ fieldKey: "saldo", operator: "equals", value: "2500" }]).length,
    1,
    "equals debe comparar numéricamente cuando ambos lados son números",
);

// ── Filtros: contains ────────────────────────────────────────────────────────
assert.equal(
    applyFilters(rows, [{ fieldKey: "nombre", operator: "contains", value: "lópez" }]).length,
    1,
    "contains debe hacer subcadena case-insensitive",
);
assert.equal(
    applyFilters(rows, [{ fieldKey: "nombre", operator: "contains", value: "" }]).length,
    rows.length,
    "contains con valor vacío debe devolver todas las filas",
);

// ── Filtros: different (los vacíos siempre pasan) ───────────────────────────
assert.equal(
    applyFilters(rows, [{ fieldKey: "nombre", operator: "different", value: "andrés gómez" }]).length,
    2,
    "different debe excluir la fila igual y dejar pasar las demás (incluida vacía)",
);
assert.equal(
    applyFilters([{ nombre: "x" }, { nombre: "" }], [{ fieldKey: "nombre", operator: "different", value: "x" }]).length,
    1,
    "los valores vacíos de celda deben pasar siempre en different",
);

// ── Filtros combinados (AND) ────────────────────────────────────────────────
assert.equal(
    applyFilters(rows, [
        { fieldKey: "ciudad", operator: "contains", value: "bog" },
        { fieldKey: "saldo", operator: "equals", value: "10" },
    ]).length,
    1,
    "los filtros se combinan con AND",
);

// ── CSV: BOM + CRLF + escape RFC 4180 ───────────────────────────────────────
const csvRows = [
    { nombre: "Cliente, S.A.", nota: 'Dijo "hola"\ny mañana' },
    { nombre: "Simple", nota: "" },
];
const columns = [{ key: "nombre", label: "Nombre" }, { key: "nota", label: "Nota" }];
const csv = buildCsv(csvRows, columns);

assert.ok(csv.startsWith("\uFEFF"), "el CSV debe abrir con BOM UTF-8 para Excel");
assert.equal(csv.split("\r\n")[0].slice(1), "Nombre,Nota", "encabezado con CRLF y sin BOM tras el corte");
assert.ok(csv.endsWith("\r\n"), "el CSV debe cerrar con CRLF");
assert.ok(csv.includes('"Cliente, S.A."'), "las comas internas deben ir entre comillas");
assert.ok(csv.includes('Dijo ""hola""\ny mañana'), 'las comillas internas se duplican (RFC 4180)');

// ── Nombre de archivo: slug seguro + fecha + fallback a entidad ────────────
const named = buildExportFileName("Clientes activos de Bogotá!", "clientes", "csv");
assert.match(named, /^Clientes-activos-de-Bogot\u00e1_\d{4}-\d{2}-\d{2}\.csv$/, `naming inesperado: ${named}`);
assert.equal(
    buildExportFileName("a".repeat(80), "clientes", "xlsx"),
    `${"a".repeat(60)}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    "los nombres muy largos deben truncarse a 60 caracteres",
);
assert.equal(buildExportFileName("", "equipos", "xlsx"), `equipos_${new Date().toISOString().slice(0, 10)}.xlsx`);

rmSync(bundleDir, { recursive: true, force: true });
console.log(JSON.stringify({ checks: "filters+csv+naming" }, null, 2));
console.log("OK: lógica de Extracciones (filtros, CSV, nombres) verificada contra el código TS real.");
