import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { NgZone } from "@angular/core";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import {
    AdjustmentRequest,
    AuditEvent,
    CountSession,
    DiscrepancyRecord,
    InventoryOperationResult,
    InventoryState,
    MovementRecord,
    PurchaseLine,
    PurchaseRequestRecord,
    ReplenishmentItem,
    ReservationRecord,
    StockReference,
    TechnicianBagTrace,
    WeeklyShortageSnapshot,
} from "./inventory-domain.models";

export interface InventoryStateResponse {
    references: StockReference[];
    movements: MovementRecord[];
    adjustmentRequests: AdjustmentRequest[];
    reservations: ReservationRecord[];
    maxReserveDays: number;
    replenishmentItems: ReplenishmentItem[];
    purchaseLines: PurchaseLine[];
    weeklySnapshots: WeeklyShortageSnapshot[];
    bagTraces: TechnicianBagTrace[];
    sessions: CountSession[];
    discrepancies: DiscrepancyRecord[];
    auditTrail: AuditEvent[];
}

export interface InventoryConfigResponse {
    maxReserveDays: number;
    updatedAt: string;
}

export interface DuplicateCandidateResponse {
    reference: string;
    designation: string;
    similarity: number;
    reason: string;
}

export interface OperationResultResponse {
    ok: boolean;
    message: string;
}

@Injectable({
    providedIn: "root",
})
export class InventoryApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly zone = inject(NgZone);

    getFullState(): Observable<InventoryStateResponse> {
        return from(this.request<InventoryStateResponse>("/api/v1/inventory", { method: "GET" }));
    }

    getConfig(): Observable<InventoryConfigResponse> {
        return from(this.request<InventoryConfigResponse>("/api/v1/inventory/config", { method: "GET" }));
    }

    setMaxReserveDays(days: number): Observable<InventoryConfigResponse> {
        return from(
            this.request<InventoryConfigResponse>("/api/v1/inventory/config/max-reserve-days", {
                method: "PUT",
                body: JSON.stringify({ days }),
            })
        );
    }

    listReferences(): Observable<StockReference[]> {
        return from(this.request<{ items: StockReference[] }>("/api/v1/inventory/references", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    getReference(reference: string): Observable<StockReference> {
        return from(this.request<StockReference>(`/api/v1/inventory/references/${encodeURIComponent(reference)}`, { method: "GET" }));
    }

    createReference(payload: Record<string, unknown>): Observable<{ item: StockReference; result: OperationResultResponse }> {
        return from(
            this.request<{ item: StockReference; result: OperationResultResponse }>("/api/v1/inventory/references", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    checkDuplicates(reference: string, designation: string): Observable<DuplicateCandidateResponse[]> {
        const params = new URLSearchParams({ reference, designation });
        return from(
            this.request<{ candidates: DuplicateCandidateResponse[] }>(`/api/v1/inventory/references/duplicates/check?${params}`, { method: "GET" })
        ).pipe(map((r) => r.candidates ?? []));
    }

    registerStockEntry(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/stock-entry", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    listMovements(): Observable<MovementRecord[]> {
        return from(this.request<{ items: MovementRecord[] }>("/api/v1/inventory/movements", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    submitMovement(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/movements", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    listAdjustmentRequests(): Observable<AdjustmentRequest[]> {
        return from(this.request<{ items: AdjustmentRequest[] }>("/api/v1/inventory/adjustment-requests", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    createAdjustmentRequest(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/adjustment-requests", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    approveMovementRequest(requestId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/adjustment-requests/${encodeURIComponent(requestId)}/approve`, {
                method: "POST",
            })
        );
    }

    listReservations(): Observable<ReservationRecord[]> {
        return from(this.request<{ items: ReservationRecord[] }>("/api/v1/inventory/reservations", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    createReservation(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/reservations", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    releaseReservation(id: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/reservations/${encodeURIComponent(id)}/release`, { method: "POST" })
        );
    }

    extendReservation(id: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/reservations/${encodeURIComponent(id)}/extend`, { method: "POST" })
        );
    }

    consumeReservation(id: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/reservations/${encodeURIComponent(id)}/consume`, { method: "POST" })
        );
    }

    refreshExpiredReservations(): Observable<{ expired: number }> {
        return from(
            this.request<{ expired: number }>("/api/v1/inventory/reservations/refresh-expired", { method: "POST" })
        );
    }

    listReplenishmentItems(): Observable<ReplenishmentItem[]> {
        return from(this.request<{ items: ReplenishmentItem[] }>("/api/v1/inventory/replenishment", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    registerReplenishmentAttempt(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/replenishment/attempt", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    markReplenishmentObsolete(reference: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/replenishment/${encodeURIComponent(reference)}/mark-obsolete`, { method: "POST" })
        );
    }

    rebuildReplenishmentItems(): Observable<{ changed: number }> {
        return from(
            this.request<{ changed: number }>("/api/v1/inventory/replenishment/rebuild", { method: "POST" })
        );
    }

    listPurchaseLines(): Observable<PurchaseLine[]> {
        return from(this.request<{ items: PurchaseLine[] }>("/api/v1/inventory/purchase-lines", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    createPurchaseLine(payload: {
        reference: string;
        component: string;
        type: string;
        brand: string;
        description: string;
        supplier: string;
        quantity: number;
        unitPrice: number;
        neededBy: string;
        requestReason: string;
        projectId: string;
        equipmentTag: string;
    }): Observable<{ item: PurchaseLine; result: OperationResultResponse }> {
        return from(
            this.request<{ item: PurchaseLine; result: OperationResultResponse }>("/api/v1/inventory/purchase-lines", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    generatePurchaseLines(): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/purchase-lines/generate", { method: "POST" })
        );
    }

    markPurchaseLineSent(lineId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/send`, { method: "POST" })
        );
    }

    updatePurchaseLine(
        lineId: string,
        payload: { reference?: string; brand?: string; unitPrice?: number; quantity?: number }
    ): Observable<{ item: PurchaseLine; result: OperationResultResponse }> {
        return from(
            this.request<{ item: PurchaseLine; result: OperationResultResponse }>(
                `/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}`,
                { method: "PATCH", body: JSON.stringify(payload) }
            )
        );
    }

    closePurchaseLine(lineId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/close`, { method: "POST" })
        );
    }

    listWeeklySnapshots(): Observable<WeeklyShortageSnapshot[]> {
        return from(this.request<{ items: WeeklyShortageSnapshot[] }>("/api/v1/inventory/weekly-snapshots", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    generateWeeklySnapshot(): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/weekly-snapshots/generate", { method: "POST" })
        );
    }

    listBagTraces(): Observable<TechnicianBagTrace[]> {
        return from(this.request<{ items: TechnicianBagTrace[] }>("/api/v1/inventory/bags", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    receiveTechnicianBag(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/bags/receive", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    releaseTechnicianBag(bagId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/bags/${encodeURIComponent(bagId)}/release`, { method: "POST" })
        );
    }

    listSessions(): Observable<CountSession[]> {
        return from(this.request<{ items: CountSession[] }>("/api/v1/inventory/sessions", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    createSession(payload: Record<string, unknown>): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>("/api/v1/inventory/sessions", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    openSession(sessionId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/sessions/${encodeURIComponent(sessionId)}/open`, { method: "POST" })
        );
    }

    closeSession(sessionId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/sessions/${encodeURIComponent(sessionId)}/close`, { method: "POST" })
        );
    }

    listDiscrepancies(): Observable<DiscrepancyRecord[]> {
        return from(this.request<{ items: DiscrepancyRecord[] }>("/api/v1/inventory/discrepancies", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    approveDiscrepancy(discrepancyId: string): Observable<OperationResultResponse> {
        return from(
            this.request<OperationResultResponse>(`/api/v1/inventory/discrepancies/${encodeURIComponent(discrepancyId)}/approve`, { method: "POST" })
        );
    }

    listAuditTrail(): Observable<AuditEvent[]> {
        return from(this.request<{ items: AuditEvent[] }>("/api/v1/inventory/audit", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    // ─── PURCHASE REQUESTS (Gap 5) ───────────────────────────────────────────

    listPurchaseRequests(projectId?: string): Observable<PurchaseRequestRecord[]> {
        let path = "/api/v1/inventory/purchase-requests";
        if (projectId) path += `?projectId=${encodeURIComponent(projectId)}`;
        return from(this.request<{ items: PurchaseRequestRecord[] }>(path, { method: "GET" })).pipe(map((r) => r.items ?? []));
    }

    createPurchaseRequest(payload: Record<string, unknown>): Observable<any> {
        return from(this.request<any>("/api/v1/inventory/purchase-requests", { method: "POST", body: JSON.stringify(payload) }));
    }

    reviewPurchaseRequest(id: string, payload: { action: string; reviewNotes: string }): Observable<OperationResultResponse> {
        return from(this.request<OperationResultResponse>(`/api/v1/inventory/purchase-requests/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify(payload) }));
    }

    // ─── CONSOLIDATION (Gap 3) ───────────────────────────────────────────────

    consolidatePurchaseLines(): Observable<any[]> {
        return from(this.request<{ items: any[] }>("/api/v1/inventory/purchase-lines/consolidate", { method: "GET" })).pipe(map((r) => r.items ?? []));
    }

    // ─── APPROVAL (Gap 2) ────────────────────────────────────────────────────

    approvePurchaseLine(lineId: string): Observable<OperationResultResponse> {
        return from(this.request<OperationResultResponse>(`/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/approve`, { method: "POST" }));
    }

    rejectPurchaseLine(lineId: string): Observable<OperationResultResponse> {
        return from(this.request<OperationResultResponse>(`/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/reject`, { method: "POST" }));
    }

    receivePurchaseLine(lineId: string, quantity: number): Observable<OperationResultResponse> {
        return from(this.request<OperationResultResponse>(`/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/receive`, { method: "POST", body: JSON.stringify({ quantity }) }));
    }

    // ─── LINK TO ORDER (Gap 1) ───────────────────────────────────────────────

    linkPurchaseLineToOrder(lineId: string, orderId: number): Observable<OperationResultResponse> {
        return from(this.request<OperationResultResponse>(`/api/v1/inventory/purchase-lines/${encodeURIComponent(lineId)}/link-order`, { method: "POST", body: JSON.stringify({ orderId }) }));
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

            const response = await fetch(this.apiUrl(path), {
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
