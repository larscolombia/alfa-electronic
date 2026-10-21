import { Injectable, NgZone, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import type {
    WorkTestBatch,
    WorkTestBatchState,
    WorkTestFlowRule,
} from "../pages/app/work/work-test-batch.models";

// Fase 4: cliente HTTP del modulo /api/v1/worktime (backend internal/worktime).
// Mismo patron que inventory-api.service.ts: fetch + NgZone + JWT + X-Company-Id
// y errores del body propagados (nunca respuestas vacias que parezcan exito).

export interface WorkTimeEntryDto {
    id: string;
    userId: string;
    employee: string;
    projectId: string;
    equipmentId: string;
    task: string;
    entryType: string;
    memo: string;
    startAt: string;
    endAt: string;
    totalHours: number;
    createdAt: string;
}

export interface CreateWorkTimeEntryPayload {
    id?: string;
    employee: string;
    projectId: string;
    equipmentId: string;
    task: string;
    entryType?: string;
    memo: string;
    startAt: string;
    endAt: string;
}

export interface WorkTimeEntryFilters {
    employee?: string;
    equipmentId?: string;
    projectId?: string;
    from?: string;
    to?: string;
}

export interface WeeklyEmployeeTotal {
    employee: string;
    weekStart: string;
    isoWeek: string;
    totalHours: number;
    entryCount: number;
}

export interface EquipmentTotal {
    equipmentId: string;
    totalHours: number;
    entryCount: number;
}

export interface WorkTimeSummary {
    weekly: WeeklyEmployeeTotal[];
    byEquipment: EquipmentTotal[];
}

export interface PageUsageDto {
    path: string;
    durationMs: number;
    visits: number;
    lastVisitedAt: string;
}

export interface DailyUsageDto {
    date: string;
    userId: string;
    platformDurationMs: number;
    pages: PageUsageDto[];
    updatedAt: string;
}

export interface HolidayDto {
    id: string;
    country: string;
    date: string;
    name: string;
    paid: boolean;
}

@Injectable({
    providedIn: "root",
})
export class WorktimeApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly zone = inject(NgZone);

    // ── Entradas de timesheet ────────────────────────────────────────────────

    listEntries(filters: WorkTimeEntryFilters = {}): Observable<WorkTimeEntryDto[]> {
        const params = new URLSearchParams();
        if (filters.employee) params.set("employee", filters.employee);
        if (filters.equipmentId) params.set("equipmentId", filters.equipmentId);
        if (filters.projectId) params.set("projectId", filters.projectId);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        const query = params.toString();
        const path = `/api/v1/worktime/entries${query ? `?${query}` : ""}`;
        return from(this.request<{ items: WorkTimeEntryDto[] }>(path, { method: "GET" })).pipe(
            map((r) => r.items ?? []),
        );
    }

    createEntry(payload: CreateWorkTimeEntryPayload): Observable<WorkTimeEntryDto> {
        return from(
            this.request<WorkTimeEntryDto>("/api/v1/worktime/entries", {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        );
    }

    /** Migracion unica desde localStorage: el servidor deduplica por id. */
    createEntriesBulk(entries: CreateWorkTimeEntryPayload[]): Observable<{ created: number }> {
        return from(
            this.request<{ created: number }>("/api/v1/worktime/entries/bulk", {
                method: "POST",
                body: JSON.stringify({ entries }),
            }),
        );
    }

    updateEntry(entryId: string, payload: CreateWorkTimeEntryPayload): Observable<WorkTimeEntryDto> {
        return from(
            this.request<WorkTimeEntryDto>(`/api/v1/worktime/entries/${encodeURIComponent(entryId)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteEntry(entryId: string): Observable<{ status: string }> {
        return from(
            this.request<{ status: string }>(`/api/v1/worktime/entries/${encodeURIComponent(entryId)}`, {
                method: "DELETE",
            }),
        );
    }

    getSummary(fromDate?: string, toDate?: string): Observable<WorkTimeSummary> {
        // OJO: los parametros no pueden llamarse from/to porque sombrearian el
        // operador `from` de rxjs dentro del metodo.
        const params = new URLSearchParams();
        if (fromDate) params.set("from", fromDate);
        if (toDate) params.set("to", toDate);
        const query = params.toString();
        return from(
            this.request<WorkTimeSummary>(`/api/v1/worktime/summary${query ? `?${query}` : ""}`, { method: "GET" }),
        );
    }

    // ── Telemetria de uso diario ─────────────────────────────────────────────

    getDailyUsage(date: string): Observable<DailyUsageDto> {
        return from(
            this.request<DailyUsageDto>(`/api/v1/worktime/usage?date=${encodeURIComponent(date)}`, { method: "GET" }),
        );
    }

    upsertDailyUsage(payload: {
        date: string;
        platformDurationMs: number;
        pages: PageUsageDto[];
    }): Observable<DailyUsageDto> {
        return from(
            this.request<DailyUsageDto>("/api/v1/worktime/usage", {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    // ── Festivos ─────────────────────────────────────────────────────────────

    listHolidays(year?: number, country?: string): Observable<HolidayDto[]> {
        const params = new URLSearchParams();
        if (year) params.set("year", String(year));
        if (country) params.set("country", country);
        const query = params.toString();
        return from(
            this.request<{ items: HolidayDto[] }>(`/api/v1/worktime/holidays${query ? `?${query}` : ""}`, {
                method: "GET",
            }),
        ).pipe(map((r) => r.items ?? []));
    }

    upsertHoliday(payload: { id?: string; country?: string; date: string; name: string; paid?: boolean }): Observable<HolidayDto> {
        return from(
            this.request<HolidayDto>("/api/v1/worktime/holidays", {
                method: "PUT",
                body: JSON.stringify(payload),
            }),
        );
    }

    deleteHoliday(holidayId: string): Observable<{ status: string }> {
        return from(
            this.request<{ status: string }>(`/api/v1/worktime/holidays/${encodeURIComponent(holidayId)}`, {
                method: "DELETE",
            }),
        );
    }

    // ── Pruebas funcionales ──────────────────────────────────────────────────

    getTestBatchState(): Observable<WorkTestBatchState> {
        return from(this.request<WorkTestBatchState>("/api/v1/worktime/test-batches", { method: "GET" }));
    }

    upsertTestBatch(batch: WorkTestBatch): Observable<WorkTestBatch> {
        return from(
            this.request<WorkTestBatch>(`/api/v1/worktime/test-batches/${encodeURIComponent(batch.id)}`, {
                method: "PUT",
                body: JSON.stringify(batch),
            }),
        );
    }

    deleteTestBatch(batchId: string): Observable<{ status: string }> {
        return from(
            this.request<{ status: string }>(`/api/v1/worktime/test-batches/${encodeURIComponent(batchId)}`, {
                method: "DELETE",
            }),
        );
    }

    upsertFlowRule(rule: WorkTestFlowRule): Observable<WorkTestFlowRule> {
        return from(
            this.request<WorkTestFlowRule>(`/api/v1/worktime/test-flow-rules/${encodeURIComponent(rule.id)}`, {
                method: "PUT",
                body: JSON.stringify(rule),
            }),
        );
    }

    deleteFlowRule(ruleId: string): Observable<{ status: string }> {
        return from(
            this.request<{ status: string }>(`/api/v1/worktime/test-flow-rules/${encodeURIComponent(ruleId)}`, {
                method: "DELETE",
            }),
        );
    }

    // ── Infraestructura ──────────────────────────────────────────────────────

    isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
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
                    // Mensaje por defecto si el backend no devuelve JSON.
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
