import * as QRCode from "qrcode";

export interface EquipmentQrPayload {
    recordId: string;
    itemId: string;
    identifier: string;
    shortCode: string;
}

export function buildEquipmentQrShortCode(recordId: string, itemId: string): string {
    const recordPart = String(recordId ?? "").trim().slice(-6).toUpperCase();
    const itemPart = String(itemId ?? "").trim().slice(-4).toUpperCase();
    return [recordPart, itemPart].filter((part) => part.length > 0).join("-");
}

export function buildEquipmentQrPayload(payload: EquipmentQrPayload): string {
    return JSON.stringify({
        recordId: String(payload.recordId ?? "").trim(),
        itemId: String(payload.itemId ?? "").trim(),
        identifier: String(payload.identifier ?? "").trim(),
        shortCode: String(payload.shortCode ?? "").trim(),
    });
}

export async function generateEquipmentQrDataUrl(payload: EquipmentQrPayload): Promise<string> {
    return QRCode.toDataURL(buildEquipmentQrPayload(payload), {
        margin: 1,
        width: 240,
        errorCorrectionLevel: "M",
        color: {
            dark: "#202937",
            light: "#ffffff",
        },
    });
}

export function estimateDataUrlBinarySize(dataUrl: string): number {
    const raw = String(dataUrl ?? "");
    const commaIndex = raw.indexOf(",");
    if (commaIndex < 0) {
        return 0;
    }

    const base64 = raw.slice(commaIndex + 1);
    return Math.max(0, Math.floor((base64.length * 3) / 4));
}
