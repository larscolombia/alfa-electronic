import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type FinanceAccountType = "Banco" | "Efectivo";
export type FinanceAccountProductType = "Ahorros" | "Corriente" | "Caja menor";
export type FinanceAccountStatus = "Activa" | "Inactiva";

export interface FinanceAccountRecord {
    id: number;
    accountType: FinanceAccountType;
    bankName: string;
    holderName: string;
    accountNumber: string;
    productType: FinanceAccountProductType;
    currencyCode: "COP" | "USD" | "EUR";
    contactNumber: string;
    initialBalance: number;
    status: FinanceAccountStatus;
    logoFileName: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpsertFinanceAccountRequest {
    accountType: FinanceAccountType;
    bankName: string;
    holderName: string;
    accountNumber: string;
    productType: FinanceAccountProductType;
    currencyCode: "COP" | "USD" | "EUR";
    contactNumber: string;
    initialBalance: number;
    status: FinanceAccountStatus;
    logoFileName: string;
}

@Injectable({
    providedIn: "root",
})
export class FinanceAccountsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listAccounts(): Observable<FinanceAccountRecord[]> {
        return from(this.request<{ items: FinanceAccountRecord[] }>("/api/v1/finance/accounts", { method: "GET" })).pipe(
            map((response) => response.items ?? [])
        );
    }

    createAccount(payload: UpsertFinanceAccountRequest): Observable<FinanceAccountRecord> {
        return from(
            this.request<FinanceAccountRecord>("/api/v1/finance/accounts", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    updateAccount(accountId: number, payload: UpsertFinanceAccountRequest): Observable<FinanceAccountRecord> {
        return from(
            this.request<FinanceAccountRecord>(`/api/v1/finance/accounts/${encodeURIComponent(String(accountId))}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            })
        );
    }

    deleteAccount(accountId: number): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/finance/accounts/${encodeURIComponent(String(accountId))}`, {
                method: "DELETE",
            })
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
                // Keep fallback message when backend returns non-JSON error.
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
