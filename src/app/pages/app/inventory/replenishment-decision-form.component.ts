import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { InventoryEdgeApiService } from "../../../services/inventory-edge-api.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";

/**
 * INV-10: decision sobre un item de reposicion escalado. Registrar otro intento
 * esta bloqueado por el backend (409) hasta resolver la escalacion con una
 * decision: cambiar de proveedor (exige proveedor nuevo) o marcar obsoleto
 * (exige motivo). Los errores del backend se muestran tal cual.
 */
@Component({
    selector: "app-replenishment-decision-form",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="border rounded p-2 mt-2 bg-light" [attr.data-testid]="'replenishment-decision-form-' + reference">
            <p class="small fw-semibold mb-2">Resolver escalacion de {{ reference }}</p>
            <div class="row gx-2 gy-2 align-items-end">
                <div class="col-12 col-md-3">
                    <label class="form-label small mb-1">Accion <span class="text-danger">*</span></label>
                    <select class="form-select form-select-sm" [(ngModel)]="action" [attr.data-testid]="'decision-action-select'">
                        <option value="cambiar_proveedor">Cambiar proveedor</option>
                        <option value="marcar_obsoleto">Marcar obsoleto</option>
                    </select>
                </div>
                <div class="col-12 col-md-4" *ngIf="action === 'cambiar_proveedor'">
                    <label class="form-label small mb-1">Nuevo proveedor <span class="text-danger">*</span></label>
                    <input
                        class="form-control form-control-sm"
                        [(ngModel)]="provider"
                        placeholder="Proveedor que siempre surte la referencia"
                        [attr.data-testid]="'decision-provider-input'"
                    />
                </div>
                <div class="col-12 col-md-4">
                    <label class="form-label small mb-1">Motivo <span class="text-danger">*</span></label>
                    <input
                        class="form-control form-control-sm"
                        [(ngModel)]="reason"
                        placeholder="Por que se toma esta decision"
                        [attr.data-testid]="'decision-reason-input'"
                    />
                </div>
                <div class="col-12 col-md-auto d-flex gap-2">
                    <button
                        class="btn btn-sm btn-theme"
                        type="button"
                        [disabled]="saving"
                        [attr.data-testid]="'decision-submit-btn'"
                        (click)="submit()"
                    >
                        {{ saving ? 'Guardando...' : 'Registrar decision' }}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
                </div>
            </div>
            <div *ngIf="feedback" class="alert border small py-1 px-2 mt-2 mb-0" [ngClass]="feedbackClass" [attr.data-testid]="'decision-feedback-' + reference">
                {{ feedback }}
            </div>
        </div>
    `,
})
export class ReplenishmentDecisionFormComponent {
    @Input({ required: true }) reference = "";
    @Output() readonly changed = new EventEmitter<void>();
    @Output() readonly cancel = new EventEmitter<void>();

    action: "cambiar_proveedor" | "marcar_obsoleto" = "cambiar_proveedor";
    provider = "";
    reason = "";
    saving = false;
    feedback = "";
    feedbackType: "success" | "danger" = "success";

    get feedbackClass(): string {
        return this.feedbackType === "success" ? "alert-success border" : "alert-danger border";
    }

    constructor(
        private readonly edge: InventoryEdgeApiService,
        private readonly workflow: InventoryWorkflowService
    ) { }

    async submit(): Promise<void> {
        this.saving = true;
        this.feedback = "";
        try {
            const result = await firstValueFrom(this.edge.registerReplenishmentDecision(this.reference, {
                action: this.action,
                reason: this.reason.trim(),
                provider: this.action === "cambiar_proveedor" ? this.provider.trim() : "",
            }));
            await this.workflow.loadFromApi();
            this.feedback = result?.message || "Decision registrada.";
            this.feedbackType = "success";
            this.changed.emit();
        } catch (error) {
            this.feedback = error instanceof Error ? error.message : "No se pudo registrar la decision.";
            this.feedbackType = "danger";
        } finally {
            this.saving = false;
        }
    }
}
