import { getEquipmentFamilyName, getEquipmentLocationById, getEquipmentServiceTypeById, getIndustrialEquipmentModelById } from "../company/company-equipment-config.store";
import { normalizeBorrowedEquipments } from "./crm-prospect-equipment-borrowed.util";
import { resolveEquipmentCode } from "./equipment-qr.util";

export type ProspectEquipmentAnswer = "" | "Sí" | "No";
export type ProspectEquipmentQuestionType = "boolean" | "text";
export type ProspectEquipmentEvidenceType =
    | "general"
    | "serial-plate"
    | "visible-damage"
    | "accessories"
    | "other"
    | "face-front"
    | "face-back"
    | "face-left"
    | "face-right"
    | "face-top"
    | "face-bottom";
export type ProspectEquipmentIdentifierSource = "manual" | "camera-scan";
export type ProspectEquipmentRegistrationMode = "catalog" | "manual";
export type ProspectEquipmentIntakeMethod = "transportadora" | "personal";
export type ProspectEquipmentRepairStatus =
    | "recibido"
    | "diagnostico"
    | "por-cotizar"
    | "pedir-repuestos"
    | "esperando-proveedor"
    | "reparacion"
    | "garantia"
    | "garantia-espera-repuestos"
    | "prestamo"
    | "listo-entrega"
    | "entregado";

// Backend contract for Go/Echo:
// - The frontend currently stores only the evidence snapshot needed for demos: thumbnail + EXIF summary + file hash.
// - The API should receive the original binary, stamp server-side timestamps/user ids, and keep an immutable audit trail.
// - A future Echo flow can be: init upload intent -> upload original file -> confirm metadata/hash -> attach to reception item.
export interface ProspectEquipmentEvidencePhoto {
    id: string;
    evidenceType: ProspectEquipmentEvidenceType;
    notes: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    width: number;
    height: number;
    capturedAt: string;
    capturedAtSource: "exif" | "file-last-modified";
    selectedAt: string;
    deviceMake: string;
    deviceModel: string;
    latitude: number | null;
    longitude: number | null;
    gpsAvailable: boolean;
    sha256: string;
    thumbnailDataUrl: string;
    backendSyncStatus: "frontend-only" | "pending-upload" | "uploaded";
}

export interface ProspectEquipmentQuestionDefinition {
    key: string;
    label: string;
    type: ProspectEquipmentQuestionType;
}

export interface ProspectEquipmentCustodyIncident {
    photosNote: string;
    responsible: string;
    createdAt: string;
}

export type ProspectEquipmentDuplicateRelation = "reingreso" | "garantia" | "evento_nuevo";

export interface ProspectEquipmentDuplicateConfirm {
    reason: string;
    relation: ProspectEquipmentDuplicateRelation;
}

export interface ProspectEquipmentBorrowedEquipment {
    code: string;
    description: string;
}

export interface ProspectEquipmentWarning {
    code: string;
    label: string;
}

export interface ProspectEquipmentItem {
    id: string;
    /** Código interno asignado al recepcionar (CO+YYMM+NNNN, contador mensual).
     * Ausente en registros antiguos: se deriva la serie legacy EQ-* del id. */
    equipmentCode?: string;
    registrationMode?: ProspectEquipmentRegistrationMode;
    equipmentModelId: string;
    isIndustrial?: boolean;
    serviceTypeId: string;
    serviceTypeName: string;
    storageLocationId: string;
    storageLocationName: string;
    familyId: string;
    familyName: string;
    marca: string;
    tipo: string;
    serie: string;
    receivedIdentifier: string;
    receivedIdentifierType: string;
    receivedIdentifierSource: ProspectEquipmentIdentifierSource;
    receivedIdentifierCapturedAt: string;
    customerShipmentReference: string;
    accessories: string;
    borrowedEquipments: Array<string | ProspectEquipmentBorrowedEquipment>;
    failureDescription: string;
    senderUnknown?: boolean;
    custodyIncident?: ProspectEquipmentCustodyIncident;
    serieExceptionReason?: string;
    visibleDamageReported?: boolean;
    visibleDamageConfirmed?: boolean;
    duplicateConfirm?: ProspectEquipmentDuplicateConfirm;
    softwareSuspicionAcknowledged?: boolean;
    assignedTo?: string;
    assignedToId?: string;
    assignedAt?: string;
    assignedBy?: string;
    industrialOverrideAuthorizedBy?: string;
    industrialOverrideReason?: string;
    industrialOverrideAuthorizedAt?: string;
    pendingHomologation?: boolean;
    estimatedData?: boolean;
    identifierLabelIssue?: boolean;
    evidencePhotos: ProspectEquipmentEvidencePhoto[];
    attachments?: ProspectEquipmentAttachment[];
    answers: Record<string, string>;
    repairStatus?: ProspectEquipmentRepairStatus;
    repairStatusUpdatedAt?: string;
    repairStatusUpdatedBy?: string;
    youtubeLink?: string;
    dispatchPhotos?: ProspectEquipmentAttachment[];
    priorityBilling?: boolean;
    successPercent?: number;
    diagnosisMemo?: string;
    repairMemo?: string;
    softwareBackupAvailable?: boolean;
}

export interface ProspectEquipmentAttachment {
    id: string;
    attachmentType?: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
    thumbnailDataUrl?: string;
    notes: string;
    uploadedAt: string;
    uploadedBy: string;
    sha256: string;
}

export interface ProspectEquipmentRecord {
    id: string;
    prospectId: string;
    prospectName: string;
    receptionDay: string;
    receptionMonth: string;
    receptionYear: string;
    intakeMethod?: ProspectEquipmentIntakeMethod;
    intakeCarrier?: string;
    intakeTrackingNumber?: string;
    intakeReceivedAt?: string;
    senderUnknown?: boolean;
    custodyIncident?: ProspectEquipmentCustodyIncident;
    companyName: string;
    sourceBranchName?: string;
    nit: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    contactName: string;
    contactRole: string;
    cellphone: string;
    email: string;
    clientSignature: string;
    pikaSignature: string;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
    archivedAt: string;
    sourceContext: "crm" | "work";
    assignedTo?: string;
    items: ProspectEquipmentItem[];
}

export interface ProspectEquipmentSummary {
    recordId: string;
    itemId: string;
    equipmentCode: string;
    prospectId: string;
    prospectName: string;
    receptionLabel: string;
    serviceTypeName: string;
    storageLocationId: string;
    storageLocationName: string;
    familyName: string;
    marca: string;
    tipo: string;
    serie: string;
    receivedIdentifier: string;
    customerShipmentReference: string;
    accessories: string;
    borrowedEquipments: Array<string | ProspectEquipmentBorrowedEquipment>;
    failureDescription: string;
    evidenceCount: number;
    displayName: string;
    repairStatus: ProspectEquipmentRepairStatus;
    repairStatusLabel: string;
    repairStatusUpdatedAt: string;
    /** Fase 5b: marcado para facturación urgente (badge en listados y dashboard). */
    priorityBilling: boolean;
}

export interface ProspectEquipmentWorkflowUpdate {
    recordId: string;
    itemId: string;
    repairStatus: ProspectEquipmentRepairStatus;
    storageLocationId: string;
    updatedBy?: string;
}

export const PROSPECT_EQUIPMENT_QUESTION_DEFINITIONS: readonly ProspectEquipmentQuestionDefinition[] = [
    {
        key: "priorityPaidDiagnosis",
        label: "Diagnóstico gratis vs. urgencia/prioridad ($)",
        type: "boolean",
    },
    {
        key: "costAboveTwoMillion",
        label: "El costo del equipo o tarjeta en falla (nuevo), ¿es superior a $ 2'000.000?",
        type: "boolean",
    },
    {
        key: "testedWithWorkingUnit",
        label: "Se intercambió / descartó con otro igual y en buen funcionamiento, para validar que no hay otros elementos en falla en la máquina?",
        type: "boolean",
    },
    {
        key: "damagedOverSixMonths",
        label: "Está dañado hace más de 6 meses?",
        type: "boolean",
    },
    {
        key: "previousRepairAttempt",
        label: "Alguien intentó repararlo anteriormente?",
        type: "boolean",
    },
    {
        key: "componentsReplaced",
        label: "Le cambiaron componentes y utilizaron referencias diferentes a las originales?",
        type: "boolean",
    },
    {
        key: "partsRemovedAsSpare",
        label: "Extrayeron componentes del equipo para usarlos como repuesto?",
        type: "boolean",
    },
    {
        key: "burnedOrUnidentifiedComponents",
        label: "Tiene componentes quemados y/o no identificables?",
        type: "boolean",
    },
    {
        key: "electronicsAccessible",
        label: "Los componentes electrónicos están accesibles y sin capas de silicona?",
        type: "boolean",
    },
    {
        key: "softwareIssueRuledOut",
        label: "Se verificó que no es un problema de programación / software / parámetros?",
        type: "boolean",
    },
    {
        key: "softwareAvailable",
        label: "Si el equipo es un variador, un PLC, o cualquier otro equipo que maneje software ¿tiene la programación / software / parametrizaje para hacer nuevamente la puesta en marcha?",
        type: "boolean",
    },
    {
        key: "workedUnderWarranty",
        label: "Si es un equipo en garantía, por favor especifique si funcionó o no durante algún tiempo?",
        type: "boolean",
    },
    {
        key: "workedTimeDetail",
        label: "Si la respuesta anterior fue SI, especifique cuánto tiempo? (Horas, días, meses)",
        type: "text",
    },
    {
        key: "feedbackDisassembled",
        label: "En caso de ser un Servomotor ¿fue desarmado o desacoplado del feedback (resolver o encoder) con anterioridad?",
        type: "boolean",
    },
    {
        key: "hasFunctionalEquivalent",
        label: "En caso de ser un ServoMotor ¿cuenta con un equipo de la misma referencia funcional?",
        type: "boolean",
    },
];

const STORAGE_KEY = "adminux.crm.prospect-equipment-records";

const REPAIR_STATUS_LABELS: Record<ProspectEquipmentRepairStatus, string> = {
    recibido: "Recibido",
    diagnostico: "Diagnóstico",
    "por-cotizar": "Por cotizar",
    "pedir-repuestos": "Pedir componentes",
    "esperando-proveedor": "Esperando proveedor",
    reparacion: "En reparación",
    garantia: "Garantía",
    "garantia-espera-repuestos": "Garantia esp. repuestos",
    prestamo: "Material en préstamo",
    "listo-entrega": "Listo para entrega",
    entregado: "Entregado",
};

export function createEquipmentAnswers(): Record<string, string> {
    return PROSPECT_EQUIPMENT_QUESTION_DEFINITIONS.reduce<Record<string, string>>((acc, question) => {
        acc[question.key] = "";
        return acc;
    }, {});
}

export function getProspectEquipmentWarnings(
    item: Pick<
        ProspectEquipmentItem,
        | "registrationMode"
        | "equipmentModelId"
        | "serviceTypeId"
        | "serviceTypeName"
        | "storageLocationId"
        | "storageLocationName"
        | "familyName"
        | "marca"
        | "tipo"
        | "serie"
        | "receivedIdentifier"
        | "customerShipmentReference"
        | "failureDescription"
        | "pendingHomologation"
        | "estimatedData"
        | "identifierLabelIssue"
    >,
): ProspectEquipmentWarning[] {
    const warnings: ProspectEquipmentWarning[] = [];
    const registrationMode = normalizeRegistrationMode(item.registrationMode, item.equipmentModelId);
    const hasService = Boolean(item.serviceTypeId?.trim() || item.serviceTypeName?.trim());
    const hasLocation = Boolean(item.storageLocationId?.trim() || item.storageLocationName?.trim());
    const hasStructuredManualData = [item.familyName, item.marca, item.tipo].every((value) => (value ?? "").trim().length > 0);

    if (registrationMode === "manual") {
        warnings.push({ code: "manual-entry", label: "Manual" });
    }

    if (Boolean(item.pendingHomologation)) {
        warnings.push({ code: "pending-homologation", label: "Pendiente homologación" });
    }

    if (!hasService) {
        warnings.push({ code: "missing-service", label: "Sin servicio" });
    }

    if (!hasLocation) {
        warnings.push({ code: "missing-location", label: "Sin ubicación" });
    }

    if (!item.serie?.trim()) {
        warnings.push({ code: "missing-series", label: "Sin serie" });
    }

    if (Boolean(item.identifierLabelIssue)) {
        warnings.push({ code: "label-issue", label: "Etiqueta rota" });
    }

    if (!item.receivedIdentifier?.trim()) {
        warnings.push({ code: "missing-identifier", label: "Sin identificador" });
    }

    if (!item.customerShipmentReference?.trim()) {
        warnings.push({ code: "missing-shipment-reference", label: "Sin remisión" });
    }

    if (!item.failureDescription?.trim()) {
        warnings.push({ code: "missing-failure", label: "Falla pendiente" });
    }

    if (Boolean(item.estimatedData)) {
        warnings.push({ code: "estimated-data", label: "Datos estimados" });
    }

    if (registrationMode === "manual" && !hasStructuredManualData) {
        warnings.push({ code: "missing-format", label: "Sin formato" });
    }

    return warnings;
}

export function buildProspectEquipmentLabel(item: Pick<ProspectEquipmentItem, "familyName" | "marca" | "tipo" | "serie">): string {
    const parts = [item.familyName, item.marca, item.tipo, item.serie].map((value) => value?.trim() ?? "").filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : "Equipo sin identificar";
}

export function formatProspectEquipmentReception(record: Pick<ProspectEquipmentRecord, "receptionDay" | "receptionMonth" | "receptionYear">): string {
    const parts = [record.receptionDay, record.receptionMonth, record.receptionYear].map((value) => value.trim()).filter(Boolean);
    return parts.length > 0 ? parts.join("/") : "Sin fecha";
}

export function getProspectEquipmentRecords(prospectId: string, includeArchived = false): ProspectEquipmentRecord[] {
    const normalizedId = String(prospectId ?? "").trim();
    return getAllProspectEquipmentRecords(includeArchived).filter((record) => record.prospectId === normalizedId);
}

export function getAllProspectEquipmentRecords(includeArchived = false): ProspectEquipmentRecord[] {
    return readStoredRecords()
        .filter((record) => includeArchived || !record.archived)
        .map((record) => cloneProspectEquipmentRecord(record));
}

export function getProspectEquipmentRecordById(recordId: string, includeArchived = true): ProspectEquipmentRecord | null {
    const normalizedId = recordId.trim();
    if (!normalizedId) {
        return null;
    }

    return getAllProspectEquipmentRecords(includeArchived).find((record) => record.id === normalizedId) ?? null;
}

export function getProspectEquipmentItems(prospectId: string): ProspectEquipmentSummary[] {
    return buildEquipmentSummaries(getProspectEquipmentRecords(prospectId));
}

export function getAllProspectEquipmentItems(includeArchived = false): ProspectEquipmentSummary[] {
    return buildEquipmentSummaries(getAllProspectEquipmentRecords(includeArchived));
}

export function getProspectEquipmentItemByReference(recordId: string, itemId: string): ProspectEquipmentSummary | null {
    const recordIdTrimmed = recordId.trim();
    const itemIdTrimmed = itemId.trim();
    if (!recordIdTrimmed || !itemIdTrimmed) {
        return null;
    }

    return getAllProspectEquipmentItems().find((item) => item.recordId === recordIdTrimmed && item.itemId === itemIdTrimmed) ?? null;
}

export function findProspectEquipmentItemByIdentifier(identifier: string): ProspectEquipmentSummary | null {
    const normalizedIdentifier = normalizeSearchValue(identifier);
    if (!normalizedIdentifier) {
        return null;
    }

    return (
        getAllProspectEquipmentItems().find((item) => {
            const candidateValues = [item.receivedIdentifier, item.serie, item.customerShipmentReference];
            return candidateValues.some((value) => normalizeSearchValue(value) === normalizedIdentifier);
        }) ?? null
    );
}

export function updateProspectEquipmentWorkflow(update: ProspectEquipmentWorkflowUpdate): ProspectEquipmentSummary | null {
    const recordId = update.recordId.trim();
    const itemId = update.itemId.trim();
    if (!recordId || !itemId) {
        return null;
    }

    const storageLocation = getEquipmentLocationById(update.storageLocationId);
    if (!storageLocation) {
        return null;
    }

    const nextStatus = normalizeRepairStatus(update.repairStatus);
    let itemUpdated = false;

    const nextRecords = readStoredRecords().map((record) => {
        if (record.id !== recordId) {
            return record;
        }

        return {
            ...record,
            items: record.items.map((item) => {
                if (item.id !== itemId) {
                    return item;
                }

                itemUpdated = true;
                return {
                    ...item,
                    storageLocationId: storageLocation.id,
                    storageLocationName: storageLocation.name,
                    repairStatus: nextStatus,
                    repairStatusUpdatedAt: new Date().toISOString(),
                    repairStatusUpdatedBy: update.updatedBy?.trim() || "asignado",
                };
            }),
        };
    });

    if (!itemUpdated) {
        return null;
    }

    writeStoredRecords(nextRecords);
    return getProspectEquipmentItemByReference(recordId, itemId);
}

export function getProspectEquipmentRepairStatusLabel(status: ProspectEquipmentRepairStatus): string {
    return REPAIR_STATUS_LABELS[status] ?? REPAIR_STATUS_LABELS.recibido;
}

export function upsertProspectEquipmentRecord(record: ProspectEquipmentRecord): void {
    const currentRecords = readStoredRecords();
    const existing = currentRecords.find((entry) => entry.id === record.id);
    const now = new Date().toISOString();
    const nextRecord = normalizeStoredRecord({
        ...record,
        createdAt: existing?.createdAt || record.createdAt || now,
        updatedAt: now,
        archived: existing?.archived ?? record.archived ?? false,
        archivedAt: existing?.archivedAt ?? record.archivedAt ?? "",
        sourceContext: record.sourceContext ?? existing?.sourceContext ?? "crm",
    });
    const current = currentRecords.filter((entry) => entry.id !== record.id);
    current.unshift(nextRecord);
    writeStoredRecords(current);
}

export function archiveProspectEquipmentRecord(recordId: string): ProspectEquipmentRecord | null {
    return setProspectEquipmentRecordArchiveState(recordId, true);
}

export function restoreProspectEquipmentRecord(recordId: string): ProspectEquipmentRecord | null {
    return setProspectEquipmentRecordArchiveState(recordId, false);
}

export function countEquipmentItemsByLocation(locationId: string): number {
    return readStoredRecords().reduce((acc, record) => acc + record.items.filter((item) => item.storageLocationId === locationId).length, 0);
}

export function reassignProspectEquipmentLocation(oldLocationId: string, targetLocation: { id: string; name: string }): void {
    const current = readStoredRecords();
    const nextRecords = current.map((record) => ({
        ...record,
        items: record.items.map((item) => {
            if (item.storageLocationId !== oldLocationId) {
                return item;
            }

            return {
                ...item,
                storageLocationId: targetLocation.id,
                storageLocationName: targetLocation.name,
            };
        }),
    }));

    writeStoredRecords(nextRecords);
}

function buildEquipmentSummaries(records: ProspectEquipmentRecord[]): ProspectEquipmentSummary[] {
    return records.flatMap((record) =>
        record.items.map((item) => {
            const model = item.equipmentModelId ? getIndustrialEquipmentModelById(item.equipmentModelId) : undefined;
            const serviceType = item.serviceTypeId ? getEquipmentServiceTypeById(item.serviceTypeId) : undefined;
            const storageLocation = item.storageLocationId ? getEquipmentLocationById(item.storageLocationId) : undefined;
            const serviceTypeName = (item.serviceTypeName?.trim() || serviceType?.name || "").trim();
            const storageLocationId = (item.storageLocationId?.trim() || storageLocation?.id || "").trim();
            const storageLocationName = (storageLocation?.name || item.storageLocationName?.trim() || "").trim();
            const familyName = (item.familyName?.trim() || (item.familyId ? getEquipmentFamilyName(item.familyId) : "") || (model ? getEquipmentFamilyName(model.familyId) : "")).trim();
            const marca = (item.marca?.trim() || model?.brand || "").trim();
            const tipo = (item.tipo?.trim() || model?.type || "").trim();
            const serie = (item.serie?.trim() || model?.series || "").trim();
            const repairStatus = normalizeRepairStatus(item.repairStatus);

            return {
                recordId: record.id,
                itemId: item.id,
                // Código interno real del equipo (CO+YYMM+NNNN si se asignó al
                // recepcionar; legacy EQ-* para registros previos a la serie).
                equipmentCode: resolveEquipmentCode(item),
                prospectId: record.prospectId,
                prospectName: record.prospectName,
                receptionLabel: formatProspectEquipmentReception(record),
                serviceTypeName,
                storageLocationId,
                storageLocationName,
                familyName,
                marca,
                tipo,
                serie,
                receivedIdentifier: item.receivedIdentifier,
                customerShipmentReference: item.customerShipmentReference,
                accessories: item.accessories,
                borrowedEquipments: [...(item.borrowedEquipments ?? [])],
                failureDescription: item.failureDescription,
                evidenceCount: item.evidencePhotos?.length ?? 0,
                displayName: buildProspectEquipmentLabel({ familyName, marca, tipo, serie }),
                repairStatus,
                repairStatusLabel: getProspectEquipmentRepairStatusLabel(repairStatus),
                repairStatusUpdatedAt: item.repairStatusUpdatedAt ?? "",
                priorityBilling: Boolean(item.priorityBilling),
            };
        }),
    );
}

function normalizeRepairStatus(value: unknown): ProspectEquipmentRepairStatus {
    const normalized = String(value ?? "").trim().toLowerCase();

    switch (normalized) {
        case "diagnostico":
            return "diagnostico";
        case "pedir-repuestos":
            return "pedir-repuestos";
        case "esperando-proveedor":
            return "esperando-proveedor";
        case "reparacion":
            return "reparacion";
        case "pruebas":
            // Estado legado del flujo QA eliminado: se normaliza al estado vivo
            // mas cercano en vez de caer a 'recibido'.
            return "reparacion";
        case "garantia":
            return "garantia";
        case "garantia-espera-repuestos":
            return "garantia-espera-repuestos";
        case "prestamo":
            return "prestamo";
        case "listo-entrega":
            return "listo-entrega";
        case "entregado":
            return "entregado";
        default:
            return "recibido";
    }
}

function normalizeRegistrationMode(value: unknown, equipmentModelId: unknown): ProspectEquipmentRegistrationMode {
    const normalized = String(value ?? "").trim().toLowerCase();

    if (normalized === "manual") {
        return "manual";
    }

    if (normalized === "catalog") {
        return "catalog";
    }

    return String(equipmentModelId ?? "").trim() ? "catalog" : "manual";
}

function normalizeSearchValue(value: unknown): string {
    return String(value ?? "")
        .trim()
        .toLowerCase();
}

function setProspectEquipmentRecordArchiveState(recordId: string, archived: boolean): ProspectEquipmentRecord | null {
    const normalizedId = recordId.trim();
    if (!normalizedId) {
        return null;
    }

    const now = new Date().toISOString();
    let updatedRecord: ProspectEquipmentRecord | null = null;

    const nextRecords = readStoredRecords().map((record) => {
        if (record.id !== normalizedId) {
            return record;
        }

        updatedRecord = normalizeStoredRecord({
            ...record,
            archived,
            archivedAt: archived ? now : "",
            updatedAt: now,
        });

        return updatedRecord;
    });

    if (!updatedRecord) {
        return null;
    }

    writeStoredRecords(nextRecords);
    return cloneProspectEquipmentRecord(updatedRecord);
}

function readStoredRecords(): ProspectEquipmentRecord[] {
    const storage = getSafeStorage();
    if (!storage) {
        return [];
    }

    try {
        const rawValue = storage.getItem(STORAGE_KEY);
        if (!rawValue) {
            return [];
        }

        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed.map((record) => normalizeStoredRecord(record as Partial<ProspectEquipmentRecord>)) : [];
    } catch {
        return [];
    }
}

function writeStoredRecords(records: ProspectEquipmentRecord[]): void {
    const storage = getSafeStorage();
    if (!storage) {
        return;
    }

    try {
        // Frontend-only fallback while the Go/Echo API is pending.
        // Once the backend exists, this local snapshot should become a cache of server responses rather than the source of truth.
        storage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
        // Ignore storage write failures in restricted browser contexts.
    }
}

function getSafeStorage(): Storage | null {
    try {
        if (typeof window === "undefined") {
            return null;
        }

        return window.localStorage;
    } catch {
        return null;
    }
}

function normalizeStoredRecord(record: Partial<ProspectEquipmentRecord>): ProspectEquipmentRecord {
    const now = new Date().toISOString();

    return {
        id: String(record.id ?? "").trim(),
        prospectId: String(record.prospectId ?? "").trim() || "0",
        prospectName: String(record.prospectName ?? "").trim(),
        receptionDay: String(record.receptionDay ?? "").trim(),
        receptionMonth: String(record.receptionMonth ?? "").trim(),
        receptionYear: String(record.receptionYear ?? "").trim(),
        intakeMethod: String(record.intakeMethod ?? "").trim().toLowerCase() === "transportadora" ? "transportadora" : "personal",
        intakeCarrier: String(record.intakeCarrier ?? "").trim(),
        intakeTrackingNumber: String(record.intakeTrackingNumber ?? "").trim(),
        intakeReceivedAt: String(record.intakeReceivedAt ?? "").trim(),
        senderUnknown: Boolean(record.senderUnknown),
        custodyIncident: normalizeCustodyIncident(record.custodyIncident),
        companyName: String(record.companyName ?? "").trim(),
        sourceBranchName: String(record.sourceBranchName ?? "").trim(),
        nit: String(record.nit ?? "").trim(),
        phone: String(record.phone ?? "").trim(),
        address: String(record.address ?? "").trim(),
        city: String(record.city ?? "").trim(),
        country: String(record.country ?? "").trim(),
        contactName: String(record.contactName ?? "").trim(),
        contactRole: String(record.contactRole ?? "").trim(),
        cellphone: String(record.cellphone ?? "").trim(),
        email: String(record.email ?? "").trim(),
        clientSignature: String(record.clientSignature ?? "").trim(),
        pikaSignature: String(record.pikaSignature ?? "").trim(),
        createdAt: String(record.createdAt ?? "").trim() || now,
        updatedAt: String(record.updatedAt ?? "").trim() || String(record.createdAt ?? "").trim() || now,
        archived: Boolean(record.archived),
        archivedAt: String(record.archivedAt ?? "").trim(),
        sourceContext: record.sourceContext === "work" ? "work" : "crm",
        assignedTo: String(record.assignedTo ?? "").trim(),
        items: Array.isArray(record.items) ? record.items.map((item) => normalizeStoredItem(item)) : [],
    };
}

function normalizeStoredItem(item: Partial<ProspectEquipmentItem>): ProspectEquipmentItem {
    const equipmentModelId = String(item.equipmentModelId ?? "").trim();
    const registrationMode = normalizeRegistrationMode(item.registrationMode, equipmentModelId);

    return {
        id: String(item.id ?? "").trim(),
        registrationMode,
        equipmentModelId,
        isIndustrial: typeof item.isIndustrial === "boolean" ? item.isIndustrial : Boolean(equipmentModelId),
        serviceTypeId: String(item.serviceTypeId ?? "").trim(),
        serviceTypeName: String(item.serviceTypeName ?? "").trim(),
        storageLocationId: String(item.storageLocationId ?? "").trim(),
        storageLocationName: String(item.storageLocationName ?? "").trim(),
        familyId: String(item.familyId ?? "").trim(),
        familyName: String(item.familyName ?? "").trim(),
        marca: String(item.marca ?? "").trim(),
        tipo: String(item.tipo ?? "").trim(),
        serie: String(item.serie ?? "").trim(),
        receivedIdentifier: String(item.receivedIdentifier ?? "").trim(),
        receivedIdentifierType: String(item.receivedIdentifierType ?? "").trim(),
        receivedIdentifierSource: item.receivedIdentifierSource === "camera-scan" ? "camera-scan" : "manual",
        receivedIdentifierCapturedAt: String(item.receivedIdentifierCapturedAt ?? "").trim(),
        customerShipmentReference: String(item.customerShipmentReference ?? "").trim(),
        accessories: String(item.accessories ?? "").trim(),
        borrowedEquipments: normalizeBorrowedEquipments(item.borrowedEquipments),
        failureDescription: String(item.failureDescription ?? "").trim(),
        senderUnknown: Boolean(item.senderUnknown),
        custodyIncident: normalizeCustodyIncident(item.custodyIncident),
        serieExceptionReason: String(item.serieExceptionReason ?? "").trim(),
        visibleDamageReported: Boolean(item.visibleDamageReported),
        visibleDamageConfirmed: Boolean(item.visibleDamageConfirmed),
        duplicateConfirm: normalizeDuplicateConfirm(item.duplicateConfirm),
        softwareSuspicionAcknowledged: Boolean(item.softwareSuspicionAcknowledged),
        assignedTo: String(item.assignedTo ?? "").trim(),
        assignedToId: String(item.assignedToId ?? "").trim(),
        assignedAt: String(item.assignedAt ?? "").trim(),
        assignedBy: String(item.assignedBy ?? "").trim(),
        industrialOverrideAuthorizedBy: String(item.industrialOverrideAuthorizedBy ?? "").trim(),
        industrialOverrideReason: String(item.industrialOverrideReason ?? "").trim(),
        industrialOverrideAuthorizedAt: String(item.industrialOverrideAuthorizedAt ?? "").trim(),
        pendingHomologation: Boolean(item.pendingHomologation) || registrationMode === "manual",
        estimatedData: Boolean(item.estimatedData),
        identifierLabelIssue: Boolean(item.identifierLabelIssue),
        evidencePhotos: Array.isArray(item.evidencePhotos) ? item.evidencePhotos.map((photo) => ({ ...photo })) : [],
        attachments: Array.isArray((item as { attachments?: ProspectEquipmentAttachment[] }).attachments)
            ? (item as { attachments: ProspectEquipmentAttachment[] }).attachments
                .map((attachment) => ({
                    id: String(attachment?.id ?? "").trim(),
                    attachmentType: String(attachment?.attachmentType ?? "").trim(),
                    fileName: String(attachment?.fileName ?? "").trim(),
                    mimeType: String(attachment?.mimeType ?? "").trim() || "application/octet-stream",
                    sizeBytes: Math.max(0, Math.trunc(Number(attachment?.sizeBytes ?? 0) || 0)),
                    dataUrl: String(attachment?.dataUrl ?? ""),
                    notes: String(attachment?.notes ?? "").trim(),
                    uploadedAt: String(attachment?.uploadedAt ?? "").trim(),
                    uploadedBy: String(attachment?.uploadedBy ?? "").trim(),
                    sha256: String(attachment?.sha256 ?? "").trim(),
                }))
                .filter((attachment) => attachment.id.length > 0 && attachment.dataUrl.length > 0)
            : [],
        answers: {
            ...createEquipmentAnswers(),
            ...(item.answers ?? {}),
        },
        repairStatus: normalizeRepairStatus(item.repairStatus),
        repairStatusUpdatedAt: String(item.repairStatusUpdatedAt ?? "").trim(),
        repairStatusUpdatedBy: String(item.repairStatusUpdatedBy ?? "").trim(),
        // Fase 5b: facturación urgente — antes se declaraba en la interfaz y
        // se perdía al normalizar los ítems leídos del servidor.
        priorityBilling: Boolean(item.priorityBilling),
    };
}

function cloneProspectEquipmentRecord(record: ProspectEquipmentRecord): ProspectEquipmentRecord {
    return normalizeStoredRecord(record);
}

function normalizeCustodyIncident(value: unknown): ProspectEquipmentCustodyIncident | undefined {
    if (!value || typeof value !== "object") {
        return undefined;
    }

    const incident = value as Partial<ProspectEquipmentCustodyIncident>;
    const photosNote = String(incident.photosNote ?? "").trim();
    const responsible = String(incident.responsible ?? "").trim();
    if (!photosNote && !responsible) {
        return undefined;
    }

    return {
        photosNote,
        responsible,
        createdAt: String(incident.createdAt ?? "").trim() || new Date().toISOString(),
    };
}

function normalizeDuplicateConfirm(value: unknown): ProspectEquipmentDuplicateConfirm | undefined {
    if (!value || typeof value !== "object") {
        return undefined;
    }

    const confirm = value as Partial<ProspectEquipmentDuplicateConfirm>;
    const relation = String(confirm.relation ?? "").trim().toLowerCase();
    if (relation !== "reingreso" && relation !== "garantia" && relation !== "evento_nuevo") {
        return undefined;
    }

    return {
        relation,
        reason: String(confirm.reason ?? "").trim(),
    };
}
