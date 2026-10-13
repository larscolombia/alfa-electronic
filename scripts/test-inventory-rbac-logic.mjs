/**
 * Unit tests — Inventory RBAC logic (espejo de src/app/services/inventory-rbac.logic.ts)
 * Ejecutar: node scripts/test-inventory-rbac-logic.mjs
 */

import assert from "node:assert/strict";

// ─── Mirror of inventory-rbac.logic.ts (keep in sync!) ──────────────────────

function normalizeAuthRole(authRole) {
    return String(authRole ?? "").trim().toLowerCase();
}

function isAdminAuthRole(authRole) {
    return normalizeAuthRole(authRole) === "admin";
}

function defaultInventoryRoleForAuthRole(authRole) {
    switch (normalizeAuthRole(authRole)) {
        case "admin":
            return "responsable";
        case "responsable":
            return "responsable";
        case "administrativo":
            return "administrativo";
        case "compras":
            return "compras";
        case "auditor":
            return "auditor";
        case "tecnico":
            return "tecnico";
        default:
            return null;
    }
}

function hasInventoryPermission(matrix, authRole, role, permission) {
    if (isAdminAuthRole(authRole)) {
        return true;
    }
    return (matrix[role] ?? []).includes(permission);
}

// ─── Matrix mínima de referencia (subset de inventory-rbac.service.ts) ──────

const matrix = {
    tecnico: ["inventory.reservations.manage", "inventory.replenishment.view"],
    responsable: ["inventory.replenishment.manage", "inventory.reservations.manage"],
    administrativo: ["inventory.replenishment.view"],
    compras: ["inventory.replenishment.manage"],
    auditor: [],
};

// ─── isAdminAuthRole ─────────────────────────────────────────────────────────

{
    assert.equal(isAdminAuthRole("admin"), true);
    assert.equal(isAdminAuthRole("ADMIN"), true, "case-insensitive");
    assert.equal(isAdminAuthRole("  admin  "), true, "tolera espacios");
    assert.equal(isAdminAuthRole("tecnico"), false);
    assert.equal(isAdminAuthRole(""), false);
    assert.equal(isAdminAuthRole(null), false);
    assert.equal(isAdminAuthRole(undefined), false);
}

// ─── defaultInventoryRoleForAuthRole ─────────────────────────────────────────

{
    assert.equal(defaultInventoryRoleForAuthRole("admin"), "responsable", "admin mapea a responsable");
    assert.equal(defaultInventoryRoleForAuthRole("Admin"), "responsable");
    assert.equal(defaultInventoryRoleForAuthRole("tecnico"), "tecnico");
    assert.equal(defaultInventoryRoleForAuthRole("responsable"), "responsable");
    assert.equal(defaultInventoryRoleForAuthRole("administrativo"), "administrativo");
    assert.equal(defaultInventoryRoleForAuthRole("compras"), "compras");
    assert.equal(defaultInventoryRoleForAuthRole("auditor"), "auditor");
    assert.equal(defaultInventoryRoleForAuthRole("vendedor"), null, "rol desconocido -> null (fallback externo)");
    assert.equal(defaultInventoryRoleForAuthRole(""), null);
    assert.equal(defaultInventoryRoleForAuthRole(null), null);
    assert.equal(defaultInventoryRoleForAuthRole(undefined), null);
}

// ─── hasInventoryPermission: bypass admin ────────────────────────────────────

{
    // admin con rol operativo tecnico (el caso del bug): bypass total
    assert.equal(
        hasInventoryPermission(matrix, "admin", "tecnico", "inventory.replenishment.manage"),
        true,
        "admin bypassa aunque el rol operativo sea tecnico"
    );
    assert.equal(hasInventoryPermission(matrix, "admin", "auditor", "inventory.replenishment.manage"), true);
    assert.equal(hasInventoryPermission(matrix, "ADMIN", "tecnico", "inventory.replenishment.manage"), true);
}

// ─── hasInventoryPermission: sin bypass (comportamiento previo) ─────────────

{
    assert.equal(hasInventoryPermission(matrix, "tecnico", "tecnico", "inventory.replenishment.manage"), false);
    assert.equal(hasInventoryPermission(matrix, "tecnico", "tecnico", "inventory.reservations.manage"), true);
    assert.equal(hasInventoryPermission(matrix, "responsable", "responsable", "inventory.replenishment.manage"), true);
    assert.equal(hasInventoryPermission(matrix, "compras", "compras", "inventory.replenishment.manage"), true);
    assert.equal(hasInventoryPermission(matrix, "auditor", "auditor", "inventory.replenishment.manage"), false);

    // sin sesion (anonimo): no hay bypass, solo la matriz
    assert.equal(hasInventoryPermission(matrix, null, "responsable", "inventory.replenishment.manage"), true);
    assert.equal(hasInventoryPermission(matrix, undefined, "tecnico", "inventory.replenishment.manage"), false);

    // rol operativo no presente en la matriz -> sin permisos
    assert.equal(hasInventoryPermission(matrix, "", "inexistente", "inventory.replenishment.manage"), false);
}

console.log("OK — test-inventory-rbac-logic: todos los asserts pasaron");
