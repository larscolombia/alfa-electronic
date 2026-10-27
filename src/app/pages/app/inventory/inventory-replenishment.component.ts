import * as XLSX from "xlsx";

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
import { ReplenishmentAlertsComponent } from "./replenishment-alerts.component";
import { ReplenishmentDecisionFormComponent } from "./replenishment-decision-form.component";
import { InvBackendAlertComponent } from "./inv-backend-alert.component";
import { InvRoleHintComponent } from "./inv-role-hint.component";
import { projectOriginLabel } from "./project-origin-label.util";
import { consumePurchaseWorkflowHandoff, PurchaseWorkflowHandoff } from "./purchase-workflow-handoff.store";

@Component({
    selector: "app-inventory-replenishment",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, PurchaseRequestsPanelComponent, ReplenishmentAlertsComponent, ReplenishmentDecisionFormComponent, InvRoleHintComponent, InvBackendAlertComponent],
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

            <app-inv-role-hint></app-inv-role-hint>
            <app-inv-backend-alert></app-inv-backend-alert>

            <div *ngIf="feedback" class="alert mb-3" [ngClass]="feedbackClass">
                {{ feedback }}
            </div>

            <div *ngIf="workflowHandoff" class="alert alert-success border d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3" role="status">
                <div>
                    <strong>Siguiente paso: revisar solicitudes de compra.</strong>
                    <span class="d-block small mt-1">OC {{ workflowHandoff.purchaseOrderNumber || 'registrada' }}{{ workflowHandoff.quoteCode ? ' · ' + workflowHandoff.quoteCode : '' }}. El contexto se conservó desde la cotización.</span>
                </div>
                <a class="btn btn-sm btn-success" href="#purchase-requests">Ver solicitudes</a>
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

            <app-replenishment-alerts [items]="items"></app-replenishment-alerts>

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
                                <ng-container *ngFor="let item of visibleItems">
                                    <tr>
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
                                            <button class="btn btn-sm btn-outline-secondary me-2" type="button" [disabled]="item.status === 'obsoleto' || item.status === 'escalar' || !canManageReplenishment" (click)="registerAttempt(item.reference)">Intento rapido</button>
                                            <button class="btn btn-sm btn-outline-theme me-2" type="button" [disabled]="item.status === 'obsoleto' || !canManageReplenishment" (click)="loadAttemptDraft(item)">Cargar detalle</button>
                                            <button class="btn btn-sm btn-outline-danger me-2" type="button" [disabled]="item.status === 'obsoleto' || !canManageReplenishment" (click)="markObsolete(item.reference)">Marcar obsoleto</button>
                                            <button
                                                *ngIf="item.status === 'escalar' && canManageReplenishment"
                                                class="btn btn-sm btn-outline-theme"
                                                type="button"
                                                [attr.data-testid]="'decision-open-' + item.reference"
                                                (click)="toggleDecisionForm(item.reference)"
                                            >
                                                {{ decisionFormFor === item.reference ? 'Cerrar decision' : 'Resolver escalacion' }}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr *ngIf="item.status === 'escalar' && decisionFormFor === item.reference">
                                        <td colspan="12" class="p-2 border-0">
                                            <div class="alert alert-warning border small py-2 mb-2" [attr.data-testid]="'replenishment-escalated-hint-' + item.reference" role="note">
                                                Este item esta escalado: registrar otro intento esta bloqueado. Registra una
                                                decision (cambiar de proveedor o marcar obsoleto) para poder seguir gestionandolo.
                                            </div>
                                            <app-replenishment-decision-form
                                                [reference]="item.reference"
                                                (changed)="onDecisionChanged()"
                                                (cancel)="decisionFormFor = ''"
                                            ></app-replenishment-decision-form>
                                        </td>
                                    </tr>
                                </ng-container>
                                <tr *ngIf="visibleItems.length === 0">
                                    <td colspan="12" class="text-center text-secondary py-4">No hay items para el filtro actual.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <app-purchase-requests-panel [focusEquipmentItemIds]="workflowHandoff?.equipmentItemIds ?? []"></app-purchase-requests-panel>

            <div class="card adminuiux-card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">Lineas de compra</h6>
                </div>
                <div class="card-body border-bottom py-2">
                    <div class="d-flex flex-wrap align-items-center gap-2">
                        <label class="form-label mb-0 me-1 small text-secondary" for="line-supplier-filter">Proveedores</label>
                        <select id="line-supplier-filter" class="form-select form-select-sm w-auto" [(ngModel)]="lineSupplierFilter">
                            <option value="">Todos los proveedores ({{ purchaseLines.length }})</option>
                            <option *ngFor="let name of lineSuppliers" [value]="name">{{ name }}</option>
                        </select>
                        <span class="small text-secondary">{{ visiblePurchaseLines.length }} linea(s) en la vista</span>
                        <div class="ms-auto d-flex align-items-center gap-2">
                            <button class="btn btn-outline-theme" type="button" [disabled]="visiblePurchaseLines.length === 0 || !canManageReplenishment" (click)="downloadSupplierExcel()" data-testid="download-purchase-lines-excel">
                                <i class="bi bi-file-earmark-spreadsheet me-1"></i>Descargar Excel de repuestos
                            </button>
                            <button class="btn btn-outline-theme" type="button" [disabled]="visiblePurchaseLines.length === 0 || !canManageReplenishment" (click)="downloadBomExcel()" data-testid="download-purchase-lines-bom">
                                <i class="bi bi-file-earmark-spreadsheet me-1"></i>BOM proveedor (2 columnas)
                            </button>
                        </div>
                    </div>
                    <p class="small text-secondary mt-2 mb-0">Marca con el checkbox las lineas que necesitas; sin selecciones se exporta todo lo visible. El archivo incluye solicitado vs. recibido por linea, listo para enviar al proveedor.</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0" data-testid="purchase-lines-table">
                            <thead>
                                <tr>
                                    <th class="text-center"><input type="checkbox" class="form-check-input m-0" [checked]="allVisibleSelected" (change)="toggleSelectAllVisible($event)" aria-label="Seleccionar todas las lineas visibles" /></th>
                                    <th>Referencia</th>
                                    <th>Componente</th>
                                    <th>Tipo</th>
                                    <th>Marca</th>
                                    <th>Cantidad</th>
                                    <th>Recibido</th>
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
                                <tr *ngFor="let line of visiblePurchaseLines" data-testid="purchase-line-row">
                                    <td class="text-center"><input type="checkbox" class="form-check-input m-0" [checked]="selectedForExcel[line.id]" (change)="toggleLineSelected(line.id, $event)" aria-label="Seleccionar linea para Excel" /></td>
                                    <td><strong>{{ line.reference }}</strong></td>
                                    <td>{{ line.component || '--' }}</td>
                                    <td>{{ line.type || '--' }}</td>
                                    <td>{{ line.brand || '--' }}</td>
                                    <td>{{ line.quantity }}</td>
                                    <td>
                                        <span class="badge" [ngClass]="receivedBadgeClass(line)" data-testid="purchase-line-received">{{ line.receivedQuantity || 0 }}/{{ line.quantity }}</span>
                                        <div *ngIf="remainingFor(line) > 0" class="small text-secondary mt-1">Faltan {{ remainingFor(line) }}</div>
                                    </td>
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
                                        <ng-container *ngIf="line.status !== 'cerrada' && remainingFor(line) > 0">
                                            <input class="form-control form-control-sm me-1 d-inline-block" style="width: 4.5rem;" type="number" min="1" [max]="remainingFor(line)" placeholder="Cant." [(ngModel)]="receiveDrafts[line.id]" aria-label="Cantidad recibida de esta linea" />
                                            <button class="btn btn-sm btn-outline-success me-2" type="button" data-testid="receive-purchase-line" [disabled]="!canManageReplenishment || receivingLineIds.has(line.id)" (click)="receiveLine(line)">{{ receivingLineIds.has(line.id) ? 'Registrando...' : 'Recibir' }}</button>
                                        </ng-container>
                                        <button class="btn btn-sm btn-outline-secondary me-2" type="button" [disabled]="line.status !== 'pendiente' || !canManageReplenishment" (click)="markSent(line.id)">Enviar</button>
                                        <button class="btn btn-sm btn-outline-theme" type="button" [disabled]="line.status === 'cerrada' || !canManageReplenishment" (click)="closeLine(line.id)">Cerrar</button>
                                    </td>
                                </tr>
                                <tr *ngIf="visiblePurchaseLines.length === 0">
                                    <td colspan="15" class="text-center text-secondary py-4">Sin lineas de compra para el filtro actual.</td>
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
    workflowHandoff: PurchaseWorkflowHandoff | null = null;
    sortMode: "antiguedad" | "intentos" | "criticidad" = "antiguedad";
    statusFilter: "" | ReplenishmentStatus = "";

    items: ReplenishmentItem[] = [];
    purchaseLines: PurchaseLine[] = [];
    weeklySnapshots: WeeklyShortageSnapshot[] = [];
    suppliers: SupplierRecord[] = [];
    projects: Project[] = [];

    // Pedido por proveedor (Excel) + control de recibido vs solicitado.
    lineSupplierFilter = "";
    selectedForExcel: Record<string, boolean> = {};
    receiveDrafts: Record<string, number | null> = {};
    receivingLineIds = new Set<string>();

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
    decisionFormFor = "";

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
        this.workflowHandoff = consumePurchaseWorkflowHandoff();
        // Fase 6: el comprador responsable sale de RRHH.
        // Sin contexto a propósito: "comprador/compras" no pertenece ni al set
        // técnico ni al comercial; filtrar por rol ocultaría al comprador real.
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

    toggleDecisionForm(reference: string): void {
        this.decisionFormFor = this.decisionFormFor === reference ? "" : reference;
    }

    onDecisionChanged(): void {
        this.decisionFormFor = "";
        this.refreshState();
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

    // ─── Pedido por proveedor: recibido vs solicitado + Excel ────────────────

    get lineSuppliers(): string[] {
        const names = new Set<string>();
        for (const line of this.purchaseLines) {
            const name = (line.supplier || "").trim();
            if (name) {
                names.add(name);
            }
        }
        return [...names].sort((a, b) => a.localeCompare(b));
    }

    get visiblePurchaseLines(): PurchaseLine[] {
        if (!this.lineSupplierFilter) {
            return this.purchaseLines;
        }
        const wanted = this.lineSupplierFilter.toLowerCase();
        return this.purchaseLines.filter((line) => (line.supplier || "").toLowerCase() === wanted);
    }

    remainingFor(line: PurchaseLine): number {
        const received = line.receivedQuantity ?? 0;
        return Math.max(0, line.quantity - received);
    }

    receivedBadgeClass(line: PurchaseLine): string {
        if ((line.receivedQuantity ?? 0) >= line.quantity) {
            return "text-bg-success";
        }
        if ((line.receivedQuantity ?? 0) > 0) {
            return "text-bg-info";
        }
        return "text-bg-secondary";
    }

    get allVisibleSelected(): boolean {
        const rows = this.visiblePurchaseLines;
        return rows.length > 0 && rows.every((line) => !!this.selectedForExcel[line.id]);
    }

    toggleLineSelected(lineId: string, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.selectedForExcel = { ...this.selectedForExcel, [lineId]: checked };
    }

    toggleSelectAllVisible(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        const next = { ...this.selectedForExcel };
        for (const line of this.visiblePurchaseLines) {
            next[line.id] = checked;
        }
        this.selectedForExcel = next;
    }

    private exportRows(): PurchaseLine[] {
        const visible = this.visiblePurchaseLines;
        const selected = visible.filter((line) => !!this.selectedForExcel[line.id]);
        return selected.length > 0 ? selected : visible;
    }

    /**
     * COMPR-01 (MD): una línea sin OC validada NO debe exportarse al proveedor.
     * Solo las líneas con aprobación 'aprobada' son elegibles para los archivos
     * Excel de proveedor; pendientes o rechazadas quedan visibles en la tabla
     * (con su badge) pero nunca salen a los reportes que se suben al portal.
     */
    private onlyApproved(rows: PurchaseLine[]): PurchaseLine[] {
        return rows.filter((line) => (line.approvalStatus || "pendiente") === "aprobada");
    }

    receiveLine(line: PurchaseLine): void {
        const requested = Math.floor(Number(this.receiveDrafts[line.id]));
        if (!Number.isFinite(requested) || requested < 1) {
            this.setFeedback(`Indica la cantidad recibida de ${line.reference} (minimo 1).`, "warning");
            return;
        }
        this.receivingLineIds.add(line.id);
        this.cdr.detectChanges();
        this.inventoryApi.receivePurchaseLine(line.id, requested).subscribe({
            next: (result) => {
                this.receivingLineIds.delete(line.id);
                delete this.receiveDrafts[line.id];
                const limitNote = result?.message && /se limito/i.test(result.message) ? ` (${result.message})` : "";
                this.setFeedback(`Recibo de ${requested} unidad(es) registrado en ${line.reference}. El stock se actualizo solo por lo recibido.${limitNote}`, "success");
                void this.inventoryWorkflow.loadFromApi().then(() => this.refreshState());
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.receivingLineIds.delete(line.id);
                const message = err?.message || "No se pudo registrar el recibo.";
                this.setFeedback(message, /invalida|no existe|cerrada/i.test(message) ? "warning" : "danger");
                this.cdr.detectChanges();
            },
        });
    }

    downloadSupplierExcel(): void {
        const allRows = this.exportRows();
        const rows = this.onlyApproved(allRows);
        if (rows.length === 0) {
            this.setFeedback("No hay lineas de compra APROBADAS para exportar: las pendientes o rechazadas (sin OC validada) no se envian al proveedor.", "warning");
            return;
        }
        const header = [
            "Referencia", "Componente", "Descripcion", "Cantidad solicitada", "Recibido", "Faltante",
            "Estado", "Aprobacion", "Proveedor", "Proyecto origen", "Plazo (dias)", "Generada por",
        ];
        const data = [
            header,
            ...rows.map((line) => {
                const projectLabelValue = this.projectLabel(line.projectId);
                return [
                    line.reference,
                    line.component || "",
                    line.description || "",
                    line.quantity,
                    line.receivedQuantity ?? 0,
                    this.remainingFor(line),
                    line.status,
                    line.approvalStatus || "pendiente",
                    line.supplier || "(sin proveedor)",
                    projectLabelValue === "--" ? "" : projectLabelValue,
                    line.neededBy || "",
                    line.generatedBy,
                ];
            }),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Repuestos");
        const supplierPart = this.lineSupplierFilter ? `_${this.lineSupplierFilter.replace(/[^A-Za-z0-9]+/g, "-")}` : "_todos";
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        XLSX.writeFile(workbook, `repuestos${supplierPart}_${stamp}.xlsx`);
        const unapproved = allRows.length - rows.length;
        this.setFeedback(
            `Excel generado con ${rows.length} linea(s) aprobada(s)${this.lineSupplierFilter ? ` del proveedor ${this.lineSupplierFilter}` : ""}` +
                (unapproved > 0 ? `, ${unapproved} pendiente(s)/rechazada(s) excluida(s): sin OC validada no se exportan.` : ".") +
                " Verifica que solo queden las referencias que necesitas antes de enviarlo.",
            "success",
        );
    }

    /**
     * G5 (Paso 5 de la operacion real): BOM en el formato EXACTO que aceptan
     * los portales de carga masiva (Mouser "Lista de Materiales / Cargar Hoja
     * de Calculo"): solo dos columnas, "Numero de parte" y "Cantidad". Las
     * referencias repetidas se unifican en una sola fila sumando cantidades,
     * que es lo mismo que hace el portal al subirlo.
     *
     * Regla de cantidad: se ordena el FALTANTE (solicitado - recibido). Si ya
     * llego todo, la linea queda fuera; re-comprar unidades recibidas seria
     * doble compra. Sin filtro de proveedor exporta lo visible/seleccionado.
     */
    downloadBomExcel(): void {
        const allRows = this.exportRows();
        // COMPR-01: sin OC validada (aprobacion 'aprobada') la linea no sale al BOM del proveedor.
        const rows = this.onlyApproved(allRows);
        if (rows.length === 0) {
            this.setFeedback("No hay lineas APROBADAS para el BOM: las lineas sin OC validada (pendientes o rechazadas) quedan fuera del archivo del proveedor.", "warning");
            return;
        }

        const byReference = new Map<string, number>();
        let skippedFull = 0;
        for (const line of rows) {
            const ref = String(line.reference ?? "").trim();
            if (!ref) {
                continue; // Sin numero de parte no hay nada que cargar al portal.
            }
            const toOrder = this.remainingFor(line);
            if (toOrder <= 0) {
                skippedFull += 1; // Recibida por completo: fuera del BOM.
                continue;
            }
            byReference.set(ref, (byReference.get(ref) ?? 0) + Math.floor(toOrder));
        }

        if (byReference.size === 0) {
            this.setFeedback("Ninguna linea visible tiene faltante con numero de parte: no hay nada que ordenar al proveedor.", "warning");
            return;
        }

        const data = [
            ["Número de parte", "Cantidad"],
            ...Array.from(byReference.entries()).map(([ref, qty]) => [ref, qty]),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "BOM");
        const supplierPart = this.lineSupplierFilter ? `_${this.lineSupplierFilter.replace(/[^A-Za-z0-9]+/g, "-")}` : "_todos";
        const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        XLSX.writeFile(workbook, `BOM${supplierPart}_${stamp}.xlsx`);

        const unapproved = allRows.length - rows.length;
        this.setFeedback(
            `BOM generado con ${byReference.size} referencia(s) unica(s) a partir de ${rows.length} linea(s) aprobada(s)` +
                (this.lineSupplierFilter ? ` del proveedor ${this.lineSupplierFilter}` : "") +
                (skippedFull > 0 ? `, ${skippedFull} ya recibida(s) por completo y excluida(s)` : "") +
                (unapproved > 0 ? `, ${unapproved} sin OC validada (pendiente/rechazada) excluida(s).` : ".") +
                " Formato de 2 columnas listo para subir al portal del proveedor.",
            "success",
        );
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
