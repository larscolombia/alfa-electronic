import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { withRouterConfig, RouterConfigOptions, provideRouter } from "@angular/router";
import { provideDaterangepickerLocale } from "ngx-daterangepicker-bootstrap";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        // Change detection por zona (Angular 21 corre zoneless por omisión): cada
        // compleción asíncrona dentro de la app — fetch de stores, timers, XHR —
        // agenda un tick de CD. Sin esto, UIs alimentadas por stores asíncronos se
        // quedan congeladas en el primer render hasta que hay un evento de usuario.
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes, withRouterConfig({ scrollPositionRestoration: "enabled", onSameUrlNavigation: "reload" } as RouterConfigOptions)),
        provideDaterangepickerLocale({
            separator: " - ",
            applyLabel: "Okay",
        }),
    ],
};
