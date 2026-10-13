import { CommonModule } from "@angular/common";
import { AfterViewInit, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { FinanceAccount, FinanceAccountsStore, FinanceAccountProductType, FinanceAccountStatus, FinanceAccountType } from "./finance-accounts.store";
import { FinanceAccountsApiService, UpsertFinanceAccountRequest } from "../../../services/finance-accounts-api.service";

interface FinanceAccountDraft {
    accountType: FinanceAccountType;
    bankName: string;
    holderName: string;
    accountNumber: string;
    productType: FinanceAccountProductType;
    currencyCode: "COP" | "USD" | "EUR";
    contactNumber: string;
    initialBalance: number;
    status: FinanceAccountStatus;
    logoFileName: string;
}

@Component({
    selector: "app-finance-cuentas",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Cuentas</h5>
                    <p class="text-secondary small mb-0">Administra cuentas bancarias y cuentas de efectivo para operacion financiera.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/finance-caja-menor">Ir a caja menor</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/finance-caja-menor">Financiero</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Cuentas</li>
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
                <div class="card-header">
                    <h6 class="mb-0">Agregar cuenta bancaria</h6>
                </div>
                <div class="card-body">
                    <form (ngSubmit)="saveAccount()">
                        <div class="mb-3">
                            <label class="form-label d-block">Tipo de cuenta</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" id="typeBank" name="accountType" value="Banco" [(ngModel)]="draft.accountType" />
                                <label class="form-check-label" for="typeBank">Banco</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" id="typeCash" name="accountType" value="Efectivo" [(ngModel)]="draft.accountType" />
                                <label class="form-check-label" for="typeCash">Efectivo</label>
                            </div>
                        </div>

                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Nombre del banco</label>
                                <input class="form-control" type="text" placeholder="Por ejemplo, Banco Federal" [(ngModel)]="draft.bankName" name="bankName" />
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Nombre del titular de la cuenta</label>
                                <input class="form-control" type="text" placeholder="Por ejemplo, Juan Perez" [(ngModel)]="draft.holderName" name="holderName" required />
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Numero de cuenta</label>
                                <input class="form-control" type="text" placeholder="Por ejemplo, 123456789" [(ngModel)]="draft.accountNumber" name="accountNumber" required />
                            </div>

                            <div class="col-12 col-lg-4">
                                <label class="form-label">Producto de cuenta</label>
                                <select class="form-select" [(ngModel)]="draft.productType" name="productType">
                                    @for (productType of productTypes; track productType) {
                                        <option [value]="productType">{{ productType }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Moneda</label>
                                <select class="form-select" [(ngModel)]="draft.currencyCode" name="currencyCode">
                                    @for (currencyOption of currencyOptions; track currencyOption.value) {
                                        <option [value]="currencyOption.value">{{ currencyOption.label }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Numero de contacto</label>
                                <input class="form-control" type="text" placeholder="Por ejemplo, 1234567890" [(ngModel)]="draft.contactNumber" name="contactNumber" />
                            </div>

                            <div class="col-12 col-lg-4">
                                <label class="form-label">Saldo inicial</label>
                                <input class="form-control" type="number" min="0" step="1000" placeholder="Por ejemplo, 10000" [(ngModel)]="draft.initialBalance" name="initialBalance" />
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Estado</label>
                                <select class="form-select" [(ngModel)]="draft.status" name="status">
                                    @for (statusOption of statusOptions; track statusOption) {
                                        <option [value]="statusOption">{{ statusOption }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Logo del banco</label>
                                <input class="form-control" type="file" (change)="onLogoSelected($event)" />
                                @if (draft.logoFileName) {
                                    <p class="small text-secondary mt-2 mb-0">Archivo: {{ draft.logoFileName }}</p>
                                }
                            </div>
                        </div>

                        <div class="mt-3 d-flex gap-2">
                            <button class="btn btn-theme" type="submit" [disabled]="isSaving">{{ isSaving ? "Guardando..." : (editingAccountId === null ? "Guardar" : "Actualizar") }}</button>
                            <button class="btn btn-outline-secondary" type="button" [disabled]="isSaving" (click)="resetForm()">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Listado de cuentas</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Cuenta</th>
                                    <th>Tipo</th>
                                    <th>Moneda</th>
                                    <th class="text-end">Saldo inicial</th>
                                    <th>Estado</th>
                                    <th class="text-end">Accion</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let account of accounts; trackBy: trackByAccountId">
                                    <td>
                                        <strong>{{ account.bankName }}</strong>
                                        <p class="small text-secondary mb-0">{{ account.accountNumber }} - {{ account.holderName }}</p>
                                    </td>
                                    <td>{{ account.accountType }} / {{ account.productType }}</td>
                                    <td>{{ account.currencyCode }}</td>
                                    <td class="text-end">{{ account.initialBalance | currency: account.currencyCode : "symbol" : "1.0-0" }}</td>
                                    <td>
                                        <span class="badge rounded-pill" [class.text-bg-success]="account.status === 'Activa'" [class.text-bg-secondary]="account.status !== 'Activa'">
                                            {{ account.status }}
                                        </span>
                                    </td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-theme me-2" type="button" (click)="editAccount(account.id)">Editar</button>
                                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeAccount(account.id)">Eliminar</button>
                                    </td>
                                </tr>
                                <tr *ngIf="accounts.length === 0">
                                    <td colspan="6" class="text-center text-secondary py-4">No hay cuentas registradas.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class FinanceCuentasComponent implements AfterViewInit {
    readonly productTypes: FinanceAccountProductType[] = ["Ahorros", "Corriente", "Caja menor"];
    readonly statusOptions: FinanceAccountStatus[] = ["Activa", "Inactiva"];
    readonly currencyOptions = [
        { value: "COP", label: "COP ($)" },
        { value: "USD", label: "USD ($)" },
        { value: "EUR", label: "EUR (EUR)" },
    ] as const;

    accounts: FinanceAccount[] = [];
    editingAccountId: number | null = null;
    successMessage = "";
    formError = "";
    isSaving = false;
    draft: FinanceAccountDraft = this.getDefaultDraft();

    constructor(private readonly financeAccountsApi: FinanceAccountsApiService) {
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            void this.loadAccounts();
        }, 0);
    }

    async saveAccount(): Promise<void> {
        this.successMessage = "";
        this.formError = "";

        if (this.isSaving) {
            return;
        }

        const sanitizedBankName = this.draft.bankName.trim();
        const sanitizedHolderName = this.draft.holderName.trim();
        const sanitizedAccountNumber = this.draft.accountNumber.trim();
        const sanitizedContactNumber = this.draft.contactNumber.trim();

        if (!this.isValidAccountType(this.draft.accountType)) {
            this.formError = "Selecciona un tipo de cuenta valido.";
            return;
        }

        if (!this.isValidProductType(this.draft.productType)) {
            this.formError = "Selecciona un producto de cuenta valido.";
            return;
        }

        if (!this.isValidCurrencyCode(this.draft.currencyCode)) {
            this.formError = "Selecciona una moneda valida.";
            return;
        }

        if (!this.isValidStatus(this.draft.status)) {
            this.formError = "Selecciona un estado valido.";
            return;
        }

        if (!sanitizedHolderName || !sanitizedAccountNumber) {
            this.formError = "Debes completar titular y numero de cuenta.";
            return;
        }

        if (sanitizedHolderName.length > 180) {
            this.formError = "El titular no puede superar 180 caracteres.";
            return;
        }

        if (sanitizedAccountNumber.length > 80) {
            this.formError = "El numero de cuenta no puede superar 80 caracteres.";
            return;
        }

        if (!/^[A-Za-z0-9\-\s]+$/.test(sanitizedAccountNumber)) {
            this.formError = "El numero de cuenta solo puede contener letras, numeros, espacios y guiones.";
            return;
        }

        if (this.draft.accountType === "Banco" && !sanitizedBankName) {
            this.formError = "Para tipo Banco debes ingresar nombre del banco.";
            return;
        }

        if (sanitizedBankName.length > 180) {
            this.formError = "El nombre del banco no puede superar 180 caracteres.";
            return;
        }

        if (sanitizedContactNumber && !/^[0-9+\-\s()]{7,40}$/.test(sanitizedContactNumber)) {
            this.formError = "El numero de contacto tiene un formato invalido.";
            return;
        }

        const payload: UpsertFinanceAccountRequest = {
            accountType: this.draft.accountType,
            bankName: sanitizedBankName || "Caja de efectivo",
            holderName: sanitizedHolderName,
            accountNumber: sanitizedAccountNumber,
            productType: this.draft.productType,
            currencyCode: this.draft.currencyCode,
            contactNumber: sanitizedContactNumber,
            initialBalance: this.toPositiveNumber(this.draft.initialBalance),
            status: this.draft.status,
            logoFileName: this.draft.logoFileName,
        };

        try {
            this.isSaving = true;
            if (this.editingAccountId === null) {
                await firstValueFrom(this.financeAccountsApi.createAccount(payload));
            } else {
                await firstValueFrom(this.financeAccountsApi.updateAccount(this.editingAccountId, payload));
            }

            await this.loadAccounts();
            this.successMessage = this.editingAccountId === null ? "Cuenta creada correctamente." : "Cuenta actualizada correctamente.";
            this.resetForm();
        } catch (error) {
            this.formError = error instanceof Error ? error.message : "No se pudo guardar la cuenta.";
        } finally {
            this.isSaving = false;
        }
    }

    editAccount(accountId: number): void {
        this.successMessage = "";
        this.formError = "";
        const account = this.accounts.find((currentAccount) => currentAccount.id === accountId);
        if (!account) {
            return;
        }

        this.editingAccountId = account.id;
        this.draft = {
            accountType: account.accountType,
            bankName: account.bankName,
            holderName: account.holderName,
            accountNumber: account.accountNumber,
            productType: account.productType,
            currencyCode: account.currencyCode,
            contactNumber: account.contactNumber,
            initialBalance: account.initialBalance,
            status: account.status,
            logoFileName: account.logoFileName,
        };
    }

    async removeAccount(accountId: number): Promise<void> {
        this.successMessage = "";
        this.formError = "";
        try {
            await firstValueFrom(this.financeAccountsApi.deleteAccount(accountId));
            await this.loadAccounts();
            this.successMessage = "Cuenta eliminada.";

            if (this.editingAccountId === accountId) {
                this.resetForm();
            }
        } catch (error) {
            this.formError = error instanceof Error ? error.message : "No se pudo eliminar la cuenta.";
        }
    }

    onLogoSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        this.draft.logoFileName = file ? file.name : "";
    }

    resetForm(): void {
        this.editingAccountId = null;
        this.formError = "";
        this.draft = this.getDefaultDraft();
    }

    trackByAccountId(_: number, account: FinanceAccount): number {
        return account.id;
    }

    private async loadAccounts(): Promise<void> {
        try {
            const apiAccounts = await firstValueFrom(this.financeAccountsApi.listAccounts());
            this.accounts = apiAccounts.map((account) => ({
                id: Number(account.id),
                accountType: account.accountType,
                bankName: account.bankName,
                holderName: account.holderName,
                accountNumber: account.accountNumber,
                productType: account.productType,
                currencyCode: account.currencyCode,
                contactNumber: account.contactNumber,
                initialBalance: this.toPositiveNumber(account.initialBalance),
                status: account.status,
                logoFileName: account.logoFileName,
            }));
            this.formError = "";
            FinanceAccountsStore.saveAccounts(this.accounts);
        } catch (error) {
            this.accounts = FinanceAccountsStore.getAccounts();
            this.formError = error instanceof Error ? error.message : "No se pudieron cargar las cuentas.";
        }
    }

    private getDefaultDraft(): FinanceAccountDraft {
        return {
            accountType: "Banco",
            bankName: "",
            holderName: "",
            accountNumber: "",
            productType: "Ahorros",
            currencyCode: "COP",
            contactNumber: "",
            initialBalance: 0,
            status: "Activa",
            logoFileName: "",
        };
    }

    private toPositiveNumber(value: number | string | null | undefined): number {
        const parsedValue = Number(value);
        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
            return 0;
        }
        return parsedValue;
    }

    private isValidAccountType(value: string): value is FinanceAccountType {
        return value === "Banco" || value === "Efectivo";
    }

    private isValidProductType(value: string): value is FinanceAccountProductType {
        return value === "Ahorros" || value === "Corriente" || value === "Caja menor";
    }

    private isValidCurrencyCode(value: string): value is "COP" | "USD" | "EUR" {
        return value === "COP" || value === "USD" || value === "EUR";
    }

    private isValidStatus(value: string): value is FinanceAccountStatus {
        return value === "Activa" || value === "Inactiva";
    }
}
