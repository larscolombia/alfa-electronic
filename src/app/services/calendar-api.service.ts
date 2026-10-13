import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { NgZone } from "@angular/core";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export interface CalendarEventRecord {
    id: string;
    title: string;
    start: string;
    end?: string;
    allDay: boolean;
    description: string;
    className?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SaveCalendarEventRequest {
    title: string;
    start: string;
    end?: string;
    allDay: boolean;
    description: string;
    className?: string;
}

export interface ListCalendarEventsQuery {
    from?: string;
    to?: string;
    limit?: number;
}

@Injectable({
    providedIn: "root",
})
export class CalendarApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly zone = inject(NgZone);

    listEvents(query: ListCalendarEventsQuery = {}): Observable<CalendarEventRecord[]> {
        const searchParams = new URLSearchParams();

        if (query.from) {
            searchParams.set("from", query.from);
        }
        if (query.to) {
            searchParams.set("to", query.to);
        }
        if (typeof query.limit === "number" && query.limit > 0) {
            searchParams.set("limit", String(query.limit));
        }

        const suffix = searchParams.toString();
        const path = suffix ? `/api/v1/calendar/events?${suffix}` : "/api/v1/calendar/events";

        return from(this.request<{ items: CalendarEventRecord[] }>(path, { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    getEvent(eventID: string): Observable<CalendarEventRecord> {
        return from(this.request<CalendarEventRecord>(`/api/v1/calendar/events/${encodeURIComponent(eventID)}`, { method: "GET" }));
    }

    createEvent(request: SaveCalendarEventRequest): Observable<CalendarEventRecord> {
        return from(
            this.request<CalendarEventRecord>("/api/v1/calendar/events", {
                method: "POST",
                body: JSON.stringify(request),
            })
        );
    }

    updateEvent(eventID: string, request: SaveCalendarEventRequest): Observable<CalendarEventRecord> {
        return from(
            this.request<CalendarEventRecord>(`/api/v1/calendar/events/${encodeURIComponent(eventID)}`, {
                method: "PUT",
                body: JSON.stringify(request),
            })
        );
    }

    deleteEvent(eventID: string): Observable<void> {
        return from(
            this.request<Record<string, never>>(`/api/v1/calendar/events/${encodeURIComponent(eventID)}`, {
                method: "DELETE",
            })
        ).pipe(map(() => void 0));
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
