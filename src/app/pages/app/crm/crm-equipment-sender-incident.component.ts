import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { ProspectEquipmentCustodyIncident, ProspectEquipmentRecord } from "./crm-prospect-equipment.store";

@Component({
    selector: "app-crm-equipment-sender-incident",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="col-12">
            <div class="border rounded p-3 bg-light-subtle">
                <div class="form-check mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        id="sender-unknown-check"
                        [checked]="draft.senderUnknown || false"
                        (change)="onSenderUnknownChange($any($event.target).checked)"
                        data-testid="sender-unknown-check" />
                    <label class="form-check-label fw-semibold" for="sender-unknown-check">No se identifica remitente</label>
                </div>
                <p class="small text-secondary mb-0 mt-2">
                    Actívalo cuando llegue un equipo sin empresa/contacto claro. El guardado no se bloquea, pero la operación queda marcada.
                </p>

                <div *ngIf="draft.senderUnknown">
                    <div class="alert alert-warning py-2 mt-3 mb-3" data-testid="sender-unknown-warning">
                        Incidencia de custodia: no se podrá asignar técnico ni cotizar hasta identificar empresa/contacto.
                    </div>

                    <div class="row gx-3 gy-3">
                        <div class="col-12 col-lg-8">
                            <label class="form-label" for="custody-incident-note">Nota de fotos / evidencia de la incidencia</label>
                            <textarea
                                class="form-control"
                                rows="2"
                                id="custody-incident-note"
                                [ngModel]="incident?.photosNote || ''"
                                [ngModelOptions]="{ standalone: true }"
                                (ngModelChange)="onPhotosNoteChange($event)"
                                placeholder="Describe las fotos tomadas, etiquetas visibles, estado del empaque..."
                                data-testid="custody-incident-note"></textarea>
                        </div>
                        <div class="col-12 col-lg-4">
                            <div class="small text-secondary">Responsable que registra la incidencia</div>
                            <div class="fw-semibold">{{ incident?.responsible || currentUserName || "--" }}</div>
                            <div class="small text-secondary" *ngIf="incident?.createdAt">Registrada: {{ incident?.createdAt | date: "short" }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CrmEquipmentSenderIncidentComponent {
    @Input({ required: true }) draft!: ProspectEquipmentRecord;
    @Input() currentUserName = "";

    get incident(): ProspectEquipmentCustodyIncident | undefined {
        return this.draft.custodyIncident;
    }

    onSenderUnknownChange(checked: boolean): void {
        this.draft.senderUnknown = Boolean(checked);

        if (this.draft.senderUnknown) {
            this.draft.custodyIncident = {
                photosNote: this.draft.custodyIncident?.photosNote || "",
                responsible: this.draft.custodyIncident?.responsible || this.currentUserName || "recepcion",
                createdAt: this.draft.custodyIncident?.createdAt || new Date().toISOString(),
            };
            return;
        }

        this.draft.custodyIncident = undefined;
    }

    onPhotosNoteChange(value: string): void {
        if (!this.draft.custodyIncident) {
            return;
        }
        this.draft.custodyIncident = { ...this.draft.custodyIncident, photosNote: String(value ?? "") };
    }
}
