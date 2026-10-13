/**
 * Unit tests — Work time logic (mirror of src/app/pages/app/work/work-time.logic.ts)
 *
 * Tests:
 *  - Quarter-hour rounding (accumulateQuarterHours)
 *  - Daily balance vs 8h target (calculateDailyBalance)
 *  - KPI estimated vs actual (calculateTimeKpi, same thresholds as test-sla-kpi-logic.mjs)
 *  - Totals per entry type (summarizeByEntryType, missing type counts as normal)
 *
 * Run: node scripts/test-work-time-logic.mjs
 */

// ─── Logic mirror (keep in sync with work-time.logic.ts) ─────────────────────

const WORK_ENTRY_TYPES = ["normal", "hora-extra", "permiso", "ausencia", "festivo"];

function accumulateQuarterHours(minutes) {
    return Math.ceil(minutes / 15) * 0.25;
}

function calculateDailyBalance(entries, targetHours = 8) {
    const totalWorked = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const balance = totalWorked - targetHours;

    return {
        totalWorked: Math.round(totalWorked * 100) / 100,
        targetHours,
        balance: Math.round(balance * 100) / 100,
        missing: Math.round(Math.max(targetHours - totalWorked, 0) * 100) / 100,
        extra: Math.round(Math.max(totalWorked - targetHours, 0) * 100) / 100,
        completed: totalWorked >= targetHours,
    };
}

function calculateTimeKpi(estimatedHours, actualHours) {
    if (!estimatedHours || estimatedHours <= 0) {
        return { efficiency: 0, deviation: 0, deviationPercent: 0, status: "sin-estimacion" };
    }

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

function summarizeByEntryType(entries) {
    const summary = {};
    for (const type of WORK_ENTRY_TYPES) {
        summary[type] = { count: 0, hours: 0 };
    }

    for (const entry of entries) {
        const type = WORK_ENTRY_TYPES.includes(entry.entryType) ? entry.entryType : "normal";
        summary[type].count += 1;
        summary[type].hours = Math.round((summary[type].hours + entry.hours) * 100) / 100;
    }

    return summary;
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

console.log("\n=== Unit Tests: Work Time Logic ===\n");

console.log("── Quarter-Hour Accumulation ──");
assertEqual(accumulateQuarterHours(0), 0, "0 min → 0 h");
assertEqual(accumulateQuarterHours(1), 0.25, "1 min → 0.25 h (rounds up)");
assertEqual(accumulateQuarterHours(15), 0.25, "15 min → 0.25 h");
assertEqual(accumulateQuarterHours(16), 0.5, "16 min → 0.5 h (rounds up)");
assertEqual(accumulateQuarterHours(60), 1.0, "60 min → 1.0 h");
assertEqual(accumulateQuarterHours(90), 1.5, "90 min → 1.5 h");

console.log("\n── Daily Balance vs 8h ──");
const less = calculateDailyBalance([{ hours: 3 }, { hours: 2 }]);
assertEqual(less.totalWorked, 5, "Less: 3 + 2 = 5 h worked");
assertEqual(less.missing, 3, "Less: missing 3 h");
assertEqual(less.extra, 0, "Less: no extra hours");
assertEqual(less.balance, -3, "Less: balance -3");
assertEqual(less.completed, false, "Less: 5 h does not meet 8 h target");

const exact = calculateDailyBalance([{ hours: 4 }, { hours: 2.5 }, { hours: 1.5 }]);
assertEqual(exact.totalWorked, 8, "Exact: 4 + 2.5 + 1.5 = 8 h worked");
assertEqual(exact.balance, 0, "Exact: balance 0");
assertEqual(exact.missing, 0, "Exact: missing 0");
assertEqual(exact.extra, 0, "Exact: extra 0");
assertEqual(exact.completed, true, "Exact: 8 h meets 8 h target");

const more = calculateDailyBalance([{ hours: 6 }, { hours: 3.5 }]);
assertEqual(more.totalWorked, 9.5, "More: 6 + 3.5 = 9.5 h worked");
assertEqual(more.extra, 1.5, "More: 1.5 h extra");
assertEqual(more.missing, 0, "More: missing 0");
assertEqual(more.balance, 1.5, "More: balance +1.5");
assertEqual(more.completed, true, "More: 9.5 h exceeds 8 h target");

const customTarget = calculateDailyBalance([{ hours: 4 }], 4);
assertEqual(customTarget.completed, true, "Custom target 4 h: 4 h completes");

console.log("\n── KPI: Estimated vs Actual ──");
assertEqual(calculateTimeKpi(10, 8).status, "rentable", "10 est / 8 real → rentable");
assertEqual(calculateTimeKpi(10, 10).status, "rentable", "10 est / 10 real → rentable (exact, efficiency 100)");
assertEqual(calculateTimeKpi(10, 12).status, "aceptable", "10 est / 12 real → aceptable (efficiency >= 80)");
assertEqual(calculateTimeKpi(10, 15).status, "deficitario", "10 est / 15 real → deficitario (efficiency >= 60)");
assertEqual(calculateTimeKpi(10, 20).status, "critico", "10 est / 20 real → critico (efficiency < 60)");
assertEqual(calculateTimeKpi(0, 5).status, "sin-estimacion", "0 estimated → sin-estimacion");
assertEqual(calculateTimeKpi(10, 10).efficiency, 100, "Exact match → efficiency 100");
assertEqual(calculateTimeKpi(10, 12).deviation, 2, "10 est / 12 real → deviation +2");

console.log("\n── Summary by Entry Type ──");
const summary = summarizeByEntryType([
    { hours: 2, entryType: "normal" },
    { hours: 1.5 }, // sin tipo → normal
    { hours: 3, entryType: "hora-extra" },
    { hours: 0.5, entryType: "hora-extra" },
    { hours: 1, entryType: "permiso" },
    { hours: 2, entryType: "ausencia" },
    { hours: 4, entryType: "festivo" },
    { hours: 0.75, entryType: "desconocido" }, // tipo invalido → normal
]);
assertEqual(summary.normal.count, 3, "normal: 3 entries (typed + untyped + unknown)");
assertEqual(summary.normal.hours, 4.25, "normal: 2 + 1.5 + 0.75 = 4.25 h");
assertEqual(summary["hora-extra"].count, 2, "hora-extra: 2 entries");
assertEqual(summary["hora-extra"].hours, 3.5, "hora-extra: 3 + 0.5 = 3.5 h");
assertEqual(summary.permiso.count, 1, "permiso: 1 entry");
assertEqual(summary.permiso.hours, 1, "permiso: 1 h");
assertEqual(summary.ausencia.count, 1, "ausencia: 1 entry");
assertEqual(summary.ausencia.hours, 2, "ausencia: 2 h");
assertEqual(summary.festivo.count, 1, "festivo: 1 entry");
assertEqual(summary.festivo.hours, 4, "festivo: 4 h");

const emptySummary = summarizeByEntryType([]);
assertEqual(emptySummary.normal.count, 0, "Empty entries → all counts 0");
assertEqual(emptySummary.festivo.hours, 0, "Empty entries → all hours 0");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
