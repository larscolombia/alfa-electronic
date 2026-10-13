/**
 * Pure business logic for automatic board transitions in the technical
 * repair workflow:
 *  - A successful parts request (material reservation, purchase line or
 *    purchase request) auto-advances a project from diagnostico/por-cotizar
 *    to reparacion.
 *  - A project in pruebas can only be marked listo-entrega when it has a
 *    real closing test type registered or an equivalent completed checklist
 *    (mirrors the flow-pruebas-listo rule of work-test-batch.service.ts).
 * No Angular imports: this file must be importable from a Node .mjs test script.
 */

export const PARTS_REQUEST_SOURCE_STATUS_IDS = ["diagnostico", "por-cotizar"] as const;
export const PARTS_REQUEST_TARGET_STATUS_ID = "reparacion";

/**
 * Returns the board status the project must move to after a successful parts
 * request, or null when the project must stay where it is (already in
 * reparacion or further ahead, or in recibido/garantia flows).
 */
export function resolveStatusAfterPartsRequest(currentStatus: string): string | null {
    const status = String(currentStatus ?? "").trim();
    return (PARTS_REQUEST_SOURCE_STATUS_IDS as readonly string[]).includes(status)
        ? PARTS_REQUEST_TARGET_STATUS_ID
        : null;
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
 * A project in pruebas can move to listo-entrega when it has a closing test
 * type other than "sin-pruebas" in the testType property, or a completed
 * intervention-report checklist run (transitionTestRuns) whose
 * "inf-pruebas-realizadas" answer records a real test type. The modal stores
 * single-select answers as option labels, so both id and label forms of
 * "sin pruebas" are rejected.
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
