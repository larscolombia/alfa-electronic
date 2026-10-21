import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

// FASE 5c — Correos transaccionales con outbox durable.
//
// El contrato importante: `delivered` es false en el momento del disparo
// porque ENCOLAR no es ENVIAR. `emailStatus` dice la verdad:
//   'pendiente'   → hay SMTP, saldrá en el próximo barrido del worker (~30 s)
//   'desactivado' → SMTP no configurado, el correo NO va a salir
// La UI debe usar esto en vez de asumir que "se envió". Antes de esta fase los
// tres flujos de correo reportaban éxito sin enviar nada.

/** Estado de una fila del outbox, tal como la persiste el backend. */
export type EmailOutboxStatus = "pendiente" | "enviado" | "fallido" | "desactivado";

/** Resultado de un disparador de correo (cotización, despacho, recepción). */
export interface EmailTriggerResult {
    queued: boolean;
    delivered: boolean;
    emailId: string;
    emailStatus: EmailOutboxStatus;
    toEmail: string;
    /** Presente cuando el correo no salió (p. ej. SMTP desactivado). */
    warning?: string;
    recipientResolvedFrom?: string;
}

/** Fila del outbox que muestra `GET /emails` (solo administración). */
export interface EmailOutboxRecord {
    companyId: string;
    id: string;
    kind: string;
    toEmail: string;
    subject: string;
    bodyHtml: string;
    refType: string;
    refId: string;
    status: EmailOutboxStatus;
    attempts: number;
    lastError: string;
    createdBy: string;
    createdAt: string;
    sentAt: string;
    nextAttemptAt?: string | null;
}

export interface EmailOutboxResponse {
    items: EmailOutboxRecord[];
    /** false ⇒ el servidor no tiene SMTP configurado y nada va a salir. */
    smtpEnabled: boolean;
}

/** Aviso de despacho con transportadora y guía. */
export interface DispatchNoticePayload {
    clientName: string;
    clientNit?: string;
    dispatchCode: string;
    equipmentName: string;
    carrier: string;
    guideNumber: string;
    deliveryNote?: string;
    refType?: string;
    refID?: string;
}

@Injectable({
    providedIn: "root",
})
export class EmailsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    /** Outbox completo con estado y último error. Requiere rol de administración. */
    listOutbox(limit = 100): Observable<EmailOutboxResponse> {
        const path = limit > 0
            ? `/api/v1/emails?limit=${encodeURIComponent(String(limit))}`
            : "/api/v1/emails";

        return from(this.request<EmailOutboxResponse>(path, { method: "GET" }));
    }

    /** Correo de la cotización "Guardar y enviar", con el link público de aprobación. */
    sendQuoteEmail(quoteId: string): Observable<EmailTriggerResult> {
        return from(
            this.request<EmailTriggerResult>(
                `/api/v1/crm-quotes/quotes/${encodeURIComponent(quoteId)}/send`,
                { method: "POST", body: JSON.stringify({}) },
            ),
        );
    }

    /** Aviso de despacho. El destinatario lo resuelve el backend desde el cliente en BD. */
    sendDispatchNotice(payload: DispatchNoticePayload): Observable<EmailTriggerResult> {
        return from(
            this.request<EmailTriggerResult>("/api/v1/emails/triggers/dispatch", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    /** Acuse de recepción con los identificadores de los equipos recibidos. */
    sendReceptionAck(recordId: string): Observable<EmailTriggerResult> {
        return from(
            this.request<EmailTriggerResult>(
                `/api/v1/crm-equipment/records/${encodeURIComponent(recordId)}/reception-ack`,
                { method: "POST", body: JSON.stringify({}) },
            ),
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

        const response = await fetch(this.apiURL(path), { ...init, headers });

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
                // Se conserva el mensaje por defecto si la respuesta no es JSON.
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
