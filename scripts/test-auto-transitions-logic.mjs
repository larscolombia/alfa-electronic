/**
 * Unit tests — Auto transitions logic
 * Imports the REAL logic from src/app/pages/app/projects/project-auto-transitions.logic.ts
 * (pure TS with no Angular imports; Node >= 22.6 strips the type annotations).
 *
 * Tests:
 *  - resolveStatusAfterPartsRequest: stock reservado tras OC -> reparacion;
 *    compra externa tras OC -> esperando-proveedor; otros estados no avanzan.
 *  - validateReadyForDelivery: testType distinto de "sin-pruebas" aprueba; checklist
 *    (transitionTestRuns) con respuesta inf-pruebas-realizadas real aprueba; respuestas
 *    "sin pruebas" (id o label), vacias o ausentes rechazan con mensaje accionable
 *
 * Run: node scripts/test-auto-transitions-logic.mjs
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

const logicUrl = pathToFileURL(
    path.resolve("src/app/pages/app/projects/project-auto-transitions.logic.ts"),
).href;
const {
    resolveStatusAfterPartsRequest,
    validateReadyForDelivery,
    PARTS_PURCHASE_TARGET_STATUS_ID,
    PARTS_STOCK_TARGET_STATUS_ID,
} = await import(logicUrl);

// ─── Test runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, description) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${description}`);
    } else {
        failed++;
        failures.push(description);
        console.log(`  ✗ ${description}`);
    }
}

function assertEqual(actual, expected, description) {
    const ok = actual === expected;
    if (!ok) description += ` (expected: "${expected}", got: "${actual}")`;
    assert(ok, description);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log("\n=== Unit Tests: Auto Transitions Logic ===\n");

console.log("── resolveStatusAfterPartsRequest: disponibilidad real ──");
assertEqual(resolveStatusAfterPartsRequest("pedir-repuestos", "compra-externa"), "esperando-proveedor", "compra externa -> esperando proveedor");
assertEqual(resolveStatusAfterPartsRequest("pedir-repuestos", "stock"), "reparacion", "stock reservado -> reparacion");
assertEqual(PARTS_PURCHASE_TARGET_STATUS_ID, "esperando-proveedor", "Compra externa espera proveedor");
assertEqual(PARTS_STOCK_TARGET_STATUS_ID, "reparacion", "Stock permite reparacion");

console.log("\n── resolveStatusAfterPartsRequest: bloqueos ──");
const boardStatuses = [
    "recibido",
    "diagnostico",
    "por-cotizar",
    "reparacion",
    "pruebas",
    "listo-entrega",
    "garantia-espera-repuestos",
    "entregado",
];
for (const status of boardStatuses) {
    assertEqual(resolveStatusAfterPartsRequest(status, "compra-externa"), null, `${status} compra externa -> null (no se mueve)`);
}
assertEqual(resolveStatusAfterPartsRequest("", "stock"), null, "Estado vacio -> null");
assertEqual(resolveStatusAfterPartsRequest(null, "stock"), null, "null -> null");
assertEqual(resolveStatusAfterPartsRequest(undefined, "stock"), null, "undefined -> null");
assertEqual(resolveStatusAfterPartsRequest("inventado", "stock"), null, "Estado desconocido -> null");
assertEqual(resolveStatusAfterPartsRequest("  pedir-repuestos  ", "stock"), "reparacion", "Estado con espacios se normaliza");
assertEqual(resolveStatusAfterPartsRequest("pedir-repuestos", "origen-invalido"), null, "Origen invalido -> null");

console.log("\n── validateReadyForDelivery: testType en properties ──");
const okBanco = validateReadyForDelivery({ properties: { testType: "banco-pruebas" } });
assert(okBanco.ok && okBanco.missing.length === 0, "testType banco-pruebas -> ok");
const okLab = validateReadyForDelivery({ properties: { testType: "laboratorio" } });
assert(okLab.ok, "testType laboratorio -> ok");
const koSinPruebas = validateReadyForDelivery({ properties: { testType: "sin-pruebas" } });
assert(!koSinPruebas.ok && koSinPruebas.missing.length > 0, "testType sin-pruebas -> rechazado con mensaje");
const koVacio = validateReadyForDelivery({ properties: { testType: "" } });
assert(!koVacio.ok, "testType vacio -> rechazado");
const koSinPropiedad = validateReadyForDelivery({ properties: {} });
assert(!koSinPropiedad.ok, "Sin testType -> rechazado");
const koSinProperties = validateReadyForDelivery({});
assert(!koSinProperties.ok, "Proyecto sin properties -> rechazado");
const koNull = validateReadyForDelivery(null);
assert(!koNull.ok && koNull.missing.length > 0, "Proyecto null -> rechazado sin explotar");

console.log("\n── validateReadyForDelivery: checklist equivalente (transitionTestRuns) ──");
const runOk = validateReadyForDelivery({
    properties: {
        testType: "sin-pruebas",
        transitionTestRuns: [
            {
                fromStatusId: "pruebas",
                toStatusId: "listo-entrega",
                answers: { "inf-pruebas-realizadas": "Sobre banco de prueba" },
            },
        ],
    },
});
assert(runOk.ok, "Checklist con 'Sobre banco de prueba' (label del modal) -> ok");
const runOkId = validateReadyForDelivery({
    properties: {
        transitionTestRuns: [{ answers: { "inf-pruebas-realizadas": "banco-pruebas" } }],
    },
});
assert(runOkId.ok, "Checklist con id 'banco-pruebas' -> ok");
const runKoLabel = validateReadyForDelivery({
    properties: {
        transitionTestRuns: [{ answers: { "inf-pruebas-realizadas": "Sin pruebas funcionales" } }],
    },
});
assert(!runKoLabel.ok, "Checklist con label 'Sin pruebas funcionales' -> rechazado");
const runKoId = validateReadyForDelivery({
    properties: {
        transitionTestRuns: [{ answers: { "inf-pruebas-realizadas": "sin-pruebas" } }],
    },
});
assert(!runKoId.ok, "Checklist con id 'sin-pruebas' -> rechazado");
const runKoVacia = validateReadyForDelivery({
    properties: {
        transitionTestRuns: [{ answers: { "inf-pruebas-realizadas": "   " } }],
    },
});
assert(!runKoVacia.ok, "Checklist con respuesta en blanco -> rechazado");
const runKoOtraPregunta = validateReadyForDelivery({
    properties: {
        transitionTestRuns: [{ answers: { "inf-comentarios-cliente": "Listo" } }],
    },
});
assert(!runKoOtraPregunta.ok, "Checklist sin la pregunta de pruebas -> rechazado");
const runKoNoArray = validateReadyForDelivery({ properties: { transitionTestRuns: "no-array" } });
assert(!runKoNoArray.ok, "transitionTestRuns no-array -> rechazado sin explotar");

console.log("\n── validateReadyForDelivery: mensaje accionable ──");
const rejected = validateReadyForDelivery({ properties: { testType: "sin-pruebas" } });
assert(/prueba de cierre/i.test(rejected.missing[0]), "El mensaje menciona la 'Prueba de cierre'");
assert(/checklist/i.test(rejected.missing[0]), "El mensaje menciona el checklist alternativo");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
