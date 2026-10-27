import type { ProspectEquipmentBorrowedEquipment, ProspectEquipmentItem } from "./crm-prospect-equipment.store";

const BORROWED_CODE_PREFIX = "BLD-";
const BORROWED_CODE_RANDOM_LENGTH = 8;
const BORROWED_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBorrowedCode(): string {
    let suffix = "";
    const randomValues = new Uint8Array(BORROWED_CODE_RANDOM_LENGTH);
    crypto.getRandomValues(randomValues);
    for (const value of randomValues) {
        suffix += BORROWED_CODE_ALPHABET[value % BORROWED_CODE_ALPHABET.length];
    }
    return `${BORROWED_CODE_PREFIX}${suffix}`;
}

export function normalizeBorrowedEntry(entry: string | Partial<ProspectEquipmentBorrowedEquipment> | null | undefined): ProspectEquipmentBorrowedEquipment {
    if (typeof entry === "string") {
        return { code: "", description: entry.trim() };
    }

    return {
        code: String(entry?.code ?? "").trim().toUpperCase(),
        description: String(entry?.description ?? "").trim(),
    };
}

export function normalizeBorrowedEquipments(entries: unknown): Array<string | ProspectEquipmentBorrowedEquipment> {
    if (!Array.isArray(entries)) {
        return [];
    }

    return entries
        .map((entry) => normalizeBorrowedEntry(entry as string | Partial<ProspectEquipmentBorrowedEquipment>))
        .filter((entry) => entry.code.length > 0 || entry.description.length > 0);
}

export function borrowedEntriesWithContent(item: Pick<ProspectEquipmentItem, "borrowedEquipments">): ProspectEquipmentBorrowedEquipment[] {
    return (item.borrowedEquipments ?? []).map((entry) => normalizeBorrowedEntry(entry)).filter((entry) => entry.description.length > 0);
}

export function borrowedEntriesLabel(item: Pick<ProspectEquipmentItem, "borrowedEquipments">): string {
    const entries = borrowedEntriesWithContent(item);
    return entries.length > 0 ? entries.map((entry) => entry.description).join(", ") : "Sin equipos prestados";
}

export function createBorrowedEntry(description = ""): ProspectEquipmentBorrowedEquipment {
    return { code: generateBorrowedCode(), description };
}
