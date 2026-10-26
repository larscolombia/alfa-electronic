/**
 * Contexto efímero para el salto Cotización/Proyecto → Compras.
 * No viaja por URL: la OC y los datos comerciales no quedan expuestos en el
 * historial del navegador. Las solicitudes reales siguen siendo la fuente de
 * verdad en el servidor.
 */
export interface PurchaseWorkflowHandoff {
    purchaseOrderNumber: string;
    quoteCode: string;
    equipmentItemIds: string[];
}

let pendingHandoff: PurchaseWorkflowHandoff | null = null;

export function setPurchaseWorkflowHandoff(handoff: PurchaseWorkflowHandoff): void {
    pendingHandoff = {
        purchaseOrderNumber: String(handoff.purchaseOrderNumber ?? '').trim(),
        quoteCode: String(handoff.quoteCode ?? '').trim(),
        equipmentItemIds: handoff.equipmentItemIds.map((id) => String(id ?? '').trim()).filter(Boolean),
    };
}

/** Consume una vez el contexto para evitar que aparezca en una visita posterior. */
export function consumePurchaseWorkflowHandoff(): PurchaseWorkflowHandoff | null {
    const handoff = pendingHandoff;
    pendingHandoff = null;
    return handoff;
}
