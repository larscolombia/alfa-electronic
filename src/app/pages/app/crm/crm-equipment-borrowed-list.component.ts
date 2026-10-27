import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";

import type { ProspectEquipmentBorrowedEquipment, ProspectEquipmentItem } from "./crm-prospect-equipment.store";
import { createBorrowedEntry, normalizeBorrowedEntry } from "./crm-prospect-equipment-borrowed.util";

@Component({
    selector: "app-crm-equipment-borrowed-list",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="borrowed-equipment-repeater mt-3">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <label class="form-label mb-0">Equipos prestados para prueba</label>
                <button class="btn btn-sm btn-outline-theme" type="button" [attr.data-testid]="'equipment-modal-add-borrowed-' + itemIndex" (click)="addEntry()">
                    <i class="bi bi-plus-lg me-1"></i> Agregar
                </button>
            </div>
            <p class="small text-secondary mb-2">
                Registra equipos que el cliente presta para pruebas (ej.: parlantes, monitor, cableado, motor equivalente). Cada préstamo queda
                anclado con un código BLD de devolución.
            </p>

            <div class="vstack gap-2" *ngIf="entries.length > 0; else borrowedEquipmentEmptyState">
                <div class="input-group input-group-sm" *ngFor="let entry of entries; let borrowedIndex = index; trackBy: trackByBorrowedIndex">
                    <span class="input-group-text" [title]="'Código de préstamo ' + entry.code">{{ entry.code || ("#" + (borrowedIndex + 1)) }}</span>
                    <input
                        class="form-control"
                        [ngModel]="entry.description"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onDescriptionChange(borrowedIndex, $event)"
                        placeholder="Ej.: Parlante activo de referencia, motor de prueba, etc." />
                    <button
                        class="btn btn-outline-danger"
                        type="button"
                        [attr.data-testid]="'equipment-modal-remove-borrowed-' + itemIndex + '-' + borrowedIndex"
                        (click)="removeEntry(borrowedIndex)">
                        Quitar
                    </button>
                </div>
            </div>

            <ng-template #borrowedEquipmentEmptyState>
                <div class="small text-secondary border rounded px-2 py-2">Sin equipos prestados registrados.</div>
            </ng-template>
        </div>
    `,
})
export class CrmEquipmentBorrowedListComponent {
    @Input({ required: true }) item!: ProspectEquipmentItem;
    @Input() itemIndex = 0;

    get entries(): ProspectEquipmentBorrowedEquipment[] {
        return (this.item.borrowedEquipments ?? []).map((entry) => normalizeBorrowedEntry(entry));
    }

    trackByBorrowedIndex(index: number): number {
        return index;
    }

    addEntry(): void {
        this.item.borrowedEquipments = [...this.entries, createBorrowedEntry()];
    }

    removeEntry(index: number): void {
        this.item.borrowedEquipments = this.entries.filter((_, currentIndex) => currentIndex !== index);
    }

    onDescriptionChange(index: number, value: string): void {
        const next = this.entries.map((entry, currentIndex) => (currentIndex === index ? { ...entry, description: String(value ?? "") } : entry));
        this.item.borrowedEquipments = next;
    }
}
