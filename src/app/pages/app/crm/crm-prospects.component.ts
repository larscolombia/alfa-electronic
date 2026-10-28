import { NgFor, NgIf } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { catchError, forkJoin, map, of } from "rxjs";

import { CrmProspectEquipmentModalComponent } from "./crm-prospect-equipment-modal.component";
import { ProspectRecord, replaceProspects } from "./crm-prospects.store";
import { CrmZoneRecord } from "./crm-zones.store";
import { CrmClientRecord, UpsertCrmClientRequest, CrmClientsApiService } from "../../../services/crm-clients-api.service";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { CrmFollowupsApiService, CrmProspectFollowup } from "../../../services/crm-followups-api.service";
import { CrmProspectContact, CrmProspectRecord, CrmProspectsApiService, CrmUpsertBranchPayload } from "../../../services/crm-prospects-api.service";
import { FormDraftService } from "../../../services/form-draft.service";
import { HrPeoplePickerService } from "../../../services/hr-people-picker.service";
import { SearchableSelectDirective } from "../../../components/input-fields/searchable-select/searchable-select.directive";

type QuickAddTarget = "fuentes" | "categorias" | "servicios";

type ProspectFollowupBadge = {
    label: string;
    overdue: boolean;
    dueToday: boolean;
};

type DuplicateMatch = {
    type: "prospecto" | "cliente";
    id: string;
    nombre: string;
    empresa: string;
    correo: string;
    zona: string;
    empleado: string;
    estado: string;
    creado: string;
};

type ProspectBranchDraft = {
    name: string;
    contactName: string;
    selectedCompanyContactKey?: string;
    contactRole: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    isPrimary: boolean;
};

type CompanyRelatedContactOption = {
    value: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    sourceLabel: string;
};

type CompanyRelatedProspectTarget = {
    id: string;
    name: string;
};

const CRM_PROSPECT_FORM_DRAFT_KEY = "app.crm.prospects.form";

@Component({
    selector: "app-crm-prospects",
    standalone: true,
    imports: [RouterLink, NgFor, NgIf, FormsModule, CrmProspectEquipmentModalComponent, SearchableSelectDirective],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col mb-3 mb-sm-0 d-flex align-items-start gap-2">
                    <button class="btn btn-outline-secondary" type="button" (click)="goBack()" data-testid="back-btn">
                        <i class="bi bi-arrow-left me-1"></i>Volver
                    </button>
                    <div>
                        <h5 class="mb-0">Prospectos</h5>
                        <p class="text-secondary small mb-0">Administra tus prospectos y su seguimiento comercial.</p>
                    </div>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">CRM</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Prospectos</li>
                </ol>
            </nav>
        </div>

        <div class="container-fluid mt-3" id="main-content">
            <div class="card adminuiux-card mb-3 mb-lg-4" *ngIf="!showProspectForm">
                <div class="card-body">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                        <div>
                            <h5 class="mb-1">Cartera de prospectos</h5>
                            <p class="text-secondary small mb-0">{{ filteredProspectCount }} de {{ prospectRows.length }} prospectos</p>
                        </div>
                        <div class="d-flex flex-wrap gap-2">
                        <button class="btn btn-theme" type="button" (click)="openProspectForm()"><i class="bi bi-plus-lg me-1"></i> Agregar Prospecto</button>
                            <a class="btn btn-outline-secondary" routerLink="/app/crm-carga-bases"><i class="bi bi-upload me-1"></i> Importar</a>
                            <button class="btn btn-outline-secondary" type="button" (click)="exportProspects()" [disabled]="filteredProspectCount === 0"><i class="bi bi-download me-1"></i> Exportar</button>
                        </div>
                    </div>

                    <div class="alert alert-success border mb-3" *ngIf="prospectConvertSuccessMessage">{{ prospectConvertSuccessMessage }}</div>
                    <div class="alert alert-danger border mb-3" *ngIf="prospectConvertErrorMessage">{{ prospectConvertErrorMessage }}</div>

                    <div class="alert alert-danger border mb-3" *ngIf="prospectsLoadErrorMessage">{{ prospectsLoadErrorMessage }}</div>

                    <div class="row g-2 align-items-end mb-3" aria-label="Filtros de prospectos">
                        <div class="col-12 col-lg-7">
                            <label class="form-label" for="prospects-search">Buscar</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
                                <input id="prospects-search" data-testid="prospects-search" class="form-control" type="search" [(ngModel)]="searchTerm" (ngModelChange)="resetListPage()" placeholder="Nombre, empresa, correo, móvil o responsable" />
                            </div>
                        </div>
                        <div class="col-8 col-lg-3">
                            <label class="form-label" for="prospects-status-filter">Estado</label>
                            <select appSearchableSelect id="prospects-status-filter" data-testid="prospects-status-filter" class="form-select" [(ngModel)]="statusFilter" (ngModelChange)="resetListPage()">
                                <option value="">Todos los estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En proceso">En proceso</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>
                        <div class="col-4 col-lg-2">
                            <label class="form-label" for="prospects-page-size">Por página</label>
                            <select appSearchableSelect id="prospects-page-size" data-testid="prospects-page-size" class="form-select" [(ngModel)]="pageSize" (ngModelChange)="resetListPage()">
                                <option [ngValue]="10">10</option>
                                <option [ngValue]="25">25</option>
                                <option [ngValue]="50">50</option>
                            </select>
                        </div>
                    </div>

                    <div class="table-responsive border rounded">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <button class="btn btn-link p-0 text-decoration-none fw-semibold" type="button" (click)="toggleSort('nombre')">
                                            Nombre del contacto
                                            <i class="bi" [class.bi-sort-alpha-down]="sortKey === 'nombre' && sortDirection === 'asc'" [class.bi-sort-alpha-up]="sortKey === 'nombre' && sortDirection === 'desc'" [class.bi-arrow-down-up]="sortKey !== 'nombre'"></i>
                                        </button>
                                    </th>
                                    <th>Correo electrónico</th>
                                    <th>Móvil</th>
                                    <th>
                                        <button class="btn btn-link p-0 text-decoration-none fw-semibold" type="button" (click)="toggleSort('creado')">
                                            Creado
                                            <i class="bi" [class.bi-sort-numeric-down]="sortKey === 'creado' && sortDirection === 'asc'" [class.bi-sort-numeric-up]="sortKey === 'creado' && sortDirection === 'desc'" [class.bi-arrow-down-up]="sortKey !== 'creado'"></i>
                                        </button>
                                    </th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let row of visibleProspectRows">
                                    <td>
                                        <a class="text-decoration-none fw-semibold" [routerLink]="['/app/crm-prospectos', row.id]">{{ row.nombre }}</a>
                                        <div class="d-flex flex-wrap gap-1 mt-1">
                                            <span class="badge text-bg-primary" *ngIf="row.empleado">{{ row.empleado }}</span>
                                            <span class="badge text-bg-secondary" *ngIf="isProspectConverted(row.id)" data-testid="prospect-converted-badge" title="Este prospecto ya fue convertido en cliente">Convertido</span>
                                            <span class="badge text-bg-success" *ngIf="row.cotizaciones">{{ row.cotizaciones }} cot.</span>
                                            <span class="badge text-bg-info" *ngIf="row.zona">{{ row.zona }}</span>
                                        </div>
                                        <div class="mt-1" *ngIf="nextFollowupBadge(row.id) as badge">
                                            <span class="badge" [class.text-bg-danger]="badge.overdue" [class.text-bg-warning]="!badge.overdue && badge.dueToday" [class.text-bg-info]="!badge.overdue && !badge.dueToday">
                                                {{ badge.label }}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{{ row.correo }}</td>
                                    <td>{{ row.movil }}</td>
                                    <td>{{ row.creado }}</td>
                                    <td>
                                        <span class="badge" [class.text-bg-warning]="row.estado === 'Pendiente'" [class.text-bg-info]="row.estado === 'En proceso'" [class.text-bg-success]="row.estado === 'Cerrado'">
                                            {{ row.estado }}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="dropdown d-inline-block">
                                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-popper-config='{"strategy":"fixed","modifiers":[{"name":"computeStyles","options":{"gpuAcceleration":false}}]}'>
                                                Acciones
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end" style="z-index: 1055;">
                                                <li><a class="dropdown-item" [routerLink]="['/app/crm-prospectos', row.id]">Abrir ficha</a></li>
                                                <li><button class="dropdown-item" type="button" (click)="openEquipmentModal(row)">Asociar equipo{{ associatedEquipmentCount(row) > 0 ? ' (' + associatedEquipmentCount(row) + ')' : '' }}</button></li>
                                                <li><button class="dropdown-item" type="button" [disabled]="isConvertingProspect(row.id) || isProspectConverted(row.id)" (click)="convertProspectToClient(row)">{{ isProspectConverted(row.id) ? 'Convertido' : isConvertingProspect(row.id) ? 'Convirtiendo...' : 'Convertir a cliente' }}</button></li>
                                                <li><a class="dropdown-item" routerLink="/app/crm-cotizaciones">Ver cotizaciones</a></li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                                <tr *ngIf="visibleProspectRows.length === 0">
                                    <td colspan="6" class="text-center py-5 text-secondary">
                                        <i class="bi bi-search fs-3 d-block mb-2" aria-hidden="true"></i>
                                        <strong>No encontramos prospectos</strong>
                                        <div class="small">Cambia los filtros o agrega un prospecto nuevo.</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3" data-testid="prospects-pagination" *ngIf="filteredProspectCount > 0">
                        <span class="small text-secondary">Mostrando {{ pageStart }}–{{ pageEnd }} de {{ filteredProspectCount }}</span>
                        <div class="btn-group" aria-label="Paginación de prospectos">
                            <button class="btn btn-outline-secondary" type="button" (click)="previousPage()" [disabled]="currentPage === 1">Anterior</button>
                            <button class="btn btn-outline-secondary disabled" type="button" aria-current="page">Página {{ currentPage }} de {{ totalPages }}</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="nextPage()" [disabled]="currentPage === totalPages">Siguiente</button>
                        </div>
                    </div>
                </div>
            </div>

            <div #prospectFormCard class="card adminuiux-card mb-3 mb-lg-4" *ngIf="showProspectForm">
                <div class="card-header border-bottom">
                    <div class="d-flex align-items-center justify-content-between gap-2">
                        <div>
                            <h5 class="mb-1">Nuevo prospecto</h5>
                            <p class="small text-secondary mb-0">Registra la información necesaria para iniciar el seguimiento comercial.</p>
                        </div>
                        <button class="btn btn-outline-secondary" type="button" (click)="closeProspectForm()" [disabled]="isSavingProspect"><i class="bi bi-x-lg me-1"></i> Cerrar</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="alert alert-danger border mb-3" *ngIf="catalogsLoadErrorMessage">{{ catalogsLoadErrorMessage }}</div>
                    <h6 class="text-uppercase text-secondary small fw-bold mb-3">Información básica</h6>
                    <div class="row gx-3">
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label" for="prospect-salutation">Saludo</label>
                            <select appSearchableSelect id="prospect-salutation" class="form-select" [(ngModel)]="formSaludo" name="formSaludo">
                                <option value="--">--</option>
                                <option value="Sr.">Sr.</option>
                                <option value="Sra.">Sra.</option>
                            </select>
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label" for="prospect-company">Empresa</label>
                            <input
                                id="prospect-company"
                                class="form-control"
                                placeholder="por ejemplo, Corporacion Acme"
                                [ngModel]="formCompania"
                                (ngModelChange)="onProspectCompanyInputChange($event)"
                                name="formCompania"
                                maxlength="180" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Correo electrónico del contacto</label>
                            <input class="form-control" type="email" placeholder="por ejemplo, juanperez@example.com" [(ngModel)]="formCorreo" name="formCorreo" maxlength="180" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label" for="prospect-contact-name">Nombre del contacto *</label>
                            <input id="prospect-contact-name" #prospectNameInput class="form-control" placeholder="por ejemplo, Juan Perez" [(ngModel)]="formNombre" name="formNombre" maxlength="180" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">NIT</label>
                            <input class="form-control" placeholder="por ejemplo, 900123456-7" [(ngModel)]="formNit" name="formNit" maxlength="80" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Móvil</label>
                            <input class="form-control" placeholder="por ejemplo, 3001234567" [(ngModel)]="formMovil" name="formMovil" maxlength="40" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Sitio web</label>
                            <input class="form-control" type="url" placeholder="https://empresa.com" [(ngModel)]="formSitioWeb" name="formSitioWeb" maxlength="255" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Telefono de oficina</label>
                            <input class="form-control" placeholder="por ejemplo, 6011234567" [(ngModel)]="formTelefonoOficina" name="formTelefonoOficina" maxlength="40" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">País</label>
                            <input class="form-control" placeholder="por ejemplo, Colombia" [(ngModel)]="formPais" name="formPais" maxlength="120" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Ciudad</label>
                            <input class="form-control" placeholder="por ejemplo, Bogota" [(ngModel)]="formCiudad" name="formCiudad" maxlength="120" />
                        </div>
                        <div class="col-12 mb-3">
                            <label class="form-label">Dirección</label>
                            <input class="form-control" placeholder="Direccion principal" [(ngModel)]="formDireccion" name="formDireccion" maxlength="500" />
                        </div>

                        <div class="col-12"><hr class="my-2"><h6 class="text-uppercase text-secondary small fw-bold my-3">Clasificación y responsable</h6></div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label" for="prospect-owner">Empleado responsable</label>
                            <select appSearchableSelect id="prospect-owner" class="form-select" [(ngModel)]="formEmpleado" name="formEmpleado">
                                <option value="">--</option>
                                <option *ngFor="let option of employeeOptions" [value]="option">{{ option }}</option>
                            </select>
                            <div class="form-text text-secondary">Solo empleados activos de RRHH con rol comercial. Si no aparece quien necesitas, créalo en el directorio de RRHH.</div>
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label" for="prospect-source">Fuente del Prospecto</label>
                            <div class="input-group">
                                <select appSearchableSelect id="prospect-source" class="form-select" [(ngModel)]="formFuente" name="formFuente">
                                    <option value="">--</option>
                                    <option *ngFor="let option of sourceOptions" [value]="option">{{ option }}</option>
                                </select>
                                <button class="btn btn-outline-secondary" type="button" (click)="openQuickAddModal('fuentes')">Agregar</button>
                            </div>
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label" for="prospect-category">Categoría del prospecto</label>
                            <div class="input-group">
                                <select appSearchableSelect id="prospect-category" class="form-select" [(ngModel)]="formCategoria" name="formCategoria">
                                    <option value="">--</option>
                                    <option *ngFor="let option of categoryOptions" [value]="option">{{ option }}</option>
                                </select>
                                <button class="btn btn-outline-secondary" type="button" (click)="openQuickAddModal('categorias')">Agregar</button>
                            </div>
                        </div>

                        <div class="col-12 col-lg-12 mb-3">
                            <label class="form-label d-block">Zona</label>
                            <div class="d-flex flex-wrap gap-3">
                                @for (zone of zoneOptions; track zone.id) {
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            [id]="'prospectZone-' + zone.id"
                                            [checked]="selectedProspectZone === zone.name"
                                            (change)="selectedProspectZone = zone.name" />
                                        <label class="form-check-label" [for]="'prospectZone-' + zone.id">{{ zone.name }}</label>
                                    </div>
                                }
                            </div>
                        </div>

                        <div class="col-12"><hr class="my-2"><h6 class="text-uppercase text-secondary small fw-bold my-3">Sedes y contactos</h6></div>
                        <div class="col-12 mb-3">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                <label class="form-label mb-0">Sucursales del prospecto</label>
                                <button class="btn btn-sm btn-outline-theme" type="button" (click)="addProspectBranch()">
                                    <i class="bi bi-diagram-3 me-1"></i>Agregar sucursal
                                </button>
                            </div>

                            @if (prospectBranches.length === 0) {
                                <p class="small text-secondary mb-0">No hay sucursales agregadas. Puedes registrar varias sedes por prospecto.</p>
                            }

                            @for (branch of prospectBranches; track $index; let branchIndex = $index) {
                                <div class="border rounded p-3 mb-2">
                                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                        <strong>Sucursal {{ branchIndex + 1 }}</strong>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="branch.isPrimary" (click)="setPrimaryProspectBranch(branchIndex)">
                                                {{ branch.isPrimary ? 'Principal' : 'Marcar principal' }}
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeProspectBranch(branchIndex)">Quitar</button>
                                        </div>
                                    </div>

                                    <div class="row gx-3 gy-2">
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Nombre de sucursal</label>
                                            <input class="form-control" [(ngModel)]="branch.name" [name]="'prospectBranchName-' + branchIndex" placeholder="Ej: Planta Centro" />
                                        </div>
                                        <div class="col-12 col-lg-8">
                                            <label class="form-label" [for]="'prospect-branch-contact-' + branchIndex">Contacto relacionado de la empresa</label>
                                            <div class="d-flex flex-wrap gap-2 align-items-center">
                                                <select appSearchableSelect
                                                    [id]="'prospect-branch-contact-' + branchIndex"
                                                    class="form-select"
                                                    style="min-width: 240px;"
                                                    [ngModel]="branch.selectedCompanyContactKey || ''"
                                                    (focus)="ensureCompanyRelatedContactsLoaded()"
                                                    (ngModelChange)="applyCompanyRelatedContactToProspectBranch(branchIndex, $event)"
                                                    [name]="'prospectBranchRelatedContact-' + branchIndex">
                                                    <option value="">Seleccionar contacto existente</option>
                                                    <option *ngFor="let option of companyContactOptions" [value]="option.value">
                                                        {{ option.name }}{{ option.role ? ' · ' + option.role : '' }}{{ option.sourceLabel ? ' · ' + option.sourceLabel : '' }}
                                                    </option>
                                                </select>

                                                <button
                                                    class="btn btn-outline-theme btn-sm"
                                                    type="button"
                                                    [disabled]="creatingBranchContactIndex === branchIndex || !canCreateCompanyContactFromProspectBranch(branch)"
                                                    (click)="createCompanyContactFromProspectBranch(branchIndex)">
                                                    {{ creatingBranchContactIndex === branchIndex ? 'Creando...' : 'Crear contacto relacionado' }}
                                                </button>
                                            </div>

                                            <div class="small text-secondary mt-1" *ngIf="companyContactLoading">Cargando contactos de la empresa...</div>
                                            <div class="small text-danger mt-1" *ngIf="companyContactError">{{ companyContactError }}</div>
                                            <div class="small text-secondary mt-1" *ngIf="!companyContactLoading && !companyContactError && companyContactOptions.length === 0">
                                                No hay contactos cargados para esta empresa. Puedes crear uno rápido con el botón.
                                            </div>
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Contacto</label>
                                            <input class="form-control" [(ngModel)]="branch.contactName" [name]="'prospectBranchContactName-' + branchIndex" placeholder="Ej: Laura Perez" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Rol contacto</label>
                                            <input class="form-control" [(ngModel)]="branch.contactRole" [name]="'prospectBranchContactRole-' + branchIndex" placeholder="Ej: Coordinador" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Correo</label>
                                            <input class="form-control" [(ngModel)]="branch.email" [name]="'prospectBranchEmail-' + branchIndex" placeholder="contacto@sucursal.com" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Teléfono</label>
                                            <input class="form-control" [(ngModel)]="branch.phone" [name]="'prospectBranchPhone-' + branchIndex" placeholder="Ej: 3001234567" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">País</label>
                                            <input class="form-control" [(ngModel)]="branch.country" [name]="'prospectBranchCountry-' + branchIndex" placeholder="Ej: Colombia" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Ciudad</label>
                                            <input class="form-control" [(ngModel)]="branch.city" [name]="'prospectBranchCity-' + branchIndex" placeholder="Ej: Bogota" />
                                        </div>
                                        <div class="col-12 col-lg-8">
                                            <label class="form-label">Dirección</label>
                                            <input class="form-control" [(ngModel)]="branch.address" [name]="'prospectBranchAddress-' + branchIndex" placeholder="Dirección de la sucursal" />
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>

                        <div class="col-12"><hr class="my-2"><h6 class="text-uppercase text-secondary small fw-bold my-3">Estado y servicio</h6></div>
                        <div class="col-12 col-lg-6 mb-3">
                            <label class="form-label" for="prospect-status">Estado</label>
                            <select appSearchableSelect id="prospect-status" class="form-select" [(ngModel)]="formEstado" name="formEstado">
                                <option value="Pendiente">Pendiente</option>
                                <option value="En proceso">En proceso</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>

                        <div class="col-12 col-lg-6 mb-3">
                            <label class="form-label" for="prospect-service">Servicios</label>
                            <div class="input-group">
                                <select appSearchableSelect id="prospect-service" class="form-select" [(ngModel)]="formServicio" name="formServicio">
                                    <option value="">Seleccionar Servicio</option>
                                    <option *ngFor="let option of serviceOptions" [value]="option">{{ option }}</option>
                                </select>
                                <button class="btn btn-outline-secondary" type="button" (click)="openQuickAddModal('servicios')">Agregar</button>
                            </div>
                        </div>

                        <div class="col-12 mb-3">
                            <label class="form-label">Nota</label>
                            <textarea class="form-control" rows="5" placeholder="Escribe observaciones sobre el prospecto..." [(ngModel)]="formNota" name="formNota" maxlength="5000"></textarea>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="alert alert-danger border mb-3" *ngIf="prospectSaveErrorMessage">{{ prospectSaveErrorMessage }}</div>
                    <button class="btn btn-theme me-2" type="button" data-testid="prospect-save-btn" [disabled]="isSavingProspect" (click)="saveProspect()"><i class="bi bi-check2 me-1"></i> {{ isSavingProspect ? 'Guardando...' : 'Guardar' }}</button>
                    <button class="btn btn-outline-secondary me-2" type="button" [disabled]="isSavingProspect" (click)="saveProspectAndAddMore()">Guardar y agregar otro</button>
                    <button class="btn btn-link" type="button" (click)="closeProspectForm()">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="modal fade show" tabindex="-1" role="dialog" aria-modal="true" style="display: block;" *ngIf="isQuickAddModalOpen">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Agregar {{ quickAddTargetLabel }}</h5>
                        <button type="button" class="btn-close" aria-label="Close" (click)="closeQuickAddModal()"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-secondary small mb-2">Este formulario crea un registro real en el catalogo del backend.</p>
                        <label class="form-label">Nombre del registro</label>
                        <input
                            class="form-control"
                            [value]="quickAddInput"
                            (input)="quickAddInput = $any($event.target).value"
                            (keydown.enter)="confirmQuickAdd()"
                            placeholder="Ejemplo: Registro 01" />
                        <p class="text-danger small mb-0 mt-2" *ngIf="quickAddErrorMessage">{{ quickAddErrorMessage }}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" (click)="closeQuickAddModal()">Cancelar</button>
                        <button type="button" class="btn btn-theme" (click)="confirmQuickAdd()"><i class="bi bi-plus-lg me-1"></i> Agregar</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="isQuickAddModalOpen"></div>

        <div class="modal fade show" tabindex="-1" role="dialog" aria-modal="true" style="display: block;" *ngIf="isDuplicateModalOpen">
            <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Posible duplicado detectado</h5>
                        <button type="button" class="btn-close" aria-label="Close" (click)="closeDuplicateModal()"></button>
                    </div>
                    <div class="modal-body">
                        <p>Ya existe un registro con datos similares. Revisa la informacion antes de continuar:</p>
                        <div class="table-responsive border rounded">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Tipo</th>
                                        <th>Nombre</th>
                                        <th>Empresa</th>
                                        <th>Correo</th>
                                        <th>Zona</th>
                                        <th>Estado</th>
                                        <th>Creado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let match of duplicateMatches">
                                        <td><span class="badge" [class.text-bg-primary]="match.type === 'cliente'" [class.text-bg-info]="match.type === 'prospecto'">{{ match.type }}</span></td>
                                        <td>{{ match.nombre }}</td>
                                        <td>{{ match.empresa || '--' }}</td>
                                        <td>{{ match.correo || '--' }}</td>
                                        <td>{{ match.zona || '--' }}</td>
                                        <td>{{ match.estado }}</td>
                                        <td>{{ match.creado }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" (click)="closeDuplicateModal()">Cancelar</button>
                        <button type="button" class="btn btn-theme" (click)="confirmSaveDespiteDuplicates()">Crear de todos modos</button>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show" *ngIf="isDuplicateModalOpen"></div>

        <app-crm-prospect-equipment-modal
            *ngIf="selectedEquipmentProspect"
            [prospect]="selectedEquipmentProspect"
            (closed)="closeEquipmentModal()"
            (saved)="handleEquipmentSaved()"></app-crm-prospect-equipment-modal>
    `,
})
export class CrmProspectsComponent {
    @ViewChild("prospectFormCard") private prospectFormCardRef?: ElementRef<HTMLDivElement>;
    @ViewChild("prospectNameInput") private prospectNameInputRef?: ElementRef<HTMLInputElement>;

    prospectRows: ProspectRecord[] = [];
    searchTerm = "";
    statusFilter = "";
    pageSize = 10;
    currentPage = 1;

    sortKey: "nombre" | "creado" | null = null;
    sortDirection: "asc" | "desc" = "asc";

    get visibleProspectRows(): ProspectRecord[] {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredProspectRows.slice(start, start + this.pageSize);
    }

    get filteredProspectCount(): number {
        return this.filteredProspectRows.length;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.filteredProspectCount / this.pageSize));
    }

    get pageStart(): number {
        return this.filteredProspectCount === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    }

    get pageEnd(): number {
        return Math.min(this.currentPage * this.pageSize, this.filteredProspectCount);
    }

    private get filteredProspectRows(): ProspectRecord[] {
        const query = this.normalizeSearch(this.searchTerm);
        const rows = this.prospectRows.filter((row) => {
            const matchesStatus = !this.statusFilter || row.estado === this.statusFilter;
            if (!matchesStatus) return false;
            if (!query) return true;
            return [row.nombre, row.compania, row.correo, row.movil, row.empleado, row.zona]
                .some((value) => this.normalizeSearch(String(value ?? "")).includes(query));
        });
        if (!this.sortKey) return rows;
        return [...rows].sort((a, b) => this.compareProspectRows(a, b, this.sortKey!) * (this.sortDirection === "asc" ? 1 : -1));
    }

    toggleSort(key: "nombre" | "creado"): void {
        if (this.sortKey === key) {
            this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
        } else {
            this.sortKey = key;
            this.sortDirection = "asc";
        }
        this.resetListPage();
    }

    resetListPage(): void {
        this.currentPage = 1;
    }

    previousPage(): void {
        this.currentPage = Math.max(1, this.currentPage - 1);
    }

    nextPage(): void {
        this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
    }

    exportProspects(): void {
        const rows = this.filteredProspectRows;
        const cells = [
            ["Empresa", "Nombre del contacto", "Correo electrónico", "Móvil", "Responsable", "Zona", "Estado", "Creado"],
            ...rows.map((row) => [row.compania, row.nombre, row.correo, row.movil, row.empleado, row.zona, row.estado, row.creado]),
        ];
        const csv = cells.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `prospectos-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    private normalizeSearch(value: string): string {
        return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es");
    }

    private compareProspectRows(a: ProspectRecord, b: ProspectRecord, key: "nombre" | "creado"): number {
        if (key === "creado") {
            return this.parseDisplayDate(a.creado) - this.parseDisplayDate(b.creado);
        }
        return (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" });
    }

    private parseDisplayDate(value: string): number {
        const match = /^([0-9]{1,2})[/-]([0-9]{1,2})[/-]([0-9]{2,4})/.exec((value || "").trim());
        if (match) {
            const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
            return new Date(year, Number(match[2]) - 1, Number(match[1])).getTime();
        }
        const parsed = Date.parse(value || "");
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    zoneOptions: CrmZoneRecord[] = [];
    selectedProspectZone = "";

    employeeOptions: string[] = [];
    sourceOptions: string[] = [];
    categoryOptions: string[] = [];
    serviceOptions: string[] = [];

    isQuickAddModalOpen = false;
    quickAddTarget: QuickAddTarget = "fuentes";
    quickAddInput = "";
    quickAddErrorMessage = "";
    showProspectForm = false;
    selectedEquipmentProspect: ProspectRecord | null = null;

    prospectsLoadErrorMessage = "";
    catalogsLoadErrorMessage = "";
    prospectSaveErrorMessage = "";
    prospectConvertSuccessMessage = "";
    prospectConvertErrorMessage = "";
    isSavingProspect = false;

    isDuplicateModalOpen = false;
    duplicateMatches: DuplicateMatch[] = [];
    private pendingSaveKeepOpen = false;
    companyContactLoading = false;
    companyContactError = "";
    creatingBranchContactIndex: number | null = null;
    companyContactOptions: CompanyRelatedContactOption[] = [];
    private companyProspectTargets: CompanyRelatedProspectTarget[] = [];
    private companyContactsLoadedForKey = "";

    formSaludo = "Sr.";
    formNombre = "";
    formCorreo = "";
    formCompania = "";
    formNit = "";
    formMovil = "";
    formSitioWeb = "";
    formTelefonoOficina = "";
    formPais = "";
    formCiudad = "";
    formDireccion = "";
    formEmpleado = "";
    formFuente = "";
    formCategoria = "";
    formEstado = "Pendiente";
    formServicio = "";
    formNota = "";
    prospectBranches: ProspectBranchDraft[] = [];
    private stopDraftWatch: () => void = () => undefined;
    private readonly convertingProspectIds = new Set<string>();
    private readonly convertedProspectIds = new Set<string>();

    private equipmentCountMap: Record<string, number> = {};
    private nextFollowupByProspectId: Record<string, ProspectFollowupBadge> = {};

    goBack(): void {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
            return;
        }

        this.router.navigateByUrl("/index", { replaceUrl: true });
    }

    constructor(
        private readonly router: Router,
        private readonly crmProspectsApi: CrmProspectsApiService,
        private readonly crmClientsApi: CrmClientsApiService,
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly crmFollowupsApi: CrmFollowupsApiService,
        private readonly hrPeople: HrPeoplePickerService,
        private readonly cdr: ChangeDetectorRef,
        private readonly formDraftService: FormDraftService,
    ) {
        const draft = this.formDraftService.load<{
            showProspectForm?: boolean;
            selectedProspectZone?: string;
            formSaludo?: string;
            formNombre?: string;
            formCorreo?: string;
            formCompania?: string;
            formNit?: string;
            formMovil?: string;
            formSitioWeb?: string;
            formTelefonoOficina?: string;
            formPais?: string;
            formCiudad?: string;
            formDireccion?: string;
            formEmpleado?: string;
            formFuente?: string;
            formCategoria?: string;
            formEstado?: string;
            formServicio?: string;
            formNota?: string;
            prospectBranches?: ProspectBranchDraft[];
        }>(CRM_PROSPECT_FORM_DRAFT_KEY);

        if (draft) {
            this.showProspectForm = Boolean(draft.showProspectForm ?? this.showProspectForm);
            this.selectedProspectZone = String(draft.selectedProspectZone ?? this.selectedProspectZone);
            this.formSaludo = String(draft.formSaludo ?? this.formSaludo);
            this.formNombre = String(draft.formNombre ?? this.formNombre);
            this.formCorreo = String(draft.formCorreo ?? this.formCorreo);
            this.formCompania = String(draft.formCompania ?? this.formCompania);
            this.formNit = String(draft.formNit ?? this.formNit);
            this.formMovil = String(draft.formMovil ?? this.formMovil);
            this.formSitioWeb = String(draft.formSitioWeb ?? this.formSitioWeb);
            this.formTelefonoOficina = String(draft.formTelefonoOficina ?? this.formTelefonoOficina);
            this.formPais = String(draft.formPais ?? this.formPais);
            this.formCiudad = String(draft.formCiudad ?? this.formCiudad);
            this.formDireccion = String(draft.formDireccion ?? this.formDireccion);
            this.formEmpleado = String(draft.formEmpleado ?? this.formEmpleado);
            this.formFuente = String(draft.formFuente ?? this.formFuente);
            this.formCategoria = String(draft.formCategoria ?? this.formCategoria);
            this.formEstado = String(draft.formEstado ?? this.formEstado);
            this.formServicio = String(draft.formServicio ?? this.formServicio);
            this.formNota = String(draft.formNota ?? this.formNota);
            this.prospectBranches = this.normalizeDraftProspectBranches(draft.prospectBranches);
        }

        this.stopDraftWatch = this.formDraftService.watch(CRM_PROSPECT_FORM_DRAFT_KEY, () => ({
            showProspectForm: this.showProspectForm,
            selectedProspectZone: this.selectedProspectZone,
            formSaludo: this.formSaludo,
            formNombre: this.formNombre,
            formCorreo: this.formCorreo,
            formCompania: this.formCompania,
            formNit: this.formNit,
            formMovil: this.formMovil,
            formSitioWeb: this.formSitioWeb,
            formTelefonoOficina: this.formTelefonoOficina,
            formPais: this.formPais,
            formCiudad: this.formCiudad,
            formDireccion: this.formDireccion,
            formEmpleado: this.formEmpleado,
            formFuente: this.formFuente,
            formCategoria: this.formCategoria,
            formEstado: this.formEstado,
            formServicio: this.formServicio,
            formNota: this.formNota,
            prospectBranches: this.prospectBranches,
        }));

        replaceProspects([]);
        this.loadProspectsFromApi();
        this.loadCatalogsFromApi();
        this.loadEmployeeOptions();
    }

    ngOnDestroy(): void {
        this.stopDraftWatch();
    }

    get quickAddTargetLabel(): string {
        switch (this.quickAddTarget) {
            case "fuentes":
                return "fuente";
            case "categorias":
                return "categoria";
            case "servicios":
                return "servicio";
            default:
                return "registro";
        }
    }

    openQuickAddModal(target: QuickAddTarget): void {
        this.quickAddTarget = target;
        this.quickAddInput = "";
        this.quickAddErrorMessage = "";
        this.isQuickAddModalOpen = true;
    }

    openProspectForm(): void {
        this.resetProspectForm();
        this.resetCompanyRelatedContactsContext();
        this.showProspectForm = true;
        this.cdr.detectChanges();
        this.bringProspectFormIntoView();
    }

    saveProspect(): void {
        this.doSaveProspect(false);
    }

    saveProspectAndAddMore(): void {
        this.doSaveProspect(true);
    }

    openEquipmentModal(prospect: ProspectRecord): void {
        this.selectedEquipmentProspect = prospect;
    }

    closeProspectForm(): void {
        this.showProspectForm = false;
        this.resetCompanyRelatedContactsContext();
    }

    onProspectCompanyInputChange(value: string): void {
        this.formCompania = String(value ?? "");
        this.resetCompanyRelatedContactsContext();
    }

    addProspectBranch(): void {
        const next = [...this.prospectBranches, this.getDefaultProspectBranchDraft()];
        if (next.length === 1) {
            next[0].isPrimary = true;
        }
        this.prospectBranches = next;
    }

    removeProspectBranch(branchIndex: number): void {
        const next = this.prospectBranches.filter((_, index) => index !== branchIndex);
        if (next.length > 0 && !next.some((branch) => branch.isPrimary)) {
            next[0] = { ...next[0], isPrimary: true };
        }
        this.prospectBranches = next;
    }

    setPrimaryProspectBranch(branchIndex: number): void {
        this.prospectBranches = this.prospectBranches.map((branch, index) => ({
            ...branch,
            isPrimary: index === branchIndex,
        }));
    }

    ensureCompanyRelatedContactsLoaded(): void {
        const companyKey = this.normalizeCompanyKey(this.formCompania);
        if (!companyKey || this.companyContactLoading || this.companyContactsLoadedForKey === companyKey) {
            return;
        }

        this.loadCompanyRelatedContacts();
    }

    applyCompanyRelatedContactToProspectBranch(branchIndex: number, selectedValue: string): void {
        const branch = this.prospectBranches[branchIndex];
        if (!branch) {
            return;
        }

        branch.selectedCompanyContactKey = String(selectedValue ?? "").trim();
        if (!branch.selectedCompanyContactKey) {
            return;
        }

        const selected = this.companyContactOptions.find((option) => option.value === branch.selectedCompanyContactKey);
        if (!selected) {
            return;
        }

        branch.contactName = selected.name || branch.contactName;
        branch.contactRole = selected.role || branch.contactRole;
        branch.email = selected.email || branch.email;
        branch.phone = selected.phone || branch.phone;
    }

    canCreateCompanyContactFromProspectBranch(branch: ProspectBranchDraft): boolean {
        return Boolean(this.formCompania.trim() && branch.contactName.trim() && this.creatingBranchContactIndex === null);
    }

    createCompanyContactFromProspectBranch(branchIndex: number): void {
        const branch = this.prospectBranches[branchIndex];
        if (!branch) {
            return;
        }

        this.ensureCompanyRelatedContactsLoaded();

        if (!this.formCompania.trim()) {
            this.prospectSaveErrorMessage = "Primero indica la empresa para crear un contacto relacionado.";
            return;
        }

        if (!branch.contactName.trim()) {
            this.prospectSaveErrorMessage = "Completa el nombre de contacto en la sucursal antes de crear el contacto relacionado.";
            return;
        }

        const targetProspect = this.companyProspectTargets[0];
        if (!targetProspect?.id) {
            this.prospectSaveErrorMessage = "No existe un prospecto de esta empresa para registrar el contacto relacionado.";
            return;
        }

        this.prospectSaveErrorMessage = "";
        this.creatingBranchContactIndex = branchIndex;

        this.crmProspectsApi.createProspectContact(targetProspect.id, {
            name: branch.contactName.trim(),
            email: branch.email.trim(),
            phone: branch.phone.trim(),
            role: branch.contactRole.trim(),
            notes: branch.name.trim() ? `Sucursal: ${branch.name.trim()}` : "Creado desde Prospectos > Sucursales",
        }).subscribe({
            next: (created) => {
                this.creatingBranchContactIndex = null;
                this.companyContactsLoadedForKey = "";
                this.loadCompanyRelatedContacts(created.id);
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.creatingBranchContactIndex = null;
                this.prospectSaveErrorMessage = this.resolveErrorMessage(error, "No se pudo crear el contacto relacionado.");
                this.cdr.detectChanges();
            },
        });
    }

    private bringProspectFormIntoView(): void {
        // The form is rendered below a potentially long table; auto-scroll/focus
        // makes the Add button behavior obvious for the user.
        setTimeout(() => {
            this.prospectFormCardRef?.nativeElement?.scrollIntoView({ behavior: "smooth", block: "start" });
            this.prospectNameInputRef?.nativeElement?.focus();
        }, 0);
    }

    closeEquipmentModal(): void {
        this.selectedEquipmentProspect = null;
    }

    closeQuickAddModal(): void {
        this.isQuickAddModalOpen = false;
        this.quickAddInput = "";
        this.quickAddErrorMessage = "";
    }

    confirmQuickAdd(): void {
        const value = this.quickAddInput.trim();
        if (!value) {
            this.quickAddErrorMessage = "Ingresa un nombre valido para el catalogo.";
            return;
        }

        const catalogType = this.catalogTypeFromQuickTarget(this.quickAddTarget);
        if (catalogType) {
            this.crmProspectsApi.addCatalogItem(catalogType, value).subscribe({
                next: () => {
                    this.loadCatalogsFromApi();
                    this.closeQuickAddModal();
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.quickAddErrorMessage = this.resolveErrorMessage(error, "No se pudo guardar el catalogo en backend.");
                    this.cdr.detectChanges();
                },
            });
        }
    }

    associatedEquipmentCount(prospect: ProspectRecord): number {
        const backendId = String(prospect.backendId ?? "").trim();
        if (backendId && this.equipmentCountMap[backendId] !== undefined) {
            return this.equipmentCountMap[backendId];
        }
        // Compat con registros legados guardados con el id numerico sintetico.
        return this.equipmentCountMap[String(prospect.id)] ?? 0;
    }

    handleEquipmentSaved(): void {
        this.refreshEquipmentCountsFromApi();
    }

    convertProspectToClient(prospect: ProspectRecord): void {
        if (this.isConvertingProspect(prospect.id) || this.isProspectConverted(prospect.id)) {
            return;
        }

        const nombre = prospect.nombre.trim();
        if (!nombre) {
            this.prospectConvertSuccessMessage = "";
            this.prospectConvertErrorMessage = "El prospecto debe tener nombre para convertirlo a cliente.";
            return;
        }

        const correo = prospect.correo.trim();
        if (correo && !this.isValidEmail(correo)) {
            this.prospectConvertSuccessMessage = "";
            this.prospectConvertErrorMessage = `El correo de ${nombre} no tiene un formato válido.`;
            return;
        }

        const payload: UpsertCrmClientRequest = {
            nombre,
            correo,
            empresa: prospect.compania.trim() || nombre,
            nit: prospect.nit.trim(),
            zona: prospect.zona.trim() || this.zoneOptions[0]?.name || "General",
            estado: "Activo",
            website: (prospect.sitioWeb ?? "").trim() === "--" ? "" : (prospect.sitioWeb ?? "").trim(),
            officePhone: (prospect.telefonoOficina ?? "").trim() === "--" ? "" : (prospect.telefonoOficina ?? "").trim(),
            country: (prospect.pais ?? "").trim() === "--" ? "" : (prospect.pais ?? "").trim(),
            city: (prospect.ciudad ?? "").trim() === "--" ? "" : (prospect.ciudad ?? "").trim(),
            address: (prospect.direccion ?? "").trim() === "--" ? "" : (prospect.direccion ?? "").trim(),
            credito: {
                enabled: false,
                creditLimit: 0,
                consumed: 0,
                lastPaymentDate: "",
                paymentTermDays: 30,
            },
            branches: this.mapProspectBranchesToClient(prospect),
        };

        this.convertingProspectIds.add(prospect.id);
        this.prospectConvertSuccessMessage = "";
        this.prospectConvertErrorMessage = "";

        this.crmClientsApi.createClient(payload).subscribe({
            next: () => {
                this.convertingProspectIds.delete(prospect.id);
                this.convertedProspectIds.add(prospect.id);
                this.prospectConvertErrorMessage = "";
                this.prospectConvertSuccessMessage = `Prospecto ${nombre} convertido a cliente correctamente.`;
                this.syncConvertedProspectsFromBackend();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.convertingProspectIds.delete(prospect.id);
                this.prospectConvertSuccessMessage = "";
                this.prospectConvertErrorMessage = this.resolveErrorMessage(error, "No se pudo convertir el prospecto a cliente.");
                this.cdr.detectChanges();
            },
        });
    }

    isConvertingProspect(prospectId: string): boolean {
        return this.convertingProspectIds.has(prospectId);
    }

    isProspectConverted(prospectId: string): boolean {
        return this.convertedProspectIds.has(prospectId);
    }

    nextFollowupBadge(prospectId: string): ProspectFollowupBadge | null {
        return this.nextFollowupByProspectId[prospectId] ?? null;
    }

    private doSaveProspect(keepOpen: boolean): void {
        const nombre = this.formNombre.trim();
        if (!nombre) {
            this.prospectSaveErrorMessage = "El nombre del contacto es requerido.";
            return;
        }

        const correo = this.formCorreo.trim();
        if (correo && !this.isValidEmail(correo)) {
            this.prospectSaveErrorMessage = "El correo electrónico no tiene un formato válido.";
            return;
        }

        const branches = this.normalizeProspectBranchesPayload();
        if (branches === null) {
            return;
        }

        this.prospectSaveErrorMessage = "";
        this.pendingSaveKeepOpen = keepOpen;
        this.isSavingProspect = true;

        this.crmClientsApi.listClients({ limit: 500 }).pipe(
            map((clients) => this.buildDuplicateMatches(clients)),
            catchError(() => of([] as DuplicateMatch[])),
        ).subscribe({
            next: (matches) => {
                if (matches.length > 0) {
                    this.isSavingProspect = false;
                    this.duplicateMatches = matches;
                    this.isDuplicateModalOpen = true;
                    this.cdr.detectChanges();
                    return;
                }
                this.executeProspectSave(branches, keepOpen);
            },
            error: () => {
                this.executeProspectSave(branches, keepOpen);
            },
        });
    }

    private executeProspectSave(branches: CrmUpsertBranchPayload[], keepOpen: boolean): void {
        this.crmProspectsApi.createProspect({
            salutation: this.formSaludo,
            name: this.formNombre.trim(),
            email: this.formCorreo.trim(),
            mobile: this.formMovil.trim(),
            company: this.formCompania.trim(),
            nit: this.formNit.trim(),
            website: this.formSitioWeb.trim(),
            officePhone: this.formTelefonoOficina.trim(),
            country: this.formPais.trim(),
            city: this.formCiudad.trim(),
            address: this.formDireccion.trim(),
            assignedEmployee: this.formEmpleado,
            source: this.formFuente,
            category: this.formCategoria,
            zone: this.selectedProspectZone,
            prospectValue: 0,
            allowFollowUp: true,
            status: this.formEstado,
            service: this.formServicio,
            note: this.formNota.trim(),
            branches,
        }).subscribe({
            next: () => {
                this.isSavingProspect = false;
                this.pendingSaveKeepOpen = false;
                this.loadProspectsFromApi();
                if (keepOpen) {
                    this.resetProspectForm();
                } else {
                    this.showProspectForm = false;
                }
                this.formDraftService.remove(CRM_PROSPECT_FORM_DRAFT_KEY);
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.isSavingProspect = false;
                this.pendingSaveKeepOpen = false;
                this.prospectSaveErrorMessage = this.resolveErrorMessage(error, "No se pudo guardar el prospecto en backend.");
                this.cdr.detectChanges();
            },
        });
    }

    closeDuplicateModal(): void {
        this.isDuplicateModalOpen = false;
        this.duplicateMatches = [];
        this.pendingSaveKeepOpen = false;
    }

    confirmSaveDespiteDuplicates(): void {
        const keepOpen = this.pendingSaveKeepOpen;
        this.isDuplicateModalOpen = false;
        this.duplicateMatches = [];
        const branches = this.normalizeProspectBranchesPayload();
        if (branches === null) {
            this.pendingSaveKeepOpen = false;
            return;
        }
        this.executeProspectSave(branches, keepOpen);
    }

    private buildDuplicateMatches(clients: CrmClientRecord[]): DuplicateMatch[] {
        const inputNombre = this.formNombre.trim();
        const inputCorreo = this.formCorreo.trim().toLowerCase();
        const inputEmpresa = this.formCompania.trim();
        const matches: DuplicateMatch[] = [];

        const isMatch = (recordNombre: string, recordCorreo: string, recordEmpresa: string): boolean => {
            if (inputCorreo && recordCorreo.trim().toLowerCase() === inputCorreo) {
                return true;
            }
            if (inputEmpresa && this.normalizeCompanyKey(recordEmpresa) === this.normalizeCompanyKey(inputEmpresa)) {
                return true;
            }
            if (inputNombre && this.normalizeCompanyKey(recordNombre) === this.normalizeCompanyKey(inputNombre)) {
                return true;
            }
            return false;
        };

        for (const row of this.prospectRows) {
            if (isMatch(row.nombre, row.correo, row.compania)) {
                matches.push({
                    type: "prospecto",
                    id: String(row.id),
                    nombre: row.nombre,
                    empresa: row.compania,
                    correo: row.correo,
                    zona: row.zona,
                    empleado: row.empleado,
                    estado: row.estado,
                    creado: row.creado,
                });
            }
        }

        for (const client of clients) {
            if (isMatch(client.nombre, client.correo, client.empresa)) {
                matches.push({
                    type: "cliente",
                    id: client.id,
                    nombre: client.nombre,
                    empresa: client.empresa,
                    correo: client.correo,
                    zona: client.zona,
                    empleado: "",
                    estado: client.estado,
                    creado: client.creado,
                });
            }
        }

        return matches;
    }

    private resetProspectForm(): void {
        this.formSaludo = "Sr.";
        this.formNombre = "";
        this.formCorreo = "";
        this.formCompania = "";
        this.formNit = "";
        this.formMovil = "";
        this.formSitioWeb = "";
        this.formTelefonoOficina = "";
        this.formPais = "";
        this.formCiudad = "";
        this.formDireccion = "";
        this.formEmpleado = "";
        this.formFuente = "";
        this.formCategoria = "";
        this.formEstado = "Pendiente";
        this.formServicio = "";
        this.formNota = "";
        this.prospectBranches = [];
        this.prospectSaveErrorMessage = "";
        this.resetCompanyRelatedContactsContext();
    }

    private loadProspectsFromApi(): void {
        this.crmProspectsApi.listProspects().subscribe({
            next: (items) => {
                this.prospectRows = items.map((record) => ({ ...record }));
                replaceProspects(this.prospectRows);
                this.prospectsLoadErrorMessage = "";
                this.refreshEquipmentCountsFromApi();
                this.refreshFollowupBadges(this.prospectRows);
                this.syncConvertedProspectsFromBackend();
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.prospectRows = [];
                replaceProspects([]);
                this.equipmentCountMap = {};
                this.nextFollowupByProspectId = {};
                this.convertedProspectIds.clear();
                this.prospectsLoadErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar prospectos desde backend.");
                this.cdr.detectChanges();
            },
        });
    }

    private loadCatalogsFromApi(): void {
        this.crmProspectsApi.catalogs().subscribe({
            next: (catalogs) => {
                this.sourceOptions = [...catalogs.sources];
                this.categoryOptions = [...catalogs.categories];
                this.serviceOptions = [...catalogs.services];
                this.zoneOptions = catalogs.zones.map((name, index) => ({ id: index + 1, name }));

                if (!this.zoneOptions.some((zone) => zone.name === this.selectedProspectZone)) {
                    this.selectedProspectZone = this.zoneOptions[0]?.name ?? "";
                }

                this.catalogsLoadErrorMessage = "";
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.sourceOptions = [];
                this.categoryOptions = [];
                this.serviceOptions = [];
                this.zoneOptions = [];
                this.selectedProspectZone = "";
                this.catalogsLoadErrorMessage = this.resolveErrorMessage(error, "No se pudo cargar catalogos desde backend.");
                this.cdr.detectChanges();
            },
        });
    }

    /**
     * El empleado del prospecto sale de RRHH, la única fuente de personas de la
     * plataforma. Contexto comercial: los prospectos se atienden en ventas; un
     * técnico no pertenece a esta lista (igual que un comercial no aparece en el
     * select de técnicos del tablero).
     * El quick-add antiguo creaba nombres fantasma en un catálogo local y esos
     * nombres luego se copiaban al assignee del proyecto al convertir. Esa puerta
     * está cerrada: si no hay comerciales activos, el select queda vacío y la
     * respuesta correcta es crear al empleado en RRHH — no inventarlo aquí. El
     * valor histórico (formEmpleado) siempre se mantiene visible vía optionsFor.
     */
    private loadEmployeeOptions(): void {
        void this.hrPeople.optionsFor(this.formEmpleado, [], "comercial").then((names) => {
            this.employeeOptions = names;
        });
    }

    private catalogTypeFromQuickTarget(target: QuickAddTarget): "sources" | "categories" | "services" | null {
        switch (target) {
            case "fuentes":
                return "sources";
            case "categorias":
                return "categories";
            case "servicios":
                return "services";
            default:
                return null;
        }
    }

    private refreshEquipmentCountsFromApi(): void {
        this.crmEquipmentApi.listItems().subscribe({
            next: (items) => {
                const countMap: Record<string, number> = {};
                for (const item of items) {
                    countMap[item.prospectId] = (countMap[item.prospectId] ?? 0) + 1;
                }
                this.equipmentCountMap = countMap;
                this.cdr.detectChanges();
            },
            error: () => {
                this.equipmentCountMap = {};
                this.cdr.detectChanges();
            },
        });
    }

    private refreshFollowupBadges(rows: ProspectRecord[]): void {
        const rowsWithBackend = rows.filter((row) => String(row.backendId ?? "").trim() !== "");
        if (rowsWithBackend.length === 0) {
            this.nextFollowupByProspectId = {};
            this.cdr.detectChanges();
            return;
        }

        const requests = rowsWithBackend.map((row) =>
            this.crmFollowupsApi.listProspectFollowups(row.backendId).pipe(
                map((items) => ({ prospectId: row.id, badge: this.buildFollowupBadge(items) })),
                catchError(() => of({ prospectId: row.id, badge: null as ProspectFollowupBadge | null })),
            ),
        );

        forkJoin(requests).subscribe((results) => {
            const badgeMap: Record<string, ProspectFollowupBadge> = {};
            for (const result of results) {
                if (result.badge) {
                    badgeMap[result.prospectId] = result.badge;
                }
            }

            this.nextFollowupByProspectId = badgeMap;
            this.cdr.detectChanges();
        });
    }

    private buildFollowupBadge(items: CrmProspectFollowup[]): ProspectFollowupBadge | null {
        const now = new Date();
        const pending = items
            .filter((item) => item.estado !== "Completado")
            .map((item) => ({ item, dueAt: this.parseFollowupDateTime(item.fecha, item.hora) }))
            .filter((entry) => entry.dueAt !== null) as Array<{ item: CrmProspectFollowup; dueAt: Date }>;

        if (pending.length === 0) {
            return null;
        }

        const future = pending
            .filter((entry) => entry.dueAt.getTime() >= now.getTime())
            .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

        const target =
            future[0] ??
            pending
                .sort((a, b) => b.dueAt.getTime() - a.dueAt.getTime())[0];

        const isOverdue = target.dueAt.getTime() < now.getTime();
        const isToday =
            target.dueAt.getFullYear() === now.getFullYear() &&
            target.dueAt.getMonth() === now.getMonth() &&
            target.dueAt.getDate() === now.getDate();

        const prefix = isOverdue ? "Seguimiento vencido" : "Proximo seguimiento";
        return {
            label: `${prefix}: ${this.formatFollowupBadgeDate(target.dueAt)}`,
            overdue: isOverdue,
            dueToday: isToday,
        };
    }

    private parseFollowupDateTime(fecha: string, hora: string): Date | null {
        const normalizedDate = String(fecha ?? "").trim();
        const normalizedTime = String(hora ?? "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate) || !/^\d{2}:\d{2}$/.test(normalizedTime)) {
            return null;
        }

        const parsed = new Date(`${normalizedDate}T${normalizedTime}:00`);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed;
    }

    private formatFollowupBadgeDate(date: Date): string {
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const isTomorrow = date.toDateString() === tomorrow.toDateString();

        const hh = String(date.getHours()).padStart(2, "0");
        const mm = String(date.getMinutes()).padStart(2, "0");
        if (isToday) {
            return `hoy ${hh}:${mm}`;
        }
        if (isTomorrow) {
            return `manana ${hh}:${mm}`;
        }

        const dd = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${dd}/${month} ${hh}:${mm}`;
    }

    private syncConvertedProspectsFromBackend(): void {
        this.crmClientsApi.listClients({ limit: 500 }).subscribe({
            next: (clients) => {
                this.convertedProspectIds.clear();
                for (const prospect of this.prospectRows) {
                    if (this.hasClientMatchForProspect(clients, prospect)) {
                        this.convertedProspectIds.add(prospect.id);
                    }
                }
                this.cdr.detectChanges();
            },
            error: () => {
                this.cdr.detectChanges();
            },
        });
    }

    private hasClientMatchForProspect(clients: CrmClientRecord[], prospect: ProspectRecord): boolean {
        const prospectCompany = prospect.compania.trim().toLowerCase();
        const prospectName = prospect.nombre.trim().toLowerCase();
        const prospectEmail = prospect.correo.trim().toLowerCase();

        return clients.some((client) => {
            const clientCompany = client.empresa.trim().toLowerCase();
            const clientName = client.nombre.trim().toLowerCase();
            const clientEmail = client.correo.trim().toLowerCase();

            if (prospectEmail && clientEmail && prospectEmail === clientEmail) {
                return true;
            }

            if (prospectCompany && clientCompany && prospectCompany === clientCompany) {
                return true;
            }

            return Boolean(prospectName && clientName && prospectName === clientName && (!prospectCompany || !clientCompany || prospectCompany === clientCompany));
        });
    }

    private loadCompanyRelatedContacts(preselectContactId = ""): void {
        const companyName = this.formCompania.trim();
        const companyKey = this.normalizeCompanyKey(companyName);
        if (!companyKey) {
            this.resetCompanyRelatedContactsContext();
            return;
        }

        this.companyContactLoading = true;
        this.companyContactError = "";

        this.crmProspectsApi.listProspects().pipe(catchError(() => of([] as CrmProspectRecord[]))).subscribe({
            next: (prospects) => {
                const matches = prospects
                    .filter((prospect) => this.normalizeCompanyKey(prospect.compania) === companyKey)
                    .map((prospect) => ({ id: String(prospect.backendId ?? "").trim(), name: prospect.nombre.trim() }))
                    .filter((target) => target.id.length > 0);

                this.companyProspectTargets = matches;

                if (matches.length === 0) {
                    this.companyContactLoading = false;
                    this.companyContactsLoadedForKey = companyKey;
                    this.companyContactOptions = [];
                    this.cdr.detectChanges();
                    return;
                }

                const requests = matches.map((target) =>
                    this.crmProspectsApi.listProspectContacts(target.id).pipe(catchError(() => of([] as CrmProspectContact[]))),
                );

                forkJoin(requests).subscribe({
                    next: (groups) => {
                        const options = this.mergeCompanyContactOptions(
                            groups.flatMap((contacts, index) => {
                                const source = matches[index];
                                const sourceLabel = source?.name ? `Prospecto · ${source.name}` : "Prospecto";
                                return contacts
                                    .map((contact) => {
                                        const name = String(contact.name ?? "").trim();
                                        const email = String(contact.email ?? "").trim();
                                        const phone = String(contact.phone ?? "").trim();
                                        const role = String(contact.role ?? "").trim();
                                        const id = String(contact.id ?? "").trim();

                                        if (!name && !email && !phone) {
                                            return null;
                                        }

                                        return {
                                            value: `${source.id}:${id || name || email || phone}`,
                                            name: name || email || phone,
                                            role,
                                            email,
                                            phone,
                                            sourceLabel,
                                        } as CompanyRelatedContactOption;
                                    })
                                    .filter((entry): entry is CompanyRelatedContactOption => entry !== null);
                            }),
                        );

                        this.companyContactLoading = false;
                        this.companyContactsLoadedForKey = companyKey;
                        this.companyContactOptions = options;
                        this.applyPreselectedContactToBranches(preselectContactId);
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        this.companyContactLoading = false;
                        this.companyContactsLoadedForKey = companyKey;
                        this.companyContactOptions = [];
                        this.companyContactError = "No se pudieron cargar los contactos relacionados de la empresa.";
                        this.cdr.detectChanges();
                    },
                });
            },
            error: () => {
                this.companyContactLoading = false;
                this.companyContactError = "No se pudieron cargar los prospectos para esta empresa.";
                this.cdr.detectChanges();
            },
        });
    }

    private applyPreselectedContactToBranches(contactId: string): void {
        const normalized = String(contactId ?? "").trim();
        if (!normalized) {
            return;
        }

        const selected = this.companyContactOptions.find((option) => option.value.endsWith(`:${normalized}`));
        if (!selected || this.prospectBranches.length === 0) {
            return;
        }

        const primaryIndex = this.prospectBranches.findIndex((branch) => branch.isPrimary);
        const targetIndex = primaryIndex >= 0 ? primaryIndex : 0;
        this.applyCompanyRelatedContactToProspectBranch(targetIndex, selected.value);
    }

    private mergeCompanyContactOptions(options: CompanyRelatedContactOption[]): CompanyRelatedContactOption[] {
        const merged = new Map<string, CompanyRelatedContactOption>();

        options.forEach((option, index) => {
            const name = String(option.name ?? "").trim();
            const email = String(option.email ?? "").trim();
            const phone = String(option.phone ?? "").trim();
            const role = String(option.role ?? "").trim();
            const sourceLabel = String(option.sourceLabel ?? "").trim();
            const dedupeKey = `${this.normalizeCompanyKey(name)}|${this.normalizeCompanyKey(email)}|${this.normalizeCompanyKey(phone)}`;

            if (!name && !email && !phone) {
                return;
            }

            const current = merged.get(dedupeKey);
            if (current) {
                if (!current.role && role) {
                    current.role = role;
                }
                if (!current.email && email) {
                    current.email = email;
                }
                if (!current.phone && phone) {
                    current.phone = phone;
                }
                if (!current.sourceLabel && sourceLabel) {
                    current.sourceLabel = sourceLabel;
                }
                return;
            }

            merged.set(dedupeKey, {
                value: String(option.value ?? `contact-${index}`).trim() || `contact-${index}`,
                name: name || email || phone,
                role,
                email,
                phone,
                sourceLabel,
            });
        });

        return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    }

    private resetCompanyRelatedContactsContext(): void {
        this.companyContactLoading = false;
        this.companyContactError = "";
        this.companyContactOptions = [];
        this.companyProspectTargets = [];
        this.companyContactsLoadedForKey = "";
        this.creatingBranchContactIndex = null;
        this.prospectBranches = this.prospectBranches.map((branch) => ({
            ...branch,
            selectedCompanyContactKey: "",
        }));
    }

    private normalizeCompanyKey(value: string): string {
        return String(value ?? "").trim().toLowerCase();
    }

    private getDefaultProspectBranchDraft(): ProspectBranchDraft {
        return {
            name: "",
            contactName: "",
            selectedCompanyContactKey: "",
            contactRole: "",
            email: "",
            phone: "",
            country: "",
            city: "",
            address: "",
            isPrimary: false,
        };
    }

    private normalizeDraftProspectBranches(value: ProspectBranchDraft[] | undefined): ProspectBranchDraft[] {
        if (!Array.isArray(value) || value.length === 0) {
            return [];
        }

        const mapped = value.map((branch) => ({
            name: String(branch.name ?? "").trim(),
            contactName: String(branch.contactName ?? "").trim(),
            selectedCompanyContactKey: "",
            contactRole: String(branch.contactRole ?? "").trim(),
            email: String(branch.email ?? "").trim(),
            phone: String(branch.phone ?? "").trim(),
            country: String(branch.country ?? "").trim(),
            city: String(branch.city ?? "").trim(),
            address: String(branch.address ?? "").trim(),
            isPrimary: Boolean(branch.isPrimary),
        })).filter((branch) => branch.name.length > 0 || branch.contactName.length > 0 || branch.email.length > 0 || branch.city.length > 0 || branch.address.length > 0 || branch.isPrimary);

        if (mapped.length === 0) {
            return [];
        }

        const primaryIndex = mapped.findIndex((branch) => branch.isPrimary);
        if (primaryIndex < 0) {
            mapped[0].isPrimary = true;
        } else {
            for (let index = 0; index < mapped.length; index += 1) {
                mapped[index].isPrimary = index === primaryIndex;
            }
        }

        return mapped;
    }

    private normalizeProspectBranchesPayload(): CrmUpsertBranchPayload[] | null {
        const normalized: CrmUpsertBranchPayload[] = [];
        let primaryCount = 0;

        for (const branch of this.prospectBranches) {
            const name = branch.name.trim();
            const contactName = branch.contactName.trim();
            const contactRole = branch.contactRole.trim();
            const email = branch.email.trim();
            const phone = branch.phone.trim();
            const country = branch.country.trim();
            const city = branch.city.trim();
            const address = branch.address.trim();
            const hasContent = Boolean(name || contactName || contactRole || email || phone || country || city || address || branch.isPrimary);

            if (!hasContent) {
                continue;
            }

            if (!name) {
                this.prospectSaveErrorMessage = "Cada sucursal del prospecto debe tener nombre.";
                return null;
            }

            if (email && !this.isValidEmail(email)) {
                this.prospectSaveErrorMessage = `El correo de la sucursal ${name} no tiene un formato valido.`;
                return null;
            }

            const normalizedBranch: CrmUpsertBranchPayload = {
                name,
                contactName,
                contactRole,
                email,
                phone,
                country,
                city,
                address,
                isPrimary: Boolean(branch.isPrimary),
            };

            if (normalizedBranch.isPrimary) {
                primaryCount += 1;
            }

            normalized.push(normalizedBranch);
        }

        if (normalized.length > 0) {
            if (primaryCount > 1) {
                this.prospectSaveErrorMessage = "Solo una sucursal puede marcarse como principal.";
                return null;
            }
            if (primaryCount === 0) {
                normalized[0].isPrimary = true;
            }
        }

        return normalized;
    }

    private mapProspectBranchesToClient(prospect: ProspectRecord): NonNullable<UpsertCrmClientRequest["branches"]> {
        const branches = (prospect.branches ?? []).map((branch) => ({
            name: String(branch.name ?? "").trim(),
            contactName: String(branch.contactName ?? "").trim(),
            contactRole: String(branch.contactRole ?? "").trim(),
            email: String(branch.email ?? "").trim(),
            phone: String(branch.phone ?? "").trim(),
            country: String(branch.country ?? "").trim(),
            city: String(branch.city ?? "").trim(),
            address: String(branch.address ?? "").trim(),
            isPrimary: Boolean(branch.isPrimary),
        })).filter((branch) => branch.name.length > 0 || branch.contactName.length > 0 || branch.email.length > 0 || branch.city.length > 0 || branch.address.length > 0 || branch.isPrimary);

        const primaryIndex = branches.findIndex((branch) => branch.isPrimary);
        if (branches.length > 0) {
            if (primaryIndex < 0) {
                branches[0].isPrimary = true;
            } else {
                for (let index = 0; index < branches.length; index += 1) {
                    branches[index].isPrimary = index === primaryIndex;
                }
            }
            return branches;
        }

        const fallbackName = prospect.compania.trim() || prospect.nombre.trim();
        const hasFallback = Boolean(fallbackName || prospect.correo.trim() || prospect.movil.trim() || prospect.pais.trim() || prospect.ciudad.trim() || prospect.direccion.trim());
        if (!hasFallback) {
            return [];
        }

        return [{
            name: fallbackName || "Sucursal principal",
            contactName: prospect.nombre.trim(),
            contactRole: "",
            email: prospect.correo.trim(),
            phone: prospect.movil.trim(),
            country: prospect.pais.trim() === "--" ? "" : prospect.pais.trim(),
            city: prospect.ciudad.trim() === "--" ? "" : prospect.ciudad.trim(),
            address: prospect.direccion.trim() === "--" ? "" : prospect.direccion.trim(),
            isPrimary: true,
        }];
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }
        return fallback;
    }

    private isValidEmail(email: string): boolean {
        return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
    }
}
