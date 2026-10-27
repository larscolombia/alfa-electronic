import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ReplenishmentItem, ReplenishmentStatus } from "../../../services/inventory-domain.models";

/**
 * INV-05: alertas de reposicion. Todos los items que lista GET /replenishment
 * los crea automaticamente el backend cuando una referencia baja del minimo
 * (audit REPLENISHMENT_AUTO_CREATED) y los archiva al volver sobre el minimo,
 * asi que cada fila lleva el badge de origen "automatico".
 */
@Component({
    selector: "app-replenishment-alerts",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card adminuiux-card mb-3 mb-lg-4" data-testid="replenishment-alerts-section">
            <div class="card-header">
                <h6 class="mb-0">Alertas de reposicion</h6>
                <p class="small text-secondary mb-0">
                    El backend crea estas alertas automaticamente cuando el stock baja del minimo
                    y las resuelve al volver sobre el.
                </p>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table align-middle mb-0">
                        <thead>
                            <tr>
                                <th>Referencia</th>
                                <th>Descripcion</th>
                                <th>Stock</th>
                                <th>Minimo</th>
                                <th>Origen</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                *ngFor="let item of items"
                                [attr.data-testid]="'replenishment-auto-item-' + item.reference"
                            >
                                <td class="fw-semibold">{{ item.reference }}</td>
                                <td>{{ item.description }}</td>
                                <td>{{ item.currentStock }}</td>
                                <td>{{ item.minStock }}</td>
                                <td><span class="badge text-bg-info">automatico</span></td>
                                <td><span class="badge" [ngClass]="statusClass(item.status)">{{ item.status }}</span></td>
                            </tr>
                            <tr *ngIf="items.length === 0">
                                <td colspan="6" class="text-center text-secondary py-4">
                                    Sin alertas: ninguna referencia esta bajo el minimo.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
})
export class ReplenishmentAlertsComponent {
    @Input({ required: true }) items: ReplenishmentItem[] = [];

    statusClass(status: ReplenishmentStatus): string {
        if (status === "pendiente") {
            return "text-bg-secondary";
        }
        if (status === "en-gestion") {
            return "text-bg-info";
        }
        if (status === "escalar") {
            return "text-bg-warning";
        }
        return "text-bg-dark";
    }
}
