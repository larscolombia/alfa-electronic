export type ClientStatus = "Activo" | "Inactivo";

import { getDefaultZoneName } from "./crm-zones.store";
import type { CrmClientRecord as ApiClientRecord } from "../../../services/crm-clients-api.service";

export type { CrmClientRecord as ApiClientRecord } from "../../../services/crm-clients-api.service";

export interface ClientCreditProfile {
    enabled: boolean;
    creditLimit: number;
    consumed: number;
    lastPaymentDate: string;
    paymentTermDays: number;
}

/** Store-local record (id as number) kept for backwards compatibility with finance/dashboard.
 *  New code should use CrmClientRecord from crm-clients-api.service (id: string). */
export interface CrmClientRecord {
    id: number;
    nombre: string;
    correo: string;
    empresa: string;
    nit: string;
    zona: string;
    estado: ClientStatus;
    website?: string;
    officePhone?: string;
    country?: string;
    city?: string;
    address?: string;
    creado: string;
    credito: ClientCreditProfile;
}

// ── In-memory cache fed by API ────────────────────────────────────────────────
let clientsCache: CrmClientRecord[] = [];

// Symbol kept for compatibility (finance-billing.store imports it)
export const CRM_PROSPECTS_MOCK: CrmClientRecord[] = [];

function toPositiveNumber(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return numeric;
}

function normalizeClient(client: CrmClientRecord): CrmClientRecord {
    return {
        ...client,
        nombre: (client.nombre ?? "").trim(),
        correo: (client.correo ?? "").trim(),
        empresa: (client.empresa ?? "").trim(),
        nit: (client.nit ?? "").trim(),
        zona: (client.zona ?? "").trim() || getDefaultZoneName(),
        website: (client.website ?? "").trim(),
        officePhone: (client.officePhone ?? "").trim(),
        country: (client.country ?? "").trim(),
        city: (client.city ?? "").trim(),
        address: (client.address ?? "").trim(),
        credito: {
            enabled: Boolean(client.credito?.enabled),
            creditLimit: toPositiveNumber(client.credito?.creditLimit),
            consumed: toPositiveNumber(client.credito?.consumed),
            lastPaymentDate: (client.credito?.lastPaymentDate ?? "").trim(),
            paymentTermDays: Math.max(0, Math.trunc(Number(client.credito?.paymentTermDays ?? 0))),
        },
    };
}

/** Map an API record (id: string) to a store record (id: number) for legacy consumers. */
function mapApiToStore(client: ApiClientRecord, index: number): CrmClientRecord {
    const numericId = Number(client.id);
    return {
        id: Number.isFinite(numericId) && numericId > 0 ? numericId : index + 1,
        nombre: client.nombre,
        correo: client.correo,
        empresa: client.empresa,
        nit: client.nit ?? "",
        zona: client.zona,
        estado: client.estado as ClientStatus,
        website: client.website ?? "",
        officePhone: client.officePhone ?? "",
        country: client.country ?? "",
        city: client.city ?? "",
        address: client.address ?? "",
        creado: client.creado,
        credito: client.credito,
    };
}

/** Replace the in-memory cache. Accepts both API records (id: string) and store records (id: number). */
export function replaceCrmClients(clients: ApiClientRecord[] | CrmClientRecord[]): void {
    clientsCache = (clients as ApiClientRecord[]).map((c, i) =>
        typeof c.id === "string"
            ? normalizeClient(mapApiToStore(c as ApiClientRecord, i))
            : normalizeClient(c as unknown as CrmClientRecord),
    );
}

/** @deprecated Use replaceCrmClients() instead */
export function saveCrmClients(clients: CrmClientRecord[]): void {
    replaceCrmClients(clients);
}

export function getCrmClients(): CrmClientRecord[] {
    return [...clientsCache];
}

export function upsertCrmClient(client: CrmClientRecord): CrmClientRecord[] {
    const current = getCrmClients();
    const normalized = normalizeClient(client);
    const idx = current.findIndex((item) => item.id === client.id);
    if (idx >= 0) current[idx] = normalized;
    else current.unshift(normalized);
    replaceCrmClients(current);
    return getCrmClients();
}

export function removeCrmClient(clientId: number): CrmClientRecord[] {
    replaceCrmClients(getCrmClients().filter((client) => client.id !== clientId));
    return getCrmClients();
}

export function getCrmClientById(clientId: number): CrmClientRecord | undefined {
    return getCrmClients().find((client) => client.id === clientId);
}

export function reassignCrmClientsZone(sourceZone: string, targetZone: string): CrmClientRecord[] {
    const source = sourceZone.trim();
    const target = targetZone.trim();
    if (!source || !target || source === target) return getCrmClients();
    replaceCrmClients(
        getCrmClients().map((client) => (client.zona === source ? { ...client, zona: target } : client)),
    );
    return getCrmClients();
}

export function calculateDaysSinceLastPayment(lastPaymentDate: string): number | null {
    const safeDate = (lastPaymentDate ?? "").trim();
    if (!safeDate) return null;
    const paymentDate = new Date(`${safeDate}T00:00:00`);
    if (Number.isNaN(paymentDate.getTime())) return null;
    const today = new Date();
    const floor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const ms = floor.getTime() - paymentDate.getTime();
    return ms <= 0 ? 0 : Math.floor(ms / 86_400_000);
}

export function calculateDaysInArrears(client: CrmClientRecord): number {
    const days = calculateDaysSinceLastPayment(client.credito.lastPaymentDate);
    if (days === null) return 0;
    return Math.max(0, days - Math.max(0, client.credito.paymentTermDays));
}

export function calculateAvailableCredit(client: CrmClientRecord): number {
    return Math.max(0, toPositiveNumber(client.credito.creditLimit) - toPositiveNumber(client.credito.consumed));
}

