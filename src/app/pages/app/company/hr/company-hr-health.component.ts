import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

type HealthStatus = "Al dia" | "Por vencer" | "Vencido";

interface HealthRecord {
    id: string;
    employeeId: string;
    employee: string;
    examType: string;
    lastExam: string;
    nextDue: string;
    eps: string;
    bloodType: string;
    allergies: string;
    status: HealthStatus;
}

interface EmployeeOption {
    id: string;
    name: string;
}

@Component({
    selector: "app-company-hr-health",
    standalone: true,
    imports: [RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">

                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button" (click)="restoreDefaults()">Restaurar mock</button>
                    <button class="btn btn-theme" type="button" (click)="saveMockHealth()">Guardar matriz</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-hr-dashboard">Recursos Humanos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Salud ocupacional</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }

            <div class="alert alert-warning border mb-3 mb-lg-4" role="alert">
                <strong>Datos sensibles:</strong> Esta seccion debe tener control de acceso por rol y trazabilidad de consulta.
            </div>

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Registros medicos</p>
                            <h4 class="mb-0">{{ healthMatrix.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Examenes por vencer</p>
                            <h4 class="mb-0">{{ dueSoonCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Examenes vencidos</p>
                            <h4 class="mb-0">{{ expiredCount }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Programar examen medico</h6>
                    <p class="text-secondary small mb-0">Misma estructura de salud usada en la ficha profesional</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end">
                        <div class="col-12 col-md-3">
                            <label class="form-label">Empleado</label>
                            <select class="form-select" [(ngModel)]="draftEmployeeId">
                                @for (employee of employees; track employee.id) {
                                    <option [value]="employee.id">{{ employee.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Tipo de examen</label>
                            <select class="form-select" [(ngModel)]="draftExamType">
                                @for (examType of examTypeOptions; track examType) {
                                    <option [value]="examType">{{ examType }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label">Ultimo examen</label>
                            <input class="form-control" type="date" [(ngModel)]="draftLastExam" />
                        </div>
                        <div class="col-6 col-md-2">
                            <label class="form-label">Proximo venc.</label>
                            <input class="form-control" type="date" [(ngModel)]="draftNextDue" />
                        </div>
                        <div class="col-12 col-md-2 text-md-end">
                            <button class="btn btn-outline-theme w-100" type="button" (click)="addHealthRecord()">Programar</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Control de examenes medicos</h6>
                    <p class="text-secondary small mb-0">Fechas de ultimo examen y proximo vencimiento</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Ultimo examen</th>
                                    <th>Proximo vencimiento</th>
                                    <th>Tipo examen</th>
                                    <th>EPS</th>
                                    <th>Tipo sangre</th>
                                    <th>Alergias</th>
                                    <th>Estado</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of healthMatrix; track row.id) {
                                    <tr>
                                        <td>{{ row.employee }}</td>
                                        <td>{{ row.lastExam }}</td>
                                        <td>{{ row.nextDue }}</td>
                                        <td>{{ row.examType }}</td>
                                        <td>{{ row.eps }}</td>
                                        <td>{{ row.bloodType }}</td>
                                        <td>{{ row.allergies }}</td>
                                        <td>
                                            <span class="badge" [class.text-bg-success]="row.status === 'Al dia'" [class.text-bg-danger]="row.status === 'Vencido'" [class.text-bg-warning]="row.status === 'Por vencer'">
                                                {{ row.status }}
                                            </span>
                                        </td>
                                        <td class="text-end">
                                            <a class="btn btn-link btn-sm" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-health', employeeId: row.employeeId }"><i class="bi bi-eye"></i></a>
                                            <button class="btn btn-link text-danger btn-sm" type="button" (click)="removeHealthRecord(row.id)"><i class="bi bi-trash"></i></button>
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
export class CompanyHrHealthComponent implements OnInit {
    private readonly storageKey = "lars.hr.health.matrix";

    readonly employees: EmployeeOption[] = [
        { id: "EMP-001", name: "Ludwig Angarita" },
        { id: "EMP-002", name: "Danny Ramirez" },
        { id: "EMP-003", name: "Elkin Ramirez" },
        { id: "EMP-004", name: "Maria Londono" },
    ];

    readonly examTypeOptions = ["Ingreso", "Periodico", "Egreso", "Post incapacidad"];

    message = "";
    draftEmployeeId = this.employees[0].id;
    draftExamType = this.examTypeOptions[1];
    draftLastExam = this.todayAsDateInput();
    draftNextDue = this.nextYearAsDateInput();

    healthMatrix: HealthRecord[] = this.defaultRecords();

    ngOnInit(): void {
        this.restoreFromStorage();
    }

    get dueSoonCount(): number {
        return this.healthMatrix.filter((record) => record.status === "Por vencer").length;
    }

    get expiredCount(): number {
        return this.healthMatrix.filter((record) => record.status === "Vencido").length;
    }

    addHealthRecord(): void {
        const employee = this.employees.find((item) => item.id === this.draftEmployeeId);
        if (!employee || !this.draftLastExam || !this.draftNextDue) {
            this.message = "Completa empleado y fechas para programar el examen.";
            return;
        }

        const existing = this.healthMatrix.find((record) => record.employeeId === employee.id);
        const template = existing ?? {
            id: this.buildId("health"),
            employeeId: employee.id,
            employee: employee.name,
            eps: "Sin definir",
            bloodType: "--",
            allergies: "No registra",
            examType: this.draftExamType,
            lastExam: this.draftLastExam,
            nextDue: this.draftNextDue,
            status: "Al dia" as HealthStatus,
        };

        const updatedRecord: HealthRecord = {
            ...template,
            examType: this.draftExamType,
            lastExam: this.draftLastExam,
            nextDue: this.draftNextDue,
            status: this.computeStatus(this.draftNextDue),
        };

        if (existing) {
            this.healthMatrix = this.healthMatrix.map((record) => (record.id === existing.id ? updatedRecord : record));
        } else {
            this.healthMatrix = [updatedRecord, ...this.healthMatrix];
        }

        this.message = `Examen ${this.draftExamType.toLowerCase()} programado para ${employee.name}.`;
        this.persistStorage();
    }

    removeHealthRecord(id: string): void {
        this.healthMatrix = this.healthMatrix.filter((record) => record.id !== id);
        this.message = "Registro medico eliminado del mock.";
        this.persistStorage();
    }

    saveMockHealth(): void {
        this.persistStorage();
        this.message = "Matriz de salud guardada localmente.";
    }

    restoreDefaults(): void {
        this.healthMatrix = this.defaultRecords();
        this.message = "Matriz de salud restaurada a valores base.";

        if (typeof window !== "undefined") {
            window.localStorage.removeItem(this.storageKey);
        }
    }

    private computeStatus(nextDue: string): HealthStatus {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(`${nextDue}T00:00:00`);

        if (Number.isNaN(dueDate.getTime())) {
            return "Vencido";
        }

        if (dueDate < today) {
            return "Vencido";
        }

        const diffDays = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 45) {
            return "Por vencer";
        }

        return "Al dia";
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
            const parsed = JSON.parse(raw) as HealthRecord[];
            if (Array.isArray(parsed) && parsed.length) {
                this.healthMatrix = parsed.map((record) => ({
                    ...record,
                    status: this.computeStatus(record.nextDue),
                }));
            }
        } catch {
            this.healthMatrix = this.defaultRecords();
        }
    }

    private persistStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        const normalized = this.healthMatrix.map((record) => ({
            ...record,
            status: this.computeStatus(record.nextDue),
        }));
        this.healthMatrix = normalized;
        window.localStorage.setItem(this.storageKey, JSON.stringify(normalized));
    }

    private defaultRecords(): HealthRecord[] {
        return [
            {
                id: "health-001",
                employeeId: "EMP-001",
                employee: "Ludwig Angarita",
                examType: "Periodico",
                lastExam: "2026-01-12",
                nextDue: "2027-01-12",
                eps: "Sura",
                bloodType: "O+",
                allergies: "Ninguna",
                status: "Al dia",
            },
            {
                id: "health-002",
                employeeId: "EMP-002",
                employee: "Danny Ramirez",
                examType: "Periodico",
                lastExam: "2025-06-30",
                nextDue: "2026-06-30",
                eps: "Nueva EPS",
                bloodType: "A+",
                allergies: "Polen",
                status: "Por vencer",
            },
            {
                id: "health-003",
                employeeId: "EMP-003",
                employee: "Elkin Ramirez",
                examType: "Periodico",
                lastExam: "2024-11-05",
                nextDue: "2025-11-05",
                eps: "Sanitas",
                bloodType: "B+",
                allergies: "Ninguna",
                status: "Vencido",
            },
        ].map((record) => ({
            ...record,
            status: this.computeStatus(record.nextDue),
        }));
    }

    private todayAsDateInput(): string {
        return new Date().toISOString().slice(0, 10);
    }

    private nextYearAsDateInput(): string {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date.toISOString().slice(0, 10);
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }
}
