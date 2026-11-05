export type QuoteCostInput = {
    hours: number;
    hourlyRate: number;
    partsCost: number;
    otherCosts: number;
    amountToCharge: number;
};

export type QuoteCostSummary = {
    laborCost: number;
    associatedCosts: number;
    profit: number;
    profitMargin: number;
};

const nonNegative = (value: number): number => Math.max(0, Number(value) || 0);

export function calculateQuoteCosts(input: QuoteCostInput): QuoteCostSummary {
    const laborCost = nonNegative(input.hours) * nonNegative(input.hourlyRate);
    const associatedCosts = laborCost + nonNegative(input.partsCost) + nonNegative(input.otherCosts);
    const amountToCharge = nonNegative(input.amountToCharge);
    const profit = amountToCharge - associatedCosts;

    return {
        laborCost,
        associatedCosts,
        profit,
        profitMargin: amountToCharge > 0 ? (profit / amountToCharge) * 100 : 0,
    };
}
