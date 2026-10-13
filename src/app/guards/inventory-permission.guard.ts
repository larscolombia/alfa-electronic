import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from "@angular/router";
import { InventoryPermission } from "../services/inventory-domain.models";
import { InventoryRbacService } from "../services/inventory-rbac.service";

function hasRequiredPermission(route: ActivatedRouteSnapshot, rbac: InventoryRbacService): boolean {
    const required = route.data["inventoryPermission"] as InventoryPermission | InventoryPermission[] | undefined;

    if (!required) {
        return true;
    }

    if (Array.isArray(required)) {
        return required.some((permission) => rbac.hasPermission(permission));
    }

    return rbac.hasPermission(required);
}

export const inventoryPermissionGuard: CanActivateFn = (route): boolean | UrlTree => {
    const router = inject(Router);
    const rbac = inject(InventoryRbacService);

    if (hasRequiredPermission(route, rbac)) {
        return true;
    }

    return router.createUrlTree([rbac.firstAccessibleInventoryRoute()]);
};
