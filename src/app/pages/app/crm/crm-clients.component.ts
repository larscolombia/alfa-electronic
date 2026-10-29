import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ChangeDetectorRef } from "@angular/core";
import { catchError, forkJoin, of } from "rxjs";
import { CrmZoneRecord, getCrmZones } from "./crm-zones.store";
import { CrmBranchRecord, CrmClientRecord, CrmClientsApiService, UpsertCrmClientRequest } from "../../../services/crm-clients-api.service";
import { CrmProspectContact, CrmProspectRecord, CrmProspectsApiService } from "../../../services/crm-prospects-api.service";
import { replaceCrmClients } from "./crm-clients.store";
import { CrmClientsImportComponent } from "./crm-clients-import.component";
import { COUNTRY_OPTIONS, citiesForCountry } from "./country-city.dataset";
import * as XLSX from "xlsx";

interface ClientBranchDraft {
    id?: string;
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
}

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

interface ClientDraft {
    nombre: string;
    correo: string;
    empresa: string;
    nit: string;
    zona: string;
    estado: "Activo" | "Inactivo";
    website: string;
    officePhone: string;
    country: string;
    city: string;
    address: string;
    // Fase 5b: datos fiscales para facturación electrónica.
    dv: string;
    postalCode: string;
    billingEmail: string;
    grandContributor: boolean;
    idType: string;
    creditEnabled: boolean;
    creditLimit: number | null;
    creditConsumed: number | null;
    lastPaymentDate: string;
    paymentTermDays: number | null;
    branches: ClientBranchDraft[];
}

@Component({
    selector: "app-crm-clients",
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule, CrmClientsImportComponent],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col mb-3 mb-sm-0">
                    <h5 class="mb-0">Clientes</h5>
                    <p class="text-secondary small mb-0">Gestion centralizada de cuentas y datos empresariales.</p>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">CRM</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Clientes</li>
                </ol>
            </nav>
        </div>

        <div class="container-fluid mt-3" id="main-content">
            @if (successMessage) {
                <div class="alert alert-success border mb-3">{{ successMessage }}</div>
            }
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            <div class="card adminuiux-card mb-3 mb-lg-4" data-testid="clients-list-card" *ngIf="!showAddClient && !showImport">
                <div class="card-body">
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <button class="btn btn-theme" type="button" (click)="openCreateClient()"><i class="bi bi-plus-lg me-1"></i> Agregar Cliente</button>
                        <button class="btn btn-outline-secondary" type="button" (click)="showImport = true"><i class="bi bi-upload me-1"></i> Importar clientes</button>
                        <button class="btn btn-outline-success" type="button"
                            [disabled]="exportandoClientes"
                            (click)="exportClientsToExcel()">
                            <i class="bi bi-file-earmark-excel me-1"></i>
                            {{ exportandoClientes ? "Exportando..." : "Exportar a Excel" }}
                        </button>
                    </div>

<div class="row g-2 align-items-center mb-3">
                        <div class="col-12 col-md-8 col-lg-6">
                            <label for="clientSearchTerm" class="form-label small mb-1">Buscar clientes</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                <input
                                    id="clientSearchTerm"
                                    type="search"
                                    class="form-control"
                                    placeholder="Nombre, empresa, correo, NIT, teléfono..."
                                    [(ngModel)]="clientSearchTerm"
                                    (ngModelChange)="clientPage = 1"
                                    autocomplete="off">
                                <button
                                    *ngIf="clientSearchTerm"
                                    class="btn btn-outline-secondary"
                                    type="button"
                                    aria-label="Limpiar búsqueda"
                                    (click)="clientSearchTerm = ''; clientPage = 1">
                                    Limpiar
                                </button>
                            </div>
                        </div>
                        <div class="col-12 col-md text-md-end small text-secondary">
                            {{ filteredClients.length }} de {{ clients.length }} clientes
                        </div>
                    </div>

                    <div class="table-responsive border rounded">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>
                                        <button class="btn btn-link p-0 text-reset text-decoration-none fw-semibold" type="button" (click)="toggleClientSort('cliente')">
                                            Cliente <i class="bi" [ngClass]="sortColumn === 'cliente' ? (sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up'"></i>
                                        </button>
                                    </th>
                                    <th>
                                        <button class="btn btn-link p-0 text-reset text-decoration-none fw-semibold" type="button" (click)="toggleClientSort('contacto')">
                                            Contacto <i class="bi" [ngClass]="sortColumn === 'contacto' ? (sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up'"></i>
                                        </button>
                                    </th>
                                    <th>
                                        <button class="btn btn-link p-0 text-reset text-decoration-none fw-semibold" type="button" (click)="toggleClientSort('detalles')">
                                            Detalles <i class="bi" [ngClass]="sortColumn === 'detalles' ? (sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up'"></i>
                                        </button>
                                    </th>
                                    <th>
                                        <button class="btn btn-link p-0 text-reset text-decoration-none fw-semibold" type="button" (click)="toggleClientSort('estado')">
                                            Estado <i class="bi" [ngClass]="sortColumn === 'estado' ? (sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down') : 'bi-arrow-down-up'"></i>
                                        </button>
                                    </th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let client of displayedClients">
                                    <td>
                                        <a class="text-decoration-none fw-semibold" [routerLink]="['/app/crm-clientes', client.id]">{{ client.nombre }}</a>
                                        <div class="small text-secondary">{{ client.empresa || '--' }}</div>
                                    </td>
                                    <td>
                                        {{ client.correo || '--' }}
                                        <div class="small text-secondary">{{ client.nit || '--' }}</div>
                                    </td>
                                    <td>
                                        <div class="d-flex flex-wrap gap-1">
                                            <span class="badge text-bg-info">{{ client.zona }}</span>
                                            @if (client.credito.enabled) {
                                                <span class="badge text-bg-warning">Cupo: {{ client.credito.creditLimit | currency: "COP" : "symbol" : "1.0-0" }}</span>
                                            } @else {
                                                <span class="badge text-bg-secondary">Sin cupo</span>
                                            }
                                        </div>
                                        <div class="small text-secondary mt-1">Creado: {{ client.creado }}</div>
                                    </td>
                                    <td>
                                        <span class="badge" [class.text-bg-success]="client.estado === 'Activo'" [class.text-bg-secondary]="client.estado === 'Inactivo'">
                                            {{ client.estado }}
                                        </span>
                                    </td>
                                    <td class="text-end position-relative">
                                        <div class="dropdown d-inline-block">
                                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" data-bs-boundary="window" data-bs-popper-config='{"strategy":"fixed","modifiers":[{"name":"computeStyles","options":{"gpuAcceleration":false}}]}'>
                                                Acciones
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-end" style="z-index: 2000;">
                                                <li><a class="dropdown-item" [routerLink]="['/app/crm-clientes', client.id]">Abrir ficha</a></li>
                                                <li><button class="dropdown-item" type="button" (click)="editClient(client.id)">Editar</button></li>
                                                <li><button class="dropdown-item text-danger" type="button" (click)="removeClient(client.id)">Eliminar</button></li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                                <tr *ngIf="filteredClients.length === 0">
                                    <td colspan="5" class="text-center py-5 text-secondary">No encontramos clientes. Cambia la búsqueda o agrega el primero.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="d-flex justify-content-between align-items-center gap-2 mt-3" *ngIf="filteredClients.length > 0" data-testid="clients-pagination">
                        <span class="small text-secondary">Mostrando {{ clientPageStart }}–{{ clientPageEnd }} de {{ filteredClients.length }}</span>
                        <div class="btn-group" aria-label="Paginación de clientes">
                            <button class="btn btn-outline-secondary" type="button" (click)="clientPage = clientPage - 1" [disabled]="clientPage === 1">Anterior</button>
                            <button class="btn btn-outline-secondary disabled" type="button" aria-current="page">Página {{ clientPage }} de {{ clientTotalPages }}</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="clientPage = clientPage + 1" [disabled]="clientPage === clientTotalPages">Siguiente</button>
                        </div>
                    </div>
                </div>
            </div>

            <app-crm-clients-import
                *ngIf="showImport"
                (imported)="onImportCompleted($event)"
                (closed)="showImport = false"></app-crm-clients-import>

            <div class="card adminuiux-card mb-3 mb-lg-4" data-testid="client-form-card" *ngIf="showAddClient">
                <div class="card-header border-bottom d-flex justify-content-between align-items-center gap-2">
                    <div>
                        <h5 class="mb-1">{{ editingClientId === null ? "Nuevo cliente" : "Editar cliente" }}</h5>
                        <p class="small text-secondary mb-0">Datos comerciales, fiscales y de contacto de la cuenta.</p>
                    </div>
                    <button class="btn btn-outline-secondary" type="button" (click)="cancelForm()"><i class="bi bi-x-lg me-1"></i>Cerrar</button>
                </div>
                <div class="card-body">
                    @if (draft.creditEnabled) {
                        <div class="alert alert-info border">
                            <strong>Cliente con crédito.</strong>
                            Cupo máximo autorizado:
                            {{ toPositiveNumber(draft.creditLimit) | currency: "COP" : "symbol" : "1.0-0" }}
                        </div>
                    }

                    <h6 class="mb-3">Información de la cuenta</h6>
                    <div class="row gx-3">
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Nombre del cliente</label>
                            <input class="form-control" placeholder="por ejemplo, Juan Perez" [(ngModel)]="draft.nombre" name="nombre" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Correo electronico</label>
                            <input class="form-control" placeholder="por ejemplo, juanperez@example.com" [(ngModel)]="draft.correo" name="correo" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Estado</label>
                            <select class="form-select" [(ngModel)]="draft.estado" name="estado">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>

                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Empresa</label>
                            <input
                                class="form-control"
                                placeholder="por ejemplo, Corporacion Acme"
                                [ngModel]="draft.empresa"
                                (ngModelChange)="onCompanyInputChange($event)"
                                name="empresa" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">NIT</label>
                            <input class="form-control" placeholder="por ejemplo, 900123456-7" [(ngModel)]="draft.nit" name="nit" maxlength="80" />
                        </div>

                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Tipo de identificación</label>
                            <select class="form-select" [(ngModel)]="draft.idType" name="idType" data-testid="client-id-type">
                                <option value="NIT">NIT</option>
                                <option value="CC">CC</option>
                                <option value="CE">CE</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">DV</label>
                            <input class="form-control" placeholder="Dígito de verificación" [(ngModel)]="draft.dv" name="dv" maxlength="4" data-testid="client-dv" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Código postal</label>
                            <input class="form-control" placeholder="por ejemplo, 110111" [(ngModel)]="draft.postalCode" name="postalCode" maxlength="20" data-testid="client-postal-code" />
                        </div>
                        <div class="col-12 col-lg-8 mb-3">
                            <label class="form-label">Correo de facturación electrónica</label>
                            <input class="form-control" type="email" placeholder="facturacion@empresa.com (distinto del correo general)" [(ngModel)]="draft.billingEmail" name="billingEmail" maxlength="180" data-testid="client-billing-email" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3 d-flex align-items-end">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="grandContributor" [(ngModel)]="draft.grandContributor" name="grandContributor" data-testid="client-grand-contributor" />
                                <label class="form-check-label" for="grandContributor">Gran contribuyente</label>
                            </div>
                        </div>

                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Sitio web</label>
                            <input class="form-control" type="url" placeholder="https://empresa.com" [(ngModel)]="draft.website" name="website" maxlength="255" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Telefono de oficina</label>
                            <input class="form-control" placeholder="por ejemplo, 6011234567" [(ngModel)]="draft.officePhone" name="officePhone" maxlength="40" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Pais</label>
                            <select class="form-select" [(ngModel)]="draft.country" (ngModelChange)="onDraftCountryChange($event)" name="country" data-testid="client-country"><option value="">Seleccionar país</option><option *ngFor="let country of countryOptions" [value]="country">{{ country }}</option></select>
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Ciudad</label>
                            <select class="form-select" [(ngModel)]="draft.city" [disabled]="!draft.country" name="city" data-testid="client-city"><option value="">Seleccionar ciudad</option><option *ngFor="let city of draftCityOptions" [value]="city">{{ city }}</option></select>
                        </div>
                        <div class="col-12 col-lg-8 mb-3">
                            <label class="form-label">Direccion</label>
                            <input class="form-control" placeholder="Direccion principal" [(ngModel)]="draft.address" name="address" maxlength="500" />
                        </div>

                        <div class="col-12 col-lg-8 mb-3">
                            <label class="form-label d-block">Zona</label>
                            <div class="d-flex flex-wrap gap-3">
                                @for (zone of zoneOptions; track zone.id) {
                                    <div class="form-check">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            [id]="'clientZone-' + zone.id"
                                            [checked]="draft.zona === zone.name"
                                            (change)="selectZone(zone.name)" />
                                        <label class="form-check-label" [for]="'clientZone-' + zone.id">{{ zone.name }}</label>
                                    </div>
                                }
                            </div>
                        </div>
                        <div class="col-12 col-lg-2 mb-3">
                            <label class="form-label d-block">Cliente con crédito?</label>
                            <div class="form-check mt-2">
                                <input class="form-check-input" type="checkbox" id="creditEnabled" [(ngModel)]="draft.creditEnabled" name="creditEnabled" />
                                <label class="form-check-label" for="creditEnabled">Si</label>
                            </div>
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Cupo maximo</label>
                            <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.creditLimit" name="creditLimit" />
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Cupo consumido</label>
                            <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draft.creditConsumed" name="creditConsumed" />
                        </div>

                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Fecha de ultimo pago</label>
                            <input class="form-control" type="date" [(ngModel)]="draft.lastPaymentDate" name="lastPaymentDate" />
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Plazo de pago (dias)</label>
                            <input class="form-control" type="number" min="0" step="1" [(ngModel)]="draft.paymentTermDays" name="paymentTermDays" />
                        </div>

                        <div class="col-12 mb-3">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                <label class="form-label mb-0">Sucursales del cliente</label>
                                <button class="btn btn-sm btn-outline-theme" type="button" (click)="addBranch()">
                                    <i class="bi bi-diagram-3 me-1"></i>Agregar sucursal
                                </button>
                            </div>

                            @if (draft.branches.length === 0) {
                                <p class="small text-secondary mb-0">Sin sucursales registradas. Puedes crear multiples sedes para este cliente.</p>
                            }

                            @for (branch of draft.branches; track $index; let branchIndex = $index) {
                                <div class="border rounded p-3 mb-2">
                                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                                        <strong>Sucursal {{ branchIndex + 1 }}</strong>
                                        <div class="d-flex gap-2">
                                            <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="branch.isPrimary" (click)="setPrimaryBranch(branchIndex)">
                                                {{ branch.isPrimary ? 'Principal' : 'Marcar principal' }}
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeBranch(branchIndex)">Quitar</button>
                                        </div>
                                    </div>

                                    <div class="row gx-3 gy-2">
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Nombre de sucursal</label>
                                            <input class="form-control" [(ngModel)]="branch.name" [name]="'branchName-' + branchIndex" placeholder="Ej: Sede Norte" />
                                        </div>
                                        <div class="col-12 col-lg-8">
                                            <label class="form-label">Contacto relacionado de la empresa</label>
                                            <div class="d-flex flex-wrap gap-2 align-items-center">
                                                <select
                                                    class="form-select"
                                                    style="min-width: 240px;"
                                                    [ngModel]="branch.selectedCompanyContactKey || ''"
                                                    (focus)="ensureCompanyRelatedContactsLoaded()"
                                                    (ngModelChange)="applyCompanyRelatedContactToBranch(branchIndex, $event)"
                                                    [name]="'branchRelatedContact-' + branchIndex">
                                                    <option value="">Seleccionar contacto existente</option>
                                                    <option *ngFor="let option of companyContactOptions" [value]="option.value">
                                                        {{ option.name }}{{ option.role ? ' · ' + option.role : '' }}{{ option.sourceLabel ? ' · ' + option.sourceLabel : '' }}
                                                    </option>
                                                </select>

                                                <button
                                                    class="btn btn-outline-theme btn-sm"
                                                    type="button"
                                                    [disabled]="creatingBranchContactIndex === branchIndex || !canCreateCompanyContactFromBranch(branch)"
                                                    (click)="createCompanyContactFromBranch(branchIndex)">
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
                                            <input class="form-control" [(ngModel)]="branch.contactName" [name]="'branchContactName-' + branchIndex" placeholder="Ej: Laura Perez" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Rol contacto</label>
                                            <input class="form-control" [(ngModel)]="branch.contactRole" [name]="'branchContactRole-' + branchIndex" placeholder="Ej: Compras" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Correo</label>
                                            <input class="form-control" [(ngModel)]="branch.email" [name]="'branchEmail-' + branchIndex" placeholder="correo@sucursal.com" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Telefono</label>
                                            <input class="form-control" [(ngModel)]="branch.phone" [name]="'branchPhone-' + branchIndex" placeholder="Ej: 6011234567" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Pais</label>
                                            <select class="form-select" [(ngModel)]="branch.country" (ngModelChange)="onBranchCountryChange(branch, $event)" [name]="'branchCountry-' + branchIndex"><option value="">Seleccionar país</option><option *ngFor="let country of countryOptions" [value]="country">{{ country }}</option></select>
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Ciudad</label>
                                            <select class="form-select" [(ngModel)]="branch.city" [disabled]="!branch.country" [name]="'branchCity-' + branchIndex"><option value="">Seleccionar ciudad</option><option *ngFor="let city of citiesForBranch(branch)" [value]="city">{{ city }}</option></select>
                                        </div>
                                        <div class="col-12 col-lg-8">
                                            <label class="form-label">Direccion</label>
                                            <input class="form-control" [(ngModel)]="branch.address" [name]="'branchAddress-' + branchIndex" placeholder="Direccion de la sucursal" />
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-theme me-2" type="button" [disabled]="isSavingClient" (click)="saveClient()">
                        <span *ngIf="isSavingClient" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        <i *ngIf="!isSavingClient" class="bi bi-check2 me-1"></i>
                        {{ isSavingClient ? 'Guardando...' : 'Guardar' }}
                    </button>
                    <button class="btn btn-link" type="button" [disabled]="isSavingClient" (click)="cancelForm()">Cancelar</button>
                </div>
            </div>
        </div>
    `,
})
export class CrmClientsComponent {
    readonly countryOptions = COUNTRY_OPTIONS;
    clients: CrmClientRecord[] = [];
    clientSearchTerm = "";
    clientPage = 1;
    readonly clientPageSize = 10;
    sortColumn: "cliente" | "contacto" | "detalles" | "estado" = "cliente";
    sortDirection: "asc" | "desc" = "asc";

    toggleClientSort(column: "cliente" | "contacto" | "detalles" | "estado"): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
            this.clientPage = 1;
            return;
        }

        this.sortColumn = column;
        this.sortDirection = "asc";
        this.clientPage = 1;
    }

    private getClientSortValue(client: CrmClientRecord, column: "cliente" | "contacto" | "detalles" | "estado"): string {
        switch (column) {
            case "cliente":
                return `${client.nombre ?? ""} ${client.empresa ?? ""}`.trim();
            case "contacto":
                return `${client.correo ?? ""} ${client.nit ?? ""}`.trim();
            case "detalles":
                return `${client.zona ?? ""} ${client.creado ?? ""}`.trim();
            case "estado":
                return String(client.estado ?? "");
        }
    }
    zoneOptions: CrmZoneRecord[] = [];
    showAddClient = false;
    showImport = false;
    exportandoClientes = false;
    editingClientId: string | null = null;
    successMessage = "";
    formError = "";
    isSavingClient = false;
    isDeletingClient = false;
    draft: ClientDraft = this.getDefaultDraft();

    get draftCityOptions(): readonly string[] { return citiesForCountry(this.draft.country); }

    onDraftCountryChange(country: string): void {
        this.draft.country = country;
        if (!this.draftCityOptions.includes(this.draft.city)) this.draft.city = "";
    }

    citiesForBranch(branch: ClientBranchDraft): readonly string[] { return citiesForCountry(branch.country); }

    onBranchCountryChange(branch: ClientBranchDraft, country: string): void {
        branch.country = country;
        if (!this.citiesForBranch(branch).includes(branch.city)) branch.city = "";
    }
    companyContactLoading = false;
    companyContactError = "";
    creatingBranchContactIndex: number | null = null;
    companyContactOptions: CompanyRelatedContactOption[] = [];
    private companyProspectTargets: CompanyRelatedProspectTarget[] = [];
    private companyContactsLoadedForKey = "";

    constructor(
        private readonly crmClientsApi: CrmClientsApiService,
        private readonly crmProspectsApi: CrmProspectsApiService,
        private readonly cdr: ChangeDetectorRef,
    ) {
        this.loadZones();
        this.loadClients();
        this.ensureDraftZone();
    }

    onImportCompleted(created: number): void {
        this.loadClients();
        this.successMessage = created === 1 ? "1 cliente importado correctamente." : `${created} clientes importados correctamente.`;
    }

    openCreateClient(): void {
        this.successMessage = "";
        this.formError = "";
        this.editingClientId = null;
        this.draft = this.getDefaultDraft();
        this.resetCompanyRelatedContactsContext();
        this.ensureDraftZone();
        this.showAddClient = true;
    }

    editClient(clientId: string): void {
        this.successMessage = "";
        this.formError = "";

        const client = this.clients.find((item) => item.id === clientId);
        if (!client) {
            this.formError = "No se encontro el cliente para editar.";
            return;
        }

        this.editingClientId = client.id;
        this.draft = {
            nombre: client.nombre,
            correo: client.correo,
            empresa: client.empresa,
            nit: client.nit,
            zona: client.zona,
            estado: client.estado,
            website: client.website ?? "",
            officePhone: client.officePhone ?? "",
            country: client.country ?? "",
            city: client.city ?? "",
            address: client.address ?? "",
            dv: client.dv ?? "",
            postalCode: client.postalCode ?? "",
            billingEmail: client.billingEmail ?? "",
            grandContributor: Boolean(client.grandContributor),
            idType: client.idType || "NIT",
            creditEnabled: client.credito.enabled,
            creditLimit: client.credito.creditLimit,
            creditConsumed: client.credito.consumed,
            lastPaymentDate: client.credito.lastPaymentDate,
            paymentTermDays: client.credito.paymentTermDays,
            branches: this.mapBranchesToDraft(client.branches),
        };

        this.resetCompanyRelatedContactsContext();

        this.showAddClient = true;
    }

    saveClient(): void {
        this.successMessage = "";
        this.formError = "";
        this.isSavingClient = false;

        const nombre = this.draft.nombre.trim();
        const correo = this.draft.correo.trim();
        const empresa = this.draft.empresa.trim();
        const creditLimit = this.toPositiveNumber(this.draft.creditLimit);
        const creditConsumed = this.toPositiveNumber(this.draft.creditConsumed);
        const paymentTermDays = Math.max(0, Math.trunc(this.toPositiveNumber(this.draft.paymentTermDays)));

        if (!nombre || !correo || !empresa) {
            this.formError = "Nombre, correo y empresa son obligatorios.";
            return;
        }

        if (!this.isValidEmail(correo)) {
            this.formError = "El correo electronico no tiene un formato valido.";
            return;
        }

        if (!this.draft.zona.trim()) {
            this.formError = "Selecciona una zona para el cliente.";
            return;
        }

        if (this.draft.creditEnabled && creditLimit <= 0) {
            this.formError = "Para clientes con credito debes indicar un cupo maximo mayor a cero.";
            return;
        }

        if (creditConsumed > creditLimit && this.draft.creditEnabled) {
            this.formError = "El cupo consumido no puede ser mayor al cupo maximo.";
            return;
        }

        if (this.draft.lastPaymentDate.trim() && !this.isValidISODate(this.draft.lastPaymentDate.trim())) {
            this.formError = "La fecha de ultimo pago debe usar el formato YYYY-MM-DD.";
            return;
        }

        const branches = this.normalizeBranchesDraft();
        if (branches === null) {
            return;
        }

        const payload: UpsertCrmClientRequest = {
            nombre,
            correo,
            empresa,
            nit: this.draft.nit.trim(),
            zona: this.draft.zona,
            estado: this.draft.estado,
            website: this.draft.website.trim(),
            officePhone: this.draft.officePhone.trim(),
            country: this.draft.country.trim(),
            city: this.draft.city.trim(),
            address: this.draft.address.trim(),
            dv: this.draft.dv.trim(),
            postalCode: this.draft.postalCode.trim(),
            billingEmail: this.draft.billingEmail.trim(),
            grandContributor: this.draft.grandContributor,
            idType: this.draft.idType || "NIT",
            credito: {
                enabled: this.draft.creditEnabled,
                creditLimit,
                consumed: creditConsumed,
                lastPaymentDate: this.draft.lastPaymentDate.trim(),
                paymentTermDays,
            },
            branches,
        };

        this.isSavingClient = true;
        const request$ = this.editingClientId
            ? this.crmClientsApi.updateClient(this.editingClientId, payload)
            : this.crmClientsApi.createClient(payload);

        request$.subscribe({
            next: () => {
                this.isSavingClient = false;
                this.loadClients();
                this.successMessage = this.editingClientId === null ? "Cliente creado correctamente." : "Cliente actualizado correctamente.";
                this.cancelForm();
            },
            error: (error) => {
                this.isSavingClient = false;
                this.formError = this.resolveErrorMessage(error, "No se pudo guardar el cliente en backend.");
            },
        });
    }

    removeClient(clientId: string): void {
        this.successMessage = "";
        this.formError = "";
        this.isDeletingClient = true;
        this.crmClientsApi.deleteClient(clientId).subscribe({
            next: () => {
                this.isDeletingClient = false;
                this.loadClients();
                this.successMessage = "Cliente eliminado.";
            },
            error: (error) => {
                this.isDeletingClient = false;
                this.formError = this.resolveErrorMessage(error, "No se pudo eliminar el cliente.");
            },
        });
    }

    cancelForm(): void {
        this.showAddClient = false;
        this.formError = "";
        this.editingClientId = null;
        this.draft = this.getDefaultDraft();
        this.resetCompanyRelatedContactsContext();
        this.ensureDraftZone();
    }

    onCompanyInputChange(value: string): void {
        this.draft.empresa = String(value ?? "");
        this.resetCompanyRelatedContactsContext();
    }

    selectZone(zoneName: string): void {
        this.draft.zona = zoneName;
    }

    addBranch(): void {
        const nextBranches = [...this.draft.branches, this.getDefaultBranchDraft()];
        if (nextBranches.length === 1) {
            nextBranches[0].isPrimary = true;
        }
        this.draft.branches = nextBranches;
    }

    removeBranch(branchIndex: number): void {
        const nextBranches = this.draft.branches.filter((_, index) => index !== branchIndex);
        if (nextBranches.length > 0 && !nextBranches.some((branch) => branch.isPrimary)) {
            nextBranches[0] = { ...nextBranches[0], isPrimary: true };
        }
        this.draft.branches = nextBranches;
    }

    setPrimaryBranch(branchIndex: number): void {
        this.draft.branches = this.draft.branches.map((branch, index) => ({
            ...branch,
            isPrimary: index === branchIndex,
        }));
    }

    ensureCompanyRelatedContactsLoaded(): void {
        const companyKey = this.normalizeCompanyKey(this.draft.empresa);
        if (!companyKey || this.companyContactLoading || this.companyContactsLoadedForKey === companyKey) {
            return;
        }

        this.loadCompanyRelatedContacts();
    }

    applyCompanyRelatedContactToBranch(branchIndex: number, selectedValue: string): void {
        const branch = this.draft.branches[branchIndex];
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

    canCreateCompanyContactFromBranch(branch: ClientBranchDraft): boolean {
        return Boolean(
            this.draft.empresa.trim() &&
                branch.contactName.trim() &&
                this.companyProspectTargets.length > 0 &&
                this.creatingBranchContactIndex === null,
        );
    }

    createCompanyContactFromBranch(branchIndex: number): void {
        const branch = this.draft.branches[branchIndex];
        if (!branch) {
            return;
        }

        this.ensureCompanyRelatedContactsLoaded();

        if (!this.draft.empresa.trim()) {
            this.formError = "Primero indica la empresa para crear un contacto relacionado.";
            return;
        }

        if (!branch.contactName.trim()) {
            this.formError = "Completa el nombre de contacto en la sucursal antes de crear el contacto relacionado.";
            return;
        }

        const targetProspect = this.companyProspectTargets[0];
        if (!targetProspect?.id) {
            this.formError = "No existe un prospecto de esta empresa para registrar el contacto relacionado.";
            return;
        }

        this.formError = "";
        this.creatingBranchContactIndex = branchIndex;

        this.crmProspectsApi.createProspectContact(targetProspect.id, {
            name: branch.contactName.trim(),
            email: branch.email.trim(),
            phone: branch.phone.trim(),
            role: branch.contactRole.trim(),
            notes: branch.name.trim() ? `Sucursal: ${branch.name.trim()}` : "Creado desde Clientes > Sucursales",
        }).subscribe({
            next: (created) => {
                this.creatingBranchContactIndex = null;
                this.successMessage = `Contacto relacionado creado en ${targetProspect.name || "prospecto"}.`;
                this.companyContactsLoadedForKey = "";
                this.loadCompanyRelatedContacts(created.id);
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.creatingBranchContactIndex = null;
                this.formError = this.resolveErrorMessage(error, "No se pudo crear el contacto relacionado.");
                this.cdr.detectChanges();
            },
        });
    }

    toPositiveNumber(value: number | null): number {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0) {
            return 0;
        }
        return numeric;
    }


    exportClientsToExcel(): void {
        if (this.exportandoClientes) {
            return;
        }

        this.exportandoClientes = true;
        this.formError = "";
        this.successMessage = "";

        this.crmClientsApi.listClients().subscribe({
            next: (allClients) => {
                try {
                    const clientRows = allClients.map((client) => ({
                        "ID del cliente": client.id ?? "",
                        "Nombre del cliente": client.nombre ?? "",
                        "Empresa": client.empresa ?? "",
                        "Tipo de identificación": client.idType || "NIT",
                        "NIT": client.nit ?? "",
                        
                        "Zona": client.zona ?? "",
                        "Estado": client.estado ?? "",
                        "Correo electrónico": client.correo ?? "",
                        
                        "Teléfono de oficina": client.officePhone ?? "",
                        "Sitio web": client.website ?? "",
                        "País": client.country ?? "",
                        "Ciudad": client.city ?? "",
                        "Dirección": client.address ?? "",
                        
                        "Gran contribuyente": client.grandContributor ? "Sí" : "No",
                        "Crédito habilitado": client.credito?.enabled ? "Sí" : "No",
                        "Cupo de crédito (COP)": Number(client.credito?.creditLimit ?? 0),
                        "Crédito consumido (COP)": Number(client.credito?.consumed ?? 0),
                        "Plazo de pago (días)": Number(client.credito?.paymentTermDays ?? 0),
                        "Fecha del último pago": client.credito?.lastPaymentDate ?? "",
                        "Fecha de creación": client.creado ?? "",
                    }));

                    const workbook = XLSX.utils.book_new();
                    const clientsSheet = XLSX.utils.json_to_sheet(clientRows);
                    clientsSheet["!cols"] = [
                        { wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 22 },
                        { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 14 },
                        { wch: 32 }, { wch: 32 }, { wch: 20 }, { wch: 30 },
                        { wch: 18 }, { wch: 20 }, { wch: 36 }, { wch: 16 },
                        { wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 24 },
                        { wch: 20 }, { wch: 24 }, { wch: 22 },
                    ];
                    XLSX.utils.book_append_sheet(workbook, clientsSheet, "Clientes");

                    const branchRows = allClients.flatMap((client) =>
                        (client.branches ?? []).map((branch) => ({
                            "ID del cliente": client.id ?? "",
                            "Cliente": client.nombre ?? "",
                            "Empresa": client.empresa ?? "",
                            "Sucursal": branch.name ?? "",
                            "Contacto": branch.contactName ?? "",
                            "Cargo del contacto": branch.contactRole ?? "",
                            "Correo": branch.email ?? "",
                            "Teléfono": branch.phone ?? "",
                            "País": branch.country ?? "",
                            "Ciudad": branch.city ?? "",
                            "Dirección": branch.address ?? "",
                            "Sucursal principal": branch.isPrimary ? "Sí" : "No",
                        }))
                    );

                    if (branchRows.length > 0) {
                        const branchesSheet = XLSX.utils.json_to_sheet(branchRows);
                        branchesSheet["!cols"] = [
                            { wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 24 },
                            { wch: 28 }, { wch: 22 }, { wch: 32 }, { wch: 20 },
                            { wch: 18 }, { wch: 20 }, { wch: 36 }, { wch: 20 },
                        ];
                        XLSX.utils.book_append_sheet(workbook, branchesSheet, "Sucursales");
                    }

                    const date = new Date();
                    const dateStamp = [
                        date.getFullYear(),
                        String(date.getMonth() + 1).padStart(2, "0"),
                        String(date.getDate()).padStart(2, "0"),
                    ].join("-");
                    XLSX.writeFile(workbook, `clientes_PIKA_OS_${dateStamp}.xlsx`);

                    this.successMessage =
                        `Exportación completada: ${allClients.length} clientes incluidos` +
                        (branchRows.length ? ` y ${branchRows.length} sucursales.` : ".");
                } catch (error) {
                    console.error("Error al generar el Excel de clientes:", error);
                    this.formError = "No se pudo generar el archivo Excel de clientes.";
                } finally {
                    this.exportandoClientes = false;
                    this.cdr.detectChanges();
                }
            },
            error: (error) => {
                this.exportandoClientes = false;
                this.formError = this.resolveErrorMessage(
                    error,
                    "No se pudieron obtener todos los clientes para exportarlos."
                );
                this.cdr.detectChanges();
            },
        });
    }

    get filteredClients(): CrmClientRecord[] {
        const term = this.clientSearchTerm.trim().toLocaleLowerCase();

        const filtered = this.clients.filter((client) => {
            if (!term) {
                return true;
            }
            const searchableValues = [
                client.nombre,
                client.empresa,
                client.correo,
                client.nit,
                client.officePhone,
                client.zona,
                client.city,
                client.country,
                client.address,
                client.website,
                client.estado,
            ];

            return searchableValues.some((value) =>
                String(value ?? "").toLocaleLowerCase().includes(term),
            );
        });

        return filtered.sort((a, b) => {
            const left = this.getClientSortValue(a, this.sortColumn);
            const right = this.getClientSortValue(b, this.sortColumn);
            const comparison = left.localeCompare(right, undefined, {
                numeric: true,
                sensitivity: "base",
            });

            return this.sortDirection === "asc" ? comparison : -comparison;
        });
    }

    get displayedClients(): CrmClientRecord[] {
        const start = (this.clientPage - 1) * this.clientPageSize;
        return this.filteredClients.slice(start, start + this.clientPageSize);
    }

    get clientTotalPages(): number {
        return Math.max(1, Math.ceil(this.filteredClients.length / this.clientPageSize));
    }

    get clientPageStart(): number {
        return this.filteredClients.length === 0 ? 0 : (this.clientPage - 1) * this.clientPageSize + 1;
    }

    get clientPageEnd(): number {
        return Math.min(this.clientPage * this.clientPageSize, this.filteredClients.length);
    }

    private loadClients(): void {
        this.crmClientsApi.listClients().subscribe({
            next: (items) => {
                this.clients = items.map((item) => ({ ...item }));
                replaceCrmClients(this.clients);
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.formError = this.resolveErrorMessage(error, "No se pudieron cargar los clientes desde backend.");
                this.cdr.detectChanges();
            },
        });
    }

    private loadZones(): void {
        this.zoneOptions = getCrmZones();
    }

    private loadCompanyRelatedContacts(preselectContactId = ""): void {
        const companyName = this.draft.empresa.trim();
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
        if (!selected || this.draft.branches.length === 0) {
            return;
        }

        const primaryIndex = this.draft.branches.findIndex((branch) => branch.isPrimary);
        const targetIndex = primaryIndex >= 0 ? primaryIndex : 0;
        this.applyCompanyRelatedContactToBranch(targetIndex, selected.value);
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
        this.draft.branches = this.draft.branches.map((branch) => ({
            ...branch,
            selectedCompanyContactKey: "",
        }));
    }

    private normalizeCompanyKey(value: string): string {
        return String(value ?? "").trim().toLowerCase();
    }

    private ensureDraftZone(): void {
        if (!this.draft.zona) {
            this.draft.zona = this.zoneOptions[0]?.name ?? "";
        }
    }

    private getDefaultDraft(): ClientDraft {
        return {
            nombre: "",
            correo: "",
            empresa: "",
            nit: "",
            zona: "",
            estado: "Activo",
            website: "",
            officePhone: "",
            country: "",
            city: "",
            address: "",
            dv: "",
            postalCode: "",
            billingEmail: "",
            grandContributor: false,
            idType: "NIT",
            creditEnabled: false,
            creditLimit: 0,
            creditConsumed: 0,
            lastPaymentDate: "",
            paymentTermDays: 30,
            branches: [],
        };
    }

    private getDefaultBranchDraft(): ClientBranchDraft {
        return {
            name: "",
            contactName: "",
            contactRole: "",
            email: "",
            phone: "",
            country: "",
            city: "",
            address: "",
            isPrimary: false,
        };
    }

    private mapBranchesToDraft(branches: CrmBranchRecord[] | undefined): ClientBranchDraft[] {
        if (!Array.isArray(branches) || branches.length === 0) {
            return [];
        }

        const mapped = branches.map((branch) => ({
            id: String(branch.id ?? "").trim() || undefined,
            name: String(branch.name ?? "").trim(),
            contactName: String(branch.contactName ?? "").trim(),
            contactRole: String(branch.contactRole ?? "").trim(),
            email: String(branch.email ?? "").trim(),
            phone: String(branch.phone ?? "").trim(),
            country: String(branch.country ?? "").trim(),
            city: String(branch.city ?? "").trim(),
            address: String(branch.address ?? "").trim(),
            isPrimary: Boolean(branch.isPrimary),
        }));

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

    private normalizeBranchesDraft(): CrmBranchRecord[] | null {
        const normalized: CrmBranchRecord[] = [];
        let primaryCount = 0;

        for (const branch of this.draft.branches) {
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
                this.formError = "Cada sucursal debe tener nombre.";
                return null;
            }

            if (email && !this.isValidEmail(email)) {
                this.formError = `El correo de la sucursal ${name} no tiene un formato valido.`;
                return null;
            }

            const normalizedBranch: CrmBranchRecord = {
                id: branch.id,
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
                this.formError = "Solo una sucursal puede marcarse como principal.";
                return null;
            }
            if (primaryCount === 0) {
                normalized[0].isPrimary = true;
            }
        }

        return normalized;
    }

    private isValidEmail(value: string): boolean {
        return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value);
    }

    private isValidISODate(value: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }
        const parsed = new Date(`${value}T00:00:00`);
        return !Number.isNaN(parsed.getTime());
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }
        return fallback;
    }
}
