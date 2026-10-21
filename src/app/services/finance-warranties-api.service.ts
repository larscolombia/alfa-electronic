import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type FinanceWarrantyStatus = "Vigente" | "Por vencer" | "Vencida" | "Cerrada";
export type FinanceWarrantyPhase = "en-revision" | "esperando-componentes" | "en-reparacion" | "lista";

export interface FinanceWarrantyRecord {
    id: number;
    code: string;
    equipmentId: string;
    equipmentIdentifier: string;
    clientName: string;
    months: number;
    startAt: string;
    endAt: string;
    followUpAt: string;
    owner: string;
    phase: FinanceWarrantyPhase;
    status: FinanceWarrantyStatus;
    notes: string;
    createdBy?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpsertFinanceWarrantyRequest {
    code?: string;
    equipmentId?: string;
    equipmentIdentifier: string;
    clientName: string;
    months?: number;
    startAt: string;
    endAt: string;
    followUpAt: string;
    owner?: string;
    phase: FinanceWarrantyPhase;
    status?: FinanceWarrantyStatus;
    notes?: string;
}

@Injectable({ providedIn: "root" })
export class FinanceWarrantiesApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listWarranties(status = ""): Observable<FinanceWarrantyRecord[]> {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return from(this.request<{ items: FinanceWarrantyRecord[] }>(`/api/v1/finance/warranties${query}`, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    listExpiring(days = 30): Observable<FinanceWarrantyRecord[]> {
        return from(
            this.request<{ items: FinanceWarrantyRecord[] }>(`/api/v1/finance/warranties/expiring?days=${encodeURIComponent(String(days))}`, {
                method: "GET",
            }),
        ).pipe(map((response) => response.items ?? []));
    }

    createWarranty(payload: UpsertFinanceWarrantyRequest): Observable<FinanceWarrantyRecord> {
        return from(this.request<FinanceWarrantyRecord>("/api/v1/finance/warranties", { method: "POST", body: JSON.stringify(payload) }));
    }

    updateWarranty(warrantyId: number, payload: UpsertFinanceWarrantyRequest): Observable<FinanceWarrantyRecord> {
        return from(
            this.request<FinanceWarrantyRecord>(`/api/v1/finance/warranties/${encodeURIComponent(String(warrantyId))}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteWarranty(warrantyId: number): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/finance/warranties/${encodeURIComponent(String(warrantyId))}`, { method: "DELETE" }),
        ).pipe(map(() => void 0));
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
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

        if (!response.ok) {
            let message = `Request failed with status ${response.status}`;
            try {
                const errorBody = (await response.json()) as { error?: string };
                if (errorBody?.error) {
                    message = errorBody.error;
                }
            } catch {
                // Keep default message
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
