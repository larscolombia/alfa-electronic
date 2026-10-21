import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { WorktimeApiService } from "../../../../services/worktime-api.service";
import {
    buildBusinessCalendar,
    estimateBusinessDaysForYear,
    getDefaultWorkDayLabels,
    HolidayEntry,
    loadBusinessDayLabelsFromStorage,
    persistBusinessDayLabels,
    refreshHolidaysFromServer,
    WorkDayLabel,
    WorkScheduleTemplate,
    WORKTIME_BUSINESS_DAYS_STORAGE_KEY,
    WORKTIME_HOLIDAYS_STORAGE_KEY,
    WORKTIME_SCHEDULES_STORAGE_KEY,
} from "./worktime-calendar.util";

@Component({
    selector: "app-company-hr-worktime",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">RRHH - Horarios y festivos</h5>
                    <p class="text-secondary small mb-0">Configuracion de jornada laboral y calendario anual</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button" (click)="restoreDefaults()">Restaurar mock</button>
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-worktime' }">Ver ficha</a>
                    <button class="btn btn-theme" type="button" (click)="saveMockConfig()">Guardar configuracion</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-hr-dashboard">Recursos Humanos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Horarios y festivos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert border mb-3" [ngClass]="messageType === 'success' ? 'alert-success' : 'alert-danger'">{{ message }}</div>
            }

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Plantillas de horario</p>
                            <h4 class="mb-0">{{ scheduleTemplates.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Festivos del ano {{ holidayYear }}</p>
                            <h4 class="mb-0">{{ holidaysForYear.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Dias habiles estimados</p>
                            <h4 class="mb-0">{{ estimatedWorkingDays(holidayYear) }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Dias laborales base</h6>
                    <p class="text-secondary small mb-0">Estos dias se usan para calcular dias habiles en semaforos y reportes.</p>
                </div>
                <div class="card-body">
                    <div class="row gx-2 gy-2">
                        @for (day of weekDays; track day) {
                            <div class="col-auto">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" [id]="'business-day-' + day" [checked]="isBusinessDaySelected(day)" (change)="toggleBusinessDay(day, $event)" />
                                    <label class="form-check-label" [for]="'business-day-' + day">{{ day }}</label>
                                </div>
                            </div>
                        }
                    </div>
                    <small class="text-secondary d-block mt-2">Cada color del semaforo cambia cada 2 dias habiles segun esta configuracion.</small>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Plantillas de horario laboral</h6>
                    <p class="text-secondary small mb-0">Define jornadas base que luego podras asignar por empleado</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end mb-3">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Nombre de plantilla</label>
                            <input class="form-control" type="text" [(ngModel)]="draftScheduleName" />
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label">Hora inicio</label>
                            <input class="form-control" type="time" [(ngModel)]="draftStartTime" />
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label">Hora fin</label>
                            <input class="form-control" type="time" [(ngModel)]="draftEndTime" />
                        </div>
                        <div class="col-12 col-md-4 text-md-end">
                            <button class="btn btn-outline-theme" type="button" (click)="addScheduleTemplate()">Agregar horario</button>
                        </div>
                    </div>

                    <div class="row gx-2 gy-2 mb-3">
                        @for (day of weekDays; track day) {
                            <div class="col-auto">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" [id]="'draft-day-' + day" [checked]="isDraftDaySelected(day)" (change)="toggleDraftDay(day, $event)" />
                                    <label class="form-check-label" [for]="'draft-day-' + day">{{ day }}</label>
                                </div>
                            </div>
                        }
                    </div>

                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Plantilla</th>
                                    <th>Dias</th>
                                    <th>Horario</th>
                                    <th>Horas semanales</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (template of scheduleTemplates; track template.id) {
                                    <tr>
                                        <td>{{ template.name }}</td>
                                        <td>{{ template.days.join(', ') }}</td>
                                        <td>{{ template.startTime }} - {{ template.endTime }}</td>
                                        <td>{{ weeklyHours(template) }} h</td>
                                        <td class="text-end">
                                            <button class="btn btn-link text-danger btn-sm" type="button" (click)="removeScheduleTemplate(template.id)"><i class="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Festivos del ano</h6>
                    <p class="text-secondary small mb-0">Registra dias no laborables para calcular disponibilidad y costos</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end mb-3">
                        <div class="col-12 col-md-2">
                            <label class="form-label">Ano</label>
                            <input class="form-control" type="number" min="2024" [(ngModel)]="holidayYear" (ngModelChange)="onHolidayYearChange()" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Fecha</label>
                            <input class="form-control" type="date" [(ngModel)]="draftHolidayDate" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Nombre del festivo</label>
                            <input class="form-control" type="text" [(ngModel)]="draftHolidayName" />
                        </div>
                        <div class="col-12 col-md-2">
                            <div class="form-check mt-4">
                                <input class="form-check-input" type="checkbox" id="paidHoliday" [(ngModel)]="draftHolidayPaid" />
                                <label class="form-check-label" for="paidHoliday">Pago</label>
                            </div>
                        </div>
                        <div class="col-12 col-md-1 text-md-end">
                            <button class="btn btn-outline-theme w-100" type="button" (click)="addHoliday()">+</button>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Festivo</th>
                                    <th>Tipo</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (holiday of holidaysForYear; track holiday.id) {
                                    <tr>
                                        <td>{{ holiday.date }}</td>
                                        <td>{{ holiday.name }}</td>
                                        <td>{{ holiday.paid ? 'Pago' : 'No pago' }}</td>
                                        <td class="text-end">
                                            <button class="btn btn-link text-danger btn-sm" type="button" (click)="removeHoliday(holiday.id)"><i class="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CompanyHrWorktimeComponent implements OnInit {
    private readonly scheduleStorageKey = WORKTIME_SCHEDULES_STORAGE_KEY;
    private readonly holidayStorageKey = WORKTIME_HOLIDAYS_STORAGE_KEY;
    private readonly businessDaysStorageKey = WORKTIME_BUSINESS_DAYS_STORAGE_KEY;

    message = "";
    messageType: "success" | "danger" = "success";
    holidayYear = new Date().getFullYear();

    readonly weekDays: WorkDayLabel[] = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    businessDayLabels: WorkDayLabel[] = getDefaultWorkDayLabels();
    draftSelectedDays: WorkDayLabel[] = ["Lun", "Mar", "Mie", "Jue", "Vie"];
    draftScheduleName = "Jornada administrativa";
    draftStartTime = "08:00";
    draftEndTime = "17:00";

    draftHolidayDate = "";
    draftHolidayName = "";
    draftHolidayPaid = true;

    // Fase 6 (pendiente): los horarios y los dias habiles siguen en localStorage
    // ('lars.hr.worktime.schedules' y 'lars.hr.worktime.business-days.v1'); su
    // migracion a configuracion por empresa en el servidor NO hace parte de la
    // Fase 4. Solo los festivos pasaron al servidor (GET/PUT /worktime/holidays).
    scheduleTemplates: WorkScheduleTemplate[] = this.defaultSchedules();

    /** Festivos reales del servidor (tabla holidays, Ley 51 de Colombia). */
    holidays: HolidayEntry[] = [];

    private legacyHolidayMigrationStarted = false;

    constructor(private readonly worktimeApi: WorktimeApiService) { }

    ngOnInit(): void {
        this.restoreStorage();
        this.loadHolidaysFromServer();
    }

    onHolidayYearChange(): void {
        this.loadHolidaysFromServer();
    }

    private loadHolidaysFromServer(): void {
        const year = Number(this.holidayYear);
        if (!Number.isFinite(year) || year < 1900 || year > 3000) {
            return;
        }

        this.worktimeApi.listHolidays(year).subscribe({
            next: (items) => {
                this.holidays = items.map((item) => ({
                    id: item.id,
                    date: item.date,
                    name: item.name,
                    paid: Boolean(item.paid),
                }));
                void this.migrateLegacyHolidays();
                // Refresca la cache global que consumen los semaforos SLA.
                void refreshHolidaysFromServer();
            },
            error: (error) => {
                this.messageType = "danger";
                this.message = `No se pudieron cargar los festivos del servidor: ${this.errorMessage(error)}`;
            },
        });
    }

    /**
     * Migracion unica de 'lars.hr.worktime.holidays': sube solo los festivos
     * locales cuya fecha no exista en el servidor (nunca pisa los oficiales) y
     * borra la clave SOLO si todo salio bien; si falla, se conserva y reintenta.
     */
    private async migrateLegacyHolidays(): Promise<void> {
        if (this.legacyHolidayMigrationStarted || typeof window === "undefined") {
            return;
        }

        const raw = window.localStorage.getItem(this.holidayStorageKey);
        if (!raw) {
            return;
        }

        this.legacyHolidayMigrationStarted = true;

        let legacy: HolidayEntry[] = [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                legacy = parsed as HolidayEntry[];
            }
        } catch {
            legacy = [];
        }

        if (legacy.length === 0) {
            window.localStorage.removeItem(this.holidayStorageKey);
            return;
        }

        const years = Array.from(
            new Set(
                legacy
                    .map((entry) => String(entry?.date ?? "").slice(0, 4))
                    .filter((year) => /^\d{4}$/.test(year))
            )
        );

        let failed = false;
        for (const year of years) {
            try {
                const serverItems = await firstValueFrom(this.worktimeApi.listHolidays(Number(year)));
                const serverDates = new Set(serverItems.map((item) => item.date));

                for (const entry of legacy) {
                    const date = String(entry?.date ?? "").trim();
                    const name = String(entry?.name ?? "").trim();
                    if (!date.startsWith(year) || !name || serverDates.has(date)) {
                        continue;
                    }
                    await firstValueFrom(
                        this.worktimeApi.upsertHoliday({ country: "CO", date, name, paid: entry.paid !== false })
                    );
                }
            } catch (error) {
                failed = true;
                this.messageType = "danger";
                this.message = `La migracion de tus festivos locales fallo y se reintentara mas tarde: ${this.errorMessage(error)}`;
            }
        }

        if (failed) {
            this.legacyHolidayMigrationStarted = false;
            return;
        }

        window.localStorage.removeItem(this.holidayStorageKey);
        this.loadHolidaysFromServer();
    }

    private errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    get holidaysForYear(): HolidayEntry[] {
        return this.holidays
            .filter((holiday) => {
                const date = new Date(`${holiday.date}T00:00:00`);
                return !Number.isNaN(date.getTime()) && date.getFullYear() === this.holidayYear;
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    isDraftDaySelected(day: WorkDayLabel): boolean {
        return this.draftSelectedDays.includes(day);
    }

    isBusinessDaySelected(day: WorkDayLabel): boolean {
        return this.businessDayLabels.includes(day);
    }

    toggleBusinessDay(day: WorkDayLabel, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (checked) {
            if (!this.businessDayLabels.includes(day)) {
                this.businessDayLabels = this.weekDays.filter((entry) => entry === day || this.businessDayLabels.includes(entry));
            }
        } else {
            if (this.businessDayLabels.length === 1 && this.businessDayLabels[0] === day) {
                (event.target as HTMLInputElement).checked = true;
                this.message = "Debes mantener al menos un dia laboral activo.";
                return;
            }

            this.businessDayLabels = this.businessDayLabels.filter((entry) => entry !== day);
        }

        this.persistStorage();
    }

    toggleDraftDay(day: WorkDayLabel, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (checked && !this.draftSelectedDays.includes(day)) {
            this.draftSelectedDays = [...this.draftSelectedDays, day];
        }

        if (!checked) {
            this.draftSelectedDays = this.draftSelectedDays.filter((selectedDay) => selectedDay !== day);
        }
    }

    addScheduleTemplate(): void {
        const name = this.draftScheduleName.trim();
        if (!name || !this.draftStartTime || !this.draftEndTime || !this.draftSelectedDays.length) {
            this.message = "Completa nombre, horario y al menos un dia para registrar la plantilla.";
            return;
        }

        this.scheduleTemplates.unshift({
            id: this.buildId("schedule"),
            name,
            startTime: this.draftStartTime,
            endTime: this.draftEndTime,
            days: [...this.draftSelectedDays],
        });

        this.message = "Plantilla de horario agregada.";
        this.persistStorage();
    }

    removeScheduleTemplate(id: string): void {
        this.scheduleTemplates = this.scheduleTemplates.filter((template) => template.id !== id);
        this.message = "Plantilla eliminada.";
        this.persistStorage();
    }

    weeklyHours(template: WorkScheduleTemplate): number {
        const daily = this.dailyHours(template.startTime, template.endTime);
        return Number((daily * template.days.length).toFixed(2));
    }

    addHoliday(): void {
        const name = this.draftHolidayName.trim();
        if (!this.draftHolidayDate || !name) {
            this.messageType = "danger";
            this.message = "Define fecha y nombre del festivo para agregarlo.";
            return;
        }

        // Fase 4: el festivo se guarda en el servidor (upsert por country+date).
        this.worktimeApi
            .upsertHoliday({ country: "CO", date: this.draftHolidayDate, name, paid: this.draftHolidayPaid })
            .subscribe({
                next: () => {
                    this.messageType = "success";
                    this.message = "Festivo guardado en el servidor.";
                    this.draftHolidayDate = "";
                    this.draftHolidayName = "";
                    this.loadHolidaysFromServer();
                },
                error: (error) => {
                    this.messageType = "danger";
                    this.message = `No se pudo guardar el festivo en el servidor: ${this.errorMessage(error)}`;
                },
            });
    }

    removeHoliday(id: string): void {
        this.worktimeApi.deleteHoliday(id).subscribe({
            next: () => {
                this.messageType = "success";
                this.message = "Festivo eliminado del servidor.";
                this.holidays = this.holidays.filter((holiday) => holiday.id !== id);
                void refreshHolidaysFromServer();
            },
            error: (error) => {
                this.messageType = "danger";
                this.message = `No se pudo eliminar el festivo: ${this.errorMessage(error)}`;
            },
        });
    }

    estimatedWorkingDays(year: number): number {
        const calendar = buildBusinessCalendar(this.businessDayLabels, this.holidays);
        return estimateBusinessDaysForYear(year, calendar);
    }

    saveMockConfig(): void {
        this.persistStorage();
        this.message = `Configuracion de horarios y dias habiles guardada para el ano ${this.holidayYear}. Los festivos viven en el servidor.`;
    }

    restoreDefaults(): void {
        // Los festivos NO se restauran aqui: viven en el servidor (tabla
        // holidays, sembrada con la Ley 51). Este boton solo restablece la
        // configuracion local de horarios y dias habiles (Fase 6 los migrara).
        this.scheduleTemplates = this.defaultSchedules();
        this.businessDayLabels = getDefaultWorkDayLabels();
        this.message = "Horarios y dias habiles restaurados a valores base.";

        if (typeof window !== "undefined") {
            window.localStorage.removeItem(this.scheduleStorageKey);
            window.localStorage.removeItem(this.businessDaysStorageKey);
        }
    }

    private dailyHours(startTime: string, endTime: string): number {
        const [startHour, startMinute] = startTime.split(":").map((value) => Number(value));
        const [endHour, endMinute] = endTime.split(":").map((value) => Number(value));
        const start = startHour * 60 + startMinute;
        const end = endHour * 60 + endMinute;

        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
            return 0;
        }

        return (end - start) / 60;
    }

    private restoreStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        // Solo horarios y dias habiles siguen en localStorage (Fase 6 los
        // migrara). Los festivos se cargan del servidor en loadHolidaysFromServer.
        const scheduleRaw = window.localStorage.getItem(this.scheduleStorageKey);

        try {
            const schedules = scheduleRaw ? (JSON.parse(scheduleRaw) as WorkScheduleTemplate[]) : null;
            if (Array.isArray(schedules)) {
                this.scheduleTemplates = schedules;
            }
        } catch {
            this.scheduleTemplates = this.defaultSchedules();
        }

        this.businessDayLabels = loadBusinessDayLabelsFromStorage(this.scheduleTemplates);
    }

    private persistStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        // Los festivos ya NO se escriben en localStorage: viven en el servidor.
        window.localStorage.setItem(this.scheduleStorageKey, JSON.stringify(this.scheduleTemplates));
        persistBusinessDayLabels(this.businessDayLabels);
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private defaultSchedules(): WorkScheduleTemplate[] {
        return [
            {
                id: "schedule-001",
                name: "Jornada administrativa",
                startTime: "08:00",
                endTime: "17:00",
                days: ["Lun", "Mar", "Mie", "Jue", "Vie"],
            },
            {
                id: "schedule-002",
                name: "Jornada operativa",
                startTime: "07:00",
                endTime: "16:00",
                days: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
            },
        ];
    }
}
