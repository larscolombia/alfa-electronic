export interface EquipmentQrPayload {
    equipmentCode?: string;
    receptionDate?: string;
    companyName?: string;
    identification?: string;
    description?: string;
}

export function buildEquipmentQrPayload(payload: EquipmentQrPayload): string {
    return [
        payload.equipmentCode,
        formatQrReceptionDate(payload.receptionDate),
        payload.companyName,
        payload.identification,
        payload.description,
    ].map((value) => String(value ?? "").trim()).join("\n");
}

function formatQrReceptionDate(value: unknown): string {
    const source = String(value ?? "").trim();
    if (!source) return "";
    const date = new Date(source);
    if (Number.isNaN(date.getTime())) return source;
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
