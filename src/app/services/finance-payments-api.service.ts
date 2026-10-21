import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type FinancePaymentStatus = "Completado" | "Parcial" | "Pendiente";
export type FinancePaymentCurrencyCode = "COP" | "USD" | "EUR";

export interface FinancePaymentRecord {
    id: number;
    orderNumber: number;
    code: string;
    project: string;
    invoiceNumber: string;
    client: string;
    purchaseOrder: string;
    amount: number;
    paidAt: string;
    paymentGateway: string;
    status: FinancePaymentStatus;
    currencyCode: FinancePaymentCurrencyCode;
    exchangeRate: number;
    transactionId: string;
    bankAccountId: number | null;
    bankAccountName: string;
    receiptFileName: string;
    notes: string;
    reteFuente: number;
    reteIva: number;
    reteIca: number;
    retentionComments: string;
    paymentDate: string;
    createdAt?: string;
    updatedAt?: string;
}

export type UpsertFinancePaymentRequest = Omit<FinancePaymentRecord, "id" | "createdAt" | "updatedAt">;

@Injectable({ providedIn: "root" })
export class FinancePaymentsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listPayments(status = ""): Observable<FinancePaymentRecord[]> {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return from(this.request<{ items: FinancePaymentRecord[] }>(`/api/v1/finance/payments${query}`, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    getPayment(id: number): Observable<FinancePaymentRecord> {
        return from(this.request<FinancePaymentRecord>(`/api/v1/finance/payments/${encodeURIComponent(String(id))}`, { method: "GET" }));
    }

    createPayment(payload: UpsertFinancePaymentRequest): Observable<FinancePaymentRecord> {
        return from(this.request<FinancePaymentRecord>("/api/v1/finance/payments", { method: "POST", body: JSON.stringify(payload) }));
    }

    updatePayment(id: number, payload: UpsertFinancePaymentRequest): Observable<FinancePaymentRecord> {
        return from(this.request<FinancePaymentRecord>(`/api/v1/finance/payments/${encodeURIComponent(String(id))}`, { method: "PUT", body: JSON.stringify(payload) }));
    }

    deletePayment(id: number): Observable<void> {
        return from(this.request<Record<string, never>>(`/api/v1/finance/payments/${encodeURIComponent(String(id))}`, { method: "DELETE" })).pipe(
            map(() => void 0),
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
