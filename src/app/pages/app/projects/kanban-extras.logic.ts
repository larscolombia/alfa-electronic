/**
 * Pure business logic for the kanban board extras: SLA summary bar, session
 * time accumulation, dispatch accessories confirmation and warranty board
 * status resolution.
 * No Angular imports: this file must be mirrorable in a Node .mjs test script.
 */

export type KanbanSlaSeverity = "neutral" | "success" | "warning" | "overdue" | "critical";

export interface SlaSummaryChip {
    columnId: string;
    title: string;
    count: number;
    severity: KanbanSlaSeverity;
}

export type SlaSeverityResolver = (project: any, column: any) => string;

const SLA_SEVERITY_RANK: Record<string, number> = {
    "neutral": 0,
    "success": 1,
    "warning": 2,
    "overdue": 3,
    "critical": 4,
};

function normalizeSlaSeverity(value: unknown): KanbanSlaSeverity {
    const key = String(value ?? "neutral");
    return key in SLA_SEVERITY_RANK ? (key as KanbanSlaSeverity) : "neutral";
}

/**
 * Builds one summary chip per board column with the card count and the
 * dominant SLA severity. Dominant means the most severe semaphore present in
 * the column (critical > overdue > warning > success > neutral).
 */
export function buildSlaSummary(columns: any[], projects: any[], resolveSeverity?: SlaSeverityResolver): SlaSummaryChip[] {
    const safeColumns = Array.isArray(columns) ? columns : [];
    const safeProjects = Array.isArray(projects) ? projects : [];

    return safeColumns.map((column: any) => {
        const columnProjects = safeProjects.filter((project: any) => String(project?.status ?? "") === String(column?.id ?? ""));
        let severity: KanbanSlaSeverity = "neutral";

        columnProjects.forEach((project: any) => {
            const next = normalizeSlaSeverity(resolveSeverity ? resolveSeverity(project, column) : project?.slaSeverity);
            if (SLA_SEVERITY_RANK[next] > SLA_SEVERITY_RANK[severity]) {
                severity = next;
            }
        });

        return {
            columnId: String(column?.id ?? ""),
            title: String(column?.name ?? ""),
            count: columnProjects.length,
            severity,
        };
    });
}

/**
 * Rounds elapsed session minutes up to quarter hours (0.25h blocks).
 */
export function accumulateQuarterHours(minutes: number | null | undefined): number {
    const safeMinutes = Number(minutes);
    if (!Number.isFinite(safeMinutes) || safeMinutes <= 0) {
        return 0;
    }

    return Math.ceil(safeMinutes / 15) * 0.25;
}

/**
 * A dispatch requires explicit confirmation when the linked equipment has
 * accessories or borrowed/anchored equipments that must be handed over.
 */
export function requiresAccessoriesConfirmation(equipment: any): boolean {
    if (!equipment) {
        return false;
    }

    if (String(equipment.accessories ?? "").trim()) {
        return true;
    }

    const borrowed: any[] = Array.isArray(equipment?.borrowedEquipments) ? equipment.borrowedEquipments : [];
    return borrowed.some((item: any) => String(item ?? "").trim().length > 0);
}

/**
 * Warranty cases with pending purchase/parts lines belong to the
 * garantia-espera-repuestos board status; every other status stays untouched.
 */
export function resolveWarrantyBoardStatus(status: string, hasPendingParts: boolean): string {
    if (String(status ?? "") === "garantia" && hasPendingParts) {
        return "garantia-espera-repuestos";
    }

    return String(status ?? "");
}
