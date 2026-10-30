import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { forkJoin } from "rxjs";
import { EmployeeRow, EmployeeSoftDeletePayload, HrApiService } from "../../../../services/hr-api.service";
import { FormDraftService } from "../../../../services/form-draft.service";

const HR_EMPLOYEES_DRAFT_KEY = "app.company.hr-employees.catalogs";

@Component({
    selector: "app-company-hr-employees",
    standalone: true,
    imports: [RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button" (click)="restoreCatalogDefaults()">Restaurar catalogos</button>
                    <a class="btn btn-outline-theme me-2" routerLink="/app/work-workload">Ver carga laboral</a>
                    <a class="btn btn-theme" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-employees', new: 1 }">Agregar empleado</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-hr-dashboard">Recursos Humanos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Empleados</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Total empleados</p>
                            <h4 class="mb-0">{{ employees.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Con expediente completo</p>
                            <h4 class="mb-0">{{ completeFiles }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Con alerta documental</p>
                            <h4 class="mb-0">{{ employees.length - completeFiles }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Catalogos RRHH (cargos y departamentos)</h6>
                    <p class="text-secondary small mb-0">Estas opciones se asignan luego en la ficha profesional del colaborador</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3">
                        <div class="col-12 col-lg-6">
                            <label class="form-label">Nuevo cargo / puesto</label>
                            <div class="input-group mb-3">
                                <input class="form-control" type="text" placeholder="Ej: Coordinador SST" [(ngModel)]="draftPosition" />
                                <button class="btn btn-outline-theme" type="button" (click)="addPosition()">Agregar</button>
                            </div>
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Cargo</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (position of positionCatalog; track position) {
                                            <tr>
                                                <td>{{ position }}</td>
                                                <td class="text-end">
                                                    <button class="btn btn-link text-danger btn-sm" type="button" (click)="removePosition(position)"><i class="bi bi-trash"></i></button>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="col-12 col-lg-6">
                            <label class="form-label">Nuevo departamento / unidad</label>
                            <div class="input-group mb-3">
                                <input class="form-control" type="text" placeholder="Ej: Gestion Humana" [(ngModel)]="draftDepartment" />
                                <button class="btn btn-outline-theme" type="button" (click)="addDepartment()">Agregar</button>
                            </div>
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Departamento</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (department of departmentCatalog; track department) {
                                            <tr>
                                                <td>{{ department }}</td>
                                                <td class="text-end">
                                                    <button class="btn btn-link text-danger btn-sm" type="button" (click)="removeDepartment(department)"><i class="bi bi-trash"></i></button>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="text-end mt-3">
                        <button class="btn btn-theme" type="button" (click)="saveCatalogs()">Guardar catalogos</button>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Directorio de colaboradores</h6>
                    <p class="text-secondary small mb-0">Consulta y acceso rapido a la ficha profesional</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Puesto</th>
                                    <th>Departamento</th>
                                    <th>Responsable</th>
                                    <th>Estado</th>
                                    <th>Expediente</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (employee of employees; track employee.id) {
                                    <tr>
                                        <td>{{ employee.id }}</td>
                                        <td>{{ employee.name }}</td>
                                        <td>{{ employee.role }}</td>
                                        <td>{{ employee.department }}</td>
                                        <td>{{ employee.manager }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.bg-success]="employee.status === 'Activo'" [class.bg-secondary]="employee.status !== 'Activo'">{{ employee.status }}</span>
                                            <!-- Identidad unificada: sin cuenta enlazada (users) el empleado no puede entrar. -->
                                            @if (employee.userId) {
                                                <span class="badge rounded-pill text-bg-info ms-1" title="Cuenta de login enlazada">Cuenta</span>
                                            } @else {
                                                <span class="badge rounded-pill text-bg-warning ms-1" title="Empleado sin cuenta de login: edita la ficha y creala">Sin cuenta</span>
                                            }
                                        </td>
                                        <td>
                                            <span class="badge" [class.text-bg-success]="employee.fileComplete" [class.text-bg-warning]="!employee.fileComplete">{{ employee.fileComplete ? 'Completo' : 'Pendiente' }}</span>
                                        </td>
                                        <td class="text-end">
                                            <div class="btn-group">
                                                <a class="btn btn-sm btn-outline-theme" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-employees', employeeId: employee.id }">
                                                    Ver ficha
                                                </a>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="deactivateEmployee(employee)" [disabled]="employee.status === 'Inactivo'">
                                                    {{ employee.status === 'Inactivo' ? 'Inactivo' : 'Desactivar' }}
                                                </button>
                                            </div>
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
export class CompanyHrEmployeesComponent implements OnInit {
    message = "";
    draftPosition = "";
    draftDepartment = "";
    pendingSoftDeletePayloads: EmployeeSoftDeletePayload[] = [];

    positionCatalog: string[] = [];
    departmentCatalog: string[] = [];
    employees: EmployeeRow[] = [];
    private stopDraftWatch: () => void = () => undefined;

    constructor(
        private readonly hrApi: HrApiService,
        private readonly cdr: ChangeDetectorRef,
        private readonly formDraftService: FormDraftService,
    ) {}

    ngOnInit(): void {
        const draft = this.formDraftService.load<{ draftPosition?: string; draftDepartment?: string }>(HR_EMPLOYEES_DRAFT_KEY);
        if (draft) {
            this.draftPosition = String(draft.draftPosition ?? "");
            this.draftDepartment = String(draft.draftDepartment ?? "");
        }

        this.stopDraftWatch = this.formDraftService.watch(HR_EMPLOYEES_DRAFT_KEY, () => ({
            draftPosition: this.draftPosition,
            draftDepartment: this.draftDepartment,
        }));

        this.loadViewData();
    }

    ngOnDestroy(): void {
        this.stopDraftWatch();
    }

    get completeFiles(): number {
        return this.employees.filter((employee) => employee.fileComplete).length;
    }

    addPosition(): void {
        const value = this.normalizeCatalogValue(this.draftPosition);
        if (!value) {
            this.message = "Escribe un cargo valido para agregarlo.";
            return;
        }

        if (this.positionCatalog.includes(value)) {
            this.message = "Ese cargo ya existe en el catalogo.";
            return;
        }

        this.positionCatalog = [value, ...this.positionCatalog];
        this.draftPosition = "";
        this.saveCatalogs("Cargo agregado al catalogo.");
    }

    removePosition(position: string): void {
        this.positionCatalog = this.positionCatalog.filter((item) => item !== position);
        this.saveCatalogs("Cargo eliminado del catalogo.");
    }

    addDepartment(): void {
        const value = this.normalizeCatalogValue(this.draftDepartment);
        if (!value) {
            this.message = "Escribe un departamento valido para agregarlo.";
            return;
        }

        if (this.departmentCatalog.includes(value)) {
            this.message = "Ese departamento ya existe en el catalogo.";
            return;
        }

        this.departmentCatalog = [value, ...this.departmentCatalog];
        this.draftDepartment = "";
        this.saveCatalogs("Departamento agregado al catalogo.");
    }

    removeDepartment(department: string): void {
        this.departmentCatalog = this.departmentCatalog.filter((item) => item !== department);
        this.saveCatalogs("Departamento eliminado del catalogo.");
    }

    saveCatalogs(successMessage = "Catalogos de cargos y departamentos guardados."): void {
        this.hrApi
            .syncCatalogs({
                positions: this.positionCatalog,
                departments: this.departmentCatalog,
            })
            .subscribe({
                next: (catalogs) => {
                    this.positionCatalog = catalogs.positions.map((item) => this.normalizeCatalogValue(item.name));
                    this.departmentCatalog = catalogs.departments.map((item) => this.normalizeCatalogValue(item.name));
                    this.message = successMessage;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.message = "No se pudieron guardar los catalogos en backend.";
                    this.cdr.detectChanges();
                },
            });
    }

    deactivateEmployee(employee: EmployeeRow): void {
        if (employee.status === "Inactivo") {
            return;
        }

        const previousStatus = employee.status;
        employee.status = "Inactivo";
        const payload = this.buildSoftDeletePayload(employee.id);
        this.pendingSoftDeletePayloads.push(payload);

        this.hrApi.softDeleteEmployees([payload]).subscribe({
            next: (processed) => {
                if (processed <= 0) {
                    employee.status = previousStatus;
                    this.message = `No fue posible desactivar a ${employee.name}.`;
                    this.cdr.detectChanges();
                    return;
                }
                this.message = `Empleado ${employee.name} desactivado correctamente.`;
                this.cdr.detectChanges();
            },
            error: () => {
                employee.status = previousStatus;
                this.message = `No fue posible desactivar a ${employee.name}.`;
                this.cdr.detectChanges();
            },
        });
    }

    restoreCatalogDefaults(): void {
        this.hrApi.restoreCatalogDefaults().subscribe({
            next: (catalogs) => {
                this.positionCatalog = catalogs.positions.map((item) => this.normalizeCatalogValue(item.name));
                this.departmentCatalog = catalogs.departments.map((item) => this.normalizeCatalogValue(item.name));
                this.message = "Catalogos restaurados a valores base.";
                this.cdr.detectChanges();
            },
            error: () => {
                this.message = "No fue posible restaurar catalogos desde backend.";
                this.cdr.detectChanges();
            },
        });
    }

    private normalizeCatalogValue(value: string): string {
        return value.trim().replace(/\s+/g, " ");
    }

    private ensureCatalogContains(target: string[], value: string): void {
        const normalized = this.normalizeCatalogValue(value);
        if (!normalized || target.includes(normalized)) {
            return;
        }

        target.push(normalized);
    }

    private buildSoftDeletePayload(employeeId: string): EmployeeSoftDeletePayload {
        return {
            employeeId,
            action: "SOFT_DELETE",
            status: "INACTIVO",
            softDelete: true,
            requestedAt: new Date().toISOString(),
            source: "company-hr-employees",
        };
    }

    private defaultPositions(): string[] {
        return ["Coordinador SST", "Tecnico soporte", "Tecnico de campo", "Analista RRHH"];
    }

    private defaultDepartments(): string[] {
        return ["Gestion Humana", "Operaciones", "Comercial", "Finanzas"];
    }

    private loadViewData(): void {
        forkJoin({
            catalogs: this.hrApi.catalogs(),
            employees: this.hrApi.listEmployees(),
        }).subscribe({
            next: ({ catalogs, employees }) => {
                this.positionCatalog = catalogs.positions.map((item) => this.normalizeCatalogValue(item.name));
                this.departmentCatalog = catalogs.departments.map((item) => this.normalizeCatalogValue(item.name));
                this.employees = employees;

                this.employees.forEach((employee) => {
                    this.ensureCatalogContains(this.positionCatalog, employee.role);
                    this.ensureCatalogContains(this.departmentCatalog, employee.department);
                });
                this.cdr.detectChanges();
            },
            error: () => {
                this.positionCatalog = this.defaultPositions();
                this.departmentCatalog = this.defaultDepartments();
                this.employees = [];
                this.message = "No fue posible cargar datos de RRHH desde backend.";
                this.cdr.detectChanges();
            },
        });
    }
}
