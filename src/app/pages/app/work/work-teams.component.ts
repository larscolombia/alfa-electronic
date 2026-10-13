import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import DataTable from "datatables.net-dt";
import "datatables.net-responsive-dt";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { CrmProspectEquipmentModalComponent } from "../crm/crm-prospect-equipment-modal.component";
import {
    ProspectEquipmentItem,
    ProspectEquipmentRecord,
    buildProspectEquipmentLabel,
    formatProspectEquipmentReception,
    getProspectEquipmentWarnings,
} from "../crm/crm-prospect-equipment.store";
import { ProspectRecord, getProspectById } from "../crm/crm-prospects.store";
import { CrmEquipmentApiService, EquipmentTechnicianOption } from "../../../services/crm-equipment-api.service";
import { AuthService } from "../../../services/auth.service";
import { ConfirmationModalService } from "../../../services/confirmation-modal.service";
import { WorkEquipmentHistoryContextService } from "../../../services/work-equipment-history-context.service";

type EquipmentFilter = "activos" | "sin_asignar" | "archivados" | "todos";

type EquipmentHistoryLink = {
    label: string;
    reference: string;
    identifier: string;
};

const SLA_GREEN_MAX_DAYS = 2;
const SLA_YELLOW_MAX_DAYS = 5;

const WORK_DIRECT_PROSPECT: ProspectRecord = {
    id: -9000,
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
    fuente: "Trabajo",
    categoria: "Operativo",
    branches: [],
};

@Component({
    selector: "app-work-teams",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, CrmProspectEquipmentModalComponent],
    styles: [
        `
            .work-equipment-filter {
                display: inline-flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .work-equipment-filter .btn {
                min-width: 110px;
            }

            .work-equipment-table-wrap {
                overflow-x: auto;
                overflow-y: visible;
            }

            .equipment-preview,
            .service-preview,
            .warning-preview {
                display: flex;
                flex-direction: column;
                gap: 0.2rem;
            }

            .warning-badge {
                background: rgba(255, 193, 7, 0.18);
                color: #8a5b00;
                border: 1px solid rgba(255, 193, 7, 0.38);
                width: fit-content;
            }

            .warning-tag {
                display: inline-flex;
                width: fit-content;
                padding: 0.15rem 0.45rem;
                border-radius: 999px;
                background: rgba(255, 193, 7, 0.12);
                color: #8a5b00;
            }

            .status-badge {
                min-width: 92px;
            }

            .sla-badge {
                min-width: 110px;
            }

            .sla-green {
                background: #198754;
                color: #fff;
            }

            .sla-yellow {
                background: #ffc107;
                color: #212529;
            }

            .sla-orange {
                background: #fd7e14;
                color: #fff;
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
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/work-projects">Ver proyectos</a>
                    <button class="btn btn-theme" type="button" data-testid="work-equipment-create" (click)="openCreateEditor()">Nuevo equipo</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">{{ breadcrumbLabel }}</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }

            @if (errorMessage) {
                <div class="alert alert-danger border mb-3">{{ errorMessage }}</div>
            }

            @if (isLoading) {
                <div class="alert alert-info border mb-3">Cargando recepciones desde la base de datos...</div>
            }

            @if (!isLoading && !errorMessage) {
                <div class="alert alert-light border mb-3 small">Fuente de datos: base de datos (API CRM Equipment).</div>
            }

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Recepciones activas</p>
                            <h4 class="mb-0">{{ activeRecordsCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Recepciones archivadas</p>
                            <h4 class="mb-0">{{ archivedRecordsCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Equipos activos</p>
                            <h4 class="mb-0">{{ activeItemsCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Evidencias activas</p>
                            <h4 class="mb-0">{{ activeEvidenceCount }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 gy-2 align-items-center">
                        <div class="col-12 col-lg">
                            <h6 class="mb-0">Listado de recepciones y equipos</h6>
                            <p class="small text-secondary mb-0">Edita, archiva o reactiva registros creados desde CRM o desde esta misma vista.</p>
                        </div>
                        <div class="col-12 col-lg-auto">
                            <div class="work-equipment-filter">
                                <button type="button" class="btn btn-sm" data-testid="work-equipment-filter-activos" [class.btn-theme]="activeFilter === 'activos'" [class.btn-outline-secondary]="activeFilter !== 'activos'" (click)="setFilter('activos')">Activos ({{ activeRecordsCount }})</button>
                                <button type="button" class="btn btn-sm" data-testid="work-equipment-filter-sin_asignar" [class.btn-theme]="activeFilter === 'sin_asignar'" [class.btn-outline-secondary]="activeFilter !== 'sin_asignar'" (click)="setFilter('sin_asignar')">Sin asignar ({{ unassignedRecordsCount }})</button>
                                <button type="button" class="btn btn-sm" data-testid="work-equipment-filter-archivados" [class.btn-theme]="activeFilter === 'archivados'" [class.btn-outline-secondary]="activeFilter !== 'archivados'" (click)="setFilter('archivados')">Archivados ({{ archivedRecordsCount }})</button>
                                <button type="button" class="btn btn-sm" data-testid="work-equipment-filter-todos" [class.btn-theme]="activeFilter === 'todos'" [class.btn-outline-secondary]="activeFilter !== 'todos'" (click)="setFilter('todos')">Todos ({{ records.length }})</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="px-3 py-2 border-bottom small text-secondary" data-testid="work-equipment-filter-summary">
                        Mostrando {{ visibleRecords.length }} {{ currentFilterSummaryLabel }}.
                    </div>
                    <div class="px-3 py-2 border-bottom small">
                        <span class="text-secondary me-2">SLA diagnóstico:</span>
                        <span class="badge sla-badge sla-green me-1">0-2 días</span>
                        <span class="badge sla-badge sla-yellow me-1">3-5 días</span>
                        <span class="badge sla-badge sla-orange">6+ días</span>
                    </div>
                    @if (!isLoading && visibleRecords.length > 0) {
                        <div class="table-responsive work-equipment-table-wrap">
                            @if (tableVisible) {
                            <table #recordsTable class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Recepción</th>
                                        <th>Empresa / contacto</th>
                                        <th>Origen</th>
                                        <th>Equipos</th>
                                        <th>Alertas</th>
                                        <th>Servicios</th>
                                        <th>Actualizado</th>
                                        <th>SLA diagnóstico</th>
                                        <th>Estado</th>
                                        <th class="text-end all">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (record of visibleRecords; track record.id) {
                                        <tr [attr.data-record-id]="record.id">
                                            <td>
                                                <div class="fw-semibold">{{ formatReception(record) }}</div>
                                                <div class="small text-secondary">{{ record.items.length }} equipo(s)</div>
                                            </td>
                                            <td>
                                                <div class="fw-semibold">{{ record.companyName || '--' }}</div>
                                                <div class="small text-secondary">{{ record.contactName || '--' }} · {{ record.city || 'Sin ciudad' }}</div>
                                            </td>
                                            <td>
                                                <div class="fw-semibold">{{ originLabel(record) }}</div>
                                                <div class="small text-secondary">{{ record.prospectName || 'Sin prospecto' }}</div>
                                            </td>
                                            <td>
                                                <div class="equipment-preview">
                                                    @for (entry of equipmentHistoryLinks(record); track entry.reference) {
                                                        <button
                                                            type="button"
                                                            class="btn btn-link btn-sm text-start text-decoration-none p-0"
                                                            (click)="openEquipmentHistory(entry.reference, entry.identifier)">
                                                            {{ entry.label }}
                                                        </button>
                                                    }
                                                </div>
                                                <div class="mt-3" *ngIf="record.items?.[0]?.youtubeLink">
                                                    <label class="form-label small fw-bold">Video de prueba (YouTube)</label>
                                                    <a [href]="record.items[0].youtubeLink" target="_blank" class="text-decoration-none" data-testid="youtube-link">
                                                        <i class="bi bi-youtube text-danger me-1"></i>{{ record.items[0].youtubeLink }}
                                                    </a>
                                                </div>
                                                <div class="mt-2" *ngIf="record.items?.[0]?.dispatchPhotos?.length">
                                                    <label class="form-label small fw-bold">Fotos de despacho</label>
                                                    <div class="d-flex gap-2 flex-wrap">
                                                        <img *ngFor="let photo of record.items[0].dispatchPhotos" [src]="photo.dataUrl" alt="Foto despacho" class="rounded" style="width:80px;height:80px;object-fit:cover;" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                @if (hasOperationalWarnings(record)) {
                                                    <div class="warning-preview">
                                                        <span class="badge warning-badge" [attr.data-testid]="'work-equipment-warning-badge-' + record.id">{{ recordWarningCount(record) }} warning(s)</span>
                                                        @for (warningLabel of warningPreview(record); track warningLabel) {
                                                            <span class="small warning-tag">{{ warningLabel }}</span>
                                                        }
                                                    </div>
                                                } @else {
                                                    <span class="badge text-bg-success">Sin warnings</span>
                                                }
                                            </td>
                                            <td>
                                                <div class="service-preview">
                                                    @for (serviceName of servicePreview(record); track serviceName) {
                                                        <span class="small">{{ serviceName }}</span>
                                                    }
                                                </div>
                                            </td>
                                            <td>{{ record.updatedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                                            <td>
                                                @if (hasDiagnosticItems(record)) {
                                                    <span class="badge sla-badge" [ngClass]="slaBadgeClass(record)">{{ slaBadgeLabel(record) }}</span>
                                                    <div class="small text-secondary mt-1">{{ diagnosticItemsCount(record) }} equipo(s) en diagnóstico</div>
                                                } @else {
                                                    <span class="badge text-bg-light sla-badge">Sin diagnóstico</span>
                                                }
                                            </td>
                                            <td>
                                                <span class="badge status-badge" [class.text-bg-success]="!record.archived" [class.text-bg-secondary]="record.archived">{{ record.archived ? 'Archivado' : 'Activo' }}</span>
                                            </td>
                                            <td class="text-end all">
                                                <button class="btn btn-sm btn-outline-theme me-2" type="button" [attr.data-testid]="'work-equipment-edit-' + record.id" title="Editar recepción">Editar</button>
                                                @if (!record.archived) {
                                                    <button class="btn btn-sm btn-outline-primary me-2" type="button" [attr.data-testid]="'work-equipment-assign-' + record.id">Asignar técnico</button>
                                                }
                                                @if (record.archived) {
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" [attr.data-testid]="'work-equipment-restore-' + record.id">Reactivar</button>
                                                } @else {
                                                    <button class="btn btn-sm btn-outline-danger" type="button" [attr.data-testid]="'work-equipment-archive-' + record.id">Archivar</button>
                                                }
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                            }
                        </div>
                    } @else if (!isLoading) {
                        <div class="px-4 py-5 text-center text-secondary" data-testid="work-equipment-empty-state">
                            No hay recepciones {{ currentFilterLabel }}.
                        </div>
                    }
                </div>
            </div>
        </div>

        @if (showEditor) {
            <app-crm-prospect-equipment-modal
                [prospect]="editorProspect"
                [initialRecord]="editorRecord"
                [navigateToProjectsOnSave]="false"
                (closed)="closeEditor()"
                (saved)="handleSaved()"></app-crm-prospect-equipment-modal>
        }

        @if (showAssignModal && assignmentRecord) {
            <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.55);" (click)="closeAssignModal()">
                <div class="modal-dialog modal-lg modal-dialog-scrollable" (click)="$event.stopPropagation()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div>
                                <h5 class="modal-title mb-1">Asignar técnico</h5>
                                <p class="small text-secondary mb-0">Recepción {{ formatReception(assignmentRecord) }} · {{ assignmentRecord.companyName || '--' }}</p>
                            </div>
                            <button type="button" class="btn-close" (click)="closeAssignModal()"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger border mb-3" *ngIf="assignErrorMessage">{{ assignErrorMessage }}</div>
                            <div class="alert alert-info border mb-3" *ngIf="assignLoading">Cargando técnicos por especialidad...</div>

                            <div class="vstack gap-3" *ngIf="!assignLoading">
                                <div class="border rounded p-3" *ngFor="let item of assignmentRecord.items; trackBy: trackByItemId">
                                    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                                        <div>
                                            <div class="fw-semibold">{{ buildItemLabel(item) }}</div>
                                            <div class="small text-secondary">Especialidad: {{ itemSpeciality(item) }}</div>
                                        </div>
                                        <div class="small text-secondary">Actual: {{ item.assignedTo || 'Sin asignar' }}</div>
                                    </div>

                                    <div class="row gx-2 gy-2 align-items-end">
                                        <div class="col-12 col-lg-8">
                                            <label class="form-label mb-1">Técnico responsable</label>
                                            <select
                                                class="form-select"
                                                [ngModel]="assignmentByItemId[item.id] || ''"
                                                [ngModelOptions]="{ standalone: true }"
                                                (ngModelChange)="assignmentByItemId[item.id] = $event">
                                                <option value="">Sin cambios</option>
                                                <option *ngFor="let technician of assignmentOptionsForItem(item)" [value]="technician.id">
                                                    {{ technician.name }} · {{ technician.role || 'Sin rol' }} · carga {{ technician.activeItems }}
                                                </option>
                                            </select>
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <button class="btn btn-outline-secondary w-100" type="button" (click)="reloadTechniciansForItem(item)">Actualizar lista</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" (click)="closeAssignModal()">Cancelar</button>
                            <button type="button" class="btn btn-theme" [disabled]="assignSaving || assignLoading" (click)="saveAssignments()">
                                {{ assignSaving ? 'Asignando...' : 'Guardar asignación' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        }
    `,
})
export class WorkTeamsComponent implements AfterViewInit, OnDestroy {
    @ViewChild("recordsTable") private readonly recordsTableRef?: ElementRef<HTMLTableElement>;

    records: ProspectEquipmentRecord[] = [];
    activeFilter: EquipmentFilter = "activos";
    message = "";
    errorMessage = "";
    isLoading = false;
    showEditor = false;
    tableVisible = true;
    editorRecord: ProspectEquipmentRecord | null = null;
    editorProspect: ProspectRecord = WORK_DIRECT_PROSPECT;
    showAssignModal = false;
    assignLoading = false;
    assignSaving = false;
    assignErrorMessage = "";
    assignmentRecord: ProspectEquipmentRecord | null = null;
    assignmentByItemId: Record<string, string> = {};
    assignmentTechniciansBySpeciality = new Map<string, EquipmentTechnicianOption[]>();
    assignmentTechniciansAll: EquipmentTechnicianOption[] = [];
    pageTitle = "Trabajo - Equipos";
    pageSubtitle = "CRUD de recepciones de equipos usando el mismo formulario operativo de CRM y una lista tipo datatable.";
    breadcrumbLabel = "Equipos";

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
        private readonly authService: AuthService,
        private readonly confirmationModal: ConfirmationModalService,
        private readonly equipmentHistoryContextService: WorkEquipmentHistoryContextService,
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

    get activeRecordsCount(): number {
        return this.records.filter((record) => !record.archived).length;
    }

    get archivedRecordsCount(): number {
        return this.records.filter((record) => record.archived).length;
    }

    get unassignedRecordsCount(): number {
        return this.records.filter((record) => !record.archived && !record.assignedTo).length;
    }

    get activeItemsCount(): number {
        return this.records
            .filter((record) => !record.archived)
            .reduce((sum, record) => sum + record.items.length, 0);
    }

    get activeEvidenceCount(): number {
        return this.records
            .filter((record) => !record.archived)
            .reduce((sum, record) => sum + record.items.reduce((itemSum, item) => itemSum + item.evidencePhotos.length, 0), 0);
    }

    get visibleRecords(): ProspectEquipmentRecord[] {
        switch (this.activeFilter) {
            case "sin_asignar":
                return this.records.filter((record) => !record.archived && !record.assignedTo);
            case "archivados":
                return this.records.filter((record) => record.archived);
            case "todos":
                return this.records;
            default:
                return this.records.filter((record) => !record.archived);
        }
    }

    get currentFilterLabel(): string {
        switch (this.activeFilter) {
            case "sin_asignar":
                return "sin asignar";
            case "archivados":
                return "archivadas";
            case "todos":
                return "totales";
            default:
                return "activas";
        }
    }

    get currentFilterSummaryLabel(): string {
        const singular = this.visibleRecords.length === 1;

        switch (this.activeFilter) {
            case "sin_asignar":
                return singular ? "recepción sin asignar" : "recepciones sin asignar";
            case "archivados":
                return singular ? "recepción archivada" : "recepciones archivadas";
            case "todos":
                return singular ? "recepción total" : "recepciones totales";
            default:
                return singular ? "recepción activa" : "recepciones activas";
        }
    }

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

    setFilter(filter: EquipmentFilter): void {
        if (this.activeFilter === filter) {
            return;
        }

        this.destroyTable();
        this.tableVisible = false;
        this.activeFilter = filter;
        this.changeDetectorRef.detectChanges();
        this.scheduleTableRefresh();
    }

    openCreateEditor(): void {
        this.editorRecord = null;
        this.editorProspect = { ...WORK_DIRECT_PROSPECT };
        this.showEditor = true;
    }

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

    openAssignModal(recordId: string): void {
        const normalizedID = String(recordId ?? "").trim();
        if (!normalizedID) {
            return;
        }

        this.assignLoading = true;
        this.assignSaving = false;
        this.assignErrorMessage = "";
        this.assignmentRecord = null;
        this.assignmentByItemId = {};
        this.assignmentTechniciansBySpeciality.clear();
        this.assignmentTechniciansAll = [];
        this.showAssignModal = true;

        this.crmEquipmentApi.getRecord(normalizedID, true).subscribe({
            next: (record) => {
                this.assignmentRecord = this.cloneRecord(record);
                this.assignmentByItemId = this.assignmentRecord.items.reduce<Record<string, string>>((acc, item) => {
                    acc[item.id] = String(item.assignedToId ?? "").trim();
                    return acc;
                }, {});

                const specialityKeys = Array.from(new Set(this.assignmentRecord.items.map((item) => this.itemSpeciality(item).toLowerCase()).filter(Boolean)));
                const specialityRequests = specialityKeys.map((speciality) =>
                    this.crmEquipmentApi.listTechnicians({ speciality }).pipe(catchError(() => of([] as EquipmentTechnicianOption[]))),
                );

                forkJoin({
                    all: this.crmEquipmentApi.listTechnicians().pipe(catchError(() => of([] as EquipmentTechnicianOption[]))),
                    bySpeciality: specialityRequests.length > 0 ? forkJoin(specialityRequests) : of([] as EquipmentTechnicianOption[][]),
                }).subscribe({
                    next: ({ all, bySpeciality }) => {
                        this.assignmentTechniciansAll = all;
                        this.assignmentTechniciansBySpeciality.clear();
                        bySpeciality.forEach((items, index) => {
                            this.assignmentTechniciansBySpeciality.set(specialityKeys[index], items);
                        });
                        this.assignLoading = false;
                        this.changeDetectorRef.detectChanges();
                    },
                    error: () => {
                        this.assignLoading = false;
                        this.assignErrorMessage = "No se pudieron cargar los técnicos para asignación.";
                        this.changeDetectorRef.detectChanges();
                    },
                });
            },
            error: () => {
                this.assignLoading = false;
                this.assignErrorMessage = "No se pudo abrir la recepción para asignación.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    closeAssignModal(): void {
        this.showAssignModal = false;
        this.assignLoading = false;
        this.assignSaving = false;
        this.assignErrorMessage = "";
        this.assignmentRecord = null;
        this.assignmentByItemId = {};
        this.assignmentTechniciansAll = [];
        this.assignmentTechniciansBySpeciality.clear();
    }

    itemSpeciality(item: ProspectEquipmentItem): string {
        return (item.serviceTypeName || item.familyName || item.tipo || "general").trim() || "general";
    }

    assignmentOptionsForItem(item: ProspectEquipmentItem): EquipmentTechnicianOption[] {
        const specialityKey = this.itemSpeciality(item).toLowerCase();
        const specific = this.assignmentTechniciansBySpeciality.get(specialityKey) ?? [];
        if (specific.length > 0) {
            return specific;
        }
        return this.assignmentTechniciansAll;
    }

    buildItemLabel(item: ProspectEquipmentItem): string {
        return buildProspectEquipmentLabel(item);
    }

    reloadTechniciansForItem(item: ProspectEquipmentItem): void {
        const speciality = this.itemSpeciality(item);
        const specialityKey = speciality.toLowerCase();
        this.crmEquipmentApi.listTechnicians({ speciality }).subscribe({
            next: (items) => {
                this.assignmentTechniciansBySpeciality.set(specialityKey, items);
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                this.assignErrorMessage = "No se pudo recargar la lista de técnicos para esta especialidad.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    saveAssignments(): void {
        if (!this.assignmentRecord) {
            return;
        }

        const pendingUpdates = this.assignmentRecord.items
            .map((item) => ({
                item,
                selectedID: String(this.assignmentByItemId[item.id] ?? "").trim(),
            }))
            .filter(({ item, selectedID }) => selectedID.length > 0 && selectedID !== String(item.assignedToId ?? "").trim());

        if (pendingUpdates.length === 0) {
            this.closeAssignModal();
            return;
        }

        this.assignSaving = true;
        this.assignErrorMessage = "";
        const assignedBy = this.authService.getCurrentUserName() || "jefe-tecnico";

        const requests = pendingUpdates.map(({ item, selectedID }) => {
            const selectedTechnician = this.assignmentOptionsForItem(item).find((technician) => technician.id === selectedID)
                ?? this.assignmentTechniciansAll.find((technician) => technician.id === selectedID);

            return this.crmEquipmentApi.assignItemTechnician(this.assignmentRecord!.id, item.id, {
                assignedToId: selectedID,
                assignedTo: selectedTechnician?.name || "",
                assignedAt: new Date().toISOString(),
                assignedBy,
            }).pipe(catchError(() => of(null)));
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                this.assignSaving = false;

                if (responses.some((entry) => entry === null)) {
                    this.assignErrorMessage = "Una o más asignaciones fallaron. Revisa la disponibilidad del técnico y reintenta.";
                    this.changeDetectorRef.detectChanges();
                    return;
                }

                this.closeAssignModal();
                this.loadRecords();
                this.message = "Asignación técnica actualizada correctamente.";
                this.errorMessage = "";
            },
            error: () => {
                this.assignSaving = false;
                this.assignErrorMessage = "No se pudo guardar la asignación técnica.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    handleSaved(): void {
        const wasEditing = Boolean(this.editorRecord);
        this.loadRecords();
        this.message = wasEditing ? "Registro actualizado correctamente." : "Registro creado correctamente.";
        this.errorMessage = "";
    }

    async archiveRecord(recordId: string): Promise<void> {
        const normalizedId = recordId.trim();
        const record = this.records.find((entry) => entry.id === normalizedId) ?? null;
        if (!record) {
            return;
        }

        const confirmed = await this.confirmationModal.open({
            title: "Archivar recepción",
            message: `Vas a archivar la recepción ${formatProspectEquipmentReception(record)}.`,
            confirmText: "Si, archivar",
            cancelText: "Cancelar",
            variant: "warning",
        });

        if (!confirmed) {
            return;
        }

        this.errorMessage = "";
        this.crmEquipmentApi.archiveRecord(normalizedId).subscribe({
            next: (archivedRecord) => {
                this.loadRecords();
                this.message = `Recepción ${formatProspectEquipmentReception(archivedRecord)} archivada correctamente.`;
            },
            error: () => {
                this.errorMessage = "No se pudo archivar la recepción en la base de datos.";
            },
        });
    }

    restoreRecord(recordId: string): void {
        const normalizedId = recordId.trim();
        if (!normalizedId) {
            return;
        }

        this.errorMessage = "";
        this.crmEquipmentApi.restoreRecord(normalizedId).subscribe({
            next: (restoredRecord) => {
                this.loadRecords();
                this.message = `Recepción ${formatProspectEquipmentReception(restoredRecord)} reactivada correctamente.`;
            },
            error: () => {
                this.errorMessage = "No se pudo reactivar la recepción en la base de datos.";
            },
        });
    }

    formatReception(record: ProspectEquipmentRecord): string {
        return formatProspectEquipmentReception(record);
    }

    originLabel(record: ProspectEquipmentRecord): string {
        return record.sourceContext === "work" ? "Trabajo > Equipos" : "CRM > Prospectos";
    }

    equipmentHistoryLinks(record: ProspectEquipmentRecord): EquipmentHistoryLink[] {
        return record.items.map((item) => {
            const fallbackLabel = [item.familyName, item.marca, item.tipo].map((value) => value.trim()).filter(Boolean).join(" · ");
            const label = buildProspectEquipmentLabel(item).trim() || fallbackLabel || "Equipo";

            return {
                label,
                reference: `${record.id}::${item.id}`,
                identifier: String(item.receivedIdentifier || item.serie || "").trim(),
            };
        });
    }

    trackByItemId(_: number, item: ProspectEquipmentItem): string {
        return item.id;
    }

    openEquipmentHistory(reference: string, identifier: string): void {
        const safeReference = String(reference ?? "").trim();
        const safeIdentifier = String(identifier ?? "").trim();
        if (!safeReference && !safeIdentifier) {
            return;
        }

        this.equipmentHistoryContextService.setContext({
            reference: safeReference,
            identifier: safeIdentifier,
            origin: "work-teams",
        });

        void this.router.navigate(["/app/work-equipment-history"]);
    }

    warningPreview(record: ProspectEquipmentRecord): string[] {
        const labels = Array.from(
            new Set(
                record.items.flatMap((item) => getProspectEquipmentWarnings(item).map((warning) => warning.label)),
            ),
        );

        if (labels.length <= 3) {
            return labels;
        }

        return [...labels.slice(0, 3), `+${labels.length - 3} más`];
    }

    recordWarningCount(record: ProspectEquipmentRecord): number {
        return record.items.reduce((sum, item) => sum + getProspectEquipmentWarnings(item).length, 0);
    }

    hasOperationalWarnings(record: ProspectEquipmentRecord): boolean {
        return this.recordWarningCount(record) > 0;
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

    diagnosticItemsCount(record: ProspectEquipmentRecord): number {
        return record.items.filter((item) => item.repairStatus === "diagnostico").length;
    }

    hasDiagnosticItems(record: ProspectEquipmentRecord): boolean {
        return this.diagnosticItemsCount(record) > 0;
    }

    slaBadgeClass(record: ProspectEquipmentRecord): string {
        const days = this.diagnosticAgingDays(record);
        if (days === null) {
            return "text-bg-light";
        }

        if (days <= SLA_GREEN_MAX_DAYS) {
            return "sla-green";
        }

        if (days <= SLA_YELLOW_MAX_DAYS) {
            return "sla-yellow";
        }

        return "sla-orange";
    }

    slaBadgeLabel(record: ProspectEquipmentRecord): string {
        const days = this.diagnosticAgingDays(record);
        if (days === null) {
            return "Sin diagnóstico";
        }

        return `${days} día${days === 1 ? "" : "s"}`;
    }

    private diagnosticAgingDays(record: ProspectEquipmentRecord): number | null {
        const daysInDiagnostic = record.items
            .filter((item) => item.repairStatus === "diagnostico")
            .map((item) => this.daysSince(item.repairStatusUpdatedAt || record.updatedAt || record.createdAt))
            .filter((days): days is number => days !== null);

        if (daysInDiagnostic.length === 0) {
            return null;
        }

        return Math.max(...daysInDiagnostic);
    }

    private daysSince(value: string): number | null {
        const timestamp = Date.parse(value);
        if (Number.isNaN(timestamp)) {
            return null;
        }

        const diff = Date.now() - timestamp;
        if (diff <= 0) {
            return 0;
        }

        return Math.floor(diff / (1000 * 60 * 60 * 24));
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
        const parsedProspectId = Number.parseInt(String(record.prospectId ?? ""), 10);
        const existingProspect = Number.isFinite(parsedProspectId) ? getProspectById(parsedProspectId) : undefined;
        if (existingProspect) {
            return existingProspect;
        }

        return {
            ...WORK_DIRECT_PROSPECT,
            id: Number.isFinite(parsedProspectId) && parsedProspectId !== 0 ? parsedProspectId : WORK_DIRECT_PROSPECT.id,
            nombre: record.prospectName || WORK_DIRECT_PROSPECT.nombre,
            correo: record.email,
            movil: record.cellphone,
            nit: record.nit || WORK_DIRECT_PROSPECT.nit,
            compania: record.companyName || WORK_DIRECT_PROSPECT.compania,
            telefonoOficina: record.phone,
            ciudad: record.city,
            direccion: record.address,
            fuente: record.sourceContext === "work" ? "Trabajo" : WORK_DIRECT_PROSPECT.fuente,
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

    private scheduleTableRefresh(): void {
        if (!this.hasViewInitialized || typeof window === "undefined") {
            return;
        }

        if (this.tableRefreshTimer !== undefined) {
            window.clearTimeout(this.tableRefreshTimer);
        }

        this.tableRefreshTimer = window.setTimeout(() => {
            this.tableRefreshTimer = undefined;
            this.tableVisible = this.visibleRecords.length > 0;
            this.changeDetectorRef.detectChanges();
            if (this.tableVisible) {
                this.initializeTable();
            }
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
            pageLength: 10,
            order: [[5, "desc"]],
            columnDefs: [
                { orderable: false, targets: 9 },
                { responsivePriority: 1, targets: 9 },
                { responsivePriority: 2, targets: 0 },
                { className: "all", targets: 9 },
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

        if (testId.startsWith("work-equipment-edit-")) {
            this.openEditEditor(testId.slice("work-equipment-edit-".length));
            return;
        }

        if (testId.startsWith("work-equipment-archive-")) {
            await this.archiveRecord(testId.slice("work-equipment-archive-".length));
            return;
        }

        if (testId.startsWith("work-equipment-assign-")) {
            this.openAssignModal(testId.slice("work-equipment-assign-".length));
            return;
        }

        if (testId.startsWith("work-equipment-restore-")) {
            this.restoreRecord(testId.slice("work-equipment-restore-".length));
        }
    }
}