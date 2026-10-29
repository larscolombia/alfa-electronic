import type { ProspectEquipmentItem, ProspectEquipmentRecord } from "./crm-prospect-equipment.store";

export const TRANSPORTADORA_RECEPTION_ERROR =
    "Recepción por transportadora exige transportadora, número de guía y fecha y hora de recibido.";
export const SERIAL_PLATE_EVIDENCE_ERROR =
    "Placa o serie ilegible: registra el motivo de excepción y sube una foto de placa / serie (tipo Placa / serie).";
export const SERIE_EXCEPTION_REASON_ERROR =
    "Etiqueta rota o ilegible: registra el motivo de excepción antes de continuar.";
export const ACCESSORIES_EVIDENCE_ERROR =
    "El equipo tiene accesorios reportados: se requiere evidencia fotográfica de accesorios.";
export const VISIBLE_DAMAGE_ERROR =
    "Daño visible reportado: se requiere evidencia de daño visible con nota y confirmación del cliente.";

export function validateTransportadoraReception(
    draft: Pick<ProspectEquipmentRecord, "intakeMethod" | "intakeCarrier" | "intakeTrackingNumber" | "intakeReceivedAt">,
): string | null {
    if ((draft.intakeMethod || "personal") !== "transportadora") {
        return null;
    }

    if (!(draft.intakeCarrier || "").trim() || !(draft.intakeTrackingNumber || "").trim() || !(draft.intakeReceivedAt || "").trim()) {
        return TRANSPORTADORA_RECEPTION_ERROR;
    }

    return null;
}

export function hasEvidenceType(item: ProspectEquipmentItem, evidenceType: string): boolean {
    const normalizedType = String(evidenceType ?? "").trim().toLowerCase();
    return item.evidencePhotos.some((photo) => String(photo.evidenceType ?? "").trim().toLowerCase() === normalizedType);
}

export function isSerialPlateEvidenceMissing(item: ProspectEquipmentItem): boolean {
    return Boolean(item.identifierLabelIssue) && !hasEvidenceType(item, "serial-plate");
}

export function isSerieExceptionReasonMissing(item: ProspectEquipmentItem): boolean {
    return Boolean(item.identifierLabelIssue) && !(item.serieExceptionReason || "").trim();
}

export function isAccessoriesEvidenceMissing(item: ProspectEquipmentItem): boolean {
    return Boolean(item.accessories?.trim()) && !hasEvidenceType(item, "accessories");
}

export function getEvidenceRequirementsError(item: ProspectEquipmentItem): string | null {
    if (isSerialPlateEvidenceMissing(item)) {
        return SERIAL_PLATE_EVIDENCE_ERROR;
    }

    if (isAccessoriesEvidenceMissing(item)) {
        return ACCESSORIES_EVIDENCE_ERROR;
    }

    return null;
}

export function hasVisibleDamageEvidenceWithNote(item: ProspectEquipmentItem): boolean {
    return item.evidencePhotos.some(
        (photo) => String(photo.evidenceType ?? "").trim().toLowerCase() === "visible-damage" && Boolean(photo.notes?.trim()),
    );
}

export function isVisibleDamageSaveBlocked(item: ProspectEquipmentItem): boolean {
    return Boolean(item.visibleDamageReported) && (!hasVisibleDamageEvidenceWithNote(item) || !item.visibleDamageConfirmed);
}

export function requiresPreviousInterventionWarning(item: ProspectEquipmentItem): boolean {
    return String(item.answers?.["previousRepairAttempt"] ?? "").trim() === "Sí" || String(item.answers?.["partsRemovedAsSpare"] ?? "").trim() === "Sí";
}

export function isFailurePending(item: ProspectEquipmentItem): boolean {
    return !item.failureDescription?.trim();
}
