import * as QRCode from "qrcode";
import { buildEquipmentQrPayload, EquipmentQrPayload } from "./equipment-qr-payload.util";

export { buildEquipmentQrPayload, EquipmentQrPayload } from "./equipment-qr-payload.util";

/** Código interno legacy (registros antiguos): derivado del ID aleatorio.
 * Se conserva solo como fallback para ítems sin código asignado. */
export function buildInternalEquipmentCode(itemId: string): string {
    const normalized = String(itemId ?? "").trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return normalized ? `EQ-${normalized.slice(-8)}` : "";
}

/** Código interno del equipo: prefiere el asignado al recepcionar (serie CO+YYMM+NNNN,
 * contador mensual por empresa emitido por el backend). Solo cuando no existe —
 * registros anteriores a esa serie — deriva la etiqueta legacy EQ-* del ID, para
 * que los equipos antiguos mantengan su código estable sin renúmeros. */
export function resolveEquipmentCode(item: { id?: unknown; equipmentCode?: unknown } | null | undefined): string {
    const stored = String(item?.equipmentCode ?? "").trim();
    if (stored) return stored;
    return buildInternalEquipmentCode(String(item?.id ?? ""));
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
