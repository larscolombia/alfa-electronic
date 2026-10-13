import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { FinanceAccount, FinanceAccountsStore } from "./finance-accounts.store";
import {
    BillingCurrencyCode,
    BillingDiscountMode,
    BillingFrequency,
    BillingInvoiceItem,
    BillingRecurringInvoice,
    BillingTaxCalculation,
    FinanceBillingStore,
    computeInvoiceSummary,
    computeNextIssueDate,
} from "./finance-billing.store";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";

interface RecurringInvoiceDraft {
    clientId: string;
    projectId: string;
    currencyCode: BillingCurrencyCode;
    taxCalculation: BillingTaxCalculation;
    bankAccountId: number | null;
    allowClientStop: boolean;
    showShippingAddress: boolean;
    frequency: BillingFrequency;
    startDate: string;
    immediateStart: boolean;
    cycles: number;
    generatedBy: string;
    discountValue: number;
    discountMode: BillingDiscountMode;
    note: string;
    terms: string;
}

const MAX_NOTE_LENGTH = 5000;
const MAX_TERMS_LENGTH = 5000;
const MAX_GENERATED_BY_LENGTH = 140;

@Component({
    selector: "app-finance-recurring-invoice-create",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    styles: [
        `
            .preview-box {
                border: 2px dashed rgba(15, 23, 42, 0.28);
                border-radius: 0.75rem;
                padding: 1rem 1.25rem;
                min-height: 180px;
            }

            .summary-grid {
                display: grid;
                grid-template-columns: 1fr auto;
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

            .summary-value {
                min-width: 170px;
                text-align: right;
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Agregar Factura Recurrente</h5>
                    <p class="text-secondary small mb-0">Programa facturas automáticas con frecuencia, condiciones y detalle de cobro.</p>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Financiero</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-facturacion">Facturación</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-facturacion-recurrentes">Facturas recurrentes</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Agregar</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Factura Detalles</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3">
                        <div class="col-12 col-lg-3">
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
                            <label class="form-label">Moneda</label>
                            <select class="form-select" [(ngModel)]="draft.currencyCode" name="currencyCode">
                                @for (currencyOption of currencyOptions; track currencyOption.value) {
                                    <option [value]="currencyOption.value">{{ currencyOption.label }}</option>
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
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Cuenta bancaria</label>
                            <select class="form-select" [(ngModel)]="draft.bankAccountId" name="bankAccountId">
                                <option [ngValue]="null">--</option>
                                @for (account of bankAccounts; track account.id) {
                                    <option [ngValue]="account.id">{{ bankLabel(account) }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-3 d-flex align-items-end">
                            <div class="form-check mb-1">
                                <input class="form-check-input" type="checkbox" id="allowStopRecurring" [(ngModel)]="draft.allowClientStop" name="allowClientStop" />
                                <label class="form-check-label" for="allowStopRecurring">El cliente puede detener la recurrente.</label>
                            </div>
                        </div>
                        <div class="col-12 col-lg-3 d-flex align-items-end">
                            <div class="form-check mb-1">
                                <input class="form-check-input" type="checkbox" id="showShippingAddress" [(ngModel)]="draft.showShippingAddress" name="showShippingAddress" />
                                <label class="form-check-label" for="showShippingAddress">Mostrar dirección de envío</label>
                            </div>
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

                    <hr class="my-4" />

                    <div class="row gx-3 gy-3 align-items-start">
                        <div class="col-12 col-xl-8">
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Frecuencia de facturación</label>
                                    <select class="form-select" [(ngModel)]="draft.frequency" name="frequency">
                                        @for (frequency of frequencyOptions; track frequency) {
                                            <option [value]="frequency">{{ frequency }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Fecha de inicio</label>
                                    <input class="form-control" type="date" [(ngModel)]="draft.startDate" name="startDate" />
                                </div>
                                <div class="col-12 col-lg-4 d-flex align-items-end">
                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="immediateStart" [(ngModel)]="draft.immediateStart" name="immediateStart" />
                                        <label class="form-check-label" for="immediateStart">Inicio inmediato</label>
                                    </div>
                                </div>
                                <div class="col-12 col-lg-4">
                                    <label class="form-label">Recuento total</label>
                                    <input class="form-control" type="number" min="-1" step="1" [(ngModel)]="draft.cycles" name="cycles" />
                                    <small class="text-secondary">Establece -1 para ciclos infinitos.</small>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 col-xl-4">
                            <div class="preview-box">
                                <p class="mb-3"><strong>Se cobrará al cliente {{ draft.frequency.toLowerCase() }}</strong></p>
                                <p class="mb-3">La primera factura se generará el <strong>{{ firstIssueDate | date: "dd/MM/yyyy" }}</strong></p>
                                <p class="mb-3">La próxima fecha de la factura será <strong>{{ secondIssueDate | date: "dd/MM/yyyy" }}</strong></p>
                                <p class="mb-0">Y así sucesivamente...</p>
                            </div>
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
                                    <th class="text-end">Monto</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (item of items; track item.id) {
                                    <tr>
                                        <td>
                                            <input class="form-control mb-2" type="text" placeholder="Nombre del ítem" [(ngModel)]="item.name" [name]="'recurring-name-' + item.id" />
                                            <textarea class="form-control" rows="3" placeholder="Ingresa una descripción (opcional)" [(ngModel)]="item.description" [name]="'recurring-description-' + item.id"></textarea>
                                        </td>
                                        <td>
                                            <input class="form-control mb-2" type="number" min="0" step="1" [(ngModel)]="item.quantity" [name]="'recurring-qty-' + item.id" />
                                            <select class="form-select" [(ngModel)]="item.unitLabel" [name]="'recurring-unit-' + item.id">
                                                @for (unit of unitOptions; track unit) {
                                                    <option [value]="unit">{{ unit }}</option>
                                                }
                                            </select>
                                        </td>
                                        <td>
                                            <input class="form-control" type="number" min="0" step="100" [(ngModel)]="item.unitPrice" [name]="'recurring-price-' + item.id" />
                                        </td>
                                        <td>
                                            <select class="form-select" [(ngModel)]="item.taxRate" [name]="'recurring-tax-' + item.id">
                                                @for (taxOption of taxOptions; track taxOption.value) {
                                                    <option [ngValue]="taxOption.value">{{ taxOption.label }}</option>
                                                }
                                            </select>
                                        </td>
                                        <td class="text-end fw-bold">{{ lineAmount(item) | currency: draft.currencyCode : "symbol" : "1.0-0" }}</td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeItem(item.id)"><i class="bi bi-x-lg"></i></button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>

                    <button class="btn btn-link px-0" type="button" (click)="addEmptyItem()"><i class="bi bi-plus-circle me-1"></i>Agregar Ítem</button>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                <div class="col-12 col-xl-6">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <label class="form-label">Nota Para El Destinatario</label>
                            <textarea class="form-control mb-3" rows="4" maxlength="5000" placeholder="por ejemplo, Gracias por tu negocio" [(ngModel)]="draft.note" name="note"></textarea>
                            <label class="form-label">Términos Y Condiciones</label>
                            <textarea class="form-control" rows="8" maxlength="5000" [(ngModel)]="draft.terms" name="terms"></textarea>
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
                        </div>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-wrap gap-2 mb-5">
                <button class="btn btn-theme" type="button" (click)="save()">Guardar</button>
                <a class="btn btn-link" routerLink="/app/finance-facturacion-recurrentes">Cancelar</a>
            </div>
        </div>
    `,
})
export class FinanceRecurringInvoiceCreateComponent {
    readonly clients = FinanceBillingStore.getClients();
    readonly catalog = FinanceBillingStore.getCatalog();
    readonly taxOptions = FinanceBillingStore.getTaxOptions();
    readonly currencyOptions = FinanceBillingStore.getCurrencyOptions();
    readonly taxCalculationOptions = FinanceBillingStore.getTaxCalculationOptions();
    readonly frequencyOptions = FinanceBillingStore.getFrequencyOptions();
    readonly unitOptions = FinanceBillingStore.getUnitOptions();
    readonly generatedByOptions = FinanceBillingStore.getGeneratedByOptions();
    readonly bankAccounts = FinanceAccountsStore.getAccounts();

    draft = this.createDraft();
    items: BillingInvoiceItem[] = [this.createEmptyItem()];
    selectedCatalogId = "";
    formError = "";
    isSaving = false;
    private itemSequence = 0;

    constructor(
        private readonly router: Router,
        private readonly financeBillingApi: FinanceBillingApiService,
    ) {}

    get availableProjects() {
        return FinanceBillingStore.getProjects(this.draft.clientId || undefined);
    }

    get scheduleStartDate(): string {
        return this.draft.immediateStart ? new Date().toISOString().slice(0, 10) : this.draft.startDate;
    }

    get firstIssueDate(): string {
        return this.draft.immediateStart ? this.scheduleStartDate : computeNextIssueDate(this.scheduleStartDate, this.draft.frequency);
    }

    get secondIssueDate(): string {
        return computeNextIssueDate(this.firstIssueDate, this.draft.frequency);
    }

    get summary() {
        return computeInvoiceSummary(this.items, this.draft.discountValue, this.draft.discountMode, this.draft.taxCalculation);
    }

    onClientChange(): void {
        if (!this.availableProjects.some((project) => project.id === this.draft.projectId)) {
            this.draft.projectId = this.availableProjects[0]?.id || "";
        }
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

    async save(): Promise<void> {
        this.formError = "";
        if (this.isSaving) {
            return;
        }

        const selectedClient = FinanceBillingStore.findClient(this.draft.clientId);
        if (!selectedClient) {
            this.formError = "Debes seleccionar un cliente para la factura recurrente.";
            return;
        }

        const sanitizedItems = this.items.filter((item) => item.name.trim().length > 0 && item.quantity > 0);
        if (!sanitizedItems.length) {
            this.formError = "Debes agregar al menos un ítem válido.";
            return;
        }

        const validationError = this.validateDraftAndItems(sanitizedItems);
        if (validationError) {
            this.formError = validationError;
            return;
        }

        const selectedProject = FinanceBillingStore.findProject(this.draft.projectId);
        const selectedAccount = this.bankAccounts.find((account) => account.id === this.draft.bankAccountId);
        const summary = computeInvoiceSummary(sanitizedItems, this.draft.discountValue, this.draft.discountMode, this.draft.taxCalculation);

        const recurringInvoice: BillingRecurringInvoice = {
            id: FinanceBillingStore.getNextRecurringId(),
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            projectId: selectedProject?.id || "",
            projectName: selectedProject?.name || "",
            currencyCode: this.draft.currencyCode,
            taxCalculation: this.draft.taxCalculation,
            bankAccountId: this.draft.bankAccountId,
            bankAccountName: selectedAccount ? this.bankLabel(selectedAccount) : "--",
            frequency: this.draft.frequency,
            startDate: this.scheduleStartDate,
            nextIssueDate: this.firstIssueDate,
            cycles: this.draft.cycles,
            allowClientStop: this.draft.allowClientStop,
            showShippingAddress: this.draft.showShippingAddress,
            generatedBy: this.draft.generatedBy,
            items: sanitizedItems,
            discountValue: this.draft.discountValue,
            discountMode: this.draft.discountMode,
            subtotal: summary.subtotal,
            taxTotal: summary.taxTotal,
            total: summary.total,
            status: "Activa",
            note: this.draft.note.trim(),
            terms: this.draft.terms.trim(),
            createdAt: new Date().toISOString(),
        };

        try {
            this.isSaving = true;
            const createdRecurringInvoice = await firstValueFrom(this.financeBillingApi.createRecurringInvoice(recurringInvoice));
            FinanceBillingStore.addRecurringInvoice(createdRecurringInvoice as BillingRecurringInvoice);
            void this.router.navigateByUrl("/app/finance-facturacion-recurrentes");
        } catch (error) {
            this.formError = error instanceof Error ? error.message : "No se pudo guardar la factura recurrente.";
        } finally {
            this.isSaving = false;
        }
    }

    private createDraft(): RecurringInvoiceDraft {
        return {
            clientId: "",
            projectId: "",
            currencyCode: "COP",
            taxCalculation: "Despues del descuento",
            bankAccountId: null,
            allowClientStop: true,
            showShippingAddress: false,
            frequency: "Diario",
            startDate: new Date().toISOString().slice(0, 10),
            immediateStart: false,
            cycles: -1,
            generatedBy: this.generatedByOptions[0],
            discountValue: 0,
            discountMode: "percent",
            note: "",
            terms: FinanceBillingStore.getDefaultTerms(),
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
        return `recurring-item-${Date.now()}-${this.itemSequence}`;
    }

    private validateDraftAndItems(items: BillingInvoiceItem[]): string {
        if (!this.draft.frequency.trim()) {
            return "Debes seleccionar una frecuencia de facturación válida.";
        }
        if (!this.draft.startDate.trim() || Number.isNaN(Date.parse(this.draft.startDate))) {
            return "Debes indicar una fecha de inicio válida.";
        }
        if (this.draft.cycles !== -1 && this.draft.cycles <= 0) {
            return "Los ciclos deben ser -1 o un número entero positivo.";
        }
        if (this.draft.discountValue < 0) {
            return "El descuento no puede ser negativo.";
        }
        if (this.draft.discountMode === "percent" && this.draft.discountValue > 100) {
            return "El descuento en porcentaje no puede superar 100.";
        }
        if (this.draft.generatedBy.trim().length > MAX_GENERATED_BY_LENGTH) {
            return "El campo Generado por supera el máximo permitido.";
        }
        if (this.draft.note.trim().length > MAX_NOTE_LENGTH) {
            return "La nota supera el máximo permitido de 5000 caracteres.";
        }
        if (this.draft.terms.trim().length > MAX_TERMS_LENGTH) {
            return "Los términos y condiciones superan el máximo permitido de 5000 caracteres.";
        }

        for (const item of items) {
            if (!item.name.trim()) {
                return "Todos los ítems deben tener nombre.";
            }
            if (item.quantity <= 0 || item.unitPrice <= 0) {
                return "Cada ítem debe tener cantidad y precio unitario mayores que cero.";
            }
            if (item.taxRate < 0 || item.taxRate > 100) {
                return "El impuesto de cada ítem debe estar entre 0 y 100.";
            }
        }

        return "";
    }
}