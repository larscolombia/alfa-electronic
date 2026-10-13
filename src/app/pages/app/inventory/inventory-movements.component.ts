import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import {
    AdjustmentRequest,
    InventoryPermission,
    InventoryRole,
    MovementRecord,
    MovementType,
    StockReference,
    TechnicianBagTrace,
} from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { Project } from "../../app/projects/models/project.model";
import { ProjectService } from "../../app/projects/services/project.service";

@Component({
    selector: "app-inventory-movements",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Inventario - Entradas, salidas y ajustes</h5>
                    <p class="text-secondary small mb-0">Control de movimientos con politicas de rol para proteger la calidad de stock.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/inventory-dashboard">Volver al panel</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventario</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Movimientos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3">
                <div class="card-body">
                    <div class="row gx-3 gy-2 align-items-end">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Perfil operativo</label>
                            <select class="form-select" [(ngModel)]="rolePreset">
                                <option value="tecnico">Tecnico</option>
                                <option value="responsable">Responsable de inventario</option>
                                <option value="administrativo">Administrativo</option>
                                <option value="compras">Compras</option>
                                <option value="auditor">Auditor</option>
                            </select>
                        </div>
                        <div class="col-12 col-md">
                            <div class="alert mb-0" [ngClass]="rolePreset === 'tecnico' ? 'alert-warning border' : 'alert-success border'">
                                <strong>Regla activa:</strong>
                                <span *ngIf="rolePreset === 'tecnico'"> el tecnico puede registrar salida. Entrada y ajuste requieren aprobacion.</span>
                                <span *ngIf="rolePreset === 'responsable'"> el responsable puede registrar entrada, salida y ajuste.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="feedback" class="alert mb-3" [ngClass]="feedbackClass">
                {{ feedback }}
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Nuevo movimiento</h6>
                </div>
                <div class="card-body">
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
                        <!-- MEJORA C: Selector de proyecto que auto-llena ODS/equipo/cliente -->
                        <div class="col-12 col-md-4">
                            <label class="form-label">Proyecto asociado (opcional)</label>
                            <select class="form-select" [(ngModel)]="selectedProjectId" (ngModelChange)="onProjectChange($event)">
                                <option value="">Sin proyecto / Manual</option>
                                <option *ngFor="let p of projects" [value]="p.id">
                                    {{ p.properties['shortCode'] || p.id }} - {{ p.title }}
                                </option>
                            </select>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">ODS / Orden</label>
                            <input class="form-control" [(ngModel)]="draft.workOrder" placeholder="Ej: ODS-2026-0411" [readonly]="!!selectedProjectId" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Tag equipo</label>
                            <input class="form-control" [(ngModel)]="draft.equipmentTag" placeholder="EQ-PLANTA-009" [readonly]="!!selectedProjectId" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Cliente / Planta</label>
                            <input class="form-control" [(ngModel)]="draft.customerSite" placeholder="Planta Acme - Linea 3" [readonly]="!!selectedProjectId" />
                        </div>
                        <!-- MEJORA H: Categoria inferida automaticamente -->
                        <div class="col-12 col-md-4">
                            <label class="form-label">Categoria <span class="badge text-bg-secondary ms-1">auto</span></label>
                            <input class="form-control" [value]="inferredCategory" readonly />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Soporte / evidencia</label>
                            <input class="form-control" [(ngModel)]="draft.evidenceRef" placeholder="Ticket #4521 / Acta AJ-77" />
                        </div>
                        <div class="col-12">
                            <label class="form-label">Motivo</label>
                            <input class="form-control" [(ngModel)]="draft.reason" placeholder="Explica por que se hace el movimiento" />
                        </div>
                    </div>

                    <div class="mt-3 d-flex gap-2 flex-wrap">
                        <button class="btn btn-theme" type="button" (click)="submitMovement()">
                            {{ requiresApproval(draft.type) ? 'Solicitar aprobacion' : 'Registrar movimiento' }}
                        </button>
                        <button class="btn btn-outline-secondary" type="button" (click)="resetDraft()">Limpiar</button>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-xl-7 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">Movimientos registrados</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Referencia</th>
                                            <th>Cantidad</th>
                                            <th>Orden</th>
                                            <th>Equipo</th>
                                            <th>Cliente/Planta</th>
                                            <th>Categoria</th>
                                            <th>Solicitado por</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr *ngFor="let item of movementHistory">
                                            <td>{{ item.requestedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                                            <td>{{ movementTypeLabel(item.type) }}</td>
                                            <td>{{ item.reference }}</td>
                                            <td>{{ item.quantity }}</td>
                                            <td>{{ item.workOrder || '--' }}</td>
                                            <td>{{ item.equipmentTag || '--' }}</td>
                                            <td>{{ item.customerSite || '--' }}</td>
                                            <td>{{ item.movementCategory || '--' }}</td>
                                            <td>{{ item.requestedBy }}</td>
                                        </tr>
                                        <tr *ngIf="movementHistory.length === 0">
                                            <td colspan="9" class="text-center text-secondary py-4">Aun no hay movimientos registrados.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-5">
                    <div class="card adminuiux-card h-100">
                        <div class="card-header">
                            <h6 class="mb-0">Solicitudes de ajuste/entrada</h6>
                            <p class="small text-secondary mb-0">Cola para evitar cuello de botella y mantener trazabilidad.</p>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Referencia</th>
                                            <th>Tipo</th>
                                            <th>Estado</th>
                                            <th>Orden</th>
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
                                            <td>{{ request.workOrder || '--' }}</td>
                                            <td class="text-end">
                                                <button class="btn btn-sm btn-outline-theme" type="button" [disabled]="request.status !== 'pendiente' || !canApproveRequests" (click)="approveRequest(request.id)">
                                                    Aprobar
                                                </button>
                                            </td>
                                        </tr>
                                        <tr *ngIf="pendingRequests.length === 0">
                                            <td colspan="6" class="text-center text-secondary py-4">Sin solicitudes pendientes.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MEJORA E: Bolsas colapsadas por defecto -->
            <div class="card adminuiux-card mt-3">
                <div class="card-header d-flex align-items-center justify-content-between">
                    <div>
                        <h6 class="mb-0">Bolsas de tecnico</h6>
                        <p class="small text-secondary mb-0">Recepcion y liberacion administrativa.</p>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="showBags = !showBags">
                        <i class="bi" [ngClass]="showBags ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                        {{ showBags ? 'Ocultar' : 'Expandir' }}
                    </button>
                </div>
                <div *ngIf="showBags">
                    <div class="card-body">
                        <div class="row gx-3 gy-2">
                            <div class="col-12 col-md-2">
                                <label class="form-label">Codigo bolsa</label>
                                <input class="form-control" [(ngModel)]="bagDraft.bagCode" placeholder="BOL-2041" />
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Referencia</label>
                                <input class="form-control" [(ngModel)]="bagDraft.reference" placeholder="LM324N" />
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Cantidad</label>
                                <input class="form-control" type="number" min="1" [(ngModel)]="bagDraft.quantity" />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Tecnico</label>
                                <input class="form-control" [(ngModel)]="bagDraft.technician" placeholder="Tecnico C Torres" />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">ODS / Orden</label>
                                <input class="form-control" [(ngModel)]="bagDraft.workOrder" placeholder="ODS-2026-0721" />
                            </div>
                        </div>

                        <div class="mt-3 d-flex gap-2 flex-wrap">
                            <button class="btn btn-theme" type="button" [disabled]="!canManageBags" (click)="receiveBag()">Registrar recepcion</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="resetBagDraft()">Limpiar</button>
                        </div>
                    </div>

                    <div class="card-body p-0 border-top">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Bolsa</th>
                                        <th>Referencia</th>
                                        <th>Tecnico</th>
                                        <th>Recepcion</th>
                                        <th>Estado</th>
                                        <th>ODS</th>
                                        <th class="text-end">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let bag of bagTraces">
                                        <td>{{ bag.bagCode }}</td>
                                        <td>{{ bag.reference }} ({{ bag.quantity }})</td>
                                        <td>{{ bag.technician }}</td>
                                        <td>{{ bag.receivedBy }} - {{ bag.receivedAt | date: 'dd/MM HH:mm' }}</td>
                                        <td>
                                            <span class="badge" [ngClass]="bag.status === 'liberada' ? 'text-bg-success' : 'text-bg-warning'">{{ bag.status }}</span>
                                        </td>
                                        <td>{{ bag.workOrder || '--' }}</td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-theme" type="button" [disabled]="bag.status !== 'recibida' || !canManageBags" (click)="releaseBag(bag.id)">
                                                Liberar
                                            </button>
                                        </td>
                                    </tr>
                                    <tr *ngIf="bagTraces.length === 0">
                                        <td colspan="7" class="text-center text-secondary py-4">Sin bolsas trazadas todavia.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InventoryMovementsComponent implements OnInit {
    movementHistory: MovementRecord[] = [];
    pendingRequests: AdjustmentRequest[] = [];
    bagTraces: TechnicianBagTrace[] = [];
    inventoryReferences: StockReference[] = [];
    projects: Project[] = [];
    selectedProjectId = "";
    showBags = false;

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

    bagDraft = {
        bagCode: "",
        reference: "",
        quantity: 1,
        technician: "",
        workOrder: "",
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

    get canManageBags(): boolean {
        return this.inventoryRbac.hasPermission("inventory.bags.manage");
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

    receiveBag(): void {
        const result = this.inventoryWorkflow.receiveTechnicianBag({
            bagCode: this.bagDraft.bagCode,
            reference: this.bagDraft.reference,
            quantity: Number(this.bagDraft.quantity),
            technician: this.bagDraft.technician,
            notes: "",
            workOrder: this.bagDraft.workOrder,
            sealCode: "",
            originArea: "",
            receptionDocument: "",
        });

        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.resetBagDraft();
            this.refreshState();
        }
    }

    releaseBag(bagId: string): void {
        const result = this.inventoryWorkflow.releaseTechnicianBag(bagId);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    resetBagDraft(): void {
        this.bagDraft = {
            bagCode: "",
            reference: "",
            quantity: 1,
            technician: "",
            workOrder: "",
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
        this.bagTraces = snapshot.bagTraces;
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
