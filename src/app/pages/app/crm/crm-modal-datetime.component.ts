import { CommonModule } from "@angular/common";
import { Component, ElementRef, forwardRef, HostListener, Input, OnDestroy, ViewChild } from "@angular/core";
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from "@angular/forms";

import {
    buildCalendarDays,
    CalendarDay,
    monthLabel,
    parseIsoToParts,
    partsToIso,
    shiftMonth,
    WEEKDAY_LABELS,
} from "./crm-modal-calendar.logic";

const MENU_MARGIN_PX = 8;

@Component({
    selector: "app-crm-modal-datetime",
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => CrmModalDateTimeComponent),
            multi: true,
        },
    ],
    template: `
        <div class="crm-modal-dt" #root>
            <button
                #trigger
                type="button"
                class="form-select text-start d-flex align-items-center justify-content-between"
                [disabled]="disabled"
                [attr.aria-expanded]="isOpen"
                [attr.data-testid]="testId"
                (click)="toggle()"
                (keydown.escape)="isOpen && $event.stopPropagation(); close()">
                <span class="text-truncate" [class.text-secondary]="!displayLabel">{{ displayLabel || placeholder }}</span>
            </button>
            <div
                class="crm-modal-dt-menu"
                *ngIf="isOpen"
                [style.top.px]="menuTop"
                [style.left.px]="menuLeft">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <button type="button" class="btn btn-sm btn-link px-1" (click)="moveMonth(-1)" aria-label="Mes anterior"><i class="bi bi-chevron-left"></i></button>
                    <span class="fw-semibold text-capitalize">{{ calendarMonthLabel }}</span>
                    <button type="button" class="btn btn-sm btn-link px-1" (click)="moveMonth(1)" aria-label="Mes siguiente"><i class="bi bi-chevron-right"></i></button>
                </div>
                <div class="crm-modal-dt-grid">
                    <span class="crm-modal-dt-dow" *ngFor="let dow of weekdayLabels">{{ dow }}</span>
                    <button
                        type="button"
                        *ngFor="let day of calendarDays; trackBy: trackByDateKey"
                        class="crm-modal-dt-day"
                        [class.other-month]="day.otherMonth"
                        [class.today]="day.isToday"
                        [class.selected]="day.selected"
                        [disabled]="day.otherMonth"
                        [attr.data-date]="day.dateKey"
                        (click)="pickDay(day)">
                        {{ day.number }}
                    </button>
                </div>
                <div class="d-flex align-items-center gap-1 mt-2">
                    <input
                        type="number"
                        class="form-control form-control-sm text-center"
                        min="0"
                        max="23"
                        [(ngModel)]="hourText"
                        (ngModelChange)="onTimeInput()"
                        data-testid="dt-hour"
                        aria-label="Hora" />
                    <span class="text-secondary">:</span>
                    <input
                        type="number"
                        class="form-control form-control-sm text-center"
                        min="0"
                        max="59"
                        [(ngModel)]="minuteText"
                        (ngModelChange)="onTimeInput()"
                        data-testid="dt-minute"
                        aria-label="Minutos" />
                    <button type="button" class="btn btn-sm btn-link ms-auto px-1" (click)="setNow()">Ahora</button>
                    <button type="button" class="btn btn-sm btn-link text-danger px-1" *ngIf="value" (click)="clear()">Limpiar</button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
            }
            .crm-modal-dt-menu {
                position: fixed;
                z-index: 3000;
                background: var(--bs-body-bg, #fff);
                border: 1px solid var(--bs-border-color, #dee2e6);
                border-radius: 0.375rem;
                box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.18);
                padding: 0.75rem;
                width: 280px;
            }
            .crm-modal-dt-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
            }
            .crm-modal-dt-dow {
                text-align: center;
                font-size: 0.75rem;
                color: var(--bs-secondary-color, #6c757d);
                padding: 0.2rem 0;
            }
            .crm-modal-dt-day {
                border: 0;
                background: transparent;
                border-radius: 0.25rem;
                padding: 0.3rem 0;
                font-size: 0.875rem;
            }
            .crm-modal-dt-day:not(:disabled):hover {
                background: var(--bs-secondary-bg, #e9ecef);
            }
            .crm-modal-dt-day.today {
                outline: 1px solid var(--bs-primary, #0d6efd);
                outline-offset: -1px;
            }
            .crm-modal-dt-day.selected {
                background: var(--bs-primary, #0d6efd);
                color: #fff;
            }
            .crm-modal-dt-day.other-month {
                color: var(--bs-secondary-color, #6c757d);
                visibility: hidden;
            }
        `,
    ],
})
export class CrmModalDateTimeComponent implements ControlValueAccessor, OnDestroy {
    @Input() placeholder = "Seleccionar fecha y hora";
    @Input() testId: string | null = null;
    @Input() disabled = false;

    @ViewChild("trigger") private trigger?: ElementRef<HTMLButtonElement>;

    value = "";
    isOpen = false;
    viewYear = new Date().getFullYear();
    viewMonth = new Date().getMonth();
    hourText = "00";
    minuteText = "00";
    menuTop = 0;
    menuLeft = 0;
    weekdayLabels = WEEKDAY_LABELS;

    private selectedParts: { year: number; month: number; day: number } | null = null;
    private onChange: (value: string) => void = () => {};
    private onTouched: () => void = () => {};
    private readonly closeOnScroll = (): void => this.close();

    constructor(private readonly host: ElementRef<HTMLElement>) {
        document.addEventListener("scroll", this.closeOnScroll, true);
    }

    ngOnDestroy(): void {
        document.removeEventListener("scroll", this.closeOnScroll, true);
    }

    get calendarDays(): CalendarDay[] {
        const now = new Date();
        return buildCalendarDays(this.viewYear, this.viewMonth, this.selectedParts, {
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
        });
    }

    get calendarMonthLabel(): string {
        return monthLabel(this.viewYear, this.viewMonth);
    }

    get displayLabel(): string {
        if (!this.selectedParts) return "";
        const date = new Date(
            this.selectedParts.year,
            this.selectedParts.month,
            this.selectedParts.day,
            Number(this.hourText) || 0,
            Number(this.minuteText) || 0,
        );
        return new Intl.DateTimeFormat("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    trackByDateKey(_index: number, day: CalendarDay): string {
        return day.dateKey;
    }

    toggle(): void {
        if (this.disabled) return;
        this.isOpen ? this.close() : this.open();
    }

    open(): void {
        if (this.disabled || this.isOpen) return;
        if (!this.selectedParts) {
            const now = new Date();
            this.viewYear = now.getFullYear();
            this.viewMonth = now.getMonth();
        }
        this.isOpen = true;
        setTimeout(() => this.positionMenu());
    }

    close(): void {
        this.isOpen = false;
    }

    moveMonth(delta: number): void {
        const shifted = shiftMonth(this.viewYear, this.viewMonth, delta);
        this.viewYear = shifted.year;
        this.viewMonth = shifted.month;
    }

    pickDay(day: CalendarDay): void {
        const [year, monthIndex, dayNumber] = day.dateKey.split("-").map((part) => Number(part));
        this.selectedParts = { year, month: monthIndex - 1, day: dayNumber };
        this.viewYear = year;
        this.viewMonth = monthIndex - 1;
        this.emitChange();
    }

    onTimeInput(): void {
        this.hourText = this.clampText(this.hourText, 23);
        this.minuteText = this.clampText(this.minuteText, 59);
        if (this.selectedParts) this.emitChange();
    }

    setNow(): void {
        const now = new Date();
        this.selectedParts = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
        this.viewYear = now.getFullYear();
        this.viewMonth = now.getMonth();
        this.hourText = `${now.getHours()}`.padStart(2, "0");
        this.minuteText = `${now.getMinutes()}`.padStart(2, "0");
        this.emitChange();
    }

    clear(): void {
        this.selectedParts = null;
        this.value = "";
        this.onChange("");
        this.onTouched();
        this.close();
    }

    writeValue(value: string): void {
        this.value = String(value ?? "");
        const parts = parseIsoToParts(this.value);
        if (!parts) {
            this.selectedParts = null;
            return;
        }
        this.selectedParts = { year: parts.year, month: parts.month, day: parts.day };
        this.viewYear = parts.year;
        this.viewMonth = parts.month;
        this.hourText = `${parts.hour}`.padStart(2, "0");
        this.minuteText = `${parts.minute}`.padStart(2, "0");
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    @HostListener("document:click", ["$event"])
    onDocumentClick(event: MouseEvent): void {
        if (!this.isOpen) return;
        const target = event.target as HTMLElement | null;
        if (!this.host.nativeElement.contains(target)) this.close();
    }

    private emitChange(): void {
        if (!this.selectedParts) return;
        this.value = partsToIso({
            ...this.selectedParts,
            hour: Number(this.hourText) || 0,
            minute: Number(this.minuteText) || 0,
        });
        this.onChange(this.value);
        this.onTouched();
    }

    private clampText(text: string, max: number): string {
        const value = Math.max(0, Math.min(max, Number(text)));
        return Number.isNaN(value) ? "00" : `${value}`.padStart(2, "0");
    }

    private positionMenu(): void {
        const button = this.trigger?.nativeElement;
        if (!button || !this.isOpen) return;
        const rect = button.getBoundingClientRect();
        const menuWidth = 280;
        const menuHeight = 340;
        const spaceBelow = window.innerHeight - rect.bottom - MENU_MARGIN_PX;
        this.menuTop = spaceBelow >= menuHeight ? rect.bottom + 2 : Math.max(MENU_MARGIN_PX, rect.top - menuHeight);
        this.menuLeft = Math.max(MENU_MARGIN_PX, Math.min(rect.left, window.innerWidth - menuWidth - MENU_MARGIN_PX));
    }
}
