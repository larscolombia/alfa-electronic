import { Routes } from "@angular/router";
import { authGuard } from "./guards/auth.guard";

export const routes: Routes = [
    {
        path: "app/work-projects-lab",
        pathMatch: "full",
        canActivate: [authGuard],
        loadComponent: () => import("./pages/app/projects/lab/work-projects-lab-shell.component").then((m) => m.WorkProjectsLabShellComponent),
    },
    {
        path: "",
        loadChildren: () => import("./layouts/blank-layout/blank-layout.routes").then((m) => m.BLANK_ROUTES),
    },
    {
        path: "auth",
        loadChildren: () => import("./layouts/auth-layout/auth-layout.routes").then((m) => m.AUTH_ROUTES),
    },
    {
        path: "app",
        canActivate: [authGuard],
        loadChildren: () => import("./layouts/internal-layout/internal-layout.routes").then((m) => m.INTERNAL_ROUTES),
    },
    {
        path: "",
        loadChildren: () => import("./layouts/extra-layout/extra-layout.routes").then((m) => m.EXTRA_ROUTES),
    },
    {
        path: "index",
        canActivate: [authGuard],
        loadComponent: () => import("./pages/app/main-menu/main-menu.component").then((m) => m.MainMenuComponent),
    },
];
