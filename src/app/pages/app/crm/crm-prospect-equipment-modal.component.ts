import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { forkJoin, of } from "rxjs";
import { catchError, take } from "rxjs/operators";

import {
    EquipmentLocationRecord,
    EquipmentServiceTypeRecord,
    IndustrialEquipmentModelRecord,
    ensureEquipmentCatalogLoaded,
    getEquipmentFamilyName,
    getEquipmentLocations,
    getEquipmentServiceTypes,
    getIndustrialEquipmentModels,
    subscribeEquipmentCatalog,
} from "../company/company-equipment-config.store";
import { buildEvidencePhotosFromFiles } from "./crm-prospect-equipment-evidence.util";
import {
    PROSPECT_EQUIPMENT_QUESTION_DEFINITIONS,
    ProspectEquipmentRepairStatus,
    ProspectEquipmentAttachment,
    ProspectEquipmentEvidencePhoto,
    ProspectEquipmentEvidenceType,
    ProspectEquipmentItem,
    ProspectEquipmentQuestionDefinition,
    ProspectEquipmentRegistrationMode,
    ProspectEquipmentRecord,
    ProspectEquipmentWarning,
    createEquipmentAnswers,
    getProspectEquipmentWarnings,
} from "./crm-prospect-equipment.store";
import { buildEquipmentQrShortCode, estimateDataUrlBinarySize, generateEquipmentQrDataUrl } from "./equipment-qr.util";
import { resolveEquipmentProspectId } from "./crm-prospect-equipment-match.logic";
import { ProspectRecord } from "./crm-prospects.store";
import { Project } from "../projects/models";
import { ProjectService } from "../projects/services";
import { CrmBranchRecord, CrmClientRecord, CrmClientsApiService } from "../../../services/crm-clients-api.service";
import { CrmEquipmentApiService, EquipmentTechnicianOption } from "../../../services/crm-equipment-api.service";
import { CrmProspectContact, CrmProspectRecord, CrmProspectsApiService } from "../../../services/crm-prospects-api.service";
import { AuthService } from "../../../services/auth.service";
import { FormDraftService } from "../../../services/form-draft.service";
import { EmailsApiService } from "../../../services/emails-api.service";
import { resolveApiBaseUrl } from "../../../services/api-base-url.util";
import { backupAvailableForModel, findPreviousReception, isUnderLegalWarranty, warrantyMonthsRemaining } from "./warranty.logic";

const CRM_EQUIPMENT_MODAL_DRAFT_PREFIX = "app.crm.equipment-modal";

const REQUIRED_FACE_EVIDENCE_TYPES: readonly ProspectEquipmentEvidenceType[] = ["face-front", "face-back", "face-left", "face-right"];

const FACE_EVIDENCE_LABELS: Record<ProspectEquipmentEvidenceType, string> = {
    general: "Vista general",
    "serial-plate": "Placa / serie",
    "visible-damage": "Daño visible",
    accessories: "Accesorios",
    other: "Otra",
    "face-front": "Frente",
    "face-back": "Atrás",
    "face-left": "Lado izquierdo",
    "face-right": "Lado derecho",
    "face-top": "Superior",
    "face-bottom": "Inferior",
};

type WizardStepKey = "reception" | "equipment" | "questions" | "evidence" | "signatures";

type WizardStepDefinition = {
    key: WizardStepKey;
    title: string;
    description: string;
};

type EvidenceTypeOption = {
    value: ProspectEquipmentEvidenceType;
    label: string;
};

type CompanyCatalogOption = {
    company: string;
    sourceLabel: "Cliente" | "Prospecto" | "Cliente y prospecto" | "Recepcion previa";
    nit: string;
    contactName: string;
    contactRole: string;
    email: string;
    phone: string;
    cellphone: string;
    city: string;
    address: string;
    zone: string;
};

type CompanyContactOption = {
    value: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    sourceLabel: string;
};

type CompanyBranchOption = {
    value: string;
    name: string;
    city: string;
    address: string;
    contactName: string;
    contactRole: string;
    email: string;
    phone: string;
    isPrimary: boolean;
    sourceLabel: string;
};

type PreviousReceptionInfo = {
    code: string;
    receptionDate: string;
    identifier: string;
    serie: string;
    failureDescription: string;
    repairStatus: string;
    recordId: string;
    clientName: string;
};

type ItemWarrantyState = {
    isWarranty: boolean;
    oldCode: string;
    firstReceptionDate: string;
    warrantyMonths: number | null;
    previousReception: PreviousReceptionInfo | null;
};

type SoftwareBackupInfo = {
    id?: string;
    equipmentModel?: string;
    fileName?: string;
    url?: string;
    version?: string;
};

@Component({
    selector: "app-crm-prospect-equipment-modal",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="close()">
            <div class="modal-dialog modal-xl modal-dialog-scrollable" role="document" (click)="$event.stopPropagation()">
                <div class="modal-content">
                    <div class="modal-header">
                        <div>
                            <h5 class="modal-title mb-1">Asociar equipo</h5>
                            <p class="text-secondary small mb-0">{{ prospect?.nombre || "Prospecto" }} · {{ prospect?.compania || "Sin compañía" }}</p>
                        </div>
                        <button type="button" class="btn-close" aria-label="Cerrar" data-testid="equipment-modal-close" (click)="close()"></button>
                    </div>

                    <div class="modal-body">
                        <div class="alert alert-warning border mb-3" *ngIf="validationMessage">{{ validationMessage }}</div>

                        <div class="wizard-steps-grid mb-4">
                            <div class="wizard-step" *ngFor="let step of wizardSteps; let i = index; trackBy: trackByStepKey" [class.active]="currentStepIndex === i" [class.completed]="currentStepIndex > i">
                                <span class="wizard-step-number">{{ i + 1 }}</span>
                                <div class="wizard-step-content">
                                    <div class="fw-semibold wizard-step-title">{{ step.title }}</div>
                                    <div class="small wizard-step-description">{{ step.description }}</div>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                            <div>
                                <p class="text-uppercase text-secondary small fw-semibold mb-1">Paso {{ currentStepIndex + 1 }} de {{ wizardSteps.length }}</p>
                                <h6 class="mb-1">{{ currentWizardStep.title }}</h6>
                                <p class="text-secondary small mb-0">{{ currentWizardStep.description }}</p>
                            </div>
                            <button class="btn btn-outline-theme" type="button" *ngIf="currentWizardStep.key === 'equipment'" data-testid="equipment-modal-add-item" (click)="addEquipmentItem()">
                                <i class="bi bi-plus-lg me-1"></i> Agregar equipo
                            </button>
                        </div>

                        <div class="alert alert-info border mb-3" *ngIf="currentWizardStep.key === 'reception' || currentWizardStep.key === 'equipment'">
                            Puedes recibir equipos desde el catálogo central o en modo manual/no homologado. Si faltan datos, el flujo sigue y el listado los marcará con warnings operativos.
                        </div>

                        <ng-container *ngIf="currentWizardStep.key === 'reception'">
                            <div class="border rounded p-3">
                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                    <div>
                                        <h6 class="mb-1">Orden de recepción de equipos</h6>
                                        <p class="text-secondary small mb-0">Datos generales del cliente y la recepción antes de cargar los equipos.</p>
                                    </div>
                                </div>

                                <div class="row gx-3 gy-3">
                                    <div class="col-12 col-lg-3">
                                        <label class="form-label d-block">Fecha</label>
                                        <div class="row gx-2">
                                            <div class="col-4">
                                                <input class="form-control text-center" maxlength="2" placeholder="DD" [(ngModel)]="draft.receptionDay" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-4">
                                                <input class="form-control text-center" maxlength="2" placeholder="MM" [(ngModel)]="draft.receptionMonth" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-4">
                                                <input class="form-control text-center" maxlength="4" placeholder="AAAA" [(ngModel)]="draft.receptionYear" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-5">
                                        <label class="form-label">Empresa</label>
                                        <div class="company-combobox" (click)="$event.stopPropagation()">
                                            <div class="d-flex gap-2 align-items-stretch">
                                                <div class="position-relative flex-grow-1">
                                                    <input
                                                        type="text"
                                                        class="form-control"
                                                        [ngModel]="companySearchTerm"
                                                        [ngModelOptions]="{ standalone: true }"
                                                        (ngModelChange)="onCompanySearchInput($event)"
                                                        (focus)="openCompanyDropdown()"
                                                        placeholder="Busca o escribe el nombre de la empresa"
                                                        autocomplete="off"
                                                        data-testid="equipment-modal-company-search" />
                                                    <div class="company-dropdown shadow-sm" *ngIf="companyDropdownOpen">
                                                        <div class="company-dropdown-empty" *ngIf="companyCatalogLoading">Cargando empresas...</div>
                                                        <div class="company-dropdown-empty" *ngIf="!companyCatalogLoading && companyCatalogError">{{ companyCatalogError }}</div>
                                                        <ng-container *ngIf="!companyCatalogLoading && !companyCatalogError">
                                                            <button
                                                                type="button"
                                                                class="company-dropdown-item"
                                                                *ngFor="let option of filteredCompanyOptions; trackBy: trackByCompanyOption"
                                                                [class.active]="isCompanyOptionSelected(option)"
                                                                (click)="selectCompanyOption(option.company)">
                                                                <span class="fw-semibold text-truncate">{{ option.company }}</span>
                                                                <span class="badge text-bg-light ms-2 flex-shrink-0">{{ option.sourceLabel }}</span>
                                                            </button>
                                                            <div class="company-dropdown-empty" *ngIf="filteredCompanyOptions.length === 0 && companyOptions.length > 0">
                                                                Sin coincidencias. Usa "Crear" para registrarla.
                                                            </div>
                                                            <div class="company-dropdown-empty" *ngIf="companyOptions.length === 0">
                                                                No hay empresas en Clientes o Prospectos. Usa "Crear".
                                                            </div>
                                                        </ng-container>
                                                    </div>
                                                </div>
                                                <button
                                                    class="btn btn-outline-theme flex-shrink-0"
                                                    type="button"
                                                    (click)="createCompanyQuick()"
                                                    [disabled]="creatingCompanyQuick"
                                                    data-testid="equipment-modal-company-create">
                                                    {{ creatingCompanyQuick ? 'Creando...' : 'Crear' }}
                                                </button>
                                            </div>

                                            <div class="small text-secondary mt-1" *ngIf="!companyCatalogLoading && !companyCatalogError && draft.companyName.trim()">
                                                Empresa seleccionada: <span class="fw-semibold">{{ draft.companyName }}</span>
                                            </div>
                                            <div class="small text-secondary mt-1" *ngIf="!companyCatalogLoading && !companyCatalogError && !draft.companyName.trim()">
                                                Selecciona una empresa de la lista o escribe una nueva y pulsa "Crear".
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Sucursal de envío</label>
                                        <select
                                            class="form-select"
                                            [ngModel]="selectedCompanyBranchOption"
                                            [ngModelOptions]="{ standalone: true }"
                                            (ngModelChange)="onCompanyBranchSelectionChange($event)"
                                            [disabled]="!draft.companyName.trim()"
                                            data-testid="equipment-modal-company-branch-select">
                                            <option value="">
                                                {{ companyBranchOptions.length > 0 ? 'Seleccionar sucursal' : 'Sin sucursales registradas para esta empresa' }}
                                            </option>
                                            <option *ngFor="let option of companyBranchOptions; trackBy: trackByCompanyBranchOption" [value]="option.value">
                                                {{ option.name }}{{ option.isPrimary ? ' · Principal' : '' }}{{ option.sourceLabel ? ' · ' + option.sourceLabel : '' }}
                                            </option>
                                        </select>
                                        <div class="small text-secondary mt-1" *ngIf="!draft.companyName.trim()">
                                            Selecciona una empresa para cargar sus sucursales.
                                        </div>
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Nit</label>
                                        <input class="form-control" [(ngModel)]="draft.nit" [ngModelOptions]="{ standalone: true }" />
                                    </div>

                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Teléfono</label>
                                        <input class="form-control" [(ngModel)]="draft.phone" [ngModelOptions]="{ standalone: true }" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Dirección</label>
                                        <input class="form-control" [(ngModel)]="draft.address" [ngModelOptions]="{ standalone: true }" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Ciudad</label>
                                        <input class="form-control" [(ngModel)]="draft.city" [ngModelOptions]="{ standalone: true }" />
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label">Contacto remitente (empresa)</label>
                                        <select
                                            class="form-select"
                                            [ngModel]="selectedCompanyContactOption"
                                            [ngModelOptions]="{ standalone: true }"
                                            (ngModelChange)="onCompanyContactSelectionChange($event)"
                                            [disabled]="!draft.companyName.trim() || companyContactsLoading"
                                            data-testid="equipment-modal-company-contact-select">
                                            <option value="">
                                                {{
                                                    companyContactsLoading
                                                        ? 'Cargando contactos...'
                                                        : companyContactOptions.length > 0
                                                            ? 'Seleccionar contacto de la empresa'
                                                            : 'Sin contactos registrados para esta empresa'
                                                }}
                                            </option>
                                            <option *ngFor="let option of companyContactOptions; trackBy: trackByCompanyContactOption" [value]="option.value">
                                                {{ option.name }}{{ option.role ? ' · ' + option.role : '' }}{{ option.sourceLabel ? ' · ' + option.sourceLabel : '' }}
                                            </option>
                                        </select>
                                        <div class="small text-danger mt-1" *ngIf="companyContactsError">{{ companyContactsError }}</div>
                                        <div class="small text-secondary mt-1" *ngIf="!companyContactsError && !draft.companyName.trim()">
                                            Selecciona una empresa para cargar sus contactos.
                                        </div>
                                    </div>

                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Contacto</label>
                                        <input class="form-control" [(ngModel)]="draft.contactName" [ngModelOptions]="{ standalone: true }" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Cargo</label>
                                        <input class="form-control" [(ngModel)]="draft.contactRole" [ngModelOptions]="{ standalone: true }" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Celular</label>
                                        <input class="form-control" [(ngModel)]="draft.cellphone" [ngModelOptions]="{ standalone: true }" />
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label">E-mail</label>
                                        <input class="form-control" [(ngModel)]="draft.email" [ngModelOptions]="{ standalone: true }" />
                                    </div>

                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Método de envío</label>
                                        <select
                                            class="form-select"
                                            [ngModel]="draft.intakeMethod || 'personal'"
                                            [ngModelOptions]="{ standalone: true }"
                                            (ngModelChange)="onIntakeMethodChange($event)">
                                            <option value="personal">Entrega personal</option>
                                            <option value="transportadora">Transportadora</option>
                                        </select>
                                    </div>

                                    <div class="col-12 col-lg-4" *ngIf="draft.intakeMethod === 'transportadora'">
                                        <label class="form-label">Transportadora</label>
                                        <input class="form-control" [(ngModel)]="draft.intakeCarrier" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Coordinadora" />
                                    </div>

                                    <div class="col-12 col-lg-4" *ngIf="draft.intakeMethod === 'transportadora'">
                                        <label class="form-label">Guía / tracking</label>
                                        <input class="form-control" [(ngModel)]="draft.intakeTrackingNumber" [ngModelOptions]="{ standalone: true }" placeholder="Número de guía" />
                                    </div>

                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Fecha y hora de recepción física</label>
                                        <input
                                            class="form-control"
                                            type="datetime-local"
                                            [ngModel]="toDateTimeLocalInput(draft.intakeReceivedAt || '')"
                                            [ngModelOptions]="{ standalone: true }"
                                            (ngModelChange)="onIntakeReceivedAtChange($event)" />
                                    </div>
                                </div>
                            </div>
                        </ng-container>

                        <ng-container *ngIf="currentWizardStep.key === 'equipment'">
                            <div class="mb-3">
                                <div>
                                    <h6 class="mb-1">Equipos a asociar</h6>
                                    <p class="text-secondary small mb-0">Completa cada equipo y deja que el wizard te lleve luego a la captura de evidencia.</p>
                                </div>
                            </div>

                            <div class="row gx-3 gy-3">
                                <div class="col-12" *ngFor="let item of draft.items; let i = index; trackBy: trackByItemId">
                                    <div class="border rounded p-3 equipment-card" [class.equipment-card-warning]="itemWarningCount(item) > 0">
                                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                            <div>
                                                <h6 class="mb-1">
                                                    {{ equipmentCardTitle(item, i) }}
                                                    <i
                                                        class="bi ms-2"
                                                        data-testid="software-backup-icon"
                                                        [ngClass]="softwareBackupFor(item) ? 'bi-cloud-check-fill text-success' : 'bi-cloud text-secondary'"
                                                        [title]="softwareBackupFor(item) ? 'Hay backup de software para este modelo' : 'Sin backup de software para este modelo'"></i>
                                                    <i
                                                        *ngIf="item.priorityBilling"
                                                        class="bi bi-bell-fill text-warning ms-1"
                                                        data-testid="priority-billing-badge"
                                                        title="Marcado para facturación urgente"></i>
                                                </h6>
                                                <p class="text-secondary small mb-0">Servicio {{ item.serviceTypeName || "pendiente" }} · Ubicación {{ item.storageLocationName || "pendiente" }}</p>
                                                <a
                                                    *ngIf="softwareBackupFor(item)?.url"
                                                    [href]="softwareBackupFor(item)?.url"
                                                    [attr.download]="softwareBackupFor(item)?.fileName || null"
                                                    class="btn btn-sm btn-outline-success mt-2"
                                                    data-testid="equipment-backup-download">
                                                    <i class="bi bi-download me-1"></i>Descargar backup
                                                </a>
                                                <div class="equipment-warning-list mt-2" *ngIf="itemWarningCount(item) > 0">
                                                    <span class="badge warning-chip" *ngFor="let warning of visibleItemWarnings(item); trackBy: trackByItemWarningCode">{{ warning.label }}</span>
                                                    <span class="badge text-bg-light" *ngIf="hiddenItemWarningCount(item) > 0">+{{ hiddenItemWarningCount(item) }}</span>
                                                </div>
                                            </div>
                                            <button class="btn btn-sm btn-outline-danger" type="button" [attr.data-testid]="'equipment-modal-remove-item-' + i" (click)="removeEquipmentItem(i)" [disabled]="draft.items.length === 1">
                                                Eliminar
                                            </button>
                                        </div>

                                        <div class="row gx-3 gy-3">
                                            <div class="col-12 col-lg-4">
                                                <label class="form-label">Ruta de registro</label>
                                                <select
                                                    class="form-select"
                                                    [(ngModel)]="item.registrationMode"
                                                    [ngModelOptions]="{ standalone: true }"
                                                    [attr.data-testid]="'equipment-modal-registration-mode-' + i"
                                                    (ngModelChange)="applyRegistrationMode(item, $event)">
                                                    <option value="catalog">Modelo del catálogo</option>
                                                    <option value="manual">Manual / no homologado</option>
                                                </select>
                                                <p class="small text-secondary mb-0 mt-2">
                                                    {{ item.registrationMode === "manual" ? "Captura libre de familia, marca, tipo y serie aunque aún no exista en el maestro." : "Usa el maestro central para conservar la homologación del equipo." }}
                                                </p>
                                            </div>
                                            <div class="col-12 col-lg-4">
                                                <label class="form-label">Modelo industrial</label>
                                                <select class="form-select" [(ngModel)]="item.equipmentModelId" [ngModelOptions]="{ standalone: true }" [disabled]="item.registrationMode === 'manual'" (ngModelChange)="applyEquipmentModel(item, $event)">
                                                    <option value="">Seleccionar modelo del catálogo</option>
                                                    <option *ngFor="let model of activeEquipmentModels; trackBy: trackByModelId" [value]="model.id">{{ equipmentModelLabel(model) }}</option>
                                                </select>
                                                <p class="small text-secondary mb-0 mt-2">{{ item.registrationMode === "manual" ? "El modo manual omite el catálogo y deja el equipo marcado para homologación." : "Si necesitas otro modelo, créalo antes en Config. Equipos." }}</p>
                                            </div>
                                            <div class="col-12 col-lg-2">
                                                <label class="form-label">Familia</label>
                                                <input
                                                    class="form-control"
                                                    [(ngModel)]="item.familyName"
                                                    [ngModelOptions]="{ standalone: true }"
                                                    [readonly]="item.registrationMode !== 'manual'"
                                                    [class.bg-light]="item.registrationMode !== 'manual'"
                                                    [placeholder]="item.registrationMode === 'manual' ? 'Familia libre' : ''" />
                                            </div>
                                            <div class="col-12 col-lg-3">
                                                <label class="form-label">Tipo de servicio</label>
                                                <select class="form-select" [(ngModel)]="item.serviceTypeId" [ngModelOptions]="{ standalone: true }" (ngModelChange)="applyServiceType(item, $event)">
                                                    <option value="">Seleccionar tipo de servicio</option>
                                                    <option *ngFor="let serviceType of activeEquipmentServiceTypes; trackBy: trackByServiceTypeId" [value]="serviceType.id">{{ serviceType.name }}</option>
                                                </select>
                                            </div>
                                            <div class="col-12 col-lg-3">
                                                <label class="form-label">Ubicación de almacenamiento</label>
                                                <select class="form-select" [(ngModel)]="item.storageLocationId" [ngModelOptions]="{ standalone: true }" (ngModelChange)="applyStorageLocation(item, $event)">
                                                    <option value="">Seleccionar ubicación</option>
                                                    <option *ngFor="let location of activeEquipmentLocations; trackBy: trackByLocationId" [value]="location.id">{{ location.name }}</option>
                                                </select>
                                            </div>
                                            <div class="col-12 col-lg-3">
                                                <label class="form-label">Marca</label>
                                                <input
                                                    class="form-control"
                                                    [class.bg-light]="item.registrationMode !== 'manual'"
                                                    [(ngModel)]="item.marca"
                                                    [ngModelOptions]="{ standalone: true }"
                                                    [readonly]="item.registrationMode !== 'manual'"
                                                    (ngModelChange)="onItemModelChange(item)"
                                                    [placeholder]="item.registrationMode === 'manual' ? 'Marca del equipo' : ''" />
                                            </div>
                                            <div class="col-12 col-lg-3">
                                                <label class="form-label">Tipo</label>
                                                <input
                                                    class="form-control"
                                                    [class.bg-light]="item.registrationMode !== 'manual'"
                                                    [(ngModel)]="item.tipo"
                                                    [ngModelOptions]="{ standalone: true }"
                                                    [readonly]="item.registrationMode !== 'manual'"
                                                    (ngModelChange)="onItemModelChange(item)"
                                                    [placeholder]="item.registrationMode === 'manual' ? 'Tipo / referencia' : ''" />
                                            </div>
                                            <div class="col-12 col-lg-3">
                                                <label class="form-label">Serie</label>
                                                <input
                                                    class="form-control"
                                                    [class.bg-light]="item.registrationMode !== 'manual'"
                                                    [(ngModel)]="item.serie"
                                                    [ngModelOptions]="{ standalone: true }"
                                                    [readonly]="item.registrationMode !== 'manual'"
                                                    [placeholder]="item.registrationMode === 'manual' ? 'Serie o referencia visible' : ''" />
                                            </div>
                                            <div class="col-12">
                                                <div class="border rounded p-3 bg-light-subtle equipment-intake-flags">
                                                    <div class="small fw-semibold mb-2">Warnings operativos de ingreso</div>
                                                    <div class="row gx-3 gy-2">
                                                        <div class="col-12 col-lg-4">
                                                            <div class="form-check mb-0">
                                                                <input class="form-check-input" type="checkbox" [id]="'pending-homologation-' + item.id" [(ngModel)]="item.pendingHomologation" [ngModelOptions]="{ standalone: true }" />
                                                                <label class="form-check-label" [for]="'pending-homologation-' + item.id">Pendiente de homologación</label>
                                                            </div>
                                                        </div>
                                                        <div class="col-12 col-lg-4">
                                                            <div class="form-check mb-0">
                                                                <input class="form-check-input" type="checkbox" [id]="'estimated-data-' + item.id" [(ngModel)]="item.estimatedData" [ngModelOptions]="{ standalone: true }" />
                                                                <label class="form-check-label" [for]="'estimated-data-' + item.id">Datos estimados / por confirmar</label>
                                                            </div>
                                                        </div>
                                                        <div class="col-12 col-lg-4">
                                                            <div class="form-check mb-0">
                                                                <input class="form-check-input" type="checkbox" [id]="'label-issue-' + item.id" [(ngModel)]="item.identifierLabelIssue" [ngModelOptions]="{ standalone: true }" />
                                                                <label class="form-check-label" [for]="'label-issue-' + item.id">Etiqueta rota o ilegible</label>
                                                            </div>
                                                        </div>
                                                        <div class="col-12 col-lg-4">
                                                            <div class="form-check mb-0">
                                                                <input class="form-check-input" type="checkbox" [id]="'priority-billing-' + item.id" [(ngModel)]="item.priorityBilling" [ngModelOptions]="{ standalone: true }" data-testid="priority-billing-toggle" />
                                                                <label class="form-check-label" [for]="'priority-billing-' + item.id">
                                                                    <i class="bi bi-bell text-warning me-1"></i>Facturación urgente (priority billing)
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p class="small text-secondary mb-0 mt-2">Estos warnings no bloquean el avance ni el guardado; quedan visibles para operación en el listado.</p>
                                                </div>
                                            </div>
                                            <div class="col-12 col-lg-3">
                                                <label class="form-label">Remisión del cliente / guía</label>
                                                <input class="form-control" [(ngModel)]="item.customerShipmentReference" [ngModelOptions]="{ standalone: true }" placeholder="BL o referencia de transporte" />
                                            </div>
                                            <div class="col-12 col-lg-6">
                                                <label class="form-label">Accesorios</label>
                                                <input class="form-control" [(ngModel)]="item.accessories" [ngModelOptions]="{ standalone: true }" placeholder="USB, cables, CD, caja original..." />

                                                <div class="borrowed-equipment-repeater mt-3">
                                                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                                        <label class="form-label mb-0">Equipos prestados para prueba</label>
                                                        <button class="btn btn-sm btn-outline-theme" type="button" [attr.data-testid]="'equipment-modal-add-borrowed-' + i" (click)="addBorrowedEquipment(item)">
                                                            <i class="bi bi-plus-lg me-1"></i> Agregar
                                                        </button>
                                                    </div>
                                                    <p class="small text-secondary mb-2">Registra equipos que el cliente presta para pruebas (ej.: parlantes, monitor, cableado, motor equivalente).</p>

                                                    <div class="vstack gap-2" *ngIf="item.borrowedEquipments.length > 0; else borrowedEquipmentEmptyState">
                                                        <div class="input-group input-group-sm" *ngFor="let borrowedEquipment of item.borrowedEquipments; let borrowedIndex = index; trackBy: trackByBorrowedEquipmentIndex">
                                                            <span class="input-group-text">#{{ borrowedIndex + 1 }}</span>
                                                            <input
                                                                class="form-control"
                                                                [(ngModel)]="item.borrowedEquipments[borrowedIndex]"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                placeholder="Ej.: Parlante activo de referencia, motor de prueba, etc." />
                                                            <button
                                                                class="btn btn-outline-danger"
                                                                type="button"
                                                                [attr.data-testid]="'equipment-modal-remove-borrowed-' + i + '-' + borrowedIndex"
                                                                (click)="removeBorrowedEquipment(item, borrowedIndex)">
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <ng-template #borrowedEquipmentEmptyState>
                                                        <div class="small text-secondary border rounded px-2 py-2">Sin equipos prestados registrados.</div>
                                                    </ng-template>
                                                </div>
                                            </div>
                                            <div class="col-12 col-lg-6">
                                                <label class="form-label">Descripción de la falla / error / alarma que presenta el equipo</label>
                                                <textarea class="form-control" rows="3" [(ngModel)]="item.failureDescription" [ngModelOptions]="{ standalone: true }"></textarea>
                                            </div>
                                            <div class="col-12">
                                                <div class="border rounded p-3 bg-light-subtle">
                                                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                                        <h6 class="mb-0">Asignación técnica</h6>
                                                        <button class="btn btn-sm btn-outline-secondary" type="button" (click)="refreshTechniciansForItem(item)" [disabled]="technicianCatalogLoading">
                                                            Actualizar carga
                                                        </button>
                                                    </div>
                                                    <p class="small text-secondary mb-2">
                                                        Especialidad detectada: <strong>{{ resolveItemAssignmentSpeciality(item) }}</strong>
                                                    </p>
                                                    <div class="row gx-3 gy-2 align-items-end">
                                                        <div class="col-12 col-lg-8">
                                                            <label class="form-label">Técnico responsable</label>
                                                            <select
                                                                class="form-select"
                                                                [ngModel]="item.assignedToId || ''"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                (ngModelChange)="assignDraftTechnicianToItem(item, $event)">
                                                                <option value="">Sin asignar</option>
                                                                <option *ngFor="let technician of technicianOptionsForItem(item)" [value]="technician.id">
                                                                    {{ technician.name }} · {{ technician.role || 'Sin rol' }} · carga {{ technician.activeItems }}
                                                                </option>
                                                            </select>
                                                        </div>
                                                        <div class="col-12 col-lg-4">
                                                            <div class="small text-secondary">Asignado por</div>
                                                            <div class="fw-semibold">{{ item.assignedBy || '--' }}</div>
                                                            <div class="small text-secondary">{{ item.assignedAt ? formatEvidenceDate(item.assignedAt) : 'Sin fecha' }}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12">
                                                <div class="border rounded p-3 bg-light-subtle">
                                                    <div class="form-check mb-0">
                                                        <input
                                                            class="form-check-input"
                                                            type="checkbox"
                                                            [id]="'is-warranty-' + item.id"
                                                            [(ngModel)]="warrantyStateFor(item).isWarranty"
                                                            [ngModelOptions]="{ standalone: true }"
                                                            (ngModelChange)="onWarrantyToggle(item)"
                                                            data-testid="is-warranty-check" />
                                                        <label class="form-check-label" [for]="'is-warranty-' + item.id">Es garantia</label>
                                                    </div>
                                                    <div class="row gx-3 gy-2 mt-1" *ngIf="warrantyStateFor(item).isWarranty">
                                                        <div class="col-12 col-lg-4">
                                                            <label class="form-label small">Codigo antiguo</label>
                                                            <input
                                                                class="form-control form-control-sm"
                                                                [(ngModel)]="warrantyStateFor(item).oldCode"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                placeholder="Codigo de la recepcion anterior"
                                                                data-testid="old-code-field" />
                                                        </div>
                                                        <div class="col-12 col-lg-4">
                                                            <label class="form-label small">Fecha de compra / primera recepcion</label>
                                                            <input
                                                                type="date"
                                                                class="form-control form-control-sm"
                                                                [(ngModel)]="warrantyStateFor(item).firstReceptionDate"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                data-testid="warranty-first-reception-input" />
                                                        </div>
                                                        <div class="col-12 col-lg-4">
                                                            <label class="form-label small">Meses de garantia</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                class="form-control form-control-sm"
                                                                [(ngModel)]="warrantyStateFor(item).warrantyMonths"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                data-testid="warranty-months-input" />
                                                        </div>
                                                        <div class="col-12" *ngIf="warrantyMonthsRemainingFor(item) !== null">
                                                            <span
                                                                class="badge"
                                                                data-testid="warranty-months-badge"
                                                                [ngClass]="(warrantyMonthsRemainingFor(item) || 0) > 0 ? 'bg-success' : 'bg-danger'">
                                                                {{ (warrantyMonthsRemainingFor(item) || 0) > 0 ? "Quedan " + warrantyMonthsRemainingFor(item) + " mes(es) de garantia" : "Garantia vencida" }}
                                                            </span>
                                                        </div>
                                                        <div class="col-12" *ngIf="warrantyStateFor(item).previousReception">
                                                            <div class="small border rounded p-2 bg-white" data-testid="warranty-history">
                                                                <span class="fw-semibold">Recepcion previa:</span>
                                                                {{ warrantyStateFor(item).previousReception?.code || "Sin codigo" }}
                                                                <span *ngIf="warrantyStateFor(item).previousReception?.receptionDate"> · {{ warrantyStateFor(item).previousReception?.receptionDate }}</span>
                                                                <span *ngIf="warrantyStateFor(item).previousReception?.clientName"> · {{ warrantyStateFor(item).previousReception?.clientName }}</span>
                                                                <div class="text-secondary" *ngIf="warrantyStateFor(item).previousReception?.failureDescription">Falla: {{ warrantyStateFor(item).previousReception?.failureDescription }}</div>
                                                            </div>
                                                        </div>
                                                        <div class="col-12" *ngIf="showWarrantyValidationAlert(item)">
                                                            <div class="alert alert-danger py-2 mb-0" data-testid="warranty-validation-alert">
                                                                <i class="bi bi-exclamation-triangle me-1"></i>El equipo se registra como garantia pero esta fuera del periodo de garantia.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ng-container>

                        <ng-container *ngIf="currentWizardStep.key === 'questions'">
                            <div class="border rounded overflow-hidden">
                                <div class="p-3 border-bottom bg-light-subtle">
                                    <h6 class="mb-1">Preguntas por equipo</h6>
                                    <p class="text-secondary small mb-0">Activa el switch cuando la respuesta sea Sí. Para respuestas abiertas, escribe el detalle.</p>
                                </div>
                                <div class="p-3">
                                    <div class="row gx-3 gy-3">
                                        <div class="col-12 col-xl-12" *ngFor="let item of reviewItems; let i = index; trackBy: trackByItemId">
                                            <div class="border rounded p-3 h-100 question-card">
                                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                                    <div>
                                                        <h6 class="mb-1">{{ equipmentCardTitle(item, i) }}</h6>
                                                        <p class="text-secondary small mb-0">{{ item.serviceTypeName || "Sin tipo de servicio" }} · {{ item.storageLocationName || "Sin ubicación" }}</p>
                                                    </div>
                                                </div>

                                                <div class="alert border border-warning bg-warning-subtle mb-3" *ngIf="requiresIndustrialOverride(item)">
                                                    <div class="fw-semibold mb-1">Bloqueo por filtro industrial</div>
                                                    <p class="small mb-2">
                                                        Perfil actual: <strong>{{ resolveItemIndustrialLabel(item) }}</strong>. Para guardar debes registrar autorización de jefe técnico.
                                                    </p>
                                                    <div class="row gx-2 gy-2">
                                                        <div class="col-12 col-lg-4">
                                                            <label class="form-label small">Autorizado por</label>
                                                            <input
                                                                class="form-control form-control-sm"
                                                                [ngModel]="item.industrialOverrideAuthorizedBy || ''"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                (ngModelChange)="onIndustrialOverrideAuthorizedByChange(item, $event)"
                                                                placeholder="Nombre del jefe" />
                                                        </div>
                                                        <div class="col-12 col-lg-8">
                                                            <label class="form-label small">Motivo de autorización</label>
                                                            <input
                                                                class="form-control form-control-sm"
                                                                [(ngModel)]="item.industrialOverrideReason"
                                                                [ngModelOptions]="{ standalone: true }"
                                                                placeholder="Justificación operativa" />
                                                        </div>
                                                    </div>
                                                    <div class="small text-secondary mt-2" *ngIf="item.industrialOverrideAuthorizedAt">
                                                        Autorización registrada: {{ formatEvidenceDate(item.industrialOverrideAuthorizedAt || '') }}
                                                    </div>
                                                </div>

                                                <div class="vstack gap-3">
                                                    <div class="border rounded p-3 bg-light-subtle" *ngFor="let question of questionDefinitions; trackBy: trackByQuestionKey">
                                                        <div class="small fw-semibold mb-2">{{ question.label }}</div>

                                                        <ng-container *ngIf="question.type === 'boolean'; else freeAnswerField">
                                                            <ng-container *ngIf="question.key === priorityQuestionKey; else regularBooleanQuestion">
                                                                <div class="priority-question" [class.priority-question-active]="isPriorityPaid(item)">
                                                                    <div class="form-check form-switch switch-answer mb-0">
                                                                        <input
                                                                            class="form-check-input priority-check-input"
                                                                            type="checkbox"
                                                                            [id]="'question-' + item.id + '-' + question.key"
                                                                            [checked]="isBooleanAnswerYes(item, question.key)"
                                                                            (change)="toggleBooleanAnswer(item, question.key, $any($event.target).checked)" />
                                                                        <label class="form-check-label small fw-semibold ms-2" [class.text-danger]="isPriorityPaid(item)" [for]="'question-' + item.id + '-' + question.key">
                                                                            {{ isPriorityPaid(item) ? "Urgencia / prioridad ($)" : "Diagnóstico gratis" }}
                                                                        </label>
                                                                    </div>

                                                                    <p class="small mb-0 mt-2" [class.text-danger]="isPriorityPaid(item)" [class.text-secondary]="!isPriorityPaid(item)">
                                                                        {{ isPriorityPaid(item) ? "Se marca como atención prioritaria con costo adicional." : "Se mantiene en modalidad de diagnóstico gratis." }}
                                                                    </p>
                                                                </div>
                                                            </ng-container>

                                                            <ng-template #regularBooleanQuestion>
                                                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                                    <span class="small text-secondary">No</span>
                                                                    <div class="form-check form-switch switch-answer mb-0">
                                                                        <input
                                                                            class="form-check-input"
                                                                            type="checkbox"
                                                                            [id]="'question-' + item.id + '-' + question.key"
                                                                            [checked]="isBooleanAnswerYes(item, question.key)"
                                                                            (change)="toggleBooleanAnswer(item, question.key, $any($event.target).checked)" />
                                                                        <label class="form-check-label small fw-semibold ms-2" [for]="'question-' + item.id + '-' + question.key">
                                                                            {{ isBooleanAnswerYes(item, question.key) ? "Sí" : "No" }}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </ng-template>
                                                        </ng-container>

                                                        <ng-template #freeAnswerField>
                                                            <input class="form-control form-control-sm" [(ngModel)]="item.answers[question.key]" [ngModelOptions]="{ standalone: true }" placeholder="Horas, días, meses" />
                                                        </ng-template>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ng-container>

                        <ng-container *ngIf="currentWizardStep.key === 'evidence'">
                            <div class="alert alert-info border mb-3">
                                Desde el celular este paso puede abrir la cámara trasera para escanear o tomar fotos. El frontend lee EXIF, calcula el hash SHA-256 y conserva una miniatura; el backend en Go/Echo debe recibir luego el archivo original para consolidar la auditoría.
                            </div>

                            <div class="row gx-3 gy-3">
                                <div class="col-12" *ngFor="let item of reviewItems; let i = index; trackBy: trackByItemId">
                                    <div class="border rounded p-3 evidence-card">
                                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                            <div>
                                                <h6 class="mb-1">{{ equipmentCardTitle(item, i) }}</h6>
                                                <p class="text-secondary small mb-0">{{ item.serviceTypeName || "Sin tipo de servicio" }} · {{ item.storageLocationName || "Sin ubicación" }}</p>
                                            </div>
                                            <div class="d-flex flex-wrap gap-2">
                                                <span class="badge text-bg-light">{{ item.evidencePhotos.length }} evidencia(s)</span>
                                                <span class="badge" [class.text-bg-success]="hasRequiredFaceEvidence(item)" [class.text-bg-warning]="!hasRequiredFaceEvidence(item)">
                                                    {{ hasRequiredFaceEvidence(item) ? 'Caras completas' : 'Caras pendientes' }}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="row gx-4 gy-4 align-items-start">
                                            <div class="col-12 col-xxl-4">
                                                <div class="border rounded p-3 bg-white h-100 evidence-side-panel">
                                                    <label class="form-label">Identificador recibido / código escaneado</label>
                                                    <input
                                                        class="form-control"
                                                        [(ngModel)]="item.receivedIdentifier"
                                                        [ngModelOptions]="{ standalone: true }"
                                                        (ngModelChange)="markIdentifierAsManual(item, $event)"
                                                        placeholder="QR, código de barras, serial o placa" />
                                                    <p class="small text-secondary mb-0 mt-2">
                                                        {{ item.receivedIdentifier ? identifierSummary(item) : "Puedes digitarlo manualmente o escanearlo desde la cámara del celular." }}
                                                    </p>

                                                    <div class="row gx-2 gy-2 mt-2 mb-3">
                                                        <div class="col-6">
                                                            <div class="border rounded p-2 h-100 bg-light-subtle">
                                                                <div class="small text-secondary mb-1">Tipo detectado</div>
                                                                <div class="fw-semibold small text-break">{{ item.receivedIdentifierType || "--" }}</div>
                                                            </div>
                                                        </div>
                                                        <div class="col-6">
                                                            <div class="border rounded p-2 h-100 bg-light-subtle">
                                                                <div class="small text-secondary mb-1">Origen</div>
                                                                <div class="fw-semibold small">{{ item.receivedIdentifierSource === 'camera-scan' ? 'Cámara' : 'Manual' }}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <label class="form-label">Escaneo móvil</label>
                                                    <div class="d-flex gap-2 flex-wrap mb-2">
                                                        <button class="btn btn-outline-theme" type="button" [attr.data-testid]="'equipment-modal-open-scanner-' + i" (click)="openScanner(item)" [disabled]="!cameraScannerSupported">Escanear desde cámara</button>
                                                        <button class="btn btn-outline-secondary" type="button" [attr.data-testid]="'equipment-modal-clear-identifier-' + i" *ngIf="item.receivedIdentifier" (click)="clearIdentifier(item)">Limpiar</button>
                                                    </div>
                                                    <p class="small text-secondary mb-3" *ngIf="!cameraScannerSupported">Este navegador no expone cámara para lectura continua. El campo manual sigue disponible.</p>

                                                    <label class="form-label">Tomar fotos / subir evidencia</label>
                                                    <input class="form-control" type="file" accept="image/*" capture="environment" multiple (change)="handleEvidenceFilesSelected(item, $event)" />
                                                    <p class="small text-secondary mb-3 mt-2">En móvil, el atributo capture intenta abrir la cámara trasera. Puedes cargar tantas fotos como necesites.</p>

                                                    <div class="border rounded p-3 bg-light-subtle small mb-3" [class.border-success]="hasRequiredFaceEvidence(item)" [class.border-warning]="!hasRequiredFaceEvidence(item)">
                                                        <div class="fw-semibold text-dark mb-2">Checklist de caras obligatorias</div>
                                                        <div class="d-flex justify-content-between align-items-center mb-1" *ngFor="let faceType of requiredFaceEvidenceTypes">
                                                            <span>{{ getFaceEvidenceLabel(faceType) }}</span>
                                                            <span [class.text-success]="!getMissingRequiredFaceEvidence(item).includes(faceType)" [class.text-warning]="getMissingRequiredFaceEvidence(item).includes(faceType)">
                                                                {{ getMissingRequiredFaceEvidence(item).includes(faceType) ? 'Pendiente' : 'OK' }}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div class="border rounded p-3 bg-light-subtle small text-secondary">
                                                        <div class="fw-semibold text-dark mb-2">Checklist de auditoría</div>
                                                        <div class="mb-1">Original al backend Echo, miniatura en frontend.</div>
                                                        <div class="mb-1">Hash SHA-256 para trazabilidad del archivo.</div>
                                                        <div>Fecha EXIF visible y sello servidor pendiente.</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-12 col-xxl-8">
                                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                                    <div>
                                                        <h6 class="mb-1">Galería y metadatos</h6>
                                                        <p class="small text-secondary mb-0">Miniaturas, EXIF y huella del archivo listos para revisión operativa.</p>
                                                    </div>
                                                    <div class="d-flex flex-wrap gap-2">
                                                        <span class="badge text-bg-light">{{ item.evidencePhotos.length }} foto(s)</span>
                                                        <span class="badge text-bg-light">{{ item.receivedIdentifier ? 'Identificador listo' : 'Sin identificador' }}</span>
                                                    </div>
                                                </div>

                                                <div class="alert alert-info border small mb-3" *ngIf="evidenceLoadingItemId === item.id">
                                                    Procesando evidencias: miniatura, EXIF y hash SHA-256.
                                                </div>

                                                <div class="border rounded p-4 text-center text-secondary evidence-empty" *ngIf="item.evidencePhotos.length === 0 && evidenceLoadingItemId !== item.id">
                                                    Aún no hay fotos de evidencia para este equipo.
                                                </div>

                                                <div class="vstack gap-3" *ngIf="item.evidencePhotos.length > 0">
                                                    <div class="border rounded p-3 evidence-photo-card" *ngFor="let evidence of item.evidencePhotos; trackBy: trackByEvidenceId">
                                                        <div class="d-flex gap-3 align-items-start flex-wrap flex-sm-nowrap">
                                                            <img [src]="evidence.thumbnailDataUrl" alt="Evidencia" class="evidence-thumb rounded" />

                                                            <div class="flex-grow-1 min-w-0">
                                                                <div class="row gx-2 gy-2 align-items-start">
                                                                    <div class="col-12 col-md-6 col-xl-4">
                                                                        <label class="form-label small">Tipo de evidencia</label>
                                                                        <select class="form-select form-select-sm" [(ngModel)]="evidence.evidenceType" [ngModelOptions]="{ standalone: true }">
                                                                            <option *ngFor="let option of evidenceTypeOptions; trackBy: trackByEvidenceType" [ngValue]="option.value">{{ option.label }}</option>
                                                                        </select>
                                                                    </div>
                                                                    <div class="col-12 col-md-6 col-xl-4">
                                                                        <label class="form-label small">Notas</label>
                                                                        <input class="form-control form-control-sm" [(ngModel)]="evidence.notes" [ngModelOptions]="{ standalone: true }" placeholder="Golpe lateral, placa legible, caja sellada..." />
                                                                    </div>
                                                                    <div class="col-12 col-xl-4 text-xl-end">
                                                                        <button class="btn btn-sm btn-outline-danger mt-xl-4" type="button" (click)="removeEvidencePhoto(item, evidence.id)">Eliminar</button>
                                                                    </div>
                                                                </div>

                                                                <div class="small text-secondary mt-3 evidence-meta-grid">
                                                                    <span><strong>Archivo:</strong> {{ evidence.fileName }}</span>
                                                                    <span><strong>Peso:</strong> {{ formatBytes(evidence.sizeBytes) }}</span>
                                                                    <span><strong>Resolución:</strong> {{ evidence.width }} x {{ evidence.height }}</span>
                                                                    <span><strong>Captura:</strong> {{ formatEvidenceDate(evidence.capturedAt) }} ({{ evidence.capturedAtSource === 'exif' ? 'EXIF' : 'archivo' }})</span>
                                                                    <span><strong>Equipo:</strong> {{ evidence.deviceMake || '--' }} {{ evidence.deviceModel || '' }}</span>
                                                                    <span><strong>GPS:</strong> {{ formatGps(evidence) }}</span>
                                                                    <span class="w-100"><strong>SHA-256:</strong> {{ evidence.sha256 }}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mb-3" *ngIf="item.repairStatus === 'listo-entrega' || item.repairStatus === 'pruebas'">
                                            <label class="form-label small fw-bold">
                                                <i class="bi bi-youtube text-danger me-1"></i>Link YouTube (video de prueba)
                                            </label>
                                            <input type="url" class="form-control form-control-sm" [(ngModel)]="item.youtubeLink" [ngModelOptions]="{ standalone: true }" placeholder="https://youtube.com/watch?v=..." data-testid="youtube-link-input" />
                                        </div>
                                        <div class="mb-3" *ngIf="item.repairStatus === 'listo-entrega'">
                                            <label class="form-label small fw-bold">
                                                <i class="bi bi-camera me-1"></i>Fotos de despacho
                                            </label>
                                            <input type="file" class="form-control form-control-sm" accept="image/*" multiple (change)="onDispatchPhotosSelected($event, item)" data-testid="dispatch-photos-input" />
                                            <div class="d-flex gap-2 flex-wrap mt-2" *ngIf="item.dispatchPhotos?.length">
                                                <img *ngFor="let photo of item.dispatchPhotos" [src]="photo.thumbnailDataUrl || photo.dataUrl" class="rounded" style="width:60px;height:60px;object-fit:cover;" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ng-container>

                        <ng-container *ngIf="currentWizardStep.key === 'signatures'">
                            <div class="alert alert-info small mb-3">
                                <strong>Importante:</strong> El alcance y las condiciones generales del servicio se encuentran al respaldo del formato original.
                            </div>

                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-xl-7">
                                    <div class="border rounded p-3 h-100">
                                        <h6 class="mb-3">Resumen de la recepción</h6>
                                        <div class="row gx-3 gy-3 small mb-3">
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Empresa</div>
                                                <div class="fw-semibold">{{ draft.companyName || "--" }}</div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Sucursal</div>
                                                <div class="fw-semibold">{{ draft.sourceBranchName || "--" }}</div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Contacto</div>
                                                <div class="fw-semibold">{{ draft.contactName || "--" }}</div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Fecha</div>
                                                <div class="fw-semibold">{{ draft.receptionDay || "--" }}/{{ draft.receptionMonth || "--" }}/{{ draft.receptionYear || "----" }}</div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Ciudad</div>
                                                <div class="fw-semibold">{{ draft.city || "--" }}</div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Ingreso</div>
                                                <div class="fw-semibold">
                                                    {{ (draft.intakeMethod || 'personal') === 'transportadora' ? 'Transportadora' : 'Personal' }}
                                                    <span *ngIf="draft.intakeCarrier"> · {{ draft.intakeCarrier }}</span>
                                                </div>
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <div class="text-secondary mb-1">Recepción física</div>
                                                <div class="fw-semibold">{{ draft.intakeReceivedAt ? formatEvidenceDate(draft.intakeReceivedAt) : "--" }}</div>
                                            </div>
                                        </div>

                                        <h6 class="mb-2">Equipos listos para guardar</h6>
                                        <div class="vstack gap-2">
                                            <div class="border rounded px-3 py-2" *ngFor="let item of reviewItems; let i = index; trackBy: trackByItemId">
                                                <div class="fw-semibold small mb-1">{{ equipmentCardTitle(item, i) }}</div>
                                                <div class="small text-secondary">{{ item.serviceTypeName || "Sin tipo" }} · {{ item.storageLocationName || "Sin ubicación" }}</div>
                                                <div class="small text-secondary">Escaneo: {{ item.receivedIdentifier || "Sin identificador" }} · Evidencias: {{ item.evidencePhotos.length }}</div>
                                                <div class="small text-secondary">Remisión: {{ item.customerShipmentReference || "Sin referencia" }} · Accesorios: {{ item.accessories || "Sin accesorios" }}</div>
                                                <div class="small text-secondary">Prestados: {{ borrowedEquipmentsSummary(item) }}</div>
                                                <div class="small text-secondary">Técnico: {{ item.assignedTo || 'Sin asignar' }} {{ item.assignedAt ? '· ' + formatEvidenceDate(item.assignedAt) : '' }}</div>
                                                <div class="small text-secondary">Override industrial: {{ hasIndustrialOverrideAuthorization(item) ? 'Autorizado' : 'No aplica / pendiente' }}</div>

                                                <div class="d-flex align-items-center gap-2 flex-wrap mt-2" *ngIf="getItemQrAttachment(item) as qrAttachment">
                                                    <img [src]="qrAttachment.dataUrl" alt="QR equipo" class="reception-qr-thumb rounded border" />
                                                    <button class="btn btn-sm btn-outline-theme" type="button" (click)="downloadItemQr(item, i)">Descargar QR PNG</button>
                                                    <button class="btn btn-sm btn-outline-secondary" type="button" (click)="printItemQr(item)">Imprimir QR</button>
                                                </div>
                                                <div class="small text-warning mt-2" *ngIf="!getItemQrAttachment(item)">Etiqueta QR pendiente de generar.</div>
                                            </div>
                                        </div>

                                        <div class="border rounded p-3 mt-3 bg-light-subtle">
                                            <div class="form-check form-switch mb-2">
                                                <input
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    id="generateRepairProjectsOnSave"
                                                    [(ngModel)]="generateRepairProjectsOnSave"
                                                    [ngModelOptions]="{ standalone: true }" />
                                                <label class="form-check-label fw-semibold" for="generateRepairProjectsOnSave">
                                                    Generar proyectos de reparación al guardar
                                                </label>
                                            </div>

                                            <p class="small mb-0 text-secondary" *ngIf="repairProjectsToCreateCount > 0">
                                                Se crearán {{ repairProjectsToCreateCount }} proyecto(s) en Trabajo > Proyectos usando los equipos marcados como reparación.
                                            </p>
                                            <p class="small mb-0 text-secondary" *ngIf="repairProjectsToCreateCount === 0">
                                                No hay equipos con tipo de servicio reparación en esta recepción.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-xl-5">
                                    <div class="border rounded p-3 h-100">
                                        <h6 class="mb-3">Firmas</h6>
                                        <div class="row gx-3 gy-3">
                                            <div class="col-12">
                                                <label class="form-label">Firma CLIENTE</label>
                                                <input class="form-control" [(ngModel)]="draft.clientSignature" [ngModelOptions]="{ standalone: true }" placeholder="Nombre o referencia de firma" />
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Firma PIKA</label>
                                                <input class="form-control" [(ngModel)]="draft.pikaSignature" [ngModelOptions]="{ standalone: true }" placeholder="Nombre o referencia de firma" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ng-container>
                    </div>

                    <div class="modal-footer d-flex justify-content-between gap-2 flex-wrap">
                        <button type="button" class="btn btn-link" data-testid="equipment-modal-cancel" (click)="close()">Cancelar</button>
                        <div class="d-flex gap-2 flex-wrap">
                            <button type="button" class="btn btn-outline-secondary" *ngIf="!isFirstStep" data-testid="equipment-modal-previous" (click)="previousStep()">Atrás</button>
                            <button type="button" class="btn btn-theme" *ngIf="!isLastStep" data-testid="equipment-modal-next" (click)="nextStep()">
                                Siguiente <i class="bi bi-arrow-right ms-1"></i>
                            </button>
                            <button
                                type="button"
                                class="btn btn-outline-theme"
                                *ngIf="isLastStep && initialRecord?.id"
                                (click)="openReceptionPrint(initialRecord?.id || '')"
                                [disabled]="creatingRepairProjects">
                                <i class="bi bi-printer me-1"></i> Descargar formato
                            </button>
                            <button type="button" class="btn btn-outline-secondary" *ngIf="isLastStep" (click)="save(true)" [disabled]="creatingRepairProjects">
                                <i class="bi bi-printer me-1"></i> Guardar + formato
                            </button>
                            <button type="button" class="btn btn-theme" *ngIf="isLastStep" data-testid="equipment-modal-save" (click)="save(false)" [disabled]="creatingRepairProjects">
                                <i class="bi bi-check2 me-1"></i> {{ creatingRepairProjects ? "Creando proyectos..." : "Guardar asociación" }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="modal-backdrop fade show"></div>

        <div class="scanner-backdrop" *ngIf="showScannerModal" (click)="closeScanner()">
            <div class="scanner-dialog" (click)="$event.stopPropagation()">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                    <div>
                        <h5 class="mb-1">Escanear identificador</h5>
                        <p class="small text-secondary mb-0">Apunta la cámara al QR o código de barras del equipo para completar la recepción.</p>
                    </div>
                    <button type="button" class="btn-close" aria-label="Cerrar" data-testid="equipment-modal-scanner-close" (click)="closeScanner()"></button>
                </div>

                <div class="scanner-video-frame mb-3">
                    <video #scannerVideo autoplay playsinline muted></video>
                </div>

                <p class="small text-secondary mb-2">{{ scannerStatus }}</p>
                <div class="alert alert-danger border mb-0" *ngIf="scannerError">{{ scannerError }}</div>
            </div>
        </div>
    `,
    styles: [`
        .wizard-steps-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 0.75rem;
            width: 100%;
            align-items: stretch;
        }

        .wizard-step {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
            border: 1px solid rgba(15, 23, 42, 0.12);
            border-radius: 1rem;
            padding: 0.9rem 1rem;
            background: var(--bs-tertiary-bg);
            color: var(--bs-emphasis-color);
            min-height: 100%;
            width: 100%;
            min-width: 0;
        }

        .wizard-step-content {
            min-width: 0;
        }

        .wizard-step-title {
            color: var(--bs-emphasis-color);
            line-height: 1.2;
        }

        .wizard-step-description {
            color: var(--bs-secondary-color);
            line-height: 1.3;
        }

        .wizard-step.active {
            border-color: rgba(var(--bs-primary-rgb), 0.5);
            box-shadow: 0 0 0 1px rgba(var(--bs-primary-rgb), 0.12);
            background: linear-gradient(180deg, rgba(var(--bs-primary-rgb), 0.12) 0%, var(--bs-tertiary-bg) 100%);
        }

        .wizard-step.completed {
            border-color: rgba(25, 135, 84, 0.25);
            background: rgba(25, 135, 84, 0.06);
        }

        .wizard-step-number {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 2rem;
            height: 2rem;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.08);
            font-weight: 700;
            flex: 0 0 auto;
        }

        .wizard-step.active .wizard-step-number {
            background: rgba(var(--bs-primary-rgb), 0.18);
            color: rgb(var(--bs-primary-rgb));
        }

        .wizard-step.completed .wizard-step-number {
            background: rgba(25, 135, 84, 0.18);
            color: #198754;
        }

        :host-context([data-bs-theme=dark]) .wizard-step {
            border-color: rgba(148, 163, 184, 0.34);
            background: rgba(15, 23, 42, 0.9);
        }

        :host-context([data-bs-theme=dark]) .wizard-step.active {
            border-color: rgba(var(--bs-primary-rgb), 0.7);
            box-shadow: 0 0 0 1px rgba(var(--bs-primary-rgb), 0.22);
            background: linear-gradient(180deg, rgba(var(--bs-primary-rgb), 0.26) 0%, rgba(15, 23, 42, 0.94) 100%);
        }

        :host-context([data-bs-theme=dark]) .wizard-step.completed {
            border-color: rgba(25, 135, 84, 0.6);
            background: rgba(25, 135, 84, 0.2);
        }

        :host-context([data-bs-theme=dark]) .wizard-step-number {
            background: rgba(148, 163, 184, 0.28);
            color: rgba(248, 250, 252, 0.92);
        }

        :host-context([data-bs-theme=dark]) .wizard-step-description {
            color: rgba(226, 232, 240, 0.82);
        }

        .equipment-card,
        .question-card,
        .evidence-card {
            background: linear-gradient(180deg, var(--bs-tertiary-bg) 0%, var(--bs-body-bg) 100%);
        }

        .equipment-card-warning {
            border-color: rgba(255, 193, 7, 0.55) !important;
            box-shadow: inset 0 0 0 1px rgba(255, 193, 7, 0.2);
        }

        .equipment-warning-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.35rem;
        }

        .warning-chip {
            background: rgba(255, 193, 7, 0.18);
            color: #8a5b00;
            border: 1px solid rgba(255, 193, 7, 0.38);
        }

        .evidence-photo-card {
            background: var(--bs-tertiary-bg);
        }

        .evidence-side-panel.bg-white {
            background: var(--bs-tertiary-bg) !important;
        }

        .question-card .bg-light-subtle,
        .evidence-card .bg-light-subtle,
        .evidence-side-panel .bg-light-subtle,
        .evidence-card .text-bg-light {
            color: var(--bs-emphasis-color);
        }

        .evidence-side-panel {
            position: sticky;
            top: 0;
        }

        .switch-answer {
            display: inline-flex;
            align-items: center;
        }

        .switch-answer .form-check-input {
            float: none;
            margin-left: 0;
        }

        .priority-question {
            border: 1px solid rgba(15, 23, 42, 0.12);
            border-radius: 0.75rem;
            padding: 0.65rem 0.75rem;
            background: var(--bs-tertiary-bg);
        }

        .priority-question-active {
            border-color: rgba(220, 53, 69, 0.45);
            background: rgba(220, 53, 69, 0.08);
        }

        .priority-check-input:checked {
            background-color: #dc3545;
            border-color: #dc3545;
        }

        .evidence-thumb {
            width: 132px;
            height: 132px;
            object-fit: cover;
            flex: 0 0 auto;
            border: 1px solid rgba(15, 23, 42, 0.08);
        }

        .reception-qr-thumb {
            width: 82px;
            height: 82px;
            object-fit: contain;
            background: #fff;
        }

        .evidence-meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.35rem 1rem;
        }

        .min-w-0 {
            min-width: 0;
        }

        .evidence-empty {
            min-height: 220px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .borrowed-equipment-repeater .input-group-text {
            min-width: 2.25rem;
            justify-content: center;
        }

        .scanner-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1085;
            background: rgba(15, 23, 42, 0.72);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }

        .scanner-dialog {
            width: min(100%, 720px);
            border-radius: 1rem;
            background: var(--bs-body-bg);
            padding: 1rem;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
        }

        :host-context([data-bs-theme=dark]) .equipment-card,
        :host-context([data-bs-theme=dark]) .question-card,
        :host-context([data-bs-theme=dark]) .evidence-card,
        :host-context([data-bs-theme=dark]) .evidence-photo-card,
        :host-context([data-bs-theme=dark]) .evidence-side-panel.bg-white,
        :host-context([data-bs-theme=dark]) .priority-question {
            border-color: rgba(148, 163, 184, 0.32) !important;
        }

        :host-context([data-bs-theme=dark]) .equipment-card-warning {
            border-color: rgba(251, 191, 36, 0.55) !important;
            box-shadow: inset 0 0 0 1px rgba(251, 191, 36, 0.24);
        }

        :host-context([data-bs-theme=dark]) .warning-chip {
            background: rgba(251, 191, 36, 0.18);
            border-color: rgba(251, 191, 36, 0.38);
            color: rgba(254, 243, 199, 0.96);
        }

        :host-context([data-bs-theme=dark]) .equipment-card .text-secondary,
        :host-context([data-bs-theme=dark]) .question-card .text-secondary,
        :host-context([data-bs-theme=dark]) .evidence-card .text-secondary,
        :host-context([data-bs-theme=dark]) .evidence-side-panel .text-secondary {
            color: rgba(203, 213, 225, 0.84) !important;
        }

        :host-context([data-bs-theme=dark]) .question-card .bg-light-subtle,
        :host-context([data-bs-theme=dark]) .evidence-card .bg-light-subtle,
        :host-context([data-bs-theme=dark]) .evidence-side-panel .bg-light-subtle {
            background: rgba(71, 85, 105, 0.52) !important;
            color: rgba(241, 245, 249, 0.92) !important;
        }

        :host-context([data-bs-theme=dark]) .question-card .bg-light-subtle *,
        :host-context([data-bs-theme=dark]) .evidence-card .bg-light-subtle *,
        :host-context([data-bs-theme=dark]) .evidence-side-panel .bg-light-subtle * {
            color: inherit !important;
        }

        :host-context([data-bs-theme=dark]) .evidence-card .text-bg-light {
            background-color: rgba(148, 163, 184, 0.24) !important;
            color: rgba(248, 250, 252, 0.94) !important;
        }

        :host-context([data-bs-theme=dark]) .evidence-side-panel .text-dark {
            color: rgba(248, 250, 252, 0.94) !important;
        }

        :host-context([data-bs-theme=dark]) .equipment-card .form-control.bg-light {
            background: rgba(148, 163, 184, 0.16) !important;
            border-color: rgba(148, 163, 184, 0.38) !important;
            color: rgba(241, 245, 249, 0.92) !important;
        }

        :host-context([data-bs-theme=dark]) .priority-question-active {
            border-color: rgba(248, 113, 113, 0.7);
            background: rgba(127, 29, 29, 0.32);
        }

        :host-context([data-bs-theme=dark]) .borrowed-equipment-repeater .border {
            border-color: rgba(148, 163, 184, 0.38) !important;
        }

        .scanner-video-frame {
            border-radius: 1rem;
            overflow: hidden;
            background: #0f172a;
            aspect-ratio: 4 / 3;
        }

        .scanner-video-frame video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }

        @media (max-width: 1199.98px) {
            .wizard-steps-grid {
                grid-template-columns: repeat(3, minmax(0, 1fr));
            }
        }

        @media (max-width: 767.98px) {
            .wizard-steps-grid {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .evidence-thumb {
                width: 100%;
                height: 220px;
            }
        }

        @media (max-width: 575.98px) {
            .wizard-steps-grid {
                grid-template-columns: minmax(0, 1fr);
            }
        }

        @media (max-width: 1399.98px) {
            .evidence-side-panel {
                position: static;
            }
        }

        .company-combobox {
            position: relative;
        }

        .company-dropdown {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            z-index: 20;
            max-height: 260px;
            overflow-y: auto;
            background: var(--bs-body-bg);
            border: 1px solid var(--bs-border-color, #dee2e6);
            border-radius: var(--bs-border-radius, 0.375rem);
            padding: 0.25rem;
        }

        .company-dropdown-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            text-align: left;
            border: 0;
            background: transparent;
            color: var(--bs-body-color);
            padding: 0.5rem 0.65rem;
            border-radius: var(--bs-border-radius, 0.375rem);
            cursor: pointer;
            gap: 0.5rem;
        }

        .company-dropdown-item:hover,
        .company-dropdown-item:focus {
            background: rgba(var(--adminuiux-theme-1-rgb, 13, 110, 253), 0.1);
        }

        .company-dropdown-item.active {
            background: rgba(var(--adminuiux-theme-1-rgb, 13, 110, 253), 0.18);
            font-weight: 600;
        }

        .company-dropdown-empty {
            padding: 0.6rem 0.65rem;
            color: var(--bs-secondary-color, #6c757d);
            font-size: 0.875rem;
        }
    `],
})
export class CrmProspectEquipmentModalComponent implements OnChanges, OnDestroy {
    readonly wizardSteps: readonly WizardStepDefinition[] = [
        { key: "reception", title: "Recepción", description: "Datos del cliente y la orden" },
        { key: "equipment", title: "Equipos", description: "Modelos, servicio y logística" },
        { key: "questions", title: "Preguntas", description: "Diagnóstico por equipo" },
        { key: "evidence", title: "Evidencia", description: "Escaneo, fotos y EXIF" },
        { key: "signatures", title: "Cierre", description: "Resumen y firmas" },
    ];

    readonly evidenceTypeOptions: readonly EvidenceTypeOption[] = [
        { value: "general", label: "Vista general" },
        { value: "serial-plate", label: "Placa / serie" },
        { value: "visible-damage", label: "Daño visible" },
        { value: "accessories", label: "Accesorios" },
        { value: "face-front", label: "Cara frente" },
        { value: "face-back", label: "Cara atrás" },
        { value: "face-left", label: "Cara izquierda" },
        { value: "face-right", label: "Cara derecha" },
        { value: "face-top", label: "Cara superior" },
        { value: "face-bottom", label: "Cara inferior" },
        { value: "other", label: "Otra" },
    ];

    @Input({ required: true }) prospect: ProspectRecord | null = null;
    @Input() initialRecord: ProspectEquipmentRecord | null = null;
    @Input() navigateToProjectsOnSave = true;
    @Output() closed = new EventEmitter<void>();
    @Output() saved = new EventEmitter<void>();
    @ViewChild("scannerVideo") scannerVideo?: ElementRef<HTMLVideoElement>;

    @HostListener("document:click")
    onDocumentClick(): void {
        this.companyDropdownOpen = false;
    }

    draft: ProspectEquipmentRecord = this.buildDraft();
    generateRepairProjectsOnSave = true;
    creatingRepairProjects = false;
    currentStepIndex = 0;
    evidenceLoadingItemId: string | null = null;
    showScannerModal = false;
    scannerStatus = "";
    scannerError = "";
    scanningItemId: string | null = null;
    validationMessage = "";
    companySearchTerm = "";
    selectedCompanyOption = "";
    companyCatalogLoading = false;
    companyCatalogError = "";
    creatingCompanyQuick = false;
    companyDropdownOpen = false;
    companyOptions: CompanyCatalogOption[] = [];
    selectedCompanyBranchOption = "";
    companyBranchOptions: CompanyBranchOption[] = [];
    companyContactsLoading = false;
    companyContactsError = "";
    selectedCompanyContactOption = "";
    companyContactOptions: CompanyContactOption[] = [];
    readonly questionDefinitions: readonly ProspectEquipmentQuestionDefinition[] = PROSPECT_EQUIPMENT_QUESTION_DEFINITIONS;
    readonly priorityQuestionKey = "priorityPaidDiagnosis";
    readonly industrialCostQuestionKey = "costAboveTwoMillion";
    readonly maxVisibleItemWarnings = 4;
    readonly requiredFaceEvidenceTypes = REQUIRED_FACE_EVIDENCE_TYPES;
    /**
     * Fase 6: el catálogo viene del servidor, así que ya no puede resolverse una
     * sola vez en la inicialización de campos (quedaría vacío hasta que llegue la
     * respuesta). Son getters sobre la caché del store; la suscripción del
     * constructor repinta cuando el catálogo aterriza.
     */
    get equipmentModels(): IndustrialEquipmentModelRecord[] {
        return getIndustrialEquipmentModels();
    }
    get equipmentServiceTypes(): EquipmentServiceTypeRecord[] {
        return getEquipmentServiceTypes();
    }
    get equipmentLocations(): EquipmentLocationRecord[] {
        return getEquipmentLocations();
    }
    private readonly catalogUnsubscribe: () => void;
    technicianCatalogLoading = false;
    techniciansAll: EquipmentTechnicianOption[] = [];
    techniciansBySpeciality = new Map<string, EquipmentTechnicianOption[]>();
    private companyProspectsByKey = new Map<string, CrmProspectRecord[]>();
    private companyBranchesByKey = new Map<string, CompanyBranchOption[]>();
    private readonly companyContactsByCompanyKey = new Map<string, CompanyContactOption[]>();
    private readonly barcodeReader = new BrowserMultiFormatReader();
    private scannerControls: { stop: () => void } | null = null;
    private stopDraftWatch: () => void = () => undefined;
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private equipmentRecordsCache: ProspectEquipmentRecord[] = [];
    private readonly warrantyStateByItemId = new Map<string, ItemWarrantyState>();
    private readonly softwareBackupByItemId = new Map<string, SoftwareBackupInfo | null>();

    constructor(
        private readonly projectService: ProjectService,
        private readonly router: Router,
        private readonly crmClientsApi: CrmClientsApiService,
        private readonly crmProspectsApi: CrmProspectsApiService,
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly authService: AuthService,
        private readonly formDraftService: FormDraftService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        // Fase 5c: acuse de recepción por correo.
        private readonly emailsApi: EmailsApiService,
    ) {
        // Fase 6: el catálogo de equipos (familias, modelos industriales, tipos de
        // servicio y ubicaciones) viene del servidor. Sin esto los selectores del
        // modal quedarían vacíos hasta una recarga.
        void ensureEquipmentCatalogLoaded();
        this.catalogUnsubscribe = subscribeEquipmentCatalog(() => this.changeDetectorRef.detectChanges());
    }

    get currentWizardStep(): WizardStepDefinition {
        return this.wizardSteps[this.currentStepIndex];
    }

    get isFirstStep(): boolean {
        return this.currentStepIndex === 0;
    }

    get isLastStep(): boolean {
        return this.currentStepIndex === this.wizardSteps.length - 1;
    }

    get activeEquipmentModels(): IndustrialEquipmentModelRecord[] {
        return this.equipmentModels.filter((model) => model.active);
    }

    get activeEquipmentServiceTypes(): EquipmentServiceTypeRecord[] {
        return this.equipmentServiceTypes.filter((serviceType) => serviceType.active);
    }

    get activeEquipmentLocations(): EquipmentLocationRecord[] {
        return this.equipmentLocations.filter((location) => location.active);
    }

    get reviewItems(): ProspectEquipmentItem[] {
        const items = this.getMeaningfulItems();
        return items.length > 0 ? items : this.draft.items;
    }

    get cameraScannerSupported(): boolean {
        return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
    }

    get repairProjectsToCreateCount(): number {
        return this.reviewItems.filter((item) => this.isRepairServiceItem(item)).length;
    }

    get filteredCompanyOptions(): CompanyCatalogOption[] {
        const term = this.normalizeCompanyKey(this.companySearchTerm);
        if (!term) {
            return this.companyOptions;
        }

        return this.companyOptions.filter((option) =>
            [option.company, option.nit, option.contactName, option.contactRole, option.email, option.phone, option.cellphone, option.city, option.address, option.zone]
                .map((value) => this.normalizeCompanyKey(value))
                .some((value) => value.includes(term)),
        );
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["prospect"] || changes["initialRecord"]) {
            this.draft = this.buildDraft();
            this.generateRepairProjectsOnSave = true;
            this.creatingRepairProjects = false;
            this.currentStepIndex = 0;
            this.evidenceLoadingItemId = null;
            this.validationMessage = "";
            this.equipmentRecordsCache = [];
            this.warrantyStateByItemId.clear();
            this.softwareBackupByItemId.clear();
            this.closeScanner();
            this.restoreModalDraft();
            this.startModalDraftWatch();
            this.companyContactsLoading = false;
            this.companyContactsError = "";
            this.selectedCompanyContactOption = "";
            this.companyContactOptions = [];
            this.selectedCompanyBranchOption = "";
            this.companyBranchOptions = [];
            this.companyProspectsByKey.clear();
            this.companyContactsByCompanyKey.clear();
            this.companyBranchesByKey.clear();
            this.syncCompanySelectionWithDraft();
            this.loadCompanyCatalog();
            this.loadTechniciansCatalog();
        }
    }

    ngOnDestroy(): void {
        this.catalogUnsubscribe();
        this.stopDraftWatch();
        this.stopScannerSession();
    }

    addEquipmentItem(): void {
        this.draft.items = [...this.draft.items, this.buildItem()];
        this.validationMessage = "";
    }

    visibleItemWarnings(item: ProspectEquipmentItem): ProspectEquipmentWarning[] {
        return getProspectEquipmentWarnings(item).slice(0, this.maxVisibleItemWarnings);
    }

    hiddenItemWarningCount(item: ProspectEquipmentItem): number {
        return Math.max(0, getProspectEquipmentWarnings(item).length - this.maxVisibleItemWarnings);
    }

    itemWarningCount(item: ProspectEquipmentItem): number {
        return getProspectEquipmentWarnings(item).length;
    }

    trackByItemWarningCode(_: number, warning: ProspectEquipmentWarning): string {
        return warning.code;
    }

    applyRegistrationMode(item: ProspectEquipmentItem, registrationMode: ProspectEquipmentRegistrationMode): void {
        item.registrationMode = registrationMode === "manual" ? "manual" : "catalog";

        if (item.registrationMode === "manual") {
            item.equipmentModelId = "";
            item.familyId = "";
            item.isIndustrial = false;
            item.pendingHomologation = true;
            return;
        }

        item.pendingHomologation = false;

        if (item.equipmentModelId.trim()) {
            this.applyEquipmentModel(item, item.equipmentModelId);
            return;
        }

        item.familyId = "";
        item.familyName = "";
        item.marca = "";
        item.tipo = "";
        item.serie = "";
    }

    applyEquipmentModel(item: ProspectEquipmentItem, modelId: string): void {
        const model = this.equipmentModels.find((entry) => entry.id === modelId);

        if (!model) {
            item.equipmentModelId = "";
            item.familyId = "";
            item.isIndustrial = false;

            if (item.registrationMode !== "manual") {
                item.familyName = "";
                item.marca = "";
                item.tipo = "";
                item.serie = "";
            }

            return;
        }

        item.registrationMode = "catalog";
        item.pendingHomologation = false;
        item.equipmentModelId = model.id;
        item.isIndustrial = model.isIndustrial !== false;
        item.familyId = model.familyId;
        item.familyName = getEquipmentFamilyName(model.familyId);
        item.marca = model.brand;
        item.tipo = model.type;
        item.serie = model.series;
        void this.refreshSoftwareBackup(item);
    }

    applyServiceType(item: ProspectEquipmentItem, serviceTypeId: string): void {
        const serviceType = this.equipmentServiceTypes.find((entry) => entry.id === serviceTypeId);

        if (!serviceType) {
            item.serviceTypeId = "";
            item.serviceTypeName = "";
            return;
        }

        item.serviceTypeId = serviceType.id;
        item.serviceTypeName = serviceType.name;
        this.refreshTechniciansForItem(item);
    }

    applyStorageLocation(item: ProspectEquipmentItem, locationId: string): void {
        const location = this.equipmentLocations.find((entry) => entry.id === locationId);

        if (!location) {
            item.storageLocationId = "";
            item.storageLocationName = "";
            return;
        }

        item.storageLocationId = location.id;
        item.storageLocationName = location.name;
    }

    removeEquipmentItem(index: number): void {
        if (this.draft.items.length === 1) {
            return;
        }

        this.draft.items = this.draft.items.filter((_, currentIndex) => currentIndex !== index);
        this.validationMessage = "";
    }

    addBorrowedEquipment(item: ProspectEquipmentItem): void {
        item.borrowedEquipments = [...item.borrowedEquipments, ""];
    }

    removeBorrowedEquipment(item: ProspectEquipmentItem, index: number): void {
        item.borrowedEquipments = item.borrowedEquipments.filter((_, currentIndex) => currentIndex !== index);
    }

    warrantyStateFor(item: ProspectEquipmentItem): ItemWarrantyState {
        let state = this.warrantyStateByItemId.get(item.id);
        if (!state) {
            state = { isWarranty: false, oldCode: "", firstReceptionDate: "", warrantyMonths: null, previousReception: null };
            this.warrantyStateByItemId.set(item.id, state);
        }
        return state;
    }

    onWarrantyToggle(item: ProspectEquipmentItem): void {
        const state = this.warrantyStateFor(item);
        if (!state.isWarranty) {
            return;
        }
        const previous = findPreviousReception(
            { serie: item.serie, receivedIdentifier: item.receivedIdentifier, id: item.id, recordId: this.draft.id },
            this.equipmentRecordsCache,
        ) as PreviousReceptionInfo | null;
        state.previousReception = previous;
        if (previous) {
            if (!state.oldCode) {
                state.oldCode = previous.code;
            }
            if (!state.firstReceptionDate && previous.receptionDate) {
                state.firstReceptionDate = previous.receptionDate.slice(0, 10);
            }
        }
    }

    warrantyMonthsRemainingFor(item: ProspectEquipmentItem): number | null {
        const state = this.warrantyStateFor(item);
        if (!state.isWarranty) {
            return null;
        }
        return warrantyMonthsRemaining(state.firstReceptionDate, state.warrantyMonths, new Date());
    }

    showWarrantyValidationAlert(item: ProspectEquipmentItem): boolean {
        const state = this.warrantyStateFor(item);
        if (!state.isWarranty) {
            return false;
        }
        const months = Number(state.warrantyMonths);
        if (!state.firstReceptionDate || !Number.isFinite(months) || months <= 0) {
            return false;
        }
        return !isUnderLegalWarranty(state.firstReceptionDate, state.warrantyMonths, new Date());
    }

    softwareBackupFor(item: ProspectEquipmentItem): SoftwareBackupInfo | null {
        return this.softwareBackupByItemId.get(item.id) ?? null;
    }

    softwareBackupModelFor(item: ProspectEquipmentItem): string {
        return [item.marca, item.tipo].map((value) => (value || "").trim()).filter((value) => value.length > 0).join(" ");
    }

    onItemModelChange(item: ProspectEquipmentItem): void {
        void this.refreshSoftwareBackup(item);
    }

    async refreshSoftwareBackup(item: ProspectEquipmentItem): Promise<void> {
        const model = this.softwareBackupModelFor(item);
        if (!model) {
            this.softwareBackupByItemId.set(item.id, null);
            item.softwareBackupAvailable = false;
            return;
        }
        try {
            const token = JSON.parse(localStorage.getItem("pika.auth.session") || "{}").accessToken;
            const res = await fetch(this.apiBaseUrl + "/api/v1/documentation/backups/model/" + encodeURIComponent(model), {
                headers: { "Content-Type": "application/json", "X-Company-Id": "demo-company", Authorization: "Bearer " + token },
            });
            if (!res.ok) {
                this.softwareBackupByItemId.set(item.id, null);
                item.softwareBackupAvailable = false;
                return;
            }
            const data = await res.json();
            const backup = backupAvailableForModel([data], model) as SoftwareBackupInfo | null;
            this.softwareBackupByItemId.set(item.id, backup);
            item.softwareBackupAvailable = !!backup;
        } catch {
            this.softwareBackupByItemId.set(item.id, null);
            item.softwareBackupAvailable = false;
        }
        this.changeDetectorRef.detectChanges();
    }

    async handleEvidenceFilesSelected(item: ProspectEquipmentItem, event: Event): Promise<void> {
        const input = event.target as HTMLInputElement | null;
        const files = Array.from(input?.files ?? []);
        if (files.length === 0) {
            return;
        }

        this.evidenceLoadingItemId = item.id;
        this.validationMessage = "";

        try {
            const evidencePhotos = await buildEvidencePhotosFromFiles(files);
            item.evidencePhotos = [...item.evidencePhotos, ...evidencePhotos];

            // TODO backend (Go/Echo): before reading the originals in production, request an upload intent per item
            // and stream each file to the API. The current frontend-only version only keeps thumbnail + metadata.
        } catch {
            this.validationMessage = "No fue posible procesar una o más fotos de evidencia. Verifica que sean imágenes válidas.";
        } finally {
            this.evidenceLoadingItemId = null;
            if (input) {
                input.value = "";
            }
        }
    }

    removeEvidencePhoto(item: ProspectEquipmentItem, evidenceId: string): void {
        item.evidencePhotos = item.evidencePhotos.filter((photo) => photo.id !== evidenceId);
    }

    onDispatchPhotosSelected(event: Event, item: ProspectEquipmentItem): void {
        const files = (event.target as HTMLInputElement).files;
        if (!files || !files.length) return;
        if (!item.dispatchPhotos) item.dispatchPhotos = [];
        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                const dataUrl = reader.result as string;
                item.dispatchPhotos!.push({
                    id: 'dispatch-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                    attachmentType: 'dispatch-photo',
                    fileName: file.name,
                    mimeType: file.type,
                    sizeBytes: file.size,
                    dataUrl,
                    thumbnailDataUrl: dataUrl,
                    notes: '',
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: '',
                    sha256: '',
                });
            };
            reader.readAsDataURL(file);
        });
    }

    markIdentifierAsManual(item: ProspectEquipmentItem, value: string): void {
        item.receivedIdentifier = value;

        if (!value.trim()) {
            item.receivedIdentifierType = "";
            item.receivedIdentifierCapturedAt = "";
            item.receivedIdentifierSource = "manual";
            return;
        }

        item.receivedIdentifierType = item.receivedIdentifierType || "manual";
        item.receivedIdentifierSource = "manual";
        item.receivedIdentifierCapturedAt = new Date().toISOString();
    }

    clearIdentifier(item: ProspectEquipmentItem): void {
        item.receivedIdentifier = "";
        item.receivedIdentifierType = "";
        item.receivedIdentifierSource = "manual";
        item.receivedIdentifierCapturedAt = "";
    }

    openScanner(item: ProspectEquipmentItem): void {
        if (!this.cameraScannerSupported) {
            this.validationMessage = "El navegador actual no permite escaneo con cámara. Usa el campo manual para el identificador.";
            return;
        }

        this.showScannerModal = true;
        this.scanningItemId = item.id;
        this.scannerError = "";
        this.scannerStatus = "Solicita permisos de cámara y apunta al QR o código de barras del equipo.";

        setTimeout(() => {
            if (this.scannerVideo?.nativeElement) {
                void this.startScanner(this.scannerVideo.nativeElement);
            }
        }, 0);
    }

    closeScanner(): void {
        this.showScannerModal = false;
        this.scannerStatus = "";
        this.scannerError = "";
        this.scanningItemId = null;
        this.stopScannerSession();
    }

    previousStep(): void {
        if (this.isFirstStep) {
            return;
        }

        this.currentStepIndex -= 1;
        this.validationMessage = "";
    }

    nextStep(): void {
        if (this.isLastStep) {
            return;
        }

        if (!this.validateCurrentStep()) {
            return;
        }

        this.currentStepIndex += 1;
        this.validationMessage = "";

        if (this.currentWizardStep.key === "signatures") {
            void this.ensureQrAttachmentsForItems(this.reviewItems, this.draft.id).catch(() => {
                this.validationMessage = "No fue posible generar la etiqueta QR de uno o más equipos.";
            });
        }
    }

    close(): void {
        if (this.creatingRepairProjects) {
            return;
        }

        this.closeScanner();
        this.closed.emit();
    }

    save(openPrintAfterSave = false): void {
        if (this.creatingRepairProjects) {
            return;
        }

        // La recepcion ya quedo guardada y el fallo de los proyectos ya se
        // mostro en validationMessage: el boton solo cierra el modal de forma
        // segura (emite saved y limpia el borrador) sin volver a guardar, para
        // no duplicar la recepcion ni los proyectos que si se crearon.
        if (this.receptionSavedWithProjectErrors) {
            this.receptionSavedWithProjectErrors = false;
            this.finalizeSave(this.pendingCreatedProjectIds, this.pendingRecordId, false);
            return;
        }

        void this.saveRecord(openPrintAfterSave);
    }

    private async saveRecord(openPrintAfterSave: boolean): Promise<void> {
        const resolvedProspectId = this.prospect ? resolveEquipmentProspectId(this.prospect) : this.draft.prospectId;
        const resolvedProspectName = this.prospect?.nombre?.trim() || this.draft.prospectName.trim();

        if (!resolvedProspectName) {
            this.validationMessage = "No encontramos el prospecto para asociar los equipos.";
            return;
        }

        const itemsToPersist = this.getMeaningfulItems();
        if (!this.validateEquipmentItems(itemsToPersist)) {
            return;
        }

        if (!this.validateIndustrialOverrides(itemsToPersist) || !this.validateEvidenceFaces(itemsToPersist)) {
            return;
        }

        try {
            await this.ensureQrAttachmentsForItems(itemsToPersist, this.draft.id);
        } catch {
            this.validationMessage = "No fue posible generar la etiqueta QR para uno o más equipos.";
            return;
        }

        const fallbackAssignedTo = this.resolveRecordAssignedTo(itemsToPersist);

        const record: ProspectEquipmentRecord = {
            ...this.draft,
            prospectId: resolvedProspectId,
            prospectName: resolvedProspectName,
            intakeMethod: this.draft.intakeMethod === "transportadora" ? "transportadora" : "personal",
            intakeCarrier: (this.draft.intakeCarrier || "").trim(),
            intakeTrackingNumber: (this.draft.intakeTrackingNumber || "").trim(),
            intakeReceivedAt: this.draft.intakeReceivedAt || "",
            companyName: this.draft.companyName.trim(),
            sourceBranchName: (this.draft.sourceBranchName || "").trim(),
            nit: this.draft.nit.trim(),
            phone: this.draft.phone.trim(),
            address: this.draft.address.trim(),
            city: this.draft.city.trim(),
            contactName: this.draft.contactName.trim(),
            contactRole: this.draft.contactRole.trim(),
            cellphone: this.draft.cellphone.trim(),
            email: this.draft.email.trim(),
            clientSignature: this.draft.clientSignature.trim(),
            pikaSignature: this.draft.pikaSignature.trim(),
            assignedTo: (this.draft.assignedTo || "").trim() || fallbackAssignedTo,
            updatedAt: new Date().toISOString(),
            archived: this.draft.archived,
            archivedAt: this.draft.archivedAt,
            sourceContext: this.draft.sourceContext,
            items: itemsToPersist.map((item) => ({
                ...item,
                registrationMode: item.registrationMode === "manual" ? "manual" : "catalog",
                equipmentModelId: item.equipmentModelId,
                isIndustrial: this.resolveItemIndustrialFlag(item),
                serviceTypeId: item.serviceTypeId,
                serviceTypeName: item.serviceTypeName.trim(),
                storageLocationId: item.storageLocationId,
                storageLocationName: item.storageLocationName.trim(),
                familyId: item.familyId,
                familyName: item.familyName.trim(),
                marca: item.marca.trim(),
                tipo: item.tipo.trim(),
                serie: item.serie.trim(),
                receivedIdentifier: item.receivedIdentifier.trim(),
                receivedIdentifierType: item.receivedIdentifierType.trim(),
                receivedIdentifierSource: item.receivedIdentifierSource,
                receivedIdentifierCapturedAt: item.receivedIdentifierCapturedAt,
                customerShipmentReference: item.customerShipmentReference.trim(),
                accessories: item.accessories.trim(),
                borrowedEquipments: item.borrowedEquipments.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
                failureDescription: item.failureDescription.trim(),
                assignedTo: (item.assignedTo || "").trim(),
                assignedToId: (item.assignedToId || "").trim(),
                assignedAt: (item.assignedAt || "").trim(),
                assignedBy: (item.assignedBy || "").trim(),
                industrialOverrideAuthorizedBy: (item.industrialOverrideAuthorizedBy || "").trim(),
                industrialOverrideReason: (item.industrialOverrideReason || "").trim(),
                industrialOverrideAuthorizedAt: (item.industrialOverrideAuthorizedBy || "").trim()
                    ? (item.industrialOverrideAuthorizedAt || new Date().toISOString())
                    : "",
                pendingHomologation: Boolean(item.pendingHomologation),
                estimatedData: Boolean(item.estimatedData),
                identifierLabelIssue: Boolean(item.identifierLabelIssue),
                evidencePhotos: item.evidencePhotos.map((photo) => ({
                    ...photo,
                    notes: photo.notes.trim(),
                })),
                attachments: (item.attachments ?? []).map((attachment) => ({
                    ...attachment,
                    attachmentType: String(attachment.attachmentType ?? "").trim(),
                    fileName: String(attachment.fileName ?? "").trim(),
                    mimeType: String(attachment.mimeType ?? "").trim(),
                    notes: String(attachment.notes ?? "").trim(),
                    uploadedAt: String(attachment.uploadedAt ?? "").trim(),
                    uploadedBy: String(attachment.uploadedBy ?? "").trim(),
                    sha256: String(attachment.sha256 ?? "").trim(),
                })),
                answers: { ...item.answers },
            })),
        };

        this.crmEquipmentApi.upsertRecord(record).subscribe({
            next: (savedRecord) => {
                this.crmEquipmentApi.finalizeRecord(savedRecord.id).subscribe({
                    next: () => {
                        this.finalizeAfterBackendSave(savedRecord, openPrintAfterSave);
                        // Fase 5c: acuse de recepción por correo, con los
                        // identificadores de los equipos. Es un paso aparte del
                        // finalize porque la recepción ya es un hecho válido
                        // aunque el cliente no tenga correo — pero la ausencia de
                        // correo se muestra, no se esconde.
                        this.sendReceptionAckEmail(savedRecord.id);
                    },
                    error: (error: Error) => {
                        this.validationMessage = error?.message || "No se pudo finalizar la recepción de equipos.";
                    },
                });
            },
            error: () => {
                this.validationMessage = "No se pudo guardar el registro en la base de datos. Intenta nuevamente.";
            },
        });
    }

    /**
     * Dispara el acuse de recepción y refleja el estado REAL del correo.
     *
     * No sobrescribe `validationMessage` si la recepción salió bien y sólo falló
     * el correo: se anexa, porque ambos hechos importan. Y nunca reporta el
     * acuse como enviado cuando el servidor no tiene SMTP configurado.
     */
    private sendReceptionAckEmail(recordId: string): void {
        this.emailsApi.sendReceptionAck(recordId).pipe(take(1)).subscribe({
            next: (result) => {
                if (result.delivered) {
                    this.appendReceptionNotice(`Acuse de recepción enviado a ${result.toEmail}.`);
                } else if (result.emailStatus === "desactivado") {
                    this.appendReceptionNotice(
                        `El acuse de recepción NO se envió al cliente: ${result.warning ?? "el servidor no tiene SMTP configurado"}. ` +
                        `Quedó registrado en el outbox de correos.`,
                    );
                } else {
                    this.appendReceptionNotice(
                        `Acuse de recepción en cola para ${result.toEmail}; saldrá en el próximo envío del servidor.`,
                    );
                }
            },
            error: (error: Error) => {
                // 422 = el cliente no tiene correo registrado. La recepción sí
                // quedó guardada, pero el cliente no recibió comprobante y el
                // usuario debe saberlo (ese acuse es la prueba en caso de
                // disputa por un equipo o accesorio faltante).
                this.appendReceptionNotice(
                    `La recepción quedó guardada, pero el acuse NO se envió: ${error?.message || "el cliente no tiene correo registrado"}.`,
                );
            },
        });
    }

    private appendReceptionNotice(notice: string): void {
        const current = String(this.validationMessage ?? "").trim();
        this.validationMessage = current ? `${current} ${notice}` : notice;
        this.changeDetectorRef.detectChanges();
    }

    trackByCompanyOption(_: number, option: CompanyCatalogOption): string {
        return String(option.company ?? "").trim().toLowerCase();
    }

    trackByCompanyBranchOption(_: number, option: CompanyBranchOption): string {
        return option.value;
    }

    trackByCompanyContactOption(_: number, option: CompanyContactOption): string {
        return option.value;
    }

    onCompanySearchInput(value: string): void {
        this.companySearchTerm = value ?? "";
        this.companyDropdownOpen = true;
    }

    onCompanyBranchSelectionChange(value: string): void {
        const selectedValue = String(value ?? "").trim();
        this.selectedCompanyBranchOption = selectedValue;

        if (!selectedValue) {
            this.draft.sourceBranchName = "";
            return;
        }

        const selected = this.companyBranchOptions.find((option) => option.value === selectedValue);
        if (!selected) {
            return;
        }

        this.draft.sourceBranchName = selected.name;

        if (selected.city) {
            this.draft.city = selected.city;
        }

        if (selected.address) {
            this.draft.address = selected.address;
        }

        if (!this.draft.contactName.trim() && selected.contactName) {
            this.draft.contactName = selected.contactName;
        }

        if (!this.draft.contactRole.trim() && selected.contactRole) {
            this.draft.contactRole = selected.contactRole;
        }

        if (!this.draft.email.trim() && selected.email) {
            this.draft.email = selected.email;
        }

        if (selected.phone) {
            if (!this.draft.cellphone.trim()) {
                this.draft.cellphone = selected.phone;
            }
            if (!this.draft.phone.trim()) {
                this.draft.phone = selected.phone;
            }
        }

        this.syncSelectedCompanyContactOption();
    }

    onCompanyContactSelectionChange(value: string): void {
        const selectedValue = String(value ?? "").trim();
        this.selectedCompanyContactOption = selectedValue;

        if (!selectedValue) {
            return;
        }

        const selected = this.companyContactOptions.find((option) => option.value === selectedValue);
        if (!selected) {
            return;
        }

        this.draft.contactName = selected.name;

        if (selected.role) {
            this.draft.contactRole = selected.role;
        }

        if (selected.email) {
            this.draft.email = selected.email;
        }

        if (selected.phone) {
            this.draft.cellphone = selected.phone;
            if (!this.draft.phone.trim()) {
                this.draft.phone = selected.phone;
            }
        }
    }

    openCompanyDropdown(): void {
        this.companyDropdownOpen = true;
    }

    isCompanyOptionSelected(option: CompanyCatalogOption): boolean {
        return this.normalizeCompanyKey(option.company) === this.normalizeCompanyKey(this.draft.companyName);
    }

    selectCompanyOption(company: string): void {
        const normalized = String(company ?? "").trim();
        const previousCompanyKey = this.normalizeCompanyKey(this.draft.companyName);
        this.companyDropdownOpen = false;

        if (!normalized) {
            this.draft.companyName = "";
            this.selectedCompanyOption = "";
            this.companySearchTerm = "";
            this.draft.sourceBranchName = "";
            this.selectedCompanyBranchOption = "";
            this.companyBranchOptions = [];
            this.companyContactsLoading = false;
            this.companyContactsError = "";
            this.selectedCompanyContactOption = "";
            this.companyContactOptions = [];
            return;
        }

        this.draft.companyName = normalized;
        this.selectedCompanyOption = normalized;
        this.companySearchTerm = "";
        const companyChanged = previousCompanyKey !== this.normalizeCompanyKey(normalized);

        if (companyChanged) {
            this.draft.sourceBranchName = "";
            this.selectedCompanyBranchOption = "";
        }

        const selected = this.companyOptions.find((option) => this.normalizeCompanyKey(option.company) === this.normalizeCompanyKey(normalized));
        if (selected) {
            const resolveAutocompleteValue = (currentValue: string, incomingValue: string): string => {
                const normalizedIncomingValue = this.normalizeEmpty(String(incomingValue ?? "")).trim();
                if (normalizedIncomingValue) {
                    return normalizedIncomingValue;
                }

                return companyChanged ? "" : currentValue;
            };

            this.draft.nit = resolveAutocompleteValue(this.draft.nit, selected.nit);
            this.draft.phone = resolveAutocompleteValue(this.draft.phone, selected.phone);
            this.draft.address = resolveAutocompleteValue(this.draft.address, selected.address);
            this.draft.city = resolveAutocompleteValue(this.draft.city, selected.city);
            this.draft.contactName = resolveAutocompleteValue(this.draft.contactName, selected.contactName);
            this.draft.contactRole = resolveAutocompleteValue(this.draft.contactRole, selected.contactRole);
            this.draft.cellphone = resolveAutocompleteValue(this.draft.cellphone, selected.cellphone);
            this.draft.email = resolveAutocompleteValue(this.draft.email, selected.email);
        }

        this.loadCompanyBranchesForSelectedCompany();
        this.loadCompanyContactsForSelectedCompany();
    }

    createCompanyQuick(): void {
        const candidate = this.companySearchTerm.trim() || this.draft.companyName.trim();
        if (!candidate) {
            this.validationMessage = "Escribe el nombre de la empresa antes de crearla.";
            return;
        }

        const existing = this.companyOptions.find((option) => this.normalizeCompanyKey(option.company) === this.normalizeCompanyKey(candidate));
        if (existing) {
            this.selectCompanyOption(existing.company);
            return;
        }

        if (!this.draft.contactName.trim()) {
            this.validationMessage = "Para crear la empresa, primero completa el campo Contacto.";
            return;
        }

        const zone = (this.prospect?.zona || "General").trim() || "General";
        const payload = {
            nombre: this.draft.contactName.trim(),
            correo: this.draft.email.trim(),
            empresa: candidate,
            nit: this.draft.nit.trim(),
            zona: zone,
            estado: "Activo" as const,
            website: "",
            officePhone: "",
            country: "",
            city: this.draft.city?.trim() ?? "",
            address: this.draft.address?.trim() ?? "",
            credito: {
                enabled: false,
                creditLimit: 0,
                consumed: 0,
                lastPaymentDate: "",
                paymentTermDays: 0,
            },
        };

        this.creatingCompanyQuick = true;
        this.validationMessage = "";

        this.crmClientsApi.createClient(payload).subscribe({
            next: (client) => {
                this.creatingCompanyQuick = false;
                this.upsertCompanyOptionFromClient(client);
                this.selectCompanyOption(client.empresa);
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                this.creatingCompanyQuick = false;
                this.validationMessage = "No fue posible crear la empresa en clientes.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    /** Fase 4: recepcion guardada pero con proyectos de reparacion fallidos. */
    private receptionSavedWithProjectErrors = false;
    private pendingCreatedProjectIds: string[] = [];
    private pendingRecordId = "";

    private finalizeAfterBackendSave(record: ProspectEquipmentRecord, openPrintAfterSave = false): void {
        if (!this.generateRepairProjectsOnSave) {
            this.finalizeSave([], record.id, openPrintAfterSave);
            return;
        }

        const repairItems = record.items.filter((item) => this.isRepairServiceItem(item));
        if (repairItems.length === 0) {
            this.finalizeSave([], record.id, openPrintAfterSave);
            return;
        }

        this.creatingRepairProjects = true;

        const failedProjects: string[] = [];
        const createRequests = repairItems.map((item, index) =>
            this.projectService
                .createProject(
                    "recibido",
                    this.buildRepairProjectTitle(item, index),
                    this.buildRepairProjectDescription(record, item),
                    {
                        icon: "bi-tools",
                        initialProperties: this.buildRepairProjectProperties(record, item),
                    },
                )
                .pipe(
                    catchError((error) => {
                        // Sin tragar el fallo: antes catchError(() => of(null))
                        // dejaba la recepcion "bien" aunque el proyecto nunca
                        // llegara al tablero. Ahora se registra y se muestra.
                        failedProjects.push(
                            `${this.buildRepairProjectTitle(item, index)}: ${error?.message ?? error}`,
                        );
                        return of(null);
                    }),
                ),
        );

        forkJoin(createRequests).subscribe({
            next: (projects) => {
                this.creatingRepairProjects = false;
                const createdProjectIds = projects
                    .filter((project): project is Project => project !== null)
                    .map((project) => project.id);

                if (failedProjects.length > 0) {
                    this.receptionSavedWithProjectErrors = true;
                    this.pendingCreatedProjectIds = createdProjectIds;
                    this.pendingRecordId = record.id;
                    this.validationMessage =
                        `La recepción quedó guardada, pero ${failedProjects.length} proyecto(s) de reparación NO se pudieron crear y no llegarán al tablero: ${failedProjects.join(" | ")}. ` +
                        `Pulsa "Guardar asociación" para cerrar de forma segura (no volverá a guardar).`;
                    return;
                }

                this.finalizeSave(createdProjectIds, record.id, openPrintAfterSave);
            },
            error: () => {
                this.creatingRepairProjects = false;
                this.finalizeSave([], record.id, openPrintAfterSave);
            },
        });
    }

    trackByItemId(_: number, item: ProspectEquipmentItem): string {
        return item.id;
    }

    trackByBorrowedEquipmentIndex(index: number): number {
        return index;
    }

    trackByStepKey(_: number, step: WizardStepDefinition): WizardStepKey {
        return step.key;
    }

    trackByQuestionKey(_: number, question: ProspectEquipmentQuestionDefinition): string {
        return question.key;
    }

    trackByEvidenceId(_: number, evidence: ProspectEquipmentEvidencePhoto): string {
        return evidence.id;
    }

    trackByEvidenceType(_: number, option: EvidenceTypeOption): ProspectEquipmentEvidenceType {
        return option.value;
    }

    trackByModelId(_: number, model: IndustrialEquipmentModelRecord): string {
        return model.id;
    }

    trackByServiceTypeId(_: number, serviceType: EquipmentServiceTypeRecord): string {
        return serviceType.id;
    }

    trackByLocationId(_: number, location: EquipmentLocationRecord): string {
        return location.id;
    }

    equipmentModelLabel(model: IndustrialEquipmentModelRecord): string {
        return `${getEquipmentFamilyName(model.familyId)} · ${model.brand} · ${model.type} · ${model.series}`;
    }

    equipmentCardTitle(item: ProspectEquipmentItem, index: number): string {
        const parts = [item.familyName, item.marca, item.tipo, item.serie].filter((value) => value.trim().length > 0);
        return parts.length > 0 ? `Equipo ${index + 1} · ${parts.join(" · ")}` : `Equipo ${index + 1}`;
    }

    isBooleanAnswerYes(item: ProspectEquipmentItem, questionKey: string): boolean {
        return item.answers[questionKey] === "Sí";
    }

    isPriorityPaid(item: ProspectEquipmentItem): boolean {
        return this.isBooleanAnswerYes(item, this.priorityQuestionKey);
    }

    toggleBooleanAnswer(item: ProspectEquipmentItem, questionKey: string, checked: boolean): void {
        item.answers[questionKey] = checked ? "Sí" : "No";
    }

    isBooleanAnswerNo(item: ProspectEquipmentItem, questionKey: string): boolean {
        return item.answers[questionKey] === "No";
    }

    resolveItemIndustrialFlag(item: ProspectEquipmentItem): boolean {
        if (typeof item.isIndustrial === "boolean") {
            return item.isIndustrial;
        }

        const model = this.equipmentModels.find((entry) => entry.id === item.equipmentModelId);
        return model?.isIndustrial ?? false;
    }

    resolveItemIndustrialLabel(item: ProspectEquipmentItem): string {
        return this.resolveItemIndustrialFlag(item) ? "Industrial" : "No industrial";
    }

    requiresIndustrialOverride(item: ProspectEquipmentItem): boolean {
        return !this.resolveItemIndustrialFlag(item) || this.isBooleanAnswerNo(item, this.industrialCostQuestionKey);
    }

    hasIndustrialOverrideAuthorization(item: ProspectEquipmentItem): boolean {
        return Boolean((item.industrialOverrideAuthorizedBy || "").trim() && (item.industrialOverrideReason || "").trim());
    }

    onIndustrialOverrideAuthorizedByChange(item: ProspectEquipmentItem, value: string): void {
        item.industrialOverrideAuthorizedBy = String(value ?? "");

        if ((item.industrialOverrideAuthorizedBy || "").trim()) {
            item.industrialOverrideAuthorizedAt = item.industrialOverrideAuthorizedAt || new Date().toISOString();
            return;
        }

        item.industrialOverrideAuthorizedAt = "";
    }

    onIntakeMethodChange(value: string): void {
        this.draft.intakeMethod = String(value ?? "").trim().toLowerCase() === "transportadora" ? "transportadora" : "personal";

        if (this.draft.intakeMethod !== "transportadora") {
            this.draft.intakeCarrier = "";
            this.draft.intakeTrackingNumber = "";
        }
    }

    toDateTimeLocalInput(value: string): string {
        if (!value) {
            return "";
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        const hours = `${date.getHours()}`.padStart(2, "0");
        const minutes = `${date.getMinutes()}`.padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    onIntakeReceivedAtChange(value: string): void {
        const normalized = String(value ?? "").trim();
        if (!normalized) {
            this.draft.intakeReceivedAt = "";
            return;
        }

        const date = new Date(normalized);
        this.draft.intakeReceivedAt = Number.isNaN(date.getTime()) ? "" : date.toISOString();
    }

    identifierSummary(item: ProspectEquipmentItem): string {
        const source = item.receivedIdentifierSource === "camera-scan" ? "escáner" : "manual";
        const capturedAt = item.receivedIdentifierCapturedAt ? this.formatEvidenceDate(item.receivedIdentifierCapturedAt) : "sin fecha";
        return `Origen ${source} · tipo ${item.receivedIdentifierType || "manual"} · capturado ${capturedAt}`;
    }

    borrowedEquipmentsSummary(item: ProspectEquipmentItem): string {
        const borrowedEquipments = item.borrowedEquipments.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        return borrowedEquipments.length > 0 ? borrowedEquipments.join(", ") : "Sin equipos prestados";
    }

    resolveItemAssignmentSpeciality(item: ProspectEquipmentItem): string {
        return (item.serviceTypeName || item.familyName || item.tipo || "general").trim() || "general";
    }

    technicianOptionsForItem(item: ProspectEquipmentItem): EquipmentTechnicianOption[] {
        const speciality = this.resolveItemAssignmentSpeciality(item).toLowerCase();
        const specific = this.techniciansBySpeciality.get(speciality) ?? [];
        if (specific.length > 0) {
            return specific;
        }

        return this.techniciansAll;
    }

    refreshTechniciansForItem(item: ProspectEquipmentItem): void {
        const speciality = this.resolveItemAssignmentSpeciality(item);
        const specialityKey = speciality.toLowerCase();
        this.crmEquipmentApi.listTechnicians({ speciality }).subscribe({
            next: (items) => {
                this.techniciansBySpeciality.set(specialityKey, items);
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                this.validationMessage = "No se pudo actualizar el listado de técnicos para la especialidad seleccionada.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    assignDraftTechnicianToItem(item: ProspectEquipmentItem, technicianID: string): void {
        const normalizedID = String(technicianID ?? "").trim();
        if (!normalizedID) {
            item.assignedToId = "";
            item.assignedTo = "";
            item.assignedAt = "";
            item.assignedBy = "";
            return;
        }

        const specialityKey = this.resolveItemAssignmentSpeciality(item).toLowerCase();
        const options = this.technicianOptionsForItem(item);
        const selected = options.find((entry) => entry.id === normalizedID) ?? this.techniciansBySpeciality.get(specialityKey)?.find((entry) => entry.id === normalizedID) ?? this.techniciansAll.find((entry) => entry.id === normalizedID);

        item.assignedToId = normalizedID;
        item.assignedTo = selected?.name || item.assignedTo || "";
        item.assignedAt = new Date().toISOString();
        item.assignedBy = this.authService.getCurrentUserName() || "jefe-tecnico";
    }

    getItemQrAttachment(item: ProspectEquipmentItem): ProspectEquipmentAttachment | null {
        const attachments = item.attachments ?? [];
        return attachments.find((attachment) => (attachment.attachmentType || "").trim().toLowerCase() === "qr-label") ?? null;
    }

    downloadItemQr(item: ProspectEquipmentItem, index: number): void {
        const qrAttachment = this.getItemQrAttachment(item);
        if (!qrAttachment?.dataUrl) {
            this.validationMessage = "Este equipo aún no tiene etiqueta QR lista para descargar.";
            return;
        }

        const anchor = document.createElement("a");
        anchor.href = qrAttachment.dataUrl;
        anchor.download = qrAttachment.fileName || `equipo-${index + 1}-qr.png`;
        anchor.rel = "noopener";
        anchor.click();
    }

    printItemQr(item: ProspectEquipmentItem): void {
        const qrAttachment = this.getItemQrAttachment(item);
        if (!qrAttachment?.dataUrl) {
            this.validationMessage = "Este equipo aún no tiene etiqueta QR lista para imprimir.";
            return;
        }

        const popup = window.open("", "_blank", "noopener,noreferrer,width=420,height=520");
        if (!popup) {
            this.validationMessage = "No pudimos abrir la ventana de impresión de etiqueta.";
            return;
        }

        popup.document.open();
        popup.document.write(`
            <html>
                <head>
                    <title>Etiqueta QR</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 24px; text-align: center; }
                        img { width: 240px; height: 240px; object-fit: contain; }
                        .meta { margin-top: 8px; color: #374151; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <img src="${qrAttachment.dataUrl}" alt="QR equipo" />
                    <div class="meta">${item.receivedIdentifier || item.serie || item.id}</div>
                </body>
            </html>
        `);
        popup.document.close();
        popup.focus();
        popup.print();
    }

    openReceptionPrint(recordID: string, autoPrint = false): void {
        const normalizedID = String(recordID ?? "").trim();
        if (!normalizedID) {
            this.validationMessage = "Debes guardar la recepción antes de generar el formato imprimible.";
            return;
        }

        const query = autoPrint ? "?autoprint=1" : "";
        window.open(`/app/crm-equipment-reception-print/${encodeURIComponent(normalizedID)}${query}`, "_blank", "noopener,noreferrer");
    }

    private resolveRecordAssignedTo(items: ProspectEquipmentItem[]): string {
        for (const item of items) {
            const assignedTo = (item.assignedTo || "").trim();
            if (assignedTo) {
                return assignedTo;
            }
        }

        return "";
    }

    private async ensureQrAttachmentsForItems(items: ProspectEquipmentItem[], recordID: string): Promise<void> {
        const normalizedRecordID = String(recordID ?? "").trim();
        const uploadedBy = this.authService.getCurrentUserName() || "recepcion";

        for (const item of items) {
            const identifier = (item.receivedIdentifier || item.serie || item.id).trim();
            if (!identifier) {
                continue;
            }

            const shortCode = buildEquipmentQrShortCode(normalizedRecordID, item.id) || item.id.slice(0, 8).toUpperCase();
            const qrDataUrl = await generateEquipmentQrDataUrl({
                recordId: normalizedRecordID,
                itemId: item.id,
                identifier,
                shortCode,
            });

            const existingAttachments = item.attachments ?? [];
            const nonQrAttachments = existingAttachments.filter((attachment) => (attachment.attachmentType || "").trim().toLowerCase() !== "qr-label");
            const existingQr = this.getItemQrAttachment(item);
            const nowISO = new Date().toISOString();

            const qrAttachment: ProspectEquipmentAttachment = {
                id: existingQr?.id || `qr-${item.id}`,
                attachmentType: "qr-label",
                fileName: `${shortCode || item.id}.png`,
                mimeType: "image/png",
                sizeBytes: estimateDataUrlBinarySize(qrDataUrl),
                dataUrl: qrDataUrl,
                notes: `Etiqueta QR ${identifier}`,
                uploadedAt: nowISO,
                uploadedBy,
                sha256: await this.sha256Hex(qrDataUrl),
            };

            item.attachments = [...nonQrAttachments, qrAttachment];
        }
    }

    private async sha256Hex(value: string): Promise<string> {
        if (typeof crypto === "undefined" || !crypto.subtle) {
            return "";
        }

        try {
            const raw = new TextEncoder().encode(value);
            const hashBuffer = await crypto.subtle.digest("SHA-256", raw);
            return Array.from(new Uint8Array(hashBuffer))
                .map((entry) => entry.toString(16).padStart(2, "0"))
                .join("");
        } catch {
            return "";
        }
    }

    formatEvidenceDate(value: string): string {
        if (!value) {
            return "--";
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "--" : date.toLocaleString();
    }

    formatBytes(value: number): string {
        if (value < 1024) {
            return `${value} B`;
        }

        if (value < 1024 * 1024) {
            return `${(value / 1024).toFixed(1)} KB`;
        }

        return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }

    formatGps(evidence: ProspectEquipmentEvidencePhoto): string {
        if (!evidence.gpsAvailable || evidence.latitude === null || evidence.longitude === null) {
            return "No disponible";
        }

        return `${evidence.latitude.toFixed(5)}, ${evidence.longitude.toFixed(5)}`;
    }

    private buildDraft(): ProspectEquipmentRecord {
        if (this.initialRecord) {
            return this.cloneRecord(this.initialRecord);
        }

        const now = new Date();
        const nowIso = now.toISOString();
        const primaryProspectBranch = (this.prospect?.branches ?? []).find((branch) => branch.isPrimary) ?? (this.prospect?.branches ?? [])[0] ?? null;

        return {
            id: this.buildId("rec"),
            prospectId: resolveEquipmentProspectId(this.prospect),
            prospectName: this.prospect?.nombre ?? "",
            receptionDay: this.pad(now.getDate()),
            receptionMonth: this.pad(now.getMonth() + 1),
            receptionYear: String(now.getFullYear()),
            intakeMethod: "personal",
            intakeCarrier: "",
            intakeTrackingNumber: "",
            intakeReceivedAt: nowIso,
            companyName: this.normalizeEmpty(this.prospect?.compania),
            sourceBranchName: this.normalizeEmpty(primaryProspectBranch?.name),
            nit: this.normalizeEmpty(this.prospect?.nit),
            phone: this.normalizeEmpty(this.prospect?.telefonoOficina),
            address: this.normalizeEmpty(primaryProspectBranch?.address) || this.normalizeEmpty(this.prospect?.direccion),
            city: this.normalizeEmpty(primaryProspectBranch?.city) || this.normalizeEmpty(this.prospect?.ciudad),
            contactName: this.normalizeEmpty(primaryProspectBranch?.contactName) || this.normalizeEmpty(this.prospect?.nombre),
            contactRole: this.normalizeEmpty(primaryProspectBranch?.contactRole),
            cellphone: this.normalizeEmpty(primaryProspectBranch?.phone) || this.normalizeEmpty(this.prospect?.movil),
            email: this.normalizeEmpty(primaryProspectBranch?.email) || this.normalizeEmpty(this.prospect?.correo),
            clientSignature: "",
            pikaSignature: "",
            createdAt: nowIso,
            updatedAt: nowIso,
            archived: false,
            archivedAt: "",
            sourceContext: "crm",
            assignedTo: this.normalizeEmpty(this.prospect?.empleado),
            items: [this.buildItem()],
        };
    }

    private syncCompanySelectionWithDraft(): void {
        const companyName = this.draft.companyName.trim();
        this.selectedCompanyOption = companyName;
        this.companySearchTerm = "";
        this.loadCompanyBranchesForSelectedCompany();
        this.loadCompanyContactsForSelectedCompany();
    }

    private loadCompanyCatalog(): void {
        this.companyCatalogLoading = true;
        this.companyCatalogError = "";

        forkJoin({
            clients: this.crmClientsApi.listClients({ limit: 300 }).pipe(catchError(() => of([] as CrmClientRecord[]))),
            prospects: this.crmProspectsApi.listProspects().pipe(catchError(() => of([] as CrmProspectRecord[]))),
            records: this.crmEquipmentApi.listRecords({ includeArchived: true }).pipe(catchError(() => of([] as ProspectEquipmentRecord[]))),
        }).subscribe({
            next: ({ clients, prospects, records }) => {
                this.companyCatalogLoading = false;
                this.equipmentRecordsCache = records;
                this.companyOptions = this.buildCompanyOptions(clients, prospects, records);
                this.companyProspectsByKey = this.buildProspectsByCompanyMap(prospects);
                this.companyBranchesByKey = this.buildCompanyBranchesMap(clients, prospects);
                this.companyContactsByCompanyKey.clear();
                this.syncCompanySelectionWithDraft();
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                this.companyCatalogLoading = false;
                this.companyCatalogError = "No se pudo cargar el catálogo de empresas.";
                this.companyOptions = [];
                this.companyProspectsByKey.clear();
                this.companyBranchesByKey.clear();
                this.companyContactsByCompanyKey.clear();
                this.selectedCompanyBranchOption = "";
                this.companyBranchOptions = [];
                this.companyContactsLoading = false;
                this.companyContactsError = "";
                this.companyContactOptions = [];
                this.selectedCompanyContactOption = "";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    private loadCompanyBranchesForSelectedCompany(): void {
        const companyName = this.draft.companyName.trim();
        const companyKey = this.normalizeCompanyKey(companyName);

        if (!companyKey) {
            this.selectedCompanyBranchOption = "";
            this.companyBranchOptions = [];
            return;
        }

        const optionsFromCatalog = this.companyBranchesByKey.get(companyKey) ?? [];
        const fallbackOptions = this.buildFallbackCompanyBranches(companyKey);
        this.companyBranchOptions = this.mergeCompanyBranchOptions([...optionsFromCatalog, ...fallbackOptions]);
        this.syncSelectedCompanyBranchOption();

        if (!this.selectedCompanyBranchOption && this.companyBranchOptions.length > 0) {
            const preferred = this.companyBranchOptions.find((option) => option.isPrimary) ?? this.companyBranchOptions[0];
            this.onCompanyBranchSelectionChange(preferred.value);
        }
    }

    private buildCompanyBranchesMap(clients: CrmClientRecord[], prospects: CrmProspectRecord[]): Map<string, CompanyBranchOption[]> {
        const byCompany = new Map<string, CompanyBranchOption[]>();

        const appendBranchOptions = (companyName: string, sourceID: string, sourceLabel: string, branches: CrmBranchRecord[] | undefined): void => {
            const companyKey = this.normalizeCompanyKey(companyName);
            if (!companyKey || !Array.isArray(branches) || branches.length === 0) {
                return;
            }

            const mapped = branches
                .map((branch, index) => {
                    const name = String(branch.name ?? "").trim();
                    const city = String(branch.city ?? "").trim();
                    const address = String(branch.address ?? "").trim();
                    const contactName = String(branch.contactName ?? "").trim();
                    const contactRole = String(branch.contactRole ?? "").trim();
                    const email = String(branch.email ?? "").trim();
                    const phone = String(branch.phone ?? "").trim();
                    const branchID = String(branch.id ?? "").trim();
                    const isPrimary = Boolean(branch.isPrimary);

                    if (!name && !city && !address && !contactName && !email && !phone) {
                        return null;
                    }

                    return {
                        value: `branch:${sourceID}:${branchID || index}`,
                        name: name || city || `Sucursal ${index + 1}`,
                        city,
                        address,
                        contactName,
                        contactRole,
                        email,
                        phone,
                        isPrimary,
                        sourceLabel,
                    } as CompanyBranchOption;
                })
                .filter((option): option is CompanyBranchOption => option !== null);

            if (mapped.length === 0) {
                return;
            }

            const current = byCompany.get(companyKey) ?? [];
            byCompany.set(companyKey, this.mergeCompanyBranchOptions([...current, ...mapped]));
        };

        clients.forEach((client) => {
            appendBranchOptions(client.empresa, `client:${client.id}`, "Cliente", client.branches);
        });

        prospects.forEach((prospect) => {
            const sourceLabel = prospect.nombre?.trim() ? `Prospecto · ${prospect.nombre.trim()}` : "Prospecto";
            appendBranchOptions(prospect.compania, `prospect:${prospect.backendId}`, sourceLabel, prospect.branches);
        });

        return byCompany;
    }

    private buildFallbackCompanyBranches(companyKey: string): CompanyBranchOption[] {
        if (!companyKey) {
            return [];
        }

        const sourceBranchName = (this.draft.sourceBranchName || "").trim();
        const city = this.draft.city.trim();
        const address = this.draft.address.trim();
        const contactName = this.draft.contactName.trim();
        const contactRole = this.draft.contactRole.trim();
        const email = this.draft.email.trim();
        const phone = this.draft.cellphone.trim() || this.draft.phone.trim();

        if (!sourceBranchName && !city && !address) {
            return [];
        }

        return [
            {
                value: `draft-branch:${companyKey}`,
                name: sourceBranchName || city || "Sucursal actual",
                city,
                address,
                contactName,
                contactRole,
                email,
                phone,
                isPrimary: false,
                sourceLabel: "Actual",
            },
        ];
    }

    private mergeCompanyBranchOptions(options: CompanyBranchOption[]): CompanyBranchOption[] {
        const merged = new Map<string, CompanyBranchOption>();

        options.forEach((option, index) => {
            const name = String(option.name ?? "").trim();
            const city = String(option.city ?? "").trim();
            const address = String(option.address ?? "").trim();
            const contactName = String(option.contactName ?? "").trim();
            const contactRole = String(option.contactRole ?? "").trim();
            const email = String(option.email ?? "").trim();
            const phone = String(option.phone ?? "").trim();
            const sourceLabel = String(option.sourceLabel ?? "").trim();
            const isPrimary = Boolean(option.isPrimary);

            if (!name && !city && !address && !contactName && !email && !phone) {
                return;
            }

            const dedupeKey = [this.normalizeCompanyKey(name), this.normalizeCompanyKey(city), this.normalizeCompanyKey(address)].join("|");
            const existing = merged.get(dedupeKey);

            if (existing) {
                if (!existing.contactName && contactName) {
                    existing.contactName = contactName;
                }
                if (!existing.contactRole && contactRole) {
                    existing.contactRole = contactRole;
                }
                if (!existing.email && email) {
                    existing.email = email;
                }
                if (!existing.phone && phone) {
                    existing.phone = phone;
                }
                if (!existing.city && city) {
                    existing.city = city;
                }
                if (!existing.address && address) {
                    existing.address = address;
                }
                if (!existing.sourceLabel && sourceLabel) {
                    existing.sourceLabel = sourceLabel;
                }
                existing.isPrimary = existing.isPrimary || isPrimary;
                return;
            }

            merged.set(dedupeKey, {
                value: String(option.value ?? `branch-option-${index}`).trim() || `branch-option-${index}`,
                name: name || city || address || `Sucursal ${index + 1}`,
                city,
                address,
                contactName,
                contactRole,
                email,
                phone,
                isPrimary,
                sourceLabel,
            });
        });

        return Array.from(merged.values()).sort((a, b) => {
            if (a.isPrimary !== b.isPrimary) {
                return a.isPrimary ? -1 : 1;
            }
            return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
        });
    }

    private syncSelectedCompanyBranchOption(): void {
        if (this.companyBranchOptions.length === 0) {
            this.selectedCompanyBranchOption = "";
            return;
        }

        const normalizedBranchName = this.normalizeCompanyKey(this.draft.sourceBranchName || "");
        const normalizedCity = this.normalizeCompanyKey(this.draft.city);
        const normalizedAddress = this.normalizeCompanyKey(this.draft.address);

        const match = this.companyBranchOptions.find((option) => {
            const optionName = this.normalizeCompanyKey(option.name);
            const optionCity = this.normalizeCompanyKey(option.city);
            const optionAddress = this.normalizeCompanyKey(option.address);

            if (normalizedBranchName && optionName === normalizedBranchName) {
                return true;
            }

            return Boolean(normalizedCity && normalizedAddress && optionCity === normalizedCity && optionAddress === normalizedAddress);
        });

        this.selectedCompanyBranchOption = match?.value ?? "";
    }

    private loadCompanyContactsForSelectedCompany(): void {
        const companyName = this.draft.companyName.trim();
        const companyKey = this.normalizeCompanyKey(companyName);

        this.companyContactsError = "";

        if (!companyKey) {
            this.companyContactsLoading = false;
            this.selectedCompanyContactOption = "";
            this.companyContactOptions = [];
            return;
        }

        const cached = this.companyContactsByCompanyKey.get(companyKey);
        if (cached) {
            this.companyContactsLoading = false;
            this.companyContactOptions = cached;
            this.syncSelectedCompanyContactOption();
            return;
        }

        const fallbackOptions = this.buildFallbackCompanyContacts(companyKey);
        const prospects = (this.companyProspectsByKey.get(companyKey) ?? []).filter((prospect) => String(prospect.backendId ?? "").trim().length > 0);

        if (prospects.length === 0) {
            const fallbackOnly = this.mergeCompanyContactOptions(fallbackOptions);
            this.companyContactsByCompanyKey.set(companyKey, fallbackOnly);
            this.companyContactsLoading = false;
            this.companyContactOptions = fallbackOnly;
            this.syncSelectedCompanyContactOption();
            return;
        }

        this.companyContactsLoading = true;

        const requests = prospects.map((prospect) =>
            this.crmProspectsApi.listProspectContacts(String(prospect.backendId ?? "").trim()).pipe(catchError(() => of([] as CrmProspectContact[]))),
        );

        forkJoin(requests).subscribe({
            next: (groupedContacts) => {
                const runtimeCompanyKey = this.normalizeCompanyKey(this.draft.companyName);

                const contactsFromProspects: CompanyContactOption[] = [];
                groupedContacts.forEach((contacts, index) => {
                    const prospect = prospects[index];
                    const sourceLabel = prospect?.nombre?.trim() ? `CRM · ${prospect.nombre.trim()}` : "CRM";

                    contacts.forEach((contact) => {
                        const name = String(contact.name ?? "").trim();
                        const email = String(contact.email ?? "").trim();
                        const phone = String(contact.phone ?? "").trim();
                        const role = String(contact.role ?? "").trim();
                        const contactID = String(contact.id ?? "").trim();

                        if (!name && !email && !phone) {
                            return;
                        }

                        contactsFromProspects.push({
                            value: `crm:${prospect?.backendId || "sin-prospecto"}:${contactID || name || email || phone}`,
                            name: name || email || phone,
                            role,
                            email,
                            phone,
                            sourceLabel,
                        });
                    });
                });

                const merged = this.mergeCompanyContactOptions([...contactsFromProspects, ...fallbackOptions]);
                this.companyContactsByCompanyKey.set(companyKey, merged);

                if (runtimeCompanyKey !== companyKey) {
                    return;
                }

                this.companyContactsLoading = false;
                this.companyContactOptions = merged;
                this.syncSelectedCompanyContactOption();
                this.changeDetectorRef.detectChanges();
            },
            error: () => {
                const runtimeCompanyKey = this.normalizeCompanyKey(this.draft.companyName);
                const fallbackOnly = this.mergeCompanyContactOptions(fallbackOptions);
                this.companyContactsByCompanyKey.set(companyKey, fallbackOnly);

                if (runtimeCompanyKey !== companyKey) {
                    return;
                }

                this.companyContactsLoading = false;
                this.companyContactsError = "No se pudieron cargar todos los contactos de esta empresa.";
                this.companyContactOptions = fallbackOnly;
                this.syncSelectedCompanyContactOption();
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    private buildProspectsByCompanyMap(prospects: CrmProspectRecord[]): Map<string, CrmProspectRecord[]> {
        const byCompany = new Map<string, CrmProspectRecord[]>();

        prospects.forEach((prospect) => {
            const key = this.normalizeCompanyKey(prospect.compania);
            if (!key) {
                return;
            }

            const existing = byCompany.get(key) ?? [];
            existing.push(prospect);
            byCompany.set(key, existing);
        });

        return byCompany;
    }

    private buildFallbackCompanyContacts(companyKey: string): CompanyContactOption[] {
        if (!companyKey) {
            return [];
        }

        const options: CompanyContactOption[] = [];
        const companyOption = this.companyOptions.find((option) => this.normalizeCompanyKey(option.company) === companyKey);

        if (companyOption) {
            const name = String(companyOption.contactName ?? "").trim();
            const email = String(companyOption.email ?? "").trim();
            const phone = String(companyOption.cellphone ?? "").trim() || String(companyOption.phone ?? "").trim();
            const role = String(companyOption.contactRole ?? "").trim();

            if (name || email || phone) {
                options.push({
                    value: `catalog:${companyKey}`,
                    name: name || email || phone,
                    role,
                    email,
                    phone,
                    sourceLabel: "Catálogo",
                });
            }
        }

        const draftName = this.draft.contactName.trim();
        const draftEmail = this.draft.email.trim();
        const draftPhone = this.draft.cellphone.trim() || this.draft.phone.trim();
        const draftRole = this.draft.contactRole.trim();
        if (draftName || draftEmail || draftPhone) {
            options.push({
                value: `draft:${companyKey}`,
                name: draftName || draftEmail || draftPhone,
                role: draftRole,
                email: draftEmail,
                phone: draftPhone,
                sourceLabel: "Actual",
            });
        }

        return this.mergeCompanyContactOptions(options);
    }

    private mergeCompanyContactOptions(options: CompanyContactOption[]): CompanyContactOption[] {
        const merged = new Map<string, CompanyContactOption>();

        options.forEach((option, index) => {
            const name = String(option.name ?? "").trim();
            const role = String(option.role ?? "").trim();
            const email = String(option.email ?? "").trim();
            const phone = String(option.phone ?? "").trim();
            const sourceLabel = String(option.sourceLabel ?? "").trim();

            if (!name && !email && !phone) {
                return;
            }

            const dedupeKey = [this.normalizeCompanyKey(name), this.normalizeCompanyKey(email), this.normalizeCompanyKey(phone)].join("|");
            const existing = merged.get(dedupeKey);
            if (existing) {
                if (!existing.role && role) {
                    existing.role = role;
                }
                if (!existing.email && email) {
                    existing.email = email;
                }
                if (!existing.phone && phone) {
                    existing.phone = phone;
                }
                if (!existing.sourceLabel && sourceLabel) {
                    existing.sourceLabel = sourceLabel;
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

    private syncSelectedCompanyContactOption(): void {
        if (this.companyContactOptions.length === 0) {
            this.selectedCompanyContactOption = "";
            return;
        }

        const normalizedDraftName = this.normalizeCompanyKey(this.draft.contactName);
        const normalizedDraftEmail = this.normalizeCompanyKey(this.draft.email);
        const normalizedDraftPhone = this.normalizeCompanyKey(this.draft.cellphone || this.draft.phone);

        const match = this.companyContactOptions.find((option) => {
            const optionName = this.normalizeCompanyKey(option.name);
            const optionEmail = this.normalizeCompanyKey(option.email);
            const optionPhone = this.normalizeCompanyKey(option.phone);

            if (normalizedDraftEmail && optionEmail && normalizedDraftEmail === optionEmail) {
                return true;
            }

            if (normalizedDraftPhone && optionPhone && normalizedDraftPhone === optionPhone) {
                return true;
            }

            return Boolean(normalizedDraftName && optionName && normalizedDraftName === optionName);
        });

        this.selectedCompanyContactOption = match?.value ?? "";
    }

    private loadTechniciansCatalog(): void {
        this.technicianCatalogLoading = true;
        this.techniciansBySpeciality.clear();

        this.crmEquipmentApi.listTechnicians().subscribe({
            next: (items) => {
                this.techniciansAll = items;

                const specialitySet = new Set<string>();
                this.draft.items.forEach((item) => {
                    const speciality = this.resolveItemAssignmentSpeciality(item).toLowerCase();
                    if (speciality) {
                        specialitySet.add(speciality);
                    }
                });

                if (specialitySet.size === 0) {
                    this.technicianCatalogLoading = false;
                    this.changeDetectorRef.detectChanges();
                    return;
                }

                const pendingSpecialities = Array.from(specialitySet.values());
                const requests = pendingSpecialities.map((speciality) =>
                    this.crmEquipmentApi.listTechnicians({ speciality }).pipe(catchError(() => of([] as EquipmentTechnicianOption[]))),
                );

                forkJoin(requests).subscribe({
                    next: (grouped) => {
                        grouped.forEach((group, index) => {
                            this.techniciansBySpeciality.set(pendingSpecialities[index], group);
                        });
                        this.technicianCatalogLoading = false;
                        this.changeDetectorRef.detectChanges();
                    },
                    error: () => {
                        this.technicianCatalogLoading = false;
                        this.changeDetectorRef.detectChanges();
                    },
                });
            },
            error: () => {
                this.technicianCatalogLoading = false;
                this.techniciansAll = [];
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    private buildCompanyOptions(clients: CrmClientRecord[], prospects: CrmProspectRecord[], records: ProspectEquipmentRecord[]): CompanyCatalogOption[] {
        const byKey = new Map<string, CompanyCatalogOption>();

        clients.forEach((client) => {
            const company = String(client.empresa ?? "").trim();
            if (!company) {
                return;
            }

            const key = this.normalizeCompanyKey(company);
            const existing = byKey.get(key);
            if (existing) {
                existing.sourceLabel = existing.sourceLabel === "Prospecto" ? "Cliente y prospecto" : "Cliente";
                existing.nit = existing.nit || this.normalizeEmpty(client.nit).trim();
                existing.contactName = existing.contactName || client.nombre.trim();
                existing.email = existing.email || client.correo.trim();
                existing.zone = existing.zone || client.zona.trim();
                return;
            }

            byKey.set(key, {
                company,
                sourceLabel: "Cliente",
                nit: this.normalizeEmpty(client.nit).trim(),
                contactName: client.nombre.trim(),
                contactRole: "",
                email: client.correo.trim(),
                phone: "",
                cellphone: "",
                city: "",
                address: "",
                zone: client.zona.trim(),
            });
        });

        prospects.forEach((prospect) => {
            const company = String(prospect.compania ?? "").trim();
            if (!company) {
                return;
            }

            const key = this.normalizeCompanyKey(company);
            const existing = byKey.get(key);
            if (existing) {
                existing.sourceLabel = existing.sourceLabel === "Cliente" ? "Cliente y prospecto" : "Prospecto";
                existing.nit = existing.nit || this.normalizeEmpty(prospect.nit).trim();
                existing.contactName = existing.contactName || prospect.nombre.trim();
                existing.email = existing.email || prospect.correo.trim();
                existing.phone = existing.phone || this.normalizeEmpty(prospect.telefonoOficina).trim();
                existing.cellphone = existing.cellphone || this.normalizeEmpty(prospect.movil).trim();
                existing.city = existing.city || this.normalizeEmpty(prospect.ciudad).trim();
                existing.address = existing.address || this.normalizeEmpty(prospect.direccion).trim();
                existing.zone = existing.zone || prospect.zona.trim();
                return;
            }

            byKey.set(key, {
                company,
                sourceLabel: "Prospecto",
                nit: this.normalizeEmpty(prospect.nit).trim(),
                contactName: prospect.nombre.trim(),
                contactRole: "",
                email: prospect.correo.trim(),
                phone: this.normalizeEmpty(prospect.telefonoOficina).trim(),
                cellphone: this.normalizeEmpty(prospect.movil).trim(),
                city: this.normalizeEmpty(prospect.ciudad).trim(),
                address: this.normalizeEmpty(prospect.direccion).trim(),
                zone: prospect.zona.trim(),
            });
        });

        const appliedRecordByCompany = new Set<string>();
        const recordsSortedByRecency = [...records].sort((left, right) => {
            const leftTime = Number.isFinite(Date.parse(String(left.updatedAt ?? ""))) ? Date.parse(String(left.updatedAt ?? "")) : Date.parse(String(left.createdAt ?? ""));
            const rightTime = Number.isFinite(Date.parse(String(right.updatedAt ?? ""))) ? Date.parse(String(right.updatedAt ?? "")) : Date.parse(String(right.createdAt ?? ""));
            const safeLeftTime = Number.isFinite(leftTime) ? leftTime : 0;
            const safeRightTime = Number.isFinite(rightTime) ? rightTime : 0;
            return safeRightTime - safeLeftTime;
        });

        recordsSortedByRecency.forEach((record) => {
            const company = String(record.companyName ?? "").trim();
            if (!company) {
                return;
            }

            const key = this.normalizeCompanyKey(company);
            if (!key || appliedRecordByCompany.has(key)) {
                return;
            }

            const existing = byKey.get(key);
            if (!existing) {
                byKey.set(key, {
                    company,
                    sourceLabel: "Recepcion previa",
                    nit: this.normalizeEmpty(record.nit).trim(),
                    contactName: this.normalizeEmpty(record.contactName).trim(),
                    contactRole: this.normalizeEmpty(record.contactRole).trim(),
                    email: this.normalizeEmpty(record.email).trim(),
                    phone: this.normalizeEmpty(record.phone).trim(),
                    cellphone: this.normalizeEmpty(record.cellphone).trim(),
                    city: this.normalizeEmpty(record.city).trim(),
                    address: this.normalizeEmpty(record.address).trim(),
                    zone: "",
                });
                appliedRecordByCompany.add(key);
                return;
            }

            existing.nit = this.normalizeEmpty(record.nit).trim() || existing.nit;
            existing.contactName = this.normalizeEmpty(record.contactName).trim() || existing.contactName;
            existing.contactRole = this.normalizeEmpty(record.contactRole).trim() || existing.contactRole;
            existing.email = this.normalizeEmpty(record.email).trim() || existing.email;
            existing.phone = this.normalizeEmpty(record.phone).trim() || existing.phone;
            existing.cellphone = this.normalizeEmpty(record.cellphone).trim() || existing.cellphone;
            existing.city = this.normalizeEmpty(record.city).trim() || existing.city;
            existing.address = this.normalizeEmpty(record.address).trim() || existing.address;

            appliedRecordByCompany.add(key);
        });

        return Array.from(byKey.values()).sort((a, b) => a.company.localeCompare(b.company, "es", { sensitivity: "base" }));
    }

    private upsertCompanyOptionFromClient(client: CrmClientRecord): void {
        const company = String(client.empresa ?? "").trim();
        if (!company) {
            return;
        }

        const option: CompanyCatalogOption = {
            company,
            sourceLabel: "Cliente",
            nit: this.normalizeEmpty(client.nit).trim() || this.draft.nit.trim(),
            contactName: String(client.nombre ?? "").trim(),
            contactRole: this.draft.contactRole.trim(),
            email: String(client.correo ?? "").trim(),
            phone: this.draft.phone.trim(),
            cellphone: this.draft.cellphone.trim(),
            city: this.draft.city.trim(),
            address: this.draft.address.trim(),
            zone: String(client.zona ?? "").trim(),
        };

        const key = this.normalizeCompanyKey(company);
        const existingIndex = this.companyOptions.findIndex((entry) => this.normalizeCompanyKey(entry.company) === key);
        if (existingIndex >= 0) {
            const current = this.companyOptions[existingIndex];
            this.companyOptions = this.companyOptions.map((entry, index) =>
                index !== existingIndex
                    ? entry
                    : {
                        ...entry,
                        sourceLabel: entry.sourceLabel === "Prospecto" ? "Cliente y prospecto" : "Cliente",
                        nit: current.nit || option.nit,
                        contactName: current.contactName || option.contactName,
                        contactRole: current.contactRole || option.contactRole,
                        email: current.email || option.email,
                        phone: current.phone || option.phone,
                        cellphone: current.cellphone || option.cellphone,
                        city: current.city || option.city,
                        address: current.address || option.address,
                        zone: current.zone || option.zone,
                    },
            );
            return;
        }

        this.companyOptions = [...this.companyOptions, option].sort((a, b) => a.company.localeCompare(b.company, "es", { sensitivity: "base" }));
    }

    private normalizeCompanyKey(value: string): string {
        return String(value ?? "").trim().toLowerCase();
    }

    private buildItem(): ProspectEquipmentItem {
        return {
            id: this.buildId("item"),
            registrationMode: "catalog",
            equipmentModelId: "",
            isIndustrial: false,
            serviceTypeId: "",
            serviceTypeName: "",
            storageLocationId: "",
            storageLocationName: "",
            familyId: "",
            familyName: "",
            marca: "",
            tipo: "",
            serie: "",
            receivedIdentifier: "",
            receivedIdentifierType: "",
            receivedIdentifierSource: "manual",
            receivedIdentifierCapturedAt: "",
            customerShipmentReference: "",
            accessories: "",
            borrowedEquipments: [],
            failureDescription: "",
            assignedTo: "",
            assignedToId: "",
            assignedAt: "",
            assignedBy: "",
            industrialOverrideAuthorizedBy: "",
            industrialOverrideReason: "",
            industrialOverrideAuthorizedAt: "",
            pendingHomologation: false,
            estimatedData: false,
            identifierLabelIssue: false,
            evidencePhotos: [],
            answers: this.buildDefaultAnswers(),
        };
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    private pad(value: number): string {
        return String(value).padStart(2, "0");
    }

    private normalizeEmpty(value: string | undefined): string {
        if (!value || value === "--") {
            return "";
        }

        return value;
    }

    private buildDefaultAnswers(): Record<string, string> {
        const answers = createEquipmentAnswers();

        PROSPECT_EQUIPMENT_QUESTION_DEFINITIONS.forEach((question) => {
            if (question.type === "boolean") {
                answers[question.key] = "No";
            }
        });

        return answers;
    }

    private validateCurrentStep(): boolean {
        if (this.currentWizardStep.key === "reception") {
            return this.validateReceptionStep();
        }

        if (this.currentWizardStep.key === "equipment") {
            return this.validateEquipmentItems(this.getMeaningfulItems());
        }

        if (this.currentWizardStep.key === "questions") {
            return this.validateIndustrialOverrides(this.getMeaningfulItems());
        }

        if (this.currentWizardStep.key === "evidence") {
            return this.validateEvidenceFaces(this.getMeaningfulItems());
        }

        return true;
    }

    private validateReceptionStep(): boolean {
        if ((this.draft.intakeMethod || "personal") !== "transportadora") {
            return true;
        }

        if (!(this.draft.intakeCarrier || "").trim() || !(this.draft.intakeTrackingNumber || "").trim()) {
            this.validationMessage = "Para recepción por transportadora debes registrar transportadora y número de guía.";
            return false;
        }

        return true;
    }

    private getMeaningfulItems(): ProspectEquipmentItem[] {
        return this.draft.items.filter((item) => this.hasItemContent(item));
    }

    private validateEquipmentItems(items: ProspectEquipmentItem[]): boolean {
        if (items.length === 0) {
            this.validationMessage = "Debes registrar por lo menos un equipo o un dato operativo antes de continuar.";
            return false;
        }

        return true;
    }

    private validateIndustrialOverrides(items: ProspectEquipmentItem[]): boolean {
        const blockedItem = items.find((item) => this.requiresIndustrialOverride(item) && !this.hasIndustrialOverrideAuthorization(item));
        if (!blockedItem) {
            return true;
        }

        this.validationMessage = "Falta autorización de jefe para un equipo no industrial o marcado con costo <= 2M.";
        return false;
    }

    hasRequiredFaceEvidence(item: ProspectEquipmentItem): boolean {
        return this.getMissingRequiredFaceEvidence(item).length === 0;
    }

    getMissingRequiredFaceEvidence(item: ProspectEquipmentItem): ProspectEquipmentEvidenceType[] {
        const availableTypes = new Set(
            item.evidencePhotos
                .map((photo) => String(photo.evidenceType ?? "").trim().toLowerCase())
                .filter((value) => value.length > 0),
        );

        return this.requiredFaceEvidenceTypes.filter((requiredType) => !availableTypes.has(requiredType));
    }

    getFaceEvidenceLabel(type: ProspectEquipmentEvidenceType): string {
        return FACE_EVIDENCE_LABELS[type] || type;
    }

    private validateEvidenceFaces(items: ProspectEquipmentItem[]): boolean {
        const missingItem = items.find((item) => this.getMissingRequiredFaceEvidence(item).length > 0);
        if (!missingItem) {
            return true;
        }

        const missingLabels = this.getMissingRequiredFaceEvidence(missingItem).map((type) => this.getFaceEvidenceLabel(type));
        this.validationMessage = `Faltan fotos obligatorias por cara (${missingLabels.join(", ")}) para continuar.`;
        return false;
    }

    private async startScanner(videoElement: HTMLVideoElement): Promise<void> {
        this.scannerError = "";
        this.scannerStatus = "Solicita permisos de cámara y apunta al identificador del equipo.";

        try {
            this.stopScannerSession();
            this.scannerControls = await this.barcodeReader.decodeFromVideoDevice(undefined, videoElement, (result) => {
                if (!result || !this.scanningItemId) {
                    return;
                }

                const item = this.draft.items.find((entry) => entry.id === this.scanningItemId);
                if (!item) {
                    return;
                }

                item.receivedIdentifier = result.getText().trim();
                item.receivedIdentifierType = String(result.getBarcodeFormat()).toLowerCase();
                item.receivedIdentifierSource = "camera-scan";
                item.receivedIdentifierCapturedAt = new Date().toISOString();
                this.scannerStatus = "Identificador capturado correctamente.";
                this.closeScanner();
            });
        } catch {
            this.scannerError = "No fue posible iniciar el escáner. Verifica permisos de cámara o usa el campo manual.";
            this.scannerStatus = "Escáner no disponible.";
        }
    }

    private stopScannerSession(): void {
        this.scannerControls?.stop();
        this.scannerControls = null;
    }

    private hasItemContent(item: ProspectEquipmentItem): boolean {
        if (item.equipmentModelId.trim()) {
            return true;
        }

        if ([
            item.serviceTypeName,
            item.storageLocationName,
            item.familyName,
            item.marca,
            item.tipo,
            item.serie,
            item.receivedIdentifier,
            item.customerShipmentReference,
            item.accessories,
            item.failureDescription,
            item.assignedTo || "",
            item.assignedToId || "",
            item.industrialOverrideAuthorizedBy || "",
            item.industrialOverrideReason || "",
        ].some((value) => value.trim().length > 0)) {
            return true;
        }

        if (item.borrowedEquipments.some((value) => value.trim().length > 0)) {
            return true;
        }

        if (item.evidencePhotos.length > 0) {
            return true;
        }

        return Object.values(item.answers).some((value) => value.trim().length > 0);
    }

    private finalizeSave(createdProjectIds: string[] = [], recordID = "", openPrintAfterSave = false): void {
        if (openPrintAfterSave && recordID) {
            this.openReceptionPrint(recordID, true);
        }

        this.formDraftService.remove(this.resolveDraftKey());
        this.saved.emit();
        this.close();

        if (!this.navigateToProjectsOnSave || createdProjectIds.length === 0) {
            return;
        }

        void this.router.navigate(["/app/work-projects"], {
            queryParams: {
                openProject: createdProjectIds[0],
                createdFromReception: createdProjectIds.join(","),
            },
        });
    }

    private isRepairServiceItem(item: ProspectEquipmentItem): boolean {
        if (item.serviceTypeId === "service-reparacion") {
            return true;
        }

        return item.serviceTypeName.trim().toLowerCase().includes("repar");
    }

    private buildRepairProjectTitle(item: ProspectEquipmentItem, index: number): string {
        const identifier = item.receivedIdentifier.trim() || item.serie.trim();
        const equipmentLabel = this.equipmentCardTitle(item, index).replace(/^Equipo\s+\d+\s+·\s+/, "");

        if (identifier) {
            return `Reparacion ${equipmentLabel || "equipo"} · ${identifier}`;
        }

        return `Reparacion ${equipmentLabel || `equipo ${index + 1}`}`;
    }

    private buildRepairProjectDescription(record: ProspectEquipmentRecord, item: ProspectEquipmentItem): string {
        const parts: string[] = [];

        parts.push(`Prospecto: ${record.prospectName || "Sin nombre"}`);
        parts.push(`Empresa: ${record.companyName || "Sin empresa"}`);
        if (record.sourceBranchName?.trim()) {
            parts.push(`Sucursal: ${record.sourceBranchName.trim()}`);
        }
        parts.push(`Recepcion: ${record.receptionDay || "--"}/${record.receptionMonth || "--"}/${record.receptionYear || "----"}`);
        parts.push(`Ubicacion inicial: ${item.storageLocationName || "Sin ubicacion"}`);

        if (item.receivedIdentifier.trim()) {
            parts.push(`Identificador: ${item.receivedIdentifier.trim()}`);
        }

        if (item.failureDescription.trim()) {
            parts.push(`Falla reportada: ${item.failureDescription.trim()}`);
        }

        const borrowedEquipments = item.borrowedEquipments.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        if (borrowedEquipments.length > 0) {
            parts.push(`Equipos prestados para prueba: ${borrowedEquipments.join(", ")}`);
        }

        return parts.join("\n");
    }

    private startModalDraftWatch(): void {
        this.stopDraftWatch();
        const draftKey = this.resolveDraftKey();

        this.stopDraftWatch = this.formDraftService.watch(draftKey, () => ({
            currentStepIndex: this.currentStepIndex,
            generateRepairProjectsOnSave: this.generateRepairProjectsOnSave,
            draft: this.draft,
        }));
    }

    private restoreModalDraft(): void {
        const draftKey = this.resolveDraftKey();
        const stored = this.formDraftService.load<{
            currentStepIndex?: number;
            generateRepairProjectsOnSave?: boolean;
            draft?: ProspectEquipmentRecord;
        }>(draftKey);

        if (!stored?.draft) {
            return;
        }

        this.draft = this.cloneRecord(stored.draft);
        this.generateRepairProjectsOnSave = Boolean(stored.generateRepairProjectsOnSave ?? this.generateRepairProjectsOnSave);

        const stepIndex = Number(stored.currentStepIndex ?? 0);
        if (Number.isFinite(stepIndex)) {
            this.currentStepIndex = Math.max(0, Math.min(this.wizardSteps.length - 1, Math.trunc(stepIndex)));
        }
    }

    private resolveDraftKey(): string {
        const prospectKey = this.prospect?.backendId || String(this.prospect?.id ?? "sin-prospecto");
        const recordKey = this.initialRecord?.id || "nuevo";
        return `${CRM_EQUIPMENT_MODAL_DRAFT_PREFIX}.${prospectKey}.${recordKey}`;
    }

    private buildRepairProjectProperties(record: ProspectEquipmentRecord, item: ProspectEquipmentItem): Record<string, any> {
        const nowIso = new Date().toISOString();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        const repairStatus: ProspectEquipmentRepairStatus = "recibido";

        return {
            startDate: new Date(),
            dueDate,
            noDeadline: false,
            category: "Reparacion",
            department: "Servicio tecnico",
            client: record.companyName.trim() || this.prospect?.compania || "Cliente",
            priority: this.isPriorityPaid(item) ? "high" : "medium",
            assignee: this.prospect?.empleado ?? "",
            notes: item.failureDescription.trim(),
            equipmentRecordId: record.id,
            equipmentItemId: item.id,
            equipmentProspectId: record.prospectId,
            equipmentProspectName: record.prospectName,
            equipmentDisplayName: this.equipmentCardTitle(item, 0).replace(/^Equipo\s+\d+\s+·\s+/, "") || "Equipo",
            equipmentIdentifier: item.receivedIdentifier.trim(),
            equipmentSerie: item.serie.trim(),
            equipmentReceptionLabel: `${record.receptionDay || "--"}/${record.receptionMonth || "--"}/${record.receptionYear || "----"}`,
            equipmentServiceType: item.serviceTypeName.trim(),
            equipmentFailureDescription: item.failureDescription.trim(),
            equipmentBorrowedForTesting: item.borrowedEquipments.map((entry) => entry.trim()).filter((entry) => entry.length > 0),
            equipmentLocationId: item.storageLocationId,
            equipmentLocationName: item.storageLocationName.trim(),
            equipmentRepairStatus: repairStatus,
            equipmentRepairStatusLabel: "Recibido",
            equipmentLinkedAt: nowIso,
            equipmentLastScanAt: item.receivedIdentifierCapturedAt || "",
            equipmentLastScanSource: item.receivedIdentifierSource,
            equipmentLastWorkflowUpdate: nowIso,
            equipmentDiagnosisMode: this.isPriorityPaid(item) ? "urgencia-prioridad" : "diagnostico-gratis",
            progress: 0,
        };
    }

    private cloneRecord(record: ProspectEquipmentRecord): ProspectEquipmentRecord {
        return {
            ...record,
            intakeMethod: record.intakeMethod === "transportadora" ? "transportadora" : "personal",
            intakeCarrier: String(record.intakeCarrier ?? "").trim(),
            intakeTrackingNumber: String(record.intakeTrackingNumber ?? "").trim(),
            intakeReceivedAt: String(record.intakeReceivedAt ?? "").trim(),
            sourceBranchName: String(record.sourceBranchName ?? "").trim(),
            items: record.items.map((item) => ({
                ...item,
                registrationMode: item.registrationMode === "manual" ? "manual" : item.equipmentModelId.trim() ? "catalog" : "manual",
                isIndustrial: typeof item.isIndustrial === "boolean" ? item.isIndustrial : this.resolveItemIndustrialFlag(item),
                borrowedEquipments: [...(item.borrowedEquipments ?? [])],
                assignedTo: String(item.assignedTo ?? "").trim(),
                assignedToId: String(item.assignedToId ?? "").trim(),
                assignedAt: String(item.assignedAt ?? "").trim(),
                assignedBy: String(item.assignedBy ?? "").trim(),
                industrialOverrideAuthorizedBy: String(item.industrialOverrideAuthorizedBy ?? "").trim(),
                industrialOverrideReason: String(item.industrialOverrideReason ?? "").trim(),
                industrialOverrideAuthorizedAt: String(item.industrialOverrideAuthorizedAt ?? "").trim(),
                pendingHomologation: Boolean(item.pendingHomologation) || item.registrationMode === "manual" || !item.equipmentModelId.trim(),
                estimatedData: Boolean(item.estimatedData),
                identifierLabelIssue: Boolean(item.identifierLabelIssue),
                evidencePhotos: item.evidencePhotos.map((photo) => ({ ...photo })),
                attachments: Array.isArray(item.attachments) ? item.attachments.map((attachment) => ({ ...attachment })) : [],
                answers: { ...item.answers },
            })),
        };
    }
}