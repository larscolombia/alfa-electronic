import { ensureEquipmentCatalogLoaded, getEquipmentFamilyName, getEquipmentServiceTypes, getIndustrialEquipmentModels } from "../company/company-equipment-config.store";
import { buildCommercialSeriesPrefix } from "../company/company-commercial-settings.store";
import { CrmClientRecord, getCrmClients } from "../crm/crm-clients.store";
import { CRM_PROSPECTS_MOCK, ProspectRecord } from "../crm/crm-prospects.store";
import { financeStoreFetch, isBrowserEnv } from "../../../services/finance-store-fetch.util";

export type BillingCurrencyCode = "COP" | "USD" | "EUR";
export type BillingInvoiceStatus = "Borrador" | "Pendiente" | "Pago parcial" | "Pagado" | "Cancelado" | "Enviado";
export type BillingRecurringStatus = "Activa" | "Pausada" | "Finalizada";
export type BillingDiscountMode = "percent" | "amount";
export type BillingTaxCalculation = "Despues del descuento" | "Antes del descuento" | "Sin impuesto";
export type BillingFrequency = "Diario" | "Semanal" | "Quincenal" | "Mensual" | "Bimensual" | "Trimestral";

export interface BillingClient {
    id: string;
    name: string;
    contactName: string;
    billingAddress: string;
    shippingAddress: string;
    email: string;
    phone: string;
}

export interface BillingProject {
    id: string;
    clientId: string;
    name: string;
    hourlyRate: number;
}

export interface BillingCatalogItem {
    id: string;
    label: string;
    description: string;
    unitPrice: number;
    taxRate: number;
    unitLabel: string;
}

export interface BillingInvoiceItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    unitLabel: string;
    unitPrice: number;
    taxRate: number;
    attachmentName: string;
}

export interface BillingInvoice {
    id: number;
    referenceCode: string;
    seriesPrefix: string;
    sequenceNumber: number;
    projectId: string;
    projectName: string;
    clientId: string;
    clientName: string;
    billingAddress: string;
    shippingAddress: string;
    issueDate: string;
    dueDate: string;
    currencyCode: BillingCurrencyCode;
    exchangeRate: number;
    bankAccountId: number | null;
    bankAccountName: string;
    taxCalculation: BillingTaxCalculation;
    generatedBy: string;
    items: BillingInvoiceItem[];
    discountValue: number;
    discountMode: BillingDiscountMode;
    subtotal: number;
    taxTotal: number;
    total: number;
    paidAmount: number;
    balanceAmount: number;
    status: BillingInvoiceStatus;
    note: string;
    terms: string;
    attachmentName: string;
    receivedPayment: boolean;
    source: "manual" | "timesheet" | "quote";
    /** Fase 5b: número de factura externa Oasis. */
    externalNumber?: string;
    /** Fase 5b: 'factura' | 'nota_credito'. */
    documentType?: string;
    /** Fase 5b: factura origen cuando es nota crédito. */
    creditNoteRef?: number | null;
    /** Fase 5b: emitida ⇒ sin edición ni eliminación (409 en el servidor). */
    locked?: boolean;
    /** Fase 5b: cotización de origen cuando se generó por conversión. */
    sourceQuoteId?: string;
    createdAt: string;
}

export interface BillingRecurringInvoice {
    id: number;
    clientId: string;
    clientName: string;
    projectId: string;
    projectName: string;
    currencyCode: BillingCurrencyCode;
    taxCalculation: BillingTaxCalculation;
    bankAccountId: number | null;
    bankAccountName: string;
    frequency: BillingFrequency;
    startDate: string;
    nextIssueDate: string;
    cycles: number;
    allowClientStop: boolean;
    showShippingAddress: boolean;
    generatedBy: string;
    items: BillingInvoiceItem[];
    discountValue: number;
    discountMode: BillingDiscountMode;
    subtotal: number;
    taxTotal: number;
    total: number;
    status: BillingRecurringStatus;
    note: string;
    terms: string;
    createdAt: string;
}

export interface BillingTaxOption {
    label: string;
    value: number;
}

export interface BillingSummary {
    subtotal: number;
    discountAmount: number;
    taxTotal: number;
    total: number;
}

// Claves legacy: SOLO se leen una vez para migrar al servidor y se borran
// cuando la migración termina sin errores. Ya no se escribe dato de negocio.
const LEGACY_BILLING_STORAGE_KEY = "adminux.finance.billing.v1";
const LEGACY_RECURRING_STORAGE_KEY = "adminux.finance.billing.recurring.v1";

// Firmas de la semilla mock que este store solía inyectar (funciones
// buildDefault* eliminadas en Fase 5a). Las filas locales con estas firmas NO
// se migran al servidor: eran datos inventados, no del usuario.
const SEED_INVOICE_CREATED_AT = new Set(["2026-04-06T09:30:00.000Z", "2026-04-01T12:00:00.000Z"]);
const SEED_RECURRING_CREATED_AT = new Set(["2026-04-01T08:00:00.000Z", "2026-04-15T10:30:00.000Z"]);

const DEFAULT_TERMS =
    "El beneficiario del servicio debe suministrar la informacion, soportes y aprobaciones relacionadas con la orden. Cualquier cambio de alcance, tiempos o entregables debera acordarse por escrito antes de su ejecucion. Los pagos vencidos podran suspender entregas futuras hasta la normalizacion de la cartera.";

const GENERATED_BY_OPTIONS = ["Equipo comercial", "Coordinacion de proyectos", "Backoffice financiero"] as const;
const PROJECT_NAME_TEMPLATES = ["Proyecto Atlas", "Proyecto Orion", "Proyecto Mercury", "Soporte interno", "Implementacion comercial", "Servicio en sitio", "Manufactura especial"] as const;
const PROJECT_RATE_TEMPLATES = [140000, 125000, 160000, 110000, 135000, 150000, 175000] as const;

function sanitizeText(value: string | undefined | null, fallback = ""): string {
    const sanitized = (value ?? "").trim();
    return sanitized || fallback;
}

function toLookupKey(value: string | undefined | null): string {
    return sanitizeText(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function toPositiveNumber(value: unknown): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        return 0;
    }

    return numeric;
}

function addDays(dateValue: string, days: number): string {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
}

function buildInvoiceSeriesPrefix(dateValue?: string): string {
    return buildCommercialSeriesPrefix("invoice", dateValue);
}

function padSequenceNumber(sequenceNumber: number): string {
    // 6 dígitos para coincidir con el consecutivo oficial del backend
    // (lpad(sequence_number, 6, '0')): el número visible es el mismo con el
    // que la sincronización de pagos resuelve la factura.
    return String(Math.max(1, Math.trunc(sequenceNumber || 1))).padStart(6, "0");
}

function buildCrmClientId(clientId: number): string {
    return `crm-client-${clientId}`;
}

function buildProspectClientId(prospectId: string | number): string {
    return `crm-prospect-${String(prospectId)}`;
}

function buildBillingClientFromCrmClient(client: CrmClientRecord): BillingClient {
    const companyName = sanitizeText(client.empresa, client.nombre);
    const zoneName = sanitizeText(client.zona, "Zona comercial");
    const address = `${companyName} · ${zoneName}`;

    return {
        id: buildCrmClientId(client.id),
        name: companyName,
        contactName: sanitizeText(client.nombre, companyName),
        billingAddress: address,
        shippingAddress: address,
        email: sanitizeText(client.correo, "--"),
        phone: "--",
    };
}

function buildBillingClientFromProspect(prospect: ProspectRecord): BillingClient {
    const companyName = sanitizeText(prospect.compania, prospect.nombre);
    const address = prospect.direccion !== "--" ? sanitizeText(prospect.direccion, `${prospect.zona}, ${prospect.pais}`) : `${sanitizeText(prospect.zona, prospect.ciudad)}, ${sanitizeText(prospect.pais, "Colombia")}`;
    const phone = sanitizeText(prospect.movil || prospect.telefonoOficina, "--");

    return {
        id: buildProspectClientId(prospect.id),
        name: companyName,
        contactName: sanitizeText(prospect.nombre, companyName),
        billingAddress: address,
        shippingAddress: address,
        email: sanitizeText(prospect.correo, "--"),
        phone,
    };
}

/**
 * Cliente tal como lo devuelve GET /api/v1/crm/clients (tabla crm_clients,
 * id = UUID). Subconjunto estructural de CrmClientRecord del service, sin
 * importar el servicio Angular en este store estático.
 */
export interface RealCrmClientRecord {
    id: string;
    nombre: string;
    empresa?: string;
    nit?: string;
    zona?: string;
    estado?: string;
    correo: string;
    officePhone?: string;
    country?: string;
    city?: string;
    address?: string;
}

function buildBillingClientFromRealClient(client: RealCrmClientRecord): BillingClient {
    const companyName = sanitizeText(client.empresa, client.nombre);
    const street = sanitizeText(client.address);
    const locality = sanitizeText(`${client.city ?? ""} ${client.country ?? ""}`.trim());
    const address = [street, locality].filter((part) => part.length > 0).join(" · ") || `${companyName} · Zona comercial`;

    return {
        // id REAL (UUID de crm_clients): estable entre sesiones y coincidente
        // con la BD. El esquema legado 'crm-client-<número>' era dependiente del
        // orden de carga y nunca coincidía con lo que las facturas guardaban.
        id: client.id,
        name: companyName,
        contactName: sanitizeText(client.nombre, companyName),
        billingAddress: address,
        shippingAddress: address,
        email: sanitizeText(client.correo, "--"),
        phone: sanitizeText(client.officePhone, "--"),
    };
}

const CRM_CLIENT_ID_PREFIX = "crm-client-";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normaliza un clientId histórico de factura al id estable del catálogo.
 * 'crm-client-<uuid>' (formato heredado de facturas viejas) → '<uuid>'.
 * 'crm-client-N' (semilla legacy) e ids reales se devuelven intactos.
 */
export function resolveStoredClientId(storedId: string): string {
    const value = sanitizeText(storedId);
    if (value.startsWith(CRM_CLIENT_ID_PREFIX)) {
        const candidate = value.slice(CRM_CLIENT_ID_PREFIX.length);
        if (UUID_PATTERN.test(candidate)) {
            return candidate;
        }
    }
    return value;
}

/**
 * Id de cliente CANÓNICO para el formulario: si la factura guardó el alias
 * heredado 'crm-client-<uuid>', devuelve el UUID puro que usa hoy el catálogo.
 * Los ids legacy ('crm-client-N') y los ya canónicos se devuelven intactos;
 * si no existen en el catálogo, ensureHistoricalEntries() los inyecta bajo ese
 * mismo valor para que el select siempre tenga su opción.
 */
export function canonicalBillingClientId(storedId: string): string {
    return resolveStoredClientId(storedId);
}

const BILLING_PROJECT_PREFIX = "project-";

/**
 * Id de proyecto canónico: 'project-crm-client-<uuid>' → 'project-<uuid>',
 * exactamente lo que buildBillingProjects() genera hoy (`project-${client.id}`)
 * cuando client.id es un UUID. El resto se devuelve intacto.
 */
export function canonicalBillingProjectId(storedProjectId: string): string {
    const value = sanitizeText(storedProjectId);
    if (!value.startsWith(BILLING_PROJECT_PREFIX)) {
        return value;
    }

    const inner = value.slice(BILLING_PROJECT_PREFIX.length);
    return `${BILLING_PROJECT_PREFIX}${resolveStoredClientId(inner)}`;
}

function buildBillingClients(): BillingClient[] {
    const mergedClients = [
        // 1) Clientes reales de la API: id estable (UUID), ganan el dedupe.
        ...(realClientsCache ?? []).map((client) => buildBillingClientFromRealClient(client)),
        // 2) Entradas históricas inyectadas desde facturas existentes.
        ...Array.from(historicalClientEntries.values()),
        // 3-4) Catálogo legacy (mocks + caché CRM), solo compatibilidad.
        ...CRM_PROSPECTS_MOCK.map((prospect) => buildBillingClientFromProspect(prospect)),
        ...getCrmClients().map((client) => buildBillingClientFromCrmClient(client)),
    ];

    const uniqueClients = new Map<string, BillingClient>();
    for (const client of mergedClients) {
        // Doble llave: por id y por nombre|email, para que la misma empresa no
        // aparezca dos veces bajo ids distintos (real vs. legacy).
        if (!uniqueClients.has(client.id)) {
            uniqueClients.set(client.id, client);
        }
        const key = `${toLookupKey(client.name)}|${toLookupKey(client.email)}`;
        if (!uniqueClients.has(key)) {
            uniqueClients.set(key, client);
        }
    }

    return Array.from(uniqueClients.values());
}

function buildBillingProjects(clients: BillingClient[]): BillingProject[] {
    return clients.map((client, index) => ({
        id: `project-${client.id}`,
        clientId: client.id,
        name: PROJECT_NAME_TEMPLATES[index % PROJECT_NAME_TEMPLATES.length],
        hourlyRate: PROJECT_RATE_TEMPLATES[index % PROJECT_RATE_TEMPLATES.length],
    }));
}

function resolveServicePrice(serviceName: string, index: number): number {
    const servicePrices: Record<string, number> = {
        reparacion: 850000,
        venta: 1200000,
        manufactura: 1650000,
        "servicio en sitio": 680000,
    };

    return servicePrices[toLookupKey(serviceName)] ?? 520000 + index * 125000;
}

function resolveModelPrice(familyName: string, index: number): number {
    const familyKey = toLookupKey(familyName);
    if (familyKey.includes("plc")) {
        return 4850000 + index * 250000;
    }

    if (familyKey.includes("variadores")) {
        return 3200000 + index * 180000;
    }

    return 2450000 + index * 150000;
}

function buildBillingCatalog(): BillingCatalogItem[] {
    const serviceItems = getEquipmentServiceTypes()
        .filter((serviceType) => serviceType.active)
        .map((serviceType, index) => ({
            id: serviceType.id,
            label: `Servicio - ${serviceType.name}`,
            description: sanitizeText(serviceType.description, `Servicio comercial de ${serviceType.name.toLowerCase()}.`),
            unitPrice: resolveServicePrice(serviceType.name, index),
            taxRate: 19,
            unitLabel: "Servicio",
        }));

    const productItems = getIndustrialEquipmentModels()
        .filter((model) => model.active)
        .map((model, index) => {
            const familyName = getEquipmentFamilyName(model.familyId);

            return {
                id: model.id,
                label: `Producto - ${model.brand} ${model.series}`,
                description: `${familyName} / ${model.type}${model.notes ? ` · ${model.notes}` : ""}`,
                unitPrice: resolveModelPrice(familyName, index),
                taxRate: 19,
                unitLabel: "Unidad",
            };
        });

    return [...serviceItems, ...productItems];
}

function normalizeGeneratedBy(value: string | undefined): string {
    const sanitized = sanitizeText(value);
    if (!sanitized || /lars/i.test(sanitized)) {
        return GENERATED_BY_OPTIONS[0];
    }

    return sanitized;
}

function normalizeTerms(value: string | undefined): string {
    const sanitized = sanitizeText(value);
    if (!sanitized || /lars/i.test(sanitized)) {
        return DEFAULT_TERMS;
    }

    return sanitized;
}

function normalizeInvoiceItem(item: BillingInvoiceItem): BillingInvoiceItem {
    return {
        id: sanitizeText(item.id, `billing-item-${Date.now()}`),
        name: sanitizeText(item.name, "Item comercial"),
        description: sanitizeText(item.description),
        quantity: Math.max(toPositiveNumber(item.quantity), 0),
        unitLabel: sanitizeText(item.unitLabel, "Unidad"),
        unitPrice: toPositiveNumber(item.unitPrice),
        taxRate: Math.max(toPositiveNumber(item.taxRate), 0),
        attachmentName: sanitizeText(item.attachmentName),
    };
}

function findBillingClient(clients: BillingClient[], clientId: string, clientName: string): BillingClient | undefined {
    const normalizedName = toLookupKey(clientName);

    return (
        clients.find((client) => client.id === clientId) ||
        clients.find((client) => toLookupKey(client.name) === normalizedName) ||
        clients.find((client) => toLookupKey(client.contactName) === normalizedName)
    );
}

function findBillingProject(projects: BillingProject[], projectId: string, projectName: string): BillingProject | undefined {
    const normalizedName = toLookupKey(projectName);
    return projects.find((project) => project.id === projectId) || projects.find((project) => toLookupKey(project.name) === normalizedName);
}

export function computeInvoiceSummary(
    items: BillingInvoiceItem[],
    discountValue: number,
    discountMode: BillingDiscountMode,
    taxCalculation: BillingTaxCalculation
): BillingSummary {
    const subtotal = items.reduce((total, item) => total + Math.max(item.quantity, 0) * Math.max(item.unitPrice, 0), 0);
    const normalizedDiscount = Math.max(discountValue || 0, 0);
    const discountAmount = discountMode === "percent" ? subtotal * (normalizedDiscount / 100) : normalizedDiscount;
    const effectiveDiscount = Math.min(discountAmount, subtotal);

    if (subtotal <= 0 || taxCalculation === "Sin impuesto") {
        return {
            subtotal,
            discountAmount: effectiveDiscount,
            taxTotal: 0,
            total: Math.max(subtotal - effectiveDiscount, 0),
        };
    }

    const taxTotal = items.reduce((total, item) => {
        const lineSubtotal = Math.max(item.quantity, 0) * Math.max(item.unitPrice, 0);
        const proratedDiscount = subtotal > 0 ? effectiveDiscount * (lineSubtotal / subtotal) : 0;
        const baseAmount = taxCalculation === "Despues del descuento" ? Math.max(lineSubtotal - proratedDiscount, 0) : lineSubtotal;
        return total + baseAmount * (Math.max(item.taxRate, 0) / 100);
    }, 0);

    return {
        subtotal,
        discountAmount: effectiveDiscount,
        taxTotal,
        total: Math.max(subtotal - effectiveDiscount, 0) + taxTotal,
    };
}

export function deriveInvoiceStatus(total: number, paidAmount: number, preferredStatus?: BillingInvoiceStatus): BillingInvoiceStatus {
    if (preferredStatus === "Borrador" || preferredStatus === "Cancelado" || preferredStatus === "Enviado") {
        return preferredStatus;
    }

    if (paidAmount >= total && total > 0) {
        return "Pagado";
    }

    if (paidAmount > 0 && paidAmount < total) {
        return "Pago parcial";
    }

    return "Pendiente";
}

export function computeNextIssueDate(startDate: string, frequency: BillingFrequency): string {
    switch (frequency) {
        case "Diario":
            return addDays(startDate, 1);
        case "Semanal":
            return addDays(startDate, 7);
        case "Quincenal":
            return addDays(startDate, 15);
        case "Mensual":
            return addDays(startDate, 30);
        case "Bimensual":
            return addDays(startDate, 60);
        case "Trimestral":
            return addDays(startDate, 90);
        default:
            return addDays(startDate, 30);
    }
}

// normalizeInvoice/normalizeRecurringInvoice se conservan SOLO para limpiar las
// formas legacy durante la migración única de localStorage. Los datos que
// devuelve el servidor son la fuente de verdad y no se renormalizan.
function normalizeInvoice(invoice: BillingInvoice, clients: BillingClient[], projects: BillingProject[]): BillingInvoice {
    const safeIssueDate = sanitizeText(invoice.issueDate, new Date().toISOString().slice(0, 10));
    const matchedClient = findBillingClient(clients, invoice.clientId, invoice.clientName);
    const matchedProject = findBillingProject(projects, invoice.projectId, invoice.projectName);
    const normalizedItems = Array.isArray(invoice.items) ? invoice.items.map((item) => normalizeInvoiceItem(item)) : [];
    const summary = computeInvoiceSummary(normalizedItems, toPositiveNumber(invoice.discountValue), invoice.discountMode ?? "percent", invoice.taxCalculation ?? "Despues del descuento");
    const paidAmount = Math.min(toPositiveNumber(invoice.paidAmount), summary.total);

    return {
        ...invoice,
        referenceCode: sanitizeText(invoice.referenceCode, "--"),
        seriesPrefix: buildInvoiceSeriesPrefix(safeIssueDate),
        sequenceNumber: Math.max(1, Math.trunc(toPositiveNumber(invoice.sequenceNumber) || 1)),
        projectId: matchedProject?.id ?? sanitizeText(invoice.projectId),
        projectName: matchedProject?.name ?? sanitizeText(invoice.projectName, "Sin proyecto"),
        clientId: matchedClient?.id ?? sanitizeText(invoice.clientId),
        clientName: matchedClient?.name ?? sanitizeText(invoice.clientName, "Cliente sin definir"),
        billingAddress: matchedClient?.billingAddress ?? sanitizeText(invoice.billingAddress, "Direccion no definida"),
        shippingAddress: sanitizeText(invoice.shippingAddress, matchedClient?.shippingAddress ?? sanitizeText(invoice.billingAddress, "Direccion no definida")),
        issueDate: safeIssueDate,
        dueDate: sanitizeText(invoice.dueDate, addDays(safeIssueDate, 15)),
        currencyCode: invoice.currencyCode ?? "COP",
        exchangeRate: toPositiveNumber(invoice.exchangeRate) || 1,
        bankAccountId: invoice.bankAccountId ?? null,
        bankAccountName: sanitizeText(invoice.bankAccountName, "--"),
        taxCalculation: invoice.taxCalculation ?? "Despues del descuento",
        generatedBy: normalizeGeneratedBy(invoice.generatedBy),
        items: normalizedItems,
        discountValue: toPositiveNumber(invoice.discountValue),
        discountMode: invoice.discountMode ?? "percent",
        subtotal: summary.subtotal,
        taxTotal: summary.taxTotal,
        total: summary.total,
        paidAmount,
        balanceAmount: Math.max(summary.total - paidAmount, 0),
        status: deriveInvoiceStatus(summary.total, paidAmount, invoice.status),
        note: sanitizeText(invoice.note),
        terms: normalizeTerms(invoice.terms),
        attachmentName: sanitizeText(invoice.attachmentName),
        receivedPayment: Boolean(invoice.receivedPayment),
        source: invoice.source === "timesheet" ? "timesheet" : "manual",
        createdAt: sanitizeText(invoice.createdAt, new Date().toISOString()),
    };
}

function normalizeRecurringInvoice(invoice: BillingRecurringInvoice, clients: BillingClient[], projects: BillingProject[]): BillingRecurringInvoice {
    const matchedClient = findBillingClient(clients, invoice.clientId, invoice.clientName);
    const matchedProject = findBillingProject(projects, invoice.projectId, invoice.projectName);
    const normalizedItems = Array.isArray(invoice.items) ? invoice.items.map((item) => normalizeInvoiceItem(item)) : [];
    const frequency = invoice.frequency ?? "Mensual";
    const summary = computeInvoiceSummary(normalizedItems, toPositiveNumber(invoice.discountValue), invoice.discountMode ?? "percent", invoice.taxCalculation ?? "Despues del descuento");
    const startDate = sanitizeText(invoice.startDate, new Date().toISOString().slice(0, 10));

    return {
        ...invoice,
        clientId: matchedClient?.id ?? sanitizeText(invoice.clientId),
        clientName: matchedClient?.name ?? sanitizeText(invoice.clientName, "Cliente sin definir"),
        projectId: matchedProject?.id ?? sanitizeText(invoice.projectId),
        projectName: matchedProject?.name ?? sanitizeText(invoice.projectName, "Sin proyecto"),
        currencyCode: invoice.currencyCode ?? "COP",
        taxCalculation: invoice.taxCalculation ?? "Despues del descuento",
        bankAccountId: invoice.bankAccountId ?? null,
        bankAccountName: sanitizeText(invoice.bankAccountName, "--"),
        frequency,
        startDate,
        nextIssueDate: sanitizeText(invoice.nextIssueDate, computeNextIssueDate(startDate, frequency)),
        cycles: Number.isFinite(invoice.cycles) ? invoice.cycles : -1,
        allowClientStop: Boolean(invoice.allowClientStop),
        showShippingAddress: Boolean(invoice.showShippingAddress),
        generatedBy: normalizeGeneratedBy(invoice.generatedBy),
        items: normalizedItems,
        discountValue: toPositiveNumber(invoice.discountValue),
        discountMode: invoice.discountMode ?? "percent",
        subtotal: summary.subtotal,
        taxTotal: summary.taxTotal,
        total: summary.total,
        status: invoice.status ?? "Activa",
        note: sanitizeText(invoice.note),
        terms: normalizeTerms(invoice.terms),
        createdAt: sanitizeText(invoice.createdAt, new Date().toISOString()),
    };
}

function isSeedInvoice(invoice: BillingInvoice): boolean {
    return (invoice.id === 1 || invoice.id === 2) && SEED_INVOICE_CREATED_AT.has(invoice.createdAt);
}

function isSeedRecurringInvoice(invoice: BillingRecurringInvoice): boolean {
    return (invoice.id === 1 || invoice.id === 2) && SEED_RECURRING_CREATED_AT.has(invoice.createdAt);
}

function readLegacyArray<T>(storageKey: string): T[] | null {
    if (!isBrowserEnv()) {
        return null;
    }
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as T[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        // Clave corrupta: nada rescatable; se elimina para no reintentar una
        // migración imposible en cada arranque.
        window.localStorage.removeItem(storageKey);
        return null;
    }
}

function storeErrorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim() ? error.message : String(error);
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]): T[] {
    return items.slice().sort((left, right) => sanitizeText(right.createdAt).localeCompare(sanitizeText(left.createdAt)));
}

// ── Caché en memoria respaldada por la API ──────────────────────────────────

let invoicesCache: BillingInvoice[] = [];
let recurringCache: BillingRecurringInvoice[] = [];
/** Clientes reales de la API (GET /api/v1/crm/clients, id = UUID). null = aún sin cargar o falló. */
let realClientsCache: RealCrmClientRecord[] | null = null;
/** Entradas históricas inyectadas desde facturas existentes (patrón optionsFor del picker RRHH). */
const historicalClientEntries = new Map<string, BillingClient>();
const historicalProjectEntries = new Map<string, BillingProject>();
let lastError: string | null = null;
let loaded = false;
let loadPromise: Promise<void> | null = null;
let migrationStarted = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
    listeners.forEach((listener) => listener());
}

/**
 * Store de facturación respaldado por el servidor (GET/POST /finance/invoices y
 * /finance/recurring-invoices). getInvoices() es síncrono sobre la caché;
 * ensureLoaded() la puebla y avisa a los suscriptores. Ya no existe semilla
 * mock: si el servidor no tiene facturas, la lista está vacía en vez de
 * inventada.
 *
 * Migración única de 'adminux.finance.billing.v1' y '...recurring.v1': sube
 * solo lo que no exista en el servidor (dedupe por serie+consecutivo /
 * cliente+inicio+frecuencia), NUNCA sube la semilla mock, y borra cada clave
 * SOLO si su migración terminó sin errores.
 */
export class FinanceBillingStore {
    static getClients(): BillingClient[] {
        return buildBillingClients();
    }

    static getProjects(clientId?: string): BillingProject[] {
        const mergedProjects = [
            ...Array.from(historicalProjectEntries.values()),
            ...buildBillingProjects(this.getClients()),
        ];

        const uniqueProjects = new Map<string, BillingProject>();
        for (const project of mergedProjects) {
            if (!uniqueProjects.has(project.id)) {
                uniqueProjects.set(project.id, project);
            }
        }

        let projects = Array.from(uniqueProjects.values());
        if (clientId) {
            projects = projects.filter((project) => project.clientId === clientId);
        }
        return projects;
    }

    static getCatalog(): BillingCatalogItem[] {
        return buildBillingCatalog();
    }

    static getTaxOptions(): BillingTaxOption[] {
        return [
            { label: "Nada seleccionado", value: 0 },
            { label: "IVA 5%", value: 5 },
            { label: "IVA 19%", value: 19 },
        ];
    }

    static getCurrencyOptions(): Array<{ value: BillingCurrencyCode; label: string }> {
        return [
            { value: "COP", label: "COP ($)" },
            { value: "USD", label: "USD ($)" },
            { value: "EUR", label: "EUR (EUR)" },
        ];
    }

    static getTaxCalculationOptions(): BillingTaxCalculation[] {
        return ["Despues del descuento", "Antes del descuento", "Sin impuesto"];
    }

    static getGeneratedByOptions(): string[] {
        return [...GENERATED_BY_OPTIONS];
    }

    static getFrequencyOptions(): BillingFrequency[] {
        return ["Diario", "Semanal", "Quincenal", "Mensual", "Bimensual", "Trimestral"];
    }

    static getUnitOptions(): string[] {
        return ["Unidad", "Hora", "Servicio", "Dia", "Mes"];
    }

    static getDefaultTerms(): string {
        return DEFAULT_TERMS;
    }

    static getInvoiceSeriesPrefix(dateValue?: string): string {
        return buildInvoiceSeriesPrefix(dateValue);
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
            // Fase 6: el catálogo de facturación se construye a partir de los
            // maestros de equipos (tipos de servicio y modelos industriales), que
            // ahora vienen del servidor. Hay que esperarlo acá, o getCatalog()
            // devolvería una lista vacía en el primer render.
            const [invoicesResponse, recurringResponse] = await Promise.all([
                financeStoreFetch<{ items: BillingInvoice[] }>("/api/v1/finance/invoices"),
                financeStoreFetch<{ items: BillingRecurringInvoice[] }>("/api/v1/finance/recurring-invoices"),
                ensureEquipmentCatalogLoaded(),
                // Clientes reales (UUID estables) para el catálogo de facturación.
                // No fatal: si falla, el catálogo cae a mocks + entradas
                // históricas y la edición sigue hidratando lo guardado.
                financeStoreFetch<{ items: RealCrmClientRecord[] }>("/api/v1/crm/clients")
                    .then((response) => {
                        realClientsCache = response.items ?? [];
                    })
                    .catch(() => {
                        realClientsCache = null;
                    }),
            ]);
            invoicesCache = sortByCreatedAtDesc(invoicesResponse.items ?? []);
            recurringCache = sortByCreatedAtDesc(recurringResponse.items ?? []);
            loaded = true;
            notifyListeners();
            await this.migrateLegacyState();
        } catch (error) {
            loaded = false;
            lastError = `No se pudo cargar la facturacion del servidor: ${storeErrorMessage(error)}`;
            notifyListeners();
        }
    }

    static getInvoices(): BillingInvoice[] {
        return invoicesCache;
    }

    /** Actualiza solo la caché (p. ej. tras recargar desde la API). */
    static saveInvoices(invoices: BillingInvoice[]): void {
        invoicesCache = sortByCreatedAtDesc(invoices);
        notifyListeners();
    }

    /** Inserta en la caché un registro ya creado en el servidor. */
    static addInvoice(invoice: BillingInvoice): BillingInvoice {
        invoicesCache = sortByCreatedAtDesc([invoice, ...invoicesCache]);
        notifyListeners();
        return invoice;
    }

    /** Actualiza la caché tras un cambio confirmado por la API. */
    static updateInvoiceStatus(invoiceId: number, status: BillingInvoiceStatus): void {
        invoicesCache = invoicesCache.map((invoice) => {
            if (invoice.id !== invoiceId) {
                return invoice;
            }

            const paidAmount = status === "Pagado" ? invoice.total : invoice.paidAmount;
            return {
                ...invoice,
                status,
                paidAmount,
                balanceAmount: Math.max(invoice.total - paidAmount, 0),
            };
        });
        notifyListeners();
    }

    static getRecurringInvoices(): BillingRecurringInvoice[] {
        return recurringCache;
    }

    static saveRecurringInvoices(invoices: BillingRecurringInvoice[]): void {
        recurringCache = sortByCreatedAtDesc(invoices);
        notifyListeners();
    }

    static addRecurringInvoice(invoice: BillingRecurringInvoice): BillingRecurringInvoice {
        recurringCache = sortByCreatedAtDesc([invoice, ...recurringCache]);
        notifyListeners();
        return invoice;
    }

    static updateRecurringStatus(invoiceId: number, status: BillingRecurringStatus): void {
        recurringCache = recurringCache.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status } : invoice));
        notifyListeners();
    }

    static removeRecurringInvoice(invoiceId: number): void {
        recurringCache = recurringCache.filter((invoice) => invoice.id !== invoiceId);
        notifyListeners();
    }

    static getNextInvoiceId(): number {
        const currentIds = invoicesCache.map((invoice) => Number(invoice.id) || 0);
        return currentIds.length ? Math.max(...currentIds) + 1 : 1;
    }

    static getNextRecurringId(): number {
        const currentIds = recurringCache.map((invoice) => Number(invoice.id) || 0);
        return currentIds.length ? Math.max(...currentIds) + 1 : 1;
    }

    static findClient(clientId: string): BillingClient | undefined {
        const clients = this.getClients();
        const direct = clients.find((client) => client.id === clientId);
        if (direct || !clientId) {
            return direct;
        }

        // Facturas históricas guardaron 'crm-client-<uuid>'; el catálogo hoy usa
        // el UUID puro. Resolver el alias evita que la edición pinte Cliente en
        // blanco aunque todo lo demás coincida.
        const resolved = resolveStoredClientId(clientId);
        return resolved !== clientId ? clients.find((client) => client.id === resolved) : undefined;
    }

    /**
     * Garantiza que el valor histórico de una factura (cliente/proyecto ya
     * guardados en la BD) exista en el catálogo, aunque ese cliente no esté hoy
     * en la API ni entre los mocks. Misma semántica del optionsFor() del picker
     * RRHH: un registro histórico pintado en blanco es un bug, no un estado.
     */
    static ensureHistoricalEntries(entry: { clientId?: string; clientName?: string; projectId?: string; projectName?: string }): void {
        let changed = false;

        const clientId = sanitizeText(entry.clientId);
        if (clientId && !this.getClients().some((client) => client.id === clientId)) {
            historicalClientEntries.set(clientId, {
                id: clientId,
                name: sanitizeText(entry.clientName, "Cliente histórico"),
                contactName: "",
                billingAddress: "",
                shippingAddress: "",
                email: "--",
                phone: "--",
            });
            changed = true;
        }

        const projectId = sanitizeText(entry.projectId);
        if (projectId && clientId && !this.getProjects().some((project) => project.id === projectId)) {
            historicalProjectEntries.set(projectId, {
                id: projectId,
                clientId,
                name: sanitizeText(entry.projectName, "Proyecto histórico"),
                hourlyRate: 0,
            });
            changed = true;
        }

        if (changed) {
            notifyListeners();
        }
    }

    static findProject(projectId: string): BillingProject | undefined {
        return this.getProjects().find((project) => project.id === projectId);
    }

    static buildInvoiceCode(seriesPrefix: string, sequenceNumber: number): string {
        return `${sanitizeText(seriesPrefix, buildInvoiceSeriesPrefix())}${padSequenceNumber(sequenceNumber)}`;
    }

    // ── Migración única de localStorage ─────────────────────────────────────

    private static async migrateLegacyState(): Promise<void> {
        if (migrationStarted || !isBrowserEnv()) {
            return;
        }

        const legacyInvoices = readLegacyArray<BillingInvoice>(LEGACY_BILLING_STORAGE_KEY);
        const legacyRecurring = readLegacyArray<BillingRecurringInvoice>(LEGACY_RECURRING_STORAGE_KEY);
        if (legacyInvoices === null && legacyRecurring === null) {
            return;
        }

        migrationStarted = true;
        const failures: string[] = [];
        const clients = buildBillingClients();
        const projects = buildBillingProjects(clients);

        if (legacyInvoices !== null) {
            const existingKeys = new Set(invoicesCache.map((invoice) => `${invoice.seriesPrefix}|${invoice.sequenceNumber}`));
            for (const rawInvoice of legacyInvoices) {
                if (!rawInvoice || isSeedInvoice(rawInvoice)) {
                    continue;
                }
                const invoice = normalizeInvoice(rawInvoice, clients, projects);
                const dedupeKey = `${invoice.seriesPrefix}|${invoice.sequenceNumber}`;
                if (existingKeys.has(dedupeKey)) {
                    continue;
                }
                try {
                    const created = await financeStoreFetch<BillingInvoice>("/api/v1/finance/invoices", {
                        method: "POST",
                        body: JSON.stringify(invoice),
                    });
                    invoicesCache = sortByCreatedAtDesc([created, ...invoicesCache]);
                    existingKeys.add(`${created.seriesPrefix}|${created.sequenceNumber}`);
                } catch (error) {
                    failures.push(`factura ${invoice.seriesPrefix}${invoice.sequenceNumber}: ${storeErrorMessage(error)}`);
                }
            }
            if (!failures.some((failure) => failure.startsWith("factura "))) {
                window.localStorage.removeItem(LEGACY_BILLING_STORAGE_KEY);
            }
        }

        if (legacyRecurring !== null) {
            const recurringFailures: string[] = [];
            const existingKeys = new Set(recurringCache.map((invoice) => `${invoice.clientName}|${invoice.startDate}|${invoice.frequency}|${invoice.total}`));
            for (const rawRecurring of legacyRecurring) {
                if (!rawRecurring || isSeedRecurringInvoice(rawRecurring)) {
                    continue;
                }
                const recurring = normalizeRecurringInvoice(rawRecurring, clients, projects);
                const dedupeKey = `${recurring.clientName}|${recurring.startDate}|${recurring.frequency}|${recurring.total}`;
                if (existingKeys.has(dedupeKey)) {
                    continue;
                }
                try {
                    const created = await financeStoreFetch<BillingRecurringInvoice>("/api/v1/finance/recurring-invoices", {
                        method: "POST",
                        body: JSON.stringify(recurring),
                    });
                    recurringCache = sortByCreatedAtDesc([created, ...recurringCache]);
                    existingKeys.add(`${created.clientName}|${created.startDate}|${created.frequency}|${created.total}`);
                } catch (error) {
                    recurringFailures.push(`recurrente de ${recurring.clientName}: ${storeErrorMessage(error)}`);
                }
            }
            if (recurringFailures.length === 0) {
                window.localStorage.removeItem(LEGACY_RECURRING_STORAGE_KEY);
            } else {
                failures.push(...recurringFailures);
            }
        }

        if (failures.length > 0) {
            // Las claves con fallos SE CONSERVAN y se reintenta en el próximo
            // arranque; el error queda visible para la UI.
            migrationStarted = false;
            lastError = `La migracion de tu facturacion local fallo y se reintentara mas tarde. Detalles: ${failures.join(" | ")}`;
        }
        notifyListeners();
    }
}
