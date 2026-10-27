import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ReservationRecord } from "../../../services/inventory-domain.models";

export interface ReservationActionOutcome {
    id: string;
    ok: boolean;
    message: string;
    expiresAt?: string;
}

/**
 * INV-03/INV-04: tabla de reservas con badge de estado (incluye "vencida"),
 * acciones Renovar/Liberar habilitadas tambien para vencidas (el backend las
 * acepta: renovar reactiva con nueva fecha y liberar devuelve el stock sin
 * doble descuento) y accion Consumir cuyo rechazo muestra el mensaje del
 * backend tal cual.
 */
@Component({
    selector: "app-reservations-table",
    standalone: true,
    imports: [CommonModule],
    template: `
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
                    <tr *ngFor="let reservation of reservations" [attr.data-testid]="'reservation-row-' + reservation.id">
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
                            <span
                                class="badge"
                                [ngClass]="statusClass(reservation.status)"
                                [attr.data-testid]="'reservation-status-' + reservation.id"
                            >
                                {{ reservation.status }}
                            </span>
                        </td>
                        <td class="text-end">
                            <ng-container *ngIf="canManage">
                                <button
                                    *ngIf="canRenewOrRelease(reservation)"
                                    class="btn btn-sm btn-outline-secondary me-2"
                                    type="button"
                                    [attr.data-testid]="'reservation-renew-' + reservation.id"
                                    (click)="renew.emit(reservation.id)"
                                >
                                    Renovar
                                </button>
                                <button
                                    *ngIf="canRenewOrRelease(reservation)"
                                    class="btn btn-sm btn-outline-danger me-2"
                                    type="button"
                                    [attr.data-testid]="'reservation-release-' + reservation.id"
                                    (click)="release.emit(reservation.id)"
                                >
                                    Liberar
                                </button>
                                <button
                                    *ngIf="reservation.status === 'activa'"
                                    class="btn btn-sm btn-outline-theme"
                                    type="button"
                                    [attr.data-testid]="'reservation-consume-' + reservation.id"
                                    (click)="consume.emit(reservation.id)"
                                >
                                    Consumir
                                </button>
                            </ng-container>
                        </td>
                    </tr>
                    <tr *ngIf="reservations.length === 0">
                        <td colspan="11" class="text-center text-secondary py-4">No hay reservas registradas.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
})
export class ReservationsTableComponent {
    @Input({ required: true }) reservations: ReservationRecord[] = [];
    @Input() canManage = false;
    @Output() readonly renew = new EventEmitter<string>();
    @Output() readonly release = new EventEmitter<string>();
    @Output() readonly consume = new EventEmitter<string>();

    canRenewOrRelease(reservation: ReservationRecord): boolean {
        return reservation.status === "activa" || reservation.status === "vencida";
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
}
