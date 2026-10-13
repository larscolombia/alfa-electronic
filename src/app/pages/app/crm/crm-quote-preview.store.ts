export type QuotePreviewStatus = "Borrador" | "Enviado" | "Aprobado";
export type QuoteClientDecision = "Pendiente" | "Aceptada" | "Rechazada";

export type PublicQuotePreviewLine = {
    servicio: string;
    descripcion: string;
    cantidad: number;
    unidad: string;
    precioUnitario: number;
    impuesto: number;
};

export type PublicQuotePreview = {
    token: string;
    codigo: string;
    prospecto: string;
    empresa: string;
    correo: string;
    movil: string;
    fecha: string;
    validoHasta: string;
    estado: QuotePreviewStatus;
    moneda: "COP" | "USD";
    descuentoTipo: "%" | "COP";
    descuentoValor: number;
    lineas: PublicQuotePreviewLine[];
    nota: string;
    terminos: string;
    estadoCliente: QuoteClientDecision;
    fechaDecision?: string;
    firmadoPor?: string;
    firmanteCorreo?: string;
    lugarFirma?: string;
    firmaBase64?: string;
};

const STORAGE_KEY = "adminux.crm.quote.public-previews";

function isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredPreviews(): Record<string, PublicQuotePreview> {
    if (!isBrowser()) {
        return {};
    }

    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
        return {};
    }

    try {
        const parsed = JSON.parse(rawValue) as Record<string, PublicQuotePreview>;
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

export function getPublicQuotePreviewByToken(token: string): PublicQuotePreview | null {
    const safeToken = token.trim();
    if (!safeToken) {
        return null;
    }

    const stored = readStoredPreviews();
    if (stored[safeToken]) {
        return stored[safeToken];
    }

    return null;
}

export function upsertPublicQuotePreview(preview: PublicQuotePreview): void {
    if (!isBrowser()) {
        return;
    }

    const stored = readStoredPreviews();
    stored[preview.token] = preview;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}
