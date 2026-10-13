import { NgFor, NgIf } from "@angular/common";
import { Component, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, OnInit, NgZone, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import Choices, { ClassNames } from "choices.js";
import { FullCalendarModule } from "@fullcalendar/angular";
import { CalendarOptions } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listGridPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";

import { DaterangePickerRangesComponent } from "../../../components/input-fields/daterange-picker/daterange-picker-ranges.component";
import { CalendarApiService, CalendarEventRecord } from "../../../services/calendar-api.service";
import { FormDraftService } from "../../../services/form-draft.service";
import dayjs from "dayjs";

const CALENDAR_FORM_DRAFT_KEY = "app.calendar.event-form";

@Component({
    selector: "app-calendar",
    standalone: true,
    imports: [RouterLink, DaterangePickerRangesComponent, FullCalendarModule, NgIf, NgFor, FormsModule],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0 order-1">
                    <h5 class="mb-0">Calendario</h5>
                    <p class="text-secondary small">Agenda y gestiona citas</p>
                </div>
                <div class="col-12 col-sm-auto order-3 order-sm-2">
                    <app-daterange-picker-ranges class="bg-none"></app-daterange-picker-ranges>
                </div>
                <div class="col-auto ps-0 position-relative order-2 order-sm-3 mb-3 mb-sm-0">
                    <div class="dropdown d-inline-block">
                        <a class="btn btn-link btn-square no-caret dropdown-toggle" role="button" id="filterintitle" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                            <i class="bi bi-filter"></i>
                        </a>
                        <div class="dropdown-menu width-300" aria-labelledby="filterintitle">
                            <div class="p-1 mb-2">
                                <div class="input-group input-group-md rounded" style="--mw-dynamic:234px">
                                    <span class="input-group-text text-theme-1"><i class="bi bi-box"></i></span>
                                    <select class="form-control choices" #choices id="titltfilterlist" multiple>
                                        <option value="San Francisco">San Francisco</option>
                                        <option value="New York">New York</option>
                                        <option value="London">London</option>
                                        <option value="Chicago">Chicago</option>
                                        <option value="India" selected="">India</option>
                                        <option value="Sydney">Sydney</option>
                                        <option value="Seattle">Seattle</option>
                                        <option value="Los Angeles">Los Angeles</option>
                                        <option value="Indonesia">Indonesia</option>
                                        <option value="Los Angeles">Los Angeles</option>
                                        <option value="Chicago">Chicago</option>
                                        <option value="India">India</option>
                                    </select>
                                </div>
                                <div class="invalid-feedback">Ya seleccionaste el maximo de opciones permitidas. (Configurable)</div>
                            </div>
                            <div class="p-1">
                                <h6 class="mb-0">Ordenes:</h6>
                                <p class="text-secondary small">1256 ordenes la semana pasada</p>
                            </div>
                            <ul class="list-group list-group-flush bg-transparent border-0 mb-2">
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">Ordenes en linea</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="titleswitch1" />
                                                <label class="form-check-label" for="titleswitch1"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                                <li class="list-group-item">
                                    <div class="row gx-3 gx-lg-4">
                                        <div class="col">Ordenes fuera de linea</div>
                                        <div class="col-auto">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" role="switch" id="titleswitch2" checked="" />
                                                <label class="form-check-label" for="titleswitch2"></label>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                            <div class="p-1">
                                <div class="row gx-3 gx-lg-4">
                                    <div class="col"><button class="btn btn-outline-secondary border ddclose">Cancelar</button></div>
                                    <div class="col-auto">
                                        <button class="btn btn-theme">Guardar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <a routerLink="/app/company-help-center" class="btn btn-link btn-square" data-bs-toggle="tooltip" data-bs-placement="top" id="stylise">
                        <i class="bi bi-life-preserver"></i>
                    </a>
                    <a href="https://1.envato.market/7N7Br" target="_blank" class="btn btn-link btn-square" data-bs-toggle="tooltip" data-bs-placement="top">
                        <span class="bi bi-basket position-relative">
                            <span class="position-absolute top-0 start-100 p-1 bg-danger border border-light rounded-circle">
                                <span class="visually-hidden">Nuevas alertas</span>
                            </span>
                        </span>
                    </a>
                </div>
            </div>
        </div>

        <!-- content -->
        <div class="container mt-3" id="main-content">
            <!-- full calendar view -->
            <div class="row mt-4 mb-4">
                <div class="col-12 col-md-12 col-xl">
                    <!-- Calendar Third party -->
                    <div class="card adminuiux-card mb-3">
                        <div class="card-body">
                            <full-calendar [options]="calendarOptions"></full-calendar>
                        </div>
                    </div>
                </div>
                <!-- book appointment and summary -->
                <div class="col-12 col-md-12 col-xl-3 ">
                    <h6 class="mb-3">Agendar una cita</h6>
                    <div class="dropdown w-100 mb-4">
                        <button class="btn btn-link dropdown-toggle text-start no-caret w-100" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <span class="row align-items-center gx-3">
                                <div class="col-auto">
                                    <figure class="avatar avatar-40 rounded-circle coverimg">
                                        <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                    </figure>
                                </div>
                                <div class="col">
                                    <h6 class="mb-1">Sr. Ryan Sylia</h6>
                                    <p class="opacity-75 small">Gestor de fondos</p>
                                </div>
                                <div class="col-auto">
                                    <i class="bi bi-chevron-down small"></i>
                                </div>
                            </span>
                        </button>
                        <ul class="dropdown-menu w-100">
                            <li>
                                <a class="dropdown-item active" href="javascript:void(0)">
                                    <div class="row align-items-center gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-4.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-1">Sr. Ryan Sylia</p>
                                            <p class="opacity-75 small">Gestor de fondos</p>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="javascript:void(0)">
                                    <div class="row align-items-center gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-5.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-1">Sra. Angelina</p>
                                            <p class="opacity-75 small">Especialista financiera</p>
                                        </div>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="javascript:void(0)">
                                    <div class="row align-items-center gx-3">
                                        <div class="col-auto">
                                            <figure class="avatar avatar-40 rounded-circle coverimg">
                                                <img src="assets/img/modern-ai-image/user-7.jpg" alt="" />
                                            </figure>
                                        </div>
                                        <div class="col">
                                            <p class="mb-1">Sra. Smriti Vandana</p>
                                            <p class="opacity-75 small">Especialista general</p>
                                        </div>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div class="row gx-3">
                        <div class="col-12 mb-3">
                            <label class="form-label">Titulo del evento</label>
                            <input class="form-control" [(ngModel)]="newEventTitle" placeholder="Ejemplo: Reunion de seguimiento" />
                        </div>
                        <div class="col-12 col-sm-6 col-xl-12 mb-3">
                            <label class="form-label">Fecha</label>
                            <input class="form-control" type="date" [(ngModel)]="newEventDate" />
                        </div>
                        <div class="col-12 col-sm-6 col-xl-12 mb-3">
                            <label class="form-label">Hora de inicio</label>
                            <input class="form-control" type="time" [(ngModel)]="newEventStartTime" [disabled]="newEventAllDay" />
                        </div>
                        <div class="col-12 col-sm-6 col-xl-12 mb-3">
                            <label class="form-label">Hora de fin</label>
                            <input class="form-control" type="time" [(ngModel)]="newEventEndTime" [disabled]="newEventAllDay" />
                        </div>
                        <div class="col-12 mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="allDayEvent" [(ngModel)]="newEventAllDay" />
                                <label class="form-check-label" for="allDayEvent">Evento de todo el dia</label>
                            </div>
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label">Descripcion</label>
                            <textarea class="form-control" rows="3" [(ngModel)]="newEventDescription" placeholder="Notas del evento..."></textarea>
                        </div>
                        <div class="col-12 mb-3">
                            <button class="btn btn-theme w-100" type="button" (click)="createEvent()"><i class="bi bi-plus"></i> <span>Crear evento</span></button>
                            <p class="small text-secondary mt-2 mb-0" *ngIf="formMessage">{{ formMessage }}</p>
                        </div>
                        <div class="col-12 mb-4">
                            <h6 class="mb-2">Eventos recientes</h6>
                            <div class="list-group">
                                <button
                                    type="button"
                                    class="list-group-item list-group-item-action"
                                    *ngFor="let event of recentEvents"
                                    (click)="openEventModal(event)">
                                    <div class="fw-semibold">{{ event.title }}</div>
                                    <small class="text-secondary">{{ formatEventDate(event) }}</small>
                                </button>
                            </div>
                            <p class="small text-secondary mb-0" *ngIf="recentEvents.length === 0">Sin eventos por ahora.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade show" tabindex="-1" role="dialog" aria-modal="true" style="display: block;" *ngIf="isEventModalOpen && selectedEvent">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalle del evento</h5>
                        <button type="button" class="btn-close" aria-label="Close" (click)="closeEventModal()"></button>
                    </div>
                    <div class="modal-body">
                        <h6 class="mb-2">{{ selectedEvent.title }}</h6>
                        <p class="mb-2"><strong>Fecha:</strong> {{ formatEventDate(selectedEvent) }}</p>
                        <p class="mb-0"><strong>Descripcion:</strong> {{ selectedEvent.description || 'Sin descripcion' }}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-danger" (click)="deleteSelectedEvent()">Eliminar evento</button>
                        <button type="button" class="btn btn-outline-secondary" (click)="closeEventModal()">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="isEventModalOpen"></div>
    `,
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CalendarComponent implements OnInit {
    currentday = dayjs().get("date");
    thismonth = dayjs().format("MM");
    thisyear = dayjs().format("YYYY");
    private calendarEvents: CalendarEventRecord[] = [];

    newEventTitle = "";
    newEventDate = dayjs().format("YYYY-MM-DD");
    newEventStartTime = "09:00";
    newEventEndTime = "10:00";
    newEventAllDay = false;
    newEventDescription = "";
    formMessage = "";
    private stopDraftWatch: () => void = () => undefined;

    isEventModalOpen = false;
    selectedEvent: CalendarEventRecord | null = null;

    @ViewChild("choices") mySelect!: ElementRef;

    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listGridPlugin],
        locale: esLocale,
        initialView: "dayGridMonth",
        height: "auto",
        eventDidMount: (info) => {
            info.el.style.cursor = "pointer";
        },
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        buttonText: {
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Dia",
            list: "Lista",
        },
        weekends: true,
        events: [],
        dateClick: this.handleDateClick.bind(this),
        eventClick: this.handleEventClick.bind(this),
    };

    constructor(
        private readonly calendarApi: CalendarApiService,
        private readonly zone: NgZone,
        private readonly cdr: ChangeDetectorRef,
        private readonly formDraftService: FormDraftService,
    ) {}

    ngOnInit(): void {
        const draft = this.formDraftService.load<{
            newEventTitle?: string;
            newEventDate?: string;
            newEventStartTime?: string;
            newEventEndTime?: string;
            newEventAllDay?: boolean;
            newEventDescription?: string;
        }>(CALENDAR_FORM_DRAFT_KEY);

        if (draft) {
            this.newEventTitle = String(draft.newEventTitle ?? this.newEventTitle);
            this.newEventDate = String(draft.newEventDate ?? this.newEventDate);
            this.newEventStartTime = String(draft.newEventStartTime ?? this.newEventStartTime);
            this.newEventEndTime = String(draft.newEventEndTime ?? this.newEventEndTime);
            this.newEventAllDay = Boolean(draft.newEventAllDay ?? this.newEventAllDay);
            this.newEventDescription = String(draft.newEventDescription ?? this.newEventDescription);
        }

        this.stopDraftWatch = this.formDraftService.watch(CALENDAR_FORM_DRAFT_KEY, () => ({
            newEventTitle: this.newEventTitle,
            newEventDate: this.newEventDate,
            newEventStartTime: this.newEventStartTime,
            newEventEndTime: this.newEventEndTime,
            newEventAllDay: this.newEventAllDay,
            newEventDescription: this.newEventDescription,
        }));

        this.bootstrapCalendarEvents();
    }

    ngOnDestroy(): void {
        this.stopDraftWatch();
    }

    get recentEvents(): CalendarEventRecord[] {
        return [...this.calendarEvents].sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf()).slice(0, 5);
    }

    ngAfterViewInit() {
        if (!this.mySelect?.nativeElement) {
            return;
        }

        const choices = new Choices(this.mySelect.nativeElement, {
            searchEnabled: true,
            removeItemButton: true,
            classNames: {
                containerOuter: ["choices", "maxwidth-dynamic"],
            } as ClassNames,
            placeholderValue: "Escribe...",
        });
    }

    handleDateClick(arg: any): void {
        const parsed = dayjs(arg.dateStr || arg.date);
        this.newEventDate = parsed.format("YYYY-MM-DD");
        this.newEventStartTime = parsed.format("HH:mm");
        this.newEventEndTime = parsed.add(1, "hour").format("HH:mm");
        this.formMessage = `Fecha seleccionada: ${parsed.format("DD/MM/YYYY")}`;
    }

    handleEventClick(arg: any): void {
        this.openEventModal(this.toEventRecord(arg.event));
    }

    openEventModal(event: CalendarEventRecord): void {
        this.selectedEvent = event;
        this.isEventModalOpen = true;
    }

    closeEventModal(): void {
        this.isEventModalOpen = false;
        this.selectedEvent = null;
    }

    createEvent(): void {
        const title = this.newEventTitle.trim();
        if (!title) {
            this.formMessage = "Debes ingresar un titulo para el evento.";
            return;
        }

        if (!this.newEventDate) {
            this.formMessage = "Debes seleccionar una fecha valida.";
            return;
        }

        const startDateTime = this.buildStartDateTime(this.newEventDate, this.newEventStartTime, this.newEventAllDay);
        const endDateTime = this.buildEndDateTime(this.newEventDate, this.newEventEndTime, startDateTime, this.newEventAllDay);

        this.calendarApi.createEvent({
            title,
            start: startDateTime,
            end: endDateTime,
            allDay: this.newEventAllDay,
            description: this.newEventDescription.trim(),
            className: this.newEventAllDay ? "bg-success-subtle" : "bg-theme-1-subtle",
        }).subscribe({
            next: (event) => {
                this.zone.run(() => {
                    this.calendarEvents = [event, ...this.calendarEvents];
                    this.refreshCalendarEvents();
                    this.formMessage = "Evento creado correctamente.";
                    this.newEventTitle = "";
                    this.newEventDescription = "";
                    this.cdr.detectChanges();
                });
            },
            error: (error: unknown) => {
                this.zone.run(() => {
                    const message = error instanceof Error ? error.message : "No se pudo crear el evento.";
                    this.formMessage = message;
                    this.cdr.detectChanges();
                });
            },
        });
    }

    deleteSelectedEvent(): void {
        if (!this.selectedEvent) {
            return;
        }

        const selectedID = this.selectedEvent.id;
        this.calendarApi.deleteEvent(selectedID).subscribe({
            next: () => {
                this.zone.run(() => {
                    this.calendarEvents = this.calendarEvents.filter((item) => item.id !== selectedID);
                    this.refreshCalendarEvents();
                    this.closeEventModal();
                    this.formMessage = "Evento eliminado.";
                    this.cdr.detectChanges();
                });
            },
            error: (error: unknown) => {
                this.zone.run(() => {
                    const message = error instanceof Error ? error.message : "No se pudo eliminar el evento.";
                    this.formMessage = message;
                    this.cdr.detectChanges();
                });
            },
        });
    }

    formatEventDate(event: CalendarEventRecord | null): string {
        if (!event) {
            return "";
        }

        const start = dayjs(event.start);
        if (event.allDay) {
            return start.format("DD/MM/YYYY") + " (todo el dia)";
        }

        const endLabel = event.end ? ` - ${dayjs(event.end).format("HH:mm")}` : "";
        return `${start.format("DD/MM/YYYY HH:mm")}${endLabel}`;
    }

    private bootstrapCalendarEvents(): void {
        this.calendarApi.listEvents({ limit: 300 }).subscribe({
            next: (events) => {
                this.zone.run(() => {
                    this.calendarEvents = events;
                    this.refreshCalendarEvents();
                    this.cdr.detectChanges();
                });
            },
            error: () => {
                this.zone.run(() => {
                    this.calendarEvents = this.getDefaultEvents();
                    this.refreshCalendarEvents();
                    this.formMessage = "No se pudo cargar el calendario desde backend.";
                    this.cdr.detectChanges();
                });
            },
        });
    }

    private refreshCalendarEvents(): void {
        const mappedEvents = this.calendarEvents.map((item) => ({
            id: item.id,
            title: item.title,
            start: item.start,
            end: item.end,
            allDay: item.allDay,
            className: item.className || "bg-theme-1-subtle",
            extendedProps: {
                description: item.description,
            },
        }));

        this.calendarOptions = {
            ...this.calendarOptions,
            events: mappedEvents,
        };
    }

    private getDefaultEvents(): CalendarEventRecord[] {
        return [
            {
                id: this.createId("seed"),
                title: "Llamada inicial con prospecto",
                start: `${this.thisyear}-${this.thismonth}-05T10:00:00`,
                end: `${this.thisyear}-${this.thismonth}-05T11:00:00`,
                allDay: false,
                description: "Presentacion de servicios y alcance.",
                className: "bg-info-subtle",
            },
            {
                id: this.createId("seed"),
                title: "Revision de propuesta comercial",
                start: `${this.thisyear}-${this.thismonth}-${String(this.currentday).padStart(2, "0")}T15:00:00`,
                end: `${this.thisyear}-${this.thismonth}-${String(this.currentday).padStart(2, "0")}T16:00:00`,
                allDay: false,
                description: "Reunion interna con equipo de ventas.",
                className: "bg-orange-subtle",
            },
            {
                id: this.createId("seed"),
                title: "Capacitacion de equipo",
                start: `${this.thisyear}-${this.thismonth}-20T00:00:00`,
                allDay: true,
                description: "Jornada completa de capacitacion.",
                className: "bg-success-subtle",
            },
        ];
    }

    private createId(prefix = "evt"): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private buildStartDateTime(date: string, time: string, allDay: boolean): string {
        if (allDay) {
            return `${date}T00:00:00`;
        }

        return `${date}T${time}:00`;
    }

    private buildEndDateTime(date: string, time: string, startDateTime: string, allDay: boolean): string | undefined {
        if (allDay) {
            return undefined;
        }

        const rawEnd = `${date}T${time}:00`;
        if (dayjs(rawEnd).isAfter(dayjs(startDateTime))) {
            return rawEnd;
        }

        return dayjs(startDateTime).add(1, "hour").format("YYYY-MM-DDTHH:mm:ss");
    }

    private toEventRecord(calendarEvent: any): CalendarEventRecord {
        const className = Array.isArray(calendarEvent.classNames) && calendarEvent.classNames.length > 0 ? calendarEvent.classNames[0] : "bg-theme-1-subtle";
        const startRaw = typeof calendarEvent.startStr === "string" ? calendarEvent.startStr : dayjs(calendarEvent.start).format("YYYY-MM-DDTHH:mm:ss");
        const endRaw = typeof calendarEvent.endStr === "string" && calendarEvent.endStr ? calendarEvent.endStr : calendarEvent.end ? dayjs(calendarEvent.end).format("YYYY-MM-DDTHH:mm:ss") : undefined;

        return {
            id: calendarEvent.id,
            title: calendarEvent.title,
            start: startRaw.length === 10 ? `${startRaw}T00:00:00` : startRaw,
            end: endRaw,
            allDay: !!calendarEvent.allDay,
            description: typeof calendarEvent.extendedProps?.description === "string" ? calendarEvent.extendedProps.description : "",
            className,
        };
    }
}
