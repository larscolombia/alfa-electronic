import { CommonModule } from "@angular/common";
import { Component, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

import {
    EquipmentFamilyRecord,
    EquipmentLocationRecord,
    EquipmentServiceTypeRecord,
    IndustrialEquipmentModelRecord,
    deleteEquipmentFamily,
    deleteEquipmentLocation,
    deleteEquipmentServiceType,
    deleteIndustrialEquipmentModel,
    ensureEquipmentCatalogLoaded,
    getEquipmentCatalogError,
    getEquipmentLocations,
    getEquipmentFamilies,
    getEquipmentFamilyName,
    getIndustrialEquipmentModels,
    getEquipmentServiceTypes,
    subscribeEquipmentCatalog,
    upsertEquipmentFamily,
    upsertEquipmentLocation,
    upsertEquipmentServiceType,
    upsertIndustrialEquipmentModel,
} from "./company-equipment-config.store";
import { countEquipmentItemsByLocation, reassignProspectEquipmentLocation } from "../crm/crm-prospect-equipment.store";

interface FamilyDraft {
    name: string;
    description: string;
    active: boolean;
}

interface ModelDraft {
    familyId: string;
    brand: string;
    type: string;
    series: string;
    notes: string;
    isIndustrial: boolean;
    active: boolean;
}

interface ServiceTypeDraft {
    name: string;
    description: string;
    active: boolean;
}

interface LocationDraft {
    name: string;
    description: string;
    active: boolean;
}

@Component({
    selector: "app-company-equipment-config",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Config. Equipos</h5>
                    <p class="text-secondary small mb-0">Administra el catálogo de familias y modelos de equipos industriales para usarlo en CRM y cotizaciones.</p>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Company</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Config. Equipos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (successMessage) {
                <div class="alert alert-success border mb-3">{{ successMessage }}</div>
            }
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            <div class="alert alert-info border mb-3">
                Aquí defines el maestro de <strong>familia + marca + tipo + serie</strong> y también los <strong>tipos de servicio</strong> que luego se usan en prospectos, equipos asociados y cotizaciones. Si algo no existe en CRM, primero debes crearlo aquí.
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h6 class="mb-1">Catálogo de familias</h6>
                        <p class="text-secondary small mb-0">Agrupa los modelos por línea técnica para estandarizar la captura.</p>
                    </div>
                    <button class="btn btn-sm btn-theme" type="button" (click)="openCreateFamilyForm()">
                        <i class="bi bi-plus-lg me-1"></i>Nueva familia
                    </button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Familia</th>
                                    <th>Descripción</th>
                                    <th>Modelos</th>
                                    <th>Estado</th>
                                    <th>Actualizado</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (family of families; track family.id) {
                                    <tr>
                                        <td>{{ family.name }}</td>
                                        <td>{{ family.description || "Sin descripción" }}</td>
                                        <td>{{ modelCountByFamily(family.id) }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="family.active" [class.text-bg-secondary]="!family.active">
                                                {{ family.active ? "Activa" : "Inactiva" }}
                                            </span>
                                        </td>
                                        <td>{{ family.updatedAt }}</td>
                                        <td class="text-end">
                                            <div class="d-flex justify-content-end gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editFamily(family.id)">Editar</button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeFamily(family.id)">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="6" class="text-center py-4 text-secondary">No hay familias configuradas.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                @if (showFamilyForm) {
                    <div class="card-footer border-top">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Nombre de familia</label>
                                <input class="form-control" type="text" [(ngModel)]="familyDraft.name" name="familyDraftName" placeholder="Ej: Servomotores" />
                            </div>
                            <div class="col-12 col-lg-5">
                                <label class="form-label">Descripción</label>
                                <input class="form-control" type="text" [(ngModel)]="familyDraft.description" name="familyDraftDescription" placeholder="Línea o especialidad técnica" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <div class="form-check form-switch mt-4">
                                    <input class="form-check-input" type="checkbox" id="familyActive" [(ngModel)]="familyDraft.active" name="familyDraftActive" />
                                    <label class="form-check-label" for="familyActive">Activa</label>
                                </div>
                            </div>
                            <div class="col-12 d-flex gap-2 justify-content-end">
                                <button class="btn btn-theme" type="button" (click)="saveFamily()">Guardar familia</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="cancelFamilyForm()">Cancelar</button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h6 class="mb-1">Tipos de servicio</h6>
                        <p class="text-secondary small mb-0">Opciones disponibles al momento de asociar un equipo a un prospecto.</p>
                    </div>
                    <button class="btn btn-sm btn-theme" type="button" (click)="openCreateServiceTypeForm()">
                        <i class="bi bi-plus-lg me-1"></i>Nuevo tipo de servicio
                    </button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Tipo de servicio</th>
                                    <th>Descripción</th>
                                    <th>Estado</th>
                                    <th>Actualizado</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (serviceType of serviceTypes; track serviceType.id) {
                                    <tr>
                                        <td>{{ serviceType.name }}</td>
                                        <td>{{ serviceType.description || "Sin descripción" }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="serviceType.active" [class.text-bg-secondary]="!serviceType.active">
                                                {{ serviceType.active ? "Activo" : "Inactivo" }}
                                            </span>
                                        </td>
                                        <td>{{ serviceType.updatedAt }}</td>
                                        <td class="text-end">
                                            <div class="d-flex justify-content-end gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editServiceType(serviceType.id)">Editar</button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeServiceType(serviceType.id)">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="5" class="text-center py-4 text-secondary">No hay tipos de servicio configurados.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                @if (showServiceTypeForm) {
                    <div class="card-footer border-top">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Nombre del tipo de servicio</label>
                                <input class="form-control" type="text" [(ngModel)]="serviceTypeDraft.name" name="serviceTypeDraftName" placeholder="Ej: Reparación" />
                            </div>
                            <div class="col-12 col-lg-5">
                                <label class="form-label">Descripción</label>
                                <input class="form-control" type="text" [(ngModel)]="serviceTypeDraft.description" name="serviceTypeDraftDescription" placeholder="Uso operativo o comercial del servicio" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <div class="form-check form-switch mt-4">
                                    <input class="form-check-input" type="checkbox" id="serviceTypeActive" [(ngModel)]="serviceTypeDraft.active" name="serviceTypeDraftActive" />
                                    <label class="form-check-label" for="serviceTypeActive">Activo</label>
                                </div>
                            </div>
                            <div class="col-12 d-flex gap-2 justify-content-end">
                                <button class="btn btn-theme" type="button" (click)="saveServiceType()">Guardar tipo de servicio</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="cancelServiceTypeForm()">Cancelar</button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h6 class="mb-1">Ubicaciones de almacenamiento</h6>
                        <p class="text-secondary small mb-0">Ubicaciones disponibles al recibir y almacenar equipos en proceso.</p>
                    </div>
                    <button class="btn btn-sm btn-theme" type="button" (click)="openCreateLocationForm()">
                        <i class="bi bi-plus-lg me-1"></i>Nueva ubicación
                    </button>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Ubicación</th>
                                    <th>Descripción</th>
                                    <th>Equipos</th>
                                    <th>Estado</th>
                                    <th>Actualizado</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (location of locations; track location.id) {
                                    <tr>
                                        <td>{{ location.name }}</td>
                                        <td>{{ location.description || "Sin descripción" }}</td>
                                        <td>{{ equipmentCountByLocation(location.id) }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="location.active" [class.text-bg-secondary]="!location.active">
                                                {{ location.active ? "Activa" : "Inactiva" }}
                                            </span>
                                        </td>
                                        <td>{{ location.updatedAt }}</td>
                                        <td class="text-end">
                                            <div class="d-flex justify-content-end gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editLocation(location.id)">Editar</button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="openDeleteLocationModal(location.id)">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="6" class="text-center py-4 text-secondary">No hay ubicaciones configuradas.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                @if (showLocationForm) {
                    <div class="card-footer border-top">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-4">
                                <label class="form-label">Nombre de ubicación</label>
                                <input class="form-control" type="text" [(ngModel)]="locationDraft.name" name="locationDraftName" placeholder="Ej: Interior 1" />
                            </div>
                            <div class="col-12 col-lg-5">
                                <label class="form-label">Descripción</label>
                                <input class="form-control" type="text" [(ngModel)]="locationDraft.description" name="locationDraftDescription" placeholder="Descripción operativa o física" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <div class="form-check form-switch mt-4">
                                    <input class="form-check-input" type="checkbox" id="locationActive" [(ngModel)]="locationDraft.active" name="locationDraftActive" />
                                    <label class="form-check-label" for="locationActive">Activa</label>
                                </div>
                            </div>
                            <div class="col-12 d-flex gap-2 justify-content-end">
                                <button class="btn btn-theme" type="button" (click)="saveLocation()">Guardar ubicación</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="cancelLocationForm()">Cancelar</button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <h6 class="mb-1">Catálogo de modelos industriales</h6>
                        <p class="text-secondary small mb-0">Cada registro maestro queda definido por familia, marca, tipo y serie.</p>
                    </div>
                    <button class="btn btn-sm btn-theme" type="button" (click)="openCreateModelForm()">
                        <i class="bi bi-plus-lg me-1"></i>Nuevo equipo industrial
                    </button>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end">
                        <div class="col-12 col-lg-5">
                            <label class="form-label">Buscar</label>
                            <input class="form-control" type="text" [(ngModel)]="searchTerm" name="equipmentSearchTerm" placeholder="Marca, tipo, serie o familia" />
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <label class="form-label">Familia</label>
                            <select class="form-select" [(ngModel)]="selectedFamilyId" name="selectedFamilyId">
                                <option value="">Todas</option>
                                @for (family of activeFamilies; track family.id) {
                                    <option [value]="family.id">{{ family.name }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-6 col-lg-2">
                            <label class="form-label">Estado</label>
                            <select class="form-select" [(ngModel)]="selectedModelState" name="selectedModelState">
                                <option value="all">Todos</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                        <div class="col-12 col-lg-2 d-grid">
                            <button class="btn btn-outline-secondary" type="button" (click)="clearModelFilters()">Limpiar</button>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0 border-top">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Familia</th>
                                    <th>Marca</th>
                                    <th>Tipo</th>
                                    <th>Serie</th>
                                    <th>Perfil</th>
                                    <th>Notas</th>
                                    <th>Estado</th>
                                    <th>Actualizado</th>
                                    <th class="text-end">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (model of filteredModels; track model.id) {
                                    <tr>
                                        <td>{{ familyName(model.familyId) }}</td>
                                        <td>{{ model.brand }}</td>
                                        <td>{{ model.type }}</td>
                                        <td>{{ model.series }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="model.isIndustrial" [class.text-bg-warning]="!model.isIndustrial">
                                                {{ model.isIndustrial ? "Industrial" : "No industrial" }}
                                            </span>
                                        </td>
                                        <td>{{ model.notes || "Sin notas" }}</td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-success]="model.active" [class.text-bg-secondary]="!model.active">
                                                {{ model.active ? "Activo" : "Inactivo" }}
                                            </span>
                                        </td>
                                        <td>{{ model.updatedAt }}</td>
                                        <td class="text-end">
                                            <div class="d-flex justify-content-end gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" type="button" (click)="editModel(model.id)">Editar</button>
                                                <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeModel(model.id)">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="9" class="text-center py-4 text-secondary">No hay modelos para el filtro aplicado.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                @if (showModelForm) {
                    <div class="card-footer border-top">
                        <div class="row gx-3 gy-3 align-items-end">
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Familia</label>
                                <select class="form-select" [(ngModel)]="modelDraft.familyId" name="modelDraftFamilyId">
                                    <option value="">Selecciona una familia</option>
                                    @for (family of activeFamilies; track family.id) {
                                        <option [value]="family.id">{{ family.name }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Marca</label>
                                <input class="form-control" type="text" [(ngModel)]="modelDraft.brand" name="modelDraftBrand" placeholder="Ej: Siemens" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Tipo</label>
                                <input class="form-control" type="text" [(ngModel)]="modelDraft.type" name="modelDraftType" placeholder="Ej: Variador" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <label class="form-label">Serie</label>
                                <input class="form-control" type="text" [(ngModel)]="modelDraft.series" name="modelDraftSeries" placeholder="Ej: SINAMICS G120" />
                            </div>
                            <div class="col-12 col-lg-6">
                                <label class="form-label">Notas</label>
                                <input class="form-control" type="text" [(ngModel)]="modelDraft.notes" name="modelDraftNotes" placeholder="Observaciones o aplicación típica" />
                            </div>
                            <div class="col-12 col-lg-3">
                                <div class="form-check form-switch mt-4">
                                    <input class="form-check-input" type="checkbox" id="modelIsIndustrial" [(ngModel)]="modelDraft.isIndustrial" name="modelDraftIsIndustrial" />
                                    <label class="form-check-label" for="modelIsIndustrial">Modelo industrial</label>
                                </div>
                            </div>
                            <div class="col-12 col-lg-3">
                                <div class="form-check form-switch mt-4">
                                    <input class="form-check-input" type="checkbox" id="modelActive" [(ngModel)]="modelDraft.active" name="modelDraftActive" />
                                    <label class="form-check-label" for="modelActive">Activo</label>
                                </div>
                            </div>
                            <div class="col-12 d-flex gap-2 justify-content-end">
                                <button class="btn btn-theme" type="button" (click)="saveModel()">Guardar equipo industrial</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="cancelModelForm()">Cancelar</button>
                            </div>
                        </div>
                    </div>
                }
            </div>
        </div>

        @if (showDeleteLocationModal && locationToDelete) {
            <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeDeleteLocationModal()">
                <div class="modal-dialog modal-dialog-centered" role="document" (click)="$event.stopPropagation()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Reasignar equipos antes de borrar ubicación</h5>
                            <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeDeleteLocationModal()"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-2">Vas a eliminar la ubicación <strong>{{ locationToDelete.name }}</strong>.</p>
                            <p class="text-secondary small mb-3">Debes reasignar todos los equipos almacenados allí a otra ubicación existente para continuar.</p>

                            <label class="form-label">Nueva ubicación para reasignación</label>
                            <select class="form-select" [(ngModel)]="locationReassignTargetId" name="locationReassignTargetId">
                                <option [ngValue]="null">Selecciona una ubicación</option>
                                @for (location of locationReassignOptions; track location.id) {
                                    <option [ngValue]="location.id">{{ location.name }}</option>
                                }
                            </select>

                            @if (locationDeleteError) {
                                <div class="alert alert-danger border mt-3 mb-0">{{ locationDeleteError }}</div>
                            }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" (click)="closeDeleteLocationModal()">Cancelar</button>
                            <button type="button" class="btn btn-danger" (click)="confirmDeleteLocation()">Reasignar y borrar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show"></div>
        }
    `,
})
export class CompanyEquipmentConfigComponent implements OnDestroy {
    families: EquipmentFamilyRecord[] = getEquipmentFamilies();
    models: IndustrialEquipmentModelRecord[] = getIndustrialEquipmentModels();
    serviceTypes: EquipmentServiceTypeRecord[] = getEquipmentServiceTypes();
    locations: EquipmentLocationRecord[] = getEquipmentLocations();

    /** True mientras hay una escritura en vuelo contra el servidor. */
    isSaving = false;

    private readonly catalogUnsubscribe: () => void;

    constructor() {
        // Fase 6: el catálogo viene del servidor. La primera lectura dispara la
        // carga y esta suscripción repinta cuando llega (o cuando otra pestaña
        // lo modifica).
        void ensureEquipmentCatalogLoaded();
        this.catalogUnsubscribe = subscribeEquipmentCatalog(() => this.syncFromStore());
        this.syncFromStore();
    }

    ngOnDestroy(): void {
        this.catalogUnsubscribe();
    }

    /** Vuelca la caché del store a las listas locales que pinta la plantilla. */
    private syncFromStore(): void {
        this.families = getEquipmentFamilies();
        this.models = getIndustrialEquipmentModels();
        this.serviceTypes = getEquipmentServiceTypes();
        this.locations = getEquipmentLocations();

        const catalogError = getEquipmentCatalogError();
        if (catalogError) {
            // Sin catálogo no se puede editar nada: se dice en vez de mostrar
            // listas vacías como si la empresa simplemente no tuviera modelos.
            this.formError = `No se pudo cargar el catalogo de equipos del servidor: ${catalogError}`;
        }
    }

    /**
     * Envuelve una escritura en el servidor: marca isSaving, y si falla muestra
     * el motivo real y devuelve false para que el llamador no cierre el
     * formulario ni anuncie un éxito que no ocurrió.
     */
    private async persist(action: () => Promise<unknown>, successMessage: string): Promise<boolean> {
        this.formError = "";
        this.successMessage = "";
        this.isSaving = true;
        try {
            await action();
            this.successMessage = successMessage;
            return true;
        } catch (error) {
            this.formError = error instanceof Error && error.message.trim()
                ? error.message
                : "No se pudo guardar en el servidor.";
            return false;
        } finally {
            this.isSaving = false;
        }
    }

    searchTerm = "";
    selectedFamilyId = "";
    selectedModelState: "all" | "active" | "inactive" = "all";
    successMessage = "";
    formError = "";

    showFamilyForm = false;
    editingFamilyId: string | null = null;
    familyDraft: FamilyDraft = this.createFamilyDraft();

    showServiceTypeForm = false;
    editingServiceTypeId: string | null = null;
    serviceTypeDraft: ServiceTypeDraft = this.createServiceTypeDraft();

    showLocationForm = false;
    editingLocationId: string | null = null;
    locationDraft: LocationDraft = this.createLocationDraft();

    showDeleteLocationModal = false;
    locationDeleteId: string | null = null;
    locationReassignTargetId: string | null = null;
    locationDeleteError = "";

    showModelForm = false;
    editingModelId: string | null = null;
    modelDraft: ModelDraft = this.createModelDraft();

    get activeFamilies(): EquipmentFamilyRecord[] {
        return this.families.filter((family) => family.active);
    }

    get activeLocations(): EquipmentLocationRecord[] {
        return this.locations.filter((location) => location.active);
    }

    get locationToDelete(): EquipmentLocationRecord | null {
        return this.locations.find((location) => location.id === this.locationDeleteId) ?? null;
    }

    get locationReassignOptions(): EquipmentLocationRecord[] {
        return this.locations.filter((location) => location.id !== this.locationDeleteId);
    }

    get filteredModels(): IndustrialEquipmentModelRecord[] {
        const term = this.searchTerm.trim().toLowerCase();

        return this.models.filter((model) => {
            if (this.selectedFamilyId && model.familyId !== this.selectedFamilyId) {
                return false;
            }

            if (this.selectedModelState === "active" && !model.active) {
                return false;
            }

            if (this.selectedModelState === "inactive" && model.active) {
                return false;
            }

            if (!term) {
                return true;
            }

            const haystack = [this.familyName(model.familyId), model.brand, model.type, model.series, model.notes].join(" ").toLowerCase();
            return haystack.includes(term);
        });
    }

    openCreateFamilyForm(): void {
        this.showFamilyForm = true;
        this.editingFamilyId = null;
        this.familyDraft = this.createFamilyDraft();
        this.clearMessages();
    }

    editFamily(familyId: string): void {
        const family = this.families.find((item) => item.id === familyId);
        if (!family) {
            return;
        }

        this.editingFamilyId = familyId;
        this.familyDraft = {
            name: family.name,
            description: family.description,
            active: family.active,
        };
        this.showFamilyForm = true;
        this.clearMessages();
    }

    async saveFamily(): Promise<void> {
        const name = this.familyDraft.name.trim();
        const description = this.familyDraft.description.trim();

        if (!name) {
            this.formError = "La familia debe tener un nombre.";
            return;
        }

        const duplicated = this.families.some(
            (family) => family.id !== this.editingFamilyId && family.name.trim().toLowerCase() === name.toLowerCase(),
        );
        if (duplicated) {
            this.formError = "Ya existe una familia con ese nombre.";
            return;
        }

        const isEditing = Boolean(this.editingFamilyId);
        const nextFamily: EquipmentFamilyRecord = {
            id: this.editingFamilyId ?? this.buildId("family"),
            name,
            description,
            active: this.familyDraft.active,
            // La marca la fija el servidor (updated_at = NOW()); lo que se envíe
            // acá se ignora y syncFromStore() repinta con el valor real.
            updatedAt: "",
        };

        const saved = await this.persist(
            () => upsertEquipmentFamily(nextFamily),
            isEditing ? "Familia actualizada." : "Familia creada.",
        );
        if (saved) {
            this.cancelFamilyForm();
        }
    }

    async removeFamily(familyId: string): Promise<void> {
        if (this.models.some((model) => model.familyId === familyId)) {
            this.formError = "No puedes eliminar una familia que aún tiene modelos asociados.";
            this.successMessage = "";
            return;
        }

        await this.persist(() => deleteEquipmentFamily(familyId), "Familia eliminada.");
    }

    cancelFamilyForm(): void {
        this.showFamilyForm = false;
        this.editingFamilyId = null;
        this.familyDraft = this.createFamilyDraft();
    }

    openCreateServiceTypeForm(): void {
        this.showServiceTypeForm = true;
        this.editingServiceTypeId = null;
        this.serviceTypeDraft = this.createServiceTypeDraft();
        this.clearMessages();
    }

    editServiceType(serviceTypeId: string): void {
        const serviceType = this.serviceTypes.find((item) => item.id === serviceTypeId);
        if (!serviceType) {
            return;
        }

        this.editingServiceTypeId = serviceTypeId;
        this.serviceTypeDraft = {
            name: serviceType.name,
            description: serviceType.description,
            active: serviceType.active,
        };
        this.showServiceTypeForm = true;
        this.clearMessages();
    }

    async saveServiceType(): Promise<void> {
        const name = this.serviceTypeDraft.name.trim();
        const description = this.serviceTypeDraft.description.trim();

        if (!name) {
            this.formError = "El tipo de servicio debe tener un nombre.";
            return;
        }

        const duplicated = this.serviceTypes.some(
            (serviceType) => serviceType.id !== this.editingServiceTypeId && serviceType.name.trim().toLowerCase() === name.toLowerCase(),
        );
        if (duplicated) {
            this.formError = "Ya existe un tipo de servicio con ese nombre.";
            return;
        }

        const isEditing = Boolean(this.editingServiceTypeId);
        const nextServiceType: EquipmentServiceTypeRecord = {
            id: this.editingServiceTypeId ?? this.buildId("service-type"),
            name,
            description,
            active: this.serviceTypeDraft.active,
            updatedAt: "",
        };

        const saved = await this.persist(
            () => upsertEquipmentServiceType(nextServiceType),
            isEditing ? "Tipo de servicio actualizado." : "Tipo de servicio creado.",
        );
        if (saved) {
            this.cancelServiceTypeForm();
        }
    }

    async removeServiceType(serviceTypeId: string): Promise<void> {
        await this.persist(() => deleteEquipmentServiceType(serviceTypeId), "Tipo de servicio eliminado.");
    }

    cancelServiceTypeForm(): void {
        this.showServiceTypeForm = false;
        this.editingServiceTypeId = null;
        this.serviceTypeDraft = this.createServiceTypeDraft();
    }

    openCreateLocationForm(): void {
        this.showLocationForm = true;
        this.editingLocationId = null;
        this.locationDraft = this.createLocationDraft();
        this.clearMessages();
    }

    editLocation(locationId: string): void {
        const location = this.locations.find((item) => item.id === locationId);
        if (!location) {
            return;
        }

        this.editingLocationId = locationId;
        this.locationDraft = {
            name: location.name,
            description: location.description,
            active: location.active,
        };
        this.showLocationForm = true;
        this.clearMessages();
    }

    async saveLocation(): Promise<void> {
        const name = this.locationDraft.name.trim();
        const description = this.locationDraft.description.trim();

        if (!name) {
            this.formError = "La ubicación debe tener un nombre.";
            return;
        }

        const duplicated = this.locations.some(
            (location) => location.id !== this.editingLocationId && location.name.trim().toLowerCase() === name.toLowerCase(),
        );
        if (duplicated) {
            this.formError = "Ya existe una ubicación con ese nombre.";
            return;
        }

        const isEditing = Boolean(this.editingLocationId);
        const nextLocation: EquipmentLocationRecord = {
            id: this.editingLocationId ?? this.buildId("location"),
            name,
            description,
            active: this.locationDraft.active,
            updatedAt: "",
        };

        const saved = await this.persist(
            () => upsertEquipmentLocation(nextLocation),
            isEditing ? "Ubicación actualizada." : "Ubicación creada.",
        );
        if (!saved) {
            return;
        }

        if (isEditing) {
            reassignProspectEquipmentLocation(nextLocation.id, { id: nextLocation.id, name: nextLocation.name });
        }
        this.cancelLocationForm();
    }

    cancelLocationForm(): void {
        this.showLocationForm = false;
        this.editingLocationId = null;
        this.locationDraft = this.createLocationDraft();
    }

    openDeleteLocationModal(locationId: string): void {
        this.locationDeleteError = "";
        this.locationDeleteId = locationId;

        if (this.locationReassignOptions.length === 0) {
            this.locationDeleteError = "No puedes borrar la única ubicación existente. Crea otra ubicación primero.";
            this.locationDeleteId = null;
            this.formError = this.locationDeleteError;
            return;
        }

        this.locationReassignTargetId = this.locationReassignOptions[0]?.id ?? null;
        this.showDeleteLocationModal = true;
    }

    closeDeleteLocationModal(): void {
        this.showDeleteLocationModal = false;
        this.locationDeleteId = null;
        this.locationReassignTargetId = null;
        this.locationDeleteError = "";
    }

    async confirmDeleteLocation(): Promise<void> {
        this.locationDeleteError = "";

        const locationToDelete = this.locationToDelete;
        if (!locationToDelete) {
            return;
        }

        const targetLocation = this.locationReassignOptions.find((location) => location.id === this.locationReassignTargetId);
        if (!targetLocation) {
            this.locationDeleteError = "Debes seleccionar la nueva ubicación para reasignar los equipos.";
            return;
        }

        // Primero se reasignan los equipos y después se borra la ubicación: si el
        // borrado falla, los equipos ya apuntan a una ubicación válida en vez de
        // quedar colgando de un id inexistente.
        reassignProspectEquipmentLocation(locationToDelete.id, { id: targetLocation.id, name: targetLocation.name });

        const deleted = await this.persist(
            () => deleteEquipmentLocation(locationToDelete.id),
            `Ubicación ${locationToDelete.name} eliminada y equipos reasignados a ${targetLocation.name}.`,
        );
        if (deleted) {
            this.closeDeleteLocationModal();
        }
    }

    openCreateModelForm(): void {
        this.showModelForm = true;
        this.editingModelId = null;
        this.modelDraft = this.createModelDraft();
        this.clearMessages();
    }

    editModel(modelId: string): void {
        const model = this.models.find((item) => item.id === modelId);
        if (!model) {
            return;
        }

        this.editingModelId = modelId;
        this.modelDraft = {
            familyId: model.familyId,
            brand: model.brand,
            type: model.type,
            series: model.series,
            notes: model.notes,
            isIndustrial: model.isIndustrial !== false,
            active: model.active,
        };
        this.showModelForm = true;
        this.clearMessages();
    }

    async saveModel(): Promise<void> {
        const familyId = this.modelDraft.familyId.trim();
        const brand = this.modelDraft.brand.trim();
        const type = this.modelDraft.type.trim();
        const series = this.modelDraft.series.trim();
        const notes = this.modelDraft.notes.trim();

        if (!familyId || !brand || !type || !series) {
            this.formError = "Completa familia, marca, tipo y serie para guardar el modelo.";
            return;
        }

        const duplicated = this.models.some(
            (model) =>
                model.id !== this.editingModelId &&
                model.familyId === familyId &&
                model.brand.trim().toLowerCase() === brand.toLowerCase() &&
                model.type.trim().toLowerCase() === type.toLowerCase() &&
                model.series.trim().toLowerCase() === series.toLowerCase(),
        );
        if (duplicated) {
            this.formError = "Ya existe un modelo con esa combinación de familia, marca, tipo y serie.";
            return;
        }

        const isEditing = Boolean(this.editingModelId);
        const nextModel: IndustrialEquipmentModelRecord = {
            id: this.editingModelId ?? this.buildId("model"),
            familyId,
            brand,
            type,
            series,
            notes,
            isIndustrial: this.modelDraft.isIndustrial,
            active: this.modelDraft.active,
            updatedAt: "",
        };

        const saved = await this.persist(
            () => upsertIndustrialEquipmentModel(nextModel),
            isEditing ? "Modelo actualizado." : "Modelo creado.",
        );
        if (saved) {
            this.cancelModelForm();
        }
    }

    async removeModel(modelId: string): Promise<void> {
        await this.persist(() => deleteIndustrialEquipmentModel(modelId), "Modelo eliminado.");
    }

    cancelModelForm(): void {
        this.showModelForm = false;
        this.editingModelId = null;
        this.modelDraft = this.createModelDraft();
    }

    clearModelFilters(): void {
        this.searchTerm = "";
        this.selectedFamilyId = "";
        this.selectedModelState = "all";
    }

    modelCountByFamily(familyId: string): number {
        return this.models.filter((model) => model.familyId === familyId).length;
    }

    equipmentCountByLocation(locationId: string): number {
        return countEquipmentItemsByLocation(locationId);
    }

    familyName(familyId: string): string {
        return getEquipmentFamilyName(familyId);
    }

    private clearMessages(): void {
        this.successMessage = "";
        this.formError = "";
    }

    private createFamilyDraft(): FamilyDraft {
        return {
            name: "",
            description: "",
            active: true,
        };
    }

    private createServiceTypeDraft(): ServiceTypeDraft {
        return {
            name: "",
            description: "",
            active: true,
        };
    }

    private createLocationDraft(): LocationDraft {
        return {
            name: "",
            description: "",
            active: true,
        };
    }

    private createModelDraft(): ModelDraft {
        return {
            familyId: this.activeFamilies[0]?.id ?? "",
            brand: "",
            type: "",
            series: "",
            notes: "",
            isIndustrial: true,
            active: true,
        };
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}