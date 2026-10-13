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
    private readonly storageKey = "lars.inventory.role.v1";

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
        this.roleSubject = new BehaviorSubject<InventoryRole>(this.restoreRole());
        this.role$ = this.roleSubject.asObservable();
    }

    get currentRole(): InventoryRole {
        return this.roleSubject.value;
    }

    setRole(role: InventoryRole): void {
        if (this.roleSubject.value === role) {
            return;
        }

        this.roleSubject.next(role);
        this.persistRole(role);
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

    private restoreRole(): InventoryRole {
        if (typeof window === "undefined") {
            return "tecnico";
        }

        const persisted = window.localStorage.getItem(this.storageKey);
        if (persisted && this.isInventoryRole(persisted)) {
            return persisted;
        }

        // Sin preferencia explicita: deriva el rol operativo del usuario autenticado
        // (admin -> responsable) en lugar de asumir siempre "tecnico".
        return defaultInventoryRoleForAuthRole(this.currentAuthRole()) ?? "tecnico";
    }

    private persistRole(role: InventoryRole): void {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem(this.storageKey, role);
    }

    private isInventoryRole(value: string): value is InventoryRole {
        return value === "tecnico" || value === "responsable" || value === "administrativo" || value === "compras" || value === "auditor";
    }
}
