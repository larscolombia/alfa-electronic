/**
 * Unit tests — SLA colors, parametrizable deadlines, KPIs, search normalization
 *
 * Tests:
 *  - SLA severity color resolution (green/yellow/orange/red)
 *  - Parametrizable SLA deadlines per stage
 *  - KPI calculation (estimated vs actual hours, profitability)
 *  - Search token normalization (spaces, special chars)
 *  - Warranty legal period counter
 *  - Time tracking quarter-hour accumulation
 *
 * Run: node scripts/test-sla-kpi-logic.mjs
 */

// ─── SLA Color Logic ─────────────────────────────────────────────────────────

const DEFAULT_SLA_CONFIG = {
    diagnostico: { greenDays: 2, yellowDays: 2 },
    "por-cotizar": { greenDays: 2, yellowDays: 1 },
    reparacion: { greenDays: 3, yellowDays: 1 },
    pruebas: { greenDays: 1, yellowDays: 1 },
    "listo-entrega": { greenDays: 1, yellowDays: 1 },
};

function resolveSlaColor(elapsedBusinessDays, stageConfig) {
    if (!stageConfig) return { color: "neutral", label: "Sin SLA" };
    const greenLimit = stageConfig.greenDays;
    const yellowLimit = greenLimit + stageConfig.yellowDays;
    const orangeLimit = yellowLimit + 2;

    if (elapsedBusinessDays <= greenLimit) return { color: "green", label: "Verde" };
    if (elapsedBusinessDays <= yellowLimit) return { color: "yellow", label: "Amarillo" };
    if (elapsedBusinessDays <= orangeLimit) return { color: "orange", label: "Naranja" };
    return { color: "red", label: "Rojo" };
}

function buildParametrizableSlaConfig(overrides = {}) {
    const config = { ...DEFAULT_SLA_CONFIG };
    for (const [stage, values] of Object.entries(overrides)) {
        if (config[stage]) {
            config[stage] = { ...config[stage], ...values };
        } else {
            config[stage] = values;
        }
    }
    return config;
}

// ─── KPI Calculations ────────────────────────────────────────────────────────

function calculateTimeKpi(estimatedHours, actualHours) {
    if (!estimatedHours || estimatedHours <= 0) return { efficiency: 0, status: "sin-estimacion" };
    const efficiency = (estimatedHours / actualHours) * 100;
    const deviation = actualHours - estimatedHours;
    const deviationPercent = (deviation / estimatedHours) * 100;

    let status;
    if (efficiency >= 100) status = "rentable";
    else if (efficiency >= 80) status = "aceptable";
    else if (efficiency >= 60) status = "deficitario";
    else status = "critico";

    return {
        efficiency: Math.round(efficiency * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercent: Math.round(deviationPercent * 100) / 100,
        status,
    };
}

function calculateDailyBalance(entries, targetHours = 8) {
    const totalWorked = entries.reduce((sum, e) => sum + e.hours, 0);
    return {
        totalWorked: Math.round(totalWorked * 100) / 100,
        targetHours,
        balance: Math.round((totalWorked - targetHours) * 100) / 100,
        completed: totalWorked >= targetHours,
    };
}

function accumulateQuarterHours(minutes) {
    return Math.ceil(minutes / 15) * 0.25;
}

// ─── Search Normalization ────────────────────────────────────────────────────

function normalizeSearchToken(text) {
    return String(text || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function fuzzySearchMatch(query, target) {
    const normalizedQuery = normalizeSearchToken(query);
    const normalizedTarget = normalizeSearchToken(target);
    if (!normalizedQuery) return false;
    if (normalizedTarget === normalizedQuery) return true;
    if (normalizedTarget.includes(normalizedQuery)) return true;
    if (normalizedQuery.includes(normalizedTarget)) return true;
    return false;
}

// ─── Warranty Counter ────────────────────────────────────────────────────────

function calculateWarrantyRemaining(deliveryDate, warrantyMonths) {
    const delivery = new Date(deliveryDate);
    const expiry = new Date(delivery);
    expiry.setMonth(expiry.getMonth() + warrantyMonths);
    const now = new Date();
    const remainingMs = expiry.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    return {
        expiryDate: expiry.toISOString().split("T")[0],
        remainingDays: Math.max(0, remainingDays),
        remainingMonths: Math.max(0, Math.floor(remainingDays / 30)),
        active: remainingDays > 0,
    };
}

// ─── Test Runner ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, description) {
    if (condition) { passed++; console.log(`  ✓ ${description}`); }
    else { failed++; failures.push(description); console.log(`  ✗ ${description}`); }
}

function assertEqual(actual, expected, description) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) description += ` (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`;
    assert(ok, description);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log("\n=== Unit Tests: SLA, KPIs, Search, Warranty ===\n");

console.log("── SLA Color Resolution ──");
const diagConfig = DEFAULT_SLA_CONFIG.diagnostico;
assertEqual(resolveSlaColor(1, diagConfig).color, "green", "1 day in diagnostico → green");
assertEqual(resolveSlaColor(2, diagConfig).color, "green", "2 days in diagnostico → green");
assertEqual(resolveSlaColor(3, diagConfig).color, "yellow", "3 days in diagnostico → yellow");
assertEqual(resolveSlaColor(4, diagConfig).color, "yellow", "4 days in diagnostico → yellow");
assertEqual(resolveSlaColor(5, diagConfig).color, "orange", "5 days in diagnostico → orange");
assertEqual(resolveSlaColor(6, diagConfig).color, "orange", "6 days in diagnostico → orange");
assertEqual(resolveSlaColor(7, diagConfig).color, "red", "7 days in diagnostico → red");
assertEqual(resolveSlaColor(14, diagConfig).color, "red", "14 days in diagnostico → red");

const repairConfig = DEFAULT_SLA_CONFIG.reparacion;
assertEqual(resolveSlaColor(3, repairConfig).color, "green", "3 days in reparacion → green");
assertEqual(resolveSlaColor(5, repairConfig).color, "orange", "5 days in reparacion → orange");

assertEqual(resolveSlaColor(1, null).color, "neutral", "No config → neutral");

console.log("\n── Parametrizable SLA ──");
const customConfig = buildParametrizableSlaConfig({
    diagnostico: { greenDays: 5, yellowDays: 3 },
});
assertEqual(customConfig.diagnostico.greenDays, 5, "Custom diagnostico green = 5 days");
assertEqual(customConfig.diagnostico.yellowDays, 3, "Custom diagnostico yellow = 3 days");
assertEqual(resolveSlaColor(4, customConfig.diagnostico).color, "green", "4 days with custom config → green (was yellow)");
assertEqual(resolveSlaColor(7, customConfig.diagnostico).color, "yellow", "7 days with custom config → yellow");

const newStage = buildParametrizableSlaConfig({
    "garantia-espera": { greenDays: 3, yellowDays: 2 },
});
assert(newStage["garantia-espera"] !== undefined, "Can add new stage to SLA config");
assertEqual(resolveSlaColor(2, newStage["garantia-espera"]).color, "green", "New stage works with custom deadlines");

console.log("\n── KPI: Estimated vs Actual Hours ──");
const kpi1 = calculateTimeKpi(10, 8);
assertEqual(kpi1.status, "rentable", "10h estimated, 8h actual → rentable");
assert(kpi1.efficiency > 100, "Efficiency > 100% when under budget");

const kpi2 = calculateTimeKpi(10, 10);
assertEqual(kpi2.status, "rentable", "10h estimated, 10h actual → rentable (exact)");
assertEqual(kpi2.efficiency, 100, "Efficiency = 100% on exact match");

const kpi3 = calculateTimeKpi(10, 12);
assertEqual(kpi3.status, "aceptable", "10h estimated, 12h actual → aceptable");
assert(kpi3.efficiency < 100, "Efficiency < 100% when over budget");

const kpi4 = calculateTimeKpi(10, 15);
assertEqual(kpi4.status, "deficitario", "10h estimated, 15h actual → deficitario");

const kpi5 = calculateTimeKpi(10, 20);
assertEqual(kpi5.status, "critico", "10h estimated, 20h actual → critico");

const kpi6 = calculateTimeKpi(0, 5);
assertEqual(kpi6.status, "sin-estimacion", "0 estimated → sin-estimacion");

console.log("\n── Daily Time Balance ──");
const entries1 = [{ hours: 4 }, { hours: 2.5 }, { hours: 1.5 }];
const balance1 = calculateDailyBalance(entries1);
assertEqual(balance1.totalWorked, 8, "4 + 2.5 + 1.5 = 8h worked");
assertEqual(balance1.completed, true, "8h meets 8h target");
assertEqual(balance1.balance, 0, "Balance = 0 when exact");

const entries2 = [{ hours: 3 }, { hours: 2 }];
const balance2 = calculateDailyBalance(entries2);
assertEqual(balance2.totalWorked, 5, "3 + 2 = 5h worked");
assertEqual(balance2.completed, false, "5h does not meet 8h target");
assertEqual(balance2.balance, -3, "Balance = -3h deficit");

console.log("\n── Quarter-Hour Accumulation ──");
assertEqual(accumulateQuarterHours(0), 0, "0 min → 0 quarters");
assertEqual(accumulateQuarterHours(1), 0.25, "1 min → 0.25h");
assertEqual(accumulateQuarterHours(15), 0.25, "15 min → 0.25h");
assertEqual(accumulateQuarterHours(16), 0.5, "16 min → 0.5h");
assertEqual(accumulateQuarterHours(30), 0.5, "30 min → 0.5h");
assertEqual(accumulateQuarterHours(45), 0.75, "45 min → 0.75h");
assertEqual(accumulateQuarterHours(60), 1.0, "60 min → 1.0h");
assertEqual(accumulateQuarterHours(90), 1.5, "90 min → 1.5h");

console.log("\n── Search Token Normalization ──");
assertEqual(normalizeSearchToken("iPhone 8"), "iphone8", "'iPhone 8' → 'iphone8'");
assertEqual(normalizeSearchToken("iPhone8"), "iphone8", "'iPhone8' → 'iphone8'");
assertEqual(normalizeSearchToken("  PLC  Siemens  "), "plcsiemens", "Spaces removed");
assertEqual(normalizeSearchToken("ABC-123_XYZ"), "abc123xyz", "Special chars removed");
assertEqual(normalizeSearchToken(""), "", "Empty string → empty");

console.log("\n── Fuzzy Search Matching ──");
assert(fuzzySearchMatch("iPhone 8", "iPhone8"), "'iPhone 8' matches 'iPhone8'");
assert(fuzzySearchMatch("iPhone8", "iPhone 8"), "'iPhone8' matches 'iPhone 8'");
assert(fuzzySearchMatch("PLC Siemens", "PLC-Siemens S7-1200"), "'PLC Siemens' matches 'PLC-Siemens S7-1200'");
assert(fuzzySearchMatch("servo", "Servomotor"), "'servo' matches 'Servomotor'");
assert(!fuzzySearchMatch("ABC", "XYZ"), "'ABC' does not match 'XYZ'");
assert(!fuzzySearchMatch("", "anything"), "Empty query does not match");

console.log("\n── Warranty Legal Period Counter ──");
const today = new Date();
const sixMonthsAgo = new Date(today);
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
const deliveryDate = sixMonthsAgo.toISOString().split("T")[0];

const warranty1 = calculateWarrantyRemaining(deliveryDate, 6);
assert(warranty1.remainingDays <= 5 && warranty1.remainingDays >= 0, "6-month warranty from 6 months ago → ~0 days remaining");

const recentDelivery = new Date(today);
recentDelivery.setDate(recentDelivery.getDate() - 30);
const warranty2 = calculateWarrantyRemaining(recentDelivery.toISOString().split("T")[0], 6);
assert(warranty2.active, "30-day-old delivery with 6-month warranty → still active");
assert(warranty2.remainingDays > 150, "Should have ~150+ days remaining");

const oldDelivery = new Date(today);
oldDelivery.setFullYear(oldDelivery.getFullYear() - 2);
const warranty3 = calculateWarrantyRemaining(oldDelivery.toISOString().split("T")[0], 6);
assert(!warranty3.active, "2-year-old delivery with 6-month warranty → expired");
assertEqual(warranty3.remainingDays, 0, "Expired warranty → 0 remaining days");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
