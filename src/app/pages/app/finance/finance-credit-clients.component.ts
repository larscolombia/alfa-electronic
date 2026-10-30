import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { CrmClientRecord, CrmClientsApiService, UpsertCrmClientRequest } from "../../../services/crm-clients-api.service";

interface CreditDraft {
    clientId: string | null;
    creditEnabled: boolean;
    creditLimit: number | null;
    consumed: number | null;
    lastPaymentDate: string;
    paymentTermDays: number | null;
}

@Component({
    selector: "app-finance-credit-clients",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Financiero</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Clientes a crédito</li>
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

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom">
                    <h6 class="mb-0">{{ editingClientId === null ? "Asignar cupo de crédito" : "Editar cupo de crédito" }}</h6>
                </div>
                <div class="card-body">
                    <form (ngSubmit)="saveCreditAssignment()" novalidate>
                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Cliente</label>
                                <select class="form-select" [(ngModel)]="draft.clientId" name="clientId" required>
                                    <option [ngValue]="null">Selecciona un cliente</option>
                                    @for (client of clients; track client.id) {
                                        <option [ngValue]="client.id">{{ client.nombre }} - {{ client.empresa }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-2">
                                <label class="form-label d-block">Habilitar credito</label>
                                <div class="form-check mt-2">
                                    <input class="form-check-input" type="checkbox" id="creditEnabled" [(ngModel)]="draft.creditEnabled" name="creditEnabled" />
                                    <label class="form-check-label" for="creditEnabled">Activo</label>
                                </div>
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Cupo maximo</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.creditLimit" name="creditLimit" placeholder="Por ejemplo, 10000000" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Cupo consumido</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.consumed" name="consumed" placeholder="Por ejemplo, 2500000" />
                            </div>

                            <div class="col-12 col-lg-4">
                                <label class="form-label">Fecha ultimo pago</label>
                                <input class="form-control" type="date" [(ngModel)]="draft.lastPaymentDate" name="lastPaymentDate" />
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Plazo de pago (dias)</label>
                                <input class="form-control" type="number" min="0" step="1" [(ngModel)]="draft.paymentTermDays" name="paymentTermDays" placeholder="Por ejemplo, 30" />
                            </div>
                        </div>

                        @if (draft.creditEnabled) {
                            <div class="alert alert-info border mt-3 mb-0">
                                <strong>Cliente con crédito.</strong>
                                Cupo disponible estimado:
                                {{ calculateDraftAvailableCredit() | currency: "COP" : "symbol" : "1.0-0" }}
                            </div>
                        }

                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-theme" type="submit">Guardar</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="resetForm()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom">
                    <h6 class="mb-0">Estado de crédito por cliente</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Empresa</th>
                                    <th class="text-end">Cupo máximo</th>
                                    <th class="text-end">Consumido</th>
                                    <th class="text-end">Disponible</th>
                                    <th>Ultimo pago</th>
                                    <th class="text-end">Dias desde ultimo pago</th>
                                    <th class="text-end">Dias en mora</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (client of clients; track client.id) {
                                    <tr>
                                        <td>
                                            <strong>{{ client.nombre }}</strong>
                                            <p class="small text-secondary mb-0">{{ client.correo }}</p>
                                        </td>
                                        <td>{{ client.empresa }}</td>
                                        <td class="text-end">
                                            @if (client.credito.enabled) {
                                                {{ client.credito.creditLimit | currency: "COP" : "symbol" : "1.0-0" }}
                                            } @else {
                                                --
                                            }
                                        </td>
                                        <td class="text-end">
                                            @if (client.credito.enabled) {
                                                {{ client.credito.consumed | currency: "COP" : "symbol" : "1.0-0" }}
                                            } @else {
                                                --
                                            }
                                        </td>
                                        <td class="text-end">
                                            @if (client.credito.enabled) {
                                                {{ getAvailableCredit(client) | currency: "COP" : "symbol" : "1.0-0" }}
                                            } @else {
                                                --
                                            }
                                        </td>
                                        <td>{{ client.credito.lastPaymentDate || "--" }}</td>
                                        <td class="text-end">{{ getDaysSinceLastPayment(client) ?? "--" }}</td>
                                        <td class="text-end">
                                            <span class="badge rounded-pill" [class.text-bg-danger]="getDaysInArrears(client) > 0" [class.text-bg-success]="getDaysInArrears(client) === 0">
                                                {{ getDaysInArrears(client) }}
                                            </span>
                                        </td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-theme" type="button" (click)="editClientCredit(client.id)">Editar</button>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="9" class="text-center py-4 text-secondary">No hay clientes registrados.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [],
})
export class FinanceCreditClientsComponent {
    clients: CrmClientRecord[] = [];
    editingClientId: string | null = null;
    successMessage = "";
    formError = "";
    isSaving = false;
    draft: CreditDraft = this.getDefaultDraft();

    constructor(private readonly crmClientsApi: CrmClientsApiService) {
        void this.loadClients();
    }

    async saveCreditAssignment(): Promise<void> {
        this.successMessage = "";
        this.formError = "";

        if (this.isSaving) {
            return;
        }

        if (this.draft.clientId === null) {
            this.formError = "Selecciona un cliente.";
            return;
        }

        const client = this.clients.find((item) => item.id === this.draft.clientId);
        if (!client) {
            this.formError = "El cliente seleccionado no existe.";
            return;
        }

        const creditLimit = this.toPositiveNumber(this.draft.creditLimit);
        const consumed = this.toPositiveNumber(this.draft.consumed);
        const paymentTermDays = Math.max(0, Math.trunc(this.toPositiveNumber(this.draft.paymentTermDays)));

        if (this.draft.creditEnabled && creditLimit <= 0) {
            this.formError = "El cupo maximo debe ser mayor a cero para habilitar credito.";
            return;
        }

        if (consumed > creditLimit && this.draft.creditEnabled) {
            this.formError = "El cupo consumido no puede ser mayor que el cupo maximo.";
            return;
        }

        const payload: UpsertCrmClientRequest = {
            nombre: client.nombre,
            correo: client.correo,
            empresa: client.empresa,
            nit: client.nit,
            zona: client.zona,
            estado: client.estado,
            website: client.website ?? "",
            officePhone: client.officePhone ?? "",
            country: client.country ?? "",
            city: client.city ?? "",
            address: client.address ?? "",
            credito: {
                enabled: this.draft.creditEnabled,
                creditLimit,
                consumed,
                lastPaymentDate: this.draft.lastPaymentDate,
                paymentTermDays,
            },
        };

        try {
            this.isSaving = true;
            await firstValueFrom(this.crmClientsApi.updateClient(client.id, payload));
            await this.loadClients();
            this.successMessage = "Cupo de credito actualizado correctamente.";
            this.resetForm();
        } catch (error) {
            this.formError = error instanceof Error ? error.message : "No se pudo actualizar el cupo de credito.";
        } finally {
            this.isSaving = false;
        }
    }

    editClientCredit(clientId: string): void {
        this.successMessage = "";
        this.formError = "";

        const client = this.clients.find((item) => item.id === clientId);
        if (!client) {
            return;
        }

        this.editingClientId = clientId;
        this.draft = {
            clientId: client.id,
            creditEnabled: client.credito.enabled,
            creditLimit: client.credito.creditLimit,
            consumed: client.credito.consumed,
            lastPaymentDate: client.credito.lastPaymentDate,
            paymentTermDays: client.credito.paymentTermDays,
        };
    }

    resetForm(): void {
        this.editingClientId = null;
        this.formError = "";
        this.draft = this.getDefaultDraft();
    }

    getAvailableCredit(client: CrmClientRecord): number {
        return Math.max(0, Number(client.credito.creditLimit || 0) - Number(client.credito.consumed || 0));
    }

    getDaysInArrears(client: CrmClientRecord): number {
        const daysSince = this.getDaysSinceLastPayment(client);
        if (daysSince === null) {
            return 0;
        }
        return Math.max(0, daysSince - Number(client.credito.paymentTermDays || 0));
    }

    getDaysSinceLastPayment(client: CrmClientRecord): number | null {
        const value = (client.credito.lastPaymentDate || "").trim();
        if (!value) {
            return null;
        }
        const parsed = new Date(`${value}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }
        const diffMs = Date.now() - parsed.getTime();
        return Math.max(0, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
    }

    calculateDraftAvailableCredit(): number {
        const limit = this.toPositiveNumber(this.draft.creditLimit);
        const consumed = this.toPositiveNumber(this.draft.consumed);
        return Math.max(0, limit - consumed);
    }

    private async loadClients(): Promise<void> {
        this.clients = await firstValueFrom(this.crmClientsApi.listClients());
    }

    private getDefaultDraft(): CreditDraft {
        return {
            clientId: null,
            creditEnabled: true,
            creditLimit: null,
            consumed: null,
            lastPaymentDate: "",
            paymentTermDays: 30,
        };
    }

    private toPositiveNumber(value: number | null): number {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
            return 0;
        }
        return numeric;
    }
}
