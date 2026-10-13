import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { InventoryRole, ReservationRecord } from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";

@Component({
    selector: "app-inventory-reservations",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Inventario - Reservas</h5>
                    <p class="text-secondary small mb-0">Control de reservas para evitar componentes congelados por tiempo indefinido.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/inventory-dashboard">Volver al panel</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventario</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Reservas</li>
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
                            <div class="alert mb-0" [ngClass]="canManageReservations ? 'alert-success border' : 'alert-warning border'">
                                <strong>Permisos:</strong>
                                <span *ngIf="canManageReservations"> puedes crear, renovar y liberar reservas.</span>
                                <span *ngIf="!canManageReservations"> solo tienes vista de reservas.</span>
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
                            <p class="small text-secondary mb-1">Reservas activas</p>
                            <h4 class="mb-0">{{ activeCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Vencidas</p>
                            <h4 class="mb-0">{{ overdueCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Dias maximos de reserva</p>
                            <h4 class="mb-0">{{ maxReserveDays }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Politica de reservas</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-2 align-items-end">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Maximo de dias</label>
                            <input class="form-control" type="number" min="1" [(ngModel)]="maxReserveDays" [disabled]="!canManageReservations" />
                        </div>
                        <div class="col-12 col-md-auto">
                            <button class="btn btn-outline-theme" type="button" [disabled]="!canManageReservations" (click)="saveReservePolicy()">Aplicar politica</button>
                        </div>
                        <div class="col-12 col-md">
                            <div class="alert alert-warning border mb-0">
                                Si una reserva supera este limite, el sistema la marca vencida para forzar liberacion o renovacion justificada.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Nueva reserva</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-2">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Referencia</label>
                            <input class="form-control" [(ngModel)]="draft.reference" placeholder="Ej: LM324N" />
                        </div>
                        <div class="col-12 col-md-2">
                            <label class="form-label">Cantidad</label>
                            <input class="form-control" type="number" min="1" [(ngModel)]="draft.quantity" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Asignado a</label>
                            <input class="form-control" [(ngModel)]="draft.assignedTo" placeholder="Tecnico responsable" />
                        </div>
                        <div class="col-12 col-md-4">
                            <label class="form-label">Motivo</label>
                            <input class="form-control" [(ngModel)]="draft.purpose" placeholder="Reparacion urgente, cliente critico, etc." />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">ODS / Orden trabajo</label>
                            <input class="form-control" [(ngModel)]="draft.workOrder" placeholder="ODS-2026-0411" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Tag equipo</label>
                            <input class="form-control" [(ngModel)]="draft.equipmentTag" placeholder="EQ-CL-009" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Cliente / Planta</label>
                            <input class="form-control" [(ngModel)]="draft.customerSite" placeholder="Planta Centro - Cliente ACME" />
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Prioridad</label>
                            <select class="form-select" [(ngModel)]="draft.priority">
                                <option value="critica">Critica</option>
                                <option value="alta">Alta</option>
                                <option value="media">Media</option>
                                <option value="baja">Baja</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Fecha compromiso</label>
                            <input class="form-control" type="date" [(ngModel)]="draft.commitmentDate" />
                        </div>
                    </div>
                    <div class="mt-3 d-flex gap-2 flex-wrap">
                        <button class="btn btn-theme" type="button" [disabled]="!canManageReservations" (click)="createReservation()">Crear reserva</button>
                        <button class="btn btn-outline-secondary" type="button" (click)="resetDraft()">Limpiar</button>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card">
                <div class="card-header">
                    <h6 class="mb-0">Reservas registradas</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Referencia</th>
                                    <th>Cantidad</th>
                                    <th>Asignado</th>
                                    <th>ODS</th>
                                    <th>Equipo</th>
                                    <th>Cliente/Planta</th>
                                    <th>Prioridad</th>
                                    <th>Inicio</th>
                                    <th>Vence</th>
                                    <th>Estado</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let reservation of reservations">
                                    <td>{{ reservation.reference }}</td>
                                    <td>{{ reservation.quantity }}</td>
                                    <td>{{ reservation.assignedTo }}</td>
                                    <td>{{ reservation.workOrder || '--' }}</td>
                                    <td>{{ reservation.equipmentTag || '--' }}</td>
                                    <td>{{ reservation.customerSite || '--' }}</td>
                                    <td>{{ reservation.priority || '--' }}</td>
                                    <td>{{ reservation.reservedAt | date: 'dd/MM/yyyy' }}</td>
                                    <td>{{ reservation.expiresAt | date: 'dd/MM/yyyy' }}</td>
                                    <td>
                                        <span class="badge" [ngClass]="statusClass(reservation.status)">{{ reservation.status }}</span>
                                    </td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-secondary me-2" type="button" [disabled]="reservation.status !== 'activa' || !canManageReservations" (click)="extendReservation(reservation.id)">Renovar</button>
                                        <button class="btn btn-sm btn-outline-danger" type="button" [disabled]="reservation.status !== 'activa' || !canManageReservations" (click)="releaseReservation(reservation.id)">Liberar</button>
                                    </td>
                                </tr>
                                <tr *ngIf="reservations.length === 0">
                                    <td colspan="11" class="text-center text-secondary py-4">No hay reservas registradas.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InventoryReservationsComponent implements OnInit {
    maxReserveDays = 5;

    draft = {
        reference: "",
        quantity: 1,
        assignedTo: "",
        purpose: "",
        workOrder: "",
        equipmentTag: "",
        customerSite: "",
        priority: "alta" as "critica" | "alta" | "media" | "baja",
        commitmentDate: "",
    };

    reservations: ReservationRecord[] = [];

    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";

    constructor(
        private readonly inventoryRbac: InventoryRbacService,
        private readonly inventoryWorkflow: InventoryWorkflowService
    ) { }

    ngOnInit(): void {
        this.refreshState();
    }

    get rolePreset(): InventoryRole {
        return this.inventoryRbac.currentRole;
    }

    set rolePreset(role: InventoryRole) {
        this.inventoryRbac.setRole(role);
    }

    get canManageReservations(): boolean {
        return this.inventoryRbac.hasPermission("inventory.reservations.manage");
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

    get activeCount(): number {
        return this.reservations.filter((item) => item.status === "activa").length;
    }

    get overdueCount(): number {
        return this.reservations.filter((item) => item.status === "vencida").length;
    }

    saveReservePolicy(): void {
        const result = this.inventoryWorkflow.setMaxReserveDays(this.maxReserveDays);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    createReservation(): void {
        const result = this.inventoryWorkflow.createReservation({
            reference: this.draft.reference,
            quantity: Number(this.draft.quantity),
            assignedTo: this.draft.assignedTo,
            purpose: this.draft.purpose,
            workOrder: this.draft.workOrder,
            equipmentTag: this.draft.equipmentTag,
            customerSite: this.draft.customerSite,
            priority: this.draft.priority,
            commitmentDate: this.draft.commitmentDate,
        });

        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.resetDraft();
            this.refreshState();
        }
    }

    releaseReservation(id: string): void {
        const result = this.inventoryWorkflow.releaseReservation(id);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    extendReservation(id: string): void {
        const result = this.inventoryWorkflow.extendReservation(id);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.refreshState();
        }
    }

    statusClass(status: ReservationRecord["status"]): string {
        if (status === "activa") {
            return "text-bg-success";
        }
        if (status === "vencida") {
            return "text-bg-danger";
        }
        return "text-bg-secondary";
    }

    resetDraft(): void {
        this.draft = {
            reference: "",
            quantity: 1,
            assignedTo: "",
            purpose: "",
            workOrder: "",
            equipmentTag: "",
            customerSite: "",
            priority: "alta",
            commitmentDate: "",
        };
    }

    private refreshState(): void {
        const snapshot = this.inventoryWorkflow.getSnapshot();
        this.maxReserveDays = snapshot.maxReserveDays;
        this.reservations = snapshot.reservations;
    }

    private setFeedback(message: string, type: "success" | "warning" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }
}
