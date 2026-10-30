import { DOCUMENT } from "@angular/common";
import { Inject, Injectable, NgZone } from "@angular/core";
import Choices from "choices.js";

type EnhancedSelect = {
    choices: Choices;
    optionsObserver: MutationObserver;
    onChange: () => void;
};

const ENHANCE_DEBOUNCE_MS = 50;

@Injectable({ providedIn: "root" })
export class SelectEnhancementService {
    private readonly enhanced = new Map<HTMLSelectElement, EnhancedSelect>();
    private pageObserver: MutationObserver | null = null;
    private scheduleTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(@Inject(DOCUMENT) private readonly document: Document, private readonly zone: NgZone) {}

    start(): void {
        if (this.pageObserver) return;
        // DOM decoration must not schedule Angular change detection. Otherwise
        // a render that recreates nodes triggers the observer, another render,
        // and an endless microtask loop that starves painting and user input.
        this.zone.runOutsideAngular(() => {
            this.enhanceAll();
            this.pageObserver = new MutationObserver((records) => {
                // Sin selects añadidos/retirados no hay nada que enhancer: la
                // mayoría de mutaciones son texto o clases. Re-escanear todo el
                // documento en cada mutación saturaba el hilo principal y dejaba
                // los desplegables (y toda la página) congelados tras interactuar.
                if (!(records ?? []).some((record) => this.isSelectRelevant(record))) return;
                this.scheduleEnhanceAll();
            });
            this.pageObserver.observe(this.document.body, { childList: true, subtree: true });
        });
    }

    stop(): void {
        if (this.scheduleTimer) {
            clearTimeout(this.scheduleTimer);
            this.scheduleTimer = null;
        }
        this.pageObserver?.disconnect();
        this.pageObserver = null;
        for (const [select, { choices, optionsObserver, onChange }] of this.enhanced) {
            optionsObserver.disconnect();
            select.removeEventListener("change", onChange);
            choices.destroy();
        }
        this.enhanced.clear();
    }

    private scheduleEnhanceAll(): void {
        if (this.scheduleTimer) return;
        this.scheduleTimer = setTimeout(() => {
            this.scheduleTimer = null;
            this.enhanceAll();
        }, ENHANCE_DEBOUNCE_MS);
    }

    private isSelectRelevant(record: MutationRecord): boolean {
        const nodes = Array.from(record.addedNodes).concat(Array.from(record.removedNodes));
        return nodes.some((node) => {
            if (!(node instanceof HTMLElement)) return false;
            return node.tagName === "SELECT" || node.querySelector("select") !== null;
        });
    }

    private enhanceAll(): void {
        this.removeDisconnected();
        this.document.querySelectorAll<HTMLSelectElement>("select").forEach((select) => this.enhance(select));
    }

    private enhance(select: HTMLSelectElement): void {
        if (this.enhanced.has(select) || select.hasAttribute("appSearchableSelect")) return;
        // Los selects del modal de equipos viven en pasos que se crean/destruyen
        // con *ngIf y alternan [disabled] por datos: Choices no sincroniza el
        // estado disabled ni los valores escritos por ngModel, y su lista se
        // corta dentro del cuerpo scrollable del modal. Se quedan nativos.
        if (select.closest("app-crm-prospect-equipment-modal")) return;

        const accessibleName = this.resolveAccessibleName(select);
        if (!select.hasAttribute("aria-label") && !this.hasAssociatedLabel(select)) {
            select.setAttribute("aria-label", accessibleName);
        }
        if (select.classList.contains("choices") || select.dataset["choice"] === "active") return;

        const choices = new Choices(select, {
            allowHTML: false,
            itemSelectText: "",
            noChoicesText: "No hay opciones disponibles",
            noResultsText: "No se encontraron resultados",
            searchEnabled: true,
            searchPlaceholderValue: `Buscar en ${accessibleName.toLocaleLowerCase("es")}`,
            shouldSort: false,
        });
        const searchInput = select.closest(".choices")?.querySelector<HTMLInputElement>("input.choices__input--cloned");
        searchInput?.setAttribute("aria-label", `Buscar en ${accessibleName}`);

        let refreshQueued = false;
        const optionsObserver = new MutationObserver(() => {
            if (refreshQueued) return;
            refreshQueued = true;
            queueMicrotask(() => {
                refreshQueued = false;
                if (!select.isConnected) return;
                choices.refresh();
                this.applyBoundValue(select, choices);
                if (select.disabled) choices.disable();
                else choices.enable();
            });
        });
        // Aplica el valor ya fijado por ngModel si aún no estaba seleccionado,
        // para que un select nativo con selección inicial (p.ej. modal de seguimiento)
        // no pierda su valor cuando Choices reconstruye la lista.
        this.applyBoundValue(select, choices);
        optionsObserver.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
        // Choices dispara el cambio desde la zona externa usada para decorar
        // el DOM. Volvemos a entrar a Angular para que ngModel y los selectores
        // dependientes (por ejemplo País → Ciudad) se rendericen de inmediato.
        const onChange = () => this.zone.run(() => undefined);
        select.addEventListener("change", onChange);
        this.enhanced.set(select, { choices, optionsObserver, onChange });
    }

    private applyBoundValue(select: HTMLSelectElement, choices: Choices): void {
        const value = String(select.value ?? "").trim();
        if (!value) return;
        const hasOption = Array.from(select.options).some((opt) => opt.value === value);
        if (!hasOption) return;
        try {
            const raw = choices.getValue(true);
            const current = (Array.isArray(raw) ? raw : [raw]).map(String);
            if (current.includes(value)) return; // ya seleccionado: evita re-render/loop infinito
        } catch { /* si getValue falla, seguimos aplicando */ }
        try {
            choices.setValue([value]);
        } catch { /* Choices puede destruirse entre frames; no romper el render */ }
    }

    private removeDisconnected(): void {
        for (const [select, enhanced] of this.enhanced) {
            if (select.isConnected) continue;
            enhanced.optionsObserver.disconnect();
            select.removeEventListener("change", enhanced.onChange);
            enhanced.choices.destroy();
            this.enhanced.delete(select);
        }
    }

    private hasAssociatedLabel(select: HTMLSelectElement): boolean {
        return !!(select.id && this.document.querySelector(`label[for="${CSS.escape(select.id)}"]`));
    }

    private resolveAccessibleName(select: HTMLSelectElement): string {
        const explicit = select.getAttribute("aria-label")?.trim();
        if (explicit) return explicit;
        const label = select.id ? this.document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(select.id)}"]`) : null;
        const nearby = select.closest(".mb-3, .form-group, .col, [class*='col-']")?.querySelector<HTMLLabelElement>("label");
        return label?.textContent?.trim() || nearby?.textContent?.trim() || select.name || "opciones";
    }
}
