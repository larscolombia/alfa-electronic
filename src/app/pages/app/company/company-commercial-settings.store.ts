export type CommercialDocumentType = "quote" | "invoice" | "dispatch";
export type CommercialDocumentSeriesGranularity = "year" | "month";

export interface CommercialDocumentPrefixDefinition {
    type: CommercialDocumentType;
    label: string;
    description: string;
    defaultPrefix: string;
}

export interface CommercialDocumentPrefixEntry extends CommercialDocumentPrefixDefinition {
    prefix: string;
}

const STORAGE_KEY = "adminux.company.commercial.document-prefixes.v1";

const DOCUMENT_PREFIX_DEFINITIONS: CommercialDocumentPrefixDefinition[] = [
    {
        type: "quote",
        label: "Cotizaciones",
        description: "Prefijo para propuestas y cotizaciones comerciales.",
        defaultPrefix: "COT",
    },
    {
        type: "invoice",
        label: "Facturas",
        description: "Prefijo para facturas manuales y facturas emitidas desde financiero.",
        defaultPrefix: "FAC",
    },
    {
        type: "dispatch",
        label: "Ordenes de envio",
        description: "Prefijo para despachos logisticos y cierres de entrega al cliente.",
        defaultPrefix: "ENV",
    },
];

const DEFAULT_DOCUMENT_PREFIXES = DOCUMENT_PREFIX_DEFINITIONS.reduce(
    (accumulator, definition) => ({
        ...accumulator,
        [definition.type]: definition.defaultPrefix,
    }),
    {} as Record<CommercialDocumentType, string>
);

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getYearFromDate(dateValue?: string): number {
    const safeDate = (dateValue ?? "").trim();
    const match = /^(\d{4})-\d{2}-\d{2}$/.exec(safeDate);
    if (match) {
        return Number(match[1]);
    }

    const parsedDate = safeDate ? new Date(safeDate) : new Date();
    return Number.isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
}

function getMonthFromDate(dateValue?: string): string {
    const safeDate = (dateValue ?? "").trim();
    const match = /^\d{4}-(\d{2})-\d{2}$/.exec(safeDate);
    if (match) {
        return match[1];
    }

    const parsedDate = safeDate ? new Date(safeDate) : new Date();
    const resolvedDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    return String(resolvedDate.getMonth() + 1).padStart(2, "0");
}

function padSequence(sequenceNumber: number): string {
    return String(Math.max(1, Math.trunc(sequenceNumber || 1))).padStart(3, "0");
}

function normalizeRecord(source?: Partial<Record<CommercialDocumentType, string>>): Record<CommercialDocumentType, string> {
    const normalized = {} as Record<CommercialDocumentType, string>;

    for (const definition of DOCUMENT_PREFIX_DEFINITIONS) {
        normalized[definition.type] = sanitizeCommercialPrefix(source?.[definition.type], definition.defaultPrefix);
    }

    return normalized;
}

function readStoredPrefixes(): Record<CommercialDocumentType, string> {
    if (!isBrowser()) {
        return { ...DEFAULT_DOCUMENT_PREFIXES };
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
        return { ...DEFAULT_DOCUMENT_PREFIXES };
    }

    try {
        const parsedValue = JSON.parse(rawValue) as Partial<Record<CommercialDocumentType, string>>;
        return normalizeRecord(parsedValue);
    } catch {
        return { ...DEFAULT_DOCUMENT_PREFIXES };
    }
}

function mapToEntries(prefixes: Record<CommercialDocumentType, string>): CommercialDocumentPrefixEntry[] {
    return DOCUMENT_PREFIX_DEFINITIONS.map((definition) => ({
        ...definition,
        prefix: prefixes[definition.type],
    }));
}

export function sanitizeCommercialPrefix(value: string | undefined | null, fallback = "DOC"): string {
    const normalized = (value ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return normalized || fallback;
}

export function getCommercialDocumentPrefixEntries(): CommercialDocumentPrefixEntry[] {
    return mapToEntries(readStoredPrefixes());
}

export function getCommercialDocumentPrefix(type: CommercialDocumentType): string {
    return readStoredPrefixes()[type];
}

export function saveCommercialDocumentPrefixes(prefixes: Partial<Record<CommercialDocumentType, string>>): CommercialDocumentPrefixEntry[] {
    const currentPrefixes = readStoredPrefixes();
    const normalized = normalizeRecord({
        ...currentPrefixes,
        ...prefixes,
    });

    if (isBrowser()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    }

    return mapToEntries(normalized);
}

export function resetCommercialDocumentPrefixes(): CommercialDocumentPrefixEntry[] {
    if (isBrowser()) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DOCUMENT_PREFIXES));
    }

    return mapToEntries({ ...DEFAULT_DOCUMENT_PREFIXES });
}

export function buildCommercialSeriesPrefix(
    type: CommercialDocumentType,
    dateValue?: string,
    granularity: CommercialDocumentSeriesGranularity = "year"
): string {
    const prefix = `${getCommercialDocumentPrefix(type)}-${getYearFromDate(dateValue)}`;
    return granularity === "month" ? `${prefix}-${getMonthFromDate(dateValue)}-` : `${prefix}-`;
}

export function buildCommercialDocumentCode(
    type: CommercialDocumentType,
    sequenceNumber: number,
    dateValue?: string,
    granularity: CommercialDocumentSeriesGranularity = "year"
): string {
    return `${buildCommercialSeriesPrefix(type, dateValue, granularity)}${padSequence(sequenceNumber)}`;
}