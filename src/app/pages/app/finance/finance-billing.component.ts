import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { BillingClient, BillingInvoice, FinanceBillingStore, resolveStoredClientId } from "./finance-billing.store";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
import { CompanyProfile, CompanySettingsApiService } from "../../../services/company-settings-api.service";
import { resolveApiBaseUrl } from "../../../services/api-base-url.util";

@Component({
    selector: "app-finance-billing",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    styles: [
        `
            .billing-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 0.75rem;
            }

            .status-dot {
                display: inline-block;
                width: 0.75rem;
                height: 0.75rem;
                border-radius: 999px;
                margin-right: 0.45rem;
                vertical-align: middle;
            }

            .status-dot--paid {
                background: #1f9d55;
            }

            .status-dot--partial {
                background: #2563eb;
            }

            .status-dot--pending {
                background: #f59e0b;
            }

            .status-dot--cancelled {
                background: #dc2626;
            }

            .status-dot--draft {
                background: #6b7280;
            }

            .status-dot--sent {
                background: #7c3aed;
            }

            .client-avatar {
                width: 2.35rem;
                height: 2.35rem;
                border-radius: 999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(var(--adminuiux-theme-1-rgb), 0.12);
                color: var(--adminuiux-theme-1);
                font-weight: 700;
            }

            .invoice-total-line {
                line-height: 1.4;
            }

            .invoice-total-line strong,
            .invoice-total-line span {
                display: block;
            }

            .invoice-actions .dropdown-toggle::after {
                display: none;
            }

            /* Impresión de factura: mismo patrón que remisiones (.print-area). */
            .invoice-print-backdrop {
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

            .invoice-print-modal {
                width: 900px;
                max-width: 100%;
                background: #fff;
            }

            .print-invoice-table th,
            .print-invoice-table td {
                vertical-align: top;
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

                .invoice-print-backdrop {
                    position: static;
                    background: none;
                    padding: 0;
                }
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col-12 col-sm-auto text-sm-end">
                    <div class="billing-toolbar justify-content-sm-end">
                        <button class="btn btn-sm btn-outline-success me-2" (click)="exportCSV()" data-testid="export-csv-btn">
                            <i class="bi bi-filetype-csv me-1"></i>Exportar CSV (Oasis)
                        </button>
                        <button class="btn btn-sm btn-outline-primary me-2" (click)="exportTXT()" data-testid="export-txt-btn">
                            <i class="bi bi-filetype-txt me-1"></i>Exportar TXT (Oasis)
                        </button>
                        <a class="btn btn-theme" routerLink="/app/finance-facturacion-crear"><i class="bi bi-plus-lg me-1"></i>Crear Factura</a>
                        <a class="btn btn-outline-secondary" routerLink="/app/finance-facturacion-recurrentes"><i class="bi bi-arrow-repeat me-1"></i>Factura Recurrente</a>
                        <a class="btn btn-outline-secondary" routerLink="/app/finance-facturacion-tiempo"><i class="bi bi-plus-lg me-1"></i>Crear Registro De Tiempo Factura</a>
                        <button class="btn btn-outline-secondary" type="button" (click)="exportInvoices()"><i class="bi bi-file-earmark-arrow-down me-1"></i>Exportar</button>
                    </div>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Financiero</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Facturación</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }
            @if (errorMessage) {
                <div class="alert alert-danger border mb-3" data-testid="billing-error">{{ errorMessage }}</div>
            }

            <div class="card adminuiux-card mb-3">
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end">
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Cliente</label>
                            <select class="form-select" [(ngModel)]="clientFilter" (ngModelChange)="refreshFilteredInvoices()">
                                <option value="">Todos</option>
                                @for (client of clients; track client.id) {
                                    <option [value]="client.id">{{ client.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Estado</label>
                            <select class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="refreshFilteredInvoices()">
                                <option value="">Todos</option>
                                @for (status of statuses; track status) {
                                    <option [value]="status">{{ status }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-4">
                            <label class="form-label">Buscar</label>
                            <input class="form-control" type="search" placeholder="Empieza a escribir para buscar" [(ngModel)]="searchTerm" (ngModelChange)="refreshFilteredInvoices()" />
                        </div>
                        <div class="col-12 col-lg-2 text-lg-end">
                            <button class="btn btn-outline-secondary w-100" type="button" (click)="clearFilters()">Limpiar filtros</button>
                        </div>
                    </div>
                    <div class="row gx-3 gy-3 align-items-end mt-1">
                        <div class="col-12 col-lg-3">
                            <label class="form-label" for="exportFrom">Export Oasis desde</label>
                            <input id="exportFrom" class="form-control" type="date" [(ngModel)]="exportFrom" data-testid="export-from-input" />
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label" for="exportTo">Export Oasis hasta</label>
                            <input id="exportTo" class="form-control" type="date" [(ngModel)]="exportTo" data-testid="export-to-input" />
                        </div>
                        <div class="col-12 col-lg-6">
                            <p class="small text-secondary mb-0">Los botones CSV y TXT descargan el archivo plano 961 filtrado por el rango de fechas de emision.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Factura</th>
                                    <th>Proyecto</th>
                                    <th>Cliente</th>
                                    <th>Total</th>
                                    <th>Fecha de la factura</th>
                                    <th>Estado</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (invoice of filteredInvoices; track invoice.id) {
                                    <tr>
                                        <td>{{ invoice.referenceCode || "--" }}</td>
                                        <td>
                                            <strong>{{ invoiceCode(invoice) }}</strong>
                                            @if ((invoice.documentType || "factura") === "nota_credito") {
                                                <span class="badge text-bg-warning ms-1">NC</span>
                                            }
                                            @if (invoice.externalNumber) {
                                                <small class="text-secondary d-block">Ext: {{ invoice.externalNumber }}</small>
                                            }
                                        </td>
                                        <td>{{ invoice.projectName || "--" }}</td>
                                        <td>
                                            <div class="d-flex align-items-center gap-2">
                                                <div class="client-avatar">{{ initialsOf(invoice.clientName) }}</div>
                                                <div>
                                                    <strong class="d-block">{{ invoice.clientName }}</strong>
                                                    <small class="text-secondary">{{ invoice.billingAddress }}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="invoice-total-line text-end">
                                                <strong>Total: {{ invoice.total | currency: invoice.currencyCode : "symbol" : "1.0-0" }}</strong>
                                                <span class="text-success">Pagado: {{ invoice.paidAmount | currency: invoice.currencyCode : "symbol" : "1.0-0" }}</span>
                                                <span class="text-danger">No pagado: {{ invoice.balanceAmount | currency: invoice.currencyCode : "symbol" : "1.0-0" }}</span>
                                            </div>
                                        </td>
                                        <td>{{ invoice.issueDate | date: "dd/MM/yyyy" }}</td>
                                        <td>
                                            <span [class]="statusClass(invoice.status)"></span>{{ invoice.status }}
                                            @if (invoice.locked) {
                                                <i class="bi bi-lock-fill ms-1 text-secondary" title="Factura emitida: no hay reversa; la única vía es una nota crédito" data-testid="invoice-locked-icon"></i>
                                            }
                                        </td>
                                        <td class="text-end invoice-actions">
                                            <div class="dropdown d-inline-block">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" [id]="'invoice-actions-' + invoice.id" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-end" [attr.aria-labelledby]="'invoice-actions-' + invoice.id">
                                                    <li>
                                                        <button class="dropdown-item" type="button" (click)="openPrintView(invoice)" data-testid="print-invoice-action"><i class="bi bi-printer me-2"></i>Imprimir</button>
                                                    </li>
                                                    <li><hr class="dropdown-divider" /></li>
                                                    <li>
                                                        <button class="dropdown-item" type="button" [disabled]="invoice.locked" (click)="editInvoice(invoice.id)" data-testid="edit-invoice-action"
                                                            [title]="invoice.locked ? 'Factura emitida: no hay reversa; use nota crédito' : ''"><i class="bi bi-pencil me-2"></i>Editar</button>
                                                    </li>
                                                    <li><hr class="dropdown-divider" /></li>
                                                    <li><button class="dropdown-item" type="button" (click)="duplicateInvoice(invoice.id)">Duplicar factura</button></li>
                                                    <li>
                                                        <button class="dropdown-item" type="button" [disabled]="invoice.locked" (click)="markStatus(invoice.id, 'Pagado')"
                                                            [title]="invoice.locked ? 'Factura emitida: no hay reversa; use nota crédito' : ''">Marcar como pagada</button>
                                                    </li>
                                                    <li>
                                                        <button class="dropdown-item" type="button" [disabled]="invoice.locked" (click)="markStatus(invoice.id, 'Cancelado')"
                                                            [title]="invoice.locked ? 'Factura emitida: no hay reversa; use nota crédito' : ''">Marcar como cancelada</button>
                                                    </li>
                                                    <li>
                                                        <button class="dropdown-item" type="button" [disabled]="!canCreateCreditNote(invoice)" (click)="openCreditNoteModal(invoice)" data-testid="credit-note-action">Nota crédito</button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="8" class="text-center text-secondary py-5">No hay facturas para los filtros aplicados.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            @if (printTarget) {
                <div class="invoice-print-backdrop" data-testid="invoice-print-modal">
                    <div class="invoice-print-modal card shadow">
                        <div class="card-header d-flex justify-content-between align-items-center no-print">
                            <h5 class="mb-0">Vista de impresión — {{ invoiceCode(printTarget) }}</h5>
                            <div>
                                <button class="btn btn-sm btn-theme me-2" type="button" (click)="printInvoiceDocument()" data-testid="print-invoice-btn"><i class="bi bi-printer me-1"></i>Imprimir / Guardar PDF</button>
                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="closePrintView()"><i class="bi bi-x-lg"></i> Cerrar</button>
                            </div>
                        </div>
                        <div class="card-body print-area">
                            <!-- Emisor: identidad de la empresa configurable en /app/company-profile.
                                 Antes el papel solo mostraba al cliente, sin ningun emisor. -->
                            @if (companyProfile) {
                                <div class="d-flex align-items-start gap-3 border-bottom pb-3 mb-4">
                                    @if (companyProfile.logoDataUrl) {
                                        <img [src]="companyProfile.logoDataUrl" alt="" style="max-height: 60px; max-width: 140px; object-fit: contain;" />
                                    }
                                    <div>
                                        <h5 class="mb-1">{{ companyProfile.name }}</h5>
                                        @for (line of issuerContactLines; track $index) {
                                            <div class="small text-secondary">{{ line }}</div>
                                        }
                                    </div>
                                </div>
                            }

                            <!-- Cabecera del documento -->
                            <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                                <div>
                                    <h2 class="mb-1">{{ (printTarget.documentType || 'factura') === 'nota_credito' ? 'NOTA CRÉDITO' : 'FACTURA' }}</h2>
                                    @if (printTarget.externalNumber) {
                                        <div class="text-secondary">Número externo (Oasis): <strong>{{ printTarget.externalNumber }}</strong></div>
                                    }
                                </div>
                                <div class="text-end">
                                    <div><strong>{{ invoiceCode(printTarget) }}</strong></div>
                                    <div>Estado: {{ printTarget.status }}</div>
                                    @if (printTarget.creditNoteRef) {
                                        <div>Origen: factura #{{ printTarget.creditNoteRef }}</div>
                                    }
                                </div>
                            </div>

                            <!-- Fechas / moneda -->
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <div><strong>Fecha de emisión:</strong> {{ printTarget.issueDate || '—' }}</div>
                                    <div><strong>Vencimiento:</strong> {{ printTarget.dueDate || '—' }}</div>
                                </div>
                                <div class="col-md-6 text-md-end">
                                    <div><strong>Moneda:</strong> {{ printTarget.currencyCode }}</div>
                                    @if (printTarget.exchangeRate && printTarget.exchangeRate !== 1) {
                                        <div>Tipo de cambio: {{ printTarget.exchangeRate }}</div>
                                    }
                                </div>
                            </div>

                            <!-- Cliente -->
                            <div class="row gx-4 mb-4">
                                <div class="col-md-6">
                                    <div class="text-secondary small text-uppercase">Facturar a</div>
                                    <strong>{{ printTarget.clientName }}</strong>
                                    @if (printTarget.billingAddress) {
                                        <div class="small" style="white-space: pre-line;">{{ printTarget.billingAddress }}</div>
                                    }
                                </div>
                                <div class="col-md-6">
                                    <div class="text-secondary small text-uppercase">Entregar a</div>
                                    <strong>{{ printTarget.shippingAddress || '—' }}</strong>
                                </div>
                            </div>

                            @if (printTarget.projectName && printTarget.projectName !== '--') {
                                <div class="mb-4"><strong>Proyecto:</strong> {{ printTarget.projectName }}</div>
                            }
                            @if (printTarget.bankAccountName && printTarget.bankAccountName !== '--') {
                                <div class="mb-4"><strong>Cuenta bancaria:</strong> {{ printTarget.bankAccountName }}</div>
                            }

                            <!-- Ítems -->
                            <table class="table table-bordered print-invoice-table align-middle mb-2">
                                <thead>
                                    <tr class="bg-light-subtle">
                                        <th style="width: 40%;">Descripción</th>
                                        <th class="text-end" style="min-width: 90px;">Cantidad</th>
                                        <th class="text-end" style="min-width: 120px;">Precio unitario</th>
                                        <th class="text-end" style="min-width: 80px;">Impuesto</th>
                                        <th class="text-end" style="min-width: 130px;">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (item of printTarget.items; track item.id) {
                                        <tr>
                                            <td>
                                                {{ item.name }}
                                                @if (item.description) {
                                                    <div class="small text-secondary">{{ item.description }}</div>
                                                }
                                            </td>
                                            <td class="text-end">{{ item.quantity }} {{ item.unitLabel || '' }}</td>
                                            <td class="text-end">{{ item.unitPrice | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</td>
                                            <td class="text-end">{{ item.taxRate ? item.taxRate + '%' : '—' }}</td>
                                            <td class="text-end"><strong>{{ (item.quantity * item.unitPrice) | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</strong></td>
                                        </tr>
                                    }
                                </tbody>
                            </table>

                            <!-- Totales -->
                            <div class="row justify-content-end">
                                <div class="col-md-5">
                                    <div class="d-flex justify-content-between py-1"><span>Subtotal</span><span>{{ printTarget.subtotal | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</span></div>
                                    @if (printTarget.discountValue > 0) {
                                        <div class="d-flex justify-content-between py-1"><span>Descuento ({{ printTarget.discountMode === 'percent' ? '%' : 'valor' }})</span><span>{{ discountLabel(printTarget) }}</span></div>
                                    }
                                    <div class="d-flex justify-content-between py-1"><span>Impuesto</span><span>{{ printTarget.taxTotal | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</span></div>
                                    <div class="d-flex justify-content-between border-top pt-2 mt-1 fw-bold" style="font-size: 1.1rem;"><span>Total</span><span>{{ printTarget.total | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</span></div>
                                    <div class="d-flex justify-content-between py-1"><span>Abonado</span><span>{{ printTarget.paidAmount | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</span></div>
                                    <div class="d-flex justify-content-between py-1 text-secondary"><span>Saldo pendiente</span><span>{{ printTarget.balanceAmount | currency : printTarget.currencyCode : "symbol" : "1.0-0" }}</span></div>
                                </div>
                            </div>

                            <!-- Notas y términos -->
                            @if (printTarget.note) {
                                <div class="mt-4">
                                    <strong>Nota para el destinatario</strong>
                                    <p class="small mb-1" style="white-space: pre-line;">{{ printTarget.note }}</p>
                                </div>
                            }
                            @if (printTarget.terms) {
                                <div class="mt-3">
                                    <strong>Términos y condiciones</strong>
                                    <p class="small mb-0" style="white-space: pre-line;">{{ printTarget.terms }}</p>
                                </div>
                            }

                            @if (printTarget.attachmentName) {
                                <div class="mt-3 small text-secondary">Adjunto registrado: {{ printTarget.attachmentName }}</div>
                            }
                        </div>
                    </div>
                </div>
            }

            @if (creditNoteTarget) {
                <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Nota crédito contra {{ invoiceCode(creditNoteTarget) }}</h5>
                                <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeCreditNoteModal()"></button>
                            </div>
                            <div class="modal-body">
                                <p class="text-secondary small mb-3">
                                    Saldo pendiente: {{ creditNoteTarget.balanceAmount | currency: creditNoteTarget.currencyCode : "symbol" : "1.0-0" }}.
                                    La nota crédito descuenta el saldo de la factura y no puede excederlo. Una factura emitida no se edita ni se borra: esta es la única reversa.
                                </p>
                                @if (creditNoteError) {
                                    <div class="alert alert-danger border mb-3" data-testid="credit-note-error">{{ creditNoteError }}</div>
                                }
                                <div class="mb-3">
                                    <label class="form-label" for="creditNoteAmount">Valor de la nota crédito</label>
                                    <input id="creditNoteAmount" class="form-control" type="number" min="0.01" step="0.01" [(ngModel)]="creditNoteAmount" name="creditNoteAmount" data-testid="credit-note-amount" />
                                </div>
                                <div class="mb-3">
                                    <label class="form-label" for="creditNoteNote">Motivo (opcional)</label>
                                    <textarea id="creditNoteNote" class="form-control" rows="3" [(ngModel)]="creditNoteNote" name="creditNoteNote" data-testid="credit-note-note"></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" (click)="closeCreditNoteModal()">Cancelar</button>
                                <button type="button" class="btn btn-theme" [disabled]="isSavingCreditNote" (click)="submitCreditNote()" data-testid="credit-note-submit">Emitir nota crédito</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-backdrop fade show"></div>
            }
        </div>
    `,
})
export class FinanceBillingComponent implements OnInit {
    // Getter (no campo): se re-lee cuando ensureLoaded() termina; capturado
    // una sola vez el filtro no vería los clientes reales del CRM.
    get clients(): BillingClient[] {
        return FinanceBillingStore.getClients();
    }
    readonly statuses = ["Borrador", "Pendiente", "Pago parcial", "Pagado", "Cancelado", "Enviado"] as const;

    invoices: BillingInvoice[] = [];
    filteredInvoices: BillingInvoice[] = [];
    clientFilter = "";
    statusFilter = "";
    searchTerm = "";
    message = "";
    errorMessage = "";
    exportFrom = "";
    exportTo = "";
    // Vista de impresión: la factura a renderizar en el modal imprimible.
    printTarget: BillingInvoice | null = null;

    /** Identidad de la empresa para el papel impreso; null si el GET fallo. */
    companyProfile: CompanyProfile | null = null;

    // Fase 5b: nota crédito (única reversa de una factura emitida/bloqueada).
    creditNoteTarget: BillingInvoice | null = null;
    creditNoteAmount = 0;
    creditNoteNote = "";
    creditNoteError = "";
    isSavingCreditNote = false;
    private apiBaseUrl = resolveApiBaseUrl();

    constructor(
        private readonly financeBillingApi: FinanceBillingApiService,
        private readonly companySettingsApi: CompanySettingsApiService,
        private readonly router: Router,
        private readonly changeDetector: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        setTimeout(() => void this.loadInvoices());

        // Solo se usa al imprimir; si el GET falla la factura sigue imprimible (sin emisor).
        this.companySettingsApi.getProfile().subscribe({
            next: (profile) => {
                this.companyProfile = profile;
                this.changeDetector.detectChanges();
            },
            error: () => undefined,
        });
    }

    /** Lineas de contacto del emisor en el papel impreso. */
    get issuerContactLines(): string[] {
        if (!this.companyProfile) {
            return [];
        }
        const lines: string[] = [];
        if (this.companyProfile.nit.trim()) {
            lines.push(`NIT: ${this.companyProfile.nit}`);
        }
        if (this.companyProfile.address.trim()) {
            lines.push(this.companyProfile.address);
        }
        if (this.companyProfile.phone.trim()) {
            lines.push(this.companyProfile.phone);
        }
        if (this.companyProfile.email.trim()) {
            lines.push(this.companyProfile.email);
        }
        return lines;
    }

    refreshFilteredInvoices(): void {
        const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();
        this.filteredInvoices = this.invoices.filter((invoice) => {
            // Comparación con ids canónicos: las facturas históricas guardan
            // 'crm-client-<uuid>' y el catálogo usa '<uuid>'; normalizar ambos
            // lados evita que el filtro por cliente no encuentre nada.
            const matchesClient =
                !this.clientFilter || resolveStoredClientId(invoice.clientId) === resolveStoredClientId(this.clientFilter);
            const matchesStatus = !this.statusFilter || invoice.status === this.statusFilter;
            const matchesSearch =
                !normalizedSearchTerm ||
                this.invoiceCode(invoice).toLowerCase().includes(normalizedSearchTerm) ||
                invoice.clientName.toLowerCase().includes(normalizedSearchTerm) ||
                invoice.projectName.toLowerCase().includes(normalizedSearchTerm) ||
                invoice.referenceCode.toLowerCase().includes(normalizedSearchTerm);

            return matchesClient && matchesStatus && matchesSearch;
        });
    }

    clearFilters(): void {
        this.clientFilter = "";
        this.statusFilter = "";
        this.searchTerm = "";
        this.refreshFilteredInvoices();
    }

    invoiceCode(invoice: BillingInvoice): string {
        return FinanceBillingStore.buildInvoiceCode(invoice.seriesPrefix, invoice.sequenceNumber);
    }

    initialsOf(value: string): string {
        return value
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((fragment) => fragment.charAt(0).toUpperCase())
            .join("");
    }

    statusClass(status: BillingInvoice["status"]): string {
        switch (status) {
            case "Pagado":
                return "status-dot status-dot--paid";
            case "Pago parcial":
                return "status-dot status-dot--partial";
            case "Cancelado":
                return "status-dot status-dot--cancelled";
            case "Enviado":
                return "status-dot status-dot--sent";
            case "Borrador":
                return "status-dot status-dot--draft";
            default:
                return "status-dot status-dot--pending";
        }
    }

    /** Abre la vista imprimible de una factura (sin modificar nada en el servidor). */
    openPrintView(invoice: BillingInvoice): void {
        this.printTarget = { ...invoice };
    }

    closePrintView(): void {
        this.printTarget = null;
    }

    printInvoiceDocument(): void {
        window.print();
    }

    /** Desplaza a la ficha de edición; el servidor sigue siendo la puerta real (409 si está bloqueada). */
    editInvoice(invoiceId: number): void {
        void this.router.navigateByUrl(`/app/finance-facturacion/editar/${invoiceId}`);
    }

    /** Descuento legible para la hoja imprimible (sin pipes: es TS, no template). */
    discountLabel(invoice: BillingInvoice): string {
        if (!(invoice.discountValue > 0)) {
            return "--";
        }
        const currency = invoice.currencyCode || "COP";
        return invoice.discountMode === "amount"
            ? `${new Intl.NumberFormat("es-CO", { style: "currency", currency, maximumFractionDigits: 0 }).format(invoice.discountValue)} (${currency})`
            : `${invoice.discountValue}%`;
    }

    async duplicateInvoice(invoiceId: number): Promise<void> {
        const sourceInvoice = this.invoices.find((invoice) => invoice.id === invoiceId);
        if (!sourceInvoice) {
            return;
        }

        const sequenceNumber = Math.max(...this.invoices.map((invoice) => invoice.sequenceNumber || 0), 0) + 1;
        const duplicatedInvoice: BillingInvoice = {
            ...sourceInvoice,
            id: 0,
            sequenceNumber,
            issueDate: new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString(),
            status: "Borrador",
            referenceCode: "--",
            // La copia es un borrador nuevo: sin bloqueo, sin número externo y
            // sin heredar el tipo/referencias del documento duplicado.
            externalNumber: "",
            documentType: "factura",
            creditNoteRef: null,
            locked: false,
            sourceQuoteId: "",
        };

        try {
            this.errorMessage = "";
            await firstValueFrom(this.financeBillingApi.createInvoice(duplicatedInvoice));
            this.message = `Se duplicó ${this.invoiceCode(duplicatedInvoice)}.`;
            await this.loadInvoices();
        } catch (error) {
            // Sin fallback local: la copia solo existe si quedó en el servidor.
            this.message = "";
            this.errorMessage = error instanceof Error ? error.message : "No se pudo duplicar la factura en el servidor.";
        }
    }

    async markStatus(invoiceId: number, status: BillingInvoice["status"]): Promise<void> {
        const sourceInvoice = this.invoices.find((invoice) => invoice.id === invoiceId);
        if (!sourceInvoice) {
            return;
        }
        // Factura emitida: "no hay reversa". El servidor también la rechaza
        // con 409; este guarda evita la llamada inútil y explica el motivo.
        if (sourceInvoice.locked) {
            this.message = "";
            this.errorMessage = "La factura esta bloqueada por estar emitida: no se puede editar; la unica reversa es una nota credito.";
            return;
        }

        try {
            this.errorMessage = "";
            await firstValueFrom(this.financeBillingApi.updateInvoice(invoiceId, { ...sourceInvoice, status }));
            this.message = `Factura actualizada a estado ${status}.`;
            await this.loadInvoices();
        } catch (error) {
            this.message = "";
            this.errorMessage = error instanceof Error ? error.message : "No se pudo actualizar la factura en el servidor.";
        }
    }

    /** Fase 5b: solo las facturas (no NC/canceladas) con saldo admiten nota crédito. */
    canCreateCreditNote(invoice: BillingInvoice): boolean {
        return (invoice.documentType || "factura") === "factura" && invoice.status !== "Cancelado" && invoice.balanceAmount > 0;
    }

    openCreditNoteModal(invoice: BillingInvoice): void {
        this.creditNoteTarget = invoice;
        this.creditNoteAmount = invoice.balanceAmount;
        this.creditNoteNote = "";
        this.creditNoteError = "";
    }

    closeCreditNoteModal(): void {
        this.creditNoteTarget = null;
        this.creditNoteError = "";
    }

    async submitCreditNote(): Promise<void> {
        const target = this.creditNoteTarget;
        if (!target || this.isSavingCreditNote) {
            return;
        }
        this.creditNoteError = "";
        if (!(this.creditNoteAmount > 0)) {
            this.creditNoteError = "El valor de la nota credito debe ser mayor que cero.";
            return;
        }
        if (this.creditNoteAmount > target.balanceAmount) {
            this.creditNoteError = "La nota credito no puede exceder el saldo pendiente de la factura.";
            return;
        }

        try {
            this.isSavingCreditNote = true;
            await firstValueFrom(
                this.financeBillingApi.createCreditNote({
                    invoiceId: target.id,
                    amount: this.creditNoteAmount,
                    note: this.creditNoteNote.trim(),
                }),
            );
            this.message = `Nota credito emitida contra ${this.invoiceCode(target)}; el saldo pendiente quedo ajustado.`;
            this.closeCreditNoteModal();
            await this.loadInvoices();
        } catch (error) {
            this.creditNoteError = error instanceof Error ? error.message : "No se pudo emitir la nota credito en el servidor.";
        } finally {
            this.isSavingCreditNote = false;
        }
    }

    exportInvoices(): void {
        if (typeof window === "undefined") {
            return;
        }

        const exportBlob = new Blob([JSON.stringify(this.filteredInvoices, null, 2)], { type: "application/json" });
        const exportUrl = window.URL.createObjectURL(exportBlob);
        const anchor = window.document.createElement("a");

        anchor.href = exportUrl;
        anchor.download = "facturacion-comercial.json";
        anchor.click();

        window.URL.revokeObjectURL(exportUrl);
    }

    async exportCSV(): Promise<void> {
        this.errorMessage = "";
        try {
            // Endpoint CSV (con cabecera) y descarga autenticada: window.open
            // no puede enviar el token y el archivo quedaba en 401.
            await this.financeBillingApi.downloadOasisExport("csv", this.exportFrom, this.exportTo);
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : "No se pudo exportar el CSV Oasis.";
        }
    }

    async exportTXT(): Promise<void> {
        this.errorMessage = "";
        try {
            // El TXT es el archivo plano 961 (sin cabecera), endpoint propio.
            await this.financeBillingApi.downloadOasisExport("txt", this.exportFrom, this.exportTo);
        } catch (error) {
            this.errorMessage = error instanceof Error ? error.message : "No se pudo exportar el TXT Oasis.";
        }
    }

    private async loadInvoices(): Promise<void> {
        try {
            this.invoices = await firstValueFrom(this.financeBillingApi.listInvoices()) as BillingInvoice[];
            FinanceBillingStore.saveInvoices(this.invoices);
            this.errorMessage = "";
        } catch (error) {
            // La caché del store (datos del servidor de cargas anteriores) se
            // mantiene; ya no hay semilla mock ni localStorage.
            this.invoices = FinanceBillingStore.getInvoices();
            this.errorMessage = error instanceof Error ? error.message : "No se pudieron cargar las facturas del servidor.";
        }
        this.refreshFilteredInvoices();
        this.changeDetector.detectChanges();
    }
}