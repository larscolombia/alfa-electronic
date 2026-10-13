import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { WorkTimesheetEntry, WorkTimeTrackerService } from "../../../services/work-time-tracker.service";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
import { FinanceAccount, FinanceAccountsStore } from "./finance-accounts.store";
import {
    BillingCurrencyCode,
    BillingDiscountMode,
    BillingInvoice,
    BillingInvoiceItem,
    BillingTaxCalculation,
    FinanceBillingStore,
    computeInvoiceSummary,
    deriveInvoiceStatus,
} from "./finance-billing.store";

interface TimeInvoiceDraft {
    seriesPrefix: string;
    sequenceNumber: number;
    issueDate: string;
    dueDate: string;
    clientId: string;
    projectId: string;
    employee: string;
    startDate: string;
    endDate: string;
    hourlyRate: number;
    currencyCode: BillingCurrencyCode;
    taxCalculation: BillingTaxCalculation;
    bankAccountId: number | null;
    generatedBy: string;
    discountValue: number;
    discountMode: BillingDiscountMode;
    note: string;
}

@Component({
    selector: "app-finance-time-invoice",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Crear Registro De Tiempo Factura</h5>
                    <p class="text-secondary small mb-0">Convierte horas registradas en la hoja de tiempo en una factura lista para emitir.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/work-timesheet">Abrir hoja de tiempo</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-dashboard">Financiero</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-facturacion">Facturación</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Registro de tiempo</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            @if (!timesheetEntries.length) {
                <div class="alert alert-warning border">
                    No hay registros de tiempo aún. Crea entradas en <a routerLink="/app/work-timesheet">Hoja de tiempo</a> y vuelve para facturarlas.
                </div>
            } @else {
                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header">
                        <h6 class="mb-0">Datos de la factura</h6>
                    </div>
                    <div class="card-body">
                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Número de factura</label>
                                <div class="input-group">
                                    <span class="input-group-text">{{ draft.seriesPrefix }}</span>
                                    <input class="form-control" type="number" min="1" [(ngModel)]="draft.sequenceNumber" name="sequenceNumber" />
                                </div>
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
                                <label class="form-label">Cliente</label>
                                <select class="form-select" [(ngModel)]="draft.clientId" name="clientId" (ngModelChange)="onClientChange()">
                                    <option value="">--</option>
                                    @for (client of clients; track client.id) {
                                        <option [value]="client.id">{{ client.name }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-2">
                                <label class="form-label">Proyecto</label>
                                <select class="form-select" [(ngModel)]="draft.projectId" name="projectId" (ngModelChange)="onProjectChange()">
                                    <option value="">--</option>
                                    @for (project of availableProjects; track project.id) {
                                        <option [value]="project.id">{{ project.name }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Empleado</label>
                                <select class="form-select" [(ngModel)]="draft.employee" name="employee">
                                    <option value="">Todos</option>
                                    @for (employee of employees; track employee) {
                                        <option [value]="employee">{{ employee }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-2">
                                <label class="form-label">Desde</label>
                                <input class="form-control" type="date" [(ngModel)]="draft.startDate" name="startDate" />
                            </div>
                            <div class="col-12 col-lg-2">
                                <label class="form-label">Hasta</label>
                                <input class="form-control" type="date" [(ngModel)]="draft.endDate" name="endDate" />
                            </div>
                            <div class="col-12 col-lg-2">
                                <label class="form-label">Tarifa por hora</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.hourlyRate" name="hourlyRate" />
                            </div>
                            <div class="col-12 col-lg-2">
                                <label class="form-label">Moneda</label>
                                <select class="form-select" [(ngModel)]="draft.currencyCode" name="currencyCode">
                                    @for (currencyOption of currencyOptions; track currencyOption.value) {
                                        <option [value]="currencyOption.value">{{ currencyOption.label }}</option>
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
                            <div class="col-12 col-lg-2">
                                <label class="form-label">Impuesto</label>
                                <select class="form-select" [(ngModel)]="draft.taxCalculation" name="taxCalculation">
                                    @for (option of taxCalculationOptions; track option) {
                                        <option [value]="option">{{ option }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Nota</label>
                                <textarea class="form-control" rows="3" [(ngModel)]="draft.note" name="note"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3 mb-lg-4">
                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 class="mb-0">Entradas facturables</h6>
                            <p class="text-secondary small mb-0">Selecciona las horas que quieres convertir en factura.</p>
                        </div>
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="selectAllFiltered()">Seleccionar visibles</button>
                            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="clearSelection()">Limpiar selección</button>
                        </div>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Proyecto</th>
                                        <th>Tarea</th>
                                        <th>Empleado</th>
                                        <th>Inicio</th>
                                        <th>Fin</th>
                                        <th>Horas</th>
                                        <th class="text-end">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (entry of filteredEntries; track entry.id) {
                                        <tr>
                                            <td>
                                                <input class="form-check-input" type="checkbox" [checked]="isSelected(entry.id)" (change)="toggleEntry(entry.id, $event)" />
                                            </td>
                                            <td>{{ entry.project }}</td>
                                            <td>
                                                <strong class="d-block">{{ entry.task }}</strong>
                                                <small class="text-secondary">{{ entry.memo || "Sin memo" }}</small>
                                            </td>
                                            <td>{{ entry.employee }}</td>
                                            <td>{{ entry.startAt | date: "dd/MM/yyyy HH:mm" }}</td>
                                            <td>{{ entry.endAt | date: "dd/MM/yyyy HH:mm" }}</td>
                                            <td>{{ entry.totalHours | number: "1.2-2" }} h</td>
                                            <td class="text-end">{{ amountForEntry(entry) | currency: draft.currencyCode : "symbol" : "1.0-0" }}</td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="8" class="text-center text-secondary py-4">No hay entradas para los filtros seleccionados.</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-4">
                    <div class="card-body">
                        <div class="row gx-3 gy-3 align-items-center">
                            <div class="col-12 col-md-4">
                                <p class="small text-secondary mb-1">Entradas seleccionadas</p>
                                <h4 class="mb-0">{{ selectedEntries.length }}</h4>
                            </div>
                            <div class="col-12 col-md-4">
                                <p class="small text-secondary mb-1">Horas seleccionadas</p>
                                <h4 class="mb-0">{{ selectedHours | number: "1.2-2" }} h</h4>
                            </div>
                            <div class="col-12 col-md-4">
                                <p class="small text-secondary mb-1">Total estimado</p>
                                <h4 class="mb-0">{{ summary.total | currency: draft.currencyCode : "symbol" : "1.0-0" }}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex flex-wrap gap-2 mb-5">
                    <button class="btn btn-theme" type="button" (click)="saveInvoice()" [disabled]="isSaving">{{ isSaving ? "Guardando..." : "Guardar factura" }}</button>
                    <a class="btn btn-link" routerLink="/app/finance-facturacion">Cancelar</a>
                </div>
            }
        </div>
    `,
})
export class FinanceTimeInvoiceComponent {
    readonly clients = FinanceBillingStore.getClients();
    readonly currencyOptions = FinanceBillingStore.getCurrencyOptions();
    readonly taxCalculationOptions = FinanceBillingStore.getTaxCalculationOptions();
    readonly generatedByOptions = FinanceBillingStore.getGeneratedByOptions();
    readonly bankAccounts = FinanceAccountsStore.getAccounts();

    readonly timesheetEntries = this.workTimeTrackerService
        .getSnapshot()
        .timesheetEntries.slice()
        .sort((leftEntry, rightEntry) => rightEntry.startAt.localeCompare(leftEntry.startAt));

    readonly employees = Array.from(new Set(this.timesheetEntries.map((entry) => entry.employee))).sort((leftEmployee, rightEmployee) => leftEmployee.localeCompare(rightEmployee));

    draft = this.createDraft();
    selectedEntryIds: string[] = [];
    formError = "";
    isSaving = false;

    constructor(
        private readonly workTimeTrackerService: WorkTimeTrackerService,
        private readonly router: Router,
        private readonly financeBillingApi: FinanceBillingApiService
    ) {}

    get filteredEntries(): WorkTimesheetEntry[] {
        return this.timesheetEntries.filter((entry) => {
            const entryDate = entry.startAt.slice(0, 10);
            const matchesEmployee = !this.draft.employee || entry.employee === this.draft.employee;
            const matchesStart = !this.draft.startDate || entryDate >= this.draft.startDate;
            const matchesEnd = !this.draft.endDate || entryDate <= this.draft.endDate;
            return matchesEmployee && matchesStart && matchesEnd;
        });
    }

    get selectedEntries(): WorkTimesheetEntry[] {
        return this.filteredEntries.filter((entry) => this.selectedEntryIds.includes(entry.id));
    }

    get selectedHours(): number {
        return this.selectedEntries.reduce((total, entry) => total + entry.totalHours, 0);
    }

    get summary() {
        return computeInvoiceSummary(this.buildItemsFromEntries(this.selectedEntries), this.draft.discountValue, this.draft.discountMode, this.draft.taxCalculation);
    }

    get availableProjects() {
        return FinanceBillingStore.getProjects(this.draft.clientId || undefined);
    }

    onClientChange(): void {
        if (!this.availableProjects.some((project) => project.id === this.draft.projectId)) {
            this.draft.projectId = this.availableProjects[0]?.id || "";
        }

        this.onProjectChange();
    }

    onIssueDateChange(): void {
        const issueDate = this.isValidDate(this.draft.issueDate) ? this.draft.issueDate : new Date().toISOString().slice(0, 10);
        this.draft.seriesPrefix = FinanceBillingStore.getInvoiceSeriesPrefix(issueDate);
        this.draft.sequenceNumber = FinanceBillingStore.getNextSequenceNumber(issueDate);
    }

    onProjectChange(): void {
        const selectedProject = FinanceBillingStore.findProject(this.draft.projectId);
        if (selectedProject) {
            this.draft.hourlyRate = selectedProject.hourlyRate;
        }
    }

    isSelected(entryId: string): boolean {
        return this.selectedEntryIds.includes(entryId);
    }

    toggleEntry(entryId: string, event: Event): void {
        const isChecked = (event.target as HTMLInputElement).checked;
        this.selectedEntryIds = isChecked ? [...this.selectedEntryIds, entryId] : this.selectedEntryIds.filter((id) => id !== entryId);
    }

    selectAllFiltered(): void {
        this.selectedEntryIds = Array.from(new Set([...this.selectedEntryIds, ...this.filteredEntries.map((entry) => entry.id)]));
    }

    clearSelection(): void {
        this.selectedEntryIds = [];
    }

    amountForEntry(entry: WorkTimesheetEntry): number {
        return entry.totalHours * this.draft.hourlyRate;
    }

    bankLabel(account: FinanceAccount): string {
        return `${account.bankName} - ${account.accountNumber}`;
    }

    async saveInvoice(): Promise<void> {
        this.formError = "";
        if (this.isSaving) {
            return;
        }

        const validationMessage = this.validateDraft();
        if (validationMessage) {
            this.formError = validationMessage;
            return;
        }

        const selectedClient = FinanceBillingStore.findClient(this.draft.clientId);
        const selectedProject = FinanceBillingStore.findProject(this.draft.projectId);
        const selectedAccount = this.bankAccounts.find((account) => account.id === this.draft.bankAccountId);

        const items = this.buildItemsFromEntries(this.selectedEntries);
        if (!selectedClient || !items.length) {
            this.formError = "No se pudo preparar la factura con los datos seleccionados.";
            return;
        }

        const summary = computeInvoiceSummary(items, this.draft.discountValue, this.draft.discountMode, this.draft.taxCalculation);

        const invoice: BillingInvoice = {
            id: FinanceBillingStore.getNextInvoiceId(),
            referenceCode: "TS",
            seriesPrefix: this.draft.seriesPrefix,
            sequenceNumber: this.draft.sequenceNumber,
            projectId: selectedProject?.id || "",
            projectName: selectedProject?.name || items[0]?.description.split("|")[0]?.trim() || "Horas facturables",
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            billingAddress: selectedClient.billingAddress,
            shippingAddress: selectedClient.shippingAddress,
            issueDate: this.draft.issueDate,
            dueDate: this.draft.dueDate,
            currencyCode: this.draft.currencyCode,
            exchangeRate: 1,
            bankAccountId: this.draft.bankAccountId,
            bankAccountName: selectedAccount ? this.bankLabel(selectedAccount) : "--",
            taxCalculation: this.draft.taxCalculation,
            generatedBy: this.draft.generatedBy,
            items,
            discountValue: this.draft.discountValue,
            discountMode: this.draft.discountMode,
            subtotal: summary.subtotal,
            taxTotal: summary.taxTotal,
            total: summary.total,
            paidAmount: 0,
            balanceAmount: summary.total,
            status: deriveInvoiceStatus(summary.total, 0),
            note: this.draft.note.trim() || `Factura generada desde ${items.length} registro(s) de tiempo.`,
            terms: FinanceBillingStore.getDefaultTerms(),
            attachmentName: "",
            receivedPayment: false,
            source: "timesheet",
            createdAt: new Date().toISOString(),
        };

        try {
            this.isSaving = true;
            const createdInvoice = await firstValueFrom(this.financeBillingApi.createInvoice(invoice));
            FinanceBillingStore.addInvoice(createdInvoice as BillingInvoice);
            void this.router.navigateByUrl("/app/finance-facturacion");
        } catch (error) {
            this.formError = error instanceof Error ? error.message : "No se pudo guardar la factura de tiempo.";
        } finally {
            this.isSaving = false;
        }
    }

    private validateDraft(): string {
        if (!Number.isFinite(Number(this.draft.sequenceNumber)) || Number(this.draft.sequenceNumber) < 1) {
            return "El número de factura debe ser mayor que cero.";
        }

        if (!this.isValidDate(this.draft.issueDate)) {
            return "La fecha de la factura es obligatoria.";
        }

        if (!this.isValidDate(this.draft.dueDate)) {
            return "La fecha de vencimiento es obligatoria.";
        }

        if (this.draft.dueDate < this.draft.issueDate) {
            return "La fecha de vencimiento no puede ser anterior a la fecha de la factura.";
        }

        if (!FinanceBillingStore.findClient(this.draft.clientId)) {
            return "Debes seleccionar un cliente.";
        }

        if (this.draft.projectId && !this.availableProjects.some((project) => project.id === this.draft.projectId)) {
            return "El proyecto seleccionado no pertenece al cliente.";
        }

        if (this.draft.startDate && !this.isValidDate(this.draft.startDate)) {
            return "La fecha inicial del filtro no es válida.";
        }

        if (this.draft.endDate && !this.isValidDate(this.draft.endDate)) {
            return "La fecha final del filtro no es válida.";
        }

        if (this.draft.startDate && this.draft.endDate && this.draft.endDate < this.draft.startDate) {
            return "La fecha final del filtro no puede ser anterior a la fecha inicial.";
        }

        if (!Number.isFinite(Number(this.draft.hourlyRate)) || Number(this.draft.hourlyRate) <= 0) {
            return "La tarifa por hora debe ser mayor que cero.";
        }

        if (!this.currencyOptions.some((option) => option.value === this.draft.currencyCode)) {
            return "La moneda seleccionada no es válida.";
        }

        if (!this.taxCalculationOptions.includes(this.draft.taxCalculation)) {
            return "El cálculo de impuesto seleccionado no es válido.";
        }

        if (this.draft.bankAccountId !== null && !this.bankAccounts.some((account) => account.id === this.draft.bankAccountId)) {
            return "La cuenta bancaria seleccionada no es válida.";
        }

        if (!this.selectedEntries.length) {
            return "Debes seleccionar al menos una entrada de tiempo.";
        }

        if (this.selectedEntries.some((entry) => !Number.isFinite(Number(entry.totalHours)) || Number(entry.totalHours) <= 0)) {
            return "Las entradas seleccionadas deben tener horas facturables mayores que cero.";
        }

        return "";
    }

    private buildItemsFromEntries(entries: WorkTimesheetEntry[]): BillingInvoiceItem[] {
        return entries.map((entry) => ({
            id: `time-entry-${entry.id}`,
            name: entry.task,
            description: `${entry.project} | ${entry.employee} | ${entry.memo || "Registro facturable"}`,
            quantity: entry.totalHours,
            unitLabel: "Hora",
            unitPrice: this.draft.hourlyRate,
            taxRate: 19,
            attachmentName: "",
        }));
    }

    private createDraft(): TimeInvoiceDraft {
        const today = new Date();
        const dueDate = new Date();
        dueDate.setDate(today.getDate() + 15);
        const todayValue = today.toISOString().slice(0, 10);

        return {
            seriesPrefix: FinanceBillingStore.getInvoiceSeriesPrefix(todayValue),
            sequenceNumber: FinanceBillingStore.getNextSequenceNumber(todayValue),
            issueDate: todayValue,
            dueDate: dueDate.toISOString().slice(0, 10),
            clientId: "",
            projectId: "",
            employee: "",
            startDate: "",
            endDate: "",
            hourlyRate: 140000,
            currencyCode: "COP",
            taxCalculation: "Despues del descuento",
            bankAccountId: null,
            generatedBy: this.generatedByOptions[0],
            discountValue: 0,
            discountMode: "percent",
            note: "",
        };
    }

    private isValidDate(value: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }

        const date = new Date(`${value}T00:00:00`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }
}