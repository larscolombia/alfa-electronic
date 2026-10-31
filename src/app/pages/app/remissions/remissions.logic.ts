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
        const location = String(eq?.storageLocationName || eq?.storageLocationId || eq?.locationName || eq?.location || "").trim();
        return DISPATCH_READY_STATUSES.indexOf(status) >= 0 && location !== "";
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

// ── Reglas duras de despacho (espejo de backend/internal/remissions/validation.go) ──
// El servidor sigue siendo la fuente de verdad final; estas funciones existen
// para no gastar un request que el backend rechazaría y para mostrar el
// mensaje accionable exacto ANTES de enviar. Mismas reglas, mismo orden.
export const MAX_ITEMS_PER_REMISSION = 4;

export function hasAnchoredEquipment(items: any[]): boolean {
    return (items || []).some((item) => String(item?.anchoredNote || "").trim() !== "");
}

export function validateRemissionDraft(form: any): string {
    const items = Array.isArray(form?.items) ? form.items : [];
    if (items.length === 0) {
        return "una remision sin equipos no se puede generar: agregue al menos un equipo antes de guardar";
    }
    if (items.length > MAX_ITEMS_PER_REMISSION) {
        return `maximo ${MAX_ITEMS_PER_REMISSION} equipos por remision: divida el despacho en varias remisiones independientes`;
    }
    if (String(form?.contactName || "").trim() === "") {
        return "el contacto del cliente es obligatorio para despachar: complete la casilla Contacto y vuelva a guardar";
    }
    const dispatchType = String(form?.dispatchType || "").trim().toLowerCase();
    if (["servientrega", "dhl"].includes(dispatchType)) {
        if (String(form?.carrierName || "").trim() === "") {
            return "la transportadora es obligatoria para una entrega por transportadora: complete la casilla Transportadora";
        }
        if (String(form?.guideNumber || "").trim() === "") {
            return "la guia es obligatoria para una entrega por transportadora: complete la casilla Numero de guia";
        }
    }
    if (Number(form?.warrantyMonths || 0) <= 0 && String(form?.notes || "").trim() === "") {
        return "la remision debe incluir una garantia o una excepcion aprobada en Notas / Comentarios";
    }
    for (const item of items) {
        if (Number(item?.warrantyMonths || 0) <= 0) {
            return "cada equipo debe tener un tiempo de garantia: seleccione los meses de garantia de cada equipo antes de guardar";
        }
    }
    if (String(form?.purchaseOrder || "").trim() === "") {
        return "la orden de compra debe acompañar el envio: registre el numero de OC antes de guardar";
    }
    for (const item of items) {
        const identifier = String(item?.identifier || "").trim();
        // El identificador operativo es el código interno: serie legacy EQ-* o
        // serie actual CO+YYMM+NNNN (misma regla que backend/internal/remissions/validation.go).
        // La serie física se conserva como trazabilidad separada, por lo que no debe
        // bloquear la remisión cuando ambos valores son deliberadamente distintos.
        if (item?.sourceSeries && !/^(?:EQ-[A-Z0-9]+|CO[0-9]{8,})$/i.test(identifier) && identifier !== String(item.sourceSeries).trim()) {
            return "marca, tipo y serie deben coincidir exactamente con el equipo origen; no se aceptan coincidencias parciales";
        }
    }
    if (hasAnchoredEquipment(items) && !form?.anchoredAccepted) {
        return "la remision incluye equipos con prestamos anclados: confirme su inclusion antes de guardar";
    }
    return "";
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
        serviceTypeName: string;
        accessories: string;
        anchoredNote: string;
        warrantyMonths: number;
        unitPrice: number;
        quantity: number;
        sourceSeries: string;
    }>;
}

export function buildRemissionPrefillFromProject(project: any, equipmentItem?: any): RemissionPrefill {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};

    const snapshot = props.journeySnapshot && typeof props.journeySnapshot === "object" ? props.journeySnapshot : {};
    const owner = snapshot.owner && typeof snapshot.owner === "object" ? snapshot.owner : {};
    const equipment = snapshot.equipment && typeof snapshot.equipment === "object" ? snapshot.equipment : {};
    const commercial = snapshot.commercial && typeof snapshot.commercial === "object" ? snapshot.commercial : {};
    const clientName = String(props.client || owner.companyName || owner.prospectName || "").trim();
    const clientNit = String((equipmentItem && equipmentItem.clientNit) || props.clientNit || owner.nit || "").trim();

    let dispatchType = String(props.paymentCondition || props.dispatchType || "").trim().toLowerCase();
    if (!DISPATCH_TYPE_LABELS[dispatchType]) {
        dispatchType = "";
    }

    const identifier = String(
        props.equipmentCode
        || equipment.equipmentCode
        || props.equipmentIdentifier
        || (equipmentItem && (equipmentItem.receivedIdentifier || equipmentItem.identifier))
        || (equipmentItem && equipmentItem.serie)
        || equipment.identifier || equipment.serie || "",
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
        purchaseOrder: String(props.purchaseOrder || props.purchaseOrderNumber || props.ordenCompra || commercial.purchaseOrderNumber || "").trim(),
        items: [{
            equipmentId: String(props.equipmentItemId || (equipmentItem && (equipmentItem.itemId || equipmentItem.id)) || ""),
            identifier,
            description,
            serviceTypeName: String(props.equipmentServiceType || equipment.serviceTypeName || (equipmentItem && equipmentItem.serviceTypeName) || "").trim(),
            accessories: String(props.accessories || (equipmentItem && equipmentItem.accessories) || "").trim(),
            anchoredNote: buildAnchoredAlert({ borrowedEquipments: borrowed }),
            warrantyMonths: itemWarranty,
            unitPrice: 0,
            quantity: 1,
            sourceSeries: String(
                props.equipmentSerie
                || equipment.serie
                || (equipmentItem && (equipmentItem.serie || equipmentItem.receivedIdentifier))
                || "",
            ).trim(),
        }],
    };
}

/**
 * Estado de pago del proyecto (lo marca la ficha en kanban):
 * 'pendiente' | 'parcial' | 'confirmado'. Normaliza mayúsculas/espacios.
 */
export function normalizeProjectPaymentStatus(project: any): string {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.paymentStatus || "").trim().toLowerCase();
}

/** Accesores puros sobre properties_json: una sola fuente de las claves. */
export function projectClientName(project: any): string {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.client || props.equipmentProspectName || "").trim();
}

export function projectEquipmentCode(project: any): string {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.equipmentIdentifier || "").trim()
        || (project?.id ? "#" + String(project.id).slice(-6) : "Sin codigo");
}

export function projectEquipmentName(project: any): string {
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    return String(props.equipmentDisplayName || [props.marca, props.tipo].filter(Boolean).join(" ") || "").trim();
}

export interface ProjectVerificationState {
    /** true si el proyecto esta en estado pago confirmado (requiere doble validacion). */
    required: boolean;
    savedAt: string;
    savedBy: string;
}

/**
 * Doble validacion de despacho: un proyecto con pago confirmado solo puede
 * tener remision despues de que alguien valide los datos en /finance-pagos y
 * guarde esa verificacion (properties.paymentVerification = { at, by }).
 */
export function projectPaymentVerificationState(project: any): ProjectVerificationState {
    const required = normalizeProjectPaymentStatus(project) === "confirmado";
    const props = (project && typeof project.properties === "object" && project.properties !== null)
        ? project.properties
        : {};
    const verification = (props.paymentVerification && typeof props.paymentVerification === "object")
        ? props.paymentVerification
        : null;
    return {
        required,
        savedAt: String(verification?.at || "").trim(),
        savedBy: String(verification?.by || "").trim(),
    };
}

export interface RemissionGateDecision { allowed: boolean; reason: string; }

/**
 * Puerta unica de creacion de remision por proyecto (la usa /app/remissions):
 * pago confirmado sin doble validacion guardada -> bloqueado con el motivo.
 */
export function canCreateRemissionForProject(project: any): RemissionGateDecision {
    const state = projectPaymentVerificationState(project);
    if (state.required && !state.savedAt) {
        return {
            allowed: false,
            reason: "Pago confirmado sin validar. Requiere la doble validacion en Financiero > Pagos antes de crear su remision.",
        };
    }
    return { allowed: true, reason: "" };
}

/** Proyectos que deben aparecer en el panel /finance-pagos (pago confirmado). */
export function filterPaymentConfirmedProjects(projects: any[]): any[] {
    return (projects || []).filter((p) => projectPaymentVerificationState(p).required);
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
