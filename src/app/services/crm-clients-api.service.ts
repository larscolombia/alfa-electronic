import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type ClientStatus = "Activo" | "Inactivo";

export interface ClientCreditProfile {
    enabled: boolean;
    creditLimit: number;
    consumed: number;
    lastPaymentDate: string;
    paymentTermDays: number;
}

export interface CrmBranchRecord {
    id?: string;
    name: string;
    contactName: string;
    contactRole: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    isPrimary: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CrmClientRecord {
    id: string;
    nombre: string;
    correo: string;
    empresa: string;
    nit: string;
    zona: string;
    estado: ClientStatus;
    website: string;
    officePhone: string;
    country: string;
    city: string;
    address: string;
    /**
     * Fase 5b: datos fiscales para facturación electrónica. Opcionales en el
     * payload: el backend aplica defaults (idType vacío → 'NIT', resto vacío)
     * y así los consumidores que no gestionan la ficha fiscal siguen compilando.
     */
    dv?: string;
    postalCode?: string;
    billingEmail?: string;
    grandContributor?: boolean;
    idType?: string;
    creado: string;
    credito: ClientCreditProfile;
    branches?: CrmBranchRecord[];
}

export type UpsertCrmClientRequest = Omit<CrmClientRecord, "id" | "creado">;

export interface ClientContactRecord {
    id: string;
    clientId: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertClientContactRequest {
    name: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
}

export interface BulkCreateClientsError {
    row: number;
    message: string;
}

export interface BulkCreateClientsResponse {
    created: number;
    errors: BulkCreateClientsError[];
}

@Injectable({
    providedIn: "root",
})
export class CrmClientsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listClients(query: { search?: string; status?: ClientStatus; limit?: number } = {}): Observable<CrmClientRecord[]> {
        const searchParams = new URLSearchParams();

        if (query.search) {
            searchParams.set("search", query.search.trim());
        }
        if (query.status) {
            searchParams.set("status", query.status);
        }
        if (typeof query.limit === "number" && query.limit > 0) {
            searchParams.set("limit", String(Math.trunc(query.limit)));
        }

        const suffix = searchParams.toString();
        const path = suffix ? `/api/v1/crm/clients?${suffix}` : "/api/v1/crm/clients";

        return from(this.request<{ items: CrmClientRecord[] }>(path, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    getClient(clientId: string): Observable<CrmClientRecord> {
        return from(this.request<CrmClientRecord>(`/api/v1/crm/clients/${encodeURIComponent(clientId)}`, { method: "GET" }));
    }

    createClient(payload: UpsertCrmClientRequest): Observable<CrmClientRecord> {
        return from(
            this.request<CrmClientRecord>("/api/v1/crm/clients", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    updateClient(clientId: string, payload: UpsertCrmClientRequest): Observable<CrmClientRecord> {
        return from(
            this.request<CrmClientRecord>(`/api/v1/crm/clients/${encodeURIComponent(clientId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    bulkCreateClients(rows: UpsertCrmClientRequest[]): Promise<BulkCreateClientsResponse> {
        return this.request<BulkCreateClientsResponse>("/api/v1/crm/clients/bulk", {
            method: "POST",
            body: JSON.stringify({ clients: rows }),
        });
    }

    deleteClient(clientId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/crm/clients/${encodeURIComponent(clientId)}`, {
                method: "DELETE",
            }),
        ).pipe(map(() => void 0));
    }

    listClientContacts(clientId: string): Observable<ClientContactRecord[]> {
        return from(
            this.request<{ items: ClientContactRecord[] }>(
                `/api/v1/crm/clients/${encodeURIComponent(clientId)}/contacts`,
                { method: "GET" },
            ),
        ).pipe(map((response) => response.items ?? []));
    }

    createClientContact(clientId: string, payload: UpsertClientContactRequest): Observable<ClientContactRecord> {
        return from(
            this.request<ClientContactRecord>(`/api/v1/crm/clients/${encodeURIComponent(clientId)}/contacts`, {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    updateClientContact(clientId: string, contactId: string, payload: UpsertClientContactRequest): Observable<ClientContactRecord> {
        return from(
            this.request<ClientContactRecord>(
                `/api/v1/crm/clients/${encodeURIComponent(clientId)}/contacts/${encodeURIComponent(contactId)}`,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                },
            ),
        );
    }

    deleteClientContact(clientId: string, contactId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(
                `/api/v1/crm/clients/${encodeURIComponent(clientId)}/contacts/${encodeURIComponent(contactId)}`,
                { method: "DELETE" },
            ),
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
