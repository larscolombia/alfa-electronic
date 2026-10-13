import { Injectable } from "@angular/core";

const STORAGE_KEY = "work.equipment.history.context.v1";

export type WorkEquipmentHistoryContext = {
    reference: string;
    identifier: string;
    projectId: string;
    origin: string;
};

@Injectable({
    providedIn: "root",
})
export class WorkEquipmentHistoryContextService {
    private context: WorkEquipmentHistoryContext | null = null;

    setContext(context: Partial<WorkEquipmentHistoryContext>): void {
        const normalized = this.normalizeContext(context);
        if (!normalized) {
            this.clearContext();
            return;
        }

        this.context = normalized;
        this.persistContext(normalized);
    }

    getContext(): WorkEquipmentHistoryContext | null {
        if (this.context) {
            return { ...this.context };
        }

        const restored = this.restoreContext();
        this.context = restored;
        return restored ? { ...restored } : null;
    }

    clearContext(): void {
        this.context = null;
        if (typeof window === "undefined") {
            return;
        }

        window.sessionStorage.removeItem(STORAGE_KEY);
    }

    private normalizeContext(context: Partial<WorkEquipmentHistoryContext> | null | undefined): WorkEquipmentHistoryContext | null {
        const reference = String(context?.reference ?? "").trim();
        const identifier = String(context?.identifier ?? "").trim();

        if (!reference && !identifier) {
            return null;
        }

        return {
            reference,
            identifier,
            projectId: String(context?.projectId ?? "").trim(),
            origin: String(context?.origin ?? "history").trim() || "history",
        };
    }

    private persistContext(context: WorkEquipmentHistoryContext): void {
        if (typeof window === "undefined") {
            return;
        }

        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    }

    private restoreContext(): WorkEquipmentHistoryContext | null {
        if (typeof window === "undefined") {
            return null;
        }

        const rawValue = window.sessionStorage.getItem(STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        try {
            const parsed = JSON.parse(rawValue) as Partial<WorkEquipmentHistoryContext>;
            return this.normalizeContext(parsed);
        } catch {
            window.sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }
}
