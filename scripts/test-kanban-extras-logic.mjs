/**
 * Unit tests — Kanban extras logic (mirrors src/app/pages/app/projects/kanban-extras.logic.ts)
 *
 * Tests:
 *  - buildSlaSummary: per-column counts and dominant (most severe) severity
 *  - accumulateQuarterHours: quarter-hour rounding (0 -> 0, 1 -> 0.25, 15 -> 0.25, 16 -> 0.5, 60 -> 1)
 *  - requiresAccessoriesConfirmation: accessories string and borrowed equipments shapes
 *  - resolveWarrantyBoardStatus: garantia with pending parts, garantia without, other statuses intact
 *
 * Run: node scripts/test-kanban-extras-logic.mjs
 */

// ─── Business logic implementations (mirror of kanban-extras.logic.ts) ───────

const SLA_SEVERITY_RANK = {
    "neutral": 0,
    "success": 1,
    "warning": 2,
    "overdue": 3,
    "critical": 4,
};

function normalizeSlaSeverity(value) {
    const key = String(value ?? "neutral");
    return key in SLA_SEVERITY_RANK ? key : "neutral";
}

function buildSlaSummary(columns, projects, resolveSeverity) {
    const safeColumns = Array.isArray(columns) ? columns : [];
    const safeProjects = Array.isArray(projects) ? projects : [];

    return safeColumns.map((column) => {
        const columnProjects = safeProjects.filter((project) => String(project?.status ?? "") === String(column?.id ?? ""));
        let severity = "neutral";

        columnProjects.forEach((project) => {
            const next = normalizeSlaSeverity(resolveSeverity ? resolveSeverity(project, column) : project?.slaSeverity);
            if (SLA_SEVERITY_RANK[next] > SLA_SEVERITY_RANK[severity]) {
                severity = next;
            }
        });

        return {
            columnId: String(column?.id ?? ""),
            title: String(column?.name ?? ""),
            count: columnProjects.length,
            severity,
        };
    });
}

function accumulateQuarterHours(minutes) {
    const safeMinutes = Number(minutes);
    if (!Number.isFinite(safeMinutes) || safeMinutes <= 0) {
        return 0;
    }

    return Math.ceil(safeMinutes / 15) * 0.25;
}

function requiresAccessoriesConfirmation(equipment) {
    if (!equipment) {
        return false;
    }

    if (String(equipment.accessories ?? "").trim()) {
        return true;
    }

    const borrowed = Array.isArray(equipment?.borrowedEquipments) ? equipment.borrowedEquipments : [];
    return borrowed.some((item) => String(item ?? "").trim().length > 0);
}

function resolveWarrantyBoardStatus(status, hasPendingParts) {
    if (String(status ?? "") === "garantia" && hasPendingParts) {
        return "garantia-espera-repuestos";
    }

    return String(status ?? "");
}

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

console.log("\n=== Unit Tests: Kanban Extras Logic ===\n");

console.log("── buildSlaSummary: counts and dominant severity ──");
const summaryColumns = [
    { id: "reparacion", name: "Reparacion" },
    { id: "pruebas", name: "Pruebas QA" },
    { id: "entregado", name: "Entregado" },
];
const summaryProjects = [
    { id: "P1", status: "reparacion", slaSeverity: "success" },
    { id: "P2", status: "reparacion", slaSeverity: "overdue" },
    { id: "P3", status: "reparacion", slaSeverity: "warning" },
    { id: "P4", status: "pruebas", slaSeverity: "success" },
    { id: "P5", status: "pruebas", slaSeverity: "success" },
    { id: "P6", status: "otra-columna", slaSeverity: "critical" },
];

const summary = buildSlaSummary(summaryColumns, summaryProjects);
assertEqual(summary.length, 3, "One chip per column");
assertEqual(summary[0].columnId, "reparacion", "Chip keeps column id");
assertEqual(summary[0].title, "Reparacion", "Chip keeps column title");
assertEqual(summary[0].count, 3, "Reparacion counts 3 cards");
assertEqual(summary[0].severity, "overdue", "Dominant = most severe (overdue beats warning/success)");
assertEqual(summary[1].count, 2, "Pruebas counts 2 cards");
assertEqual(summary[1].severity, "success", "Pruebas dominant is success");
assertEqual(summary[2].count, 0, "Empty column counts 0");
assertEqual(summary[2].severity, "neutral", "Empty column severity is neutral");
assert(!summary.some((chip) => chip.columnId === "otra-columna"), "Projects from unknown columns are ignored");

console.log("\n── buildSlaSummary: resolver and edge cases ──");
const withCritical = buildSlaSummary(summaryColumns, summaryProjects, (project) => project.slaSeverity);
assertEqual(withCritical[0].severity, "overdue", "Resolver drives severity when provided");
const criticalOnly = buildSlaSummary(summaryColumns, [{ status: "pruebas", slaSeverity: "critical" }]);
assertEqual(criticalOnly[1].severity, "critical", "Critical dominates everything");
const unknownSeverity = buildSlaSummary(summaryColumns, [{ status: "pruebas", slaSeverity: "inventado" }]);
assertEqual(unknownSeverity[1].severity, "neutral", "Unknown severity falls back to neutral");
assertEqual(buildSlaSummary(null, null).length, 0, "Null columns -> empty summary");
assertEqual(buildSlaSummary(summaryColumns, null)[0].count, 0, "Null projects -> zero counts");

console.log("\n── accumulateQuarterHours ──");
assertEqual(accumulateQuarterHours(0), 0, "0 minutes -> 0 h");
assertEqual(accumulateQuarterHours(1), 0.25, "1 minute -> 0.25 h");
assertEqual(accumulateQuarterHours(15), 0.25, "15 minutes -> 0.25 h");
assertEqual(accumulateQuarterHours(16), 0.5, "16 minutes -> 0.5 h");
assertEqual(accumulateQuarterHours(60), 1, "60 minutes -> 1 h");
assertEqual(accumulateQuarterHours(61), 1.25, "61 minutes -> 1.25 h");
assertEqual(accumulateQuarterHours(-5), 0, "Negative minutes -> 0 h");
assertEqual(accumulateQuarterHours(null), 0, "Null -> 0 h");
assertEqual(accumulateQuarterHours(undefined), 0, "Undefined -> 0 h");
assertEqual(accumulateQuarterHours("abc"), 0, "Non-numeric -> 0 h");

console.log("\n── requiresAccessoriesConfirmation ──");
assert(requiresAccessoriesConfirmation({ accessories: "Cable y manual" }), "Accessories text -> confirmation required");
assert(requiresAccessoriesConfirmation({ borrowedEquipments: ["EQ-1"] }), "Borrowed equipments -> confirmation required");
assert(requiresAccessoriesConfirmation({ accessories: "", borrowedEquipments: ["EQ-9", "EQ-10"] }), "Only borrowed list -> confirmation required");
assert(!requiresAccessoriesConfirmation({ accessories: "" }), "Empty accessories -> no confirmation");
assert(!requiresAccessoriesConfirmation({ accessories: "   " }), "Whitespace accessories -> no confirmation");
assert(!requiresAccessoriesConfirmation({ borrowedEquipments: [] }), "Empty borrowed list -> no confirmation");
assert(!requiresAccessoriesConfirmation({ borrowedEquipments: ["", "  "] }), "Blank borrowed entries -> no confirmation");
assert(!requiresAccessoriesConfirmation({}), "Equipment without extras -> no confirmation");
assert(!requiresAccessoriesConfirmation(null), "Null equipment -> no confirmation");
assert(!requiresAccessoriesConfirmation(undefined), "Undefined equipment -> no confirmation");

console.log("\n── resolveWarrantyBoardStatus ──");
assertEqual(resolveWarrantyBoardStatus("garantia", true), "garantia-espera-repuestos", "garantia + pending parts -> garantia-espera-repuestos");
assertEqual(resolveWarrantyBoardStatus("garantia", false), "garantia", "garantia without pending parts -> garantia");
assertEqual(resolveWarrantyBoardStatus("garantia-espera-repuestos", false), "garantia-espera-repuestos", "garantia-espera-repuestos stays even without pending parts");
assertEqual(resolveWarrantyBoardStatus("reparacion", true), "reparacion", "reparacion + pending parts -> reparacion (intact)");
assertEqual(resolveWarrantyBoardStatus("reparacion", false), "reparacion", "reparacion without pending parts -> reparacion");
assertEqual(resolveWarrantyBoardStatus("recibido", true), "recibido", "recibido + pending parts -> recibido (intact)");
assertEqual(resolveWarrantyBoardStatus("listo-entrega", false), "listo-entrega", "listo-entrega stays intact");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
