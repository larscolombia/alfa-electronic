import { CommonModule } from "@angular/common";
import { Component, ElementRef, forwardRef, HostListener, Input, OnDestroy, ViewChild } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";

export type CrmModalSelectOption = {
    label: string;
    value: unknown;
};

const MENU_MARGIN_PX = 8;
const OPTION_HEIGHT_PX = 34;
const MENU_MAX_HEIGHT_PX = 280;

@Component({
    selector: "app-crm-modal-select",
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CrmModalSelectComponent),
            multi: true,
        },
    ],
    template: `
        <div class="crm-modal-select" #root>
            <button
                #trigger
                type="button"
                class="form-select text-start d-flex align-items-center justify-content-between"
                [class.form-select-sm]="size === 'sm'"
                [class.crm-modal-select-open]="isOpen"
                [disabled]="disabled"
                [attr.aria-expanded]="isOpen"
                [attr.data-testid]="testId"
                (click)="$event.stopPropagation(); toggle()"
                (keydown)="onKeyDown($event)">
                <span class="text-truncate" [class.text-secondary]="!hasSelection">{{ selectedLabel }}</span>
            </button>
            <div
                class="crm-modal-select-menu"
                *ngIf="isOpen"
                [style.top.px]="menuTop"
                [style.left.px]="menuLeft"
                [style.min-width.px]="menuWidth"
                [style.max-height.px]="menuMaxHeight"
                role="listbox">
                <button
                    type="button"
                    class="crm-modal-select-option"
                    *ngFor="let option of options; let i = index; trackBy: trackByIndex"
                    [class.active]="i === activeIndex"
                    [class.selected]="isSelected(option)"
                    [attr.data-value]="stringify(option.value)"
                    (mouseenter)="activeIndex = i"
                    (click)="select(option)">
                    <i class="bi bi-check-lg me-1" *ngIf="isSelected(option)"></i>{{ option.label }}
                </button>
                <div class="crm-modal-select-empty" *ngIf="options.length === 0">{{ emptyText }}</div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
            }
            .crm-modal-select {
                position: relative;
            }
            .crm-modal-select-menu {
                position: fixed;
                z-index: 3000;
                overflow-y: auto;
                background: var(--bs-body-bg, #fff);
                border: 1px solid var(--bs-border-color, #dee2e6);
                border-radius: 0.375rem;
                box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.18);
                padding: 0.25rem;
            }
            .crm-modal-select-option {
                display: flex;
                align-items: center;
                width: 100%;
                border: 0;
                background: transparent;
                text-align: left;
                padding: 0.35rem 0.6rem;
                border-radius: 0.25rem;
                font-size: inherit;
                white-space: nowrap;
            }
            .crm-modal-select-option.active {
                background: var(--bs-secondary-bg, #e9ecef);
            }
            .crm-modal-select-option.selected {
                font-weight: 600;
            }
            .crm-modal-select-empty {
                padding: 0.5rem 0.75rem;
                color: var(--bs-secondary-color, #6c757d);
                white-space: nowrap;
            }
        `,
    ],
})
export class CrmModalSelectComponent implements ControlValueAccessor, OnDestroy {
    @Input() options: readonly CrmModalSelectOption[] = [];
    @Input() size: "sm" | "md" = "md";
    @Input() placeholder = "Seleccionar";
    @Input() emptyText = "Sin opciones disponibles";
    @Input() testId: string | null = null;
    @Input() disabled = false;

    @ViewChild("root") private root?: ElementRef<HTMLElement>;
    @ViewChild("trigger") private trigger?: ElementRef<HTMLButtonElement>;

    value: unknown = "";
    isOpen = false;
    activeIndex = 0;
    menuTop = 0;
    menuLeft = 0;
    menuWidth = 0;
    menuMaxHeight = MENU_MAX_HEIGHT_PX;

    private onChange: (value: unknown) => void = () => {};
    private onTouched: () => void = () => {};
    private readonly closeOnScroll = (): void => this.close();

    constructor(private readonly host: ElementRef<HTMLElement>) {
        document.addEventListener("scroll", this.closeOnScroll, true);
    }

    ngOnDestroy(): void {
        document.removeEventListener("scroll", this.closeOnScroll, true);
    }

    get hasSelection(): boolean {
        return this.options.some((option) => this.isSelected(option));
    }

    get selectedLabel(): string {
        const selected = this.options.find((option) => this.isSelected(option));
        return selected ? selected.label : this.placeholder;
    }

    stringify(value: unknown): string {
        return String(value ?? "");
    }

    trackByIndex(index: number): number {
        return index;
    }

    isSelected(option: CrmModalSelectOption): boolean {
        const current = this.value;
        if (Object.is(current, option.value)) return true;
        if (current === null || current === undefined || option.value === null || option.value === undefined) {
            return false;
        }
        return String(current) === String(option.value);
    }

    toggle(): void {
        if (this.disabled) return;
        this.isOpen ? this.close() : this.open();
    }

    open(): void {
        if (this.disabled || this.isOpen) return;
        this.isOpen = true;
        this.activeIndex = Math.max(
            0,
            this.options.findIndex((option) => this.isSelected(option)),
        );
        setTimeout(() => this.positionMenu());
    }

    close(): void {
        this.isOpen = false;
    }

    select(option: CrmModalSelectOption): void {
        this.value = option.value;
        this.onChange(option.value);
        this.onTouched();
        this.close();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (this.disabled) return;
        const lastIndex = Math.max(0, this.options.length - 1);
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault();
                if (!this.isOpen) {
                    this.open();
                } else {
                    this.activeIndex = Math.min(lastIndex, this.activeIndex + 1);
                }
                break;
            case "ArrowUp":
                event.preventDefault();
                if (this.isOpen) this.activeIndex = Math.max(0, this.activeIndex - 1);
                break;
            case "Enter":
            case " ":
                event.preventDefault();
                if (!this.isOpen) {
                    this.open();
                } else {
                    const option = this.options[this.activeIndex];
                    if (option) this.select(option);
                }
                break;
            case "Escape":
                if (this.isOpen) {
                    event.preventDefault();
                    this.close();
                }
                break;
            case "Home":
                if (this.isOpen) {
                    event.preventDefault();
                    this.activeIndex = 0;
                }
                break;
            case "End":
                if (this.isOpen) {
                    event.preventDefault();
                    this.activeIndex = lastIndex;
                }
                break;
        }
    }

    writeValue(value: unknown): void {
        this.value = value ?? "";
    }

    registerOnChange(fn: (value: unknown) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Se escucha antes del click del disparador. Así el click que abre el
    // menú no vuelve a cerrarlo durante la misma burbuja de eventos.
    @HostListener("document:pointerdown", ["$event"])
    onDocumentPointerDown(event: PointerEvent): void {
        if (!this.isOpen) return;
        const target = event.target as HTMLElement | null;
        const inside = this.host.nativeElement.contains(target) || this.root?.nativeElement.contains(target);
        if (!inside) this.close();
    }

    private positionMenu(): void {
        const button = this.trigger?.nativeElement;
        if (!button || !this.isOpen) return;
        const rect = button.getBoundingClientRect();
        const estimatedHeight = Math.min(this.options.length * OPTION_HEIGHT_PX + 12, MENU_MAX_HEIGHT_PX);
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom - MENU_MARGIN_PX;
        const openUpward = estimatedHeight > spaceBelow && rect.top > estimatedHeight + MENU_MARGIN_PX;
        this.menuTop = openUpward ? Math.max(MENU_MARGIN_PX, rect.top - estimatedHeight - 2) : rect.bottom + 2;
        this.menuLeft = Math.max(MENU_MARGIN_PX, Math.min(rect.left, window.innerWidth - rect.width - MENU_MARGIN_PX));
        this.menuWidth = rect.width;
        this.menuMaxHeight = Math.min(MENU_MAX_HEIGHT_PX, (openUpward ? rect.top : spaceBelow) - MENU_MARGIN_PX);
    }
}
