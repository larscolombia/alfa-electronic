import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { BillingInvoice, FinanceBillingStore } from "./finance-billing.store";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
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
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Facturación</h5>
                    <p class="text-secondary small mb-0">Administra facturas emitidas, recurrentes y conversion de horas a cobro.</p>
                </div>
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
                                        </td>
                                        <td class="text-end invoice-actions">
                                            <div class="dropdown d-inline-block">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" [id]="'invoice-actions-' + invoice.id" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-end" [attr.aria-labelledby]="'invoice-actions-' + invoice.id">
                                                    <li><button class="dropdown-item" type="button" (click)="duplicateInvoice(invoice.id)">Duplicar factura</button></li>
                                                    <li><button class="dropdown-item" type="button" (click)="markStatus(invoice.id, 'Pagado')">Marcar como pagada</button></li>
                                                    <li><button class="dropdown-item" type="button" (click)="markStatus(invoice.id, 'Cancelado')">Marcar como cancelada</button></li>
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
        </div>
    `,
})
export class FinanceBillingComponent implements OnInit {
    readonly clients = FinanceBillingStore.getClients();
    readonly statuses = ["Borrador", "Pendiente", "Pago parcial", "Pagado", "Cancelado", "Enviado"] as const;

    invoices: BillingInvoice[] = [];
    filteredInvoices: BillingInvoice[] = [];
    clientFilter = "";
    statusFilter = "";
    searchTerm = "";
    message = "";
    private apiBaseUrl = resolveApiBaseUrl();

    constructor(
        private readonly financeBillingApi: FinanceBillingApiService,
        private readonly changeDetector: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        setTimeout(() => void this.loadInvoices());
    }

    refreshFilteredInvoices(): void {
        const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();
        this.filteredInvoices = this.invoices.filter((invoice) => {
            const matchesClient = !this.clientFilter || invoice.clientId === this.clientFilter;
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
        };

        try {
            await firstValueFrom(this.financeBillingApi.createInvoice(duplicatedInvoice));
            this.message = `Se duplicó ${this.invoiceCode(duplicatedInvoice)}.`;
            await this.loadInvoices();
        } catch {
            const fallbackInvoice = FinanceBillingStore.duplicateInvoice(invoiceId);
            if (!fallbackInvoice) {
                return;
            }
            this.message = `Se duplicó ${this.invoiceCode(fallbackInvoice)}.`;
            await this.loadInvoices();
        }
    }

    async markStatus(invoiceId: number, status: BillingInvoice["status"]): Promise<void> {
        const sourceInvoice = this.invoices.find((invoice) => invoice.id === invoiceId);
        if (!sourceInvoice) {
            return;
        }

        try {
            await firstValueFrom(this.financeBillingApi.updateInvoice(invoiceId, { ...sourceInvoice, status }));
            this.message = `Factura actualizada a estado ${status}.`;
            await this.loadInvoices();
        } catch {
            FinanceBillingStore.updateInvoiceStatus(invoiceId, status);
            this.message = `Factura actualizada a estado ${status}.`;
            await this.loadInvoices();
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

    exportCSV(): void {
        window.open(this.apiBaseUrl + "/api/v1/finance/export-oasis/csv", "_blank");
    }

    exportTXT(): void {
        window.open(this.apiBaseUrl + "/api/v1/finance/export-oasis/csv", "_blank");
    }

    private async loadInvoices(): Promise<void> {
        try {
            this.invoices = await firstValueFrom(this.financeBillingApi.listInvoices()) as BillingInvoice[];
            FinanceBillingStore.saveInvoices(this.invoices);
        } catch {
            this.invoices = FinanceBillingStore.getInvoices();
        }
        this.refreshFilteredInvoices();
        this.changeDetector.detectChanges();
    }
}