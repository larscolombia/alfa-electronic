import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";

import { CrmProspectEquipmentModalComponent } from "../crm/crm-prospect-equipment-modal.component";
import { ProspectEquipmentRecord, formatProspectEquipmentReception } from "../crm/crm-prospect-equipment.store";
import { ProspectRecord, getProspectById } from "../crm/crm-prospects.store";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";

// 2026-11-02 (T24) — /app/work-equipment-reception (y /app/work-teams, mismo componente) pasa de la
// landing "todo junto" a dos subvistas explícitas:
//   • Nuevo equipo : el modal asociar-equipo embebido como vista completa (mismo componente CRM).
//   • Historial    : SOLO datatable — 4 columnas (Código / Fecha recepción / Empresa / Servicio),
//                    rango de fechas preestablecido y acciones Editar + Asignar técnico.
// Cero métricas, fichas, SLA, warnings o filtros de estado: el cliente pidió la vista mínima.
type ReceptionSubview = "landing" | "new" | "history";

type HistoryRangeKey = "hoy" | "esta-semana" | "ultimos-15-dias" | "ultimo-mes" | "tres-meses";

const HISTORY_RANGE_OPTIONS: { value: HistoryRangeKey; label: string }[] = [
    { value: "hoy", label: "Hoy" },
    { value: "esta-semana", label: "Esta semana" },
    { value: "ultimos-15-dias", label: "Últimos 15 días" },
    { value: "ultimo-mes", label: "Último mes" },
    { value: "tres-meses", label: "3 meses" },
];

const WORK_DIRECT_PROSPECT: ProspectRecord = {
    id: "recepcion-directa",
    backendId: "",
    nombre: "Recepción directa",
    correo: "",
    movil: "",
    nit: "",
    zona: "Trabajo",
    valor: 0,
    creado: "17/04/2026",
    cotizaciones: 0,
    empleado: "",
    estado: "En proceso",
    compania: "Trabajo > Equipos",
    sitioWeb: "",
    telefonoOficina: "",
    pais: "Colombia",
    ciudad: "",
    direccion: "",
    ciiuCode: "",
    branches: [],
};

@Component({
    selector: "app-work-teams",
    standalone: true,
    imports: [CommonModule, RouterLink, CrmProspectEquipmentModalComponent],
    styles: [
        `
            .work-equipment-table-wrap {
                overflow-x: auto;
                overflow-y: visible;
            }

            .work-equipment-table-wrap table {
                table-layout: fixed;
                min-width: 860px;
            }

            /* Contrato UX heredado (columna Equipos): código/serie largos deben saltar línea.
               Se conserva en la tabla T24 para no perder el comportamiento verificado por suite. */
            .work-equipment-table-wrap td {
                white-space: normal;
                overflow-wrap: anywhere;
            }

            .service-preview {
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
            }

            /* T24b (2026-11-03): el cliente pidió que la tabla recupere el ancho de pantalla:
               solo 5% de padding a cada lado en vez del max-width de .container Bootstrap. */
            .work-equipment-history-wrap {
                padding-inline: 5%;
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">{{ pageTitle }}</h5>
                    <p class="text-secondary small mb-0">{{ pageSubtitle }}</p>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">{{ breadcrumbLabel }}</li>
                </ol>
            </nav>
        </div>

        @if (subview === 'history') {
            <div class="container-fluid work-equipment-history-wrap mt-3" id="main-content">
                @if (message) {
                    <div class="alert alert-success border mb-3">{{ message }}</div>
                }

                @if (errorMessage) {
                    <div class="alert alert-danger border mb-3">{{ errorMessage }}</div>
                }

                @if (isLoading) {
                    <div class="alert alert-info border mb-3">Cargando recepciones desde la base de datos...</div>
                }

                <!-- Subvistas T24: "Nuevo equipo" conserva data-testid=work-equipment-create que usa toda
                     la suite E2E (click aquí = abrir el formulario completo). -->
                <div class="d-flex flex-wrap align-items-center gap-2 mb-3" role="tablist" aria-label="Subvistas de recepción">
                    <!-- Este bloque solo existe con subview=history (el @if lo garantiza): clases estáticas.
                         "Nuevo equipo" conserva data-testid=work-equipment-create que usa toda la suite E2E. -->
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-testid="work-equipment-create" (click)="openCreateEditor()">
                        <i class="bi bi-plus-lg me-1"></i> Nuevo equipo
                    </button>
                    <button type="button" class="btn btn-sm btn-theme" data-testid="work-equipment-history-tab">Historial</button>
                </div>

                <div class="card adminuiux-card mb-4">
                    <div class="card-header">
                        <div class="row gx-3 gy-2 align-items-center">
                            <div class="col-12 col-lg">
                                <h6 class="mb-0">Historial de recepciones</h6>
                                <p class="small text-secondary mb-0">Por defecto muestra los equipos recibidos hoy.</p>
                            </div>
                            <div class="col-12 col-lg-auto">
                                <label class="d-flex align-items-center gap-2 small text-secondary mb-0" for="history-range-select">Rango de fechas</label>
                                <select id="history-range-select" class="form-select form-select-sm mt-1" data-testid="work-equipment-history-range" [value]="historyRange" (change)="setHistoryRange($any($event.target).value)">
                                    @for (option of historyRangeOptions; track option.value) {
                                        <option [value]="option.value">{{ option.label }}</option>
                                    }
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <!-- data-testid=work-equipment-filter-summary: la suite t02 (step 8) lo espera visible. -->
                        <div class="px-3 py-2 border-bottom small text-secondary" data-testid="work-equipment-filter-summary">
                            Mostrando {{ historyRecords.length }} recepciones en "{{ currentRangeLabel() }}".
                        </div>
                        @if (!isLoading && historyRecords.length > 0) {
                            <div class="table-responsive work-equipment-table-wrap">
                                @if (tableVisible) {
                                <table #recordsTable class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Código del equipo</th>
                                            <th>Fecha de recepción</th>
                                            <th>Empresa</th>
                                            <th>Servicio</th>
                                            <th class="text-end all">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (record of historyRecords; track record.id) {
                                            <!-- data-record-id: la suite single-add (escenario B) lo espera en <tr>. -->
                                            <tr [attr.data-record-id]="record.id">
                                                <td>
                                                    <div class="fw-semibold">{{ equipmentCode(record) }}</div>
                                                    @if (equipmentSerie(record)) {
                                                        <div class="small text-secondary">{{ equipmentSerie(record) }}</div>
                                                    }
                                                </td>
                                                <td>{{ receptionDate(record) | date:'dd/MM/yyyy HH:mm' }}</td>
                                                <td>{{ record.companyName || '--' }}</td>
                                                <td>
                                                    <div class="service-preview">
                                                        @for (serviceName of servicePreview(record); track serviceName) {
                                                            <span class="small">{{ serviceName }}</span>
                                                        }
                                                    </div>
                                                </td>
                                                <!-- T24: acciones reducidas a Editar + Asignar técnico (sin archivar/reactivar). -->
                                                <td class="text-end all">
                                                    <button class="btn btn-sm btn-outline-theme me-2" type="button" [attr.data-testid]="'work-equipment-edit-' + record.id" title="Editar recepción">Editar</button>
                                                    <button class="btn btn-sm btn-outline-primary" type="button" [attr.data-testid]="'work-equipment-assign-' + record.id">Asignar técnico</button>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                                }
                            </div>
                        } @else if (!isLoading) {
                            <!-- data-testid=work-equipment-empty-state: la suite single-add lo espera sin filas. -->
                            <div class="px-4 py-5 text-center text-secondary" data-testid="work-equipment-empty-state">
                                No hay recepciones en "{{ currentRangeLabel() }}". Prueba con otro rango de fechas.
                            </div>
                        }
                    </div>
                </div>
            </div>

            @if (showEditor) {
                <!-- Edición desde Historial: overlay sobre la landing (misma ruta que antes). -->
                <app-crm-prospect-equipment-modal
                    [prospect]="editorProspect"
                    [initialRecord]="editorRecord"
                    [navigateToProjectsOnSave]="false"
                    [allowMultipleEquipment]="allowMultipleEquipmentReception"
                    (closed)="closeEditor()"
                    (saved)="handleSaved()"></app-crm-prospect-equipment-modal>
            }
        } @else if (subview === 'new') {
            <!-- T24 — "Nuevo equipo": el modal asociar-equipo embebido COMO VISTA COMPLETA.
                 Es un overlay full-screen con backdrop (el clic fuera cierra = cancelar);
                 al guardar/cancelar regresa a Historial vía (closed). -->
            <app-crm-prospect-equipment-modal
                [prospect]="WORK_DIRECT_PROSPECT"
                [navigateToProjectsOnSave]="false"
                [allowMultipleEquipment]="allowMultipleEquipmentReception"
                (saved)="handleSaved()"
                (closed)="goToLanding()"></app-crm-prospect-equipment-modal>
        } @else {
            <main class="container-fluid mt-3" id="main-content">
                <section class="card adminuiux-card p-4" aria-label="Acciones de recepción">
                    <div class="d-flex flex-column flex-sm-row flex-wrap gap-2">
                        <a class="btn btn-outline-secondary" routerLink="/app/work-projects">Ver proyecto</a>
                        <button class="btn btn-theme" type="button" data-testid="work-equipment-create" (click)="openCreateEditor()">Nuevo equipo</button>
                        <button class="btn btn-outline-theme" type="button" data-testid="work-equipment-history-tab" (click)="openHistory()">Historial</button>
                    </div>
                </section>
            </main>
        }

    `,
})
export class WorkTeamsComponent implements AfterViewInit, OnDestroy {
    @ViewChild("recordsTable") private readonly recordsTableRef?: ElementRef<HTMLTableElement>;

    // ── Estado de subvistas (T24) ─────────────────────────────────────────────
    subview: ReceptionSubview = "landing";
    historyRange: HistoryRangeKey = "hoy";
    readonly historyRangeOptions = HISTORY_RANGE_OPTIONS;

    records: ProspectEquipmentRecord[] = [];
    message = "";
    errorMessage = "";
    isLoading = false;
    showEditor = false;
    tableVisible = true;
    editorRecord: ProspectEquipmentRecord | null = null;
    editorProspect: ProspectRecord = WORK_DIRECT_PROSPECT;
    // 2026-11-01 — registro múltiple desactivado en recepción (botón "Agregar equipo" del modal):
    // solo se agrega un equipo a la vez. Para reactivarlo, pon esta constante en true.
    readonly allowMultipleEquipmentReception = false;
    pageTitle = "Trabajo - Equipos";
    pageSubtitle = "CRUD de recepciones de equipos usando el mismo formulario operativo de CRM y una lista tipo datatable.";
    breadcrumbLabel = "Equipos";
    // El template no puede referenciar constantes de módulo: se expone la semilla del prospecto
    // sintético (WORK_DIRECT_PROSPECT) como miembro para la vista embebida de creación.
    readonly WORK_DIRECT_PROSPECT: ProspectRecord = { ...WORK_DIRECT_PROSPECT };

    private tableInstance: { destroy: () => void } | null = null;
    private actionsTableElement: HTMLTableElement | null = null;
    private hasViewInitialized = false;
    private tableRefreshTimer: number | undefined;
    private readonly tableActionClickHandler = (event: Event) => {
        this.ngZone.run(() => {
            void this.handleTableActionClick(event);
        });
    };

    constructor(
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly ngZone: NgZone,
        private readonly activatedRoute: ActivatedRoute,
        private readonly router: Router,
    ) {
        this.applyRouteLabels();
        this.loadRecords();
    }

    private applyRouteLabels(): void {
        const data = this.activatedRoute.snapshot.data as {
            workEquipmentTitle?: string;
            workEquipmentSubtitle?: string;
            workEquipmentBreadcrumbLabel?: string;
        };

        this.pageTitle = data.workEquipmentTitle ?? this.pageTitle;
        this.pageSubtitle = data.workEquipmentSubtitle ?? this.pageSubtitle;
        this.breadcrumbLabel = data.workEquipmentBreadcrumbLabel ?? this.breadcrumbLabel;
    }

    // ── Subvistas (T24) ───────────────────────────────────────────────────────
    openCreateEditor(): void {
        // La suite E2E hace click en [data-testid=work-equipment-create] esperando "abrir el
        // formulario nuevo": con subvistas eso = activar la vista Nuevo equipo (idempotente).
        this.errorMessage = "";
        this.subview = "new";
    }

    openHistory(): void {
        this.subview = "history";
        this.scheduleTableRefresh();
    }

    goToLanding(): void {
        this.subview = "landing";

        this.destroyTable();
    }

    setHistoryRange(value: string): void {
        if (!HISTORY_RANGE_OPTIONS.some((option) => option.value === value)) {
            return;
        }

        const range = value as HistoryRangeKey;
        if (this.historyRange === range) {
            return;
        }

        this.destroyTable();
        this.tableVisible = false;
        this.historyRange = range;
        this.changeDetectorRef.detectChanges();
        this.scheduleTableRefresh();
    }

    currentRangeLabel(): string {
        return HISTORY_RANGE_OPTIONS.find((option) => option.value === this.historyRange)?.label ?? "Hoy";
    }

    private rangeStartMs(): number {
        const now = new Date();
        const DAY_MS = 24 * 60 * 60 * 1000;

        switch (this.historyRange) {
            case "hoy":
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            case "ultimos-15-dias":
                return now.getTime() - 15 * DAY_MS;
            case "ultimo-mes":
                return now.getTime() - 30 * DAY_MS;
            case "tres-meses":
                return now.getTime() - 90 * DAY_MS;
            default: {
                // "Esta semana" = desde el lunes local a las 00:00 hasta hoy.
                const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
                return monday.getTime();
            }
        }
    }

    /** Historial: solo el rango de fechas filtra (sin estados, sin warnings). */
    get historyRecords(): ProspectEquipmentRecord[] {
        const start = this.rangeStartMs();

        return this.records
            .filter((record) => {
                const timestamp = Date.parse(record.createdAt || record.updatedAt || "");
                if (Number.isNaN(timestamp)) {
                    return true; // sin fecha: se muestra en vez de ocultarse
                }

                return timestamp >= start;
            })
            .sort((a, b) => this.recordTimestamp(b) - this.recordTimestamp(a));
    }

    private recordTimestamp(record: ProspectEquipmentRecord): number {
        const parsed = Date.parse(record.createdAt || record.updatedAt || "");
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    // ── Celdas del Historial (4 columnas fijas pedidas por el cliente) ───────
    /** Código interno CO-YYMM-NNNN primero (mismo orden que detalle de prospecto,
        remisiones y kanban: equipmentCode > receivedIdentifier/serie). */
    equipmentCode(record: ProspectEquipmentRecord): string {
        const codes = record.items
            .map((item) => String(item.equipmentCode ?? "").trim() || String(item.receivedIdentifier || item.serie || "").trim())
            .filter(Boolean);

        if (codes.length > 0) {
            return Array.from(new Set(codes)).join(", ");
        }

        // Sin código interno ni serie/identificador: se usa el código de la recepción.
        return formatProspectEquipmentReception(record);
    }

    /** Serie(s) del equipo como línea secundaria (visible y buscable por DataTables). */
    equipmentSerie(record: ProspectEquipmentRecord): string {
        const serieSet = new Set<string>();
        for (const item of record.items) {
            const serie = String(item.serie || "").trim();
            if (!serie) continue;
            // Si la serie ya es el código mostrado, no se duplica.
            const code = String(item.receivedIdentifier || "").trim();
            if (code && serie.toLowerCase() === code.toLowerCase()) continue;
            serieSet.add(serie);
        }

        return Array.from(serieSet).join(", ");
    }

    receptionDate(record: ProspectEquipmentRecord): string {
        return record.createdAt || record.updatedAt || "";
    }

    servicePreview(record: ProspectEquipmentRecord): string[] {
        const names = Array.from(
            new Set(
                record.items
                    .map((item) => item.serviceTypeName.trim())
                    .filter(Boolean),
            ),
        );

        return names.length ? names : ["Sin servicio"];
    }

    formatReception(record: ProspectEquipmentRecord): string {
        return formatProspectEquipmentReception(record);
    }

    // ── Edición (overlay sobre la landing; el modal lo emite todo) ────────────
    openEditEditor(recordId: string): void {
        const normalizedId = recordId.trim();
        if (!normalizedId) {
            return;
        }

        this.errorMessage = "";
        this.crmEquipmentApi.getRecord(normalizedId, true).subscribe({
            next: (record) => {
                this.editorRecord = this.cloneRecord(record);
                this.editorProspect = this.resolveProspect(record);
                this.showEditor = true;
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                this.errorMessage = "No se pudo cargar la recepción para editar. Intenta nuevamente.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    closeEditor(): void {
        this.showEditor = false;
        this.editorRecord = null;
        this.editorProspect = { ...WORK_DIRECT_PROSPECT };
    }

    openWorkloadForAssignment(recordId: string): void {
        const record = this.records.find((entry) => entry.id === String(recordId ?? "").trim());
        if (!record) {
            return;
        }

        void this.router.navigate(["/app/work-workload"], {
            queryParams: { reception: record.id, focus: "assign" },
        });
    }

    handleSaved(): void {
        const wasEditing = Boolean(this.editorRecord);
        this.loadRecords();
        this.message = wasEditing ? "Registro actualizado correctamente." : "Registro creado correctamente.";
        this.errorMessage = "";
    }

    // ── Ciclo de vida / carga ─────────────────────────────────────────────────
    ngAfterViewInit(): void {
        this.hasViewInitialized = true;
        this.scheduleTableRefresh();
    }

    ngOnDestroy(): void {
        if (typeof window !== "undefined" && this.tableRefreshTimer !== undefined) {
            window.clearTimeout(this.tableRefreshTimer);
        }

        this.destroyTable();
        this.unbindTableActionHandler();
    }

    private loadRecords(): void {
        if (this.hasViewInitialized) {
            this.destroyTable();
            this.tableVisible = false;
        }

        this.isLoading = true;
        this.errorMessage = "";

        this.crmEquipmentApi.listRecords({ includeArchived: true }).subscribe({
            next: (records) => {
                this.records = records.map((record) => this.cloneRecord(record));
                this.isLoading = false;

                if (this.hasViewInitialized) {
                    this.changeDetectorRef.detectChanges();
                    this.scheduleTableRefresh();
                }
            },
            error: () => {
                this.records = [];
                this.isLoading = false;
                this.errorMessage = "No se pudieron cargar las recepciones desde la base de datos.";

                if (this.hasViewInitialized) {
                    this.changeDetectorRef.detectChanges();
                    this.scheduleTableRefresh();
                }
            },
        });
    }

    private resolveProspect(record: ProspectEquipmentRecord): ProspectRecord {
        const prospectKey = String(record.prospectId ?? "").trim();
        const existingProspect = prospectKey ? getProspectById(prospectKey) : undefined;
        if (existingProspect) {
            return existingProspect;
        }

        return {
            ...WORK_DIRECT_PROSPECT,
            id: prospectKey || WORK_DIRECT_PROSPECT.id,
            nombre: record.prospectName || WORK_DIRECT_PROSPECT.nombre,
            correo: record.email,
            movil: record.cellphone,
            nit: record.nit || WORK_DIRECT_PROSPECT.nit,
            compania: record.companyName || WORK_DIRECT_PROSPECT.compania,
            telefonoOficina: record.phone,
            ciudad: record.city,
            direccion: record.address,
        };
    }

    private cloneRecord(record: ProspectEquipmentRecord): ProspectEquipmentRecord {
        return {
            ...record,
            items: record.items.map((item) => ({
                ...item,
                evidencePhotos: item.evidencePhotos.map((photo) => ({ ...photo })),
                answers: { ...item.answers },
            })),
        };
    }

    // ── DataTables v2 (misma configuración probada; 5 columnas ahora) ─────────
    private scheduleTableRefresh(): void {
        if (!this.hasViewInitialized || typeof window === "undefined") {
            return;
        }

        if (this.tableRefreshTimer !== undefined) {
            window.clearTimeout(this.tableRefreshTimer);
        }

        this.tableRefreshTimer = window.setTimeout(() => {
            this.tableRefreshTimer = undefined;
            // La tabla solo se inicializa si la subvista visible es Historial y hay filas.
            const renderable = this.subview === "history" && this.historyRecords.length > 0;
            if (!renderable) {
                return;
            }

            this.tableVisible = true;
            this.changeDetectorRef.detectChanges();
            this.initializeTable();
        }, 0);
    }

    private initializeTable(): void {
        const tableElement = this.recordsTableRef?.nativeElement;
        if (!tableElement) {
            return;
        }

        this.bindTableActionHandler(tableElement);

        this.destroyTable();
        this.tableInstance = new DataTable(tableElement, {
            autoWidth: false,
            responsive: true,
            lengthChange: false,
            pageLength: 5,
            order: [[1, "desc"]], // Fecha de recepción descendente por defecto.
            columnDefs: [
                { orderable: false, targets: 4 },
                { responsivePriority: 1, targets: 0 },
                { responsivePriority: 2, targets: 3 },
                { responsivePriority: 3, targets: 1 },
                { responsivePriority: 4, targets: 2 },
                { className: "all", targets: 4 },
            ],
            language: {
                search: "Buscar:",
                zeroRecords: "No se encontraron recepciones.",
                emptyTable: "No hay recepciones registradas.",
                info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
                infoEmpty: "Mostrando 0 a 0 de 0 registros",
                infoFiltered: "(filtrados de _MAX_ registros)",
                paginate: {
                    previous: "Anterior",
                    next: "Siguiente",
                },
            },
        }) as { destroy: () => void };
    }

    private destroyTable(): void {
        if (!this.tableInstance) {
            return;
        }

        this.tableInstance.destroy();
        this.tableInstance = null;
    }

    private bindTableActionHandler(tableElement: HTMLTableElement): void {
        if (this.actionsTableElement === tableElement) {
            return;
        }

        this.unbindTableActionHandler();
        tableElement.addEventListener("click", this.tableActionClickHandler);
        this.actionsTableElement = tableElement;
    }

    private unbindTableActionHandler(): void {
        if (!this.actionsTableElement) {
            return;
        }

        this.actionsTableElement.removeEventListener("click", this.tableActionClickHandler);
        this.actionsTableElement = null;
    }

    private async handleTableActionClick(event: Event): Promise<void> {
        const target = event.target as HTMLElement | null;
        const button = target?.closest("button[data-testid]") as HTMLButtonElement | null;
        if (!button) {
            return;
        }

        const testId = String(button.getAttribute("data-testid") ?? "").trim();
        if (!testId) {
            return;
        }

        // T24: el Historial solo expone Editar y Asignar técnico.
        if (testId.startsWith("work-equipment-edit-")) {
            this.openEditEditor(testId.slice("work-equipment-edit-".length));
            return;
        }

        if (testId.startsWith("work-equipment-assign-")) {
            this.openWorkloadForAssignment(testId.slice("work-equipment-assign-".length));
        }
    }
}
