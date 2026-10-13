import { Injectable, OnDestroy } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { BehaviorSubject, Subscription } from "rxjs";
import { filter } from "rxjs/operators";

export interface WorkTimesheetEntry {
    id: string;
    project: string;
    task: string;
    employee: string;
    startAt: string;
    endAt: string;
    memo: string;
    totalHours: number;
    createdAt: string;
}

export interface CreateWorkTimesheetEntry {
    project: string;
    task: string;
    employee: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    memo: string;
}

export interface PageUsage {
    path: string;
    durationMs: number;
    visits: number;
    lastVisitedAt: string;
}

export interface DailyUsage {
    date: string;
    platformDurationMs: number;
    pages: PageUsage[];
    lastUpdatedAt: string;
}

export interface WorkTrackingState {
    daily: DailyUsage[];
    timesheetEntries: WorkTimesheetEntry[];
}

@Injectable({
    providedIn: "root",
})
export class WorkTimeTrackerService implements OnDestroy {
    private readonly storageKey = "lars.work.time.tracker.v1";
    private readonly flushIntervalMs = 15000;

    private readonly stateSubject = new BehaviorSubject<WorkTrackingState>(this.cloneState(this.restoreState()));
    readonly state$ = this.stateSubject.asObservable();

    private state: WorkTrackingState = this.cloneState(this.stateSubject.value);
    private routeSubscription?: Subscription;
    private flushTimer?: number;
    private initialized = false;

    private currentRoute = "";
    private currentRouteStartedAt = 0;

    private readonly unloadHandler = () => {
        this.flushCurrentRoute();
    };

    constructor(private readonly router: Router) { }

    startTracking(): void {
        if (this.initialized || typeof window === "undefined") {
            return;
        }

        this.initialized = true;
        const now = Date.now();

        this.currentRoute = this.normalizeRoute(this.router.url);
        this.currentRouteStartedAt = now;
        this.registerVisit(this.currentRoute, now);

        this.routeSubscription = this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => this.onNavigation(event.urlAfterRedirects));

        this.flushTimer = window.setInterval(() => this.flushCurrentRoute(), this.flushIntervalMs);
        window.addEventListener("beforeunload", this.unloadHandler);

        this.persistState();
        this.emitState();
    }

    stopTracking(): void {
        if (!this.initialized || typeof window === "undefined") {
            return;
        }

        this.flushCurrentRoute();

        this.routeSubscription?.unsubscribe();
        this.routeSubscription = undefined;

        if (this.flushTimer !== undefined) {
            window.clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }

        window.removeEventListener("beforeunload", this.unloadHandler);
        this.initialized = false;
    }

    ngOnDestroy(): void {
        this.stopTracking();
    }

    saveTimesheetEntry(payload: CreateWorkTimesheetEntry): WorkTimesheetEntry {
        const startAt = this.buildDate(payload.startDate, payload.startTime);
        const endAt = this.buildDate(payload.endDate, payload.endTime);

        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt.getTime() <= startAt.getTime()) {
            throw new Error("El rango de tiempo no es valido.");
        }

        const totalHours = Number(((endAt.getTime() - startAt.getTime()) / 3600000).toFixed(2));
        const createdAt = new Date().toISOString();

        const entry: WorkTimesheetEntry = {
            id: this.buildId("timesheet"),
            project: payload.project.trim(),
            task: payload.task.trim(),
            employee: payload.employee.trim(),
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            memo: payload.memo.trim(),
            totalHours,
            createdAt,
        };

        this.state.timesheetEntries = [entry, ...this.state.timesheetEntries].slice(0, 500);
        this.persistState();
        this.emitState();

        return entry;
    }

    deleteTimesheetEntry(entryId: string): void {
        this.state.timesheetEntries = this.state.timesheetEntries.filter((entry) => entry.id !== entryId);
        this.persistState();
        this.emitState();
    }

    getSnapshot(): WorkTrackingState {
        return this.cloneState(this.state);
    }

    getDailyUsage(date: string): DailyUsage {
        const usage = this.state.daily.find((day) => day.date === date);
        if (!usage) {
            return {
                date,
                platformDurationMs: 0,
                pages: [],
                lastUpdatedAt: "",
            };
        }

        return this.cloneDailyUsage(usage);
    }

    private onNavigation(nextUrl: string): void {
        const normalized = this.normalizeRoute(nextUrl);
        const now = Date.now();

        this.finalizeCurrentRoute(now);
        this.currentRoute = normalized;
        this.currentRouteStartedAt = now;
        this.registerVisit(normalized, now);

        this.persistState();
        this.emitState();
    }

    private flushCurrentRoute(): void {
        const now = Date.now();
        this.finalizeCurrentRoute(now);
        this.currentRouteStartedAt = now;
        this.persistState();
        this.emitState();
    }

    private finalizeCurrentRoute(now: number): void {
        if (!this.currentRoute || this.currentRouteStartedAt <= 0 || now <= this.currentRouteStartedAt) {
            return;
        }

        const durationMs = now - this.currentRouteStartedAt;
        this.distributeDuration(this.currentRouteStartedAt, durationMs, (dateKey, chunkMs, updatedAt) => {
            const day = this.getOrCreateDay(dateKey, updatedAt);
            day.platformDurationMs += chunkMs;
            day.lastUpdatedAt = updatedAt;

            const page = this.getOrCreatePage(day, this.currentRoute, updatedAt);
            page.durationMs += chunkMs;
            page.lastVisitedAt = updatedAt;
        });
    }

    private distributeDuration(
        startAtMs: number,
        durationMs: number,
        receiver: (dateKey: string, chunkMs: number, updatedAtIso: string) => void
    ): void {
        let cursor = startAtMs;
        let remaining = durationMs;

        while (remaining > 0) {
            const cursorDate = new Date(cursor);
            const nextDay = new Date(cursorDate);
            nextDay.setHours(24, 0, 0, 0);

            const availableInDay = nextDay.getTime() - cursor;
            const chunkMs = Math.min(remaining, availableInDay);

            receiver(this.toDateKey(cursorDate), chunkMs, new Date(cursor + chunkMs).toISOString());

            cursor += chunkMs;
            remaining -= chunkMs;
        }
    }

    private registerVisit(route: string, atMs: number): void {
        const dateKey = this.toDateKey(new Date(atMs));
        const updatedAt = new Date(atMs).toISOString();
        const day = this.getOrCreateDay(dateKey, updatedAt);
        const page = this.getOrCreatePage(day, route, updatedAt);

        page.visits += 1;
        page.lastVisitedAt = updatedAt;
        day.lastUpdatedAt = updatedAt;
    }

    private getOrCreateDay(date: string, updatedAt: string): DailyUsage {
        let day = this.state.daily.find((item) => item.date === date);

        if (!day) {
            day = {
                date,
                platformDurationMs: 0,
                pages: [],
                lastUpdatedAt: updatedAt,
            };
            this.state.daily = [...this.state.daily, day];
        }

        return day;
    }

    private getOrCreatePage(day: DailyUsage, path: string, atIso: string): PageUsage {
        let page = day.pages.find((item) => item.path === path);

        if (!page) {
            page = {
                path,
                durationMs: 0,
                visits: 0,
                lastVisitedAt: atIso,
            };
            day.pages = [...day.pages, page];
        }

        return page;
    }

    private emitState(): void {
        this.stateSubject.next(this.cloneState(this.state));
    }

    private persistState(): void {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    private restoreState(): WorkTrackingState {
        if (typeof window === "undefined") {
            return { daily: [], timesheetEntries: [] };
        }

        const raw = window.localStorage.getItem(this.storageKey);
        if (!raw) {
            return { daily: [], timesheetEntries: [] };
        }

        try {
            const parsed = JSON.parse(raw) as Partial<WorkTrackingState>;
            return {
                daily: Array.isArray(parsed.daily) ? parsed.daily : [],
                timesheetEntries: Array.isArray(parsed.timesheetEntries) ? parsed.timesheetEntries : [],
            };
        } catch {
            return { daily: [], timesheetEntries: [] };
        }
    }

    private normalizeRoute(url: string): string {
        if (!url) {
            return "/";
        }

        const cleanUrl = url.split("?")[0]?.split("#")[0] ?? "/";
        return cleanUrl || "/";
    }

    private toDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private buildDate(date: string, time: string): Date {
        return new Date(`${date}T${time}:00`);
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private cloneState(state: WorkTrackingState): WorkTrackingState {
        return {
            daily: state.daily.map((day) => this.cloneDailyUsage(day)),
            timesheetEntries: state.timesheetEntries.map((entry) => ({ ...entry })),
        };
    }

    private cloneDailyUsage(day: DailyUsage): DailyUsage {
        return {
            ...day,
            pages: day.pages.map((page) => ({ ...page })),
        };
    }
}