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
            this.choices?.refresh();
        });
    }
}
