import { Component, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgxDaterangepickerBootstrapComponent } from "ngx-daterangepicker-bootstrap";
import dayjs, { Dayjs } from "dayjs";
import { DatePipe } from "@angular/common";

export function formatDate(date: any, format: string): string {
    return new DatePipe("en-US").transform(date, format)!.toString();
}

@Component({
    selector: "app-date-picker-inline",
    standalone: true,
    imports: [FormsModule, NgxDaterangepickerBootstrapComponent],
    template: `<div class="px-3 mt-2">
            <div class="row gx-3 align-items-center">
                <div class=" col-auto">
                    <i class="bi bi-calendar-event h5 avatar avatar-40 bg-theme-1-subtle text-theme-1 rounded"></i>
                </div>
                <div class="col">
                    <h6 class="todaysdate mb-0">{{ formatDate(selectedDateRange?.endDate) }}</h6>
                    <p class="text-secondary small">Selected Date</p>
                </div>
            </div>
        </div>
        <div class="text-center">
            <ngx-daterangepicker-bootstrap [locale]="pickerOptions.locale" [alwaysShowCalendars]="pickerOptions.alwaysShowCalendars" [singleDatePicker]="pickerOptions.singleDatePicker" [showClearButton]="pickerOptions.showClearButton" [linkedCalendars]="pickerOptions.linkedCalendars" [ranges]="false" (chosenDate)="onChosenDate($event)" [startDate]="selectedDateRange?.startDate" [endDate]="selectedDateRange?.endDate" [autoApply]="true"> </ngx-daterangepicker-bootstrap>
        </div>`,
})
export class DatePickerInlineComponent {
    selectedDateRange: { startDate: dayjs.Dayjs; endDate: dayjs.Dayjs } | null = null;

    pickerOptions: any = {
        locale: { format: "yyyy-MM-dd" },
        alwaysShowCalendars: true,
        showClearButton: true,
        linkedCalendars: true,
        singleDatePicker: true,
    };

    constructor() {}

    ngOnInit(): void {
        this.selectedDateRange = {
            startDate: dayjs().subtract(7, "days"),
            endDate: dayjs(),
        };
    }

    onChosenDate(event: any): void {
        //console.log("Chosen Date from Inline Picker:", event);
        if (event && event.startDate && event.endDate) {
            this.selectedDateRange = {
                startDate: event.startDate,
                endDate: event.endDate,
            };
        } else {
            this.selectedDateRange = null;
        }
    }
    formatDate(date: dayjs.Dayjs | undefined): string {
        return date ? dayjs(date.toDate()).format("yyyy-MM-dd") : "N/A";
    }
}
