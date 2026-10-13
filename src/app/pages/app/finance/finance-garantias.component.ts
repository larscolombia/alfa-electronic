import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

type WarrantyStatus = "Vigente" | "Por vencer" | "Vencida" | "Cerrada";
type ExpirationWindow = "all" | "next7" | "next30" | "expired";
type WarrantyPhase = "en-revision" | "esperando-componentes" | "en-reparacion" | "lista";

interface WarrantyRecord {
    id: number;
    code: string;
    client: string;
    equipment: string;
    startedAt: string;
    expiresAt: string;
    followUpAt: string;
    owner: string;
    notes: string;
    status: WarrantyStatus;
    phase: WarrantyPhase;
}

interface WarrantyDraft {
    client: string;
    equipment: string;
    startedAt: string;
    expiresAt: string;
    followUpAt: string;
    owner: string;
    notes: string;
    status: WarrantyStatus;
    phase: WarrantyPhase;
}

const WARRANTIES_STORAGE_KEY = "adminux.finance.warranties.v2";

@Component({
    selector: "app-finance-garantias",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Garantias</h5>
                    <p class="text-secondary small mb-0">Ciclo de garantias y seguimiento por vencimiento de servicios y equipos.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    @if (viewMode === "list") {
                        <button class="btn btn-theme" type="button" (click)="openCreateForm()"><i class="bi bi-plus-lg me-2"></i>Nueva garantia</button>
                    } @else {
                        <button class="btn btn-outline-secondary" type="button" (click)="goToList()">Ver listado</button>
                    }
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Trabajo</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Garantias</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (successMessage) {
                <div class="alert alert-success border mb-3">{{ successMessage }}</div>
            }
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            @if (viewMode === "list") {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-body">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Buscar</label>
                                <input class="form-control" type="text" placeholder="Cliente, equipo, codigo o responsable" [(ngModel)]="searchTerm" name="searchTerm" />
                            </div>
                            <div class="col-12 col-md-6 col-lg-3">
                                <label class="form-label">Estado</label>
                                <select class="form-select" [(ngModel)]="selectedStatus" name="selectedStatus">
                                    <option value="">Todos</option>
                                    @for (status of statusFilters; track status) {
                                        <option [value]="status">{{ status }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-md-6 col-lg-3">
                                <label class="form-label">Fase interna</label>
                                <select class="form-select" [(ngModel)]="selectedPhase" name="selectedPhase">
                                    <option value="">Todas</option>
                                    @for (opt of phaseOptions; track opt.id) {
                                        <option [value]="opt.id">{{ opt.label }}</option>
                                    }
                                </select>
                            </div>
                        </div>
                        <div class="row gx-3 gy-3 mt-1 align-items-end">
                            <div class="col-12 col-md-6 col-lg-3">
                                <label class="form-label">Ventana de vencimiento</label>
                                <select class="form-select" [(ngModel)]="selectedWindow" name="selectedWindow">
                                    <option value="all">Todas</option>
                                    <option value="next7">Proximos 7 dias</option>
                                    <option value="next30">Proximos 30 dias</option>
                                    <option value="expired">Solo vencidas</option>
                                </select>
                            </div>
                            <div class="col-12 col-lg-2 d-grid">
                                <button class="btn btn-outline-secondary" type="button" (click)="clearFilters()">Limpiar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Codigo</th>
                                        <th>Cliente</th>
                                        <th>Equipo / Servicio</th>
                                        <th>Inicio</th>
                                        <th>Vence</th>
                                        <th>Dias restantes</th>
                                        <th>Proximo seguimiento</th>
                                        <th>Responsable</th>
                                        <th>Fase</th>
                                        <th>Estado</th>
                                        <th class="text-end">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (record of filteredRecords; track record.id) {
                                        <tr>
                                            <td>{{ record.code }}</td>
                                            <td>{{ record.client }}</td>
                                            <td>{{ record.equipment }}</td>
                                            <td>{{ record.startedAt | date: "dd/MM/yyyy" }}</td>
                                            <td>{{ record.expiresAt | date: "dd/MM/yyyy" }}</td>
                                            <td>
                                                <span [class.text-danger]="remainingDays(record) <= 0" [class.text-warning]="remainingDays(record) > 0 && remainingDays(record) <= 15" [class.text-success]="remainingDays(record) > 15">
                                                    {{ remainingDaysLabel(record) }}
                                                </span>
                                            </td>
                                            <td>{{ record.followUpAt | date: "dd/MM/yyyy" }}</td>
                                            <td>{{ record.owner || "--" }}</td>
                                            <td>
                                                <span class="badge rounded-pill"
                                                    [class.text-bg-info]="record.phase === 'en-revision'"
                                                    [class.text-bg-warning]="record.phase === 'esperando-componentes'"
                                                    [class.text-bg-primary]="record.phase === 'en-reparacion'"
                                                    [class.text-bg-success]="record.phase === 'lista'"
                                                >
                                                    {{ phaseLabel(record.phase) }}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    class="badge rounded-pill"
                                                    [class.text-bg-success]="record.status === 'Vigente'"
                                                    [class.text-bg-warning]="record.status === 'Por vencer'"
                                                    [class.text-bg-danger]="record.status === 'Vencida'"
                                                    [class.text-bg-secondary]="record.status === 'Cerrada'"
                                                >
                                                    {{ record.status }}
                                                </span>
                                            </td>
                                            <td class="text-end">
                                                <div class="d-flex justify-content-end gap-1">
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editWarranty(record.id)">Editar</button>
                                                    <button class="btn btn-sm" [class.btn-outline-theme]="record.status !== 'Cerrada'" [class.btn-outline-warning]="record.status === 'Cerrada'" type="button" (click)="toggleClosed(record.id)">
                                                        {{ record.status === "Cerrada" ? "Reabrir" : "Cerrar" }}
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeWarranty(record.id)">Eliminar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="11" class="text-center py-4 text-secondary">No hay garantias para el filtro aplicado.</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-3">
                        <p class="small text-secondary mb-0">Mostrando {{ filteredRecords.length }} de {{ warranties.length }} garantias.</p>
                    </div>
                </div>
            } @else {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{ editingId === null ? "Nueva garantia" : "Editar garantia" }}</h6>
                    </div>
                    <div class="card-body">
                        <form (ngSubmit)="saveWarranty()" novalidate>
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Cliente</label>
                                    <input class="form-control" type="text" [(ngModel)]="draft.client" name="client" placeholder="Nombre del cliente" required />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Equipo / Servicio</label>
                                    <input class="form-control" type="text" [(ngModel)]="draft.equipment" name="equipment" placeholder="Activo cubierto" required />
                                </div>
                                <div class="col-12 col-lg-2">
                                    <label class="form-label">Inicio</label>
                                    <input class="form-control" type="date" [(ngModel)]="draft.startedAt" name="startedAt" required />
                                </div>
                                <div class="col-12 col-lg-2">
                                    <label class="form-label">Vencimiento</label>
                                    <input class="form-control" type="date" [(ngModel)]="draft.expiresAt" name="expiresAt" required />
                                </div>
                                <div class="col-12 col-lg-2">
                                    <label class="form-label">Seguimiento</label>
                                    <input class="form-control" type="date" [(ngModel)]="draft.followUpAt" name="followUpAt" required />
                                </div>

                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Responsable</label>
                                    <input class="form-control" type="text" [(ngModel)]="draft.owner" name="owner" placeholder="Ej: Equipo comercial" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" [(ngModel)]="draft.status" name="status">
                                        @for (status of statusFilters; track status) {
                                            <option [value]="status">{{ status }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Fase interna</label>
                                    <select class="form-select" [(ngModel)]="draft.phase" name="phase">
                                        @for (opt of phaseOptions; track opt.id) {
                                            <option [value]="opt.id">{{ opt.label }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-5">
                                    <label class="form-label">Notas</label>
                                    <input class="form-control" type="text" [(ngModel)]="draft.notes" name="notes" placeholder="Detalle del caso o cobertura" />
                                </div>
                            </div>

                            <div class="mt-3 d-flex gap-2">
                                <button class="btn btn-theme" type="submit">Guardar</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="goToList()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </div>
    `,
})
export class FinanceGarantiasComponent {
    readonly statusFilters: WarrantyStatus[] = ["Vigente", "Por vencer", "Vencida", "Cerrada"];
    readonly phaseOptions: { id: WarrantyPhase; label: string }[] = [
        { id: "en-revision", label: "En revision" },
        { id: "esperando-componentes", label: "Esperando componentes" },
        { id: "en-reparacion", label: "En reparacion" },
        { id: "lista", label: "Lista para entrega" },
    ];

    viewMode: "list" | "form" = "list";
    warranties: WarrantyRecord[] = [];
    editingId: number | null = null;

    searchTerm = "";
    selectedStatus: WarrantyStatus | "" = "";
    selectedPhase: WarrantyPhase | "" = "";
    selectedWindow: ExpirationWindow = "all";

    successMessage = "";
    formError = "";

    draft: WarrantyDraft = this.createDefaultDraft();

    constructor() {
        this.warranties = this.normalizeStatuses(this.loadWarranties());
    }

    get filteredRecords(): WarrantyRecord[] {
        const normalizedSearch = this.searchTerm.trim().toLowerCase();

        return this.normalizeStatuses(this.warranties).filter((record) => {
            const matchesStatus = this.selectedStatus ? record.status === this.selectedStatus : true;
            const matchesPhase = this.selectedPhase ? record.phase === this.selectedPhase : true;
            const matchesWindow = this.matchesWindow(record, this.selectedWindow);

            const searchable = [record.code, record.client, record.equipment, record.owner, record.notes].join(" ").toLowerCase();
            const matchesSearch = normalizedSearch ? searchable.includes(normalizedSearch) : true;

            return matchesStatus && matchesPhase && matchesWindow && matchesSearch;
        });
    }

    phaseLabel(phase: WarrantyPhase): string {
        return this.phaseOptions.find((opt) => opt.id === phase)?.label ?? phase;
    }

    openCreateForm(): void {
        this.viewMode = "form";
        this.editingId = null;
        this.formError = "";
        this.successMessage = "";
        this.draft = this.createDefaultDraft();
    }

    goToList(): void {
        this.viewMode = "list";
        this.editingId = null;
        this.formError = "";
        this.draft = this.createDefaultDraft();
    }

    editWarranty(id: number): void {
        const record = this.warranties.find((item) => item.id === id);
        if (!record) {
            return;
        }

        this.viewMode = "form";
        this.editingId = id;
        this.formError = "";
        this.successMessage = "";
        this.draft = {
            client: record.client,
            equipment: record.equipment,
            startedAt: record.startedAt,
            expiresAt: record.expiresAt,
            followUpAt: record.followUpAt,
            owner: record.owner,
            notes: record.notes,
            status: record.status,
            phase: record.phase,
        };
    }

    saveWarranty(): void {
        this.formError = "";
        this.successMessage = "";

        const client = this.draft.client.trim();
        const equipment = this.draft.equipment.trim();
        const owner = this.draft.owner.trim();
        const notes = this.draft.notes.trim();

        if (!client || !equipment) {
            this.formError = "Cliente y equipo/servicio son obligatorios.";
            return;
        }

        if (!this.draft.startedAt || !this.draft.expiresAt || !this.draft.followUpAt) {
            this.formError = "Debes completar inicio, vencimiento y seguimiento.";
            return;
        }

        if (this.draft.expiresAt < this.draft.startedAt) {
            this.formError = "La fecha de vencimiento debe ser posterior al inicio.";
            return;
        }

        const nextStatus = this.draft.status === "Cerrada" ? "Cerrada" : this.statusFromDates(this.draft.expiresAt);

        if (this.editingId === null) {
            const nextRecord: WarrantyRecord = {
                id: Date.now(),
                code: this.buildWarrantyCode(),
                client,
                equipment,
                startedAt: this.draft.startedAt,
                expiresAt: this.draft.expiresAt,
                followUpAt: this.draft.followUpAt,
                owner,
                notes,
                status: nextStatus,
                phase: this.draft.phase,
            };

            this.warranties = [nextRecord, ...this.warranties];
            this.successMessage = `Garantia ${nextRecord.code} creada correctamente.`;
        } else {
            this.warranties = this.warranties.map((record) => {
                if (record.id !== this.editingId) {
                    return record;
                }

                return {
                    ...record,
                    client,
                    equipment,
                    startedAt: this.draft.startedAt,
                    expiresAt: this.draft.expiresAt,
                    followUpAt: this.draft.followUpAt,
                    owner,
                    notes,
                    status: nextStatus,
                    phase: this.draft.phase,
                };
            });
            this.successMessage = "Garantia actualizada correctamente.";
        }

        this.persistWarranties();
        this.goToList();
    }

    removeWarranty(id: number): void {
        this.warranties = this.warranties.filter((record) => record.id !== id);
        this.persistWarranties();
        this.successMessage = "Garantia eliminada.";
    }

    toggleClosed(id: number): void {
        this.warranties = this.warranties.map((record) => {
            if (record.id !== id) {
                return record;
            }

            if (record.status === "Cerrada") {
                return {
                    ...record,
                    status: this.statusFromDates(record.expiresAt),
                };
            }

            return {
                ...record,
                status: "Cerrada",
            };
        });

        this.persistWarranties();
        this.successMessage = "Estado de garantia actualizado.";
    }

    clearFilters(): void {
        this.searchTerm = "";
        this.selectedStatus = "";
        this.selectedPhase = "";
        this.selectedWindow = "all";
    }

    remainingDays(record: WarrantyRecord): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiration = new Date(`${record.expiresAt}T00:00:00`);
        if (Number.isNaN(expiration.getTime())) {
            return 0;
        }

        const diffInMs = expiration.getTime() - today.getTime();
        return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    }

    remainingDaysLabel(record: WarrantyRecord): string {
        if (record.status === "Cerrada") {
            return "Cerrada";
        }

        const days = this.remainingDays(record);
        if (days === 0) {
            return "Vence hoy";
        }

        if (days < 0) {
            return `${Math.abs(days)} dia(s) vencida`;
        }

        return `${days} dia(s)`;
    }

    private createDefaultDraft(): WarrantyDraft {
        const today = this.todayIso();
        return {
            client: "",
            equipment: "",
            startedAt: today,
            expiresAt: this.addDaysIso(90),
            followUpAt: this.addDaysIso(15),
            owner: "",
            notes: "",
            status: "Vigente",
            phase: "en-revision",
        };
    }

    private loadWarranties(): WarrantyRecord[] {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            return this.defaultWarranties();
        }

        const rawValue = window.localStorage.getItem(WARRANTIES_STORAGE_KEY);
        if (!rawValue) {
            return this.defaultWarranties();
        }

        try {
            const parsed = JSON.parse(rawValue) as WarrantyRecord[];
            return Array.isArray(parsed) ? parsed : this.defaultWarranties();
        } catch {
            return this.defaultWarranties();
        }
    }

    private persistWarranties(): void {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            return;
        }

        window.localStorage.setItem(WARRANTIES_STORAGE_KEY, JSON.stringify(this.warranties));
    }

    private normalizeStatuses(records: WarrantyRecord[]): WarrantyRecord[] {
        return records.map((record) => {
            const phase = record.phase || "en-revision";
            if (record.status === "Cerrada") {
                return { ...record, phase };
            }

            return {
                ...record,
                status: this.statusFromDates(record.expiresAt),
                phase,
            };
        });
    }

    private statusFromDates(expiresAt: string): WarrantyStatus {
        const days = this.remainingDays({
            id: 0,
            code: "",
            client: "",
            equipment: "",
            startedAt: "",
            expiresAt,
            followUpAt: "",
            owner: "",
            notes: "",
            status: "Vigente",
            phase: "en-revision",
        });

        if (days <= 0) {
            return "Vencida";
        }

        if (days <= 15) {
            return "Por vencer";
        }

        return "Vigente";
    }

    private matchesWindow(record: WarrantyRecord, window: ExpirationWindow): boolean {
        if (record.status === "Cerrada") {
            return window === "all";
        }

        const days = this.remainingDays(record);

        if (window === "next7") {
            return days >= 0 && days <= 7;
        }

        if (window === "next30") {
            return days >= 0 && days <= 30;
        }

        if (window === "expired") {
            return days <= 0;
        }

        return true;
    }

    private buildWarrantyCode(): string {
        const nextNumber = this.warranties.length + 1;
        return `GAR-${new Date().getFullYear()}-${nextNumber.toString().padStart(4, "0")}`;
    }

    private todayIso(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private addDaysIso(days: number): string {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }

    private defaultWarranties(): WarrantyRecord[] {
        return [
            {
                id: 1,
                code: "GAR-2026-0001",
                client: "Impresos Norte SAS",
                equipment: "Fuente industrial 24V",
                startedAt: "2026-01-20",
                expiresAt: "2026-05-20",
                followUpAt: "2026-04-25",
                owner: "Equipo Comercial",
                notes: "Cobertura por cambio de componente.",
                status: "Por vencer",
                phase: "en-reparacion",
            },
            {
                id: 2,
                code: "GAR-2026-0002",
                client: "Grupo Restrepo",
                equipment: "Main Board Rev C",
                startedAt: "2026-02-10",
                expiresAt: "2026-06-30",
                followUpAt: "2026-05-30",
                owner: "Soporte Tecnico",
                notes: "Aplican revisiones preventivas.",
                status: "Vigente",
                phase: "esperando-componentes",
            },
            {
                id: 3,
                code: "GAR-2026-0003",
                client: "Cardenas Digital",
                equipment: "Kit IGBT FGA25N120",
                startedAt: "2025-12-15",
                expiresAt: "2026-03-15",
                followUpAt: "2026-03-10",
                owner: "Postventa",
                notes: "Pendiente cierre documental.",
                status: "Vencida",
                phase: "lista",
            },
        ];
    }
}
