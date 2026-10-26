export type ProspectStatus = "Pendiente" | "En proceso" | "Cerrado";

export interface ProspectBranchRecord {
    id?: string;
    name: string;
    contactName: string;
    contactRole: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    isPrimary: boolean;
}

export interface ProspectRecord {
    id: string;
    backendId: string;
    salutation?: string;
    nombre: string;
    correo: string;
    movil: string;
    nit: string;
    zona: string;
    valor: number;
    allowFollowUp?: boolean;
    creado: string;
    cotizaciones: number;
    empleado: string;
    estado: ProspectStatus;
    servicio?: string;
    compania: string;
    sitioWeb: string;
    telefonoOficina: string;
    pais: string;
    ciudad: string;
    direccion: string;
    fuente: string;
    categoria: string;
    branches: ProspectBranchRecord[];
    nota?: string;
}

export const CRM_PROSPECTS_MOCK: ProspectRecord[] = [];

let prospectsCache: ProspectRecord[] = [];

function normalizeStatus(value: unknown): ProspectStatus {
    const normalized = String(value ?? "").trim();
    if (normalized === "En proceso" || normalized === "Cerrado") {
        return normalized;
    }
    return "Pendiente";
}

function normalizeText(value: unknown): string {
    return String(value ?? "").trim();
}

function normalizePositiveNumber(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return 0;
    }
    return parsed;
}

function normalizeBranches(value: unknown): ProspectBranchRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((item) => ({
        id: normalizeText((item as ProspectBranchRecord).id),
        name: normalizeText((item as ProspectBranchRecord).name),
        contactName: normalizeText((item as ProspectBranchRecord).contactName),
        contactRole: normalizeText((item as ProspectBranchRecord).contactRole),
        email: normalizeText((item as ProspectBranchRecord).email),
        phone: normalizeText((item as ProspectBranchRecord).phone),
        country: normalizeText((item as ProspectBranchRecord).country),
        city: normalizeText((item as ProspectBranchRecord).city),
        address: normalizeText((item as ProspectBranchRecord).address),
        isPrimary: Boolean((item as ProspectBranchRecord).isPrimary),
    })).filter((branch) => branch.name.length > 0 || branch.contactName.length > 0 || branch.email.length > 0 || branch.city.length > 0 || branch.address.length > 0 || branch.isPrimary);
}

function normalizeProspect(record: Partial<ProspectRecord>, index: number): ProspectRecord {
    return {
        id: normalizeText(record.id) || normalizeText(record.backendId) || String(index + 1),
        backendId: normalizeText(record.backendId),
        salutation: normalizeText(record.salutation) || "--",
        nombre: normalizeText(record.nombre),
        correo: normalizeText(record.correo),
        movil: normalizeText(record.movil),
        nit: normalizeText(record.nit),
        zona: normalizeText(record.zona),
        valor: normalizePositiveNumber(record.valor),
        allowFollowUp: typeof record.allowFollowUp === "boolean" ? record.allowFollowUp : true,
        creado: normalizeText(record.creado),
        cotizaciones: normalizePositiveNumber(record.cotizaciones),
        empleado: normalizeText(record.empleado),
        estado: normalizeStatus(record.estado),
        servicio: normalizeText(record.servicio) || "--",
        compania: normalizeText(record.compania),
        sitioWeb: normalizeText(record.sitioWeb),
        telefonoOficina: normalizeText(record.telefonoOficina),
        pais: normalizeText(record.pais),
        ciudad: normalizeText(record.ciudad),
        direccion: normalizeText(record.direccion),
        fuente: normalizeText(record.fuente),
        categoria: normalizeText(record.categoria),
        branches: normalizeBranches(record.branches),
        nota: normalizeText(record.nota),
    };
}

export function getProspects(): ProspectRecord[] {
    return prospectsCache.map((record, index) => normalizeProspect(record, index));
}

export function replaceProspects(records: ProspectRecord[]): void {
    prospectsCache = Array.isArray(records) ? records.map((record, index) => normalizeProspect(record, index)) : [];
}

export function getProspectById(id: string): ProspectRecord | undefined {
    const normalized = String(id ?? "").trim();
    return getProspects().find((prospect) => prospect.id === normalized || prospect.backendId === normalized);
}

export function getProspectByName(name: string): ProspectRecord | undefined {
    const normalized = name.trim().toLowerCase();
    return getProspects().find((prospect) => prospect.nombre.trim().toLowerCase() === normalized);
}
