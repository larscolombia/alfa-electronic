import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { PurchaseRequestRecord } from "../../../services/inventory-domain.models";
import { InventoryApiService } from "../../../services/inventory-api.service";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { Project } from "../projects/models";
import { ProjectService } from "../projects/services";
import { projectOriginLabel } from "./project-origin-label.util";

/**
 * Panel administrativo de solicitudes de compra de repuestos (Gap 5).
 * Lista TODAS las solicitudes (de todos los proyectos) y permite aprobar/rechazar.
 */
@Component({
    selector: "app-purchase-requests-panel",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card adminuiux-card mt-3" data-testid="purchase-requests-panel">
            <div class="card-header d-flex align-items-center justify-content-between">
                <h6 class="mb-0">Solicitudes de compra de repuestos</h6>
                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="loadRequests()" [disabled]="loading">
                    <i class="bi bi-arrow-clockwise me-1"></i>Actualizar
                </button>
            </div>
            <div class="card-body p-0">
                <div *ngIf="feedback" class="alert m-3 mb-0" [ngClass]="feedbackClass" role="alert">{{ feedback }}</div>
                <div class="table-responsive">
                    <table class="table align-middle mb-0" data-testid="purchase-requests-table">
                        <thead>
                            <tr>
                                <th>Referencia</th>
                                <th>Descripcion</th>
                                <th>Cantidad</th>
                                <th>Proyecto origen</th>
                                <th>Solicitante</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th class="text-end">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let request of requests" data-testid="purchase-request-row">
                                <td><strong>{{ request.reference }}</strong></td>
                                <td>{{ request.description || '--' }}</td>
                                <td>{{ request.quantity }}</td>
                                <td>{{ projectLabel(request.projectId) }}</td>
                                <td>{{ request.requestedBy || '--' }}</td>
                                <td>
                                    <span class="badge" [ngClass]="statusClass(request.status)" data-testid="purchase-request-status">{{ request.status }}</span>
                                    <div class="small text-secondary" *ngIf="request.reviewedBy">por {{ request.reviewedBy }}</div>
                                </td>
                                <td>{{ request.requestedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                                <td class="text-end">
                                    <ng-container *ngIf="request.status === 'pendiente'; else reviewedHint">
                                        <button
                                            class="btn btn-sm btn-outline-success me-2"
                                            type="button"
                                            data-testid="approve-purchase-request"
                                            [disabled]="!canReview"
                                            (click)="review(request, 'aprobar')"
                                        >Aprobar</button>
                                        <button
                                            class="btn btn-sm btn-outline-danger"
                                            type="button"
                                            data-testid="reject-purchase-request"
                                            [disabled]="!canReview"
                                            (click)="review(request, 'rechazar')"
                                        >Rechazar</button>
                                    </ng-container>
                                    <ng-template #reviewedHint>
                                        <span class="small text-secondary">Revisada</span>
                                    </ng-template>
                                </td>
                            </tr>
                            <tr *ngIf="!loading && requests.length === 0">
                                <td colspan="8" class="text-center text-secondary py-4">
                                    No hay solicitudes de compra registradas. Las solicitudes creadas desde proyectos apareceran aqui.
                                </td>
                            </tr>
                            <tr *ngIf="loading">
                                <td colspan="8" class="text-center text-secondary py-4">Cargando solicitudes...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
})
export class PurchaseRequestsPanelComponent implements OnInit, OnDestroy {
    requests: PurchaseRequestRecord[] = [];
    projects: Project[] = [];
    loading = false;

    feedback = "";
    feedbackType: "success" | "danger" = "success";

    private readonly subscriptions = new Subscription();

    constructor(
        private readonly inventoryApi: InventoryApiService,
        private readonly inventoryRbac: InventoryRbacService,
        private readonly projectService: ProjectService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.subscriptions.add(
            this.projectService.projects$.subscribe((projects) => {
                this.projects = projects ?? [];
            })
        );
        this.loadRequests();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    get canReview(): boolean {
        return this.inventoryRbac.hasPermission("inventory.replenishment.manage");
    }

    get feedbackClass(): string {
        return this.feedbackType === "success" ? "alert-success border" : "alert-danger border";
    }

    loadRequests(): void {
        this.loading = true;
        this.inventoryApi.listPurchaseRequests().subscribe({
            next: (items) => {
                this.requests = items ?? [];
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.loading = false;
                this.setFeedback(err?.message || "No se pudieron cargar las solicitudes de compra.", "danger");
                this.cdr.detectChanges();
            },
        });
    }

    review(request: PurchaseRequestRecord, action: "aprobar" | "rechazar"): void {
        const verb = action === "aprobar" ? "aprobar" : "rechazar";
        const confirmed = confirm(`Deseas ${verb} la solicitud ${request.reference} (${request.quantity} unidad(es))?`);
        if (!confirmed) {
            return;
        }

        this.inventoryApi.reviewPurchaseRequest(request.id, { action, reviewNotes: "" }).subscribe({
            next: (result) => {
                this.setFeedback(result?.message || `Solicitud ${request.reference} revisada.`, "success");
                this.loadRequests();
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.setFeedback(err?.message || `No se pudo ${verb} la solicitud.`, "danger");
                this.cdr.detectChanges();
            },
        });
    }

    projectLabel(projectId: string): string {
        return projectOriginLabel(this.projects, projectId);
    }

    statusClass(status: string): string {
        if (status === "aprobada") {
            return "text-bg-success";
        }
        if (status === "rechazada") {
            return "text-bg-danger";
        }
        return "text-bg-warning";
    }

    private setFeedback(message: string, type: "success" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }
}
