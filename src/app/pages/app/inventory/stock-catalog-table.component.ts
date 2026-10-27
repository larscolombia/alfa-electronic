import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ReservationRecord, StockReference } from "../../../services/inventory-domain.models";
import { UsedTestFormComponent } from "./used-test-form.component";

/**
 * Tabla del catalogo de stock con:
 *  - INV-02: columnas Stock, Reservado y Disponible (data-testid inv-available-{ref}).
 *  - INV-05: badge "Bajo minimo" (data-testid inv-low-stock-{ref}).
 *  - INV-07: badge "Usado/Ocasion" (inv-condition-used-{ref}), ultima prueba
 *    (used-test-last-{ref}) y boton "Registrar prueba" (used-test-open-{ref}).
 */
@Component({
    selector: "app-stock-catalog-table",
    standalone: true,
    imports: [CommonModule, UsedTestFormComponent],
    template: `
        <div class="table-responsive">
            <table class="table align-middle mb-0">
                <thead>
                    <tr>
                        <th>Referencia</th>
                        <th>Codigo</th>
                        <th>Designacion</th>
                        <th>Familia</th>
                        <th>Ubicacion</th>
                        <th>Stock</th>
                        <th>Reservado</th>
                        <th>Disponible</th>
                        <th>Minimo</th>
                        <th>Estado</th>
                        <th>Condicion</th>
                        <th>Ultima prueba</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <ng-container *ngFor="let item of references">
                        <tr [attr.data-testid]="'stock-row-' + item.reference">
                        <td>{{ item.reference }}</td>
                        <td>{{ item.internalCode || '--' }}</td>
                        <td>{{ item.designation }}</td>
                        <td>{{ item.family }}</td>
                        <td>{{ item.location }}</td>
                        <td>{{ item.currentStock }}</td>
                        <td>{{ reservedFor(item.reference) }}</td>
                        <td class="fw-semibold" [attr.data-testid]="'inv-available-' + item.reference">
                            {{ availableFor(item.reference) }}
                        </td>
                        <td>{{ item.minStock }}</td>
                        <td>
                            <span
                                class="badge"
                                [ngClass]="isLowStock(item) ? 'text-bg-danger' : 'text-bg-success'"
                                [attr.data-testid]="'inv-low-stock-' + item.reference"
                            >
                                {{ isLowStock(item) ? 'Bajo minimo' : 'OK' }}
                            </span>
                        </td>
                        <td>
                            <span
                                *ngIf="item.condition === 'usado'"
                                class="badge text-bg-warning"
                                [attr.data-testid]="'inv-condition-used-' + item.reference"
                            >
                                Usado/Ocasion
                            </span>
                            <span *ngIf="item.condition !== 'usado'" class="text-secondary small">Nuevo</span>
                        </td>
                        <td>
                            <span
                                *ngIf="item.lastUsedTest as test"
                                class="small"
                                [ngClass]="test.result === 'aprobada' ? 'text-success' : 'text-danger'"
                                [attr.data-testid]="'used-test-last-' + item.reference"
                            >
                                {{ test.result }} · {{ test.testedAt | date: 'dd/MM/yyyy' }}
                            </span>
                            <span *ngIf="!item.lastUsedTest" class="text-secondary small">--</span>
                        </td>
                        <td class="text-end">
                            <button
                                *ngIf="item.condition === 'usado'"
                                class="btn btn-sm btn-outline-theme"
                                type="button"
                                [attr.data-testid]="'used-test-open-' + item.reference"
                                (click)="toggleUsedTest(item.reference)"
                            >
                                Registrar prueba
                            </button>
                        </td>
                        </tr>
                        <tr *ngIf="openUsedTestFor === item.reference">
                            <td colspan="13" class="p-2 border-0">
                                <app-used-test-form
                                    [reference]="item.reference"
                                    (done)="onUsedTestDone()"
                                    (cancel)="openUsedTestFor = ''"
                                ></app-used-test-form>
                            </td>
                        </tr>
                    </ng-container>
                    <tr *ngIf="references.length === 0">
                        <td class="text-center text-secondary py-4" colspan="13">Sin coincidencias para el filtro actual.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
})
export class StockCatalogTableComponent {
    @Input({ required: true }) references: StockReference[] = [];
    @Input({ required: true }) reservations: ReservationRecord[] = [];

    openUsedTestFor = "";

    reservedFor(reference: string): number {
        return this.reservations
            .filter((item) => item.reference === reference && item.status === "activa")
            .reduce((sum, item) => sum + item.quantity, 0);
    }

    availableFor(reference: string): number {
        const item = this.references.find((entry) => entry.reference === reference);
        if (!item) {
            return 0;
        }
        return item.currentStock - this.reservedFor(reference);
    }

    isLowStock(item: StockReference): boolean {
        return item.currentStock <= item.minStock;
    }

    toggleUsedTest(reference: string): void {
        this.openUsedTestFor = this.openUsedTestFor === reference ? "" : reference;
    }

    onUsedTestDone(): void {
        this.openUsedTestFor = "";
    }
}
