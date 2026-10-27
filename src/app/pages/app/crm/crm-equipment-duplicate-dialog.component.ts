import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { ProspectEquipmentDuplicateRelation } from "./crm-prospect-equipment.store";

export interface DuplicateIdentifierDialogData {
    message: string;
    identifier: string;
    existingRecordId: string;
}

@Component({
    selector: "app-crm-equipment-duplicate-dialog",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="duplicate-backdrop" *ngIf="dialog" (click)="onCancel()">
            <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
                <div class="modal-dialog" role="document">
                    <div class="modal-content" data-testid="duplicate-identifier-dialog">
                        <div class="modal-header">
                            <h5 class="modal-title mb-0">Identificador duplicado</h5>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-warning mb-3">{{ dialog.message }}</div>
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-5">
                                    <label class="form-label" for="duplicate-relation-select">Relación con el registro previo <span class="text-danger">*</span></label>
                                    <select class="form-select" id="duplicate-relation-select" [(ngModel)]="relation" [ngModelOptions]="{ standalone: true }" data-testid="duplicate-relation-select">
                                        <option value="reingreso">Reingreso</option>
                                        <option value="garantia">Garantía</option>
                                        <option value="evento_nuevo">Evento nuevo</option>
                                    </select>
                                </div>
                                <div class="col-12 col-lg-7">
                                    <label class="form-label" for="duplicate-reason-input">Motivo <span class="text-danger">*</span></label>
                                    <input
                                        class="form-control"
                                        id="duplicate-reason-input"
                                        [(ngModel)]="reason"
                                        [ngModelOptions]="{ standalone: true }"
                                        placeholder="Ej: el cliente reenvía el mismo equipo por falla recurrente"
                                        data-testid="duplicate-reason-input" />
                                </div>
                            </div>
                            <div class="small text-danger mt-2" *ngIf="touched && !canConfirm">Selecciona la relación y escribe el motivo para confirmar.</div>
                        </div>
                        <div class="modal-footer d-flex justify-content-between gap-2">
                            <button type="button" class="btn btn-link" data-testid="duplicate-cancel-btn" (click)="onCancel()">Cancelar</button>
                            <button type="button" class="btn btn-theme" data-testid="duplicate-confirm-btn" [disabled]="!canConfirm" (click)="onConfirm()">
                                Confirmar y guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="dialog"></div>
    `,
    styles: [`
        .duplicate-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1060;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    `],
})
export class CrmEquipmentDuplicateDialogComponent {
    @Input() dialog: DuplicateIdentifierDialogData | null = null;
    @Output() confirmed = new EventEmitter<{ reason: string; relation: ProspectEquipmentDuplicateRelation }>();
    @Output() cancelled = new EventEmitter<void>();

    relation: ProspectEquipmentDuplicateRelation = "reingreso";
    reason = "";
    touched = false;

    get canConfirm(): boolean {
        return Boolean(this.reason.trim());
    }

    onConfirm(): void {
        this.touched = true;
        if (!this.canConfirm) {
            return;
        }

        this.confirmed.emit({ reason: this.reason.trim(), relation: this.relation });
    }

    onCancel(): void {
        this.cancelled.emit();
    }
}
