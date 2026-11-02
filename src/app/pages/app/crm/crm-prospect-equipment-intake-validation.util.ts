import type { ProspectEquipmentItem, ProspectEquipmentRecord } from "./crm-prospect-equipment.store";

export const TRANSPORTADORA_RECEPTION_ERROR =
    "Recepción por transportadora exige transportadora, número de guía y fecha y hora de recibido.";

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

export function isAccessoriesEvidenceMissing(item: ProspectEquipmentItem): boolean {
    return Boolean(item.accessories?.trim()) && !hasEvidenceType(item, "accessories");
}

export function getEvidenceRequirementsError(item: ProspectEquipmentItem): string | null {
    // 2026-11-01 — El gate de placa/serie por "motivo de excepción" se retiró con la UI:
    // la foto tipo "Placa / serie" ya es obligatoria para TODO equipo vía REQUIRED_FACE_EVIDENCE_TYPES.
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
