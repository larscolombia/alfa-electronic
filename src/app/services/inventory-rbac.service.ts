import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { InventoryPermission, InventoryRole } from "./inventory-domain.models";
import { AuthService } from "./auth.service";
import { defaultInventoryRoleForAuthRole, hasInventoryPermission } from "./inventory-rbac.logic";

interface InventoryRoutePermission {
    path: string;
    permission: InventoryPermission;
}

@Injectable({
    providedIn: "root",
})
export class InventoryRbacService {
    /**
     * Clave legacy del rol elegido manualmente en un <select>. Ya no se usa:
     * el rol operativo se deriva del perfil autenticado (Fase 2 ACL) y la clave
     * vieja se elimina del navegador para que nadie conserve un rol auto-asignado.
     */
    private static readonly legacyStorageKey = "lars.inventory.role.v1";

    private readonly roleMatrix: Record<InventoryRole, InventoryPermission[]> = {
        tecnico: [
            "inventory.dashboard.view",
            "inventory.stock.view",
            "inventory.movements.view",
            "inventory.movements.register-exit",
            "inventory.reservations.view",
            "inventory.reservations.manage",
            "inventory.replenishment.view",
        ],
        responsable: [
            "inventory.dashboard.view",
            "inventory.stock.view",
            "inventory.stock.create-card",
            "inventory.stock.register-entry",
            "inventory.movements.view",
            "inventory.movements.register-exit",
            "inventory.movements.register-entry",
            "inventory.movements.register-adjustment",
            "inventory.movements.approve",
            "inventory.reservations.view",
            "inventory.reservations.manage",
            "inventory.replenishment.view",
            "inventory.replenishment.manage",
            "inventory.replenishment.generate-purchase-line",
            "inventory.replenishment.weekly-report",
            "inventory.reconciliation.view",
            "inventory.reconciliation.manage",
            "inventory.reconciliation.export",
            "inventory.bags.manage",
        ],
        administrativo: [
            "inventory.dashboard.view",
            "inventory.stock.view",
            "inventory.stock.register-entry",
            "inventory.movements.view",
            "inventory.movements.register-entry",
            "inventory.reservations.view",
            "inventory.replenishment.view",
            "inventory.bags.manage",
        ],
        compras: [
            "inventory.dashboard.view",
            "inventory.replenishment.view",
            "inventory.replenishment.manage",
            "inventory.replenishment.generate-purchase-line",
            "inventory.replenishment.weekly-report",
        ],
        auditor: [
            "inventory.dashboard.view",
            "inventory.reconciliation.view",
            "inventory.reconciliation.export",
        ],
    };

    private readonly inventoryRoutes: InventoryRoutePermission[] = [
        { path: "/app/inventory-dashboard", permission: "inventory.dashboard.view" },
        { path: "/app/inventory-stock", permission: "inventory.stock.view" },
        { path: "/app/inventory-movements", permission: "inventory.movements.view" },
        { path: "/app/inventory-reservations", permission: "inventory.reservations.view" },
        { path: "/app/inventory-orders", permission: "inventory.replenishment.view" },
        { path: "/app/inventory-order-details", permission: "inventory.reconciliation.view" },
    ];

    private readonly roleSubject: BehaviorSubject<InventoryRole>;
    readonly role$: import("rxjs").Observable<InventoryRole>;

    constructor(private readonly authService: AuthService) {
        this.removeLegacyStoredRole();
        this.roleSubject = new BehaviorSubject<InventoryRole>(this.deriveRoleFromAuthProfile());
        this.role$ = this.roleSubject.asObservable();
    }

    get currentRole(): InventoryRole {
        return this.roleSubject.value;
    }

    /**
     * El rol ya no es elegible en la UI: proviene del perfil autenticado.
     * Se mantiene la firma publica porque varios componentes la invocan desde
     * selects legacy; cualquier cambio manual se ignora (aviso visible en
     * consola) para que un <select> no escale permisos del lado del cliente.
     * La autorizacion real la aplica el backend (middleware ACL, Fase 2).
     */
    setRole(role: InventoryRole): void {
        if (role !== this.roleSubject.value) {
            console.warn(
                `[inventory-rbac] el rol operativo se deriva del perfil autenticado ('${this.roleSubject.value}'); se ignora el cambio manual a '${role}'.`
            );
        }
    }

    hasPermission(permission: InventoryPermission): boolean {
        return hasInventoryPermission(this.roleMatrix, this.currentAuthRole(), this.currentRole, permission);
    }

    hasAnyPermission(permissions: InventoryPermission[]): boolean {
        return permissions.some((permission) => this.hasPermission(permission));
    }

    hasRouteAccess(path: string): boolean {
        const mapped = this.inventoryRoutes.find((item) => item.path === path);
        if (!mapped) {
            return true;
        }
        return this.hasPermission(mapped.permission);
    }

    firstAccessibleInventoryRoute(): string {
        const firstAllowed = this.inventoryRoutes.find((item) => this.hasPermission(item.permission));
        return firstAllowed?.path ?? "/app/dashboard";
    }

    roleLabel(role: InventoryRole): string {
        if (role === "responsable") {
            return "Responsable de inventario";
        }
        if (role === "administrativo") {
            return "Administrativo";
        }
        if (role === "compras") {
            return "Compras";
        }
        if (role === "auditor") {
            return "Auditor";
        }
        return "Tecnico";
    }

    private currentAuthRole(): string {
        return this.authService.getCurrentUser()?.role ?? "";
    }

    /**
     * El rol operativo se deriva unicamente del perfil autenticado
     * (admin -> responsable); ya no se lee ni se guarda en localStorage.
     */
    private deriveRoleFromAuthProfile(): InventoryRole {
        return defaultInventoryRoleForAuthRole(this.currentAuthRole()) ?? "tecnico";
    }

    private removeLegacyStoredRole(): void {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.removeItem(InventoryRbacService.legacyStorageKey);
    }
}
