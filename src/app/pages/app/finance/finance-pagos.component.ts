import { CommonModule } from "@angular/common";
import { Component, HostListener, OnDestroy, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { FinanceAccount, FinanceAccountsStore } from "./finance-accounts.store";
import { FinanceBillingStore } from "./finance-billing.store";
import { FinancePaymentsApiService, UpsertFinancePaymentRequest } from "../../../services/finance-payments-api.service";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
import { ProjectsApiService } from "../../../services/projects-api.service";
import type { RemissionPrefill } from "../remissions/remissions.logic";
import {
    buildRemissionPrefillFromProject,
    filterPaymentConfirmedProjects,
    projectClientName as logicProjectClientName,
    projectEquipmentCode as logicProjectEquipmentCode,
    projectEquipmentName as logicProjectEquipmentName,
    projectPaymentVerificationState,
} from "../remissions/remissions.logic";

type PaymentStatus = "Completado" | "Parcial" | "Pendiente";
type CurrencyCode = "COP" | "USD" | "EUR";

interface PaymentRecord {
    id: number;
    orderNumber: number;
    code: string;
    project: string;
    invoiceNumber: string;
    client: string;
    purchaseOrder: string;
    amount: number;
    paidAt: string;
    paymentGateway: string;
    status: PaymentStatus;
    currencyCode: CurrencyCode;
    exchangeRate: number;
    transactionId: string;
    bankAccountId: number | null;
    bankAccountName: string;
    receiptFileName: string;
    notes: string;
    reteFuente: number;
    reteIva: number;
    reteIca: number;
    retentionComments: string;
    paymentDate: string;
}

interface PaymentDraft {
    project: string;
    invoiceNumber: string;
    paidAt: string;
    amount: number | null;
    currencyCode: CurrencyCode;
    exchangeRate: number;
    transactionId: string;
    paymentGateway: string;
    bankAccountId: number | null;
    receiptFileName: string;
    notes: string;
    status: PaymentStatus;
    reteFuente: number;
    reteIva: number;
    reteIca: number;
    paymentDate: string;
    retentionComments: string;
}

interface InvoiceOption {
    number: string;
    project: string;
    client: string;
    amount: number;
}

@Component({
    selector: "app-finance-pagos",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Pagos</h5>
                    <p class="text-secondary small mb-0">Gestiona cobros asociados a facturas y controla el estado de recaudo.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    @if (viewMode === "list") {
                        <button class="btn btn-theme" type="button" (click)="openCreateForm()"><i class="bi bi-plus-lg me-2"></i>Agregar pago</button>
                    } @else {
                        <button class="btn btn-outline-secondary" type="button" (click)="goToListView()">Ver listado</button>
                    }
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Financiero</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Pagos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (successMessage) {
                <div class="alert alert-success border mb-3">{{ successMessage }}</div>
            }
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            @if (viewMode === "list") {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-body">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Buscar</label>
                                <input class="form-control" type="text" placeholder="Empieza a escribir para buscar" [(ngModel)]="searchTerm" name="searchTerm" />
                            </div>
                            <div class="col-12 col-md-6 col-lg-3">
                                <label class="form-label">Cliente</label>
                                <select class="form-select" [(ngModel)]="selectedClient" name="selectedClient">
                                    <option value="">Todos</option>
                                    @for (client of clientFilters; track client) {
                                        <option [value]="client">{{ client }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-md-6 col-lg-2">
                                <label class="form-label">Estado</label>
                                <select class="form-select" [(ngModel)]="selectedStatus" name="selectedStatus">
                                    <option value="">Todos</option>
                                    @for (status of statusFilters; track status) {
                                        <option [value]="status">{{ status }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-3 d-grid d-lg-flex justify-content-lg-end gap-2">
                                <button class="btn btn-theme" type="button" (click)="openCreateForm()"><i class="bi bi-plus-lg me-2"></i>Agregar pago</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="exportPayments()"><i class="bi bi-download me-2"></i>Exportar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Doble validacion de despacho: proyectos cuyo pago ya se marco
                     confirmado en la ficha del tablero. Hasta que alguien guarde
                     su verificacion aqui, Remisiones no deja crear su remision. -->
                <div class="card adminuiux-card mb-3 mb-lg-4" data-testid="payment-confirmed-panel">
                    <div class="card-header d-flex justify-content-between align-items-center py-2">
                        <h6 class="mb-0"><i class="bi bi-credit-card-check me-2"></i>Proyectos con pago confirmado</h6>
                        @if (paymentConfirmedProjects.length > 0) {
                            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="loadPaymentConfirmedProjects()">
                                <i class="bi bi-arrow-clockwise me-1"></i>Actualizar
                            </button>
                        }
                    </div>
                    <div class="card-body p-0">
                        @if (loadingPaymentConfirmed) {
                            <p class="text-secondary py-3 mb-0">Cargando proyectos...</p>
                        } @else if (paymentConfirmedError) {
                            <div class="alert alert-warning m-3" role="alert" data-testid="payment-confirmed-error">
                                {{ paymentConfirmedError }}
                            </div>
                        } @else if (paymentConfirmedProjects.length === 0) {
                            <p class="text-secondary py-3 mb-0">No hay proyectos con pago confirmado por ahora. Cuando un proyecto marque su pago como confirmado en la ficha del tablero, aparecera aqui para la doble validacion.</p>
                        } @else {
                            <div class="table-responsive">
                                <table class="table align-middle mb-0" data-testid="payment-confirmed-table">
                                    <thead>
                                        <tr>
                                            <th>Codigo</th>
                                            <th>Cliente</th>
                                            <th>Equipo</th>
                                            <th>Etapas del tablero</th>
                                            <th>Pago confirmado el</th>
                                            <th>Doble validacion</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (project of paymentConfirmedProjects; track project.id) {
                                            <tr style="cursor: pointer;" (click)="openVerify(project)" data-testid="payment-confirmed-row">
                                                <td><span class="badge bg-dark">{{ projectEquipmentCode(project) }}</span></td>
                                                <td>{{ projectClientName(project) || "--" }}</td>
                                                <td>{{ projectEquipmentName(project) || "--" }}</td>
                                                <td><span class="badge text-bg-light border">{{ project.status }}</span></td>
                                                <td>{{ paymentConfirmedAtOf(project) | date: "dd/MM/yyyy HH:mm" }}</td>
                                                <td>
                                                    @if (verificationStateOf(project).savedAt) {
                                                        <span class="badge text-bg-success"><i class="bi bi-check-lg me-1"></i>Validada por {{ verificationStateOf(project).savedBy || "usuario" }} · {{ verificationStateOf(project).savedAt | date: "dd/MM/yyyy HH:mm" }}</span>
                                                    } @else {
                                                        <span class="badge text-bg-warning">Pendiente de validacion</span>
                                                    }
                                                </td>
                                                <td class="text-end">
                                                    <button class="btn btn-sm {{ verificationStateOf(project).savedAt ? 'btn-outline-secondary' : 'btn-theme' }}" type="button" (click)="openVerify(project)" data-testid="verify-project-btn">
                                                        <i class="bi bi-patch-check me-1"></i>{{ verificationStateOf(project).savedAt ? "Re-validar" : "Validar despacho" }}
                                                    </button>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        }
                    </div>
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Numero de orden</th>
                                        <th>Codigo</th>
                                        <th>Proyecto</th>
                                        <th>Factura#</th>
                                        <th>Cliente</th>
                                        <th>Pedido#</th>
                                        <th class="text-end">Monto</th>
                                        <th>Pagado el</th>
                                        <th>Pasarela de pago</th>
                                        <th>Estado</th>
                                        <th class="text-end">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (payment of filteredPayments; track payment.id) {
                                        <tr>
                                            <td>{{ payment.orderNumber }}</td>
                                            <td>{{ payment.code }}</td>
                                            <td>{{ payment.project || "--" }}</td>
                                            <td>{{ payment.invoiceNumber }}</td>
                                            <td>{{ payment.client }}</td>
                                            <td>{{ payment.purchaseOrder || "--" }}</td>
                                            <td class="text-end">{{ payment.amount | currency: payment.currencyCode : "symbol" : "1.0-0" }}</td>
                                            <td>{{ payment.paidAt | date: "dd/MM/yyyy" }}</td>
                                            <td>{{ payment.paymentGateway || "--" }}</td>
                                            <td>
                                                <span class="badge rounded-pill" [class.text-bg-success]="payment.status === 'Completado'" [class.text-bg-warning]="payment.status === 'Parcial'" [class.text-bg-secondary]="payment.status === 'Pendiente'">
                                                    {{ payment.status }}
                                                </span>
                                            </td>
                                            <td class="text-end">
                                                <div class="position-relative d-inline-block">
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="toggleActionMenu(payment.id, $event)">
                                                        <i class="bi bi-three-dots-vertical"></i>
                                                    </button>
                                                    @if (openActionMenuId === payment.id) {
                                                        <ul class="dropdown-menu show shadow border-0" style="right: 0; left: auto;">
                                                            <li><button class="dropdown-item" type="button" (click)="viewPayment(payment.id)"><i class="bi bi-eye me-2"></i>Ver</button></li>
                                                            <li><button class="dropdown-item" type="button" (click)="downloadReceipt(payment.id)"><i class="bi bi-download me-2"></i>Descargar</button></li>
                                                            <li><button class="dropdown-item" type="button" (click)="editPayment(payment.id)"><i class="bi bi-pencil-square me-2"></i>Editar</button></li>
                                                            <li><button class="dropdown-item text-danger" type="button" (click)="removePayment(payment.id)"><i class="bi bi-trash me-2"></i>Eliminar</button></li>
                                                        </ul>
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="11" class="text-center text-secondary py-4">No hay pagos para el filtro aplicado.</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-3">
                        <p class="small text-secondary mb-0">Mostrando {{ filteredPayments.length }} de {{ payments.length }} pagos.</p>
                    </div>
                </div>
            } @else if (viewMode === "verify") {
                <!-- Doble validacion del despacho: revisa los datos prellenados del
                     proyecto (mismo prefill que usaria la remision) y guarda la
                     verificacion en el propio proyecto. Solo despues se habilita
                     el boton Completar de Remisiones para este proyecto. -->
                <div class="card adminuiux-card mb-3 mb-lg-4" data-testid="payment-verification-form">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6 class="mb-0"><i class="bi bi-patch-check me-2"></i>Doble validacion de despacho — {{ projectEquipmentCode(verifyProject) }}</h6>
                        <button class="btn btn-sm btn-outline-secondary" type="button" (click)="goToListView()">Volver al listado</button>
                    </div>
                    <div class="card-body">
                        @if (!verifyPrefill) {
                            <p class="text-danger mb-0">No se pudo cargar el detalle del proyecto.</p>
                        } @else {
                            <div class="alert alert-info py-2">
                                Revisa los datos tal como viajarian a la remision. Al guardar quedara registrada
                                tu doble validacion (quien y cuando) en el proyecto, y desde entonces Remisiones
                                permitira crear su remision.
                            </div>

                            <div class="row gx-3 gy-2 align-items-end">
                                <div class="col-12 col-md-4">
                                    <label class="form-label small">Cliente</label>
                                    <input class="form-control" type="text" [value]="verifyPrefill.clientName || '--'" readonly />
                                </div>
                                <div class="col-6 col-md-2">
                                    <label class="form-label small">NIT</label>
                                    <input class="form-control" type="text" [value]="verifyPrefill.clientNit || '--'" readonly data-testid="verify-client-nit" />
                                </div>
                                <div class="col-6 col-md-3">
                                    <label class="form-label small">Modalidad de despacho</label>
                                    <input class="form-control" type="text" [value]="dispatchLabelOf(verifyPrefill)" readonly />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label small">Orden de compra / pedido</label>
                                    <input class="form-control" type="text" [value]="verifyPrefill.purchaseOrder || '--'" readonly />
                                </div>
                            </div>

                            <table class="table table-sm align-middle mt-3">
                                <thead>
                                    <tr><th>Identificador</th><th>Descripcion</th><th>Accesorios</th><th class="text-end">Garantia (meses)</th></tr>
                                </thead>
                                <tbody>
                                    @for (item of verifyPrefill.items; track item.equipmentId) {
                                        <tr data-testid="verify-item-row">
                                            <td>{{ item.identifier || '--' }}</td>
                                            <td>{{ item.description || '--' }}</td>
                                            <td>{{ item.accessories || item.anchoredNote || '--' }}</td>
                                            <td class="text-end">{{ item.warrantyMonths > 0 ? item.warrantyMonths : 'Segun politica' }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>

                            <div class="form-check mb-3" data-testid="verify-confirm-check">
                                <input class="form-check-input" type="checkbox" id="verificationConfirmedInput" [(ngModel)]="verificationConfirmed" name="verificationConfirmed" />
                                <label class="form-check-label" for="verificationConfirmedInput">He revisado los datos del despacho de este proyecto.</label>
                            </div>

                            @if (savingVerification) {
                                <p class="text-secondary mb-2"><i class="bi bi-arrow-repeat spin me-1"></i>Guardando verificacion...</p>
                            }

                            <div class="d-flex gap-2">
                                <button class="btn btn-theme" type="button" [disabled]="!verificationConfirmed || savingVerification" (click)="saveVerification()" data-testid="save-verification-btn">
                                    <i class="bi bi-check-lg me-1"></i>Guardar verificacion
                                </button>
                                <button class="btn btn-outline-secondary" type="button" (click)="goToListView()">Cancelar</button>
                            </div>
                        }
                    </div>
                </div>
            } @else {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header">
                        <h6 class="mb-0">{{ editingPaymentId === null ? "Agregar pago" : "Editar pago" }}</h6>
                    </div>
                    <div class="card-body">
                        <form (ngSubmit)="savePayment()" novalidate>
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Proyecto</label>
                                    <select class="form-select" [(ngModel)]="draft.project" name="project">
                                        <option value="">--</option>
                                        @for (project of projectOptions; track project) {
                                            <option [value]="project">{{ project }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Factura</label>
                                    <select class="form-select" [(ngModel)]="draft.invoiceNumber" name="invoiceNumber" (ngModelChange)="onInvoiceChange()" required>
                                        <option value="">--</option>
                                        @for (invoice of invoiceOptions; track invoice.number) {
                                            <option [value]="invoice.number">{{ invoice.number }} - {{ invoice.client }}</option>
                                        } @empty {
                                            <option value="" disabled>No hay facturas registradas</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Pagado el</label>
                                    <input class="form-control" type="date" [(ngModel)]="draft.paidAt" name="paidAt" required />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Monto</label>
                                    <input class="form-control" type="number" min="1" step="100" placeholder="Por ejemplo, 10000" [(ngModel)]="draft.amount" name="amount" required />
                                </div>

                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Moneda</label>
                                    <select class="form-select" [(ngModel)]="draft.currencyCode" name="currencyCode" (ngModelChange)="onCurrencyChange()">
                                        @for (currency of currencyOptions; track currency.value) {
                                            <option [value]="currency.value">{{ currency.label }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Tipo de cambio</label>
                                    <input class="form-control" type="number" min="0.0001" step="0.0001" [(ngModel)]="draft.exchangeRate" name="exchangeRate" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">ID de transaccion</label>
                                    <input class="form-control" type="text" placeholder="Ingresa el ID de transaccion del pago" [(ngModel)]="draft.transactionId" name="transactionId" />
                                </div>
                                <div class="col-12 col-lg-3">
                                    <label class="form-label">Pasarela de pago</label>
                                    <select class="form-select" [(ngModel)]="draft.paymentGateway" name="paymentGateway">
                                        <option value="">--</option>
                                        @for (gateway of paymentGateways; track gateway) {
                                            <option [value]="gateway">{{ gateway }}</option>
                                        }
                                    </select>
                                </div>

                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Cuenta bancaria</label>
                                    <select class="form-select" [(ngModel)]="draft.bankAccountId" name="bankAccountId">
                                        <option [ngValue]="null">--</option>
                                        @for (account of financeAccounts; track account.id) {
                                            <option [ngValue]="account.id">{{ account.bankName }} - {{ account.accountNumber }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" [(ngModel)]="draft.status" name="status">
                                        @for (status of statusFilters; track status) {
                                            <option [value]="status">{{ status }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Recibo</label>
                                    <input class="form-control" type="file" (change)="onReceiptSelected($event)" />
                                    @if (draft.receiptFileName) {
                                        <p class="small text-secondary mt-2 mb-0">Archivo: {{ draft.receiptFileName }}</p>
                                    }
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Observacion</label>
                                    <textarea class="form-control" rows="3" placeholder="Ingresa un resumen del pago" [(ngModel)]="draft.notes" name="notes"></textarea>
                                </div>
                            </div>

                            <div class="row mt-3">
                                <div class="col-md-3">
                                    <label class="form-label small">ReteFuente (%)</label>
                                    <input type="number" class="form-control form-control-sm" [(ngModel)]="draft.reteFuente" [ngModelOptions]="{ standalone: true }" step="0.01" data-testid="rete-fuente-input" />
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label small">ReteIVA (%)</label>
                                    <input type="number" class="form-control form-control-sm" [(ngModel)]="draft.reteIva" [ngModelOptions]="{ standalone: true }" step="0.01" data-testid="rete-iva-input" />
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label small">ReteICA (%)</label>
                                    <input type="number" class="form-control form-control-sm" [(ngModel)]="draft.reteIca" [ngModelOptions]="{ standalone: true }" step="0.01" data-testid="rete-ica-input" />
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label small">Fecha pago real</label>
                                    <input type="date" class="form-control form-control-sm" [(ngModel)]="draft.paymentDate" [ngModelOptions]="{ standalone: true }" data-testid="payment-date-input" />
                                </div>
                            </div>
                            <div class="mt-2">
                                <label class="form-label small">Comentarios retenciones</label>
                                <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="draft.retentionComments" [ngModelOptions]="{ standalone: true }" data-testid="retention-comments-input"></textarea>
                            </div>

                            <div class="mt-3 d-flex gap-2">
                                <button class="btn btn-theme" type="submit">Guardar</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="goToListView()">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </div>
    `,
})
export class FinancePagosComponent implements OnDestroy {
    private readonly financePaymentsApi = inject(FinancePaymentsApiService);
    private readonly financeBillingApi = inject(FinanceBillingApiService);
    private readonly projectsApi = inject(ProjectsApiService);

    readonly currencyOptions = [
        { value: "COP", label: "COP ($)" },
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (EUR)" },
    ] as const;

    readonly paymentGateways = ["Transferencia bancaria", "Wompi", "PayU", "Stripe", "Efectivo"];
    readonly statusFilters: PaymentStatus[] = ["Completado", "Parcial", "Pendiente"];
    // Las opciones de factura y proyecto salen de GET /finance/invoices: ya no
    // hay facturas hardcodeadas. Si no hay facturas, el dropdown lo dice en
    // vez de inventar.
    invoiceOptions: InvoiceOption[] = [];

    viewMode: "list" | "form" | "verify" = "list";
    payments: PaymentRecord[] = [];
    financeAccounts: FinanceAccount[] = [];
    editingPaymentId: number | null = null;
    openActionMenuId: number | null = null;

    searchTerm = "";
    selectedClient = "";
    selectedStatus = "";

    successMessage = "";
    formError = "";
    draft: PaymentDraft = this.getDefaultDraft();

    private readonly accountsUnsubscribe: () => void;

    constructor() {
        this.financeAccounts = FinanceAccountsStore.getAccounts();
        this.accountsUnsubscribe = FinanceAccountsStore.subscribe(() => {
            this.financeAccounts = FinanceAccountsStore.getAccounts();
        });
        void FinanceAccountsStore.ensureLoaded();
        this.loadPaymentsFromApi();
        void this.loadInvoiceOptions();
        this.loadPaymentConfirmedProjects();
    }

    ngOnDestroy(): void {
        this.accountsUnsubscribe();
    }

    // ── Doble validacion de despacho (pago confirmado) ───────────────────────
    paymentConfirmedProjects: any[] = [];
    loadingPaymentConfirmed = false;
    paymentConfirmedError = "";
    verifyProject: any | null = null;
    verifyPrefill: RemissionPrefill | null = null;
    verificationConfirmed = false;
    savingVerification = false;

    /** Estado de validacion pura (mismo origen que el gate de Remisiones). */
    readonly verificationStateOf = projectPaymentVerificationState;
    // El template solo puede ver miembros del componente: expongo aqui las funciones puras de la logica.
    readonly projectEquipmentCode = (p: any) => logicProjectEquipmentCode(p);
    readonly projectClientName = (p: any) => logicProjectClientName(p);
    readonly projectEquipmentName = (p: any) => logicProjectEquipmentName(p);

    dispatchLabelOf(prefill: RemissionPrefill): string {
        const key = String(prefill?.dispatchType || "").trim().toLowerCase();
        const labels: Record<string, string> = {
            "servientrega": "Servientrega",
            "recoge-cliente": "Recoge Cliente",
            "contra-entrega": "Contra entrega",
            "dhl": "DHL",
        };
        return key ? labels[key] || key : "No especificada";
    }

    paymentConfirmedAtOf(project: any): string {
        const props = (project && typeof project.properties === "object" && project.properties !== null)
            ? project.properties
            : {};
        return String(props.paymentConfirmedAt || "").trim();
    }

    loadPaymentConfirmedProjects(): void {
        this.loadingPaymentConfirmed = true;
        this.paymentConfirmedError = "";
        this.projectsApi.listProjects({ limit: 500 }).subscribe({
            next: (projects) => {
                this.loadingPaymentConfirmed = false;
                const confirmed = filterPaymentConfirmedProjects(projects);
                // Los mas recientes primero: pago confirmado el, luego id como desempate.
                confirmed.sort((a, b) =>
                    String(b.properties?.paymentConfirmedAt || "")
                        .localeCompare(String(a.properties?.paymentConfirmedAt || ""))
                    || String(b.id || "").localeCompare(String(a.id || "")),
                );
                this.paymentConfirmedProjects = confirmed;
            },
            error: () => {
                this.loadingPaymentConfirmed = false;
                this.paymentConfirmedError = "No se pudieron cargar los proyectos con pago confirmado. Verifica la conexion y pulsa Actualizar.";
            },
        });
    }

    openVerify(project: any): void {
        this.formError = "";
        this.successMessage = "";
        this.verifyProject = project;
        try {
            const equipmentId = String((project.properties || {}).equipmentItemId || "").trim();
            const eqItem = equipmentId
                ? (this.allEquipmentItemsForVerify().find((it: any) => String(it.itemId || it.id || "") === equipmentId)
                    ?? null)
                : null;
            this.verifyPrefill = buildRemissionPrefillFromProject(project, eqItem);
        } catch {
            this.verifyPrefill = null;
        }
        this.verificationConfirmed = false;
        this.savingVerification = false;
        this.viewMode = "verify";
    }

    /** Sin dependencias externas: el NIT/accesorios ya viven en properties del proyecto. */
    private allEquipmentItemsForVerify(): any[] {
        return [];
    }

    saveVerification(): void {
        const project = this.verifyProject;
        if (!project || !String(project.id ?? "")) {
            this.formError = "No hay un proyecto seleccionado para validar.";
            return;
        }
        if (!this.verificationConfirmed) {
            this.formError = "Confirma con la casilla que revisaste los datos del despacho antes de guardar.";
            return;
        }

        const by = this.resolveCurrentUserName();
        const properties = { ...(project.properties || {}) };
        properties.paymentVerification = {
            at: new Date().toISOString(),
            by,
        };

        this.savingVerification = true;
        this.formError = "";
        // PUT /projects/:id con el MISMO status (no-op legal de transicion):
        // solo se anota properties.paymentVerification = { at, by }.
        this.projectsApi.updateProject(String(project.id), {
            id: String(project.id),
            status: String(project.status || ""),
            properties,
        }).subscribe({
            next: (updated) => {
                this.savingVerification = false;
                const storedProperties = { ...(properties as Record<string, any>) };
                project.properties = storedProperties;
                if (updated && updated.status) {
                    project.status = updated.status;
                }
                this.successMessage = `Doble validacion guardada por ${by}. Ahora puedes crear la remision de este proyecto en Remisiones.`;
                this.goToListView();
            },
            error: (error) => {
                this.savingVerification = false;
                const message = (error && typeof error === "object" && "error" in (error as any))
                    ? String((error as any).error || "")
                    : "";
                this.formError = message
                    ? `No se pudo guardar la verificacion: ${message}`
                    : "No se pudo guardar la verificacion. Verifica tu conexion e intentalo de nuevo.";
            },
        });
    }

    /** Quien valida, desde la sesion persistida (mismo origen que el resto del app). */
    private resolveCurrentUserName(): string {
        try {
            const session = JSON.parse(localStorage.getItem("pika.auth.session") || "{}");
            return String(session?.user?.name ?? session?.user?.email ?? "").trim() || "usuario";
        } catch {
            return "usuario";
        }
    }

    get projectOptions(): string[] {
        return Array.from(new Set(this.invoiceOptions.map((invoice) => invoice.project).filter((project) => project !== ""))).sort((first, second) =>
            first.localeCompare(second),
        );
    }

    private async loadInvoiceOptions(): Promise<void> {
        try {
            const invoices = await firstValueFrom(this.financeBillingApi.listInvoices());
            this.invoiceOptions = invoices
                .filter((invoice) => invoice.status !== "Cancelado" && invoice.status !== "Borrador")
                .map((invoice) => ({
                    number: FinanceBillingStore.buildInvoiceCode(invoice.seriesPrefix, invoice.sequenceNumber),
                    project: invoice.projectName || "",
                    client: invoice.clientName,
                    amount: invoice.balanceAmount > 0 ? invoice.balanceAmount : invoice.total,
                }));
        } catch {
            this.invoiceOptions = [];
        }
    }

    get clientFilters(): string[] {
        return Array.from(new Set(this.payments.map((payment) => payment.client))).sort((first, second) => first.localeCompare(second));
    }

    get filteredPayments(): PaymentRecord[] {
        const sanitizedSearch = this.searchTerm.trim().toLowerCase();

        return this.payments.filter((payment) => {
            const matchesClient = this.selectedClient ? payment.client === this.selectedClient : true;
            const matchesStatus = this.selectedStatus ? payment.status === this.selectedStatus : true;

            const searchableFields = [
                payment.code,
                payment.project,
                payment.invoiceNumber,
                payment.client,
                payment.paymentGateway,
                payment.transactionId,
                payment.purchaseOrder,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = sanitizedSearch ? searchableFields.includes(sanitizedSearch) : true;

            return matchesClient && matchesStatus && matchesSearch;
        });
    }

    @HostListener("document:click")
    onDocumentClick(): void {
        this.openActionMenuId = null;
    }

    openCreateForm(): void {
        this.editingPaymentId = null;
        this.formError = "";
        this.successMessage = "";
        this.draft = this.getDefaultDraft();
        this.viewMode = "form";
    }

    goToListView(): void {
        this.viewMode = "list";
        this.formError = "";
        this.openActionMenuId = null;
        this.draft = this.getDefaultDraft();
        this.editingPaymentId = null;
    }

    toggleActionMenu(paymentId: number, event: MouseEvent): void {
        event.stopPropagation();
        this.openActionMenuId = this.openActionMenuId === paymentId ? null : paymentId;
    }

    savePayment(): void {
        this.formError = "";
        this.successMessage = "";

        if (!this.draft.invoiceNumber) {
            this.formError = "Debes seleccionar una factura.";
            return;
        }

        if (!this.draft.paidAt) {
            this.formError = "Debes ingresar la fecha de pago.";
            return;
        }

        const amount = this.toPositiveNumber(this.draft.amount);
        if (amount <= 0) {
            this.formError = "Debes ingresar un monto mayor a cero.";
            return;
        }

        const linkedInvoice = this.invoiceOptions.find((invoice) => invoice.number === this.draft.invoiceNumber);
        const currentRecord = this.editingPaymentId === null ? null : this.payments.find((payment) => payment.id === this.editingPaymentId);
        const paymentId = this.editingPaymentId ?? Date.now();

        const recordToSave: PaymentRecord = {
            id: paymentId,
            orderNumber: currentRecord?.orderNumber ?? this.getNextOrderNumber(),
            code: currentRecord?.code ?? this.buildPaymentCode(),
            project: this.draft.project || linkedInvoice?.project || "",
            invoiceNumber: this.draft.invoiceNumber,
            client: linkedInvoice?.client ?? currentRecord?.client ?? "Cliente sin definir",
            purchaseOrder: currentRecord?.purchaseOrder ?? "--",
            amount,
            paidAt: this.draft.paidAt,
            paymentGateway: this.draft.paymentGateway,
            status: this.draft.status,
            currencyCode: this.draft.currencyCode,
            exchangeRate: this.toPositiveNumber(this.draft.exchangeRate),
            transactionId: this.draft.transactionId.trim(),
            bankAccountId: this.draft.bankAccountId,
            bankAccountName: this.resolveAccountName(this.draft.bankAccountId),
            receiptFileName: this.draft.receiptFileName,
            notes: this.draft.notes.trim(),
            reteFuente: this.toPositiveNumber(this.draft.reteFuente),
            reteIva: this.toPositiveNumber(this.draft.reteIva),
            reteIca: this.toPositiveNumber(this.draft.reteIca),
            retentionComments: (this.draft.retentionComments ?? "").trim(),
            paymentDate: (this.draft.paymentDate ?? "").trim(),
        };

        const payload = this.toPaymentPayload(recordToSave);

        if (this.editingPaymentId === null) {
            this.financePaymentsApi.createPayment(payload).subscribe({
                next: (createdPayment) => {
                    this.payments.unshift(this.normalizePaymentRecord(createdPayment));
                    this.successMessage = "Pago creado correctamente.";
                    this.goToListView();
                },
                error: (error) => {
                    this.formError = this.resolveErrorMessage(error, "No se pudo crear el pago en backend.");
                },
            });
            return;
        }

        const editingPaymentId = this.editingPaymentId;
        this.financePaymentsApi.updatePayment(editingPaymentId, payload).subscribe({
            next: (updatedPayment) => {
                const normalized = this.normalizePaymentRecord(updatedPayment);
                const indexToReplace = this.payments.findIndex((payment) => payment.id === editingPaymentId);
                if (indexToReplace >= 0) {
                    this.payments[indexToReplace] = normalized;
                }
                this.successMessage = "Pago actualizado correctamente.";
                this.goToListView();
            },
            error: (error) => {
                this.formError = this.resolveErrorMessage(error, "No se pudo actualizar el pago en backend.");
            },
        });
    }

    editPayment(paymentId: number): void {
        this.openActionMenuId = null;
        const payment = this.payments.find((currentPayment) => currentPayment.id === paymentId);
        if (!payment) {
            return;
        }

        this.editingPaymentId = payment.id;
        this.draft = {
            project: payment.project,
            invoiceNumber: payment.invoiceNumber,
            paidAt: payment.paidAt,
            amount: payment.amount,
            currencyCode: payment.currencyCode,
            exchangeRate: payment.exchangeRate,
            transactionId: payment.transactionId,
            paymentGateway: payment.paymentGateway,
            bankAccountId: payment.bankAccountId,
            receiptFileName: payment.receiptFileName,
            notes: payment.notes,
            status: payment.status,
            reteFuente: payment.reteFuente,
            reteIva: payment.reteIva,
            reteIca: payment.reteIca,
            paymentDate: payment.paymentDate,
            retentionComments: payment.retentionComments,
        };
        this.viewMode = "form";
    }

    removePayment(paymentId: number): void {
        this.openActionMenuId = null;
        this.formError = "";
        this.successMessage = "";

        this.financePaymentsApi.deletePayment(paymentId).subscribe({
            next: () => {
                this.payments = this.payments.filter((payment) => payment.id !== paymentId);
                this.successMessage = "Pago eliminado.";
            },
            error: (error) => {
                this.formError = this.resolveErrorMessage(error, "No se pudo eliminar el pago en backend.");
            },
        });
    }

    viewPayment(paymentId: number): void {
        this.openActionMenuId = null;
        const payment = this.payments.find((currentPayment) => currentPayment.id === paymentId);
        if (!payment) {
            return;
        }

        this.successMessage = `Pago ${payment.code} - Factura ${payment.invoiceNumber}: ${payment.amount.toLocaleString("es-CO")} ${payment.currencyCode}.`;
    }

    downloadReceipt(paymentId: number): void {
        this.openActionMenuId = null;
        const payment = this.payments.find((currentPayment) => currentPayment.id === paymentId);
        if (!payment) {
            return;
        }

        if (!payment.receiptFileName) {
            this.formError = "Este pago no tiene recibo adjunto para descargar.";
            return;
        }

        this.successMessage = `Simulacion de descarga de recibo: ${payment.receiptFileName}.`;
    }

    exportPayments(): void {
        const payload = JSON.stringify(this.filteredPayments, null, 2);
        if (typeof window === "undefined") {
            return;
        }

        const blob = new Blob([payload], { type: "application/json" });
        const fileUrl = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = fileUrl;
        anchor.download = `pagos-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        window.URL.revokeObjectURL(fileUrl);
    }

    onInvoiceChange(): void {
        const linkedInvoice = this.invoiceOptions.find((invoice) => invoice.number === this.draft.invoiceNumber);
        if (!linkedInvoice) {
            return;
        }

        if (!this.draft.project) {
            this.draft.project = linkedInvoice.project;
        }

        if (!this.draft.amount || this.draft.amount <= 0) {
            this.draft.amount = linkedInvoice.amount;
        }
    }

    onCurrencyChange(): void {
        const defaultRateByCurrency: Record<CurrencyCode, number> = {
            COP: 1,
            USD: 3900,
            EUR: 4300,
        };
        this.draft.exchangeRate = defaultRateByCurrency[this.draft.currencyCode];
    }

    onReceiptSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        this.draft.receiptFileName = file ? file.name : "";
    }

    private getDefaultDraft(): PaymentDraft {
        return {
            project: "",
            invoiceNumber: "",
            paidAt: this.getTodayIsoDate(),
            amount: null,
            currencyCode: "COP",
            exchangeRate: 1,
            transactionId: "",
            paymentGateway: "",
            bankAccountId: null,
            receiptFileName: "",
            notes: "",
            status: "Completado",
            reteFuente: 0,
            reteIva: 0,
            reteIca: 0,
            paymentDate: "",
            retentionComments: "",
        };
    }

    private loadPaymentsFromApi(): void {
        this.formError = "";

        this.financePaymentsApi.listPayments().subscribe({
            next: (items) => {
                this.payments = items.map((item) => this.normalizePaymentRecord(item));
            },
            error: (error) => {
                // Sin fallback mock: si el servidor falla, la lista queda vacía
                // y el error es visible.
                this.payments = [];
                this.formError = this.resolveErrorMessage(error, "No se pudieron cargar pagos desde backend.");
            },
        });
    }

    private toPaymentPayload(record: PaymentRecord): UpsertFinancePaymentRequest {
        return {
            orderNumber: Math.max(0, Math.trunc(this.toPositiveNumber(record.orderNumber))),
            code: record.code.trim(),
            project: record.project.trim(),
            invoiceNumber: record.invoiceNumber.trim(),
            client: record.client.trim(),
            purchaseOrder: record.purchaseOrder.trim(),
            amount: this.toPositiveNumber(record.amount),
            paidAt: record.paidAt,
            paymentGateway: record.paymentGateway.trim(),
            status: record.status,
            currencyCode: record.currencyCode,
            exchangeRate: this.toPositiveNumber(record.exchangeRate),
            transactionId: record.transactionId.trim(),
            bankAccountId: record.bankAccountId,
            bankAccountName: record.bankAccountName.trim(),
            receiptFileName: record.receiptFileName.trim(),
            notes: record.notes.trim(),
            reteFuente: this.toPositiveNumber(record.reteFuente),
            reteIva: this.toPositiveNumber(record.reteIva),
            reteIca: this.toPositiveNumber(record.reteIca),
            retentionComments: record.retentionComments.trim(),
            paymentDate: record.paymentDate.trim(),
        };
    }

    private normalizePaymentRecord(record: PaymentRecord): PaymentRecord {
        return {
            ...record,
            id: Math.max(0, Math.trunc(Number(record.id || 0))),
            orderNumber: Math.max(0, Math.trunc(Number(record.orderNumber || 0))),
            code: String(record.code || "").trim(),
            project: String(record.project || "").trim(),
            invoiceNumber: String(record.invoiceNumber || "").trim(),
            client: String(record.client || "").trim(),
            purchaseOrder: String(record.purchaseOrder || "").trim(),
            amount: this.toPositiveNumber(record.amount),
            paidAt: String(record.paidAt || "").trim(),
            paymentGateway: String(record.paymentGateway || "").trim(),
            status: (String(record.status || "").trim() as PaymentStatus) || "Pendiente",
            currencyCode: (String(record.currencyCode || "").trim() as CurrencyCode) || "COP",
            exchangeRate: this.toPositiveNumber(record.exchangeRate),
            transactionId: String(record.transactionId || "").trim(),
            bankAccountId: record.bankAccountId,
            bankAccountName: String(record.bankAccountName || "").trim(),
            receiptFileName: String(record.receiptFileName || "").trim(),
            notes: String(record.notes || "").trim(),
            reteFuente: this.toPositiveNumber(record.reteFuente),
            reteIva: this.toPositiveNumber(record.reteIva),
            reteIca: this.toPositiveNumber(record.reteIca),
            retentionComments: String(record.retentionComments || "").trim(),
            paymentDate: String(record.paymentDate || "").trim(),
        };
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        return error instanceof Error && error.message.trim() ? error.message : fallback;
    }

    private getNextOrderNumber(): number {
        if (this.payments.length === 0) {
            return 1;
        }

        return Math.max(...this.payments.map((payment) => payment.orderNumber)) + 1;
    }

    private buildPaymentCode(): string {
        const nextIndex = this.getNextOrderNumber();
        return `PAY-${nextIndex.toString().padStart(4, "0")}`;
    }

    private resolveAccountName(accountId: number | null): string {
        if (accountId === null) {
            return "";
        }
        const account = this.financeAccounts.find((currentAccount) => currentAccount.id === accountId);
        if (!account) {
            return "";
        }
        return `${account.bankName} - ${account.accountNumber}`;
    }

    private getTodayIsoDate(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private toPositiveNumber(value: number | string | null | undefined): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return 0;
        }
        return parsed;
    }
}
