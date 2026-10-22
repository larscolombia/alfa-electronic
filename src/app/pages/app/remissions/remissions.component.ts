import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { resolveApiBaseUrl } from "../../../services/api-base-url.util";
import type { RemissionPrefill } from "./remissions.logic";
import {
    buildAnchoredAlert,
    buildRemissionPrintModel,
    canTransitionDeliveryStatus,
    computeRemissionTotal,
    buildRemissionPrefillFromProject,
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

    // ── Fase 5c: puente pago → despacho ──────────────────────────────────
    // Todo esto lo calcula el backend. La UI NO reimplementa la regla: si la
    // regla viviera aquí, marcar "entregado" seguiría sin validar nada.
    invoiceId: number | null;
    invoiceStatus: string;
    invoiceReference: string;
    creditClient: boolean;
    /** true cuando la modalidad exige pago antes de despachar. */
    paymentGate: boolean;
    /** true cuando la puerta está activa Y aún no se cumple (sin pagar). */
    paymentHeld: boolean;
    paymentHeldReason: string;
    paymentOverride: boolean;
    paymentOverrideBy: string;
    paymentOverrideAt: string;
}

/** Factura del cliente, opción del selector "qué factura debe pagarse". */
interface InvoiceOption {
    id: number;
    referenceCode: string;
    externalNumber: string;
    clientName: string;
    issueDate: string;
    total: number;
    balanceAmount: number;
    status: string;
    paid: boolean;
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

    <!-- Proyectos en etapa "listo para entrega": el boton Completar abre el
         formulario existente (misma card, mismos botones Guardar/Previsualizar)
         con los datos del proyecto ya precargados. -->
    <div class="card mb-3" data-testid="ready-for-delivery-panel">
        <div class="card-body">
            <h5 class="card-title"><i class="bi bi-check2-square me-2"></i>Proyectos listos para entrega</h5>
            <div *ngIf="loadingReadyProjects" class="text-secondary py-2">Cargando proyectos...</div>
            <div *ngIf="readyProjectsError" class="alert alert-warning py-2 mb-2" data-testid="ready-projects-error">
                <i class="bi bi-exclamation-triangle me-1"></i>{{ readyProjectsError }}
            </div>
            <div *ngFor="let p of readyProjects" class="d-flex justify-content-between align-items-center border-top py-2">
                <div>
                    <div class="mb-1">
                        <span class="badge bg-dark fs-6" data-testid="ready-project-code">{{ readyProjectCode(p) }}</span>
                        <span class="badge bg-info ms-2" data-testid="ready-project-status">{{ p.status }}</span>
                    </div>
                    <div class="fw-semibold" *ngIf="readyProjectEquipmentName(p)" data-testid="ready-project-equipment">{{ readyProjectEquipmentName(p) }}</div>
                    <div class="text-secondary small" *ngIf="readyProjectClient(p)">Cliente: {{ readyProjectClient(p) }}</div>
                </div>
                <button class="btn btn-sm btn-theme" (click)="openComplete(p)" data-testid="complete-project-btn">
                    <i class="bi bi-check-lg me-1"></i>Completar
                </button>
            </div>
            <div *ngIf="!loadingReadyProjects && readyProjects.length === 0 && !readyProjectsError" class="text-secondary py-2" data-testid="ready-projects-empty">
                No hay proyectos en etapa listo para entrega.
            </div>
        </div>
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

    <!-- Fase 5c: resultado de intentar despachar. Va arriba del listado porque
         el rechazo por pago no pagado tiene que verse: antes la petición
         ignoraba cualquier respuesta no-OK y un rechazo se veía igual que un
         despacho exitoso. -->
    <div class="alert mb-3" *ngIf="dispatchActionMessage"
         [ngClass]="dispatchActionIsError ? 'alert-danger' : 'alert-success'"
         data-testid="dispatch-action-message">
        <i class="bi me-2" [ngClass]="dispatchActionIsError ? 'bi-exclamation-octagon' : 'bi-check-circle'"></i>{{ dispatchActionMessage }}
        <button type="button" class="btn-close float-end" (click)="dispatchActionMessage = ''" aria-label="Cerrar"></button>
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

                            <!-- Fase 5c: puente pago → despacho. El indicador y
                                 el motivo los calcula el backend; aquí sólo se
                                 muestran, para que la regla no pueda
                                 reimplementarse (mal) en el navegador. -->
                            <div *ngIf="r.paymentHeld" class="mt-1" data-testid="payment-held-indicator">
                                <span class="badge bg-danger">
                                    <i class="bi bi-lock-fill me-1"></i>Retenida por pago
                                </span>
                                <div class="small text-danger mt-1" data-testid="payment-held-reason">{{ r.paymentHeldReason }}</div>
                            </div>
                            <div *ngIf="r.invoiceStatus && !r.paymentHeld" class="small text-success mt-1" data-testid="payment-cleared">
                                <i class="bi bi-check-circle me-1"></i>Factura {{ r.invoiceReference || r.invoiceId }}: {{ r.invoiceStatus }}
                            </div>
                            <div *ngIf="r.paymentOverride" class="small text-warning mt-1" data-testid="payment-override-trail">
                                <i class="bi bi-exclamation-triangle me-1"></i>Despacho autorizado sin pago confirmado por {{ r.paymentOverrideBy }}
                                <span *ngIf="r.paymentOverrideAt"> el {{ r.paymentOverrideAt | date:'dd/MM/yyyy HH:mm' }}</span>
                            </div>

                            <button class="btn btn-sm btn-outline-success ms-1" *ngIf="(r.deliveryStatus || 'pendiente') !== 'entregado'" (click)="markDelivered(r)" data-testid="mark-delivered-btn">
                                Marcar entregado
                            </button>
                            <button class="btn btn-sm btn-outline-primary ms-1" *ngIf="r.paymentGate && (r.deliveryStatus || 'pendiente') !== 'entregado'" (click)="openInvoiceLinker(r)" data-testid="link-invoice-btn">
                                <i class="bi bi-receipt me-1"></i>Vincular factura
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

    <!-- Fase 5c: selector de la factura que debe pagarse antes de despachar.
         Las opciones vienen de GET /remissions/:id/invoice-options (sólo las del
         cliente de esta remisión), no de filtrar todas las facturas en el
         navegador. -->
    <div class="preview-modal-backdrop" *ngIf="showInvoiceLinker" data-testid="invoice-linker-modal">
        <div class="preview-modal card shadow" style="width: 640px;">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-receipt me-2"></i>Vincular factura al despacho</h5>
                <button class="btn btn-sm btn-outline-secondary" (click)="cancelInvoiceLinker()" data-testid="cancel-invoice-linker-btn"><i class="bi bi-x-lg"></i> Cerrar</button>
            </div>
            <div class="card-body">
                <p class="mb-2">
                    Remision <strong>{{ invoiceLinkerRemission?.consecutive }}</strong> ·
                    {{ invoiceLinkerRemission?.clientName }} ·
                    <span class="badge bg-info">{{ dispatchTypeLabel(invoiceLinkerRemission?.dispatchType || '') }}</span>
                </p>
                <p class="text-secondary small">
                    Esta remision se despacha solo cuando la factura vinculada este en estado <strong>Pagado</strong>.
                    <span *ngIf="invoiceLinkerRemission?.creditClient">El cliente es de credito, pero la modalidad contra-entrega exige el pago primero.</span>
                </p>

                <div class="alert alert-danger py-2" *ngIf="invoiceLinkerError" data-testid="invoice-linker-error">{{ invoiceLinkerError }}</div>

                <div *ngIf="invoiceOptionsLoading" class="text-secondary py-3">Cargando facturas del cliente...</div>

                <div *ngIf="!invoiceOptionsLoading && invoiceOptions.length === 0" class="alert alert-warning" data-testid="invoice-options-empty">
                    El cliente no tiene facturas registradas. Cree la factura primero: sin factura vinculada el despacho contra-entrega queda retenido.
                </div>

                <div class="list-group mb-3" *ngIf="invoiceOptions.length > 0">
                    <label class="list-group-item d-flex gap-2 align-items-start" *ngFor="let option of invoiceOptions" data-testid="invoice-option">
                        <input class="form-check-input mt-1" type="radio" name="invoiceToLink"
                               [value]="option.id" [(ngModel)]="selectedInvoiceId" />
                        <span class="flex-grow-1">
                            <strong>{{ option.referenceCode || ('Factura #' + option.id) }}</strong>
                            <span class="badge ms-2" [ngClass]="option.paid ? 'bg-success' : 'bg-warning text-dark'">{{ option.status }}</span>
                            <div class="small text-secondary">
                                {{ option.issueDate }} · {{ getCurrencySymbol() }}{{ option.total | number:'1.0-0' }}
                                <span *ngIf="option.balanceAmount > 0"> · saldo {{ getCurrencySymbol() }}{{ option.balanceAmount | number:'1.0-0' }}</span>
                            </div>
                        </span>
                    </label>
                </div>

                <div class="d-flex justify-content-between">
                    <button class="btn btn-outline-secondary" (click)="unlinkInvoice()" [disabled]="!invoiceLinkerRemission?.invoiceId" data-testid="unlink-invoice-btn">
                        Quitar factura vinculada
                    </button>
                    <button class="btn btn-theme" (click)="confirmLinkInvoice()" [disabled]="!selectedInvoiceId" data-testid="confirm-link-invoice-btn">
                        <i class="bi bi-link-45deg me-1"></i>Vincular factura
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Fase 5c: override de admin. Confirmación explícita con casilla, porque
         saltar la puerta de pago es autorizar que salga mercancía sin cobrar. -->
    <div class="preview-modal-backdrop" *ngIf="showOverrideConfirm" data-testid="payment-override-modal">
        <div class="preview-modal card shadow" style="width: 620px;">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0 text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Autorizar despacho sin pago confirmado</h5>
                <button class="btn btn-sm btn-outline-secondary" (click)="cancelOverride()" data-testid="cancel-override-btn"><i class="bi bi-x-lg"></i> Cerrar</button>
            </div>
            <div class="card-body">
                <div class="alert alert-danger" data-testid="override-block-reason">{{ overrideBlockReason }}</div>
                <p class="mb-2">
                    La remision <strong>{{ overrideRemission?.consecutive }}</strong> de
                    <strong>{{ overrideRemission?.clientName }}</strong> esta retenida por pago.
                </p>
                <p class="text-secondary small mb-3">
                    Como administrador puede autorizar el despacho de todos modos. Quedara registrado
                    <strong>quien</strong> lo autorizo y <strong>cuando</strong>, y sera visible en el listado de remisiones.
                </p>
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="overrideConfirmedCheck" [(ngModel)]="overrideConfirmed" data-testid="override-confirm-check" />
                    <label class="form-check-label" for="overrideConfirmedCheck">
                        Entiendo que el equipo saldra sin el pago confirmado y asumo la autorizacion
                    </label>
                </div>
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-outline-secondary" (click)="cancelOverride()">Cancelar</button>
                    <button class="btn btn-danger" [disabled]="!overrideConfirmed" (click)="confirmOverride()" data-testid="confirm-override-btn">
                        <i class="bi bi-unlock me-1"></i>Autorizar y despachar
                    </button>
                </div>
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
    /** Items de equipo CRM ya cargados (para resolver NIT/accesorios del prefill). */
    allEquipmentItems: any[] = [];

    // ── Proyectos en etapa "listo para entrega" (boton Completar) ──────────
    readyProjects: any[] = [];
    loadingReadyProjects = false;
    readyProjectsError = "";
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

    // ── Fase 5c: puente pago → despacho ──────────────────────────────────
    /** Mensaje visible del resultado de despachar (éxito, rechazo o error). */
    dispatchActionMessage = "";
    dispatchActionIsError = false;

    showInvoiceLinker = false;
    invoiceLinkerRemission: Remission | null = null;
    invoiceOptions: InvoiceOption[] = [];
    invoiceOptionsLoading = false;
    invoiceLinkerError = "";
    selectedInvoiceId: number | null = null;

    showOverrideConfirm = false;
    overrideRemission: Remission | null = null;
    overrideConfirmed = false;
    /** Motivo textual que devolvió el backend al rechazar el despacho. */
    overrideBlockReason = "";

    readonly dispatchTypeLabel = dispatchTypeLabel;
    readonly anchoredAlert = buildAnchoredAlert;

    constructor(private cdr: ChangeDetectorRef, private router: Router) {}

    /**
     * Rol del usuario autenticado, leído de la sesión persistida.
     *
     * Es sólo para decidir si se OFRECE el botón de override: la autorización
     * real la hace el backend con el rol del JWT, así que un usuario que mienta
     * aquí recibe un 403 igual. Sin este chequeo el botón se le mostraría a
     * cualquiera y siempre fallaría.
     */
    private isAdminUser(): boolean {
        try {
            const session = JSON.parse(localStorage.getItem("pika.auth.session") || "{}");
            const role = String(session?.user?.role ?? "").trim().toLowerCase();
            return role === "admin" || role === "administrador" || role === "superadmin" || role === "super-admin";
        } catch {
            return false;
        }
    }

    private setDispatchMessage(message: string, isError: boolean): void {
        this.dispatchActionMessage = message;
        this.dispatchActionIsError = isError;
        this.cdr.detectChanges();
    }

    /** Abre el selector de factura con las facturas del cliente de la remisión. */
    async openInvoiceLinker(remission: Remission) {
        this.invoiceLinkerRemission = remission;
        this.invoiceOptions = [];
        this.invoiceLinkerError = "";
        this.selectedInvoiceId = remission.invoiceId ?? null;
        this.invoiceOptionsLoading = true;
        this.showInvoiceLinker = true;
        this.cdr.detectChanges();

        try {
            const res = await fetch(
                this.apiBaseUrl + "/api/v1/remissions/remissions/" + encodeURIComponent(remission.id) + "/invoice-options",
                { headers: this.authHeaders() },
            );
            if (!res.ok) {
                this.invoiceLinkerError = await this.readErrorMessage(res, "No se pudieron cargar las facturas del cliente.");
                return;
            }
            const data = await res.json();
            this.invoiceOptions = data.items || [];
        } catch {
            this.invoiceLinkerError = "No se pudieron cargar las facturas del cliente.";
        } finally {
            this.invoiceOptionsLoading = false;
            this.cdr.detectChanges();
        }
    }

    cancelInvoiceLinker() {
        this.showInvoiceLinker = false;
        this.invoiceLinkerRemission = null;
        this.invoiceOptions = [];
        this.invoiceLinkerError = "";
        this.selectedInvoiceId = null;
    }

    async confirmLinkInvoice() {
        if (!this.invoiceLinkerRemission || !this.selectedInvoiceId) {
            return;
        }
        const ok = await this.linkInvoice(this.invoiceLinkerRemission, this.selectedInvoiceId);
        if (ok) {
            this.setDispatchMessage(
                "Factura vinculada a la remision " + (this.invoiceLinkerRemission.consecutive || "") +
                ". El despacho se libera cuando quede en estado Pagado.",
                false,
            );
            this.cancelInvoiceLinker();
        }
    }

    async unlinkInvoice() {
        if (!this.invoiceLinkerRemission) {
            return;
        }
        const ok = await this.linkInvoice(this.invoiceLinkerRemission, null);
        if (ok) {
            this.setDispatchMessage("Se quito la factura vinculada.", false);
            this.cancelInvoiceLinker();
        }
    }

    private async linkInvoice(remission: Remission, invoiceId: number | null): Promise<boolean> {
        this.invoiceLinkerError = "";
        try {
            const res = await fetch(
                this.apiBaseUrl + "/api/v1/remissions/remissions/" + encodeURIComponent(remission.id) + "/invoice",
                {
                    method: "PUT",
                    headers: this.authHeaders(),
                    body: JSON.stringify({ invoiceId }),
                },
            );
            if (!res.ok) {
                this.invoiceLinkerError = await this.readErrorMessage(res, "No se pudo vincular la factura.");
                this.cdr.detectChanges();
                return false;
            }
            await this.loadRemissions();
            return true;
        } catch {
            this.invoiceLinkerError = "No se pudo vincular la factura.";
            this.cdr.detectChanges();
            return false;
        }
    }

    cancelOverride() {
        this.showOverrideConfirm = false;
        this.overrideRemission = null;
        this.overrideConfirmed = false;
        this.overrideBlockReason = "";
    }

    async confirmOverride() {
        if (!this.overrideRemission || !this.overrideConfirmed) {
            return;
        }
        const remission = this.overrideRemission;
        this.cancelOverride();
        await this.patchDelivered(remission, true);
    }

    /** Extrae el mensaje de error del backend (que es el que hay que mostrar textual). */
    private async readErrorMessage(res: Response, fallback: string): Promise<string> {
        try {
            const body = await res.json();
            return String(body?.error || fallback);
        } catch {
            return fallback;
        }
    }

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
        this.loadReadyForDeliveryProjects();
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
                this.allEquipmentItems = Array.isArray(data.items) ? data.items : [];
                this.dispatchGroups = groupDispatchReadyByClient(this.allEquipmentItems).map((g) => ({ ...g, expanded: true }));
                this.cdr.detectChanges();
            }
        } catch { /* ignore */ }
    }

    /**
     * Carga los proyectos en etapa `listo-entrega` (GET /api/v1/projects?status=...).
     * El estado existe y es válido según allowedProjectStatuses del backend; si
     * el servidor rechaza algo, se muestra el mensaje textual en la tarjeta.
     */
    async loadReadyForDeliveryProjects() {
        this.loadingReadyProjects = true;
        this.readyProjectsError = "";
        try {
            const res = await fetch(
                this.apiBaseUrl + "/api/v1/projects?status=" + encodeURIComponent("listo-entrega"),
                { headers: this.authHeaders() },
            );
            if (!res.ok) {
                this.readyProjectsError = await this.readErrorMessage(res, "No se pudieron cargar los proyectos listos para entrega.");
                return;
            }
            const data = await res.json();
            this.readyProjects = Array.isArray(data.items) ? data.items : [];
        } catch {
            this.readyProjectsError = "Sin conexion con el servidor: no se pudieron cargar los proyectos listos para entrega.";
        } finally {
            this.loadingReadyProjects = false;
            this.cdr.detectChanges();
        }
    }

    /** Codigo de equipo del proyecto (properties.equipmentIdentifier, con fallback al id). */
    readyProjectCode(p: any): string {
        const props = (p && p.properties) || {};
        return String(props.equipmentIdentifier || "") || (p?.id ? "#" + String(p.id).slice(-6) : "Sin codigo");
    }

    readyProjectEquipmentName(p: any): string {
        const props = (p && p.properties) || {};
        return String(props.equipmentDisplayName || [props.marca, props.tipo].filter(Boolean).join(" ") || "").trim();
    }

    readyProjectClient(p: any): string {
        return String(((p && p.properties) || {}).client || "").trim();
    }

    /**
     * Boton "Completar": abre el formulario existente (mismos botones Guardar /
     * Previsualizar / Imprimir OC) con los datos del proyecto precargados.
     * El NIT y los accesorios se resuelven del item de equipo CRM si el
     * proyecto referencia uno (properties.equipmentItemId); si no, quedan
     * vacios para que el usuario los escriba. No duplica el equipo si ya esta
     * en la remision en curso.
     */
    openComplete(project: any) {
        const prefill = this.buildPrefillForProject(project);
        if (!this.showForm || this.editingId) {
            this.openCreate();
        }
        this.form.clientName = prefill.clientName;
        this.form.clientNit = prefill.clientNit;
        this.form.dispatchType = prefill.dispatchType;
        if (prefill.purchaseOrder) {
            this.form.purchaseOrder = prefill.purchaseOrder;
        }

        let addedItem: RemissionItem | null = null;
        for (const prefItem of prefill.items) {
            const exists = this.form.items.some((it) =>
                (prefItem.identifier !== "" && it.identifier === prefItem.identifier)
                || (prefItem.equipmentId !== "" && it.equipmentId === prefItem.equipmentId));
            if (!exists) {
                addedItem = { ...prefItem };
                this.form.items.push(addedItem);
            }
        }

        const withAnchor = prefill.items.find((i) => i.anchoredNote !== "");
        if (withAnchor) {
            this.anchoredAlertMessage = withAnchor.anchoredNote;
        }

        // Misma regla que "Agregar a remision": trae OC y precio de la ultima
        // cotizacion del cliente si las hay; no bloquea si no existen.
        if (addedItem) {
            void this.autofillFromLatestQuote(addedItem);
        }
        this.cdr.detectChanges();
    }

    private buildPrefillForProject(project: any): RemissionPrefill {
        const props = ((project && project.properties) || {});
        const equipmentId = String(props.equipmentItemId || "");
        const eqItem = equipmentId !== ""
            ? this.allEquipmentItems.find((it: any) => String(it.itemId || "") === equipmentId || String(it.id || "") === equipmentId)
            : null;
        return buildRemissionPrefillFromProject(project, eqItem);
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
        await this.patchDelivered(remission, false);
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
        await this.patchDelivered(remission, false);
    }

    /**
     * Marca entregado. Fase 5c: el backend puede rechazarlo (409) porque la
     * modalidad exige que la factura esté Pagada primero.
     *
     * Antes de esta fase la petición descartaba en silencio cualquier respuesta
     * distinta de res.ok (el catch iba vacío), o sea que un rechazo del
     * servidor se veía igual que un despacho exitoso. Ahora el rechazo se
     * muestra con el mensaje textual del backend y, si el usuario es admin, se
     * le ofrece el override con confirmación explícita.
     */
    private async patchDelivered(remission: Remission, paymentOverride: boolean) {
        try {
            const res = await fetch(this.apiBaseUrl + "/api/v1/remissions/remissions/" + remission.id + "/delivery-status", {
                method: "PATCH",
                headers: this.authHeaders(),
                body: JSON.stringify({ deliveryStatus: "entregado", paymentOverride }),
            });

            if (res.ok) {
                this.setDispatchMessage(
                    paymentOverride
                        ? "Despacho autorizado SIN pago confirmado por un administrador. Quedo registrado quien y cuando."
                        : "Remision " + (remission.consecutive || "") + " marcada como entregada.",
                    !paymentOverride ? false : true,
                );
                await this.loadRemissions();
                return;
            }

            const message = await this.readErrorMessage(res, "No se pudo marcar la remision como entregada.");

            // 409 = puerta de pago. Se ofrece el override sólo a un admin y sólo
            // cuando no se venía ya de un override (si con override también
            // falló, insistir no sirve de nada).
            if (res.status === 409 && !paymentOverride && this.isAdminUser()) {
                this.overrideRemission = remission;
                this.overrideBlockReason = message;
                this.overrideConfirmed = false;
                this.showOverrideConfirm = true;
                this.setDispatchMessage(message, true);
                this.cdr.detectChanges();
                return;
            }

            this.setDispatchMessage(message, true);
            await this.loadRemissions();
        } catch {
            this.setDispatchMessage(
                "No se pudo contactar al servidor para marcar la entrega. La remision NO fue despachada.",
                true,
            );
        }
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
