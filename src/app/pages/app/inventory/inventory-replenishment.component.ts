import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import {
    InventoryRole,
    PurchaseLine,
    ReplenishmentItem,
    ReplenishmentStatus,
    WeeklyShortageSnapshot,
} from "../../../services/inventory-domain.models";
import { InventoryApiService } from "../../../services/inventory-api.service";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { HrPeoplePickerService } from "../../../services/hr-people-picker.service";
import { SupplierRecord, SuppliersCatalogService } from "../../../services/suppliers-catalog.service";
import { Project } from "../projects/models";
import { ProjectService } from "../projects/services";
import { PurchaseRequestsPanelComponent } from "./purchase-requests-panel.component";
import { projectOriginLabel } from "./project-origin-label.util";

@Component({
    selector: "app-inventory-replenishment",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, PurchaseRequestsPanelComponent],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Inventario - Cantidad insuficiente y reposicion</h5>
                    <p class="text-secondary small mb-0">Priorizacion por antiguedad y trazabilidad de intentos de compra para evitar rezagos de meses.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/inventory-dashboard">Volver al panel</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventario</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Insuficiencia y reposicion</li>
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
                            <div class="d-flex flex-wrap gap-2 justify-content-md-end">
                                <button class="btn btn-outline-theme" type="button" [disabled]="!canGeneratePurchaseLines" (click)="generatePurchaseLines()">
                                    Generar lineas de compra
                                </button>
                                <button class="btn btn-outline-secondary" type="button" [disabled]="!canGenerateWeeklyReports" (click)="generateWeeklySnapshot()">
                                    Generar seguimiento semanal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="feedback" class="alert mb-3" [ngClass]="feedbackClass">
                {{ feedback }}
            </div>

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Items insuficientes</p>
                            <h4 class="mb-0">{{ visibleItems.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">En escalamiento</p>
                            <h4 class="mb-0">{{ escalationCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Promedio de dias en insuficiencia</p>
                            <h4 class="mb-0">{{ averageWaitingDays }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Filtros de priorizacion</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-2">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Ordenar por</label>
                            <select class="form-select" [(ngModel)]="sortMode">
                                <option value="antiguedad">Antiguedad (mas viejo primero)</option>
                                <option value="intentos">Numero de intentos</option>
                                <option value="criticidad">Criticidad (minimo - stock)</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Estado</label>
                            <select class="form-select" [(ngModel)]="statusFilter">
                                <option value="">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en-gestion">En gestion</option>
                                <option value="escalar">Escalar</option>
                                <option value="obsoleto">Obsoleto</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">Registro detallado de intento de compra</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-2">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Referencia insuficiente</label>
                            <select class="form-select" [(ngModel)]="attemptDraft.reference">
                                <option value="">Selecciona referencia</option>
                                <option *ngFor="let row of visibleItems" [value]="row.reference">{{ row.reference }} - {{ row.description }}</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Proveedor contactado</label>
                            <select class="form-select" [(ngModel)]="attemptDraft.supplierId" (ngModelChange)="onAttemptSupplierChange($event)">
                                <option [ngValue]="null">Selecciona proveedor</option>
                                <option *ngFor="let supplier of suppliers" [ngValue]="supplier.id">
                                    {{ supplier.supplierNumber }} - {{ supplier.legalName }}
                                </option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Proveedor alterno</label>
                            <select class="form-select" [(ngModel)]="attemptDraft.alternateSupplierId" (ngModelChange)="onAttemptAlternateSupplierChange($event)">
                                <option [ngValue]="null">Sin alterno</option>
                                <option *ngFor="let supplier of suppliers" [ngValue]="supplier.id">
                                    {{ supplier.supplierNumber }} - {{ supplier.legalName }}
                                </option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Comprador responsable</label>
                            <!-- Fase 6: el comprador sale de RRHH. El valor guardado
                                 se conserva aunque ese empleado ya no esté activo. -->
                            <select class="form-select" [(ngModel)]="attemptDraft.procurementOwner" name="procurementOwner">
                                <option value="">Selecciona un comprador</option>
                                <option *ngFor="let person of procurementOwnerOptions" [value]="person">{{ person }}</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Lead time estimado (dias)</label>
                            <input class="form-control" type="number" min="0" [(ngModel)]="attemptDraft.estimatedLeadDays" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Costo unitario cotizado</label>
                            <input class="form-control" type="number" min="0" step="0.01" [(ngModel)]="attemptDraft.quotedUnitCost" />
                        </div>
                        <div class="col-12 col-md-6">
                            <label class="form-label">Resultado del intento</label>
                            <input class="form-control" [(ngModel)]="attemptDraft.resultNote" placeholder="Sin stock, importacion 45 dias, descontinuado, etc." />
                        </div>
                    </div>

                    <div class="mt-3 d-flex gap-2 flex-wrap">
                        <button class="btn btn-theme" type="button" [disabled]="!canManageReplenishment" (click)="registerDetailedAttempt()">Guardar intento detallado</button>
                        <button class="btn btn-outline-secondary" type="button" (click)="resetAttemptDraft()">Limpiar</button>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card">
                <div class="card-header">
                    <h6 class="mb-0">Backlog de cantidad insuficiente</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Referencia</th>
                                    <th>Stock</th>
                                    <th>Minimo</th>
                                    <th>Proveedor actual</th>
                                    <th>Lead time</th>
                                    <th>Costo cotizado</th>
                                    <th>Primera insuficiencia</th>
                                    <th>Ultimo intento</th>
                                    <th>Intentos</th>
                                    <th>Dias</th>
                                    <th>Estado</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let item of visibleItems">
                                    <td>
                                        <div class="fw-semibold">{{ item.reference }}</div>
                                        <div class="small text-secondary">{{ item.description }}</div>
                                    </td>
                                    <td>{{ item.currentStock }}</td>
                                    <td>{{ item.minStock }}</td>
                                    <td>{{ item.supplier || '--' }}</td>
                                    <td>{{ item.estimatedLeadDays ?? '--' }}</td>
                                    <td>{{ item.lastQuotedUnitCost ?? '--' }}</td>
                                    <td>{{ item.firstInsufficientAt | date: 'dd/MM/yyyy' }}</td>
                                    <td>{{ item.lastAttemptAt | date: 'dd/MM/yyyy' }}</td>
                                    <td>{{ item.attempts }}</td>
                                    <td>{{ daysWaiting(item) }}</td>
                                    <td><span class="badge" [ngClass]="statusClass(item.status)">{{ item.status }}</span></td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-secondary me-2" type="button" [disabled]="item.status === 'obsoleto' || !canManageReplenishment" (click)="registerAttempt(item.reference)">Intento rapido</button>
                                        <button class="btn btn-sm btn-outline-theme me-2" type="button" [disabled]="item.status === 'obsoleto' || !canManageReplenishment" (click)="loadAttemptDraft(item)">Cargar detalle</button>
                                        <button class="btn btn-sm btn-outline-danger" type="button" [disabled]="item.status === 'obsoleto' || !canManageReplenishment" (click)="markObsolete(item.reference)">Marcar obsoleto</button>
                                    </td>
                                </tr>
                                <tr *ngIf="visibleItems.length === 0">
                                    <td colspan="12" class="text-center text-secondary py-4">No hay items para el filtro actual.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <app-purchase-requests-panel></app-purchase-requests-panel>

            <div class="card adminuiux-card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">Lineas de compra</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0" data-testid="purchase-lines-table">
                            <thead>
                                <tr>
                                    <th>Referencia</th>
                                    <th>Componente</th>
                                    <th>Tipo</th>
                                    <th>Marca</th>
                                    <th>Cantidad</th>
                                    <th>Valor Unit.</th>
                                    <th>Proveedor</th>
                                    <th>Proyecto origen</th>
                                    <th>Plazo (dias)</th>
                                    <th>Generada por</th>
                                    <th>Estado</th>
                                    <th>Aprobacion</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let line of purchaseLines" data-testid="purchase-line-row">
                                    <td><strong>{{ line.reference }}</strong></td>
                                    <td>{{ line.component || '--' }}</td>
                                    <td>{{ line.type || '--' }}</td>
                                    <td>{{ line.brand || '--' }}</td>
                                    <td>{{ line.quantity }}</td>
                                    <td>{{ line.unitPrice ? (line.unitPrice | currency:'COP':'symbol':'1.0-0') : '--' }}</td>
                                    <td>{{ line.supplier || '--' }}</td>
                                    <td>{{ projectLabel(line.projectId) }}</td>
                                    <td>{{ line.neededBy || '--' }}</td>
                                    <td>{{ line.generatedBy }} - {{ line.generatedAt | date: 'dd/MM HH:mm' }}</td>
                                    <td><span class="badge" [ngClass]="line.status === 'cerrada' ? 'text-bg-success' : line.status === 'enviada' ? 'text-bg-info' : 'text-bg-warning'">{{ line.status }}</span></td>
                                    <td><span class="badge" [ngClass]="approvalStatusClass(line.approvalStatus)" data-testid="purchase-line-approval">{{ line.approvalStatus || '--' }}</span></td>
                                    <td class="text-end">
                                        <ng-container *ngIf="line.approvalStatus === 'pendiente'">
                                            <button class="btn btn-sm btn-outline-success me-2" type="button" data-testid="approve-purchase-line" [disabled]="!canManageReplenishment" (click)="approveLine(line.id)">Aprobar</button>
                                            <button class="btn btn-sm btn-outline-danger me-2" type="button" data-testid="reject-purchase-line" [disabled]="!canManageReplenishment" (click)="rejectLine(line.id)">Rechazar</button>
                                        </ng-container>
                                        <button class="btn btn-sm btn-outline-secondary me-2" type="button" [disabled]="line.status !== 'pendiente' || !canManageReplenishment" (click)="markSent(line.id)">Enviar</button>
                                        <button class="btn btn-sm btn-outline-theme" type="button" [disabled]="line.status === 'cerrada' || !canManageReplenishment" (click)="closeLine(line.id)">Cerrar</button>
                                    </td>
                                </tr>
                                <tr *ngIf="purchaseLines.length === 0">
                                    <td colspan="13" class="text-center text-secondary py-4">Sin lineas de compra registradas.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">Historico semanal de faltantes</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Semana</th>
                                    <th>Generado por</th>
                                    <th>Items insuficientes</th>
                                    <th>Escalados</th>
                                    <th>Promedio dias</th>
                                    <th>Criticos</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let snapshot of weeklySnapshots">
                                    <td>{{ snapshot.weekKey }}</td>
                                    <td>{{ snapshot.generatedBy }} - {{ snapshot.generatedAt | date: 'dd/MM HH:mm' }}</td>
                                    <td>{{ snapshot.totalInsufficient }}</td>
                                    <td>{{ snapshot.escalated }}</td>
                                    <td>{{ snapshot.averageWaitingDays }}</td>
                                    <td>{{ snapshot.criticalReferences.join(', ') || '--' }}</td>
                                </tr>
                                <tr *ngIf="weeklySnapshots.length === 0">
                                    <td colspan="6" class="text-center text-secondary py-4">Aun no hay cortes semanales.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InventoryReplenishmentComponent implements OnInit, OnDestroy {
    sortMode: "antiguedad" | "intentos" | "criticidad" = "antiguedad";
    statusFilter: "" | ReplenishmentStatus = "";

    items: ReplenishmentItem[] = [];
    purchaseLines: PurchaseLine[] = [];
    weeklySnapshots: WeeklyShortageSnapshot[] = [];
    suppliers: SupplierRecord[] = [];
    projects: Project[] = [];

    private readonly subscriptions = new Subscription();

    attemptDraft = {
        reference: "",
        supplierId: null as number | null,
        supplier: "",
        alternateSupplierId: null as number | null,
        alternateSupplier: "",
        estimatedLeadDays: 0,
        quotedUnitCost: 0,
        resultNote: "",
        procurementOwner: "",
    };

    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";

    constructor(
        private readonly inventoryRbac: InventoryRbacService,
        private readonly inventoryWorkflow: InventoryWorkflowService,
        private readonly inventoryApi: InventoryApiService,
        private readonly suppliersCatalog: SuppliersCatalogService,
        private readonly projectService: ProjectService,
        private readonly cdr: ChangeDetectorRef,
        private readonly hrPeople: HrPeoplePickerService
    ) { }

    /** Fase 6: empleados activos de RRHH para el select de comprador responsable. */
    peopleNames: string[] = [];

    get procurementOwnerOptions(): string[] {
        return this.hrPeople.merge(this.peopleNames, this.attemptDraft.procurementOwner);
    }

    ngOnInit(): void {
        // Fase 6: el comprador responsable sale de RRHH.
        void this.hrPeople.refresh().then((names) => {
            this.peopleNames = names;
        });
        this.refreshSuppliers();
        this.refreshState();
        // El estado del workflow se carga asincrono (fetch fuera de la zona de Angular):
        // hay que re-renderizar explicitamente en cada emision o la tabla queda vacia.
        this.subscriptions.add(
            this.inventoryWorkflow.state$.subscribe(() => {
                this.refreshState();
                this.cdr.detectChanges();
            })
        );
        this.subscriptions.add(
            this.projectService.projects$.subscribe((projects) => {
                this.projects = projects ?? [];
                this.cdr.detectChanges();
            })
        );
        // Los errores reales del backend (operaciones fire-and-forget del workflow)
        // se muestran al usuario en lugar de ocultarse tras el resultado optimista.
        this.subscriptions.add(
            this.inventoryWorkflow.asyncError$.subscribe((message) => {
                this.setFeedback(message, "danger");
                this.cdr.detectChanges();
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

    get canManageReplenishment(): boolean {
        return this.inventoryRbac.hasPermission("inventory.replenishment.manage");
    }

    get canGeneratePurchaseLines(): boolean {
        return this.inventoryRbac.hasPermission("inventory.replenishment.generate-purchase-line");
    }

    get canGenerateWeeklyReports(): boolean {
        return this.inventoryRbac.hasPermission("inventory.replenishment.weekly-report");
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

    get visibleItems(): ReplenishmentItem[] {
        let rows = this.items;
        if (this.statusFilter) {
            rows = rows.filter((item) => item.status === this.statusFilter);
        }

        const copy = [...rows];
        if (this.sortMode === "intentos") {
            return copy.sort((left, right) => right.attempts - left.attempts);
        }
        if (this.sortMode === "criticidad") {
            return copy.sort((left, right) => this.criticality(right) - this.criticality(left));
        }
        return copy.sort((left, right) => Date.parse(left.firstInsufficientAt) - Date.parse(right.firstInsufficientAt));
    }

    get escalationCount(): number {
        return this.items.filter((item) => item.status === "escalar").length;
    }

    get averageWaitingDays(): number {
        if (this.visibleItems.length === 0) {
            return 0;
        }
        const totalDays = this.visibleItems.reduce((sum, item) => sum + this.daysWaiting(item), 0);
        return Math.round(totalDays / this.visibleItems.length);
    }

    registerAttempt(reference: string): void {
        const fallback = this.items.find((item) => item.reference === reference);
        const result = this.inventoryWorkflow.registerReplenishmentAttempt({
            reference,
            supplier: fallback?.supplier || "",
            alternateSupplier: fallback?.alternateSupplier || "",
            estimatedLeadDays: fallback?.estimatedLeadDays || 0,
            quotedUnitCost: fallback?.lastQuotedUnitCost || 0,
            resultNote: "Intento rapido sin detalle adicional",
            procurementOwner: fallback?.procurementOwner || "",
        });
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    registerDetailedAttempt(): void {
        const result = this.inventoryWorkflow.registerReplenishmentAttempt({
            reference: this.attemptDraft.reference,
            supplier: this.attemptDraft.supplier,
            alternateSupplier: this.attemptDraft.alternateSupplier,
            estimatedLeadDays: Number(this.attemptDraft.estimatedLeadDays),
            quotedUnitCost: Number(this.attemptDraft.quotedUnitCost),
            resultNote: this.attemptDraft.resultNote,
            procurementOwner: this.attemptDraft.procurementOwner,
        });

        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
            this.resetAttemptDraft();
        }
    }

    onAttemptSupplierChange(supplierId: number | null): void {
        const supplier = this.suppliersCatalog.findById(supplierId);
        this.attemptDraft.supplierId = supplier?.id ?? null;
        this.attemptDraft.supplier = supplier ? this.buildSupplierLabel(supplier) : "";
    }

    onAttemptAlternateSupplierChange(supplierId: number | null): void {
        const supplier = this.suppliersCatalog.findById(supplierId);
        this.attemptDraft.alternateSupplierId = supplier?.id ?? null;
        this.attemptDraft.alternateSupplier = supplier ? this.buildSupplierLabel(supplier) : "";
    }

    loadAttemptDraft(item: ReplenishmentItem): void {
        const supplierId = this.findSupplierIdByValue(item.supplier);
        const alternateSupplierId = this.findSupplierIdByValue(item.alternateSupplier || "");
        this.attemptDraft = {
            reference: item.reference,
            supplierId,
            supplier: item.supplier,
            alternateSupplierId,
            alternateSupplier: item.alternateSupplier || "",
            estimatedLeadDays: item.estimatedLeadDays || 0,
            quotedUnitCost: item.lastQuotedUnitCost || 0,
            resultNote: item.shortageReason || "",
            procurementOwner: item.procurementOwner || "",
        };
    }

    markObsolete(reference: string): void {
        const result = this.inventoryWorkflow.markReplenishmentObsolete(reference);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    generatePurchaseLines(): void {
        const result = this.inventoryWorkflow.generatePurchaseLines();
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    markSent(lineId: string): void {
        const result = this.inventoryWorkflow.markPurchaseLineSent(lineId);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    closeLine(lineId: string): void {
        const result = this.inventoryWorkflow.closePurchaseLine(lineId);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    approveLine(lineId: string): void {
        if (!confirm("Deseas aprobar esta linea de compra?")) {
            return;
        }
        this.inventoryApi.approvePurchaseLine(lineId).subscribe({
            next: (result) => {
                this.setFeedback(result?.message || "Linea de compra aprobada.", "success");
                void this.inventoryWorkflow.loadFromApi().then(() => this.refreshState());
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.setFeedback(err?.message || "No se pudo aprobar la linea de compra.", "danger");
                this.cdr.detectChanges();
            },
        });
    }

    rejectLine(lineId: string): void {
        if (!confirm("Deseas rechazar esta linea de compra?")) {
            return;
        }
        this.inventoryApi.rejectPurchaseLine(lineId).subscribe({
            next: (result) => {
                this.setFeedback(result?.message || "Linea de compra rechazada.", "success");
                void this.inventoryWorkflow.loadFromApi().then(() => this.refreshState());
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.setFeedback(err?.message || "No se pudo rechazar la linea de compra.", "danger");
                this.cdr.detectChanges();
            },
        });
    }

    projectLabel(projectId: string | undefined): string {
        return projectOriginLabel(this.projects, projectId);
    }

    approvalStatusClass(status: PurchaseLine["approvalStatus"]): string {
        if (status === "aprobada") {
            return "text-bg-success";
        }
        if (status === "rechazada") {
            return "text-bg-danger";
        }
        return "text-bg-warning";
    }

    generateWeeklySnapshot(): void {
        const result = this.inventoryWorkflow.generateWeeklyShortageSnapshot();
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    daysWaiting(item: ReplenishmentItem): number {
        const start = Date.parse(item.firstInsufficientAt);
        if (Number.isNaN(start)) {
            return 0;
        }
        const diff = Date.now() - start;
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }

    statusClass(status: ReplenishmentStatus): string {
        if (status === "pendiente") {
            return "text-bg-secondary";
        }
        if (status === "en-gestion") {
            return "text-bg-info";
        }
        if (status === "escalar") {
            return "text-bg-warning";
        }
        return "text-bg-dark";
    }

    private criticality(item: ReplenishmentItem): number {
        return (item.minStock - item.currentStock) + item.attempts;
    }

    private refreshState(): void {
        const snapshot = this.inventoryWorkflow.getSnapshot();
        this.items = snapshot.replenishmentItems;
        this.purchaseLines = snapshot.purchaseLines;
        this.weeklySnapshots = snapshot.weeklySnapshots;
    }

    resetAttemptDraft(): void {
        this.attemptDraft = {
            reference: "",
            supplierId: null,
            supplier: "",
            alternateSupplierId: null,
            alternateSupplier: "",
            estimatedLeadDays: 0,
            quotedUnitCost: 0,
            resultNote: "",
            procurementOwner: "",
        };
    }

    private findSupplierIdByValue(value: string): number | null {
        const normalizedValue = value.trim();
        if (!normalizedValue) {
            return null;
        }

        const codeCandidate = normalizedValue.split("-")[0]?.trim().toLowerCase() || "";

        const supplier = this.suppliers.find((item) => {
            const normalizedCode = item.supplierNumber.trim().toLowerCase();
            const normalizedName = item.legalName.trim().toLowerCase();
            const normalizedDisplay = this.buildSupplierLabel(item).toLowerCase();
            const normalizedRaw = normalizedValue.toLowerCase();

            if (codeCandidate && normalizedCode === codeCandidate) {
                return true;
            }

            return normalizedName === normalizedRaw || normalizedDisplay === normalizedRaw;
        });

        return supplier?.id ?? null;
    }

    private buildSupplierLabel(supplier: SupplierRecord): string {
        return `${supplier.supplierNumber} - ${supplier.legalName}`;
    }

    private refreshSuppliers(): void {
        this.suppliers = this.suppliersCatalog.getSnapshot();
    }

    private setFeedback(message: string, type: "success" | "warning" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }
}
