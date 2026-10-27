import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { InventoryEdgeApiService } from "../../../services/inventory-edge-api.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";

/**
 * INV-07: registro de la prueba de un componente usado
 * (POST /references/:reference/used-test). Se muestra inline junto a la fila
 * de la referencia desde el catalogo de stock.
 */
@Component({
    selector: "app-used-test-form",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="border rounded p-2 mt-2 bg-light" data-testid="used-test-form">
            <div class="row gx-2 gy-2 align-items-end">
                <div class="col-12 col-md-4">
                    <label class="form-label small mb-1">Resultado de la prueba</label>
                    <select class="form-select form-select-sm" [(ngModel)]="result" data-testid="used-test-result">
                        <option value="aprobada">Aprobada</option>
                        <option value="rechazada">Rechazada</option>
                    </select>
                </div>
                <div class="col-12 col-md-5">
                    <label class="form-label small mb-1">Nota de prueba / origen <span class="text-danger">*</span></label>
                    <input
                        class="form-control form-control-sm"
                        [(ngModel)]="note"
                        placeholder="Quien la probo, equipo usado, horas, hallazgos"
                        data-testid="used-test-note"
                    />
                </div>
                <div class="col-12 col-md-3 d-flex gap-2">
                    <button
                        class="btn btn-sm btn-theme"
                        type="button"
                        [disabled]="!note.trim() || saving"
                        [attr.data-testid]="'used-test-submit-' + reference"
                        (click)="submit()"
                    >
                        {{ saving ? 'Guardando...' : 'Guardar prueba' }}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="cancel.emit()">Cancelar</button>
                </div>
            </div>
            <div *ngIf="error" class="alert alert-danger border small py-1 px-2 mt-2 mb-0" data-testid="used-test-error">
                {{ error }}
            </div>
        </div>
    `,
})
export class UsedTestFormComponent {
    @Input({ required: true }) reference = "";
    @Output() readonly done = new EventEmitter<void>();
    @Output() readonly cancel = new EventEmitter<void>();

    result: "aprobada" | "rechazada" = "aprobada";
    note = "";
    saving = false;
    error = "";

    constructor(
        private readonly edge: InventoryEdgeApiService,
        private readonly workflow: InventoryWorkflowService
    ) { }

    async submit(): Promise<void> {
        this.saving = true;
        this.error = "";
        try {
            await firstValueFrom(this.edge.recordUsedTest(this.reference, { result: this.result, note: this.note.trim() }));
            await this.workflow.loadFromApi();
            this.done.emit();
        } catch (error) {
            this.error = error instanceof Error ? error.message : "No se pudo registrar la prueba.";
        } finally {
            this.saving = false;
        }
    }
}
