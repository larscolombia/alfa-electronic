/**
 * Unit tests — Reglas duras de remisión (espejo 1:1 de
 * src/app/pages/app/remissions/remissions.logic.ts, sección
 * "Reglas duras de despacho", que a su vez espeja
 * backend/internal/remissions/validation.go).
 *
 * Reglas cubiertas (mismo orden en los tres niveles):
 *   1. al menos un equipo
 *   2. máximo 4 equipos por remisión (límite inclusivo: 4 pasa, 5 no)
 *   3. contacto del cliente obligatorio (vacío o solo espacios → falla)
 *   4. préstamos anclados requieren aceptación explícita (solo si algún item
 *      trae anchoredNote; una nota de solo espacios NO cuenta como anclado)
 *
 * Run: node scripts/test-remission-rules-logic.mjs
 */

// ─── Business logic implementations (mirror of remissions.logic.ts) ──────────

const MAX_ITEMS_PER_REMISSION = 4;

function hasAnchoredEquipment(items) {
    return (items || []).some((item) => String(item?.anchoredNote ?? "").trim() !== "");
}

function validateRemissionDraft(form) {
    const items = Array.isArray(form?.items) ? form.items : [];
    if (items.length === 0) {
        return "una remision sin equipos no se puede generar: agregue al menos un equipo antes de guardar";
    }
    if (items.length > MAX_ITEMS_PER_REMISSION) {
        return `maximo ${MAX_ITEMS_PER_REMISSION} equipos por remision: divida el despacho en varias remisiones independientes`;
    }
    if (String(form?.contactName ?? "").trim() === "") {
        return "el contacto del cliente es obligatorio para despachar: complete la casilla Contacto y vuelva a guardar";
    }
    if (hasAnchoredEquipment(items) && !form?.anchoredAccepted) {
        return "la remision incluye equipos con prestamos anclados: confirme su inclusion antes de guardar";
    }
    return "";
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

// ─── Helpers de fixture ──────────────────────────────────────────────────────

function makeItems(count, anchored = false) {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push({ equipmentId: "", identifier: `EQ-${i}`, description: "Equipo", accessories: "", anchoredNote: "" });
    }
    if (anchored && items.length > 0) {
        items[0].anchoredNote = "TV-99 en prestamo";
    }
    return items;
}

function validForm(overrides = {}) {
    return {
        clientName: "Cliente X",
        clientNit: "123456789",
        contactName: "Juan Contacto",
        dispatchType: "servientrega",
        carrierName: "",
        guideNumber: "",
        purchaseOrder: "",
        youtubeLink: "",
        dispatchPhotos: [],
        valued: false,
        warrantyMonths: 0,
        notes: "",
        anchoredAccepted: false,
        items: makeItems(2),
        ...overrides,
    };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

console.log("\n=== Unit Tests: Remission Rules (límite 4 / contacto / anclados) ===\n");

console.log("── validateRemissionDraft ──");

assert(
    validateRemissionDraft(validForm()) === "",
    "formulario valido pasa sin errores"
);
assert(
    validateRemissionDraft(validForm({ contactName: "   ", items: makeItems(4) })) !== ""
        && validateRemissionDraft(validForm({ contactName: "   ", items: makeItems(4) })).includes("contacto"),
    "contacto de solo espacios se rechaza (trim, como el servidor)"
);

console.log("\n── Regla 1: al menos un equipo ──");

assert(
    validateRemissionDraft(validForm({ items: [] })).includes("al menos un equipo"),
    "cero equipos -> mensaje de 'al menos un equipo'"
);
assert(
    validateRemissionDraft(null).includes("al menos un equipo")
        && validateRemissionDraft(undefined).includes("al menos un equipo")
        && validateRemissionDraft({}).includes("al menos un equipo"),
    "form null/undefined/vacio -> misma regla (null-safe)"
);

console.log("\n── Regla 2: máximo 4 equipos (inclusivo) ──");

assert(
    validateRemissionDraft(validForm({ items: makeItems(4) })) === "",
    "exactamente 4 equipos pasa (el limite es inclusivo, igual que en Go)"
);
assert(
    validateRemissionDraft(validForm({ items: makeItems(5) })).includes("maximo 4 equipos"),
    "5 equipos -> rechazado con mensaje de division"
);

console.log("\n── Regla 3: contacto obligatorio ──");

assert(
    validateRemissionDraft(validForm({ contactName: "" })).includes("contacto del cliente es obligatorio"),
    "contacto vacio -> rechazado"
);
assert(
    validateRemissionDraft(validForm({ contactName: "  \t " })).includes("contacto del cliente es obligatorio"),
    "contacto con espacios/tabulaciones -> rechazado"
);

console.log("\n── Regla 4: préstamos anclados requieren aceptación ──");

assert(
    validateRemissionDraft(validForm({ items: makeItems(2, true) })).includes("prestamos anclados"),
    "item con anchoredNote y sin aceptacion -> rechazado"
);
assert(
    validateRemissionDraft(validForm({ items: makeItems(2, true), anchoredAccepted: true })) === "",
    "item con anchoredNote Y aceptacion explicita -> pasa"
);
const onlySpaces = makeItems(2);
onlySpaces[0].anchoredNote = "   ";
assert(
    validateRemissionDraft(validForm({ items: onlySpaces, anchoredAccepted: false })) === "",
    "anchoredNote de solo espacios NO cuenta como anclado (trim, igual que Go)"
);

console.log("\n── Orden de reglas (idéntico al servidor) ──");

assert(
    validateRemissionDraft(validForm({ items: [], contactName: "" })).includes("al menos un equipo"),
    "sin equipos Y sin contacto -> se reporta el primer fallo (items antes que contacto)"
);
const fiveNoContact = validForm({ items: makeItems(5), contactName: "", anchoredAccepted: false });
fiveNoContact.items[0].anchoredNote = "anclado";
assert(
    validateRemissionDraft(fiveNoContact).includes("maximo 4 equipos"),
    "5 items + sin contacto + anclado -> se reporta el limite primero"
);

console.log("\n── hasAnchoredEquipment ──");

assert(hasAnchoredEquipment(null) === false, "null-safe: null -> false");
assert(hasAnchoredEquipment([]) === false, "lista vacia -> false");
assert(hasAnchoredEquipment([{ anchoredNote: "" }]) === false, "sin nota -> false");
assert(hasAnchoredEquipment([{ anchoredNote: "TV-99" }]) === true, "con nota -> true");
assert(
    hasAnchoredEquipment([{ anchoredNote: "" }, { anchoredNote: "  " }, { anchoredNote: "OK" }]) === true,
    "cualquier item con nota no vacia basta"
);

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
