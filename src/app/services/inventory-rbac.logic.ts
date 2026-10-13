import { InventoryPermission, InventoryRole } from "./inventory-domain.models";

export type InventoryRoleMatrix = Record<InventoryRole, InventoryPermission[]>;

/**
 * Logica pura de RBAC de inventario (espejada en scripts/test-inventory-rbac-logic.mjs).
 * Decide el bypass de admin y el rol de inventario por defecto segun el rol
 * del usuario autenticado (claim `role` de la sesion `pika.auth.session`).
 */

export function normalizeAuthRole(authRole: string | null | undefined): string {
    return String(authRole ?? "").trim().toLowerCase();
}

export function isAdminAuthRole(authRole: string | null | undefined): boolean {
    return normalizeAuthRole(authRole) === "admin";
}

/**
 * Rol de inventario sugerido para el rol autenticado.
 * Retorna null cuando no hay correspondencia (el llamador decide el fallback).
 */
export function defaultInventoryRoleForAuthRole(authRole: string | null | undefined): InventoryRole | null {
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

/**
 * Un usuario autenticado con rol "admin" tiene todos los permisos de inventario;
 * para el resto se consulta la matriz del rol operativo activo.
 */
export function hasInventoryPermission(
    matrix: InventoryRoleMatrix,
    authRole: string | null | undefined,
    role: InventoryRole,
    permission: InventoryPermission
): boolean {
    if (isAdminAuthRole(authRole)) {
        return true;
    }
    return (matrix[role] ?? []).includes(permission);
}
