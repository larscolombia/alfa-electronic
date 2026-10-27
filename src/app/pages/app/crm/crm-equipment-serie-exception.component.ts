import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { ProspectEquipmentItem } from "./crm-prospect-equipment.store";

@Component({
    selector: "app-crm-equipment-serie-exception",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="col-12" *ngIf="item.identifierLabelIssue">
            <div class="border rounded p-3 bg-warning-subtle">
                <label class="form-label fw-semibold" [for]="'serie-exception-reason-' + item.id">
                    Motivo de excepción (etiqueta rota o ilegible) <span class="text-danger">*</span>
                </label>
                <input
                    class="form-control"
                    [id]="'serie-exception-reason-' + item.id"
                    [(ngModel)]="item.serieExceptionReason"
                    [ngModelOptions]="{ standalone: true }"
                    placeholder="Ej: placa borrada por humedad, etiqueta arrancada en transporte..."
                    data-testid="serie-exception-reason" />
                <p class="small text-secondary mb-0 mt-2">
                    Además, en el paso Evidencia debes subir una foto tipo "Placa / serie" antes de continuar.
                </p>
            </div>
        </div>
    `,
})
export class CrmEquipmentSerieExceptionComponent {
    @Input({ required: true }) item!: ProspectEquipmentItem;
}
