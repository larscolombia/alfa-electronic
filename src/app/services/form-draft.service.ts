import { Injectable } from "@angular/core";

const DRAFT_PREFIX = "pika.form.draft.";

type DraftEnvelope<T> = {
    updatedAt: string;
    data: T;
};

@Injectable({
    providedIn: "root",
})
export class FormDraftService {
    save<T>(key: string, data: T): void {
        if (!this.canUseStorage()) {
            return;
        }

        try {
            const envelope: DraftEnvelope<T> = {
                updatedAt: new Date().toISOString(),
                data,
            };
            window.localStorage.setItem(this.resolveKey(key), JSON.stringify(envelope));
        } catch {
            // Ignore storage quota and serialization errors.
        }
    }

    load<T>(key: string): T | null {
        if (!this.canUseStorage()) {
            return null;
        }

        try {
            const raw = window.localStorage.getItem(this.resolveKey(key));
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw) as Partial<DraftEnvelope<T>>;
            if (!parsed || typeof parsed !== "object" || !("data" in parsed)) {
                return null;
            }

            return (parsed.data as T) ?? null;
        } catch {
            return null;
        }
    }

    remove(key: string): void {
        if (!this.canUseStorage()) {
            return;
        }

        try {
            window.localStorage.removeItem(this.resolveKey(key));
        } catch {
            // Ignore storage errors.
        }
    }

    watch<T>(key: string, getPayload: () => T, intervalMs = 900): () => void {
        if (typeof window === "undefined") {
            return () => undefined;
        }

        let lastSerialized = "";
        const persist = () => {
            try {
                const payload = getPayload();
                const currentSerialized = JSON.stringify(payload);
                if (currentSerialized === lastSerialized) {
                    return;
                }

                lastSerialized = currentSerialized;
                this.save(key, payload);
            } catch {
                // Ignore serialization errors.
            }
        };

        persist();
        const intervalId = window.setInterval(persist, intervalMs);

        return () => {
            window.clearInterval(intervalId);
        };
    }

    private resolveKey(key: string): string {
        return `${DRAFT_PREFIX}${key}`;
    }

    private canUseStorage(): boolean {
        return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    }
}
