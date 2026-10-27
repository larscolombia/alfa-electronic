import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { TechnicianBagTrace } from "../../../services/inventory-domain.models";
import { InventoryEdgeApiService } from "../../../services/inventory-edge-api.service";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";

/**
 * INV-08: bolsas de tecnico con custodia. Recibir NO suma al stock general:
 * el material queda en custodia del tecnico asignado. Liberar suma al stock
 * SOLO el sobrante declarado (leftoverQty), nunca la cantidad completa.
 */
@Component({
    selector: "app-technician-bags-panel",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="card adminuiux-card mt-3" data-testid="technician-bags-panel">
            <div class="card-header">
                <h6 class="mb-0">Bolsas de tecnico (custodia)</h6>
                <p class="small text-secondary mb-0">
                    Recibir una bolsa NO suma al stock general: queda en custodia del tecnico.
                    Al liberar, solo el sobrante declarado vuelve a stock.
                </p>
            </div>
            <div class="card-body border-bottom">
                <div class="row gx-3 gy-2">
                    <div class="col-12 col-md-3">
                        <label class="form-label">Codigo de bolsa <span class="text-danger">*</span></label>
                        <input class="form-control" [(ngModel)]="draft.bagCode" placeholder="BOL-2041" data-testid="bag-code-input" />
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label">Tecnico asignado <span class="text-danger">*</span></label>
                        <input class="form-control" [(ngModel)]="draft.assignedTo" placeholder="Tecnico C Torres" data-testid="bag-tech-input" />
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label">Referencia del item <span class="text-danger">*</span></label>
                        <input class="form-control" [(ngModel)]="draft.reference" placeholder="LM324N" data-testid="bag-item-input" />
                    </div>
                    <div class="col-12 col-md-2">
                        <label class="form-label">Cantidad <span class="text-danger">*</span></label>
                        <input class="form-control" type="number" min="1" [(ngModel)]="draft.quantity" data-testid="bag-qty-input" />
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="form-label">ODS / Orden (opcional)</label>
                        <input class="form-control" [(ngModel)]="draft.workOrder" placeholder="ODS-2026-0721" />
                    </div>
                </div>
                <div class="mt-3 d-flex gap-2 flex-wrap align-items-center">
                    <button
                        class="btn btn-theme"
                        type="button"
                        [disabled]="!canManageBags || receiving"
                        data-testid="bag-receive-btn"
                        (click)="receive()"
                    >
                        {{ receiving ? 'Recibiendo...' : 'Registrar recepcion' }}
                    </button>
                    <span class="small text-secondary">
                        La referencia NO cambia de stock: pasa a custodia del tecnico.
                    </span>
                </div>
            </div>
            <div *ngIf="feedback" class="alert mb-0 rounded-0" [ngClass]="feedbackClass" data-testid="bag-feedback">
                {{ feedback }}
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Bolsa</th>
                                <th>Referencia</th>
                                <th>Tecnico</th>
                                <th>Cantidad</th>
                                <th>Recepcion</th>
                                <th>Estado</th>
                                <th class="text-end">Accion</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let bag of bagTraces" [attr.data-testid]="'bag-row-' + bag.id">
                                <td>{{ bag.bagCode }}</td>
                                <td>{{ bag.reference }}</td>
                                <td>{{ bag.technician }}</td>
                                <td>{{ bag.quantity }}</td>
                                <td>{{ bag.receivedAt | date: 'dd/MM HH:mm' }}</td>
                                <td>
                                    <span
                                        *ngIf="bag.status === 'recibida'"
                                        class="badge text-bg-warning"
                                        [attr.data-testid]="'bag-custody-' + bag.id"
                                    >
                                        En custodia de tecnico
                                    </span>
                                    <span *ngIf="bag.status !== 'recibida'" class="badge text-bg-success">Liberada</span>
                                </td>
                                <td class="text-end">
                                    <ng-container *ngIf="bag.status === 'recibida' && canManageBags">
                                        <div *ngIf="releasingFor === bag.id" class="d-inline-flex gap-1 align-items-center">
                                            <input
                                                class="form-control form-control-sm d-inline-block"
                                                style="width: 5.5rem;"
                                                type="number"
                                                min="0"
                                                [max]="bag.quantity"
                                                placeholder="Sobrante"
                                                [(ngModel)]="leftoverQty"
                                                data-testid="bag-leftover-input"
                                            />
                                            <button
                                                class="btn btn-sm btn-outline-theme"
                                                type="button"
                                                [disabled]="releasing"
                                                data-testid="bag-release-btn"
                                                (click)="release(bag)"
                                            >
                                                {{ releasing ? 'Liberando...' : 'Confirmar liberacion' }}
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="releasingFor = ''">
                                                Cancelar
                                            </button>
                                        </div>
                                        <button
                                            *ngIf="releasingFor !== bag.id"
                                            class="btn btn-sm btn-outline-theme"
                                            type="button"
                                            [attr.data-testid]="'bag-release-open-' + bag.id"
                                            (click)="openRelease(bag)"
                                        >
                                            Liberar
                                        </button>
                                    </ng-container>
                                </td>
                            </tr>
                            <tr *ngIf="bagTraces.length === 0">
                                <td colspan="7" class="text-center text-secondary py-4">Sin bolsas registradas.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
})
export class TechnicianBagsPanelComponent implements OnInit, OnDestroy {
    bagTraces: TechnicianBagTrace[] = [];
    draft = { bagCode: "", assignedTo: "", reference: "", quantity: 1, workOrder: "" };
    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";
    receiving = false;
    releasing = false;
    releasingFor = "";
    leftoverQty: number | null = null;

    private readonly subscriptions = new Subscription();

    constructor(
        private readonly edge: InventoryEdgeApiService,
        private readonly rbac: InventoryRbacService,
        private readonly workflow: InventoryWorkflowService
    ) { }

    get canManageBags(): boolean {
        return this.rbac.hasPermission("inventory.bags.manage");
    }

    get feedbackClass(): string {
        if (this.feedbackType === "success") {
            return "alert-success border";
        }
        if (this.feedbackType === "warning") {
            return "alert-warning border";
        }
        return "alert-danger border";
    }

    ngOnInit(): void {
        this.subscriptions.add(
            this.workflow.state$.subscribe(() => {
                this.bagTraces = this.workflow.getSnapshot().bagTraces;
            })
        );
        void this.workflow.loadFromApi();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    async receive(): Promise<void> {
        this.receiving = true;
        try {
            const result = await this.edge.receiveBag({
                bagCode: this.draft.bagCode.trim(),
                assignedTo: this.draft.assignedTo.trim(),
                items: [{ reference: this.draft.reference.trim(), quantity: Number(this.draft.quantity) }],
                workOrder: this.draft.workOrder.trim(),
            }).toPromise();
            this.setFeedback(result?.message || "Bolsa recibida en custodia del tecnico.", "success");
            this.draft = { bagCode: "", assignedTo: "", reference: "", quantity: 1, workOrder: "" };
            await this.workflow.loadFromApi();
        } catch (error) {
            this.setFeedback(this.messageOf(error), "danger");
        } finally {
            this.receiving = false;
        }
    }

    openRelease(bag: TechnicianBagTrace): void {
        this.releasingFor = bag.id;
        this.leftoverQty = null;
    }

    async release(bag: TechnicianBagTrace): Promise<void> {
        this.releasing = true;
        try {
            const result = await this.edge.releaseBag(bag.id, Number(this.leftoverQty ?? 0)).toPromise();
            this.setFeedback(result?.message || `Bolsa liberada.`, "success");
            this.releasingFor = "";
            this.leftoverQty = null;
            await this.workflow.loadFromApi();
        } catch (error) {
            this.setFeedback(this.messageOf(error), "danger");
        } finally {
            this.releasing = false;
        }
    }

    private setFeedback(message: string, type: "success" | "warning" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }

    private messageOf(error: unknown): string {
        return error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Error del servidor al procesar la accion.";
    }
}
