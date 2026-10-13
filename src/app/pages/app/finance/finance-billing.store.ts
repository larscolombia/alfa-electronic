import { getEquipmentFamilyName, getEquipmentServiceTypes, getIndustrialEquipmentModels } from "../company/company-equipment-config.store";
import { buildCommercialSeriesPrefix } from "../company/company-commercial-settings.store";
import { CrmClientRecord, getCrmClients } from "../crm/crm-clients.store";
import { CRM_PROSPECTS_MOCK, ProspectRecord } from "../crm/crm-prospects.store";

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
    source: "manual" | "timesheet";
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

const BILLING_STORAGE_KEY = "adminux.finance.billing.v1";
const RECURRING_STORAGE_KEY = "adminux.finance.billing.recurring.v1";

const DEFAULT_TERMS =
    "El beneficiario del servicio debe suministrar la informacion, soportes y aprobaciones relacionadas con la orden. Cualquier cambio de alcance, tiempos o entregables debera acordarse por escrito antes de su ejecucion. Los pagos vencidos podran suspender entregas futuras hasta la normalizacion de la cartera.";

const GENERATED_BY_OPTIONS = ["Equipo comercial", "Coordinacion de proyectos", "Backoffice financiero"] as const;
const PROJECT_NAME_TEMPLATES = ["Proyecto Atlas", "Proyecto Orion", "Proyecto Mercury", "Soporte interno", "Implementacion comercial", "Servicio en sitio", "Manufactura especial"] as const;
const PROJECT_RATE_TEMPLATES = [140000, 125000, 160000, 110000, 135000, 150000, 175000] as const;

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
}

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

function restoreArray<T>(storageKey: string, defaultValue: T[]): T[] {
    if (!isBrowser()) {
        return cloneValue(defaultValue);
    }

    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
        return cloneValue(defaultValue);
    }

    try {
        const parsedValue = JSON.parse(rawValue) as T[];
        return Array.isArray(parsedValue) ? parsedValue : cloneValue(defaultValue);
    } catch {
        return cloneValue(defaultValue);
    }
}

function saveArray<T>(storageKey: string, value: T[]): void {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(value));
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
    return String(Math.max(1, Math.trunc(sequenceNumber || 1))).padStart(3, "0");
}

function buildCrmClientId(clientId: number): string {
    return `crm-client-${clientId}`;
}

function buildProspectClientId(prospectId: number): string {
    return `crm-prospect-${prospectId}`;
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

function buildBillingClients(): BillingClient[] {
    const mergedClients = [
        ...CRM_PROSPECTS_MOCK.map((prospect) => buildBillingClientFromProspect(prospect)),
        ...getCrmClients().map((client) => buildBillingClientFromCrmClient(client)),
    ];

    const uniqueClients = new Map<string, BillingClient>();
    for (const client of mergedClients) {
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

function buildDefaultInvoices(): BillingInvoice[] {
    const clients = buildBillingClients();
    const projects = buildBillingProjects(clients);
    const catalog = buildBillingCatalog();

    const restrepoClient = clients.find((client) => client.id === buildProspectClientId(2)) ?? clients[0];
    const techSolutionsClient = clients.find((client) => client.id === buildCrmClientId(1)) ?? clients[1] ?? clients[0];
    const restrepoProject = projects.find((project) => project.clientId === restrepoClient.id) ?? projects[0];
    const techSolutionsProject = projects.find((project) => project.clientId === techSolutionsClient.id) ?? projects[1] ?? projects[0];
    const onsiteService = catalog.find((item) => item.id === "service-servicio-sitio") ?? catalog[0];
    const manufacturingService = catalog.find((item) => item.id === "service-manufactura") ?? catalog[0];
    const siemensProduct = catalog.find((item) => item.id === "model-siemens-g120") ?? catalog[catalog.length - 1];
    const plcProduct = catalog.find((item) => item.id === "model-allenbradley-compactlogix") ?? catalog[catalog.length - 1];

    const firstInvoiceItems: BillingInvoiceItem[] = [
        {
            id: "default-invoice-item-1",
            name: onsiteService.label.replace("Servicio - ", ""),
            description: `${onsiteService.description} Equipo asociado: ${siemensProduct.label.replace("Producto - ", "")}`,
            quantity: 1,
            unitLabel: onsiteService.unitLabel,
            unitPrice: onsiteService.unitPrice,
            taxRate: onsiteService.taxRate,
            attachmentName: "",
        },
        {
            id: "default-invoice-item-2",
            name: siemensProduct.label.replace("Producto - ", ""),
            description: siemensProduct.description,
            quantity: 1,
            unitLabel: siemensProduct.unitLabel,
            unitPrice: siemensProduct.unitPrice,
            taxRate: siemensProduct.taxRate,
            attachmentName: "",
        },
    ];
    const firstSummary = computeInvoiceSummary(firstInvoiceItems, 0, "percent", "Despues del descuento");

    const secondInvoiceItems: BillingInvoiceItem[] = [
        {
            id: "default-invoice-item-3",
            name: manufacturingService.label.replace("Servicio - ", ""),
            description: manufacturingService.description,
            quantity: 1,
            unitLabel: manufacturingService.unitLabel,
            unitPrice: manufacturingService.unitPrice,
            taxRate: manufacturingService.taxRate,
            attachmentName: "",
        },
        {
            id: "default-invoice-item-4",
            name: plcProduct.label.replace("Producto - ", ""),
            description: plcProduct.description,
            quantity: 1,
            unitLabel: plcProduct.unitLabel,
            unitPrice: plcProduct.unitPrice,
            taxRate: plcProduct.taxRate,
            attachmentName: "",
        },
    ];
    const secondSummary = computeInvoiceSummary(secondInvoiceItems, 0, "percent", "Despues del descuento");

    return [
        {
            id: 1,
            referenceCode: "--",
            seriesPrefix: buildInvoiceSeriesPrefix("2026-04-06"),
            sequenceNumber: 1,
            projectId: restrepoProject.id,
            projectName: restrepoProject.name,
            clientId: restrepoClient.id,
            clientName: restrepoClient.name,
            billingAddress: restrepoClient.billingAddress,
            shippingAddress: restrepoClient.shippingAddress,
            issueDate: "2026-04-06",
            dueDate: "2026-04-20",
            currencyCode: "COP",
            exchangeRate: 1,
            bankAccountId: null,
            bankAccountName: "--",
            taxCalculation: "Despues del descuento",
            generatedBy: GENERATED_BY_OPTIONS[0],
            items: firstInvoiceItems,
            discountValue: 0,
            discountMode: "percent",
            subtotal: firstSummary.subtotal,
            taxTotal: firstSummary.taxTotal,
            total: firstSummary.total,
            paidAmount: 0,
            balanceAmount: firstSummary.total,
            status: "Cancelado",
            note: "Servicio cancelado por reprogramacion del cliente antes del despacho final.",
            terms: DEFAULT_TERMS,
            attachmentName: "",
            receivedPayment: false,
            source: "manual",
            createdAt: "2026-04-06T09:30:00.000Z",
        },
        {
            id: 2,
            referenceCode: "--",
            seriesPrefix: buildInvoiceSeriesPrefix("2026-04-01"),
            sequenceNumber: 2,
            projectId: techSolutionsProject.id,
            projectName: techSolutionsProject.name,
            clientId: techSolutionsClient.id,
            clientName: techSolutionsClient.name,
            billingAddress: techSolutionsClient.billingAddress,
            shippingAddress: techSolutionsClient.shippingAddress,
            issueDate: "2026-04-01",
            dueDate: "2026-04-15",
            currencyCode: "COP",
            exchangeRate: 1,
            bankAccountId: null,
            bankAccountName: "--",
            taxCalculation: "Despues del descuento",
            generatedBy: GENERATED_BY_OPTIONS[1],
            items: secondInvoiceItems,
            discountValue: 0,
            discountMode: "percent",
            subtotal: secondSummary.subtotal,
            taxTotal: secondSummary.taxTotal,
            total: secondSummary.total,
            paidAmount: 2500000,
            balanceAmount: Math.max(secondSummary.total - 2500000, 0),
            status: "Pago parcial",
            note: "Abono recibido y saldo pendiente contra entrega final.",
            terms: DEFAULT_TERMS,
            attachmentName: "",
            receivedPayment: false,
            source: "manual",
            createdAt: "2026-04-01T12:00:00.000Z",
        },
    ];
}

function buildDefaultRecurringInvoices(): BillingRecurringInvoice[] {
    const clients = buildBillingClients();
    const projects = buildBillingProjects(clients);
    const catalog = buildBillingCatalog();
    const digitalClient = clients.find((client) => client.id === buildCrmClientId(2)) ?? clients[0];
    const imukoClient = clients.find((client) => client.id === buildProspectClientId(1)) ?? clients[1] ?? clients[0];
    const digitalProject = projects.find((project) => project.clientId === digitalClient.id) ?? projects[0];
    const imukoProject = projects.find((project) => project.clientId === imukoClient.id) ?? projects[1] ?? projects[0];
    const repairService = catalog.find((item) => item.id === "service-reparacion") ?? catalog[0];
    const onsiteService = catalog.find((item) => item.id === "service-servicio-sitio") ?? catalog[0];

    const firstItems: BillingInvoiceItem[] = [
        {
            id: "default-recurring-item-1",
            name: repairService.label.replace("Servicio - ", ""),
            description: repairService.description,
            quantity: 1,
            unitLabel: repairService.unitLabel,
            unitPrice: repairService.unitPrice,
            taxRate: repairService.taxRate,
            attachmentName: "",
        },
    ];
    const firstSummary = computeInvoiceSummary(firstItems, 0, "percent", "Despues del descuento");

    const secondItems: BillingInvoiceItem[] = [
        {
            id: "default-recurring-item-2",
            name: onsiteService.label.replace("Servicio - ", ""),
            description: onsiteService.description,
            quantity: 2,
            unitLabel: onsiteService.unitLabel,
            unitPrice: onsiteService.unitPrice,
            taxRate: onsiteService.taxRate,
            attachmentName: "",
        },
    ];
    const secondSummary = computeInvoiceSummary(secondItems, 0, "percent", "Despues del descuento");

    return [
        {
            id: 1,
            clientId: digitalClient.id,
            clientName: digitalClient.name,
            projectId: digitalProject.id,
            projectName: digitalProject.name,
            currencyCode: "COP",
            taxCalculation: "Despues del descuento",
            bankAccountId: null,
            bankAccountName: "--",
            frequency: "Mensual",
            startDate: "2026-04-01",
            nextIssueDate: computeNextIssueDate("2026-04-01", "Mensual"),
            cycles: -1,
            allowClientStop: true,
            showShippingAddress: false,
            generatedBy: GENERATED_BY_OPTIONS[2],
            items: firstItems,
            discountValue: 0,
            discountMode: "percent",
            subtotal: firstSummary.subtotal,
            taxTotal: firstSummary.taxTotal,
            total: firstSummary.total,
            status: "Activa",
            note: "Servicio recurrente de mantenimiento preventivo para cartera activa.",
            terms: DEFAULT_TERMS,
            createdAt: "2026-04-01T08:00:00.000Z",
        },
        {
            id: 2,
            clientId: imukoClient.id,
            clientName: imukoClient.name,
            projectId: imukoProject.id,
            projectName: imukoProject.name,
            currencyCode: "COP",
            taxCalculation: "Despues del descuento",
            bankAccountId: null,
            bankAccountName: "--",
            frequency: "Quincenal",
            startDate: "2026-04-15",
            nextIssueDate: computeNextIssueDate("2026-04-15", "Quincenal"),
            cycles: 6,
            allowClientStop: false,
            showShippingAddress: true,
            generatedBy: GENERATED_BY_OPTIONS[0],
            items: secondItems,
            discountValue: 0,
            discountMode: "percent",
            subtotal: secondSummary.subtotal,
            taxTotal: secondSummary.taxTotal,
            total: secondSummary.total,
            status: "Pausada",
            note: "Cobro quincenal por visitas tecnicas programadas en sitio.",
            terms: DEFAULT_TERMS,
            createdAt: "2026-04-15T10:30:00.000Z",
        },
    ];
}

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

function normalizeInvoices(invoices: BillingInvoice[]): BillingInvoice[] {
    const clients = buildBillingClients();
    const projects = buildBillingProjects(clients);
    return invoices.map((invoice) => normalizeInvoice(invoice, clients, projects));
}

function normalizeRecurringInvoices(invoices: BillingRecurringInvoice[]): BillingRecurringInvoice[] {
    const clients = buildBillingClients();
    const projects = buildBillingProjects(clients);
    return invoices.map((invoice) => normalizeRecurringInvoice(invoice, clients, projects));
}

export class FinanceBillingStore {
    static getClients(): BillingClient[] {
        return buildBillingClients();
    }

    static getProjects(clientId?: string): BillingProject[] {
        const projects = buildBillingProjects(this.getClients());
        if (!clientId) {
            return projects;
        }

        return projects.filter((project) => project.clientId === clientId);
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

    static getInvoices(): BillingInvoice[] {
        const rawInvoices = restoreArray(BILLING_STORAGE_KEY, buildDefaultInvoices());
        const normalizedInvoices = normalizeInvoices(rawInvoices).sort((leftInvoice, rightInvoice) => rightInvoice.createdAt.localeCompare(leftInvoice.createdAt));

        if (isBrowser()) {
            saveArray(BILLING_STORAGE_KEY, normalizedInvoices);
        }

        return normalizedInvoices;
    }

    static saveInvoices(invoices: BillingInvoice[]): void {
        saveArray(BILLING_STORAGE_KEY, normalizeInvoices(invoices));
    }

    static addInvoice(invoice: BillingInvoice): BillingInvoice {
        const normalizedInvoice = normalizeInvoice(invoice, this.getClients(), this.getProjects());
        const invoices = this.getInvoices();
        this.saveInvoices([normalizedInvoice, ...invoices]);
        return normalizedInvoice;
    }

    static duplicateInvoice(invoiceId: number): BillingInvoice | null {
        const sourceInvoice = this.getInvoices().find((invoice) => invoice.id === invoiceId);
        if (!sourceInvoice) {
            return null;
        }

        const todayValue = new Date().toISOString().slice(0, 10);
        const clonedInvoice: BillingInvoice = {
            ...cloneValue(sourceInvoice),
            id: this.getNextInvoiceId(),
            seriesPrefix: buildInvoiceSeriesPrefix(todayValue),
            sequenceNumber: this.getNextSequenceNumber(todayValue),
            issueDate: todayValue,
            dueDate: addDays(todayValue, 15),
            paidAmount: 0,
            balanceAmount: sourceInvoice.total,
            status: "Borrador",
            createdAt: new Date().toISOString(),
        };

        return this.addInvoice(clonedInvoice);
    }

    static updateInvoiceStatus(invoiceId: number, status: BillingInvoiceStatus): void {
        const invoices = this.getInvoices().map((invoice) => {
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

        this.saveInvoices(invoices);
    }

    static getRecurringInvoices(): BillingRecurringInvoice[] {
        const rawInvoices = restoreArray(RECURRING_STORAGE_KEY, buildDefaultRecurringInvoices());
        const normalizedInvoices = normalizeRecurringInvoices(rawInvoices).sort((leftInvoice, rightInvoice) => rightInvoice.createdAt.localeCompare(leftInvoice.createdAt));

        if (isBrowser()) {
            saveArray(RECURRING_STORAGE_KEY, normalizedInvoices);
        }

        return normalizedInvoices;
    }

    static saveRecurringInvoices(invoices: BillingRecurringInvoice[]): void {
        saveArray(RECURRING_STORAGE_KEY, normalizeRecurringInvoices(invoices));
    }

    static addRecurringInvoice(invoice: BillingRecurringInvoice): BillingRecurringInvoice {
        const normalizedInvoice = normalizeRecurringInvoice(invoice, this.getClients(), this.getProjects());
        const recurringInvoices = this.getRecurringInvoices();
        this.saveRecurringInvoices([normalizedInvoice, ...recurringInvoices]);
        return normalizedInvoice;
    }

    static updateRecurringStatus(invoiceId: number, status: BillingRecurringStatus): void {
        const recurringInvoices = this.getRecurringInvoices().map((invoice) => (invoice.id === invoiceId ? { ...invoice, status } : invoice));
        this.saveRecurringInvoices(recurringInvoices);
    }

    static removeRecurringInvoice(invoiceId: number): void {
        this.saveRecurringInvoices(this.getRecurringInvoices().filter((invoice) => invoice.id !== invoiceId));
    }

    static getNextInvoiceId(): number {
        const currentIds = this.getInvoices().map((invoice) => invoice.id);
        return currentIds.length ? Math.max(...currentIds) + 1 : 1;
    }

    static getNextRecurringId(): number {
        const currentIds = this.getRecurringInvoices().map((invoice) => invoice.id);
        return currentIds.length ? Math.max(...currentIds) + 1 : 1;
    }

    static getNextSequenceNumber(dateValue?: string): number {
        const targetPrefix = buildInvoiceSeriesPrefix(dateValue);
        const matchingSequences = this.getInvoices()
            .filter((invoice) => invoice.seriesPrefix === targetPrefix)
            .map((invoice) => invoice.sequenceNumber);

        return matchingSequences.length ? Math.max(...matchingSequences) + 1 : 1;
    }

    static findClient(clientId: string): BillingClient | undefined {
        return this.getClients().find((client) => client.id === clientId);
    }

    static findProject(projectId: string): BillingProject | undefined {
        return this.getProjects().find((project) => project.id === projectId);
    }

    static buildInvoiceCode(seriesPrefix: string, sequenceNumber: number): string {
        return `${sanitizeText(seriesPrefix, buildInvoiceSeriesPrefix())}${padSequenceNumber(sequenceNumber)}`;
    }
}
