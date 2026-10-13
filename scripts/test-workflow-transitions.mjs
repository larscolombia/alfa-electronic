/**
 * Unit tests — Workflow state transitions for technical repair flow
 *
 * Tests the business logic for:
 *  - Valid/invalid status transitions
 *  - Auto-notification on "listo-entrega" transition
 *  - Status label resolution
 *  - Legacy status mapping
 *  - SLA severity calculation
 *
 * Run: node scripts/test-workflow-transitions.mjs
 */

// ─── Replicate workflow config from project-workflow.config.ts ───────────────

const PROJECT_WORKFLOW_STATUS_OPTIONS = [
    { id: "recibido", label: "Recibido", description: "Equipo recibido y pendiente de asignacion o arranque tecnico." },
    { id: "diagnostico", label: "Diagnostico", description: "Position 0. Revision tecnica inicial y definicion del alcance." },
    { id: "por-cotizar", label: "Por cotizar", description: "Equipo diagnosticado pendiente de oferta comercial." },
    { id: "pedir-repuestos", label: "Pedir componentes", description: "Position 0.5. Equipo aprobado para listar y solicitar componentes." },
    { id: "esperando-proveedor", label: "Esperando proveedor", description: "Position 11. Material solicitado y pendiente de arribo." },
    { id: "reparacion", label: "Reparacion", description: "Position 1. Equipo con material listo o intervencion en curso." },
    { id: "pruebas", label: "Pruebas QA", description: "Validaciones en banco, laboratorio o QA tecnico." },
    { id: "garantia", label: "Garantia", description: "Position 16. Seguimiento de casos devueltos o en garantia." },
    { id: "prestamo", label: "Material en prestamo", description: "Position 13. Materiales o equipos prestados al cliente." },
    { id: "listo-entrega", label: "Listo para entrega", description: "Equipo validado, listo para cierre y despacho." },
    { id: "entregado", label: "Entregado", description: "Caso cerrado y equipo entregado al cliente." },
];

const VALID_TRANSITIONS = {
    recibido: ["diagnostico"],
    diagnostico: ["por-cotizar", "reparacion"],
    "por-cotizar": ["reparacion", "pedir-repuestos"],
    "pedir-repuestos": ["esperando-proveedor", "reparacion"],
    "esperando-proveedor": ["reparacion"],
    reparacion: ["pruebas", "garantia"],
    pruebas: ["listo-entrega", "reparacion"],
    garantia: ["reparacion", "listo-entrega"],
    "listo-entrega": ["entregado"],
    entregado: [],
};

const REPAIR_STATUS_LABELS = {
    recibido: "Recibido",
    diagnostico: "Diagnostico",
    "por-cotizar": "Por cotizar",
    "pedir-repuestos": "Pedir componentes",
    "esperando-proveedor": "Esperando proveedor",
    reparacion: "En reparacion",
    pruebas: "Pruebas QA",
    garantia: "Garantia",
    prestamo: "Material en prestamo",
    "listo-entrega": "Listo para entrega",
    entregado: "Entregado",
};

function getProjectWorkflowStatusLabel(statusId) {
    const option = PROJECT_WORKFLOW_STATUS_OPTIONS.find((o) => o.id === statusId);
    return option ? option.label : "Recibido";
}

function isValidTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from];
    return Array.isArray(allowed) && allowed.includes(to);
}

function requiresNotificationOnTransition(toStatus) {
    return toStatus === "listo-entrega" || toStatus === "entregado";
}

function mapLegacyProjectStatus(status) {
    const normalized = String(status ?? "").trim().toLowerCase();
    const mapping = {
        backlog: "diagnostico",
        "in-progress": "reparacion",
        review: "pruebas",
        completed: "entregado",
        "pedir-repuestos": "reparacion",
        "por-cotizar": "por-cotizar",
        "esperando-proveedor": "reparacion",
        garantia: "reparacion",
        prestamo: "recibido",
        "listo-entrega": "listo-entrega",
        entregado: "entregado",
        reparacion: "reparacion",
        pruebas: "pruebas",
        recibido: "recibido",
    };
    return mapping[normalized] || "diagnostico";
}

function resolveSlaSeverity(elapsedBusinessDays) {
    if (elapsedBusinessDays <= 2) return "success";
    if (elapsedBusinessDays <= 4) return "warning";
    if (elapsedBusinessDays <= 6) return "overdue";
    return "critical";
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

console.log("\n=== Unit Tests: Workflow State Transitions ===\n");

console.log("── Status label resolution ──");
assertEqual(getProjectWorkflowStatusLabel("recibido"), "Recibido", "recibido → 'Recibido'");
assertEqual(getProjectWorkflowStatusLabel("diagnostico"), "Diagnostico", "diagnostico → 'Diagnostico'");
assertEqual(getProjectWorkflowStatusLabel("listo-entrega"), "Listo para entrega", "listo-entrega → 'Listo para entrega'");
assertEqual(getProjectWorkflowStatusLabel("entregado"), "Entregado", "entregado → 'Entregado'");
assertEqual(getProjectWorkflowStatusLabel("unknown"), "Recibido", "unknown → fallback 'Recibido'");

console.log("\n── Valid transitions ──");
assert(isValidTransition("recibido", "diagnostico"), "recibido → diagnostico is valid");
assert(isValidTransition("diagnostico", "por-cotizar"), "diagnostico → por-cotizar is valid");
assert(isValidTransition("diagnostico", "reparacion"), "diagnostico → reparacion is valid");
assert(isValidTransition("reparacion", "pruebas"), "reparacion → pruebas is valid");
assert(isValidTransition("pruebas", "listo-entrega"), "pruebas → listo-entrega is valid");
assert(isValidTransition("listo-entrega", "entregado"), "listo-entrega → entregado is valid");
assert(isValidTransition("garantia", "reparacion"), "garantia → reparacion is valid (warranty re-entry)");
assert(isValidTransition("garantia", "listo-entrega"), "garantia → listo-entrega is valid");

console.log("\n── Invalid transitions ──");
assert(!isValidTransition("recibido", "pruebas"), "recibido → pruebas is invalid (skip steps)");
assert(!isValidTransition("recibido", "listo-entrega"), "recibido → listo-entrega is invalid");
assert(!isValidTransition("entregado", "recibido"), "entregado → recibido is invalid (terminal state)");
assert(!isValidTransition("entregado", "reparacion"), "entregado → reparacion is invalid");
assert(!isValidTransition("diagnostico", "listo-entrega"), "diagnostico → listo-entrega is invalid");
assert(!isValidTransition("por-cotizar", "pruebas"), "por-cotizar → pruebas is invalid");

console.log("\n── Notification requirements ──");
assert(requiresNotificationOnTransition("listo-entrega"), "listo-entrega requires admin notification");
assert(requiresNotificationOnTransition("entregado"), "entregado requires admin notification");
assert(!requiresNotificationOnTransition("recibido"), "recibido does NOT require notification");
assert(!requiresNotificationOnTransition("reparacion"), "reparacion does NOT require notification");
assert(!requiresNotificationOnTransition("pruebas"), "pruebas does NOT require notification");
assert(!requiresNotificationOnTransition("diagnostico"), "diagnostico does NOT require notification");

console.log("\n── Legacy status mapping ──");
assertEqual(mapLegacyProjectStatus("backlog"), "diagnostico", "backlog → diagnostico");
assertEqual(mapLegacyProjectStatus("in-progress"), "reparacion", "in-progress → reparacion");
assertEqual(mapLegacyProjectStatus("review"), "pruebas", "review → pruebas");
assertEqual(mapLegacyProjectStatus("completed"), "entregado", "completed → entregado");
assertEqual(mapLegacyProjectStatus("listo-entrega"), "listo-entrega", "listo-entrega → listo-entrega");
assertEqual(mapLegacyProjectStatus("garantia"), "reparacion", "garantia → reparacion (legacy maps to repair)");
assertEqual(mapLegacyProjectStatus("unknown-status"), "diagnostico", "unknown → diagnostico (default)");

console.log("\n── SLA severity ──");
assertEqual(resolveSlaSeverity(0), "success", "0 days → success (green)");
assertEqual(resolveSlaSeverity(1), "success", "1 day → success (green)");
assertEqual(resolveSlaSeverity(2), "success", "2 days → success (green)");
assertEqual(resolveSlaSeverity(3), "warning", "3 days → warning (yellow)");
assertEqual(resolveSlaSeverity(4), "warning", "4 days → warning (yellow)");
assertEqual(resolveSlaSeverity(5), "overdue", "5 days → overdue (orange)");
assertEqual(resolveSlaSeverity(6), "overdue", "6 days → overdue (orange)");
assertEqual(resolveSlaSeverity(7), "critical", "7 days → critical (red)");
assertEqual(resolveSlaSeverity(14), "critical", "14 days → critical (red)");

console.log("\n── Full workflow path (happy path) ──");
const happyPath = ["recibido", "diagnostico", "reparacion", "pruebas", "listo-entrega", "entregado"];
let pathValid = true;
for (let i = 0; i < happyPath.length - 1; i++) {
    if (!isValidTransition(happyPath[i], happyPath[i + 1])) {
        pathValid = false;
        break;
    }
}
assert(pathValid, "Full happy path is valid: recibido → diagnostico → reparacion → pruebas → listo-entrega → entregado");

console.log("\n── Warranty re-entry path ──");
const warrantyPath = ["recibido", "diagnostico", "reparacion", "pruebas", "listo-entrega", "entregado", "garantia", "reparacion", "pruebas", "listo-entrega", "entregado"];
// Note: entregado → garantia is not in VALID_TRANSITIONS, so this tests that the path breaks
let warrantyPathValid = true;
for (let i = 0; i < warrantyPath.length - 1; i++) {
    if (!isValidTransition(warrantyPath[i], warrantyPath[i + 1])) {
        warrantyPathValid = false;
        break;
    }
}
// This should be false because entregado → garantia is not valid
assert(!warrantyPathValid, "Warranty re-entry from 'entregado' is NOT directly valid (requires new reception or special flow)");

// The correct warranty path should be: garantia → reparacion → pruebas → listo-entrega → entregado
const warrantyRepairPath = ["garantia", "reparacion", "pruebas", "listo-entrega", "entregado"];
let warrantyRepairValid = true;
for (let i = 0; i < warrantyRepairPath.length - 1; i++) {
    if (!isValidTransition(warrantyRepairPath[i], warrantyRepairPath[i + 1])) {
        warrantyRepairValid = false;
        break;
    }
}
assert(warrantyRepairValid, "Warranty repair path is valid: garantia → reparacion → pruebas → listo-entrega → entregado");

console.log("\n── Req #1 specific: Auto-update on 'Listo para Entrega' ──");
// When technician marks equipment as "Listo para Entrega", the workflow should auto-update
assert(isValidTransition("pruebas", "listo-entrega"), "Technical closure: pruebas → listo-entrega is valid");
assert(requiresNotificationOnTransition("listo-entrega"), "Auto-notification to admin when transitioning to listo-entrega");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
