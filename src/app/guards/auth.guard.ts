import { inject } from "@angular/core";
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from "@angular/router";
import { AuthService } from "../services/auth.service";

function resolveProtectedAccess(targetUrl: string): boolean | UrlTree {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    const redirectTo = targetUrl?.trim() || "/app/main-menu";
    return router.createUrlTree(["/auth/signin"], {
        queryParams: { redirectTo },
    });
}

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
    return resolveProtectedAccess(state.url);
};

export const authChildGuard: CanActivateChildFn = (_route, state): boolean | UrlTree => {
    return resolveProtectedAccess(state.url);
};

export const guestOnlyGuard: CanActivateFn = (): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(["/app/main-menu"]);
};