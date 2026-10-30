import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { BillingClient, BillingRecurringInvoice, FinanceBillingStore, resolveStoredClientId } from "./finance-billing.store";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";

@Component({
    selector: "app-finance-recurring-invoices",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col-12 col-sm-auto text-sm-end d-flex gap-2 justify-content-sm-end flex-wrap">
                    <a class="btn btn-theme" routerLink="/app/finance-facturacion-recurrentes-crear"><i class="bi bi-plus-lg me-1"></i>Agregar Factura Recurrente</a>
                    <button class="btn btn-outline-secondary" type="button" (click)="exportRecurringInvoices()"><i class="bi bi-file-earmark-arrow-down me-1"></i>Exportar</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Financiero</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-facturacion">Facturación</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Facturas recurrentes</li>
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
                            <select class="form-select" [(ngModel)]="clientFilter">
                                <option value="">Todo</option>
                                @for (client of clients; track client.id) {
                                    <option [value]="client.id">{{ client.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-3">
                            <label class="form-label">Estado</label>
                            <select class="form-select" [(ngModel)]="statusFilter">
                                <option value="">Todos</option>
                                @for (status of statuses; track status) {
                                    <option [value]="status">{{ status }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-lg-4">
                            <label class="form-label">Buscar</label>
                            <input class="form-control" type="search" placeholder="Empieza a escribir para buscar" [(ngModel)]="searchTerm" />
                        </div>
                        <div class="col-12 col-lg-2">
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
                                    <th>#</th>
                                    <th>Cliente</th>
                                    <th>Fecha de inicio</th>
                                    <th>Próxima factura</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (invoice of filteredRecurringInvoices; track invoice.id; let index = $index) {
                                    <tr>
                                        <td>{{ index + 1 }}</td>
                                        <td>
                                            <strong class="d-block">{{ invoice.clientName }}</strong>
                                            <small class="text-secondary">{{ invoice.projectName || "Sin proyecto" }}</small>
                                        </td>
                                        <td>{{ invoice.startDate | date: "dd/MM/yyyy" }}</td>
                                        <td>{{ invoice.nextIssueDate | date: "dd/MM/yyyy" }}</td>
                                        <td>{{ invoice.total | currency: invoice.currencyCode : "symbol" : "1.0-0" }}</td>
                                        <td>
                                            <span class="badge rounded-pill"
                                                [class.text-bg-success]="invoice.status === 'Activa'"
                                                [class.text-bg-warning]="invoice.status === 'Pausada'"
                                                [class.text-bg-secondary]="invoice.status === 'Finalizada'"
                                            >
                                                {{ invoice.status }}
                                            </span>
                                        </td>
                                        <td class="text-end">
                                            <div class="dropdown d-inline-block">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" [id]="'recurring-actions-' + invoice.id" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <i class="bi bi-three-dots-vertical"></i>
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-end" [attr.aria-labelledby]="'recurring-actions-' + invoice.id">
                                                    <li>
                                                        <button class="dropdown-item" type="button" (click)="toggleStatus(invoice)">
                                                            {{ invoice.status === "Activa" ? "Pausar" : "Activar" }} automatización
                                                        </button>
                                                    </li>
                                                    <li><button class="dropdown-item text-danger" type="button" (click)="removeInvoice(invoice.id)">Eliminar</button></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="7" class="text-center text-secondary py-5">Ningún dato disponible en esta tabla.</td>
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
export class FinanceRecurringInvoicesComponent {
    // Getter (no campo): se re-lee cuando ensureLoaded() termina; capturado
    // una sola vez el filtro no vería los clientes reales del CRM.
    get clients(): BillingClient[] {
        return FinanceBillingStore.getClients();
    }
    readonly statuses = ["Activa", "Pausada", "Finalizada"] as const;

    recurringInvoices: BillingRecurringInvoice[] = [];
    clientFilter = "";
    statusFilter = "";
    searchTerm = "";
    message = "";
    errorMessage = "";

    constructor(private readonly financeBillingApi: FinanceBillingApiService) {
        void this.loadRecurringInvoices();
    }

    get filteredRecurringInvoices(): BillingRecurringInvoice[] {
        const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();

        return this.recurringInvoices.filter((invoice) => {
            // Comparación con ids canónicos: ver resolveStoredClientId en el
            // store — las facturas históricas guardan 'crm-client-<uuid>'.
            const matchesClient =
                !this.clientFilter || resolveStoredClientId(invoice.clientId) === resolveStoredClientId(this.clientFilter);
            const matchesStatus = !this.statusFilter || invoice.status === this.statusFilter;
            const matchesSearch =
                !normalizedSearchTerm ||
                invoice.clientName.toLowerCase().includes(normalizedSearchTerm) ||
                invoice.projectName.toLowerCase().includes(normalizedSearchTerm) ||
                invoice.frequency.toLowerCase().includes(normalizedSearchTerm);

            return matchesClient && matchesStatus && matchesSearch;
        });
    }

    clearFilters(): void {
        this.clientFilter = "";
        this.statusFilter = "";
        this.searchTerm = "";
    }

    async toggleStatus(invoice: BillingRecurringInvoice): Promise<void> {
        const nextStatus = invoice.status === "Activa" ? "Pausada" : "Activa";
        try {
            this.errorMessage = "";
            await firstValueFrom(this.financeBillingApi.updateRecurringInvoice(invoice.id, { ...invoice, status: nextStatus }));
            this.message = `La factura recurrente quedó ${nextStatus.toLowerCase()}.`;
            await this.loadRecurringInvoices();
        } catch (error) {
            // Sin fallback local: el cambio solo vale si quedó en el servidor.
            this.message = "";
            this.errorMessage = error instanceof Error ? error.message : "No se pudo actualizar la factura recurrente en el servidor.";
        }
    }

    async removeInvoice(invoiceId: number): Promise<void> {
        try {
            this.errorMessage = "";
            await firstValueFrom(this.financeBillingApi.deleteRecurringInvoice(invoiceId));
            this.message = "Se eliminó la automatización seleccionada.";
            await this.loadRecurringInvoices();
        } catch (error) {
            this.message = "";
            this.errorMessage = error instanceof Error ? error.message : "No se pudo eliminar la factura recurrente en el servidor.";
        }
    }

    exportRecurringInvoices(): void {
        if (typeof window === "undefined") {
            return;
        }

        const exportBlob = new Blob([JSON.stringify(this.filteredRecurringInvoices, null, 2)], { type: "application/json" });
        const exportUrl = window.URL.createObjectURL(exportBlob);
        const anchor = window.document.createElement("a");

        anchor.href = exportUrl;
        anchor.download = "facturas-recurrentes-comercial.json";
        anchor.click();

        window.URL.revokeObjectURL(exportUrl);
    }

    private async loadRecurringInvoices(): Promise<void> {
        try {
            this.recurringInvoices = await firstValueFrom(this.financeBillingApi.listRecurringInvoices()) as BillingRecurringInvoice[];
            FinanceBillingStore.saveRecurringInvoices(this.recurringInvoices);
            this.errorMessage = "";
        } catch (error) {
            this.recurringInvoices = FinanceBillingStore.getRecurringInvoices();
            this.errorMessage = error instanceof Error ? error.message : "No se pudieron cargar las facturas recurrentes del servidor.";
        }
    }
}