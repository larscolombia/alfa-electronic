/**
 * Unit tests — Diagnosis structure, warranty positions, anchored equipment
 *
 * Tests:
 *  - Diagnosis memo structure (sections: diagnosis + repair)
 *  - Success percentage validation (0-100)
 *  - Warranty position differentiation (new warranty vs warranty waiting parts)
 *  - Anchored equipment dispatch validation
 *  - Purchase request modification alerts
 *
 * Run: node scripts/test-diagnosis-warranty-logic.mjs
 */

// ─── Diagnosis Structure ─────────────────────────────────────────────────────

function buildDiagnosisMemo(diagnosisSection, repairSection, successPercent) {
    const errors = [];
    if (!diagnosisSection || !diagnosisSection.findings?.trim()) {
        errors.push("Diagnosis findings are required");
    }
    if (!repairSection || !repairSection.actions?.trim()) {
        errors.push("Repair actions are required");
    }
    if (successPercent === undefined || successPercent === null) {
        errors.push("Success percentage is mandatory");
    } else if (typeof successPercent !== "number" || successPercent < 0 || successPercent > 100) {
        errors.push("Success percentage must be between 0 and 100");
    }
    return {
        valid: errors.length === 0,
        errors,
        memo: {
            diagnosis: diagnosisSection,
            repair: repairSection,
            successPercent,
        },
    };
}

function validateDiagnosisClose(inspection) {
    const errors = [];
    if (!inspection) return { valid: false, errors: ["Inspection data is required"] };
    if (!inspection.faultIdentified) errors.push("Must identify fault to close diagnosis");
    if (!inspection.estimatedHours || inspection.estimatedHours <= 0) errors.push("Estimated hours must be > 0");
    if (!inspection.partsBudgetUsd || inspection.partsBudgetUsd <= 0) errors.push("Parts budget must be > 0 USD");
    if (inspection.successPercent !== undefined) {
        if (inspection.successPercent < 0 || inspection.successPercent > 100) errors.push("Success percent must be 0-100");
    }
    return { valid: errors.length === 0, errors };
}

// ─── Warranty Position Logic ─────────────────────────────────────────────────

const WARRANTY_POSITIONS = {
    garantia: { id: "garantia", label: "Garantia", description: "Equipo en garantia en proceso de revision/reparacion" },
    "garantia-espera-repuestos": { id: "garantia-espera-repuestos", label: "Garantia esperando repuestos", description: "Equipo en garantia que espera llegada de repuestos" },
};

function classifyWarrantyPosition(hasParts, isUnderWarranty) {
    if (!isUnderWarranty) return null; // Not a warranty case
    if (!hasParts) return WARRANTY_POSITIONS["garantia-espera-repuestos"];
    return WARRANTY_POSITIONS["garantia"];
}

function isEquipmentUnderWarranty(deliveryDate, warrantyMonths) {
    const delivery = new Date(deliveryDate);
    const expiry = new Date(delivery);
    expiry.setMonth(expiry.getMonth() + warrantyMonths);
    return new Date() <= expiry;
}

// ─── Anchored Equipment Validation ───────────────────────────────────────────

function validateDispatchWithAnchored(equipment, anchoredEquipment, remissionItems) {
    if (!anchoredEquipment || anchoredEquipment.length === 0) {
        return { valid: true, warnings: [] };
    }

    const missingAnchored = [];
    for (const anchor of anchoredEquipment) {
        const included = remissionItems.some((item) => item.equipmentId === anchor.id);
        if (!included) missingAnchored.push(anchor);
    }

    return {
        valid: missingAnchored.length === 0,
        warnings: missingAnchored.map((a) => `Equipo anclado '${a.identifier}' debe incluirse en la misma remision`),
    };
}

// ─── Search Normalization for Parts ──────────────────────────────────────────

function normalizePartReference(ref) {
    return String(ref || "").trim().toLowerCase().replace(/[\s\-_.]+/g, "");
}

function findPartMatch(query, catalog) {
    const normalized = normalizePartReference(query);
    return catalog.filter((item) => normalizePartReference(item.reference).includes(normalized));
}

// ─── Purchase Modification Alert ─────────────────────────────────────────────

function detectPurchaseModification(originalRequest, modifiedRequest) {
    const changes = [];
    if (originalRequest.supplier !== modifiedRequest.supplier) {
        changes.push({ field: "supplier", from: originalRequest.supplier, to: modifiedRequest.supplier });
    }
    if (originalRequest.reference !== modifiedRequest.reference) {
        changes.push({ field: "reference", from: originalRequest.reference, to: modifiedRequest.reference });
    }
    if (originalRequest.price !== modifiedRequest.price) {
        changes.push({ field: "price", from: originalRequest.price, to: modifiedRequest.price });
    }
    if (originalRequest.quantity !== modifiedRequest.quantity) {
        changes.push({ field: "quantity", from: originalRequest.quantity, to: modifiedRequest.quantity });
    }
    return {
        modified: changes.length > 0,
        changes,
        shouldAlert: changes.some((c) => c.field === "reference" || c.field === "supplier"),
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

console.log("\n=== Unit Tests: Diagnosis, Warranty, Anchored, Parts ===\n");

console.log("── Diagnosis Memo Structure ──");
const memo1 = buildDiagnosisMemo(
    { findings: "Capacitor danado en la etapa de potencia" },
    { actions: "Reemplazo de capacitor C12 470uF" },
    85,
);
assert(memo1.valid, "Complete memo with both sections is valid");
assertEqual(memo1.errors.length, 0, "No errors for complete memo");

const memo2 = buildDiagnosisMemo(null, { actions: "test" }, 50);
assert(!memo2.valid, "Missing diagnosis section → invalid");
assert(memo2.errors.some((e) => /findings/i.test(e)), "Error mentions findings");

const memo3 = buildDiagnosisMemo({ findings: "test" }, null, 50);
assert(!memo3.valid, "Missing repair section → invalid");

const memo4 = buildDiagnosisMemo({ findings: "test" }, { actions: "test" }, null);
assert(!memo4.valid, "Missing success percentage → invalid");
assert(memo4.errors.some((e) => /mandatory/i.test(e)), "Error mentions mandatory");

const memo5 = buildDiagnosisMemo({ findings: "test" }, { actions: "test" }, 150);
assert(!memo5.valid, "Success percentage > 100 → invalid");

const memo6 = buildDiagnosisMemo({ findings: "test" }, { actions: "test" }, -5);
assert(!memo6.valid, "Success percentage < 0 → invalid");

const memo7 = buildDiagnosisMemo({ findings: "test" }, { actions: "test" }, 0);
assert(memo7.valid, "Success percentage = 0 → valid");

const memo8 = buildDiagnosisMemo({ findings: "test" }, { actions: "test" }, 100);
assert(memo8.valid, "Success percentage = 100 → valid");

console.log("\n── Diagnosis Close Validation ──");
const close1 = validateDiagnosisClose({ faultIdentified: true, estimatedHours: 5, partsBudgetUsd: 200 });
assert(close1.valid, "Complete diagnosis close is valid");

const close2 = validateDiagnosisClose({ faultIdentified: false, estimatedHours: 5, partsBudgetUsd: 200 });
assert(!close2.valid, "No fault identified → invalid");

const close3 = validateDiagnosisClose({ faultIdentified: true, estimatedHours: 0, partsBudgetUsd: 200 });
assert(!close3.valid, "Zero estimated hours → invalid");

const close4 = validateDiagnosisClose({ faultIdentified: true, estimatedHours: 5, partsBudgetUsd: 0 });
assert(!close4.valid, "Zero parts budget → invalid");

console.log("\n── Warranty Position Classification ──");
const wp1 = classifyWarrantyPosition(true, true);
assertEqual(wp1?.id, "garantia", "Has parts + under warranty → garantia");

const wp2 = classifyWarrantyPosition(false, true);
assertEqual(wp2?.id, "garantia-espera-repuestos", "No parts + under warranty → garantia-espera-repuestos");

const wp3 = classifyWarrantyPosition(true, false);
assertEqual(wp3, null, "Not under warranty → null (not a warranty case)");

const wp4 = classifyWarrantyPosition(false, false);
assertEqual(wp4, null, "No parts + not under warranty → null");

console.log("\n── Warranty Active Check ──");
const recentDate = new Date();
recentDate.setMonth(recentDate.getMonth() - 3);
assert(isEquipmentUnderWarranty(recentDate.toISOString(), 6), "3-month-old delivery with 6-month warranty → active");

const oldDate = new Date();
oldDate.setFullYear(oldDate.getFullYear() - 1);
assert(!isEquipmentUnderWarranty(oldDate.toISOString(), 6), "1-year-old delivery with 6-month warranty → expired");

console.log("\n── Anchored Equipment Dispatch Validation ──");
const mainEquipment = { id: "eq-1", identifier: "EQ-001" };
const anchoredEquip = [{ id: "eq-motor", identifier: "MOTOR-TEST-01" }];

const dispatch1 = validateDispatchWithAnchored(mainEquipment, anchoredEquip, [
    { equipmentId: "eq-1" },
    { equipmentId: "eq-motor" },
]);
assert(dispatch1.valid, "Dispatch valid when anchored equipment is included");
assertEqual(dispatch1.warnings.length, 0, "No warnings when all anchored included");

const dispatch2 = validateDispatchWithAnchored(mainEquipment, anchoredEquip, [
    { equipmentId: "eq-1" },
]);
assert(!dispatch2.valid, "Dispatch blocked when anchored equipment is missing");
assert(dispatch2.warnings.length > 0, "Warning generated for missing anchored equipment");
assert(dispatch2.warnings[0].includes("MOTOR-TEST-01"), "Warning mentions the missing equipment identifier");

const dispatch3 = validateDispatchWithAnchored(mainEquipment, [], [{ equipmentId: "eq-1" }]);
assert(dispatch3.valid, "Dispatch valid when no anchored equipment exists");

console.log("\n── Part Search Normalization ──");
const catalog = [
    { reference: "iPhone 8 Screen" },
    { reference: "iPhone8-Battery" },
    { reference: "PLC Siemens S7-1200" },
    { reference: "PLC_Siemens_S7_1500" },
];

const results1 = findPartMatch("iPhone 8", catalog);
assert(results1.length >= 2, "'iPhone 8' matches both 'iPhone 8 Screen' and 'iPhone8-Battery'");

const results2 = findPartMatch("iPhone8", catalog);
assert(results2.length >= 2, "'iPhone8' matches same results as 'iPhone 8'");

const results3 = findPartMatch("PLC Siemens", catalog);
assert(results3.length >= 2, "'PLC Siemens' matches both PLC entries regardless of separator");

const results4 = findPartMatch("nonexistent", catalog);
assertEqual(results4.length, 0, "'nonexistent' matches nothing");

console.log("\n── Purchase Modification Alert ──");
const original = { supplier: "Mouser", reference: "CAP-470UF", price: 0.50, quantity: 10 };
const modified1 = { supplier: "Mouser", reference: "CAP-470UF", price: 0.55, quantity: 10 };
const alert1 = detectPurchaseModification(original, modified1);
assert(alert1.modified, "Price change detected as modification");
assert(!alert1.shouldAlert, "Price-only change does NOT trigger technician alert");

const modified2 = { supplier: "Digikey", reference: "CAP-470UF", price: 0.50, quantity: 10 };
const alert2 = detectPurchaseModification(original, modified2);
assert(alert2.shouldAlert, "Supplier change triggers technician alert");

const modified3 = { supplier: "Mouser", reference: "CAP-100UF", price: 0.50, quantity: 10 };
const alert3 = detectPurchaseModification(original, modified3);
assert(alert3.shouldAlert, "Reference change triggers technician alert");

const modified4 = { ...original };
const alert4 = detectPurchaseModification(original, modified4);
assert(!alert4.modified, "No changes → not modified");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
