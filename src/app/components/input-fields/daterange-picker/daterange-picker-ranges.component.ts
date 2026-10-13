import { Component, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgxDaterangepickerBootstrapDirective } from "ngx-daterangepicker-bootstrap";
import dayjs, { Dayjs } from "dayjs";
import { DatePipe } from "@angular/common";

export function formatDate(date: any, format: string): string {
    return new DatePipe("es-ES").transform(date, format)!.toString();
}

@Component({
    selector: "app-daterange-picker-ranges",
    standalone: true,
    imports: [FormsModule, NgxDaterangepickerBootstrapDirective],
    template: ` <div class="input-group">
        <input
            type="text"
            id=""
            class="form-control"
            style="box-shadow: none; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;"
            readonly
            ngxDaterangepickerBootstrap
            [(ngModel)]="selectedSimpleCalendarAutoUpLeft"
            [drops]="dropsDown"
            [opens]="opensLeft"
            [locale]="locale"
            [showCancel]="false"
            [linkedCalendars]="true"
            [alwaysShowCalendars]="true"
            [showRangeLabelOnInput]="false"
            [keepCalendarOpeningWithRange]="true"
            [closeOnAutoApply]="true"
            [autoApply]="false"
            [isTooltipDate]="isTooltipDate"
            [isCustomDate]="isCustomDate"
            [isInvalidDate]="isInvalidDate"
            [ranges]="ranges"
            (datesUpdated)="datesUpdatedRange($event)" />
        <a class="input-group-text text-theme-1 ngx-daterangepicker-action" (click)="openDatepicker()">
            <i class="bi bi-calendar-week z-index-0 ngx-daterangepicker-action" (click)="openDatepicker()"></i>
        </a>
    </div>`,
})
export class DaterangePickerRangesComponent {
    @ViewChild(NgxDaterangepickerBootstrapDirective, { static: false }) pickerDirective!: NgxDaterangepickerBootstrapDirective;

    dropsDown: string = "down";
    dropsUp: string = "up";
    opensRight: string = "right";
    opensCenter: string = "center";
    opensLeft: string = "left";
    selectedRangeCalendarTimeRight: any;
    selectedRangeCalendarCenter: any;
    selectedRangeCalendarAutoLeft: any;
    selectedSingleCalendarTimeRight: any;
    selectedSingleCalendarCenter: any;
    selectedSingleCalendarAutoLeft: any;
    selectedSimpleCalendarTimeUpRight: any;
    selectedSimpleCalendarUpCenter: any;
    selectedSimpleCalendarAutoUpLeft: any;
    selectedRangeCalendarTimeInline: any;
    maxDate?: Dayjs;
    minDate?: Dayjs;
    invalidDates: Dayjs[] = [];
    ranges: any = {
        Hoy: [dayjs(), dayjs()],
        Ayer: [dayjs().subtract(1, "days"), dayjs().subtract(1, "days")],
        "Ultimos 7 dias": [dayjs().subtract(6, "days"), dayjs()],
        "Ultimos 30 dias": [dayjs().subtract(29, "days"), dayjs()],
        "Este mes": [dayjs().startOf("month"), dayjs().endOf("month")],
        "Mes pasado": [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
    };
    locale: {
        firstDay: number;
        startDate: Dayjs;
        endDate: Dayjs;
        format: string;
    } = {
        firstDay: 1,
        startDate: dayjs().startOf("day"),
        endDate: dayjs().endOf("day"),
        format: "DD-MM-YYYY",
    };
    tooltips: { date: Dayjs; text: string }[] = [
        { date: dayjs(), text: "Hoy no esta disponible para seleccionar" },
        { date: dayjs().add(2, "days"), text: "Si!!!" },
    ];

    public currentDay: { start: string; end: string; label: string } = {
        start: formatDate(dayjs().startOf("day"), "yyyy-MM-dd"),
        end: formatDate(dayjs().endOf("day"), "yyyy-MM-dd"),
        label: "Hoy",
    };

    constructor() {
        this.selectedRangeCalendarTimeRight = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
        this.selectedRangeCalendarCenter = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
        this.selectedRangeCalendarAutoLeft = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
        this.selectedSingleCalendarTimeRight = dayjs().startOf("day");
        this.selectedSingleCalendarCenter = dayjs().startOf("day");
        this.selectedSingleCalendarAutoLeft = dayjs().startOf("day");
        this.selectedSimpleCalendarTimeUpRight = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
        this.selectedSimpleCalendarUpCenter = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
        this.selectedSimpleCalendarAutoUpLeft = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
        this.selectedRangeCalendarTimeInline = {
            startDate: dayjs().startOf("day"),
            endDate: dayjs().endOf("day"),
        };
    }

    isInvalidDate: (m: Dayjs) => boolean = (m: Dayjs): boolean => {
        return this.invalidDates.some((d: Dayjs): boolean => d.isSame(m, "day"));
    };

    isCustomDate: (date: Dayjs) => string | boolean = (date: Dayjs): string | boolean => {
        return date.month() === 0 || date.month() === 6 ? "mycustomdate" : false;
    };

    isTooltipDate: (m: Dayjs) => string | boolean = (m: Dayjs): string | boolean => {
        const tooltip: { date: Dayjs; text: string } | undefined = this.tooltips.find((tt: { date: Dayjs; text: string }): boolean => tt.date.isSame(m, "day"));
        return tooltip ? tooltip.text : false;
    };

    datesUpdatedRange($event: Object) {
        // console.log("range", $event);
    }

    datesUpdatedSingle($event: any) {
        //console.log("single", $event);
    }

    datesUpdatedInline($event: Object) {
        //console.log("inline", $event);
    }

    openDatepicker() {
        this.pickerDirective.open();
        // console.log();
    }
}
