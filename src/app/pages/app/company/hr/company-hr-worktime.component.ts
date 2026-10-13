import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import {
    buildBusinessCalendar,
    estimateBusinessDaysForYear,
    getDefaultWorkDayLabels,
    HolidayEntry,
    loadBusinessDayLabelsFromStorage,
    persistBusinessDayLabels,
    WorkDayLabel,
    WorkScheduleTemplate,
    WORKTIME_BUSINESS_DAYS_STORAGE_KEY,
    WORKTIME_HOLIDAYS_STORAGE_KEY,
    WORKTIME_SCHEDULES_STORAGE_KEY,
} from "./worktime-calendar.util";

@Component({
    selector: "app-company-hr-worktime",
    standalone: true,
    imports: [RouterLink, FormsModule],
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
                <div class="alert alert-success border mb-3">{{ message }}</div>
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
                            <input class="form-control" type="number" min="2024" [(ngModel)]="holidayYear" />
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

    scheduleTemplates: WorkScheduleTemplate[] = this.defaultSchedules();
    holidays: HolidayEntry[] = this.defaultHolidays();

    ngOnInit(): void {
        this.restoreStorage();
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
            this.message = "Define fecha y nombre del festivo para agregarlo.";
            return;
        }

        this.holidays.unshift({
            id: this.buildId("holiday"),
            date: this.draftHolidayDate,
            name,
            paid: this.draftHolidayPaid,
        });

        this.message = "Festivo agregado correctamente.";
        this.draftHolidayDate = "";
        this.draftHolidayName = "";
        this.persistStorage();
    }

    removeHoliday(id: string): void {
        this.holidays = this.holidays.filter((holiday) => holiday.id !== id);
        this.message = "Festivo eliminado.";
        this.persistStorage();
    }

    estimatedWorkingDays(year: number): number {
        const calendar = buildBusinessCalendar(this.businessDayLabels, this.holidays);
        return estimateBusinessDaysForYear(year, calendar);
    }

    saveMockConfig(): void {
        this.persistStorage();
        this.message = `Configuracion mock guardada para el ano ${this.holidayYear}.`;
    }

    restoreDefaults(): void {
        this.scheduleTemplates = this.defaultSchedules();
        this.holidays = this.defaultHolidays();
        this.businessDayLabels = getDefaultWorkDayLabels();
        this.message = "Configuracion mock restaurada a valores base.";

        if (typeof window !== "undefined") {
            window.localStorage.removeItem(this.scheduleStorageKey);
            window.localStorage.removeItem(this.holidayStorageKey);
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

        const scheduleRaw = window.localStorage.getItem(this.scheduleStorageKey);
        const holidayRaw = window.localStorage.getItem(this.holidayStorageKey);

        try {
            const schedules = scheduleRaw ? (JSON.parse(scheduleRaw) as WorkScheduleTemplate[]) : null;
            if (Array.isArray(schedules)) {
                this.scheduleTemplates = schedules;
            }
        } catch {
            this.scheduleTemplates = this.defaultSchedules();
        }

        try {
            const holidays = holidayRaw ? (JSON.parse(holidayRaw) as HolidayEntry[]) : null;
            if (Array.isArray(holidays)) {
                this.holidays = holidays;
            }
        } catch {
            this.holidays = this.defaultHolidays();
        }

        this.businessDayLabels = loadBusinessDayLabelsFromStorage(this.scheduleTemplates);
    }

    private persistStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem(this.scheduleStorageKey, JSON.stringify(this.scheduleTemplates));
        window.localStorage.setItem(this.holidayStorageKey, JSON.stringify(this.holidays));
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

    private defaultHolidays(): HolidayEntry[] {
        const year = new Date().getFullYear();
        return [
            { id: "holiday-001", date: `${year}-01-01`, name: "Ano Nuevo", paid: true },
            { id: "holiday-002", date: `${year}-05-01`, name: "Dia del Trabajo", paid: true },
            { id: "holiday-003", date: `${year}-12-25`, name: "Navidad", paid: true },
        ];
    }
}
