import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DuplicateReferenceCandidate } from "../../../services/inventory-domain.models";

/**
 * INV-06: panel de advertencia cuando el backend detecta una posible referencia
 * duplicada. Lista los candidatos reales y ofrece "Forzar creacion", que exige
 * un motivo obligatorio (auditable en el backend con forceCreate + forceReason).
 */
@Component({
    selector: "app-duplicate-create-panel",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="alert alert-warning border" data-testid="inv-duplicate-warning" role="alert">
            <p class="mb-2"><strong>Possible referencia duplicada.</strong> {{ message }}</p>

            <div *ngIf="candidates.length > 0" class="table-responsive mb-2">
                <table class="table table-sm align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Referencia</th>
                            <th>Designacion</th>
                            <th>Similitud</th>
                            <th>Motivo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let candidate of candidates">
                            <td class="fw-semibold">{{ candidate.reference }}</td>
                            <td>{{ candidate.designation }}</td>
                            <td>{{ candidate.similarity }}</td>
                            <td>{{ candidate.reason }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p *ngIf="candidates.length === 0" class="small mb-2">
                Revisa la referencia, el codigo interno o el proveedor antes de crear.
            </p>

            <label class="form-label small mb-1" for="inv-force-reason">
                Motivo de la creacion forzada <span class="text-danger">*</span>
            </label>
            <textarea
                id="inv-force-reason"
                class="form-control form-control-sm mb-2"
                rows="2"
                [(ngModel)]="forceReason"
                placeholder="Ej: es una variante real del componente, el candidato listado esta dado de baja"
                data-testid="inv-force-reason"
            ></textarea>
            <div *ngIf="reasonError" class="small text-danger mb-2" data-testid="inv-force-reason-error">
                {{ reasonError }}
            </div>

            <div class="d-flex gap-2 flex-wrap">
                <button
                    class="btn btn-sm btn-danger"
                    type="button"
                    [disabled]="saving"
                    data-testid="inv-force-create-btn"
                    (click)="force()"
                >
                    {{ saving ? 'Creando...' : 'Forzar creacion' }}
                </button>
                <button
                    class="btn btn-sm btn-outline-theme"
                    type="button"
                    data-testid="inv-use-stock-entry-btn"
                    (click)="useStockEntry.emit()"
                >
                    Usar entrada a stock en la ficha existente
                </button>
                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="cancel.emit()">
                    Cancelar
                </button>
            </div>
        </div>
    `,
})
export class DuplicateCreatePanelComponent {
    @Input() message = "";
    @Input() candidates: DuplicateReferenceCandidate[] = [];
    @Output() readonly forceCreate = new EventEmitter<string>();
    @Output() readonly useStockEntry = new EventEmitter<void>();
    @Output() readonly cancel = new EventEmitter<void>();

    forceReason = "";
    saving = false;
    reasonError = "";

    force(): void {
        const reason = this.forceReason.trim();
        if (!reason) {
            this.reasonError = "Para forzar la creacion debes indicar el motivo (forceReason).";
            return;
        }
        this.reasonError = "";
        this.forceCreate.emit(reason);
    }
}
