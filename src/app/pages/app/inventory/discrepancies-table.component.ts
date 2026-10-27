import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CountSession, DiscrepancyRecord } from "../../../services/inventory-domain.models";

/**
 * Listado de discrepancias de conteo (INV-09) con el boton de aprobar el
 * ajuste y el marcador de ajuste ya aplicado (una sola vez por diferencia).
 */
@Component({
    selector: "app-discrepancies-table",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="table-responsive">
            <table class="table align-middle mb-0" data-testid="discrepancies-table">
                <thead>
                    <tr>
                        <th>Referencia</th>
                        <th>Sesion</th>
                        <th>Sistema</th>
                        <th>Fisico</th>
                        <th>Diferencia</th>
                        <th>Motivo</th>
                        <th>Ajuste aplicado</th>
                        <th class="text-end">Accion</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let diff of discrepancies" [attr.data-testid]="'discrepancy-row-' + diff.id">
                        <td>{{ diff.reference }}</td>
                        <td>{{ sessionName(diff.sessionId) }}</td>
                        <td>{{ diff.expected }}</td>
                        <td>{{ diff.counted }}</td>
                        <td [ngClass]="diff.counted - diff.expected < 0 ? 'text-danger fw-semibold' : 'text-success fw-semibold'">
                            {{ diff.counted - diff.expected }}
                        </td>
                        <td>{{ diff.reason }}</td>
                        <td>
                            <span
                                *ngIf="diff.approvedAt"
                                class="small text-success"
                                [attr.data-testid]="'discrepancy-adjusted-' + diff.id"
                            >
                                {{ diff.approvedBy }} · {{ diff.approvedAt | date: 'dd/MM HH:mm' }}
                            </span>
                            <span *ngIf="!diff.approvedAt" class="small text-secondary">Pendiente</span>
                        </td>
                        <td class="text-end">
                            <button
                                *ngIf="!diff.approvedAt"
                                class="btn btn-sm btn-outline-theme"
                                type="button"
                                [disabled]="!canManage || approvingId === diff.id"
                                [attr.data-testid]="'discrepancy-approve-' + diff.id"
                                (click)="approve.emit(diff)"
                            >
                                Aprobar ajuste
                            </button>
                        </td>
                    </tr>
                    <tr *ngIf="discrepancies.length === 0">
                        <td colspan="8" class="text-center text-secondary py-4">Sin diferencias registradas.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
})
export class DiscrepanciesTableComponent {
    @Input({ required: true }) discrepancies: DiscrepancyRecord[] = [];
    @Input({ required: true }) sessions: CountSession[] = [];
    @Input() canManage = false;
    @Input() approvingId = "";
    @Output() readonly approve = new EventEmitter<DiscrepancyRecord>();

    sessionName(sessionId: string | undefined): string {
        if (!sessionId) {
            return "--";
        }
        return this.sessions.find((session) => session.id === sessionId)?.name ?? sessionId;
    }
}
