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

        this.observer = new MutationObserver(() => this.queueRefresh());
        this.observer.observe(element, { childList: true, subtree: true });
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.observer = null;
        this.choices?.destroy();
        this.choices = null;
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
            choices.refresh();
            this.applyBoundValue(select, choices);
        });
    }

    /**
     * ngModel puede fijar un valor ANTES de que existan sus <option> (carga async,
     * p.ej. "Empleado responsable" = usuario logueado mientras cargan los empleados).
     * refresh() reconstruye la lista pero NO selecciona; sin esto el campo se ve vacío
     * aunque el model ya tenga valor y lo guardaría correctamente.
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
            choices.setValue([value]);
        } catch { /* Choices puede destruirse entre frames; no romper el render */ }
    }
}
