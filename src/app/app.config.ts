import { ApplicationConfig } from "@angular/core";
import { withRouterConfig, RouterConfigOptions, provideRouter } from "@angular/router";
import { provideDaterangepickerLocale } from "ngx-daterangepicker-bootstrap";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes, withRouterConfig({ scrollPositionRestoration: "enabled", onSameUrlNavigation: "reload" } as RouterConfigOptions)),
        provideDaterangepickerLocale({
            separator: " - ",
            applyLabel: "Okay",
        }),
    ],
};
