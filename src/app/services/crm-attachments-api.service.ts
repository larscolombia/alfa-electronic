import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export interface ProspectAttachment {
    id: string;
    prospectId: string;
    filename: string;
    mimeType: string;
    fileSizeBytes: number;
    storageUrl: string;
    uploadedBy: string;
    createdAt: string;
}

export interface CreateProspectAttachmentPayload {
    filename: string;
    mimeType: string;
    fileSizeBytes: number;
    storageUrl: string;
    uploadedBy: string;
}

@Injectable({ providedIn: "root" })
export class CrmAttachmentsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listAttachments(prospectId: string): Observable<ProspectAttachment[]> {
        return from(
            this.request<{ items: ProspectAttachment[] }>(
                `/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/attachments`,
                { method: "GET" },
            ),
        ).pipe(map((r) => r.items ?? []));
    }

    createAttachment(prospectId: string, payload: CreateProspectAttachmentPayload): Observable<ProspectAttachment> {
        return from(
            this.request<ProspectAttachment>(
                `/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/attachments`,
                { method: "POST", body: JSON.stringify(payload) },
            ),
        );
    }

    deleteAttachment(prospectId: string, attachmentId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(
                `/api/v1/crm/prospects/${encodeURIComponent(prospectId)}/attachments/${encodeURIComponent(attachmentId)}`,
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
        const token = this.authService.getAccessToken();
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        const response = await fetch(this.apiURL(path), { ...init, headers });
        if (response.status === 401) {
            this.authService.markUnauthorized();
        }
        if (!response.ok) {
            let msg = `Request failed with status ${response.status}`;
            try {
                const body = (await response.json()) as { error?: string };
                if (body?.error) msg = body.error;
            } catch {
                // keep default
            }
            throw new Error(msg);
        }
        if (response.status === 204) return {} as T;
        return (await response.json()) as T;
    }
}
