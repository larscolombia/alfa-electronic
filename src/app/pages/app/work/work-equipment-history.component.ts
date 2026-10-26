import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom, of } from "rxjs";
import { catchError, take, timeout } from "rxjs/operators";

import { CrmEquipmentApiService, EquipmentInsightResponse } from "../../../services/crm-equipment-api.service";
import { InventoryApiService } from "../../../services/inventory-api.service";
import { InventoryState, MovementRecord, PurchaseLine, ReservationRecord } from "../../../services/inventory-domain.models";
import { WorkEquipmentHistoryContextService } from "../../../services/work-equipment-history-context.service";
import {
    ProspectEquipmentAttachment,
    ProspectEquipmentItem,
    ProspectEquipmentRecord,
    ProspectEquipmentSummary,
    getProspectEquipmentRepairStatusLabel,
} from "../crm/crm-prospect-equipment.store";
import { Project } from "../projects/models";
import { getProjectTechnicalTestTypeLabel } from "../projects/project-workflow.config";
import { ProjectService } from "../projects/services";

type EquipmentReferenceEntry = {
    record: ProspectEquipmentRecord;
    item: ProspectEquipmentItem;
    reference: string;
};

type EquipmentReceptionEntry = {
    reference: string;
    receptionLabel: string;
    companyName: string;
    locationName: string;
    repairStatusLabel: string;
    updatedAt: string;
};

type MaterialUsageEntry = {
    reservationId: string;
    reference: string;
    quantity: number;
    status: ReservationRecord["status"];
    assignedTo: string;
    commitmentDate: string;
    reservedAt: string;
    consumedQuantity: number;
    lastConsumedAt: string;
};

type EquipmentInterventionEntry = {
    projectId: string;
    projectTitle: string;
    shortCode: string;
    stageLabel: string;
    updatedAt: string;
    linkedReference: string;
    diagnosticNotes: string;
    repairNotes: string;
    estimatedHours: number;
    actualHours: number;
    testTypeLabel: string;
    dispatchCount: number;
    latestDispatchAt: string;
    materialUsage: MaterialUsageEntry[];
};

type SimilarCaseEntry = {
    reference: string;
    identifier: string;
    serie: string;
    displayName: string;
    serviceTypeName: string;
    repairStatusLabel: string;
    failureDescription: string;
    receptionLabel: string;
    updatedAt: string;
    similarityScore: number;
    matchReasons: string[];
};

type RecurrentFailureEntry = {
    label: string;
    count: number;
    percentage: number;
};

type EquipmentAttachmentBlock = {
    recordId: string;
    itemId: string;
    receptionLabel: string;
    companyName: string;
    itemLabel: string;
    storageLocationName: string;
    attachments: ProspectEquipmentAttachment[];
    uploading: boolean;
    errorMessage: string;
    successMessage: string;
};

const SIMILARITY_STOPWORDS = new Set([
    "de", "del", "la", "el", "los", "las", "para", "con", "sin", "por", "que", "una", "uno", "equipo", "falla",
    "hmi", "pantalla", "modulo", "modulos", "caso", "tecnico", "tecnica", "cliente", "servicio",
]);

@Component({
    selector: "app-work-equipment-history",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Historial técnico por equipo</h5>
                    <p class="text-secondary small mb-0">Trazabilidad de intervenciones y repuestos usados por cada ocasión.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary" routerLink="/app/work-projects">Volver a proyectos</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/work-projects">Trabajo - Proyectos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Historial de equipo</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card" *ngIf="loading">
                <div class="card-body py-5 text-center">
                    <div class="spinner-border text-theme" role="status"></div>
                    <p class="text-secondary small mb-0 mt-3">Cargando trazabilidad del equipo...</p>
                </div>
            </div>

            <div class="alert alert-danger border" *ngIf="!loading && errorMessage">
                {{ errorMessage }}
            </div>

            <ng-container *ngIf="!loading && !errorMessage">
                <div class="card adminuiux-card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0">Identidad del equipo</h6>
                        <p class="text-secondary small mb-0">Fuente de búsqueda: {{ equipmentReference || "sin referencia" }}</p>
                    </div>
                    <div class="card-body">
                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-lg-4">
                                <p class="small text-secondary mb-1">Equipo</p>
                                <p class="mb-0 fw-semibold">{{ equipmentDisplayName || "Equipo sin nombre" }}</p>
                            </div>
                            <div class="col-12 col-lg-4">
                                <p class="small text-secondary mb-1">Identificador</p>
                                <p class="mb-0">{{ equipmentIdentifier || "Sin identificador" }}</p>
                            </div>
                            <div class="col-12 col-lg-4">
                                <p class="small text-secondary mb-1">Serie</p>
                                <p class="mb-0">{{ equipmentSerie || "Sin serie" }}</p>
                            </div>
                            <div class="col-12 col-lg-4">
                                <p class="small text-secondary mb-1">Servicio</p>
                                <p class="mb-0">{{ equipmentServiceType || "Sin tipo de servicio" }}</p>
                            </div>
                            <div class="col-12 col-lg-8">
                                <p class="small text-secondary mb-1">Falla reportada</p>
                                <p class="mb-0">{{ equipmentFailureDescription || "Sin detalle de falla" }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 class="mb-0">Repuestos solicitados a compras</h6>
                            <p class="text-secondary small mb-0">Líneas de compra asociadas a este equipo ({{ equipmentTag || "sin etiqueta" }}).</p>
                        </div>
                        <button
                            type="button"
                            class="btn btn-sm btn-theme"
                            data-testid="request-part-btn"
                            (click)="togglePartRequestForm()"
                            [disabled]="!equipmentTag"
                        >
                            <i class="bi bi-cart-plus me-1"></i> Solicitar repuesto
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-warning border" data-testid="purchase-modified-alert" *ngIf="modifiedPurchaseLines.length > 0">
                            <strong>Compras modificó {{ modifiedPurchaseLines.length }} línea(s) de este equipo.</strong>
                            <ul class="mb-0 mt-1 small">
                                <li *ngFor="let line of modifiedPurchaseLines">
                                    {{ line.reference }}<span *ngIf="line.brand"> · {{ line.brand }}</span>
                                    x{{ line.quantity }}
                                    <span class="text-secondary" *ngIf="line.modifiedBy"> — editada por {{ line.modifiedBy }}<span *ngIf="line.modifiedAt"> el {{ line.modifiedAt | date: "dd/MM/yyyy HH:mm" }}</span></span>
                                </li>
                            </ul>
                        </div>

                        <form class="border rounded p-3 mb-3" *ngIf="showPartRequestForm" (ngSubmit)="submitPartRequest()">
                            <div class="row gx-3 gy-2 align-items-end">
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Proveedor</label>
                                    <input class="form-control" data-testid="part-supplier-input" [(ngModel)]="partRequestDraft.supplier" name="partSupplier" placeholder="Ej: Mouser" />
                                </div>
                                <div class="col-12 col-md-3">
                                    <label class="form-label">Referencia <span class="text-danger">*</span></label>
                                    <input class="form-control" data-testid="part-reference-input" [(ngModel)]="partRequestDraft.reference" name="partReference" placeholder="Ej: IGBT-FGA25N120" required />
                                </div>
                                <div class="col-6 col-md-2">
                                    <label class="form-label">Precio unitario</label>
                                    <input type="number" min="0" step="any" class="form-control" data-testid="part-price-input" [(ngModel)]="partRequestDraft.unitPrice" name="partPrice" />
                                </div>
                                <div class="col-6 col-md-2">
                                    <label class="form-label">Cantidad <span class="text-danger">*</span></label>
                                    <input type="number" min="1" step="1" class="form-control" data-testid="part-qty-input" [(ngModel)]="partRequestDraft.quantity" name="partQty" required />
                                </div>
                                <div class="col-12 col-md-2 d-flex gap-2">
                                    <button type="submit" class="btn btn-theme flex-fill" data-testid="part-request-save" [disabled]="partRequestSaving || !partRequestDraft.reference.trim() || partRequestDraft.quantity < 1">
                                        {{ partRequestSaving ? "Guardando..." : "Solicitar" }}
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" (click)="togglePartRequestForm()">Cancelar</button>
                                </div>
                            </div>
                        </form>

                        <div class="alert alert-success border" data-testid="part-request-success" *ngIf="partRequestSuccess">{{ partRequestSuccess }}</div>
                        <div class="alert alert-danger border" data-testid="part-request-error" *ngIf="partRequestError">{{ partRequestError }}</div>

                        <div class="table-responsive" *ngIf="equipmentPurchaseLines.length > 0">
                            <table class="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Referencia</th>
                                        <th>Marca</th>
                                        <th>Proveedor</th>
                                        <th>Cantidad</th>
                                        <th>Estado</th>
                                        <th>Modificada</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let line of equipmentPurchaseLines">
                                        <td>{{ line.reference }}</td>
                                        <td>{{ line.brand || "--" }}</td>
                                        <td>{{ line.supplier || "--" }}</td>
                                        <td>{{ line.quantity }}</td>
                                        <td>{{ line.status }}</td>
                                        <td>
                                            <span class="badge text-bg-warning" *ngIf="line.modifiedByPurchases">Por compras</span>
                                            <span class="text-secondary" *ngIf="!line.modifiedByPurchases">--</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p class="text-secondary small mb-0" *ngIf="equipmentPurchaseLines.length === 0">Sin líneas de compra registradas para este equipo.</p>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 class="mb-0">Equipos similares reparados</h6>
                            <p class="text-secondary small mb-0">Coincidencias por marca, tipo, servicio y descripción de falla para predecir recurrencia.</p>
                        </div>
                        <span class="badge text-bg-light">{{ similarCases.length }} caso(s)</span>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive" *ngIf="similarCases.length > 0">
                            <table class="table table-sm align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Similitud</th>
                                        <th>Equipo</th>
                                        <th>Falla reportada</th>
                                        <th>Estado</th>
                                        <th>Actualizado</th>
                                        <th class="text-end">Accion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let similar of similarCases">
                                        <td>
                                            <span class="badge text-bg-primary">{{ similar.similarityScore }}%</span>
                                            <div class="small text-secondary mt-1" *ngIf="similar.matchReasons.length">{{ similar.matchReasons.join(" · ") }}</div>
                                        </td>
                                        <td>
                                            <div class="fw-semibold">{{ similar.displayName || "Equipo" }}</div>
                                            <div class="small text-secondary">{{ similar.identifier || similar.serie || "Sin identificador" }} · {{ similar.receptionLabel || "Sin recepcion" }}</div>
                                        </td>
                                        <td>{{ similar.failureDescription || "Sin detalle" }}</td>
                                        <td>{{ similar.repairStatusLabel }}</td>
                                        <td>{{ similar.updatedAt | date: "dd/MM/yyyy HH:mm" }}</td>
                                        <td class="text-end">
                                            <button type="button" class="btn btn-sm btn-outline-theme" (click)="openSimilarCaseHistory(similar)">
                                                Ver historial
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="border rounded p-3 text-center text-secondary" *ngIf="similarCases.length === 0">
                            Aun no hay suficientes casos similares para generar comparativo.
                        </div>

                        <div class="row gx-3 gy-3 mt-1" *ngIf="similarCases.length > 0">
                            <div class="col-12 col-lg-5">
                                <h6 class="mb-2">Fallas recurrentes detectadas</h6>
                                <div class="small text-secondary" *ngIf="recurrentFailures.length === 0">
                                    Los casos similares no incluyen suficiente descripción de falla para agrupar patrones.
                                </div>

                                <div class="mb-2" *ngFor="let failure of recurrentFailures">
                                    <div class="d-flex justify-content-between small mb-1">
                                        <span>{{ failure.label }}</span>
                                        <span>{{ failure.count }} caso(s)</span>
                                    </div>
                                    <div class="progress" style="height: 0.4rem;">
                                        <div class="progress-bar bg-warning" [style.width.%]="failure.percentage"></div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 col-lg-7">
                                <div class="d-flex justify-content-between align-items-center gap-2 mb-2 flex-wrap">
                                    <h6 class="mb-0">Lubot AI</h6>
                                    <button
                                        type="button"
                                        class="btn btn-sm btn-outline-theme"
                                        (click)="runLubotAIAnalysis()"
                                        [disabled]="lubotAiLoading || loading || (!equipmentReference && !equipmentIdentifier && !equipmentSerie)"
                                    >
                                        {{ lubotAiLoading ? "Analizando..." : "Analizar con Lubot AI" }}
                                    </button>
                                </div>
                                <p class="small mb-1" *ngIf="lubotAiPresumedFailure"><strong>Falla presumida:</strong> {{ lubotAiPresumedFailure }}</p>
                                <p class="text-secondary small mb-0">{{ lubotAiInsight }}</p>
                                <p class="text-secondary small mb-0 mt-1" *ngIf="lubotAiLoading">Lubot AI está analizando el historial técnico...</p>
                                <p class="text-secondary small mb-0 mt-1" *ngIf="lubotAiLastRunAt">Último análisis: {{ lubotAiLastRunAt | date: "dd/MM/yyyy HH:mm" }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 class="mb-0">Recepciones relacionadas</h6>
                            <p class="text-secondary small mb-0">Coincidencias por serial o identificador para este equipo.</p>
                        </div>
                        <span class="badge text-bg-light">{{ linkedReceptions.length }} recepción(es)</span>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Recepción</th>
                                        <th>Empresa</th>
                                        <th>Ubicación</th>
                                        <th>Estado técnico</th>
                                        <th>Actualizado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let reception of linkedReceptions">
                                        <td>{{ reception.receptionLabel }}</td>
                                        <td>{{ reception.companyName || "Sin empresa" }}</td>
                                        <td>{{ reception.locationName || "Sin ubicación" }}</td>
                                        <td>{{ reception.repairStatusLabel }}</td>
                                        <td>{{ reception.updatedAt | date: "dd/MM/yyyy HH:mm" }}</td>
                                    </tr>
                                    <tr *ngIf="linkedReceptions.length === 0">
                                        <td colspan="5" class="text-center text-secondary py-4">No hay recepciones relacionadas para este equipo.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 class="mb-0">Adjuntos del equipo</h6>
                            <p class="text-secondary small mb-0">Documentos, fotos, audios u otros archivos asociados a cada recepción.</p>
                        </div>
                        <span class="badge text-bg-light">{{ totalAttachments }} adjunto(s)</span>
                    </div>
                    <div class="card-body">
                        <div class="border rounded p-4 text-center text-secondary" *ngIf="attachmentBlocks.length === 0">
                            No hay recepciones donde cargar adjuntos para este equipo.
                        </div>

                        <div class="attachment-block" *ngFor="let block of attachmentBlocks">
                            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                                <div>
                                    <p class="mb-0 fw-semibold">Recepción {{ block.receptionLabel }} · {{ block.companyName || "Sin empresa" }}</p>
                                    <p class="text-secondary small mb-0">{{ block.itemLabel }}<span *ngIf="block.storageLocationName"> · {{ block.storageLocationName }}</span></p>
                                </div>
                                <label class="btn btn-sm btn-outline-theme mb-0" [class.disabled]="block.uploading">
                                    <i class="bi bi-paperclip me-1"></i>{{ block.uploading ? "Subiendo..." : "Agregar adjunto" }}
                                    <input
                                        type="file"
                                        class="d-none"
                                        multiple
                                        [disabled]="block.uploading"
                                        (change)="onAttachmentFilesSelected($event, block)"
                                    />
                                </label>
                            </div>

                            <div class="alert alert-danger py-2 small mb-2" *ngIf="block.errorMessage">{{ block.errorMessage }}</div>
                            <div class="alert alert-success py-2 small mb-2" *ngIf="block.successMessage">{{ block.successMessage }}</div>

                            <div class="text-secondary small mb-2" *ngIf="block.attachments.length === 0">Sin adjuntos cargados para esta recepción.</div>

                            <ul class="list-group list-group-flush attachment-list" *ngIf="block.attachments.length > 0">
                                <li class="list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2" *ngFor="let attachment of block.attachments">
                                    <div class="d-flex align-items-center gap-2 attachment-meta">
                                        <i class="bi" [class]="attachmentIconClass(attachment)"></i>
                                        <div>
                                            <p class="mb-0 fw-semibold attachment-name">{{ attachment.fileName }}</p>
                                            <p class="text-secondary small mb-0">
                                                {{ attachment.mimeType || "application/octet-stream" }} · {{ formatBytes(attachment.sizeBytes) }}
                                                <span *ngIf="attachment.uploadedAt"> · {{ attachment.uploadedAt | date: "dd/MM/yyyy HH:mm" }}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <a class="btn btn-sm btn-outline-secondary" [href]="attachment.dataUrl" [download]="attachment.fileName" target="_blank" rel="noopener">
                                            <i class="bi bi-download me-1"></i>Descargar
                                        </a>
                                        <button type="button" class="btn btn-sm btn-outline-danger" (click)="removeAttachment(block, attachment)" [disabled]="block.uploading">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="card adminuiux-card">
                    <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 class="mb-0">Intervenciones registradas</h6>
                            <p class="text-secondary small mb-0">Qué se hizo en cada ocasión y qué repuestos se usaron.</p>
                        </div>
                        <span class="badge text-bg-light">{{ interventions.length }} intervención(es)</span>
                    </div>
                    <div class="card-body">
                        <div class="border rounded p-4 text-center text-secondary" *ngIf="interventions.length === 0">
                            No hay casos vinculados en proyectos para este equipo.
                        </div>

                        <div class="intervention-card" *ngFor="let intervention of interventions">
                            <div class="intervention-card__header">
                                <div>
                                    <h6 class="mb-1">{{ intervention.projectTitle }}</h6>
                                    <p class="text-secondary small mb-0">{{ intervention.shortCode || intervention.projectId }} · {{ intervention.stageLabel }}</p>
                                </div>
                                <div class="text-end">
                                    <p class="small text-secondary mb-0">Actualizado</p>
                                    <p class="mb-0 fw-semibold">{{ intervention.updatedAt | date: "dd/MM/yyyy HH:mm" }}</p>
                                </div>
                            </div>

                            <div class="row gx-3 gy-3 mb-3">
                                <div class="col-12 col-lg-6">
                                    <label class="small text-secondary d-block mb-1">Memo diagnóstico</label>
                                    <div class="memo-box">{{ intervention.diagnosticNotes || "Sin memo diagnóstico" }}</div>
                                </div>
                                <div class="col-12 col-lg-6">
                                    <label class="small text-secondary d-block mb-1">Memo reparación / intervención</label>
                                    <div class="memo-box">{{ intervention.repairNotes || "Sin memo de intervención" }}</div>
                                </div>
                            </div>

                            <div class="row gx-3 gy-3 mb-3">
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Horas estimadas</p>
                                    <p class="mb-0 fw-semibold">{{ intervention.estimatedHours }}</p>
                                </div>
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Horas reales</p>
                                    <p class="mb-0 fw-semibold">{{ intervention.actualHours }}</p>
                                </div>
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Prueba de cierre</p>
                                    <p class="mb-0">{{ intervention.testTypeLabel }}</p>
                                </div>
                                <div class="col-12 col-md-3">
                                    <p class="small text-secondary mb-1">Despachos</p>
                                    <p class="mb-0">{{ intervention.dispatchCount }}<span *ngIf="intervention.latestDispatchAt"> · {{ intervention.latestDispatchAt | date: "dd/MM/yyyy" }}</span></p>
                                </div>
                            </div>

                            <p class="small fw-semibold text-secondary mb-2">Repuestos usados</p>
                            <div class="table-responsive">
                                <table class="table table-sm align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Repuesto</th>
                                            <th>Cantidad reservada</th>
                                            <th>Estado</th>
                                            <th>Asignado</th>
                                            <th>Compromiso</th>
                                            <th>Consumido</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr *ngFor="let material of intervention.materialUsage">
                                            <td>{{ material.reference }}</td>
                                            <td>{{ material.quantity }}</td>
                                            <td>{{ material.status }}</td>
                                            <td>{{ material.assignedTo || "--" }}</td>
                                            <td>{{ material.commitmentDate || "--" }}</td>
                                            <td>
                                                {{ material.consumedQuantity }}
                                                <span class="text-secondary" *ngIf="material.lastConsumedAt"> · {{ material.lastConsumedAt | date: "dd/MM/yyyy HH:mm" }}</span>
                                            </td>
                                        </tr>
                                        <tr *ngIf="intervention.materialUsage.length === 0">
                                            <td colspan="6" class="text-center text-secondary py-3">Sin repuestos registrados para esta intervención.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div class="d-flex justify-content-end mt-3">
                                <button type="button" class="btn btn-sm btn-outline-secondary" (click)="openProjectCase(intervention.projectId)">
                                    Abrir caso
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ng-container>
        </div>
    `,
    styles: [
        `
            .intervention-card {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
                border-radius: 0.85rem;
                padding: 1rem;
                margin-bottom: 1rem;
                background: rgba(var(--bs-body-bg-rgb), 0.85);
            }

            .intervention-card:last-child {
                margin-bottom: 0;
            }

            .intervention-card__header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 0.85rem;
            }

            .memo-box {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
                border-radius: 0.7rem;
                padding: 0.75rem;
                min-height: 4.5rem;
                white-space: pre-wrap;
                background: rgba(var(--bs-tertiary-bg-rgb), 0.5);
            }

            .attachment-block {
                border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
                border-radius: 0.85rem;
                padding: 0.85rem 1rem;
                margin-bottom: 0.85rem;
                background: rgba(var(--bs-body-bg-rgb), 0.85);
            }

            .attachment-block:last-child {
                margin-bottom: 0;
            }

            .attachment-list .attachment-name {
                word-break: break-all;
            }

            .attachment-list .attachment-meta i {
                font-size: 1.25rem;
                color: rgba(var(--adminuiux-theme-1-rgb), 0.75);
            }
        `,
    ],
})
export class WorkEquipmentHistoryComponent implements OnInit {
    loading = true;
    errorMessage = "";

    equipmentReference = "";
    equipmentDisplayName = "";
    equipmentIdentifier = "";
    equipmentSerie = "";
    equipmentServiceType = "";
    equipmentFailureDescription = "";

    linkedReceptions: EquipmentReceptionEntry[] = [];
    attachmentBlocks: EquipmentAttachmentBlock[] = [];
    interventions: EquipmentInterventionEntry[] = [];
    similarCases: SimilarCaseEntry[] = [];
    recurrentFailures: RecurrentFailureEntry[] = [];
    equipmentPurchaseLines: PurchaseLine[] = [];
    showPartRequestForm = false;
    partRequestSaving = false;
    partRequestSuccess = "";
    partRequestError = "";
    partRequestDraft = { supplier: "", reference: "", unitPrice: 0, quantity: 1 };
    lubotAiInsight = "Pulsa 'Analizar con Lubot AI' para estimar falla presumida y patrones recurrentes.";
    lubotAiPresumedFailure = "";
    lubotAiLoading = false;
    lubotAiLastRunAt = "";

    constructor(
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly projectService: ProjectService,
        private readonly historyContextService: WorkEquipmentHistoryContextService,
        private readonly inventoryApi: InventoryApiService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        const context = this.historyContextService.getContext();
        const reference = String(context?.reference ?? "").trim();
        const identifier = String(context?.identifier ?? "").trim();
        void this.loadHistory(reference, identifier);
    }

    openProjectCase(projectId: string): void {
        const safeProjectId = String(projectId ?? "").trim();
        if (!safeProjectId) {
            return;
        }

        if (typeof window !== "undefined") {
            window.sessionStorage.setItem("work.projects.open-project.pending", safeProjectId);
        }

        void this.router.navigate(["/app/work-projects"], {
            state: {
                openProjectId: safeProjectId,
            },
        });
    }

    openSimilarCaseHistory(similar: SimilarCaseEntry): void {
        const reference = String(similar.reference ?? "").trim();
        const identifier = String(similar.identifier ?? similar.serie ?? "").trim();
        if (!reference && !identifier) {
            return;
        }

        this.historyContextService.setContext({
            reference,
            identifier,
            origin: "history-similar",
        });

        if (this.router.url.startsWith("/app/work-equipment-history")) {
            void this.loadHistory(reference, identifier);
            return;
        }

        void this.router.navigate(["/app/work-equipment-history"]);
    }

    get totalAttachments(): number {
        return this.attachmentBlocks.reduce((sum, block) => sum + block.attachments.length, 0);
    }

    /** Etiqueta que vincula las líneas de compra con este equipo. */
    get equipmentTag(): string {
        return String(this.equipmentIdentifier || this.equipmentDisplayName || "").trim();
    }

    /** Líneas del equipo que compras modificó (marca, referencia, precio o cantidad). */
    get modifiedPurchaseLines(): PurchaseLine[] {
        return this.equipmentPurchaseLines.filter((line) => !!line.modifiedByPurchases);
    }

    togglePartRequestForm(): void {
        this.showPartRequestForm = !this.showPartRequestForm;
        this.partRequestSuccess = "";
        this.partRequestError = "";
    }

    async submitPartRequest(): Promise<void> {
        const reference = String(this.partRequestDraft.reference ?? "").trim();
        if (!reference || this.partRequestSaving) {
            return;
        }

        this.partRequestSaving = true;
        this.partRequestSuccess = "";
        this.partRequestError = "";

        try {
            const response = await firstValueFrom(
                this.inventoryApi
                    .createPurchaseLine({
                        reference,
                        component: "",
                        type: "",
                        brand: "",
                        description: `Repuesto solicitado desde la ficha del equipo ${this.equipmentDisplayName || this.equipmentTag}`,
                        supplier: String(this.partRequestDraft.supplier ?? "").trim(),
                        quantity: Math.max(1, Math.floor(Number(this.partRequestDraft.quantity) || 1)),
                        unitPrice: Math.max(0, Number(this.partRequestDraft.unitPrice) || 0),
                        neededBy: "",
                        requestReason: `Solicitud de repuesto para el equipo ${this.equipmentTag}`,
                        projectId: "",
                        equipmentTag: this.equipmentTag,
                    })
                    .pipe(timeout(20000)),
            );

            if (response?.result && !response.result.ok) {
                this.partRequestError = response.result.message || "No se pudo crear la solicitud de repuesto.";
            } else {
                this.partRequestSuccess = response?.result?.message || `Solicitud de repuesto ${reference} enviada a compras.`;
                this.partRequestDraft = { supplier: "", reference: "", unitPrice: 0, quantity: 1 };
                this.showPartRequestForm = false;
                await this.loadEquipmentPurchaseLines();
            }
        } catch {
            this.partRequestError = "No se pudo crear la solicitud de repuesto (backend no disponible).";
        }

        this.partRequestSaving = false;
        this.changeDetectorRef.detectChanges();
    }

    private async loadEquipmentPurchaseLines(): Promise<void> {
        const tag = this.equipmentTag;
        if (!tag) {
            this.equipmentPurchaseLines = [];
            return;
        }

        const lines = await firstValueFrom(
            this.inventoryApi.listPurchaseLines().pipe(
                timeout(15000),
                catchError(() => of([] as PurchaseLine[])),
            ),
        );

        const normalizedTag = this.normalize(tag);
        this.equipmentPurchaseLines = lines
            .filter((line) => this.normalize(line.equipmentTag ?? "") === normalizedTag)
            .sort((left, right) => this.sortByDateDesc(left.generatedAt, right.generatedAt));
    }

    formatBytes(bytes: number): string {
        const value = Math.max(0, Math.trunc(Number(bytes) || 0));
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
        return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    attachmentIconClass(attachment: ProspectEquipmentAttachment): string {
        const mime = String(attachment?.mimeType ?? "").toLowerCase();
        if (mime.startsWith("image/")) return "bi-file-image";
        if (mime.startsWith("video/")) return "bi-file-play";
        if (mime.startsWith("audio/")) return "bi-file-music";
        if (mime === "application/pdf") return "bi-file-pdf";
        if (mime.includes("zip") || mime.includes("compress")) return "bi-file-zip";
        if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "bi-file-spreadsheet";
        if (mime.includes("word") || mime.includes("document")) return "bi-file-text";
        if (mime.startsWith("text/")) return "bi-file-text";
        return "bi-file-earmark";
    }

    async onAttachmentFilesSelected(event: Event, block: EquipmentAttachmentBlock): Promise<void> {
        const input = event.target as HTMLInputElement | null;
        const files = input?.files ? Array.from(input.files) : [];
        if (!files.length) {
            return;
        }

        block.uploading = true;
        block.errorMessage = "";
        block.successMessage = "";
        this.changeDetectorRef.detectChanges();

        let lastUpdatedItem: ProspectEquipmentItem | null = null;
        const failures: string[] = [];

        for (const file of files) {
            try {
                const dataUrl = await this.readFileAsDataURL(file);
                const updatedItem = await firstValueFrom(
                    this.crmEquipmentApi
                        .addItemAttachment(block.recordId, block.itemId, {
                            fileName: file.name,
                            mimeType: file.type || "application/octet-stream",
                            sizeBytes: file.size,
                            dataUrl,
                        })
                        .pipe(timeout(60000)),
                );
                lastUpdatedItem = updatedItem;
            } catch (error) {
                failures.push(`${file.name}: ${this.formatAttachmentError(error)}`);
            }
        }

        if (lastUpdatedItem && Array.isArray(lastUpdatedItem.attachments)) {
            block.attachments = [...lastUpdatedItem.attachments];
        }

        if (failures.length === 0) {
            block.successMessage = `Se cargaron ${files.length} adjunto(s) correctamente.`;
        } else {
            block.errorMessage = failures.join(" · ");
        }

        block.uploading = false;
        if (input) {
            input.value = "";
        }
        this.changeDetectorRef.detectChanges();
    }

    async removeAttachment(block: EquipmentAttachmentBlock, attachment: ProspectEquipmentAttachment): Promise<void> {
        if (!attachment?.id) {
            return;
        }

        const confirmed = typeof window === "undefined" ? true : window.confirm(`¿Eliminar el adjunto "${attachment.fileName}"?`);
        if (!confirmed) {
            return;
        }

        block.uploading = true;
        block.errorMessage = "";
        block.successMessage = "";
        this.changeDetectorRef.detectChanges();

        try {
            const updatedItem = await firstValueFrom(
                this.crmEquipmentApi.deleteItemAttachment(block.recordId, block.itemId, attachment.id).pipe(timeout(30000)),
            );
            if (updatedItem && Array.isArray(updatedItem.attachments)) {
                block.attachments = [...updatedItem.attachments];
            } else {
                block.attachments = block.attachments.filter((entry) => entry.id !== attachment.id);
            }
            block.successMessage = `Adjunto "${attachment.fileName}" eliminado.`;
        } catch (error) {
            block.errorMessage = `No se pudo eliminar el adjunto: ${this.formatAttachmentError(error)}`;
        }

        block.uploading = false;
        this.changeDetectorRef.detectChanges();
    }

    private readFileAsDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo"));
            reader.onload = () => resolve(String(reader.result ?? ""));
            reader.readAsDataURL(file);
        });
    }

    private formatAttachmentError(error: unknown): string {
        const raw = error instanceof Error ? String(error.message ?? "").trim() : String(error ?? "").trim();
        if (!raw) {
            return "error desconocido";
        }
        if (raw.includes("status 413") || raw.toLowerCase().includes("too large")) {
            return "el archivo supera el tamaño permitido";
        }
        if (raw.includes("status 404")) {
            return "endpoint de adjuntos no disponible (404)";
        }
        if (raw.toLowerCase().includes("timeout")) {
            return "tiempo de espera agotado";
        }
        return raw;
    }

    private async loadHistory(reference: string, identifier: string): Promise<void> {
        this.loading = true;
        this.errorMessage = "";
        this.linkedReceptions = [];
        this.attachmentBlocks = [];
        this.interventions = [];
        this.similarCases = [];
        this.recurrentFailures = [];
        this.equipmentPurchaseLines = [];
        this.showPartRequestForm = false;
        this.partRequestSaving = false;
        this.partRequestSuccess = "";
        this.partRequestError = "";
        this.partRequestDraft = { supplier: "", reference: "", unitPrice: 0, quantity: 1 };
        this.lubotAiInsight = "Pulsa 'Analizar con Lubot AI' para estimar falla presumida y patrones recurrentes.";
        this.lubotAiPresumedFailure = "";
        this.lubotAiLoading = false;
        this.lubotAiLastRunAt = "";

        if (!reference && !identifier) {
            this.loading = false;
            this.errorMessage = "No se recibió referencia o identificador del equipo para consultar su historial.";
            return;
        }

        try {
            const summaries = await firstValueFrom(
                this.crmEquipmentApi.listItems({ includeArchived: true, identifier: identifier || undefined }).pipe(timeout(20000)),
            );
            const projects = await firstValueFrom(
                this.projectService.projects$.pipe(take(1), timeout(5000)),
            );

            const recordIDs = this.resolveRecordIDsFromSummaries(summaries, reference, identifier);
            if (!recordIDs.length) {
                this.errorMessage = "No encontramos coincidencias del equipo en los registros disponibles.";
                return;
            }

            const recordResponses = await Promise.all(
                recordIDs.map((recordID) =>
                    firstValueFrom(
                        this.crmEquipmentApi.getRecord(recordID, true).pipe(
                            timeout(20000),
                            catchError(() => of(null)),
                        ),
                    ),
                ),
            );

            const records = recordResponses.filter((record): record is ProspectEquipmentRecord => !!record);
            if (!records.length) {
                this.errorMessage = "No encontramos coincidencias del equipo en los registros disponibles.";
                return;
            }

            const inventoryState = await this.loadInventoryState();
            const built = this.buildHistory(records, projects, inventoryState, reference, identifier);
            if (!built) {
                this.errorMessage = "No encontramos coincidencias del equipo en los registros disponibles.";
                this.lubotAiInsight = "No hubo coincidencia exacta para construir trazabilidad del equipo actual.";
                return;
            }

            this.buildSimilarCasesSection(summaries, reference, identifier);
            void this.refreshSimilarCases(reference, identifier, summaries);
            void this.loadEquipmentPurchaseLines().then(() => this.changeDetectorRef.detectChanges());
        } catch {
            this.errorMessage = "No se pudo cargar el historial técnico desde backend.";
            this.lubotAiInsight = "No fue posible generar análisis con Lubot AI por timeout o error de backend.";
        } finally {
            this.loading = false;
            this.changeDetectorRef.detectChanges();
        }
    }

    runLubotAIAnalysis(): void {
        const reference = String(this.equipmentReference ?? "").trim();
        const identifier = String(this.equipmentIdentifier || this.equipmentSerie || "").trim();
        if (!reference && !identifier) {
            this.lubotAiInsight = "No hay referencia o identificador disponible para ejecutar el análisis con Lubot AI.";
            this.changeDetectorRef.detectChanges();
            return;
        }

        void this.loadLubotAIInsight(reference, identifier);
    }

    private async refreshSimilarCases(reference: string, identifier: string, baseline: ProspectEquipmentSummary[]): Promise<void> {
        if (!identifier.trim()) {
            return;
        }

        const fullSummaries = await firstValueFrom(
            this.crmEquipmentApi.listItems({ includeArchived: true }).pipe(
                timeout(20000),
                catchError(() => of([] as ProspectEquipmentSummary[])),
            ),
        );

        if (!fullSummaries.length) {
            return;
        }

        this.buildSimilarCasesSection(this.mergeSummaries(baseline, fullSummaries), reference, identifier);
        this.changeDetectorRef.detectChanges();
    }

    private async loadLubotAIInsight(reference: string, identifier: string): Promise<void> {
        const normalizedReference = String(reference ?? "").trim();
        const normalizedIdentifier = String(identifier ?? "").trim();
        if (!normalizedReference && !normalizedIdentifier) {
            return;
        }

        this.lubotAiLoading = true;

        let response: EquipmentInsightResponse | null = null;
        let requestErrorMessage = "";
        try {
            response = await firstValueFrom(
                this.crmEquipmentApi.getInsight({
                    reference: normalizedReference || undefined,
                    identifier: normalizedIdentifier || undefined,
                    includeArchived: true,
                }).pipe(timeout(35000)),
            );
        } catch (error) {
            requestErrorMessage = this.formatLubotAIRequestError(error);
        }

        if (!response) {
            this.lubotAiInsight = requestErrorMessage || "No fue posible obtener respuesta de Lubot AI en este intento.";
            this.lubotAiLoading = false;
            this.changeDetectorRef.detectChanges();
            return;
        }

        const presumedFailure = String(response.presumedFailure ?? "").trim();
        this.lubotAiPresumedFailure = presumedFailure || this.lubotAiPresumedFailure;

        const recurrentFailures = this.mapLubotAIRecurrentFailures(response.recurrentFailures ?? []);
        if (recurrentFailures.length > 0) {
            this.recurrentFailures = recurrentFailures;
        }

        const summary = this.sanitizeLubotSummary(String(response.summary ?? "").trim());
        const analyzedCases = Number(response.analyzedCases ?? 0);
        const fallback = Boolean(response.fallback);

        if (summary) {
            this.lubotAiInsight = summary;
        } else if (analyzedCases > 0) {
            this.lubotAiInsight = `Lubot AI analizo ${analyzedCases} caso(s) y preparó un resumen técnico.`;
        } else {
            this.lubotAiInsight = "Lubot AI no recibió suficientes datos para construir una conclusión.";
        }

        if (fallback) {
            this.lubotAiInsight = `${this.lubotAiInsight} (Modo respaldo local).`;
        }

        this.lubotAiLastRunAt = String(response.generatedAt ?? "").trim() || new Date().toISOString();
        this.lubotAiLoading = false;
        this.changeDetectorRef.detectChanges();
    }

    private formatLubotAIRequestError(error: unknown): string {
        const raw = error instanceof Error ? String(error.message ?? "").trim() : String(error ?? "").trim();
        if (!raw) {
            return "No fue posible obtener respuesta de Lubot AI en este intento.";
        }

        if (raw.includes("status 404")) {
            return "Lubot AI no disponible: endpoint de insights respondió 404. Verifica API base URL y despliegue backend.";
        }

        if (raw.includes("status 401")) {
            return "Lubot AI no disponible: la sesión no tiene autorización (401).";
        }

        if (raw.includes("status 403")) {
            return "Lubot AI no disponible: acceso denegado por backend (403).";
        }

        if (raw.toLowerCase().includes("timeout")) {
            return "Lubot AI no respondió a tiempo. Intenta nuevamente en unos segundos.";
        }

        return `Lubot AI no disponible: ${raw}`;
    }

    private sanitizeLubotSummary(rawSummary: string): string {
        const withoutModelTag = rawSummary
            .replace(/\(\s*Modelo[^)]*\)\.?/gi, "")
            .replace(/\bmodelo\s+deepseek[-_ ]?chat\b\.?/gi, "")
            .replace(/\s{2,}/g, " ")
            .trim();

        return withoutModelTag;
    }

    private mapLubotAIRecurrentFailures(
        failures: Array<{ label?: string; count?: number; percentage?: number }>,
    ): RecurrentFailureEntry[] {
        if (!Array.isArray(failures) || failures.length === 0) {
            return [];
        }

        return failures
            .map((entry) => {
                const label = this.normalizeFailureLabel(String(entry.label ?? ""));
                const count = Math.max(1, Math.trunc(Number(entry.count ?? 0) || 0));
                const percentage = Math.max(1, Math.min(100, Math.trunc(Number(entry.percentage ?? 0) || 0)));
                return {
                    label,
                    count,
                    percentage,
                };
            })
            .filter((entry) => entry.label.length > 0)
            .slice(0, 5);
    }

    private buildSimilarCasesSection(summaries: ProspectEquipmentSummary[], reference: string, identifier: string): void {
        const seedSummary = this.findSeedSummary(summaries, reference, identifier);
        if (!seedSummary) {
            this.similarCases = [];
            this.recurrentFailures = [];
            this.lubotAiInsight = "No se encontró un caso base para calcular similitudes.";
            return;
        }

        const relatedReferences = new Set(this.linkedReceptions.map((entry) => entry.reference));
        const seedReference = this.summaryReference(seedSummary);
        const seedDisplayTokens = this.tokenize(seedSummary.displayName || `${seedSummary.marca} ${seedSummary.tipo}`);
        const seedFailureTokens = this.tokenize(seedSummary.failureDescription);

        this.similarCases = summaries
            .map((summary) => this.mapSimilarCase(seedSummary, summary, seedDisplayTokens, seedFailureTokens))
            .filter((entry): entry is SimilarCaseEntry => !!entry)
            .filter((entry) => entry.reference !== seedReference)
            .filter((entry) => !relatedReferences.has(entry.reference))
            .filter((entry) => entry.similarityScore >= 35)
            .sort((left, right) => {
                if (left.similarityScore !== right.similarityScore) {
                    return right.similarityScore - left.similarityScore;
                }

                return this.sortByDateDesc(left.updatedAt, right.updatedAt);
            })
            .slice(0, 8);

        this.recurrentFailures = this.buildRecurrentFailures(this.similarCases);
        this.lubotAiInsight = this.buildLubotFallbackHint(seedSummary, this.similarCases, this.recurrentFailures);
    }

    private findSeedSummary(summaries: ProspectEquipmentSummary[], reference: string, identifier: string): ProspectEquipmentSummary | null {
        const normalizedReference = reference.trim();
        if (normalizedReference) {
            const byReference = summaries.find((summary) => this.summaryReference(summary) === normalizedReference);
            if (byReference) {
                return byReference;
            }
        }

        const normalizedIdentifier = this.normalize(identifier);
        if (!normalizedIdentifier) {
            return null;
        }

        return summaries.find((summary) => this.summaryMatchesIdentifier(summary, normalizedIdentifier)) ?? null;
    }

    private mapSimilarCase(
        seed: ProspectEquipmentSummary,
        candidate: ProspectEquipmentSummary,
        seedDisplayTokens: string[],
        seedFailureTokens: string[],
    ): SimilarCaseEntry | null {
        const candidateReference = this.summaryReference(candidate);
        if (!candidateReference) {
            return null;
        }

        const matchReasons: string[] = [];
        let score = 0;

        if (this.normalize(seed.marca) && this.normalize(seed.marca) === this.normalize(candidate.marca)) {
            score += 24;
            matchReasons.push(`Marca ${candidate.marca}`);
        }

        if (this.normalize(seed.tipo) && this.normalize(seed.tipo) === this.normalize(candidate.tipo)) {
            score += 24;
            matchReasons.push(`Tipo ${candidate.tipo}`);
        }

        if (this.normalize(seed.familyName) && this.normalize(seed.familyName) === this.normalize(candidate.familyName)) {
            score += 16;
            matchReasons.push(`Familia ${candidate.familyName}`);
        }

        if (this.normalize(seed.serviceTypeName) && this.normalize(seed.serviceTypeName) === this.normalize(candidate.serviceTypeName)) {
            score += 10;
            matchReasons.push(`Servicio ${candidate.serviceTypeName}`);
        }

        const candidateDisplayTokens = this.tokenize(candidate.displayName || `${candidate.marca} ${candidate.tipo}`);
        const displayOverlap = this.tokenOverlapRatio(seedDisplayTokens, candidateDisplayTokens);
        if (displayOverlap >= 0.34) {
            score += Math.round(displayOverlap * 18);
            matchReasons.push("Nombre tecnico similar");
        }

        const failureOverlap = this.tokenOverlapRatio(seedFailureTokens, this.tokenize(candidate.failureDescription));
        if (failureOverlap >= 0.2) {
            score += Math.round(failureOverlap * 12);
            matchReasons.push("Falla parecida");
        }

        score = Math.min(score, 100);

        return {
            reference: candidateReference,
            identifier: String(candidate.receivedIdentifier ?? "").trim(),
            serie: String(candidate.serie ?? "").trim(),
            displayName: String(candidate.displayName ?? "").trim(),
            serviceTypeName: String(candidate.serviceTypeName ?? "").trim(),
            repairStatusLabel: String(candidate.repairStatusLabel ?? "").trim() || "Sin estado",
            failureDescription: String(candidate.failureDescription ?? "").trim(),
            receptionLabel: String(candidate.receptionLabel ?? "").trim(),
            updatedAt: String(candidate.repairStatusUpdatedAt ?? "").trim(),
            similarityScore: score,
            matchReasons,
        };
    }

    private buildRecurrentFailures(similarCases: SimilarCaseEntry[]): RecurrentFailureEntry[] {
        if (!similarCases.length) {
            return [];
        }

        const counts = new Map<string, { label: string; count: number }>();
        similarCases.forEach((entry) => {
            const label = this.normalizeFailureLabel(entry.failureDescription);
            if (!label) {
                return;
            }

            const key = this.normalize(label);
            const current = counts.get(key);
            if (current) {
                current.count += 1;
                return;
            }

            counts.set(key, { label, count: 1 });
        });

        const total = similarCases.length;
        return Array.from(counts.values())
            .sort((left, right) => right.count - left.count)
            .slice(0, 3)
            .map((entry) => ({
                label: entry.label,
                count: entry.count,
                percentage: Math.round((entry.count / total) * 100),
            }));
    }

    private buildLubotFallbackHint(
        seed: ProspectEquipmentSummary,
        similarCases: SimilarCaseEntry[],
        recurrentFailures: RecurrentFailureEntry[],
    ): string {
        if (!similarCases.length) {
            return "No hay casos similares suficientes para sugerir una predicción confiable.";
        }

        const averageSimilarity = Math.round(
            similarCases.reduce((sum, entry) => sum + entry.similarityScore, 0) / similarCases.length,
        );
        const recurrent = recurrentFailures[0];
        const recurrentLabel = recurrent ? recurrent.label : "sin patron dominante";
        const recurrentCount = recurrent ? recurrent.count : 0;
        const mainReason = this.findMostFrequentMatchReason(similarCases);

        return `Se detectaron ${similarCases.length} caso(s) similares con ${averageSimilarity}% de similitud promedio. `
            + `La falla mas recurrente es "${recurrentLabel}" (${recurrentCount} caso(s)). `
            + `Patron dominante: ${mainReason}. `
            + `Este es un resumen local sin consumo de tokens. `
            + `Pulsa "Analizar con Lubot AI" para una inferencia del modelo sobre ${seed.displayName || seed.tipo}.`;
    }

    private findMostFrequentMatchReason(similarCases: SimilarCaseEntry[]): string {
        const counts = new Map<string, number>();
        similarCases.forEach((entry) => {
            entry.matchReasons.forEach((reason) => {
                counts.set(reason, (counts.get(reason) ?? 0) + 1);
            });
        });

        const topReason = Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0];
        return topReason ? topReason[0] : "Coincidencia tecnica general";
    }

    private resolveRecordIDsFromSummaries(
        summaries: ProspectEquipmentSummary[],
        reference: string,
        identifier: string,
    ): string[] {
        const normalizedReference = reference.trim();
        const normalizedIdentifier = this.normalize(identifier);
        const parsedRecordID = this.parseRecordIDFromReference(normalizedReference);

        if (!summaries.length) {
            return parsedRecordID ? [parsedRecordID] : [];
        }

        let seedSummary: ProspectEquipmentSummary | null = null;
        if (normalizedReference) {
            seedSummary = summaries.find((summary) => this.summaryReference(summary) === normalizedReference) ?? null;
        }

        if (!seedSummary && normalizedIdentifier) {
            seedSummary = summaries.find((summary) => this.summaryMatchesIdentifier(summary, normalizedIdentifier)) ?? null;
        }

        const recordIDSet = new Set<string>();

        if (seedSummary) {
            const seedReference = this.summaryReference(seedSummary);
            const seedIdentifier = this.normalize(seedSummary.receivedIdentifier);
            const seedSerie = this.normalize(seedSummary.serie);

            summaries.forEach((summary) => {
                const sameReference = this.summaryReference(summary) === seedReference;
                const identifierMatch = seedIdentifier.length > 0 && this.normalize(summary.receivedIdentifier) === seedIdentifier;
                const serieMatch = seedSerie.length > 0 && this.normalize(summary.serie) === seedSerie;

                if (sameReference || identifierMatch || serieMatch) {
                    const recordID = String(summary.recordId ?? "").trim();
                    if (recordID) {
                        recordIDSet.add(recordID);
                    }
                }
            });
        }

        if (parsedRecordID) {
            recordIDSet.add(parsedRecordID);
        }

        return Array.from(recordIDSet);
    }

    private summaryReference(summary: ProspectEquipmentSummary): string {
        const recordID = String(summary.recordId ?? "").trim();
        const itemID = String(summary.itemId ?? "").trim();
        if (!recordID || !itemID) {
            return "";
        }

        return `${recordID}::${itemID}`;
    }

    private summaryMatchesIdentifier(summary: ProspectEquipmentSummary, normalizedIdentifier: string): boolean {
        if (!normalizedIdentifier) {
            return false;
        }

        const candidates = [summary.receivedIdentifier, summary.serie, summary.customerShipmentReference];
        return candidates.some((candidate) => this.normalize(candidate) === normalizedIdentifier);
    }

    private normalizeFailureLabel(value: string): string {
        const compact = String(value ?? "").replace(/\s+/g, " ").trim();
        if (!compact) {
            return "";
        }

        if (compact.length <= 110) {
            return compact;
        }

        return `${compact.slice(0, 107)}...`;
    }

    private tokenize(value: unknown): string[] {
        const normalized = String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

        if (!normalized) {
            return [];
        }

        return Array.from(
            new Set(
                normalized
                    .split(/\s+/)
                    .filter((token) => token.length >= 3)
                    .filter((token) => !SIMILARITY_STOPWORDS.has(token)),
            ),
        );
    }

    private tokenOverlapRatio(seedTokens: string[], candidateTokens: string[]): number {
        if (!seedTokens.length || !candidateTokens.length) {
            return 0;
        }

        const seedSet = new Set(seedTokens);
        const candidateSet = new Set(candidateTokens);
        let overlap = 0;
        seedSet.forEach((token) => {
            if (candidateSet.has(token)) {
                overlap += 1;
            }
        });

        return overlap / Math.max(1, Math.min(seedSet.size, candidateSet.size));
    }

    private mergeSummaries(primary: ProspectEquipmentSummary[], secondary: ProspectEquipmentSummary[]): ProspectEquipmentSummary[] {
        const merged = new Map<string, ProspectEquipmentSummary>();
        [...primary, ...secondary].forEach((summary) => {
            const key = [
                String(summary.recordId ?? "").trim(),
                String(summary.itemId ?? "").trim(),
                String(summary.receivedIdentifier ?? "").trim(),
                String(summary.serie ?? "").trim(),
                String(summary.customerShipmentReference ?? "").trim(),
            ].join("::");

            if (!merged.has(key)) {
                merged.set(key, summary);
            }
        });

        return Array.from(merged.values());
    }

    private parseRecordIDFromReference(reference: string): string {
        const normalizedReference = reference.trim();
        if (!normalizedReference.includes("::")) {
            return "";
        }

        const [recordID] = normalizedReference.split("::");
        return String(recordID ?? "").trim();
    }

    private buildHistory(
        records: ProspectEquipmentRecord[],
        projects: Project[],
        inventoryState: InventoryState,
        reference: string,
        identifier: string,
    ): boolean {
        const references = this.buildReferenceEntries(records);
        if (!references.length) {
            return false;
        }

        const seedEntry = this.findSeedEntry(references, reference, identifier);
        if (!seedEntry) {
            return false;
        }

        const relatedEntries = this.collectRelatedEntries(references, seedEntry);
        if (!relatedEntries.length) {
            return false;
        }

        this.equipmentReference = seedEntry.reference;
        this.equipmentDisplayName = this.buildItemLabel(seedEntry.item);
        this.equipmentIdentifier = seedEntry.item.receivedIdentifier;
        this.equipmentSerie = seedEntry.item.serie;
        this.equipmentServiceType = seedEntry.item.serviceTypeName;
        this.equipmentFailureDescription = seedEntry.item.failureDescription;

        this.linkedReceptions = relatedEntries
            .map((entry) => ({
                reference: entry.reference,
                receptionLabel: this.formatReception(entry.record),
                companyName: entry.record.companyName,
                locationName: entry.item.storageLocationName,
                repairStatusLabel: getProspectEquipmentRepairStatusLabel(entry.item.repairStatus ?? "recibido"),
                updatedAt: entry.record.updatedAt,
            }))
            .sort((left, right) => this.sortByDateDesc(left.updatedAt, right.updatedAt));

        this.attachmentBlocks = relatedEntries
            .map((entry) => ({
                recordId: entry.record.id,
                itemId: entry.item.id,
                receptionLabel: this.formatReception(entry.record),
                companyName: entry.record.companyName,
                itemLabel: this.buildItemLabel(entry.item),
                storageLocationName: entry.item.storageLocationName,
                attachments: Array.isArray(entry.item.attachments) ? [...entry.item.attachments] : [],
                uploading: false,
                errorMessage: "",
                successMessage: "",
            }))
            .sort((left, right) => left.receptionLabel.localeCompare(right.receptionLabel));

        const relatedReferenceSet = new Set(relatedEntries.map((entry) => entry.reference));
        const relatedIdentifiers = new Set(
            relatedEntries
                .flatMap((entry) => [entry.item.receivedIdentifier, entry.item.serie])
                .map((value) => this.normalize(value))
                .filter((value) => value.length > 0),
        );

        this.interventions = this.buildInterventions(projects, inventoryState, relatedReferenceSet, relatedIdentifiers);
        return true;
    }

    private buildInterventions(
        projects: Project[],
        inventoryState: InventoryState,
        relatedReferenceSet: Set<string>,
        relatedIdentifiers: Set<string>,
    ): EquipmentInterventionEntry[] {
        return projects
            .filter((project) => this.matchesProject(project, relatedReferenceSet, relatedIdentifiers))
            .map((project) => {
                const properties = project.properties ?? {};
                const linkedReference = this.buildReferenceFromProject(properties);
                const materialUsage = this.buildMaterialUsage(project, inventoryState);
                const dispatchHistory = Array.isArray(properties["dispatchHistory"])
                    ? (properties["dispatchHistory"] as Array<Record<string, unknown>>)
                    : [];

                const latestDispatchAt = dispatchHistory
                    .map((entry) => String(entry["createdAt"] ?? "").trim())
                    .filter((value) => value.length > 0)
                    .sort((left, right) => this.sortByDateDesc(left, right))[0] ?? "";

                return {
                    projectId: project.id,
                    projectTitle: project.title,
                    shortCode: String(properties["shortCode"] ?? "").trim(),
                    stageLabel: String(properties["stageName"] ?? project.status).trim() || project.status,
                    updatedAt: this.toIsoDate(project.updatedAt),
                    linkedReference,
                    diagnosticNotes: String(properties["diagnosticNotes"] ?? "").trim(),
                    repairNotes: String(properties["repairNotes"] ?? "").trim(),
                    estimatedHours: this.normalizeNumber(properties["estimatedHours"]),
                    actualHours: this.normalizeNumber(properties["actualHours"]),
                    testTypeLabel: getProjectTechnicalTestTypeLabel(String(properties["testType"] ?? "sin-pruebas")),
                    dispatchCount: dispatchHistory.length,
                    latestDispatchAt,
                    materialUsage,
                };
            })
            .sort((left, right) => this.sortByDateDesc(left.updatedAt, right.updatedAt));
    }

    private buildMaterialUsage(project: Project, inventoryState: InventoryState): MaterialUsageEntry[] {
        const properties = project.properties ?? {};
        const reservationIds = this.getStringArray(properties["materialReservationIds"]);

        let reservations = inventoryState.reservations.filter((reservation) => reservationIds.includes(reservation.id));
        if (reservations.length === 0) {
            const workOrder = String(properties["shortCode"] ?? project.id).trim();
            const normalizedEquipmentTag = this.normalize(
                String(properties["equipmentIdentifier"] ?? properties["equipmentDisplayName"] ?? "").trim(),
            );

            reservations = inventoryState.reservations.filter((reservation) => {
                const byWorkOrder = workOrder.length > 0 && reservation.workOrder === workOrder;
                const byEquipmentTag =
                    normalizedEquipmentTag.length > 0 && this.normalize(reservation.equipmentTag) === normalizedEquipmentTag;
                return byWorkOrder || byEquipmentTag;
            });
        }

        return reservations
            .map((reservation) => {
                const matchingMovements = inventoryState.movements.filter(
                    (movement) => movement.type === "salida" && movement.evidenceRef === reservation.id,
                );

                const consumedQuantity = matchingMovements.reduce((sum, movement) => sum + this.normalizeNumber(movement.quantity), 0);
                const lastConsumedAt = matchingMovements
                    .map((movement) => String(movement.requestedAt ?? "").trim())
                    .filter((value) => value.length > 0)
                    .sort((left, right) => this.sortByDateDesc(left, right))[0] ?? "";

                return {
                    reservationId: reservation.id,
                    reference: reservation.reference,
                    quantity: this.normalizeNumber(reservation.quantity),
                    status: reservation.status,
                    assignedTo: reservation.assignedTo,
                    commitmentDate: reservation.commitmentDate || "",
                    reservedAt: reservation.reservedAt,
                    consumedQuantity,
                    lastConsumedAt,
                };
            })
            .sort((left, right) => this.sortByDateDesc(left.reservedAt, right.reservedAt));
    }

    private matchesProject(project: Project, relatedReferenceSet: Set<string>, relatedIdentifiers: Set<string>): boolean {
        const properties = project.properties ?? {};
        const linkedReference = this.buildReferenceFromProject(properties);
        if (linkedReference && relatedReferenceSet.has(linkedReference)) {
            return true;
        }

        const normalizedIdentifier = this.normalize(properties["equipmentIdentifier"]);
        if (normalizedIdentifier && relatedIdentifiers.has(normalizedIdentifier)) {
            return true;
        }

        const normalizedSerie = this.normalize(properties["equipmentSerie"]);
        return normalizedSerie.length > 0 && relatedIdentifiers.has(normalizedSerie);
    }

    private buildReferenceEntries(records: ProspectEquipmentRecord[]): EquipmentReferenceEntry[] {
        return records.flatMap((record) =>
            (record.items ?? []).map((item) => ({
                record,
                item,
                reference: `${record.id}::${item.id}`,
            })),
        );
    }

    private findSeedEntry(entries: EquipmentReferenceEntry[], reference: string, identifier: string): EquipmentReferenceEntry | null {
        const normalizedReference = reference.trim();
        if (normalizedReference) {
            const byReference = entries.find((entry) => entry.reference === normalizedReference);
            if (byReference) {
                return byReference;
            }
        }

        const normalizedIdentifier = this.normalize(identifier);
        if (!normalizedIdentifier) {
            return null;
        }

        return (
            entries.find((entry) => {
                const candidates = [entry.item.receivedIdentifier, entry.item.serie, entry.item.customerShipmentReference];
                return candidates.some((candidate) => this.normalize(candidate) === normalizedIdentifier);
            }) ?? null
        );
    }

    private collectRelatedEntries(entries: EquipmentReferenceEntry[], seed: EquipmentReferenceEntry): EquipmentReferenceEntry[] {
        const seedIdentifier = this.normalize(seed.item.receivedIdentifier);
        const seedSerie = this.normalize(seed.item.serie);

        return entries
            .filter((entry) => {
                if (entry.reference === seed.reference) {
                    return true;
                }

                const identifierMatch = seedIdentifier.length > 0 && this.normalize(entry.item.receivedIdentifier) === seedIdentifier;
                const serieMatch = seedSerie.length > 0 && this.normalize(entry.item.serie) === seedSerie;
                return identifierMatch || serieMatch;
            })
            .sort((left, right) => this.sortByDateDesc(left.record.updatedAt, right.record.updatedAt));
    }

    private buildReferenceFromProject(properties: Record<string, unknown>): string {
        const recordId = String(properties["equipmentRecordId"] ?? "").trim();
        const itemId = String(properties["equipmentItemId"] ?? "").trim();
        if (!recordId || !itemId) {
            return "";
        }

        return `${recordId}::${itemId}`;
    }

    private buildItemLabel(item: ProspectEquipmentItem): string {
        const parts = [item.familyName, item.marca, item.tipo, item.serie].map((value) => String(value ?? "").trim()).filter(Boolean);
        return parts.length ? parts.join(" · ") : "Equipo";
    }

    private formatReception(record: ProspectEquipmentRecord): string {
        const day = String(record.receptionDay ?? "").trim() || "--";
        const month = String(record.receptionMonth ?? "").trim() || "--";
        const year = String(record.receptionYear ?? "").trim() || "----";
        return `${day}/${month}/${year}`;
    }

    private normalize(value: unknown): string {
        return String(value ?? "").trim().toLowerCase();
    }

    private getStringArray(value: unknown): string[] {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.map((item) => String(item ?? "").trim()).filter((item) => item.length > 0);
    }

    private normalizeNumber(value: unknown): number {
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isFinite(numeric)) {
            return 0;
        }

        return Math.max(0, Math.round(numeric));
    }

    private toIsoDate(value: unknown): string {
        const parsed = value instanceof Date ? value : new Date(String(value ?? ""));
        if (Number.isNaN(parsed.getTime())) {
            return "";
        }

        return parsed.toISOString();
    }

    private sortByDateDesc(left: string, right: string): number {
        return Date.parse(right || "") - Date.parse(left || "");
    }

    /**
     * Carga reservas y movimientos reales de inventario para alimentar la tabla
     * "Repuestos usados" de cada intervención (buildMaterialUsage).
     * Gap de API (backend): /inventory/reservations y /inventory/movements no
     * aceptan filtro por equipo ni por orden de trabajo, así que se cargan
     * completos y el cruce se hace en cliente por workOrder/equipmentTag del
     * proyecto. Idealmente el backend expondría GET ...?equipmentTag=.
     */
    private async loadInventoryState(): Promise<InventoryState> {
        const empty = this.emptyInventoryState();
        const [reservations, movements] = await Promise.all([
            firstValueFrom(
                this.inventoryApi.listReservations().pipe(
                    timeout(15000),
                    catchError(() => of([] as ReservationRecord[])),
                ),
            ),
            firstValueFrom(
                this.inventoryApi.listMovements().pipe(
                    timeout(15000),
                    catchError(() => of([] as MovementRecord[])),
                ),
            ),
        ]);
        return { ...empty, reservations, movements };
    }

    private emptyInventoryState(): InventoryState {
        return {
            references: [],
            movements: [],
            adjustmentRequests: [],
            reservations: [],
            maxReserveDays: 0,
            replenishmentItems: [],
            purchaseLines: [],
            weeklySnapshots: [],
            bagTraces: [],
            sessions: [],
            discrepancies: [],
            auditTrail: [],
        };
    }
}
