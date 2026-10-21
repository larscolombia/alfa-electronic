import { DecimalPipe, NgFor, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { take } from "rxjs/operators";

import { ProspectEquipmentSummary } from "./crm-prospect-equipment.store";
import { buildEquipmentMatchCriteria } from "./crm-prospect-equipment-match.logic";
import { PublicQuotePreview, PublicQuotePreviewLine, upsertPublicQuotePreview } from "./crm-quote-preview.store";
import { CrmZoneRecord } from "./crm-zones.store";
import { buildCommercialDocumentCode, buildCommercialSeriesPrefix } from "../company/company-commercial-settings.store";
import { getProjectWorkflowStatusLabel } from "../projects/project-workflow.config";
import { ProjectService } from "../projects/services/project.service";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { CrmProspectRecord, CrmProspectsApiService } from "../../../services/crm-prospects-api.service";
import { CrmQuoteRecord, CrmQuotesApiService } from "../../../services/crm-quotes-api.service";
import { EmailsApiService } from "../../../services/emails-api.service";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
import { FormDraftService } from "../../../services/form-draft.service";

const CRM_QUOTES_FORM_DRAFT_KEY = "app.crm.quotes.form";

type QuoteStatus = "Borrador" | "Enviado" | "Aprobado";

type QuoteRow = {
    codigo: string;
    prospecto: string;
    total: number;
    fecha: string;
    validoHasta: string;
    estado: QuoteStatus;
    token: string;
    purchaseOrderNumber?: string;
    purchaseOrderDate?: string;
    purchaseOrderFileName?: string;
};

type QuoteLine = {
    servicio: string;
    descripcion: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    impuesto: number;
};

@Component({
    selector: "app-crm-quotes",
    standalone: true,
    imports: [RouterLink, NgFor, NgIf, FormsModule, DecimalPipe],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col mb-3 mb-sm-0">
                    <h5 class="mb-0">Cotizaciones</h5>
                    <p class="text-secondary small mb-0">Genera y administra cotizaciones para prospectos usando servicios.</p>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">CRM</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Cotizaciones</li>
                </ol>
            </nav>
        </div>

        <div class="container-fluid mt-3" id="main-content">
            <div class="card adminuiux-card mb-3" *ngIf="!showQuoteForm">
                <div class="card-body">
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <button class="btn btn-theme" type="button" (click)="openQuoteForm()">
                            <i class="bi bi-plus-lg me-1"></i> Crear Cotizacion
                        </button>
                        <button class="btn btn-outline-secondary" type="button">
                            <i class="bi bi-stack me-1"></i> Plantilla De Cotizacion
                        </button>
                        <button class="btn btn-outline-secondary" type="button">
                            <i class="bi bi-download me-1"></i> Exportar
                        </button>
                    </div>

                    <div class="alert alert-danger border mb-3" *ngIf="quotesLoadErrorMessage">{{ quotesLoadErrorMessage }}</div>
                    <div class="alert alert-danger border mb-3" *ngIf="quoteDeleteErrorMessage">{{ quoteDeleteErrorMessage }}</div>
                    <div class="alert alert-success border mb-3" *ngIf="quotePurchaseOrderSuccessMessage">{{ quotePurchaseOrderSuccessMessage }}</div>
                    <div class="alert alert-danger border mb-3" *ngIf="quotePurchaseOrderErrorMessage">{{ quotePurchaseOrderErrorMessage }}</div>
                    <div class="alert alert-success border mb-3" *ngIf="quoteConversionMessage" data-testid="quote-conversion-success">{{ quoteConversionMessage }}</div>
                    <div class="alert alert-danger border mb-3" *ngIf="quoteConversionError" data-testid="quote-conversion-error">{{ quoteConversionError }}</div>

                    <div class="table-responsive border rounded">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Cotizacion</th>
                                    <th>Prospecto</th>
                                    <th>Total</th>
                                    <th>Fecha</th>
                                    <th>Valido Hasta</th>
                                    <th>OC</th>
                                    <th>Estado</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let row of quotesRows">
                                    <td>{{ row.codigo }}</td>
                                    <td>{{ row.prospecto }}</td>
                                    <td>{{ row.total | number: '1.0-0' }}</td>
                                    <td>{{ row.fecha }}</td>
                                    <td>{{ row.validoHasta }}</td>
                                    <td>
                                        <span class="badge text-bg-success" *ngIf="row.purchaseOrderNumber; else noPurchaseOrder">OC {{ row.purchaseOrderNumber }}</span>
                                        <ng-template #noPurchaseOrder>
                                            <span class="text-secondary small">Sin OC</span>
                                        </ng-template>
                                    </td>
                                    <td>
                                        <span class="badge" [class.text-bg-secondary]="row.estado === 'Borrador'" [class.text-bg-info]="row.estado === 'Enviado'" [class.text-bg-success]="row.estado === 'Aprobado'">{{ row.estado }}</span>
                                    </td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-primary me-2" type="button" (click)="openPurchaseOrderModal(row)">
                                            <i class="bi bi-file-earmark-arrow-up me-1"></i>{{ row.purchaseOrderNumber ? 'Actualizar OC' : 'Cargar OC' }}
                                        </button>
                                        <button
                                            class="btn btn-sm btn-outline-success me-2"
                                            type="button"
                                            *ngIf="row.estado === 'Aprobado'"
                                            [disabled]="convertingQuoteToken === row.token"
                                            (click)="convertQuoteToInvoice(row)"
                                            data-testid="convert-to-invoice-btn">
                                            <i class="bi bi-receipt me-1"></i>{{ convertingQuoteToken === row.token ? 'Convirtiendo…' : 'Convertir en factura' }}
                                        </button>
                                        <a
                                            class="btn btn-sm btn-outline-secondary me-2"
                                            [routerLink]="['/estimate', row.token]"
                                            target="_blank"
                                            rel="noopener noreferrer">
                                            <i class="bi bi-eye me-1"></i>Vista previa
                                        </a>
                                        <button class="btn btn-sm btn-outline-theme me-1" type="button" (click)="openEditQuoteForm(row)"><i class="bi bi-pencil me-1"></i>Editar</button>
                                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="openDeleteModal(row)"><i class="bi bi-trash me-1"></i>Eliminar</button>
                                    </td>
                                </tr>
                                <tr *ngIf="quotesRows.length === 0">
                                    <td colspan="8" class="text-center py-4 text-secondary">Ningun dato disponible en esta tabla</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3" *ngIf="showQuoteForm">
                <div class="card-header border-bottom d-flex align-items-center justify-content-between">
                    <h5 class="mb-0">
                        <button class="btn btn-link p-0 me-2 text-secondary" type="button" (click)="cancelQuoteForm()" title="Volver a cotizaciones">
                            <i class="bi bi-arrow-left"></i>
                        </button>
                        {{ editingQuoteId ? 'Editar Cotizacion' : 'Nueva Cotizacion' }}
                    </h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-danger border mb-3" *ngIf="prospectsLoadErrorMessage || catalogsLoadErrorMessage || quoteSaveErrorMessage">
                        {{ quoteSaveErrorMessage || prospectsLoadErrorMessage || catalogsLoadErrorMessage }}
                    </div>
                    <!-- Fase 5c: estado real del correo de la cotización. Verde
                         sólo cuando el envío sí va a salir; cuando el servidor
                         no tiene SMTP el mensaje va al alert rojo de arriba,
                         porque un "enviada" en verde sería un éxito falso. -->
                    <div class="alert alert-info border mb-3" *ngIf="quoteEmailMessage" data-testid="quote-email-status">
                        <i class="bi bi-envelope-check me-2"></i>{{ quoteEmailMessage }}
                    </div>
                    <div class="row gx-3">
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Prospecto</label>
                            <select class="form-select" [(ngModel)]="selectedProspecto" (ngModelChange)="handleProspectChange($event)">
                                <option value="" disabled>--</option>
                                <option *ngFor="let prospecto of prospectOptions" [value]="prospecto">{{ prospecto }}</option>
                            </select>
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Valido Hasta</label>
                            <input class="form-control" type="date" [(ngModel)]="validUntil" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Moneda</label>
                            <select class="form-select" [(ngModel)]="currency">
                                <option value="COP">COP ($)</option>
                                <option value="USD">USD ($)</option>
                            </select>
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Calcular impuesto</label>
                            <select class="form-select" [(ngModel)]="taxMode">
                                <option value="after-discount">Despues del descuento</option>
                                <option value="before-discount">Antes del descuento</option>
                            </select>
                        </div>

                        <div class="col-12 mb-3">
                            <label class="form-label d-block">Zona</label>
                            <div class="d-flex flex-wrap gap-3">
                                @for (zone of zoneOptions; track zone.id) {
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            [id]="'quoteZone-' + zone.id"
                                            [checked]="selectedQuoteZone === zone.name"
                                            (change)="selectedQuoteZone = zone.name" />
                                        <label class="form-check-label" [for]="'quoteZone-' + zone.id">{{ zone.name }}</label>
                                    </div>
                                }
                            </div>
                        </div>

                        <div class="col-12 mb-3">
                            <label class="form-label d-block">Equipos asociados a la cotización</label>

                            @if (availableQuoteEquipmentItems.length === 0) {
                                <div class="border rounded p-3 text-secondary small">
                                    El prospecto seleccionado no tiene equipos asociados desde la vista de prospectos.
                                </div>
                            } @else {
                                <div class="border rounded p-3">
                                    <div class="row gx-3 gy-3">
                                        @for (equipment of availableQuoteEquipmentItems; track equipment.itemId) {
                                            <div class="col-12 col-lg-6">
                                                <label class="form-check border rounded p-3 h-100 d-block">
                                                    <input
                                                        class="form-check-input me-2"
                                                        type="checkbox"
                                                        [checked]="isQuoteEquipmentSelected(equipment.itemId)"
                                                        (change)="toggleQuoteEquipment(equipment.itemId, $any($event.target).checked)" />
                                                    <span class="fw-semibold d-inline-block mb-1">{{ equipment.displayName }}</span>
                                                    <span class="d-block text-secondary small">Familia: {{ equipment.familyName || 'Sin familia' }}</span>
                                                    <span class="d-block text-secondary small">Servicio: {{ equipment.serviceTypeName || 'Sin tipo de servicio' }}</span>
                                                    <span class="d-block text-secondary small">Ubicación: {{ equipment.storageLocationName || 'Sin ubicación' }}</span>
                                                    <span class="d-block text-secondary small">Recepción: {{ equipment.receptionLabel }}</span>
                                                    <span class="d-block text-secondary small">Remisión: {{ equipment.customerShipmentReference || 'Sin referencia' }}</span>
                                                    <span class="d-block text-secondary small">Accesorios: {{ equipment.accessories || 'Sin accesorios' }}</span>
                                                    <span class="d-block text-secondary small">Falla: {{ equipment.failureDescription || 'Sin detalle' }}</span>
                                                </label>
                                            </div>
                                        }
                                    </div>

                                    @if (selectedQuoteEquipmentLabels.length > 0) {
                                        <div class="mt-3">
                                            <div class="small text-secondary mb-2">Equipos relacionados en esta cotización</div>
                                            <div class="d-flex flex-wrap gap-2">
                                                @for (label of selectedQuoteEquipmentLabels; track label) {
                                                    <span class="badge text-bg-light">{{ label }}</span>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>

                        <div class="col-12 mb-3">
                            <label class="form-label">Descripcion</label>
                            <textarea class="form-control" rows="3" [(ngModel)]="quoteDescription" placeholder="Describe condiciones generales de la cotizacion..."></textarea>
                        </div>

                        <div class="col-12 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="signatureRequired" [(ngModel)]="signatureRequired" />
                                <label class="form-check-label" for="signatureRequired">Requiere firma del cliente para la aprobacion</label>
                            </div>
                        </div>

                        <div class="col-12 mb-3">
                            <div class="row gx-2 align-items-center">
                                <div class="col-12 col-lg-4">
                                    <select class="form-select" [(ngModel)]="selectedServiceToAdd">
                                        <option value="" disabled>Seleccionar Servicio</option>
                                        <option *ngFor="let service of serviceOptions" [value]="service">{{ service }}</option>
                                    </select>
                                </div>
                                <div class="col-auto">
                                    <button class="btn btn-theme" type="button" (click)="addQuoteLineFromSelection()">Agregar servicio</button>
                                </div>
                            </div>
                        </div>

                        <div class="col-12">
                            <div class="table-responsive border rounded">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th style="min-width: 280px;">Servicio / Descripcion</th>
                                            <th style="width: 120px;">Cantidad</th>
                                            <th style="width: 150px;">Precio unitario</th>
                                            <th style="width: 150px;">Impuesto %</th>
                                            <th style="width: 150px;">Monto</th>
                                            <th style="width: 60px;"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr *ngFor="let line of quoteLines; let i = index">
                                            <td>
                                                <select class="form-select mb-2" [(ngModel)]="line.servicio" [ngModelOptions]="{ standalone: true }">
                                                    <option *ngFor="let service of serviceOptions" [value]="service">{{ service }}</option>
                                                </select>
                                                <input class="form-control" [(ngModel)]="line.descripcion" [ngModelOptions]="{ standalone: true }" placeholder="Descripcion del servicio" />
                                            </td>
                                            <td>
                                                <input class="form-control text-end" type="number" min="1" [(ngModel)]="line.cantidad" [ngModelOptions]="{ standalone: true }" />
                                                <select class="form-select form-select-sm mt-2" [(ngModel)]="line.unidad" [ngModelOptions]="{ standalone: true }">
                                                    <option *ngFor="let unit of serviceUnits" [value]="unit">{{ unit }}</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input class="form-control text-end" type="number" min="0" step="1000" [(ngModel)]="line.precioUnitario" [ngModelOptions]="{ standalone: true }" />
                                            </td>
                                            <td>
                                                <select class="form-select" [(ngModel)]="line.impuesto" [ngModelOptions]="{ standalone: true }">
                                                    <option *ngFor="let tax of taxRates" [ngValue]="tax">{{ tax }}%</option>
                                                </select>
                                            </td>
                                            <td class="text-end fw-semibold">{{ lineTotal(line) | number: '1.0-0' }}</td>
                                            <td class="text-center">
                                                <button class="btn btn-sm btn-link text-danger" type="button" (click)="removeQuoteLine(i)"><i class="bi bi-x-circle"></i></button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <button class="btn btn-link px-0 mt-2" type="button" (click)="addQuoteLine()">
                                <i class="bi bi-plus-circle me-1"></i> Agregar item
                            </button>
                        </div>

                        <div class="col-12 col-lg-6 mt-3">
                            <label class="form-label">Nota Para El Destinatario</label>
                            <textarea class="form-control" rows="4" [(ngModel)]="recipientNote"></textarea>
                        </div>

                        <div class="col-12 col-lg-6 mt-3">
                            <div class="border rounded p-3">
                                <h6 class="mb-3">Resumen</h6>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Subtotal</span>
                                    <strong>{{ subtotal | number: '1.0-0' }}</strong>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span>Descuento</span>
                                    <div class="d-flex gap-2" style="max-width: 220px;">
                                        <input class="form-control form-control-sm text-end" type="number" min="0" [(ngModel)]="discountValue" />
                                        <select class="form-select form-select-sm" [(ngModel)]="discountType">
                                            <option value="%">%</option>
                                            <option value="COP">COP</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Impuesto</span>
                                    <strong>{{ taxTotal | number: '1.0-0' }}</strong>
                                </div>
                                <hr class="my-2" />
                                <div class="d-flex justify-content-between fs-5">
                                    <strong>Total</strong>
                                    <strong>{{ total | number: '1.0-0' }}</strong>
                                </div>
                            </div>

                            <div class="mt-3">
                                <label class="form-label">Terminos y Condiciones</label>
                                <textarea class="form-control" rows="4" [(ngModel)]="termsAndConditions"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex gap-2 flex-wrap align-items-center">
                    <div class="btn-group" role="group">
                        <button class="btn btn-theme" type="button" [disabled]="isSavingQuote" (click)="saveDraft()">
                            <span *ngIf="isSavingQuote" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            {{ isSavingQuote ? 'Guardando...' : 'Guardar' }}
                        </button>
                        <button type="button" class="btn btn-theme dropdown-toggle dropdown-toggle-split" [disabled]="isSavingQuote" data-bs-toggle="dropdown" aria-expanded="false">
                            <span class="visually-hidden">Opciones</span>
                        </button>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item" type="button" [disabled]="isSavingQuote" (click)="saveDraft()">Guardar borrador</button></li>
                            <li><button class="dropdown-item" type="button" [disabled]="isSavingQuote" (click)="saveAndSend()">Guardar y enviar</button></li>
                            <li><button class="dropdown-item" type="button" [disabled]="isSavingQuote" (click)="saveAndMarkSent()">Guardar y marcar como enviado</button></li>
                        </ul>
                    </div>
                    <button class="btn btn-outline-secondary" type="button" [disabled]="isSavingQuote" (click)="cancelQuoteForm()">Cancelar</button>
                </div>
            </div>

            <!-- Purchase order modal -->
            <div class="modal fade show" tabindex="-1" role="dialog" aria-modal="true" style="display: block;"
                *ngIf="showPurchaseOrderModal">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ pendingPurchaseOrderRow?.purchaseOrderNumber ? 'Actualizar OC' : 'Cargar OC' }} · {{ pendingPurchaseOrderRow?.codigo }}</h5>
                            <button type="button" class="btn-close" aria-label="Close" (click)="closePurchaseOrderModal()"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-danger border mb-3" *ngIf="quotePurchaseOrderErrorMessage">{{ quotePurchaseOrderErrorMessage }}</div>

                            <div class="row gx-3 gy-3">
                                <div class="col-12">
                                    <label class="form-label">Numero de OC <span class="text-danger">*</span></label>
                                    <input class="form-control" type="text" [(ngModel)]="purchaseOrderNumberDraft" maxlength="120" placeholder="Ejemplo: OC-2026-00158" />
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Fecha de OC <span class="text-danger">*</span></label>
                                    <input class="form-control" type="date" [(ngModel)]="purchaseOrderDateDraft" />
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Archivo OC <span class="text-danger">*</span></label>
                                    <input class="form-control" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" (change)="onPurchaseOrderFileChange($event)" />
                                    <div class="small text-secondary mt-2" *ngIf="purchaseOrderFileNameDraft">Archivo actual: {{ purchaseOrderFileNameDraft }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" [disabled]="isSavingPurchaseOrder" (click)="closePurchaseOrderModal()">Cancelar</button>
                            <button type="button" class="btn btn-theme" [disabled]="isSavingPurchaseOrder" (click)="savePurchaseOrder()">
                                <span *ngIf="isSavingPurchaseOrder" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                {{ isSavingPurchaseOrder ? 'Guardando...' : 'Guardar OC y pasar a pedir repuestos' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show" *ngIf="showPurchaseOrderModal"></div>

            <!-- Delete confirmation modal -->
            <div class="modal fade show" tabindex="-1" role="dialog" aria-modal="true" style="display: block;"
                *ngIf="showDeleteModal">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Eliminar cotizacion</h5>
                            <button type="button" class="btn-close" aria-label="Close" (click)="closeDeleteModal()"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-1">¿Está seguro de que desea eliminar la cotizacion <strong>{{ pendingDeleteRow?.codigo }}</strong>?</p>
                            <p class="text-secondary small mb-0">Esta accion no se puede deshacer.</p>
                            <p class="text-danger small mb-0 mt-2" *ngIf="quoteDeleteErrorMessage">{{ quoteDeleteErrorMessage }}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" [disabled]="isDeletingQuote" (click)="closeDeleteModal()">Cancelar</button>
                            <button type="button" class="btn btn-danger" [disabled]="isDeletingQuote" (click)="executeDeleteQuote()">
                                <span *ngIf="isDeletingQuote" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                {{ isDeletingQuote ? 'Eliminando...' : 'Eliminar' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show" *ngIf="showDeleteModal"></div>
        </div>
    `,
})
export class CrmQuotesComponent implements OnInit {
    quotesRows: QuoteRow[] = [];

    prospectOptions: string[] = [];
    serviceOptions: string[] = [];
    serviceUnits: string[] = ["Pcs", "Hora", "Dia", "Mes"];
    taxRates: number[] = [0, 5, 10, 19];

    showQuoteForm = false;
    editingQuoteId: string | null = null;
    editingQuoteToken: string | null = null;
    isSavingQuote = false;
    showDeleteModal = false;
    pendingDeleteRow: QuoteRow | null = null;
    isDeletingQuote = false;
    quoteDeleteErrorMessage = "";
    quotePurchaseOrderSuccessMessage = "";
    quotePurchaseOrderErrorMessage = "";

    showPurchaseOrderModal = false;
    pendingPurchaseOrderRow: QuoteRow | null = null;
    pendingPurchaseOrderQuote: CrmQuoteRecord | null = null;
    isSavingPurchaseOrder = false;
    purchaseOrderNumberDraft = "";
    purchaseOrderDateDraft = "";
    purchaseOrderFileNameDraft = "";
    purchaseOrderFileDataUrlDraft = "";

    zoneOptions: CrmZoneRecord[] = [];
    selectedQuoteZone = "";
    selectedProspecto = "";
    selectedServiceToAdd = "";
    validUntil = this.defaultValidUntil();
    currency: "COP" | "USD" = "COP";
    taxMode: "after-discount" | "before-discount" = "after-discount";
    quoteDescription = "";
    signatureRequired = true;
    selectedQuoteEquipmentIds: string[] = [];

    quotesLoadErrorMessage = "";
    prospectsLoadErrorMessage = "";
    catalogsLoadErrorMessage = "";
    quoteSaveErrorMessage = "";
    /**
     * Fase 5c: estado real del correo de la cotización. Se llena sólo cuando el
     * envío sí va a salir; cuando no sale el mensaje va a
     * `quoteSaveErrorMessage`, que es el que se muestra en rojo.
     */
    quoteEmailMessage = "";
    // Fase 5b: conversión cotización→factura.
    convertingQuoteToken: string | null = null;
    quoteConversionMessage = "";
    quoteConversionError = "";

    quoteLines: QuoteLine[] = [
        {
            servicio: "",
            descripcion: "",
            cantidad: 1,
            unidad: "Pcs",
            precioUnitario: 0,
            impuesto: 0,
        },
    ];

    discountValue = 0;
    discountType: "%" | "COP" = "%";
    recipientNote = "";
    termsAndConditions = "Gracias por confiar en nuestros servicios.";

    private quoteIdByToken: Record<string, string> = {};
    private prospectRecords: CrmProspectRecord[] = [];
    private availableEquipmentItemsApi: ProspectEquipmentSummary[] = [];
    private editingQuotePurchaseOrderDataUrl = "";
    private editingQuotePurchaseOrderUploadedAt = "";
    private stopDraftWatch: () => void = () => undefined;

    constructor(
        private readonly crmProspectsApi: CrmProspectsApiService,
        private readonly crmQuotesApi: CrmQuotesApiService,
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly financeBillingApi: FinanceBillingApiService,
        private readonly projectService: ProjectService,
        private readonly cdr: ChangeDetectorRef,
        private readonly formDraftService: FormDraftService,
        // Fase 5c: correo transaccional de la cotización.
        private readonly emailsApi: EmailsApiService,
    ) {}

    ngOnInit(): void {
        const draft = this.formDraftService.load<{
            showQuoteForm?: boolean;
            selectedQuoteZone?: string;
            selectedProspecto?: string;
            selectedServiceToAdd?: string;
            validUntil?: string;
            currency?: "COP" | "USD";
            taxMode?: "after-discount" | "before-discount";
            quoteDescription?: string;
            signatureRequired?: boolean;
            selectedQuoteEquipmentIds?: string[];
            quoteLines?: QuoteLine[];
            discountValue?: number;
            discountType?: "%" | "COP";
            recipientNote?: string;
            termsAndConditions?: string;
        }>(CRM_QUOTES_FORM_DRAFT_KEY);

        if (draft) {
            this.showQuoteForm = Boolean(draft.showQuoteForm ?? this.showQuoteForm);
            this.selectedQuoteZone = String(draft.selectedQuoteZone ?? this.selectedQuoteZone);
            this.selectedProspecto = String(draft.selectedProspecto ?? this.selectedProspecto);
            this.selectedServiceToAdd = String(draft.selectedServiceToAdd ?? this.selectedServiceToAdd);
            this.validUntil = String(draft.validUntil ?? this.validUntil);
            this.currency = draft.currency ?? this.currency;
            this.taxMode = draft.taxMode ?? this.taxMode;
            this.quoteDescription = String(draft.quoteDescription ?? this.quoteDescription);
            this.signatureRequired = Boolean(draft.signatureRequired ?? this.signatureRequired);
            this.selectedQuoteEquipmentIds = Array.isArray(draft.selectedQuoteEquipmentIds) ? [...draft.selectedQuoteEquipmentIds] : [];
            this.quoteLines = Array.isArray(draft.quoteLines) && draft.quoteLines.length > 0 ? [...draft.quoteLines] : this.quoteLines;
            this.discountValue = Number.isFinite(Number(draft.discountValue)) ? Number(draft.discountValue) : this.discountValue;
            this.discountType = draft.discountType ?? this.discountType;
            this.recipientNote = String(draft.recipientNote ?? this.recipientNote);
            this.termsAndConditions = String(draft.termsAndConditions ?? this.termsAndConditions);
        }

        this.stopDraftWatch = this.formDraftService.watch(CRM_QUOTES_FORM_DRAFT_KEY, () => ({
            showQuoteForm: this.showQuoteForm,
            selectedQuoteZone: this.selectedQuoteZone,
            selectedProspecto: this.selectedProspecto,
            selectedServiceToAdd: this.selectedServiceToAdd,
            validUntil: this.validUntil,
            currency: this.currency,
            taxMode: this.taxMode,
            quoteDescription: this.quoteDescription,
            signatureRequired: this.signatureRequired,
            selectedQuoteEquipmentIds: [...this.selectedQuoteEquipmentIds],
            quoteLines: this.quoteLines.map((line) => ({ ...line })),
            discountValue: this.discountValue,
            discountType: this.discountType,
            recipientNote: this.recipientNote,
            termsAndConditions: this.termsAndConditions,
        }));

        this.loadProspectsFromApi();
        this.loadCatalogsFromApi();
        this.loadQuotesFromApi();
        this.handleProspectChange(this.selectedProspecto);
    }

    ngOnDestroy(): void {
        this.stopDraftWatch();
    }

    openQuoteForm(): void {
        this.editingQuoteId = null;
        this.editingQuoteToken = null;
        this.editingQuotePurchaseOrderDataUrl = "";
        this.editingQuotePurchaseOrderUploadedAt = "";

        if (!this.prospectOptions.includes(this.selectedProspecto) && this.prospectOptions.length > 0) {
            this.selectedProspecto = this.prospectOptions[0];
        }

        if (!this.serviceOptions.includes(this.selectedServiceToAdd) && this.serviceOptions.length > 0) {
            this.selectedServiceToAdd = this.serviceOptions[0];
        }

        this.showQuoteForm = true;
        this.handleProspectChange(this.selectedProspecto);
    }

    openEditQuoteForm(row: QuoteRow): void {
        const quoteId = this.quoteIdByToken[row.token];
        if (!quoteId) {
            this.quoteSaveErrorMessage = "No se puede editar: ID de cotizacion no encontrado.";
            return;
        }

        this.crmQuotesApi.getQuote(quoteId).subscribe({
            next: (quote) => {
                this.editingQuoteId = quote.id;
                this.editingQuoteToken = quote.token;
                this.selectedProspecto = quote.prospecto;
                this.validUntil = this.formatDdMmYyyyToIso(quote.validoHasta);
                this.currency = (quote.moneda as "COP" | "USD") || "COP";
                this.taxMode = (quote.taxMode as "after-discount" | "before-discount") || "after-discount";
                this.quoteDescription = quote.descripcion ?? "";
                this.signatureRequired = quote.signatureRequired ?? true;
                this.selectedQuoteEquipmentIds = [...(quote.selectedEquipmentIds ?? [])];
                this.discountValue = quote.descuentoValor ?? 0;
                this.discountType = (quote.descuentoTipo as "%" | "COP") || "%";
                this.recipientNote = quote.nota ?? "";
                this.termsAndConditions = quote.terminos ?? "";
                this.editingQuotePurchaseOrderDataUrl = quote.purchaseOrderFileDataUrl ?? "";
                this.editingQuotePurchaseOrderUploadedAt = quote.purchaseOrderUploadedAt ?? "";
                this.quoteLines = (quote.lineas ?? []).length > 0
                    ? quote.lineas.map((l) => ({
                          servicio: l.servicio,
                          descripcion: l.descripcion,
                          cantidad: l.cantidad,
                          unidad: l.unidad,
                          precioUnitario: l.precioUnitario,
                          impuesto: l.impuesto,
                      }))
                    : [{ servicio: "", descripcion: "", cantidad: 1, unidad: "Pcs", precioUnitario: 0, impuesto: 0 }];

                if (quote.zone && this.zoneOptions.some((z) => z.name === quote.zone)) {
                    this.selectedQuoteZone = quote.zone;
                }

                this.showQuoteForm = true;
                this.handleProspectChange(this.selectedProspecto);
                this.quoteSaveErrorMessage = "";
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.quoteSaveErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar la cotizacion para edicion.");
                this.cdr.detectChanges();
            },
        });
    }

    openDeleteModal(row: QuoteRow): void {
        this.quoteDeleteErrorMessage = "";
        this.pendingDeleteRow = row;
        this.showDeleteModal = true;
    }

    /**
     * Fase 5b: convierte la cotización aprobada en factura del módulo de
     * facturación (POST /finance/invoices/from-quote/:id). El servidor es
     * idempotente: si la cotización ya tiene factura responde 409 y aquí se
     * muestra el mensaje sin duplicar nada.
     */
    convertQuoteToInvoice(row: QuoteRow): void {
        const quoteId = this.quoteIdByToken[row.token];
        if (!quoteId) {
            this.quoteConversionMessage = "";
            this.quoteConversionError = "No se puede convertir: ID de cotizacion no encontrado.";
            return;
        }

        this.convertingQuoteToken = row.token;
        this.quoteConversionMessage = "";
        this.quoteConversionError = "";
        this.financeBillingApi.createInvoiceFromQuote(quoteId).subscribe({
            next: (invoice) => {
                this.convertingQuoteToken = null;
                const code = `${invoice.seriesPrefix || ""}${String(invoice.sequenceNumber).padStart(3, "0")}`;
                this.quoteConversionMessage = `Cotizacion ${row.codigo} convertida en la factura ${code} (borrador) en Facturacion.`;
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.convertingQuoteToken = null;
                this.quoteConversionError = this.resolveErrorMessage(error, "No se pudo convertir la cotizacion en factura.");
                this.cdr.detectChanges();
            },
        });
    }

    closeDeleteModal(): void {
        this.showDeleteModal = false;
        this.pendingDeleteRow = null;
        this.isDeletingQuote = false;
        this.quoteDeleteErrorMessage = "";
    }

    executeDeleteQuote(): void {
        const row = this.pendingDeleteRow;
        if (!row) {
            return;
        }

        const quoteId = this.quoteIdByToken[row.token];
        if (!quoteId) {
            this.quoteDeleteErrorMessage = "No se puede eliminar: ID de cotizacion no encontrado.";
            return;
        }

        this.isDeletingQuote = true;
        this.quoteDeleteErrorMessage = "";
        this.crmQuotesApi.deleteQuote(quoteId).subscribe({
            next: () => {
                this.quotesRows = this.quotesRows.filter((r) => r.token !== row.token);
                delete this.quoteIdByToken[row.token];
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.isDeletingQuote = false;
                this.quoteDeleteErrorMessage = this.resolveErrorMessage(error, "No se pudo eliminar la cotizacion.");
                this.cdr.detectChanges();
            },
        });
    }

    openPurchaseOrderModal(row: QuoteRow): void {
        const quoteId = this.quoteIdByToken[row.token];
        if (!quoteId) {
            this.quotePurchaseOrderErrorMessage = "No se puede cargar OC: ID de cotizacion no encontrado.";
            this.quotePurchaseOrderSuccessMessage = "";
            return;
        }

        this.quotePurchaseOrderErrorMessage = "";
        this.quotePurchaseOrderSuccessMessage = "";
        this.showPurchaseOrderModal = true;
        this.pendingPurchaseOrderRow = row;
        this.pendingPurchaseOrderQuote = null;
        this.purchaseOrderNumberDraft = row.purchaseOrderNumber ?? "";
        this.purchaseOrderDateDraft = row.purchaseOrderDate ?? "";
        this.purchaseOrderFileNameDraft = row.purchaseOrderFileName ?? "";
        this.purchaseOrderFileDataUrlDraft = "";

        this.crmQuotesApi.getQuote(quoteId).subscribe({
            next: (quote) => {
                this.pendingPurchaseOrderQuote = quote;
                this.purchaseOrderNumberDraft = quote.purchaseOrderNumber ?? this.purchaseOrderNumberDraft;
                this.purchaseOrderDateDraft = quote.purchaseOrderDate ?? this.purchaseOrderDateDraft;
                this.purchaseOrderFileNameDraft = quote.purchaseOrderFileName ?? this.purchaseOrderFileNameDraft;
                this.purchaseOrderFileDataUrlDraft = quote.purchaseOrderFileDataUrl ?? "";
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.quotePurchaseOrderErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar la cotizacion para registrar OC.");
                this.cdr.detectChanges();
            },
        });
    }

    closePurchaseOrderModal(): void {
        this.showPurchaseOrderModal = false;
        this.pendingPurchaseOrderRow = null;
        this.pendingPurchaseOrderQuote = null;
        this.isSavingPurchaseOrder = false;
        this.purchaseOrderNumberDraft = "";
        this.purchaseOrderDateDraft = "";
        this.purchaseOrderFileNameDraft = "";
        this.purchaseOrderFileDataUrlDraft = "";
    }

    onPurchaseOrderFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.purchaseOrderFileNameDraft = file.name;
        const reader = new FileReader();
        reader.onload = () => {
            this.purchaseOrderFileDataUrlDraft = String(reader.result ?? "");
            this.cdr.detectChanges();
        };
        reader.onerror = () => {
            this.quotePurchaseOrderErrorMessage = "No se pudo leer el archivo de OC.";
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
    }

    savePurchaseOrder(): void {
        const row = this.pendingPurchaseOrderRow;
        const quote = this.pendingPurchaseOrderQuote;
        if (!row || !quote) {
            this.quotePurchaseOrderErrorMessage = "No se pudo preparar la cotizacion para registrar OC.";
            return;
        }

        const quoteId = this.quoteIdByToken[row.token];
        if (!quoteId) {
            this.quotePurchaseOrderErrorMessage = "No se puede guardar OC: ID de cotizacion no encontrado.";
            return;
        }

        const purchaseOrderNumber = this.purchaseOrderNumberDraft.trim();
        if (!purchaseOrderNumber) {
            this.quotePurchaseOrderErrorMessage = "El numero de OC es obligatorio.";
            return;
        }

        const purchaseOrderDate = this.purchaseOrderDateDraft.trim();
        if (!purchaseOrderDate) {
            this.quotePurchaseOrderErrorMessage = "La fecha de OC es obligatoria.";
            return;
        }

        const purchaseOrderFileName = this.purchaseOrderFileNameDraft.trim();
        const purchaseOrderFileDataUrl = this.purchaseOrderFileDataUrlDraft.trim() || String(quote.purchaseOrderFileDataUrl ?? "").trim();
        if (!purchaseOrderFileName || !purchaseOrderFileDataUrl) {
            this.quotePurchaseOrderErrorMessage = "Debes adjuntar el archivo de la OC.";
            return;
        }

        this.isSavingPurchaseOrder = true;
        this.quotePurchaseOrderErrorMessage = "";
        this.quotePurchaseOrderSuccessMessage = "";

        const updatedQuote: CrmQuoteRecord = {
            ...quote,
            id: quoteId,
            estado: "Aprobado",
            purchaseOrderNumber,
            purchaseOrderDate,
            purchaseOrderFileName,
            purchaseOrderFileDataUrl,
            purchaseOrderUploadedAt: new Date().toISOString(),
        };

        this.crmQuotesApi.updateQuote(quoteId, updatedQuote).subscribe({
            next: (savedQuote) => {
                this.quoteIdByToken[savedQuote.token] = savedQuote.id;
                this.upsertRowFromApi(savedQuote);
                upsertPublicQuotePreview(this.mapApiQuoteToPreview(savedQuote));

                this.syncPurchaseOrderToProjects(savedQuote);

                this.isSavingPurchaseOrder = false;
                this.quotePurchaseOrderErrorMessage = "";
                this.quotePurchaseOrderSuccessMessage = `OC ${purchaseOrderNumber} registrada en ${savedQuote.codigo}.`;
                this.closePurchaseOrderModal();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.isSavingPurchaseOrder = false;
                this.quotePurchaseOrderErrorMessage = this.resolveErrorMessage(error, "No se pudo guardar la OC en backend.");
                this.cdr.detectChanges();
            },
        });
    }

    private syncPurchaseOrderToProjects(quote: CrmQuoteRecord): void {
        const purchaseOrderNumber = String(quote.purchaseOrderNumber ?? "").trim();
        const purchaseOrderDate = String(quote.purchaseOrderDate ?? "").trim();
        const selectedEquipmentIds = (quote.selectedEquipmentIds ?? []).map((value) => String(value ?? "").trim()).filter(Boolean);
        if (!purchaseOrderNumber || selectedEquipmentIds.length === 0) {
            return;
        }

        const selectedEquipmentSet = new Set(selectedEquipmentIds);
        const board = this.projectService.getBoardSnapshot();
        const targetStatus = board?.columns.find((column) => column.equipmentStatusId === "pedir-repuestos")?.id;
        const repairLabel = getProjectWorkflowStatusLabel("pedir-repuestos");

        this.projectService.projects$.pipe(take(1)).subscribe((projects) => {
            projects
                .filter((project) => selectedEquipmentSet.has(String(project.properties?.["equipmentItemId"] ?? "").trim()))
                .forEach((project) => {
                    const nextProperties = {
                        ...project.properties,
                        purchaseOrderNumber,
                        purchaseOrderDate,
                        purchaseOrderFileName: String(quote.purchaseOrderFileName ?? "").trim(),
                        purchaseOrderLinkedAt: quote.purchaseOrderUploadedAt || new Date().toISOString(),
                        equipmentRepairStatus: "pedir-repuestos",
                        equipmentRepairStatusLabel: repairLabel,
                    };

                    this.projectService.updateProject(project.id, {
                        properties: nextProperties,
                        status: targetStatus ?? project.status,
                    }).subscribe();
                });
        });
    }

    confirmDeleteQuote(row: QuoteRow): void {
        this.openDeleteModal(row);
    }

    cancelQuoteForm(): void {
        this.showQuoteForm = false;
        this.editingQuoteId = null;
        this.editingQuoteToken = null;
        this.editingQuotePurchaseOrderDataUrl = "";
        this.editingQuotePurchaseOrderUploadedAt = "";
        this.formDraftService.remove(CRM_QUOTES_FORM_DRAFT_KEY);
    }

    get availableQuoteEquipmentItems(): ProspectEquipmentSummary[] {
        return this.availableEquipmentItemsApi;
    }

    get selectedQuoteEquipmentLabels(): string[] {
        const selectedIds = new Set(this.selectedQuoteEquipmentIds);
        return this.availableQuoteEquipmentItems.filter((item) => selectedIds.has(item.itemId)).map((item) => item.displayName);
    }

    handleProspectChange(prospectName: string): void {
        this.selectedProspecto = prospectName;
        this.loadEquipmentForSelectedProspect();

        const availableIds = new Set(this.availableEquipmentItemsApi.map((item) => item.itemId));
        this.selectedQuoteEquipmentIds = this.selectedQuoteEquipmentIds.filter((itemId) => availableIds.has(itemId));
    }

    isQuoteEquipmentSelected(itemId: string): boolean {
        return this.selectedQuoteEquipmentIds.includes(itemId);
    }

    toggleQuoteEquipment(itemId: string, checked: boolean): void {
        if (checked) {
            if (!this.selectedQuoteEquipmentIds.includes(itemId)) {
                this.selectedQuoteEquipmentIds = [...this.selectedQuoteEquipmentIds, itemId];
            }
            return;
        }

        this.selectedQuoteEquipmentIds = this.selectedQuoteEquipmentIds.filter((currentId) => currentId !== itemId);
    }

    addQuoteLineFromSelection(): void {
        if (!this.selectedServiceToAdd) {
            return;
        }

        this.quoteLines.push({
            servicio: this.selectedServiceToAdd,
            descripcion: `Servicio de ${this.selectedServiceToAdd.toLowerCase()}`,
            cantidad: 1,
            unidad: "Pcs",
            precioUnitario: 0,
            impuesto: 0,
        });
    }

    addQuoteLine(): void {
        this.quoteLines.push({
            servicio: this.serviceOptions[0] ?? "",
            descripcion: "",
            cantidad: 1,
            unidad: "Pcs",
            precioUnitario: 0,
            impuesto: 0,
        });
    }

    removeQuoteLine(index: number): void {
        if (this.quoteLines.length === 1) {
            return;
        }

        this.quoteLines.splice(index, 1);
    }

    lineTotal(line: QuoteLine): number {
        const qty = Number.isFinite(line.cantidad) ? line.cantidad : 0;
        const unit = Number.isFinite(line.precioUnitario) ? line.precioUnitario : 0;
        return Math.max(0, qty) * Math.max(0, unit);
    }

    get subtotal(): number {
        return this.quoteLines.reduce((acc, line) => acc + this.lineTotal(line), 0);
    }

    get discountAmount(): number {
        const value = Math.max(0, this.discountValue || 0);
        if (this.discountType === "%") {
            return Math.min(this.subtotal, (this.subtotal * value) / 100);
        }
        return Math.min(this.subtotal, value);
    }

    get taxableBase(): number {
        return Math.max(0, this.subtotal - this.discountAmount);
    }

    get taxTotal(): number {
        if (this.subtotal <= 0) {
            return 0;
        }

        if (this.taxMode === "before-discount") {
            return this.quoteLines.reduce((acc, line) => acc + (this.lineTotal(line) * line.impuesto) / 100, 0);
        }

        const ratio = this.taxableBase / this.subtotal;
        return this.quoteLines.reduce((acc, line) => acc + ((this.lineTotal(line) * ratio) * line.impuesto) / 100, 0);
    }

    get total(): number {
        return this.taxableBase + this.taxTotal;
    }

    saveDraft(): void {
        this.upsertCurrentQuote("Borrador");
    }

    saveAndSend(): void {
        // Fase 5c: "Guardar y enviar" ahora ENVÍA. Antes sólo cambiaba el
        // estado a 'Enviado' y la UI daba por hecho que el cliente recibió la
        // cotización, cuando el backend no tenía SMTP (0 resultados de
        // smtp|sendmail|mailer en todo el backend).
        this.upsertCurrentQuote("Enviado", true);
    }

    saveAndMarkSent(): void {
        // Este botón sigue siendo sólo el cambio de estado: existe justamente
        // para marcar una cotización enviada por otro medio (WhatsApp, llamada)
        // sin que el sistema pretenda haber mandado un correo.
        this.upsertCurrentQuote("Enviado", false);
    }

    private upsertCurrentQuote(status: QuoteStatus, sendEmail = false): void {
        this.quoteSaveErrorMessage = "";

        // ── Frontend validation ──────────────────────────────────────────────
        if (!this.selectedProspecto.trim()) {
            this.quoteSaveErrorMessage = "Debe seleccionar un prospecto antes de guardar.";
            return;
        }

        if (!this.validUntil.trim()) {
            this.quoteSaveErrorMessage = "El campo 'Valido Hasta' es obligatorio.";
            return;
        }

        const validLines = this.quoteLines.filter((l) => l.servicio.trim() && l.precioUnitario > 0);
        if (validLines.length === 0) {
            this.quoteSaveErrorMessage = "Debe agregar al menos una linea con servicio y precio unitario mayor a cero.";
            return;
        }
        // ────────────────────────────────────────────────────────────────────

        const now = new Date();
        const dateValue = `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}-${this.pad(now.getDate())}`;
        const dateLabel = `${this.pad(now.getDate())}/${this.pad(now.getMonth() + 1)}/${now.getFullYear()}`;
        const nextCode = this.getNextQuoteCode(dateValue);
        const token = this.generateProposalToken();

        // When editing, keep the existing code and token; only generate new ones for creates
        const isEditing = Boolean(this.editingQuoteId && this.editingQuoteToken);
        const existingRow = isEditing
            ? this.quotesRows.find((r) => r.token === this.editingQuoteToken)
            : undefined;
        const finalCode = isEditing && existingRow ? existingRow.codigo : nextCode;
        const finalToken = isEditing && this.editingQuoteToken ? this.editingQuoteToken : token;

        const newRow: QuoteRow = {
            codigo: finalCode,
            prospecto: this.selectedProspecto || "Prospecto sin nombre",
            total: Math.round(this.total),
            fecha: dateLabel,
            validoHasta: this.formatIsoToDdMmYyyy(this.validUntil),
            estado: status,
            token: finalToken,
        };

        const preview = this.buildPublicPreview(newRow);
        const payload = this.buildApiQuotePayload(newRow, preview);

        const apiCall$ = isEditing && this.editingQuoteId
            ? this.crmQuotesApi.updateQuote(this.editingQuoteId, { ...payload, id: this.editingQuoteId })
            : this.crmQuotesApi.createQuote(payload);

        apiCall$.subscribe({
            next: (saved) => {
                this.quoteIdByToken[saved.token] = saved.id;
                this.upsertRowFromApi(saved);
                upsertPublicQuotePreview(this.mapApiQuoteToPreview(saved));
                this.showQuoteForm = false;
                this.editingQuoteId = null;
                this.editingQuoteToken = null;
                this.editingQuotePurchaseOrderDataUrl = "";
                this.editingQuotePurchaseOrderUploadedAt = "";
                this.isSavingQuote = false;
                this.formDraftService.remove(CRM_QUOTES_FORM_DRAFT_KEY);

                // Fase 5c: el guardado ya quedó; el correo es un paso aparte
                // porque puede fallar por su cuenta. Un fallo de correo NO
                // revierte la cotización guardada, pero TAMPOCO se oculta: se
                // muestra arriba como error visible.
                if (sendEmail) {
                    this.sendQuoteEmail(saved.id);
                }

                this.cdr.detectChanges();
            },
            error: (error) => {
                this.isSavingQuote = false;
                this.quoteSaveErrorMessage = this.resolveErrorMessage(error, "No se pudo guardar la cotizacion en backend.");
                this.cdr.detectChanges();
            },
        });
    }

    /**
     * Dispara el correo de la cotización y refleja el estado REAL del envío.
     *
     * El contrato del backend es que encolar no es enviar, así que `delivered`
     * llega en false y `emailStatus` dice si saldrá ('pendiente') o si el
     * servidor no tiene SMTP y no va a salir ('desactivado'). Mostrar "enviada"
     * en ambos casos sería exactamente el éxito falso que la Fase 5c vino a
     * eliminar.
     */
    private sendQuoteEmail(quoteId: string): void {
        this.emailsApi.sendQuoteEmail(quoteId).pipe(take(1)).subscribe({
            next: (result) => {
                if (result.delivered) {
                    this.quoteEmailMessage = `Correo enviado a ${result.toEmail}.`;
                    this.quoteSaveErrorMessage = "";
                } else if (result.emailStatus === "desactivado") {
                    this.quoteEmailMessage = "";
                    this.quoteSaveErrorMessage =
                        `La cotizacion quedo guardada y marcada como Enviada, pero el correo NO salio: ` +
                        `${result.warning ?? "el servidor no tiene SMTP configurado"}. ` +
                        `Quedo registrada en el outbox de correos para cuando se configure.`;
                } else {
                    this.quoteEmailMessage =
                        `Correo en cola para ${result.toEmail}; saldra en el proximo envio del servidor.`;
                    this.quoteSaveErrorMessage = "";
                }
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.quoteEmailMessage = "";
                // 422 = el cliente no tiene correo registrado. La cotización sí
                // se guardó, pero el usuario debe saber que el cliente no se
                // enteró: reportarlo como éxito sería mentir.
                this.quoteSaveErrorMessage =
                    `La cotizacion quedo guardada, pero el correo NO se envio: ` +
                    this.resolveErrorMessage(error, "no se pudo enviar el correo de la cotizacion");
                this.cdr.detectChanges();
            },
        });
    }

    private loadProspectsFromApi(): void {
        this.crmProspectsApi.listProspects().subscribe({
            next: (items) => {
                this.prospectRecords = [...items];
                this.prospectOptions = items.map((item) => item.nombre);

                if (!this.prospectOptions.includes(this.selectedProspecto)) {
                    this.selectedProspecto = this.prospectOptions[0] ?? "";
                }

                this.prospectsLoadErrorMessage = "";
                this.handleProspectChange(this.selectedProspecto);
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.prospectRecords = [];
                this.prospectOptions = [];
                this.selectedProspecto = "";
                this.availableEquipmentItemsApi = [];
                this.selectedQuoteEquipmentIds = [];
                this.prospectsLoadErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar prospectos desde backend.");
                this.cdr.detectChanges();
            },
        });
    }

    private loadCatalogsFromApi(): void {
        this.crmProspectsApi.catalogs().subscribe({
            next: (catalogs) => {
                this.serviceOptions = [...catalogs.services];
                this.zoneOptions = catalogs.zones.map((name, index) => ({ id: index + 1, name }));

                if (!this.serviceOptions.includes(this.selectedServiceToAdd)) {
                    this.selectedServiceToAdd = this.serviceOptions[0] ?? "";
                }

                if (!this.zoneOptions.some((zone) => zone.name === this.selectedQuoteZone)) {
                    this.selectedQuoteZone = this.zoneOptions[0]?.name ?? "";
                }

                this.catalogsLoadErrorMessage = "";
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.serviceOptions = [];
                this.selectedServiceToAdd = "";
                this.zoneOptions = [];
                this.selectedQuoteZone = "";
                this.catalogsLoadErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar catalogos desde backend.");
                this.cdr.detectChanges();
            },
        });
    }

    private loadQuotesFromApi(): void {
        this.crmQuotesApi.listQuotes({ limit: 200 }).subscribe({
            next: (items) => {
                this.quotesRows = items.map((item) => this.mapApiQuoteToRow(item));
                this.quoteIdByToken = items.reduce<Record<string, string>>((acc, item) => {
                    acc[item.token] = item.id;
                    return acc;
                }, {});

                items.forEach((item) => {
                    upsertPublicQuotePreview(this.mapApiQuoteToPreview(item));
                });

                this.quotesLoadErrorMessage = "";
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.quotesRows = [];
                this.quoteIdByToken = {};
                this.quotesLoadErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar cotizaciones desde backend.");
                this.cdr.detectChanges();
            },
        });
    }

    private loadEquipmentForSelectedProspect(): void {
        const prospect = this.findProspectByName(this.selectedProspecto);
        if (!prospect) {
            this.availableEquipmentItemsApi = [];
            return;
        }

        const criteria = buildEquipmentMatchCriteria(prospect);
        this.crmEquipmentApi.listItems(criteria).subscribe({
            next: (items) => {
                this.availableEquipmentItemsApi = items;
                const availableIds = new Set(items.map((item) => item.itemId));
                this.selectedQuoteEquipmentIds = this.selectedQuoteEquipmentIds.filter((itemId) => availableIds.has(itemId));
                this.cdr.detectChanges();
            },
            error: () => {
                this.availableEquipmentItemsApi = [];
                this.selectedQuoteEquipmentIds = [];
                this.cdr.detectChanges();
            },
        });
    }

    private buildApiQuotePayload(row: QuoteRow, preview: PublicQuotePreview): CrmQuoteRecord {
        const prospect = this.findProspectByName(row.prospecto);
        const quoteID = this.quoteIdByToken[row.token] ?? row.token;
        const existingRow = this.quotesRows.find((item) => item.token === row.token);

        return {
            id: quoteID,
            token: row.token,
            codigo: row.codigo,
            prospecto: row.prospecto,
            prospectId: prospect?.id,
            empresa: preview.empresa,
            correo: preview.correo,
            movil: preview.movil,
            fecha: row.fecha,
            validoHasta: row.validoHasta,
            estado: row.estado,
            moneda: preview.moneda,
            descuentoTipo: preview.descuentoTipo,
            descuentoValor: preview.descuentoValor,
            lineas: preview.lineas,
            nota: preview.nota,
            terminos: preview.terminos,
            estadoCliente: preview.estadoCliente,
            descripcion: this.quoteDescription.trim(),
            taxMode: this.taxMode,
            zone: this.selectedQuoteZone,
            signatureRequired: this.signatureRequired,
            selectedEquipmentIds: [...this.selectedQuoteEquipmentIds],
            subtotal: this.subtotal,
            taxTotal: this.taxTotal,
            total: this.total,
            purchaseOrderNumber: existingRow?.purchaseOrderNumber ?? "",
            purchaseOrderDate: existingRow?.purchaseOrderDate ?? "",
            purchaseOrderFileName: existingRow?.purchaseOrderFileName ?? "",
            purchaseOrderFileDataUrl: this.editingQuotePurchaseOrderDataUrl,
            purchaseOrderUploadedAt: this.editingQuotePurchaseOrderUploadedAt,
        };
    }

    private mapApiQuoteToRow(item: CrmQuoteRecord): QuoteRow {
        return {
            codigo: item.codigo,
            prospecto: item.prospecto,
            total: Math.round(Number(item.total ?? 0)),
            fecha: item.fecha,
            validoHasta: item.validoHasta,
            estado: item.estado,
            token: item.token,
            purchaseOrderNumber: String(item.purchaseOrderNumber ?? "").trim(),
            purchaseOrderDate: String(item.purchaseOrderDate ?? "").trim(),
            purchaseOrderFileName: String(item.purchaseOrderFileName ?? "").trim(),
        };
    }

    private mapApiQuoteToPreview(item: CrmQuoteRecord): PublicQuotePreview {
        return {
            token: item.token,
            codigo: item.codigo,
            prospecto: item.prospecto,
            empresa: item.empresa,
            correo: item.correo,
            movil: item.movil,
            fecha: item.fecha,
            validoHasta: item.validoHasta,
            estado: item.estado,
            moneda: item.moneda,
            descuentoTipo: item.descuentoTipo,
            descuentoValor: Number(item.descuentoValor ?? 0),
            lineas: item.lineas,
            nota: item.nota,
            terminos: item.terminos,
            estadoCliente: item.estadoCliente,
            fechaDecision: item.fechaDecision,
            firmadoPor: item.firmadoPor,
            firmanteCorreo: item.firmanteCorreo,
            lugarFirma: item.lugarFirma,
            firmaBase64: item.firmaBase64,
        };
    }

    private upsertRowFromApi(item: CrmQuoteRecord): void {
        const mapped = this.mapApiQuoteToRow(item);
        const index = this.quotesRows.findIndex((row) => row.token === mapped.token);
        if (index >= 0) {
            this.quotesRows[index] = mapped;
            return;
        }

        this.quotesRows.unshift(mapped);
    }

    private buildPublicPreview(row: QuoteRow): PublicQuotePreview {
        const prospectContact = this.resolveProspectContact(row.prospecto);
        const lines: PublicQuotePreviewLine[] = this.quoteLines.map((line) => ({
            servicio: line.servicio,
            descripcion: line.descripcion,
            cantidad: Math.max(0, Number(line.cantidad) || 0),
            unidad: line.unidad,
            precioUnitario: Math.max(0, Number(line.precioUnitario) || 0),
            impuesto: Math.max(0, Number(line.impuesto) || 0),
        }));

        return {
            token: row.token,
            codigo: row.codigo,
            prospecto: row.prospecto,
            empresa: prospectContact.empresa,
            correo: prospectContact.correo,
            movil: prospectContact.movil,
            fecha: row.fecha,
            validoHasta: row.validoHasta,
            estado: row.estado,
            moneda: this.currency,
            descuentoTipo: this.discountType,
            descuentoValor: Math.max(0, Number(this.discountValue) || 0),
            lineas: lines,
            nota: this.recipientNote.trim() || "Gracias por revisar esta cotizacion.",
            terminos: this.termsAndConditions.trim() || "Documento sujeto a aprobacion comercial.",
            estadoCliente: "Pendiente",
        };
    }

    private resolveProspectContact(prospecto: string): { empresa: string; correo: string; movil: string } {
        const match = this.findProspectByName(prospecto);
        if (match) {
            return {
                empresa: match.compania,
                correo: match.correo,
                movil: match.movil,
            };
        }

        return {
            empresa: "Empresa del prospecto",
            correo: "contacto@empresa.com",
            movil: "--",
        };
    }

    private findProspectByName(name: string): CrmProspectRecord | undefined {
        const normalized = name.trim().toLowerCase();
        if (!normalized) {
            return undefined;
        }
        return this.prospectRecords.find((prospect) => prospect.nombre.trim().toLowerCase() === normalized);
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }
        return fallback;
    }

    private getNextQuoteCode(dateValue: string): string {
        const targetSeriesPrefix = buildCommercialSeriesPrefix("quote", dateValue);
        const matchingSequences = this.quotesRows
            .filter((row) => row.codigo.startsWith(targetSeriesPrefix))
            .map((row) => Number(row.codigo.slice(targetSeriesPrefix.length)))
            .filter((sequence) => Number.isFinite(sequence) && sequence > 0);

        const nextSequence = matchingSequences.length ? Math.max(...matchingSequences) + 1 : 1;
        return buildCommercialDocumentCode("quote", nextSequence, dateValue);
    }

    private defaultValidUntil(): string {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
    }

    private formatIsoToDdMmYyyy(value: string): string {
        if (!value || value.length < 10) {
            return "";
        }
        const [yyyy, mm, dd] = value.split("-");
        return `${dd}/${mm}/${yyyy}`;
    }

    private formatDdMmYyyyToIso(value: string): string {
        if (!value || value.length < 10) {
            return this.defaultValidUntil();
        }
        const parts = value.split("/");
        if (parts.length !== 3) {
            return this.defaultValidUntil();
        }
        const [dd, mm, yyyy] = parts;
        return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    }

    private pad(value: number, size = 2): string {
        return value.toString().padStart(size, "0");
    }

    private generateProposalToken(): string {
        const chars = "abcdef0123456789";
        let token = "";

        for (let index = 0; index < 32; index += 1) {
            token += chars[Math.floor(Math.random() * chars.length)];
        }

        return token;
    }
}
