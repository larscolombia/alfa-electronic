import { registerLocaleData } from "@angular/common";
import localeEs from "@angular/common/locales/es";
import localeEsExtra from "@angular/common/locales/extra/es";
import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

registerLocaleData(localeEs, "es-ES", localeEsExtra);

bootstrapApplication(AppComponent, {
    providers: appConfig.providers, // Use the providers from appConfig
}).catch((err) => console.error(err));
