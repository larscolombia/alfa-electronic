import { Routes } from "@angular/router";
import { guestOnlyGuard } from "../../guards/auth.guard";
import { AuthLayoutComponent } from "./auth-layout.component";

export const AUTH_ROUTES: Routes = [
    {
        path: "",
        component: AuthLayoutComponent,
        children: [
            {
                path: "",
                redirectTo: "signin",
                pathMatch: "full",
            },
            {
                path: "signin",
                canActivate: [guestOnlyGuard],
                loadComponent: () => import("../../pages/auth/signin/signin.component").then((m) => m.SigninComponent),
            },
            {
                path: "signup",
                loadComponent: () => import("../../pages/auth/signup/signup.component").then((m) => m.SignupComponent),
            },
            {
                path: "forgot-password",
                loadComponent: () => import("../../pages/auth/forgot-password/forgot-password.component").then((m) => m.ForgotPasswordComponent),
            },
            {
                path: "change-password",
                loadComponent: () => import("../../pages/auth/change-password/change-password.component").then((m) => m.ChangePasswordComponent),
            },
            {
                path: "signup-success",
                loadComponent: () => import("../../pages/auth/signup-success/signup-success.component").then((m) => m.SignupSuccessComponent),
            },
            {
                path: "onboarding",
                loadComponent: () => import("../../pages/auth/onboarding/onboarding.component").then((m) => m.OnboardingComponent),
            },
            {
                path: "onboarding2",
                loadComponent: () => import("../../pages/auth/onboarding/onboarding2.component").then((m) => m.Onboarding2Component),
            },
        ],
    },
];
