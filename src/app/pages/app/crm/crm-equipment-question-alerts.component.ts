import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { ProspectEquipmentItem } from "./crm-prospect-equipment.store";
import {
    isFailurePending,
    requiresPreviousInterventionWarning,
    requiresSoftwareSuspicionWarning,
} from "./crm-prospect-equipment-intake-validation.util";

@Component({
    selector: "app-crm-equipment-question-alerts",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="vstack gap-2 mb-3">
            <div class="alert alert-warning py-2 mb-0" *ngIf="requiresPreviousInterventionWarning(item)" data-testid="previous-intervention-warning">
                <i class="bi bi-exclamation-triangle me-1"></i>
                Equipo intervenido previamente / con piezas faltantes o silicona: revisar alcance técnico y comercial.
            </div>

            <div class="alert alert-warning py-2 mb-0" *ngIf="requiresSoftwareSuspicionWarning(item)" data-testid="software-suspicion-warning">
                <div class="fw-semibold mb-1">Posible falla de software</div>
                <p class="small mb-2">No prometemos servicio de software; el técnico confirmará el alcance.</p>
                <div class="form-check mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        [id]="'software-suspicion-ack-' + item.id"
                        [(ngModel)]="item.softwareSuspicionAcknowledged"
                        [ngModelOptions]="{ standalone: true }"
                        data-testid="software-suspicion-ack" />
                    <label class="form-check-label small" [for]="'software-suspicion-ack-' + item.id">Cliente informado</label>
                </div>
            </div>

            <span class="badge text-bg-info w-100 text-start" *ngIf="isFailurePending(item)" data-testid="failure-pending-badge">
                <i class="bi bi-info-circle me-1"></i>Falla pendiente: se solicitará declaración al cliente
            </span>
        </div>
    `,
})
export class CrmEquipmentQuestionAlertsComponent {
    @Input({ required: true }) item!: ProspectEquipmentItem;

    readonly requiresPreviousInterventionWarning = requiresPreviousInterventionWarning;
    readonly requiresSoftwareSuspicionWarning = requiresSoftwareSuspicionWarning;
    readonly isFailurePending = isFailurePending;
}
