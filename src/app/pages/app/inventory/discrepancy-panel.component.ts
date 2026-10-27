import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom, Subscription } from "rxjs";
import { CountSession, DiscrepancyRecord, StockReference } from "../../../services/inventory-domain.models";
import { InventoryApiService } from "../../../services/inventory-api.service";
import { InventoryEdgeApiService } from "../../../services/inventory-edge-api.service";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { DiscrepanciesTableComponent } from "./discrepancies-table.component";

/**
 * INV-09: alta y aprobacion de discrepancias de conteo contra una sesion
 * en-curso. Si no hay ninguna sesion abierta, ofrece "Abrir sesion de conteo"
 * que crea y abre una sesion rapida segun el flujo del backend
 * (POST /sessions + POST /sessions/:id/open).
 */
@Component({
    selector: "app-discrepancy-panel",
    standalone: true,
    imports: [CommonModule, FormsModule, DiscrepanciesTableComponent],
    template: `
        <div class="card adminuiux-card mb-3 mb-lg-4" data-testid="discrepancy-panel">
            <div class="card-header">
                <h6 class="mb-0">Diferencias de conteo (conciliacion)</h6>
                <p class="small text-secondary mb-0">
                    Registrar una diferencia exige una sesion en curso; aprobarla aplica el
                    ajuste de stock una sola vez.
                </p>
            </div>
            <div class="card-body border-bottom">
                <div class="row gx-3 gy-2 align-items-end">
                    <div class="col-12 col-md-4">
                        <label class="form-label">Sesion de conteo</label>
                        <select class="form-select" [(ngModel)]="selectedSessionId" data-testid="discrepancy-session-select">
                            <option value="">Selecciona una sesion en curso</option>
                            <option *ngFor="let session of openSessions" [value]="session.id">
                                {{ session.name }} ({{ session.status }})
                            </option>
                        </select>
                    </div>
                    <div class="col-12 col-md-auto">
                        <button
                            class="btn btn-outline-theme"
                            type="button"
                            [disabled]="!canManage || openingSession"
                            data-testid="session-open-btn"
                            (click)="openQuickSession()"
                        >
                            {{ openingSession ? 'Abriendo...' : 'Abrir sesion de conteo' }}
                        </button>
                    </div>
                </div>
            </div>

            <div class="card-body border-bottom" data-testid="discrepancy-form">
                <div class="row gx-3 gy-2">
                    <div class="col-12 col-md-3">
                        <label class="form-label">Referencia <span class="text-danger">*</span></label>
                        <select class="form-select" [(ngModel)]="draft.referenceId">
                            <option value="">Selecciona referencia</option>
                            <option *ngFor="let ref of references" [value]="ref.reference">
                                {{ ref.reference }} - {{ ref.designation }}
                            </option>
                        </select>
                    </div>
                    <div class="col-12 col-md-2">
                        <label class="form-label">Cantidad contada <span class="text-danger">*</span></label>
                        <input class="form-control" type="number" min="0" [(ngModel)]="draft.countedQty" data-testid="discrepancy-counted-input" />
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="form-label">Motivo de la diferencia <span class="text-danger">*</span></label>
                        <input class="form-control" [(ngModel)]="draft.reason" placeholder="Rotura, extravio, error de registro..." data-testid="discrepancy-reason-input" />
                    </div>
                    <div class="col-12 col-md-3">
                        <label class="form-label">Causa raiz (opcional)</label>
                        <input class="form-control" [(ngModel)]="draft.rootCause" placeholder="Entrada sin registrar" data-testid="discrepancy-rootcause-input" />
                    </div>
                </div>
                <div class="mt-3">
                    <button
                        class="btn btn-theme"
                        type="button"
                        [disabled]="!canManage || saving"
                        data-testid="discrepancy-create-btn"
                        (click)="create()"
                    >
                        {{ saving ? 'Registrando...' : 'Registrar diferencia' }}
                    </button>
                </div>
            </div>

            <div *ngIf="feedback" class="alert mb-0 rounded-0" [ngClass]="feedbackClass" data-testid="discrepancy-feedback">
                {{ feedback }}
            </div>

            <div class="card-body p-0">
                <app-discrepancies-table
                    [discrepancies]="discrepancies"
                    [sessions]="sessions"
                    [canManage]="canManage"
                    [approvingId]="approvingId"
                    (approve)="approve($event)"
                ></app-discrepancies-table>
            </div>
        </div>
    `,
})
export class DiscrepancyPanelComponent implements OnInit, OnDestroy {
    sessions: CountSession[] = [];
    discrepancies: DiscrepancyRecord[] = [];
    references: StockReference[] = [];
    selectedSessionId = "";
    saving = false;
    approvingId = "";
    openingSession = false;
    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";
    draft = { referenceId: "", countedQty: 0, reason: "", rootCause: "" };

    private readonly subscriptions = new Subscription();

    constructor(
        private readonly api: InventoryApiService,
        private readonly edge: InventoryEdgeApiService,
        private readonly rbac: InventoryRbacService,
        private readonly workflow: InventoryWorkflowService
    ) { }

    get canManage(): boolean {
        return this.rbac.hasPermission("inventory.reconciliation.manage");
    }

    get openSessions(): CountSession[] {
        return this.sessions.filter((session) => session.status === "en-curso");
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
                const snapshot = this.workflow.getSnapshot();
                this.sessions = snapshot.sessions;
                this.discrepancies = snapshot.discrepancies;
                this.references = snapshot.references;
            })
        );
        void this.workflow.loadFromApi();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    async openQuickSession(): Promise<void> {
        this.openingSession = true;
        try {
            const today = new Date().toISOString().slice(0, 10);
            await firstValueFrom(this.api.createSession({
                name: `Conteo rapido ${today}`,
                scope: "Bodega principal",
                owner: this.rbac.roleLabel(this.rbac.currentRole),
                startDate: today,
            }));
            await this.workflow.loadFromApi();
            const created = this.workflow.getSnapshot().sessions.find(
                (session) => session.status === "planificada" && session.name.startsWith("Conteo rapido")
            );
            if (!created) {
                throw new Error("No se pudo crear la sesion de conteo.");
            }
            await firstValueFrom(this.api.openSession(created.id));
            await this.workflow.loadFromApi();
            this.selectedSessionId = created.id;
            this.setFeedback(`Sesion "${created.name}" abierta. Ya puedes registrar diferencias.`, "success");
        } catch (error) {
            this.setFeedback(this.messageOf(error), "danger");
        } finally {
            this.openingSession = false;
        }
    }

    async create(): Promise<void> {
        if (!this.selectedSessionId) {
            this.setFeedback("La sesion no existe o no esta en curso. Abre una sesion antes de registrar la diferencia.", "warning");
            return;
        }
        this.saving = true;
        try {
            const result = await firstValueFrom(this.edge.createDiscrepancy(this.selectedSessionId, {
                referenceId: this.draft.referenceId.trim(),
                countedQty: Number(this.draft.countedQty),
                reason: this.draft.reason.trim(),
                rootCause: this.draft.rootCause.trim(),
            }));
            this.setFeedback(result?.message || "Diferencia registrada.", "success");
            this.draft = { referenceId: "", countedQty: 0, reason: "", rootCause: "" };
            await this.workflow.loadFromApi();
        } catch (error) {
            this.setFeedback(this.messageOf(error), "danger");
        } finally {
            this.saving = false;
        }
    }

    async approve(diff: DiscrepancyRecord): Promise<void> {
        this.approvingId = diff.id;
        try {
            const result = await firstValueFrom(this.api.approveDiscrepancy(diff.id));
            await this.workflow.loadFromApi();
            const adjusted = this.workflow.getSnapshot().discrepancies.find((item) => item.id === diff.id);
            if (adjusted?.approvedAt) {
                this.setFeedback(`${result?.message || 'Diferencia aprobada.'} Ajuste aplicado por ${adjusted.approvedBy}.`, "success");
            } else {
                this.setFeedback(result?.message || "Diferencia aprobada.", "success");
            }
        } catch (error) {
            this.setFeedback(this.messageOf(error), "danger");
        } finally {
            this.approvingId = "";
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
