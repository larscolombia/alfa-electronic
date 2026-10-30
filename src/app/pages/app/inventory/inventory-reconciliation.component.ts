import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { AuditEvent, CountSession, DiscrepancyRecord, InventoryRole, SessionStatus } from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { HrPeoplePickerService } from "../../../services/hr-people-picker.service";
import { DiscrepancyPanelComponent } from "./discrepancy-panel.component";
import { InvBackendAlertComponent } from "./inv-backend-alert.component";
import { InvRoleHintComponent } from "./inv-role-hint.component";

@Component({
    selector: "app-inventory-reconciliation",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, DiscrepancyPanelComponent, InvRoleHintComponent, InvBackendAlertComponent],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/inventory-dashboard">Volver al panel</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventario</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Conciliacion y auditoria</li>
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
                            <div class="alert mb-0" [ngClass]="canManageReconciliation ? 'alert-success border' : 'alert-warning border'">
                                <strong>Permisos:</strong>
                                <span *ngIf="canManageReconciliation"> puedes crear/iniciar/cerrar sesiones y aprobar diferencias.</span>
                                <span *ngIf="!canManageReconciliation"> solo consulta y exportacion segun rol.</span>
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

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Sesiones en curso</p>
                            <h4 class="mb-0">{{ openSessionsCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Diferencias sin aprobar</p>
                            <h4 class="mb-0">{{ unresolvedDiffs }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Eventos auditados</p>
                            <h4 class="mb-0">{{ auditTrail.length }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Nueva sesion de conteo</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-2">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Nombre</label>
                            <input class="form-control" [(ngModel)]="sessionDraft.name" placeholder="Cierre anual 2026" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Alcance</label>
                            <input class="form-control" [(ngModel)]="sessionDraft.scope" placeholder="Bodega principal, armario R" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Responsable</label>
                            <!-- Fase 6: el responsable de la sesión sale de RRHH.
                                 El valor guardado se conserva aunque ese empleado
                                 ya no esté activo. -->
                            <select class="form-select" [(ngModel)]="sessionDraft.owner" name="sessionOwner">
                                <option value="">Selecciona un responsable</option>
                                <option *ngFor="let person of ownerOptions" [value]="person">{{ person }}</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Fecha inicio</label>
                            <input class="form-control" type="date" [(ngModel)]="sessionDraft.startDate" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Ubicacion de conteo</label>
                            <input class="form-control" [(ngModel)]="sessionDraft.location" placeholder="Bodega principal / Armario R" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Fecha corte contable</label>
                            <input class="form-control" type="date" [(ngModel)]="sessionDraft.cutoffDate" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Metodo de conteo</label>
                            <select class="form-select" [(ngModel)]="sessionDraft.countingMethod">
                                <option value="conteo-ciego">Conteo ciego</option>
                                <option value="conteo-dirigido">Conteo dirigido</option>
                                <option value="conteo-ciclico">Conteo ciclico</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Lider QA / Auditor</label>
                            <input class="form-control" [(ngModel)]="sessionDraft.qaLead" placeholder="Supervisor QA" />
                        </div>
                    </div>
                    <div class="mt-3 d-flex gap-2 flex-wrap">
                        <button class="btn btn-theme" type="button" [disabled]="!canManageReconciliation" (click)="createSession()">Crear sesion</button>
                        <button class="btn btn-outline-secondary" type="button" (click)="resetSessionDraft()">Limpiar</button>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Sesiones</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Sesion</th>
                                    <th>Alcance</th>
                                    <th>Responsable</th>
                                    <th>Ubicacion</th>
                                    <th>Corte</th>
                                    <th>Metodo</th>
                                    <th>Inicio</th>
                                    <th>Estado</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let session of sessions">
                                    <td>{{ session.name }}</td>
                                    <td>{{ session.scope }}</td>
                                    <td>{{ session.owner }}</td>
                                    <td>{{ session.location || '--' }}</td>
                                    <td>{{ session.cutoffDate || '--' }}</td>
                                    <td>{{ session.countingMethod || '--' }}</td>
                                    <td>{{ session.startDate | date: 'dd/MM/yyyy' }}</td>
                                    <td><span class="badge" [ngClass]="statusClass(session.status)">{{ session.status }}</span></td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-secondary me-2" type="button" [disabled]="session.status !== 'planificada' || !canManageReconciliation" (click)="openSession(session.id)">Iniciar</button>
                                        <button class="btn btn-sm btn-outline-theme me-2" type="button" [disabled]="session.status !== 'en-curso' || !canManageReconciliation" (click)="closeSession(session.id)">Cerrar</button>
                                        <button class="btn btn-sm btn-outline-success" type="button" [disabled]="session.status !== 'cerrada' || !canExportReconciliation" (click)="exportSession(session.id)">Exportar acta</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <app-discrepancy-panel></app-discrepancy-panel>

<div class="card adminuiux-card">
                <div class="card-header">
                    <h6 class="mb-0">Bitacora de auditoria</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Usuario</th>
                                    <th>Accion</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let event of auditTrail">
                                    <td>{{ event.when | date: 'dd/MM/yyyy HH:mm' }}</td>
                                    <td>{{ event.user }}</td>
                                    <td>{{ event.action }}</td>
                                    <td>{{ event.detail }}</td>
                                </tr>
                                <tr *ngIf="auditTrail.length === 0">
                                    <td colspan="4" class="text-center text-secondary py-4">Sin eventos de auditoria.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InventoryReconciliationComponent implements OnInit {
    sessionDraft = {
        name: "",
        scope: "",
        owner: "",
        location: "",
        cutoffDate: this.todayKey(),
        countingMethod: "conteo-ciego",
        qaLead: "",
        startDate: this.todayKey(),
    };

    sessions: CountSession[] = [];
    discrepancies: DiscrepancyRecord[] = [];
    auditTrail: AuditEvent[] = [];

    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";

    constructor(
        private readonly inventoryRbac: InventoryRbacService,
        private readonly inventoryWorkflow: InventoryWorkflowService,
        private readonly hrPeople: HrPeoplePickerService
    ) { }

    /** Fase 6: empleados activos de RRHH para el select de responsable. */
    peopleNames: string[] = [];

    get ownerOptions(): string[] {
        return this.hrPeople.merge(this.peopleNames, this.sessionDraft.owner);
    }

    ngOnInit(): void {
        // Fase 6: el responsable de la sesión de conteo sale de RRHH.
        // Contexto tecnica: un conteo físico lo hace operación/taller, no ventas.
        void this.hrPeople.refresh('tecnica').then((names) => {
            this.peopleNames = names;
        });
        this.refreshState();
    }

    get rolePreset(): InventoryRole {
        return this.inventoryRbac.currentRole;
    }

    set rolePreset(role: InventoryRole) {
        this.inventoryRbac.setRole(role);
    }

    get canManageReconciliation(): boolean {
        return this.inventoryRbac.hasPermission("inventory.reconciliation.manage");
    }

    get canExportReconciliation(): boolean {
        return this.inventoryRbac.hasPermission("inventory.reconciliation.export");
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

    get openSessionsCount(): number {
        return this.sessions.filter((item) => item.status === "en-curso").length;
    }

    get unresolvedDiffs(): number {
        return this.discrepancies.filter((item) => !item.approvedAt).length;
    }

    createSession(): void {
        const result = this.inventoryWorkflow.createSession({
            name: this.sessionDraft.name,
            scope: this.sessionDraft.scope,
            owner: this.sessionDraft.owner,
            startDate: this.sessionDraft.startDate,
            location: this.sessionDraft.location,
            cutoffDate: this.sessionDraft.cutoffDate,
            countingMethod: this.sessionDraft.countingMethod,
            qaLead: this.sessionDraft.qaLead,
        });

        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.resetSessionDraft();
            this.refreshState();
        }
    }

    openSession(id: string): void {
        const result = this.inventoryWorkflow.openSession(id);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    closeSession(id: string): void {
        const result = this.inventoryWorkflow.closeSession(id);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    approveDifference(id: string): void {
        const result = this.inventoryWorkflow.approveDifference(id);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    exportSession(sessionId: string): void {
        const csvContent = this.inventoryWorkflow.buildClosureActCsv(sessionId);
        if (!csvContent) {
            this.setFeedback("No se pudo exportar el acta. Verifica permisos o estado de la sesion.", "danger");
            return;
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `acta-conciliacion-${sessionId}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);

        this.setFeedback("Acta exportada en CSV correctamente.", "success");
    }

    statusClass(status: SessionStatus): string {
        if (status === "planificada") {
            return "text-bg-secondary";
        }
        if (status === "en-curso") {
            return "text-bg-warning";
        }
        return "text-bg-success";
    }

    resetSessionDraft(): void {
        this.sessionDraft = {
            name: "",
            scope: "",
            owner: "",
            location: "",
            cutoffDate: this.todayKey(),
            countingMethod: "conteo-ciego",
            qaLead: "",
            startDate: this.todayKey(),
        };
    }

    private todayKey(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = `${now.getMonth() + 1}`.padStart(2, "0");
        const day = `${now.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private refreshState(): void {
        const snapshot = this.inventoryWorkflow.getSnapshot();
        this.sessions = snapshot.sessions;
        this.discrepancies = snapshot.discrepancies;
        this.auditTrail = snapshot.auditTrail;
    }

    private setFeedback(message: string, type: "success" | "warning" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }
}
