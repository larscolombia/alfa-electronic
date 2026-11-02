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
        <section class="received-items" [attr.aria-label]="'Accesorios recibidos con el equipo ' + (itemIndex + 1)">
            <div class="d-flex align-items-center gap-2 mb-2">
                <i class="bi bi-box-seam text-theme" aria-hidden="true"></i>
                <h6 class="mb-0">Accesorios recibidos con el equipo</h6>
            </div>
            <label class="form-label" for="accessory-draft-{{ itemIndex }}">Accesorios incluidos con el equipo</label>
            <div class="input-group">
                <input
                    #accessoryDraft
                    [id]="'accessory-draft-' + itemIndex"
                    class="form-control"
                    [(ngModel)]="draftAccessory"
                    [ngModelOptions]="{ standalone: true }"
                    (keyup.enter)="addAccessory()"
                    placeholder="Ej.: Cable USB, cargador original, CD..." />
                <button
                    class="btn btn-outline-theme"
                    type="button"
                    [disabled]="!draftAccessory.trim()"
                    [attr.data-testid]="'equipment-modal-add-accessory-' + itemIndex"
                    (click)="addAccessory(); accessoryDraft.focus()">
                    <i class="bi bi-plus-lg me-1" aria-hidden="true"></i> Agregar
                </button>
            </div>
            <!-- 2026-11-02 — Simplificación visual (petición del usuario): con la celda vacía solo se ve
                 input + botón Agregar. La lista de accesorios y la sección de préstamos aparecen SOLO cuando
                 ya existe algo registrado (o hay datos históricos de préstamo). El estado vacío "Sin
                 accesorios registrados." se eliminó por completo. Suite de guardia: e2e-ui-rec-06. -->
            <ng-container *ngIf="expanded">
                <div class="vstack gap-2 mt-2" *ngIf="accessoryItems.length > 0">
                    <div class="input-group input-group-sm" *ngFor="let acc of accessoryItems; let accIndex = index; trackBy: trackByAccessoryIndex">
                    <span class="input-group-text">{{ accIndex + 1 }}</span>
                    <input
                        class="form-control"
                        [attr.aria-label]="'Accesorio ' + (accIndex + 1) + ': ' + acc"
                        [ngModel]="acc"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="onAccessoryItemChange(accIndex, $event)" />
                    <button
                        class="btn btn-outline-danger"
                        type="button"
                        aria-label="Eliminar accesorio {{ acc }}"
                        [attr.data-testid]="'equipment-modal-remove-accessory-' + itemIndex + '-' + accIndex"
                        (click)="removeAccessory(accIndex)">
                        Quitar
                    </button>
                    </div>
                </div>

                <details class="borrowed-equipment-repeater mt-3" [open]="entries.length > 0">
                <summary class="d-flex align-items-center justify-content-between gap-2">
                    <span>¿El cliente prestó algo para la prueba?</span>
                    <span class="badge text-bg-light border">{{ entries.length ? entries.length + ' registrado' + (entries.length === 1 ? '' : 's') : 'Opcional' }}</span>
                </summary>
                <div class="pt-3">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <label class="form-label mb-0">Elementos prestados para prueba</label>
                        <button class="btn btn-sm btn-outline-theme" type="button" [attr.data-testid]="'equipment-modal-add-borrowed-' + itemIndex" (click)="addEntry()">
                            <i class="bi bi-plus-lg me-1"></i> Agregar
                        </button>
                    </div>
                    <p class="small text-secondary mb-2">
                        Úsalo solo para elementos ajenos al equipo que deben devolverse, como parlantes, monitor, cableado o motor equivalente. Cada préstamo recibe un código BLD de devolución.
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
                        <div class="small text-secondary border rounded px-2 py-2">No hay elementos prestados para prueba.</div>
                    </ng-template>
                </div>
                </details>
            </ng-container>
        </section>
    `,
    styles: [`
        .received-items { border: 1px solid var(--bs-border-color); border-radius: .5rem; padding: 1rem; }
        .borrowed-equipment-repeater summary { cursor: pointer; color: var(--bs-secondary-color); }
        .borrowed-equipment-repeater summary::marker { color: var(--bs-primary); }
    `],
})
export class CrmEquipmentBorrowedListComponent {
    @Input({ required: true }) item!: ProspectEquipmentItem;
    @Input() itemIndex = 0;

    // `item.accessories` sigue siendo el único source of truth (string en store/API/BD).
    // Delimitador \n para que los nombres con coma no se fragmenten; las vistas de solo
    // lectura usan white-space: pre-line. Se re-serializa en cada mutación.
    draftAccessory = "";

    get accessoryItems(): string[] {
        const raw = this.item.accessories ?? "";
        return String(raw).split(/\r?\n/).map((part) => part.trim()).filter(Boolean);
    }

    // Estado expandido: hay accesorios registrados O préstamos (incluye datos históricos con solo préstamo).
    get expanded(): boolean {
        return this.accessoryItems.length > 0 || this.entries.length > 0;
    }

    trackByAccessoryIndex(index: number): number {
        return index;
    }

    private syncAccessories(items: string[]): void {
        this.item.accessories = items.map((value) => String(value ?? "").trim()).filter(Boolean).join("\n");
    }

    addAccessory(): void {
        const value = this.draftAccessory.trim();
        if (!value) return;
        this.syncAccessories([...this.accessoryItems, value]);
        this.draftAccessory = "";
    }

    onAccessoryItemChange(index: number, value: string): void {
        const next = this.accessoryItems.map((entry, currentIndex) => (currentIndex === index ? String(value ?? "") : entry));
        this.syncAccessories(next);
    }

    removeAccessory(index: number): void {
        this.syncAccessories(this.accessoryItems.filter((_, currentIndex) => currentIndex !== index));
    }

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
