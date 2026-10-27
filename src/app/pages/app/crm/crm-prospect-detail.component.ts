import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";

import { ProspectEquipmentEvidencePhoto, ProspectEquipmentRecord, formatProspectEquipmentReception } from "./crm-prospect-equipment.store";
import { CrmClientRecord, getCrmClients } from "./crm-clients.store";
import { buildEquipmentMatchCriteria } from "./crm-prospect-equipment-match.logic";
import { ProspectRecord, ProspectBranchRecord, getProspectById, getProspects, replaceProspects } from "./crm-prospects.store";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { CrmFollowupsApiService, CrmProspectFollowup, UpsertCrmProspectFollowupRequest } from "../../../services/crm-followups-api.service";
import { CrmProspectContact, CrmProspectsApiService, CrmUpsertProspectPayload } from "../../../services/crm-prospects-api.service";
import { CrmQuoteRecord, CrmQuotesApiService } from "../../../services/crm-quotes-api.service";
import { ConfirmationModalService } from "../../../services/confirmation-modal.service";
import { FormDraftService } from "../../../services/form-draft.service";
import { WorkEquipmentHistoryContextService } from "../../../services/work-equipment-history-context.service";
import { CrmAttachmentsApiService, ProspectAttachment } from "../../../services/crm-attachments-api.service";
import { AuthService } from "../../../services/auth.service";
import { HrPeoplePickerService } from "../../../services/hr-people-picker.service";

type DetailTab = "perfil" | "contactos-relacionados" | "acciones-comerciales" | "equipos" | "cotizacion" | "archivos" | "notas" | "trazabilidad" | "sucursales";
type ActivityTab = "actividad" | "notas" | "correos" | "llamadas" | "tareas" | "reuniones";

type RelatedContactType = "Prospecto" | "Cliente" | "Contacto";

type RelatedContactRecord = {
    key: string;
    nombre: string;
    correo: string;
    telefono: string;
    empresa: string;
    tipo: RelatedContactType;
    estado: string;
    esPrincipal: boolean;
};

type TraceabilityItem = {
    id: string;
    fecha: string;
    titulo: string;
    descripcion: string;
    responsable: string;
    icono: string;
};

type ReminderUnit = "Dia(s)" | "Hora(s)" | "Minuto(s)";

type CommercialActionStatus = "Pendiente" | "Completado";

type CommercialActionDraft = {
    companyName: string;
    relatedContactKey: string;
    actionType: string;
    followUpDate: string;
    startTime: string;
    sendReminder: boolean;
    remindBeforeValue: number;
    remindBeforeUnit: ReminderUnit;
    observation: string;
};

type CommercialActionRecord = {
    id: string;
    createdAt: string;
    prospectName: string;
    companyName: string;
    relatedContactName: string;
    actionType: string;
    followUpDate: string;
    startTime: string;
    sendReminder: boolean;
    remindBeforeValue: number;
    remindBeforeUnit: ReminderUnit;
    observation: string;
    status: CommercialActionStatus;
    registeredBy: string;
    softDelete: boolean;
    employee?: string; // [CM7] Comercial responsable
};

type ParsedProspectNote = {
    title: string;
    visibility: "publica" | "privada";
    employee: string;
    detail: string;
};

type LinkedPurchaseOrderSummary = {
    quoteCode: string;
    number: string;
    date: string;
    fileName: string;
};

type EditableProfileField = "nombre" | "correo" | "compania" | "sitioWeb" | "movil" | "telefonoOficina" | "pais" | "ciudad" | "zona" | "direccion" | "empleado" | "fuente";

type EditableProfileFieldConfig = {
    key: EditableProfileField;
    label: string;
    inputType?: "text" | "email" | "url";
};

@Component({
    selector: "app-crm-prospect-detail",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col mb-3 mb-sm-0 d-flex align-items-start gap-2">
                    <button class="btn btn-outline-secondary" type="button" (click)="goBack()" data-testid="back-btn">
                        <i class="bi bi-arrow-left me-1"></i>Volver
                    </button>
                    <div>
                        <h5 class="mb-0">{{ prospect?.nombre || "Prospecto" }}</h5>
                        <p class="text-secondary small mb-0">Ficha comercial del prospecto.</p>
                    </div>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a>
                    </li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/crm-prospectos">Prospectos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">{{ prospect?.nombre || "Detalle" }}</li>
                </ol>
            </nav>
        </div>

        <div class="container-fluid mt-3" id="main-content">
            @if (!prospect) {
                <div class="card adminuiux-card">
                    <div class="card-body py-5 text-center">
                        <h6 class="mb-2">No encontramos el prospecto solicitado.</h6>
                        <p class="text-secondary mb-3">Verifica el enlace o vuelve al listado de prospectos.</p>
                        <a class="btn btn-theme" routerLink="/app/crm-prospectos">Volver a prospectos</a>
                    </div>
                </div>
            } @else {
                <ul class="nav nav-tabs border-bottom-0 flex-nowrap overflow-auto" role="tablist" aria-label="Secciones de la ficha del prospecto">
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'perfil'" [attr.aria-selected]="activeTab === 'perfil'" (click)="activeTab = 'perfil'">Perfil</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'contactos-relacionados'" [attr.aria-selected]="activeTab === 'contactos-relacionados'" (click)="activeTab = 'contactos-relacionados'">Contactos relacionados</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'acciones-comerciales'" [attr.aria-selected]="activeTab === 'acciones-comerciales'" (click)="activeTab = 'acciones-comerciales'">Acciones comerciales</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'equipos'" [attr.aria-selected]="activeTab === 'equipos'" (click)="activeTab = 'equipos'">Equipos</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'cotizacion'" [attr.aria-selected]="activeTab === 'cotizacion'" (click)="activeTab = 'cotizacion'">Cotización</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'archivos'" [attr.aria-selected]="activeTab === 'archivos'" (click)="activeTab = 'archivos'">Archivos</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'notas'" [attr.aria-selected]="activeTab === 'notas'" (click)="activeTab = 'notas'">Notas</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'sucursales'" [attr.aria-selected]="activeTab === 'sucursales'" (click)="activeTab = 'sucursales'">Sucursales</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'trazabilidad'" [attr.aria-selected]="activeTab === 'trazabilidad'" (click)="activeTab = 'trazabilidad'">Trazabilidad</button>
                    </li>
                </ul>

                <div class="pt-3" role="tabpanel" aria-live="polite">
                    @if (activeTab === "perfil") {
                        <div class="card adminuiux-card">
                            <div class="card-header border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
                                <div>
                                    <h5 class="mb-1">Información del perfil</h5>
                                    <p class="text-secondary small mb-0">
                                        Estado <span class="badge"
                                            [class.text-bg-warning]="prospect.estado === 'Pendiente'"
                                            [class.text-bg-info]="prospect.estado === 'En proceso'"
                                            [class.text-bg-success]="prospect.estado === 'Cerrado'">{{ prospect.estado }}</span>
                                        · Valor potencial <strong>COP $ {{ prospect.valor | number:'1.0-0' }}</strong>
                                        · Empresa <strong>{{ profileFieldDisplayValue("compania") }}</strong>
                                    </p>
                                </div>
                            </div>
                            <div class="card-body">
                                @if (profileFieldErrorMessage) {
                                    <div class="alert alert-danger border py-2 px-3 mb-3">{{ profileFieldErrorMessage }}</div>
                                }
                                @if (profileFieldSuccessMessage) {
                                    <div class="alert alert-success border py-2 px-3 mb-3">{{ profileFieldSuccessMessage }}</div>
                                }

                                <div class="row gx-3 gy-3">
                                    @for (field of profileEditableFields; track field.key) {
                                        <div class="col-12 col-md-6 col-xl-4">
                                            <div class="border rounded p-3 h-100">
                                                <div class="d-flex justify-content-between align-items-center gap-2 mb-1">
                                                    <span class="small text-secondary">{{ field.label }}</span>
                                                    @if (editingProfileField !== field.key) {
                                                        <button
                                                            class="btn btn-sm btn-link text-secondary p-0"
                                                            type="button"
                                                            [disabled]="isSavingProfileField"
                                                            [title]="'Editar ' + field.label"
                                                            (click)="startProfileFieldEdit(field.key)">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                    }
                                                </div>

                                                @if (editingProfileField === field.key) {
                                                    <div class="input-group input-group-sm">
                                                        <input
                                                            class="form-control"
                                                            [type]="field.inputType || 'text'"
                                                            [(ngModel)]="editingProfileFieldValue"
                                                            [ngModelOptions]="{ standalone: true }"
                                                            [disabled]="isSavingProfileField"
                                                            [attr.placeholder]="'Editar ' + field.label" />
                                                        <button class="btn btn-theme" type="button" [disabled]="isSavingProfileField" (click)="saveProfileFieldEdit(field.key)">
                                                            <i class="bi bi-check-lg"></i>
                                                        </button>
                                                        <button class="btn btn-outline-secondary" type="button" [disabled]="isSavingProfileField" (click)="cancelProfileFieldEdit()">
                                                            <i class="bi bi-x-lg"></i>
                                                        </button>
                                                    </div>
                                                } @else {
                                                    @if (field.key === "sitioWeb" && hasProspectFieldValue(field.key)) {
                                                        <p class="mb-0 text-break"><a [href]="profileFieldDisplayValue(field.key)" target="_blank" rel="noopener noreferrer">{{ profileFieldDisplayValue(field.key) }}</a></p>
                                                    } @else {
                                                        <p class="mb-0 text-break">{{ profileFieldDisplayValue(field.key) }}</p>
                                                    }
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }

                    @if (activeTab === "contactos-relacionados") {
                        <div class="card adminuiux-card">
                            <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 class="mb-1">Contactos relacionados</h5>
                                    <p class="text-secondary small mb-0">Contactos asociados al prospecto {{ prospect.nombre }}.</p>
                                </div>
                                <div class="d-flex gap-2 align-items-center">
                                    <span class="badge text-bg-light">{{ prospectContacts.length }} contacto(s)</span>
                                    <button class="btn btn-theme btn-sm" type="button" (click)="openContactModal(null)"><i class="bi bi-plus-lg me-1"></i> Agregar contacto</button>
                                </div>
                            </div>
                            <div class="card-body">
                                @if (contactsLoadErrorMessage) {
                                    <div class="alert alert-danger border mb-3">{{ contactsLoadErrorMessage }}</div>
                                }

                                <div class="table-responsive border rounded">
                                    <table class="table align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Cargo / Rol</th>
                                                <th>Correo</th>
                                                <th>Telefono</th>
                                                <th>Notas</th>
                                                <th class="text-end">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (contact of prospectContacts; track contact.id) {
                                                <tr>
                                                    <td class="fw-semibold">{{ contact.name }}</td>
                                                    <td>{{ contact.role || "--" }}</td>
                                                    <td>{{ contact.email || "--" }}</td>
                                                    <td>{{ contact.phone || "--" }}</td>
                                                    <td class="text-secondary small">{{ contact.notes || "--" }}</td>
                                                    <td class="text-end">
                                                        <button class="btn btn-sm btn-outline-secondary me-1" type="button" (click)="openContactModal(contact)" title="Editar"><i class="bi bi-pencil"></i></button>
                                                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteContact(contact)" title="Eliminar"><i class="bi bi-trash3"></i></button>
                                                    </td>
                                                </tr>
                                            } @empty {
                                                <tr>
                                                    <td colspan="6" class="text-center py-4 text-secondary">No hay contactos registrados. Usa "Agregar contacto" para crear el primero.</td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    }

                    @if (activeTab === "archivos") {
                        <div class="card adminuiux-card">
                            <div class="card-body border-bottom d-flex gap-2 align-items-center flex-wrap">
                                <label class="btn btn-theme mb-0" style="cursor:pointer;">
                                    <i class="bi bi-plus-lg me-1"></i> Registrar archivo
                                    <input type="file" class="d-none" (change)="onFileSelected($event)" />
                                </label>
                                @if (attachmentUploadError) {
                                    <span class="small text-danger">{{ attachmentUploadError }}</span>
                                }
                                @if (isUploadingAttachment) {
                                    <span class="small text-secondary">Registrando...</span>
                                }
                            </div>
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Nombre del archivo</th>
                                            <th>Tipo</th>
                                            <th>Subido por</th>
                                            <th>Fecha</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (att of attachments; track att.id) {
                                            <tr>
                                                <td>
                                                    @if (att.storageUrl) {
                                                        <a [href]="att.storageUrl" target="_blank" rel="noopener noreferrer">{{ att.filename }}</a>
                                                    } @else {
                                                        {{ att.filename }}
                                                    }
                                                </td>
                                                <td class="small text-secondary">{{ att.mimeType || '--' }}</td>
                                                <td class="small text-secondary">{{ att.uploadedBy || '--' }}</td>
                                                <td class="small text-secondary">{{ att.createdAt }}</td>
                                                <td class="text-end">
                                                    <button class="btn btn-sm btn-outline-danger" type="button" (click)="deleteAttachment(att)" title="Eliminar">
                                                        <i class="bi bi-trash3"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        } @empty {
                                            <tr>
                                                <td colspan="5" class="text-center py-5 text-secondary">No hay archivos registrados para este prospecto.</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }

                    @if (activeTab === "acciones-comerciales") {
                        <div class="card adminuiux-card">
                            <div class="card-body border-bottom d-flex gap-2 flex-wrap">
                                <button class="btn btn-theme" type="button" (click)="openCommercialActionModal()"><i class="bi bi-plus-lg me-1"></i> Nueva acción comercial</button>
                                <button class="btn btn-outline-theme" type="button" data-testid="send-intake-documents-btn" (click)="openIntakeDocumentsModal()"><i class="bi bi-send me-1"></i> Enviar documentos de ingreso</button>
                                <button class="btn btn-outline-theme" type="button" data-testid="technical-question-btn" (click)="openTechnicalQuestionModal()"><i class="bi bi-question-circle me-1"></i> Registrar consulta técnica</button>
                                <button class="btn btn-outline-secondary" type="button"><i class="bi bi-download me-1"></i> Exportar</button>
                            </div>
                            @if (commercialActionLoadErrorMessage) {
                                <div class="px-3 pt-3">
                                    <div class="alert alert-danger border mb-0">{{ commercialActionLoadErrorMessage }}</div>
                                </div>
                            }
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Creado</th>
                                            <th>Cliente potencial</th>
                                            <th>Empresa</th>
                                            <th>Contacto relacionado</th>
                                            <th>Registrado por</th>
                                            <th>Proxima accion</th>
                                            <th>Observacion</th>
                                            <th>Estado</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (action of commercialActions; track action.id) {
                                            <tr [class.table-secondary]="action.softDelete" [class.text-muted]="action.softDelete">
                                                <td>{{ action.createdAt }}</td>
                                                <td>{{ action.prospectName }}</td>
                                                <td>{{ action.companyName || "Sin empresa" }}</td>
                                                <td>{{ action.relatedContactName }}</td>
                                                <td>{{ action.registeredBy || "Sin registrar" }}</td>
                                                <td>{{ formatCommercialActionNext(action) }}</td>
                                                <td>{{ action.observation || "Sin observacion" }}</td>
                                                <td>
                                                    <span class="badge" [class.text-bg-warning]="action.status === 'Pendiente' && !action.softDelete" [class.text-bg-success]="action.status === 'Completado' && !action.softDelete" [class.text-bg-secondary]="action.softDelete">
                                                        {{ action.softDelete ? 'Anulado' : action.status }}
                                                    </span>
                                                </td>
                                                <td class="text-end">
                                                    @if (!action.softDelete) {
                                                        <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeCommercialAction(action.id)">Anular</button>
                                                    }
                                                </td>
                                            </tr>
                                        } @empty {
                                            <tr>
                                                <td colspan="9" class="text-center py-4 text-secondary">Ningun dato disponible en esta tabla</td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    }

                    @if (activeTab === "equipos") {
                        <div class="card adminuiux-card">
                            <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 class="mb-1">Equipos asociados</h5>
                                    <p class="text-secondary small mb-0">Relación de equipos creada desde la acción "Asociar equipo" del listado de prospectos.</p>
                                </div>
                                <span class="badge text-bg-light">{{ totalAssociatedEquipment }} equipos</span>
                            </div>
                            <div class="card-body">
                                <!-- TODO: ampliar aquí la relación de equipos del lead con historial, edición y trazabilidad por recepción. -->
                                @if (equipmentRecords.length === 0) {
                                    <div class="border rounded p-4 text-center text-secondary">
                                        Este prospecto aún no tiene equipos asociados desde la vista principal de prospectos.
                                    </div>
                                } @else {
                                    @for (record of equipmentRecords; track record.id) {
                                        <div class="border rounded p-3 mb-3">
                                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                                <div>
                                                    <h6 class="mb-1">Orden de recepción {{ formatEquipmentReception(record) }}</h6>
                                                    <p class="text-secondary small mb-0">{{ record.companyName || prospect.compania }} · {{ record.contactName || prospect.nombre }}</p>
                                                </div>
                                                <span class="badge text-bg-light">{{ record.items.length }} equipo(s)</span>
                                            </div>

                                            <div class="table-responsive">
                                                <table class="table align-middle mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>Familia</th>
                                                            <th>Marca</th>
                                                            <th>Tipo</th>
                                                            <th>Serie</th>
                                                            <th>Tipo de servicio</th>
                                                            <th>Ubicación</th>
                                                            <th>Escaneo</th>
                                                            <th>Remisión / guía</th>
                                                            <th>Accesorios</th>
                                                            <th>Evidencia</th>
                                                            <th>Falla reportada</th>
                                                            <th>Historial</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        @for (item of record.items; track item.id) {
                                                            <tr>
                                                                <td>{{ item.familyName || "--" }}</td>
                                                                <td>{{ item.marca || "--" }}</td>
                                                                <td>{{ item.tipo || "--" }}</td>
                                                                <td>{{ item.serie || "--" }}</td>
                                                                <td>{{ item.serviceTypeName || "--" }}</td>
                                                                <td>{{ item.storageLocationName || "--" }}</td>
                                                                <td>{{ item.receivedIdentifier || "--" }}</td>
                                                                <td>{{ item.customerShipmentReference || "--" }}</td>
                                                                <td>{{ item.accessories || "--" }}</td>
                                                                <td>{{ item.evidencePhotos.length }} foto(s)</td>
                                                                <td>{{ item.failureDescription || "Sin detalle" }}</td>
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-sm btn-outline-theme"
                                                                        (click)="openEquipmentHistory(record.id, item.id, item.receivedIdentifier)">
                                                                        Ver historial
                                                                    </button>
                                                                </td>
                                                            </tr>

                                                            <tr class="bg-light-subtle">
                                                                <td colspan="12">
                                                                    @if (item.evidencePhotos.length === 0) {
                                                                        <div class="small text-secondary">Sin evidencia fotográfica registrada para este equipo.</div>
                                                                    } @else {
                                                                        <div class="row gx-3 gy-3">
                                                                            @for (evidence of item.evidencePhotos; track evidence.id) {
                                                                                <div class="col-12 col-xl-6">
                                                                                    <div class="border rounded p-3 bg-white h-100">
                                                                                        <div class="d-flex gap-3 align-items-start flex-wrap flex-sm-nowrap">
                                                                                            <img [src]="evidence.thumbnailDataUrl" alt="Evidencia" class="rounded" style="width: 110px; height: 110px; object-fit: cover;" />
                                                                                            <div class="small text-secondary">
                                                                                                <div class="fw-semibold text-dark mb-1">{{ evidence.fileName }}</div>
                                                                                                <div><strong>Tipo:</strong> {{ evidence.evidenceType }}</div>
                                                                                                <div><strong>Captura:</strong> {{ evidence.capturedAt | date: 'short' }} ({{ evidence.capturedAtSource === 'exif' ? 'EXIF' : 'archivo' }})</div>
                                                                                                <div><strong>Dispositivo:</strong> {{ evidence.deviceMake || '--' }} {{ evidence.deviceModel || '' }}</div>
                                                                                                <div><strong>GPS:</strong> {{ formatEquipmentEvidenceGps(evidence) }}</div>
                                                                                                <div><strong>Hash:</strong> {{ evidence.sha256 }}</div>
                                                                                                <div><strong>Nota:</strong> {{ evidence.notes || 'Sin observación' }}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            }
                                                                        </div>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    }
                                }
                            </div>
                        </div>
                    }

                    @if (activeTab === "cotizacion") {
                        <div class="card adminuiux-card">
                            <div class="card-body border-bottom d-flex gap-2 flex-wrap">
                                <a class="btn btn-theme" routerLink="/app/crm-cotizaciones"><i class="bi bi-plus-lg me-1"></i> Crear cotización</a>
                                <button class="btn btn-outline-secondary" type="button"><i class="bi bi-download me-1"></i> Exportar</button>
                            </div>
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Cotización</th>
                                            <th>Nombre</th>
                                            <th>Total</th>
                                            <th>Fecha</th>
                                            <th>Valido hasta</th>
                                            <th>Estado</th>
                                            <th class="text-end">Accion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Cotización#{{ prospectCodeLabel(prospect) }}</td>
                                            <td>{{ prospect.nombre }}</td>
                                            <td>COP ($) {{ prospect.valor }}</td>
                                            <td>{{ prospect.creado }}</td>
                                            <td>10/05/2026</td>
                                            <td><span class="badge text-bg-warning">En espera</span></td>
                                            <td class="text-end">
                                                <a class="btn btn-sm btn-outline-theme" routerLink="/app/crm-cotizaciones">Abrir</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="card-body border-top">
                                <h6 class="mb-2">Orden de compra vinculada</h6>
                                @if (linkedPurchaseOrderErrorMessage) {
                                    <div class="alert alert-danger border mb-0">{{ linkedPurchaseOrderErrorMessage }}</div>
                                } @else if (linkedPurchaseOrder) {
                                    <div class="border rounded p-3 bg-light-subtle">
                                        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
                                            <span class="badge text-bg-success">OC {{ linkedPurchaseOrder.number }}</span>
                                            <span class="small text-secondary">Cotización: {{ linkedPurchaseOrder.quoteCode }}</span>
                                        </div>
                                        <div class="small text-secondary">
                                            <div><strong>Fecha:</strong> {{ linkedPurchaseOrder.date || '--' }}</div>
                                            <div><strong>Archivo:</strong> {{ linkedPurchaseOrder.fileName || '--' }}</div>
                                        </div>
                                    </div>
                                } @else {
                                    <div class="text-secondary small">Este prospecto aún no tiene OC asociada desde cotizaciones.</div>
                                }
                            </div>
                        </div>
                    }

                    @if (activeTab === "notas") {
                        <div class="card adminuiux-card">
                            <div class="card-header border-bottom">
                                <h5 class="mb-0">Agregar nota del prospecto</h5>
                            </div>
                            <div class="card-body">
                                @if (notePersistSuccessMessage) {
                                    <div class="alert alert-success border mb-3">{{ notePersistSuccessMessage }}</div>
                                }
                                @if (notePersistErrorMessage) {
                                    <div class="alert alert-danger border mb-3">{{ notePersistErrorMessage }}</div>
                                }
                                <form>
                                    <div class="row gx-3 gy-3">
                                        <div class="col-12 col-lg-6">
                                            <label class="form-label">Titulo de la nota</label>
                                            <input class="form-control" placeholder="Ingresa el titulo de una nota" [(ngModel)]="noteTitle" name="noteTitle" />
                                        </div>
                                        <div class="col-12 col-lg-6">
                                            <label class="form-label d-block">Tipo de nota</label>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" id="notePublic" value="publica" name="noteVisibility" [(ngModel)]="noteVisibility" />
                                                <label class="form-check-label" for="notePublic">Publico</label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="radio" id="notePrivate" value="privada" name="noteVisibility" [(ngModel)]="noteVisibility" />
                                                <label class="form-check-label" for="notePrivate">Privado</label>
                                            </div>
                                        </div>
                                        <div class="col-12 col-lg-6">
                                            <label class="form-label">Empleado</label>
                                            <select class="form-select" [(ngModel)]="noteEmployee" name="noteEmployee">
                                                <option value="">Nada seleccionado</option>
                                                @for (name of noteEmployeeOptions; track name) {
                                                    <option [value]="name">{{ name }}</option>
                                                }
                                                @if (noteEmployee && !noteEmployeeOptions.includes(noteEmployee)) {
                                                    <option [value]="noteEmployee">{{ noteEmployee }}</option>
                                                }
                                            </select>
                                        </div>
                                        <div class="col-12">
                                            <label class="form-label">Detalle de la nota</label>
                                            <textarea class="form-control" rows="6" placeholder="Escribe el detalle de la nota" [(ngModel)]="noteDetail" name="noteDetail"></textarea>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-theme me-2" type="button" [disabled]="isSavingProspectNote" (click)="saveProspectNote()"><i class="bi bi-check2 me-1"></i> {{ isSavingProspectNote ? "Guardando..." : "Guardar" }}</button>
                                <button class="btn btn-link" type="button" [disabled]="isSavingProspectNote" (click)="restoreNoteDraftFromProspect()">Cancelar</button>
                            </div>
                        </div>
                    }

                    @if (activeTab === "sucursales") {
                        <div class="card adminuiux-card">
                            <div class="card-header border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 class="mb-1">Sucursales</h5>
                                    <p class="text-secondary small mb-0">Sedes registradas para {{ prospect.compania || prospect.nombre }}. {{ prospect.branches.length }} sucursal(es).</p>
                                </div>
                                <button class="btn btn-theme btn-sm" type="button" (click)="openBranchForm()">
                                    <i class="bi bi-plus-lg me-1"></i> Agregar sucursal
                                </button>
                            </div>

                            @if (branchSaveErrorMessage) {
                                <div class="px-3 pt-3">
                                    <div class="alert alert-danger border mb-0">{{ branchSaveErrorMessage }}</div>
                                </div>
                            }
                            @if (branchSaveSuccessMessage) {
                                <div class="px-3 pt-3">
                                    <div class="alert alert-success border mb-0">{{ branchSaveSuccessMessage }}</div>
                                </div>
                            }

                            @if (showBranchForm) {
                                <div class="card-body border-bottom bg-light-subtle">
                                    <h6 class="mb-3">{{ editingBranchIndex === null ? "Nueva sucursal" : "Editar sucursal" }}</h6>
                                    <div class="row gx-3 gy-2">
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Nombre de sucursal <span class="text-danger">*</span></label>
                                            <input class="form-control" [(ngModel)]="branchDraft.name" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Planta Norte" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Contacto</label>
                                            <input class="form-control" [(ngModel)]="branchDraft.contactName" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Laura Perez" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Rol del contacto</label>
                                            <input class="form-control" [(ngModel)]="branchDraft.contactRole" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Coordinador" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Correo</label>
                                            <input class="form-control" type="email" [(ngModel)]="branchDraft.email" [ngModelOptions]="{ standalone: true }" placeholder="contacto@sucursal.com" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Telefono</label>
                                            <input class="form-control" [(ngModel)]="branchDraft.phone" [ngModelOptions]="{ standalone: true }" placeholder="Ej: 3001234567" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Pais</label>
                                            <input class="form-control" [(ngModel)]="branchDraft.country" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Colombia" />
                                        </div>
                                        <div class="col-12 col-lg-4">
                                            <label class="form-label">Ciudad</label>
                                            <input class="form-control" [(ngModel)]="branchDraft.city" [ngModelOptions]="{ standalone: true }" placeholder="Ej: Bogota" />
                                        </div>
                                        <div class="col-12 col-lg-8">
                                            <label class="form-label">Direccion</label>
                                            <input class="form-control" [(ngModel)]="branchDraft.address" [ngModelOptions]="{ standalone: true }" placeholder="Calle 100 #1-10" />
                                        </div>
                                        <div class="col-12">
                                            <div class="form-check mt-1">
                                                <input class="form-check-input" type="checkbox" id="branchIsPrimary"
                                                    [(ngModel)]="branchDraft.isPrimary" [ngModelOptions]="{ standalone: true }" />
                                                <label class="form-check-label" for="branchIsPrimary">Marcar como sucursal principal</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-3 d-flex gap-2">
                                        <button class="btn btn-theme" type="button" [disabled]="isSavingBranch" (click)="saveBranch()">
                                            <i class="bi bi-check2 me-1"></i>{{ isSavingBranch ? "Guardando..." : "Guardar" }}
                                        </button>
                                        <button class="btn btn-link" type="button" [disabled]="isSavingBranch" (click)="closeBranchForm()">Cancelar</button>
                                    </div>
                                </div>
                            }

                            <div class="card-body">
                                @if (prospect.branches.length === 0) {
                                    <div class="border rounded p-4 text-center text-secondary">
                                        No hay sucursales registradas. Usa "Agregar sucursal" para crear la primera.
                                    </div>
                                } @else {
                                    <div class="row gx-3 gy-3">
                                        @for (branch of prospect.branches; track $index; let branchIdx = $index) {
                                            <div class="col-12 col-xl-6">
                                                <div class="border rounded p-3 h-100">
                                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <strong>{{ branch.name }}</strong>
                                                            @if (branch.isPrimary) {
                                                                <span class="badge text-bg-theme ms-2">Principal</span>
                                                            }
                                                        </div>
                                                        <div class="d-flex gap-1">
                                                            @if (!branch.isPrimary) {
                                                                <button class="btn btn-sm btn-outline-secondary" type="button" title="Marcar como principal" [disabled]="isSavingBranch" (click)="setPrimaryBranch(branchIdx)">
                                                                    <i class="bi bi-star"></i>
                                                                </button>
                                                            }
                                                            <button class="btn btn-sm btn-outline-secondary" type="button" title="Editar" [disabled]="isSavingBranch" (click)="editBranch(branchIdx)">
                                                                <i class="bi bi-pencil"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-outline-danger" type="button" title="Eliminar" [disabled]="isSavingBranch || branch.isPrimary" (click)="deleteBranch(branchIdx)">
                                                                <i class="bi bi-trash3"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div class="small text-secondary">
                                                        @if (branch.contactName) {
                                                            <div><i class="bi bi-person me-1"></i>{{ branch.contactName }}{{ branch.contactRole ? " · " + branch.contactRole : "" }}</div>
                                                        }
                                                        @if (branch.email) {
                                                            <div><i class="bi bi-envelope me-1"></i>{{ branch.email }}</div>
                                                        }
                                                        @if (branch.phone) {
                                                            <div><i class="bi bi-telephone me-1"></i>{{ branch.phone }}</div>
                                                        }
                                                        @if (branch.city || branch.country) {
                                                            <div><i class="bi bi-geo-alt me-1"></i>{{ branch.city }}{{ branch.country ? ", " + branch.country : "" }}</div>
                                                        }
                                                        @if (branch.address) {
                                                            <div><i class="bi bi-map me-1"></i>{{ branch.address }}</div>
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    }

                    @if (activeTab === "trazabilidad") {
                        <div class="card adminuiux-card">
                            <div class="card-header border-bottom d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Timeline comercial</h5>
                                <span class="badge text-bg-light">{{ timelineItems.length }} eventos</span>
                            </div>
                            <div class="card-body">
                                @for (item of timelineItems; track item.id; let isLast = $last) {
                                    <div class="d-flex align-items-start gap-3" [class.pb-4]="!isLast">
                                        <div class="d-flex flex-column align-items-center">
                                            <span class="avatar avatar-30 rounded-circle text-bg-theme-1">
                                                <i [class]="item.icono"></i>
                                            </span>
                                            @if (!isLast) {
                                                <span class="border-start border-2 mt-2" style="height: 52px;"></span>
                                            }
                                        </div>
                                        <div class="flex-grow-1 border rounded p-3">
                                            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                                                <h6 class="mb-0">{{ item.titulo }}</h6>
                                                <span class="small text-secondary">{{ item.fecha }}</span>
                                            </div>
                                            <p class="mb-2 small text-secondary">{{ item.descripcion }}</p>
                                            <p class="mb-0 small"><span class="text-secondary">Responsable:</span> {{ item.responsable }}</p>
                                        </div>
                                    </div>
                                } @empty {
                                    <div class="border rounded p-3 text-secondary small">No hay eventos de seguimiento registrados para este prospecto.</div>
                                }
                            </div>
                        </div>
                    }
                </div>
            }
        </div>

        @if (isContactModalOpen) {
            <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeContactModal()">
                <div class="modal-dialog modal-dialog-centered" role="document" (click)="$event.stopPropagation()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">{{ editingContact ? "Editar contacto" : "Agregar contacto" }}</h5>
                            <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeContactModal()"></button>
                        </div>
                        <div class="modal-body">
                            @if (contactModalErrorMessage) {
                                <div class="alert alert-danger border mb-3">{{ contactModalErrorMessage }}</div>
                            }
                            <div class="row gx-3 gy-3">
                                <div class="col-12">
                                    <label class="form-label">Nombre <span class="text-danger">*</span></label>
                                    <input class="form-control" placeholder="por ejemplo, Maria Garcia" [(ngModel)]="contactDraft.name" [ngModelOptions]="{ standalone: true }" maxlength="180" />
                                </div>
                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Cargo / Rol</label>
                                    <input class="form-control" placeholder="por ejemplo, Gerente de compras" [(ngModel)]="contactDraft.role" [ngModelOptions]="{ standalone: true }" maxlength="120" />
                                </div>
                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Correo electronico</label>
                                    <input class="form-control" type="email" placeholder="por ejemplo, maria@empresa.com" [(ngModel)]="contactDraft.email" [ngModelOptions]="{ standalone: true }" maxlength="180" />
                                </div>
                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Telefono</label>
                                    <input class="form-control" placeholder="por ejemplo, 3001234567" [(ngModel)]="contactDraft.phone" [ngModelOptions]="{ standalone: true }" maxlength="40" />
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Notas</label>
                                    <textarea class="form-control" rows="3" placeholder="Observaciones sobre este contacto..." [(ngModel)]="contactDraft.notes" [ngModelOptions]="{ standalone: true }" maxlength="2000"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-link" (click)="closeContactModal()">Cancelar</button>
                            <button type="button" class="btn btn-theme" [disabled]="isSavingContact" (click)="saveContact()">
                                <i class="bi bi-check-lg me-1"></i>{{ isSavingContact ? "Guardando..." : "Guardar" }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show"></div>
        }

        @if (isCommercialActionModalOpen && prospect) {
            <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeCommercialActionModal()">
                <div class="modal-dialog modal-lg modal-dialog-centered" role="document" (click)="$event.stopPropagation()">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Agregar Seguimiento</h5>
                            <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeCommercialActionModal()"></button>
                        </div>
                        <div class="modal-body">
                            @if (commercialActionValidationMessage) {
                                <div class="alert alert-warning border mb-3">{{ commercialActionValidationMessage }}</div>
                            }

                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Nombre Del Cliente Potencial</label>
                                    <div class="form-control bg-light">{{ prospect.nombre }}</div>
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Empresa asociada</label>
                                    <div class="form-control bg-light">{{ commercialActionDraft.companyName || "Sin empresa" }}</div>
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Contacto relacionado <span class="text-danger">*</span></label>
                                    <select class="form-select" [(ngModel)]="commercialActionDraft.relatedContactKey" [ngModelOptions]="{ standalone: true }">
                                        <option value="">Seleccionar contacto</option>
                                        @for (contact of relatedContacts; track contact.key) {
                                            <option [value]="contact.key">{{ contact.nombre }} ({{ contact.tipo }})</option>
                                        }
                                    </select>
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Accion comercial realizada <span class="text-danger">*</span></label>
                                    <select class="form-select" [(ngModel)]="commercialActionDraft.actionType" [ngModelOptions]="{ standalone: true }">
                                        <option value="">Seleccionar accion</option>
                                        @for (actionOption of commercialActionOptions; track actionOption) {
                                            <option [value]="actionOption">{{ actionOption }}</option>
                                        }
                                    </select>
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Seguimiento Proximo <span class="text-danger">*</span></label>
                                    <input class="form-control" type="date" [(ngModel)]="commercialActionDraft.followUpDate" [ngModelOptions]="{ standalone: true }" />
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Hora de inicio <span class="text-danger">*</span></label>
                                    <input class="form-control" type="time" [(ngModel)]="commercialActionDraft.startTime" [ngModelOptions]="{ standalone: true }" />
                                </div>

                                <div class="col-12">
                                    <div class="form-check mt-1">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            id="sendCommercialReminder"
                                            [(ngModel)]="commercialActionDraft.sendReminder"
                                            [ngModelOptions]="{ standalone: true }" />
                                        <label class="form-check-label" for="sendCommercialReminder">Enviar recordatorio</label>
                                    </div>
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">Recordar antes de <span class="text-danger">*</span></label>
                                    <input
                                        class="form-control"
                                        type="number"
                                        min="1"
                                        [(ngModel)]="commercialActionDraft.remindBeforeValue"
                                        [ngModelOptions]="{ standalone: true }"
                                        [disabled]="!commercialActionDraft.sendReminder" />
                                </div>

                                <div class="col-12 col-lg-6">
                                    <label class="form-label">&nbsp;</label>
                                    <select class="form-select" [(ngModel)]="commercialActionDraft.remindBeforeUnit" [ngModelOptions]="{ standalone: true }" [disabled]="!commercialActionDraft.sendReminder">
                                        @for (unitOption of reminderUnitOptions; track unitOption) {
                                            <option [value]="unitOption">{{ unitOption }}</option>
                                        }
                                    </select>
                                </div>

                                <div class="col-12">
                                    <label class="form-label">Observacion</label>
                                    <textarea class="form-control" rows="3" [(ngModel)]="commercialActionDraft.observation" [ngModelOptions]="{ standalone: true }"></textarea>
                                </div>
                                @if (commercialActionDraft.actionType === "Envío documentos de ingreso") {
                                    <div class="col-12 col-lg-4"><label class="form-label">Canal</label><select class="form-select" data-testid="intake-channel" [(ngModel)]="intakeChannel" [ngModelOptions]="{ standalone: true }"><option>Web</option><option>WhatsApp</option><option>Correo</option></select></div>
                                    <div class="col-12 col-lg-4"><label class="form-label">Destinatario</label><input class="form-control" data-testid="intake-recipient" [(ngModel)]="intakeRecipient" [ngModelOptions]="{ standalone: true }" /></div>
                                    <div class="col-12 col-lg-4"><label class="form-label">Documentos</label><input class="form-control" data-testid="intake-documents" value="Formato de Recepción; Condiciones Generales del Servicio" readonly /></div>
                                }
                                @if (commercialActionDraft.actionType === "Consulta técnica del cliente") {
                                    <div class="col-12 col-lg-4"><label class="form-label">Técnico asignado</label><input class="form-control" data-testid="technical-assignee" [(ngModel)]="technicalAssignee" [ngModelOptions]="{ standalone: true }" /></div>
                                    <div class="col-12 col-lg-4"><label class="form-label">SLA</label><input class="form-control" type="datetime-local" data-testid="technical-sla" [(ngModel)]="technicalSla" [ngModelOptions]="{ standalone: true }" /></div>
                                    <div class="col-12 col-lg-4"><label class="form-label">Estado</label><select class="form-select" data-testid="technical-status" [(ngModel)]="technicalStatus" [ngModelOptions]="{ standalone: true }"><option>Pendiente</option><option>Respondida</option><option>Cerrada</option></select></div>
                                    <div class="col-12"><label class="form-label">Respuesta técnica centralizada por Comercial</label><textarea class="form-control" data-testid="technical-response" [(ngModel)]="technicalResponse" [ngModelOptions]="{ standalone: true }"></textarea></div>
                                }
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-link" [disabled]="isSavingCommercialAction" (click)="closeCommercialActionModal()">Cerrar</button>
                            <button type="button" class="btn btn-danger" data-testid="commercial-action-save-btn" [disabled]="isSavingCommercialAction" (click)="saveCommercialAction(false)"><i class="bi bi-check-lg me-1"></i>{{ isSavingCommercialAction ? "Guardando..." : "Guardar" }}</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show"></div>
        }
    `,
})
export class CrmProspectDetailComponent {
    technicalAssignee = "";
    technicalSla = "";
    technicalStatus = "Pendiente";
    technicalResponse = "";
    prospect: ProspectRecord | undefined;
    activeTab: DetailTab = "perfil";
    profilePanel: "descripcion" | "actividades" = "descripcion";
    activeActivityTab: ActivityTab = "actividad";
    activitySearchTerm = "";
    editingProfileField: EditableProfileField | null = null;
    editingProfileFieldValue = "";
    isSavingProfileField = false;
    profileFieldErrorMessage = "";
    profileFieldSuccessMessage = "";
    readonly profileEditableFields: EditableProfileFieldConfig[] = [
        { key: "nombre", label: "Nombre del prospecto" },
        { key: "correo", label: "Correo electronico", inputType: "email" },
        { key: "compania", label: "Nombre de la compania" },
        { key: "sitioWeb", label: "Sitio web", inputType: "url" },
        { key: "movil", label: "Movil" },
        { key: "telefonoOficina", label: "Telefono de oficina" },
        { key: "pais", label: "Pais" },
        { key: "ciudad", label: "Ciudad" },
        { key: "zona", label: "Zona" },
        { key: "direccion", label: "Direccion" },
        { key: "empleado", label: "Empleado asignado" },
        { key: "fuente", label: "Fuente" },
    ];

    noteTitle = "";
    noteVisibility: "publica" | "privada" = "privada";
    // Empleados activos de RRHH con rol comercial (el CRM es territorio comercial).
    // El valor histórico guardado se pinta siempre desde la plantilla, incluso si
    // esa persona hoy está inactiva o cambió de rol.
    noteEmployeeOptions: string[] = [];
    noteEmployee = "";
    noteDetail = "";
    notePersistSuccessMessage = "";
    notePersistErrorMessage = "";
    isSavingProspectNote = false;

    linkedPurchaseOrder: LinkedPurchaseOrderSummary | null = null;
    linkedPurchaseOrderErrorMessage = "";

    // ── Contacts ──────────────────────────────────────────────────────────────
    prospectContacts: CrmProspectContact[] = [];
    contactsLoadErrorMessage = "";
    isContactModalOpen = false;
    isSavingContact = false;
    contactModalErrorMessage = "";
    editingContact: CrmProspectContact | null = null;
    contactDraft = { name: "", email: "", phone: "", role: "", notes: "" };
    intakeChannel = "Web";
    intakeRecipient = "";

    // ── Attachments ───────────────────────────────────────────────────────────
    attachments: ProspectAttachment[] = [];
    isUploadingAttachment = false;
    attachmentUploadError = "";

    // ── Branches ──────────────────────────────────────────────────────────────
    showBranchForm = false;
    editingBranchIndex: number | null = null;
    isSavingBranch = false;
    branchSaveErrorMessage = "";
    branchSaveSuccessMessage = "";
    branchDraft = { name: "", contactName: "", contactRole: "", email: "", phone: "", country: "", city: "", address: "", isPrimary: false };

    private readonly crmFollowupsApi = inject(CrmFollowupsApiService);
    private readonly authService = inject(AuthService);
    private readonly crmProspectsApi = inject(CrmProspectsApiService);
    private readonly crmQuotesApi = inject(CrmQuotesApiService);
    private readonly crmEquipmentApi = inject(CrmEquipmentApiService);
    private readonly crmAttachmentsApi = inject(CrmAttachmentsApiService);
    private readonly confirmationModal = inject(ConfirmationModalService);
    private readonly formDraftService = inject(FormDraftService);
    private readonly hrPeople = inject(HrPeoplePickerService);
    private routeSub?: Subscription;
    private stopDraftWatch: () => void = () => undefined;
    private activeDraftKey = "";

    isCommercialActionModalOpen = false;
    commercialActionValidationMessage = "";
    commercialActionLoadErrorMessage = "";
    isSavingCommercialAction = false;
    editingActionId: string | null = null; // [CM6] ID de la acción en edición
    commercialActions: CommercialActionRecord[] = [];
    commercialActionDraft: CommercialActionDraft = this.createCommercialActionDraft();
    readonly reminderUnitOptions: ReminderUnit[] = ["Dia(s)", "Hora(s)", "Minuto(s)"];
    readonly commercialActionOptions: string[] = [
        "Llamada telefonica",
        "Visita presencial",
        "Correo de seguimiento",
        "Whatsapp de seguimiento",
        "Reenvío de cotización",
        "Recoleccion de equipo",
        "Entrega de cotización",
        "Revision tecnica con cliente",
        "Confirmacion de orden de compra",
        "Seguimiento post despacho",
    ];

    timelineItems: TraceabilityItem[] = [];

    private readonly cdr = inject(ChangeDetectorRef);

    goBack(): void {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
            return;
        }

        this.router.navigateByUrl("/app/crm-prospectos");
    }

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly equipmentHistoryContextService: WorkEquipmentHistoryContextService,
    ) {
        this.routeSub = this.route.paramMap.subscribe((params) => {
            const rawId = params.get("id") ?? "";
            this.resolveProspect(rawId);
            this.setupDraftPersistence(rawId);
        });
    }

    // Resolves the prospect from the route param, which may be either the local numeric id
    // (links from the prospects list) or the backend UUID (links from global search). When the
    // in-memory store is empty -- e.g. the user navigated here directly from search without
    // visiting the list -- it loads prospects from the API first, then resolves again.
    private resolveProspect(rawId: string): void {
        const found = this.findProspectInStore(rawId);
        if (found) {
            this.applyResolvedProspect(found);
            return;
        }

        this.crmProspectsApi.listProspects().subscribe({
            next: (items) => {
                replaceProspects(items.map((record) => ({ ...record })));
                this.applyResolvedProspect(this.findProspectInStore(rawId));
                this.cdr.detectChanges();
            },
            error: () => {
                this.applyResolvedProspect(undefined);
                this.cdr.detectChanges();
            },
        });
    }

    private findProspectInStore(rawId: string): ProspectRecord | undefined {
        const trimmed = rawId.trim();
        if (!trimmed) {
            return undefined;
        }
        // El id ya es el uuid del backend; el intento numérico queda como
        // compat con enlaces antiguos guardados con el id sintético.
        if (/^\d+$/.test(trimmed)) {
            const legacyIndex = Number(trimmed);
            const byPosition = getProspects().find((prospect, index) => index + 1 === legacyIndex);
            if (byPosition) {
                return byPosition;
            }
        }
        return getProspectById(trimmed);
    }

    prospectCodeLabel(prospect: ProspectRecord): string {
        const key = String(prospect?.backendId ?? prospect?.id ?? "").trim();
        return key ? key.slice(0, 8).toUpperCase() : "--";
    }

    private applyResolvedProspect(prospect: ProspectRecord | undefined): void {
        this.prospect = prospect;
        this.editingProfileField = null;
        this.editingProfileFieldValue = "";
        this.isSavingProfileField = false;
        this.profileFieldErrorMessage = "";
        this.profileFieldSuccessMessage = "";
        this.attachments = [];
        this.attachmentUploadError = "";
        if (prospect?.backendId) {
            this.loadContactsFromApi(prospect.backendId);
            this.loadFollowupsFromApi(prospect.backendId);
            this.loadLinkedPurchaseOrderFromApi(prospect);
            this.loadAttachmentsFromApi(prospect.backendId);
            this.loadEquipmentRecordsFromApi(prospect);
            if (!this.noteTitle.trim() && !this.noteEmployee.trim() && !this.noteDetail.trim()) {
                this.restoreNoteDraftFromProspect();
            }
            // El empleado de la nota sale de RRHH activo con contexto comercial: un
            // técnico no escribe notas comerciales y un comercial no hace taller.
            // Sin empleados comerciales activos el select queda vacío a propósito —
            // la respuesta es crearlo en RRHH, no inventarlo aquí.
            void this.hrPeople.names("comercial").then((names) => {
                this.noteEmployeeOptions = names;
            });
            return;
        }

        this.prospectContacts = [];
        this.commercialActions = [];
        this.timelineItems = [];
        this.linkedPurchaseOrder = null;
        this.linkedPurchaseOrderErrorMessage = "";
        this.equipmentRecords = [];
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
        this.stopDraftWatch();
    }

    // ── Branch management ─────────────────────────────────────────────────────
    openBranchForm(): void {
        this.editingBranchIndex = null;
        this.branchDraft = { name: "", contactName: "", contactRole: "", email: "", phone: "", country: "", city: "", address: "", isPrimary: false };
        this.branchSaveErrorMessage = "";
        this.branchSaveSuccessMessage = "";
        this.showBranchForm = true;
    }

    editBranch(index: number): void {
        const branch = this.prospect?.branches?.[index];
        if (!branch) return;
        this.editingBranchIndex = index;
        this.branchDraft = {
            name: branch.name,
            contactName: branch.contactName,
            contactRole: branch.contactRole,
            email: branch.email,
            phone: branch.phone,
            country: branch.country,
            city: branch.city,
            address: branch.address,
            isPrimary: branch.isPrimary,
        };
        this.branchSaveErrorMessage = "";
        this.branchSaveSuccessMessage = "";
        this.showBranchForm = true;
    }

    closeBranchForm(): void {
        this.showBranchForm = false;
        this.editingBranchIndex = null;
        this.branchSaveErrorMessage = "";
    }

    setPrimaryBranch(index: number): void {
        const prospect = this.prospect;
        if (!prospect?.backendId || this.isSavingBranch) return;
        const updatedBranches = (prospect.branches ?? []).map((b, i) => ({ ...b, isPrimary: i === index }));
        this.persistBranches(prospect, updatedBranches, "Sucursal principal actualizada.");
    }

    deleteBranch(index: number): void {
        const prospect = this.prospect;
        if (!prospect?.backendId || this.isSavingBranch) return;
        const branch = prospect.branches?.[index];
        if (!branch || branch.isPrimary) return;
        const updatedBranches = (prospect.branches ?? []).filter((_, i) => i !== index);
        this.persistBranches(prospect, updatedBranches, "Sucursal eliminada.");
    }

    saveBranch(): void {
        const name = this.branchDraft.name.trim();
        if (!name) {
            this.branchSaveErrorMessage = "El nombre de la sucursal es requerido.";
            return;
        }

        const email = this.branchDraft.email.trim();
        if (email && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
            this.branchSaveErrorMessage = "El correo no tiene un formato valido.";
            return;
        }

        const prospect = this.prospect;
        if (!prospect?.backendId) {
            this.branchSaveErrorMessage = "No se puede guardar: el prospecto no tiene ID de backend.";
            return;
        }

        const newBranch = {
            name,
            contactName: this.branchDraft.contactName.trim(),
            contactRole: this.branchDraft.contactRole.trim(),
            email,
            phone: this.branchDraft.phone.trim(),
            country: this.branchDraft.country.trim(),
            city: this.branchDraft.city.trim(),
            address: this.branchDraft.address.trim(),
            isPrimary: this.branchDraft.isPrimary,
        };

        let updatedBranches = [...(prospect.branches ?? [])];

        if (this.editingBranchIndex !== null) {
            updatedBranches[this.editingBranchIndex] = { ...updatedBranches[this.editingBranchIndex], ...newBranch };
        } else {
            updatedBranches = [...updatedBranches, newBranch];
        }

        // Ensure at most one primary
        if (newBranch.isPrimary) {
            updatedBranches = updatedBranches.map((b, i) => {
                const targetIndex = this.editingBranchIndex !== null ? this.editingBranchIndex : updatedBranches.length - 1;
                return { ...b, isPrimary: i === targetIndex };
            });
        }

        // If no primary at all, assign first
        if (!updatedBranches.some((b) => b.isPrimary) && updatedBranches.length > 0) {
            updatedBranches[0] = { ...updatedBranches[0], isPrimary: true };
        }

        const message = this.editingBranchIndex !== null ? "Sucursal actualizada correctamente." : "Sucursal agregada correctamente.";
        this.persistBranches(prospect, updatedBranches, message);
    }

    private persistBranches(prospect: ProspectRecord, branches: ProspectBranchRecord[], successMessage: string): void {
        // Build payload from the current prospect then override branches.
        const base = this.buildProspectUpdatePayload(prospect, "nombre", prospect.nombre);
        const payload: CrmUpsertProspectPayload = {
            ...base,
            branches: branches.map((b) => ({
                name: String(b.name ?? "").trim(),
                contactName: String(b.contactName ?? "").trim(),
                contactRole: String(b.contactRole ?? "").trim(),
                email: String(b.email ?? "").trim(),
                phone: String(b.phone ?? "").trim(),
                country: String(b.country ?? "").trim(),
                city: String(b.city ?? "").trim(),
                address: String(b.address ?? "").trim(),
                isPrimary: Boolean(b.isPrimary),
            })),
        };

        this.branchSaveErrorMessage = "";
        this.branchSaveSuccessMessage = "";
        this.isSavingBranch = true;

        this.crmProspectsApi.updateProspect(prospect.backendId, payload).subscribe({
            next: (updated) => {
                this.isSavingBranch = false;
                this.updateProspectInStore(updated);
                this.closeBranchForm();
                this.branchSaveSuccessMessage = successMessage;
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.isSavingBranch = false;
                this.branchSaveErrorMessage = err?.message || "No se pudo guardar la sucursal.";
                this.cdr.detectChanges();
            },
        });
    }

    // ── Attachments ───────────────────────────────────────────────────────────
    private loadAttachmentsFromApi(prospectBackendId: string): void {
        this.crmAttachmentsApi.listAttachments(prospectBackendId).subscribe({
            next: (items) => { this.attachments = items; this.cdr.detectChanges(); },
            error: () => { this.attachments = []; this.cdr.detectChanges(); },
        });
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input?.files?.[0];
        const backendId = this.prospect?.backendId;
        if (!file || !backendId) return;

        this.isUploadingAttachment = true;
        this.attachmentUploadError = "";

        // The backend stores metadata only; for actual file storage a cloud bucket endpoint
        // would be wired here. For now we register the filename and size.
        this.crmAttachmentsApi.createAttachment(backendId, {
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
            fileSizeBytes: file.size,
            storageUrl: "",
            uploadedBy: "",
        }).subscribe({
            next: (att) => {
                this.attachments = [att, ...this.attachments];
                this.isUploadingAttachment = false;
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.isUploadingAttachment = false;
                this.attachmentUploadError = err?.message || "No se pudo registrar el archivo.";
                this.cdr.detectChanges();
            },
        });
    }

    deleteAttachment(att: ProspectAttachment): void {
        const backendId = this.prospect?.backendId;
        if (!backendId) return;
        this.crmAttachmentsApi.deleteAttachment(backendId, att.id).subscribe({
            next: () => { this.attachments = this.attachments.filter((a) => a.id !== att.id); this.cdr.detectChanges(); },
            error: () => { this.cdr.detectChanges(); },
        });
    }

    equipmentHistoryReference(recordId: string, itemId: string): string {
        const safeRecordId = String(recordId ?? "").trim();
        const safeItemId = String(itemId ?? "").trim();
        return `${safeRecordId}::${safeItemId}`;
    }

    openEquipmentHistory(recordId: string, itemId: string, identifier: string): void {
        const reference = this.equipmentHistoryReference(recordId, itemId);
        const safeIdentifier = String(identifier ?? "").trim();
        this.equipmentHistoryContextService.setContext({
            reference,
            identifier: safeIdentifier,
            origin: "crm-detail",
        });

        void this.router.navigate(["/app/work-equipment-history"]);
    }

    startProfileFieldEdit(field: EditableProfileField): void {
        if (!this.prospect || this.isSavingProfileField) {
            return;
        }

        this.editingProfileField = field;
        this.editingProfileFieldValue = this.normalizeProfileFieldValue(this.readProfileFieldRawValue(field));
        this.profileFieldErrorMessage = "";
        this.profileFieldSuccessMessage = "";
    }

    cancelProfileFieldEdit(): void {
        if (this.isSavingProfileField) {
            return;
        }

        this.editingProfileField = null;
        this.editingProfileFieldValue = "";
        this.profileFieldErrorMessage = "";
    }

    saveProfileFieldEdit(field: EditableProfileField): void {
        if (this.editingProfileField !== field) {
            this.startProfileFieldEdit(field);
            return;
        }

        const prospect = this.prospect;
        if (!prospect?.backendId) {
            this.profileFieldSuccessMessage = "";
            this.profileFieldErrorMessage = "No se puede guardar: el prospecto no tiene ID de backend.";
            return;
        }

        const normalizedValue = this.normalizeProfileFieldValue(this.editingProfileFieldValue);
        if (field === "nombre" && !normalizedValue) {
            this.profileFieldSuccessMessage = "";
            this.profileFieldErrorMessage = "El nombre del prospecto es requerido.";
            return;
        }

        if (field === "correo" && normalizedValue && !this.isValidEmail(normalizedValue)) {
            this.profileFieldSuccessMessage = "";
            this.profileFieldErrorMessage = "El correo electrónico no tiene un formato válido.";
            return;
        }

        if (field === "sitioWeb" && normalizedValue && !/^https?:\/\//i.test(normalizedValue)) {
            this.profileFieldSuccessMessage = "";
            this.profileFieldErrorMessage = "El sitio web debe iniciar con http:// o https://.";
            return;
        }

        const payload = this.buildProspectUpdatePayload(prospect, field, normalizedValue);

        this.profileFieldErrorMessage = "";
        this.profileFieldSuccessMessage = "";
        this.isSavingProfileField = true;

        this.crmProspectsApi.updateProspect(prospect.backendId, payload).subscribe({
            next: (updatedProspect) => {
                this.isSavingProfileField = false;
                this.updateProspectInStore(updatedProspect);
                this.editingProfileField = null;
                this.editingProfileFieldValue = "";
                this.profileFieldErrorMessage = "";
                this.profileFieldSuccessMessage = `${this.profileFieldLabel(field)} actualizado correctamente.`;
                if (this.prospect) {
                    this.loadLinkedPurchaseOrderFromApi(this.prospect);
                }
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.isSavingProfileField = false;
                this.profileFieldSuccessMessage = "";
                this.profileFieldErrorMessage = error?.message || "No se pudo actualizar el campo del prospecto.";
                this.cdr.detectChanges();
            },
        });
    }

    profileFieldDisplayValue(field: EditableProfileField): string {
        const normalized = this.normalizeProfileFieldValue(this.readProfileFieldRawValue(field));
        return normalized || "--";
    }

    hasProspectFieldValue(field: EditableProfileField): boolean {
        return this.profileFieldDisplayValue(field) !== "--";
    }

    openContactModal(contact: CrmProspectContact | null): void {
        this.editingContact = contact;
        this.contactModalErrorMessage = "";
        if (contact) {
            this.contactDraft = { name: contact.name, email: contact.email, phone: contact.phone, role: contact.role, notes: contact.notes };
        } else {
            this.contactDraft = { name: "", email: "", phone: "", role: "", notes: "" };
        }
        this.isContactModalOpen = true;
    }

    closeContactModal(): void {
        this.isContactModalOpen = false;
        this.contactModalErrorMessage = "";
    }

    saveContact(): void {
        const name = this.contactDraft.name.trim();
        if (!name) {
            this.contactModalErrorMessage = "El nombre del contacto es requerido.";
            return;
        }

        const email = this.contactDraft.email.trim();
        if (email && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
            this.contactModalErrorMessage = "El correo electrónico no tiene un formato válido.";
            return;
        }

        const backendId = this.prospect?.backendId;
        if (!backendId) {
            this.contactModalErrorMessage = "No se puede guardar: el prospecto no tiene ID de backend.";
            return;
        }

        this.contactModalErrorMessage = "";
        this.isSavingContact = true;

        const payload = {
            name,
            email,
            phone: this.contactDraft.phone.trim(),
            role: this.contactDraft.role.trim(),
            notes: this.contactDraft.notes.trim(),
        };

        const operation$ = this.editingContact
            ? this.crmProspectsApi.updateProspectContact(backendId, this.editingContact.id, payload)
            : this.crmProspectsApi.createProspectContact(backendId, payload);

        operation$.subscribe({
            next: () => {
                this.isSavingContact = false;
                this.closeContactModal();
                this.loadContactsFromApi(backendId);
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.isSavingContact = false;
                this.contactModalErrorMessage = err?.message || "No se pudo guardar el contacto.";
                this.cdr.detectChanges();
            },
        });
    }

    async deleteContact(contact: CrmProspectContact): Promise<void> {
        const backendId = this.prospect?.backendId;
        if (!backendId) return;

        const confirmed = await this.confirmationModal.open({
            title: "Eliminar contacto",
            message: `¿Eliminar el contacto "${contact.name}"? Esta accion no se puede deshacer.`,
            confirmText: "Si, eliminar",
            cancelText: "Cancelar",
            variant: "danger",
        });

        if (!confirmed) {
            return;
        }

        this.crmProspectsApi.deleteProspectContact(backendId, contact.id).subscribe({
            next: () => { this.loadContactsFromApi(backendId); this.cdr.detectChanges(); },
            error: () => { this.contactsLoadErrorMessage = "No se pudo eliminar el contacto."; this.cdr.detectChanges(); },
        });
    }

    private loadContactsFromApi(prospectBackendId: string): void {
        this.contactsLoadErrorMessage = "";
        this.crmProspectsApi.listProspectContacts(prospectBackendId).subscribe({
            next: (contacts) => { this.prospectContacts = contacts; this.cdr.detectChanges(); },
            error: () => { this.contactsLoadErrorMessage = "No se pudieron cargar los contactos desde backend."; this.cdr.detectChanges(); },
        });
    }

    private loadFollowupsFromApi(prospectBackendId: string): void {
        this.commercialActionLoadErrorMessage = "";
        this.crmFollowupsApi.listProspectFollowups(prospectBackendId).subscribe({
            next: (items) => {
                this.commercialActions = [...items]
                    .sort((a, b) => this.followupSortValue(b.fecha, b.hora) - this.followupSortValue(a.fecha, a.hora))
                    .map((item) => this.mapFollowupToCommercialAction(item));
                this.refreshTimelineFromCommercialActions();
                this.cdr.detectChanges();
            },
            error: () => {
                this.commercialActions = [];
                this.timelineItems = [];
                this.commercialActionLoadErrorMessage = "No se pudieron cargar los seguimientos desde backend.";
                this.cdr.detectChanges();
            },
        });
    }

    private loadLinkedPurchaseOrderFromApi(prospect: ProspectRecord): void {
        this.linkedPurchaseOrderErrorMessage = "";
        this.crmQuotesApi.listQuotes({ limit: 200 }).subscribe({
            next: (items) => {
                const linkedQuote = this.findLinkedPurchaseOrderQuote(items, prospect);
                this.linkedPurchaseOrder = linkedQuote
                    ? {
                        quoteCode: linkedQuote.codigo,
                        number: String(linkedQuote.purchaseOrderNumber ?? "").trim(),
                        date: String(linkedQuote.purchaseOrderDate ?? "").trim(),
                        fileName: String(linkedQuote.purchaseOrderFileName ?? "").trim(),
                    }
                    : null;
                this.cdr.detectChanges();
            },
            error: () => {
                this.linkedPurchaseOrder = null;
                this.linkedPurchaseOrderErrorMessage = "No se pudo cargar OC asociada desde cotizaciones.";
                this.cdr.detectChanges();
            },
        });
    }

    private findLinkedPurchaseOrderQuote(items: CrmQuoteRecord[], prospect: ProspectRecord): CrmQuoteRecord | null {
        const prospectName = prospect.nombre.trim().toLowerCase();
        const companyName = prospect.compania.trim().toLowerCase();

        const linked = items
            .filter((item) => String(item.purchaseOrderNumber ?? "").trim() !== "")
            .filter((item) => {
                const quoteProspect = String(item.prospecto ?? "").trim().toLowerCase();
                const quoteCompany = String(item.empresa ?? "").trim().toLowerCase();

                if (prospectName && quoteProspect && prospectName === quoteProspect) {
                    return true;
                }

                return Boolean(companyName && quoteCompany && companyName === quoteCompany);
            })
            .sort((a, b) => this.quoteSortValue(b) - this.quoteSortValue(a));

        return linked[0] ?? null;
    }

    private quoteSortValue(item: CrmQuoteRecord): number {
        const updatedAt = new Date(String(item.updatedAt ?? "")).getTime();
        if (Number.isFinite(updatedAt) && updatedAt > 0) {
            return updatedAt;
        }

        const createdAt = new Date(String(item.createdAt ?? "")).getTime();
        return Number.isFinite(createdAt) && createdAt > 0 ? createdAt : 0;
    }

    private commercialActionDraftBaseline: CommercialActionDraft = this.createCommercialActionDraft();

    openCommercialActionModal(): void {
        this.commercialActionValidationMessage = "";
        this.commercialActionDraft = this.createCommercialActionDraft(this.prospect);

        if (!this.relatedContacts.some((contact) => contact.key === this.commercialActionDraft.relatedContactKey)) {
            this.commercialActionDraft.relatedContactKey = this.relatedContacts[0]?.key ?? "";
        }

        this.commercialActionDraftBaseline = { ...this.commercialActionDraft };

        this.isCommercialActionModalOpen = true;
    }

    openIntakeDocumentsModal(): void {
        this.openCommercialActionModal();
        this.commercialActionDraft.actionType = "Envío documentos de ingreso";
        this.commercialActionDraft.observation = "Formato de Recepción; Condiciones Generales del Servicio";
        this.intakeRecipient = this.prospectContacts[0]?.email || this.prospect?.correo || "";
    }

    openTechnicalQuestionModal(): void {
        this.openCommercialActionModal();
        this.commercialActionDraft.actionType = "Consulta técnica del cliente";
        this.technicalAssignee = "";
        this.technicalSla = "";
        this.technicalStatus = "Pendiente";
        this.technicalResponse = "";
    }

    closeCommercialActionModal(): void {
        if (!this.isCommercialActionModalOpen || this.isSavingCommercialAction) {
            return;
        }

        if (!this.hasCommercialActionDraftChanges()) {
            this.closeCommercialActionModalNow();
            return;
        }

        this.saveCommercialAction(true);
    }

    private closeCommercialActionModalNow(): void {
        this.isCommercialActionModalOpen = false;
        this.commercialActionValidationMessage = "";
    }

    private hasCommercialActionDraftChanges(): boolean {
        const baseline = this.commercialActionDraftBaseline;
        const draft = this.commercialActionDraft;

        return (
            draft.companyName.trim() !== baseline.companyName.trim() ||
            draft.relatedContactKey !== baseline.relatedContactKey ||
            draft.actionType.trim() !== baseline.actionType.trim() ||
            draft.followUpDate !== baseline.followUpDate ||
            draft.startTime !== baseline.startTime ||
            draft.sendReminder !== baseline.sendReminder ||
            Number(draft.remindBeforeValue) !== Number(baseline.remindBeforeValue) ||
            draft.remindBeforeUnit !== baseline.remindBeforeUnit ||
            draft.observation.trim() !== baseline.observation.trim()
        );
    }

    saveCommercialAction(closeModalAfterSave = true): void {
        const backendId = this.prospect?.backendId;
        if (!backendId) {
            this.commercialActionValidationMessage = "No se puede guardar: el prospecto no tiene ID de backend.";
            return;
        }

        const actionType = this.commercialActionDraft.actionType.trim();
        const companyName = this.commercialActionDraft.companyName.trim();
        const observation = this.commercialActionDraft.actionType === "Envío documentos de ingreso"
            ? JSON.stringify({ documents: ["Formato de Recepción", "Condiciones Generales del Servicio"], channel: this.intakeChannel, recipient: this.intakeRecipient.trim(), sentAt: new Date().toISOString(), responsible: this.authService.getCurrentUserName() })
            : this.commercialActionDraft.actionType === "Consulta técnica del cliente"
                ? JSON.stringify({ question: this.commercialActionDraft.observation.trim(), assignedTo: this.technicalAssignee.trim(), sla: this.technicalSla, response: this.technicalResponse.trim(), status: this.technicalStatus, centralizedBy: this.authService.getCurrentUserName() })
            : this.commercialActionDraft.observation.trim();
        const reminderValue = Number(this.commercialActionDraft.remindBeforeValue);
        const relatedContact = this.relatedContacts.find((contact) => contact.key === this.commercialActionDraft.relatedContactKey);

        if (!actionType || !this.commercialActionDraft.followUpDate || !this.commercialActionDraft.startTime) {
            this.commercialActionValidationMessage = "Completa accion comercial realizada, seguimiento proximo y hora de inicio.";
            return;
        }

        if (!companyName) {
            this.commercialActionValidationMessage = "El cliente potencial debe tener empresa para crear la accion comercial.";
            return;
        }

        if (this.commercialActionDraft.actionType === "Envío documentos de ingreso" && !this.intakeRecipient.trim()) {
            this.commercialActionValidationMessage = "Indica el destinatario de los documentos de ingreso.";
            return;
        }
        if (this.commercialActionDraft.actionType === "Consulta técnica del cliente" && (!this.technicalAssignee.trim() || !this.technicalSla || !this.commercialActionDraft.observation.trim())) {
            this.commercialActionValidationMessage = "Completa pregunta, técnico asignado y SLA de la consulta.";
            return;
        }

        if (!relatedContact) {
            this.commercialActionValidationMessage = "Selecciona un contacto relacionado para la accion comercial.";
            return;
        }

        if (this.commercialActionDraft.sendReminder && (!Number.isFinite(reminderValue) || reminderValue <= 0)) {
            this.commercialActionValidationMessage = "Debes indicar un valor valido en 'Recordar antes de'.";
            return;
        }

        const payload: UpsertCrmProspectFollowupRequest = {
            tipo: actionType,
            fecha: this.commercialActionDraft.followUpDate,
            hora: this.commercialActionDraft.startTime,
            recordatorio: this.commercialActionDraft.sendReminder ? `${Math.trunc(reminderValue)} ${this.commercialActionDraft.remindBeforeUnit}` : "",
            observacion: observation,
            estado: "Pendiente",
            registradoPor: this.authService.getCurrentUserName(),
            contactoNombre: relatedContact?.nombre ?? "",
        };

        this.commercialActionValidationMessage = "";
        this.commercialActionLoadErrorMessage = "";
        this.isSavingCommercialAction = true;

        this.crmFollowupsApi.createProspectFollowup(backendId, payload).subscribe({
            next: () => {
                this.isSavingCommercialAction = false;
                this.commercialActionDraft = this.createCommercialActionDraft(this.prospect);
                this.commercialActionDraftBaseline = { ...this.commercialActionDraft };
                if (closeModalAfterSave) {
                    this.closeCommercialActionModalNow();
                }
                this.loadFollowupsFromApi(backendId);
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.isSavingCommercialAction = false;
                this.commercialActionValidationMessage = error?.message || "No se pudo guardar el seguimiento.";
                this.cdr.detectChanges();
            },
        });
    }

    removeCommercialAction(actionId: string): void {
        const backendId = this.prospect?.backendId;
        if (!backendId) {
            return;
        }

        this.crmFollowupsApi.deleteProspectFollowup(backendId, actionId).subscribe({
            next: () => {
                this.commercialActions = this.commercialActions.filter((action) => action.id !== actionId);
                this.refreshTimelineFromCommercialActions();
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.commercialActionLoadErrorMessage = error?.message || "No se pudo eliminar el seguimiento.";
                this.cdr.detectChanges();
            },
        });
    }

    formatCommercialActionNext(action: CommercialActionRecord): string {
        return `${action.actionType} - ${this.formatIsoDate(action.followUpDate)} ${action.startTime}`;
    }

    equipmentRecords: ProspectEquipmentRecord[] = [];

    get totalAssociatedEquipment(): number {
        return this.equipmentRecords.reduce((acc, record) => acc + record.items.length, 0);
    }

    private loadEquipmentRecordsFromApi(prospect: ProspectRecord): void {
        const criteria = buildEquipmentMatchCriteria(prospect);
        this.crmEquipmentApi.listRecords(criteria).subscribe({
            next: (items) => {
                this.equipmentRecords = items;
                this.cdr.detectChanges();
            },
            error: () => {
                this.equipmentRecords = [];
                this.cdr.detectChanges();
            },
        });
    }

    get companyLabel(): string {
        const companyName = this.prospect?.compania?.trim() ?? "";
        return companyName || "Sin empresa";
    }

    get relatedContacts(): RelatedContactRecord[] {
        if (!this.prospect) {
            return [];
        }

        const contacts: RelatedContactRecord[] = [];
        const usedKeys = new Set<string>();

        const registerContact = (contact: RelatedContactRecord): void => {
            if (usedKeys.has(contact.key)) {
                return;
            }

            usedKeys.add(contact.key);
            contacts.push(contact);
        };

        // Un prospecto no es un contacto operativo por sí mismo. Las acciones
        // comerciales requieren una persona real registrada (mantenimiento o
        // compras); usar el prospecto como sustituto permitía agendar visitas
        // sin interlocutor y violaba COM-02.
        this.prospectContacts.forEach((contact) => {
            registerContact({
                key: `contact-${contact.id}`,
                nombre: contact.name,
                correo: contact.email,
                telefono: contact.phone,
                empresa: this.prospect?.compania || "",
                tipo: "Contacto",
                estado: "Activo",
                esPrincipal: false,
            });
        });

        return contacts;
    }

    formatEquipmentReception(record: ProspectEquipmentRecord): string {
        return formatProspectEquipmentReception(record);
    }

    formatEquipmentEvidenceGps(evidence: ProspectEquipmentEvidencePhoto): string {
        if (!evidence.gpsAvailable || evidence.latitude === null || evidence.longitude === null) {
            return "No disponible";
        }

        return `${evidence.latitude.toFixed(5)}, ${evidence.longitude.toFixed(5)}`;
    }

    private createCommercialActionDraft(prospect?: ProspectRecord): CommercialActionDraft {
        const companyName = prospect?.compania?.trim() ?? "";

        return {
            companyName,
            relatedContactKey: prospect ? `prospect-${prospect.id}` : "",
            actionType: "",
            followUpDate: this.currentIsoDate(),
            startTime: this.currentHourMinute(),
            sendReminder: true,
            remindBeforeValue: 1,
            remindBeforeUnit: "Dia(s)",
            observation: "",
        };
    }

    private currentIsoDate(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    private currentHourMinute(): string {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    }

    private formatIsoDate(value: string): string {
        if (!value || value.length < 10) {
            return value;
        }

        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    }

    private followupSortValue(fecha: string, hora: string): number {
        const parsed = new Date(`${String(fecha ?? "").trim()}T${String(hora ?? "").trim()}:00`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    private parseReminder(recordatorio: string): { sendReminder: boolean; remindBeforeValue: number; remindBeforeUnit: ReminderUnit } {
        const normalized = String(recordatorio ?? "").trim();
        if (!normalized) {
            return {
                sendReminder: false,
                remindBeforeValue: 1,
                remindBeforeUnit: "Dia(s)",
            };
        }

        const match = normalized.match(/^(\d+)\s*(Dia\(s\)|Hora\(s\)|Minuto\(s\))$/i);
        if (!match) {
            return {
                sendReminder: true,
                remindBeforeValue: 1,
                remindBeforeUnit: "Dia(s)",
            };
        }

        const parsedValue = Number(match[1]);
        const parsedUnit = match[2] as ReminderUnit;
        return {
            sendReminder: true,
            remindBeforeValue: Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1,
            remindBeforeUnit: parsedUnit,
        };
    }

    private mapFollowupToCommercialAction(item: CrmProspectFollowup): CommercialActionRecord {
        const reminder = this.parseReminder(item.recordatorio);
        const relatedContact = this.relatedContacts.find((contact) => contact.esPrincipal) ?? this.relatedContacts[0];

        return {
            id: item.id,
            createdAt: this.formatApiDateTime(item.createdAt),
            prospectName: this.prospect?.nombre || "--",
            companyName: this.prospect?.compania || "",
            relatedContactName: item.contactoNombre?.trim() || relatedContact?.nombre || this.prospect?.nombre || "--",
            actionType: item.tipo,
            followUpDate: item.fecha,
            startTime: item.hora,
            sendReminder: reminder.sendReminder,
            remindBeforeValue: reminder.remindBeforeValue,
            remindBeforeUnit: reminder.remindBeforeUnit,
            observation: item.observacion,
            status: item.estado,
            registeredBy: item.registradoPor || "",
            softDelete: item.softDelete ?? false,
        };
    }

    private formatApiDateTime(value: string): string {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return String(value ?? "--");
        }

        const day = String(parsed.getDate()).padStart(2, "0");
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const year = parsed.getFullYear();
        const hours = String(parsed.getHours()).padStart(2, "0");
        const minutes = String(parsed.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    private refreshTimelineFromCommercialActions(): void {
        this.timelineItems = [...this.commercialActions]
            .sort((a, b) => this.followupSortValue(a.followUpDate, a.startTime) - this.followupSortValue(b.followUpDate, b.startTime))
            .map((action) => ({
                id: action.id,
                fecha: `${this.formatIsoDate(action.followUpDate)} ${action.startTime}`,
                titulo: action.actionType,
                descripcion: action.observation || "Seguimiento comercial registrado.",
                responsable: action.relatedContactName || this.prospect?.empleado || "Sin asignar",
                icono: this.resolveTimelineIcon(action.actionType),
            }));
    }

    private resolveTimelineIcon(actionType: string): string {
        const normalized = actionType.trim().toLowerCase();
        if (normalized.includes("llamada")) {
            return "bi bi-telephone";
        }
        if (normalized.includes("correo")) {
            return "bi bi-envelope";
        }
        if (normalized.includes("whatsapp") || normalized.includes("mensaje")) {
            return "bi bi-chat-dots";
        }
        if (normalized.includes("visita")) {
            return "bi bi-geo-alt";
        }
        if (normalized.includes("cotizacion")) {
            return "bi bi-file-earmark-text";
        }
        return "bi bi-calendar-check";
    }

    saveProspectNote(): void {
        const backendId = this.prospect?.backendId;
        if (!backendId) {
            this.notePersistSuccessMessage = "";
            this.notePersistErrorMessage = "No se puede guardar: el prospecto no tiene ID de backend.";
            return;
        }

        const serializedNote = this.serializeProspectNote({
            title: this.noteTitle,
            visibility: this.noteVisibility,
            employee: this.noteEmployee,
            detail: this.noteDetail,
        });

        this.notePersistSuccessMessage = "";
        this.notePersistErrorMessage = "";
        this.isSavingProspectNote = true;

        this.crmProspectsApi.updateProspectNote(backendId, serializedNote).subscribe({
            next: (updatedNote) => {
                this.isSavingProspectNote = false;
                this.notePersistErrorMessage = "";
                this.notePersistSuccessMessage = "Nota guardada correctamente.";
                this.updateProspectNoteInStore(backendId, updatedNote);
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.isSavingProspectNote = false;
                this.notePersistSuccessMessage = "";
                this.notePersistErrorMessage = error?.message || "No se pudo guardar la nota del prospecto.";
                this.cdr.detectChanges();
            },
        });
    }

    restoreNoteDraftFromProspect(): void {
        const parsed = this.parsePersistedProspectNote(this.prospect?.nota ?? "");
        this.noteTitle = parsed.title;
        this.noteVisibility = parsed.visibility;
        this.noteEmployee = parsed.employee;
        this.noteDetail = parsed.detail;
        this.notePersistSuccessMessage = "";
        this.notePersistErrorMessage = "";
    }

    private parsePersistedProspectNote(raw: string): ParsedProspectNote {
        const source = String(raw ?? "").trim();
        const defaultValue: ParsedProspectNote = {
            title: "",
            visibility: "privada",
            employee: "",
            detail: source,
        };

        if (!source.startsWith("Titulo:")) {
            return defaultValue;
        }

        const lines = source.split("\n");
        const titleLine = lines[0] ?? "";
        const visibilityLine = lines[1] ?? "";
        const employeeLine = lines[2] ?? "";
        const detailHeaderIndex = lines.findIndex((line) => line.trim() === "Detalle:");

        const title = titleLine.replace(/^Titulo:\s*/i, "").trim();
        const rawVisibility = visibilityLine.replace(/^Visibilidad:\s*/i, "").trim().toLowerCase();
        const employee = employeeLine.replace(/^Empleado:\s*/i, "").trim();
        const detail = detailHeaderIndex >= 0 ? lines.slice(detailHeaderIndex + 1).join("\n").trim() : source;

        return {
            title,
            visibility: rawVisibility === "publica" ? "publica" : "privada",
            employee,
            detail,
        };
    }

    private serializeProspectNote(note: ParsedProspectNote): string {
        const title = note.title.trim();
        const detail = note.detail.trim();
        const employee = note.employee.trim();

        if (!title && !detail && !employee) {
            return "";
        }

        return [
            `Titulo: ${title}`,
            `Visibilidad: ${note.visibility}`,
            `Empleado: ${employee}`,
            "Detalle:",
            detail,
        ].join("\n").trim();
    }

    private buildProspectUpdatePayload(prospect: ProspectRecord, editedField: EditableProfileField, editedValue: string): CrmUpsertProspectPayload {
        const resolveFieldValue = (field: EditableProfileField): string => {
            if (field === editedField) {
                return editedValue;
            }
            return this.normalizeProfileFieldValue(this.readProspectFieldRawValue(prospect, field));
        };

        return {
            salutation: this.normalizeProfileFieldValue(prospect.salutation ?? "") || "--",
            name: resolveFieldValue("nombre"),
            email: resolveFieldValue("correo"),
            mobile: resolveFieldValue("movil"),
            company: resolveFieldValue("compania"),
            nit: this.normalizeProfileFieldValue(prospect.nit),
            assignedEmployee: resolveFieldValue("empleado"),
            source: resolveFieldValue("fuente"),
            category: this.normalizeProfileFieldValue(prospect.categoria) || "--",
            zone: resolveFieldValue("zona"),
            prospectValue: Math.max(0, Math.floor(Number(prospect.valor) || 0)),
            allowFollowUp: prospect.allowFollowUp ?? true,
            status: prospect.estado,
            service: this.normalizeProfileFieldValue(prospect.servicio ?? "") || "--",
            note: this.normalizeProfileFieldValue(prospect.nota ?? ""),
            website: resolveFieldValue("sitioWeb"),
            officePhone: resolveFieldValue("telefonoOficina"),
            country: resolveFieldValue("pais"),
            city: resolveFieldValue("ciudad"),
            address: resolveFieldValue("direccion"),
            quotations: Math.max(0, Math.floor(Number(prospect.cotizaciones) || 0)),
            branches: (prospect.branches ?? []).map((branch) => ({
                name: String(branch.name ?? "").trim(),
                contactName: String(branch.contactName ?? "").trim(),
                contactRole: String(branch.contactRole ?? "").trim(),
                email: String(branch.email ?? "").trim(),
                phone: String(branch.phone ?? "").trim(),
                country: String(branch.country ?? "").trim(),
                city: String(branch.city ?? "").trim(),
                address: String(branch.address ?? "").trim(),
                isPrimary: Boolean(branch.isPrimary),
            })),
        };
    }

    private readProfileFieldRawValue(field: EditableProfileField): string {
        if (!this.prospect) {
            return "";
        }
        return this.readProspectFieldRawValue(this.prospect, field);
    }

    private readProspectFieldRawValue(prospect: ProspectRecord, field: EditableProfileField): string {
        switch (field) {
            case "nombre":
                return String(prospect.nombre ?? "");
            case "correo":
                return String(prospect.correo ?? "");
            case "compania":
                return String(prospect.compania ?? "");
            case "sitioWeb":
                return String(prospect.sitioWeb ?? "");
            case "movil":
                return String(prospect.movil ?? "");
            case "telefonoOficina":
                return String(prospect.telefonoOficina ?? "");
            case "pais":
                return String(prospect.pais ?? "");
            case "ciudad":
                return String(prospect.ciudad ?? "");
            case "zona":
                return String(prospect.zona ?? "");
            case "direccion":
                return String(prospect.direccion ?? "");
            case "empleado":
                return String(prospect.empleado ?? "");
            case "fuente":
                return String(prospect.fuente ?? "");
            default:
                return "";
        }
    }

    private normalizeProfileFieldValue(value: string): string {
        const normalized = String(value ?? "").trim();
        if (normalized === "--") {
            return "";
        }
        return normalized;
    }

    private profileFieldLabel(field: EditableProfileField): string {
        return this.profileEditableFields.find((item) => item.key === field)?.label ?? field;
    }

    private isValidEmail(value: string): boolean {
        return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value);
    }

    private updateProspectInStore(updatedProspect: ProspectRecord): void {
        const current = getProspects();
        let found = false;

        const updated = current.map((record) => {
            if (record.backendId !== updatedProspect.backendId) {
                return record;
            }
            found = true;
            return { ...updatedProspect };
        });

        if (!found) {
            updated.push({ ...updatedProspect });
        }

        replaceProspects(updated);
        this.prospect = updated.find((record) => record.backendId === updatedProspect.backendId) ?? this.prospect;
    }

    private updateProspectNoteInStore(prospectBackendID: string, note: string): void {
        const current = getProspects().find((record) => record.backendId === prospectBackendID)
            ?? (this.prospect?.backendId === prospectBackendID ? this.prospect : undefined);

        if (!current) {
            return;
        }

        this.updateProspectInStore({
            ...current,
            nota: note,
        });
    }

    private mapClientToRelatedContact(client: CrmClientRecord): RelatedContactRecord {
        return {
            key: `client-${client.id}`,
            nombre: client.nombre,
            correo: client.correo,
            telefono: "--",
            empresa: client.empresa,
            tipo: "Cliente",
            estado: client.estado,
            esPrincipal: false,
        };
    }

    private normalizeCompanyName(value: string | undefined): string {
        return (value ?? "").trim().toLowerCase();
    }

    private setupDraftPersistence(rawProspectId: string): void {
        this.stopDraftWatch();

        this.activeDraftKey = `app.crm.prospect-detail.${rawProspectId || "unknown"}`;
        const draft = this.formDraftService.load<{
            activeTab?: DetailTab;
            profilePanel?: "descripcion" | "actividades";
            activeActivityTab?: ActivityTab;
            activitySearchTerm?: string;
            noteTitle?: string;
            noteVisibility?: "publica" | "privada";
            noteEmployee?: string;
            noteDetail?: string;
            contactDraft?: { name: string; email: string; phone: string; role: string; notes: string };
            commercialActionDraft?: CommercialActionDraft;
        }>(this.activeDraftKey);

        if (draft) {
            this.activeTab = draft.activeTab ?? this.activeTab;
            this.profilePanel = draft.profilePanel ?? this.profilePanel;
            this.activeActivityTab = draft.activeActivityTab ?? this.activeActivityTab;
            this.activitySearchTerm = String(draft.activitySearchTerm ?? this.activitySearchTerm);
            this.noteTitle = String(draft.noteTitle ?? this.noteTitle);
            this.noteVisibility = draft.noteVisibility ?? this.noteVisibility;
            this.noteEmployee = String(draft.noteEmployee ?? this.noteEmployee);
            this.noteDetail = String(draft.noteDetail ?? this.noteDetail);

            if (draft.contactDraft) {
                this.contactDraft = {
                    name: String(draft.contactDraft.name ?? ""),
                    email: String(draft.contactDraft.email ?? ""),
                    phone: String(draft.contactDraft.phone ?? ""),
                    role: String(draft.contactDraft.role ?? ""),
                    notes: String(draft.contactDraft.notes ?? ""),
                };
            }

            if (draft.commercialActionDraft) {
                this.commercialActionDraft = {
                    ...this.createCommercialActionDraft(this.prospect),
                    ...draft.commercialActionDraft,
                };
            }
        }

        this.stopDraftWatch = this.formDraftService.watch(this.activeDraftKey, () => ({
            activeTab: this.activeTab,
            profilePanel: this.profilePanel,
            activeActivityTab: this.activeActivityTab,
            activitySearchTerm: this.activitySearchTerm,
            noteTitle: this.noteTitle,
            noteVisibility: this.noteVisibility,
            noteEmployee: this.noteEmployee,
            noteDetail: this.noteDetail,
            contactDraft: { ...this.contactDraft },
            commercialActionDraft: { ...this.commercialActionDraft },
        }));
    }
}
