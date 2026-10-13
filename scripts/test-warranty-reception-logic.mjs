/**
 * Unit tests — Warranty reception logic, accessories delivery confirmation, software backups
 *
 * Mirrors the pure functions in:
 *  - src/app/pages/app/crm/warranty.logic.ts
 *  - src/app/pages/app/remissions/remissions.logic.ts
 *
 * Tests:
 *  - warrantyMonthsRemaining (vigente, justo en el limite, vencida, sin datos -> null)
 *  - isUnderLegalWarranty
 *  - findPreviousReception (por serie/identificador, sin previa -> null)
 *  - requiresAccessoriesConfirmation (con accessories, con anchoredNote, sin nada -> false)
 *  - backupAvailableForModel (match exacto, normalizacion case/espacios, sin match)
 *
 * Run: node scripts/test-warranty-reception-logic.mjs
 */

// ─── Mirror: warranty.logic.ts ───────────────────────────────────────────────

function parseWarrantyDate(value) {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }
    const str = String(value ?? "").trim();
    if (!str) {
        return null;
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function warrantyExpiryDate(start, warrantyMonths) {
    const expiry = new Date(start.getTime());
    expiry.setMonth(expiry.getMonth() + warrantyMonths);
    return expiry;
}

function normalizeWarrantyKey(value) {
    return String(value ?? "").trim().toLowerCase();
}

function normalizeModelKey(value) {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function receptionSortKey(record) {
    const createdAt = String(record?.createdAt || "").trim();
    if (createdAt) {
        return createdAt;
    }
    const year = String(record?.receptionYear || "0000").padStart(4, "0");
    const month = String(record?.receptionMonth || "00").padStart(2, "0");
    const day = String(record?.receptionDay || "00").padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function warrantyMonthsRemaining(startDate, warrantyMonths, today) {
    const start = parseWarrantyDate(startDate);
    const months = Number(warrantyMonths);
    if (!start || !Number.isFinite(months) || months <= 0) {
        return null;
    }
    const now = parseWarrantyDate(today ?? new Date());
    if (!now) {
        return null;
    }
    const expiry = warrantyExpiryDate(start, months);
    if (now.getTime() > expiry.getTime()) {
        return 0;
    }
    let remaining = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (expiry.getDate() < now.getDate()) {
        remaining -= 1;
    }
    return Math.max(0, remaining);
}

function isUnderLegalWarranty(startDate, warrantyMonths, today) {
    const start = parseWarrantyDate(startDate);
    const months = Number(warrantyMonths);
    if (!start || !Number.isFinite(months) || months <= 0) {
        return false;
    }
    const now = parseWarrantyDate(today ?? new Date());
    if (!now) {
        return false;
    }
    const expiry = warrantyExpiryDate(start, months);
    return now.getTime() <= expiry.getTime();
}

function findPreviousReception(equipment, history) {
    const serie = normalizeWarrantyKey(equipment?.serie);
    const identifier = normalizeWarrantyKey(equipment?.receivedIdentifier ?? equipment?.identifier);
    if (!serie && !identifier) {
        return null;
    }
    const excludeRecordId = normalizeWarrantyKey(equipment?.recordId);
    const excludeItemId = normalizeWarrantyKey(equipment?.id ?? equipment?.itemId);

    const matches = [];
    for (const record of history || []) {
        if (!record) {
            continue;
        }
        if (excludeRecordId && normalizeWarrantyKey(record.id) === excludeRecordId) {
            continue;
        }
        for (const item of record.items || []) {
            if (excludeItemId && normalizeWarrantyKey(item?.id) === excludeItemId) {
                continue;
            }
            const itemSerie = normalizeWarrantyKey(item?.serie);
            const itemIdentifier = normalizeWarrantyKey(item?.receivedIdentifier ?? item?.identifier);
            const serieMatch = !!serie && !!itemSerie && itemSerie === serie;
            const identifierMatch = !!identifier && !!itemIdentifier && itemIdentifier === identifier;
            if (serieMatch || identifierMatch) {
                matches.push({ record, item });
            }
        }
    }

    if (matches.length === 0) {
        return null;
    }

    matches.sort((a, b) => receptionSortKey(b.record).localeCompare(receptionSortKey(a.record)));
    const best = matches[0];
    return {
        code: String(best.record.code || best.record.consecutive || best.record.id || ""),
        receptionDate: receptionSortKey(best.record),
        identifier: String(best.item.receivedIdentifier || best.item.identifier || ""),
        serie: String(best.item.serie || ""),
        failureDescription: String(best.item.failureDescription || ""),
        repairStatus: String(best.item.repairStatus || ""),
        recordId: String(best.record.id || ""),
        clientName: String(best.record.companyName || best.record.prospectName || ""),
    };
}

function backupAvailableForModel(backups, model) {
    const target = normalizeModelKey(model);
    if (!target) {
        return null;
    }
    return (backups || []).find((backup) => normalizeModelKey(backup?.equipmentModel ?? backup?.model) === target) || null;
}

// ─── Mirror: remissions.logic.ts ─────────────────────────────────────────────

function itemsRequiringAccessoriesConfirmation(items) {
    return (items || []).filter((item) => {
        const accessories = String(item?.accessories || "").trim();
        const anchoredNote = String(item?.anchoredNote || "").trim();
        return accessories !== "" || anchoredNote !== "";
    });
}

function requiresAccessoriesConfirmation(items) {
    return itemsRequiringAccessoriesConfirmation(items).length > 0;
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

console.log("\n=== Unit Tests: Warranty Reception, Accessories, Backups ===\n");

console.log("── warrantyMonthsRemaining ──");
// Vigente: inicio 2026-01-09, 12 meses, hoy 2026-08-09 -> vence 2027-01-09 -> 5 meses restantes
assertEqual(warrantyMonthsRemaining("2026-01-09", 12, "2026-08-09"), 5, "Vigente: 5 meses restantes de 12 (inicio hace 7 meses)");
assert(isUnderLegalWarranty("2026-01-09", 12, "2026-08-09"), "Vigente: isUnderLegalWarranty true");

// Justo en el limite: inicio 2026-02-09, 6 meses, hoy 2026-08-09 -> vence hoy -> 0 meses, aun bajo garantia
assertEqual(warrantyMonthsRemaining("2026-02-09", 6, "2026-08-09"), 0, "Limite: 0 meses restantes el dia del vencimiento");
assert(isUnderLegalWarranty("2026-02-09", 6, "2026-08-09"), "Limite: el dia del vencimiento aun esta bajo garantia");

// Vencida: inicio 2025-08-09, 6 meses, hoy 2026-08-09 -> vencio 2026-02-09 -> 0 y fuera de garantia
assertEqual(warrantyMonthsRemaining("2025-08-09", 6, "2026-08-09"), 0, "Vencida: 0 meses restantes");
assert(!isUnderLegalWarranty("2025-08-09", 6, "2026-08-09"), "Vencida: isUnderLegalWarranty false");

// Sin datos -> null / false
assertEqual(warrantyMonthsRemaining(null, 6, "2026-08-09"), null, "Sin fecha -> null");
assertEqual(warrantyMonthsRemaining("2026-01-09", 0, "2026-08-09"), null, "Meses = 0 -> null");
assertEqual(warrantyMonthsRemaining("2026-01-09", null, "2026-08-09"), null, "Meses null -> null");
assertEqual(warrantyMonthsRemaining("", 6, "2026-08-09"), null, "Fecha vacia -> null");
assert(!isUnderLegalWarranty(null, 6, "2026-08-09"), "Sin fecha -> isUnderLegalWarranty false");
assert(!isUnderLegalWarranty("2026-01-09", 0, "2026-08-09"), "Meses = 0 -> isUnderLegalWarranty false");

// Acepta Date objects y meses como string numerico
assertEqual(warrantyMonthsRemaining(new Date(2026, 0, 9), "12", new Date(2026, 7, 9)), 5, "Acepta Date y meses como string");

console.log("\n── findPreviousReception ──");
const historyRecords = [
    {
        id: "rec-old",
        consecutive: "REC-0001",
        createdAt: "2025-03-10T10:00:00.000Z",
        companyName: "Acme SA",
        items: [
            { id: "item-old-1", serie: "SN-123", receivedIdentifier: "EQ-OLD-1", failureDescription: "No enciende", repairStatus: "entregado" },
        ],
    },
    {
        id: "rec-new",
        consecutive: "REC-0002",
        createdAt: "2026-01-15T10:00:00.000Z",
        companyName: "Acme SA",
        items: [
            { id: "item-new-1", serie: "sn-123", receivedIdentifier: "EQ-NEW-1", failureDescription: "Alarma E21", repairStatus: "garantia" },
        ],
    },
    {
        id: "rec-other",
        consecutive: "REC-0003",
        createdAt: "2026-02-01T10:00:00.000Z",
        companyName: "Otra SA",
        items: [
            { id: "item-other-1", serie: "SN-999", receivedIdentifier: "EQ-999", failureDescription: "Ruido", repairStatus: "recibido" },
        ],
    },
];

const bySerie = findPreviousReception({ serie: " SN-123 " }, historyRecords);
assert(bySerie !== null, "Por serie: encuentra recepcion previa (normaliza case/espacios)");
assertEqual(bySerie?.code, "REC-0002", "Por serie: devuelve la mas reciente (codigo antiguo)");
assertEqual(bySerie?.failureDescription, "Alarma E21", "Por serie: incluye la falla previa");
assertEqual(bySerie?.clientName, "Acme SA", "Por serie: incluye el cliente");

const byIdentifier = findPreviousReception({ receivedIdentifier: "eq-old-1" }, historyRecords);
assert(byIdentifier !== null, "Por identificador: encuentra recepcion previa");
assertEqual(byIdentifier?.code, "REC-0001", "Por identificador: codigo antiguo correcto");

const selfExcluded = findPreviousReception({ serie: "SN-123", id: "item-new-1", recordId: "rec-new" }, [historyRecords[1]]);
assertEqual(selfExcluded, null, "Excluye el propio registro/item -> null");

const noPrevious = findPreviousReception({ serie: "SN-INEXISTENTE" }, historyRecords);
assertEqual(noPrevious, null, "Sin recepcion previa -> null");

const noKeys = findPreviousReception({ serie: " ", receivedIdentifier: "" }, historyRecords);
assertEqual(noKeys, null, "Sin serie ni identificador -> null");

const fallbackId = findPreviousReception({ serie: "SN-999" }, [
    { id: "rec-sin-consecutivo", receptionYear: "2024", receptionMonth: "5", receptionDay: "3", items: [{ id: "x", serie: "SN-999" }] },
]);
assertEqual(fallbackId?.code, "rec-sin-consecutivo", "Sin codigo/consecutivo: usa el id del registro");
assertEqual(fallbackId?.receptionDate, "2024-05-03", "Sin createdAt: compone fecha con receptionYear/Month/Day");

console.log("\n── requiresAccessoriesConfirmation ──");
assert(requiresAccessoriesConfirmation([{ accessories: "Cables y fuente", anchoredNote: "" }]), "Con accessories -> true");
assert(requiresAccessoriesConfirmation([{ accessories: "", anchoredNote: "Este equipo tiene equipos en prestamo anclados: MOTOR-01" }]), "Con anchoredNote -> true");
assert(!requiresAccessoriesConfirmation([{ accessories: "", anchoredNote: "" }, { accessories: "   " }]), "Solo vacios/espacios -> false");
assert(!requiresAccessoriesConfirmation([]), "Lista vacia -> false");
assert(!requiresAccessoriesConfirmation(null), "null -> false");
assertEqual(itemsRequiringAccessoriesConfirmation([
    { identifier: "A", accessories: "Cables" },
    { identifier: "B", accessories: "", anchoredNote: "" },
    { identifier: "C", anchoredNote: "anclado" },
]).map((item) => item.identifier), ["A", "C"], "itemsRequiringAccessoriesConfirmation filtra solo los que aplican");

console.log("\n── backupAvailableForModel ──");
const backupsList = [
    { id: "bak-1", equipmentModel: "PLC S7-1200", fileName: "plc.bak", url: "data:application/octet-stream;base64,AAA", version: "1.0" },
    { id: "bak-2", equipmentModel: "HMI KTP700", fileName: "hmi.bak", url: "", version: "2.1" },
];

const exactMatch = backupAvailableForModel(backupsList, "PLC S7-1200");
assertEqual(exactMatch?.id, "bak-1", "Match exacto devuelve el backup");

const caseMatch = backupAvailableForModel(backupsList, "plc s7-1200");
assertEqual(caseMatch?.id, "bak-1", "Normaliza mayusculas/minusculas");

const spaceMatch = backupAvailableForModel(backupsList, "  PLC   S7-1200 ");
assertEqual(spaceMatch?.id, "bak-1", "Normaliza espacios repetidos y bordes");

const hmiMatch = backupAvailableForModel(backupsList, "hmi   ktp700");
assertEqual(hmiMatch?.id, "bak-2", "Segundo modelo tambien coincide con normalizacion");

assertEqual(backupAvailableForModel(backupsList, "OTRO MODELO"), null, "Sin match -> null");
assertEqual(backupAvailableForModel(backupsList, "   "), null, "Modelo vacio -> null");
assertEqual(backupAvailableForModel([], "PLC S7-1200"), null, "Sin backups -> null");

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach((f) => console.log(`  - ${f}`));
}
console.log("");

process.exitCode = failed > 0 ? 1 : 0;
