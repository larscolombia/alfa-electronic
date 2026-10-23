import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { HrPeoplePickerService } from "../../../services/hr-people-picker.service";
import { WeeklyEmployeeTotal, WorktimeApiService } from "../../../services/worktime-api.service";
import { CreateWorkTimesheetEntry, DailyUsage, WorkTimesheetEntry, WorkTimeTrackerService } from "../../../services/work-time-tracker.service";
import { accumulateQuarterHours, calculateDailyBalance, calculateTimeKpi, summarizeByEntryType, TimeKpiResult, WorkEntryType } from "./work-time.logic";

interface ChartBar {
    label: string;
    hours: number;
    percentage: number;
    visits?: number;
}

@Component({
    selector: "app-work-timesheet",
    standalone: true,
    imports: [RouterLink, FormsModule, CommonModule],
    styles: [
        `
            .kpi-value {
                font-size: 1.8rem;
                font-weight: 700;
                line-height: 1.1;
            }

            .chart-line {
                margin-bottom: 0.85rem;
            }

            .chart-label {
                font-size: 0.875rem;
                margin-bottom: 0.35rem;
            }

            .chart-meta {
                font-size: 0.75rem;
            }

            .memo-cell {
                max-width: 260px;
                white-space: normal;
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Trabajo - Hoja de tiempo</h5>
                    <p class="text-secondary small mb-0">Registra tiempo por proyecto y visualiza uso real de la plataforma por pagina.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary" type="button" (click)="resetDraft()">Limpiar formulario</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Hoja de tiempo</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert mb-3" [ngClass]="messageType === 'success' ? 'alert-success border' : 'alert-danger border'">
                    {{ message }}
                </div>
            }
            @if (migrationError) {
                <div class="alert alert-danger border mb-3" data-testid="timesheet-migration-error">
                    <i class="bi bi-exclamation-triangle me-1"></i>{{ migrationError }}
                </div>
            }

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Registro de tiempo</h6>
                    <p class="text-secondary small mb-0">Captura tiempo dedicado a actividades de la jornada.</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3 mb-1">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Proyecto</label>
                            <select class="form-select" [(ngModel)]="project" (ngModelChange)="onProjectChange()">
                                @for (item of projects; track item) {
                                    <option [value]="item">{{ item }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Tarea</label>
                            <select class="form-select" [(ngModel)]="task">
                                @for (item of availableTasks; track item) {
                                    <option [value]="item">{{ item }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Empleado</label>
                            <select class="form-select" data-testid="timesheet-employee-select" [(ngModel)]="employee">
                                @for (item of employees; track item) {
                                    <option [value]="item">{{ item }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Equipo</label>
                            <select class="form-select" data-testid="timesheet-equipment-select" [(ngModel)]="equipmentId">
                                <option value="">Sin equipo</option>
                                @for (option of equipmentOptions; track option.value) {
                                    <option [value]="option.value">{{ option.label }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Tipo de registro</label>
                            <select class="form-select" data-testid="entry-type-select" [(ngModel)]="entryType">
                                @for (option of entryTypeOptions; track option.value) {
                                    <option [value]="option.value">{{ option.label }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Fecha inicio</label>
                            <input class="form-control" type="date" [(ngModel)]="startDate" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Hora inicio</label>
                            <input class="form-control" type="time" [(ngModel)]="startTime" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Fecha fin</label>
                            <input class="form-control" type="date" [(ngModel)]="endDate" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Hora fin</label>
                            <input class="form-control" type="time" [(ngModel)]="endTime" />
                        </div>
                        <div class="col-12 col-lg-8">
                            <label class="form-label">Memo</label>
                            <input class="form-control" type="text" placeholder="Ej: ajustes de modulo, soporte o reunion de seguimiento" [(ngModel)]="memo" />
                        </div>
                        <div class="col-12 col-lg-4">
                            <label class="form-label">Total calculado</label>
                            <div class="form-control bg-light d-flex align-items-center">
                                <span class="text-danger fw-bold">{{ totalHoursPreview | number: '1.2-2' }} hrs</span>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex gap-2 flex-wrap mt-3">
                        <button class="btn btn-theme" type="button" (click)="saveEntry()"><i class="bi bi-check2 me-1"></i>Guardar</button>
                        <button class="btn btn-outline-secondary" type="button" (click)="resetDraft()">Cancelar</button>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Horas registradas en jornada</p>
                            <p class="kpi-value mb-0">{{ recordedHours | number: '1.2-2' }} h</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Tiempo en plataforma</p>
                            <p class="kpi-value mb-0">{{ platformHours | number: '1.2-2' }} h</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Cobertura de registro</p>
                            <p class="kpi-value mb-0">{{ focusRate }}%</p>
                            <p class="small text-secondary mb-0">Porcentaje de tiempo en plataforma que fue documentado en proyectos.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body py-2 d-flex flex-wrap align-items-center gap-2 gap-md-4">
                    <span data-testid="daily-balance" class="fw-semibold" [ngClass]="dailyBalance.completed ? 'text-success' : 'text-warning'">
                        <i class="bi bi-clock-history me-1"></i>{{ dailyBalanceText }}
                    </span>
                    <span data-testid="entry-type-summary" class="small text-secondary">{{ entryTypeSummaryText }}</span>
                    @if (timeKpi; as kpi) {
                        <span data-testid="time-kpi" class="small fw-semibold">
                            Estimadas {{ formatHours(kpi.estimated) }} &middot; Reales {{ formatHours(kpi.actual) }} &middot; Estado: {{ kpi.result.status }}
                        </span>
                    }
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col">
                            <h6 class="mb-0">Analitica de jornada</h6>
                            <p class="text-secondary small mb-0">Distribucion por proyecto y por paginas visitadas.</p>
                        </div>
                        <div class="col-12 col-md-auto">
                            <label class="form-label mb-1">Fecha de analisis</label>
                            <input class="form-control" type="date" [(ngModel)]="selectedDate" (ngModelChange)="refreshAnalytics()" />
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-lg-6 mb-3 mb-lg-0">
                            <h6 class="mb-3">Tiempo por proyecto</h6>
                            @if (projectBars.length) {
                                @for (bar of projectBars; track bar.label) {
                                    <div class="chart-line">
                                        <div class="d-flex justify-content-between align-items-center chart-label">
                                            <span>{{ bar.label }}</span>
                                            <strong>{{ bar.hours | number: '1.2-2' }} h</strong>
                                        </div>
                                        <div class="progress height-dynamic" style="--h-dynamic:10px">
                                            <div class="progress-bar bg-theme-1" role="progressbar" [style.width.%]="bar.percentage"></div>
                                        </div>
                                    </div>
                                }
                            } @else {
                                <p class="text-secondary small mb-0">No hay registros de proyecto para esta fecha.</p>
                            }
                        </div>
                        <div class="col-12 col-lg-6">
                            <h6 class="mb-3">Tiempo por pagina</h6>
                            @if (pageBars.length) {
                                @for (bar of pageBars; track bar.label) {
                                    <div class="chart-line">
                                        <div class="d-flex justify-content-between align-items-center chart-label">
                                            <span>{{ bar.label }}</span>
                                            <span>
                                                <strong>{{ bar.hours | number: '1.2-2' }} h</strong>
                                                <small class="text-secondary chart-meta ms-1">{{ bar.visits }} visitas</small>
                                            </span>
                                        </div>
                                        <div class="progress height-dynamic" style="--h-dynamic:10px">
                                            <div class="progress-bar bg-theme-2" role="progressbar" [style.width.%]="bar.percentage"></div>
                                        </div>
                                    </div>
                                }
                            } @else {
                                <p class="text-secondary small mb-0">Todavia no hay datos de navegacion para esta fecha.</p>
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Horas por empleado y semana</h6>
                    <p class="text-secondary small mb-0">Agregado del servidor por semana ISO (datos de toda la empresa).</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Semana</th>
                                    <th>Empleado</th>
                                    <th>Inicio de semana</th>
                                    <th>Entradas</th>
                                    <th class="text-end">Horas</th>
                                </tr>
                            </thead>
                            <tbody>
                                @if (weeklySummary.length) {
                                    @for (row of weeklySummary; track row.employee + row.isoWeek) {
                                        <tr>
                                            <td>{{ row.isoWeek }}</td>
                                            <td>{{ row.employee }}</td>
                                            <td>{{ row.weekStart }}</td>
                                            <td>{{ row.entryCount }}</td>
                                            <td class="text-end">{{ row.totalHours | number: '1.2-2' }}</td>
                                        </tr>
                                    }
                                } @else {
                                    <tr>
                                        <td colspan="5" class="text-center text-secondary py-4">Aun no hay horas agregadas por semana.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Bitacora de registros</h6>
                    <p class="text-secondary small mb-0">Entradas de hoja de tiempo para la fecha seleccionada.</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Proyecto</th>
                                    <th>Tarea</th>
                                    <th>Empleado</th>
                                    <th>Equipo</th>
                                    <th>Inicio</th>
                                    <th>Fin</th>
                                    <th>Horas</th>
                                    <th>Memo</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                @if (entriesForDate.length) {
                                    @for (entry of entriesForDate; track entry.id) {
                                        <tr>
                                            <td>{{ entry.project }}</td>
                                            <td>{{ entry.task }}</td>
                                            <td>{{ entry.employee }}</td>
                                            <td>{{ equipmentLabel(entry.equipmentId) }}</td>
                                            <td>{{ entry.startAt | date: 'dd/MM/yyyy hh:mm a' }}</td>
                                            <td>{{ entry.endAt | date: 'dd/MM/yyyy hh:mm a' }}</td>
                                            <td>{{ entry.totalHours | number: '1.2-2' }}</td>
                                            <td class="memo-cell">{{ entry.memo }}</td>
                                            <td class="text-end">
                                                <button class="btn btn-link text-danger btn-sm" type="button" (click)="deleteEntry(entry.id)">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    }
                                } @else {
                                    <tr>
                                        <td colspan="9" class="text-center text-secondary py-4">No hay registros de hoja de tiempo para esta fecha.</td>
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
export class WorkTimesheetComponent implements OnInit, OnDestroy {
    readonly projects = ["Proyecto Atlas", "Proyecto Orion", "Proyecto Mercury", "Soporte interno"];

    readonly tasksByProject: Record<string, string[]> = {
        "Proyecto Atlas": ["Analisis", "Desarrollo", "Pruebas", "Documentacion"],
        "Proyecto Orion": ["Planeacion", "Configuracion", "Integracion", "Reunion cliente"],
        "Proyecto Mercury": ["Diseno tecnico", "Implementacion", "QA", "Deploy"],
        "Soporte interno": ["Soporte usuarios", "Mantenimiento", "Monitoreo", "Capacitacion"],
    };

    /**
     * Fase 6: empleados ACTIVOS de RRHH. Antes había un fallback de 4 nombres
     * inventados ("Juan Perez", "Maria Gomez"…) que se mostraba cuando RRHH
     * venía vacío o fallaba, o sea el timesheet ofrecía gente que no existe.
     */
    employees: string[] = [];

    readonly entryTypeOptions: Array<{ value: WorkEntryType; label: string }> = [
        { value: "normal", label: "Normal" },
        { value: "hora-extra", label: "Hora extra" },
        { value: "permiso", label: "Permiso" },
        { value: "ausencia", label: "Ausencia" },
        { value: "festivo", label: "Festivo" },
    ];

    /** Horas estimadas por proyecto (0 = sin estimacion, no muestra KPI). */
    readonly estimatedHoursByProject: Record<string, number> = {
        "Proyecto Atlas": 40,
        "Proyecto Orion": 60,
        "Proyecto Mercury": 30,
        "Soporte interno": 0,
    };

    message = "";
    messageType: "success" | "danger" = "success";

    /** Error de la migracion unica desde localStorage (visible, se reintenta). */
    migrationError: string | null = null;

    selectedDate = this.todayKey();

    project = this.projects[0];
    task = this.tasksByProject[this.projects[0]][0];
    employee = "";
    equipmentId = "";
    startDate = this.todayKey();
    startTime = "08:00";
    endDate = this.todayKey();
    endTime = "09:00";
    memo = "";
    entryType: WorkEntryType = "normal";

    /** Equipos reales de la API de crm-equipment para el campo equipo. */
    equipmentOptions: Array<{ value: string; label: string }> = [];

    /** Agregado del servidor: horas por empleado y semana ISO. */
    weeklySummary: WeeklyEmployeeTotal[] = [];

    entriesForDate: WorkTimesheetEntry[] = [];
    projectBars: ChartBar[] = [];
    pageBars: ChartBar[] = [];

    /** Cache de todas las entradas del snapshot (para el KPI por proyecto). */
    private allTimesheetEntries: WorkTimesheetEntry[] = [];

    recordedHours = 0;
    platformHours = 0;
    focusRate = 0;

    private stateSubscription?: Subscription;
    private migrationErrorSubscription?: Subscription;

    constructor(
        private readonly tracker: WorkTimeTrackerService,
        private readonly hrPeople: HrPeoplePickerService,
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly worktimeApi: WorktimeApiService,
    ) { }

    ngOnInit(): void {
        this.tracker.startTracking();
        this.stateSubscription = this.tracker.state$.subscribe(() => this.refreshAnalytics());
        this.migrationErrorSubscription = this.tracker.migrationError$.subscribe((error) => {
            this.migrationError = error;
        });
        this.refreshAnalytics();
        this.loadEmployees();
        this.loadEquipmentOptions();
        this.loadWeeklySummary();
    }

    private loadEmployees(): void {
        // Fase 6: una sola fuente de personas (RRHH activo). Sin fallback
        // inventado: si no hay empleados activos la lista queda vacía y el
        // select se ve vacío, que es la verdad.
        // Contexto tecnica: aquí se registran horas de intervención sobre
        // equipos; un comercial no registra tiempo de taller.
        void this.hrPeople.refresh('tecnica').then((names) => {
            this.employees = names;
            if (!this.employees.includes(this.employee)) {
                this.employee = this.employees[0] ?? "";
            }
        });
    }

    private loadEquipmentOptions(): void {
        this.crmEquipmentApi.listItems().subscribe({
            next: (items) => {
                this.equipmentOptions = items.map((item) => ({
                    value: item.itemId,
                    label: [item.displayName || item.serie || item.itemId, item.receivedIdentifier]
                        .filter((part) => !!part && part.trim())
                        .join(" · "),
                }));
            },
            error: (error) => {
                // El select queda sin opciones, pero el registro de horas sigue
                // funcionando con "Sin equipo". El error se hace visible.
                this.showError(`No se pudo cargar el listado de equipos: ${this.errorMessage(error)}`);
            },
        });
    }

    private loadWeeklySummary(): void {
        this.worktimeApi.getSummary().subscribe({
            next: (summary) => {
                this.weeklySummary = summary.weekly ?? [];
            },
            error: (error) => {
                this.showError(`No se pudo cargar el agregado semanal: ${this.errorMessage(error)}`);
            },
        });
    }

    equipmentLabel(equipmentId: string): string {
        if (!equipmentId) {
            return "-";
        }
        return this.equipmentOptions.find((option) => option.value === equipmentId)?.label ?? equipmentId;
    }

    ngOnDestroy(): void {
        this.stateSubscription?.unsubscribe();
        this.migrationErrorSubscription?.unsubscribe();
    }

    get availableTasks(): string[] {
        return this.tasksByProject[this.project] ?? [];
    }

    get totalHoursPreview(): number {
        const startAt = this.buildDate(this.startDate, this.startTime);
        const endAt = this.buildDate(this.endDate, this.endTime);

        if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt.getTime() <= startAt.getTime()) {
            return 0;
        }

        const minutes = Math.round((endAt.getTime() - startAt.getTime()) / 60000);
        return accumulateQuarterHours(minutes);
    }

    get dailyBalance() {
        return calculateDailyBalance(
            this.entriesForDate.map((entry) => ({ hours: entry.totalHours })),
            8,
        );
    }

    get dailyBalanceText(): string {
        const balance = this.dailyBalance;
        const base = `Llevas ${this.formatHours(balance.totalWorked)} de ${this.formatHours(balance.targetHours)} horas`;

        if (!balance.completed) {
            return `${base} (faltan ${this.formatHours(balance.missing)})`;
        }
        if (balance.extra > 0) {
            return `${base} (extras ${this.formatHours(balance.extra)})`;
        }
        return `${base} (jornada completa)`;
    }

    get entryTypeSummaryText(): string {
        const summary = summarizeByEntryType(
            this.entriesForDate.map((entry) => ({
                hours: entry.totalHours,
                entryType: (entry as WorkTimesheetEntry & { entryType?: string }).entryType,
            })),
        );

        const parts: string[] = [];
        for (const option of this.entryTypeOptions) {
            const row = summary[option.value];
            if (row.count > 0) {
                parts.push(`${option.label} ${this.formatHours(row.hours)} h (${row.count})`);
            }
        }

        return parts.length ? parts.join(" · ") : "Sin registros por tipo.";
    }

    get timeKpi(): { estimated: number; actual: number; result: TimeKpiResult } | null {
        const estimated = this.estimatedHoursByProject[this.project] ?? 0;
        if (estimated <= 0) {
            return null;
        }

        const actual = Number(
            this.allTimesheetEntries
                .filter((entry) => entry.project === this.project)
                .reduce((sum, entry) => sum + entry.totalHours, 0)
                .toFixed(2),
        );
        if (actual <= 0) {
            return null;
        }

        return { estimated, actual, result: calculateTimeKpi(estimated, actual) };
    }

    formatHours(value: number): string {
        return String(Number(value.toFixed(2)));
    }

    onProjectChange(): void {
        if (!this.availableTasks.includes(this.task)) {
            this.task = this.availableTasks[0] ?? "";
        }
    }

    saveEntry(): void {
        this.clearMessage();

        if (!this.project || !this.task || !this.employee || !this.memo.trim()) {
            this.showError("Proyecto, tarea, empleado y memo son obligatorios.");
            return;
        }

        if (this.totalHoursPreview <= 0) {
            this.showError("El tiempo final debe ser mayor que el tiempo inicial.");
            return;
        }

        const payload: CreateWorkTimesheetEntry = {
            project: this.project,
            task: this.task,
            employee: this.employee,
            equipmentId: this.equipmentId,
            entryType: this.entryType,
            startDate: this.startDate,
            startTime: this.startTime,
            endDate: this.endDate,
            endTime: this.endTime,
            memo: this.memo,
        };

        // Fase 4: la entrada se guarda en el servidor. El backend calcula las
        // horas (redondeo a cuartos de hora) y asigna el usuario desde el JWT.
        this.tracker.saveTimesheetEntry(payload).subscribe({
            next: (entry) => {
                this.messageType = "success";
                this.message = `Registro de hoja de tiempo guardado en el servidor (${this.formatHours(entry.totalHours)} h redondeadas a cuartos de hora).`;
                this.memo = "";
                this.loadWeeklySummary();
                this.refreshAnalytics();
            },
            error: (error) => {
                this.showError(`No fue posible guardar el registro en el servidor: ${this.errorMessage(error)}`);
            },
        });
    }

    deleteEntry(entryId: string): void {
        this.tracker.deleteTimesheetEntry(entryId).subscribe({
            next: () => {
                this.messageType = "success";
                this.message = "Registro eliminado del servidor.";
                this.loadWeeklySummary();
                this.refreshAnalytics();
            },
            error: (error) => {
                this.showError(`No fue posible eliminar el registro: ${this.errorMessage(error)}`);
            },
        });
    }

    resetDraft(): void {
        this.project = this.projects[0];
        this.task = this.tasksByProject[this.projects[0]][0];
        this.employee = this.employees[0] ?? "";
        this.equipmentId = "";
        this.startDate = this.todayKey();
        this.startTime = "08:00";
        this.endDate = this.todayKey();
        this.endTime = "09:00";
        this.memo = "";
        this.entryType = "normal";
        this.clearMessage();
    }

    refreshAnalytics(): void {
        const snapshot = this.tracker.getSnapshot();
        const todayKey = this.todayKey();

        this.allTimesheetEntries = snapshot.timesheetEntries;

        const paint = (currentDay: DailyUsage) => {
            this.entriesForDate = snapshot.timesheetEntries
                .filter((entry) => this.toDateKey(new Date(entry.startAt)) === this.selectedDate)
                .sort((a, b) => b.startAt.localeCompare(a.startAt));

            this.recordedHours = Number(this.entriesForDate.reduce((sum, entry) => sum + entry.totalHours, 0).toFixed(2));
            this.platformHours = Number((currentDay.platformDurationMs / 3600000).toFixed(2));
            this.focusRate = this.platformHours > 0 ? Math.round((this.recordedHours / this.platformHours) * 100) : 0;

            this.projectBars = this.buildProjectBars(this.entriesForDate);
            this.pageBars = this.buildPageBars(currentDay);
        };

        if (this.selectedDate === todayKey) {
            // El dia en curso vive en memoria (flush al servidor cada 15 s).
            paint(this.tracker.getDailyUsage(this.selectedDate));
            return;
        }

        // Dias pasados: la telemetria viene del servidor.
        this.tracker.loadDailyUsage(this.selectedDate).subscribe({
            next: (day) => paint(day),
            error: () => paint(this.tracker.getDailyUsage(this.selectedDate)),
        });
    }

    private errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    private buildProjectBars(entries: WorkTimesheetEntry[]): ChartBar[] {
        const grouped = new Map<string, number>();

        for (const entry of entries) {
            grouped.set(entry.project, Number(((grouped.get(entry.project) ?? 0) + entry.totalHours).toFixed(2)));
        }

        const rows = Array.from(grouped.entries())
            .map(([label, hours]) => ({ label, hours }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 8);

        const maxHours = rows[0]?.hours ?? 0;

        return rows.map((row) => ({
            label: row.label,
            hours: row.hours,
            percentage: maxHours > 0 ? Math.max((row.hours / maxHours) * 100, 4) : 0,
        }));
    }

    private buildPageBars(day: DailyUsage): ChartBar[] {
        const rows = day.pages
            .map((page) => ({
                label: this.routeToLabel(page.path),
                hours: Number((page.durationMs / 3600000).toFixed(2)),
                visits: page.visits,
            }))
            .filter((row) => row.hours > 0)
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 8);

        const maxHours = rows[0]?.hours ?? 0;

        return rows.map((row) => ({
            label: row.label,
            hours: row.hours,
            visits: row.visits,
            percentage: maxHours > 0 ? Math.max((row.hours / maxHours) * 100, 4) : 0,
        }));
    }

    private routeToLabel(path: string): string {
        if (!path || path === "/") {
            return "Inicio";
        }

        const cleaned = path.replace(/^\/(app|auth)\//, "");
        const segments = cleaned
            .split("/")
            .filter(Boolean)
            .map((segment) => {
                const normalized = segment.replace(/-/g, " ");
                return normalized.charAt(0).toUpperCase() + normalized.slice(1);
            });

        return segments.join(" / ") || "Inicio";
    }

    private buildDate(date: string, time: string): Date {
        return new Date(`${date}T${time}:00`);
    }

    private showError(message: string): void {
        this.messageType = "danger";
        this.message = message;
    }

    private clearMessage(): void {
        this.message = "";
    }

    private todayKey(): string {
        const today = new Date();
        return this.toDateKey(today);
    }

    private toDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}