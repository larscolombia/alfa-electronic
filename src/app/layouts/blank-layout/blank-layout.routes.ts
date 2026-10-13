import { Routes } from "@angular/router";
import { BlankLayoutComponent } from "./blank-layout.component";

export const BLANK_ROUTES: Routes = [
    {
        path: "",
        component: BlankLayoutComponent,
        children: [
            {
                path: "",
                loadComponent: () => import("../../pages/splash/splash.component").then((m) => m.SplashComponent),
            },
        ],
    },
];
