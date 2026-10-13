import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

/** Metadata de un soporte del expediente (sin el contenido base64). */
export interface EmployeeDocumentItem {
    id: string;
    employeeId: string;
    category: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    required: boolean;
    notes: string;
    uploadedAt: string;
}

/** Payload de descarga/previsualizacion con el contenido completo. */
export interface EmployeeDocumentDownload {
    fileName: string;
    mimeType: string;
    data: string;
}

export interface UploadEmployeeDocumentRequest {
    category: string;
    fileName: string;
    mimeType: string;
    data: string;
    required: boolean;
    notes: string;
}

/** Tamano maximo de un soporte: ~8MB binarios (alineado con el backend). */
export const HR_DOCUMENT_MAX_FILE_BYTES = 8 * 1024 * 1024;

@Injectable({
    providedIn: "root",
})
export class HrDocumentsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listDocuments(employeeId: string): Observable<EmployeeDocumentItem[]> {
        return from(this.request<{ items: EmployeeDocumentItem[] }>(this.documentsUrl(employeeId), { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    uploadDocument(employeeId: string, request: UploadEmployeeDocumentRequest): Observable<EmployeeDocumentItem> {
        return from(
            this.request<EmployeeDocumentItem>(this.documentsUrl(employeeId), {
                method: "POST",
                body: JSON.stringify(request),
            })
        );
    }

    downloadDocument(employeeId: string, documentId: string): Observable<EmployeeDocumentDownload> {
        return from(
            this.request<EmployeeDocumentDownload>(`${this.documentsUrl(employeeId)}/${encodeURIComponent(documentId)}/download`, { method: "GET" })
        );
    }

    deleteDocument(employeeId: string, documentId: string): Observable<void> {
        return from(
            this.request<void>(`${this.documentsUrl(employeeId)}/${encodeURIComponent(documentId)}`, { method: "DELETE" })
        );
    }

    /** Lee un File como data URL base64 validando tipo y tamano. */
    readFileAsDataUrl(file: File, maxBytes = HR_DOCUMENT_MAX_FILE_BYTES): Promise<string> {
        if (file.size > maxBytes) {
            return Promise.reject(new Error(`El archivo supera el tamano maximo permitido (${Math.round(maxBytes / 1024 / 1024)}MB).`));
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.readAsDataURL(file);
        });
    }

    private documentsUrl(employeeId: string): string {
        return `/api/v1/hr/employees/${encodeURIComponent(employeeId)}/documents`;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", this.companyID);
        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(`${this.apiBaseUrl}${path}`, {
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
