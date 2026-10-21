import { Injectable, inject } from "@angular/core";
import { from, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

/** Claves de configuración por empresa usadas en Fase 5a. */
export const FINANCE_HOURLY_RATE_KEY = "finance.hourlyRate";
export const FINANCE_PETTY_CASH_BUDGET_KEY = "finance.pettyCashBudget";

@Injectable({ providedIn: "root" })
export class FinanceSettingsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    /**
     * Lee una configuración por empresa. Devuelve null cuando no existe fila
     * (404): el llamador aplica su fallback SOLO en ese caso.
     */
    getSetting<T>(key: string): Observable<T | null> {
        return from(this.fetchSetting<T>(key));
    }

    putSetting<T>(key: string, value: T): Observable<T> {
        return from(this.saveSetting<T>(key, value));
    }

    private async fetchSetting<T>(key: string): Promise<T | null> {
        const response = await this.requestRaw(`/api/v1/finance/settings/${encodeURIComponent(key)}`, { method: "GET" });
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error(await this.errorMessage(response, `Request failed with status ${response.status}`));
        }
        const body = (await response.json()) as { value?: T };
        return (body?.value ?? null) as T | null;
    }

    private async saveSetting<T>(key: string, value: T): Promise<T> {
        const response = await this.requestRaw(`/api/v1/finance/settings/${encodeURIComponent(key)}`, {
            method: "PUT",
            body: JSON.stringify({ value }),
        });
        if (!response.ok) {
            throw new Error(await this.errorMessage(response, `Request failed with status ${response.status}`));
        }
        const body = (await response.json()) as { value?: T };
        return body?.value as T;
    }

    private async errorMessage(response: Response, fallback: string): Promise<string> {
        try {
            const errorBody = (await response.json()) as { error?: string };
            return errorBody?.error || fallback;
        } catch {
            return fallback;
        }
    }

    private async requestRaw(path: string, init: RequestInit): Promise<Response> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", this.companyID);

        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(`${this.apiBaseUrl}${path}`, { ...init, headers });
        if (response.status === 401) {
            this.authService.markUnauthorized();
        }
        return response;
    }
}
