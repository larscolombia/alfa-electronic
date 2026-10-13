/**
 * Unit tests — Remission logic, warranty calculation, and dispatch business rules
 *
 * Tests:
 *  - Consecutive numbering format: E-CO-Year-Month-Number
 *  - Warranty period calculation (3, 6, 12 months)
 *  - Item limit validation (currently 4, should be unlimited)
 *  - Dispatch type options
 *  - Valued remission total calculation
 *  - Oasis flat file format structure
 *
 * Run: node scripts/test-remission-logic.mjs
 */

// ─── Business logic implementations ──────────────────────────────────────────

function generateRemissionConsecutive(year, month, sequenceNumber) {
    const yearShort = String(year).slice(-2);
    const monthPadded = String(month).padStart(2, "0");
    const seqPadded = String(sequenceNumber).padStart(4, "0");
    return `E-CO-${yearShort}${monthPadded}-${seqPadded}`;
}

function parseRemissionConsecutive(consecutive) {
    const match = /^E-CO-(\d{2})(\d{2})-(\d+)$/.exec(consecutive);
    if (!match) return null;
    return {
        year: `20${match[1]}`,
        month: parseInt(match[2], 10),
        sequence: parseInt(match[3], 10),
    };
}

function calculateWarrantyEndDate(startDate, months) {
    const parts = startDate.split("-");
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let day = parseInt(parts[2], 10);

    month += months;
    while (month > 12) {
        month -= 12;
        year++;
    }

    // Clamp day to the last day of the target month
    const daysInTargetMonth = new Date(year, month, 0).getDate();
    if (day > daysInTargetMonth) {
        day = daysInTargetMonth;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function validateWarrantyPeriod(months) {
    return [3, 6, 12].includes(months);
}

function validateCurrentItemLimit(itemCount) {
    // CURRENT: max 4 items per remission (requirement says to remove this)
    return itemCount <= 4;
}

function validateNewItemLimit(itemCount) {
    // NEW: no limit on items per remission
    return itemCount >= 1;
}

const DISPATCH_TYPES = [
    { id: "servientrega", label: "Servientrega", description: "Envio por transportadora Servientrega" },
    { id: "recoge-cliente", label: "Recoge Cliente", description: "El cliente recoge directamente" },
    { id: "contra-entrega", label: "Contra entrega", description: "Pago contra entrega" },
    { id: "dhl", label: "DHL", description: "Envio por DHL" },
];

function calculateRemissionTotal(items) {
    return items.reduce((total, item) => total + (Number(item.unitPrice) * Number(item.quantity || 1)), 0);
}

function formatOasisFlatFile(invoices) {
    // Oasis.com flat file structure
    const lines = [];
    for (const invoice of invoices) {
        const fields = [
            invoice.nit || "",
            invoice.invoiceNumber || "",
            invoice.date || "",
            invoice.subtotal || "0",
            invoice.iva || "0",
            invoice.total || "0",
            invoice.postalCode || "",
            invoice.concept || "",
        ];
        lines.push(fields.join(";"));
    }
    return lines.join("\n");
}

function validateOasisRecord(record) {
    const errors = [];
    if (!record.nit || !/^\d+$/.test(record.nit)) errors.push("NIT must be numeric");
    if (!record.invoiceNumber) errors.push("Invoice number is required");
    if (!record.date || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) errors.push("Date must be YYYY-MM-DD");
    if (!record.postalCode || !/^\d+$/.test(record.postalCode)) errors.push("Postal code must be numeric");
    return { valid: errors.length === 0, errors };
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

console.log("\n=== Unit Tests: Remission Logic ===\n");

console.log("── Consecutive numbering format (E-CO-Year-Month-Number) ──");
assertEqual(generateRemissionConsecutive(2026, 1, 1), "E-CO-2601-0001", "First remission of Jan 2026");
assertEqual(generateRemissionConsecutive(2026, 8, 42), "E-CO-2608-0042", "42nd remission of Aug 2026");
assertEqual(generateRemissionConsecutive(2026, 12, 9999), "E-CO-2612-9999", "9999th remission of Dec 2026");
assertEqual(generateRemissionConsecutive(2025, 3, 100), "E-CO-2503-0100", "100th remission of Mar 2025");

console.log("\n── Consecutive parsing ──");
const parsed1 = parseRemissionConsecutive("E-CO-2601-0001");
assertEqual(parsed1?.year, "2026", "Parse year from E-CO-2601-0001");
assertEqual(parsed1?.month, 1, "Parse month from E-CO-2601-0001");
assertEqual(parsed1?.sequence, 1, "Parse sequence from E-CO-2601-0001");

const parsed2 = parseRemissionConsecutive("E-CO-2608-0042");
assertEqual(parsed2?.year, "2026", "Parse year from E-CO-2608-0042");
assertEqual(parsed2?.month, 8, "Parse month from E-CO-2608-0042");
assertEqual(parsed2?.sequence, 42, "Parse sequence from E-CO-2608-0042");

assertEqual(parseRemissionConsecutive("INVALID"), null, "Invalid format returns null");
assertEqual(parseRemissionConsecutive(""), null, "Empty string returns null");

console.log("\n── Warranty calculation ──");
assert(validateWarrantyPeriod(3), "3 months is valid warranty period");
assert(validateWarrantyPeriod(6), "6 months is valid warranty period");
assert(validateWarrantyPeriod(12), "12 months is valid warranty period");
assert(!validateWarrantyPeriod(1), "1 month is NOT valid warranty period");
assert(!validateWarrantyPeriod(9), "9 months is NOT valid warranty period");
assert(!validateWarrantyPeriod(24), "24 months is NOT valid warranty period");

assertEqual(calculateWarrantyEndDate("2026-01-15", 3), "2026-04-15", "3 months from Jan 15");
assertEqual(calculateWarrantyEndDate("2026-01-15", 6), "2026-07-15", "6 months from Jan 15");
assertEqual(calculateWarrantyEndDate("2026-01-15", 12), "2027-01-15", "12 months from Jan 15");
assertEqual(calculateWarrantyEndDate("2026-08-31", 3), "2026-11-30", "3 months from Aug 31 (edge case)");

console.log("\n── Item limit (Req #2: remove limit of 4) ──");
// Current behavior (should fail for > 4)
assert(validateCurrentItemLimit(1), "1 item passes current limit");
assert(validateCurrentItemLimit(4), "4 items passes current limit");
assert(!validateCurrentItemLimit(5), "5 items FAILS current limit (requirement says to remove this)");
assert(!validateCurrentItemLimit(10), "10 items FAILS current limit (requirement says to remove this)");

// New behavior (should pass for any >= 1)
assert(validateNewItemLimit(1), "1 item passes new limit");
assert(validateNewItemLimit(4), "4 items passes new limit");
assert(validateNewItemLimit(5), "5 items passes new limit (limit removed)");
assert(validateNewItemLimit(10), "10 items passes new limit (limit removed)");
assert(validateNewItemLimit(100), "100 items passes new limit (limit removed)");
assert(!validateNewItemLimit(0), "0 items fails (need at least 1)");

console.log("\n── Dispatch types ──");
assertEqual(DISPATCH_TYPES.length, 4, "4 dispatch types available");
assert(DISPATCH_TYPES.some((d) => d.id === "servientrega"), "Servientrega dispatch type exists");
assert(DISPATCH_TYPES.some((d) => d.id === "recoge-cliente"), "Recoge Cliente dispatch type exists");
assert(DISPATCH_TYPES.some((d) => d.id === "contra-entrega"), "Contra entrega dispatch type exists");
assert(DISPATCH_TYPES.some((d) => d.id === "dhl"), "DHL dispatch type exists");

console.log("\n── Valued remission total calculation ──");
const items1 = [
    { unitPrice: 100000, quantity: 1 },
    { unitPrice: 250000, quantity: 2 },
    { unitPrice: 50000, quantity: 3 },
];
assertEqual(calculateRemissionTotal(items1), 750000, "Total for 3 items: 100k + 2*250k + 3*50k = 750k");

const items2 = [
    { unitPrice: 1000000, quantity: 1 },
];
assertEqual(calculateRemissionTotal(items2), 1000000, "Single item total");

const items3 = [
    { unitPrice: 0, quantity: 5 },
];
assertEqual(calculateRemissionTotal(items3), 0, "Zero price items total = 0");

const items4 = [];
assertEqual(calculateRemissionTotal(items4), 0, "Empty items total = 0");

console.log("\n── Oasis flat file format ──");
const testInvoices = [
    {
        nit: "900123456",
        invoiceNumber: "FV-001",
        date: "2026-08-06",
        subtotal: "1000000",
        iva: "190000",
        total: "1190000",
        postalCode: "110111",
        concept: "Reparacion equipo",
    },
];
const flatFile = formatOasisFlatFile(testInvoices);
assert(flatFile.includes("900123456"), "Flat file includes NIT");
assert(flatFile.includes("FV-001"), "Flat file includes invoice number");
assert(flatFile.includes("110111"), "Flat file includes postal code");
assert(flatFile.includes(";"), "Flat file uses semicolon separator");

console.log("\n── Oasis record validation ──");
const validRecord = { nit: "900123456", invoiceNumber: "FV-001", date: "2026-08-06", postalCode: "110111" };
const validResult = validateOasisRecord(validRecord);
assert(validResult.valid, "Valid record passes validation");
assertEqual(validResult.errors.length, 0, "No errors for valid record");

const invalidRecord1 = { nit: "ABC", invoiceNumber: "FV-001", date: "2026-08-06", postalCode: "110111" };
const invalidResult1 = validateOasisRecord(invalidRecord1);
assert(!invalidResult1.valid, "Non-numeric NIT fails validation");
assert(invalidResult1.errors.some((e) => /NIT/i.test(e)), "Error mentions NIT");

const invalidRecord2 = { nit: "900123456", invoiceNumber: "", date: "2026-08-06", postalCode: "110111" };
const invalidResult2 = validateOasisRecord(invalidRecord2);
assert(!invalidResult2.valid, "Empty invoice number fails validation");

const invalidRecord3 = { nit: "900123456", invoiceNumber: "FV-001", date: "06/08/2026", postalCode: "110111" };
const invalidResult3 = validateOasisRecord(invalidRecord3);
assert(!invalidResult3.valid, "Wrong date format fails validation");

const invalidRecord4 = { nit: "900123456", invoiceNumber: "FV-001", date: "2026-08-06", postalCode: "ABC" };
const invalidResult4 = validateOasisRecord(invalidRecord4);
assert(!invalidResult4.valid, "Non-numeric postal code fails validation");

console.log("\n── Retention calculations ──");
function calculateRetentions(subtotal, reteFuentePercent, reteIvaPercent, reteIcaPercent) {
    return {
        reteFuente: subtotal * (reteFuentePercent / 100),
        reteIva: subtotal * (reteIvaPercent / 100),
        reteIca: subtotal * (reteIcaPercent / 100),
        total: subtotal
            - subtotal * (reteFuentePercent / 100)
            - subtotal * (reteIvaPercent / 100)
            - subtotal * (reteIcaPercent / 100),
    };
}

const retention1 = calculateRetentions(1000000, 2.5, 0, 0);
assertEqual(retention1.reteFuente, 25000, "ReteFuente 2.5% on 1M = 25k");
assertEqual(retention1.total, 975000, "Net after ReteFuente = 975k");

const retention2 = calculateRetentions(1000000, 2.5, 15, 0.96);
assertEqual(retention2.reteIva, 150000, "ReteIVA 15% on 1M = 150k");
assertEqual(retention2.reteIca, 9600, "ReteICA 0.96% on 1M = 9.6k");
assertEqual(retention2.total, 1000000 - 25000 - 150000 - 9600, "Net after all retentions");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
