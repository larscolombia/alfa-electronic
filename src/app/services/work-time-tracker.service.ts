import { Injectable, OnDestroy, inject } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { BehaviorSubject, Observable, Subscription, filter, firstValueFrom } from "rxjs";
import { AuthService } from "./auth.service";
import { WorktimeApiService } from "./worktime-api.service";

// Fase 4: las entradas de timesheet y la telemetria de uso viven en el servidor
// (backend internal/worktime). El localStorage['lars.work.time.tracker.v1'] solo
// se lee UNA vez para migrar lo que el usuario ya tuviera y se borra unicamente
// si la migracion termino sin errores; si falla se conserva y se reintenta en el
// proximo arranque con el error visible (migrationError$). Ya no se hace setItem
// de datos de negocio.

export interface WorkTimesheetEntry {
    id: string;
    project: string;
    task: string;
    employee: string;
    equipmentId: string;
    entryType: string;
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
    equipmentId?: string;
    entryType?: string;
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

/** Forma del estado antiguo en localStorage (solo lectura, para la migracion). */
interface LegacyTrackingState {
    daily?: DailyUsage[];
    timesheetEntries?: Array<WorkTimesheetEntry & { entryType?: string; equipmentId?: string }>;
}

@Injectable({
    providedIn: "root",
})
export class WorkTimeTrackerService implements OnDestroy {
    private readonly legacyStorageKey = "lars.work.time.tracker.v1";
    private readonly flushIntervalMs = 15000;

    private readonly api = inject(WorktimeApiService);
    private readonly router = inject(Router);
    private readonly auth = inject(AuthService);

    private readonly stateSubject = new BehaviorSubject<WorkTrackingState>({ daily: [], timesheetEntries: [] });
    readonly state$ = this.stateSubject.asObservable();

    /** Error de la migracion unica desde localStorage; null si todo fue bien. */
    private readonly migrationErrorSubject = new BehaviorSubject<string | null>(null);
    readonly migrationError$: Observable<string | null> = this.migrationErrorSubject.asObservable();

    private routeSubscription?: Subscription;
    private authSubscription?: Subscription;
    private flushTimer?: number;
    private initialized = false;

    private currentRoute = "";
    private currentRouteStartedAt = 0;

    /** Dias con telemetria sin enviar (el flush hace UPSERT del dia completo). */
    private readonly dirtyUsageDays = new Set<string>();
    private migrationStarted = false;
    private serverStateLoaded = false;

    private readonly unloadHandler = () => {
        this.flushCurrentRoute();
    };

    constructor() { }

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

        // startTracking corre en el root de la app, ANTES del login; la SPA no
        // recarga la pagina al autenticarse, asi que la carga del servidor y la
        // migracion unica se disparan tambien cuando aparece una sesion.
        this.authSubscription = this.auth.session$
            .pipe(filter((session): session is NonNullable<typeof session> => session !== null))
            .subscribe(() => {
                if (this.serverStateLoaded) {
                    return;
                }
                this.serverStateLoaded = true;
                void this.loadServerState();
            });

        this.flushTimer = window.setInterval(() => this.flushCurrentRoute(), this.flushIntervalMs);
        window.addEventListener("beforeunload", this.unloadHandler);

        if (this.api.isAuthenticated() && !this.serverStateLoaded) {
            this.serverStateLoaded = true;
            void this.loadServerState();
        }
        this.emitState();
    }

    stopTracking(): void {
        if (!this.initialized || typeof window === "undefined") {
            return;
        }

        this.flushCurrentRoute();

        this.routeSubscription?.unsubscribe();
        this.routeSubscription = undefined;

        this.authSubscription?.unsubscribe();
        this.authSubscription = undefined;

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

    /**
     * Guarda una entrada de timesheet en el SERVIDOR. totalHours lo calcula el
     * backend (redondeo hacia arriba a cuartos de hora); el user_id sale del JWT.
     */
    saveTimesheetEntry(payload: CreateWorkTimesheetEntry): Observable<WorkTimesheetEntry> {
        const startAt = this.buildDate(payload.startDate, payload.startTime);
        const endAt = this.buildDate(payload.endDate, payload.endTime);

        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt.getTime() <= startAt.getTime()) {
            return new Observable<WorkTimesheetEntry>((subscriber) => {
                subscriber.error(new Error("El rango de tiempo no es valido."));
                subscriber.complete();
            });
        }

        return new Observable<WorkTimesheetEntry>((subscriber) => {
            this.api
                .createEntry({
                    employee: payload.employee.trim(),
                    projectId: payload.project.trim(),
                    equipmentId: (payload.equipmentId ?? "").trim(),
                    task: payload.task.trim(),
                    entryType: payload.entryType ?? "normal",
                    memo: payload.memo.trim(),
                    startAt: startAt.toISOString(),
                    endAt: endAt.toISOString(),
                })
                .subscribe({
                    next: (dto) => {
                        const entry = this.toLocalEntry(dto);
                        const state = this.stateSubject.value;
                        this.stateSubject.next({
                            daily: state.daily,
                            timesheetEntries: [entry, ...state.timesheetEntries.filter((item) => item.id !== entry.id)],
                        });
                        subscriber.next(entry);
                        subscriber.complete();
                    },
                    error: (error) => subscriber.error(error),
                });
        });
    }

    deleteTimesheetEntry(entryId: string): Observable<void> {
        return new Observable<void>((subscriber) => {
            this.api.deleteEntry(entryId).subscribe({
                next: () => {
                    const state = this.stateSubject.value;
                    this.stateSubject.next({
                        daily: state.daily,
                        timesheetEntries: state.timesheetEntries.filter((entry) => entry.id !== entryId),
                    });
                    subscriber.next();
                    subscriber.complete();
                },
                error: (error) => subscriber.error(error),
            });
        });
    }

    getSnapshot(): WorkTrackingState {
        return this.cloneState(this.stateSubject.value);
    }

    getDailyUsage(date: string): DailyUsage {
        const usage = this.stateSubject.value.daily.find((day) => day.date === date);
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

    /** Trae del servidor el uso de un dia y lo deja en el estado local. */
    loadDailyUsage(date: string): Observable<DailyUsage> {
        return new Observable<DailyUsage>((subscriber) => {
            this.api.getDailyUsage(date).subscribe({
                next: (dto) => {
                    const usage = this.fromUsageDto(dto);
                    const todayKey = this.toDateKey(new Date());
                    const state = this.stateSubject.value;

                    // El dia de hoy en memoria va por delante del servidor (el
                    // flush es cada 15 s): no se pisa con la copia remota.
                    const keepLocal = usage.date === todayKey && state.daily.some((day) => day.date === todayKey);
                    if (!keepLocal) {
                        this.stateSubject.next({
                            daily: [...state.daily.filter((day) => day.date !== usage.date), usage],
                            timesheetEntries: state.timesheetEntries,
                        });
                    }
                    subscriber.next(keepLocal ? this.getDailyUsage(date) : usage);
                    subscriber.complete();
                },
                error: (error) => subscriber.error(error),
            });
        });
    }

    /** Recarga las entradas de timesheet desde el servidor. */
    refreshEntries(): Observable<WorkTimesheetEntry[]> {
        return new Observable<WorkTimesheetEntry[]>((subscriber) => {
            this.api.listEntries().subscribe({
                next: (items) => {
                    const entries = items.map((dto) => this.toLocalEntry(dto));
                    const state = this.stateSubject.value;
                    this.stateSubject.next({ daily: state.daily, timesheetEntries: entries });
                    subscriber.next(entries);
                    subscriber.complete();
                },
                error: (error) => subscriber.error(error),
            });
        });
    }

    // ── Carga inicial + migracion unica ──────────────────────────────────────

    private async loadServerState(): Promise<void> {
        if (!this.api.isAuthenticated()) {
            // Sin sesion no hay contra que servidor trabajar; se reintenta en el
            // proximo startTracking (p.ej. tras login).
            return;
        }

        try {
            const items = await firstValueFrom(this.api.listEntries());
            const state = this.stateSubject.value;
            this.stateSubject.next({
                daily: state.daily,
                timesheetEntries: items.map((dto) => this.toLocalEntry(dto)),
            });
        } catch (error) {
            this.migrationErrorSubject.next(
                `No se pudieron cargar las horas del servidor: ${this.errorMessage(error)}`,
            );
        }

        await this.migrateLegacyState();
        this.flushCurrentRoute();
    }

    /**
     * Migracion unica de 'lars.work.time.tracker.v1': sube solo lo que no exista
     * en el servidor (el backend deduplica por id) y borra la clave SOLO si todo
     * salio bien. Si algo falla, la clave se conserva y el error se expone en
     * migrationError$ para que la UI lo muestre; se reintenta en el proximo
     * arranque.
     */
    private async migrateLegacyState(): Promise<void> {
        if (this.migrationStarted || typeof window === "undefined") {
            return;
        }

        const raw = window.localStorage.getItem(this.legacyStorageKey);
        if (!raw) {
            return;
        }

        this.migrationStarted = true;

        let legacy: LegacyTrackingState;
        try {
            legacy = JSON.parse(raw) as LegacyTrackingState;
        } catch {
            // Clave corrupta: no hay nada rescatable; se elimina para no
            // reintentar una migracion imposible en cada arranque.
            window.localStorage.removeItem(this.legacyStorageKey);
            this.migrationStarted = false;
            return;
        }

        const failures: string[] = [];

        const legacyEntries = Array.isArray(legacy.timesheetEntries) ? legacy.timesheetEntries : [];
        if (legacyEntries.length > 0) {
            try {
                await firstValueFrom(
                    this.api.createEntriesBulk(
                        legacyEntries
                            .filter((entry) => entry && entry.startAt && entry.endAt)
                            .map((entry) => ({
                                id: entry.id,
                                employee: entry.employee ?? "",
                                projectId: entry.project ?? "",
                                equipmentId: entry.equipmentId ?? "",
                                task: entry.task ?? "",
                                entryType: entry.entryType ?? "normal",
                                memo: entry.memo ?? "",
                                startAt: entry.startAt,
                                endAt: entry.endAt,
                            })),
                    ),
                );
            } catch (error) {
                failures.push(`entradas de timesheet: ${this.errorMessage(error)}`);
            }
        }

        const legacyDays = Array.isArray(legacy.daily) ? legacy.daily : [];
        for (const day of legacyDays) {
            if (!day?.date) {
                continue;
            }
            try {
                const remote = await firstValueFrom(this.api.getDailyUsage(day.date));
                // Solo se sube si el servidor tiene menos telemetria que el
                // local: nunca se degrada un agregado ya mayor en el servidor.
                if ((remote.platformDurationMs ?? 0) < (day.platformDurationMs ?? 0)) {
                    await firstValueFrom(
                        this.api.upsertDailyUsage({
                            date: day.date,
                            platformDurationMs: day.platformDurationMs ?? 0,
                            pages: day.pages ?? [],
                        }),
                    );
                }
            } catch (error) {
                failures.push(`uso del dia ${day.date}: ${this.errorMessage(error)}`);
            }
        }

        if (failures.length > 0) {
            // La clave SE CONSERVA: los datos aun no estan a salvo en el
            // servidor y se reintentara en el proximo arranque.
            this.migrationErrorSubject.next(
                `La migracion de tus datos locales de horas fallo y se reintentara mas tarde. Detalles: ${failures.join(" | ")}`,
            );
            this.migrationStarted = false;
            return;
        }

        window.localStorage.removeItem(this.legacyStorageKey);
        this.migrationErrorSubject.next(null);

        // Refresca el estado con lo que quedo en el servidor tras la migracion.
        try {
            const items = await firstValueFrom(this.api.listEntries());
            const state = this.stateSubject.value;
            this.stateSubject.next({
                daily: state.daily,
                timesheetEntries: items.map((dto) => this.toLocalEntry(dto)),
            });
        } catch {
            // El refresh no es critico: la migracion ya quedo hecha.
        }
    }

    // ── Telemetria de navegacion ─────────────────────────────────────────────

    private onNavigation(nextUrl: string): void {
        const normalized = this.normalizeRoute(nextUrl);
        const now = Date.now();

        this.finalizeCurrentRoute(now);
        this.currentRoute = normalized;
        this.currentRouteStartedAt = now;
        this.registerVisit(normalized, now);

        this.emitState();
    }

    private flushCurrentRoute(): void {
        const now = Date.now();
        this.finalizeCurrentRoute(now);
        this.currentRouteStartedAt = now;
        this.emitState();
        void this.pushDirtyUsage();
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
            this.dirtyUsageDays.add(dateKey);

            const page = this.getOrCreatePage(day, this.currentRoute, updatedAt);
            page.durationMs += chunkMs;
            page.lastVisitedAt = updatedAt;
        });
    }

    /** UPSERT del dia completo por cada dia sucio (una llamada por flush). */
    private async pushDirtyUsage(): Promise<void> {
        if (this.dirtyUsageDays.size === 0 || !this.api.isAuthenticated()) {
            return;
        }

        const days = Array.from(this.dirtyUsageDays);
        for (const dateKey of days) {
            const day = this.stateSubject.value.daily.find((item) => item.date === dateKey);
            if (!day) {
                this.dirtyUsageDays.delete(dateKey);
                continue;
            }

            try {
                await firstValueFrom(
                    this.api.upsertDailyUsage({
                        date: day.date,
                        platformDurationMs: day.platformDurationMs,
                        pages: day.pages.map((page) => ({ ...page })),
                    }),
                );
                this.dirtyUsageDays.delete(dateKey);
            } catch {
                // Telemetria no es dato critico: el dia sigue marcado sucio y se
                // reintenta en el proximo flush (15 s).
            }
        }
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
        this.dirtyUsageDays.add(dateKey);
    }

    private getOrCreateDay(date: string, updatedAt: string): DailyUsage {
        const state = this.stateSubject.value;
        let day = state.daily.find((item) => item.date === date);

        if (!day) {
            day = {
                date,
                platformDurationMs: 0,
                pages: [],
                lastUpdatedAt: updatedAt,
            };
            this.stateSubject.next({
                daily: [...state.daily, day],
                timesheetEntries: state.timesheetEntries,
            });
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
        const state = this.stateSubject.value;
        this.stateSubject.next(this.cloneState(state));
    }

    // ── Mapeo DTO <-> modelo local ───────────────────────────────────────────

    private toLocalEntry(dto: {
        id: string;
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
    }): WorkTimesheetEntry {
        return {
            id: dto.id,
            project: dto.projectId,
            task: dto.task,
            employee: dto.employee,
            equipmentId: dto.equipmentId,
            entryType: dto.entryType || "normal",
            startAt: dto.startAt,
            endAt: dto.endAt,
            memo: dto.memo,
            totalHours: dto.totalHours,
            createdAt: dto.createdAt,
        };
    }

    private fromUsageDto(dto: {
        date: string;
        platformDurationMs: number;
        pages: PageUsage[];
        updatedAt: string;
    }): DailyUsage {
        return {
            date: dto.date,
            platformDurationMs: dto.platformDurationMs ?? 0,
            pages: (dto.pages ?? []).map((page) => ({ ...page })),
            lastUpdatedAt: dto.updatedAt ?? "",
        };
    }

    private errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
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
