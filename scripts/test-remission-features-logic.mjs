/**
 * Unit tests — Remission features logic (mirrors src/app/pages/app/remissions/remissions.logic.ts)
 *
 * Tests:
 *  - dispatchTypeLabel for all dispatch types and default
 *  - groupDispatchReadyByClient: status filter, client field shapes, alphabetical order
 *  - computeRemissionTotal (valued totals, > 4 items allowed)
 *  - buildAnchoredAlert with/without borrowed equipments
 *  - canTransitionDeliveryStatus transitions
 *  - buildRemissionPrintModel (labels, accessories, youtube, photos, prices only if valued)
 *
 * Run: node scripts/test-remission-features-logic.mjs
 */

// ─── Business logic implementations (mirror of remissions.logic.ts) ──────────

const DISPATCH_TYPE_LABELS = {
    "servientrega": "Servientrega",
    "recoge-cliente": "Recoge Cliente",
    "contra-entrega": "Contra entrega",
    "dhl": "DHL",
};

const DISPATCH_READY_STATUSES = ["listo-entrega", "garantia", "no-reparable"];

const DELIVERY_STATUSES = ["pendiente", "entregado"];

function dispatchTypeLabel(value) {
    const key = String(value || "");
    return DISPATCH_TYPE_LABELS[key] || key || "No especificado";
}

function groupDispatchReadyByClient(equipments) {
    const ready = (equipments || []).filter((eq) => {
        const status = String(eq?.repairStatus || eq?.status || "");
        return DISPATCH_READY_STATUSES.indexOf(status) >= 0;
    });

    const groups = new Map();
    for (const eq of ready) {
        const clientName = String(eq.clientName || eq.prospectName || "Sin cliente");
        const clientNit = String(eq.clientNit || "");
        let group = groups.get(clientName);
        if (!group) {
            group = { clientName, clientNit, equipments: [] };
            groups.set(clientName, group);
        }
        group.equipments.push(eq);
    }

    return Array.from(groups.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
}

function computeRemissionTotal(items) {
    return (items || []).reduce((sum, item) => sum + Number(item?.unitPrice || 0) * Number(item?.quantity || 0), 0);
}

function buildAnchoredAlert(equipment) {
    const borrowed = equipment?.borrowedEquipments || equipment?.prestados || [];
    if (!Array.isArray(borrowed) || borrowed.length === 0) {
        return "";
    }
    return "Este equipo tiene equipos en prestamo anclados: " + borrowed.join(", ") + ". Incluyalos en la misma remision.";
}

function canTransitionDeliveryStatus(from, to) {
    if (DELIVERY_STATUSES.indexOf(from) < 0 || DELIVERY_STATUSES.indexOf(to) < 0) {
        return false;
    }
    if (from === "entregado" && to === "pendiente") {
        return false;
    }
    return true;
}

function buildRemissionPrintModel(remission) {
    const valued = !!remission?.valued;
    const items = (remission?.items || []).map((item) => ({
        identifier: item?.identifier || "",
        description: item?.description || "",
        accessories: item?.accessories || "",
        warrantyMonths: Number(item?.warrantyMonths || 0),
        quantity: Number(item?.quantity || 0),
        unitPrice: valued ? Number(item?.unitPrice || 0) : null,
    }));

    return {
        consecutive: remission?.consecutive || "",
        clientName: remission?.clientName || "",
        clientNit: remission?.clientNit || "",
        dispatchTypeLabel: dispatchTypeLabel(remission?.dispatchType || ""),
        carrierName: remission?.carrierName || "",
        guideNumber: remission?.guideNumber || "",
        purchaseOrder: remission?.purchaseOrder || "",
        youtubeLink: remission?.youtubeLink || "",
        photos: remission?.dispatchPhotos || [],
        items,
        totalValue: valued ? computeRemissionTotal(remission?.items || []) : null,
        deliveryStatus: remission?.deliveryStatus || "pendiente",
        warrantyMonths: Number(remission?.warrantyMonths || 0),
        notes: remission?.notes || "",
    };
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

console.log("\n=== Unit Tests: Remission Features Logic ===\n");

console.log("── dispatchTypeLabel ──");
assertEqual(dispatchTypeLabel("servientrega"), "Servientrega", "servientrega -> Servientrega");
assertEqual(dispatchTypeLabel("recoge-cliente"), "Recoge Cliente", "recoge-cliente -> Recoge Cliente");
assertEqual(dispatchTypeLabel("contra-entrega"), "Contra entrega", "contra-entrega -> Contra entrega");
assertEqual(dispatchTypeLabel("dhl"), "DHL", "dhl -> DHL");
assertEqual(dispatchTypeLabel(""), "No especificado", "empty -> No especificado");
assertEqual(dispatchTypeLabel("otra-cosa"), "otra-cosa", "unknown value -> raw value");

console.log("\n── groupDispatchReadyByClient: status filter ──");
const equipments = [
    { clientName: "Beta SAS", clientNit: "9002", identifier: "B1", repairStatus: "listo-entrega" },
    { clientName: "Alfa SAS", clientNit: "9001", identifier: "A1", repairStatus: "garantia" },
    { clientName: "Alfa SAS", clientNit: "9001", identifier: "A2", repairStatus: "no-reparable" },
    { clientName: "Beta SAS", clientNit: "9002", identifier: "B2", repairStatus: "reparacion" },
    { prospectName: "Zeta SA", identifier: "Z1", status: "listo-entrega" },
    { clientName: "Gamma SA", identifier: "G1", repairStatus: "diagnostico" },
];

const groups = groupDispatchReadyByClient(equipments);
assertEqual(groups.length, 3, "3 clients with ready equipment (Beta, Alfa, Zeta)");
assert(groups.every((g) => g.clientName !== "Gamma SA"), "reparation/diagnostico statuses excluded");
assert(!groups.some((g) => g.equipments.some((e) => e.identifier === "B2")), "'reparacion' equipment excluded");
assert(groups.some((g) => g.equipments.some((e) => e.identifier === "A1")), "'garantia' equipment included");
assert(groups.some((g) => g.equipments.some((e) => e.identifier === "A2")), "'no-reparable' equipment included");

console.log("\n── groupDispatchReadyByClient: grouping and ordering ──");
assertEqual(groups[0].clientName, "Alfa SAS", "Alphabetical order: Alfa first");
assertEqual(groups[1].clientName, "Beta SAS", "Alphabetical order: Beta second");
assertEqual(groups[2].clientName, "Zeta SA", "Alphabetical order: Zeta last (prospectName shape)");
assertEqual(groups[0].equipments.length, 2, "Alfa group has 2 equipments");
assertEqual(groups[0].clientNit, "9001", "Group keeps clientNit");
assertEqual(groupDispatchReadyByClient([]).length, 0, "Empty input -> empty groups");
assertEqual(groupDispatchReadyByClient(null).length, 0, "Null input -> empty groups");

console.log("\n── computeRemissionTotal ──");
const totalItems = [
    { unitPrice: 100000, quantity: 1 },
    { unitPrice: 250000, quantity: 2 },
    { unitPrice: 50000, quantity: 3 },
];
assertEqual(computeRemissionTotal(totalItems), 750000, "Total 100k + 2*250k + 3*50k = 750k");
assertEqual(computeRemissionTotal([]), 0, "Empty items -> 0");
assertEqual(computeRemissionTotal([{ unitPrice: 0, quantity: 5 }]), 0, "Zero price -> 0");

console.log("\n── More than 4 items allowed ──");
const manyItems = Array.from({ length: 7 }, (_, i) => ({ unitPrice: 10000, quantity: i + 1 }));
assertEqual(computeRemissionTotal(manyItems), 280000, "7 items total computed (no item limit)");
const modelMany = buildRemissionPrintModel({ valued: true, items: manyItems });
assertEqual(modelMany.items.length, 7, "Print model keeps all 7 items");

console.log("\n── buildAnchoredAlert ──");
const withBorrowed = buildAnchoredAlert({ borrowedEquipments: ["EQ-1", "EQ-2"] });
assert(withBorrowed.includes("EQ-1") && withBorrowed.includes("EQ-2"), "Alert lists borrowed equipments");
assert(withBorrowed.includes("prestamo"), "Alert mentions prestamo");
assert(withBorrowed.includes("misma remision"), "Alert asks to include in same remission");
assertEqual(buildAnchoredAlert({ borrowedEquipments: [] }), "", "Empty borrowed list -> no alert");
assertEqual(buildAnchoredAlert({}), "", "No borrowed field -> no alert");
const withPrestados = buildAnchoredAlert({ prestados: ["EQ-9"] });
assert(withPrestados.includes("EQ-9"), "Accepts 'prestados' field shape");
assertEqual(buildAnchoredAlert(null), "", "Null equipment -> no alert");

console.log("\n── canTransitionDeliveryStatus ──");
assert(canTransitionDeliveryStatus("pendiente", "entregado"), "pendiente -> entregado allowed");
assert(canTransitionDeliveryStatus("entregado", "entregado"), "entregado -> entregado allowed (idempotent)");
assert(canTransitionDeliveryStatus("pendiente", "pendiente"), "pendiente -> pendiente allowed");
assert(!canTransitionDeliveryStatus("entregado", "pendiente"), "entregado -> pendiente NOT allowed");
assert(!canTransitionDeliveryStatus("desconocido", "entregado"), "unknown from-status NOT allowed");
assert(!canTransitionDeliveryStatus("pendiente", "devuelto"), "unknown to-status NOT allowed");
assert(!canTransitionDeliveryStatus("", "entregado"), "empty from-status NOT allowed");

console.log("\n── buildRemissionPrintModel (valued) ──");
const remission = {
    consecutive: "E-CO-2608-0007",
    clientName: "Alfa SAS",
    clientNit: "900123",
    dispatchType: "contra-entrega",
    carrierName: "Servientrega",
    guideNumber: "GUIA-123",
    purchaseOrder: "OC-456",
    youtubeLink: "https://youtube.com/watch?v=abc",
    dispatchPhotos: [{ name: "foto1.jpg", dataUrl: "data:image/jpeg;base64,AAA" }],
    valued: true,
    deliveryStatus: "entregado",
    warrantyMonths: 6,
    notes: "Entregar en porteria",
    items: [
        { identifier: "EQ-1", description: "Bomba hidraulica", accessories: "Cable y manual", warrantyMonths: 6, unitPrice: 120000, quantity: 2 },
    ],
};
const model = buildRemissionPrintModel(remission);
assertEqual(model.consecutive, "E-CO-2608-0007", "Model keeps consecutive");
assertEqual(model.dispatchTypeLabel, "Contra entrega", "Model uses readable dispatch label");
assertEqual(model.youtubeLink, "https://youtube.com/watch?v=abc", "Model keeps youtube link");
assertEqual(model.purchaseOrder, "OC-456", "Model keeps purchase order");
assertEqual(model.photos.length, 1, "Model keeps dispatch photos");
assertEqual(model.items[0].accessories, "Cable y manual", "Item keeps accessories");
assertEqual(model.items[0].unitPrice, 120000, "Valued: unit price present");
assertEqual(model.totalValue, 240000, "Valued: total = 120k * 2");
assertEqual(model.deliveryStatus, "entregado", "Model keeps delivery status");
assertEqual(model.warrantyMonths, 6, "Model keeps warranty months");
assertEqual(model.notes, "Entregar en porteria", "Model keeps notes");

console.log("\n── buildRemissionPrintModel (not valued) ──");
const plainModel = buildRemissionPrintModel({ valued: false, items: [{ identifier: "X", unitPrice: 500, quantity: 2 }] });
assertEqual(plainModel.totalValue, null, "Not valued: total hidden (null)");
assertEqual(plainModel.items[0].unitPrice, null, "Not valued: unit prices hidden (null)");
assertEqual(plainModel.deliveryStatus, "pendiente", "Default delivery status is pendiente");
assertEqual(plainModel.dispatchTypeLabel, "No especificado", "Empty dispatch type -> No especificado");
assertEqual(buildRemissionPrintModel(null).items.length, 0, "Null remission -> empty items");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
