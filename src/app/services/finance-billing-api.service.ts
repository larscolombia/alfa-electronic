import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export interface FinanceInvoiceItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitLabel: string;
    unitPrice: number;
    taxRate: number;
    attachmentName: string;
}

export interface FinanceInvoiceRecord {
    id: number;
    referenceCode: string;
    seriesPrefix: string;
    sequenceNumber: number;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    billingAddress: string;
    shippingAddress: string;
    issueDate: string;
    dueDate: string;
    currencyCode: "COP" | "USD" | "EUR";
    exchangeRate: number;
    bankAccountId: number | null;
    bankAccountName: string;
    taxCalculation: string;
    generatedBy: string;
    items: FinanceInvoiceItem[];
    discountValue: number;
    discountMode: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    paidAmount: number;
    balanceAmount: number;
    status: "Borrador" | "Pendiente" | "Pago parcial" | "Pagado" | "Cancelado" | "Enviado";
    note: string;
    terms: string;
    attachmentName: string;
    receivedPayment: boolean;
    source: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface FinanceRecurringInvoiceRecord {
    id: number;
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    currencyCode: "COP" | "USD" | "EUR";
    taxCalculation: string;
    bankAccountId: number | null;
    bankAccountName: string;
    frequency: string;
    startDate: string;
    nextIssueDate: string;
    cycles: number;
    allowClientStop: boolean;
    showShippingAddress: boolean;
    generatedBy: string;
    items: FinanceInvoiceItem[];
    discountValue: number;
    discountMode: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    status: "Activa" | "Pausada" | "Finalizada";
    note: string;
    terms: string;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({ providedIn: "root" })
export class FinanceBillingApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listInvoices(status = ""): Observable<FinanceInvoiceRecord[]> {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return from(this.request<{ items: FinanceInvoiceRecord[] }>(`/api/v1/finance/invoices${query}`, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    getInvoice(id: number): Observable<FinanceInvoiceRecord> {
        return from(this.request<FinanceInvoiceRecord>(`/api/v1/finance/invoices/${encodeURIComponent(String(id))}`, { method: "GET" }));
    }

    createInvoice(payload: FinanceInvoiceRecord): Observable<FinanceInvoiceRecord> {
        return from(this.request<FinanceInvoiceRecord>("/api/v1/finance/invoices", { method: "POST", body: JSON.stringify(payload) }));
    }

    updateInvoice(id: number, payload: FinanceInvoiceRecord): Observable<FinanceInvoiceRecord> {
        return from(this.request<FinanceInvoiceRecord>(`/api/v1/finance/invoices/${encodeURIComponent(String(id))}`, { method: "PUT", body: JSON.stringify(payload) }));
    }

    deleteInvoice(id: number): Observable<void> {
        return from(this.request<Record<string, never>>(`/api/v1/finance/invoices/${encodeURIComponent(String(id))}`, { method: "DELETE" })).pipe(map(() => void 0));
    }

    listRecurringInvoices(status = ""): Observable<FinanceRecurringInvoiceRecord[]> {
        const query = status ? `?status=${encodeURIComponent(status)}` : "";
        return from(this.request<{ items: FinanceRecurringInvoiceRecord[] }>(`/api/v1/finance/recurring-invoices${query}`, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    createRecurringInvoice(payload: FinanceRecurringInvoiceRecord): Observable<FinanceRecurringInvoiceRecord> {
        return from(
            this.request<FinanceRecurringInvoiceRecord>("/api/v1/finance/recurring-invoices", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    updateRecurringInvoice(id: number, payload: FinanceRecurringInvoiceRecord): Observable<FinanceRecurringInvoiceRecord> {
        return from(
            this.request<FinanceRecurringInvoiceRecord>(`/api/v1/finance/recurring-invoices/${encodeURIComponent(String(id))}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteRecurringInvoice(id: number): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/finance/recurring-invoices/${encodeURIComponent(String(id))}`, {
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
                // Keep fallback
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
