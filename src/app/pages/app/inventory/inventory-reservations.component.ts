import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { InventoryRole, ReservationRecord } from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryReservationActionsService } from "../../../services/inventory-reservation-actions.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { HrPeoplePickerService } from "../../../services/hr-people-picker.service";
import { InvBackendAlertComponent } from "./inv-backend-alert.component";
import { InvRoleHintComponent } from "./inv-role-hint.component";
import { ReservationsTableComponent } from "./reservations-table.component";

@Component({
    selector: "app-inventory-reservations",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, InvRoleHintComponent, InvBackendAlertComponent, ReservationsTableComponent],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
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

            <app-inv-role-hint></app-inv-role-hint>
            <app-inv-backend-alert></app-inv-backend-alert>

            <div *ngIf="feedback" class="alert mb-3" [ngClass]="feedbackClass" [attr.data-testid]="feedbackTestId">
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
                            <input class="form-control" type="number" min="0" [(ngModel)]="maxReserveDays" [disabled]="!canManageReservations" />
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
                            <!-- Fase 6: el técnico de la reserva sale de RRHH. El
                                 valor guardado se conserva aunque ya no esté activo. -->
                            <select class="form-select" [(ngModel)]="draft.assignedTo" name="reservationAssignedTo">
                                <option value="">Selecciona un tecnico</option>
                                <option *ngFor="let person of assignedToOptions" [value]="person">{{ person }}</option>
                            </select>
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
                    <p class="small text-secondary mb-0">
                        Las reservas vencidas se pueden renovar (nueva fecha) o liberar (el stock
                        reservado vuelve a estar disponible una sola vez).
                    </p>
                </div>
                <div class="card-body p-0">
                    <app-reservations-table
                        [reservations]="reservations"
                        [canManage]="canManageReservations"
                        (renew)="extendReservation($event)"
                        (release)="releaseReservation($event)"
                        (consume)="consumeReservation($event)"
                    ></app-reservations-table>
                </div>
            </div>
        </div>
    `,
})
export class InventoryReservationsComponent implements OnInit, OnDestroy {
    private readonly subscriptions = new Subscription();
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
        private readonly inventoryWorkflow: InventoryWorkflowService,
        private readonly reservationActions: InventoryReservationActionsService,
        private readonly hrPeople: HrPeoplePickerService
    ) { }

    /** Confirmacion del ultima accion para el data-testid del feedback (INV-03/04). */
    private lastAction: { id: string; kind: "released" | "renewed" } | null = null;

    /** Fase 6: empleados activos de RRHH para el select de asignado a. */
    peopleNames: string[] = [];

    get assignedToOptions(): string[] {
        return this.hrPeople.merge(this.peopleNames, this.draft.assignedTo);
    }

    ngOnInit(): void {
        // Fase 6: el técnico de la reserva sale de RRHH.
        // Contexto tecnica: una reserva de material se asigna al técnico que va a
        // usarla, no a un comercial.
        void this.hrPeople.refresh('tecnica').then((names) => {
            this.peopleNames = names;
        });
        this.refreshState();
        // El estado llega asincrono desde el backend: re-leerlo en cada emision.
        this.subscriptions.add(
            this.inventoryWorkflow.state$.subscribe(() => this.refreshState())
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

    async createReservation(): Promise<void> {
        const result = await this.inventoryWorkflow.createReservation({
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

    async releaseReservation(id: string): Promise<void> {
        const result = await this.reservationActions.release(id);
        this.lastAction = result.ok ? { id, kind: "released" } : null;
        const suffix = result.ok
            ? " El stock reservado quedo disponible de nuevo (liberado una sola vez)."
            : "";
        this.setFeedback(result.message + suffix, result.ok ? "success" : "danger");
        this.refreshState();
    }

    async extendReservation(id: string): Promise<void> {
        const result = await this.reservationActions.extend(id);
        this.lastAction = result.ok ? { id, kind: "renewed" } : null;
        const expires = result.ok && result.expiresAt ? ` Nueva fecha de vencimiento: ${new Date(result.expiresAt).toLocaleDateString("es-CO")}.` : "";
        this.setFeedback(result.message + expires, result.ok ? "success" : "danger");
        this.refreshState();
    }

    async consumeReservation(id: string): Promise<void> {
        this.lastAction = null;
        const result = await this.reservationActions.consume(id);
        this.setFeedback(result.message, result.ok ? "success" : "danger");
        this.refreshState();
    }

    get feedbackTestId(): string {
        if (this.lastAction?.kind === "released") {
            return `reservation-released-${this.lastAction.id}`;
        }
        if (this.lastAction?.kind === "renewed") {
            return `reservation-renewed-${this.lastAction.id}`;
        }
        return "inv-reservations-feedback";
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
