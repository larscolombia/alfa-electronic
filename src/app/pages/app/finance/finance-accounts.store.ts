import { financeStoreFetch, isBrowserEnv } from "../../../services/finance-store-fetch.util";

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

interface FinanceAccountRecord extends FinanceAccount {
    createdAt?: string;
    updatedAt?: string;
}

interface UpsertFinanceAccountPayload {
    accountType: string;
    bankName: string;
    holderName: string;
    accountNumber: string;
    productType: string;
    currencyCode: string;
    contactNumber: string;
    initialBalance: number;
    status: string;
    logoFileName: string;
}

// Clave legacy: SOLO se lee una vez para migrar al servidor y se borra cuando
// la migración termina sin errores. Ya no se escribe dato de negocio aquí.
const LEGACY_ACCOUNTS_STORAGE_KEY = "adminux.finance.accounts";

let accountsCache: FinanceAccount[] = [];
let lastError: string | null = null;
let loaded = false;
let loadPromise: Promise<void> | null = null;
let migrationStarted = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
    listeners.forEach((listener) => listener());
}

function errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim() ? error.message : String(error);
}

function toPositiveNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function toFinanceAccount(record: FinanceAccountRecord): FinanceAccount {
    return {
        id: Number(record.id),
        accountType: record.accountType,
        bankName: record.bankName,
        holderName: record.holderName,
        accountNumber: record.accountNumber,
        productType: record.productType,
        currencyCode: record.currencyCode,
        contactNumber: record.contactNumber,
        initialBalance: toPositiveNumber(record.initialBalance),
        status: record.status,
        logoFileName: record.logoFileName,
    };
}

function toUpsertPayload(account: Partial<FinanceAccount>): UpsertFinanceAccountPayload {
    return {
        accountType: account.accountType === "Efectivo" ? "Efectivo" : "Banco",
        bankName: (account.bankName ?? "").trim(),
        holderName: (account.holderName ?? "").trim(),
        accountNumber: (account.accountNumber ?? "").trim(),
        productType: account.productType ?? "Ahorros",
        currencyCode: account.currencyCode ?? "COP",
        contactNumber: (account.contactNumber ?? "").trim(),
        initialBalance: toPositiveNumber(account.initialBalance),
        status: account.status ?? "Activa",
        logoFileName: (account.logoFileName ?? "").trim(),
    };
}

/**
 * Store de cuentas respaldado por el servidor (GET/POST /finance/accounts).
 * getAccounts() es síncrono sobre la caché; ensureLoaded() la puebla y avisa a
 * los suscriptores. Incluye la migración única de 'adminux.finance.accounts':
 * sube solo lo que no exista (dedupe por numero de cuenta + titular) y borra la
 * clave SOLO si todo salió bien; si falla, la conserva y reintenta con error
 * visible en getLastError().
 */
export class FinanceAccountsStore {
    static getAccounts(): FinanceAccount[] {
        return accountsCache;
    }

    static getLastError(): string | null {
        return lastError;
    }

    static subscribe(listener: () => void): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }

    static ensureLoaded(): Promise<void> {
        if (loaded) {
            return Promise.resolve();
        }
        if (!loadPromise) {
            loadPromise = this.reload().finally(() => {
                loadPromise = null;
            });
        }
        return loadPromise;
    }

    static async reload(): Promise<void> {
        try {
            const response = await financeStoreFetch<{ items: FinanceAccountRecord[] }>("/api/v1/finance/accounts");
            accountsCache = (response.items ?? []).map(toFinanceAccount);
            loaded = true;
            notifyListeners();
            await this.migrateLegacyAccounts();
        } catch (error) {
            // La caché anterior se conserva; el error queda visible y se
            // reintenta en el próximo ensureLoaded.
            loaded = false;
            lastError = `No se pudieron cargar las cuentas del servidor: ${errorMessage(error)}`;
            notifyListeners();
        }
    }

    /** Actualiza solo la caché en memoria (la escritura real va por la API). */
    static saveAccounts(accounts: FinanceAccount[]): void {
        accountsCache = accounts.map(toFinanceAccount);
        notifyListeners();
    }

    private static async migrateLegacyAccounts(): Promise<void> {
        if (migrationStarted || !isBrowserEnv()) {
            return;
        }

        const raw = window.localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY);
        if (!raw) {
            return;
        }

        migrationStarted = true;

        let legacy: Partial<FinanceAccount>[];
        try {
            const parsed = JSON.parse(raw) as Partial<FinanceAccount>[];
            legacy = Array.isArray(parsed) ? parsed : [];
        } catch {
            // Clave corrupta: nada rescatable; se elimina para no reintentar
            // una migración imposible en cada arranque.
            window.localStorage.removeItem(LEGACY_ACCOUNTS_STORAGE_KEY);
            migrationStarted = false;
            return;
        }

        const failures: string[] = [];
        const uploadedKeys = new Set(accountsCache.map((account) => `${account.accountNumber}|${account.holderName}`));

        for (const account of legacy) {
            const accountNumber = (account?.accountNumber ?? "").trim();
            if (!accountNumber) {
                continue;
            }
            const dedupeKey = `${accountNumber}|${(account.holderName ?? "").trim()}`;
            if (uploadedKeys.has(dedupeKey)) {
                continue;
            }
            try {
                const created = await financeStoreFetch<FinanceAccountRecord>("/api/v1/finance/accounts", {
                    method: "POST",
                    body: JSON.stringify(toUpsertPayload(account)),
                });
                accountsCache = [...accountsCache, toFinanceAccount(created)];
                uploadedKeys.add(dedupeKey);
            } catch (error) {
                failures.push(errorMessage(error));
            }
        }

        if (failures.length > 0) {
            // La clave SE CONSERVA y se reintenta en el próximo arranque.
            migrationStarted = false;
            lastError = `La migración de tus cuentas locales falló y se reintentará más tarde. Detalles: ${failures.join(" | ")}`;
            notifyListeners();
            return;
        }

        window.localStorage.removeItem(LEGACY_ACCOUNTS_STORAGE_KEY);
        notifyListeners();
    }
}
