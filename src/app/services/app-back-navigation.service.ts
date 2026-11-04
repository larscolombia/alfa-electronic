import { Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";

/**
 * "Volver" con la semantica del boton atras del navegador, unificada para toda la app.
 *
 * Mantiene una pila de URLs /app/* visitadas durante la sesion SPA (la misma que el
 * header usaba en privado). goBack() regresa a la entrada anterior; si no hay historial
 * (carga directa al URL, sin paginas previas) navega al destino determinista que cada
 * boton le indica como fallback — asi "Volver" nunca queda muerto.
 *
 * Solo rastrea URLs internas (/app/...): las publicas no ensucian la pila y los
 * botones de pagina (p.ej. cerrar un formulario) siguen usando su logica propia,
 * que no es navegacion.
 */
@Injectable({ providedIn: "root" })
export class AppBackNavigationService {
    private readonly appNavigationHistory: string[] = [];
    private currentAppUrl = "";
    private navigatingBack = false;

    constructor(private readonly router: Router) {
        // Singleton raiz: una sola suscripcion para toda la app.
        this.router.events.subscribe((event) => {
            if (!(event instanceof NavigationEnd)) return;

            const nextUrl = event.urlAfterRedirects.split("?")[0].split("#")[0].replace(/\/$/, "");
            if (!nextUrl.startsWith("/app/")) return;

            if (this.currentAppUrl && this.currentAppUrl !== nextUrl) {
                if (this.navigatingBack) {
                    // La navegacion de regreso no vuelve a empujar la pagina saliente:
                    // si se hiciera, un segundo "Volver" regresaria al punto de partida.
                    this.navigatingBack = false;
                } else {
                    this.appNavigationHistory.push(this.currentAppUrl);
                }
            }

            this.currentAppUrl = nextUrl;
        });
    }

    /**
     * Regresa a la URL anterior visitada en esta sesion.
     * @param fallbackPath destino determinista cuando no hay historial (carga directa).
     */
    goBack(fallbackPath?: string): void {
        const previous = this.appNavigationHistory.pop();
        if (previous) {
            this.navigatingBack = true;
            this.router.navigateByUrl(previous);
            return;
        }

        const path = this.router.url.split("?")[0].split("#")[0].replace(/\/$/, "");
        const destination = fallbackPath ?? this.defaultFallbackFor(path);
        this.router.navigateByUrl(destination);
    }

    private defaultFallbackFor(path: string): string {
        // Comportamiento heredado del header global para los listados CRM.
        if (path === "/app/crm-prospectos" || path === "/app/crm-clientes" || path === "/app/crm-cotizaciones") {
            return "/app/main-menu";
        }
        return "/app/dashboard";
    }
}
