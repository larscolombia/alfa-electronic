import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import { CrmBranchRecord } from "./crm-clients-api.service";

/** Resultado de convertir un prospecto en cliente.
 *  `created=false` significa que ya existía el cliente para esa empresa y el
 *  prospecto quedó vinculado sin duplicar (endpoint idempotente). */
export interface ProspectConversionResult {
    client: unknown;
    created: boolean;
}

export type CrmProspectStatus = "Pendiente" | "En proceso" | "Cerrado";

export interface CrmProspectContact {
    id: string;
    prospectId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export interface CrmProspectRecord {
    id: string;
    backendId: string;
    nombre: string;
    correo: string;
    movil: string;
    nit: string;
    zona: string;
    valor: number;
    allowFollowUp: boolean;
    creado: string;
    creadoAt: string;
    cotizaciones: number;
    empleado: string;
    estado: CrmProspectStatus;
    servicio: string;
    compania: string;
    sitioWeb: string;
    telefonoOficina: string;
    pais: string;
    ciudad: string;
    direccion: string;
    fuente: string;
    ciiuCode: string;
    nota: string;
    branches: CrmBranchRecord[];
}

export interface CrmUpsertBranchPayload {
    name: string;
    contactName: string;
    contactRole: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    isPrimary: boolean;
}

export interface CrmUpsertProspectPayload {
    name: string;
    email: string;
    mobile: string;
    company: string;
    nit: string;
    assignedEmployee: string;
    source: string;
    ciiuCode: string;
    zone: string;
    prospectValue: number;
    allowFollowUp: boolean;
    status: string;
    service: string;
    note: string;
    website?: string;
    officePhone?: string;
    country?: string;
    city?: string;
    address?: string;
    quotations?: number;
    branches?: CrmUpsertBranchPayload[];
}

export interface CrmCatalogsResponse {
    employees: string[];
    sources: string[];
    services: string[];
    zones: string[];
}

type CrmCatalogsApiResponse = {
    employees?: Array<{ id: string; name: string }>;
    sources?: Array<{ id: string; name: string }>;
    services?: Array<{ id: string; name: string }>;
    zones?: Array<{ id: string; name: string }>;
};

type CrmProspectApiRecord = {
    id: string;
    name: string;
    email: string;
    mobile: string;
    nit: string;
    zone: string;
    prospectValue: number;
    allowFollowUp: boolean;
    quotations: number;
    assignedEmployee: string;
    status: CrmProspectStatus;
    service: string;
    company: string;
    website: string;
    officePhone: string;
    country: string;
    city: string;
    address: string;
    source: string;
    ciiuCode: string;
    note: string;
    createdAt: string;
    branches?: CrmBranchRecord[];
};

@Injectable({
    providedIn: "root",
})
export class CrmProspectsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listProspects(): Observable<CrmProspectRecord[]> {
        return from(this.request<{ items: CrmProspectApiRecord[] }>("/api/v1/crm/prospects", { method: "GET" })).pipe(
            map((response) => {
                const items = response.items ?? [];
                return items.map((item) => this.mapProspect(item));
            })
        );
    }

    catalogs(): Observable<CrmCatalogsResponse> {
        return from(this.request<CrmCatalogsApiResponse>("/api/v1/crm/catalogs", { method: "GET" })).pipe(
            map((response) => ({
                employees: (response.employees ?? []).map((item) => item.name),
                sources: (response.sources ?? []).map((item) => item.name),
                services: (response.services ?? []).map((item) => item.name),
                zones: (response.zones ?? []).map((item) => item.name),
            }))
        );
    }

    addCatalogItem(catalogType: "employees" | "sources" | "services", name: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/crm/catalogs/${encodeURIComponent(catalogType)}`, {
                method: "POST",
                body: JSON.stringify({ name }),
            })
        ).pipe(map(() => void 0));
    }

    createProspect(payload: CrmUpsertProspectPayload): Observable<CrmProspectRecord> {
        return from(
            this.request<CrmProspectApiRecord>("/api/v1/crm/prospects", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        ).pipe(map((item) => this.mapProspect(item)));
    }

    updateProspect(prospectId: string, payload: CrmUpsertProspectPayload): Observable<CrmProspectRecord> {
        return from(
            this.request<CrmProspectApiRecord>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            })
        ).pipe(map((item) => this.mapProspect(item)));
    }

    deleteProspect(prospectId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}`, {
                method: "DELETE",
            })
        ).pipe(map(() => void 0));
    }

    convertToClient(prospectId: string): Observable<ProspectConversionResult> {
        return from(this.request<{ client: unknown; created: boolean }>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/convert-to-client`, {
            method: "POST",
        })).pipe(map((response) => ({ client: response.client ?? null, created: Boolean(response.created) })));
    }

    updateProspectNote(prospectId: string, note: string): Observable<string> {
        return from(
            this.request<{ note: string }>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/note`, {
                method: "PUT",
                body: JSON.stringify({ note }),
            })
        ).pipe(map((response) => String(response.note ?? "")));
    }

    listProspectContacts(prospectId: string): Observable<CrmProspectContact[]> {
        return from(
            this.request<{ items: CrmProspectContact[] }>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/contacts`, { method: "GET" })
        ).pipe(map((r) => r.items ?? []));
    }

    createProspectContact(prospectId: string, payload: { name: string; email: string; phone: string; role: string; notes: string }): Observable<CrmProspectContact> {
        return from(
            this.request<CrmProspectContact>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/contacts`, {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    updateProspectContact(prospectId: string, contactId: string, payload: { name: string; email: string; phone: string; role: string; notes: string }): Observable<CrmProspectContact> {
        return from(
            this.request<CrmProspectContact>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/contacts/${encodeURIComponent(contactId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            })
        );
    }

    deleteProspectContact(prospectId: string, contactId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/contacts/${encodeURIComponent(contactId)}`, {
                method: "DELETE",
            })
        ).pipe(map(() => void 0));
    }

    private mapProspect(item: CrmProspectApiRecord): CrmProspectRecord {
        // Identidad real = uuid del backend. Antes se usaba (index + 1), un id
        // sintético por posición que colisionaba entre recargas y ocultaba filas.
        const backendId = String(item.id ?? "").trim();

        return {
            id: backendId,
            backendId,
            nombre: String(item.name ?? "").trim(),
            correo: String(item.email ?? "").trim(),
            movil: String(item.mobile ?? "").trim(),
            nit: String(item.nit ?? "").trim(),
            zona: String(item.zone ?? "").trim(),
            valor: Number(item.prospectValue ?? 0),
            allowFollowUp: Boolean(item.allowFollowUp),
            creado: this.toDateLabel(item.createdAt),
            creadoAt: String(item.createdAt ?? "").trim(),
            cotizaciones: Number(item.quotations ?? 0),
            empleado: String(item.assignedEmployee ?? "").trim(),
            estado: this.normalizeStatus(item.status),
            servicio: String(item.service ?? "").trim() || "--",
            compania: String(item.company ?? "").trim(),
            sitioWeb: String(item.website ?? "").trim() || "--",
            telefonoOficina: String(item.officePhone ?? "").trim() || "--",
            pais: String(item.country ?? "").trim() || "--",
            ciudad: String(item.city ?? "").trim() || "--",
            direccion: String(item.address ?? "").trim() || "--",
            fuente: String(item.source ?? "").trim() || "--",
            ciiuCode: String(item.ciiuCode ?? "").trim(),
            nota: String(item.note ?? "").trim(),
            branches: this.mapBranches(item.branches),
        };
    }

    private mapBranches(branches: CrmBranchRecord[] | undefined): CrmBranchRecord[] {
        if (!Array.isArray(branches)) {
            return [];
        }

        return branches.map((branch) => ({
            id: String(branch.id ?? "").trim() || undefined,
            name: String(branch.name ?? "").trim(),
            contactName: String(branch.contactName ?? "").trim(),
            contactRole: String(branch.contactRole ?? "").trim(),
            email: String(branch.email ?? "").trim(),
            phone: String(branch.phone ?? "").trim(),
            country: String(branch.country ?? "").trim(),
            city: String(branch.city ?? "").trim(),
            address: String(branch.address ?? "").trim(),
            isPrimary: Boolean(branch.isPrimary),
            createdAt: String(branch.createdAt ?? "").trim() || undefined,
            updatedAt: String(branch.updatedAt ?? "").trim() || undefined,
        }));
    }

    private normalizeStatus(value: string): CrmProspectStatus {
        const normalized = String(value ?? "").trim();
        if (normalized === "En proceso" || normalized === "Cerrado") {
            return normalized;
        }
        return "Pendiente";
    }

    private toDateLabel(value: string): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    private apiURL(path: string): string {
        return `${this.apiBaseUrl}${path}`;
    }

    listClientRelatedProspects(clientId: string) {
        return from(this.request<{ items: Array<{ id: string; nombre: string; compania: string }> }>(
            `/api/v1/crm/clients/${encodeURIComponent(clientId)}/related-prospects`,
            { method: "GET" },
        )).pipe(map((response) => response.items ?? []));
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
