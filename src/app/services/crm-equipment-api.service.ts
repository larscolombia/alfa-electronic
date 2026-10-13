import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import type { ProspectEquipmentItem, ProspectEquipmentRecord, ProspectEquipmentSummary } from "../pages/app/crm/crm-prospect-equipment.store";

export interface ListEquipmentRecordsQuery {
    prospectId?: string | number;
    clientNit?: string;
    clientName?: string;
    includeArchived?: boolean;
    identifier?: string;
}

export interface ListEquipmentItemsQuery {
    prospectId?: string | number;
    clientNit?: string;
    clientName?: string;
    includeArchived?: boolean;
    identifier?: string;
}

export interface EquipmentInsightQuery {
    reference?: string;
    identifier?: string;
    includeArchived?: boolean;
}

export interface EquipmentInsightFailure {
    label: string;
    count: number;
    percentage: number;
    evidence: string;
}

export interface EquipmentInsightResponse {
    source: string;
    model: string;
    reference: string;
    identifier: string;
    analyzedCases: number;
    presumedFailure: string;
    summary: string;
    recurrentFailures: EquipmentInsightFailure[];
    fallback: boolean;
    generatedAt: string;
}

export interface EquipmentTechnicianOption {
    id: string;
    name: string;
    role: string;
    department: string;
    activeItems: number;
}

@Injectable({
    providedIn: "root",
})
export class CrmEquipmentApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly apiBaseStorageKey = "pika.apiBaseUrl";
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listRecords(query: ListEquipmentRecordsQuery = {}): Observable<ProspectEquipmentRecord[]> {
        const suffix = this.buildQueryString(query);
        const path = suffix ? `/api/v1/crm-equipment/records?${suffix}` : "/api/v1/crm-equipment/records";

        return from(this.request<{ items: ProspectEquipmentRecord[] }>(path, { method: "GET" })).pipe(
            map((response) => response.items ?? [])
        );
    }

    getRecord(recordId: string, includeArchived = true): Observable<ProspectEquipmentRecord> {
        const querySuffix = includeArchived ? "?includeArchived=true" : "";
        return from(this.request<ProspectEquipmentRecord>(`/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}${querySuffix}`, { method: "GET" }));
    }

    upsertRecord(record: ProspectEquipmentRecord): Observable<ProspectEquipmentRecord> {
        return from(
            this.request<ProspectEquipmentRecord>(`/api/v1/crm-equipment/records/${encodeURIComponent(record.id)}`, {
                method: "PUT",
                body: JSON.stringify(record),
            })
        );
    }

    finalizeRecord(recordId: string): Observable<ProspectEquipmentRecord> {
        return from(
            this.request<ProspectEquipmentRecord>(`/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/finalize`, {
                method: "POST",
                body: JSON.stringify({}),
            }),
        );
    }

    archiveRecord(recordId: string): Observable<ProspectEquipmentRecord> {
        return from(
            this.request<ProspectEquipmentRecord>(`/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/archive`, {
                method: "PATCH",
                body: JSON.stringify({ archived: true }),
            })
        );
    }

    restoreRecord(recordId: string): Observable<ProspectEquipmentRecord> {
        return from(
            this.request<ProspectEquipmentRecord>(`/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/restore`, {
                method: "POST",
                body: JSON.stringify({}),
            })
        );
    }

    listItems(query: ListEquipmentItemsQuery = {}): Observable<ProspectEquipmentSummary[]> {
        const suffix = this.buildQueryString(query);
        const path = suffix ? `/api/v1/crm-equipment/items?${suffix}` : "/api/v1/crm-equipment/items";

        return from(this.request<{ items: ProspectEquipmentSummary[] }>(path, { method: "GET" })).pipe(
            map((response) => response.items ?? [])
        );
    }

    listTechnicians(query: { speciality?: string } = {}): Observable<EquipmentTechnicianOption[]> {
        const searchParams = new URLSearchParams();
        const speciality = String(query.speciality ?? "").trim();
        if (speciality) {
            searchParams.set("speciality", speciality);
        }

        const suffix = searchParams.toString();
        const path = suffix ? `/api/v1/crm-equipment/technicians?${suffix}` : "/api/v1/crm-equipment/technicians";

        return from(this.request<{ items: EquipmentTechnicianOption[] }>(path, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    getInsight(query: EquipmentInsightQuery): Observable<EquipmentInsightResponse> {
        const suffix = this.buildInsightQueryString(query);
        const path = suffix ? `/api/v1/crm-equipment/insights?${suffix}` : "/api/v1/crm-equipment/insights";

        return from(this.request<EquipmentInsightResponse>(path, { method: "GET" }));
    }

    addItemAttachment(
        recordId: string,
        itemId: string,
        payload: {
            fileName: string;
            attachmentType?: string;
            mimeType: string;
            sizeBytes: number;
            dataUrl: string;
            notes?: string;
            uploadedBy?: string;
            sha256?: string;
        },
    ): Observable<ProspectEquipmentItem> {
        const path = `/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/items/${encodeURIComponent(itemId)}/attachments`;
        return from(
            this.request<ProspectEquipmentItem>(path, {
                method: "POST",
                body: JSON.stringify({
                    fileName: payload.fileName,
                    attachmentType: payload.attachmentType ?? "",
                    mimeType: payload.mimeType,
                    sizeBytes: payload.sizeBytes,
                    dataUrl: payload.dataUrl,
                    notes: payload.notes ?? "",
                    uploadedBy: payload.uploadedBy ?? "",
                    sha256: payload.sha256 ?? "",
                }),
            }),
        );
    }

    deleteItemAttachment(recordId: string, itemId: string, attachmentId: string): Observable<ProspectEquipmentItem> {
        const path = `/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/items/${encodeURIComponent(itemId)}/attachments/${encodeURIComponent(attachmentId)}`;
        return from(this.request<ProspectEquipmentItem>(path, { method: "DELETE" }));
    }

    assignItemTechnician(
        recordId: string,
        itemId: string,
        payload: {
            assignedToId: string;
            assignedTo?: string;
            assignedAt?: string;
            assignedBy?: string;
        },
    ): Observable<ProspectEquipmentItem> {
        const path = `/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/items/${encodeURIComponent(itemId)}/assignment`;
        return from(
            this.request<ProspectEquipmentItem>(path, {
                method: "PUT",
                body: JSON.stringify({
                    assignedToId: payload.assignedToId,
                    assignedTo: payload.assignedTo ?? "",
                    assignedAt: payload.assignedAt ?? "",
                    assignedBy: payload.assignedBy ?? "",
                }),
            }),
        );
    }

    private buildQueryString(query: { prospectId?: string | number; clientNit?: string; clientName?: string; includeArchived?: boolean; identifier?: string }): string {
        const searchParams = new URLSearchParams();

        const prospectId = String(query.prospectId ?? "").trim();
        if (prospectId && prospectId !== "0") {
            searchParams.set("prospectId", prospectId);
        }

        const clientNit = String(query.clientNit ?? "").trim();
        if (clientNit) {
            searchParams.set("clientNit", clientNit);
        }

        const clientName = String(query.clientName ?? "").trim();
        if (clientName) {
            searchParams.set("clientName", clientName);
        }

        if (query.includeArchived) {
            searchParams.set("includeArchived", "true");
        }

        const identifier = String(query.identifier ?? "").trim();
        if (identifier) {
            searchParams.set("identifier", identifier);
        }

        return searchParams.toString();
    }

    private buildInsightQueryString(query: EquipmentInsightQuery): string {
        const searchParams = new URLSearchParams();

        const reference = String(query.reference ?? "").trim();
        if (reference) {
            searchParams.set("reference", reference);
        }

        const identifier = String(query.identifier ?? "").trim();
        if (identifier) {
            searchParams.set("identifier", identifier);
        }

        if (query.includeArchived) {
            searchParams.set("includeArchived", "true");
        }

        return searchParams.toString();
    }

    private apiURL(path: string): string {
        let base = String(this.apiBaseUrl ?? "").replace(/\/+$/, "");
        const normalizedPath = this.normalizeRequestPath(path);

        if (normalizedPath.startsWith("/api/v1/")) {
            const apiV1Index = base.indexOf("/api/v1");
            if (apiV1Index >= 0) {
                base = base.slice(0, apiV1Index + "/api/v1".length);
            }
        } else if (normalizedPath.startsWith("/api/")) {
            const apiIndex = base.indexOf("/api");
            if (apiIndex >= 0) {
                base = base.slice(0, apiIndex + "/api".length);
            }
        }

        if (base.endsWith("/api/v1") && normalizedPath.startsWith("/api/v1/")) {
            return `${base}${normalizedPath.slice("/api/v1".length)}`;
        }

        if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
            return `${base}${normalizedPath.slice("/api".length)}`;
        }

        return `${base}${normalizedPath}`;
    }

    private normalizeRequestPath(path: string): string {
        const text = String(path ?? "").trim();
        return text.startsWith("/") ? text : `/${text}`;
    }

    private buildOriginFallbackURL(path: string, primaryUrl: string): string | null {
        if (typeof window === "undefined") {
            return null;
        }

        const normalizedPath = this.normalizeRequestPath(path);
        if (!normalizedPath.startsWith("/api/")) {
            return null;
        }

        const fallbackUrl = `${window.location.origin}${normalizedPath}`;
        return fallbackUrl === primaryUrl ? null : fallbackUrl;
    }

    private persistOriginApiBase(): void {
        if (typeof window === "undefined") {
            return;
        }

        try {
            window.localStorage.setItem(this.apiBaseStorageKey, window.location.origin);
        } catch {
            // Ignore localStorage restrictions.
        }
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", this.companyID);

        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const requestInit = {
            ...init,
            headers,
        };

        const primaryUrl = this.apiURL(path);
        let response = await fetch(primaryUrl, requestInit);

        if (response.status === 404) {
            const fallbackUrl = this.buildOriginFallbackURL(path, primaryUrl);
            if (fallbackUrl) {
                const fallbackResponse = await fetch(fallbackUrl, requestInit);
                response = fallbackResponse;

                if (fallbackResponse.ok || fallbackResponse.status === 401 || fallbackResponse.status === 403) {
                    this.persistOriginApiBase();
                }
            }
        }

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
