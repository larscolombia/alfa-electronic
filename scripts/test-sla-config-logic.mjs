/**
 * Unit tests — applySlaConfigToColumns (espejo de src/app/pages/app/projects/project-sla.logic.ts)
 *
 * Tests:
 *  - Config global {greenDays, yellowDays} se aplica a todas las columnas con trackAging
 *  - Config por columna {columnId: {...}} se aplica solo a esa columna (y gana sobre la global)
 *  - Columnas sin trackAging quedan intactas
 *  - No muta el array original ni sus columnas
 *  - Config vacia/nula deja todo igual
 *  - Round-trip del payload API (stage/greenDays/yellowDays) del backend
 *
 * Run: node scripts/test-sla-config-logic.mjs
 */

// ─── Mirror of project-sla.logic.ts (keep in sync!) ─────────────────────────

function normalizeSlaDays(value) {
    const numeric = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numeric)) {
        return null;
    }

    return Math.max(0, Math.round(numeric));
}

function applySlaConfigToColumns(columns, config) {
    const globalGreen = normalizeSlaDays(config?.greenDays);
    const globalYellow = normalizeSlaDays(config?.yellowDays);
    const perColumn = config?.columns ?? {};
    const hasGlobal = globalGreen !== null || globalYellow !== null;
    const hasPerColumn = Object.keys(perColumn).length > 0;

    if (!hasGlobal && !hasPerColumn) {
        return columns.slice();
    }

    return columns.map((column) => {
        if (!column.trackAging) {
            return column;
        }

        const override = perColumn[column.id] ?? {};
        const overrideGreen = normalizeSlaDays(override.greenDays);
        const overrideYellow = normalizeSlaDays(override.yellowDays);
        const nextGreen = overrideGreen ?? globalGreen;
        const nextYellow = overrideYellow ?? globalYellow;

        if (nextGreen === null && nextYellow === null) {
            return column;
        }

        return {
            ...column,
            greenDays: nextGreen ?? column.greenDays ?? 0,
            yellowDays: nextYellow ?? column.yellowDays ?? 0,
        };
    });
}

function slaConfigFromApiPayload(items) {
    const columns = {};

    for (const item of items ?? []) {
        const stage = String(item?.stage ?? "").trim();
        const greenDays = normalizeSlaDays(item?.greenDays);
        const yellowDays = normalizeSlaDays(item?.yellowDays);

        if (!stage || greenDays === null || yellowDays === null) {
            continue;
        }

        columns[stage] = { greenDays, yellowDays };
    }

    return { columns };
}

function buildSlaConfigApiPayload(columns) {
    return columns
        .filter((column) => column.trackAging)
        .map((column) => ({
            stage: column.id,
            greenDays: normalizeSlaDays(column.greenDays) ?? 0,
            yellowDays: normalizeSlaDays(column.yellowDays) ?? 0,
        }));
}

// ─── Test helpers ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
    if (condition) {
        passed++;
    } else {
        failed++;
        failures.push(message);
        console.error(`FAIL: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    assert(ok, `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}

function buildColumns() {
    return [
        { id: "recibido", name: "Recibido", order: 1, greenDays: 0, yellowDays: 0, trackAging: false },
        { id: "diagnostico", name: "Diagnostico", order: 2, greenDays: 2, yellowDays: 2, trackAging: true },
        { id: "reparacion", name: "Reparacion", order: 3, greenDays: 3, yellowDays: 1, trackAging: true },
        { id: "entregado", name: "Entregado", order: 4, greenDays: 0, yellowDays: 0, trackAging: false },
    ];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log("── Global config applies to all trackAging columns ──");
{
    const columns = buildColumns();
    const result = applySlaConfigToColumns(columns, { greenDays: 5, yellowDays: 3 });

    assertEqual(result[1].greenDays, 5, "diagnostico greenDays = 5");
    assertEqual(result[1].yellowDays, 3, "diagnostico yellowDays = 3");
    assertEqual(result[2].greenDays, 5, "reparacion greenDays = 5");
    assertEqual(result[2].yellowDays, 3, "reparacion yellowDays = 3");
}

console.log("── Per-column config applies only to that column and beats global ──");
{
    const columns = buildColumns();
    const result = applySlaConfigToColumns(columns, {
        greenDays: 5,
        yellowDays: 3,
        columns: { reparacion: { greenDays: 9, yellowDays: 4 } },
    });

    assertEqual(result[1].greenDays, 5, "diagnostico keeps global greenDays = 5");
    assertEqual(result[2].greenDays, 9, "reparacion override greenDays = 9");
    assertEqual(result[2].yellowDays, 4, "reparacion override yellowDays = 4");

    const onlyPerColumn = applySlaConfigToColumns(buildColumns(), {
        columns: { diagnostico: { greenDays: 7 } },
    });
    assertEqual(onlyPerColumn[1].greenDays, 7, "diagnostico override greenDays = 7");
    assertEqual(onlyPerColumn[1].yellowDays, 2, "diagnostico keeps its own yellowDays");
    assertEqual(onlyPerColumn[2].greenDays, 3, "reparacion untouched without global");
}

console.log("── Columns without trackAging stay intact ──");
{
    const columns = buildColumns();
    const result = applySlaConfigToColumns(columns, {
        greenDays: 5,
        yellowDays: 3,
        columns: { recibido: { greenDays: 9, yellowDays: 9 } },
    });

    assertEqual(result[0], columns[0], "recibido (sin trackAging) keeps same reference");
    assertEqual(result[0].greenDays, 0, "recibido greenDays intacto con config global y por columna");
    assertEqual(result[3], columns[3], "entregado (sin trackAging) keeps same reference");
}

console.log("── Original array is not mutated ──");
{
    const columns = buildColumns();
    const snapshot = JSON.parse(JSON.stringify(columns));
    const result = applySlaConfigToColumns(columns, { greenDays: 8, yellowDays: 6 });

    assert(result !== columns, "returns a new array");
    assert(result[1] !== columns[1], "changed column is a new object");
    assertEqual(columns, snapshot, "original columns unchanged");
}

console.log("── Empty/null config leaves everything equal ──");
{
    for (const empty of [undefined, null, {}, { columns: {} }, { greenDays: "abc" }]) {
        const columns = buildColumns();
        const result = applySlaConfigToColumns(columns, empty);
        assert(result !== columns, "still returns a new array");
        assertEqual(result, columns, `config ${JSON.stringify(empty)} leaves values equal`);
    }
}

console.log("── API payload round-trip (backend []SLAConfig shape) ──");
{
    const apiPayload = [
        { stage: "diagnostico", greenDays: 6, yellowDays: 2 },
        { stage: "reparacion", greenDays: 10, yellowDays: 5 },
        { stage: "etapa-desconocida", greenDays: 1, yellowDays: 1 },
        { stage: " ", greenDays: 1, yellowDays: 1 },
        { stage: "clamp", greenDays: -1, yellowDays: 1 },
    ];
    const config = slaConfigFromApiPayload(apiPayload);
    assertEqual(Object.keys(config.columns).sort(), ["clamp", "diagnostico", "etapa-desconocida", "reparacion"], "stage vacio se descarta");
    assertEqual(config.columns.diagnostico, { greenDays: 6, yellowDays: 2 }, "diagnostico parsed");
    assertEqual(config.columns.clamp, { greenDays: 0, yellowDays: 1 }, "negativos se clampean a 0 (el backend los rechaza con 400)");

    const result = applySlaConfigToColumns(buildColumns(), config);
    assertEqual(result[1].greenDays, 6, "diagnostico desde API = 6");
    assertEqual(result[2].greenDays, 10, "reparacion desde API = 10");
    assertEqual(result[0].greenDays, 0, "recibido sin trackAging intacto");

    const out = buildSlaConfigApiPayload(buildColumns());
    assertEqual(out, [
        { stage: "diagnostico", greenDays: 2, yellowDays: 2 },
        { stage: "reparacion", greenDays: 3, yellowDays: 1 },
    ], "buildSlaConfigApiPayload solo emite columnas trackAging");
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
