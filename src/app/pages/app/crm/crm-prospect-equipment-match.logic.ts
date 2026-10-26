/**
 * Lógica pura para vincular equipos CRM con el prospecto real.
 *
 * El id del prospecto (ProspectRecord.id) YA es el UUID real del backend
 * (antes era un entero sintético por posición de lista que colisionaba entre
 * recargas). La vinculación estable sigue siendo ese UUID. Además del match
 * por UUID, la consulta de equipos incluye el NIT y el nombre de la empresa
 * para capturar las recepciones directas registradas desde el módulo Trabajo.
 */

export interface EquipmentProspectLike {
    id?: string | number;
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

    const idText = String(prospect?.id ?? "").trim();
    return idText ? idText : "0";
}

/** Construye el criterio de consulta de equipos para un prospecto (UUID + datos del cliente). */
export function buildEquipmentMatchCriteria(prospect: EquipmentProspectLike | null | undefined): EquipmentMatchCriteria {
    return {
        prospectId: resolveEquipmentProspectId(prospect),
        clientNit: String(prospect?.nit ?? "").trim(),
        clientName: String(prospect?.compania ?? "").trim(),
    };
}
