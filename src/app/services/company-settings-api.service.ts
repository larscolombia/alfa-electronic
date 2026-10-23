import { Injectable, inject } from "@angular/core";
import { Observable, map, from } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

/**
 * Perfil de la empresa (una fila por company_id en el backend).
 * Alimenta tres superficies que antes llevaban texto hardcodeado:
 *  - la página pública de cotización (/estimate/:token),
 *  - el documento impreso de factura,
 *  - el <title>/favicon del navegador.
 *
 * El GET es público a propósito (la cita la abre el cliente sin sesión); solo
 * expone datos públicos de la empresa. El PUT exige rol admin en el backend.
 */
export interface CompanyProfile {
    name: string;
    nit: string;
    tagline: string;
    logoDataUrl: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    youtube: string;
    instagram: string;
    facebook: string;
    twitter: string;
    pageTitle: string;
}

@Injectable({
    providedIn: "root",
})
export class CompanySettingsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    getProfile(): Observable<CompanyProfile> {
        return from(this.request<CompanyProfile>("/api/v1/company-settings", { method: "GET" }));
    }

    updateProfile(profile: CompanyProfile): Observable<CompanyProfile> {
        return from(
            this.request<CompanyProfile>("/api/v1/company-settings", {
                method: "PUT",
                body: JSON.stringify(profile),
            })
        );
    }

    private apiURL(path: string): string {
        return `${this.apiBaseUrl}${path}`;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", this.companyID);

        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(this.apiURL(path), { ...init, headers });

        if (response.status === 401) {
            this.authService.markUnauthorized();
        }

        if (!response.ok) {
            let message = `Request failed with status ${response.status}`;
            try {
                const errorBody = (await response.json()) as { error?: string };
                if (errorBody?.error) {
                    message = errorBody.error;
                }
            } catch {
                // El backend devolvio un error no JSON: se conserva el mensaje de fallback.
            }
            throw new Error(message);
        }

        return (await response.json()) as T;
    }
}
