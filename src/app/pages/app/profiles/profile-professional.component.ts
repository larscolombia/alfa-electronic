import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HrApiService } from "../../../services/hr-api.service";
import { HrDocumentsApiService } from "../../../services/hr-documents-api.service";
import { buildCreateEmployeeRequest } from "./profile-professional-hr-create.util";
import { mapEmployeeToFormValues } from "./profile-professional-hr-load.util";

/** Tamano maximo de la foto del trabajador: ~3MB binarios (alineado con el backend). */
const PROFILE_PHOTO_MAX_FILE_BYTES = 3 * 1024 * 1024;

/** Categorias documentales estandar del expediente laboral. */
const HR_DOCUMENT_STANDARD_CATEGORIES = ["Hoja de vida", "Contrato", "Certificados", "Examenes"];

interface WorkScheduleTemplate {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    days: string[];
}

interface ActivityLogEntry {
    timestamp: string;
    actionType: string;
    actor: string;
    initials: string;
    path: string;
    detail: string;
}

@Component({
    selector: "app-profile-professional",
    standalone: true,
    imports: [RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Perfil profesional del empleado</h5>
                    <p class="text-secondary small mb-0">Vista corporativa con resumen ejecutivo y actualizacion integral del colaborador</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button">Cancelar</button>
                    @if (loadedHrEmployeeId) {
                        <button class="btn btn-outline-warning me-2" type="button" (click)="resetHrEmployeePassword()" [disabled]="resettingHrPassword"><i class="bi bi-key me-2"></i>Restablecer clave</button>
                    }
                    <button class="btn btn-theme" type="button" (click)="saveEmployeeProfile()" [disabled]="profileMode === 'actividad' || savingNewEmployee || loadingHrEmployee"><i class="bi bi-floppy me-2"></i>{{ isNewEmployeeFromHr ? 'Guardar empleado' : 'Actualizar empleado' }}</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">Perfil de empleado</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (loadingHrEmployee) {
                <div class="alert alert-light border mb-3 d-flex align-items-center" role="status">
                    <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                    Cargando ficha del empleado...
                </div>
            }
            @if (feedbackMessage) {
                <div class="alert border mb-3" [class.alert-success]="feedbackKind === 'success'" [class.alert-danger]="feedbackKind === 'error'" role="alert">{{ feedbackMessage }}</div>
            }
            <div class="card adminuiux-card mb-3 mb-lg-4 employee-summary-card">
                <div class="card-body">
                    <div class="row gx-3 gx-lg-4 align-items-start">
                        <div class="col-12 col-lg-auto text-center mb-3 mb-lg-0">
                            <figure class="avatar avatar-110 rounded-circle overflow-hidden border border-3 border-light shadow-sm mb-2">
                                <img [src]="employee.photoData || 'assets/img/modern-ai-image/user-1.jpg'" alt="Foto del trabajador" class="w-100 h-100" style="object-fit: cover;" />
                            </figure>
                            <label class="btn btn-sm btn-outline-theme mb-1" for="employeePhotoInput"><i class="bi bi-camera me-1"></i>Foto del trabajador</label>
                            <input id="employeePhotoInput" class="d-none" type="file" accept="image/*" (change)="onPhotoSelected($event)" />
                            <p class="small text-secondary mb-0">{{ employee.employeePhotoName || 'Sin foto cargada' }}</p>
                        </div>
                        <div class="col-12 col-lg">
                            <div class="d-flex flex-wrap align-items-start justify-content-between mb-3">
                                <div class="mb-2">
                                    <h4 class="mb-1">{{ fullName }} <span class="badge bg-theme-1 theme-green rounded-pill fs-12">{{ employee.employmentStatus }}</span></h4>
                                    <p class="text-secondary mb-1">{{ employee.position }} | {{ employee.serviceUnit }}</p>
                                    <p class="small mb-0">ID: {{ employee.employeeId }} | Usuario: {{ employee.accessUser }} | Jefe directo: {{ employee.manager }}</p>
                                </div>
                                <div>
                                    <p class="small text-secondary mb-1">Edicion / Actividad</p>
                                    <div class="btn-group" role="group" aria-label="Modo de perfil">
                                        <input class="btn-check" type="radio" name="profileMode" id="modeEdit" value="edicion" [(ngModel)]="profileMode" />
                                        <label class="btn btn-outline-secondary btn-sm" for="modeEdit">Edicion</label>

                                        <input class="btn-check" type="radio" name="profileMode" id="modeActivity" value="actividad" [(ngModel)]="profileMode" />
                                        <label class="btn btn-outline-secondary btn-sm" for="modeActivity">Actividad</label>
                                    </div>
                                </div>
                            </div>

                            <div class="row gx-3 gy-3">
                                <div class="col-6 col-md-3">
                                    <div class="employee-kpi">
                                        <p class="small text-secondary mb-1">Abrir tareas</p>
                                        <h5 class="mb-0">{{ summary.openTasks }}</h5>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="employee-kpi">
                                        <p class="small text-secondary mb-1">Proyectos</p>
                                        <h5 class="mb-0">{{ summary.projects }}</h5>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="employee-kpi">
                                        <p class="small text-secondary mb-1">Horas registradas</p>
                                        <h5 class="mb-0">{{ summary.loggedHours }}</h5>
                                    </div>
                                </div>
                                <div class="col-6 col-md-3">
                                    <div class="employee-kpi">
                                        <p class="small text-secondary mb-1">Tickets</p>
                                        <h5 class="mb-0">{{ summary.tickets }}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            @if (profileMode === "edicion") {
                <div class="row gx-3 gx-lg-4">
                    <div class="col-12 col-xl-7">
                        <div class="card adminuiux-card mb-3 mb-lg-4">
                            <div class="card-header">
                                <h6 class="mb-0">Informacion de perfil</h6>
                                <p class="text-secondary small mb-0">Hoja de resumen para consulta rapida</p>
                            </div>
                            <div class="card-body">
                                <div class="row gx-3 gy-3 summary-grid">
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">ID del empleado</p>
                                        <p class="mb-0">{{ employee.employeeId }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Nombre completo</p>
                                        <p class="mb-0">{{ fullName }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Cargo</p>
                                        <p class="mb-0">{{ employee.roleType }} - {{ employee.position }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Departamento</p>
                                        <p class="mb-0">{{ employee.serviceUnit }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Correo electronico</p>
                                        <p class="mb-0">{{ employee.email }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Tarifa horaria</p>
                                        <p class="mb-0">{{ formatCurrency(employee.hourlyRate) }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Fecha de ingreso</p>
                                        <p class="mb-0">{{ employee.hireDate || '--' }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Fecha de cumpleanos</p>
                                        <p class="mb-0">{{ employee.birthday || '--' }}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Contacto de emergencia</p>
                                        <p class="mb-0">{{ employee.emergencyContact }} ({{ employee.emergencyRelationship }})</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <p class="small text-secondary mb-1">Direccion de residencia</p>
                                        <p class="mb-0">{{ employee.residentialAddress || '--' }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 col-xl-5">
                        <div class="card adminuiux-card mb-3">
                            <div class="card-body">
                                <h6 class="mb-2">Reconocimiento</h6>
                                <p class="text-secondary mb-0">{{ summary.recognition }}</p>
                            </div>
                        </div>

                        <div class="card adminuiux-card mb-3">
                            <div class="card-body">
                                <div class="row gx-3 gy-2">
                                    <div class="col-6">
                                        <p class="small text-secondary mb-1">Reporta a</p>
                                        <p class="mb-0">{{ employee.manager }}</p>
                                    </div>
                                    <div class="col-6">
                                        <p class="small text-secondary mb-1">Equipo de reporte</p>
                                        <p class="mb-0">{{ summary.reportingTeam }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="row gx-3 gy-3 mb-3">
                            <div class="col-6">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-body">
                                        <p class="small text-secondary mb-1">Asistencia tardia</p>
                                        <h5 class="text-theme-1 theme-red mb-0">{{ summary.lateArrivals }}</h5>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-body">
                                        <p class="small text-secondary mb-1">Ausencias tomadas</p>
                                        <h5 class="text-theme-1 theme-red mb-0">{{ summary.absencesTaken }}</h5>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card adminuiux-card mb-3 mb-lg-4">
                            <div class="card-body">
                                <h6 class="mb-2">Tareas</h6>
                                <p class="text-secondary mb-0">{{ summary.tasksStatus }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form class="mb-3" novalidate>
                    <div class="card adminuiux-card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Identidad y acceso</h6>
                            <p class="text-secondary small mb-0">Campos base de usuario y visualizacion</p>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-md-4">
                                    <label class="form-label">Usuario / Nombre de acceso</label>
                                    <input class="form-control" type="text" name="accessUser" [(ngModel)]="employee.accessUser" />
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label">N° Documento</label>
                                    <input class="form-control" type="text" name="employeeId" [(ngModel)]="employee.employeeId" (ngModelChange)="refreshHrAssociations()" />
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label">ID de sistema del empleado</label>
                                    <input class="form-control" type="text" name="employeeNumber" [(ngModel)]="employee.employeeNumber" [disabled]="true" />
                                </div>

                                <div class="col-12 col-md-3">
                                    <label class="form-label">Trato (Sr./Sra.)</label>
                                    <select class="form-select" name="treatment" [(ngModel)]="employee.treatment">
                                        <option value="Sr.">Sr.</option>
                                        <option value="Sra.">Sra.</option>
                                        <option value="Srta.">Srta.</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Trato / Saludo</label>
                                    <input class="form-control" type="text" name="greeting" [(ngModel)]="employee.greeting" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Nombre</label>
                                    <input class="form-control" type="text" name="firstName" [(ngModel)]="employee.firstName" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Apellido</label>
                                    <input class="form-control" type="text" name="lastName" [(ngModel)]="employee.lastName" />
                                </div>

                                <div class="col-12 col-md-4">
                                    <label class="form-label">Nombre de usuario</label>
                                    <input class="form-control" type="text" name="userName" [(ngModel)]="employee.userName" />
                                </div>
                                <div class="col-12 col-md-2">
                                    <label class="form-label">Iniciales</label>
                                    <input class="form-control" type="text" name="initials" maxlength="4" [(ngModel)]="employee.initials" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Correo electronico</label>
                                    <input class="form-control" type="email" name="email" [(ngModel)]="employee.email" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Contrasena del correo</label>
                                    <input class="form-control" type="password" name="emailPassword" [(ngModel)]="employee.emailPassword" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Informacion laboral y compensacion</h6>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Cargo CS/Tecnico</label>
                                    <select class="form-select" name="roleType" [(ngModel)]="employee.roleType">
                                        <option value="CS">CS</option>
                                        <option value="Tecnico">Tecnico</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Puesto / Funcion</label>
                                    <select class="form-select" name="position" [(ngModel)]="employee.position">
                                        @for (position of positionCatalog; track position) {
                                            <option [value]="position">{{ position }}</option>
                                        }
                                    </select>
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Jefe directo / Responsable</label>
                                    <div class="manager-chip-field" (click)="focusManagerInput(managerInput)">
                                        <div class="manager-chip-list">
                                            @for (manager of selectedManagers; track manager; let i = $index) {
                                                <span class="manager-chip">
                                                    {{ manager }}
                                                    <button class="manager-chip-remove" type="button" (click)="removeManagerChip(i); $event.stopPropagation()" aria-label="Quitar responsable">
                                                        <i class="bi bi-x"></i>
                                                    </button>
                                                </span>
                                            }

                                            <input
                                                #managerInput
                                                class="manager-chip-input"
                                                type="text"
                                                name="managerSearch"
                                                placeholder="Escribe para buscar"
                                                [(ngModel)]="managerSearch"
                                                (focus)="managerDropdownVisible = true"
                                                (blur)="hideManagerDropdownDeferred()"
                                                (keydown)="onManagerSearchKeydown($event)"
                                            />
                                        </div>

                                        @if (managerDropdownVisible) {
                                            <div class="manager-dropdown">
                                                @for (option of filteredManagerCatalog; track option) {
                                                    <button class="manager-dropdown-item" type="button" (mousedown)="selectManagerOption(option)">{{ option }}</button>
                                                }

                                                @if (!filteredManagerCatalog.length && managerSearch.trim()) {
                                                    <button class="manager-dropdown-item" type="button" (mousedown)="commitManagerFromSearch()">
                                                        Agregar "{{ managerSearch.trim() }}"
                                                    </button>
                                                }
                                            </div>
                                        }
                                    </div>
                                    <input type="hidden" name="manager" [(ngModel)]="employee.manager" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Unidad de servicio / Departamento</label>
                                    <select class="form-select" name="serviceUnit" [(ngModel)]="employee.serviceUnit">
                                        @for (department of departmentCatalog; track department) {
                                            <option [value]="department">{{ department }}</option>
                                        }
                                    </select>
                                </div>

                                <div class="col-12 col-md-3">
                                    <label class="form-label">Tarifa horaria (COP)</label>
                                    <input class="form-control" type="number" min="0" step="1000" name="hourlyRate" [(ngModel)]="employee.hourlyRate" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" name="employmentStatus" [(ngModel)]="employee.employmentStatus">
                                        <option value="Activo">Activo</option>
                                        <option value="Suspendido">Suspendido</option>
                                        <option value="Retirado">Retirado</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="alert alert-light border py-2 mb-0">
                                        Vacaciones y licencias se gestionan en el modulo
                                        <a routerLink="/app/company-hr-leaves">Solicitud de vacaciones/licencias</a>.
                                    </div>
                                </div>
                            </div>

                            <hr class="my-4" />

                            <h6 class="mb-3">Asignacion de horario laboral</h6>
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-5">
                                    <label class="form-label">Plantilla de horario</label>
                                    <select class="form-select" name="assignedScheduleId" [(ngModel)]="employee.assignedScheduleId" (ngModelChange)="onAssignedScheduleChange()">
                                        @for (template of scheduleTemplateCatalog; track template.id) {
                                            <option [value]="template.id">{{ template.name }} ({{ template.startTime }} - {{ template.endTime }})</option>
                                        }
                                    </select>
                                    <p class="small text-secondary mb-0 mt-2">
                                        Las plantillas se crean en
                                        <a routerLink="/app/company-hr-worktime">HR - Horarios y festivos</a>.
                                    </p>
                                </div>
                                <div class="col-12 col-lg-7">
                                    @if (assignedScheduleTemplate) {
                                        <div class="alert alert-light border mb-0">
                                            <p class="mb-1"><strong>{{ assignedScheduleTemplate.name }}</strong></p>
                                            <p class="mb-1 small text-secondary">Horario: {{ assignedScheduleTemplate.startTime }} - {{ assignedScheduleTemplate.endTime }}</p>
                                            <p class="mb-0 small text-secondary">Dias: {{ assignedScheduleTemplate.days.join(', ') }} | Horas semanales: {{ weeklyHoursFromTemplate(assignedScheduleTemplate) }} h</p>
                                        </div>
                                    } @else {
                                        <div class="alert alert-warning mb-0">No hay plantilla asignada. Crea una en HR - Horarios y festivos y luego asociala aqui.</div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-lg-6">
                            <div class="card adminuiux-card mb-3 h-100">
                                <div class="card-header">
                                    <h6 class="mb-0">Salud y seguridad social</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row gx-3 gy-3">
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Tipo de sangre</label>
                                            <input class="form-control" type="text" name="bloodType" [(ngModel)]="employee.bloodType" />
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Alergias</label>
                                            <input class="form-control" type="text" name="allergies" [(ngModel)]="employee.allergies" />
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">EPS</label>
                                            <input class="form-control" type="text" name="eps" [(ngModel)]="employee.eps" />
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Caja de compensacion</label>
                                            <input class="form-control" type="text" name="compensationFund" [(ngModel)]="employee.compensationFund" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-lg-6">
                            <div class="card adminuiux-card mb-3 h-100">
                                <div class="card-header">
                                    <h6 class="mb-0">Contacto y residencia</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row gx-3 gy-3">
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Contacto de emergencia</label>
                                            <input class="form-control" type="text" name="emergencyContact" [(ngModel)]="employee.emergencyContact" />
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Parentesco</label>
                                            <input class="form-control" type="text" name="emergencyRelationship" [(ngModel)]="employee.emergencyRelationship" />
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Fecha de cumpleanos</label>
                                            <input class="form-control" type="date" name="birthday" [(ngModel)]="employee.birthday" />
                                        </div>
                                        <div class="col-12 col-md-6">
                                            <label class="form-label">Genero</label>
                                            <select class="form-select" name="gender" [(ngModel)]="employee.gender">
                                                <option value="Masculino">Masculino</option>
                                                <option value="Femenino">Femenino</option>
                                                <option value="Otro">Otro</option>
                                                <option value="No reporta">No reporta</option>
                                            </select>
                                        </div>
                                        <div class="col-12">
                                            <label class="form-label">Direccion de residencia</label>
                                            <textarea class="form-control" rows="2" name="residentialAddress" [(ngModel)]="employee.residentialAddress"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Vinculacion y salida</h6>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-md-4">
                                    <label class="form-label">Fecha de ingreso</label>
                                    <input class="form-control" type="date" name="hireDate" [(ngModel)]="employee.hireDate" />
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label">Fecha de egreso</label>
                                    <input class="form-control" type="date" name="terminationDate" [(ngModel)]="employee.terminationDate" />
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label">Motivo de salida</label>
                                    <input class="form-control" type="text" name="terminationReason" [(ngModel)]="employee.terminationReason" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Cumplimiento legal y autorizaciones de registro</h6>
                            <p class="text-secondary small mb-0">Se debe solicitar al registrarse y conservar trazabilidad</p>
                        </div>
                        <div class="card-body">
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="termsAccepted" name="registrationTermsAccepted" [(ngModel)]="employee.registrationTermsAccepted" />
                                <label class="form-check-label" for="termsAccepted">Acepto terminos y condiciones</label>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="privacyAccepted" name="registrationPrivacyAccepted" [(ngModel)]="employee.registrationPrivacyAccepted" />
                                <label class="form-check-label" for="privacyAccepted">Acepto politica de privacidad de datos</label>
                            </div>
                            <div class="alert alert-light border mb-0" role="alert">
                                Estado actual: {{ employee.registrationTermsAccepted ? 'Terminos aceptados' : 'Terminos pendientes' }} | {{ employee.registrationPrivacyAccepted ? 'Politica aceptada' : 'Politica pendiente' }}
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Documentos del trabajador (asociado)</h6>
                            <p class="text-secondary small mb-0">La carga y renovacion de documentos se gestiona en el modulo HR - Documentos</p>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gy-3 mb-3">
                                <div class="col-12 col-md-4">
                                    <p class="small text-secondary mb-1">Soportes registrados</p>
                                    <p class="mb-0 fw-semibold">{{ hrDocumentSummary.total }}</p>
                                </div>
                                <div class="col-12 col-md-4">
                                    <p class="small text-secondary mb-1">Pendientes / por vencer</p>
                                    <p class="mb-0 fw-semibold">{{ hrDocumentSummary.pending }}</p>
                                </div>
                                <div class="col-12 col-md-4">
                                    <p class="small text-secondary mb-1">Ultima carga</p>
                                    <p class="mb-0 fw-semibold">{{ hrDocumentSummary.lastUpload }}</p>
                                </div>
                            </div>
                            <a class="btn btn-outline-theme btn-sm" routerLink="/app/company-hr-documents" [queryParams]="{ from: 'profile', employeeId: normalizedEmployeeId }">Abrir modulo de documentos</a>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3">
                        <div class="card-header">
                            <h6 class="mb-0">Examenes medicos (asociado)</h6>
                            <p class="text-secondary small mb-0">El historial medico se administra en HR - Salud ocupacional</p>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gy-3 mb-3">
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Tipo de examen</p>
                                    <p class="mb-0 fw-semibold">{{ hrHealthSummary.examType }}</p>
                                </div>
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Ultimo examen</p>
                                    <p class="mb-0 fw-semibold">{{ hrHealthSummary.lastExam }}</p>
                                </div>
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Proximo vencimiento</p>
                                    <p class="mb-0 fw-semibold">{{ hrHealthSummary.nextDue }}</p>
                                </div>
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Estado</p>
                                    <p class="mb-0 fw-semibold">{{ hrHealthSummary.status }}</p>
                                </div>
                            </div>
                            <a class="btn btn-outline-theme btn-sm" routerLink="/app/company-hr-health" [queryParams]="{ from: 'profile', employeeId: normalizedEmployeeId }">Abrir modulo de salud</a>
                        </div>
                    </div>
                </form>
            } @else {
                <div class="card adminuiux-card mb-3 mb-lg-4 activity-toolbar-card">
                    <div class="card-body">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-md-3">
                                <label class="form-label">Tipo de accion</label>
                                <select class="form-select" [(ngModel)]="activityFilters.actionType" [ngModelOptions]="{ standalone: true }">
                                    <option value="">Todos</option>
                                    @for (actionType of activityActionTypes; track actionType) {
                                        <option [value]="actionType">{{ actionType }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Desde</label>
                                <input class="form-control" type="date" [(ngModel)]="activityFilters.fromDate" [ngModelOptions]="{ standalone: true }" />
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Hasta</label>
                                <input class="form-control" type="date" [(ngModel)]="activityFilters.toDate" [ngModelOptions]="{ standalone: true }" />
                            </div>
                            <div class="col-12 col-md-auto">
                                <button class="btn btn-theme w-100" type="button" (click)="applyActivityFilters()">Filtrar</button>
                            </div>
                            <div class="col-12 col-md-auto">
                                <button class="btn btn-outline-theme w-100" type="button" (click)="clearActivityFilters()">Limpiar</button>
                            </div>
                        </div>
                    </div>
                </div>

                @if (!groupedActivityLogs.length) {
                    <div class="alert alert-light border">No se encontraron actividades con los filtros seleccionados.</div>
                } @else {
                    @for (group of groupedActivityLogs; track group.dateKey) {
                        <p class="text-secondary mb-2">{{ group.dateLabel }}</p>
                        <div class="card adminuiux-card mb-3">
                            <div class="list-group list-group-flush">
                                @for (entry of group.entries; track entry.timestamp + '-' + entry.actionType + '-' + entry.path) {
                                    <div class="list-group-item activity-item py-3">
                                        <div class="d-flex align-items-start justify-content-between gap-3">
                                            <div class="d-flex align-items-start gap-2">
                                                <span class="avatar avatar-36 rounded-circle text-white activity-avatar">{{ entry.initials }}</span>
                                                <div>
                                                    <p class="mb-1 fw-semibold">{{ entry.actor }} <span class="badge text-bg-light">{{ entry.actionType }}</span></p>
                                                    <p class="small text-secondary mb-0">Path: {{ entry.path }}</p>
                                                </div>
                                            </div>
                                            <p class="small text-secondary mb-0 text-nowrap">{{ formatActivityTime(entry.timestamp) }}</p>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                }
            }
        </div>
    `,
    styles: [
        `
            .employee-summary-card {
                border: 1px solid var(--bs-border-color);
            }

            .employee-kpi {
                background: var(--bs-light-bg-subtle, #f8f9fa);
                border: 1px solid var(--bs-border-color-translucent);
                border-radius: 0.75rem;
                padding: 0.75rem;
            }

            .summary-grid p {
                word-break: break-word;
            }

            .table > :not(caption) > * > * {
                padding-top: 0.75rem;
                padding-bottom: 0.75rem;
            }

            .medical-form-grid .form-label,
            .activity-toolbar-card .form-label {
                margin-bottom: 0.25rem;
            }

            .doc-action-btn {
                width: 2rem;
                height: 2rem;
                padding: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .activity-item {
                border-left: 0;
                border-right: 0;
            }

            .activity-avatar {
                background: linear-gradient(135deg, #5d1670 0%, #2346b8 100%);
                font-size: 0.75rem;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .manager-chip-field {
                position: relative;
            }

            .manager-chip-list {
                min-height: 2.6rem;
                border: 1px solid var(--bs-border-color-translucent);
                border-radius: 0.5rem;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 0.35rem;
                padding: 0.35rem 0.5rem;
                background: var(--bs-body-bg);
                cursor: text;
            }

            .manager-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                background: #e10f53;
                color: #ffffff;
                border-radius: 999px;
                padding: 0.22rem 0.55rem;
                font-size: 0.82rem;
                font-weight: 600;
                line-height: 1;
            }

            .manager-chip-remove {
                border: 0;
                background: transparent;
                color: inherit;
                line-height: 1;
                padding: 0;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                opacity: 0.9;
            }

            .manager-chip-input {
                border: 0;
                outline: 0;
                background: transparent;
                color: inherit;
                min-width: 9rem;
                flex: 1 1 9rem;
                padding: 0.1rem;
            }

            .manager-dropdown {
                position: absolute;
                top: calc(100% + 0.3rem);
                left: 0;
                right: 0;
                border: 1px solid var(--bs-border-color-translucent);
                border-radius: 0.5rem;
                background: var(--bs-body-bg);
                z-index: 30;
                box-shadow: 0 0.4rem 1rem rgba(0, 0, 0, 0.18);
                max-height: 220px;
                overflow: auto;
            }

            .manager-dropdown-item {
                width: 100%;
                text-align: left;
                border: 0;
                background: transparent;
                color: inherit;
                padding: 0.5rem 0.7rem;
            }

            .manager-dropdown-item:hover {
                background: var(--bs-light-bg-subtle, #f8f9fa);
            }
        `,
    ],
})
export class ProfileProfessionalComponent implements OnInit {
    profileMode: "edicion" | "actividad" = "edicion";

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly hrApi = inject(HrApiService);
    private readonly hrDocumentsApi = inject(HrDocumentsApiService);
    private readonly cdr = inject(ChangeDetectorRef);

    isNewEmployeeFromHr = false;
    savingNewEmployee = false;
    feedbackMessage = "";
    feedbackKind: "success" | "error" = "success";
    loadedHrEmployeeId = "";
    loadingHrEmployee = false;
    resettingHrPassword = false;

    private readonly positionsStorageKey = "lars.hr.catalog.positions";
    private readonly departmentsStorageKey = "lars.hr.catalog.departments";
    private readonly scheduleTemplatesStorageKey = "lars.hr.worktime.schedules";
    private readonly healthStorageKey = "lars.hr.health.matrix";

    positionCatalog: string[] = this.defaultPositionCatalog();
    departmentCatalog: string[] = this.defaultDepartmentCatalog();
    managerCatalog: string[] = this.defaultManagerCatalog();
    scheduleTemplateCatalog: WorkScheduleTemplate[] = this.buildDefaultScheduleTemplates();
    selectedManagers: string[] = [];
    managerSearch = "";
    managerDropdownVisible = false;

    hrDocumentSummary = {
        total: 0,
        pending: 0,
        lastUpload: "--",
    };

    hrHealthSummary = {
        examType: "--",
        lastExam: "--",
        nextDue: "--",
        status: "Sin registro",
    };

    employee = {
        accessUser: "londono.consultores",
        employeeId: "EMP-001",
        employeeNumber: "0001",
        treatment: "Sr.",
        greeting: "Estimado",
        firstName: "LONDONO",
        lastName: "CONSULTORES",
        userName: "londono.consultores",
        initials: "LC",
        email: "lconsultoressst@gmail.com",
        emailPassword: "",
        roleType: "CS",
        position: "Coordinador SST",
        manager: "Direccion General",
        serviceUnit: "Gestion Humana",
        assignedScheduleId: "schedule-001",
        hourlyRate: 65000,
        emergencyContact: "Maria Londono",
        emergencyRelationship: "Esposa",
        allergies: "Ninguna registrada",
        bloodType: "O+",
        eps: "Sura",
        compensationFund: "Compensar",
        employeePhotoName: "",
        photoData: "",
        hireDate: "2026-03-30",
        terminationDate: "",
        terminationReason: "",
        birthday: "1992-08-01",
        residentialAddress: "Calle 123 # 45-67, Bogota",
        gender: "Masculino",
        employmentStatus: "Activo",
        registrationTermsAccepted: false,
        registrationPrivacyAccepted: false,
    };

    summary = {
        openTasks: 0,
        projects: 0,
        loggedHours: 0,
        tickets: 0,
        recognition: "No se encontraron registros.",
        reportingTeam: "--",
        lateArrivals: 0,
        absencesTaken: 0,
        tasksStatus: "Datos insuficientes",
    };

    activityFilters = {
        actionType: "",
        fromDate: "",
        toDate: "",
    };

    activityLog: ActivityLogEntry[] = [
        {
            timestamp: "2026-04-12 00:46:14",
            actionType: "Visito AuditoriA",
            actor: "Ludwig Angarita",
            initials: "LA",
            path: "/es/super/security-audit",
            detail: "Ingreso a la vista de auditoria.",
        },
        {
            timestamp: "2026-04-12 00:46:05",
            actionType: "Navego A /Es/Interface-Mode",
            actor: "Ludwig Angarita",
            initials: "LA",
            path: "/es/interface-mode",
            detail: "Navegacion de interfaz.",
        },
        {
            timestamp: "2026-04-11 18:03:53",
            actionType: "Navego A /Es/Super/Unified-Database",
            actor: "Danny Alejandro Ramirez Quitian",
            initials: "DA",
            path: "/es/super/unified-database",
            detail: "Navegacion al modulo de base unificada.",
        },
        {
            timestamp: "2026-04-11 18:03:46",
            actionType: "Navego A /Es/Interface-Mode",
            actor: "Danny Alejandro Ramirez Quitian",
            initials: "DA",
            path: "/es/interface-mode",
            detail: "Navegacion de interfaz.",
        },
        {
            timestamp: "2026-04-11 17:57:46",
            actionType: "Navego A /Es/Interface-Mode",
            actor: "ELKIN GIOVANNI RAMIREZ HERNANDEZ",
            initials: "EG",
            path: "/es/interface-mode",
            detail: "Navegacion de interfaz.",
        },
        {
            timestamp: "2026-04-11 17:55:51",
            actionType: "Navego A /Es/Interface-Mode",
            actor: "ELKIN GIOVANNI RAMIREZ HERNANDEZ",
            initials: "EG",
            path: "/es/interface-mode",
            detail: "Navegacion de interfaz.",
        },
    ];

    ngOnInit(): void {
        const queryParams = this.route.snapshot.queryParamMap;
        const fromHrDirectory = queryParams.get("source") === "hr-employees";
        this.isNewEmployeeFromHr = fromHrDirectory && queryParams.get("new") === "1";
        const employeeId = queryParams.get("employeeId")?.trim() ?? "";

        this.restoreHrCatalogs();
        this.restoreScheduleTemplates();
        this.initializeManagers();
        this.refreshHrAssociations();

        if (fromHrDirectory && !this.isNewEmployeeFromHr && employeeId) {
            this.loadHrEmployee(employeeId);
        }
    }

    get fullName(): string {
        return `${this.employee.firstName} ${this.employee.lastName}`.trim();
    }

    get normalizedEmployeeId(): string {
        return this.normalizeEmployeeId(this.employee.employeeNumber || this.employee.employeeId);
    }

    get assignedScheduleTemplate(): WorkScheduleTemplate | null {
        return this.scheduleTemplateCatalog.find((template) => template.id === this.employee.assignedScheduleId) ?? null;
    }

    get activityActionTypes(): string[] {
        return [...new Set(this.activityLog.map((entry) => entry.actionType))].sort((a, b) => a.localeCompare(b));
    }

    get filteredManagerCatalog(): string[] {
        const query = this.managerSearch.trim().toLowerCase();
        return this.managerCatalog
            .filter((manager) => !this.selectedManagers.includes(manager))
            .filter((manager) => !query || manager.toLowerCase().includes(query));
    }

    get groupedActivityLogs(): Array<{ dateKey: string; dateLabel: string; entries: ActivityLogEntry[] }> {
        const grouped = new Map<string, { dateLabel: string; entries: ActivityLogEntry[] }>();

        this.filteredActivityLogs.forEach((entry) => {
            const date = this.parseActivityTimestamp(entry.timestamp);
            const dateKey = date ? `${date.getFullYear()}-${this.padDate(date.getMonth() + 1)}-${this.padDate(date.getDate())}` : entry.timestamp.slice(0, 10);
            const dateLabel = date ? this.formatActivityDate(date) : dateKey;

            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, { dateLabel, entries: [] });
            }

            grouped.get(dateKey)?.entries.push(entry);
        });

        return Array.from(grouped.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([dateKey, value]) => ({
                dateKey,
                dateLabel: value.dateLabel,
                entries: value.entries,
            }));
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        }).format(value || 0);
    }

    formatActivityTime(timestamp: string): string {
        const date = this.parseActivityTimestamp(timestamp);
        if (!date) {
            return "--";
        }

        return new Intl.DateTimeFormat("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        }).format(date);
    }

    applyActivityFilters(): void {
        // Los filtros son reactivos por ngModel; este metodo conserva el UX del boton Filtrar.
    }

    clearActivityFilters(): void {
        this.activityFilters = {
            actionType: "",
            fromDate: "",
            toDate: "",
        };
    }

    onAssignedScheduleChange(): void {
        this.ensureAssignedScheduleSelection();

        const schedule = this.assignedScheduleTemplate;
        if (!schedule) {
            return;
        }

        this.pushActivity({
            actionType: "Asocio horario laboral",
            actor: "RRHH",
            initials: "RH",
            path: "/app/profile-professional",
            detail: `Se asigno la plantilla ${schedule.name} al colaborador.`,
        });
    }

    weeklyHoursFromTemplate(template: WorkScheduleTemplate): number {
        const start = this.toMinutes(template.startTime);
        const end = this.toMinutes(template.endTime);
        if (start === null || end === null || end <= start) {
            return 0;
        }

        const dailyHours = (end - start) / 60;
        return Number((dailyHours * template.days.length).toFixed(2));
    }

    refreshHrAssociations(): void {
        this.ensureAssignedScheduleSelection();
        this.loadDocumentSummaryFromHrModule();
        this.loadHealthSummaryFromHrModule();
    }

    focusManagerInput(input: HTMLInputElement): void {
        input.focus();
    }

    hideManagerDropdownDeferred(): void {
        setTimeout(() => {
            this.managerDropdownVisible = false;
        }, 120);
    }

    onManagerSearchKeydown(event: KeyboardEvent): void {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            this.commitManagerFromSearch();
            return;
        }

        if (event.key === "Backspace" && !this.managerSearch.trim() && this.selectedManagers.length) {
            event.preventDefault();
            this.removeManagerChip(this.selectedManagers.length - 1);
        }
    }

    selectManagerOption(manager: string): void {
        this.addManagerChip(manager);
        this.managerSearch = "";
        this.managerDropdownVisible = false;
    }

    commitManagerFromSearch(): void {
        const manager = this.normalizeCatalogValue(this.managerSearch);
        if (!manager) {
            return;
        }

        this.addManagerChip(manager);
        this.managerSearch = "";
        this.managerDropdownVisible = true;
    }

    removeManagerChip(index: number): void {
        this.selectedManagers = this.selectedManagers.filter((_, currentIndex) => currentIndex !== index);
        this.syncEmployeeManager();
    }

    onPhotoSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        target.value = "";
        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            this.feedbackKind = "error";
            this.feedbackMessage = "El archivo seleccionado no es una imagen valida.";
            return;
        }

        this.hrDocumentsApi
            .readFileAsDataUrl(file, PROFILE_PHOTO_MAX_FILE_BYTES)
            .then((dataUrl) => {
                this.employee.photoData = dataUrl;
                this.employee.employeePhotoName = file.name;
                this.pushActivity({
                    actionType: "Actualizo foto",
                    actor: "RRHH",
                    initials: "RH",
                    path: "/app/profile-professional",
                    detail: `Se adjunto la foto ${this.employee.employeePhotoName}.`,
                });
                this.cdr.detectChanges();
            })
            .catch((error: Error) => {
                this.feedbackKind = "error";
                this.feedbackMessage = `No se pudo cargar la foto: ${error.message}`;
                this.cdr.detectChanges();
            });
    }

    saveEmployeeProfile(): void {
        if (!this.employee.initials?.trim()) {
            const firstInitial = this.employee.firstName?.trim().charAt(0) ?? "";
            const lastInitial = this.employee.lastName?.trim().charAt(0) ?? "";
            this.employee.initials = `${firstInitial}${lastInitial}`.toUpperCase();
        }

        if (this.isNewEmployeeFromHr) {
            this.persistNewEmployee();
            return;
        }

        if (this.loadedHrEmployeeId) {
            this.persistHrEmployeeUpdate();
            return;
        }

        this.pushActivity({
            actionType: "Actualizacion de ficha",
            actor: "RRHH",
            initials: "RH",
            path: "/app/profile-professional",
            detail: "Se guardaron cambios de la ficha corporativa del empleado.",
        });
    }

    resetHrEmployeePassword(): void {
        if (!this.loadedHrEmployeeId) {
            return;
        }

        const confirmed = confirm(`Se generara un enlace de restablecimiento de clave para ${this.fullName}. Deseas continuar?`);
        if (!confirmed) {
            return;
        }

        this.resettingHrPassword = true;
        this.feedbackMessage = "";
        this.hrApi.resetEmployeePassword(this.loadedHrEmployeeId).subscribe({
            next: (response) => {
                this.resettingHrPassword = false;
                this.feedbackKind = "success";
                this.feedbackMessage = `${response.message} Enlace para compartir: /auth/reset-password?token=${response.resetToken} (vence: ${response.expiresAt}).`;
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.resettingHrPassword = false;
                this.feedbackKind = "error";
                this.feedbackMessage = `No se pudo restablecer la clave: ${error.message}`;
                this.cdr.detectChanges();
            },
        });
    }

    private loadHrEmployee(employeeId: string): void {
        this.loadingHrEmployee = true;
        this.feedbackMessage = "";
        this.hrApi.getEmployee(employeeId).subscribe({
            next: (employee) => {
                this.loadingHrEmployee = false;
                this.loadedHrEmployeeId = employee.id;
                Object.assign(this.employee, mapEmployeeToFormValues(employee));
                this.refreshHrAssociations();
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.loadingHrEmployee = false;
                this.feedbackKind = "error";
                this.feedbackMessage = `No se pudo cargar la ficha del empleado ${employeeId}: ${error.message}`;
                this.cdr.detectChanges();
            },
        });
    }

    private persistHrEmployeeUpdate(): void {
        const request = buildCreateEmployeeRequest(this.employee);
        if (!request.name) {
            this.feedbackKind = "error";
            this.feedbackMessage = "El nombre del colaborador es obligatorio para actualizar el empleado.";
            return;
        }

        this.savingNewEmployee = true;
        this.feedbackMessage = "";
        this.hrApi.updateEmployee(this.loadedHrEmployeeId, request).subscribe({
            next: (updated) => {
                this.savingNewEmployee = false;
                this.feedbackKind = "success";
                this.feedbackMessage = `Empleado ${updated.name} (${updated.id}) actualizado correctamente.`;
                this.pushActivity({
                    actionType: "Actualizacion de ficha",
                    actor: "RRHH",
                    initials: "RH",
                    path: "/app/profile-professional",
                    detail: `Se actualizo el empleado ${updated.id} desde la ficha profesional.`,
                });
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.savingNewEmployee = false;
                this.feedbackKind = "error";
                this.feedbackMessage = `No se pudo actualizar el empleado: ${error.message}`;
                this.cdr.detectChanges();
            },
        });
    }

    private persistNewEmployee(): void {        const request = buildCreateEmployeeRequest(this.employee);
        if (!request.name) {
            this.feedbackKind = "error";
            this.feedbackMessage = "El nombre del colaborador es obligatorio para crear el empleado.";
            return;
        }

        this.savingNewEmployee = true;
        this.feedbackMessage = "";
        this.hrApi.createEmployee(request).subscribe({
            next: (created) => {
                this.savingNewEmployee = false;
                this.feedbackKind = "success";
                this.feedbackMessage = `Empleado ${created.name} creado correctamente con ID ${created.id}.`;
                this.cdr.detectChanges();
                this.router.navigate(["/app/company-hr-employees"]);
            },
            error: (error: Error) => {
                this.savingNewEmployee = false;
                this.feedbackKind = "error";
                this.feedbackMessage = `No se pudo crear el empleado: ${error.message}`;
                this.cdr.detectChanges();
            },
        });
    }

    private get filteredActivityLogs(): ActivityLogEntry[] {
        return [...this.activityLog]
            .filter((entry) => {
                if (this.activityFilters.actionType && entry.actionType !== this.activityFilters.actionType) {
                    return false;
                }

                const entryDate = this.parseActivityTimestamp(entry.timestamp);
                if (!entryDate) {
                    return true;
                }

                if (this.activityFilters.fromDate) {
                    const fromDate = new Date(`${this.activityFilters.fromDate}T00:00:00`);
                    if (entryDate < fromDate) {
                        return false;
                    }
                }

                if (this.activityFilters.toDate) {
                    const toDate = new Date(`${this.activityFilters.toDate}T23:59:59`);
                    if (entryDate > toDate) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                const aTime = this.parseActivityTimestamp(a.timestamp)?.getTime() ?? 0;
                const bTime = this.parseActivityTimestamp(b.timestamp)?.getTime() ?? 0;
                return bTime - aTime;
            });
    }

    private parseActivityTimestamp(timestamp: string): Date | null {
        const normalized = timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T");
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    private formatActivityDate(date: Date): string {
        return new Intl.DateTimeFormat("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(date);
    }

    private pushActivity(entry: Omit<ActivityLogEntry, "timestamp">): void {
        this.activityLog.unshift({
            timestamp: this.buildTimestamp(),
            ...entry,
        });
    }

    private initializeManagers(): void {
        this.managerCatalog = Array.from(new Set([...this.managerCatalog, ...this.activityLog.map((entry) => entry.actor).filter((actor) => !!actor.trim())]));

        const initialManagers = this.employee.manager
            .split(",")
            .map((manager) => this.normalizeCatalogValue(manager))
            .filter((manager) => !!manager);

        this.selectedManagers = Array.from(new Set(initialManagers));
        if (!this.selectedManagers.length) {
            this.selectedManagers = [this.managerCatalog[0] || "Direccion General"];
        }

        this.selectedManagers.forEach((manager) => {
            if (!this.managerCatalog.includes(manager)) {
                this.managerCatalog.push(manager);
            }
        });

        this.syncEmployeeManager();
    }

    private addManagerChip(manager: string): void {
        if (!manager || this.selectedManagers.includes(manager)) {
            return;
        }

        this.selectedManagers = [...this.selectedManagers, manager];
        if (!this.managerCatalog.includes(manager)) {
            this.managerCatalog = [...this.managerCatalog, manager];
        }

        this.syncEmployeeManager();
    }

    private syncEmployeeManager(): void {
        this.employee.manager = this.selectedManagers.join(", ");
    }

    private normalizeCatalogValue(value: string): string {
        return value.trim().replace(/\s+/g, " ");
    }

    private restoreScheduleTemplates(): void {
        this.scheduleTemplateCatalog = this.readScheduleTemplatesFromStorage();
        this.ensureAssignedScheduleSelection();
    }

    private readScheduleTemplatesFromStorage(): WorkScheduleTemplate[] {
        if (typeof window === "undefined") {
            return this.buildDefaultScheduleTemplates();
        }

        const rawData = window.localStorage.getItem(this.scheduleTemplatesStorageKey);
        if (!rawData) {
            return this.buildDefaultScheduleTemplates();
        }

        try {
            const parsed = JSON.parse(rawData) as Array<Partial<WorkScheduleTemplate>>;
            if (!Array.isArray(parsed) || !parsed.length) {
                return this.buildDefaultScheduleTemplates();
            }

            const hydrated = parsed
                .filter((template) => template.id && template.name && template.startTime && template.endTime)
                .map((template, index) => ({
                    id: String(template.id || `schedule-${index + 1}`),
                    name: String(template.name || `Plantilla ${index + 1}`),
                    startTime: String(template.startTime || "08:00"),
                    endTime: String(template.endTime || "17:00"),
                    days: Array.isArray(template.days) ? template.days.map((day) => String(day)) : [],
                }));

            return hydrated.length ? hydrated : this.buildDefaultScheduleTemplates();
        } catch {
            return this.buildDefaultScheduleTemplates();
        }
    }

    private ensureAssignedScheduleSelection(): void {
        if (!this.scheduleTemplateCatalog.length) {
            return;
        }

        if (!this.scheduleTemplateCatalog.some((template) => template.id === this.employee.assignedScheduleId)) {
            this.employee.assignedScheduleId = this.scheduleTemplateCatalog[0].id;
        }
    }

    private loadDocumentSummaryFromHrModule(): void {
        if (!this.loadedHrEmployeeId) {
            this.hrDocumentSummary = { total: 0, pending: 0, lastUpload: "--" };
            return;
        }

        this.hrDocumentsApi.listDocuments(this.loadedHrEmployeeId).subscribe({
            next: (items) => {
                const coveredCategories = new Set(items.map((item) => item.category.trim()).filter((category) => !!category));
                const pending = HR_DOCUMENT_STANDARD_CATEGORIES.filter((category) => !coveredCategories.has(category)).length;
                const lastUpload = items
                    .map((item) => item.uploadedAt)
                    .filter((value) => !!value)
                    .sort((a, b) => this.parseDateForSort(b) - this.parseDateForSort(a))[0];

                this.hrDocumentSummary = {
                    total: items.length,
                    pending,
                    lastUpload: lastUpload ? lastUpload.slice(0, 10) : "--",
                };
                this.cdr.detectChanges();
            },
            error: () => {
                this.hrDocumentSummary = { total: 0, pending: 0, lastUpload: "--" };
                this.cdr.detectChanges();
            },
        });
    }

    private loadHealthSummaryFromHrModule(): void {
        if (typeof window === "undefined") {
            return;
        }

        const rawData = window.localStorage.getItem(this.healthStorageKey);
        if (!rawData) {
            this.hrHealthSummary = { examType: "--", lastExam: "--", nextDue: "--", status: "Sin registro" };
            return;
        }

        try {
            const parsed = JSON.parse(rawData) as Array<{ employeeId?: string; examType?: string; lastExam?: string; nextDue?: string; status?: string }>;
            const employeeId = this.normalizeEmployeeId(this.employee.employeeId);
            const record = parsed.find((item) => this.normalizeEmployeeId(String(item.employeeId || "")) === employeeId);

            if (!record) {
                this.hrHealthSummary = { examType: "--", lastExam: "--", nextDue: "--", status: "Sin registro" };
                return;
            }

            this.hrHealthSummary = {
                examType: String(record.examType || "--"),
                lastExam: String(record.lastExam || "--"),
                nextDue: String(record.nextDue || "--"),
                status: String(record.status || "Sin registro"),
            };
        } catch {
            this.hrHealthSummary = { examType: "--", lastExam: "--", nextDue: "--", status: "Sin registro" };
        }
    }

    private normalizeEmployeeId(value: string): string {
        const normalized = value.toUpperCase().replace(/\s+/g, "");
        const match = normalized.match(/EMP-?(\d+)/);
        if (match?.[1]) {
            return `EMP-${match[1].padStart(3, "0")}`;
        }
        return normalized;
    }

    private toMinutes(value: string): number | null {
        const [hour, minute] = value.split(":").map((item) => Number(item));
        if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
            return null;
        }
        return hour * 60 + minute;
    }

    private parseDateForSort(value: string): number {
        const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }

    private restoreHrCatalogs(): void {
        this.positionCatalog = this.readCatalogFromStorage(this.positionsStorageKey, this.defaultPositionCatalog());
        this.departmentCatalog = this.readCatalogFromStorage(this.departmentsStorageKey, this.defaultDepartmentCatalog());

        if (!this.positionCatalog.includes(this.employee.position)) {
            this.positionCatalog = [this.employee.position, ...this.positionCatalog];
        }

        if (!this.departmentCatalog.includes(this.employee.serviceUnit)) {
            this.departmentCatalog = [this.employee.serviceUnit, ...this.departmentCatalog];
        }
    }

    private readCatalogFromStorage(storageKey: string, fallback: string[]): string[] {
        if (typeof window === "undefined") {
            return fallback;
        }

        const rawData = window.localStorage.getItem(storageKey);
        if (!rawData) {
            return fallback;
        }

        try {
            const parsed = JSON.parse(rawData) as string[];
            if (!Array.isArray(parsed) || !parsed.length) {
                return fallback;
            }

            const normalized = parsed.map((item) => item.trim()).filter((item) => !!item);
            return normalized.length ? Array.from(new Set(normalized)) : fallback;
        } catch {
            return fallback;
        }
    }

    private padDate(value: number): string {
        return value.toString().padStart(2, "0");
    }

    private buildTimestamp(): string {
        const now = new Date();
        return `${now.getFullYear()}-${this.padDate(now.getMonth() + 1)}-${this.padDate(now.getDate())} ${this.padDate(now.getHours())}:${this.padDate(now.getMinutes())}:${this.padDate(now.getSeconds())}`;
    }

    private buildDefaultScheduleTemplates(): WorkScheduleTemplate[] {
        return [
            {
                id: "schedule-001",
                name: "Jornada administrativa",
                startTime: "08:00",
                endTime: "17:00",
                days: ["Lun", "Mar", "Mie", "Jue", "Vie"],
            },
            {
                id: "schedule-002",
                name: "Jornada operativa",
                startTime: "07:00",
                endTime: "16:00",
                days: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
            },
        ];
    }

    private defaultPositionCatalog(): string[] {
        return ["Coordinador SST", "Tecnico soporte", "Tecnico de campo", "Analista RRHH"];
    }

    private defaultDepartmentCatalog(): string[] {
        return ["Gestion Humana", "Operaciones", "Comercial", "Finanzas"];
    }

    private defaultManagerCatalog(): string[] {
        return ["Direccion General", "Kartikaa Joshi", "Steven Jobs", "Ludwig Angarita", "Danny Ramirez", "Elkin Ramirez", "Maria Londono"];
    }
}
