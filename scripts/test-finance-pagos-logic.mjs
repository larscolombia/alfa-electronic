/**
 * Unit tests — /finance-pagos, campo "Proyecto" del formulario de pago.
 * Espejo 1:1 de src/app/pages/app/finance/finance-pagos.logic.ts
 * (mas projectClientName de remissions.logic.ts, que el label reutiliza).
 *
 * Requisito bajo prueba: en el selector "Proyecto" deben verse TODOS los
 * proyectos del sistema que no esten pagados en su totalidad
 * (properties.paymentStatus !== 'confirmado'), sin perder las opciones
 * derivadas de facturas vigentes.
 *
 * Run: node scripts/test-finance-pagos-logic.mjs
 */

// ─── Business logic implementations (mirror of finance-pagos.logic.ts) ──────

function projectClientName(project) {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.client || props.equipmentProspectName || "").trim();
}

function isProjectPaid(project) {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.paymentStatus || "").trim().toLowerCase() === "confirmado";
}

function filterUnpaidProjects(projects) {
    return (projects || []).filter((project) => !isProjectPaid(project));
}

function projectLabelForPayment(project) {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    const code = String(props.equipmentIdentifier || "").trim()
        || (project?.id ? "#" + String(project.id).slice(-6) : "");
    const client = projectClientName(project);
    if (code && client) return `${code} — ${client}`;
    return code || client || "Proyecto sin datos";
}

function buildPaymentProjectOptions(projects, invoiceProjects) {
    const options = new Set();

    for (const project of filterUnpaidProjects(projects)) {
        const label = String(projectLabelForPayment(project) || "").trim();
        if (label) options.add(label);
    }

    for (const rawName of invoiceProjects || []) {
        const name = String(rawName || "").trim();
        if (name && !options.has(name)) options.add(name);
    }

    return Array.from(options).sort((first, second) => first.localeCompare(second));
}

// ─── Test harness ────────────────────────────────────────────────────────────

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

// ─── isProjectPaid ───────────────────────────────────────────────────────────

console.log("\nisProjectPaid:");

assert(isProjectPaid({ properties: { paymentStatus: "confirmado" } }) === true,
    "'confirmado' => pagado");
assert(isProjectPaid({ properties: { paymentStatus: "CONFIRMADO" } }) === true,
    "mayusculas 'CONFIRMADO' => pagado (normaliza)");
assert(isProjectPaid({ properties: { paymentStatus: "  confirmado  " } }) === true,
    "espacios alrededor de 'confirmado' => pagado (trim)");
assert(isProjectPaid({ properties: { paymentStatus: "pendiente" } }) === false,
    "'pendiente' => NO pagado");
assert(isProjectPaid({ properties: { paymentStatus: "parcial" } }) === false,
    "'parcial' => NO pagado (se puede seguir cobrando)");
assert(isProjectPaid({ properties: {} }) === false,
    "sin paymentStatus => NO pagado");
assert(isProjectPaid({}) === false,
    "sin properties => NO pagado (null-safe)");
assert(isProjectPaid(null) === false && isProjectPaid(undefined) === false,
    "project null/undefined => NO pagado (no lanza)");

// ─── filterUnpaidProjects ────────────────────────────────────────────────────

console.log("\nfilterUnpaidProjects:");

const mix = [
    { id: 1, properties: { paymentStatus: "pendiente" } },
    { id: 2, properties: { paymentStatus: "confirmado" } },
    { id: 3, properties: { paymentStatus: "parcial" } },
    { id: 4 },
];

const unpaid = filterUnpaidProjects(mix);
assert(unpaid.length === 3, "de 4 proyectos solo queda fuera el 'confirmado'");
assert(JSON.stringify(unpaid.map((p) => p.id)) === JSON.stringify([1, 3, 4]),
    "conserva pendiente, parcial y sin marcar (ids 1,3,4)");

assert(filterUnpaidProjects(null).length === 0, "input null => [] (no lanza)");
assert(filterUnpaidProjects(undefined).length === 0, "input undefined => [] (no lanza)");
assert(filterUnpaidProjects([]).length === 0, "array vacia => []");

// ─── projectLabelForPayment ──────────────────────────────────────────────────

console.log("\nprojectLabelForPayment:");

assert(projectLabelForPayment({ id: 9, properties: { equipmentIdentifier: "EQ-123", client: "Acme S.A.S." } }) === "EQ-123 — Acme S.A.S.",
    "codigo + cliente => 'codigo — cliente'");
assert(projectLabelForPayment({ id: 9, properties: { equipmentIdentifier: "EQ-123" } }) === "EQ-123",
    "solo codigo => etiqueta con el codigo");
assert(projectLabelForPayment({ properties: { client: "Beta Ltda" } }) === "Beta Ltda",
    "solo cliente (sin identifier ni id) => etiqueta con el cliente");
assert(projectLabelForPayment({ id: 424242, properties: {} }) === "#424242",
    "sin identifier pero con id => '#'+ultimos 6 del id");
assert(projectLabelForPayment({ id: "prj-9876543210", properties: { client: "Gamma" } }) === "#543210 — Gamma",
    "id largo usa los ultimos 6 caracteres");
assert(projectLabelForPayment(null) === "Proyecto sin datos",
    "nada de nada => 'Proyecto sin datos' (null-safe)");
assert(projectLabelForPayment({ id: 5, properties: { equipmentProspectName: "Delta Corp" } }) === "#5 — Delta Corp",
    "client cae a equipmentProspectName (id corto => '#'+id)");

// ─── buildPaymentProjectOptions (el selector) ────────────────────────────────

console.log("\nbuildPaymentProjectOptions:");

const projects = [
    { id: 101, properties: { equipmentIdentifier: "EQ-1", client: "Acme", paymentStatus: "pendiente" } },
    { id: 102, properties: { equipmentIdentifier: "EQ-2", client: "Beta", paymentStatus: "confirmado" } }, // PAGADO => fuera
    { id: 103, properties: { equipmentIdentifier: "EQ-3", client: "Gamma", paymentStatus: "parcial" } },     // parcial => dentro
];

const opts = buildPaymentProjectOptions(projects, ["Legacy Invoice Project"]);

assert(opts.includes("EQ-1 — Acme"), "incluye proyecto pendiente");
assert(opts.includes("EQ-3 — Gamma"), "incluye proyecto parcial (no pagado en su totalidad)");
assert(!opts.some((o) => o.startsWith("EQ-2")), "EXCLUYE el proyecto con pago confirmado");
assert(opts.includes("Legacy Invoice Project"),
    "conserva nombres de facturas vigentes (flujo de vinculo no se rompe)");
assert(JSON.stringify(opts) === JSON.stringify(["EQ-1 — Acme", "EQ-3 — Gamma", "Legacy Invoice Project"]),
    "deduplicado y ordenado alfabeticamente");

// Dedup: si la factura ya trae exactamente el mismo label, no se duplica.
const optsDedup = buildPaymentProjectOptions(projects, ["EQ-1 — Acme"]);
assert(optsDedup.filter((o) => o === "EQ-1 — Acme").length === 1,
    "label que ya viene de la factura NO se duplica");

// Entradas vacias / sucias.
assert(JSON.stringify(buildPaymentProjectOptions(null, null)) === JSON.stringify([]),
    "proyectos y facturas null => [] (no lanza)");
const optsDirty = buildPaymentProjectOptions([], ["   ", "", "  Real Name  ", null]);
assert(JSON.stringify(optsDirty) === JSON.stringify(["Real Name"]),
    "nombres de factura con espacios se limpian; vacios/null se descarten");

// Sin facturas: solo los no pagados.
const optsNoInv = buildPaymentProjectOptions(projects, []);
assert(optsNoInv.length === 2 && !optsNoInv.some((o) => o.startsWith("EQ-2")),
    "sin facturas => solo proyectos no pagados");

// ─── Resultado ───────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("Fallas:");
    for (const f of failures) console.log(` - ${f}`);
    process.exit(1);
}
