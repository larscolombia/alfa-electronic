import { CommonModule } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { firstValueFrom, take } from "rxjs";

import { FinanceAccount, FinanceAccountsStore } from "./finance-accounts.store";
import {
    BillingCatalogItem,
    BillingCurrencyCode,
    BillingDiscountMode,
    BillingInvoice,
    BillingInvoiceItem,
    BillingTaxCalculation,
    FinanceBillingStore,
    computeInvoiceSummary,
    deriveInvoiceStatus,
} from "./finance-billing.store";
import { FinanceBillingApiService, FinanceInvoiceSequencePreview } from "../../../services/finance-billing-api.service";

interface InvoiceDraft {
    seriesPrefix: string;
    sequenceNumber: number;
    /** Fase 5b: número de factura externa Oasis (persistido, editable sin bloqueo). */
    externalNumber: string;
    issueDate: string;
    dueDate: string;
    currencyCode: BillingCurrencyCode;
    exchangeRate: number;
    clientId: string;
    projectId: string;
    taxCalculation: BillingTaxCalculation;
    bankAccountId: number | null;
    generatedBy: string;
    discountValue: number;
    discountMode: BillingDiscountMode;
    shippingAddress: string;
    note: string;
    terms: string;
    attachmentName: string;
    receivedPayment: boolean;
}

@Component({
    selector: "app-finance-invoice-create",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    styles: [
        `
            .summary-grid {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 0;
                border: 1px solid rgba(15, 23, 42, 0.08);
                border-radius: 0.75rem;
                overflow: hidden;
            }

            .summary-grid > div {
                padding: 0.85rem 1rem;
                border-bottom: 1px solid rgba(15, 23, 42, 0.08);
            }

            .summary-grid > div:nth-last-child(-n + 2) {
                border-bottom: 0;
                font-weight: 700;
                background: rgba(15, 23, 42, 0.03);
            }

            .summary-grid .summary-value {
                text-align: right;
                min-width: 160px;
            }

            .address-box,
            .terms-box {
                min-height: 130px;
            }

            .upload-box {
                min-height: 120px;
                border: 1px dashed rgba(15, 23, 42, 0.18);
                border-radius: 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 1rem;
            }

            .item-amount {
                min-width: 120px;
                text-align: right;
                font-weight: 700;
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    @if (isEditing) {
                        <h5 class="mb-0">Editar factura {{ editCode }}</h5>
                        <p class="text-secondary small mb-0">Completar o corregir la información de una factura no emitida.</p>
                    } @else {
                        <h5 class="mb-0">Crear factura</h5>
                        <p class="text-secondary small mb-0">Construye facturas con detalle comercial, impuestos y adjuntos.</p>
                    }
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Financiero</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-facturacion">Facturación</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">{{ isEditing ? 'Editar factura' : 'Crear factura' }}</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (loadError) {
                <div class="alert alert-danger border">
                    {{ loadError }}
                    <a routerLink="/app/finance-facturacion" class="alert-link d-block mt-2">Volver al listado de facturas</a>
                </div>
            }

            @if (blockedInvoice) {
                <div class="alert alert-warning border">
                    <strong>La factura {{ blockedInvoiceCode }} ya fue emitida (estado: {{ blockedInvoice.status }}).</strong>
                    Una factura emitida no se edita ni se borra: la única reversa es una nota crédito desde el listado.
                    <a routerLink="/app/finance-facturacion" class="alert-link d-block mt-2">Volver al listado de facturas</a>
                </div>
            }

            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            @if (!loadError && !blockedInvoice) {

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Factura Detalles</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3">
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Número de factura</label>
                            <div class="input-group">
                                <span class="input-group-text">{{ draft.seriesPrefix }}</span>
                                <input class="form-control" type="number" min="0" [(ngModel)]="draft.sequenceNumber" name="sequenceNumber" (ngModelChange)="onSequenceNumberChange()" data-testid="invoice-sequence-input" />
                            </div>
                            <!-- Fase 6: 0 no es un número inválido, es "lo asigna el
                                 servidor al guardar". Se dice en vez de inventar uno. -->
                            @if (!draft.sequenceNumber) {
                                <div class="form-text">El numero definitivo lo asigna el servidor al guardar.</div>
                            }
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Número externo (Oasis)</label>
                            <input class="form-control" type="text" maxlength="80" placeholder="Número de la factura externa Oasis" [(ngModel)]="draft.externalNumber" name="externalNumber" data-testid="external-number-input" />
                        </div>
                        <div class="col-12 col-lg-2">
                            <label class="form-label">Fecha de la factura</label>
                            <input class="form-control" type="date" [(ngModel)]="draft.issueDate" name="issueDate" (ngModelChange)="onIssueDateChange()" />
                        </div>
                        <div class="col-12 col-lg-2">
                            <label class="form-label">Fecha de vencimiento</label>
                            <input class="form-control" type="date" [(ngModel)]="draft.dueDate" name="dueDate" />
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Moneda</label>
                            <select class="form-select" [(ngModel)]="draft.currencyCode" name="currencyCode">
                                @for (currencyOption of currencyOptions; track currencyOption.value) {
                                    <option [value]="currencyOption.value">{{ currencyOption.label }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-2">
                            <label class="form-label">Tipo de cambio</label>
                            <input class="form-control" type="number" min="0.0001" step="0.0001" [(ngModel)]="draft.exchangeRate" name="exchangeRate" />
                        </div>

                        <div class="col-12 col-lg-4">
                            <label class="form-label">Cliente</label>
                            <select class="form-select" [(ngModel)]="draft.clientId" name="clientId" (ngModelChange)="onClientChange()">
                                <option value="">--</option>
                                @for (client of clients; track client.id) {
                                    <option [value]="client.id">{{ client.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Proyecto</label>
                            <select class="form-select" [(ngModel)]="draft.projectId" name="projectId">
                                <option value="">--</option>
                                @for (project of availableProjects; track project.id) {
                                    <option [value]="project.id">{{ project.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Calcular impuesto</label>
                            <select class="form-select" [(ngModel)]="draft.taxCalculation" name="taxCalculation">
                                @for (option of taxCalculationOptions; track option) {
                                    <option [value]="option">{{ option }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-2">
                            <label class="form-label">Cuenta bancaria</label>
                            <select class="form-select" [(ngModel)]="draft.bankAccountId" name="bankAccountId">
                                <option [ngValue]="null">--</option>
                                @for (account of bankAccounts; track account.id) {
                                    <option [ngValue]="account.id">{{ bankLabel(account) }}</option>
                                }
                            </select>
                        </div>

                        <div class="col-12 col-lg-6">
                            <label class="form-label">Dirección de facturación</label>
                            <div class="address-box rounded border p-3 bg-light-subtle">{{ billingAddress }}</div>
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Dirección de envío</label>
                            <textarea class="form-control address-box" rows="5" [(ngModel)]="draft.shippingAddress" name="shippingAddress"></textarea>
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Generado por</label>
                            <select class="form-select" [(ngModel)]="draft.generatedBy" name="generatedBy">
                                @for (option of generatedByOptions; track option) {
                                    <option [value]="option">{{ option }}</option>
                                }
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end mb-3">
                        <div class="col-12 col-lg-4">
                            <label class="form-label">Seleccionar producto o servicio</label>
                            <select class="form-select" [(ngModel)]="selectedCatalogId" name="selectedCatalogId">
                                <option value="">Seleccionar producto o servicio</option>
                                @for (catalogItem of catalog; track catalogItem.id) {
                                    <option [value]="catalogItem.id">{{ catalogItem.label }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-2">
                            <button class="btn btn-outline-secondary w-100" type="button" (click)="addCatalogItem()">Agregar</button>
                        </div>
                    </div>

                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr>
                                    <th style="min-width: 320px;">Descripción</th>
                                    <th style="min-width: 120px;">Cantidad</th>
                                    <th style="min-width: 150px;">Precio unitario</th>
                                    <th style="min-width: 180px;">Impuesto</th>
                                    <th style="min-width: 240px;">Adjunto</th>
                                    <th class="text-end">Monto</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (item of items; track item.id) {
                                    <tr>
                                        <td>
                                            <input class="form-control mb-2" type="text" placeholder="Nombre del ítem" [(ngModel)]="item.name" [name]="'item-name-' + item.id" />
                                            <textarea class="form-control" rows="3" placeholder="Ingresa una descripción (opcional)" [(ngModel)]="item.description" [name]="'item-description-' + item.id"></textarea>
                                        </td>
                                        <td>
                                            <input class="form-control mb-2" type="number" min="0" step="1" [(ngModel)]="item.quantity" [name]="'item-qty-' + item.id" />
                                            <select class="form-select" [(ngModel)]="item.unitLabel" [name]="'item-unit-' + item.id">
                                                @for (unit of unitOptions; track unit) {
                                                    <option [value]="unit">{{ unit }}</option>
                                                }
                                            </select>
                                        </td>
                                        <td>
                                            <input class="form-control" type="number" min="0" step="100" [(ngModel)]="item.unitPrice" [name]="'item-price-' + item.id" />
                                        </td>
                                        <td>
                                            <select class="form-select" [(ngModel)]="item.taxRate" [name]="'item-tax-' + item.id">
                                                @for (taxOption of taxOptions; track taxOption.value) {
                                                    <option [ngValue]="taxOption.value">{{ taxOption.label }}</option>
                                                }
                                            </select>
                                        </td>
                                        <td>
                                            <input class="form-control" type="file" (change)="onItemAttachmentSelected($event, item.id)" />
                                            @if (item.attachmentName) {
                                                <small class="text-secondary d-block mt-2">{{ item.attachmentName }}</small>
                                            }
                                        </td>
                                        <td class="item-amount">{{ lineAmount(item) | currency: draft.currencyCode : "symbol" : "1.0-0" }}</td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeItem(item.id)"><i class="bi bi-x-lg"></i></button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>

                    <button class="btn btn-link px-0" type="button" (click)="addEmptyItem()"><i class="bi bi-plus-circle me-1"></i>Agregar ítem</button>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col-12 col-xl-6">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <label class="form-label">Nota Para El Destinatario</label>
                            <textarea class="form-control mb-3" rows="4" placeholder="por ejemplo, Gracias por tu negocio" [(ngModel)]="draft.note" name="note"></textarea>

                            <label class="form-label">Agregar archivo</label>
                            <div class="upload-box">
                                <div>
                                    <input class="form-control mb-3" type="file" (change)="onAttachmentSelected($event)" />
                                    <div>{{ draft.attachmentName || "Seleccionar un archivo" }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-xl-6">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <div class="row gx-3 gy-3 mb-3">
                                <div class="col-12 col-md-6">
                                    <label class="form-label">Descuento</label>
                                    <div class="input-group">
                                        <input class="form-control" type="number" min="0" step="0.01" [(ngModel)]="draft.discountValue" name="discountValue" />
                                        <select class="form-select" style="max-width: 90px;" [(ngModel)]="draft.discountMode" name="discountMode">
                                            <option value="percent">%</option>
                                            <option value="amount">COP</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6 d-flex align-items-end">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="receivedPayment" [(ngModel)]="draft.receivedPayment" name="receivedPayment" />
                                        <label class="form-check-label" for="receivedPayment">He recibido el pago</label>
                                    </div>
                                </div>
                            </div>

                            <div class="summary-grid mb-3">
                                <div>Subtotal</div>
                                <div class="summary-value">{{ summary.subtotal | currency: draft.currencyCode : "symbol" : "1.0-0" }}</div>
                                <div>Descuento</div>
                                <div class="summary-value">{{ summary.discountAmount | currency: draft.currencyCode : "symbol" : "1.0-0" }}</div>
                                <div>Impuesto</div>
                                <div class="summary-value">{{ summary.taxTotal | currency: draft.currencyCode : "symbol" : "1.0-0" }}</div>
                                <div>Total</div>
                                <div class="summary-value">{{ summary.total | currency: draft.currencyCode : "symbol" : "1.0-0" }}</div>
                            </div>

                            <label class="form-label">Términos y Condiciones</label>
                            <textarea class="form-control terms-box" rows="8" [(ngModel)]="draft.terms" name="terms"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-wrap gap-2 mb-5">
                <div class="btn-group" role="group">
                    <button class="btn btn-theme" type="button" [disabled]="isSaving" (click)="save('save')">{{ isEditing ? 'Guardar cambios' : 'Guardar' }}</button>
                    @if (!isEditing) {
                        <button class="btn btn-theme dropdown-toggle dropdown-toggle-split" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <span class="visually-hidden">Alternar opciones</span>
                        </button>
                        <ul class="dropdown-menu">
                            <li><button class="dropdown-item" type="button" (click)="save('send')">Guardar y enviar</button></li>
                            <li><button class="dropdown-item" type="button" (click)="save('sent')">Guardar y marcar como enviado</button></li>
                        </ul>
                    }
                </div>
                @if (!isEditing) {
                    <button class="btn btn-outline-secondary" type="button" (click)="save('draft')">Guardar Como Borrador</button>
                } @else {
                    <a class="btn btn-outline-secondary" routerLink="/app/finance-facturacion"><i class="bi bi-printer me-1"></i>Imprimir desde el listado</a>
                }
                <a class="btn btn-link" routerLink="/app/finance-facturacion">Cancelar</a>
            </div>

            }
    `,
})
export class FinanceInvoiceCreateComponent implements OnDestroy {
    readonly clients = FinanceBillingStore.getClients();
    // Fase 6: el catálogo se construye desde los maestros de equipos, que ahora
    // vienen del servidor. Como getter (no como campo) se re-lee cuando
    // ensureLoaded() termina; capturado una sola vez quedaría vacío.
    get catalog() {
        return FinanceBillingStore.getCatalog();
    }
    readonly taxOptions = FinanceBillingStore.getTaxOptions();
    readonly currencyOptions = FinanceBillingStore.getCurrencyOptions();
    readonly taxCalculationOptions = FinanceBillingStore.getTaxCalculationOptions();
    readonly generatedByOptions = FinanceBillingStore.getGeneratedByOptions();
    readonly unitOptions = FinanceBillingStore.getUnitOptions();
    bankAccounts: FinanceAccount[] = FinanceAccountsStore.getAccounts();

    draft = this.createDraft();
    items: BillingInvoiceItem[] = [this.createEmptyItem()];
    selectedCatalogId = "";
    formError = "";
    private itemSequence = 0;

    isSaving = false;

    // ── Modo edición (/app/finance-facturacion/editar/:id) ────────────────
    /** 0 = creación. >0 = factura existente cargada desde el servidor. */
    editingInvoiceId = 0;
    /** Registro original tal como vino del servidor (para conservar source, tipo de doc, etc.). */
    private originalRecord: BillingInvoice | null = null;
    loadError = "";
    /** Factura emitida/bloqueada: la única reversa es nota crédito. */
    blockedInvoice: BillingInvoice | null = null;

    get isEditing(): boolean {
        return this.editingInvoiceId > 0;
    }

    get editCode(): string {
        if (!this.isEditing) {
            return "";
        }
        return FinanceBillingStore.buildInvoiceCode(this.draft.seriesPrefix, this.draft.sequenceNumber);
    }

    /** Código legible de la factura bloqueada (solo se muestra en el estado de bloqueo). */
    get blockedInvoiceCode(): string {
        if (!this.blockedInvoice) {
            return "";
        }
        return FinanceBillingStore.buildInvoiceCode(this.blockedInvoice.seriesPrefix, this.blockedInvoice.sequenceNumber);
    }

    /**
     * Fase 6: true sólo si el usuario editó a mano el número de factura. Mientras
     * sea false se envía sequenceNumber 0 y el servidor asigna el consecutivo de
     * forma atómica, que es lo que evita que dos usuarios reciban el mismo.
     */
    private sequenceOverriddenByUser = false;

    private readonly accountsUnsubscribe: () => void;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly financeBillingApi: FinanceBillingApiService,
    ) {
        this.accountsUnsubscribe = FinanceAccountsStore.subscribe(() => {
            this.bankAccounts = FinanceAccountsStore.getAccounts();
        });
        void FinanceAccountsStore.ensureLoaded();

        // Modo edición: /app/finance-facturacion/editar/:id. El registro se
        // precarga del servidor; el PUT (no POST) es la única puerta de escritura.
        const rawId = this.route.snapshot.paramMap.get("id") || "";
        const parsedId = Number.parseInt(rawId, 10);
        if (Number.isFinite(parsedId) && parsedId > 0) {
            this.editingInvoiceId = parsedId;
            void this.loadEditRecord();
        }

        // Recalcula prefijo/consecutivo cuando la caché de facturas del
        // servidor esté disponible (el consecutivo en servidor es Fase 6).
        // En modo edición NO: el número ya fue asignado por el servidor y no
        // se re-deriva al abrir la ficha.
        void FinanceBillingStore.ensureLoaded().then(() => {
            if (this.editingInvoiceId <= 0) {
                this.onIssueDateChange();
            }
        });
    }

    ngOnDestroy(): void {
        this.accountsUnsubscribe();
    }

    /**
     * Modo edición: precarga la factura desde el servidor (GET) y llena draft +
     * ítems. Si ya fue emitida (Enviado/Pagado/Pago parcial → locked), NO se
     * muestra formulario editable: la única reversa es nota crédito. La misma
     * regla vive en el backend; esto solo evita ofrecer un botón que daría 409.
     */
    private async loadEditRecord(): Promise<void> {
        try {
            const record = (await firstValueFrom(this.financeBillingApi.getInvoice(this.editingInvoiceId))) as BillingInvoice;

            if (record.locked || record.status === "Enviado" || record.status === "Pagado" || record.status === "Pago parcial") {
                this.blockedInvoice = record;
                return;
            }

            const today = new Date().toISOString().slice(0, 10);
            this.originalRecord = record;
            this.draft.seriesPrefix = record.seriesPrefix || "";
            this.draft.sequenceNumber = Math.max(record.sequenceNumber || 0, 0);
            // El número ya existe: se trata como override explícito para que
            // save() lo mande tal cual y no pida uno nuevo al servidor.
            this.sequenceOverriddenByUser = true;
            this.draft.externalNumber = record.externalNumber || "";
            this.draft.issueDate = record.issueDate || today;
            this.draft.dueDate = record.dueDate || "";
            this.draft.currencyCode = (record.currencyCode as BillingCurrencyCode) || "COP";
            this.draft.exchangeRate = record.exchangeRate > 0 ? record.exchangeRate : 1;
            this.draft.clientId = record.clientId || "";
            this.draft.projectId = record.projectId || "";
            this.draft.taxCalculation = (record.taxCalculation as BillingTaxCalculation) || "Despues del descuento";
            this.draft.bankAccountId = record.bankAccountId ?? null;
            this.draft.generatedBy =
                record.generatedBy && this.generatedByOptions.includes(record.generatedBy) ? record.generatedBy : this.generatedByOptions[0];
            this.draft.discountValue = Math.max(record.discountValue || 0, 0);
            this.draft.discountMode = (record.discountMode as BillingDiscountMode) || "percent";
            this.draft.shippingAddress = record.shippingAddress || "";
            this.draft.note = record.note || "";
            this.draft.terms = record.terms ?? FinanceBillingStore.getDefaultTerms();
            this.draft.attachmentName = record.attachmentName || "";
            const total = Math.max(record.total || 0, 0);
            this.draft.receivedPayment = total > 0 && (record.paidAmount || 0) >= total;

            const loadedItems: BillingInvoiceItem[] = Array.isArray(record.items)
                ? record.items.map((item) => ({ ...item, id: item.id || this.buildItemId() }))
                : [];
            this.items = loadedItems.length > 0 ? loadedItems : [this.createEmptyItem()];
        } catch (error) {
            this.loadError = error instanceof Error && error.message ? error.message : "No se pudo cargar la factura para editarla.";
        }
    }

    get availableProjects() {
        return FinanceBillingStore.getProjects(this.draft.clientId || undefined);
    }

    get billingAddress(): string {
        return FinanceBillingStore.findClient(this.draft.clientId)?.billingAddress || "Selecciona un cliente para mostrar la dirección de facturación.";
    }

    get summary() {
        return computeInvoiceSummary(this.items, this.draft.discountValue, this.draft.discountMode, this.draft.taxCalculation);
    }

    onClientChange(): void {
        const selectedClient = FinanceBillingStore.findClient(this.draft.clientId);
        if (!selectedClient) {
            this.draft.projectId = "";
            this.draft.shippingAddress = "";
            return;
        }

        this.draft.shippingAddress = selectedClient.shippingAddress;
        if (!this.availableProjects.some((project) => project.id === this.draft.projectId)) {
            this.draft.projectId = this.availableProjects[0]?.id || "";
        }
    }

    onIssueDateChange(): void {
        // Modo edición: prefijo y consecutivo ya fueron asignados por el servidor
        // para esta factura; cambiar la fecha no debe re-derivarlos (pisaría un
        // override manual tipo Oasis).
        if (this.editingInvoiceId > 0) {
            return;
        }
        const issueDate = this.draft.issueDate || new Date().toISOString().slice(0, 10);
        this.draft.seriesPrefix = FinanceBillingStore.getInvoiceSeriesPrefix(issueDate);
        // Fase 6: el consecutivo lo previsualiza el servidor. Antes salía de
        // MAX()+1 sobre la caché local, o sea el mismo número para dos usuarios.
        this.sequenceOverriddenByUser = false;
        this.draft.sequenceNumber = 0;
        this.loadSequencePreview(issueDate);
    }

    /**
     * Rellena el campo con lo que el servidor asignaría, SIN reservarlo. Si la
     * llamada falla el campo queda en 0 (= "lo asigna el servidor al guardar"),
     * que es honesto; mostrar un número calculado en el navegador no lo es.
     */
    private loadSequencePreview(issueDate: string): void {
        this.financeBillingApi
            .peekInvoiceSequence(issueDate)
            .pipe(take(1))
            .subscribe({
                next: (preview: FinanceInvoiceSequencePreview) => {
                    // Si el usuario ya cambió la fecha o editó el número, no lo
                    // pisamos con una respuesta que llegó tarde.
                    if (this.sequenceOverriddenByUser || (this.draft.issueDate || "") !== issueDate) {
                        return;
                    }
                    this.draft.seriesPrefix = preview.seriesPrefix || this.draft.seriesPrefix;
                    this.draft.sequenceNumber = preview.sequenceNumber;
                },
                error: () => {
                    this.draft.sequenceNumber = 0;
                },
            });
    }

    /** El usuario editó el número a mano: se respeta como override explícito. */
    onSequenceNumberChange(): void {
        this.sequenceOverriddenByUser = true;
    }

    addCatalogItem(): void {
        const selectedCatalogItem = this.catalog.find((catalogItem) => catalogItem.id === this.selectedCatalogId);
        if (!selectedCatalogItem) {
            return;
        }

        this.items = [
            ...this.items,
            {
                id: this.buildItemId(),
                name: selectedCatalogItem.label,
                description: selectedCatalogItem.description,
                quantity: 1,
                unitLabel: selectedCatalogItem.unitLabel,
                unitPrice: selectedCatalogItem.unitPrice,
                taxRate: selectedCatalogItem.taxRate,
                attachmentName: "",
            },
        ];
        this.selectedCatalogId = "";
    }

    addEmptyItem(): void {
        this.items = [...this.items, this.createEmptyItem()];
    }

    removeItem(itemId: string): void {
        if (this.items.length === 1) {
            this.items = [this.createEmptyItem()];
            return;
        }

        this.items = this.items.filter((item) => item.id !== itemId);
    }

    lineAmount(item: BillingInvoiceItem): number {
        return Math.max(item.quantity || 0, 0) * Math.max(item.unitPrice || 0, 0);
    }

    bankLabel(account: FinanceAccount): string {
        return `${account.bankName} - ${account.accountNumber}`;
    }

    onItemAttachmentSelected(event: Event, itemId: string): void {
        const file = (event.target as HTMLInputElement).files?.item(0);
        this.items = this.items.map((item) => (item.id === itemId ? { ...item, attachmentName: file?.name || "" } : item));
    }

    onAttachmentSelected(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.item(0);
        this.draft.attachmentName = file?.name || "";
    }

    async save(action: "save" | "draft" | "send" | "sent"): Promise<void> {
        this.formError = "";
        if (this.isSaving) {
            return;
        }
        const selectedClient = FinanceBillingStore.findClient(this.draft.clientId);

        if (!selectedClient) {
            this.formError = "Debes seleccionar un cliente.";
            return;
        }

        const sanitizedItems = this.items.filter((item) => item.name.trim().length > 0 && item.quantity > 0);
        if (sanitizedItems.length === 0) {
            this.formError = "Debes agregar al menos un ítem válido.";
            return;
        }

        const selectedProject = FinanceBillingStore.findProject(this.draft.projectId);
        const selectedAccount = this.bankAccounts.find((account) => account.id === this.draft.bankAccountId);
        const summary = computeInvoiceSummary(sanitizedItems, this.draft.discountValue, this.draft.discountMode, this.draft.taxCalculation);
        const paidAmount = this.draft.receivedPayment ? summary.total : 0;
        const preferredStatus = action === "draft" ? "Borrador" : action === "save" ? undefined : "Enviado";

        const invoice: BillingInvoice = {
            id: FinanceBillingStore.getNextInvoiceId(),
            referenceCode: "--",
            seriesPrefix: this.draft.seriesPrefix,
            // Fase 6: 0 = "asignalo vos, servidor". Sólo se manda un número
            // explícito si el usuario lo editó a mano (override estilo Oasis);
            // mandar el preview sería reintroducir la colisión entre usuarios.
            sequenceNumber: this.sequenceOverriddenByUser ? this.draft.sequenceNumber : 0,
            projectId: selectedProject?.id || "",
            projectName: selectedProject?.name || "--",
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            billingAddress: selectedClient.billingAddress,
            shippingAddress: this.draft.shippingAddress.trim() || selectedClient.shippingAddress,
            issueDate: this.draft.issueDate,
            dueDate: this.draft.dueDate,
            currencyCode: this.draft.currencyCode,
            exchangeRate: this.draft.exchangeRate,
            bankAccountId: this.draft.bankAccountId,
            bankAccountName: selectedAccount ? this.bankLabel(selectedAccount) : "--",
            taxCalculation: this.draft.taxCalculation,
            generatedBy: this.draft.generatedBy,
            items: sanitizedItems,
            discountValue: this.draft.discountValue,
            discountMode: this.draft.discountMode,
            subtotal: summary.subtotal,
            taxTotal: summary.taxTotal,
            total: summary.total,
            paidAmount,
            balanceAmount: Math.max(summary.total - paidAmount, 0),
            status: deriveInvoiceStatus(summary.total, paidAmount, preferredStatus),
            note: this.draft.note.trim(),
            terms: this.draft.terms.trim(),
            attachmentName: this.draft.attachmentName,
            receivedPayment: this.draft.receivedPayment,
            source: "manual",
            externalNumber: this.draft.externalNumber.trim(),
            createdAt: new Date().toISOString(),
        };

        try {
            this.isSaving = true;
            if (this.editingInvoiceId > 0) {
                // Modo edición: PUT a la misma factura. Se conservan los campos
                // que el servidor fija o que no toca el formulario (identidad,
                // origen, tipo de documento); generated_by lo conserva el backend.
                const original = this.originalRecord;
                const payload: BillingInvoice = {
                    ...invoice,
                    id: this.editingInvoiceId,
                    referenceCode: original?.referenceCode || invoice.referenceCode,
                    createdAt: original?.createdAt || invoice.createdAt,
                    source: original?.source || "manual",
                    documentType: original?.documentType || "factura",
                    creditNoteRef: original?.creditNoteRef ?? null,
                    sourceQuoteId: original?.sourceQuoteId || "",
                };
                const updated = await firstValueFrom(this.financeBillingApi.updateInvoice(this.editingInvoiceId, payload));
                // Se cachea lo que devolvió el servidor y se reemplaza en la lista.
                FinanceBillingStore.saveInvoices(
                    FinanceBillingStore.getInvoices().map((existing) => (existing.id === this.editingInvoiceId ? ({ ...existing, ...updated } as BillingInvoice) : existing)),
                );
            } else {
                // Fase 6: se cachea la factura QUE DEVOLVIO EL SERVIDOR, no el objeto
                // local. El local viaja con sequenceNumber 0 (asignación automática),
                // así que cachearlo pintaría "FAC-2026-000" en el listado.
                const created = await firstValueFrom(this.financeBillingApi.createInvoice(invoice));
                FinanceBillingStore.addInvoice({ ...invoice, ...created } as BillingInvoice);
            }
            void this.router.navigateByUrl("/app/finance-facturacion");
        } catch (error) {
            this.formError = error instanceof Error ? error.message : "No se pudo guardar la factura.";
        } finally {
            this.isSaving = false;
        }
    }

    private createDraft(): InvoiceDraft {
        const today = new Date().toISOString().slice(0, 10);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15);

        return {
            seriesPrefix: FinanceBillingStore.getInvoiceSeriesPrefix(today),
            // Fase 6: arranca en 0 (= "lo asigna el servidor"). onIssueDateChange
            // lo rellena con la previsualización del servidor al iniciar.
            sequenceNumber: 0,
            externalNumber: "",
            issueDate: today,
            dueDate: dueDate.toISOString().slice(0, 10),
            currencyCode: "COP",
            exchangeRate: 1,
            clientId: "",
            projectId: "",
            taxCalculation: "Despues del descuento",
            bankAccountId: null,
            generatedBy: this.generatedByOptions[0],
            discountValue: 0,
            discountMode: "percent",
            shippingAddress: "",
            note: "",
            terms: FinanceBillingStore.getDefaultTerms(),
            attachmentName: "",
            receivedPayment: false,
        };
    }

    private createEmptyItem(): BillingInvoiceItem {
        return {
            id: this.buildItemId(),
            name: "",
            description: "",
            quantity: 1,
            unitLabel: "Unidad",
            unitPrice: 0,
            taxRate: 0,
            attachmentName: "",
        };
    }

    private buildItemId(): string {
        this.itemSequence += 1;
        return `invoice-item-${Date.now()}-${this.itemSequence}`;
    }
}