import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subscription, combineLatest } from "rxjs";
import { BoardColumn } from "../projects/models";
import { PROJECT_WORKFLOW_STATUS_OPTIONS } from "../projects/project-workflow.config";
import { ProjectService } from "../projects/services";

interface ColumnDraft {
    name: string;
    color: string;
    description: string;
    equipmentStatusId: string;
    greenDays: number;
    yellowDays: number;
    includeInWorkload: boolean;
    trackAging: boolean;
}

@Component({
    selector: "app-company-projects-config",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Config. Proyectos</h5>
                    <p class="text-secondary small mb-0">Crea, edita y ordena las columnas del tablero de proyectos.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    @if (viewMode === "list") {
                        <div class="d-flex flex-wrap justify-content-sm-end gap-2">
                            <button class="btn btn-outline-secondary" type="button" data-testid="company-projects-reset-technical-flow" (click)="resetTechnicalFlow()">
                                <i class="bi bi-arrow-counterclockwise me-2"></i>Reset tecnico
                            </button>
                            <button class="btn btn-theme" type="button" data-testid="company-projects-new-column" (click)="openCreateForm()"><i class="bi bi-plus-lg me-2"></i>Nueva columna</button>
                        </div>
                    } @else {
                        <button class="btn btn-outline-secondary" type="button" data-testid="company-projects-view-columns" (click)="goToList()">Ver columnas</button>
                    }
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Company</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Config. Proyectos</li>
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
            @if (slaSaveMessage) {
                <div class="alert border mb-3" [class.alert-success]="!slaSaveIsError" [class.alert-danger]="slaSaveIsError" data-testid="sla-config-save-msg">{{ slaSaveMessage }}</div>
            }

            @if (viewMode === "list") {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{ boardName }}</h6>
                        <p class="text-secondary small mb-0">Fuente maestra del flujo tecnico. Lo que configures aqui debe verse igual en Trabajo y Carga laboral.</p>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th style="width: 110px">Orden</th>
                                        <th>Columna</th>
                                        <th style="width: 220px">Estado tecnico</th>
                                        <th style="width: 170px">SLA</th>
                                        <th style="width: 140px">Carga</th>
                                        <th style="width: 130px">Proyectos</th>
                                        <th class="text-end" style="width: 260px">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (column of columns; track column.id; let i = $index) {
                                        <tr>
                                            <td>
                                                <span class="badge text-bg-light border">#{{ i + 1 }}</span>
                                            </td>
                                            <td>
                                                <div class="d-flex align-items-center gap-2">
                                                    <span class="column-dot" [style.background]="column.color"></span>
                                                    <div>
                                                        <div class="fw-semibold">{{ column.name }}</div>
                                                        <small class="text-secondary">ID: {{ column.id }}</small>
                                                        @if (column.description) {
                                                            <div><small class="text-secondary">{{ column.description }}</small></div>
                                                        }
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="d-flex align-items-center gap-2">
                                                    <span class="column-color-preview" [style.background]="column.color"></span>
                                                    <div>
                                                        <div class="fw-semibold">{{ resolveEquipmentStatusLabel(column.equipmentStatusId) }}</div>
                                                        <small class="text-secondary">{{ column.color }}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                @if (column.trackAging) {
                                                    <span class="badge rounded-pill text-bg-light border">{{ column.greenDays ?? 0 }} verde / {{ column.yellowDays ?? 0 }} amarillo</span>
                                                } @else {
                                                    <span class="badge rounded-pill text-bg-secondary">Sin SLA</span>
                                                }
                                            </td>
                                            <td>
                                                <span class="badge rounded-pill" [class.text-bg-success]="column.includeInWorkload" [class.text-bg-light]="!column.includeInWorkload">
                                                    {{ column.includeInWorkload ? 'Cuenta' : 'No cuenta' }}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="badge rounded-pill text-bg-primary">{{ getProjectsCount(column.id) }}</span>
                                            </td>
                                            <td class="text-end">
                                                <div class="d-flex justify-content-end gap-1">
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" [attr.data-testid]="'company-projects-move-up-' + column.id" [attr.aria-label]="'Subir columna ' + column.name" (click)="moveColumn(column.id, 'up')" [disabled]="i === 0">
                                                        <i class="bi bi-arrow-up"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" [attr.data-testid]="'company-projects-move-down-' + column.id" [attr.aria-label]="'Bajar columna ' + column.name" (click)="moveColumn(column.id, 'down')" [disabled]="i === columns.length - 1">
                                                        <i class="bi bi-arrow-down"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-theme" type="button" [attr.data-testid]="'company-projects-edit-' + column.id" (click)="editColumn(column)">Editar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="7" class="text-center py-4 text-secondary">No hay columnas configuradas.</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-3">
                        <p class="small text-secondary mb-0">Total columnas: {{ columns.length }}.</p>
                    </div>
                </div>
            } @else {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{ editingColumnId === null ? "Nueva columna" : "Editar columna" }}</h6>
                    </div>
                    <div class="card-body">
                        <form (ngSubmit)="saveColumn()" novalidate>
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Nombre de columna</label>
                                    <input class="form-control" type="text" [(ngModel)]="draft.name" name="columnName" placeholder="Ej: En QA" maxlength="50" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Color</label>
                                    <input class="form-control form-control-color w-100" type="color" [(ngModel)]="draft.color" name="columnColor" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Estado tecnico asociado</label>
                                    <select class="form-select" [(ngModel)]="draft.equipmentStatusId" name="columnStatus">
                                        <option value="">Sin sincronizacion</option>
                                        @for (option of equipmentStatusOptions; track option.id) {
                                            <option [value]="option.id">{{ option.label }}</option>
                                        }
                                    </select>
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Descripcion operativa</label>
                                    <textarea class="form-control" rows="2" [(ngModel)]="draft.description" name="columnDescription" placeholder="Explica en que momento entra y sale esta etapa"></textarea>
                                </div>

                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Dias en verde</label>
                                    <input class="form-control" type="number" min="0" [(ngModel)]="draft.greenDays" name="columnGreenDays" />
                                </div>

                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Dias en amarillo</label>
                                    <input class="form-control" type="number" min="0" [(ngModel)]="draft.yellowDays" name="columnYellowDays" />
                                </div>

                                <div class="col-12 col-lg-3 d-flex align-items-end">
                                    <label class="form-check mb-0">
                                        <input class="form-check-input" type="checkbox" [(ngModel)]="draft.trackAging" name="columnTrackAging" />
                                        <span class="form-check-label">Aplicar semaforo SLA</span>
                                    </label>
                                </div>

                                <div class="col-12 col-lg-3 d-flex align-items-end">
                                    <label class="form-check mb-0">
                                        <input class="form-check-input" type="checkbox" [(ngModel)]="draft.includeInWorkload" name="columnIncludeInWorkload" />
                                        <span class="form-check-label">Contar en carga laboral</span>
                                    </label>
                                </div>
                            </div>

                            <div class="mt-3 d-flex gap-2">
                                <button class="btn btn-theme" type="submit" data-testid="company-projects-save-column">Guardar</button>
                                <button class="btn btn-outline-secondary" type="button" data-testid="company-projects-cancel-column" (click)="goToList()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [
        `
            .column-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .column-color-preview {
                width: 22px;
                height: 22px;
                border-radius: 6px;
                border: 1px solid rgba(0, 0, 0, 0.12);
                flex-shrink: 0;
            }
        `,
    ],
})
export class CompanyProjectsConfigComponent implements OnInit, OnDestroy {
    viewMode: "list" | "form" = "list";
    boardName = "Proyectos";
    readonly equipmentStatusOptions = PROJECT_WORKFLOW_STATUS_OPTIONS;

    columns: BoardColumn[] = [];
    projectCountByColumn: Record<string, number> = {};

    editingColumnId: string | null = null;
    draft: ColumnDraft = this.createDefaultDraft();

    successMessage = "";
    formError = "";
    slaSaveMessage = "";
    slaSaveIsError = false;

    private boardSub?: Subscription;

    constructor(private projectService: ProjectService) {}

    ngOnInit(): void {
        this.boardSub = combineLatest([this.projectService.board$, this.projectService.projects$]).subscribe({
            next: ([board, projects]) => {
                this.applyBoardState(board, projects);
            },
        });
    }

    ngOnDestroy(): void {
        this.boardSub?.unsubscribe();
    }

    private applyBoardState(board: { name: string; columns: BoardColumn[] } | null, projects: { status: string }[]): void {
        if (!board) {
            this.columns = [];
            this.projectCountByColumn = {};
            return;
        }

        this.boardName = board.name;
        this.columns = [...board.columns].sort((a, b) => a.order - b.order);

        const counters: Record<string, number> = {};
        for (const project of projects) {
            counters[project.status] = (counters[project.status] ?? 0) + 1;
        }

        this.projectCountByColumn = counters;
    }

    getProjectsCount(columnId: string): number {
        return this.projectCountByColumn[columnId] ?? 0;
    }

    openCreateForm(): void {
        this.viewMode = "form";
        this.editingColumnId = null;
        this.formError = "";
        this.successMessage = "";
        this.slaSaveMessage = "";
        this.draft = this.createDefaultDraft();
    }

    editColumn(column: BoardColumn): void {
        this.viewMode = "form";
        this.editingColumnId = column.id;
        this.formError = "";
        this.successMessage = "";
        this.slaSaveMessage = "";
        this.draft = {
            name: column.name,
            color: column.color,
            description: column.description ?? "",
            equipmentStatusId: column.equipmentStatusId ?? "",
            greenDays: column.greenDays ?? 0,
            yellowDays: column.yellowDays ?? 0,
            includeInWorkload: Boolean(column.includeInWorkload),
            trackAging: Boolean(column.trackAging),
        };
    }

    saveColumn(): void {
        this.formError = "";
        this.successMessage = "";
        this.slaSaveMessage = "";

        const name = this.draft.name.trim();
        if (name.length < 2) {
            this.formError = "El nombre debe tener al menos 2 caracteres.";
            return;
        }

        const color = this.normalizeHexColor(this.draft.color);
        const equipmentStatusId = this.draft.equipmentStatusId.trim();
        const equipmentStatusLabel = this.resolveEquipmentStatusLabel(equipmentStatusId);
        const payload: Partial<BoardColumn> = {
            name,
            color,
            description: this.draft.description.trim(),
            equipmentStatusId,
            equipmentStatusLabel: equipmentStatusId ? equipmentStatusLabel : "",
            greenDays: this.normalizeWholeNumber(this.draft.greenDays),
            yellowDays: this.normalizeWholeNumber(this.draft.yellowDays),
            includeInWorkload: this.draft.includeInWorkload,
            trackAging: this.draft.trackAging,
        };

        if (this.editingColumnId) {
            this.projectService.updateBoardColumn(this.editingColumnId, payload).subscribe({
                next: () => {
                    this.successMessage = "Columna actualizada correctamente.";
                    this.syncSlaConfig();
                    this.goToList();
                },
                error: () => {
                    this.formError = "No se pudo actualizar la columna.";
                },
            });
            return;
        }

        this.projectService.createBoardColumn(name, color, payload).subscribe({
            next: () => {
                this.successMessage = "Columna creada correctamente.";
                this.syncSlaConfig();
                this.goToList();
            },
            error: () => {
                this.formError = "No se pudo crear la columna.";
            },
        });
    }

    /**
     * Persist the SLA semaphore thresholds in the backend API in addition to
     * the local board save; the message reflects the sync result.
     */
    private syncSlaConfig(): void {
        this.projectService.syncSlaConfigToApi().subscribe({
            next: () => {
                this.slaSaveIsError = false;
                this.slaSaveMessage = "Plazos del semaforo SLA guardados en el servidor.";
            },
            error: () => {
                this.slaSaveIsError = true;
                this.slaSaveMessage = "Columna guardada localmente, pero no se pudo sincronizar el semaforo SLA con el servidor.";
            },
        });
    }

    moveColumn(columnId: string, direction: "up" | "down"): void {
        this.formError = "";
        this.successMessage = "";

        this.projectService.moveBoardColumn(columnId, direction).subscribe({
            next: () => {
                this.successMessage = "Orden de columnas actualizado.";
            },
            error: () => {
                this.formError = "No se pudo cambiar el orden de las columnas.";
            },
        });
    }

    resetTechnicalFlow(): void {
        this.formError = "";
        this.successMessage = "";

        this.projectService.resetBoardToTechnicalDefaults().subscribe({
            next: () => {
                this.successMessage = "Flujo tecnico restablecido desde la configuracion maestra.";
            },
            error: () => {
                this.formError = "No se pudo restablecer el flujo tecnico.";
            },
        });
    }

    goToList(): void {
        this.viewMode = "list";
        this.editingColumnId = null;
        this.formError = "";
        this.draft = this.createDefaultDraft();
    }

    private createDefaultDraft(): ColumnDraft {
        return {
            name: "",
            color: "#3b82f6",
            description: "",
            equipmentStatusId: "",
            greenDays: 0,
            yellowDays: 0,
            includeInWorkload: true,
            trackAging: false,
        };
    }

    private normalizeHexColor(value: string): string {
        const normalized = (value || "").trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
            return normalized;
        }

        return "#3b82f6";
    }

    private normalizeWholeNumber(value: unknown): number {
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(numeric)) {
            return 0;
        }

        return Math.max(0, Math.round(numeric));
    }

    resolveEquipmentStatusLabel(statusId: string | undefined): string {
        if (!statusId) {
            return "Sin sincronizacion";
        }

        return this.equipmentStatusOptions.find((option) => option.id === statusId)?.label ?? statusId;
    }
}
