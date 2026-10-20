import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { resolveApiBaseUrl } from "../../../services/api-base-url.util";
import {
    buildAnchoredAlert,
    buildRemissionPrintModel,
    canTransitionDeliveryStatus,
    computeRemissionTotal,
    dispatchTypeLabel,
    findQuoteLineForItem,
    groupDispatchReadyByClient,
    itemsRequiringAccessoriesConfirmation,
    requiresAccessoriesConfirmation,
} from "./remissions.logic";

interface RemissionItem {
    equipmentId: string;
    identifier: string;
    description: string;
    accessories: string;
    anchoredNote: string;
    warrantyMonths: number;
    unitPrice: number;
    quantity: number;
}

interface DispatchPhoto {
    name: string;
    dataUrl: string;
}

interface Remission {
    id: string;
    consecutive: string;
    clientName: string;
    clientNit: string;
    dispatchType: string;
    carrierName: string;
    guideNumber: string;
    purchaseOrder: string;
    youtubeLink: string;
    dispatchPhotos: DispatchPhoto[];
    items: RemissionItem[];
    valued: boolean;
    totalValue: number;
    warrantyMonths: number;
    notes: string;
    status: string;
    deliveryStatus: string;
    createdAt: string;
}

interface DispatchReadyGroup {
    clientName: string;
    clientNit: string;
    equipments: any[];
    expanded: boolean;
}

const REMISSIONS_TEMPLATE = `
<div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-secondary" type="button" (click)="goBack()" data-testid="back-btn">
                <i class="bi bi-arrow-left me-1"></i>Volver
            </button>
            <h4 class="mb-0"><i class="bi bi-truck me-2"></i>Remisiones</h4>
        </div>
        <button class="btn btn-theme" (click)="openCreate()" data-testid="create-remission-btn">
            <i class="bi bi-plus-lg me-1"></i>Nueva remision
        </button>
    </div>

    <div class="card mb-3" data-testid="dispatch-ready-panel" *ngIf="dispatchGroups.length > 0">
        <div class="card-body">
            <h5 class="card-title"><i class="bi bi-box-seam me-2"></i>Equipos a despachar</h5>
            <div *ngFor="let group of dispatchGroups" class="border rounded mb-2" data-testid="dispatch-client-group">
                <button class="btn btn-link text-decoration-none w-100 text-start d-flex justify-content-between align-items-center" (click)="group.expanded = !group.expanded">
                    <span><strong>{{ group.clientName }}</strong><span class="text-secondary ms-2" *ngIf="group.clientNit">NIT: {{ group.clientNit }}</span></span>
                    <span class="badge bg-secondary">{{ group.equipments.length }} equipo(s) <i class="bi" [ngClass]="group.expanded ? 'bi-chevron-up' : 'bi-chevron-down'"></i></span>
                </button>
                <div *ngIf="group.expanded" class="px-3 pb-2">
                    <div *ngFor="let eq of group.equipments" class="d-flex justify-content-between align-items-center border-top py-2">
                        <div>
                            <div class="mb-1">
                                <span class="badge bg-dark fs-6" data-testid="equipment-code">{{ eq.receivedIdentifier || eq.identifier || eq.serie || 'Sin codigo' }}</span>
                                <span class="badge bg-info ms-2">{{ eq.repairStatus || eq.status }}</span>
                            </div>
                            <div class="fw-semibold">{{ eq.displayName || eq.description || ((eq.marca || '') + ' ' + (eq.tipo || '')) }}</div>
                            <div class="text-secondary small" *ngIf="eq.accessories">Accesorios: {{ eq.accessories }}</div>
                            <div class="text-warning small" *ngIf="anchoredAlert(eq)">{{ anchoredAlert(eq) }}</div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" (click)="addEquipmentToRemission(group, eq)" data-testid="add-equipment-to-remission">
                            <i class="bi bi-plus-lg me-1"></i>Agregar a remision
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-3" *ngIf="showForm">
        <div class="card-body">
            <h5 class="card-title">{{ editingId ? 'Editar' : 'Nueva' }} Remision</h5>
            <div class="alert alert-warning" *ngIf="anchoredAlertMessage" data-testid="anchored-alert">
                <i class="bi bi-exclamation-triangle me-2"></i>{{ anchoredAlertMessage }}
            </div>
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Cliente</label>
                    <input class="form-control" [(ngModel)]="form.clientName" data-testid="remission-client" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">NIT</label>
                    <input class="form-control" [(ngModel)]="form.clientNit" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">Tipo de Despacho</label>
                    <select class="form-select" [(ngModel)]="form.dispatchType" data-testid="dispatch-type-select">
                        <option value="">Seleccionar...</option>
                        <option value="servientrega">Servientrega</option>
                        <option value="recoge-cliente">Recoge Cliente</option>
                        <option value="contra-entrega">Contra entrega</option>
                        <option value="dhl">DHL</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Transportadora</label>
                    <input class="form-control" [(ngModel)]="form.carrierName" data-testid="carrier-name-input" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">Numero de guia</label>
                    <input class="form-control" [(ngModel)]="form.guideNumber" data-testid="guide-number-input" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">Garantia (meses)</label>
                    <select class="form-select" [(ngModel)]="form.warrantyMonths" data-testid="warranty-select">
                        <option [ngValue]="0">Sin garantia</option>
                        <option [ngValue]="3">3 meses</option>
                        <option [ngValue]="6">6 meses</option>
                        <option [ngValue]="12">12 meses</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Orden de compra (OC)</label>
                    <input class="form-control" [(ngModel)]="form.purchaseOrder" data-testid="purchase-order-input" />
                </div>
                <div class="col-md-3">
                    <div class="form-check mt-4">
                        <input class="form-check-input" type="checkbox" [(ngModel)]="form.valued" id="valuedCheck" data-testid="valued-remission-check" />
                        <label class="form-check-label" for="valuedCheck">Remision valorizada (Zona Franca)</label>
                    </div>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Link de YouTube</label>
                    <input class="form-control" [(ngModel)]="form.youtubeLink" placeholder="https://youtube.com/..." data-testid="youtube-link-input" />
                </div>
                <div class="col-md-5">
                    <label class="form-label">Fotos del despacho</label>
                    <input class="form-control" type="file" accept="image/*" multiple (change)="onPhotosSelected($event)" data-testid="dispatch-photos-input" />
                    <div class="d-flex flex-wrap gap-2 mt-2" *ngIf="form.dispatchPhotos.length > 0">
                        <div *ngFor="let photo of form.dispatchPhotos; let i = index" class="position-relative border rounded p-1">
                            <img [src]="photo.dataUrl" [alt]="photo.name" style="width: 72px; height: 72px; object-fit: cover;" />
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" (click)="removePhoto(i)"><i class="bi bi-x"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-3">
                <h6 class="mb-0">Equipos en la remision</h6>
                <button class="btn btn-sm btn-outline-secondary" (click)="loadQuotePrices()" data-testid="load-quote-prices-btn">
                    <i class="bi bi-cash-coin me-1"></i>Traer precios de cotizacion
                </button>
            </div>
            <div class="alert alert-info py-2 mt-2" *ngIf="quotePricesMessage" data-testid="quote-prices-message">{{ quotePricesMessage }}</div>
            <div *ngFor="let item of form.items; let i = index" class="row g-2 mb-2 align-items-end border-bottom pb-2">
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.identifier" placeholder="Identificador" /></div>
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.description" placeholder="Descripcion" /></div>
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.accessories" placeholder="Accesorios" data-testid="item-accessories" /></div>
                <div class="col-md-2">
                    <select class="form-select form-select-sm" [(ngModel)]="item.warrantyMonths">
                        <option [ngValue]="0">Sin garantia</option>
                        <option [ngValue]="3">3 meses</option>
                        <option [ngValue]="6">6 meses</option>
                        <option [ngValue]="12">12 meses</option>
                    </select>
                </div>
                <div class="col-md-1"><input type="number" class="form-control form-control-sm" [(ngModel)]="item.unitPrice" placeholder="Precio" /></div>
                <div class="col-md-1"><input type="number" class="form-control form-control-sm" [(ngModel)]="item.quantity" placeholder="Cant" /></div>
                <div class="col-md-2"><button class="btn btn-sm btn-outline-danger" (click)="removeItem(i)"><i class="bi bi-trash"></i></button></div>
                <div class="col-12" *ngIf="item.anchoredNote"><div class="text-warning small"><i class="bi bi-link-45deg me-1"></i>{{ item.anchoredNote }}</div></div>
            </div>
            <button class="btn btn-sm btn-outline-secondary mt-1" (click)="addItem()" data-testid="add-remission-item"><i class="bi bi-plus me-1"></i>Agregar equipo</button>

            <div class="mt-3 d-flex justify-content-between">
                <div class="fw-bold" *ngIf="form.valued">Total: {{ getCurrencySymbol() }}{{ getTotalValue() | number:'1.0-0' }}</div>
                <div>
                    <button class="btn btn-outline-secondary me-2" (click)="previewPDF()" data-testid="preview-pdf-btn"><i class="bi bi-eye me-1"></i>Previsualizar</button>
                    <button class="btn btn-outline-secondary me-2" (click)="printPurchaseOrder()" data-testid="print-purchase-order-btn"><i class="bi bi-printer me-1"></i>Imprimir OC</button>
                    <button class="btn btn-theme me-2" (click)="save()"><i class="bi bi-save me-1"></i>Guardar</button>
                    <button class="btn btn-outline-secondary" (click)="showForm = false">Cancelar</button>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="table-responsive">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Consecutivo</th>
                        <th>Cliente</th>
                        <th>Tipo despacho</th>
                        <th>Transportadora</th>
                        <th>Guia</th>
                        <th>Equipos</th>
                        <th>Valor total</th>
                        <th>Estado</th>
                        <th>Entrega</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let r of remissions">
                        <td><strong>{{ r.consecutive }}</strong></td>
                        <td>{{ r.clientName }}</td>
                        <td><span class="badge bg-info">{{ dispatchTypeLabel(r.dispatchType) }}</span></td>
                        <td>{{ r.carrierName }}</td>
                        <td>{{ r.guideNumber }}</td>
                        <td>{{ r.items?.length || 0 }}</td>
                        <td *ngIf="r.valued">{{ getCurrencySymbol() }}{{ r.totalValue | number:'1.0-0' }}</td>
                        <td *ngIf="!r.valued">-</td>
                        <td><span class="badge bg-secondary">{{ r.status }}</span></td>
                        <td>
                            <span class="badge" [ngClass]="(r.deliveryStatus || 'pendiente') === 'entregado' ? 'bg-success' : 'bg-warning text-dark'" data-testid="delivery-status-badge">
                                {{ r.deliveryStatus || 'pendiente' }}
                            </span>
                            <button class="btn btn-sm btn-outline-success ms-1" *ngIf="(r.deliveryStatus || 'pendiente') !== 'entregado'" (click)="markDelivered(r)" data-testid="mark-delivered-btn">
                                Marcar entregado
                            </button>
                            <button class="btn btn-sm btn-outline-secondary ms-1" *ngIf="(r.deliveryStatus || 'pendiente') === 'entregado'" (click)="viewDeliveredDetail(r)" data-testid="view-delivered-detail">
                                <i class="bi bi-eye"></i> Ver detalle
                            </button>
                        </td>
                    </tr>
                    <tr *ngIf="remissions.length === 0">
                        <td colspan="9" class="text-center text-secondary py-4">No hay remisiones registradas</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="preview-modal-backdrop" *ngIf="showDeliveryConfirm" data-testid="delivery-confirm-modal">
        <div class="preview-modal card shadow">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Confirmar entrega de accesorios</h5>
                <button class="btn btn-sm btn-outline-secondary" (click)="cancelDeliveryConfirm()" data-testid="cancel-delivery-confirm-btn"><i class="bi bi-x-lg"></i> Cerrar</button>
            </div>
            <div class="card-body">
                <p>La remision <strong>{{ deliveryConfirmRemission?.consecutive }}</strong> incluye accesorios o equipos anclados que deben entregarse con el despacho:</p>
                <ul class="list-group mb-3">
                    <li class="list-group-item" *ngFor="let item of accessoriesPendingItems()" data-testid="delivery-accessory-item">
                        <strong>{{ item.identifier || item.description }}</strong>
                        <div class="small" *ngIf="item.accessories">Accesorios: {{ item.accessories }}</div>
                        <div class="small text-warning" *ngIf="item.anchoredNote"><i class="bi bi-link-45deg me-1"></i>{{ item.anchoredNote }}</div>
                    </li>
                </ul>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="accessoriesDeliveredCheck" [(ngModel)]="accessoriesDeliveredConfirmed" data-testid="accessories-delivered-check" />
                    <label class="form-check-label" for="accessoriesDeliveredCheck">Confirmo que se entregaron los accesorios y equipos anclados listados</label>
                </div>
                <button class="btn btn-success" [disabled]="!accessoriesDeliveredConfirmed" (click)="confirmMarkDelivered()" data-testid="confirm-delivered-btn">
                    <i class="bi bi-check-lg me-1"></i>Confirmar entrega
                </button>
            </div>
        </div>
    </div>

    <div class="preview-modal-backdrop" *ngIf="showPreview" data-testid="remission-preview-modal">
        <div class="preview-modal card shadow">
            <div class="card-header d-flex justify-content-between align-items-center no-print">
                <h5 class="mb-0">{{ previewTitle }}</h5>
                <div>
                    <button class="btn btn-sm btn-theme me-2" (click)="printPreview()" data-testid="print-remission-btn"><i class="bi bi-printer me-1"></i>Imprimir / Guardar PDF</button>
                    <button class="btn btn-sm btn-outline-secondary" (click)="closePreview()"><i class="bi bi-x-lg"></i> Cerrar</button>
                </div>
            </div>
            <div class="card-body print-area">
                <div class="d-flex justify-content-between border-bottom pb-2 mb-3">
                    <div>
                        <h4 class="mb-1">{{ previewTitle }}</h4>
                        <div class="text-secondary">Consecutivo: <strong>{{ previewModel?.consecutive || 'Por asignar' }}</strong></div>
                    </div>
                    <div class="text-end">
                        <div>Estado de entrega: <strong>{{ previewModel?.deliveryStatus }}</strong></div>
                        <div *ngIf="previewModel?.warrantyMonths">Garantia: {{ previewModel?.warrantyMonths }} meses</div>
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <div><strong>Cliente:</strong> {{ previewModel?.clientName }}</div>
                        <div><strong>NIT:</strong> {{ previewModel?.clientNit || '-' }}</div>
                        <div><strong>Tipo de despacho:</strong> {{ previewModel?.dispatchTypeLabel }}</div>
                    </div>
                    <div class="col-md-6">
                        <div><strong>Transportadora:</strong> {{ previewModel?.carrierName || '-' }}</div>
                        <div><strong>Guia:</strong> {{ previewModel?.guideNumber || '-' }}</div>
                        <div><strong>Orden de compra:</strong> {{ previewModel?.purchaseOrder || '-' }}</div>
                        <div *ngIf="previewModel?.youtubeLink"><strong>Video:</strong> <a [href]="previewModel?.youtubeLink" target="_blank">{{ previewModel?.youtubeLink }}</a></div>
                    </div>
                </div>
                <table class="table table-sm table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th>Identificador</th>
                            <th>Descripcion</th>
                            <th>Accesorios</th>
                            <th>Garantia</th>
                            <th>Cant</th>
                            <th *ngIf="previewModel?.totalValue !== null">Precio unitario</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of previewModel?.items">
                            <td>{{ item.identifier }}</td>
                            <td>{{ item.description }}</td>
                            <td>{{ item.accessories || '-' }}</td>
                            <td>{{ item.warrantyMonths ? item.warrantyMonths + ' meses' : 'Sin garantia' }}</td>
                            <td>{{ item.quantity }}</td>
                            <td *ngIf="previewModel?.totalValue !== null">{{ getCurrencySymbol() }}{{ item.unitPrice | number:'1.0-0' }}</td>
                        </tr>
                    </tbody>
                    <tfoot *ngIf="previewModel?.totalValue !== null">
                        <tr>
                            <td [attr.colspan]="previewModel?.totalValue !== null ? 5 : 4" class="text-end fw-bold">Total</td>
                            <td class="fw-bold">{{ getCurrencySymbol() }}{{ previewModel?.totalValue | number:'1.0-0' }}</td>
                        </tr>
                    </tfoot>
                </table>
                <div *ngIf="previewModel?.photos?.length" class="mt-3">
                    <strong>Fotos del despacho</strong>
                    <div class="d-flex flex-wrap gap-2 mt-2">
                        <img *ngFor="let photo of previewModel?.photos" [src]="photo.dataUrl" [alt]="photo.name" class="border rounded" style="width: 96px; height: 96px; object-fit: cover;" />
                    </div>
                </div>
                <div *ngIf="previewModel?.notes" class="mt-3">
                    <strong>Notas:</strong> {{ previewModel?.notes }}
                </div>
            </div>
        </div>
    </div>
</div>
`;

const REMISSIONS_STYLES = `
.preview-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1050;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow-y: auto;
    padding: 2rem 1rem;
}
.preview-modal {
    width: 900px;
    max-width: 100%;
    background: #fff;
}
@media print {
    body * {
        visibility: hidden;
    }
    .print-area, .print-area * {
        visibility: visible;
    }
    .print-area {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
    }
    .no-print {
        display: none !important;
    }
    .preview-modal-backdrop {
        position: static;
        background: none;
        padding: 0;
    }
}
`;

@Component({
    selector: "app-remissions",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: REMISSIONS_TEMPLATE,
    styles: [REMISSIONS_STYLES],
})
export class RemissionsComponent implements OnInit {
    private apiBaseUrl = resolveApiBaseUrl();
    remissions: Remission[] = [];
    dispatchGroups: DispatchReadyGroup[] = [];
    showForm = false;
    editingId = "";
    form = this.emptyForm();
    anchoredAlertMessage = "";
    quotePricesMessage = "";
    showPreview = false;
    previewTitle = "Remision";
    previewModel: any = null;
    showDeliveryConfirm = false;
    deliveryConfirmRemission: Remission | null = null;
    accessoriesDeliveredConfirmed = false;

    readonly dispatchTypeLabel = dispatchTypeLabel;
    readonly anchoredAlert = buildAnchoredAlert;

    constructor(private cdr: ChangeDetectorRef, private router: Router) {}

    goBack(): void {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
            return;
        }
        this.router.navigateByUrl("/");
    }

    getCurrencySymbol() { return "$"; }

    emptyForm() {
        return {
            clientName: "", clientNit: "", dispatchType: "", carrierName: "",
            guideNumber: "", purchaseOrder: "", youtubeLink: "",
            dispatchPhotos: [] as DispatchPhoto[],
            valued: false, warrantyMonths: 0, notes: "",
            items: [] as RemissionItem[],
        };
    }

    ngOnInit() {
        this.loadRemissions();
        this.loadDispatchReady();
    }

    private authHeaders() {
        const token = JSON.parse(localStorage.getItem("pika.auth.session") || "{}").accessToken;
        return { "Content-Type": "application/json", "X-Company-Id": "demo-company", Authorization: "Bearer " + token };
    }

    async loadRemissions() {
        try {
            const res = await fetch(this.apiBaseUrl + "/api/v1/remissions/remissions", {
                headers: this.authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                this.remissions = data.items || [];
                this.cdr.detectChanges();
            }
        } catch { /* ignore */ }
    }

    async loadDispatchReady() {
        try {
            const res = await fetch(this.apiBaseUrl + "/api/v1/crm-equipment/items", {
                headers: this.authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                this.dispatchGroups = groupDispatchReadyByClient(data.items || []).map((g) => ({ ...g, expanded: true }));
                this.cdr.detectChanges();
            }
        } catch { /* ignore */ }
    }

    openCreate() {
        this.form = this.emptyForm();
        this.editingId = "";
        this.anchoredAlertMessage = "";
        this.quotePricesMessage = "";
        this.showForm = true;
    }

    addEquipmentToRemission(group: DispatchReadyGroup, eq: any) {
        if (!this.showForm || this.editingId) {
            this.openCreate();
        }
        this.form.clientName = group.clientName;
        this.form.clientNit = group.clientNit;
        const identifier = eq.receivedIdentifier || eq.identifier || eq.serie || "";
        const description = eq.displayName || eq.description || [eq.marca, eq.tipo, eq.serie].filter(Boolean).join(" ");
        const anchoredNote = buildAnchoredAlert(eq);
        const item: RemissionItem = {
            equipmentId: eq.itemId || eq.id || "",
            identifier,
            description,
            accessories: eq.accessories || "",
            anchoredNote,
            warrantyMonths: 0,
            unitPrice: 0,
            quantity: 1,
        };
        this.form.items.push(item);
        if (anchoredNote) {
            this.anchoredAlertMessage = anchoredNote;
        }
        void this.autofillFromLatestQuote(item);
    }

    private async autofillFromLatestQuote(item: RemissionItem) {
        const quote = await this.findLatestClientQuote();
        if (!quote) {
            return;
        }
        if (!this.form.purchaseOrder) {
            this.form.purchaseOrder = String(quote.purchaseOrderNumber || quote.codigo || "");
        }
        const line = findQuoteLineForItem(quote, item);
        if (line && !item.unitPrice) {
            item.unitPrice = Number(line.precioUnitario || 0);
        }
    }

    addItem() { this.form.items.push({ equipmentId: "", identifier: "", description: "", accessories: "", anchoredNote: "", warrantyMonths: 0, unitPrice: 0, quantity: 1 }); }
    removeItem(i: number) { this.form.items.splice(i, 1); }
    getTotalValue() { return computeRemissionTotal(this.form.items); }

    onPhotosSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files || []);
        for (const file of files) {
            const reader = new FileReader();
            reader.onload = () => {
                this.form.dispatchPhotos.push({ name: file.name, dataUrl: String(reader.result || "") });
            };
            reader.readAsDataURL(file);
        }
        input.value = "";
    }

    removePhoto(i: number) { this.form.dispatchPhotos.splice(i, 1); }

    previewPDF() {
        const existing = this.editingId ? this.remissions.find((r) => r.id === this.editingId) : null;
        this.previewModel = buildRemissionPrintModel({
            ...this.form,
            consecutive: existing?.consecutive || "",
            deliveryStatus: existing?.deliveryStatus || "pendiente",
        });
        this.previewTitle = "Remision";
        this.showPreview = true;
    }

    async printPurchaseOrder() {
        const quote = await this.findLatestClientQuote();
        if (quote) {
            const lines = Array.isArray(quote.lineas) ? quote.lineas : [];
            this.previewModel = buildRemissionPrintModel({
                ...this.form,
                consecutive: quote.codigo || "",
                purchaseOrder: quote.purchaseOrderNumber || this.form.purchaseOrder,
                valued: true,
                items: lines.map((line: any) => ({
                    identifier: line.servicio || "",
                    description: line.descripcion || "",
                    accessories: "",
                    warrantyMonths: 0,
                    unitPrice: line.precioUnitario || 0,
                    quantity: line.cantidad || 1,
                })),
            });
        } else {
            this.previewModel = buildRemissionPrintModel({
                ...this.form,
                consecutive: "",
            });
        }
        this.previewTitle = "Orden de Compra";
        this.showPreview = true;
        this.cdr.detectChanges();
    }

    closePreview() { this.showPreview = false; }
    printPreview() { window.print(); }

    viewDeliveredDetail(remission: Remission) {
        this.previewModel = buildRemissionPrintModel(remission);
        this.previewTitle = "Detalle de entrega - Remision " + (remission.consecutive || "");
        this.showPreview = true;
    }

    private async findLatestClientQuote(): Promise<any | null> {
        try {
            const res = await fetch(this.apiBaseUrl + "/api/v1/crm-quotes/quotes", {
                headers: this.authHeaders(),
            });
            if (!res.ok) {
                return null;
            }
            const data = await res.json();
            const clientName = (this.form.clientName || "").trim().toLowerCase();
            const quotes = (data.items || []).filter((q: any) => {
                if (!clientName) {
                    return false;
                }
                const prospecto = String(q.prospecto || "").toLowerCase();
                const empresa = String(q.empresa || "").toLowerCase();
                return prospecto.includes(clientName) || empresa.includes(clientName) || clientName.includes(prospecto);
            });
            quotes.sort((a: any, b: any) => String(b.createdAt || b.fecha || "").localeCompare(String(a.createdAt || a.fecha || "")));
            return quotes[0] || null;
        } catch {
            return null;
        }
    }

    async loadQuotePrices() {
        this.quotePricesMessage = "";
        const quote = await this.findLatestClientQuote();
        if (!quote) {
            this.quotePricesMessage = "No se encontro cotizacion para este cliente.";
            this.cdr.detectChanges();
            return;
        }
        let updated = 0;
        for (const item of this.form.items) {
            const line = findQuoteLineForItem(quote, item);
            if (line) {
                item.unitPrice = Number(line.precioUnitario || 0);
                updated++;
            }
        }
        this.quotePricesMessage = updated > 0
            ? "Se actualizaron " + updated + " precio(s) desde la cotizacion " + (quote.codigo || "") + "."
            : "La cotizacion " + (quote.codigo || "") + " no tiene lineas que coincidan con los equipos.";
        this.cdr.detectChanges();
    }

    async markDelivered(remission: Remission) {
        const from = remission.deliveryStatus || "pendiente";
        if (!canTransitionDeliveryStatus(from, "entregado")) {
            return;
        }
        if (requiresAccessoriesConfirmation(remission.items)) {
            this.deliveryConfirmRemission = remission;
            this.accessoriesDeliveredConfirmed = false;
            this.showDeliveryConfirm = true;
            return;
        }
        await this.patchDelivered(remission);
    }

    accessoriesPendingItems(): RemissionItem[] {
        return itemsRequiringAccessoriesConfirmation(this.deliveryConfirmRemission?.items || []);
    }

    cancelDeliveryConfirm() {
        this.showDeliveryConfirm = false;
        this.deliveryConfirmRemission = null;
        this.accessoriesDeliveredConfirmed = false;
    }

    async confirmMarkDelivered() {
        if (!this.accessoriesDeliveredConfirmed || !this.deliveryConfirmRemission) {
            return;
        }
        const remission = this.deliveryConfirmRemission;
        this.cancelDeliveryConfirm();
        await this.patchDelivered(remission);
    }

    private async patchDelivered(remission: Remission) {
        try {
            const res = await fetch(this.apiBaseUrl + "/api/v1/remissions/remissions/" + remission.id + "/delivery-status", {
                method: "PATCH",
                headers: this.authHeaders(),
                body: JSON.stringify({ deliveryStatus: "entregado" }),
            });
            if (res.ok) {
                this.loadRemissions();
            }
        } catch { /* ignore */ }
    }

    async save() {
        try {
            const method = this.editingId ? "PUT" : "POST";
            const url = this.editingId
                ? this.apiBaseUrl + "/api/v1/remissions/remissions/" + this.editingId
                : this.apiBaseUrl + "/api/v1/remissions/remissions";
            const res = await fetch(url, {
                method,
                headers: this.authHeaders(),
                body: JSON.stringify(this.form),
            });
            if (res.ok) {
                this.showForm = false;
                this.loadRemissions();
                this.cdr.detectChanges();
            }
        } catch { /* ignore */ }
    }
}
