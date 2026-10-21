import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export type CrmQuoteStatus = "Borrador" | "Enviado" | "Aprobado";
export type CrmQuoteDecision = "Pendiente" | "Aceptada" | "Rechazada";

export interface CrmQuoteLine {
    servicio: string;
    descripcion: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    impuesto: number;
}

export interface CrmQuoteRecord {
    id: string;
    token: string;
    codigo: string;
    prospecto: string;
    prospectId?: number;
    empresa: string;
    correo: string;
    movil: string;
    fecha: string;
    validoHasta: string;
    estado: CrmQuoteStatus;
    moneda: "COP" | "USD";
    descuentoTipo: "%" | "COP";
    descuentoValor: number;
    lineas: CrmQuoteLine[];
    nota: string;
    terminos: string;
    estadoCliente: CrmQuoteDecision;
    fechaDecision?: string;
    firmadoPor?: string;
    firmanteCorreo?: string;
    lugarFirma?: string;
    firmaBase64?: string;
    descripcion?: string;
    taxMode?: "after-discount" | "before-discount";
    zone?: string;
    signatureRequired?: boolean;
    selectedEquipmentIds?: string[];
    subtotal?: number;
    taxTotal?: number;
    total?: number;
    purchaseOrderNumber?: string;
    purchaseOrderFileName?: string;
    purchaseOrderFileDataUrl?: string;
    purchaseOrderDate?: string;
    purchaseOrderUploadedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ListCrmQuotesQuery {
    status?: CrmQuoteStatus;
    limit?: number;
}

export interface CrmQuoteDecisionRequest {
    estadoCliente: CrmQuoteDecision;
    fechaDecision?: string;
    firmadoPor?: string;
    firmanteCorreo?: string;
    lugarFirma?: string;
    firmaBase64?: string;
}

@Injectable({
    providedIn: "root",
})
export class CrmQuotesApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listQuotes(query: ListCrmQuotesQuery = {}): Observable<CrmQuoteRecord[]> {
        const searchParams = new URLSearchParams();

        if (query.status) {
            searchParams.set("status", query.status);
        }
        if (typeof query.limit === "number" && query.limit > 0) {
            searchParams.set("limit", String(Math.trunc(query.limit)));
        }

        const suffix = searchParams.toString();
        const path = suffix ? `/api/v1/crm-quotes/quotes?${suffix}` : "/api/v1/crm-quotes/quotes";

        return from(this.request<{ items: CrmQuoteRecord[] }>(path, { method: "GET" })).pipe(
            map((response) => response.items ?? [])
        );
    }

    getQuote(quoteId: string): Observable<CrmQuoteRecord> {
        return from(this.request<CrmQuoteRecord>(`/api/v1/crm-quotes/quotes/${encodeURIComponent(quoteId)}`, { method: "GET" }));
    }

    /**
     * Fase 6: previsualiza el código COT-<año>-NNN que recibiría la próxima
     * cotización SIN consumirlo. Es solo una ayuda visual: el código definitivo
     * lo asigna el servidor al guardar, así dos usuarios concurrentes nunca
     * reciben el mismo número.
     */
    peekNextQuoteCode(date = ""): Observable<string> {
        const query = date ? `?date=${encodeURIComponent(date)}` : "";
        return from(this.request<{ code?: string }>(`/api/v1/crm-quotes/quotes/next-code${query}`, { method: "GET" })).pipe(
            map((response) => response.code ?? "")
        );
    }

    createQuote(payload: CrmQuoteRecord): Observable<CrmQuoteRecord> {
        return from(
            this.request<CrmQuoteRecord>("/api/v1/crm-quotes/quotes", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        );
    }

    updateQuote(quoteId: string, payload: CrmQuoteRecord): Observable<CrmQuoteRecord> {
        return from(
            this.request<CrmQuoteRecord>(`/api/v1/crm-quotes/quotes/${encodeURIComponent(quoteId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            })
        );
    }

    deleteQuote(quoteId: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/crm-quotes/quotes/${encodeURIComponent(quoteId)}`, {
                method: "DELETE",
            })
        ).pipe(map(() => void 0));
    }

    getPublicQuoteByToken(token: string): Observable<CrmQuoteRecord> {
        return from(this.request<CrmQuoteRecord>(`/api/v1/crm-quotes/quotes/public/${encodeURIComponent(token)}`, { method: "GET" }));
    }

    updatePublicDecision(token: string, payload: CrmQuoteDecisionRequest): Observable<CrmQuoteRecord> {
        return from(
            this.request<CrmQuoteRecord>(`/api/v1/crm-quotes/quotes/public/${encodeURIComponent(token)}/decision`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            })
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
