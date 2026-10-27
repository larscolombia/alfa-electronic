import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type CrmProspectFollowupStatus = "Pendiente" | "Completado";

export interface CrmProspectFollowup {
    id: string;
    prospectId: string;
    tipo: string;
    fecha: string;
    hora: string;
    recordatorio: string;
    observacion: string;
    estado: CrmProspectFollowupStatus;
    registradoPor?: string;
    contactoNombre?: string;
    softDelete: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertCrmProspectFollowupRequest {
    tipo: string;
    fecha: string;
    hora: string;
    recordatorio: string;
    observacion: string;
    estado: CrmProspectFollowupStatus;
    registradoPor?: string;
    contactoNombre?: string;
}

@Injectable({
    providedIn: "root",
})
export class CrmFollowupsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listProspectFollowups(prospectId: string): Observable<CrmProspectFollowup[]> {
        return from(
            this.request<{ items: CrmProspectFollowup[] }>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/followups`, { method: "GET" }),
        ).pipe(map((response) => response.items ?? []));
    }

    createProspectFollowup(prospectId: string, payload: UpsertCrmProspectFollowupRequest): Observable<CrmProspectFollowup> {
        return from(
            this.request<CrmProspectFollowup>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/followups`, {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    updateProspectFollowup(prospectId: string, followupId: string, payload: UpsertCrmProspectFollowupRequest): Observable<CrmProspectFollowup> {
        return from(
            this.request<CrmProspectFollowup>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/followups/${encodeURIComponent(followupId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteProspectFollowup(prospectId: string, followupId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/followups/${encodeURIComponent(followupId)}`, {
                method: "DELETE",
            }),
        ).pipe(map(() => void 0));
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

        const response = await fetch(this.apiURL(path), {
            ...init,
            headers,
        });

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

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
