import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

type LeaveStatus = "Pendiente" | "Aprobada" | "Rechazada";
type LeaveDuration = "Dia completo" | "Multiple" | "Primera mitad" | "Segunda mitad";

interface EmployeeOption {
    id: string;
    name: string;
}

interface LeaveRequest {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: string;
    duration: LeaveDuration;
    status: LeaveStatus;
    requestDate: string;
    reason: string;
}

@Component({
    selector: "app-company-hr-leaves",
    standalone: true,
    imports: [RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">

                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button" (click)="restoreDefaults()">Restaurar mock</button>
                    <button class="btn btn-theme" type="button" (click)="saveMockRequests()">Guardar solicitudes</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-hr-dashboard">Recursos Humanos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Vacaciones y licencias</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Solicitudes registradas</p>
                            <h4 class="mb-0">{{ requests.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Pendientes</p>
                            <h4 class="mb-0">{{ pendingCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Aprobadas</p>
                            <h4 class="mb-0">{{ approvedCount }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Nueva solicitud</h6>
                    <p class="text-secondary small mb-0">Gestion centralizada de vacaciones y licencias</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Elegir miembro</label>
                            <select class="form-select" [(ngModel)]="draftEmployeeId">
                                @for (employee of employees; track employee.id) {
                                    <option [value]="employee.id">{{ employee.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Tipo de licencia</label>
                            <select class="form-select" [(ngModel)]="draftLeaveType">
                                @for (type of leaveTypeOptions; track type) {
                                    <option [value]="type">{{ type }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-2">
                            <label class="form-label">Estado</label>
                            <select class="form-select" [(ngModel)]="draftStatus">
                                @for (status of statusOptions; track status) {
                                    <option [value]="status">{{ status }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-2">
                            <label class="form-label">Fecha</label>
                            <input class="form-control" type="date" [(ngModel)]="draftRequestDate" />
                        </div>
                        <div class="col-12 col-md-2 text-md-end">
                            <button class="btn btn-outline-theme w-100" type="button" (click)="addRequest()">Guardar</button>
                        </div>
                    </div>

                    <div class="row gx-2 gy-2 mt-2">
                        @for (duration of durationOptions; track duration) {
                            <div class="col-auto">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="leaveDuration" [id]="'duration-' + duration" [value]="duration" [(ngModel)]="draftDuration" />
                                    <label class="form-check-label" [for]="'duration-' + duration">{{ duration }}</label>
                                </div>
                            </div>
                        }
                    </div>

                    <div class="mt-3">
                        <label class="form-label">Motivo de ausencia</label>
                        <textarea class="form-control" rows="2" [(ngModel)]="draftReason" placeholder="Describe el motivo de la ausencia"></textarea>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Solicitudes registradas</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Empleado</th>
                                    <th>Tipo</th>
                                    <th>Duracion</th>
                                    <th>Estado</th>
                                    <th>Motivo</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (request of requests; track request.id) {
                                    <tr>
                                        <td>{{ request.requestDate }}</td>
                                        <td>{{ request.employeeName }}</td>
                                        <td>{{ request.leaveType }}</td>
                                        <td>{{ request.duration }}</td>
                                        <td>
                                            <span class="badge" [class.text-bg-warning]="request.status === 'Pendiente'" [class.text-bg-success]="request.status === 'Aprobada'" [class.text-bg-danger]="request.status === 'Rechazada'">
                                                {{ request.status }}
                                            </span>
                                        </td>
                                        <td>{{ request.reason }}</td>
                                        <td class="text-end">
                                            <a class="btn btn-link btn-sm" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-leaves', employeeId: request.employeeId }"><i class="bi bi-eye"></i></a>
                                            <button class="btn btn-link text-danger btn-sm" type="button" (click)="removeRequest(request.id)"><i class="bi bi-trash"></i></button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CompanyHrLeavesComponent implements OnInit {
    private readonly storageKey = "lars.hr.leaves.requests";

    readonly employees: EmployeeOption[] = [
        { id: "EMP-001", name: "Ludwig Angarita" },
        { id: "EMP-002", name: "Danny Ramirez" },
        { id: "EMP-003", name: "Elkin Ramirez" },
        { id: "EMP-004", name: "Maria Londono" },
    ];

    readonly leaveTypeOptions = ["Vacaciones", "Licencia medica", "Licencia no remunerada", "Calamidad", "Licencia por estudio"];
    readonly durationOptions: LeaveDuration[] = ["Dia completo", "Multiple", "Primera mitad", "Segunda mitad"];
    readonly statusOptions: LeaveStatus[] = ["Pendiente", "Aprobada", "Rechazada"];

    message = "";
    draftEmployeeId = this.employees[0].id;
    draftLeaveType = this.leaveTypeOptions[0];
    draftDuration: LeaveDuration = "Dia completo";
    draftStatus: LeaveStatus = "Pendiente";
    draftRequestDate = this.todayAsDateInput();
    draftReason = "";

    requests: LeaveRequest[] = this.defaultRequests();

    ngOnInit(): void {
        this.restoreFromStorage();
    }

    get pendingCount(): number {
        return this.requests.filter((request) => request.status === "Pendiente").length;
    }

    get approvedCount(): number {
        return this.requests.filter((request) => request.status === "Aprobada").length;
    }

    addRequest(): void {
        const employee = this.employees.find((item) => item.id === this.draftEmployeeId);
        const reason = this.draftReason.trim();

        if (!employee || !this.draftRequestDate || !reason) {
            this.message = "Completa empleado, fecha y motivo para guardar la solicitud.";
            return;
        }

        this.requests.unshift({
            id: this.buildId("leave"),
            employeeId: employee.id,
            employeeName: employee.name,
            leaveType: this.draftLeaveType,
            duration: this.draftDuration,
            status: this.draftStatus,
            requestDate: this.draftRequestDate,
            reason,
        });

        this.draftReason = "";
        this.message = `Solicitud registrada para ${employee.name}.`;
        this.persistStorage();
    }

    removeRequest(id: string): void {
        this.requests = this.requests.filter((request) => request.id !== id);
        this.message = "Solicitud eliminada del mock.";
        this.persistStorage();
    }

    saveMockRequests(): void {
        this.persistStorage();
        this.message = "Solicitudes guardadas localmente.";
    }

    restoreDefaults(): void {
        this.requests = this.defaultRequests();
        this.message = "Solicitudes restauradas a valores base.";

        if (typeof window !== "undefined") {
            window.localStorage.removeItem(this.storageKey);
        }
    }

    private restoreFromStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        const raw = window.localStorage.getItem(this.storageKey);
        if (!raw) {
            return;
        }

        try {
            const parsed = JSON.parse(raw) as LeaveRequest[];
            if (Array.isArray(parsed) && parsed.length) {
                this.requests = parsed;
            }
        } catch {
            this.requests = this.defaultRequests();
        }
    }

    private persistStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem(this.storageKey, JSON.stringify(this.requests));
    }

    private defaultRequests(): LeaveRequest[] {
        return [
            {
                id: "leave-001",
                employeeId: "EMP-002",
                employeeName: "Danny Ramirez",
                leaveType: "Vacaciones",
                duration: "Multiple",
                status: "Pendiente",
                requestDate: "2026-04-12",
                reason: "Vacaciones familiares programadas",
            },
            {
                id: "leave-002",
                employeeId: "EMP-004",
                employeeName: "Maria Londono",
                leaveType: "Licencia medica",
                duration: "Dia completo",
                status: "Aprobada",
                requestDate: "2026-04-10",
                reason: "Incapacidad por control medico",
            },
        ];
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private todayAsDateInput(): string {
        return new Date().toISOString().slice(0, 10);
    }
}
