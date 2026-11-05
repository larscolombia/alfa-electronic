export interface QuoteEquipmentCostInput {
    estimatedHours: number;
    partsCost: number;
}

const asNonNegativeNumber = (value: number): number => Math.max(0, Number(value) || 0);

export function laborCost(estimatedHours: number, hourlyRate: number): number {
    return asNonNegativeNumber(estimatedHours) * asNonNegativeNumber(hourlyRate);
}

export function totalCost(input: QuoteEquipmentCostInput, hourlyRate: number): number {
    return laborCost(input.estimatedHours, hourlyRate) + asNonNegativeNumber(input.partsCost);
}

/** Margen sobre venta: utilidad / valor cobrado. */
export function profitMargin(salePrice: number, costs: number): number {
    const price = asNonNegativeNumber(salePrice);
    return price === 0 ? 0 : Math.round(((price - asNonNegativeNumber(costs)) / price) * 10000) / 100;
}

export function normalizeCommentLines(lines: string[]): string[] {
    return lines.map((line) => line.trim()).filter(Boolean).slice(0, 5);
}

export function canModifyQuote(equipmentStatuses: string[]): boolean {
    return !equipmentStatuses.some((status) => status.trim().toLocaleLowerCase("es-CO") === "reparacion");
}
