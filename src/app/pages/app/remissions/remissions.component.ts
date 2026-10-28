import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { resolveApiBaseUrl } from "../../../services/api-base-url.util";
import type { RemissionPrefill } from "./remissions.logic";
import {
    buildAnchoredAlert,
    buildRemissionPrintModel,
    canCreateRemissionForProject,
    canTransitionDeliveryStatus,
    computeRemissionTotal,
    buildRemissionPrefillFromProject,
    dispatchTypeLabel,
    findQuoteLineForItem,
    groupDispatchReadyByClient,
    itemsRequiringAccessoriesConfirmation,
    MAX_ITEMS_PER_REMISSION,
    requiresAccessoriesConfirmation,
    validateRemissionDraft,
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
    sourceSeries?: string;
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
    invoiceReferenceCode: string;
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
            <i class="bi bi-plus-lg me-1"></i>Nueva remisión
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
                <div>
                    <div class="text-warning small mb-1 text-end" *ngIf="!remissionGate(p).allowed" data-testid="complete-gate-blocked">
                        <i class="bi bi-lock me-1"></i>Pago confirmado: pendiente de doble validacion en Financiero → Pagos.
                    </div>
                    <button class="btn btn-sm btn-theme" [disabled]="!remissionGate(p).allowed" (click)="openComplete(p)" data-testid="complete-project-btn">
                        <i class="bi bi-check-lg me-1"></i>Completar
                    </button>
                </div>
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
                            <i class="bi bi-plus-lg me-1"></i>Agregar a remisión
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
            <h5 class="card-title">{{ editingId ? 'Editar' : 'Nueva' }} Remisión</h5>
            <div class="alert alert-warning" *ngIf="anchoredAlertMessage" data-testid="anchored-alert">
                <i class="bi bi-exclamation-triangle me-2"></i>{{ anchoredAlertMessage }}
                <!-- El requerimiento de despacho exige aceptacion EXPLICITA de los
                     prestamos anclados: la alerta sola ya no basta, sin este check el
                     backend responde 400 (regla dura server-side). -->
                <div class="form-check mt-2">
                    <input class="form-check-input" type="checkbox" id="anchoredAcceptedCheck"
                           [(ngModel)]="form.anchoredAccepted" data-testid="anchored-accepted-check" />
                    <label class="form-check-label fw-semibold" for="anchoredAcceptedCheck">
                        Confirmo la inclusión de los equipos anclados en esta remisión
                    </label>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-3">
                    <label class="form-label">Cliente</label>
                    <input class="form-control" [(ngModel)]="form.clientName" data-testid="remission-client" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">NIT</label>
                    <input class="form-control" [(ngModel)]="form.clientNit" />
                </div>
                <div class="col-md-3">
                    <!-- Contacto obligatorio por requerimiento de despacho: sin el
                         contacto/ingeniero responsable la remision no se genera.
                         El backend lo valida igual (400) si llega vacio. -->
                    <label class="form-label">Contacto del cliente <span class="text-danger">*</span></label>
                    <input class="form-control" [(ngModel)]="form.contactName" placeholder="Nombre del contacto o ingeniero responsable" data-testid="remission-contact-name" />
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
                    <label class="form-label">Número de guía</label>
                    <input class="form-control" [(ngModel)]="form.guideNumber" data-testid="guide-number-input" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">Garantía (meses)</label>
                    <select class="form-select" [(ngModel)]="form.warrantyMonths" data-testid="warranty-select">
                        <option [ngValue]="0">Sin garantía</option>
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
                        <label class="form-check-label" for="valuedCheck">Remisión valorizada (Zona Franca)</label>
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
                <div class="col-md-7">
                    <label class="form-label" for="remissionNotes">Notas / Comentarios</label>
                    <textarea id="remissionNotes" class="form-control" rows="3" [(ngModel)]="form.notes" placeholder="Ej: Equipo con garantía de 6 meses por cambio de tarjeta principal; entregar solo al contacto autorizado." data-testid="remission-notes-input"></textarea>
                    <div class="form-text text-secondary">Opcional. El comentario queda guardado en la remisión y se muestra en la previsualización del PDF.</div>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-3">
                <!-- Contador visible contra el limite duro de 4 (regla del requerimiento,
                     validada tambien en el servidor). -->
                <h6 class="mb-0">Equipos en la remisión <span class="text-secondary" data-testid="items-count">({{ form.items.length }}/{{ MAX_ITEMS_PER_REMISSION }})</span></h6>
                <button class="btn btn-sm btn-outline-secondary" (click)="loadQuotePrices()" data-testid="load-quote-prices-btn">
                    <i class="bi bi-cash-coin me-1"></i>Traer precios de cotización
                </button>
            </div>
            <div class="alert alert-info py-2 mt-2" *ngIf="quotePricesMessage" data-testid="quote-prices-message">{{ quotePricesMessage }}</div>
            <div *ngFor="let item of form.items; let i = index" class="row g-2 mb-2 align-items-end border-bottom pb-2">
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.identifier" placeholder="Identificador" /></div>
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.sourceSeries" placeholder="Serie origen" data-testid="source-series-input" /></div>
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.description" placeholder="Descripcion" /></div>
                <div class="col-md-2"><input class="form-control form-control-sm" [(ngModel)]="item.accessories" placeholder="Accesorios" data-testid="item-accessories" /></div>
                <div class="col-md-3">
                    <input class="form-control form-control-sm" [(ngModel)]="item.anchoredNote"
                           (ngModelChange)="anchoredAlertMessage = $event; form.anchoredAccepted = false"
                           placeholder="Equipo prestado anclado" data-testid="item-anchored-note" />
                </div>
                <div class="col-md-2">
                    <select class="form-select form-select-sm" [(ngModel)]="item.warrantyMonths" data-testid="item-warranty-select">
                        <option [ngValue]="0" disabled>Seleccionar garantía *</option>
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
            <div class="alert alert-danger py-2 mt-2" *ngIf="itemAddBlocked" role="alert" data-testid="items-limit-message">
                <i class="bi bi-exclamation-octagon me-2"></i>{{ itemAddBlocked }}
            </div>
            <button class="btn btn-sm btn-outline-secondary mt-1" (click)="addItem()" [disabled]="form.items.length >= MAX_ITEMS_PER_REMISSION"
                    data-testid="add-remission-item"><i class="bi bi-plus me-1"></i>Agregar equipo</button>

            <div *ngIf="formSaveBlock" class="alert alert-danger py-2 mt-3" data-testid="remission-save-block">
                <i class="bi bi-lock me-1"></i>{{ formSaveBlock }}
            </div>

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
                                <i class="bi bi-check-circle me-1"></i>Factura {{ r.invoiceReference || r.invoiceId }}<span *ngIf="r.invoiceReferenceCode && r.invoiceReferenceCode !== r.invoiceReference"> ({{ r.invoiceReferenceCode }})</span>: {{ r.invoiceStatus }}
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
                <p>La remisión <strong>{{ deliveryConfirmRemission?.consecutive }}</strong> incluye accesorios o equipos anclados que deben entregarse con el despacho:</p>
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
                <div *ngIf="deliveryConfirmRemission?.dispatchType === 'recoge-cliente'" class="border rounded p-2 mb-3" data-testid="pickup-recipient-fields">
                    <label class="form-label">Recibido por (nombre e identificación)</label>
                    <input class="form-control mb-2" [(ngModel)]="pickupRecipient" data-testid="pickup-recipient-input" placeholder="Nombre - identificación" />
                    <div class="form-check"><input class="form-check-input" type="checkbox" [(ngModel)]="pickupSigned" data-testid="pickup-signed-check" id="pickupSigned" /><label class="form-check-label" for="pickupSigned">Remisión firmada cargada</label></div>
                </div>
                <div class="alert alert-warning py-2" *ngIf="!deliveryConfirmRemission?.dispatchPhotos?.length" data-testid="delivery-proof-required">
                    Falta cargar la remisión firmada como evidencia antes de cerrar la trazabilidad.
                </div>
                <button class="btn btn-success" [disabled]="!accessoriesDeliveredConfirmed || !deliveryConfirmRemission?.dispatchPhotos?.length || (deliveryConfirmRemission?.dispatchType === 'recoge-cliente' && (!pickupRecipient.trim() || !pickupSigned))" (click)="confirmMarkDelivered()" data-testid="confirm-delivered-btn">
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
                    Remisión <strong>{{ invoiceLinkerRemission?.consecutive }}</strong> ·
                    {{ invoiceLinkerRemission?.clientName }} ·
                    <span class="badge bg-info">{{ dispatchTypeLabel(invoiceLinkerRemission?.dispatchType || '') }}</span>
                </p>
                <p class="text-secondary small">
                    Esta remisión se despacha solo cuando la factura vinculada este en estado <strong>Pagado</strong>.
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
                    La remisión <strong>{{ overrideRemission?.consecutive }}</strong> de
                    <strong>{{ overrideRemission?.clientName }}</strong> esta retenida por pago.
                </p>
                <p class="text-secondary small mb-3">
                    Como administrador puede autorizar el despacho de todos modos. Quedara registrado
                    <strong>quien</strong> lo autorizo y <strong>cuando</strong>, y será visible en el listado de remisiones.
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
                            <th>Descripción</th>
                            <th>Accesorios</th>
                            <th>Garantía</th>
                            <th>Cant</th>
                            <th *ngIf="previewModel?.totalValue !== null">Precio unitario</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of previewModel?.items">
                            <td>{{ item.identifier }}</td>
                            <td>{{ item.description }}</td>
                            <td>{{ item.accessories || '-' }}</td>
                            <td>{{ item.warrantyMonths ? item.warrantyMonths + ' meses' : 'Sin garantía' }}</td>
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

    // ── Doble validacion de despacho (pago confirmado) ─────────────────────
    /** Puerta unica: pago confirmado sin verificacion guardada -> bloqueado. */
    readonly remissionGate = canCreateRemissionForProject;
    /** Proyecto que origino el formulario en curso (boton Completar), o null. */
    sourceProject: any | null = null;
    formSaveBlock = "";
    /** Alias para el template: la constante vive en remissions.logic.ts (una sola fuente de verdad). */
    readonly MAX_ITEMS_PER_REMISSION = MAX_ITEMS_PER_REMISSION;
    /** Mensaje visible al intentar agregar un equipo estando en el limite. */
    itemAddBlocked = "";

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
    previewTitle = "Remisión";
    previewModel: any = null;
    showDeliveryConfirm = false;
    deliveryConfirmRemission: Remission | null = null;
    accessoriesDeliveredConfirmed = false;
    pickupRecipient = "";
    pickupSigned = false;

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
                "Factura vinculada a la remisión " + (this.invoiceLinkerRemission.consecutive || "") +
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
            clientName: "", clientNit: "", contactName: "", dispatchType: "", carrierName: "",
            guideNumber: "", purchaseOrder: "", youtubeLink: "",
            dispatchPhotos: [] as DispatchPhoto[],
            valued: false, warrantyMonths: 0, notes: "",
            // Consentimiento de prestamos anclados: SIEMPRE nace en false.
            // Es un acto explicito por remision, no algo que se herede.
            anchoredAccepted: false,
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
        // Puerta dura de doble validacion: aunque el boton se vea deshabilitado,
        // ninguna ruta puede abrir la remision de un proyecto con pago confirmado
        // hasta que alguien guarde su verificacion en Financiero > Pagos.
        const gate = canCreateRemissionForProject(project);
        if (!gate.allowed) {
            this.formSaveBlock = gate.reason;
            return;
        }
        const prefill = this.buildPrefillForProject(project);
        if (!this.showForm || this.editingId) {
            this.openCreate();
        }
        this.sourceProject = project;
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

        // Consentimiento fresco por borrador: aunque otra remision anterior
        // hubiera aceptado anclados, aqui se confirma de nuevo.
        this.form.anchoredAccepted = false;
        const withAnchor = prefill.items.find((i) => String(i.anchoredNote || "").trim() !== "");
        if (withAnchor) {
            this.anchoredAlertMessage = withAnchor.anchoredNote;
        } else {
            this.anchoredAlertMessage = "";
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
        this.sourceProject = null;
        this.formSaveBlock = "";
        this.itemAddBlocked = "";
        this.form = this.emptyForm();
        this.editingId = "";
        this.anchoredAlertMessage = "";
        this.quotePricesMessage = "";
        this.showForm = true;
    }

    addEquipmentToRemission(group: DispatchReadyGroup, eq: any) {
        // Limite duro de 4 equipos (requerimiento + regla server-side). Se bloquea
        // con mensaje visible, no en silencio: el usuario debe saber POR que.
        if (this.form.items.length >= MAX_ITEMS_PER_REMISSION) {
            this.itemAddBlocked = `máximo ${MAX_ITEMS_PER_REMISSION} equipos por remisión: divida el despacho en varias remisiones independientes`;
            return;
        }
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
            sourceSeries: String(eq.serie || eq.receivedIdentifier || ""),
        };
        this.form.items.push(item);
        this.itemAddBlocked = "";
        if (anchoredNote) {
            this.anchoredAlertMessage = anchoredNote;
            // Consentimiento fresco: un equipo anclado nuevo exige confirmar de
            // nuevo, aunque el usuario ya hubiera aceptado otro antes.
            this.form.anchoredAccepted = false;
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

    addItem() {
        if (this.form.items.length >= MAX_ITEMS_PER_REMISSION) {
            // El boton ya esta deshabilitado; esto es defensa en profundidad
            // (el mismo limite lo valida el servidor con 400).
            this.itemAddBlocked = `máximo ${MAX_ITEMS_PER_REMISSION} equipos por remisión: divida el despacho en varias remisiones independientes`;
            return;
        }
        this.form.items.push({ equipmentId: "", identifier: "", description: "", accessories: "", anchoredNote: "", warrantyMonths: 0, unitPrice: 0, quantity: 1 });
    }
    removeItem(i: number) {
        this.form.items.splice(i, 1);
        // La alerta de anclados debe seguir reflejando el contenido real de la
        // remision: si quito el ultimo equipo anclado, la alerta desaparece.
        const withAnchor = this.form.items.find((it) => String(it.anchoredNote || "").trim() !== "");
        this.anchoredAlertMessage = withAnchor ? withAnchor.anchoredNote : "";
    }
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
        this.previewTitle = "Remisión";
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
        this.previewTitle = "Detalle de entrega - Remisión " + (remission.consecutive || "");
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
            this.quotePricesMessage = "No se encontró cotización para este cliente.";
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
            ? "Se actualizaron " + updated + " precio(s) desde la cotización " + (quote.codigo || "") + "."
            : "La cotización " + (quote.codigo || "") + " no tiene líneas que coincidan con los equipos.";
        this.cdr.detectChanges();
    }

    async markDelivered(remission: Remission) {
        const from = remission.deliveryStatus || "pendiente";
        if (!canTransitionDeliveryStatus(from, "entregado")) {
            return;
        }
        this.deliveryConfirmRemission = remission;
        this.accessoriesDeliveredConfirmed = !requiresAccessoriesConfirmation(remission.items);
        this.pickupRecipient = "";
        this.pickupSigned = false;
        this.showDeliveryConfirm = true;
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
        if (this.deliveryConfirmRemission.dispatchType === "recoge-cliente" && (!this.pickupRecipient.trim() || !this.pickupSigned)) {
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
                        : "Remisión " + (remission.consecutive || "") + " marcada como entregada.",
                    !paymentOverride ? false : true,
                );
                await this.loadRemissions();
                return;
            }

            const message = await this.readErrorMessage(res, "No se pudo marcar la remisión como entregada.");

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
                "No se pudo contactar al servidor para marcar la entrega. La remisión NO fue despachada.",
                true,
            );
        }
    }

    async save() {
        if (this.sourceProject) {
            const gate = canCreateRemissionForProject(this.sourceProject);
            if (!gate.allowed) {
                this.formSaveBlock = gate.reason;
                return;
            }
        }
        // Reglas duras ANTES de gastar el request: mismas reglas y mismo orden
        // que el servidor (backend/internal/remissions/validation.go). El 400
        // del backend sigue siendo la palabra final; esto evita un round-trip
        // que sabemos que va a rechazar.
        const ruleError = validateRemissionDraft(this.form);
        if (ruleError !== "") {
            this.itemAddBlocked = "";
            this.formSaveBlock = ruleError;
            return;
        }
        this.formSaveBlock = "";
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
                this.sourceProject = null;
                this.showForm = false;
                this.loadRemissions();
                this.cdr.detectChanges();
                return;
            }
            // No-OK: leer el mensaje accionable y mostrarlo. Antes de este
            // cambio la respuesta se descartaba y un rechazo se veia igual que
            // una creacion exitosa.
            let detail = "";
            try {
                const body = await res.json();
                detail = String((body && body.error) || "");
            } catch { /* cuerpo no JSON */ }
            this.formSaveBlock = detail !== "" ? detail : `No se pudo guardar la remisión (HTTP ${res.status})`;
        } catch { /* red: el fetch ya lanzo; el formulario queda abierto y sin perder datos */ }
    }
}
