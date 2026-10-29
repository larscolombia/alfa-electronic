import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";

import type { ProspectEquipmentItem } from "./crm-prospect-equipment.store";
import {
    isFailurePending,
    requiresPreviousInterventionWarning,
} from "./crm-prospect-equipment-intake-validation.util";

@Component({
    selector: "app-crm-equipment-question-alerts",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="vstack gap-2 mb-3">
            <div class="alert alert-warning py-2 mb-0" *ngIf="requiresPreviousInterventionWarning(item)" data-testid="previous-intervention-warning">
                <i class="bi bi-exclamation-triangle me-1"></i>
                Equipo intervenido previamente / con piezas faltantes o silicona: revisar alcance técnico y comercial.
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
    readonly isFailurePending = isFailurePending;
}
