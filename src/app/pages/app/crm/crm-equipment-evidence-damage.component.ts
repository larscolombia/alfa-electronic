import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { ProspectEquipmentItem } from "./crm-prospect-equipment.store";
import { hasVisibleDamageEvidenceWithNote } from "./crm-prospect-equipment-intake-validation.util";

@Component({
    selector: "app-crm-equipment-evidence-damage",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="border rounded p-3 bg-light-subtle mb-3">
            <div class="form-check mb-0">
                <input
                    class="form-check-input"
                    type="checkbox"
                    [id]="'visible-damage-check-' + item.id"
                    [(ngModel)]="item.visibleDamageReported"
                    [ngModelOptions]="{ standalone: true }"
                    data-testid="visible-damage-check" />
                <label class="form-check-label fw-semibold" [for]="'visible-damage-check-' + item.id">
                    Daño visible / sello roto / componente faltante
                </label>
            </div>

            <div class="mt-3" *ngIf="item.visibleDamageReported">
                <p class="small text-secondary mb-2">
                    Requerido antes de Guardar: sube una evidencia tipo "Daño visible" con nota y confirma que el cliente fue informado.
                </p>
                <div class="alert alert-warning py-2 mb-2" *ngIf="!hasEvidenceWithNote" data-testid="visible-damage-evidence-required">
                    Falta evidencia de daño visible con nota.
                </div>
                <div class="form-check mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        [id]="'visible-damage-confirm-' + item.id"
                        [(ngModel)]="item.visibleDamageConfirmed"
                        [ngModelOptions]="{ standalone: true }"
                        data-testid="visible-damage-confirm" />
                    <label class="form-check-label small fw-semibold" [for]="'visible-damage-confirm-' + item.id">Cliente informado y acepta</label>
                </div>
            </div>
        </div>
    `,
})
export class CrmEquipmentEvidenceDamageComponent {
    @Input({ required: true }) item!: ProspectEquipmentItem;

    get hasEvidenceWithNote(): boolean {
        return hasVisibleDamageEvidenceWithNote(this.item);
    }
}
