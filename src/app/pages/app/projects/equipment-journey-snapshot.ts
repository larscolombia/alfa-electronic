import type { ProspectEquipmentItem, ProspectEquipmentRecord } from "../crm/crm-prospect-equipment.store";
import { buildInternalEquipmentCode } from "../crm/equipment-qr.util";

export interface EquipmentJourneySnapshot {
    owner: { prospectId: string; prospectName: string; companyName: string; nit: string; contactName: string; contactEmail: string };
    equipment: { recordId: string; itemId: string; equipmentCode: string; identifier: string; serie: string; displayName: string; serviceTypeId: string; serviceTypeName: string; failure: string; accessories: string };
    technical: { assignedTo: string; assignedToId: string; assignedAt: string; assignedBy: string };
    commercial: { quoteCode: string; purchaseOrderNumber: string; purchaseOrderDate: string };
}

export function buildEquipmentJourneySnapshot(record: ProspectEquipmentRecord, item: ProspectEquipmentItem): EquipmentJourneySnapshot {
    return {
        owner: {
            prospectId: String(record.prospectId ?? "").trim(),
            prospectName: String(record.prospectName ?? "").trim(),
            companyName: String(record.companyName ?? "").trim(),
            nit: String(record.nit ?? "").trim(),
            contactName: String(record.contactName ?? "").trim(),
            contactEmail: String(record.email ?? "").trim(),
        },
        equipment: {
            recordId: String(record.id ?? "").trim(), itemId: String(item.id ?? "").trim(), equipmentCode: buildInternalEquipmentCode(item.id),
            identifier: String(item.receivedIdentifier ?? "").trim(), serie: String(item.serie ?? "").trim(),
            displayName: [item.marca, item.tipo].filter(Boolean).join(" ").trim(),
            serviceTypeId: String(item.serviceTypeId ?? "").trim(), serviceTypeName: String(item.serviceTypeName ?? "").trim(),
            failure: String(item.failureDescription ?? "").trim(), accessories: String(item.accessories ?? "").trim(),
        },
        technical: {
            assignedTo: String(item.assignedTo ?? "").trim(), assignedToId: String(item.assignedToId ?? "").trim(),
            assignedAt: String(item.assignedAt ?? "").trim(), assignedBy: String(item.assignedBy ?? "").trim(),
        },
        commercial: { quoteCode: "", purchaseOrderNumber: "", purchaseOrderDate: "" },
    };
}

export function mergeJourneyCommercial(properties: Record<string, any>, patch: Partial<EquipmentJourneySnapshot["commercial"]>): Record<string, any> {
    const current = properties["journeySnapshot"] || {};
    return { ...properties, journeySnapshot: { ...current, commercial: { ...(current.commercial || {}), ...patch } } };
}
