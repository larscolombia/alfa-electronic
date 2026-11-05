import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

import {
    CustomModuleCatalog,
    CustomQueryRequest,
    CustomQueryResponse,
} from "../pages/app/extracciones/custom/extractions-custom.model";

/** Cliente HTTP de la extracción personalizada transversal (modalidad B). */
@Injectable({
    providedIn: "root",
})
export class ExtractionsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    catalog(): Observable<CustomModuleCatalog[]> {
        return from(this.request<{ items: CustomModuleCatalog[] }>("/api/v1/extractions/catalog", { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    query(request: CustomQueryRequest): Observable<CustomQueryResponse> {
        return from(
            this.request<CustomQueryResponse>("/api/v1/extractions/query", {
                method: "POST",
                body: JSON.stringify(request),
            }),
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
                // Keep fallback when backend returns non-JSON error.
            }
            throw new Error(message);
        }

        return (await response.json()) as T;
    }
}
