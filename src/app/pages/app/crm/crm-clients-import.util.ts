import { UpsertCrmClientRequest } from "../../../services/crm-clients-api.service";

export const CLIENT_IMPORT_TEMPLATE_HEADERS = [
    "Nombre*", "Correo", "Empresa*", "NIT",
    "Zona*", "Estado", "Sitio web", "Teléfono oficina",
    "País", "Ciudad", "Dirección", "Crédito (SI/NO)",
    "Cupo máximo", "Consumido", "Última fecha pago (YYYY-MM-DD)", "Días plazo pago",
] as const;

export interface ClientImportRowError {
    row: number;
    message: string;
}

export interface ParsedClientImportRow {
    excelRow: number;
    payload: UpsertCrmClientRequest;
}

export interface ClientImportParseResult {
    valid: ParsedClientImportRow[];
    errors: ClientImportRowError[];
}

type ClientImportTextField =
    | "nombre" | "correo" | "empresa" | "nit" | "zona" | "estado"
    | "website" | "officePhone" | "country" | "city" | "address"
    | "credit" | "creditLimit" | "consumed" | "lastPaymentDate" | "paymentTermDays";

type RawClientImportRow = Record<ClientImportTextField, string>;

const RAW_ROW_FIELDS: ClientImportTextField[] = [
    "nombre", "correo", "empresa", "nit", "zona", "estado",
    "website", "officePhone", "country", "city", "address",
    "credit", "creditLimit", "consumed", "lastPaymentDate", "paymentTermDays",
];

const HEADER_FIELD_MAP: Record<string, ClientImportTextField> = {
    nombre: "nombre",
    correo: "correo",
    "correo electronico": "correo",
    empresa: "empresa",
    nit: "nit",
    zona: "zona",
    estado: "estado",
    "sitio web": "website",
    website: "website",
    "telefono oficina": "officePhone",
    pais: "country",
    ciudad: "city",
    direccion: "address",
    credito: "credit",
    "credito (si/no)": "credit",
    "cupo maximo": "creditLimit",
    consumido: "consumed",
    "ultima fecha pago": "lastPaymentDate",
    "ultima fecha pago (yyyy-mm-dd)": "lastPaymentDate",
    "dias plazo pago": "paymentTermDays",
};

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseClientImportRows(rawRows: Record<string, unknown>[]): ClientImportParseResult {
    const valid: ParsedClientImportRow[] = [];
    const errors: ClientImportRowError[] = [];

    rawRows.forEach((rawRow, index) => {
        const row = mapRawRow(rawRow);
        if (isEmptyRow(row)) {
            return;
        }

        // Excel row 1 holds the headers, so the first data row is Excel row 2.
        const excelRow = index + 2;
        const rowErrors = validateRow(row);

        if (rowErrors.length > 0) {
            errors.push({ row: excelRow, message: rowErrors.join(" ") });
            return;
        }

        valid.push({ excelRow, payload: buildRequest(row) });
    });

    return { valid, errors };
}

export function buildClientTemplateRows(): Record<string, string | number>[] {
    return [
        {
            "Nombre*": "Maria Fernanda Rojas",
            Correo: "maria.rojas@andina.com.co",
            "Empresa*": "Alimentos Andina SAS",
            NIT: "901234567-8",
            "Zona*": "Bogota",
            Estado: "Activo",
            "Sitio web": "https://www.andina.com.co",
            "Teléfono oficina": "6017458900",
            País: "Colombia",
            Ciudad: "Bogota",
            Dirección: "Cra 13 # 93-40 Of 502",
            "Crédito (SI/NO)": "SI",
            "Cupo máximo": 25000000,
            Consumido: 4800000,
            "Última fecha pago (YYYY-MM-DD)": "2026-07-28",
            "Días plazo pago": 30,
        },
        {
            "Nombre*": "Carlos Andres Pineda",
            Correo: "cpineda@logisur.co",
            "Empresa*": "Logistica del Sur LTDA",
            NIT: "890555123-1",
            "Zona*": "Cali",
            Estado: "Activo",
            "Sitio web": "",
            "Teléfono oficina": "6023391200",
            País: "Colombia",
            Ciudad: "Cali",
            Dirección: "Av 3N # 45-18",
            "Crédito (SI/NO)": "NO",
            "Cupo máximo": 0,
            Consumido: 0,
            "Última fecha pago (YYYY-MM-DD)": "",
            "Días plazo pago": 15,
        },
    ];
}

function mapRawRow(rawRow: Record<string, unknown>): RawClientImportRow {
    const mapped = emptyRawRow();

    Object.entries(rawRow).forEach(([header, value]) => {
        const field = HEADER_FIELD_MAP[normalizeHeaderKey(header)];
        if (field) {
            mapped[field] = cellToString(value);
        }
    });

    return mapped;
}

function emptyRawRow(): RawClientImportRow {
    return Object.fromEntries(RAW_ROW_FIELDS.map((field) => [field, ""])) as RawClientImportRow;
}

function isEmptyRow(row: RawClientImportRow): boolean {
    return Object.values(row).every((value) => value === "");
}

function validateRow(row: RawClientImportRow): string[] {
    const rowErrors: string[] = [];

    if (!row.nombre) {
        rowErrors.push("Nombre es obligatorio.");
    }
    if (!row.empresa) {
        rowErrors.push("Empresa es obligatoria.");
    }
    if (!row.zona) {
        rowErrors.push("Zona es obligatoria.");
    }
    if (row.correo && !EMAIL_PATTERN.test(row.correo)) {
        rowErrors.push("Correo no tiene un formato valido.");
    }
    if (row.lastPaymentDate && !ISO_DATE_PATTERN.test(row.lastPaymentDate)) {
        rowErrors.push("Ultima fecha pago debe usar el formato YYYY-MM-DD.");
    }
    if (parseNonNegativeNumber(row.creditLimit) === null) {
        rowErrors.push("Cupo maximo debe ser un numero mayor o igual a cero.");
    }
    if (parseNonNegativeNumber(row.consumed) === null) {
        rowErrors.push("Consumido debe ser un numero mayor o igual a cero.");
    }
    if (parseNonNegativeNumber(row.paymentTermDays) === null) {
        rowErrors.push("Dias plazo pago debe ser un numero mayor o igual a cero.");
    }

    return rowErrors;
}

function buildRequest(row: RawClientImportRow): UpsertCrmClientRequest {
    return {
        nombre: row.nombre,
        correo: row.correo,
        empresa: row.empresa,
        nit: row.nit,
        zona: row.zona,
        estado: normalizeStatus(row.estado),
        website: row.website,
        officePhone: row.officePhone,
        country: row.country,
        city: row.city,
        address: row.address,
        credito: {
            enabled: parseYesNo(row.credit),
            creditLimit: parseNonNegativeNumber(row.creditLimit) ?? 0,
            consumed: parseNonNegativeNumber(row.consumed) ?? 0,
            lastPaymentDate: row.lastPaymentDate,
            paymentTermDays: Math.trunc(parseNonNegativeNumber(row.paymentTermDays) ?? 0),
        },
        branches: [],
    };
}

function normalizeHeaderKey(header: string): string {
    return String(header ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\*/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function cellToString(value: unknown): string {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
    }
    if (typeof value === "number") {
        return Number.isFinite(value) ? String(value) : "";
    }
    return String(value ?? "").trim();
}

function normalizeStatus(value: string): "Activo" | "Inactivo" {
    return normalizeHeaderKey(value) === "inactivo" ? "Inactivo" : "Activo";
}

function parseYesNo(value: string): boolean {
    return ["si", "yes", "true", "1", "x"].includes(normalizeHeaderKey(value));
}

function parseNonNegativeNumber(value: string): number | null {
    if (!value) {
        return 0;
    }
    const parsed = Number(value.replace(/\s/g, "").replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }
    return parsed;
}
