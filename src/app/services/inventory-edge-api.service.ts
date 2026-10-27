import { Injectable, inject, NgZone } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import { DuplicateReferenceCandidate } from "./inventory-domain.models";
import { OperationResultResponse } from "./inventory-edge-api.models";

/**
 * Endpoints nuevos del backend de inventario (reglas INV-03..INV-10):
 * duplicados extendidos, pruebas de usado, bolsas con custodia, discrepancias
 * de conteo y decisiones de reposicion escalada. El resto de endpoints sigue
 * en InventoryApiService.
 */
@Injectable({
    providedIn: "root",
})
export class InventoryEdgeApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly zone = inject(NgZone);

    checkDuplicates(params: {
        reference?: string;
        designation?: string;
        internalCode?: string;
        supplier?: string;
    }): Observable<DuplicateReferenceCandidate[]> {
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value && value.trim()) {
                search.set(key, value.trim());
            }
        }
        return from(
            this.request<{ candidates: DuplicateReferenceCandidate[] }>(
                `/api/v1/inventory/references/duplicates/check?${search.toString()}`,
                { method: "GET" }
            )
        ).pipe(map((r) => r.candidates ?? []));
    }

    recordUsedTest(reference: string, payload: { result: string; note: string }): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(
                `/api/v1/inventory/references/${encodeURIComponent(reference)}/used-test`,
                { method: "POST", body: JSON.stringify(payload) }
            )
        );
    }

    receiveBag(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/bags/receive", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    releaseBag(bagId: string, leftoverQty: number): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/bags/${encodeURIComponent(bagId)}/release`, {
                method: "POST",
                body: JSON.stringify({ leftoverQty }),
            })
        );
    }

    createDiscrepancy(
        sessionId: string,
        payload: { referenceId: string; countedQty: number; reason: string; rootCause?: string }
    ): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/sessions/${encodeURIComponent(sessionId)}/discrepancies`, {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    registerReplenishmentDecision(
        reference: string,
        payload: { action: string; reason: string; provider?: string }
    ): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/replenishment/${encodeURIComponent(reference)}/decision`, {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    private apiUrl(path: string): string {
        return `${this.apiBaseUrl}${path}`;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        return this.zone.run(async () => {
            const headers = new Headers(init.headers);
            headers.set("Content-Type", "application/json");
            headers.set("X-Company-Id", this.companyID);

            const accessToken = this.authService.getAccessToken();
            if (accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
            }

            const response = await fetch(this.apiUrl(path), { ...init, headers });

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
                    // Keep fallback message when backend returns non-JSON error.
                }
                throw new Error(message);
            }

            if (response.status === 204) {
                return {} as T;
            }

            return (await response.json()) as T;
        });
    }
}
