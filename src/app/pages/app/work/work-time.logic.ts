/**
 * Logica pura de hoja de tiempo (sin Angular).
 *
 * Espejada en scripts/test-work-time-logic.mjs y alineada con los umbrales
 * ya probados en scripts/test-sla-kpi-logic.mjs (calculateTimeKpi,
 * calculateDailyBalance, accumulateQuarterHours).
 */

export type WorkEntryType = "normal" | "hora-extra" | "permiso" | "ausencia" | "festivo";

export const WORK_ENTRY_TYPES: WorkEntryType[] = ["normal", "hora-extra", "permiso", "ausencia", "festivo"];

export interface TimeKpiResult {
    efficiency: number;
    deviation: number;
    deviationPercent: number;
    status: "rentable" | "aceptable" | "deficitario" | "critico" | "sin-estimacion";
}

export interface DailyBalanceResult {
    totalWorked: number;
    targetHours: number;
    balance: number;
    missing: number;
    extra: number;
    completed: boolean;
}

export interface EntryTypeSummaryRow {
    count: number;
    hours: number;
}

export type EntryTypeSummary = Record<WorkEntryType, EntryTypeSummaryRow>;

/** Redondea minutos hacia arriba a cuartos de hora (1 min -> 0.25 h, 16 min -> 0.5 h). */
export function accumulateQuarterHours(minutes: number): number {
    return Math.ceil(minutes / 15) * 0.25;
}

/** Balance diario contra la jornada objetivo (8 h por defecto). */
export function calculateDailyBalance(entries: Array<{ hours: number }>, targetHours = 8): DailyBalanceResult {
    const totalWorked = entries.reduce((sum, entry) => sum + entry.hours, 0);
    const balance = totalWorked - targetHours;

    return {
        totalWorked: Math.round(totalWorked * 100) / 100,
        targetHours,
        balance: Math.round(balance * 100) / 100,
        missing: Math.round(Math.max(targetHours - totalWorked, 0) * 100) / 100,
        extra: Math.round(Math.max(totalWorked - targetHours, 0) * 100) / 100,
        completed: totalWorked >= targetHours,
    };
}

/** KPI estimado vs real. Mismos umbrales que scripts/test-sla-kpi-logic.mjs. */
export function calculateTimeKpi(estimatedHours: number, actualHours: number): TimeKpiResult {
    if (!estimatedHours || estimatedHours <= 0) {
        return { efficiency: 0, deviation: 0, deviationPercent: 0, status: "sin-estimacion" };
    }

    const efficiency = (estimatedHours / actualHours) * 100;
    const deviation = actualHours - estimatedHours;
    const deviationPercent = (deviation / estimatedHours) * 100;

    let status: TimeKpiResult["status"];
    if (efficiency >= 100) status = "rentable";
    else if (efficiency >= 80) status = "aceptable";
    else if (efficiency >= 60) status = "deficitario";
    else status = "critico";

    return {
        efficiency: Math.round(efficiency * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
        deviationPercent: Math.round(deviationPercent * 100) / 100,
        status,
    };
}

/** Totales por tipo de registro. Entradas sin tipo (o con tipo desconocido) cuentan como "normal". */
export function summarizeByEntryType(entries: Array<{ hours: number; entryType?: string }>): EntryTypeSummary {
    const summary = {} as EntryTypeSummary;
    for (const type of WORK_ENTRY_TYPES) {
        summary[type] = { count: 0, hours: 0 };
    }

    for (const entry of entries) {
        const type: WorkEntryType = WORK_ENTRY_TYPES.includes(entry.entryType as WorkEntryType)
            ? (entry.entryType as WorkEntryType)
            : "normal";
        summary[type].count += 1;
        summary[type].hours = Math.round((summary[type].hours + entry.hours) * 100) / 100;
    }

    return summary;
}
