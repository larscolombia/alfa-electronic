/**
 * Unit tests — Vinculación de equipos CRM con el prospecto real (UUID)
 *
 * Prueba la lógica pura REAL de src/app/pages/app/crm/crm-prospect-equipment-match.logic.ts:
 *  - resolveEquipmentProspectId: usa backendId (UUID), nunca el id numérico sintético
 *  - buildEquipmentMatchCriteria: incluye nit/nombre del cliente para el match ampliado
 *    (recepciones directas prospect_id = "-9000" del mismo cliente)
 *
 * Run: node scripts/test-prospect-equipment-logic.mjs
 */

import {
    resolveEquipmentProspectId,
    buildEquipmentMatchCriteria,
} from "../src/app/pages/app/crm/crm-prospect-equipment-match.logic.ts";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
    if (condition) {
        passed += 1;
        console.log(`  PASS ${name}`);
    } else {
        failed += 1;
        console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    }
}

console.log("resolveEquipmentProspectId");
{
    const prospect = { id: 60, backendId: "60b1066e-5847-4011-8022-231c026f7c5f" };
    check(
        "prefiere el UUID real sobre el id sintético",
        resolveEquipmentProspectId(prospect) === "60b1066e-5847-4011-8022-231c026f7c5f",
        resolveEquipmentProspectId(prospect),
    );

    check(
        "recorta espacios del backendId",
        resolveEquipmentProspectId({ id: 7, backendId: "  uuid-x " }) === "uuid-x",
    );

    check(
        "cae al id numérico como texto cuando no hay backendId (recepción directa -9000)",
        resolveEquipmentProspectId({ id: -9000, backendId: "" }) === "-9000",
    );

    check(
        "prospecto nulo devuelve '0' (sin filtro)",
        resolveEquipmentProspectId(null) === "0" && resolveEquipmentProspectId(undefined) === "0",
    );

    check(
        "id no numérico devuelve '0'",
        resolveEquipmentProspectId({ id: Number.NaN }) === "0",
    );
}

console.log("buildEquipmentMatchCriteria");
{
    const criteria = buildEquipmentMatchCriteria({
        id: 60,
        backendId: "60b1066e-5847-4011-8022-231c026f7c5f",
        nit: " 323231232 ",
        compania: "Industrias Manufactureras",
    });

    check("prospectId es el UUID", criteria.prospectId === "60b1066e-5847-4011-8022-231c026f7c5f");
    check("clientNit normalizado", criteria.clientNit === "323231232");
    check("clientName presente", criteria.clientName === "Industrias Manufactureras");

    const empty = buildEquipmentMatchCriteria(null);
    check(
        "sin prospecto: criterio vacío y prospectId '0'",
        empty.prospectId === "0" && empty.clientNit === "" && empty.clientName === "",
    );

    const withoutCompany = buildEquipmentMatchCriteria({ id: 3, backendId: "uuid-3" });
    check(
        "sin nit/compañía no rompe y deja match solo por UUID",
        withoutCompany.prospectId === "uuid-3" && withoutCompany.clientNit === "" && withoutCompany.clientName === "",
    );
}

console.log("criterio → query string (contrato con CrmEquipmentApiService)");
{
    // Replica mínima del contrato de buildQueryString: prospectId vacío/"0" no se envía.
    const toQuery = (criteria) => {
        const params = new URLSearchParams();
        if (criteria.prospectId && criteria.prospectId !== "0") params.set("prospectId", criteria.prospectId);
        if (criteria.clientNit) params.set("clientNit", criteria.clientNit);
        if (criteria.clientName) params.set("clientName", criteria.clientName);
        return params.toString();
    };

    const criteria = buildEquipmentMatchCriteria({
        id: 60,
        backendId: "60b1066e-5847-4011-8022-231c026f7c5f",
        nit: "323231232",
        compania: "Industrias Manufactureras",
    });
    const query = toQuery(criteria);
    check(
        "la query lleva prospectId UUID + clientNit + clientName",
        query.includes("prospectId=60b1066e-5847-4011-8022-231c026f7c5f")
            && query.includes("clientNit=323231232")
            && query.includes("clientName=Industrias+Manufactureras"),
        query,
    );

    check(
        "prospectId '0' no se envía como filtro",
        toQuery(buildEquipmentMatchCriteria(null)) === "",
    );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
}
