/**
 * Pure business logic for equipment warranty reception and software backups.
 * No Angular imports: this file must be mirrorable in a Node .mjs test script.
 */

function parseWarrantyDate(value: any): Date | null {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }
    const str = String(value ?? "").trim();
    if (!str) {
        return null;
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
    if (ymd) {
        return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function warrantyExpiryDate(start: Date, warrantyMonths: number): Date {
    const expiry = new Date(start.getTime());
    expiry.setMonth(expiry.getMonth() + warrantyMonths);
    return expiry;
}

function normalizeWarrantyKey(value: any): string {
    return String(value ?? "").trim().toLowerCase();
}

function normalizeModelKey(value: any): string {
    return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function receptionSortKey(record: any): string {
    const createdAt = String(record?.createdAt || "").trim();
    if (createdAt) {
        return createdAt;
    }
    const year = String(record?.receptionYear || "0000").padStart(4, "0");
    const month = String(record?.receptionMonth || "00").padStart(2, "0");
    const day = String(record?.receptionDay || "00").padStart(2, "0");
    return year + "-" + month + "-" + day;
}

export function warrantyMonthsRemaining(startDate: any, warrantyMonths: any, today?: any): number | null {
    const start = parseWarrantyDate(startDate);
    const months = Number(warrantyMonths);
    if (!start || !Number.isFinite(months) || months <= 0) {
        return null;
    }
    const now = parseWarrantyDate(today ?? new Date());
    if (!now) {
        return null;
    }
    const expiry = warrantyExpiryDate(start, months);
    if (now.getTime() > expiry.getTime()) {
        return 0;
    }
    let remaining = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
    if (expiry.getDate() < now.getDate()) {
        remaining -= 1;
    }
    return Math.max(0, remaining);
}

export function isUnderLegalWarranty(startDate: any, warrantyMonths: any, today?: any): boolean {
    const start = parseWarrantyDate(startDate);
    const months = Number(warrantyMonths);
    if (!start || !Number.isFinite(months) || months <= 0) {
        return false;
    }
    const now = parseWarrantyDate(today ?? new Date());
    if (!now) {
        return false;
    }
    const expiry = warrantyExpiryDate(start, months);
    return now.getTime() <= expiry.getTime();
}

export function findPreviousReception(equipment: any, history: any[]): any | null {
    const serie = normalizeWarrantyKey(equipment?.serie);
    const identifier = normalizeWarrantyKey(equipment?.receivedIdentifier ?? equipment?.identifier);
    if (!serie && !identifier) {
        return null;
    }
    const excludeRecordId = normalizeWarrantyKey(equipment?.recordId);
    const excludeItemId = normalizeWarrantyKey(equipment?.id ?? equipment?.itemId);

    const matches: { record: any; item: any }[] = [];
    for (const record of history || []) {
        if (!record) {
            continue;
        }
        if (excludeRecordId && normalizeWarrantyKey(record.id) === excludeRecordId) {
            continue;
        }
        for (const item of record.items || []) {
            if (excludeItemId && normalizeWarrantyKey(item?.id) === excludeItemId) {
                continue;
            }
            const itemSerie = normalizeWarrantyKey(item?.serie);
            const itemIdentifier = normalizeWarrantyKey(item?.receivedIdentifier ?? item?.identifier);
            const serieMatch = !!serie && !!itemSerie && itemSerie === serie;
            const identifierMatch = !!identifier && !!itemIdentifier && itemIdentifier === identifier;
            if (serieMatch || identifierMatch) {
                matches.push({ record, item });
            }
        }
    }

    if (matches.length === 0) {
        return null;
    }

    matches.sort((a, b) => receptionSortKey(b.record).localeCompare(receptionSortKey(a.record)));
    const best = matches[0];
    return {
        code: String(best.record.code || best.record.consecutive || best.record.id || ""),
        receptionDate: receptionSortKey(best.record),
        identifier: String(best.item.receivedIdentifier || best.item.identifier || ""),
        serie: String(best.item.serie || ""),
        failureDescription: String(best.item.failureDescription || ""),
        repairStatus: String(best.item.repairStatus || ""),
        recordId: String(best.record.id || ""),
        clientName: String(best.record.companyName || best.record.prospectName || ""),
    };
}

export function backupAvailableForModel(backups: any[], model: any): any | null {
    const target = normalizeModelKey(model);
    if (!target) {
        return null;
    }
    return (backups || []).find((backup) => normalizeModelKey(backup?.equipmentModel ?? backup?.model) === target) || null;
}
