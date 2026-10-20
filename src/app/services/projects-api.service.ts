import { Injectable, NgZone, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

/** Proyecto tal como lo devuelve el backend (tabla projects, properties_json libre). */
export interface ProjectApiItem {
    id: string;
    status: string;
    properties: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface UpsertProjectApiRequest {
    id: string;
    status: string;
    properties: Record<string, any>;
}

export interface ProjectSlaConfigApiItem {
    stage: string;
    greenDays: number;
    yellowDays: number;
}

export interface ProjectNotificationApiItem {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    targetRole: string;
}

export interface CreateProjectNotificationRequest {
    type: string;
    title: string;
    message: string;
    targetRole?: string;
}

export type TechnicalReportApiPayload = Record<string, any>;

/**
 * Cliente HTTP del modulo de proyectos del backend (rutas registradas en
 * backend/internal/projects/handler.go, montadas sobre /api/v1/projects).
 * Unico origen de verdad del tablero tecnico: nada de localStorage.
 */
@Injectable({
    providedIn: "root",
})
export class ProjectsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly zone = inject(NgZone);

    listProjects(query: { status?: string; limit?: number } = {}): Observable<ProjectApiItem[]> {
        const searchParams = new URLSearchParams();
        const status = String(query.status ?? "").trim();
        if (status) {
            searchParams.set("status", status);
        }
        if (query.limit && query.limit > 0) {
            searchParams.set("limit", String(query.limit));
        }

        const suffix = searchParams.toString();
        const path = suffix ? `/api/v1/projects?${suffix}` : "/api/v1/projects";
        return from(this.request<{ items: ProjectApiItem[] }>(path, { method: "GET" })).pipe(
            map((response) => response.items ?? []),
        );
    }

    getProject(projectId: string): Observable<ProjectApiItem> {
        return from(
            this.request<ProjectApiItem>(`/api/v1/projects/${encodeURIComponent(projectId)}`, { method: "GET" }),
        );
    }

    createProject(payload: UpsertProjectApiRequest): Observable<ProjectApiItem> {
        return from(
            this.request<ProjectApiItem>("/api/v1/projects", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    updateProject(projectId: string, payload: UpsertProjectApiRequest): Observable<ProjectApiItem> {
        return from(
            this.request<ProjectApiItem>(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteProject(projectId: string): Observable<{ status: string }> {
        return from(
            this.request<{ status: string }>(`/api/v1/projects/${encodeURIComponent(projectId)}`, {
                method: "DELETE",
            }),
        );
    }

    closeDiagnosis(projectId: string, closedBy?: string): Observable<ProjectApiItem> {
        return from(
            this.request<ProjectApiItem>(
                `/api/v1/projects/${encodeURIComponent(projectId)}/diagnosis/close`,
                { method: "POST", body: JSON.stringify({ closedBy: closedBy ?? "" }) },
            ),
        );
    }

    getBoardConfig(): Observable<Record<string, any>> {
        return from(this.request<Record<string, any>>("/api/v1/projects/board-config", { method: "GET" }));
    }

    updateBoardConfig(config: Record<string, any>): Observable<Record<string, any>> {
        return from(
            this.request<Record<string, any>>("/api/v1/projects/board-config", {
                method: "PUT",
                body: JSON.stringify(config),
            }),
        );
    }

    getSlaConfig(): Observable<ProjectSlaConfigApiItem[]> {
        return from(this.request<ProjectSlaConfigApiItem[]>("/api/v1/projects/sla-config", { method: "GET" }));
    }

    updateSlaConfig(configs: ProjectSlaConfigApiItem[]): Observable<ProjectSlaConfigApiItem[]> {
        return from(
            this.request<ProjectSlaConfigApiItem[]>("/api/v1/projects/sla-config", {
                method: "PUT",
                body: JSON.stringify(configs),
            }),
        );
    }

    listNotifications(): Observable<ProjectNotificationApiItem[]> {
        return from(
            this.request<{ items: ProjectNotificationApiItem[] }>("/api/v1/projects/notifications", { method: "GET" }),
        ).pipe(map((response) => response.items ?? []));
    }

    createNotification(payload: CreateProjectNotificationRequest): Observable<ProjectNotificationApiItem> {
        return from(
            this.request<ProjectNotificationApiItem>("/api/v1/projects/notifications", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    markNotificationRead(notificationId: string): Observable<{ status: string }> {
        return from(
            this.request<{ status: string }>(
                `/api/v1/projects/notifications/${encodeURIComponent(notificationId)}/read`,
                { method: "PATCH" },
            ),
        );
    }

    listTechnicalReports(): Observable<TechnicalReportApiPayload[]> {
        return from(
            this.request<{ items: TechnicalReportApiPayload[] }>("/api/v1/projects/technical-reports", { method: "GET" }),
        ).pipe(map((response) => response.items ?? []));
    }

    createTechnicalReport(payload: TechnicalReportApiPayload): Observable<TechnicalReportApiPayload> {
        return from(
            this.request<TechnicalReportApiPayload>("/api/v1/projects/technical-reports", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    private apiUrl(path: string): string {
        return `${this.apiBaseUrl}${path}`;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        return this.zone.run(async () => {
            const headers = new Headers(init.headers);
            headers.set("Content-Type", "application/json");
            headers.set("X-Company-Id", this.companyID);

            const accessToken = this.authService.getAccessToken();
            if (accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
            }

            const response = await fetch(this.apiUrl(path), {
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
        });
    }
}
