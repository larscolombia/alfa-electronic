import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { NgZone } from "@angular/core";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import { SupplierDraft, SupplierRecord } from "./suppliers-catalog.service";

export interface SupplierOrderItem {
    id?: number;
    orderId?: number;
    type: string;
    description: string;
    partNumber: string;
    targetBoard: string;
    quantity: number;
    unit: string;
    unitCost: number;
    notes: string;
}

export interface OrderTrace {
    id?: number;
    orderId?: number;
    timestamp: string;
    actor: string;
    action: string;
    status: string;
    notes: string;
}

export interface SupplierOrder {
    id: number;
    orderNumber: string;
    supplierId: number;
    requestedBy: string;
    equipment: string;
    purpose: string;
    quantity: number;
    requestDate: string;
    status: string;
    customerName: string;
    machineModel: string;
    boardReference: string;
    diagnosis: string;
    repairObjective: string;
    urgency: string;
    commercialNotes: string;
    items: SupplierOrderItem[];
    traces: OrderTrace[];
    createdAt: string;
    updatedAt: string;
}

export interface SupplierOrderRequest {
    orderNumber: string;
    supplierId: number;
    requestedBy: string;
    equipment: string;
    purpose: string;
    quantity: number;
    requestDate: string;
    status: string;
    customerName: string;
    machineModel: string;
    boardReference: string;
    diagnosis: string;
    repairObjective: string;
    urgency: string;
    commercialNotes: string;
    items: SupplierOrderItem[];
}

export interface OrderTraceRequest {
    action: string;
    status?: string;
    notes: string;
}

@Injectable({
    providedIn: "root",
})
export class SuppliersApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly zone = inject(NgZone);

    // ─── SUPPLIERS ───────────────────────────────────────────────────────────

    listSuppliers(): Observable<SupplierRecord[]> {
        return from(this.request<{ items: SupplierRecord[] }>("/api/v1/suppliers", { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    getSupplier(id: number): Observable<SupplierRecord> {
        return from(this.request<SupplierRecord>(`/api/v1/suppliers/${id}`, { method: "GET" }));
    }

    createSupplier(draft: SupplierDraft): Observable<SupplierRecord> {
        return from(
            this.request<SupplierRecord>("/api/v1/suppliers", {
                method: "POST",
                body: JSON.stringify(draft),
            })
        );
    }

    updateSupplier(id: number, draft: SupplierDraft): Observable<SupplierRecord> {
        return from(
            this.request<SupplierRecord>(`/api/v1/suppliers/${id}`, {
                method: "PUT",
                body: JSON.stringify(draft),
            })
        );
    }

    deleteSupplier(id: number): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/suppliers/${id}`, { method: "DELETE" })
        ).pipe(map(() => void 0));
    }

    // ─── ORDERS ──────────────────────────────────────────────────────────────

    listOrders(supplierId?: number): Observable<SupplierOrder[]> {
        let path = "/api/v1/suppliers/orders";
        if (supplierId) {
            path += `?supplierId=${supplierId}`;
        }
        return from(this.request<{ items: SupplierOrder[] }>(path, { method: "GET" }))
            .pipe(map((r) => r.items ?? []));
    }

    getOrder(id: number): Observable<SupplierOrder> {
        return from(this.request<SupplierOrder>(`/api/v1/suppliers/orders/${id}`, { method: "GET" }));
    }

    createOrder(req: SupplierOrderRequest): Observable<SupplierOrder> {
        return from(
            this.request<SupplierOrder>("/api/v1/suppliers/orders", {
                method: "POST",
                body: JSON.stringify(req),
            })
        );
    }

    updateOrder(id: number, req: SupplierOrderRequest): Observable<SupplierOrder> {
        return from(
            this.request<SupplierOrder>(`/api/v1/suppliers/orders/${id}`, {
                method: "PUT",
                body: JSON.stringify(req),
            })
        );
    }

    deleteOrder(id: number): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/suppliers/orders/${id}`, { method: "DELETE" })
        ).pipe(map(() => void 0));
    }

    addOrderTrace(id: number, req: OrderTraceRequest): Observable<OrderTrace> {
        return from(
            this.request<OrderTrace>(`/api/v1/suppliers/orders/${id}/trace`, {
                method: "POST",
                body: JSON.stringify(req),
            })
        );
    }

    // ─── HTTP HELPER ─────────────────────────────────────────────────────────

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
                    // Keep fallback message
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
