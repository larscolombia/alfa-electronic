import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from "@angular/core";
import Choices from "choices.js";

@Directive({
    selector: "select[appSearchableSelect]",
    standalone: true,
})
export class SearchableSelectDirective implements AfterViewInit, OnDestroy {
    @Input() searchableSelectPlaceholder = "Buscar opción";

    private choices: Choices | null = null;
    private observer: MutationObserver | null = null;
    private refreshQueued = false;

    constructor(private readonly elementRef: ElementRef<HTMLSelectElement>) {}

    ngAfterViewInit(): void {
        const element = this.elementRef.nativeElement;
        this.choices = new Choices(element, {
            allowHTML: false,
            itemSelectText: "",
            noChoicesText: "No hay opciones disponibles",
            noResultsText: "No se encontraron resultados",
            searchEnabled: true,
            searchPlaceholderValue: this.searchableSelectPlaceholder,
            shouldSort: false,
        });

        // ngModel puede fijar select.value DESPUÉS de la última mutación de <option>
        // (borrador restaurado + opciones async: la escritura final cae 5ms después de
        // que llegó la opción y no dispara ningún childList). El MutationObserver solo
        // cubre cambios de DOM; este accesor captura también las escrituras de valor
        // externas y vuelve a aplicar el modelo sobre Choices.
        this.bindValueWrites(element);

        this.observer = new MutationObserver(() => this.queueRefresh());
        this.observer.observe(element, { childList: true, subtree: true });
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.observer = null;
        this.choices?.destroy();
        this.choices = null;
    }

    /**
     * Redirige cada escritura externa a element.value por el pipeline de
     * resincronización (solo cuando el valor realmente cambia, para no buclear:
     * Choices también escribe select.value al aplicar una selección).
     */
    private bindValueWrites(element: HTMLSelectElement): void {
        const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
        if (!desc?.set || !desc.get) return;
        try {
            Object.defineProperty(element, "value", {
                configurable: true,
                get: () => desc.get!.call(element),
                set: (v: string) => {
                    const prev = String(desc.get!.call(element) ?? "");
                    desc.set!.call(element, v);
                    if (String(v ?? "") !== prev) this.queueRefresh();
                },
            });
        } catch { /* si no se puede redefinir, el MutationObserver sigue cubriendo mutaciones */ }
    }

    private queueRefresh(): void {
        if (this.refreshQueued) return;
        this.refreshQueued = true;
        queueMicrotask(() => {
            this.refreshQueued = false;
            const choices = this.choices;
            if (!choices) return;
            const select = this.elementRef.nativeElement;
            if (!select.isConnected) return;
            try {
                choices.refresh();
            } catch { /* Choices puede destruirse entre frames; no romper el render */ }
            this.applyBoundValue(select, choices);
        });
    }

    /**
     * ngModel puede fijar un valor ANTES de que existan sus <option> (carga async,
     * p.ej. "Empleado responsable" = usuario logueado mientras cargan los empleados)
     * o DESPUÉS de la última mutación de opciones sin que nada más dispare aquí:
     * en ambos casos el campo se vería vacío aunque el modelo tenga valor y lo
     * guardaría correctamente. refresh() reconstruye la lista desde el DOM pero NO
     * lee select.value (solo preserva selecciones previas del store), así que hay
     * que aplicarla explícitamente.
     */
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
            // IMPORTANTE (choices.js v11): setValue(items) solo AÑADE opciones a la
            // lista; nunca selecciona nada. setChoiceByValue() es el que encuentra
            // la opción ya existente y la marca como item seleccionado visible.
            choices.setChoiceByValue(value);
        } catch { /* Choices puede destruirse entre frames; no romper el render */ }
    }
}
