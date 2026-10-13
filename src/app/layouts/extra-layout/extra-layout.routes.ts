import { Routes } from "@angular/router";
import { guestOnlyGuard } from "../../guards/auth.guard";
import { ExtraLayoutComponent } from "./extra-layout.component";

export const EXTRA_ROUTES: Routes = [
    {
        path: "",
        component: ExtraLayoutComponent,
        children: [
            {
                path: "not-found",
                loadComponent: () => import("../../pages/extra/page-not-found/page-not-found.component").then((m) => m.PageNotFoundComponent),
            },
            {
                path: "under-construction",
                loadComponent: () => import("../../pages/extra/under-construction/under-construction.component").then((m) => m.UnderConstructionComponent),
            },
            {
                path: "coming-soon",
                loadComponent: () => import("../../pages/extra/coming-soon/coming-soon.component").then((m) => m.ComingSoonComponent),
            },
            {
                path: "estimate/:token",
                loadComponent: () => import("../../pages/app/crm/crm-quote-preview.component").then((m) => m.CrmQuotePreviewComponent),
            },
            {
                path: "",
                canActivate: [guestOnlyGuard],
                loadComponent: () => import("../../pages/auth/signin/signin.component").then((m) => m.SigninComponent),
                pathMatch: "full",
            },
            {
                path: "**",
                loadComponent: () => import("../../pages/extra/page-not-found/page-not-found.component").then((m) => m.PageNotFoundComponent),
            },
        ],
    },
];
