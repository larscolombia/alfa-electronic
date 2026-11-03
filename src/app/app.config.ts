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
        //
        // eventCoalescing DEBE quedar en false: esta app mezcla zonas (el servicio
        // de selects corre MutationObservers y queueMicrotask fuera de Angular y
        // re-entra con zone.run). Con coalescing activo, esa contabilidad cruzada
        // descarta ticks pendientes de forma intermitente: el handler del evento
        // actualiza el modelo pero la vista no se renderiza hasta un tick manual o
        // un evento posterior (síntoma: botones que "no hacen nada" ~40% de las veces).
        provideZoneChangeDetection({ eventCoalescing: false }),
        provideRouter(routes, withRouterConfig({ scrollPositionRestoration: "enabled", onSameUrlNavigation: "reload" } as RouterConfigOptions)),
        provideDaterangepickerLocale({
            separator: " - ",
            applyLabel: "Okay",
        }),
    ],
};
