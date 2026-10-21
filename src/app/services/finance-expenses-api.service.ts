import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type FinanceExpenseCurrencyCode = "COP" | "USD" | "EUR";

export interface FinanceExpenseRecord {
    id: number;
    accountId: number | null;
    accountName: string;
    itemName: string;
    concept: string;
    category: string;
    description: string;
    employee: string;
    project: string;
    vendor: string;
    amount: number;
    currencyCode: FinanceExpenseCurrencyCode;
    exchangeRate: number;
    valueInCop: number;
    paidAt: string;
    receiptFileName: string;
    createdBy: string;
    createdAt?: string;
}

export interface UpsertFinanceExpenseRequest {
    accountId: number | null;
    itemName: string;
    concept: string;
    category: string;
    description: string;
    employee: string;
    project: string;
    vendor: string;
    amount: number;
    currencyCode: FinanceExpenseCurrencyCode;
    exchangeRate: number;
    paidAt: string;
    receiptFileName: string;
}

export interface FinanceCashCountRecord {
    id: number;
    accountId: number | null;
    kind: "billete" | "moneda";
    denomination: number;
    quantity: number;
    total: number;
    countedAt: string;
    countedBy: string;
}

export interface FinanceCashCountEntry {
    kind: "billete" | "moneda";
    denomination: number;
    quantity: number;
}

export interface FinanceCashCountResult {
    items: FinanceCashCountRecord[];
    countedAt: string;
}

@Injectable({ providedIn: "root" })
export class FinanceExpensesApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listExpenses(): Observable<FinanceExpenseRecord[]> {
        return from(this.request<{ items: FinanceExpenseRecord[] }>("/api/v1/finance/expenses", { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    createExpense(payload: UpsertFinanceExpenseRequest): Observable<FinanceExpenseRecord> {
        return from(this.request<FinanceExpenseRecord>("/api/v1/finance/expenses", { method: "POST", body: JSON.stringify(payload) }));
    }

    updateExpense(expenseId: number, payload: UpsertFinanceExpenseRequest): Observable<FinanceExpenseRecord> {
        return from(
            this.request<FinanceExpenseRecord>(`/api/v1/finance/expenses/${encodeURIComponent(String(expenseId))}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteExpense(expenseId: number): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/finance/expenses/${encodeURIComponent(String(expenseId))}`, { method: "DELETE" }),
        ).pipe(map(() => void 0));
    }

    getCashCounts(): Observable<FinanceCashCountResult> {
        return from(this.request<FinanceCashCountResult>("/api/v1/finance/cash-counts", { method: "GET" }));
    }

    saveCashCounts(accountId: number | null, entries: FinanceCashCountEntry[]): Observable<FinanceCashCountResult> {
        return from(
            this.request<FinanceCashCountResult>("/api/v1/finance/cash-counts", {
                method: "POST",
                body: JSON.stringify({ accountId, entries }),
            }),
        );
    }

    /** Descarga el CSV de gastos para la contadora con el token de sesión. */
    async downloadExpensesCsv(): Promise<void> {
        await this.download("/api/v1/finance/expenses/export.csv", "caja-menor-gastos.csv");
    }

    private async download(path: string, fileName: string): Promise<void> {
        const response = await fetch(`${this.apiBaseUrl}${path}`, { headers: this.buildHeaders() });
        if (response.status === 401) {
            this.authService.markUnauthorized();
        }
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        const blob = await response.blob();
        const fileUrl = window.URL.createObjectURL(blob);
        const anchor = window.document.createElement("a");
        anchor.href = fileUrl;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(fileUrl);
    }

    private buildHeaders(): Headers {
        const headers = new Headers();
        headers.set("X-Company-Id", this.companyID);
        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }
        return headers;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = this.buildHeaders();
        headers.set("Content-Type", "application/json");

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
