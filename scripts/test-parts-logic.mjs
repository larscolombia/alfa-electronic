/**
 * Unit tests — Parts logic (espejo de src/app/services/parts.logic.ts)
 * Ejecutar: node scripts/test-parts-logic.mjs
 */

import assert from "node:assert/strict";

// ─── Mirror of parts.logic.ts (keep in sync!) ────────────────────────────────

function normalizeSearchToken(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function referenceMatches(item, query) {
    const normalizedQuery = normalizeSearchToken(query);
    if (!normalizedQuery) {
        return true;
    }
    return (
        normalizeSearchToken(item.reference).includes(normalizedQuery) ||
        normalizeSearchToken(item.designation).includes(normalizedQuery)
    );
}

function detectRelevantChanges(oldLine, newLine) {
    return (
        normalizeSearchToken(oldLine.brand) !== normalizeSearchToken(newLine.brand) ||
        normalizeSearchToken(oldLine.reference) !== normalizeSearchToken(newLine.reference)
    );
}

// ─── normalizeSearchToken ────────────────────────────────────────────────────

{
    const cases = [
        ["iPhone 8", "iphone8"],
        ["IGBT-FGA25N120", "igbtfga25n120"],
        ["Teléfono", "telefono"],
        ["  ACS355  ", "acs355"],
        ["Café 10K", "cafe10k"],
        ["", ""],
        [null, ""],
        [undefined, ""],
    ];
    for (const [input, expected] of cases) {
        assert.equal(normalizeSearchToken(input), expected, `normalizeSearchToken(${JSON.stringify(input)})`);
    }
}

// ─── referenceMatches ────────────────────────────────────────────────────────

{
    // "iPhone 8" ≡ "iphone8"
    assert.equal(referenceMatches({ reference: "iPhone 8" }, "iphone8"), true);
    assert.equal(referenceMatches({ reference: "iphone8" }, "iPhone 8"), true);

    // "IGBT-FGA25N120" ≡ "igbt fga25n120"
    assert.equal(referenceMatches({ reference: "IGBT-FGA25N120" }, "igbt fga25n120"), true);
    assert.equal(referenceMatches({ reference: "igbt fga25n120" }, "IGBT-FGA25N120"), true);

    // tildes: "Teléfono" ≡ "telefono"
    assert.equal(referenceMatches({ designation: "Teléfono inalámbrico" }, "telefono"), true);
    assert.equal(referenceMatches({ designation: "telefono" }, "Teléfono"), true);

    // query vacía matchea todo
    assert.equal(referenceMatches({ reference: "LM324N" }, ""), true);
    assert.equal(referenceMatches({ reference: "LM324N" }, "   "), true);

    // no match
    assert.equal(referenceMatches({ reference: "LM324N", designation: "Amplificador" }, "resistor"), false);
}

// ─── detectRelevantChanges ───────────────────────────────────────────────────

{
    const base = { reference: "IGBT-FGA25N120", brand: "Infineon", quantity: 2, unitPrice: 15000 };

    // cambio de marca → true
    assert.equal(detectRelevantChanges(base, { ...base, brand: "Fairchild" }), true);

    // cambio de referencia → true
    assert.equal(detectRelevantChanges(base, { ...base, reference: "FGA25N120ANTD" }), true);

    // cambio solo de precio → false
    assert.equal(detectRelevantChanges(base, { ...base, unitPrice: 17500 }), false);

    // cambio solo de cantidad → false
    assert.equal(detectRelevantChanges(base, { ...base, quantity: 5 }), false);

    // cambio cosmético (mayúsculas/espacios) en marca/referencia → false
    assert.equal(detectRelevantChanges(base, { ...base, brand: " infineon " }), false);
    assert.equal(detectRelevantChanges(base, { ...base, reference: "igbt fga25n120" }), false);
}

console.log("OK — test-parts-logic: todos los asserts pasaron");
