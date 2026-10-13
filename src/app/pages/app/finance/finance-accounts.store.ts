export type FinanceAccountType = "Banco" | "Efectivo";
export type FinanceAccountProductType = "Ahorros" | "Corriente" | "Caja menor";
export type FinanceAccountStatus = "Activa" | "Inactiva";

export interface FinanceAccount {
    id: number;
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

const ACCOUNTS_STORAGE_KEY = "adminux.finance.accounts";

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class FinanceAccountsStore {
    static getAccounts(): FinanceAccount[] {
        if (!isBrowser()) {
            return [];
        }

        const rawValue = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        if (!rawValue) {
            return [];
        }

        try {
            const parsedValue = JSON.parse(rawValue) as FinanceAccount[];
            if (!Array.isArray(parsedValue)) {
                return [];
            }
            return parsedValue;
        } catch {
            return [];
        }
    }

    static saveAccounts(accounts: FinanceAccount[]): void {
        if (!isBrowser()) {
            return;
        }
        window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    }
}
