/**
 * Pure business logic for automatic board transitions in the technical
 * repair workflow:
 *  - A stock reservation, after the customer approved the work, moves a
 *    project to reparacion. An external purchase moves it to
 *    esperando-proveedor; creating it must never imply that parts arrived.
 *  - A project in pruebas can only be marked listo-entrega when it has a
 *    real closing test type registered or an equivalent completed checklist
 *    (mirrors the flow-pruebas-listo rule of work-test-batch.service.ts).
 * No Angular imports: this file must be importable from a Node .mjs test script.
 */

export type PartsAvailabilitySource = "stock" | "compra-externa";

export const PARTS_APPROVED_STATUS_ID = "pedir-repuestos";
export const PARTS_STOCK_TARGET_STATUS_ID = "reparacion";
export const PARTS_PURCHASE_TARGET_STATUS_ID = "esperando-proveedor";

/**
 * Returns the next status only for an OC-approved team. Stock is immediately
 * usable; an external purchase must wait for the supplier receipt. This mirrors
 * TranscriptCompras: position 11 until every imported line is received.
 */
export function resolveStatusAfterPartsRequest(
    currentStatus: string,
    source: PartsAvailabilitySource,
): string | null {
    const status = String(currentStatus ?? "").trim();
    if (status !== PARTS_APPROVED_STATUS_ID) {
        return null;
    }
    if (source === "stock") {
        return PARTS_STOCK_TARGET_STATUS_ID;
    }
    return source === "compra-externa" ? PARTS_PURCHASE_TARGET_STATUS_ID : null;
}

export interface ReadyForDeliveryValidation {
    ok: boolean;
    missing: string[];
}

export const NO_TEST_TYPE_ID = "sin-pruebas";
export const NO_TEST_TYPE_LABEL = "Sin pruebas funcionales";
const REPORT_TEST_TYPE_QUESTION_ID = "inf-pruebas-realizadas";

function normalizeTestTypeAnswer(value: unknown): string {
    return String(value ?? "").trim();
}

function isRealTestType(value: unknown): boolean {
    const normalized = normalizeTestTypeAnswer(value);
    return normalized.length > 0 && normalized !== NO_TEST_TYPE_ID && normalized !== NO_TEST_TYPE_LABEL;
}

/**
 * Gate de cierre: reparacion puede pasar a listo-entrega cuando tiene una
 * prueba de cierre distinta de 'sin-pruebas' en testType, o un checklist de
 * informe de intervencion (transitionTestRuns) cuya respuesta
 * 'inf-pruebas-realizadas' registra un tipo real de prueba. El modal guarda las
 * respuestas single-select como labels, por eso se rechazan el id y el label
 * de 'sin pruebas'.
 */
export function validateReadyForDelivery(project: any): ReadyForDeliveryValidation {
    const properties = (project?.properties ?? {}) as Record<string, any>;

    if (isRealTestType(properties["testType"])) {
        return { ok: true, missing: [] };
    }

    const runs = Array.isArray(properties["transitionTestRuns"]) ? properties["transitionTestRuns"] : [];
    const checklistDone = runs.some((run: any) => {
        return isRealTestType(run?.answers?.[REPORT_TEST_TYPE_QUESTION_ID]);
    });

    if (checklistDone) {
        return { ok: true, missing: [] };
    }

    return {
        ok: false,
        missing: [
            'registra la "Prueba de cierre" realizada (distinta de "Sin pruebas") en la seccion de control operativo, o completa el checklist de informe de intervencion indicando las pruebas realizadas',
        ],
    };
}
