import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import {
    AdjustmentRequest,
    InventoryPermission,
    InventoryRole,
    MovementRecord,
    MovementType,
    StockReference,
} from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { InvBackendAlertComponent } from "./inv-backend-alert.component";
import { InvRoleHintComponent } from "./inv-role-hint.component";
import { TechnicianBagsPanelComponent } from "./technician-bags-panel.component";
import { Project } from "../../app/projects/models/project.model";
import { ProjectService } from "../../app/projects/services/project.service";

@Component({
    selector: "app-inventory-movements",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, InvRoleHintComponent, InvBackendAlertComponent, TechnicianBagsPanelComponent],
    template: `
        <main class="container-fluid py-3 inventory-workspace" id="main-content">
            <header class="d-flex justify-content-between align-items-start gap-3 mb-2">
                <div>
                    <h5 class="mb-0">Movimientos de inventario</h5>
                    <p class="small text-secondary mb-0">Rol actual: <strong>{{ roleLabel }}</strong></p>
                </div>
                <a class="btn btn-sm btn-outline-secondary" routerLink="/app/inventory-dashboard">Volver al panel</a>
            </header>

            <details class="mb-2" *ngIf="showDemoRole">
                <summary class="small text-secondary">Modo demo / QA: simular rol</summary>
                <select class="form-select form-select-sm mt-2 demo-role-select" [(ngModel)]="rolePreset" data-testid="inv-demo-role-select">
                    <option value="tecnico">Tecnico</option><option value="responsable">Responsable de inventario</option>
                    <option value="administrativo">Administrativo</option><option value="compras">Compras</option><option value="auditor">Auditor</option>
                </select>
            </details>
            <button *ngIf="!showDemoRole" class="btn btn-link btn-sm p-0 mb-2 text-secondary" type="button" (click)="showDemoRole = true">Modo demo / QA</button>

            <app-inv-backend-alert></app-inv-backend-alert>
            <div *ngIf="feedback" class="alert py-2 mb-2" [ngClass]="feedbackClass" [attr.data-testid]="feedbackTestId" aria-live="polite">{{ feedback }}</div>

            <nav class="nav nav-tabs workspace-tabs" role="tablist" aria-label="Tareas de movimientos">
                <button class="nav-link" type="button" role="tab" data-testid="inv-tab-register" [class.active]="activeTab === 'register'" [attr.aria-selected]="activeTab === 'register'" (click)="activeTab = 'register'">Registrar</button>
                <button class="nav-link" type="button" role="tab" data-testid="inv-tab-activity" [class.active]="activeTab === 'activity'" [attr.aria-selected]="activeTab === 'activity'" (click)="openActivity()">Actividad <span *ngIf="pendingCount" class="badge text-bg-warning ms-1">{{ pendingCount }}</span></button>
                <button class="nav-link" type="button" role="tab" data-testid="inv-tab-bags" [class.active]="activeTab === 'bags'" [attr.aria-selected]="activeTab === 'bags'" (click)="activeTab = 'bags'">Bolsas</button>
            </nav>

            <section *ngIf="activeTab === 'register'" class="card adminuiux-card workspace-panel" role="tabpanel">
                <div class="card-header py-2 d-flex justify-content-between align-items-center"><h6 class="mb-0">Registrar movimiento</h6><span class="small text-secondary">Categoria: {{ inferredCategory }}</span></div>
                <div class="card-body">
                    <app-inv-role-hint></app-inv-role-hint>
                    <div class="alert py-2 small" [ngClass]="requiresApproval(draft.type) ? 'alert-warning border' : 'alert-success border'">
                        {{ requiresApproval(draft.type) ? 'Esta accion se enviara a aprobacion.' : 'Tu rol puede registrar esta accion directamente.' }}
                    </div>
                    <div class="row gx-3 gy-2">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" [(ngModel)]="draft.type" (ngModelChange)="onTypeChange()">
                                <option value="salida">Salida tecnica</option>
                                <option value="entrada">Entrada</option>
                                <option value="ajuste">Ajuste</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Referencia</label>
                            <select class="form-select" [(ngModel)]="draft.reference">
                                <option value="">Selecciona referencia</option>
                                <option *ngFor="let ref of inventoryReferences" [value]="ref.reference">{{ ref.reference }} - {{ ref.designation }}</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-2">
                            <label class="form-label">Cantidad</label>
                            <input class="form-control" type="number" min="1" [(ngModel)]="draft.quantity" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Motivo</label>
                            <input class="form-control" [(ngModel)]="draft.reason" placeholder="Explica por que se hace el movimiento" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Proyecto asociado (opcional)</label>
                            <select class="form-select" [(ngModel)]="selectedProjectId" (ngModelChange)="onProjectChange($event)">
                                <option value="">Sin proyecto / Manual</option>
                                <option *ngFor="let p of projects" [value]="p.id">
                                    {{ p.properties['shortCode'] || p.id }} - {{ p.title }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <details class="mt-3" [open]="showTraceability" (toggle)="showTraceability = $any($event.target).open">
                        <summary>Detalles de trazabilidad</summary>
                        <div class="row gx-3 gy-2 mt-1">
                            <div class="col-12 col-md-4"><label class="form-label">ODS / Orden</label><input class="form-control" [(ngModel)]="draft.workOrder" placeholder="Ej: ODS-2026-0411" [readonly]="!!selectedProjectId" /></div>
                            <div class="col-12 col-md-4"><label class="form-label">Tag equipo</label><input class="form-control" [(ngModel)]="draft.equipmentTag" placeholder="EQ-PLANTA-009" [readonly]="!!selectedProjectId" /></div>
                            <div class="col-12 col-md-4"><label class="form-label">Cliente / Planta</label><input class="form-control" [(ngModel)]="draft.customerSite" placeholder="Planta Acme - Linea 3" [readonly]="!!selectedProjectId" /></div>
                            <div class="col-12 col-md-4"><label class="form-label">Soporte / evidencia</label><input class="form-control" [(ngModel)]="draft.evidenceRef" placeholder="Ticket #4521 / Acta AJ-77" /></div>
                        </div>
                    </details>
                    <div class="mt-3 d-flex gap-2 flex-wrap">
                        <button class="btn btn-theme" type="button" (click)="submitMovement()">
                            {{ requiresApproval(draft.type) ? 'Enviar solicitud' : 'Registrar ' + movementTypeLabel(draft.type).toLowerCase() }}
                        </button>
                        <button class="btn btn-outline-secondary" type="button" (click)="resetDraft()">Limpiar</button>
                    </div>
                </div>
            </section>

            <section *ngIf="activeTab === 'activity'" class="card adminuiux-card workspace-panel" role="tabpanel">
                <div class="card-header py-2 d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    <div class="btn-group" role="group" aria-label="Actividad">
                        <button type="button" class="btn btn-sm" [class.btn-theme]="activityView === 'history'" [class.btn-outline-secondary]="activityView !== 'history'" (click)="activityView = 'history'">Historial</button>
                        <button type="button" class="btn btn-sm" [class.btn-theme]="activityView === 'requests'" [class.btn-outline-secondary]="activityView !== 'requests'" (click)="activityView = 'requests'">Solicitudes <span *ngIf="pendingCount" class="badge text-bg-warning ms-1">{{ pendingCount }}</span></button>
                    </div>
                    <input *ngIf="activityView === 'history'" class="form-control form-control-sm activity-search" [(ngModel)]="historySearch" (ngModelChange)="historyPage = 0" placeholder="Buscar referencia u ODS" data-testid="inv-history-search" />
                </div>
                <div class="card-body p-0 table-panel">
                    <div class="table-responsive" *ngIf="activityView === 'history'">
                        <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Referencia</th>
                                            <th>Cantidad</th>
                                            <th>Solicitado por</th>
                                            <th class="text-end">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr *ngFor="let item of pagedHistory">
                                            <td>{{ item.requestedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                                            <td>{{ movementTypeLabel(item.type) }}</td>
                                            <td>{{ item.reference }}</td>
                                            <td>{{ item.quantity }}</td>
                                            <td>{{ item.requestedBy }}</td>
                                            <td class="text-end"><button class="btn btn-sm btn-outline-secondary" type="button" (click)="selectedMovement = item">Ver detalle</button></td>
                                        </tr>
                                        <tr *ngIf="movementHistory.length === 0">
                                            <td colspan="6" class="text-center text-secondary py-4">Aun no hay movimientos registrados.</td>
                                        </tr>
                                    </tbody>
                                </table>
                    </div>
                    <div class="table-responsive" *ngIf="activityView === 'requests'">
                        <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Referencia</th>
                                            <th>Tipo</th>
                                            <th>Estado</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr *ngFor="let request of pendingRequests">
                                            <td>{{ request.requestedAt | date: 'dd/MM HH:mm' }}</td>
                                            <td>{{ request.reference }}</td>
                                            <td>{{ movementTypeLabel(request.type) }}</td>
                                            <td>
                                                <span class="badge" [ngClass]="request.status === 'aprobada' ? 'text-bg-success' : 'text-bg-warning'">{{ request.status }}</span>
                                            </td>
                                            <td class="text-end">
                                                <button class="btn btn-sm btn-outline-theme" type="button" [disabled]="request.status !== 'pendiente' || !canApproveRequests" (click)="approveRequest(request.id)" [title]="canApproveRequests ? '' : 'Tu rol no puede aprobar solicitudes'">
                                                    Aprobar
                                                </button>
                                            </td>
                                        </tr>
                                        <tr *ngIf="pendingRequests.length === 0">
                                            <td colspan="5" class="text-center text-secondary py-4">Sin solicitudes pendientes.</td>
                                        </tr>
                                    </tbody>
                                </table>
                    </div>
                </div>
                <footer class="card-footer py-2 d-flex justify-content-between" *ngIf="activityView === 'history'">
                    <span class="small text-secondary">{{ filteredHistory.length }} movimientos</span>
                    <div class="btn-group"><button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="historyPage === 0" (click)="historyPage = historyPage - 1">Anterior</button><button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="(historyPage + 1) * pageSize >= filteredHistory.length" (click)="historyPage = historyPage + 1">Siguiente</button></div>
                </footer>
                <aside *ngIf="selectedMovement" class="movement-detail border-top p-3" aria-label="Detalle del movimiento">
                    <div class="d-flex justify-content-between"><strong>Detalle de {{ selectedMovement.reference }}</strong><button class="btn-close" type="button" aria-label="Cerrar" (click)="selectedMovement = null"></button></div>
                    <div class="row small mt-2"><div class="col-md-4">ODS: {{ selectedMovement.workOrder || '--' }}</div><div class="col-md-4">Equipo: {{ selectedMovement.equipmentTag || '--' }}</div><div class="col-md-4">Cliente: {{ selectedMovement.customerSite || '--' }}</div><div class="col-md-4">Categoria: {{ selectedMovement.movementCategory || '--' }}</div><div class="col-md-8">Evidencia: {{ selectedMovement.evidenceRef || '--' }}</div><div class="col-12 mt-1">Motivo: {{ selectedMovement.reason || '--' }}</div></div>
                </aside>
            </section>

            <section *ngIf="activeTab === 'bags'" class="workspace-panel" role="tabpanel"><app-technician-bags-panel></app-technician-bags-panel></section>
        </main>
    `,
    styles: [`
        .inventory-workspace { max-width: 1320px; }
        .workspace-tabs { margin-bottom: .75rem; }
        .workspace-panel { max-height: calc(100vh - 210px); overflow: hidden; }
        .table-panel { max-height: calc(100vh - 330px); overflow: auto; }
        .activity-search { width: min(18rem, 100%); }
        .demo-role-select { max-width: 20rem; }
        @media (max-width: 767.98px) { .workspace-panel, .table-panel { max-height: none; overflow: visible; } .workspace-tabs { overflow-x: auto; flex-wrap: nowrap; } }
    `],
})
export class InventoryMovementsComponent implements OnInit, OnDestroy {
    private readonly subscriptions = new Subscription();
    activeTab: "register" | "activity" | "bags" = "register";
    activityView: "history" | "requests" = "history";
    showDemoRole = false;
    showTraceability = false;
    historySearch = "";
    historyPage = 0;
    readonly pageSize = 8;
    selectedMovement: MovementRecord | null = null;
    movementHistory: MovementRecord[] = [];
    pendingRequests: AdjustmentRequest[] = [];
    inventoryReferences: StockReference[] = [];
    projects: Project[] = [];
    selectedProjectId = "";

    draft: {
        type: MovementType;
        reference: string;
        quantity: number;
        reason: string;
        workOrder: string;
        equipmentTag: string;
        customerSite: string;
        evidenceRef: string;
    } = {
        type: "salida",
        reference: "",
        quantity: 1,
        reason: "",
        workOrder: "",
        equipmentTag: "",
        customerSite: "",
        evidenceRef: "",
    };

    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";

    constructor(
        private readonly inventoryRbac: InventoryRbacService,
        private readonly inventoryWorkflow: InventoryWorkflowService,
        private readonly projectService: ProjectService
    ) { }

    ngOnInit(): void {
        this.refreshState();
        this.inventoryReferences = this.inventoryWorkflow.getSnapshot().references;
        this.projectService.loadProjects("board-1").subscribe((p) => {
            this.projects = p;
        });
        // El estado llega asincrono desde el backend: re-leerlo en cada emision.
        this.subscriptions.add(
            this.inventoryWorkflow.state$.subscribe(() => {
                this.refreshState();
                this.inventoryReferences = this.inventoryWorkflow.getSnapshot().references;
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    get rolePreset(): InventoryRole {
        return this.inventoryRbac.currentRole;
    }

    set rolePreset(role: InventoryRole) {
        this.inventoryRbac.setRole(role);
    }

    get canApproveRequests(): boolean {
        return this.inventoryRbac.hasPermission("inventory.movements.approve");
    }

    get roleLabel(): string {
        const labels: Record<InventoryRole, string> = {
            tecnico: "Tecnico",
            responsable: "Responsable de inventario",
            administrativo: "Administrativo",
            compras: "Compras",
            auditor: "Auditor",
        };
        return labels[this.rolePreset];
    }

    get pendingCount(): number {
        return this.pendingRequests.filter((request) => request.status === "pendiente").length;
    }

    get filteredHistory(): MovementRecord[] {
        const query = this.historySearch.trim().toLocaleLowerCase();
        if (!query) {
            return this.movementHistory;
        }
        return this.movementHistory.filter((item) =>
            [item.reference, item.workOrder, item.equipmentTag, item.customerSite]
                .some((value) => value?.toLocaleLowerCase().includes(query))
        );
    }

    get pagedHistory(): MovementRecord[] {
        const start = this.historyPage * this.pageSize;
        return this.filteredHistory.slice(start, start + this.pageSize);
    }

    get feedbackTestId(): string {
        if (this.feedback.includes("No hay stock suficiente")) {
            return "inv-insufficient-stock-alert";
        }
        return "inv-movements-feedback";
    }

    get feedbackClass(): string {
        if (this.feedbackType === "success") {
            return "alert-success border";
        }
        if (this.feedbackType === "warning") {
            return "alert-warning border";
        }
        return "alert-danger border";
    }

    get inferredCategory(): string {
        if (this.draft.type === "entrada" && this.draft.workOrder) {
            return "devolucion";
        }
        if (this.draft.type === "entrada") {
            return "regularizacion";
        }
        if (this.draft.type === "ajuste") {
            return "regularizacion";
        }
        if (this.draft.workOrder) {
            return "consumo-tecnico";
        }
        return "traslado";
    }

    onTypeChange(): void {
        // category is inferred, nothing else needed
    }

    onProjectChange(projectId: string): void {
        this.showTraceability = !projectId;
        if (!projectId) {
            this.draft.workOrder = "";
            this.draft.equipmentTag = "";
            this.draft.customerSite = "";
            return;
        }
        const project = this.projects.find((p) => p.id === projectId);
        if (project) {
            this.draft.workOrder = (project.properties["shortCode"] as string) || "";
            this.draft.equipmentTag = (project.properties["equipmentIdentifier"] as string) || (project.properties["equipmentDisplayName"] as string) || project.title;
            this.draft.customerSite = (project.properties["equipmentProspectName"] as string) || (project.properties["client"] as string) || "";
        }
    }

    requiresApproval(type: MovementType): boolean {
        return !this.hasMovementPermission(type);
    }

    submitMovement(): void {
        const result = this.inventoryWorkflow.submitMovement({
            type: this.draft.type,
            reference: this.draft.reference,
            quantity: Number(this.draft.quantity),
            reason: this.draft.reason,
            workOrder: this.draft.workOrder,
            equipmentTag: this.draft.equipmentTag,
            customerSite: this.draft.customerSite,
            movementCategory: this.inferredCategory,
            evidenceRef: this.draft.evidenceRef,
        });

        this.setFeedback(result.message, result.ok ? (this.requiresApproval(this.draft.type) ? "warning" : "success") : "danger");
        if (result.ok) {
            this.resetDraft();
            this.refreshState();
        }
    }

    approveRequest(requestId: string): void {
        const result = this.inventoryWorkflow.approveMovementRequest(requestId);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    openActivity(): void {
        this.activeTab = "activity";
        this.activityView = this.canApproveRequests && this.pendingCount > 0 ? "requests" : "history";
    }

    movementTypeLabel(type: MovementType): string {
        if (type === "entrada") {
            return "Entrada";
        }
        if (type === "ajuste") {
            return "Ajuste";
        }
        return "Salida";
    }

    resetDraft(): void {
        this.selectedProjectId = "";
        this.draft = {
            type: "salida",
            reference: "",
            quantity: 1,
            reason: "",
            workOrder: "",
            equipmentTag: "",
            customerSite: "",
            evidenceRef: "",
        };
    }

    private setFeedback(message: string, type: "success" | "warning" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }

    private refreshState(): void {
        const snapshot = this.inventoryWorkflow.getSnapshot();
        this.movementHistory = snapshot.movements;
        this.pendingRequests = snapshot.adjustmentRequests;
        const maxPage = Math.max(0, Math.ceil(this.filteredHistory.length / this.pageSize) - 1);
        this.historyPage = Math.min(this.historyPage, maxPage);
    }

    private hasMovementPermission(type: MovementType): boolean {
        let permission: InventoryPermission = "inventory.movements.register-exit";

        if (type === "entrada") {
            permission = "inventory.movements.register-entry";
        }

        if (type === "ajuste") {
            permission = "inventory.movements.register-adjustment";
        }

        return this.inventoryRbac.hasPermission(permission);
    }
}
