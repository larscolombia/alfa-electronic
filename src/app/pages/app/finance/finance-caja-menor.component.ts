import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

import { FinanceAccount, FinanceAccountsStore } from "./finance-accounts.store";

interface PettyCashExpense {
    id: number;
    itemName: string;
    concept: string;
    purchaseDate: string;
    employee: string;
    project: string;
    category: string;
    vendor: string;
    accountId: number;
    accountName: string;
    currencyCode: "COP" | "USD" | "EUR";
    exchangeRate: number;
    price: number;
    valueInCop: number;
    description: string;
    invoiceFileName: string;
    balance: number;
}

interface PettyCashExpenseDraft {
    itemName: string;
    concept: string;
    purchaseDate: string;
    employee: string;
    project: string;
    category: string;
    vendor: string;
    accountId: number | null;
    currencyCode: "COP" | "USD" | "EUR";
    exchangeRate: number;
    price: number | null;
    description: string;
    invoiceFileName: string;
}

@Component({
    selector: "app-finance-caja-menor",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Caja menor</h5>
                    <p class="text-secondary small mb-0">Registro de gastos detallados, saldo y control de billetes y monedas por denominacion.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/finance-cuentas">Gestionar cuentas</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Financiero - Caja menor</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-lg-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <label class="form-label mb-1" for="monthlyBudget">Presupuesto mensual</label>
                            <input id="monthlyBudget" class="form-control mb-3" type="number" min="0" step="1000" [(ngModel)]="monthlyBudget" (ngModelChange)="onBudgetChange()" />
                            <p class="small text-secondary mb-0">Define el presupuesto base para calcular el saldo de caja menor.</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Saldo disponible</p>
                            <h4 class="mb-0">{{ balance | currency: "COP" : "symbol" : "1.0-0" }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Total de gastos registrados</p>
                            <h4 class="mb-0">{{ totalExpenses | currency: "COP" : "symbol" : "1.0-0" }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Gasto detalles</h6>
                </div>
                <div class="card-body">
                    @if (financeAccounts.length === 0) {
                        <div class="alert alert-warning border mb-3">
                            No hay cuentas registradas. Crea al menos una en <a routerLink="/app/finance-cuentas">Cuentas</a> para registrar gastos.
                        </div>
                    }

                    @if (successMessage) {
                        <div class="alert alert-success border mb-3">{{ successMessage }}</div>
                    }

                    <form (ngSubmit)="registerExpense()" novalidate>
                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Nombre del item</label>
                                <input class="form-control" type="text" placeholder="Por ejemplo, Teclado inalambrico" [(ngModel)]="draft.itemName" name="itemName" required />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Moneda</label>
                                <select class="form-select" [(ngModel)]="draft.currencyCode" name="currencyCode" (ngModelChange)="onCurrencyChange()">
                                    @for (currencyOption of currencyOptions; track currencyOption.value) {
                                        <option [value]="currencyOption.value">{{ currencyOption.label }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Tipo de cambio</label>
                                <input class="form-control" type="number" min="0.0001" step="0.0001" [(ngModel)]="draft.exchangeRate" name="exchangeRate" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Precio</label>
                                <input class="form-control" type="number" min="1" step="100" placeholder="Por ejemplo, 10000" [(ngModel)]="draft.price" name="price" required />
                            </div>

                            <div class="col-12 col-lg-4">
                                <label class="form-label">Fecha del gasto</label>
                                <input class="form-control" type="date" [(ngModel)]="draft.purchaseDate" name="purchaseDate" required />
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Empleado</label>
                                <select class="form-select" [(ngModel)]="draft.employee" name="employee">
                                    <option value="">--</option>
                                    @for (employee of employeeOptions; track employee) {
                                        <option [value]="employee">{{ employee }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Proyecto</label>
                                <select class="form-select" [(ngModel)]="draft.project" name="project">
                                    <option value="">--</option>
                                    @for (project of projectOptions; track project) {
                                        <option [value]="project">{{ project }}</option>
                                    }
                                </select>
                            </div>

                            <div class="col-12 col-lg-4">
                                <label class="form-label">Categoria de gasto</label>
                                <select class="form-select" [(ngModel)]="draft.category" name="category" required>
                                    <option value="">--</option>
                                    @for (category of categoryOptions; track category) {
                                        <option [value]="category">{{ category }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Comprado a</label>
                                <input class="form-control" type="text" placeholder="Por ejemplo, Corporacion Acme" [(ngModel)]="draft.vendor" name="vendor" />
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Cuenta bancaria</label>
                                <select class="form-select" [(ngModel)]="draft.accountId" name="accountId" required>
                                    <option [ngValue]="null">--</option>
                                    @for (account of financeAccounts; track account.id) {
                                        <option [ngValue]="account.id">{{ account.bankName }} - {{ account.accountNumber }}</option>
                                    }
                                </select>
                            </div>

                            <div class="col-12 col-lg-6">
                                <label class="form-label">Concepto del gasto</label>
                                <input class="form-control" type="text" placeholder="Ejemplo: Compra de suministros" [(ngModel)]="draft.concept" name="concept" required />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Saldo</label>
                                <input class="form-control" type="text" [value]="(balance | currency: 'COP' : 'symbol' : '1.0-0') || ''" readonly />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Valor en COP</label>
                                <input class="form-control" type="text" [value]="(draftValueInCop | currency: 'COP' : 'symbol' : '1.0-0') || ''" readonly />
                            </div>

                            <div class="col-12">
                                <label class="form-label">Descripcion</label>
                                <textarea class="form-control" rows="3" [(ngModel)]="draft.description" name="description"></textarea>
                            </div>

                            <div class="col-12 col-lg-6">
                                <label class="form-label">Factura</label>
                                <input class="form-control" type="file" (change)="onInvoiceSelected($event)" />
                                @if (draft.invoiceFileName) {
                                    <p class="small text-secondary mt-2 mb-0">Archivo: {{ draft.invoiceFileName }}</p>
                                }
                            </div>

                            <div class="col-12 col-lg-6 d-flex align-items-end justify-content-start justify-content-lg-end gap-2">
                                <button class="btn btn-theme" type="submit">Guardar</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="resetDraft()">Cancelar</button>
                            </div>
                        </div>
                    </form>

                    @if (formError) {
                        <div class="alert alert-danger border mt-3 mb-0">{{ formError }}</div>
                    }
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-xl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Contador de billetes</h6>
                            <p class="text-secondary small mb-0">Define cuantos billetes hay por denominacion.</p>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Denominacion</th>
                                            <th class="text-end">Cantidad</th>
                                            <th class="text-end">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (denomination of billDenominations; track denomination) {
                                            <tr>
                                                <td>{{ denomination | currency: "COP" : "symbol" : "1.0-0" }}</td>
                                                <td class="text-end" style="max-width: 110px;">
                                                    <input class="form-control text-end" type="number" min="0" step="1" [(ngModel)]="billCounter[denomination]" [name]="'bill_' + denomination" (ngModelChange)="onBillCounterChange(denomination)" />
                                                </td>
                                                <td class="text-end">{{ ((billCounter[denomination] || 0) * denomination) | currency: "COP" : "symbol" : "1.0-0" }}</td>
                                            </tr>
                                        }
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="2">Total en billetes</th>
                                            <th class="text-end">{{ billCounterTotal | currency: "COP" : "symbol" : "1.0-0" }}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-6">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Contador de monedas</h6>
                            <p class="text-secondary small mb-0">Define cuantas monedas hay por denominacion.</p>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Denominacion</th>
                                            <th class="text-end">Cantidad</th>
                                            <th class="text-end">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (denomination of coinDenominations; track denomination) {
                                            <tr>
                                                <td>{{ denomination | currency: "COP" : "symbol" : "1.0-0" }}</td>
                                                <td class="text-end" style="max-width: 110px;">
                                                    <input class="form-control text-end" type="number" min="0" step="1" [(ngModel)]="coinCounter[denomination]" [name]="'coin_' + denomination" (ngModelChange)="onCoinCounterChange(denomination)" />
                                                </td>
                                                <td class="text-end">{{ ((coinCounter[denomination] || 0) * denomination) | currency: "COP" : "symbol" : "1.0-0" }}</td>
                                            </tr>
                                        }
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="2">Total en monedas</th>
                                            <th class="text-end">{{ coinCounterTotal | currency: "COP" : "symbol" : "1.0-0" }}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Efectivo contado (billetes + monedas)</p>
                            <h6 class="mb-3">{{ totalCashCounted | currency: "COP" : "symbol" : "1.0-0" }}</h6>
                            <p class="small text-secondary mb-1">Diferencia (saldo - efectivo contado)</p>
                            <h5 class="mb-0" [class.text-danger]="reconciliationDifference < 0" [class.text-success]="reconciliationDifference >= 0">
                                {{ reconciliationDifference | currency: "COP" : "symbol" : "1.0-0" }}
                            </h5>
                        </div>
                    </div>
                </div>

                <div class="col-12">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Historial de gastos</h6>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Item</th>
                                            <th>Concepto</th>
                                            <th>Cuenta</th>
                                            <th class="text-end">Valor</th>
                                            <th class="text-end">Saldo</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (expense of expenses; track expense.id) {
                                            <tr>
                                                <td>{{ expense.purchaseDate | date: "yyyy-MM-dd" }}</td>
                                                <td>{{ expense.itemName }}</td>
                                                <td>{{ expense.concept }}</td>
                                                <td>{{ expense.accountName }}</td>
                                                <td class="text-end">{{ expense.valueInCop | currency: "COP" : "symbol" : "1.0-0" }}</td>
                                                <td class="text-end">{{ expense.balance | currency: "COP" : "symbol" : "1.0-0" }}</td>
                                                <td class="text-end">
                                                    <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeExpense(expense.id)">Eliminar</button>
                                                </td>
                                            </tr>
                                        } @empty {
                                            <tr>
                                                <td colspan="7" class="text-center text-secondary py-4">Aun no hay gastos registrados.</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class FinanceCajaMenorComponent {
    monthlyBudget = 0;
    financeAccounts: FinanceAccount[] = [];
    expenses: PettyCashExpense[] = [];
    formError = "";
    successMessage = "";

    readonly currencyOptions = [
        { value: "COP", label: "Colombia peso - ($)" },
        { value: "USD", label: "US dollar - ($)" },
        { value: "EUR", label: "Euro - (EUR)" },
    ] as const;
    readonly categoryOptions = ["Papeleria", "Transporte", "Mantenimiento", "Servicios", "Viaticos", "Otros"];
    readonly employeeOptions = ["Ana Perez", "Luis Torres", "Camila Gomez", "Jorge Diaz"];
    readonly projectOptions = ["Proyecto PIKA", "Proyecto Beta", "Operaciones", "Administracion"];

    draft: PettyCashExpenseDraft = this.getDefaultDraft();

    readonly billDenominations = [100000, 50000, 20000, 10000, 5000, 2000];
    billCounter: Record<number, number> = {};
    readonly coinDenominations = [1000, 500, 200, 100, 50];
    coinCounter: Record<number, number> = {};

    constructor() {
        this.loadFinanceAccounts();
        this.billDenominations.forEach((denomination) => {
            this.billCounter[denomination] = 0;
        });
        this.coinDenominations.forEach((denomination) => {
            this.coinCounter[denomination] = 0;
        });
        this.draft = this.getDefaultDraft();
    }

    get totalExpenses(): number {
        return this.expenses.reduce((total, expense) => total + expense.valueInCop, 0);
    }

    get balance(): number {
        return this.monthlyBudget - this.totalExpenses;
    }

    get draftValueInCop(): number {
        return this.toPositiveNumber(this.draft.price) * this.getExchangeRate();
    }

    get billCounterTotal(): number {
        return this.billDenominations.reduce((total, denomination) => total + denomination * (this.billCounter[denomination] || 0), 0);
    }

    get coinCounterTotal(): number {
        return this.coinDenominations.reduce((total, denomination) => total + denomination * (this.coinCounter[denomination] || 0), 0);
    }

    get totalCashCounted(): number {
        return this.billCounterTotal + this.coinCounterTotal;
    }

    get reconciliationDifference(): number {
        return this.balance - this.totalCashCounted;
    }

    onBudgetChange(): void {
        this.monthlyBudget = this.toPositiveNumber(this.monthlyBudget);
        this.recalculateBalances();
    }

    onBillCounterChange(denomination: number): void {
        this.billCounter[denomination] = Math.floor(this.toPositiveNumber(this.billCounter[denomination]));
    }

    onCoinCounterChange(denomination: number): void {
        this.coinCounter[denomination] = Math.floor(this.toPositiveNumber(this.coinCounter[denomination]));
    }

    onCurrencyChange(): void {
        if (this.draft.currencyCode === "COP") {
            this.draft.exchangeRate = 1;
            return;
        }

        if (this.draft.exchangeRate <= 0) {
            this.draft.exchangeRate = 1;
        }
    }

    onInvoiceSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        this.draft.invoiceFileName = file ? file.name : "";
    }

    registerExpense(): void {
        this.formError = "";
        this.successMessage = "";

        const itemName = this.draft.itemName.trim();
        const concept = this.draft.concept.trim();
        const category = this.draft.category.trim();
        const selectedAccountId = this.draft.accountId;
        const value = this.toPositiveNumber(this.draft.price);
        const valueInCop = value * this.getExchangeRate();

        if (!this.draft.purchaseDate || !itemName || !concept || !category || value <= 0) {
            this.formError = "Completa item, fecha, concepto, categoria y valor para registrar el gasto.";
            return;
        }

        if (this.monthlyBudget <= 0) {
            this.formError = "Define primero un presupuesto mensual mayor a cero.";
            return;
        }

        if (selectedAccountId === null) {
            this.formError = "Selecciona una cuenta para asociar el gasto.";
            return;
        }

        const selectedAccount = this.financeAccounts.find((account) => account.id === selectedAccountId);
        if (!selectedAccount) {
            this.formError = "La cuenta seleccionada no esta disponible.";
            return;
        }

        if (valueInCop > this.balance) {
            this.formError = "El valor del gasto supera el saldo disponible de caja menor.";
            return;
        }

        this.expenses = [
            ...this.expenses,
            {
                id: Date.now() + this.expenses.length,
                itemName,
                concept,
                purchaseDate: this.draft.purchaseDate,
                employee: this.draft.employee,
                project: this.draft.project,
                category,
                vendor: this.draft.vendor.trim(),
                accountId: selectedAccountId,
                accountName: `${selectedAccount.bankName} - ${selectedAccount.accountNumber}`,
                currencyCode: this.draft.currencyCode,
                exchangeRate: this.getExchangeRate(),
                price: value,
                valueInCop,
                description: this.draft.description.trim(),
                invoiceFileName: this.draft.invoiceFileName,
                balance: 0,
            },
        ];

        this.recalculateBalances();
        this.successMessage = "Gasto guardado correctamente.";
        this.resetDraft();
    }

    removeExpense(expenseId: number): void {
        this.expenses = this.expenses.filter((expense) => expense.id !== expenseId);
        this.recalculateBalances();
    }

    private recalculateBalances(): void {
        let runningBalance = this.monthlyBudget;
        this.expenses = this.expenses.map((expense) => {
            runningBalance -= expense.valueInCop;
            return {
                ...expense,
                balance: runningBalance,
            };
        });
    }

    resetDraft(): void {
        const currentAccountId = this.draft.accountId;
        this.draft = this.getDefaultDraft();
        if (currentAccountId !== null && this.financeAccounts.some((account) => account.id === currentAccountId)) {
            this.draft.accountId = currentAccountId;
        }
    }

    private loadFinanceAccounts(): void {
        this.financeAccounts = FinanceAccountsStore.getAccounts();
    }

    private getExchangeRate(): number {
        if (this.draft.currencyCode === "COP") {
            return 1;
        }
        return this.toPositiveNumber(this.draft.exchangeRate) || 1;
    }

    private getDefaultDraft(): PettyCashExpenseDraft {
        return {
            itemName: "",
            concept: "",
            purchaseDate: this.toInputDate(new Date()),
            employee: "",
            project: "",
            category: "",
            vendor: "",
            accountId: this.financeAccounts.length > 0 ? this.financeAccounts[0].id : null,
            currencyCode: "COP",
            exchangeRate: 1,
            price: null,
            description: "",
            invoiceFileName: "",
        };
    }

    private toPositiveNumber(value: number | string | null | undefined): number {
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
            return 0;
        }
        return parsedValue;
    }

    private toInputDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
}
