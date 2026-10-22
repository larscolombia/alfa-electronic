/**
 * Pure business logic for the remissions module.
 * No Angular imports: this file must be mirrorable in a Node .mjs test script.
 */

const DISPATCH_TYPE_LABELS: Record<string, string> = {
    "servientrega": "Servientrega",
    "recoge-cliente": "Recoge Cliente",
    "contra-entrega": "Contra entrega",
    "dhl": "DHL",
};

const DISPATCH_READY_STATUSES = ["listo-entrega", "garantia", "no-reparable"];

const DELIVERY_STATUSES = ["pendiente", "entregado"];

export function dispatchTypeLabel(value: string): string {
    const key = String(value || "");
    return DISPATCH_TYPE_LABELS[key] || key || "No especificado";
}

interface DispatchReadyGroup {
    clientName: string;
    clientNit: string;
    equipments: any[];
}

export function groupDispatchReadyByClient(equipments: any[]): DispatchReadyGroup[] {
    const ready = (equipments || []).filter((eq) => {
        const status = String(eq?.repairStatus || eq?.status || "");
        return DISPATCH_READY_STATUSES.indexOf(status) >= 0;
    });

    const groups = new Map<string, DispatchReadyGroup>();
    for (const eq of ready) {
        const clientName = String(eq.clientName || eq.prospectName || "Sin cliente");
        const clientNit = String(eq.clientNit || "");
        let group = groups.get(clientName);
        if (!group) {
            group = { clientName, clientNit, equipments: [] };
            groups.set(clientName, group);
        }
        group.equipments.push(eq);
    }

    return Array.from(groups.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
}

export function computeRemissionTotal(items: any[]): number {
    return (items || []).reduce((sum, item) => sum + Number(item?.unitPrice || 0) * Number(item?.quantity || 0), 0);
}

export function buildAnchoredAlert(equipment: any): string {
    const borrowed = equipment?.borrowedEquipments || equipment?.prestados || [];
    if (!Array.isArray(borrowed) || borrowed.length === 0) {
        return "";
    }
    return "Este equipo tiene equipos en prestamo anclados: " + borrowed.join(", ") + ". Incluyalos en la misma remision.";
}

export function canTransitionDeliveryStatus(from: string, to: string): boolean {
    if (DELIVERY_STATUSES.indexOf(from) < 0 || DELIVERY_STATUSES.indexOf(to) < 0) {
        return false;
    }
    if (from === "entregado" && to === "pendiente") {
        return false;
    }
    return true;
}

export function itemsRequiringAccessoriesConfirmation(items: any[]): any[] {
    return (items || []).filter((item) => {
        const accessories = String(item?.accessories || "").trim();
        const anchoredNote = String(item?.anchoredNote || "").trim();
        return accessories !== "" || anchoredNote !== "";
    });
}

export function requiresAccessoriesConfirmation(items: any[]): boolean {
    return itemsRequiringAccessoriesConfirmation(items).length > 0;
}

/** Estado del tablero técnico que habilita el despacho (ver transitions.go). */
export const READY_FOR_DELIVERY_STATUS = "listo-entrega";

/**
 * Prefill de la remision a partir de un proyecto en estado `listo-entrega`.
 *
 * Fuente: properties_json del proyecto (client, equipmentIdentifier,
 * equipmentDisplayName, paymentCondition, ...) mas el item de equipo CRM si se
 * logra resolver (aporta clientNit y accessories que el proyecto no guarda).
 * El resultado NO incluye lo que el usuario debe decidir en el formulario
 * (transportadora, guia, fotos...): eso queda vacío a propósito.
 */
export interface RemissionPrefill {
    clientName: string;
    clientNit: string;
    dispatchType: string;
    purchaseOrder: string;
    items: Array<{
        equipmentId: string;
        identifier: string;
        description: string;
        accessories: string;
        anchoredNote: string;
        warrantyMonths: number;
        unitPrice: number;
        quantity: number;
    }>;
}

export function buildRemissionPrefillFromProject(project: any, equipmentItem?: any): RemissionPrefill {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};

    const clientName = String(props.client || "").trim();
    const clientNit = String((equipmentItem && equipmentItem.clientNit) || props.clientNit || "").trim();

    let dispatchType = String(props.paymentCondition || props.dispatchType || "").trim().toLowerCase();
    if (!DISPATCH_TYPE_LABELS[dispatchType]) {
        dispatchType = "";
    }

    const identifier = String(
        props.equipmentIdentifier
        || (equipmentItem && (equipmentItem.receivedIdentifier || equipmentItem.identifier))
        || (equipmentItem && equipmentItem.serie)
        || "",
    ).trim();

    let description = String(props.equipmentDisplayName || "").trim();
    if (!description && equipmentItem) {
        description = String(equipmentItem.displayName || [equipmentItem.marca, equipmentItem.tipo].filter(Boolean).join(" ") || "").trim();
    }

    const borrowed: string[] = Array.isArray(props.equipmentBorrowedForTesting)
        ? props.equipmentBorrowedForTesting.map((v: any) => String(v || "").trim()).filter((v: string) => v !== "")
        : (Array.isArray(equipmentItem && equipmentItem.borrowedEquipments)
            ? equipmentItem.borrowedEquipments.map((v: any) => String(v || "").trim()).filter((v: string) => v !== "")
            : []);

    const warrantyRaw = Number(props.warrantyMonths ?? 0);
    const itemWarranty = [3, 6, 12].indexOf(warrantyRaw) >= 0 ? warrantyRaw : 0;

    return {
        clientName,
        clientNit,
        dispatchType,
        purchaseOrder: String(props.purchaseOrder || props.ordenCompra || "").trim(),
        items: [{
            equipmentId: String(props.equipmentItemId || (equipmentItem && (equipmentItem.itemId || equipmentItem.id)) || ""),
            identifier,
            description,
            accessories: String(props.accessories || (equipmentItem && equipmentItem.accessories) || "").trim(),
            anchoredNote: buildAnchoredAlert({ borrowedEquipments: borrowed }),
            warrantyMonths: itemWarranty,
            unitPrice: 0,
            quantity: 1,
        }],
    };
}

export function findQuoteLineForItem(quote: any, item: any): any | null {
    const lines = Array.isArray(quote?.lineas) ? quote.lineas : [];
    const selectedIds = Array.isArray(quote?.selectedEquipmentIds) ? quote.selectedEquipmentIds : [];
    const identifier = String(item?.identifier || "").trim().toLowerCase();
    const line = lines.find((l: any) => {
        if (item?.equipmentId && selectedIds.indexOf(item.equipmentId) >= 0) {
            return true;
        }
        if (!identifier) {
            return false;
        }
        return String(l.servicio || "").toLowerCase().includes(identifier)
            || String(l.descripcion || "").toLowerCase().includes(identifier);
    });
    return line || null;
}

export function buildRemissionPrintModel(remission: any): any {
    const valued = !!remission?.valued;
    const items = (remission?.items || []).map((item: any) => ({
        identifier: item?.identifier || "",
        description: item?.description || "",
        accessories: item?.accessories || "",
        warrantyMonths: Number(item?.warrantyMonths || 0),
        quantity: Number(item?.quantity || 0),
        unitPrice: valued ? Number(item?.unitPrice || 0) : null,
    }));

    return {
        consecutive: remission?.consecutive || "",
        clientName: remission?.clientName || "",
        clientNit: remission?.clientNit || "",
        dispatchTypeLabel: dispatchTypeLabel(remission?.dispatchType || ""),
        carrierName: remission?.carrierName || "",
        guideNumber: remission?.guideNumber || "",
        purchaseOrder: remission?.purchaseOrder || "",
        youtubeLink: remission?.youtubeLink || "",
        photos: remission?.dispatchPhotos || [],
        items,
        totalValue: valued ? computeRemissionTotal(remission?.items || []) : null,
        deliveryStatus: remission?.deliveryStatus || "pendiente",
        warrantyMonths: Number(remission?.warrantyMonths || 0),
        notes: remission?.notes || "",
    };
}
