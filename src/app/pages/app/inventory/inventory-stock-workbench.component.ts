import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { DuplicateReferenceCandidate, InventoryRole, StockReference } from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";
import { referenceMatches } from "../../../services/parts.logic";
import { SupplierRecord, SuppliersCatalogService } from "../../../services/suppliers-catalog.service";

@Component({
    selector: "app-inventory-stock-workbench",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Inventario - Stock y fichas</h5>
                    <p class="text-secondary small mb-0">Crea fichas nuevas o registra entradas a referencias existentes.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/inventory-dashboard">Volver al panel</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/inventory-dashboard">Inventario</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Stock y fichas</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3">
                <div class="card-body">
                    <div class="row gx-3 align-items-end">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Perfil operativo</label>
                            <select class="form-select" [(ngModel)]="rolePreset">
                                <option value="tecnico">Tecnico</option>
                                <option value="responsable">Responsable de inventario</option>
                                <option value="administrativo">Administrativo</option>
                                <option value="compras">Compras</option>
                                <option value="auditor">Auditor</option>
                            </select>
                        </div>
                        <div class="col-12 col-md">
                            <div class="alert mb-0" [ngClass]="canCreateCard ? 'alert-success border' : 'alert-warning border'">
                                <strong>Politica activa:</strong>
                                <span *ngIf="canCreateCard"> puedes crear fichas y registrar entradas.</span>
                                <span *ngIf="!canCreateCard"> puedes consultar y registrar consumo, pero crear ficha queda restringido.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="feedback" class="alert mb-3" [ngClass]="feedbackTypeClass">
                {{ feedback }}
            </div>

            <!-- MEJORA I: Tabs para separar Alta de ficha vs Entrada -->
            <div class="card adminuiux-card mb-3">
                <div class="card-header">
                    <ul class="nav nav-tabs card-header-tabs">
                        <li class="nav-item">
                            <button class="nav-link" [class.active]="activeTab === 'crear'" (click)="activeTab = 'crear'">
                                <i class="bi bi-plus-circle me-1"></i> Alta de ficha nueva
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" [class.active]="activeTab === 'entrada'" (click)="activeTab = 'entrada'">
                                <i class="bi bi-box-arrow-in-down me-1"></i> Entrada a stock existente
                            </button>
                        </li>
                    </ul>
                </div>
                <div class="card-body">
                    <!-- TAB: Alta de ficha nueva (campos reducidos) -->
                    <ng-container *ngIf="activeTab === 'crear'">
                        <p class="small text-secondary mb-3">Solo para referencias que no existen en el catalogo. El codigo interno se genera automaticamente.</p>
                        <div class="row gx-3 gy-2">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Referencia <span class="text-danger">*</span></label>
                                <input class="form-control" [(ngModel)]="draftCreate.reference" placeholder="Ej: LM324N" />
                                <small *ngIf="duplicateCandidates.length > 0" class="text-danger d-block mt-1">
                                    Posible duplicado: {{ duplicateCandidates[0].reference }} ({{ duplicateCandidates[0].reason }}, similitud {{ duplicateCandidates[0].similarity }}).
                                </small>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Designacion <span class="text-danger">*</span></label>
                                <input class="form-control" [(ngModel)]="draftCreate.designation" placeholder="Ej: Amplificador operacional" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Familia</label>
                                <input class="form-control" [(ngModel)]="draftCreate.family" placeholder="Ej: Circuito integrado" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Marca</label>
                                <input class="form-control" [(ngModel)]="draftCreate.brand" placeholder="Ej: Texas Instruments" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Proveedor principal</label>
                                <select class="form-select" [(ngModel)]="draftCreate.preferredSupplierId" (ngModelChange)="onPreferredSupplierChange($event)">
                                    <option [ngValue]="null">Selecciona proveedor</option>
                                    <option *ngFor="let supplier of suppliers" [ngValue]="supplier.id">
                                        {{ supplier.supplierNumber }} - {{ supplier.legalName }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Criticidad</label>
                                <select class="form-select" [(ngModel)]="draftCreate.criticality">
                                    <option value="alta">Alta</option>
                                    <option value="media">Media</option>
                                    <option value="baja">Baja</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Stock minimo</label>
                                <input class="form-control" type="number" min="0" [(ngModel)]="draftCreate.minStock" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Ubicacion</label>
                                <input class="form-control" [(ngModel)]="draftCreate.location" placeholder="Ej: R61" />
                            </div>
                            <div class="col-12 col-md-4" *ngIf="selectedCreateSupplier">
                                <div class="small text-secondary mt-2">
                                    <i class="bi bi-info-circle me-1"></i>
                                    {{ selectedCreateSupplier.supplierNumber }} · {{ selectedCreateSupplier.city }}/{{ selectedCreateSupplier.country }} · Lead time heredado
                                </div>
                            </div>
                        </div>

                        <!-- MEJORA A: Campos avanzados colapsados -->
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="showAdvancedCreate = !showAdvancedCreate">
                                <i class="bi" [ngClass]="showAdvancedCreate ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                                Campos avanzados
                            </button>
                        </div>
                        <div *ngIf="showAdvancedCreate" class="row gx-3 gy-2 mt-2">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Referencia fabricante</label>
                                <input class="form-control" [(ngModel)]="draftCreate.manufacturerReference" placeholder="SN74HC00N" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Unidad de medida</label>
                                <input class="form-control" [(ngModel)]="draftCreate.unitMeasure" placeholder="unidad, kit, metro" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Compatibilidad equipo/modelo</label>
                                <input class="form-control" [(ngModel)]="draftCreate.compatibleEquipment" placeholder="PLC S7-1200, Variador ACS355" />
                            </div>
                            <div class="col-12">
                                <label class="form-label">Notas tecnicas</label>
                                <input class="form-control" [(ngModel)]="draftCreate.technicalNotes" placeholder="Uso, equivalencias, restricciones de instalacion" />
                            </div>
                        </div>

                        <div class="mt-3 d-flex gap-2 flex-wrap">
                            <button class="btn btn-theme" type="button" [disabled]="!canCreateCard" (click)="createCard()">Crear ficha</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="resetCreateDraft()">Limpiar</button>
                        </div>
                    </ng-container>

                    <!-- TAB: Entrada a stock existente (campos reducidos) -->
                    <ng-container *ngIf="activeTab === 'entrada'">
                        <p class="small text-secondary mb-3">Registra la llegada de material a una referencia que ya existe en el catalogo.</p>
                        <div class="row gx-3 gy-2">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Referencia existente <span class="text-danger">*</span></label>
                                <select class="form-select" [(ngModel)]="entryDraft.reference" (ngModelChange)="onEntryReferenceChange($event)">
                                    <option value="">Selecciona referencia</option>
                                    <option *ngFor="let item of references" [value]="item.reference">{{ item.reference }} - {{ item.designation }}</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Cantidad a ingresar <span class="text-danger">*</span></label>
                                <input class="form-control" type="number" min="1" [(ngModel)]="entryDraft.quantity" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Proveedor que entrega</label>
                                <select class="form-select" [(ngModel)]="entryDraft.supplierId" (ngModelChange)="onEntrySupplierChange($event)">
                                    <option [ngValue]="null">Selecciona proveedor</option>
                                    <option *ngFor="let supplier of suppliers" [ngValue]="supplier.id">
                                        {{ supplier.supplierNumber }} - {{ supplier.legalName }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Tipo documento</label>
                                <select class="form-select" [(ngModel)]="entryDraft.documentType">
                                    <option value="Remision">Remision</option>
                                    <option value="Factura">Factura</option>
                                    <option value="Acta de recepcion">Acta de recepcion</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Numero documento</label>
                                <input class="form-control" [(ngModel)]="entryDraft.documentNumber" placeholder="FAC-88421" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Ubicacion</label>
                                <input class="form-control" [(ngModel)]="entryDraft.location" placeholder="Ej: T20" />
                            </div>
                        </div>

                        <div class="mt-3 d-flex gap-2 flex-wrap">
                            <button class="btn btn-theme" type="button" [disabled]="!canRegisterEntry" (click)="registerEntry()">Registrar entrada</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="resetEntryDraft()">Limpiar</button>
                        </div>
                    </ng-container>
                </div>
            </div>

            <div class="card adminuiux-card">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-12 col-md">
                            <h6 class="mb-0">Catalogo actual de stock</h6>
                        </div>
                        <div class="col-12 col-md-auto">
                            <input class="form-control" [(ngModel)]="searchReference" placeholder="Buscar por referencia o designacion" />
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
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
                                    <th>Minimo</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let item of filteredReferences">
                                    <td>{{ item.reference }}</td>
                                    <td>{{ item.internalCode || '--' }}</td>
                                    <td>{{ item.designation }}</td>
                                    <td>{{ item.family }}</td>
                                    <td>{{ item.location }}</td>
                                    <td>{{ item.currentStock }}</td>
                                    <td>{{ item.minStock }}</td>
                                    <td>
                                        <span class="badge" [ngClass]="item.currentStock <= item.minStock ? 'text-bg-danger' : 'text-bg-success'">
                                            {{ item.currentStock <= item.minStock ? 'Bajo minimo' : 'OK' }}
                                        </span>
                                    </td>
                                </tr>
                                <tr *ngIf="filteredReferences.length === 0">
                                    <td class="text-center text-secondary py-4" colspan="8">Sin coincidencias para el filtro actual.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InventoryStockWorkbenchComponent implements OnInit {
    readonly roleOptions: InventoryRole[] = ["tecnico", "responsable", "administrativo", "compras", "auditor"];

    activeTab: "crear" | "entrada" = "crear";
    showAdvancedCreate = false;
    searchReference = "";

    feedback = "";
    feedbackType: "success" | "warning" | "danger" = "success";
    suppliers: SupplierRecord[] = [];

    draftCreate = {
        reference: "",
        manufacturerReference: "",
        family: "",
        brand: "",
        designation: "",
        unitMeasure: "unidad",
        compatibleEquipment: "",
        criticality: "media" as "alta" | "media" | "baja",
        preferredSupplierId: null as number | null,
        preferredSupplierName: "",
        supplierCode: "",
        technicalNotes: "",
        minStock: 1,
        location: "",
    };

    entryDraft = {
        reference: "",
        quantity: 1,
        location: "",
        supplierId: null as number | null,
        supplierName: "",
        supplierCode: "",
        documentType: "Remision",
        documentNumber: "",
    };

    references: StockReference[] = [];

    constructor(
        private readonly inventoryRbac: InventoryRbacService,
        private readonly inventoryWorkflow: InventoryWorkflowService,
        private readonly suppliersCatalog: SuppliersCatalogService
    ) { }

    ngOnInit(): void {
        this.refreshSuppliers();
        this.refreshReferences();
    }

    get rolePreset(): InventoryRole {
        return this.inventoryRbac.currentRole;
    }

    set rolePreset(role: InventoryRole) {
        this.inventoryRbac.setRole(role);
    }

    get canCreateCard(): boolean {
        return this.inventoryRbac.hasPermission("inventory.stock.create-card");
    }

    get canRegisterEntry(): boolean {
        return this.inventoryRbac.hasPermission("inventory.stock.register-entry") || this.inventoryRbac.hasPermission("inventory.movements.register-entry");
    }

    get feedbackTypeClass(): string {
        if (this.feedbackType === "success") {
            return "alert-success border";
        }
        if (this.feedbackType === "warning") {
            return "alert-warning border";
        }
        return "alert-danger border";
    }

    get duplicateCandidates(): DuplicateReferenceCandidate[] {
        return this.inventoryWorkflow.findDuplicateReferenceCandidates(this.draftCreate.reference, this.draftCreate.designation);
    }

    get filteredReferences(): StockReference[] {
        if (!this.searchReference.trim()) {
            return this.references;
        }

        return this.references.filter((item) => referenceMatches(item, this.searchReference));
    }

    get selectedCreateSupplier(): SupplierRecord | null {
        return this.suppliersCatalog.findById(this.draftCreate.preferredSupplierId) ?? null;
    }

    get selectedEntrySupplier(): SupplierRecord | null {
        return this.suppliersCatalog.findById(this.entryDraft.supplierId) ?? null;
    }

    onPreferredSupplierChange(supplierId: number | null): void {
        const supplier = this.suppliersCatalog.findById(supplierId);
        this.draftCreate.preferredSupplierId = supplier?.id ?? null;
        this.draftCreate.preferredSupplierName = supplier?.legalName ?? "";
        this.draftCreate.supplierCode = supplier?.supplierNumber ?? "";
    }

    onEntrySupplierChange(supplierId: number | null): void {
        const supplier = this.suppliersCatalog.findById(supplierId);
        this.entryDraft.supplierId = supplier?.id ?? null;
        this.entryDraft.supplierName = supplier?.legalName ?? "";
        this.entryDraft.supplierCode = supplier?.supplierNumber ?? "";
    }

    onEntryReferenceChange(reference: string): void {
        const ref = this.references.find((item) => item.reference === reference);
        if (ref) {
            this.entryDraft.location = ref.location || "";
            const supplier = ref.preferredSupplierName
                ? this.suppliers.find((s) => s.legalName === ref.preferredSupplierName)
                : undefined;
            if (supplier) {
                this.entryDraft.supplierId = supplier.id;
                this.entryDraft.supplierName = supplier.legalName;
                this.entryDraft.supplierCode = supplier.supplierNumber;
            }
        }
    }

    createCard(): void {
        const familyCode = (this.draftCreate.family || "GEN").substring(0, 3).toUpperCase();
        const autoInternalCode = `INV-${familyCode}-${String(this.references.length + 1).padStart(4, "0")}`;
        const supplier = this.selectedCreateSupplier;

        const result = this.inventoryWorkflow.createReference({
            reference: this.draftCreate.reference,
            internalCode: autoInternalCode,
            manufacturerReference: this.draftCreate.manufacturerReference,
            designation: this.draftCreate.designation,
            family: this.draftCreate.family,
            subfamily: "",
            brand: this.draftCreate.brand,
            location: this.draftCreate.location,
            unitMeasure: this.draftCreate.unitMeasure,
            compatibleEquipment: this.draftCreate.compatibleEquipment,
            criticality: this.draftCreate.criticality,
            preferredSupplierName: this.draftCreate.preferredSupplierName,
            supplierCode: this.draftCreate.supplierCode,
            leadTimeDays: supplier?.minimumOrder ?? 0,
            technicalNotes: this.draftCreate.technicalNotes,
            minStock: Number(this.draftCreate.minStock),
            targetStock: Number(this.draftCreate.minStock),
        });

        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.resetCreateDraft();
            this.refreshReferences();
        }
    }

    registerEntry(): void {
        const result = this.inventoryWorkflow.registerStockEntry({
            reference: this.entryDraft.reference,
            quantity: Number(this.entryDraft.quantity),
            location: this.entryDraft.location,
            supplierName: this.entryDraft.supplierName,
            supplierCode: this.entryDraft.supplierCode,
            documentType: this.entryDraft.documentType,
            documentNumber: this.entryDraft.documentNumber,
            batchOrSerial: "",
            unitCost: 0,
            receivedBy: this.inventoryRbac.currentRole,
            receivedAt: new Date().toISOString().slice(0, 10),
        });

        this.setFeedback(result.message, result.ok ? "success" : "danger");
        if (result.ok) {
            this.resetEntryDraft();
            this.refreshReferences();
        }
    }

    resetCreateDraft(): void {
        this.draftCreate = {
            reference: "",
            manufacturerReference: "",
            family: "",
            brand: "",
            designation: "",
            unitMeasure: "unidad",
            compatibleEquipment: "",
            criticality: "media",
            preferredSupplierId: null,
            preferredSupplierName: "",
            supplierCode: "",
            technicalNotes: "",
            minStock: 1,
            location: "",
        };
    }

    resetEntryDraft(): void {
        this.entryDraft = {
            reference: "",
            quantity: 1,
            location: "",
            supplierId: null,
            supplierName: "",
            supplierCode: "",
            documentType: "Remision",
            documentNumber: "",
        };
    }

    private setFeedback(message: string, type: "success" | "warning" | "danger"): void {
        this.feedback = message;
        this.feedbackType = type;
    }

    private refreshReferences(): void {
        this.references = this.inventoryWorkflow.getSnapshot().references;
    }

    private refreshSuppliers(): void {
        this.suppliers = this.suppliersCatalog.getSnapshot();
    }
}
