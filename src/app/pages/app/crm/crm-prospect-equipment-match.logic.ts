/**
 * Lógica pura para vincular equipos CRM con el prospecto real.
 *
 * El id numérico del prospecto (ProspectRecord.id) es sintético: se deriva con
 * parseInt del UUID y colisiona. La vinculación estable es el UUID real
 * (backendId). Además del match por UUID, la consulta de equipos incluye el
 * NIT y el nombre de la empresa para capturar las recepciones directas
 * (prospect_id = "-9000") registradas desde el módulo Trabajo.
 */

export interface EquipmentProspectLike {
    id?: number;
    backendId?: string;
    nit?: string;
    compania?: string;
}

export interface EquipmentMatchCriteria {
    prospectId: string;
    clientNit: string;
    clientName: string;
}

/** Resuelve el prospect_id estable (UUID); cae al id sintético como texto si no hay backendId. */
export function resolveEquipmentProspectId(prospect: EquipmentProspectLike | null | undefined): string {
    const backendId = String(prospect?.backendId ?? "").trim();
    if (backendId) {
        return backendId;
    }

    const numericId = Number(prospect?.id);
    return Number.isFinite(numericId) ? String(Math.trunc(numericId)) : "0";
}

/** Construye el criterio de consulta de equipos para un prospecto (UUID + datos del cliente). */
export function buildEquipmentMatchCriteria(prospect: EquipmentProspectLike | null | undefined): EquipmentMatchCriteria {
    return {
        prospectId: resolveEquipmentProspectId(prospect),
        clientNit: String(prospect?.nit ?? "").trim(),
        clientName: String(prospect?.compania ?? "").trim(),
    };
}
