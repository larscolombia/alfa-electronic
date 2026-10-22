import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Subscription } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { InventoryRbacService } from '../../../services/inventory-rbac.service';
import { InventoryWorkflowService } from '../../../services/inventory-workflow.service';
import { InventoryApiService } from '../../../services/inventory-api.service';
import { PurchaseLine, ReservationRecord, StockReference } from '../../../services/inventory-domain.models';
import { WorkEquipmentHistoryContextService } from '../../../services/work-equipment-history-context.service';
import { CrmEquipmentApiService } from '../../../services/crm-equipment-api.service';
import { HrPeoplePickerService } from '../../../services/hr-people-picker.service';
import { ProjectsApiService } from '../../../services/projects-api.service';
import { EmailsApiService } from '../../../services/emails-api.service';
import { WorktimeApiService } from '../../../services/worktime-api.service';
import { buildCommercialDocumentCode } from '../company/company-commercial-settings.store';
import { buildEquipmentQrShortCode, generateEquipmentQrDataUrl } from '../crm/equipment-qr.util';
import { QuotePrefillFromProject, setQuotePrefill } from '../crm/quote-prefill.store';
import { ProspectEquipmentAttachment, ProspectEquipmentEvidencePhoto, ProspectEquipmentItem, ProspectEquipmentRepairStatus } from '../crm/crm-prospect-equipment.store';
import { Attachment, BoardColumn, Project, ProjectBoard } from './models';
import { PROJECT_TEST_TYPE_OPTIONS, getProjectTechnicalTestTypeLabel, resolveProjectSlaSeverity } from './project-workflow.config';
import { SlaSummaryChip, accumulateQuarterHours, buildSlaSummary, requiresAccessoriesConfirmation, resolveWarrantyBoardStatus } from './kanban-extras.logic';
import { resolveStatusAfterPartsRequest, validateReadyForDelivery } from './project-auto-transitions.logic';
import { ProjectEquipmentOption, ProjectEquipmentService, ProjectService } from './services';
import { ProjectCardComponent } from './components/project-card/project-card.component';
import { ProjectTransitionCheckModalComponent } from './components/project-transition-check-modal.component';
import { WorkTestBatchRun, WorkTestTransitionPrompt } from '../work/work-test-batch.models';
import { WorkTestBatchService } from '../work/work-test-batch.service';

declare const dragula: any;

interface PendingProjectTransition {
  mode: 'detail' | 'drag';
  projectId: string;
  projectTitle: string;
  fromStatusId: string;
  toStatusId: string;
  fromStatusLabel: string;
  toStatusLabel: string;
  prompt: WorkTestTransitionPrompt;
  requiresCompletion: boolean;
}

interface ProjectMaterialRequestDraft {
  reference: string;
  quantity: number;
  assignedTo: string;
  purpose: string;
  workOrder: string;
  equipmentTag: string;
  customerSite: string;
  priority: 'critica' | 'alta' | 'media' | 'baja';
  commitmentDate: string;
}

interface ProjectDispatchDraft {
  deliveryMethod: 'transportadora' | 'recoge-cliente';
  carrier: string;
  guideNumber: string;
  pickedUpBy: string;
  includePrice: boolean;
  includeInterventionReport: boolean;
  includePurchaseOrder: boolean;
  notifyClient: boolean;
  notes: string;
}

interface ProjectDispatchRecord {
  id: string;
  code: string;
  createdAt: string;
  deliveryMethod: 'transportadora' | 'recoge-cliente';
  carrier: string;
  guideNumber: string;
  pickedUpBy: string;
  includePrice: boolean;
  includeInterventionReport: boolean;
  includePurchaseOrder: boolean;
  notifyClient: boolean;
  notes: string;
  deliveredBy: string;
  clientName: string;
  equipmentName: string;
  totalValue: number | null;
  paymentCondition: 'contra-entrega' | 'credito';
  paymentStatus: 'pendiente' | 'parcial' | 'confirmado';
  paymentReference: string;
  paymentConfirmedAt: string;
  generatedAttachmentIds: string[];
}

interface TechnicalReportView {
  projectCode: string;
  projectTitle: string;
  clientName: string;
  equipmentName: string;
  statusLabel: string;
  generatedAt: string;
  receivedAt: string;
  lastWorkflowUpdateAt: string;
  failureDescription: string;
  diagnosticNotes: string;
  repairNotes: string;
  testTypeLabel: string;
  repairabilityPercent: number;
  estimatedHours: number;
  actualHours: number;
}

type ProjectPaymentCondition = 'contra-entrega' | 'credito';

type ProjectPaymentStatus = 'pendiente' | 'parcial' | 'confirmado';

type BoardAudience = 'tecnico' | 'administrativo' | 'todos';

interface DiagnosisInspection {
  disassembled: boolean;
  staticTest: boolean;
  powerOnTest: boolean;
  faultIdentified: boolean;
}

type ProjectDetailTab = 'equipo' | 'materiales' | 'identidad' | 'planeacion' | 'notas';

@Component({
  selector: 'app-kanban-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ProjectCardComponent, ProjectTransitionCheckModalComponent],
  template: `
    <ng-container *ngIf="board$ | async as board">
      <div class="alert alert-success border mb-3" *ngIf="boardActionMessage && !detailRouteMode">
        {{ boardActionMessage }}
      </div>

      <div class="alert alert-success border mb-3" *ngIf="receptionProjectsMessage && !detailRouteMode">
        {{ receptionProjectsMessage }}
      </div>

      <div class="board-audience-toolbar" *ngIf="!detailRouteMode">
        <div>
          <strong>Vista del tablero</strong>
          <small>Filtra por audiencia sin borrar informacion del caso.</small>
        </div>

        <div class="board-audience-toolbar__chips" role="group" aria-label="Filtro de audiencia del tablero">
          <button
            type="button"
            class="board-audience-chip"
            *ngFor="let option of boardAudienceOptions"
            [class.is-active]="boardAudience === option.value"
            (click)="setBoardAudience(option.value)">
            {{ option.label }}
          </button>
          <button
            type="button"
            class="board-audience-chip"
            data-testid="only-my-projects-toggle"
            [class.is-active]="onlyMyProjects"
            [attr.title]="'Muestra solo los casos asignados a ' + (currentUserName() || 'ti')"
            (click)="toggleOnlyMyProjects()">
            Mis equipos
          </button>
        </div>
      </div>

      <div class="sla-summary-bar" *ngIf="!detailRouteMode" data-testid="sla-summary-bar">
        <button
          type="button"
          class="sla-summary-chip"
          *ngFor="let chip of getSlaSummaryChips(board)"
          data-testid="sla-summary-chip"
          [attr.data-column-id]="chip.columnId"
          [attr.title]="'Ir a la columna ' + chip.title"
          [ngClass]="'sla-summary-chip--' + chip.severity"
          (click)="onSlaSummaryChipClick(chip)">
          <span class="sla-summary-chip__dot"></span>
          {{ chip.title }} · {{ chip.count }}
        </button>
      </div>

      <div class="kanban-board d-flex flex-nowrap overflow-x-auto pb-3 gap-3" *ngIf="!detailRouteMode">
        <section class="kanban-column flex-shrink-0" style="width: 320px;" *ngFor="let column of board.columns">
          @let columnProjects = getProjectsByColumn(column.id);
          <header class="column-header">
            <div class="board-column-header d-flex justify-content-between align-items-center px-2 py-1" [attr.data-testid]="'column-header-' + column.id">
              <div class="column-header__title-wrap">
                <span class="column-color-dot" [style.background]="column.color"></span>
                <div>
                  <span class="fw-bold small text-truncate">{{ column.name }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center gap-1">
                <span class="badge bg-secondary rounded-pill ms-1" [attr.data-testid]="'column-count-' + column.id">{{ columnProjects.length }}</span>
                <span class="project-count badge" [style.background]="getColumnBadgeColor(column.color)">
                  {{ columnProjects.length }}
                </span>
              </div>
            </div>
          </header>

          <div class="cards-container">
            <div
              #columnDropZone
              class="cards-sortable"
              [attr.data-column-id]="column.id">
              <div
                class="project-drag-item"
                *ngFor="let project of columnProjects; trackBy: trackByProjectId"
                [attr.data-project-id]="project.id"
                (click)="onProjectCardClick($event, project)">
                <ng-container *ngIf="!compactMode">
                  <app-project-card
                    [project]="project"
                    [column]="column"
                    [propertyTemplates]="board.propertyTemplates">
                  </app-project-card>
                </ng-container>
                <button
                  *ngIf="compactMode"
                  type="button"
                  class="compact-code-chip"
                  [ngClass]="'compact-chip--' + getCompactSlaSeverity(project, column)"
                  [attr.title]="project.title"
                  (click)="$event.stopPropagation(); navigateToProject(project)">
                  {{ project.properties['equipmentIdentifier'] || project.properties['shortCode'] || project.id }}
                </button>
              </div>

              <div class="column-empty" *ngIf="!columnProjects.length">
                Crea el primer proyecto de esta etapa o arrastra uno aqui para empezar a mover el flujo.
              </div>

            </div>

            <div class="project-composer" *ngIf="creatingColumnId === column.id">
              <input
                type="text"
                class="project-composer__input"
                placeholder="Nombre del proyecto"
                [(ngModel)]="draftTitle"
                (keydown.enter)="submitCreateProject(column.id)"
              />

              <textarea
                class="project-composer__textarea"
                rows="3"
                placeholder="Resumen del proyecto"
                [(ngModel)]="draftDescription"
                (keydown.escape)="cancelCreateProject()"
              ></textarea>

              <div class="project-composer__actions">
                <button type="button" class="btn btn-theme btn-sm" (click)="submitCreateProject(column.id)">
                  Crear y abrir
                </button>
                <button type="button" class="btn btn-link btn-sm" (click)="cancelCreateProject()">
                  Cancelar
                </button>
              </div>
            </div>

          </div>
        </section>
      </div>

      <div class="project-detail-shell is-open" [class.is-route]="detailRouteMode" *ngIf="detailProject">
        <button type="button" class="project-detail-shell__backdrop" *ngIf="!detailRouteMode" (click)="closeProjectDetail()" aria-label="Cerrar detalle"></button>

        <section class="project-detail-dialog is-open">
          <header class="project-detail-dialog__header">
            <div class="project-detail-dialog__hero">
              <span class="project-detail-dialog__icon">
                <i [class]="'bi ' + (detailProject.icon || 'bi-briefcase')"></i>
              </span>

              <div>
                <span class="project-detail-dialog__eyebrow">{{ detailProject.properties['shortCode'] || 'PRJ' }}</span>
                <h3 class="project-detail-dialog__title">{{ detailProject.title || 'Nuevo proyecto' }}</h3>
                <p class="project-detail-dialog__subtitle">
                  Ficha extendida para planificacion, presupuesto, responsables, equipo y control operativo.
                </p>
              </div>
            </div>

            <div class="d-flex align-items-start gap-2">
              <span class="badge bg-secondary align-self-center" data-testid="equipment-session-timer">
                Sesion {{ equipmentSessionElapsed }}
              </span>

              <button
                type="button"
                class="btn btn-outline-theme btn-sm"
                [disabled]="!canOpenEquipmentHistory()"
                [attr.title]="canOpenEquipmentHistory() ? 'Abrir historial tecnico completo' : 'Vincula un equipo en la pestana Equipo tecnico para habilitar el historial'"
                (click)="openEquipmentHistory()">
                Historial tecnico completo
              </button>

              <button type="button" class="btn btn-link project-detail-dialog__close" (click)="closeProjectDetail()">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
          </header>

          <div #projectDetailBody class="project-detail-dialog__body">
            <section class="project-detail-section mb-1 pb-0 border-bottom-0">
              <div class="project-status-row mb-4">
                <button
                  type="button"
                  *ngFor="let status of board.columns"
                  class="status-chip"
                  [class.is-active]="detailProject.status === status.id"
                  [style.borderColor]="getStatusBorder(status.color, detailProject.status === status.id)"
                  [style.backgroundColor]="getStatusBackground(status.color, detailProject.status === status.id)"
                  (click)="selectStatus(status.id)">
                  {{ status.name }}
                </button>
              </div>

              <ul class="nav nav-tabs">
                <li class="nav-item">
                  <a class="nav-link" style="cursor:pointer;" [class.active]="activeDetailTab === 'equipo'" (click)="setActiveDetailTab('equipo')">Equipo técnico</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" style="cursor:pointer;" [class.active]="activeDetailTab === 'materiales'" (click)="setActiveDetailTab('materiales')">Materiales</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" style="cursor:pointer;" [class.active]="activeDetailTab === 'identidad'" (click)="setActiveDetailTab('identidad')">Identidad</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" style="cursor:pointer;" [class.active]="activeDetailTab === 'planeacion'" (click)="setActiveDetailTab('planeacion')">Planeacion y notas</a>
                </li>
              </ul>
            </section>

            <ng-container *ngIf="activeDetailTab === 'equipo'">
              <section class="project-detail-section mt-3">
                <div class="section-heading">
                  <div>
                    <h4>Equipo en reparacion</h4>
                  <p>Relaciona el equipo recibido, escanea su QR y sincroniza estado tecnico con ubicacion.</p>
                </div>
              </div>

              <div class="project-form-grid project-form-grid--2">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Equipo recibido</span>
                  <select
                    class="project-detail-field__input"
                    [ngModel]="selectedEquipmentReference"
                    (ngModelChange)="selectLinkedEquipment($event)">
                    <option value="">Selecciona un equipo recibido</option>
                    <option *ngFor="let equipment of equipmentOptions" [value]="equipment.reference">
                      {{ equipment.displayName }} · {{ equipment.prospectName }} · {{ equipment.receivedIdentifier || 'Sin identificador' }}
                    </option>
                  </select>
                </label>

                <div class="project-detail-field project-detail-field--workflow">
                  <span class="project-detail-field__label">Lectura QR / codigo</span>

                  <div class="equipment-scan-row">
                    <input
                      type="text"
                      class="project-detail-field__input"
                      [(ngModel)]="equipmentIdentifierDraft"
                      placeholder="Ejemplo: QR-ABC-001"
                      (keydown.enter)="searchEquipmentByIdentifier()" />

                    <button
                      type="button"
                      class="btn btn-theme btn-sm"
                      (click)="searchEquipmentByIdentifier()"
                      [disabled]="!equipmentIdentifierDraft.trim()">
                      Vincular
                    </button>

                    <button
                      type="button"
                      class="btn btn-outline-secondary btn-sm"
                      (click)="openEquipmentScanner()"
                      [disabled]="!cameraScannerSupported">
                      Escanear QR
                    </button>
                  </div>

                  <small class="text-secondary" *ngIf="!cameraScannerSupported">
                    El navegador actual no permite lectura continua por camara. Puedes usar el campo manual.
                  </small>
                </div>
              </div>

              <div class="equipment-qr-preview" *ngIf="equipmentQrDataUrl; else equipmentQrPlaceholder">
                <img [src]="equipmentQrDataUrl" alt="QR del equipo vinculado" />
                <div class="equipment-qr-preview__meta">
                  <span class="project-detail-field__label">QR del equipo vinculado</span>
                  <strong>{{ detailProject.properties['equipmentDisplayName'] || 'Equipo vinculado' }}</strong>
                  <small>Identificador: {{ detailProject.properties['equipmentIdentifier'] || 'Sin identificador' }}</small>
                </div>
              </div>

              <ng-template #equipmentQrPlaceholder>
                <div class="helper-box equipment-qr-placeholder">Vincula un equipo para ver su QR dentro del detalle del proyecto.</div>
              </ng-template>

              <div class="alert alert-warning mt-3 mb-0" *ngIf="equipmentQrError">{{ equipmentQrError }}</div>

              <div class="equipment-linked-box" *ngIf="linkedEquipment as equipment; else equipmentNotLinked">
                <div class="equipment-linked-box__header">
                  <strong>{{ equipment.displayName }}</strong>
                  <span class="badge text-bg-light">{{ equipment.prospectName }}</span>
                </div>

                <div class="equipment-linked-box__grid">
                  <span><strong>Identificador:</strong> {{ equipment.receivedIdentifier || 'Sin identificador' }}</span>
                  <span><strong>Serie:</strong> {{ equipment.serie || '--' }}</span>
                  <span><strong>Servicio:</strong> {{ equipment.serviceTypeName || '--' }}</span>
                  <span><strong>Recepcion:</strong> {{ equipment.receptionLabel }}</span>
                  <span><strong>Falla:</strong> {{ equipment.failureDescription || 'Sin detalle' }}</span>
                  <span><strong>Evidencias:</strong> {{ equipment.evidenceCount }}</span>
                </div>

                <div class="equipment-evidence-section mt-3">
                  <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                    <span class="project-detail-field__label mb-0">Fotos de recepción vinculadas</span>
                    <span class="small text-secondary">{{ linkedEquipmentEvidencePhotos.length }} foto(s)</span>
                  </div>

                  <div class="helper-box" *ngIf="linkedEquipmentEvidenceLoading">Cargando fotos de la recepción...</div>
                  <div class="alert alert-warning py-2 mb-2" *ngIf="!linkedEquipmentEvidenceLoading && linkedEquipmentEvidenceError">
                    {{ linkedEquipmentEvidenceError }}
                  </div>

                  <div class="equipment-evidence-grid" *ngIf="!linkedEquipmentEvidenceLoading && linkedEquipmentEvidencePhotos.length > 0">
                    <figure class="equipment-evidence-item" *ngFor="let photo of linkedEquipmentEvidencePhotos; trackBy: trackByEquipmentEvidenceId">
                      <a [href]="photo.thumbnailDataUrl" target="_blank" rel="noopener">
                        <img [src]="photo.thumbnailDataUrl" alt="Evidencia de recepción" />
                      </a>
                      <figcaption>
                        {{ photo.evidenceType || 'evidencia' }}{{ photo.notes ? ' · ' + photo.notes : '' }}
                      </figcaption>
                    </figure>
                  </div>

                  <div class="helper-box" *ngIf="!linkedEquipmentEvidenceLoading && !linkedEquipmentEvidenceError && linkedEquipmentEvidencePhotos.length === 0">
                    Este equipo no tiene fotos registradas en la recepción.
                  </div>
                </div>
              </div>

              <ng-template #equipmentNotLinked>
                <div class="helper-box">Aun no hay un equipo recibido vinculado a este proyecto.</div>
              </ng-template>

              <div class="project-form-grid mt-3">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Ubicacion actual</span>
                  <select class="project-detail-field__input" [(ngModel)]="equipmentLocationIdDraft">
                    <option value="">Selecciona una ubicacion</option>
                    <option *ngFor="let location of equipmentLocationOptions" [value]="location.id">{{ location.name }}</option>
                  </select>
                </label>
              </div>

              <div class="equipment-workflow-actions">
                <button
                  type="button"
                  class="btn btn-theme btn-sm"
                  (click)="updateLinkedEquipmentWorkflow()"
                  [disabled]="!canUpdateEquipmentWorkflow()">
                  Actualizar estado y ubicacion
                </button>

                <small class="text-secondary" *ngIf="detailProject.properties['equipmentLastWorkflowUpdate']">
                  Ultima sincronizacion {{ detailProject.properties['equipmentLastWorkflowUpdate'] | date:'dd/MM/yyyy HH:mm' }}
                </small>
              </div>

              <div class="alert alert-success mt-3 mb-0" *ngIf="equipmentWorkflowMessage">{{ equipmentWorkflowMessage }}</div>
              <div class="alert alert-danger mt-3 mb-0" *ngIf="equipmentWorkflowError">{{ equipmentWorkflowError }}</div>

              <div class="border rounded-4 p-3 mt-4 bg-light-subtle" *ngIf="canShowDispatchPanel()">
                <div class="section-heading mb-3">
                  <div>
                    <h4>Despacho rapido</h4>
                    <p>Reutiliza el contexto del caso para cerrar la entrega sin repetir captura administrativa.</p>
                  </div>
                </div>

                <div class="project-form-grid project-form-grid--3 mb-3">
                  <div class="project-detail-field project-detail-field--workflow">
                    <span class="project-detail-field__label">Consecutivo sugerido</span>
                    <strong>{{ getDispatchCodePreview() }}</strong>
                    <small class="text-secondary">Se calcula automaticamente con el prefijo documental de orden de envio.</small>
                  </div>

                  <div class="project-detail-field project-detail-field--workflow">
                    <span class="project-detail-field__label">Cliente</span>
                    <strong>{{ getDispatchClientName() || 'Sin cliente' }}</strong>
                    <small class="text-secondary">Se toma del caso y del equipo vinculado.</small>
                  </div>

                  <div class="project-detail-field project-detail-field--workflow">
                    <span class="project-detail-field__label">Equipo</span>
                    <strong>{{ getDispatchEquipmentName() || 'Sin equipo vinculado' }}</strong>
                    <small class="text-secondary">Tag: {{ getProjectMaterialEquipmentTag() || 'Sin tag tecnico' }}</small>
                  </div>
                </div>

                <div class="project-form-grid project-form-grid--2 mb-3">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Metodo de entrega</span>
                    <select class="project-detail-field__input" [(ngModel)]="dispatchDraft.deliveryMethod" (ngModelChange)="onDispatchMethodChange()">
                      <option value="transportadora">Transportadora</option>
                      <option value="recoge-cliente">Recoge cliente</option>
                    </select>
                  </label>

                  <label class="project-detail-field" *ngIf="dispatchDraft.deliveryMethod === 'transportadora'; else dispatchPickupField">
                    <span class="project-detail-field__label">Transportadora</span>
                    <input
                      type="text"
                      class="project-detail-field__input"
                      [(ngModel)]="dispatchDraft.carrier"
                      placeholder="Servia Entrega, Coordinadora, DHL..." />
                  </label>

                  <ng-template #dispatchPickupField>
                    <label class="project-detail-field">
                      <span class="project-detail-field__label">Recibido por</span>
                      <input
                        type="text"
                        class="project-detail-field__input"
                        [(ngModel)]="dispatchDraft.pickedUpBy"
                        placeholder="Nombre de quien recoge" />
                    </label>
                  </ng-template>
                </div>

                <div class="project-form-grid project-form-grid--2 mb-3" *ngIf="dispatchDraft.deliveryMethod === 'transportadora'">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Numero de guia</span>
                    <input
                      type="text"
                      class="project-detail-field__input"
                      [(ngModel)]="dispatchDraft.guideNumber"
                      placeholder="Guia o tracking" />
                  </label>

                  <div class="project-detail-field project-detail-field--workflow">
                    <span class="project-detail-field__label">Notificacion</span>
                    <div class="form-check form-switch mt-2">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        id="dispatchNotifyClient"
                        [(ngModel)]="dispatchDraft.notifyClient" />
                      <label class="form-check-label" for="dispatchNotifyClient">Marcar envio notificado al cliente</label>
                    </div>
                  </div>
                </div>

                <div class="project-form-grid project-form-grid--3 mb-3">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Condicion de pago</span>
                    <select class="project-detail-field__input" [(ngModel)]="detailProject.properties['paymentCondition']">
                      <option *ngFor="let option of paymentConditionOptions" [value]="option.value">{{ option.label }}</option>
                    </select>
                  </label>

                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Estado de pago</span>
                    <select class="project-detail-field__input" [(ngModel)]="detailProject.properties['paymentStatus']" (ngModelChange)="onDispatchPaymentStatusChange($event)">
                      <option *ngFor="let option of paymentStatusOptions" [value]="option.value">{{ option.label }}</option>
                    </select>
                  </label>

                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Referencia de pago</span>
                    <input
                      type="text"
                      class="project-detail-field__input"
                      [(ngModel)]="detailProject.properties['paymentReference']"
                      placeholder="TRX, comprobante o soporte" />
                  </label>
                </div>

                <div class="helper-box mb-3">
                  <strong>Estado de pago:</strong>
                  <span
                    class="badge rounded-pill ms-2"
                    [class.text-bg-success]="getDispatchPaymentStatus() === 'confirmado'"
                    [class.text-bg-warning]="getDispatchPaymentStatus() === 'parcial'"
                    [class.text-bg-secondary]="getDispatchPaymentStatus() === 'pendiente'">
                    {{ getDispatchPaymentStatusLabel() }}
                  </span>
                  <span class="ms-2 text-danger" *ngIf="isDispatchBlockedByPayment()">
                    Contra-entrega sin pago confirmado: no se puede completar despacho.
                  </span>
                </div>

                <div class="project-form-grid project-form-grid--3 mb-3">
                  <div class="form-check form-switch mt-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="dispatchIncludeReport"
                      [(ngModel)]="dispatchDraft.includeInterventionReport" />
                    <label class="form-check-label" for="dispatchIncludeReport">Generar reporte de intervencion</label>
                  </div>

                  <div class="form-check form-switch mt-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="dispatchIncludePurchaseOrder"
                      [(ngModel)]="dispatchDraft.includePurchaseOrder" />
                    <label class="form-check-label" for="dispatchIncludePurchaseOrder">Generar manifiesto de anexos</label>
                  </div>

                  <div class="form-check form-switch mt-2">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="dispatchIncludePrice"
                      [(ngModel)]="dispatchDraft.includePrice" />
                    <label class="form-check-label" for="dispatchIncludePrice">Incluir valor del proyecto</label>
                  </div>
                </div>

                <label class="project-detail-field mb-3">
                  <span class="project-detail-field__label">Notas de despacho</span>
                  <textarea
                    class="project-detail-field__textarea"
                    rows="3"
                    [(ngModel)]="dispatchDraft.notes"
                    placeholder="Observaciones visibles para logistica o para la orden de envio"
                  ></textarea>
                </label>

                <div class="helper-box mb-3">
                  <strong>Contexto automatico:</strong>
                  Accesorios {{ getDispatchAccessoriesLabel() }} · Prestados {{ getDispatchBorrowedEquipmentLabel() }} · Adjuntos {{ detailProject.attachments?.length || 0 }}
                </div>

                <div class="form-check mb-3" *ngIf="requiresDispatchAccessoriesConfirmation()">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="dispatchAccessoriesConfirm"
                    data-testid="dispatch-accessories-confirm"
                    [(ngModel)]="dispatchAccessoriesConfirmed" />
                  <label class="form-check-label" for="dispatchAccessoriesConfirm">Confirmo que se entregan los accesorios y equipos anclados/prestados</label>
                </div>

                <div class="helper-box mb-3" *ngIf="getLatestDispatchRecord() as latestDispatch">
                  Ultimo despacho {{ latestDispatch.code }} · {{ latestDispatch.createdAt | date:'dd/MM/yyyy HH:mm' }} · {{ describeDispatchRecord(latestDispatch) }}
                </div>

                <div class="alert alert-success border mb-0" *ngIf="dispatchMessage">{{ dispatchMessage }}</div>
                <div class="alert alert-danger border mb-0" *ngIf="dispatchError">{{ dispatchError }}</div>
              </div>
            </section>

          <section class="project-detail-section">
            <div class="section-heading">
              <div>
                <h4>Diagnostico e intervencion</h4>
                <p>Agrega contexto interno y registra el historial de atencion del equipo.</p>
              </div>

              <button
                type="button"
                class="btn btn-outline-theme btn-sm"
                [disabled]="!canOpenEquipmentHistory()"
                [attr.title]="canOpenEquipmentHistory() ? 'Abrir historial tecnico completo' : 'Vincula un equipo en la pestana Equipo tecnico para habilitar el historial'"
                (click)="openEquipmentHistory()">
                Historial tecnico completo
              </button>
            </div>

            <div class="project-form-grid project-form-grid--2 mb-3">
              <div class="diagnosis-inspection-card">
                <div class="section-heading mb-2">
                  <div>
                    <h5>Diagnostico (Posicion 0)</h5>
                    <p>Checklist minimo de inspeccion tecnica antes de cerrar diagnostico.</p>
                  </div>
                </div>

                <div class="diagnosis-inspection-grid">
                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['diagnosisInspection']['disassembled']" />
                    <span>Equipo desarmado</span>
                  </label>

                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['diagnosisInspection']['staticTest']" />
                    <span>Prueba estatica realizada</span>
                  </label>

                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['diagnosisInspection']['powerOnTest']" />
                    <span>Prueba de encendido realizada</span>
                  </label>

                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['diagnosisInspection']['faultIdentified']" />
                    <span>Falla identificada</span>
                  </label>
                </div>
              </div>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Memo diagnostico</span>
                <textarea
                  class="project-detail-field__textarea"
                  rows="5"
                  [(ngModel)]="detailProject.properties['diagnosticNotes']"
                  placeholder="Hallazgos del diagnostico, repuestos probables, porcentaje de reparabilidad y contexto para cotizacion"
                ></textarea>
              </label>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Memo reparacion / intervencion</span>
                <textarea
                  class="project-detail-field__textarea"
                  rows="5"
                  [(ngModel)]="detailProject.properties['repairNotes']"
                  placeholder="Acciones de reparacion, reemplazos, ajustes, trazabilidad tecnica y cierre interno"
                ></textarea>
              </label>
            </div>

            <div class="project-form-grid project-form-grid--2 mb-3">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Horas hombre estimadas</span>
                <input
                  type="number"
                  min="0"
                  class="project-detail-field__input"
                  [(ngModel)]="detailProject.properties['estimatedHours']"
                  placeholder="0" />
              </label>

              <div class="project-detail-field project-detail-field--workflow material-estimate-card">
                <span class="project-detail-field__label">Presupuesto repuestos (USD)</span>
                <div class="diagnosis-budget-input">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['partsBudgetUsd']"
                    placeholder="0" />
                </div>
                <small class="text-secondary">Campo oficial de diagnostico para repuestos en dolares.</small>
              </div>
            </div>

            <div class="project-form-grid project-form-grid--3 mb-3">
              <div class="project-detail-field project-detail-field--range">
                <span class="project-detail-field__label">% reparabilidad</span>
                <div class="progress-editor">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    [(ngModel)]="detailProject.properties['repairabilityPercent']" />
                  <span class="progress-editor__value">{{ normalizeNumber(detailProject.properties['repairabilityPercent']) }}%</span>
                </div>
              </div>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Horas reales acumuladas</span>
                <input
                  type="number"
                  min="0"
                  class="project-detail-field__input"
                  [(ngModel)]="detailProject.properties['actualHours']"
                  placeholder="0" />
              </label>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Prueba de cierre</span>
                <select class="project-detail-field__input" [(ngModel)]="detailProject.properties['testType']">
                  @for (option of technicalTestTypeOptions; track option.id) {
                    <option [value]="option.id">{{ option.label }}</option>
                  }
                </select>
              </label>
            </div>
          </section>
        </ng-container>

        <ng-container *ngIf="activeDetailTab === 'materiales'">
          <section class="project-detail-section mt-3">
            <div class="section-heading">
              <div>
                <h4>Materiales y repuestos</h4>
                <p>Solicita repuestos desde inventario para esta reparacion y deja registrado un estimado manual de materia prima para la cotizacion.</p>
              </div>
            </div>

            <div class="alert alert-warning border mb-3" *ngIf="!canManageMaterialReservations">
              El rol actual solo tiene consulta sobre inventario. Para crear o liberar reservas necesitas permisos de gestion de reservas.
            </div>

            <div class="project-form-grid project-form-grid--3 mb-3">
              <div class="project-detail-field project-detail-field--workflow material-estimate-card">
                <span class="project-detail-field__label">Materia prima estimada ($)</span>
                <div class="material-estimate-input">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['estimatedMaterialCost']"
                    placeholder="0" />
                </div>
                <small class="text-secondary">Valor manual para preasignar costo de repuestos cuando aun no tienes todos los componentes definidos.</small>
              </div>

              <div class="project-detail-field project-detail-field--workflow material-context-card">
                <span class="project-detail-field__label">Solicitudes activas</span>
                <strong class="material-context-card__value">{{ getActiveMaterialReservationsCount() }}</strong>
                <small class="text-secondary">Reservas activas vinculadas a esta reparacion.</small>
              </div>

              <div class="project-detail-field project-detail-field--workflow material-context-card">
                <span class="project-detail-field__label">Contexto tecnico</span>
                <strong class="material-context-card__value">{{ getProjectMaterialWorkOrder() || 'Sin codigo corto' }}</strong>
                <small class="text-secondary">{{ getProjectMaterialEquipmentTag() || 'Vincula un equipo para completar el tag tecnico del repuesto.' }}</small>
              </div>
            </div>

            <div class="project-form-grid project-form-grid--2 mb-3">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Repuesto desde inventario</span>
                <input
                  type="text"
                  class="project-detail-field__input"
                  [ngModel]="materialSearchQuery"
                  (ngModelChange)="onMaterialSearchChange($event)"
                  placeholder="Busca una referencia por codigo o descripcion..."
                  autocomplete="off" />
                <div class="material-search-dropdown" *ngIf="filteredInventoryReferences.length && materialSearchQuery.trim()">
                  <button
                    type="button"
                    class="material-search-option"
                    *ngFor="let ref of filteredInventoryReferences"
                    (click)="selectMaterialReference(ref.reference)">
                    <strong>{{ ref.reference }}</strong>
                    <span>{{ ref.designation }}</span>
                    <span class="badge" [ngClass]="ref.currentStock > 0 ? 'text-bg-success' : 'text-bg-warning'">
                      stock {{ ref.currentStock }}
                    </span>
                  </button>
                </div>
              </label>

              <div class="material-reference-card" *ngIf="selectedMaterialReference as reference; else noMaterialReference">
                <div class="material-reference-card__header">
                  <div>
                    <strong>{{ reference.reference }}</strong>
                    <p>{{ reference.designation }}</p>
                  </div>
                  <span class="badge" [ngClass]="reference.currentStock > 0 ? 'text-bg-success' : 'text-bg-warning'">
                    {{ reference.currentStock > 0 ? 'Disponible' : 'Sin stock' }}
                  </span>
                </div>

                <div class="material-reference-card__grid">
                  <span><strong>Stock actual:</strong> {{ reference.currentStock }}</span>
                  <span><strong>Stock minimo:</strong> {{ reference.minStock }}</span>
                  <span><strong>Ubicacion:</strong> {{ reference.location || '--' }}</span>
                  <span><strong>Proveedor:</strong> {{ reference.preferredSupplierName || '--' }}</span>
                  <span><strong>Marca:</strong> {{ reference.brand || '--' }}</span>
                  <span><strong>Lead time:</strong> {{ reference.leadTimeDays || 0 }} dias</span>
                </div>

                <small class="text-secondary" *ngIf="reference.currentStock <= 0">
                  Esta referencia existe en el catalogo pero hoy no tiene disponibilidad. La solicitud sigue sirviendo para priorizar compras o reposicion.
                </small>
              </div>

              <ng-template #noMaterialReference>
                <div class="helper-box">Busca una referencia del inventario para revisar stock, ubicacion y proveedor sugerido.</div>
              </ng-template>

              <div class="material-not-found-card" *ngIf="showMaterialNotFoundCard">
                <div class="material-not-found-card__header">
                  <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                  <strong>Referencia no encontrada en inventario</strong>
                </div>
                <p class="material-not-found-card__message">
                  La referencia <strong>{{ materialSearchQuery }}</strong> no existe en el catalogo de inventario.
                  Completa la informacion para crear una linea de compra:
                </p>

                <div class="project-form-grid project-form-grid--2 mb-2">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Referencia *</span>
                    <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.reference" placeholder="Ej: IGBT-FGA25N120" />
                  </label>
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Componente *</span>
                    <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.component" placeholder="Nombre del componente" />
                  </label>
                </div>

                <div class="project-form-grid project-form-grid--3 mb-2">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Tipo</span>
                    <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.type" placeholder="Ej: Electronico, Mecanico" />
                  </label>
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Marca</span>
                    <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.brand" placeholder="Ej: Fuji, Siemens" />
                  </label>
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Cantidad necesaria *</span>
                    <input type="number" min="1" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.quantity" placeholder="1" />
                  </label>
                </div>

                <div class="project-form-grid project-form-grid--3 mb-2">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Valor unitario (COP)</span>
                    <input type="number" min="0" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.unitPrice" placeholder="0" />
                  </label>
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Proveedor sugerido</span>
                    <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.supplier" placeholder="Ej: DigiKey, Mouser" />
                  </label>
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Plazo estimado (dias)</span>
                    <input type="number" min="0" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.neededBy" placeholder="Ej: 15" />
                  </label>
                </div>

                <label class="project-detail-field mb-2">
                  <span class="project-detail-field__label">Descripcion tecnica</span>
                  <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.description" placeholder="Descripcion detallada del componente" />
                </label>

                <div class="d-flex gap-2 flex-wrap">
                  <button type="button" class="btn btn-theme btn-sm" (click)="confirmCreatePurchaseLine()" [disabled]="!purchaseLineDraft.reference || !purchaseLineDraft.component || purchaseLineDraft.quantity < 1">
                    <i class="bi bi-cart-plus me-1"></i>Crear linea de compra
                  </button>
                  <button type="button" class="btn btn-outline-secondary btn-sm" (click)="dismissMaterialNotFound()">
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            <div class="project-form-grid project-form-grid--3 mb-3">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Cantidad solicitada</span>
                <input
                  type="number"
                  min="1"
                  class="project-detail-field__input"
                  [(ngModel)]="materialRequestDraft.quantity"
                  placeholder="1" />
              </label>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Asignado a</span>
                <select
                  class="project-detail-field__input"
                  [(ngModel)]="materialRequestDraft.assignedTo"
                  [disabled]="isTechnicianInventoryRole">
                  <option value="" *ngIf="!isTechnicianInventoryRole">Selecciona tecnico responsable</option>
                  <option *ngFor="let assignee of materialAssigneeOptions" [value]="assignee">{{ assignee }}</option>
                </select>
                <small class="text-secondary" *ngIf="isTechnicianInventoryRole">Como tecnico, la solicitud queda asignada a tu usuario.</small>
              </label>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Prioridad</span>
                <select class="project-detail-field__input" [(ngModel)]="materialRequestDraft.priority">
                  <option value="critica">Critica</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </label>
            </div>

            <div class="project-form-grid project-form-grid--2 mb-3">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Fecha compromiso</span>
                <input
                  type="date"
                  class="project-detail-field__input"
                  [(ngModel)]="materialRequestDraft.commitmentDate" />
              </label>
            </div>

            <div class="project-form-grid project-form-grid--3 mb-3">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Orden / codigo</span>
                <input
                  type="text"
                  class="project-detail-field__input"
                  [(ngModel)]="materialRequestDraft.workOrder"
                  placeholder="Codigo corto del proyecto" />
              </label>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Tag equipo</span>
                <input
                  type="text"
                  class="project-detail-field__input"
                  [(ngModel)]="materialRequestDraft.equipmentTag"
                  placeholder="Identificador del equipo" />
              </label>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Cliente / planta</span>
                <input
                  type="text"
                  class="project-detail-field__input"
                  [(ngModel)]="materialRequestDraft.customerSite"
                  placeholder="Cliente o planta asociada" />
              </label>
            </div>

            <div class="d-flex gap-2 flex-wrap mb-3">
              <button
                type="button"
                class="btn btn-theme btn-sm"
                (click)="createMaterialReservation()"
                [disabled]="!canManageMaterialReservations || !inventoryReferences.length">
                Solicitar repuesto
              </button>

              <button type="button" class="btn btn-outline-secondary btn-sm" (click)="resetMaterialRequestDraft()">
                Limpiar formulario
              </button>
            </div>

            <div class="alert alert-success mt-3 mb-0" *ngIf="materialRequestMessage">{{ materialRequestMessage }}</div>
            <div class="alert alert-danger mt-3 mb-0" *ngIf="materialRequestError">{{ materialRequestError }}</div>
          </section>

          <section class="project-detail-section">
            <div class="section-heading">
              <div>
                <h4>Solicitudes de repuestos de esta reparacion</h4>
                <p>Historial de reservas creadas desde el proyecto para mantener trazabilidad entre taller e inventario.</p>
              </div>
            </div>

            <div class="helper-box mb-3" *ngIf="!inventoryReferences.length">
              Aun no hay referencias cargadas en inventario. Crea fichas o entradas desde el modulo de inventario para poder solicitar repuestos aqui.
            </div>

            <div class="table-responsive">
              <table class="table align-middle mb-0 project-materials-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Cantidad</th>
                    <th>Stock actual</th>
                    <th>Asignado</th>
                    <th>Prioridad</th>
                    <th>Compromiso</th>
                    <th>Estado</th>
                    <th class="text-end">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let reservation of materialReservations">
                    <td>
                      <strong>{{ reservation.reference }}</strong>
                      <div class="small text-secondary">{{ getInventoryReferenceDesignation(reservation.reference) }}</div>
                    </td>
                    <td>{{ reservation.quantity }}</td>
                    <td>{{ getInventoryReferenceStock(reservation.reference) }}</td>
                    <td>{{ reservation.assignedTo }}</td>
                    <td>{{ reservation.priority || '--' }}</td>
                    <td>{{ reservation.commitmentDate ? (reservation.commitmentDate | date:'dd/MM/yyyy') : '--' }}</td>
                    <td>
                      <span class="badge" [ngClass]="materialReservationStatusClass(reservation.status)">{{ reservation.status }}</span>
                    </td>
                    <td class="text-end">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-success me-1"
                        (click)="consumeMaterialReservation(reservation.id)"
                        [disabled]="reservation.status !== 'activa' || !canManageMaterialReservations"
                        title="Confirmar uso real del material">
                        Consumir
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        (click)="releaseMaterialReservation(reservation.id)"
                        [disabled]="reservation.status !== 'activa' || !canManageMaterialReservations">
                        Liberar
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="materialReservations.length === 0">
                    <td colspan="8" class="text-center text-secondary py-4">Aun no hay repuestos solicitados para este proyecto.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="project-detail-section mt-4">
            <div class="section-heading">
              <div>
                <h4>Lineas de compra</h4>
                <p>Componentes solicitados para compra. Las lineas se generan automaticamente o manualmente cuando una referencia no existe en inventario.</p>
              </div>
              <button type="button" class="btn btn-theme btn-sm" (click)="showManualPurchaseLineForm = !showManualPurchaseLineForm">
                <i class="bi bi-plus-lg me-1"></i>{{ showManualPurchaseLineForm ? 'Ocultar' : 'Crear' }} linea manual
              </button>
            </div>

            <div *ngIf="showManualPurchaseLineForm" class="material-not-found-card mb-3">
              <div class="material-not-found-card__header">
                <i class="bi bi-cart-plus-fill text-primary"></i>
                <strong>Crear linea de compra manual</strong>
              </div>

              <div class="project-form-grid project-form-grid--2 mb-2">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Referencia *</span>
                  <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.reference" placeholder="Ej: IGBT-FGA25N120" />
                </label>
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Componente *</span>
                  <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.component" placeholder="Nombre del componente" />
                </label>
              </div>

              <div class="project-form-grid project-form-grid--3 mb-2">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Tipo</span>
                  <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.type" placeholder="Ej: Electronico, Mecanico" />
                </label>
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Marca</span>
                  <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.brand" placeholder="Ej: Fuji, Siemens" />
                </label>
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Cantidad necesaria *</span>
                  <input type="number" min="1" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.quantity" placeholder="1" />
                </label>
              </div>

              <div class="project-form-grid project-form-grid--3 mb-2">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Valor unitario (COP)</span>
                  <input type="number" min="0" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.unitPrice" placeholder="0" />
                </label>
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Proveedor sugerido</span>
                  <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.supplier" placeholder="Ej: DigiKey, Mouser" />
                </label>
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Plazo estimado (dias)</span>
                  <input type="number" min="0" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.neededBy" placeholder="Ej: 15" />
                </label>
              </div>

              <label class="project-detail-field mb-2">
                <span class="project-detail-field__label">Descripcion tecnica</span>
                <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseLineDraft.description" placeholder="Descripcion detallada del componente" />
              </label>

              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-theme btn-sm" (click)="createManualPurchaseLine()" [disabled]="!purchaseLineDraft.reference || !purchaseLineDraft.component || purchaseLineDraft.quantity < 1">
                  <i class="bi bi-cart-plus me-1"></i>Crear linea de compra
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" (click)="showManualPurchaseLineForm = false">
                  Cancelar
                </button>
              </div>
            </div>

            <div *ngIf="purchaseLineMessage" class="alert alert-success border mb-3">{{ purchaseLineMessage }}</div>
            <div *ngIf="purchaseLineError" class="alert alert-danger border mb-3">{{ purchaseLineError }}</div>

            <div class="table-responsive">
              <table class="table align-middle mb-0 project-materials-table">
                <thead>
                  <tr>
                    <th>Referencia</th>
                    <th>Componente</th>
                    <th>Tipo</th>
                    <th>Marca</th>
                    <th>Cant.</th>
                    <th>Valor Unit.</th>
                    <th>Proveedor</th>
                    <th>Plazo (dias)</th>
                    <th>Estado</th>
                    <th class="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let line of projectPurchaseLines">
                    <td><strong>{{ line.reference }}</strong></td>
                    <td>{{ line.component || '--' }}</td>
                    <td>{{ line.type || '--' }}</td>
                    <td>{{ line.brand || '--' }}</td>
                    <td>{{ line.quantity }}</td>
                    <td>{{ line.unitPrice ? (line.unitPrice | currency:'COP':'symbol':'1.0-0') : '--' }}</td>
                    <td>{{ line.supplier || '--' }}</td>
                    <td>{{ line.neededBy || '--' }}</td>
                    <td>
                      <span class="badge" [ngClass]="{'text-bg-warning': line.status === 'pendiente', 'text-bg-info': line.status === 'enviada', 'text-bg-success': line.status === 'cerrada'}">{{ line.status }}</span>
                    </td>
                    <td class="text-end">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary me-1"
                        (click)="sendPurchaseLine(line.id)"
                        [disabled]="line.status !== 'pendiente' || !canManageMaterialReservations">
                        Enviar
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-theme"
                        (click)="closePurchaseLine(line.id)"
                        [disabled]="line.status === 'cerrada' || !canManageMaterialReservations">
                        Cerrar
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="projectPurchaseLines.length === 0">
                    <td colspan="10" class="text-center text-secondary py-4">Sin lineas de compra registradas.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="project-detail-section mt-4">
            <div class="section-heading">
              <div>
                <h4>Solicitar compra de repuesto</h4>
                <p>El tecnico solicita un componente que no esta en el catalogo de inventario. El responsable de compras revisa y aprueba.</p>
              </div>
            </div>

            <div *ngIf="purchaseRequestMessage" class="alert alert-success border mb-3">{{ purchaseRequestMessage }}</div>
            <div *ngIf="purchaseRequestError" class="alert alert-danger border mb-3">{{ purchaseRequestError }}</div>

            <div class="project-form-grid project-form-grid--2">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Referencia del componente</span>
                <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.reference" placeholder="Ej: IGBT-FGA25N120" />
              </label>
              <label class="project-detail-field">
                <span class="project-detail-field__label">Cantidad</span>
                <input type="number" min="1" class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.quantity" />
              </label>
            </div>

            <label class="project-detail-field">
              <span class="project-detail-field__label">Descripcion</span>
              <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.description" placeholder="Descripcion tecnica del componente" />
            </label>

            <div class="project-form-grid project-form-grid--3">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Proveedor sugerido</span>
                <input type="text" class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.supplier" placeholder="Ej: DigiKey" />
              </label>
              <label class="project-detail-field">
                <span class="project-detail-field__label">Costo estimado (COP)</span>
                <input type="number" min="0" class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.estimatedCost" />
              </label>
              <label class="project-detail-field">
                <span class="project-detail-field__label">Plazo entrega (dias)</span>
                <input type="number" min="0" class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.leadTimeDays" />
              </label>
            </div>

            <div class="project-form-grid project-form-grid--2">
              <label class="project-detail-field">
                <span class="project-detail-field__label">Urgencia</span>
                <select class="project-detail-field__input" [(ngModel)]="purchaseRequestDraft.urgency">
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Critica</option>
                </select>
              </label>
            </div>

            <label class="project-detail-field">
              <span class="project-detail-field__label">Memo tecnico (justificacion)</span>
              <textarea class="project-detail-field__textarea" rows="2" [(ngModel)]="purchaseRequestDraft.memo" placeholder="Explica por que necesitas este componente"></textarea>
            </label>

            <button type="button" class="btn btn-theme mt-2" (click)="submitPurchaseRequest()">
              <i class="bi bi-cart-plus me-1"></i>Enviar solicitud de compra
            </button>

            <div *ngIf="purchaseRequests.length > 0" class="mt-3">
              <h6>Solicitudes de este proyecto</h6>
              <table class="table table-sm align-middle">
                <thead><tr><th>Referencia</th><th>Descripcion</th><th>Cant.</th><th>Urgencia</th><th>Estado</th><th>Solicitado por</th><th>Fecha</th></tr></thead>
                <tbody>
                  <tr *ngFor="let pr of purchaseRequests">
                    <td>{{ pr.reference }}</td>
                    <td>{{ pr.description }}</td>
                    <td>{{ pr.quantity }}</td>
                    <td><span class="badge" [ngClass]="{'text-bg-danger': pr.urgency === 'critica', 'text-bg-warning': pr.urgency === 'alta', 'text-bg-secondary': pr.urgency === 'normal'}">{{ pr.urgency }}</span></td>
                    <td><span class="badge" [ngClass]="{'text-bg-warning': pr.status === 'pendiente', 'text-bg-success': pr.status === 'aprobada', 'text-bg-danger': pr.status === 'rechazada'}">{{ pr.status }}</span></td>
                    <td>{{ pr.requestedBy }}</td>
                    <td>{{ pr.requestedAt | date:'short' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </ng-container>

        <ng-container *ngIf="activeDetailTab === 'identidad'">
          <section class="project-detail-section mt-3">
            <div class="section-heading">
              <div>
                <h4>Identidad</h4>
                  <p>Lo minimo necesario para ubicar el proyecto y comunicarlo dentro del equipo.</p>
                </div>
              </div>

              <div class="project-form-grid project-form-grid--2">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Codigo corto</span>
                  <input
                    type="text"
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['shortCode']"
                    placeholder="PRJ-001" />
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Nombre del proyecto</span>
                  <input
                    type="text"
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.title"
                    placeholder="Escribe el nombre del proyecto" />
                </label>
              </div>

              <label class="project-detail-field">
                <span class="project-detail-field__label">Resumen</span>
                <textarea
                  class="project-detail-field__textarea"
                  rows="3"
                  [(ngModel)]="detailProject.description"
                  placeholder="Describe alcance, objetivo y resultado esperado"
                ></textarea>
              </label>
            </section>

            <section class="project-detail-section">
              <button type="button" class="section-toggle" (click)="toggleOtherDetails()">
                <div>
                  <h4>Otros detalles y archivos</h4>
                  <p>Presupuesto, horas, integraciones y archivos del proyecto.</p>
                </div>
                <i class="bi" [class.bi-chevron-up]="showOtherDetails" [class.bi-chevron-down]="!showOtherDetails"></i>
              </button>

              <div class="other-details" *ngIf="showOtherDetails">
                <div class="project-form-grid project-form-grid--3">
                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Moneda</span>
                    <select
                      class="project-detail-field__input"
                      [(ngModel)]="detailProject.properties['currency']">
                      <option *ngFor="let currency of currencyOptions" [value]="currency">{{ currency }}</option>
                    </select>
                  </label>

                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Presupuesto</span>
                    <input
                      type="number"
                      min="0"
                      class="project-detail-field__input"
                      [(ngModel)]="detailProject.properties['budget']"
                      placeholder="0" />
                  </label>

                  <label class="project-detail-field">
                    <span class="project-detail-field__label">Horas estimadas</span>
                    <input
                      type="number"
                      min="0"
                      class="project-detail-field__input"
                      [(ngModel)]="detailProject.properties['estimatedHours']"
                      placeholder="0" />
                  </label>
                </div>

                <div class="project-form-grid project-form-grid--3">
                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['allowManualTime']" />
                    <span>Permitir registro manual de tiempo</span>
                  </label>

                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['notifyClient']" />
                    <span>Notificar avances al cliente</span>
                  </label>
                </div>

                <div class="project-detail-field mt-4">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h4>Archivos</h4>
                      <p>Documentos de soporte, briefs, contratos o recursos visuales.</p>
                    </div>
                  </div>

                  <label class="btn btn-outline-secondary btn-sm">
                    <input
                      type="file"
                      class="d-none"
                      multiple
                      (change)="handleAttachmentSelection($event)" />
                    <i class="bi bi-upload"></i> Adjuntar archivos
                  </label>

                  <div class="project-attachments" *ngIf="detailProject.attachments?.length; else noAttachments">
                    <div class="attachment-item" *ngFor="let file of detailProject.attachments">
                      <div class="attachment-item__info">
                        <a [href]="file.url" [attr.download]="file.name" target="_blank" rel="noopener">{{ file.name }}</a>
                        <span>{{ formatFileSize(file.size) }}</span>
                      </div>
                      <button type="button" class="btn btn-link text-danger" (click)="removeAttachment(file.id)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <ng-template #noAttachments>
                    <div class="helper-box">No hay archivos adjuntos todavia.</div>
                  </ng-template>
                </div>
              </div>
            </section>

          </ng-container>

          <ng-container *ngIf="activeDetailTab === 'planeacion'">
            <section class="project-detail-section mt-3">
              <div class="section-heading">
                <div>
                  <h4>Planeacion</h4>
                  <p>Fechas, area responsable, cliente y nivel de prioridad.</p>
                </div>
              </div>

              <div class="project-form-grid project-form-grid--3">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Fecha de inicio</span>
                  <input
                    type="date"
                    class="project-detail-field__input"
                    [ngModel]="toDateInputValue(detailProject.properties['startDate'])"
                    (ngModelChange)="detailProject.properties['startDate'] = fromDateInputValue($event)" />
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Fecha limite</span>
                  <input
                    type="date"
                    class="project-detail-field__input"
                    [disabled]="detailProject.properties['noDeadline']"
                    [ngModel]="toDateInputValue(detailProject.properties['dueDate'])"
                    (ngModelChange)="detailProject.properties['dueDate'] = fromDateInputValue($event)" />
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Responsable</span>
                  <select
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['assignee']">
                    <option value="">Selecciona un responsable</option>
                    <option *ngFor="let assignee of assigneeOptions" [value]="assignee">{{ assignee }}</option>
                  </select>
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Categoria</span>
                  <select
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['category']">
                    <option value="">Selecciona una categoria</option>
                    <option *ngFor="let category of categoryOptions" [value]="category">{{ category }}</option>
                  </select>
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Departamento</span>
                  <select
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['department']">
                    <option value="">Selecciona un departamento</option>
                    <option *ngFor="let department of departmentOptions" [value]="department">{{ department }}</option>
                  </select>
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Cliente</span>
                  <select
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['client']">
                    <option value="">Selecciona un cliente</option>
                    <option *ngFor="let client of clientOptions" [value]="client">{{ client }}</option>
                  </select>
                </label>

                <label class="project-detail-field">
                  <span class="project-detail-field__label">Prioridad</span>
                  <select
                    class="project-detail-field__input"
                    [(ngModel)]="detailProject.properties['priority']">
                    <option *ngFor="let priority of priorityOptions" [value]="priority.value">{{ priority.label }}</option>
                  </select>
                </label>

                <div class="project-detail-field project-detail-field--range">
                  <span class="project-detail-field__label">Progreso</span>
                  <div class="progress-editor">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      [(ngModel)]="detailProject.properties['progress']" />
                    <span class="progress-editor__value">{{ normalizeNumber(detailProject.properties['progress']) }}%</span>
                  </div>
                </div>

                <div class="project-detail-field project-detail-field--toggles">
                  <span class="project-detail-field__label">Visibilidad</span>
                  <label class="project-switch">
                    <input
                      type="checkbox"
                      [(ngModel)]="detailProject.properties['publicProject']" />
                    <span>Proyecto publico para el equipo</span>
                  </label>
                </div>
              </div>

              <label class="project-switch project-switch--inline">
                <input
                  type="checkbox"
                  [ngModel]="detailProject.properties['noDeadline']"
                  (ngModelChange)="toggleNoDeadline($event)" />
                <span>Este proyecto no tiene fecha limite</span>
              </label>
            </section>

            <section class="project-detail-section">
              <div class="section-heading">
                <div>
                  <h4>Notas internas y equipo</h4>
                  <p>Agrega contexto interno y define quienes participan en la entrega.</p>
                </div>
              </div>

              <div class="helper-box mb-3">
                <strong>Etapa actual:</strong> {{ detailProject.properties['stageName'] || detailProject.status }}
                @if (detailProject.properties['stageEnteredAt']) {
                  <span> · desde {{ detailProject.properties['stageEnteredAt'] | date:'dd/MM/yyyy HH:mm' }}</span>
                }
              </div>

              <div class="project-form-grid project-form-grid--2">
                <label class="project-detail-field">
                  <span class="project-detail-field__label">Notas internas</span>
                  <textarea
                    class="project-detail-field__textarea"
                    rows="5"
                    [(ngModel)]="detailProject.properties['notes']"
                    placeholder="Dependencias, observaciones, riesgos o acuerdos relevantes"
                  ></textarea>
                </label>

                <div class="project-detail-field project-detail-field--members">
                  <span class="project-detail-field__label">Miembros del proyecto</span>

                  <div class="member-editor">
                    <div class="member-list" *ngIf="getProjectMembers().length; else emptyMembers">
                      <span class="member-chip" *ngFor="let member of getProjectMembers()">
                        {{ member }}
                        <button type="button" (click)="removeMember(member)" aria-label="Quitar miembro">
                          <i class="bi bi-x"></i>
                        </button>
                      </span>
                    </div>

                    <ng-template #emptyMembers>
                      <div class="helper-box">Todavia no hay colaboradores asignados.</div>
                    </ng-template>

                    <div class="member-editor__form">
                      <input
                        type="text"
                        class="project-detail-field__input"
                        [(ngModel)]="newMemberName"
                        placeholder="Nombre del colaborador"
                        (keydown.enter)="addMember()" />
                      <button type="button" class="btn btn-theme btn-sm" (click)="addMember()">
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </ng-container>

          </div>

          <footer class="project-detail-dialog__footer">
            <small class="project-detail-dialog__timestamp">
              Ultima actualizacion {{ detailProject.updatedAt | date:'dd/MM/yyyy HH:mm' }}
            </small>

            <small class="project-detail-dialog__feedback text-danger" *ngIf="diagnosisCloseError">
              {{ diagnosisCloseError }}
            </small>

            <small class="project-detail-dialog__feedback text-success" *ngIf="diagnosisCloseMessage">
              {{ diagnosisCloseMessage }}
            </small>

            <small class="project-detail-dialog__feedback text-danger" *ngIf="testsCloseError">
              {{ testsCloseError }}
            </small>

            <small class="project-detail-dialog__feedback text-success" *ngIf="testsCloseMessage">
              {{ testsCloseMessage }}
            </small>

            <div class="project-detail-dialog__actions">
              <button
                type="button"
                class="btn btn-outline-theme"
                *ngIf="canPrintTechnicalReport()"
                data-testid="print-technical-report-btn"
                [attr.title]="'Abrir reporte tecnico imprimible (independiente del despacho y del pago)'"
                (click)="openTechnicalReport()">
                Imprimir reporte tecnico
              </button>
              <button
                type="button"
                class="btn btn-success"
                *ngIf="canQuickDispatch()"
                [attr.title]="getDispatchActionTitle()"
                [disabled]="saving || dispatching || !canCompleteDispatch()"
                (click)="completeDispatch()">
                {{ dispatching ? 'Despachando...' : 'Despachar y cerrar' }}
              </button>
              <button
                type="button"
                class="btn btn-outline-theme"
                *ngIf="detailProject.status === 'diagnostico'"
                [disabled]="saving"
                (click)="closeDiagnosis()">
                Cerrar diagnostico
              </button>
              <button
                type="button"
                class="btn btn-outline-theme"
                *ngIf="detailProject.status === 'reparacion'"
                data-testid="finish-tests-btn"
                [attr.title]="'Valida la prueba de cierre registrada y mueve el caso a Listo para entrega'"
                [disabled]="saving"
                (click)="finishTestsAndMarkReady()">
                Validar cierre y marcar listo
              </button>
              <button type="button" class="btn btn-outline-secondary" (click)="closeProjectDetail()">
                Cancelar
              </button>
              @if (detailProject.status === 'por-cotizar') {
                <button
                  type="button"
                  class="btn btn-success"
                  [disabled]="saving || !detailProject.title.trim()"
                  data-testid="save-and-quote-btn"
                  attr.title="Guarda el caso y abre la cotización con los datos del proyecto precargados"
                  (click)="saveAndGoToQuote()">
                  {{ saving ? 'Guardando...' : 'Guardar y cotizar' }}
                </button>
              }
              <button
                type="button"
                class="btn btn-theme"
                [disabled]="saving || !detailProject.title.trim()"
                (click)="saveProjectDetail()">
                {{ saving ? 'Guardando...' : 'Guardar cambios' }}
              </button>
            </div>
          </footer>
        </section>
      </div>

      <div class="scanner-backdrop" *ngIf="showEquipmentScanner" (click)="closeEquipmentScanner()">
        <div class="scanner-dialog" (click)="$event.stopPropagation()">
          <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
            <div>
              <h5 class="mb-1">Escanear identificador del equipo</h5>
              <p class="text-secondary small mb-0">Apunta al QR o codigo de barras para vincular el equipo al proyecto.</p>
            </div>
            <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeEquipmentScanner()"></button>
          </div>

          <div class="scanner-video-frame mb-3">
            <video #equipmentScannerVideo autoplay playsinline muted></video>
          </div>

          <p class="small text-secondary mb-2">{{ equipmentScannerStatus }}</p>
          <div class="alert alert-danger border mb-0" *ngIf="equipmentScannerError">{{ equipmentScannerError }}</div>
        </div>
      </div>

      <div class="technical-report-backdrop" *ngIf="showTechnicalReport" (click)="closeTechnicalReport()">
        <div class="technical-report-dialog" data-testid="technical-report-modal" (click)="$event.stopPropagation()">
          <div class="technical-report-toolbar d-flex align-items-start justify-content-between gap-3 mb-3">
            <div>
              <h5 class="mb-1">Reporte tecnico de intervencion</h5>
              <p class="text-secondary small mb-0">Documento imprimible independiente del despacho y de la facturacion.</p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button
                type="button"
                class="btn btn-theme btn-sm"
                data-testid="technical-report-print-action"
                (click)="printTechnicalReport()">
                Imprimir
              </button>
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                data-testid="technical-report-close"
                (click)="closeTechnicalReport()">
                Cerrar
              </button>
            </div>
          </div>

          <article class="technical-report-sheet" data-testid="technical-report-content" *ngIf="technicalReport as report; else technicalReportEmpty">
            <header class="technical-report-sheet__header" data-testid="technical-report-header">
              <div>
                <h4 class="mb-1">Reporte tecnico de intervencion</h4>
                <p class="mb-0">{{ report.projectCode }} · Generado {{ report.generatedAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <span class="badge text-bg-secondary">{{ report.statusLabel }}</span>
            </header>

            <dl class="technical-report-grid mb-0">
              <div class="technical-report-grid__item">
                <dt>Cliente</dt>
                <dd data-testid="technical-report-client">{{ report.clientName }}</dd>
              </div>
              <div class="technical-report-grid__item">
                <dt>Proyecto</dt>
                <dd data-testid="technical-report-project">{{ report.projectTitle }} ({{ report.projectCode }})</dd>
              </div>
              <div class="technical-report-grid__item">
                <dt>Equipo</dt>
                <dd data-testid="technical-report-equipment">{{ report.equipmentName }}</dd>
              </div>
              <div class="technical-report-grid__item">
                <dt>Ingreso</dt>
                <dd>{{ report.receivedAt ? (report.receivedAt | date:'dd/MM/yyyy') : 'Sin fecha de ingreso' }}</dd>
              </div>
              <div class="technical-report-grid__item">
                <dt>Ultima actualizacion tecnica</dt>
                <dd>{{ report.lastWorkflowUpdateAt ? (report.lastWorkflowUpdateAt | date:'dd/MM/yyyy HH:mm') : 'Sin registro' }}</dd>
              </div>
              <div class="technical-report-grid__item">
                <dt>Falla reportada</dt>
                <dd>{{ report.failureDescription || 'Sin detalle' }}</dd>
              </div>
            </dl>

            <section class="technical-report-section" data-testid="technical-report-diagnosis">
              <h6>Diagnostico</h6>
              <p class="technical-report-text">{{ report.diagnosticNotes || 'Sin memo diagnostico' }}</p>
            </section>

            <section class="technical-report-section" data-testid="technical-report-repair">
              <h6>Trabajos / reparacion realizados</h6>
              <p class="technical-report-text">{{ report.repairNotes || 'Sin memo de intervencion' }}</p>
            </section>

            <section class="technical-report-section" data-testid="technical-report-meta">
              <h6>Datos tecnicos de cierre</h6>
              <dl class="technical-report-grid mb-0">
                <div class="technical-report-grid__item">
                  <dt>Prueba registrada</dt>
                  <dd>{{ report.testTypeLabel }}</dd>
                </div>
                <div class="technical-report-grid__item">
                  <dt>Reparabilidad</dt>
                  <dd>{{ report.repairabilityPercent }}%</dd>
                </div>
                <div class="technical-report-grid__item">
                  <dt>Horas estimadas</dt>
                  <dd>{{ report.estimatedHours }}</dd>
                </div>
                <div class="technical-report-grid__item">
                  <dt>Horas reales</dt>
                  <dd>{{ report.actualHours }}</dd>
                </div>
              </dl>
            </section>
          </article>

          <ng-template #technicalReportEmpty>
            <div class="helper-box mb-0" data-testid="technical-report-empty">
              No hay registros tecnicos disponibles para este equipo.
            </div>
          </ng-template>
        </div>
      </div>

      <app-project-transition-check-modal
        [visible]="!!pendingTransition"
        [prompt]="pendingTransition?.prompt ?? null"
        [projectTitle]="pendingTransition?.projectTitle ?? ''"
        [fromStatusLabel]="pendingTransition?.fromStatusLabel ?? ''"
        [toStatusLabel]="pendingTransition?.toStatusLabel ?? ''"
        (cancel)="cancelPendingTransition()"
        (confirm)="confirmPendingTransition($event)">
      </app-project-transition-check-modal>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
    }

    .compact-code-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.35rem 0.75rem;
      border-radius: 0.5rem;
      border: 2px solid rgba(var(--adminuiux-theme-1-rgb), 0.25);
      background: rgba(var(--bs-body-bg-rgb), 0.85);
      color: var(--adminuiux-theme-1);
      font-family: monospace;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
      white-space: nowrap;
      width: 100%;
      justify-content: center;
    }

    .compact-code-chip:hover {
      background: rgba(var(--adminuiux-theme-1-rgb), 0.1);
      border-color: var(--adminuiux-theme-1);
      transform: translateY(-1px);
    }

    .compact-chip--success {
      border-color: rgba(var(--bs-success-rgb), 0.6);
      color: var(--bs-success);
    }

    .compact-chip--warning {
      border-color: rgba(var(--bs-warning-rgb), 0.7);
      color: #92660a;
    }

    .compact-chip--overdue {
      border-color: rgba(249, 115, 22, 0.7);
      color: #c2560a;
    }

    .compact-chip--critical {
      border-color: rgba(var(--bs-danger-rgb), 0.6);
      color: var(--bs-danger);
    }

    .sla-summary-bar {
      position: sticky;
      top: 0;
      z-index: 15;
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-bottom: 0.85rem;
      padding: 0.5rem 0.25rem;
      background: rgba(var(--bs-body-bg-rgb), 0.94);
    }

    .sla-summary-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border: 1px solid rgba(var(--bs-body-color-rgb), 0.14);
      background: rgba(var(--bs-body-bg-rgb), 0.92);
      color: var(--bs-body-color);
      border-radius: 999px;
      padding: 0.3rem 0.75rem;
      font-size: 0.78rem;
      line-height: 1;
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .sla-summary-chip:hover {
      border-color: rgba(var(--bs-body-color-rgb), 0.32);
      box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb), 0.14);
    }

    .sla-summary-chip:focus-visible {
      outline: 2px solid var(--bs-primary);
      outline-offset: 2px;
    }

    .kanban-column--jump-highlight {
      border-radius: 0.5rem;
      box-shadow: 0 0 0 3px rgba(var(--bs-primary-rgb), 0.35);
      transition: box-shadow 0.3s ease;
    }

    .sla-summary-chip__dot {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      background: var(--bs-secondary);
    }

    .sla-summary-chip--success .sla-summary-chip__dot {
      background: var(--bs-success);
    }

    .sla-summary-chip--warning .sla-summary-chip__dot {
      background: var(--bs-warning);
    }

    .sla-summary-chip--overdue .sla-summary-chip__dot {
      background: #f97316;
    }

    .sla-summary-chip--critical .sla-summary-chip__dot {
      background: var(--bs-danger);
    }

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, minmax(17rem, 1fr));
      gap: 1rem;
      align-items: start;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .board-audience-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
      padding: 0.8rem 1rem;
      border-radius: 0.95rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.1);
      background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
    }

    .board-audience-toolbar strong {
      display: block;
      font-size: 0.92rem;
    }

    .board-audience-toolbar small {
      display: block;
      color: rgba(var(--bs-body-color-rgb), 0.65);
      font-size: 0.78rem;
    }

    .board-audience-toolbar__chips {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }

    .board-audience-chip {
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.22);
      background: rgba(var(--bs-body-bg-rgb), 0.92);
      color: var(--bs-body-color);
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      line-height: 1;
      transition: all 120ms ease;
    }

    .board-audience-chip.is-active {
      background: rgba(var(--adminuiux-theme-1-rgb), 0.15);
      border-color: rgba(var(--adminuiux-theme-1-rgb), 0.45);
      color: var(--adminuiux-theme-1);
    }

    .kanban-column {
      min-height: 18rem;
      padding: 1rem;
      border-radius: 1.25rem;
      background: linear-gradient(180deg, rgba(var(--bs-body-bg-rgb), 0.94), rgba(var(--adminuiux-theme-1-rgb), 0.04));
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      box-shadow: 0 1rem 2rem rgba(var(--adminuiux-theme-1-rgb), 0.06);
      backdrop-filter: blur(12px);
    }

    .column-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .column-header__title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .column-color-dot {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 0.2rem rgba(var(--bs-body-bg-rgb), 0.9);
    }

    .column-title {
      color: var(--bs-body-color);
      font-weight: 600;
    }

    .column-subtitle {
      color: rgba(var(--bs-body-color-rgb), 0.56);
    }

    .project-count {
      min-width: 2.25rem;
      min-height: 2.25rem;
      display: grid;
      place-items: center;
      border-radius: 0.85rem;
      color: var(--bs-body-color);
      font-weight: 600;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.1);
    }

    .cards-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .cards-sortable {
      min-height: 7rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding: 0.15rem;
      border-radius: 1.05rem;
      transition: background-color 160ms ease, box-shadow 160ms ease;
    }

    .project-drag-item {
      border-radius: 1rem;
      cursor: grab;
    }

    .project-drag-item.gu-transit {
      opacity: 0.38;
    }

    .column-empty {
      padding: 1rem;
      border-radius: 1rem;
      border: 1px dashed rgba(var(--adminuiux-theme-1-rgb), 0.18);
      color: rgba(var(--bs-body-color-rgb), 0.56);
      background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
      font-size: 0.85rem;
      line-height: 1.5;
    }

    .diagnosis-inspection-card {
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
      border-radius: 1rem;
      padding: 0.9rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
    }

    .diagnosis-inspection-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.55rem;
    }

    .diagnosis-budget-input {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .diagnosis-budget-input > span {
      font-weight: 600;
      color: rgba(var(--bs-body-color-rgb), 0.7);
    }

    .project-composer {
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.9);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
      box-shadow: inset 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.03);
    }

    .project-composer__input,
    .project-composer__textarea,
    .project-detail-field__input,
    .project-detail-field__textarea {
      width: 100%;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.14);
      border-radius: 0.95rem;
      background: rgba(var(--bs-body-bg-rgb), 0.96);
      color: var(--bs-body-color);
      padding: 0.85rem 0.95rem;
      outline: none;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    }

    .project-composer__textarea,
    .project-detail-field__textarea {
      resize: vertical;
      min-height: 7rem;
    }

    .project-composer__input:focus,
    .project-composer__textarea:focus,
    .project-detail-field__input:focus,
    .project-detail-field__textarea:focus {
      border-color: rgba(var(--adminuiux-theme-accent-1-rgb), 0.5);
      box-shadow: 0 0 0 0.25rem rgba(var(--adminuiux-theme-accent-1-rgb), 0.12);
      transform: translateY(-1px);
    }

    .project-composer__textarea {
      margin-top: 0.75rem;
    }

    .project-composer__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.85rem;
    }

    .add-card-btn {
      border: 1px dashed rgba(var(--adminuiux-theme-1-rgb), 0.18);
      border-radius: 1rem;
      padding: 0.9rem 1rem;
      background: transparent;
      color: rgba(var(--bs-body-color-rgb), 0.72);
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      transition: all 160ms ease;
    }

    .add-card-btn:hover,
    .add-card-btn.is-active {
      border-color: rgba(var(--adminuiux-theme-accent-1-rgb), 0.28);
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.08);
      color: var(--bs-body-color);
    }

    .project-detail-shell {
      position: fixed;
      inset: 0;
      z-index: 1055;
      display: grid;
      place-items: center;
      pointer-events: none;
    }

    .project-detail-shell.is-open {
      pointer-events: auto;
    }

    .project-detail-shell__backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      background: rgba(15, 23, 42, 0.42);
      backdrop-filter: blur(6px);
      opacity: 0;
      transition: opacity 180ms ease;
    }

    .project-detail-shell.is-open .project-detail-shell__backdrop {
      opacity: 1;
    }

    .project-detail-shell.is-route {
      position: static;
      inset: auto;
      z-index: auto;
      display: block;
      place-items: stretch;
      pointer-events: auto;
    }

    .project-detail-shell.is-route .project-detail-dialog {
      width: 100%;
      max-width: 72rem;
      margin: 0 auto;
      max-height: none;
      border-radius: 1rem;
      box-shadow: 0 0.5rem 1.5rem rgba(15, 23, 42, 0.1);
      transform: none;
      opacity: 1;
    }

    .project-detail-dialog {
      position: relative;
      width: min(70rem, calc(100vw - 2rem));
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      border-radius: 1.5rem;
      overflow: hidden;
      background:
        radial-gradient(circle at top right, rgba(var(--adminuiux-theme-accent-1-rgb), 0.1), transparent 28%),
        rgba(var(--bs-body-bg-rgb), 0.98);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
      box-shadow: 0 2rem 4rem rgba(15, 23, 42, 0.28);
      transform: translateY(1rem) scale(0.98);
      opacity: 0;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .project-detail-dialog.is-open {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .project-detail-dialog__header,
    .project-detail-dialog__footer {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      background: rgba(var(--bs-body-bg-rgb), 0.84);
    }

    .project-detail-dialog__header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      align-items: flex-start;
    }

    .project-detail-dialog__hero {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      min-width: 0;
    }

    .project-detail-dialog__icon {
      width: 3.25rem;
      height: 3.25rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.12);
      color: var(--adminuiux-theme-1);
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .project-detail-dialog__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.35rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--adminuiux-theme-1);
      font-weight: 700;
    }

    .project-detail-dialog__title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bs-body-color);
    }

    .project-detail-dialog__subtitle {
      margin: 0.4rem 0 0;
      color: rgba(var(--bs-body-color-rgb), 0.62);
      line-height: 1.6;
    }

    .project-detail-dialog__close {
      padding: 0.35rem;
      color: rgba(var(--bs-body-color-rgb), 0.56);
    }

    .project-detail-dialog__body {
      overflow: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .project-detail-section {
      padding: 1.25rem;
      border-radius: 1.25rem;
      background: rgba(var(--bs-body-bg-rgb), 0.84);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      box-shadow: inset 0 0 0 1px rgba(var(--bs-body-bg-rgb), 0.15);
    }

    .section-heading,
    .section-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .section-toggle {
      width: 100%;
      padding: 0;
      border: 0;
      background: transparent;
      text-align: left;
      color: inherit;
    }

    .section-heading--compact {
      margin-bottom: 0.75rem;
    }

    .section-heading h4,
    .section-toggle h4 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--bs-body-color);
    }

    .section-heading p,
    .section-toggle p {
      margin: 0.25rem 0 0;
      color: rgba(var(--bs-body-color-rgb), 0.58);
      line-height: 1.5;
      font-size: 0.92rem;
    }

    .project-status-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .status-chip {
      padding: 0.7rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(var(--bs-body-color-rgb), 0.08);
      background: rgba(var(--bs-body-bg-rgb), 0.72);
      color: var(--bs-body-color);
      font-weight: 600;
      transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    }

    .status-chip:hover,
    .status-chip.is-active {
      transform: translateY(-1px);
      box-shadow: 0 0.75rem 1.5rem rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .project-form-grid {
      display: grid;
      gap: 1rem;
    }

    .project-form-grid--2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .project-form-grid--3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .project-detail-field {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .project-detail-field__label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(var(--bs-body-color-rgb), 0.56);
      font-weight: 700;
    }

    :host ::ng-deep .project-detail-field .choices {
      margin-bottom: 0;
    }

    :host ::ng-deep .project-detail-field .choices__inner {
      min-height: auto;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.14) !important;
      border-radius: 0.95rem !important;
      background: rgba(var(--bs-body-bg-rgb), 0.96) !important;
      color: var(--bs-body-color) !important;
      padding: 0.45rem 0.85rem;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    }

    :host ::ng-deep .project-detail-field .choices.is-focused .choices__inner,
    :host ::ng-deep .project-detail-field .choices.is-open .choices__inner {
      border-color: rgba(var(--adminuiux-theme-accent-1-rgb), 0.5) !important;
      box-shadow: 0 0 0 0.25rem rgba(var(--adminuiux-theme-accent-1-rgb), 0.12) !important;
      transform: translateY(-1px);
    }

    :host ::ng-deep .project-detail-field .choices[data-type*='select-one']::after {
      right: 1rem;
      border-color: rgba(var(--bs-body-color-rgb), 0.58) transparent transparent;
    }

    :host ::ng-deep .project-detail-field .choices__list--single {
      padding: 0.25rem 1.5rem 0.25rem 0;
      color: var(--bs-body-color) !important;
    }

    :host ::ng-deep .project-detail-field .choices[data-type*='select-one'] .choices__inner .choices__item {
      background: transparent !important;
      border: 0 !important;
      margin: 0;
      padding: 0;
      color: var(--bs-body-color) !important;
    }

    :host ::ng-deep .project-detail-field .choices__list--single .choices__item.choices__placeholder {
      color: rgba(var(--bs-body-color-rgb), 0.6) !important;
      opacity: 1;
    }

    :host ::ng-deep .project-detail-field .choices__input {
      background: transparent !important;
      color: var(--bs-body-color) !important;
      margin-bottom: 0;
    }

    :host ::ng-deep .project-detail-field .choices__list--dropdown,
    :host ::ng-deep .project-detail-field .choices__list[aria-expanded] {
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12) !important;
      border-radius: 1rem !important;
      background: rgba(var(--bs-body-bg-rgb), 0.98) !important;
      box-shadow: 0 1.25rem 2.5rem rgba(15, 23, 42, 0.16);
      overflow: hidden;
      margin-top: 0.45rem;
      z-index: 30;
    }

    :host ::ng-deep .project-detail-field .choices__list--dropdown .choices__item,
    :host ::ng-deep .project-detail-field .choices__list[aria-expanded] .choices__item {
      padding: 0.7rem 0.85rem;
      color: var(--bs-body-color) !important;
    }

    :host ::ng-deep .project-detail-field .choices__item--selectable.is-highlighted {
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.12) !important;
    }

    .project-detail-field--range,
    .project-detail-field--toggles,
    .project-detail-field--members,
    .project-detail-field--workflow {
      padding: 0.95rem;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .progress-editor {
      display: flex;
      align-items: center;
      gap: 0.9rem;
    }

    .progress-editor input[type='range'] {

    .project-detail-dialog__feedback {
      max-width: 22rem;
      text-align: right;
      line-height: 1.35;
    }
      flex: 1;
      accent-color: var(--adminuiux-theme-1);
    }

    .progress-editor__value {
      min-width: 3.25rem;
      text-align: right;
      font-weight: 700;
      color: var(--adminuiux-theme-1);
    }

    .project-switch {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--bs-body-color);
      font-weight: 500;
      line-height: 1.45;
    }

    .project-switch input {
      width: 1rem;
      height: 1rem;
      accent-color: var(--adminuiux-theme-1);
      flex-shrink: 0;
    }

    .project-switch--inline {
      margin-top: 1rem;
    }

    .member-editor {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .member-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .member-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.7rem;
      border-radius: 999px;
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.12);
      color: var(--bs-body-color);
      font-weight: 600;
    }

    .member-chip button,
    .attachment-item__remove {
      border: 0;
      background: transparent;
      color: rgba(var(--bs-body-color-rgb), 0.52);
      padding: 0;
      display: inline-grid;
      place-items: center;
    }

    .member-editor__form {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .helper-box {
      padding: 0.85rem 1rem;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
      color: rgba(var(--bs-body-color-rgb), 0.56);
      border: 1px dashed rgba(var(--adminuiux-theme-1-rgb), 0.15);
    }

    .equipment-scan-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.65rem;
    }

    .equipment-scan-row .project-detail-field__input {
      flex: 1;
      min-width: 14rem;
    }

    .equipment-qr-preview {
      margin-top: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.08);
      border: 1px solid rgba(var(--adminuiux-theme-accent-1-rgb), 0.2);
      display: flex;
      align-items: center;
      gap: 0.95rem;
    }

    .equipment-qr-preview img {
      width: 6.25rem;
      height: 6.25rem;
      border-radius: 0.75rem;
      background: #fff;
      padding: 0.4rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.16);
    }

    .equipment-qr-preview__meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .equipment-qr-preview__meta strong {
      color: rgba(var(--bs-body-color-rgb), 0.9);
      font-size: 0.96rem;
      line-height: 1.35;
    }

    .equipment-qr-preview__meta small {
      color: rgba(var(--bs-body-color-rgb), 0.62);
      font-size: 0.8rem;
      overflow-wrap: anywhere;
    }

    .equipment-qr-placeholder {
      margin-top: 1rem;
    }

    .equipment-linked-box {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.08);
      border: 1px solid rgba(var(--adminuiux-theme-accent-1-rgb), 0.16);
    }

    .equipment-linked-box__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .equipment-linked-box__grid {
      display: grid;
      gap: 0.45rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      color: rgba(var(--bs-body-color-rgb), 0.84);
      font-size: 0.9rem;
    }

    .equipment-workflow-actions {
      margin-top: 1rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .equipment-evidence-grid {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .equipment-evidence-item {
      margin: 0;
      border-radius: 0.85rem;
      background: rgba(var(--bs-body-bg-rgb), 0.72);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.16);
      padding: 0.45rem;
    }

    .equipment-evidence-item a {
      display: block;
      border-radius: 0.65rem;
      overflow: hidden;
    }

    .equipment-evidence-item img {
      width: 100%;
      height: 7.25rem;
      object-fit: cover;
      display: block;
      border-radius: 0.65rem;
      background: rgba(var(--bs-body-color-rgb), 0.06);
    }

    .equipment-evidence-item figcaption {
      margin-top: 0.4rem;
      font-size: 0.76rem;
      color: rgba(var(--bs-body-color-rgb), 0.68);
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .material-estimate-card {
      background: linear-gradient(180deg, rgba(var(--adminuiux-theme-accent-1-rgb), 0.1), rgba(var(--adminuiux-theme-1-rgb), 0.04));
      border-color: rgba(var(--adminuiux-theme-accent-1-rgb), 0.18);
    }

    .material-estimate-input {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .material-estimate-input span {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--adminuiux-theme-1);
    }

    .material-context-card {
      justify-content: center;
    }

    .material-context-card__value {
      font-size: 1.25rem;
      color: var(--bs-body-color);
      line-height: 1.2;
    }

    .material-reference-card {
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.05);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.1);
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .material-search-dropdown {
      position: absolute;
      z-index: 50;
      margin-top: 0.25rem;
      background: rgba(var(--bs-body-bg-rgb), 0.98);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.15);
      border-radius: 0.95rem;
      box-shadow: 0 0.75rem 1.5rem rgba(15, 23, 42, 0.12);
      max-height: 18rem;
      overflow-y: auto;
      width: 100%;
    }

    .material-search-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.7rem 0.95rem;
      border: 0;
      background: transparent;
      text-align: left;
      cursor: pointer;
      color: var(--bs-body-color);
      transition: background 120ms ease;
    }

    .material-search-option:hover {
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.1);
    }

    .material-search-option strong {
      min-width: 8rem;
      font-size: 0.9rem;
    }

    .material-search-option span {
      flex: 1;
      font-size: 0.85rem;
      color: rgba(var(--bs-body-color-rgb), 0.7);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .material-not-found-card {
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(var(--bs-warning-rgb), 0.08);
      border: 1px solid rgba(var(--bs-warning-rgb), 0.25);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .material-not-found-card__header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.95rem;
      color: var(--bs-body-color);
    }

    .material-not-found-card__message {
      margin: 0;
      font-size: 0.88rem;
      color: rgba(var(--bs-body-color-rgb), 0.8);
      line-height: 1.5;
    }

    .material-reference-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .material-reference-card__header p {
      margin: 0.2rem 0 0;
      color: rgba(var(--bs-body-color-rgb), 0.6);
      font-size: 0.9rem;
      line-height: 1.45;
    }

    .material-reference-card__grid {
      display: grid;
      gap: 0.45rem 0.85rem;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      font-size: 0.9rem;
      color: rgba(var(--bs-body-color-rgb), 0.84);
    }

    .project-materials-table th,
    .project-materials-table td {
      vertical-align: middle;
    }

    .other-details {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-toggles-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .attachments-box {
      padding: 1rem;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .upload-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.8rem 1rem;
      border-radius: 0.95rem;
      border: 1px dashed rgba(var(--adminuiux-theme-accent-1-rgb), 0.28);
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.08);
      color: var(--bs-body-color);
      font-weight: 600;
      cursor: pointer;
      width: fit-content;
    }

    .upload-trigger input {
      display: none;
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.9);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .attachment-item__meta {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }

    .attachment-item__meta strong {
      color: var(--bs-body-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .attachment-item__meta span {
      color: rgba(var(--bs-body-color-rgb), 0.56);
      font-size: 0.85rem;
    }

    .project-detail-dialog__footer {
      border-top: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      border-bottom: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .project-detail-dialog__timestamp {
      color: rgba(var(--bs-body-color-rgb), 0.56);
    }

    .project-detail-dialog__actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .scanner-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.58);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1080;
      padding: 1rem;
    }

    .scanner-dialog {
      width: min(32rem, calc(100vw - 2rem));
      border-radius: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.98);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.16);
      padding: 1rem;
      box-shadow: 0 1.75rem 3rem rgba(15, 23, 42, 0.26);
    }

    .scanner-video-frame {
      border-radius: 0.85rem;
      overflow: hidden;
      background: #000;
      aspect-ratio: 4 / 3;
    }

    .scanner-video-frame video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .technical-report-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.58);
      backdrop-filter: blur(4px);
      display: grid;
      place-items: center;
      z-index: 1085;
      padding: 1rem;
    }

    .technical-report-dialog {
      width: min(52rem, calc(100vw - 2rem));
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
      border-radius: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.98);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.16);
      padding: 1.25rem;
      box-shadow: 0 1.75rem 3rem rgba(15, 23, 42, 0.26);
    }

    .technical-report-sheet__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
      border-bottom: 2px solid rgba(var(--adminuiux-theme-1-rgb), 0.35);
    }

    .technical-report-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem 1.25rem;
    }

    .technical-report-grid__item dt {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: rgba(var(--bs-body-color-rgb), 0.56);
      margin-bottom: 0.15rem;
    }

    .technical-report-grid__item dd {
      margin-bottom: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .technical-report-section {
      padding-top: 1rem;
      margin-top: 1rem;
      border-top: 1px solid rgba(var(--bs-border-color-rgb, var(--bs-body-color-rgb)), 0.18);
    }

    .technical-report-section h6 {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: rgba(var(--bs-body-color-rgb), 0.56);
      margin-bottom: 0.5rem;
    }

    .technical-report-text {
      white-space: pre-wrap;
      word-break: break-word;
      margin-bottom: 0;
    }

    @media print {
      .kanban-board,
      .board-audience-toolbar,
      .project-detail-shell,
      .technical-report-toolbar {
        display: none !important;
      }

      .technical-report-backdrop {
        position: static;
        display: block;
        padding: 0;
        background: none;
        backdrop-filter: none;
      }

      .technical-report-dialog {
        width: 100%;
        max-height: none;
        overflow: visible;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
        background: #fff;
      }
    }

    @media (max-width: 1199.98px) {
      .kanban-board {
        grid-template-columns: repeat(2, minmax(18rem, 1fr));
      }

      .project-form-grid--3,
      .detail-toggles-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 767.98px) {
      .kanban-board {
        grid-template-columns: minmax(16rem, 1fr);
      }

      .project-detail-dialog {
        width: calc(100vw - 1rem);
        max-height: calc(100vh - 1rem);
      }

      .project-detail-dialog__header,
      .project-detail-dialog__body,
      .project-detail-dialog__footer,
      .project-detail-section {
        padding: 1rem;
      }

      .project-form-grid--2,
      .project-form-grid--3,
      .detail-toggles-grid {
        grid-template-columns: 1fr;
      }

      .member-editor__form,
      .project-detail-dialog__header,
      .project-detail-dialog__footer,
      .column-header {
        flex-direction: column;
        align-items: stretch;
      }

      .project-detail-dialog__actions {
        width: 100%;
      }

      .project-detail-dialog__actions .btn {
        flex: 1;
      }

      .progress-editor {
        flex-direction: column;
        align-items: stretch;
      }

      .progress-editor__value {
        text-align: left;
      }

      .equipment-scan-row {
        flex-direction: column;
        align-items: stretch;
      }

      .equipment-scan-row .project-detail-field__input {
        min-width: 0;
      }

      .equipment-qr-preview {
        flex-direction: column;
        align-items: flex-start;
      }

      .equipment-linked-box__grid {
        grid-template-columns: 1fr;
      }

      .equipment-evidence-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
})
export class KanbanViewComponent implements AfterViewInit, OnDestroy, OnInit {
  @Input() compactMode = false;

  @ViewChildren('columnDropZone') columnDropZones!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('projectDetailBody') projectDetailBody?: ElementRef<HTMLDivElement>;
  @ViewChild('equipmentScannerVideo') equipmentScannerVideo?: ElementRef<HTMLVideoElement>;

  private slaColumnHighlightTimeoutId?: number;

  readonly board$ = this.projectService.board$;
  readonly repairStatusOptions = this.projectEquipmentService.repairStatusOptions;
  readonly technicalTestTypeOptions = PROJECT_TEST_TYPE_OPTIONS;

  /**
   * Fase 6: los responsables salen de RRHH (hr_employees activos), no de una
   * lista quemada. Antes acá había 6 nombres inventados ("Juan Pérez"…) que no
   * existían como empleados: se podía asignar un proyecto a gente inexistente y
   * el select nunca reflejaba la plantilla real.
   */
  peopleNames: string[] = [];

  get assigneeOptions(): string[] {
    return this.hrPeople.merge(
      this.peopleNames,
      String(this.detailProject?.properties?.['assignee'] ?? ''),
    );
  }

  readonly clientOptions = [
    'Cliente interno',
    'Cliente estratégico',
    'Grupo Andino',
    'Avidesa',
  ];

  readonly categoryOptions = [
    'Implementacion',
    'Operacion',
    'Automatizacion',
    'Infraestructura',
    'Transformacion digital',
  ];

  readonly departmentOptions = [
    'Finanzas',
    'TI',
    'Operaciones',
    'Comercial',
    'Marketing',
    'Direccion',
  ];

  readonly currencyOptions = ['COP', 'USD', 'EUR'];

  readonly priorityOptions = [
    { value: 'high', label: 'Alta' },
    { value: 'medium', label: 'Media' },
    { value: 'low', label: 'Baja' },
  ];

  readonly paymentConditionOptions: Array<{ value: ProjectPaymentCondition; label: string }> = [
    { value: 'contra-entrega', label: 'Contra-entrega' },
    { value: 'credito', label: 'Credito' },
  ];

  readonly paymentStatusOptions: Array<{ value: ProjectPaymentStatus; label: string }> = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'parcial', label: 'Pago parcial' },
    { value: 'confirmado', label: 'Pago confirmado' },
  ];

  readonly boardAudienceOptions: Array<{ value: BoardAudience; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'tecnico', label: 'Tecnico' },
    { value: 'administrativo', label: 'Administrativo' },
  ];

  creatingColumnId: string | null = null;
  draftTitle = '';
  draftDescription = '';
  detailProject: Project | null = null;
  activeDetailTab: ProjectDetailTab = 'equipo';
  showOtherDetails = true;
  newMemberName = '';
  saving = false;
  equipmentOptions: ProjectEquipmentOption[] = [];
  equipmentLocationOptions = this.projectEquipmentService.getLocations();
  inventoryReferences: StockReference[] = [];
  materialTechnicianOptions: string[] = [];
  materialReservations: ReservationRecord[] = [];
  selectedMaterialReference: StockReference | null = null;
  materialRequestDraft: ProjectMaterialRequestDraft = this.buildMaterialRequestDraft();
  materialRequestMessage = '';
  materialRequestError = '';
  materialSearchQuery = '';
  showMaterialNotFoundCard = false;
  showManualPurchaseLineForm = false;
  purchaseLineDraft = { reference: '', component: '', type: '', brand: '', description: '', supplier: '', quantity: 1, unitPrice: 0, neededBy: '1' };
  projectPurchaseLines: PurchaseLine[] = [];
  purchaseLineMessage = '';
  purchaseLineError = '';
  purchaseRequestDraft = { reference: '', description: '', quantity: 1, supplier: '', estimatedCost: 0, leadTimeDays: 1, urgency: 'normal', memo: '' };
  purchaseRequestMessage = '';
  purchaseRequestError = '';
  purchaseRequests: any[] = [];
  dispatchDraft: ProjectDispatchDraft = this.buildDispatchDraft();
  dispatchMessage = '';
  dispatchError = '';
  dispatching = false;
  dispatchAccessoriesConfirmed = false;
  selectedEquipmentReference = '';
  linkedEquipment: ProjectEquipmentOption | null = null;
  linkedEquipmentEvidencePhotos: ProspectEquipmentEvidencePhoto[] = [];
  linkedEquipmentAttachments: ProspectEquipmentAttachment[] = [];
  linkedEquipmentEvidenceLoading = false;
  linkedEquipmentEvidenceError = '';
  equipmentIdentifierDraft = '';
  equipmentRepairStatusDraft: ProspectEquipmentRepairStatus = 'recibido';
  equipmentLocationIdDraft = '';
  equipmentWorkflowMessage = '';
  equipmentWorkflowError = '';
  showEquipmentScanner = false;
  showTechnicalReport = false;
  technicalReport: TechnicalReportView | null = null;
  equipmentScannerStatus = '';
  equipmentScannerError = '';
  equipmentQrDataUrl = '';
  equipmentQrError = '';
  boardActionMessage = '';
  receptionProjectsMessage = '';
  boardAudience: BoardAudience = 'todos';
  onlyMyProjects = false;
  diagnosisCloseError = '';
  diagnosisCloseMessage = '';
  testsCloseError = '';
  testsCloseMessage = '';
  pendingTransition: PendingProjectTransition | null = null;
  equipmentSessionElapsed = '00:00';
  private equipmentSessionStartedAt = 0;
  private equipmentSessionProjectId = '';
  private equipmentSessionTimerId: number | null = null;

  private columnDropZonesChangesSubscription?: Subscription;
  private projectsWithTasksSubscription?: Subscription;
  private queryParamsSubscription?: Subscription;
  private routeParamsSubscription?: Subscription;
  detailRouteMode = false;
  private inventoryStateSubscription?: Subscription;
  private readonly emptyColumnProjects: Project[] = [];
  private readonly projectsByColumn = new Map<string, Project[]>();
  private dragulaInstance: any;
  private readonly equipmentBarcodeReader = new BrowserMultiFormatReader();
  private equipmentScannerControls: { stop: () => void } | null = null;
  private scannerDetectionLocked = false;
  private equipmentQrGenerationToken = 0;
  private linkedEquipmentEvidenceRequestToken = 0;
  private lastAutoOpenedProjectId = '';
  private readonly pendingOpenProjectStorageKey = 'work.projects.open-project.pending';

  constructor(
    private projectService: ProjectService,
    private projectEquipmentService: ProjectEquipmentService,
    private crmEquipmentApi: CrmEquipmentApiService,
    private hrPeople: HrPeoplePickerService,
    private projectsApi: ProjectsApiService,
    private emailsApi: EmailsApiService,
    private authService: AuthService,
    private inventoryWorkflowService: InventoryWorkflowService,
    private inventoryRbacService: InventoryRbacService,
    private inventoryApiService: InventoryApiService,
    private workTestBatchService: WorkTestBatchService,
    private worktimeApi: WorktimeApiService,
    private equipmentHistoryContextService: WorkEquipmentHistoryContextService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.projectsWithTasksSubscription = this.projectService.projectsWithTasks$.subscribe((projects) => {
      const nextProjectsByColumn = new Map<string, Project[]>();

      projects.forEach((project) => {
        const columnProjects = nextProjectsByColumn.get(project.status);
        if (columnProjects) {
          columnProjects.push(project);
          return;
        }

        nextProjectsByColumn.set(project.status, [project]);
      });

      this.projectsByColumn.clear();
      nextProjectsByColumn.forEach((columnProjects, columnId) => {
        this.projectsByColumn.set(columnId, columnProjects);
      });
    });

    this.inventoryStateSubscription = this.inventoryWorkflowService.state$.subscribe((state) => {
      this.inventoryReferences = [...state.references].sort((left, right) => left.reference.localeCompare(right.reference));
      this.syncSelectedMaterialReference();
      this.syncMaterialReservations(state.reservations);
    });

    this.loadMaterialTechnicianOptions();
    // Fase 6: responsables y técnicos salen de RRHH. Si no hay empleados activos
    // el picker queda vacío a propósito, nunca con nombres inventados.
    void this.hrPeople.refresh().then((names) => {
      this.peopleNames = names;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.columnDropZonesChangesSubscription = this.columnDropZones.changes.subscribe(() => {
      this.syncDragAndDrop();
    });

    this.syncDragAndDrop();

    this.queryParamsSubscription = this.route.queryParamMap.subscribe((params) => {
      const openProjectIdFromQuery = params.get('openProject')?.trim() ?? '';
      const openProjectIdFromState = this.readOpenProjectFromNavigationState();
      const openProjectIdFromStorage = this.consumePendingOpenProjectId();
      const openProjectId = openProjectIdFromQuery || openProjectIdFromState || openProjectIdFromStorage;
      const createdFromReceptionRaw = params.get('createdFromReception')?.trim() ?? '';
      const createdIds = createdFromReceptionRaw
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      this.receptionProjectsMessage = createdIds.length
        ? `Se generaron ${createdIds.length} proyecto(s) desde recepción de equipos.`
        : '';

      if (!openProjectId || openProjectId === this.lastAutoOpenedProjectId) {
        return;
      }

      this.lastAutoOpenedProjectId = openProjectId;
      this.projectService.getProject(openProjectId).pipe(take(1)).subscribe((project) => {
        if (!project) {
          return;
        }

        this.openProjectDetail(project);
      });
    });

    this.routeParamsSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe(() => this.applyRouteProjectId(this.readRouteProjectId()));

    // Resolve the current route param once on init. Deferred to a fresh task so the state
    // change lands in its own change-detection cycle and renders on this otherwise-static page.
    setTimeout(() => this.applyRouteProjectId(this.readRouteProjectId()), 0);
  }

  // Reads the :id route param by walking the activated route tree from the root. The kanban
  // component is nested several levels below the routed WorkProjectsComponent, so its own
  // ActivatedRoute.paramMap does not expose the parent path param directly.
  private readRouteProjectId(): string {
    let route: ActivatedRoute | null = this.route.root;
    while (route) {
      const id = route.snapshot.paramMap.get('id');
      if (id) {
        return id.trim();
      }
      route = route.firstChild;
    }
    return '';
  }

  private applyRouteProjectId(projectId: string): void {
    if (!projectId) {
      this.detailRouteMode = false;
      if (this.detailProject) {
        this.resetDetailState();
      }
      this.cdr.detectChanges();
      return;
    }

    this.detailRouteMode = true;
    this.projectService.getProject(projectId).pipe(take(1)).subscribe((project) => {
      if (project) {
        this.openProjectDetail(project);
      } else {
        this.detailRouteMode = false;
        void this.router.navigate(['/app/work-projects']);
      }
      this.cdr.detectChanges();
    });
  }

  private readOpenProjectFromNavigationState(): string {
    const fromNavigation = String(this.router.getCurrentNavigation()?.extras?.state?.['openProjectId'] ?? '').trim();
    if (fromNavigation) {
      return fromNavigation;
    }

    if (typeof window === 'undefined') {
      return '';
    }

    const historyState = window.history.state as Record<string, unknown> | null;
    return String(historyState?.['openProjectId'] ?? '').trim();
  }

  private consumePendingOpenProjectId(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    const rawValue = window.sessionStorage.getItem(this.pendingOpenProjectStorageKey) ?? '';
    const normalizedValue = rawValue.trim();
    if (normalizedValue) {
      window.sessionStorage.removeItem(this.pendingOpenProjectStorageKey);
    }

    return normalizedValue;
  }

  ngOnDestroy(): void {
    this.finalizeEquipmentSessionTimer();
    this.columnDropZonesChangesSubscription?.unsubscribe();
    this.projectsWithTasksSubscription?.unsubscribe();
    this.queryParamsSubscription?.unsubscribe();
    this.routeParamsSubscription?.unsubscribe();
    this.inventoryStateSubscription?.unsubscribe();
    this.projectsByColumn.clear();
    this.destroyDragAndDrop();
    this.stopEquipmentScannerSession();
    if (this.slaColumnHighlightTimeoutId) {
      window.clearTimeout(this.slaColumnHighlightTimeoutId);
      this.slaColumnHighlightTimeoutId = undefined;
    }
  }

  get canManageMaterialReservations(): boolean {
    return this.inventoryRbacService.hasPermission('inventory.reservations.manage');
  }

  get isTechnicianInventoryRole(): boolean {
    return this.inventoryRbacService.currentRole === 'tecnico';
  }

  get materialAssigneeOptions(): string[] {
    const currentAssignee = String(this.materialRequestDraft?.assignedTo ?? '').trim();
    return this.getMaterialAssigneeChoices(currentAssignee);
  }

  getProjectsByColumn(columnId: string): Project[] {
    const projects = this.projectsByColumn.get(columnId) ?? this.emptyColumnProjects;
    return this.filterProjectsByAudience(projects);
  }

  setBoardAudience(audience: BoardAudience): void {
    this.boardAudience = audience;
  }

  toggleOnlyMyProjects(): void {
    this.onlyMyProjects = !this.onlyMyProjects;
  }

  currentUserName(): string {
    return this.resolveCurrentUserName();
  }

  getColumnBadgeColor(color: string): string {
    return this.hexToRgba(color, 0.16);
  }

  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }

  trackByEquipmentEvidenceId(index: number, evidence: ProspectEquipmentEvidencePhoto): string {
    return evidence.id || `evidence-${index}`;
  }

  getCompactSlaSeverity(project: Project, column: BoardColumn): string {
    const rawValue = project.properties['stageEnteredAt'];
    const parsed = rawValue ? (rawValue instanceof Date ? rawValue : new Date(String(rawValue))) : null;
    const stageDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
    return resolveProjectSlaSeverity(column, stageDate, String(project.properties['priority'] ?? ''));
  }

  getSlaSummaryChips(board: ProjectBoard): SlaSummaryChip[] {
    const projects = board.columns.flatMap((column) => this.getProjectsByColumn(column.id));
    return buildSlaSummary(board.columns, projects, (project, column) => {
      return this.getCompactSlaSeverity(project as Project, column as BoardColumn);
    });
  }

  onSlaSummaryChipClick(chip: SlaSummaryChip): void {
    const columnId = String(chip?.columnId ?? '');
    if (!columnId) {
      return;
    }

    const dropZone = this.columnDropZones?.toArray()
      .find((dropZoneRef) => dropZoneRef.nativeElement.dataset['columnId'] === columnId)
      ?.nativeElement;
    const target = (dropZone?.closest('section.kanban-column') as HTMLElement | null) ?? dropZone;
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    target.classList.add('kanban-column--jump-highlight');

    if (this.slaColumnHighlightTimeoutId) {
      window.clearTimeout(this.slaColumnHighlightTimeoutId);
    }
    this.slaColumnHighlightTimeoutId = window.setTimeout(() => {
      target.classList.remove('kanban-column--jump-highlight');
      this.slaColumnHighlightTimeoutId = undefined;
    }, 1600);
  }

  getStatusBorder(color: string, isActive: boolean): string {
    return isActive ? this.hexToRgba(color, 0.36) : 'rgba(var(--bs-body-color-rgb), 0.08)';
  }

  getStatusBackground(color: string, isActive: boolean): string {
    return isActive ? this.hexToRgba(color, 0.18) : 'rgba(var(--bs-body-bg-rgb), 0.72)';
  }

  get cameraScannerSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function';
  }

  setActiveDetailTab(tab: ProjectDetailTab): void {
    if (this.activeDetailTab === tab) {
      this.scrollProjectDetailBodyToTop();
      return;
    }

    this.activeDetailTab = tab;
    this.scrollProjectDetailBodyToTop();
  }

  selectLinkedEquipment(reference: string): void {
    this.selectedEquipmentReference = reference;
    this.equipmentWorkflowMessage = '';
    this.equipmentWorkflowError = '';

    if (!this.detailProject) {
      return;
    }

    if (!reference.trim()) {
      this.linkedEquipment = null;
      this.clearLinkedEquipmentFromProject();
      return;
    }

    const selected = this.projectEquipmentService.getEquipmentByReference(reference);
    if (!selected) {
      this.equipmentWorkflowError = 'No fue posible cargar el equipo seleccionado. Actualiza la lista e intenta nuevamente.';
      return;
    }

    this.applyLinkedEquipment(selected, 'catalog');
  }

  searchEquipmentByIdentifier(source: 'manual' | 'camera-scan' = 'manual'): void {
    const identifier = this.equipmentIdentifierDraft.trim();
    this.equipmentWorkflowMessage = '';
    this.equipmentWorkflowError = '';

    if (!identifier) {
      this.equipmentWorkflowError = 'Ingresa o escanea un identificador para continuar.';
      return;
    }

    const match = this.projectEquipmentService.findEquipmentByIdentifier(identifier);
    if (!match) {
      this.equipmentWorkflowError = 'No se encontro un equipo recibido con ese identificador o serial.';
      return;
    }

    this.applyLinkedEquipment(match, source);
  }

  openEquipmentScanner(): void {
    if (!this.cameraScannerSupported) {
      this.equipmentWorkflowError = 'Este navegador no habilita camara para lectura continua. Usa el campo manual.';
      return;
    }

    this.showEquipmentScanner = true;
    this.equipmentScannerError = '';
    this.equipmentScannerStatus = 'Solicita permisos de camara y apunta al QR o codigo del equipo.';

    window.setTimeout(() => {
      if (this.equipmentScannerVideo?.nativeElement) {
        void this.startEquipmentScanner(this.equipmentScannerVideo.nativeElement);
      }
    }, 0);
  }

  closeEquipmentScanner(): void {
    this.showEquipmentScanner = false;
    this.equipmentScannerError = '';
    this.equipmentScannerStatus = '';
    this.stopEquipmentScannerSession();
  }

  canUpdateEquipmentWorkflow(): boolean {
    return Boolean(this.detailProject && this.selectedEquipmentReference && this.equipmentLocationIdDraft.trim());
  }

  updateLinkedEquipmentWorkflow(): void {
    this.equipmentWorkflowMessage = '';
    this.equipmentWorkflowError = '';

    if (!this.detailProject || !this.selectedEquipmentReference) {
      this.equipmentWorkflowError = 'Primero vincula un equipo recibido al proyecto.';
      return;
    }

    if (!this.equipmentLocationIdDraft.trim()) {
      this.equipmentWorkflowError = 'Selecciona una ubicacion valida para el equipo.';
      return;
    }

    const assignee = String(this.detailProject.properties['assignee'] ?? '').trim() || 'asignado';
    const updatedEquipment = this.projectEquipmentService.updateEquipmentWorkflow(
      this.selectedEquipmentReference,
      this.equipmentRepairStatusDraft,
      this.equipmentLocationIdDraft,
      assignee,
    );

    if (!updatedEquipment) {
      this.equipmentWorkflowError = 'No se pudo sincronizar el estado con la recepcion de equipos.';
      return;
    }

    this.refreshEquipmentOptions();
    this.applyLinkedEquipment(updatedEquipment, 'catalog', false);
    this.detailProject.properties['equipmentLastWorkflowUpdate'] = updatedEquipment.repairStatusUpdatedAt || new Date().toISOString();
    this.equipmentWorkflowMessage = `Estado actualizado a ${updatedEquipment.repairStatusLabel} en ${updatedEquipment.storageLocationName || 'ubicacion sin nombre'}.`;
  }

  startCreateProject(columnId: string): void {
    if (this.creatingColumnId === columnId) {
      return;
    }

    this.creatingColumnId = columnId;
    this.draftTitle = '';
    this.draftDescription = '';
  }

  cancelCreateProject(): void {
    this.creatingColumnId = null;
    this.draftTitle = '';
    this.draftDescription = '';
  }

  submitCreateProject(columnId: string): void {
    const title = this.draftTitle.trim();
    if (!title) {
      return;
    }

    const description = this.draftDescription.trim();

    this.projectService.createProject(columnId, title, description).subscribe({
      next: (project) => {
        this.cancelCreateProject();
        this.openProjectDetail(project);
      },
      error: (error) => {
        this.boardActionMessage = `No se pudo crear el proyecto en el servidor: ${this.errorMessage(error)}`;
      },
    });
  }

  onProjectCardClick(event: MouseEvent, project: Project): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.project-card__drag-handle')) {
      return;
    }

    this.navigateToProject(project);
  }

  navigateToProject(project: Project): void {
    void this.router.navigate(['/app/work-projects', project.id]);
  }

  openProjectDetail(project: Project): void {
    this.finalizeEquipmentSessionTimer();
    this.newMemberName = '';
    this.showOtherDetails = true;
    this.diagnosisCloseError = '';
    this.diagnosisCloseMessage = '';
    this.testsCloseError = '';
    this.testsCloseMessage = '';
    this.detailProject = this.normalizeProject(project);
    this.initializeEquipmentContext();
    this.initializeMaterialsContext();
    this.initializeDispatchContext();
    this.loadPurchaseRequests();
    this.startEquipmentSessionTimer();
  }

  closeProjectDetail(): void {
    this.finalizeEquipmentSessionTimer();
    if (this.detailRouteMode) {
      this.detailRouteMode = false;
      void this.router.navigate(['/app/work-projects']);
    }
    this.resetDetailState();
  }

  private resetDetailState(): void {
    this.closeEquipmentScanner();
    this.detailProject = null;
    this.newMemberName = '';
    this.saving = false;
    this.equipmentWorkflowMessage = '';
    this.equipmentWorkflowError = '';
    this.equipmentQrDataUrl = '';
    this.equipmentQrError = '';
    this.materialRequestMessage = '';
    this.materialRequestError = '';
    this.dispatchMessage = '';
    this.dispatchError = '';
    this.diagnosisCloseError = '';
    this.diagnosisCloseMessage = '';
    this.testsCloseError = '';
    this.testsCloseMessage = '';
    this.dispatchDraft = this.buildDispatchDraft(null);
    this.dispatching = false;
    this.dispatchAccessoriesConfirmed = false;
    this.materialReservations = [];
    this.selectedMaterialReference = null;
    this.materialRequestDraft = this.buildMaterialRequestDraft(null);
  }

  private startEquipmentSessionTimer(): void {
    this.stopEquipmentSessionTicker();
    this.equipmentSessionStartedAt = Date.now();
    this.equipmentSessionProjectId = this.detailProject?.id ?? '';
    this.equipmentSessionElapsed = '00:00';

    if (typeof window !== 'undefined') {
      this.equipmentSessionTimerId = window.setInterval(() => {
        this.tickEquipmentSessionTimer();
      }, 1000);
    }
  }

  private tickEquipmentSessionTimer(): void {
    if (!this.equipmentSessionStartedAt) {
      return;
    }

    this.equipmentSessionElapsed = this.formatEquipmentSessionElapsed(Date.now() - this.equipmentSessionStartedAt);
  }

  private formatEquipmentSessionElapsed(elapsedMs: number): string {
    const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const minutesLabel = String(minutes).padStart(2, '0');
    const secondsLabel = String(seconds).padStart(2, '0');

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${minutesLabel}:${secondsLabel}`;
    }

    return `${minutesLabel}:${secondsLabel}`;
  }

  private stopEquipmentSessionTicker(): void {
    if (this.equipmentSessionTimerId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.equipmentSessionTimerId);
    }

    this.equipmentSessionTimerId = null;
  }

  private finalizeEquipmentSessionTimer(): void {
    this.stopEquipmentSessionTicker();

    if (!this.equipmentSessionStartedAt) {
      return;
    }

    const startedAt = this.equipmentSessionStartedAt;
    this.equipmentSessionStartedAt = 0;
    this.equipmentSessionElapsed = '00:00';

    const project = this.detailProject;
    if (!project || project.id !== this.equipmentSessionProjectId) {
      this.equipmentSessionProjectId = '';
      return;
    }

    this.equipmentSessionProjectId = '';

    const endedAt = Date.now();
    const elapsedMinutes = (endedAt - startedAt) / 60000;
    const extraHours = accumulateQuarterHours(elapsedMinutes);
    if (extraHours <= 0) {
      return;
    }

    const nextProject: Project = {
      ...project,
      properties: {
        ...(project.properties ?? {}),
        actualHours: this.normalizeNumber(project.properties?.['actualHours']) + extraHours,
      },
      updatedAt: new Date(),
    };

    this.detailProject = nextProject;

    this.projectService.updateProject(nextProject.id, this.prepareProjectForSave(nextProject)).subscribe({
      next: () => {
        this.boardActionMessage = `Tiempo de sesion registrado: +${extraHours} h.`;
      },
      error: (error) => {
        // Sin fallback silencioso: si el servidor no guardo las horas, el
        // tecnico debe saberlo (el valor queda solo en esta vista hasta recargar).
        this.boardActionMessage = `El tiempo de sesion (+${extraHours} h) NO se guardo en el servidor: ${this.errorMessage(error)}`;
      },
    });

    // Fase 4: el pointage tambien queda como entrada de horas en el servidor
    // (work_time_entries) por tecnico/dia, no solo en actualHours del proyecto.
    // El backend redondea a cuartos de hora y asigna el usuario desde el JWT.
    this.worktimeApi
      .createEntry({
        projectId: project.id,
        equipmentId: String(project.properties?.['equipmentIdentifier'] ?? '').trim(),
        task: 'Sesion kanban',
        entryType: 'normal',
        employee: this.authService.getCurrentUserName(),
        memo: `Pointage de sesion en tablero: +${extraHours} h (cuartos de hora).`,
        startAt: new Date(startedAt).toISOString(),
        endAt: new Date(endedAt).toISOString(),
      })
      .subscribe({
        error: (error) => {
          // Error visible: sin esta entrada el pointage no existe para RRHH.
          this.boardActionMessage = `El pointage (+${extraHours} h) NO se guardo en el registro de horas: ${this.errorMessage(error)}`;
        },
      });
  }

  saveProjectDetail(): void {
    if (!this.detailProject || this.saving) {
      return;
    }

    this.persistProjectDetail(this.detailProject, { closeOnSuccess: true });
  }

  /**
   * Etapa Cotización: guarda el caso y salta a /app/crm-cotizaciones con el
   * formulario precargado desde los campos del proyecto. La navegación va por
   * router state (no query string) porque no debe quedar en la URL ni en el
   * historial; la vista de cotizaciones lo lee una sola vez.
   */
  saveAndGoToQuote(): void {
    if (!this.detailProject || this.saving) {
      return;
    }

    // El prefill viaja por el store de memoria, no por router state:
    // getCurrentNavigation() ya devuelve null en ngOnInit para rutas lazy,
    // y set/consume es determinista sin importar la carga del chunk.
    const prefill = this.buildQuotePrefill(this.detailProject);

    this.persistProjectDetail(this.detailProject, {
      closeOnSuccess: false,
      successMessage: 'Caso guardado. Abriendo cotización precargada...',
      onSuccess: () => {
        setQuotePrefill(prefill);
        void this.router.navigate(['/app/crm-cotizaciones']);
      },
    });
  }

  /**
   * Mapeo proyecto → cotización aprobado con el equipo:
   * - prospecto, moneda, vigencia y descripción general (síntoma de la falla)
   *   sí pasan al formulario;
   * - budget (si > 0) precarga el precio unitario de la línea 1;
   * - los valores internos del diagnóstico (repuestos USD, materia prima,
   *   horas) viajan solo como `reference` para la ficha visual de referencia:
   *   NUNCA se serializan en el payload ni en el PDF (política de
   *   confidencialidad de partes).
   */
  private buildQuotePrefill(project: Project): QuotePrefillFromProject {
    const properties = project.properties ?? {};
    const num = (key: string): number | null => {
      const value = Number(properties[key]);
      return Number.isFinite(value) && value > 0 ? value : null;
    };

    let validUntil = '';
    if (!properties['noDeadline']) {
      const due = String(properties['dueDate'] ?? '').trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(due)) {
        validUntil = due.slice(0, 10);
      }
    }

    return {
      prospectoName: String(properties['client'] ?? '').trim(),
      currency: String(properties['currency'] ?? 'COP').trim() === 'USD' ? 'USD' : 'COP',
      validUntil,
      description: String(properties['equipmentFailureDescription'] ?? '').trim(),
      linePrice: num('budget'),
      equipmentItemId: String(properties['equipmentItemId'] ?? '').trim(),
      sourceTitle: String(project.title ?? '').trim(),
      reference: {
        budget: num('budget'),
        partsBudgetUsd: num('partsBudgetUsd'),
        estimatedMaterialCost: num('estimatedMaterialCost'),
        estimatedHours: num('estimatedHours'),
      },
    };
  }

  selectStatus(statusId: string): void {
    if (!this.detailProject) {
      return;
    }

    const currentStatus = this.detailProject.status;
    if (!statusId || currentStatus === statusId) {
      return;
    }

    if (this.openTransitionPrompt(this.detailProject, currentStatus, statusId, 'detail')) {
      return;
    }

    this.diagnosisCloseError = '';
    this.diagnosisCloseMessage = '';
    this.testsCloseError = '';
    this.testsCloseMessage = '';
    this.detailProject = this.normalizeProject(this.applyProjectStatusChange(this.detailProject, statusId));
    this.initializeDispatchContext();
  }

  closeDiagnosis(): void {
    if (!this.detailProject || this.detailProject.status !== 'diagnostico' || this.saving) {
      return;
    }

    this.diagnosisCloseError = '';
    this.diagnosisCloseMessage = '';

    const properties = this.detailProject.properties ?? {};
    const diagnosisInspection = this.normalizeDiagnosisInspection(properties['diagnosisInspection']);
    const diagnosticNotes = String(properties['diagnosticNotes'] ?? '').trim();
    const estimatedHours = this.normalizeNumber(properties['estimatedHours']);
    const partsBudgetUsd = this.normalizeNumber(properties['partsBudgetUsd']);
    const pendingRequirements: string[] = [];

    if (!diagnosisInspection.faultIdentified) {
      pendingRequirements.push('marcar la falla identificada');
    }

    if (!diagnosticNotes) {
      pendingRequirements.push('completar el memo diagnostico');
    }

    if (estimatedHours <= 0) {
      pendingRequirements.push('registrar horas hombre estimadas (> 0)');
    }

    if (partsBudgetUsd <= 0) {
      pendingRequirements.push('registrar presupuesto de repuestos en USD (> 0)');
    }

    if (pendingRequirements.length) {
      this.diagnosisCloseError = `No se puede cerrar diagnostico: ${pendingRequirements.join(', ')}.`;
      return;
    }

    this.saving = true;
    const closedBy = this.resolveDiagnosisClosedBy(this.detailProject);
    const projectWithDiagnosisData: Project = {
      ...this.detailProject,
      properties: {
        ...(this.detailProject.properties ?? {}),
        diagnosisInspection,
      },
    };

    // 1) Persiste los datos del diagnostico en el servidor; 2) invoca el cierre
    // transaccional POST /projects/:id/diagnosis/close, que valida en el
    // backend (falla identificada, horas estimadas, presupuesto de repuestos)
    // y mueve el caso a por-cotizar con diagnosisClosedAt/diagnosisClosedBy.
    this.projectService
      .updateProject(projectWithDiagnosisData.id, this.prepareProjectForSave(projectWithDiagnosisData))
      .pipe(switchMap(() => this.projectService.closeDiagnosis(projectWithDiagnosisData.id, closedBy)))
      .subscribe({
        next: (savedProject) => {
          this.saving = false;
          if (this.detailProject?.id === savedProject.id) {
            this.detailProject = this.normalizeProject(savedProject);
            this.initializeDispatchContext();
          }
          this.boardActionMessage = 'Diagnostico cerrado y movido a Por cotizar.';
          this.diagnosisCloseMessage = 'Diagnostico cerrado correctamente. El caso ya paso a Por cotizar.';
          this.syncEquipmentMemos(savedProject);
        },
        error: (error) => {
          this.saving = false;
          this.diagnosisCloseError = `No se pudo cerrar el diagnostico en el servidor: ${this.errorMessage(error)}`;
        },
      });
  }

  /**
   * Puerta de calidad antes de entregar (antes "Finalizar pruebas y marcar
   * listo", cuando la etapa QA era una columna propia). La etapa se elimino:
   * ahora se valida en Reparacion, exige prueba de cierre real o checklist de
   * informe completado, y mueve el caso directo a Listo para entrega.
   */
  finishTestsAndMarkReady(): void {
    if (!this.detailProject || this.detailProject.status !== 'reparacion' || this.saving) {
      return;
    }

    this.testsCloseError = '';
    this.testsCloseMessage = '';

    const validation = validateReadyForDelivery(this.detailProject);
    if (!validation.ok) {
      this.testsCloseError = `No se puede marcar listo para entrega: ${validation.missing.join(', ')}.`;
      return;
    }

    const nextProject = this.applyProjectStatusChange(this.detailProject, 'listo-entrega');
    this.persistProjectDetail(nextProject, {
      closeOnSuccess: false,
      successMessage: 'Cierre validado y caso movido a Listo para entrega.',
      onSuccess: () => {
        this.testsCloseMessage = 'Cierre validado correctamente. El caso ya paso a Listo para entrega.';
      },
    });
  }

  private autoAdvanceAfterPartsRequest(sourceLabel: string): void {
    if (!this.detailProject || this.saving) {
      return;
    }

    const nextStatusId = resolveStatusAfterPartsRequest(this.detailProject.status);
    if (!nextStatusId) {
      return;
    }

    const nextProject = this.applyProjectStatusChange(this.detailProject, nextStatusId);
    this.persistProjectDetail(nextProject, {
      closeOnSuccess: false,
      successMessage: `${sourceLabel}. El caso avanzo automaticamente a Reparacion.`,
    });
  }

  canShowDispatchPanel(): boolean {
    return Boolean(this.detailProject && ['listo-entrega', 'entregado'].includes(this.detailProject.status));
  }

  canPrintTechnicalReport(): boolean {
    if (!this.detailProject) {
      return false;
    }

    const repairStatus = this.normalizeRepairStatusValue(this.detailProject.properties?.['equipmentRepairStatus']);
    return ['listo-entrega', 'garantia'].includes(this.detailProject.status)
      || ['listo-entrega', 'garantia'].includes(repairStatus);
  }

  openTechnicalReport(): void {
    if (!this.detailProject || !this.canPrintTechnicalReport()) {
      return;
    }

    this.technicalReport = this.buildTechnicalReportView(this.detailProject);
    this.showTechnicalReport = true;
  }

  closeTechnicalReport(): void {
    this.showTechnicalReport = false;
  }

  printTechnicalReport(): void {
    window.print();
  }

  private buildTechnicalReportView(project: Project): TechnicalReportView | null {
    const properties = project.properties ?? {};
    const diagnosticNotes = String(properties['diagnosticNotes'] ?? '').trim();
    const repairNotes = String(properties['repairNotes'] ?? '').trim();
    const failureDescription = String(properties['equipmentFailureDescription'] ?? '').trim();
    const testType = String(properties['testType'] ?? 'sin-pruebas').trim() || 'sin-pruebas';

    if (!diagnosticNotes && !repairNotes && !failureDescription && testType === 'sin-pruebas') {
      return null;
    }

    return {
      projectCode: String(properties['shortCode'] ?? '').trim() || project.id,
      projectTitle: project.title || 'Sin titulo',
      clientName: this.getDispatchClientName() || 'Sin cliente',
      equipmentName: this.getDispatchEquipmentName() || 'Sin equipo vinculado',
      statusLabel: String(properties['equipmentRepairStatusLabel'] ?? '').trim() || this.resolveBoardStatusLabel(project.status),
      generatedAt: new Date().toISOString(),
      receivedAt: this.toDateInputValue(properties['startDate']) || this.toDateInputValue(project.createdAt),
      lastWorkflowUpdateAt: this.toDateInputValue(properties['equipmentLastWorkflowUpdate']),
      failureDescription,
      diagnosticNotes,
      repairNotes,
      testTypeLabel: getProjectTechnicalTestTypeLabel(testType),
      repairabilityPercent: this.normalizeNumber(properties['repairabilityPercent']),
      estimatedHours: this.normalizeNumber(properties['estimatedHours']),
      actualHours: this.normalizeNumber(properties['actualHours']),
    };
  }

  canOpenEquipmentHistory(): boolean {
    if (!this.detailProject) {
      return false;
    }

    const reference = this.selectedEquipmentReference || this.buildEquipmentReferenceFromProject(this.detailProject.properties);
    const identifier = String(this.detailProject.properties['equipmentIdentifier'] ?? '').trim();
    return Boolean(reference || identifier);
  }

  openEquipmentHistory(): void {
    if (!this.detailProject) {
      return;
    }

    const reference = this.selectedEquipmentReference || this.buildEquipmentReferenceFromProject(this.detailProject.properties);
    const identifier = String(this.detailProject.properties['equipmentIdentifier'] ?? '').trim();
    if (!reference && !identifier) {
      return;
    }

    this.equipmentHistoryContextService.setContext({
      reference,
      identifier,
      projectId: this.detailProject.id,
      origin: 'kanban',
    });

    void this.router.navigate(['/app/work-equipment-history']);
  }

  canQuickDispatch(): boolean {
    return Boolean(this.detailProject && this.detailProject.status === 'listo-entrega');
  }

  getDispatchPaymentCondition(): ProjectPaymentCondition {
    return this.normalizePaymentCondition(this.detailProject?.properties?.['paymentCondition']);
  }

  getDispatchPaymentStatus(): ProjectPaymentStatus {
    return this.normalizePaymentStatus(this.detailProject?.properties?.['paymentStatus']);
  }

  getDispatchPaymentStatusLabel(): string {
    return this.resolvePaymentStatusLabel(this.getDispatchPaymentStatus());
  }

  isDispatchBlockedByPayment(): boolean {
    return this.getDispatchPaymentCondition() === 'contra-entrega' && this.getDispatchPaymentStatus() !== 'confirmado';
  }

  onDispatchPaymentStatusChange(nextStatusRaw: string): void {
    if (!this.detailProject) {
      return;
    }

    const status = this.normalizePaymentStatus(nextStatusRaw);
    this.detailProject.properties['paymentStatus'] = status;

    if (status === 'confirmado') {
      this.detailProject.properties['paymentConfirmedAt'] = new Date().toISOString();
      return;
    }

    this.detailProject.properties['paymentConfirmedAt'] = '';
  }

  getDispatchActionTitle(): string {
    if (!this.canQuickDispatch()) {
      return 'Disponible cuando el caso este en listo-entrega.';
    }

    if (this.isDispatchBlockedByPayment()) {
      return 'Bloqueado: contra-entrega requiere pago confirmado.';
    }

    if (this.dispatchDraft.deliveryMethod === 'transportadora') {
      if (!this.dispatchDraft.carrier.trim() || !this.dispatchDraft.guideNumber.trim()) {
        return 'Completa transportadora y numero de guia.';
      }
      return 'Registrar despacho por transportadora y cerrar caso.';
    }

    if (!this.dispatchDraft.pickedUpBy.trim()) {
      return 'Indica quien recibe para completar el despacho.';
    }

    return 'Registrar despacho y cerrar caso.';
  }

  canCompleteDispatch(): boolean {
    if (!this.canQuickDispatch()) {
      return false;
    }

    if (this.isDispatchBlockedByPayment()) {
      return false;
    }

    if (this.requiresDispatchAccessoriesConfirmation() && !this.dispatchAccessoriesConfirmed) {
      return false;
    }

    if (this.dispatchDraft.deliveryMethod === 'transportadora') {
      return Boolean(this.dispatchDraft.carrier.trim() && this.dispatchDraft.guideNumber.trim());
    }

    return Boolean(this.dispatchDraft.pickedUpBy.trim());
  }

  onDispatchMethodChange(): void {
    this.dispatchError = '';
    this.dispatchMessage = '';

    if (this.dispatchDraft.deliveryMethod === 'transportadora') {
      this.dispatchDraft.pickedUpBy = '';
      this.dispatchDraft.notifyClient = true;
      this.dispatchDraft.carrier = this.dispatchDraft.carrier.trim() || 'Servia Entrega';
      return;
    }

    this.dispatchDraft.carrier = '';
    this.dispatchDraft.guideNumber = '';
    this.dispatchDraft.notifyClient = false;
  }

  getDispatchCodePreview(): string {
    return this.buildNextDispatchCode();
  }

  getDispatchClientName(): string {
    if (!this.detailProject) {
      return '';
    }

    return String(
      this.detailProject.properties['equipmentProspectName']
      ?? this.detailProject.properties['client']
      ?? ''
    ).trim();
  }

  getDispatchEquipmentName(): string {
    if (!this.detailProject) {
      return '';
    }

    return String(
      this.detailProject.properties['equipmentDisplayName']
      ?? this.detailProject.properties['equipmentIdentifier']
      ?? this.detailProject.title
    ).trim();
  }

  requiresDispatchAccessoriesConfirmation(): boolean {
    return requiresAccessoriesConfirmation(this.linkedEquipment);
  }

  getDispatchAccessoriesLabel(): string {
    return this.linkedEquipment?.accessories?.trim() || 'sin accesorios';
  }

  getDispatchBorrowedEquipmentLabel(): string {
    const borrowedEquipments = this.linkedEquipment?.borrowedEquipments ?? [];
    return borrowedEquipments.length ? borrowedEquipments.join(', ') : 'sin equipos prestados';
  }

  getLatestDispatchRecord(): ProjectDispatchRecord | null {
    return this.getDispatchHistory()[0] ?? null;
  }

  describeDispatchRecord(record: ProjectDispatchRecord): string {
    const paymentLabel = this.resolvePaymentStatusLabel(record.paymentStatus).toLowerCase();

    if (record.deliveryMethod === 'transportadora') {
      return `${record.carrier || 'Transportadora'} · guia ${record.guideNumber || 'sin guia'} · pago ${paymentLabel}`;
    }

    return `recogido por ${record.pickedUpBy || 'cliente'} · pago ${paymentLabel}`;
  }

  completeDispatch(): void {
    if (!this.detailProject || !this.canQuickDispatch() || this.saving || this.dispatching) {
      return;
    }

    this.dispatchMessage = '';
    this.dispatchError = '';

    if (this.isDispatchBlockedByPayment()) {
      this.dispatchError = 'No se puede completar despacho: la condicion es contra-entrega y el pago no esta confirmado.';
      return;
    }

    if (this.requiresDispatchAccessoriesConfirmation() && !this.dispatchAccessoriesConfirmed) {
      this.dispatchError = 'Confirma la entrega de los accesorios y equipos anclados/prestados para registrar el despacho.';
      return;
    }

    const projectValue = this.getProjectDispatchValue();
    if (this.dispatchDraft.includePrice && projectValue === null) {
      this.dispatchError = 'Para incluir valor en la orden primero registra un presupuesto o valor del proyecto.';
      return;
    }

    if (this.dispatchDraft.deliveryMethod === 'transportadora') {
      if (!this.dispatchDraft.carrier.trim() || !this.dispatchDraft.guideNumber.trim()) {
        this.dispatchError = 'Completa la transportadora y el numero de guia para registrar el despacho.';
        return;
      }
    } else if (!this.dispatchDraft.pickedUpBy.trim()) {
      this.dispatchError = 'Indica quien recogio el equipo para cerrar la entrega.';
      return;
    }

    const dispatchCode = this.buildNextDispatchCode();
    const dispatchRecord = this.buildDispatchRecord(dispatchCode, projectValue);
    const generatedAttachments = this.buildDispatchAttachments(dispatchRecord, this.detailProject);
    const nextProject = this.applyProjectStatusChange(this.detailProject, 'entregado');
    const history = this.getDispatchHistory(this.detailProject).filter((record) => record.id !== dispatchRecord.id);

    nextProject.attachments = [...(nextProject.attachments ?? []), ...generatedAttachments];
    nextProject.properties = {
      ...(nextProject.properties ?? {}),
      notifyClient: this.dispatchDraft.notifyClient,
      dispatchHistory: [dispatchRecord, ...history].slice(0, 20),
      lastDispatchCode: dispatchRecord.code,
      lastDispatchAt: dispatchRecord.createdAt,
      lastDispatchMethod: dispatchRecord.deliveryMethod,
      lastDispatchCarrier: dispatchRecord.carrier,
      lastDispatchGuideNumber: dispatchRecord.guideNumber,
      lastDispatchPickedUpBy: dispatchRecord.pickedUpBy,
      lastDispatchNotes: dispatchRecord.notes,
      lastDispatchPaymentCondition: dispatchRecord.paymentCondition,
      lastDispatchPaymentStatus: dispatchRecord.paymentStatus,
      lastDispatchPaymentReference: dispatchRecord.paymentReference,
      lastDispatchPaymentConfirmedAt: dispatchRecord.paymentConfirmedAt,
      dispatchAttachmentsGeneratedAt: dispatchRecord.createdAt,
    };

    this.dispatching = true;
    const equipmentReference = this.selectedEquipmentReference;
    const equipmentLocationId = this.equipmentLocationIdDraft.trim() || String(nextProject.properties['equipmentLocationId'] ?? '').trim();
    const deliveredBy = dispatchRecord.deliveredBy;

    this.persistProjectDetail(nextProject, {
      closeOnSuccess: true,
      successMessage: `Despacho ${dispatchRecord.code} registrado y caso cerrado en entregado.`,
      onSuccess: () => {
        // El informe de intervencion y el aviso al cliente dejan de ser
        // locales: se persisten en el servidor (technical-reports y
        // notifications) como parte del cierre del despacho.
        this.persistInterventionReport(dispatchRecord, nextProject);
        this.notifyClientDispatch(dispatchRecord);

        if (equipmentReference && equipmentLocationId) {
          this.projectEquipmentService.updateEquipmentWorkflow(equipmentReference, 'entregado', equipmentLocationId, deliveredBy);
        }
      },
      onFinally: () => {
        this.dispatching = false;
      },
    });
  }

  toggleNoDeadline(value: boolean): void {
    if (!this.detailProject) {
      return;
    }

    this.detailProject.properties['noDeadline'] = value;
    if (value) {
      this.detailProject.properties['dueDate'] = null;
    }
  }

  toggleOtherDetails(): void {
    this.showOtherDetails = !this.showOtherDetails;
  }

  getProjectMembers(): string[] {
    return this.getMembersFromValue(this.detailProject?.properties?.['members']);
  }

  addMember(): void {
    if (!this.detailProject) {
      return;
    }

    const memberName = this.newMemberName.trim();
    if (!memberName) {
      return;
    }

    const members = this.getProjectMembers();
    if (!members.includes(memberName)) {
      this.detailProject.properties['members'] = [...members, memberName];
    }

    this.newMemberName = '';
  }

  removeMember(memberToRemove: string): void {
    if (!this.detailProject) {
      return;
    }

    this.detailProject.properties['members'] = this.getProjectMembers().filter((member) => member !== memberToRemove);
  }

  handleAttachmentSelection(event: Event): void {
    if (!this.detailProject) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) {
      return;
    }

    const attachments = [...(this.detailProject.attachments ?? [])];

    files.forEach((file, index) => {
      attachments.push({
        id: `attachment-${Date.now()}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploadedAt: new Date(),
        uploadedBy: 'current-user',
      });
    });

    this.detailProject.attachments = attachments;
    input.value = '';
  }

  removeAttachment(attachmentId: string): void {
    if (!this.detailProject) {
      return;
    }

    this.detailProject.attachments = (this.detailProject.attachments ?? []).filter(
      (attachment) => attachment.id !== attachmentId,
    );
  }

  getActiveMaterialReservationsCount(): number {
    return this.materialReservations.filter((item) => item.status === 'activa').length;
  }

  getProjectMaterialWorkOrder(): string {
    if (!this.detailProject) {
      return '';
    }

    return String(this.detailProject.properties['shortCode'] ?? '').trim() || this.detailProject.id;
  }

  getProjectMaterialEquipmentTag(): string {
    if (!this.detailProject) {
      return '';
    }

    return String(
      this.detailProject.properties['equipmentIdentifier']
      ?? this.detailProject.properties['equipmentDisplayName']
      ?? this.detailProject.title,
    ).trim();
  }

  getProjectMaterialCustomerSite(): string {
    if (!this.detailProject) {
      return '';
    }

    return String(
      this.detailProject.properties['equipmentProspectName']
      ?? this.detailProject.properties['client']
      ?? '',
    ).trim();
  }

  onMaterialReferenceChange(reference: string): void {
    this.materialRequestDraft.reference = reference;
    this.materialRequestMessage = '';
    this.materialRequestError = '';
    this.syncSelectedMaterialReference();
  }

  get filteredInventoryReferences(): StockReference[] {
    const query = this.materialSearchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return this.inventoryReferences.filter((ref) => {
      const refMatch = ref.reference.toLowerCase().includes(query);
      const descMatch = ref.designation.toLowerCase().includes(query);
      return refMatch || descMatch;
    }).slice(0, 10);
  }

  onMaterialSearchChange(query: string): void {
    this.materialSearchQuery = query;
    this.materialRequestMessage = '';
    this.materialRequestError = '';

    const trimmed = query.trim();
    if (!trimmed) {
      this.materialRequestDraft.reference = '';
      this.selectedMaterialReference = null;
      this.showMaterialNotFoundCard = false;
      return;
    }

    const exactMatch = this.inventoryReferences.find((ref) => ref.reference.toLowerCase() === trimmed.toLowerCase());
    if (exactMatch) {
      this.materialRequestDraft.reference = exactMatch.reference;
      this.selectedMaterialReference = exactMatch;
      this.showMaterialNotFoundCard = false;
    } else {
      this.selectedMaterialReference = null;
      this.showMaterialNotFoundCard = this.filteredInventoryReferences.length === 0;
    }
  }

  selectMaterialReference(reference: string): void {
    const ref = this.inventoryReferences.find((item) => item.reference === reference);
    if (ref) {
      this.materialSearchQuery = `${ref.reference} - ${ref.designation}`;
      this.materialRequestDraft.reference = ref.reference;
      this.selectedMaterialReference = ref;
      this.showMaterialNotFoundCard = false;
    }
  }

  confirmCreatePurchaseLine(): void {
    if (!this.detailProject) {
      return;
    }

    const reference = this.purchaseLineDraft.reference.trim() || this.materialSearchQuery.trim();
    if (!reference) {
      return;
    }

    this.purchaseLineMessage = '';
    this.purchaseLineError = '';

    const result = this.inventoryWorkflowService.createPurchaseLine({
      reference,
      component: this.purchaseLineDraft.component,
      type: this.purchaseLineDraft.type,
      brand: this.purchaseLineDraft.brand,
      description: this.purchaseLineDraft.description,
      supplier: this.purchaseLineDraft.supplier,
      quantity: Math.max(1, Math.floor(this.purchaseLineDraft.quantity || 1)),
      unitPrice: Number(this.purchaseLineDraft.unitPrice) || 0,
      neededBy: this.purchaseLineDraft.neededBy,
      requestReason: this.materialRequestDraft.purpose || `Repuesto para proyecto ${this.detailProject.title}`,
      projectId: this.detailProject.id,
      equipmentTag: this.materialRequestDraft.equipmentTag || this.detailProject.properties['equipmentIdentifier'] || '',
    });

    if (!result.ok) {
      this.purchaseLineError = result.message;
      return;
    }

    this.purchaseLineMessage = result.message;
    this.loadProjectPurchaseLines();
    this.dismissMaterialNotFound();
    this.materialSearchQuery = '';
    this.materialRequestDraft.reference = '';
    this.selectedMaterialReference = null;
    this.purchaseLineDraft = { reference: '', component: '', type: '', brand: '', description: '', supplier: '', quantity: 1, unitPrice: 0, neededBy: '1' };
    this.autoAdvanceAfterPartsRequest('Linea de compra creada');
  }

  dismissMaterialNotFound(): void {
    this.showMaterialNotFoundCard = false;
    this.materialSearchQuery = '';
  }

  createManualPurchaseLine(): void {
    if (!this.detailProject) {
      return;
    }

    const reference = this.purchaseLineDraft.reference.trim();
    if (!reference) {
      return;
    }

    this.purchaseLineMessage = '';
    this.purchaseLineError = '';

    const result = this.inventoryWorkflowService.createPurchaseLine({
      reference,
      component: this.purchaseLineDraft.component,
      type: this.purchaseLineDraft.type,
      brand: this.purchaseLineDraft.brand,
      description: this.purchaseLineDraft.description,
      supplier: this.purchaseLineDraft.supplier,
      quantity: Math.max(1, Math.floor(this.purchaseLineDraft.quantity || 1)),
      unitPrice: Number(this.purchaseLineDraft.unitPrice) || 0,
      neededBy: this.purchaseLineDraft.neededBy,
      requestReason: `Linea manual creada desde proyecto: ${this.detailProject.title}`,
      projectId: this.detailProject.id,
      equipmentTag: this.detailProject.properties['equipmentIdentifier'] || '',
    });

    if (!result.ok) {
      this.purchaseLineError = result.message;
      return;
    }

    this.purchaseLineMessage = result.message;
    this.loadProjectPurchaseLines();
    this.showManualPurchaseLineForm = false;
    this.purchaseLineDraft = { reference: '', component: '', type: '', brand: '', description: '', supplier: '', quantity: 1, unitPrice: 0, neededBy: '1' };
    this.autoAdvanceAfterPartsRequest('Linea de compra manual creada');
  }

  loadProjectPurchaseLines(): void {
    this.inventoryApiService.listPurchaseLines().subscribe({
      next: (lines) => {
        this.projectPurchaseLines = lines.filter((line) => {
          return line.source === 'manual' ||
            line.requestReason?.includes(this.detailProject?.title || '') ||
            line.requestReason?.includes(`proyecto ${this.detailProject?.id || ''}`);
        }).sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        this.syncWarrantyBoardStatus();
      },
      error: () => { this.projectPurchaseLines = []; },
    });
  }

  private hasPendingPurchaseParts(project: Project | null = this.detailProject): boolean {
    if (!project || !this.detailProject || project.id !== this.detailProject.id) {
      return false;
    }

    return this.projectPurchaseLines.some((line) => line.status === 'pendiente');
  }

  private syncWarrantyBoardStatus(): void {
    if (!this.detailProject) {
      return;
    }

    const properties = this.detailProject.properties ?? {};
    const currentStatus = this.normalizeRepairStatusValue(properties['equipmentRepairStatus']);
    const nextStatus = resolveWarrantyBoardStatus(currentStatus, this.hasPendingPurchaseParts());

    if (nextStatus === currentStatus) {
      return;
    }

    properties['equipmentRepairStatus'] = nextStatus;
    properties['equipmentRepairStatusLabel'] = this.resolveRepairStatusLabel(nextStatus as ProspectEquipmentRepairStatus);
    this.equipmentRepairStatusDraft = nextStatus as ProspectEquipmentRepairStatus;
  }

  sendPurchaseLine(lineId: string): void {
    this.purchaseLineMessage = '';
    this.purchaseLineError = '';

    const result = this.inventoryWorkflowService.markPurchaseLineSent(lineId);
    if (!result.ok) {
      this.purchaseLineError = result.message;
      return;
    }

    this.purchaseLineMessage = result.message;
    this.loadProjectPurchaseLines();
  }

  closePurchaseLine(lineId: string): void {
    this.purchaseLineMessage = '';
    this.purchaseLineError = '';

    const result = this.inventoryWorkflowService.closePurchaseLine(lineId);
    if (!result.ok) {
      this.purchaseLineError = result.message;
      return;
    }

    this.purchaseLineMessage = result.message;
    this.loadProjectPurchaseLines();
  }

  createMaterialReservation(): void {
    if (!this.detailProject) {
      return;
    }

    this.materialRequestMessage = '';
    this.materialRequestError = '';
    this.syncMaterialDraftContext();

    const beforeReservationIds = new Set(this.inventoryWorkflowService.getSnapshot().reservations.map((item) => item.id));
    const payload = {
      reference: this.materialRequestDraft.reference,
      quantity: Math.max(1, Math.floor(this.materialRequestDraft.quantity || 0)),
      assignedTo: this.materialRequestDraft.assignedTo,
      purpose: this.materialRequestDraft.purpose,
      workOrder: this.materialRequestDraft.workOrder,
      equipmentTag: this.materialRequestDraft.equipmentTag,
      customerSite: this.materialRequestDraft.customerSite,
      priority: this.materialRequestDraft.priority,
      commitmentDate: this.materialRequestDraft.commitmentDate,
    };

    const result = this.inventoryWorkflowService.createReservation(payload);
    if (!result.ok) {
      this.materialRequestError = result.message;
      return;
    }

    const snapshot = this.inventoryWorkflowService.getSnapshot();
    const createdReservation = snapshot.reservations.find((item) => {
      return !beforeReservationIds.has(item.id)
        && item.reference === payload.reference
        && item.workOrder === payload.workOrder
        && item.assignedTo === payload.assignedTo;
    });

    if (createdReservation) {
      const reservationIds = new Set(this.getStringArrayValue(this.detailProject.properties['materialReservationIds']));
      reservationIds.add(createdReservation.id);
      this.detailProject.properties['materialReservationIds'] = Array.from(reservationIds);
      this.detailProject.properties['lastMaterialReservationAt'] = createdReservation.reservedAt;
    }

    this.syncMaterialReservations(snapshot.reservations);
    this.materialRequestMessage = result.message;
    this.resetMaterialRequestDraft();
    this.autoAdvanceAfterPartsRequest('Reserva de material creada');
  }

  releaseMaterialReservation(reservationId: string): void {
    this.materialRequestMessage = '';
    this.materialRequestError = '';

    const result = this.inventoryWorkflowService.releaseReservation(reservationId);
    if (!result.ok) {
      this.materialRequestError = result.message;
      return;
    }

    this.syncMaterialReservations(this.inventoryWorkflowService.getSnapshot().reservations);
    this.materialRequestMessage = result.message;
  }

  consumeMaterialReservation(reservationId: string): void {
    this.materialRequestMessage = '';
    this.materialRequestError = '';

    const result = this.inventoryWorkflowService.consumeReservation(reservationId);
    if (!result.ok) {
      this.materialRequestError = result.message;
      return;
    }

    this.syncMaterialReservations(this.inventoryWorkflowService.getSnapshot().reservations);
    this.materialRequestMessage = result.message;
  }

  submitPurchaseRequest(): void {
    this.purchaseRequestMessage = '';
    this.purchaseRequestError = '';

    const ref = this.purchaseRequestDraft.reference.trim();
    const desc = this.purchaseRequestDraft.description.trim();
    const qty = Math.max(1, Math.floor(this.purchaseRequestDraft.quantity || 0));

    if (!ref || !desc || qty <= 0) {
      this.purchaseRequestError = 'Completa referencia, descripcion y cantidad valida.';
      return;
    }

    const projectId = this.detailProject?.id || '';
    const equipmentTag = this.detailProject?.properties?.['equipmentIdentifier'] || '';

    this.inventoryApiService.createPurchaseRequest({
      reference: ref,
      description: desc,
      quantity: qty,
      supplier: this.purchaseRequestDraft.supplier.trim(),
      estimatedCost: Number(this.purchaseRequestDraft.estimatedCost) || 0,
      leadTimeDays: Math.max(0, Math.floor(this.purchaseRequestDraft.leadTimeDays || 0)),
      urgency: this.purchaseRequestDraft.urgency,
      memo: this.purchaseRequestDraft.memo.trim(),
      projectId,
      equipmentTag,
    }).subscribe({
      next: (response) => {
        this.purchaseRequestMessage = response?.result?.message || 'Solicitud de compra enviada.';
        this.purchaseRequestDraft = { reference: '', description: '', quantity: 1, supplier: '', estimatedCost: 0, leadTimeDays: 1, urgency: 'normal', memo: '' };
        this.loadPurchaseRequests();
        this.autoAdvanceAfterPartsRequest('Solicitud de compra enviada');
      },
      error: (err) => {
        this.purchaseRequestError = err?.message || 'Error al enviar la solicitud.';
      },
    });
  }

  loadPurchaseRequests(): void {
    const projectId = this.detailProject?.id || '';
    this.inventoryApiService.listPurchaseRequests(projectId).subscribe({
      next: (items) => { this.purchaseRequests = items || []; },
      error: () => { this.purchaseRequests = []; },
    });
  }

  resetMaterialRequestDraft(): void {
    const nextReference = this.materialRequestDraft.reference.trim();
    this.materialRequestDraft = this.buildMaterialRequestDraft(this.detailProject, nextReference);
    this.syncSelectedMaterialReference();
  }

  getInventoryReferenceDesignation(referenceCode: string): string {
    return this.inventoryReferences.find((item) => item.reference === referenceCode)?.designation ?? '--';
  }

  getInventoryReferenceStock(referenceCode: string): number {
    return this.inventoryReferences.find((item) => item.reference === referenceCode)?.currentStock ?? 0;
  }

  materialReservationStatusClass(status: ReservationRecord['status']): string {
    if (status === 'activa') {
      return 'text-bg-success';
    }

    if (status === 'vencida') {
      return 'text-bg-warning';
    }

    return 'text-bg-secondary';
  }

  formatFileSize(size: number): string {
    if (!Number.isFinite(size) || size <= 0) {
      return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    const formatted = unitIndex === 0 ? value.toFixed(0) : value.toFixed(1);
    return `${formatted} ${units[unitIndex]}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this.normalizeNumber(value));
  }

  toDateInputValue(value: unknown): string {
    const normalizedDate = this.normalizeDate(value);
    if (!normalizedDate) {
      return '';
    }

    const year = normalizedDate.getFullYear();
    const month = `${normalizedDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${normalizedDate.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  fromDateInputValue(value: string): Date | null {
    return value ? new Date(`${value}T00:00:00`) : null;
  }

  normalizeNumber(value: unknown): number {
    const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private initializeEquipmentContext(): void {
    this.refreshEquipmentOptions();
    this.equipmentWorkflowMessage = '';
    this.equipmentWorkflowError = '';
    this.equipmentQrError = '';

    if (!this.detailProject) {
      this.selectedEquipmentReference = '';
      this.linkedEquipment = null;
      this.clearLinkedEquipmentEvidenceContext();
      this.equipmentIdentifierDraft = '';
      this.equipmentLocationIdDraft = '';
      this.equipmentRepairStatusDraft = 'recibido';
      this.equipmentQrDataUrl = '';
      return;
    }

    const properties = this.detailProject.properties;
    const status = this.normalizeRepairStatusValue(properties['equipmentRepairStatus']);

    this.equipmentRepairStatusDraft = status;
    this.equipmentLocationIdDraft = String(properties['equipmentLocationId'] ?? '').trim();
    this.equipmentIdentifierDraft = String(properties['equipmentIdentifier'] ?? '').trim();

    const reference = this.buildEquipmentReferenceFromProject(properties);
    this.selectedEquipmentReference = reference;

    if (!reference) {
      this.linkedEquipment = null;
      this.clearLinkedEquipmentEvidenceContext();
      properties['equipmentRepairStatusLabel'] = String(properties['equipmentRepairStatusLabel'] ?? this.resolveRepairStatusLabel(status));
      this.refreshEquipmentQrPreview();
      return;
    }

    const linked = this.projectEquipmentService.getEquipmentByReference(reference);
    if (!linked) {
      this.linkedEquipment = null;
      this.clearLinkedEquipmentEvidenceContext();
      this.equipmentWorkflowError = 'El equipo vinculado anteriormente ya no existe en recepcion.';
      this.refreshEquipmentQrPreview();
      return;
    }

    this.applyLinkedEquipment(linked, 'catalog', false);
  }

  private initializeMaterialsContext(): void {
    this.materialRequestMessage = '';
    this.materialRequestError = '';
    this.syncMaterialDraftContext(true);
    this.syncMaterialReservations();
  }

  private initializeDispatchContext(): void {
    this.dispatchMessage = '';
    this.dispatchError = '';
    this.dispatchAccessoriesConfirmed = false;
    this.dispatchDraft = this.buildDispatchDraft(this.detailProject);
  }

  private refreshEquipmentOptions(): void {
    this.equipmentOptions = this.projectEquipmentService.getEquipmentOptions();
    this.equipmentLocationOptions = this.projectEquipmentService.getLocations();
  }

  private applyLinkedEquipment(
    equipment: ProjectEquipmentOption,
    source: 'catalog' | 'manual' | 'camera-scan',
    notify = true,
  ): void {
    if (!this.detailProject) {
      return;
    }

    const properties = this.detailProject.properties;
    const now = new Date().toISOString();

    this.selectedEquipmentReference = equipment.reference;
    this.linkedEquipment = equipment;
    this.equipmentIdentifierDraft = equipment.receivedIdentifier || this.equipmentIdentifierDraft;
    this.equipmentLocationIdDraft = equipment.storageLocationId;
    this.equipmentRepairStatusDraft = equipment.repairStatus;

    properties['equipmentRecordId'] = equipment.recordId;
    properties['equipmentItemId'] = equipment.itemId;
    properties['equipmentProspectId'] = equipment.prospectId;
    properties['equipmentProspectName'] = equipment.prospectName;
    properties['equipmentDisplayName'] = equipment.displayName;
    properties['equipmentIdentifier'] = equipment.receivedIdentifier;
    properties['equipmentSerie'] = equipment.serie;
    properties['equipmentReceptionLabel'] = equipment.receptionLabel;
    properties['equipmentServiceType'] = equipment.serviceTypeName;
    properties['equipmentFailureDescription'] = equipment.failureDescription;
    properties['equipmentLocationId'] = equipment.storageLocationId;
    properties['equipmentLocationName'] = equipment.storageLocationName;
    properties['equipmentRepairStatus'] = equipment.repairStatus;
    properties['equipmentRepairStatusLabel'] = equipment.repairStatusLabel || this.resolveRepairStatusLabel(equipment.repairStatus);
    properties['equipmentLastWorkflowUpdate'] = equipment.repairStatusUpdatedAt || String(properties['equipmentLastWorkflowUpdate'] ?? '');
    properties['equipmentLinkedAt'] = String(properties['equipmentLinkedAt'] ?? now);
    properties['equipmentLastScanSource'] = source;

    this.loadLinkedEquipmentEvidence(equipment.recordId, equipment.itemId);

    if (source === 'camera-scan') {
      properties['equipmentLastScanAt'] = now;
    }

    if (notify) {
      const sourceLabel = source === 'camera-scan' ? 'escaneo QR' : source === 'manual' ? 'identificador manual' : 'seleccion';
      this.equipmentWorkflowMessage = `Equipo vinculado por ${sourceLabel}: ${equipment.displayName}.`;
    }

    this.syncMaterialDraftContext();
    this.refreshEquipmentQrPreview();
  }

  private clearLinkedEquipmentFromProject(): void {
    if (!this.detailProject) {
      return;
    }

    const properties = this.detailProject.properties;
    properties['equipmentRecordId'] = '';
    properties['equipmentItemId'] = '';
    properties['equipmentProspectId'] = 0;
    properties['equipmentProspectName'] = '';
    properties['equipmentDisplayName'] = '';
    properties['equipmentIdentifier'] = '';
    properties['equipmentSerie'] = '';
    properties['equipmentReceptionLabel'] = '';
    properties['equipmentServiceType'] = '';
    properties['equipmentFailureDescription'] = '';
    properties['equipmentLocationId'] = '';
    properties['equipmentLocationName'] = '';
    properties['equipmentRepairStatus'] = 'recibido';
    properties['equipmentRepairStatusLabel'] = this.resolveRepairStatusLabel('recibido');

    this.equipmentIdentifierDraft = '';
    this.equipmentLocationIdDraft = '';
    this.equipmentRepairStatusDraft = 'recibido';
    this.clearLinkedEquipmentEvidenceContext();
    this.syncMaterialDraftContext();
    this.refreshEquipmentQrPreview();
  }

  private loadLinkedEquipmentEvidence(recordId: string, itemId: string): void {
    const normalizedRecordId = String(recordId ?? '').trim();
    const normalizedItemId = String(itemId ?? '').trim();

    if (!normalizedRecordId || !normalizedItemId) {
      this.clearLinkedEquipmentEvidenceContext();
      return;
    }

    const token = Date.now();
    this.linkedEquipmentEvidenceRequestToken = token;
    this.linkedEquipmentEvidenceLoading = true;
    this.linkedEquipmentEvidenceError = '';

    this.crmEquipmentApi
      .getRecord(normalizedRecordId, true)
      .pipe(take(1))
      .subscribe({
        next: (record) => {
          if (this.linkedEquipmentEvidenceRequestToken !== token) {
            return;
          }

          const selectedItem = (record.items ?? []).find((item) => String(item.id ?? '').trim() === normalizedItemId);
          if (!selectedItem) {
            this.linkedEquipmentEvidenceLoading = false;
            this.linkedEquipmentEvidencePhotos = [];
            this.linkedEquipmentAttachments = [];
            this.linkedEquipmentEvidenceError = 'No encontramos las evidencias del equipo vinculado en la recepción.';
            this.cdr.detectChanges();
            return;
          }

          this.linkedEquipmentEvidenceLoading = false;
          this.linkedEquipmentEvidencePhotos = Array.isArray(selectedItem.evidencePhotos)
            ? selectedItem.evidencePhotos.map((photo) => ({ ...photo }))
            : [];
          this.linkedEquipmentAttachments = Array.isArray(selectedItem.attachments)
            ? selectedItem.attachments.map((attachment) => ({ ...attachment }))
            : [];
          this.linkedEquipmentEvidenceError = '';
          this.preloadMemosFromEquipmentItem(selectedItem);
          this.cdr.detectChanges();
        },
        error: () => {
          if (this.linkedEquipmentEvidenceRequestToken !== token) {
            return;
          }

          this.linkedEquipmentEvidenceLoading = false;
          this.linkedEquipmentEvidencePhotos = [];
          this.linkedEquipmentAttachments = [];
          this.linkedEquipmentEvidenceError = 'No se pudieron cargar las fotos del equipo desde recepción.';
          this.cdr.detectChanges();
        },
      });
  }

  private clearLinkedEquipmentEvidenceContext(): void {
    this.linkedEquipmentEvidenceRequestToken = 0;
    this.linkedEquipmentEvidenceLoading = false;
    this.linkedEquipmentEvidenceError = '';
    this.linkedEquipmentEvidencePhotos = [];
    this.linkedEquipmentAttachments = [];
  }

  private buildEquipmentReferenceFromProject(properties: Record<string, any>): string {
    const recordId = String(properties['equipmentRecordId'] ?? '').trim();
    const itemId = String(properties['equipmentItemId'] ?? '').trim();

    if (!recordId || !itemId) {
      return '';
    }

    return `${recordId}::${itemId}`;
  }

  private resolveRepairStatusLabel(status: ProspectEquipmentRepairStatus): string {
    return this.repairStatusOptions.find((option) => option.id === status)?.label ?? 'Recibido';
  }

  private normalizeRepairStatusValue(value: unknown): ProspectEquipmentRepairStatus {
    const normalized = String(value ?? '').trim().toLowerCase();

    switch (normalized) {
      case 'diagnostico':
        return 'diagnostico';
      case 'por-cotizar':
        return 'por-cotizar';
      case 'pedir-repuestos':
        return 'pedir-repuestos';
      case 'esperando-proveedor':
        return 'esperando-proveedor';
      case 'reparacion':
        return 'reparacion';
      case 'pruebas':
        // Estado legado del flujo QA eliminado: se normaliza al estado vivo
        // mas cercano para no perder la tarjeta en el tablero.
        return 'reparacion';
      case 'garantia':
        return 'garantia';
      case 'garantia-espera-repuestos':
        return 'garantia-espera-repuestos';
      case 'prestamo':
        return 'prestamo';
      case 'listo-entrega':
        return 'listo-entrega';
      case 'entregado':
        return 'entregado';
      default:
        return 'recibido';
    }
  }

  private normalizePaymentCondition(value: unknown): ProjectPaymentCondition {
    const normalized = String(value ?? '').trim().toLowerCase();
    return normalized === 'credito' ? 'credito' : 'contra-entrega';
  }

  private normalizePaymentStatus(value: unknown): ProjectPaymentStatus {
    const normalized = String(value ?? '').trim().toLowerCase();

    switch (normalized) {
      case 'confirmado':
      case 'pagado':
        return 'confirmado';
      case 'parcial':
      case 'pago parcial':
        return 'parcial';
      default:
        return 'pendiente';
    }
  }

  private resolvePaymentStatusLabel(status: ProjectPaymentStatus): string {
    switch (status) {
      case 'confirmado':
        return 'Pago confirmado';
      case 'parcial':
        return 'Pago parcial';
      default:
        return 'Pendiente';
    }
  }

  getTransitionTestRuns(): WorkTestBatchRun[] {
    const runs = this.detailProject?.properties?.['transitionTestRuns'];
    if (!Array.isArray(runs)) {
      return [];
    }

    return runs.filter((run): run is WorkTestBatchRun => typeof run === 'object' && run !== null).slice(0, 5);
  }

  private buildEquipmentQrPayload(): string {
    if (!this.detailProject) {
      return '';
    }

    const properties = this.detailProject.properties;
    const identifier = String(properties['equipmentIdentifier'] ?? '').trim();
    if (!identifier) {
      return '';
    }

    const recordID = String(properties['equipmentRecordId'] ?? '').trim();
    const itemID = String(properties['equipmentItemId'] ?? '').trim();
    const shortCode = String(properties['shortCode'] ?? '').trim() || buildEquipmentQrShortCode(recordID || this.detailProject.id, itemID || this.detailProject.id);

    return JSON.stringify({
      recordId: recordID,
      itemId: itemID,
      identifier,
      shortCode,
    });
  }

  private refreshEquipmentQrPreview(): void {
    const payload = this.buildEquipmentQrPayload();
    const generationToken = ++this.equipmentQrGenerationToken;
    this.equipmentQrError = '';

    if (!payload) {
      this.equipmentQrDataUrl = '';
      return;
    }

    let parsedPayload: { recordId?: string; itemId?: string; identifier?: string; shortCode?: string };
    try {
      parsedPayload = JSON.parse(payload) as { recordId?: string; itemId?: string; identifier?: string; shortCode?: string };
    } catch {
      this.equipmentQrDataUrl = '';
      this.equipmentQrError = 'No fue posible generar el QR del equipo vinculado.';
      return;
    }

    void generateEquipmentQrDataUrl({
      recordId: String(parsedPayload.recordId ?? '').trim(),
      itemId: String(parsedPayload.itemId ?? '').trim(),
      identifier: String(parsedPayload.identifier ?? '').trim(),
      shortCode: String(parsedPayload.shortCode ?? '').trim(),
    })
      .then((dataUrl) => {
        if (generationToken !== this.equipmentQrGenerationToken) {
          return;
        }

        this.equipmentQrDataUrl = dataUrl;
      })
      .catch(() => {
        if (generationToken !== this.equipmentQrGenerationToken) {
          return;
        }

        this.equipmentQrDataUrl = '';
        this.equipmentQrError = 'No fue posible generar el QR del equipo vinculado.';
      });
  }

  private async startEquipmentScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.scannerDetectionLocked = false;
    this.equipmentScannerError = '';
    this.equipmentScannerStatus = 'Solicita permisos de camara y apunta al identificador del equipo.';

    try {
      this.stopEquipmentScannerSession();
      this.equipmentScannerControls = await this.equipmentBarcodeReader.decodeFromVideoDevice(undefined, videoElement, (result) => {
        if (!result || this.scannerDetectionLocked) {
          return;
        }

        const scannedValue = result.getText().trim();
        if (!scannedValue) {
          return;
        }

        this.scannerDetectionLocked = true;
        this.equipmentIdentifierDraft = scannedValue;
        this.closeEquipmentScanner();
        this.searchEquipmentByIdentifier('camera-scan');
      });
    } catch {
      this.equipmentScannerError = 'No fue posible iniciar el escaner. Verifica permisos de camara o usa el campo manual.';
      this.equipmentScannerStatus = 'Escaner no disponible.';
    }
  }

  private stopEquipmentScannerSession(): void {
    this.scannerDetectionLocked = false;
    this.equipmentScannerControls?.stop();
    this.equipmentScannerControls = null;
  }

  private normalizeProject(project: Project): Project {
    const properties = { ...(project.properties ?? {}) };
    delete properties['enableMiroboard'];
    const normalizedProgress = Math.max(0, Math.min(100, this.normalizeNumber(properties['progress'] ?? project.progress)));
    const equipmentRepairStatus = this.normalizeRepairStatusValue(properties['equipmentRepairStatus']);
    const paymentCondition = this.normalizePaymentCondition(properties['paymentCondition']);
    const paymentStatus = this.normalizePaymentStatus(properties['paymentStatus']);

    return {
      ...project,
      title: project.title ?? '',
      description: project.description ?? '',
      progress: normalizedProgress,
      attachments: [...(project.attachments ?? [])],
      properties: {
        ...properties,
        shortCode: String(properties['shortCode'] ?? this.generateShortCode(project.title, project.id)).trim(),
        startDate: this.normalizeDate(properties['startDate']),
        dueDate: this.normalizeDate(properties['dueDate']),
        noDeadline: Boolean(properties['noDeadline']),
        category: String(properties['category'] ?? ''),
        department: String(properties['department'] ?? ''),
        client: String(properties['client'] ?? ''),
        priority: String(properties['priority'] ?? 'medium'),
        assignee: String(properties['assignee'] ?? ''),
        notes: String(properties['notes'] ?? ''),
        diagnosticNotes: String(properties['diagnosticNotes'] ?? ''),
        diagnosisInspection: this.normalizeDiagnosisInspection(properties['diagnosisInspection']),
        diagnosisClosedAt: String(properties['diagnosisClosedAt'] ?? '').trim(),
        diagnosisClosedBy: String(properties['diagnosisClosedBy'] ?? '').trim(),
        repairNotes: String(properties['repairNotes'] ?? ''),
        repairabilityPercent: this.normalizeNumber(properties['repairabilityPercent']),
        publicProject: Boolean(properties['publicProject']),
        members: this.getMembersFromValue(properties['members']),
        currency: String(properties['currency'] ?? 'COP'),
        budget: this.normalizeNumber(properties['budget']),
        estimatedHours: this.normalizeNumber(properties['estimatedHours']),
        actualHours: this.normalizeNumber(properties['actualHours']),
        partsBudgetUsd: this.normalizeNumber(properties['partsBudgetUsd']),
        estimatedMaterialCost: this.normalizeNumber(properties['estimatedMaterialCost']),
        testType: String(properties['testType'] ?? 'sin-pruebas').trim() || 'sin-pruebas',
        testTypeLabel: getProjectTechnicalTestTypeLabel(String(properties['testType'] ?? 'sin-pruebas').trim() || 'sin-pruebas'),
        allowManualTime: Boolean(properties['allowManualTime']),
        notifyClient: Boolean(properties['notifyClient']),
        paymentCondition,
        paymentStatus,
        paymentStatusLabel: this.resolvePaymentStatusLabel(paymentStatus),
        paymentReference: String(properties['paymentReference'] ?? '').trim(),
        paymentConfirmedAt: String(properties['paymentConfirmedAt'] ?? '').trim(),
        materialReservationIds: this.getStringArrayValue(properties['materialReservationIds']),
        lastMaterialReservationAt: String(properties['lastMaterialReservationAt'] ?? '').trim(),
        equipmentRecordId: String(properties['equipmentRecordId'] ?? '').trim(),
        equipmentItemId: String(properties['equipmentItemId'] ?? '').trim(),
        equipmentProspectId: this.normalizeNumber(properties['equipmentProspectId']),
        equipmentProspectName: String(properties['equipmentProspectName'] ?? '').trim(),
        equipmentDisplayName: String(properties['equipmentDisplayName'] ?? '').trim(),
        equipmentIdentifier: String(properties['equipmentIdentifier'] ?? '').trim(),
        equipmentSerie: String(properties['equipmentSerie'] ?? '').trim(),
        equipmentReceptionLabel: String(properties['equipmentReceptionLabel'] ?? '').trim(),
        equipmentServiceType: String(properties['equipmentServiceType'] ?? '').trim(),
        equipmentFailureDescription: String(properties['equipmentFailureDescription'] ?? '').trim(),
        equipmentLocationId: String(properties['equipmentLocationId'] ?? '').trim(),
        equipmentLocationName: String(properties['equipmentLocationName'] ?? '').trim(),
        equipmentRepairStatus,
        equipmentRepairStatusLabel: String(properties['equipmentRepairStatusLabel'] ?? this.resolveRepairStatusLabel(equipmentRepairStatus)).trim(),
        equipmentLinkedAt: String(properties['equipmentLinkedAt'] ?? '').trim(),
        equipmentLastScanAt: String(properties['equipmentLastScanAt'] ?? '').trim(),
        equipmentLastScanSource: String(properties['equipmentLastScanSource'] ?? '').trim(),
        equipmentLastWorkflowUpdate: String(properties['equipmentLastWorkflowUpdate'] ?? '').trim(),
        stageEnteredAt: String(properties['stageEnteredAt'] ?? '').trim(),
        stageName: String(properties['stageName'] ?? '').trim(),
        lastDispatchCode: String(properties['lastDispatchCode'] ?? '').trim(),
        lastDispatchAt: String(properties['lastDispatchAt'] ?? '').trim(),
        lastDispatchMethod: String(properties['lastDispatchMethod'] ?? '').trim(),
        lastDispatchCarrier: String(properties['lastDispatchCarrier'] ?? '').trim(),
        lastDispatchGuideNumber: String(properties['lastDispatchGuideNumber'] ?? '').trim(),
        lastDispatchPickedUpBy: String(properties['lastDispatchPickedUpBy'] ?? '').trim(),
        lastDispatchNotes: String(properties['lastDispatchNotes'] ?? '').trim(),
        lastDispatchPaymentCondition: this.normalizePaymentCondition(properties['lastDispatchPaymentCondition']),
        lastDispatchPaymentStatus: this.normalizePaymentStatus(properties['lastDispatchPaymentStatus']),
        lastDispatchPaymentReference: String(properties['lastDispatchPaymentReference'] ?? '').trim(),
        lastDispatchPaymentConfirmedAt: String(properties['lastDispatchPaymentConfirmedAt'] ?? '').trim(),
        dispatchAttachmentsGeneratedAt: String(properties['dispatchAttachmentsGeneratedAt'] ?? '').trim(),
        dispatchHistory: this.getDispatchHistoryEntries(properties['dispatchHistory']),
        progress: normalizedProgress,
      },
    };
  }

  private prepareProjectForSave(project: Project): Project {
    const properties = { ...(project.properties ?? {}) };
    delete properties['enableMiroboard'];
    const normalizedProgress = Math.max(0, Math.min(100, this.normalizeNumber(properties['progress'])));
    const noDeadline = Boolean(properties['noDeadline']);
    const equipmentRepairStatus = this.normalizeRepairStatusValue(properties['equipmentRepairStatus']);
    const paymentCondition = this.normalizePaymentCondition(properties['paymentCondition']);
    const paymentStatus = this.normalizePaymentStatus(properties['paymentStatus']);

    return {
      ...project,
      title: project.title.trim(),
      description: (project.description ?? '').trim(),
      progress: normalizedProgress,
      attachments: [...(project.attachments ?? [])],
      properties: {
        ...properties,
        shortCode: String(properties['shortCode'] ?? this.generateShortCode(project.title, project.id)).trim(),
        startDate: this.normalizeDate(properties['startDate']),
        dueDate: noDeadline ? null : this.normalizeDate(properties['dueDate']),
        noDeadline,
        category: String(properties['category'] ?? '').trim(),
        department: String(properties['department'] ?? '').trim(),
        client: String(properties['client'] ?? '').trim(),
        priority: String(properties['priority'] ?? 'medium'),
        assignee: String(properties['assignee'] ?? '').trim(),
        notes: String(properties['notes'] ?? '').trim(),
        diagnosticNotes: String(properties['diagnosticNotes'] ?? '').trim(),
        diagnosisInspection: this.normalizeDiagnosisInspection(properties['diagnosisInspection']),
        diagnosisClosedAt: String(properties['diagnosisClosedAt'] ?? '').trim(),
        diagnosisClosedBy: String(properties['diagnosisClosedBy'] ?? '').trim(),
        repairNotes: String(properties['repairNotes'] ?? '').trim(),
        repairabilityPercent: this.normalizeNumber(properties['repairabilityPercent']),
        publicProject: Boolean(properties['publicProject']),
        members: this.getMembersFromValue(properties['members']),
        currency: String(properties['currency'] ?? 'COP'),
        budget: this.normalizeNumber(properties['budget']),
        estimatedHours: this.normalizeNumber(properties['estimatedHours']),
        actualHours: this.normalizeNumber(properties['actualHours']),
        partsBudgetUsd: this.normalizeNumber(properties['partsBudgetUsd']),
        estimatedMaterialCost: this.normalizeNumber(properties['estimatedMaterialCost']),
        testType: String(properties['testType'] ?? 'sin-pruebas').trim() || 'sin-pruebas',
        testTypeLabel: getProjectTechnicalTestTypeLabel(String(properties['testType'] ?? 'sin-pruebas').trim() || 'sin-pruebas'),
        allowManualTime: Boolean(properties['allowManualTime']),
        notifyClient: Boolean(properties['notifyClient']),
        paymentCondition,
        paymentStatus,
        paymentStatusLabel: this.resolvePaymentStatusLabel(paymentStatus),
        paymentReference: String(properties['paymentReference'] ?? '').trim(),
        paymentConfirmedAt: paymentStatus === 'confirmado'
          ? String(properties['paymentConfirmedAt'] ?? '').trim() || new Date().toISOString()
          : '',
        materialReservationIds: this.getStringArrayValue(properties['materialReservationIds']),
        lastMaterialReservationAt: String(properties['lastMaterialReservationAt'] ?? '').trim(),
        equipmentRecordId: String(properties['equipmentRecordId'] ?? '').trim(),
        equipmentItemId: String(properties['equipmentItemId'] ?? '').trim(),
        equipmentProspectId: this.normalizeNumber(properties['equipmentProspectId']),
        equipmentProspectName: String(properties['equipmentProspectName'] ?? '').trim(),
        equipmentDisplayName: String(properties['equipmentDisplayName'] ?? '').trim(),
        equipmentIdentifier: String(properties['equipmentIdentifier'] ?? '').trim(),
        equipmentSerie: String(properties['equipmentSerie'] ?? '').trim(),
        equipmentReceptionLabel: String(properties['equipmentReceptionLabel'] ?? '').trim(),
        equipmentServiceType: String(properties['equipmentServiceType'] ?? '').trim(),
        equipmentFailureDescription: String(properties['equipmentFailureDescription'] ?? '').trim(),
        equipmentLocationId: String(properties['equipmentLocationId'] ?? '').trim(),
        equipmentLocationName: String(properties['equipmentLocationName'] ?? '').trim(),
        equipmentRepairStatus,
        equipmentRepairStatusLabel: this.resolveRepairStatusLabel(equipmentRepairStatus),
        equipmentLinkedAt: String(properties['equipmentLinkedAt'] ?? '').trim(),
        equipmentLastScanAt: String(properties['equipmentLastScanAt'] ?? '').trim(),
        equipmentLastScanSource: String(properties['equipmentLastScanSource'] ?? '').trim(),
        equipmentLastWorkflowUpdate: String(properties['equipmentLastWorkflowUpdate'] ?? '').trim(),
        stageEnteredAt: String(properties['stageEnteredAt'] ?? '').trim(),
        stageName: String(properties['stageName'] ?? '').trim(),
        lastDispatchCode: String(properties['lastDispatchCode'] ?? '').trim(),
        lastDispatchAt: String(properties['lastDispatchAt'] ?? '').trim(),
        lastDispatchMethod: String(properties['lastDispatchMethod'] ?? '').trim(),
        lastDispatchCarrier: String(properties['lastDispatchCarrier'] ?? '').trim(),
        lastDispatchGuideNumber: String(properties['lastDispatchGuideNumber'] ?? '').trim(),
        lastDispatchPickedUpBy: String(properties['lastDispatchPickedUpBy'] ?? '').trim(),
        lastDispatchNotes: String(properties['lastDispatchNotes'] ?? '').trim(),
        lastDispatchPaymentCondition: this.normalizePaymentCondition(properties['lastDispatchPaymentCondition']),
        lastDispatchPaymentStatus: this.normalizePaymentStatus(properties['lastDispatchPaymentStatus']),
        lastDispatchPaymentReference: String(properties['lastDispatchPaymentReference'] ?? '').trim(),
        lastDispatchPaymentConfirmedAt: String(properties['lastDispatchPaymentConfirmedAt'] ?? '').trim(),
        dispatchAttachmentsGeneratedAt: String(properties['dispatchAttachmentsGeneratedAt'] ?? '').trim(),
        dispatchHistory: this.getDispatchHistoryEntries(properties['dispatchHistory']),
        progress: normalizedProgress,
      },
    };
  }

  private persistProjectDetail(
    project: Project,
    options: {
      closeOnSuccess?: boolean;
      successMessage?: string;
      onSuccess?: (savedProject: Project) => void;
      onFinally?: () => void;
    } = {},
  ): void {
    const preparedProject = this.prepareProjectForSave(project);
    if (!preparedProject.title.trim()) {
      options.onFinally?.();
      return;
    }

    this.saving = true;

    this.projectService.updateProject(preparedProject.id, preparedProject).subscribe({
      next: (savedProject) => {
        this.saving = false;
        if (options.successMessage) {
          this.boardActionMessage = options.successMessage;
        }

        this.syncEquipmentMemos(savedProject);
        options.onSuccess?.(savedProject);

        if (options.closeOnSuccess !== false) {
          this.closeProjectDetail();
          options.onFinally?.();
          return;
        }

        this.detailProject = this.normalizeProject(savedProject);
        this.initializeDispatchContext();
        options.onFinally?.();
      },
      error: (error) => {
        this.saving = false;
        // Sin fallback silencioso: el fallo de persistencia en el servidor
        // debe ser visible para el usuario.
        this.boardActionMessage = `No se pudo guardar el caso en el servidor: ${this.errorMessage(error)}`;
        options.onFinally?.();
      },
    });
  }

  private getMembersFromValue(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((member) => String(member).trim())
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((member) => member.trim())
        .filter(Boolean);
    }

    return [];
  }

  private filterProjectsByAudience(projects: Project[]): Project[] {
    let filtered = projects;

    // Bandeja "mis equipos": solo los casos asignados al usuario logueado.
    if (this.onlyMyProjects) {
      const currentUserName = this.resolveCurrentUserName().trim().toLowerCase();
      filtered = currentUserName
        ? filtered.filter((project) => String(project.properties?.['assignee'] ?? '').trim().toLowerCase() === currentUserName)
        : [];
    }

    if (this.boardAudience === 'todos' || !filtered.length) {
      return filtered;
    }

    if (this.boardAudience === 'tecnico') {
      return filtered.filter((project) => !this.isDiagnosisClosed(project));
    }

    return filtered.filter((project) => this.isDiagnosisClosed(project));
  }

  private isDiagnosisClosed(project: Project): boolean {
    return Boolean(String(project.properties?.['diagnosisClosedAt'] ?? '').trim());
  }

  private normalizeDiagnosisInspection(value: unknown): DiagnosisInspection {
    const inspection = typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : {};

    return {
      disassembled: Boolean(inspection['disassembled']),
      staticTest: Boolean(inspection['staticTest']),
      powerOnTest: Boolean(inspection['powerOnTest']),
      faultIdentified: Boolean(inspection['faultIdentified']),
    };
  }

  private resolveDiagnosisClosedBy(project: Project): string {
    const assignee = String(project.properties?.['assignee'] ?? '').trim();
    if (assignee) {
      return assignee;
    }

    return String(project.createdBy ?? '').trim() || 'current-user';
  }

  private getStringArrayValue(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    return [];
  }

  private getDispatchHistory(project: Project | null = this.detailProject): ProjectDispatchRecord[] {
    return this.getDispatchHistoryEntries(project?.properties?.['dispatchHistory']);
  }

  private getDispatchHistoryEntries(value: unknown): ProjectDispatchRecord[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry): ProjectDispatchRecord => {
        const deliveryMethod: ProjectDispatchRecord['deliveryMethod'] = entry['deliveryMethod'] === 'recoge-cliente'
          ? 'recoge-cliente'
          : 'transportadora';
        const paymentCondition = this.normalizePaymentCondition(entry['paymentCondition']);
        const paymentStatus = this.normalizePaymentStatus(entry['paymentStatus']);

        return {
          id: String(entry['id'] ?? '').trim(),
          code: String(entry['code'] ?? '').trim(),
          createdAt: String(entry['createdAt'] ?? '').trim(),
          deliveryMethod,
          carrier: String(entry['carrier'] ?? '').trim(),
          guideNumber: String(entry['guideNumber'] ?? '').trim(),
          pickedUpBy: String(entry['pickedUpBy'] ?? '').trim(),
          includePrice: Boolean(entry['includePrice']),
          includeInterventionReport: Boolean(entry['includeInterventionReport']),
          includePurchaseOrder: Boolean(entry['includePurchaseOrder']),
          notifyClient: Boolean(entry['notifyClient']),
          notes: String(entry['notes'] ?? '').trim(),
          deliveredBy: String(entry['deliveredBy'] ?? '').trim(),
          clientName: String(entry['clientName'] ?? '').trim(),
          equipmentName: String(entry['equipmentName'] ?? '').trim(),
          totalValue: typeof entry['totalValue'] === 'number' ? entry['totalValue'] : null,
          paymentCondition,
          paymentStatus,
          paymentReference: String(entry['paymentReference'] ?? '').trim(),
          paymentConfirmedAt: String(entry['paymentConfirmedAt'] ?? '').trim(),
          generatedAttachmentIds: Array.isArray(entry['generatedAttachmentIds'])
            ? entry['generatedAttachmentIds'].map((item) => String(item ?? '').trim()).filter(Boolean)
            : [],
        };
      })
      .filter((entry) => entry.id && entry.code)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private buildMaterialRequestDraft(project: Project | null = this.detailProject, reference = ''): ProjectMaterialRequestDraft {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultCommitment = this.toDateInputValue(tomorrow);

    return {
      reference,
      quantity: 1,
      assignedTo: this.resolveMaterialAssignedTo(project),
      purpose: project?.title ? `Repuesto para ${project.title}` : '',
      workOrder: project ? (String(project.properties['shortCode'] ?? '').trim() || project.id) : '',
      equipmentTag: project ? this.getProjectMaterialEquipmentTag() : '',
      customerSite: project ? this.getProjectMaterialCustomerSite() : '',
      priority: 'critica',
      commitmentDate: defaultCommitment,
    };
  }

  private buildDispatchDraft(project: Project | null = this.detailProject): ProjectDispatchDraft {
    const notifyClient = project ? Boolean(project.properties['notifyClient']) : true;
    const latestDispatch = this.getDispatchHistory(project)[0];

    if (latestDispatch) {
      return {
        deliveryMethod: latestDispatch.deliveryMethod,
        carrier: latestDispatch.deliveryMethod === 'transportadora' ? latestDispatch.carrier || 'Servia Entrega' : '',
        guideNumber: '',
        pickedUpBy: '',
        includePrice: latestDispatch.includePrice,
        includeInterventionReport: latestDispatch.includeInterventionReport,
        includePurchaseOrder: latestDispatch.includePurchaseOrder,
        notifyClient: latestDispatch.deliveryMethod === 'transportadora' ? latestDispatch.notifyClient : false,
        notes: latestDispatch.notes,
      };
    }

    return {
      deliveryMethod: 'transportadora',
      carrier: 'Servia Entrega',
      guideNumber: '',
      pickedUpBy: '',
      includePrice: false,
      includeInterventionReport: true,
      includePurchaseOrder: false,
      notifyClient,
      notes: project ? this.buildSuggestedDispatchNote(project) : '',
    };
  }

  private buildSuggestedDispatchNote(project: Project): string {
    const testTypeLabel = getProjectTechnicalTestTypeLabel(String(project.properties['testType'] ?? 'sin-pruebas'));
    const repairability = this.normalizeNumber(project.properties['repairabilityPercent']);
    const parts = [
      `Etapa cerrada desde ${project.properties['stageName'] || this.resolveBoardStatusLabel(project.status)}`,
      `Prueba registrada: ${testTypeLabel}`,
    ];

    if (repairability > 0) {
      parts.push(`Reparabilidad ${repairability}%`);
    }

    return parts.join(' · ');
  }

  private getProjectDispatchValue(): number | null {
    if (!this.detailProject) {
      return null;
    }

    const budget = this.normalizeNumber(this.detailProject.properties['budget']);
    return budget > 0 ? budget : null;
  }

  private buildDispatchRecord(dispatchCode: string, projectValue: number | null): ProjectDispatchRecord {
    const paymentCondition = this.getDispatchPaymentCondition();
    const paymentStatus = this.getDispatchPaymentStatus();
    const paymentReference = String(this.detailProject?.properties?.['paymentReference'] ?? '').trim();
    const paymentConfirmedAt = paymentStatus === 'confirmado'
      ? String(this.detailProject?.properties?.['paymentConfirmedAt'] ?? '').trim() || new Date().toISOString()
      : '';

    return {
      id: `dispatch-${Date.now()}`,
      code: dispatchCode,
      createdAt: new Date().toISOString(),
      deliveryMethod: this.dispatchDraft.deliveryMethod,
      carrier: this.dispatchDraft.deliveryMethod === 'transportadora' ? this.dispatchDraft.carrier.trim() : '',
      guideNumber: this.dispatchDraft.deliveryMethod === 'transportadora' ? this.dispatchDraft.guideNumber.trim() : '',
      pickedUpBy: this.dispatchDraft.deliveryMethod === 'recoge-cliente' ? this.dispatchDraft.pickedUpBy.trim() : '',
      includePrice: this.dispatchDraft.includePrice,
      includeInterventionReport: this.dispatchDraft.includeInterventionReport,
      includePurchaseOrder: this.dispatchDraft.includePurchaseOrder,
      notifyClient: this.dispatchDraft.deliveryMethod === 'transportadora' ? this.dispatchDraft.notifyClient : false,
      notes: this.dispatchDraft.notes.trim(),
      deliveredBy: 'current-user',
      clientName: this.getDispatchClientName(),
      equipmentName: this.getDispatchEquipmentName(),
      totalValue: this.dispatchDraft.includePrice ? projectValue : null,
      paymentCondition,
      paymentStatus,
      paymentReference,
      paymentConfirmedAt,
      generatedAttachmentIds: [],
    };
  }

  private buildDispatchAttachments(dispatchRecord: ProjectDispatchRecord, project: Project): Attachment[] {
    const attachments: Attachment[] = [];
    const existingAttachments = project.attachments ?? [];
    const orderAttachment = this.createGeneratedAttachment(
      `orden-envio-${dispatchRecord.code}.txt`,
      this.buildDispatchOrderContent(dispatchRecord, project),
      dispatchRecord.id,
      'orden'
    );

    attachments.push(orderAttachment);
    dispatchRecord.generatedAttachmentIds.push(orderAttachment.id);

    // El informe de intervencion ya no se genera como .txt local: se persiste
    // en el servidor vía POST /api/v1/projects/technical-reports
    // (ver persistInterventionReport, invocado al confirmar el despacho).

    if (dispatchRecord.includePurchaseOrder && existingAttachments.length > 0) {
      const manifestAttachment = this.createGeneratedAttachment(
        `anexos-despacho-${dispatchRecord.code}.txt`,
        this.buildDispatchAttachmentManifest(dispatchRecord, existingAttachments),
        dispatchRecord.id,
        'anexos'
      );
      attachments.push(manifestAttachment);
      dispatchRecord.generatedAttachmentIds.push(manifestAttachment.id);
    }

    return attachments;
  }

  private createGeneratedAttachment(name: string, content: string, dispatchId: string, kind: string): Attachment {
    return {
      id: `${dispatchId}-${kind}`,
      name,
      url: `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
      size: new Blob([content]).size,
      type: 'text/plain',
      uploadedAt: new Date(),
      uploadedBy: 'current-user',
    };
  }

  private buildDispatchOrderContent(dispatchRecord: ProjectDispatchRecord, project: Project): string {
    const valueLine = dispatchRecord.includePrice
      ? `Valor del proyecto: ${this.formatCurrency(dispatchRecord.totalValue ?? 0)}`
      : 'Valor del proyecto: no incluido';

    return [
      `Orden de envio ${dispatchRecord.code}`,
      `Fecha: ${new Date(dispatchRecord.createdAt).toLocaleString('es-CO')}`,
      `Cliente: ${dispatchRecord.clientName || 'Sin cliente'}`,
      `Proyecto: ${project.properties['shortCode'] || project.id}`,
      `Equipo: ${dispatchRecord.equipmentName || 'Sin equipo vinculado'}`,
      `Metodo de entrega: ${dispatchRecord.deliveryMethod === 'transportadora' ? 'Transportadora' : 'Recoge cliente'}`,
      dispatchRecord.deliveryMethod === 'transportadora'
        ? `Transportadora: ${dispatchRecord.carrier || 'Sin transportadora'} · Guia: ${dispatchRecord.guideNumber || 'Sin guia'}`
        : `Recibido por: ${dispatchRecord.pickedUpBy || 'Cliente'}`,
      `Condicion de pago: ${dispatchRecord.paymentCondition === 'credito' ? 'Credito' : 'Contra-entrega'}`,
      `Estado de pago: ${this.resolvePaymentStatusLabel(dispatchRecord.paymentStatus)}`,
      dispatchRecord.paymentReference ? `Referencia de pago: ${dispatchRecord.paymentReference}` : 'Referencia de pago: Sin referencia',
      dispatchRecord.paymentConfirmedAt ? `Pago confirmado el: ${new Date(dispatchRecord.paymentConfirmedAt).toLocaleString('es-CO')}` : 'Pago confirmado el: Pendiente',
      `Accesorios: ${this.getDispatchAccessoriesLabel()}`,
      `Equipos prestados: ${this.getDispatchBorrowedEquipmentLabel()}`,
      `Falla reportada: ${String(project.properties['equipmentFailureDescription'] ?? '').trim() || 'Sin detalle'}`,
      valueLine,
      `Notas: ${dispatchRecord.notes || 'Sin notas adicionales'}`,
      dispatchRecord.notifyClient ? 'Notificacion al cliente: marcada para seguimiento' : 'Notificacion al cliente: pendiente o no requerida',
    ].join('\n');
  }

  private buildDispatchInterventionReportContent(dispatchRecord: ProjectDispatchRecord, project: Project): string {
    return [
      `Reporte de intervencion ${dispatchRecord.code}`,
      `Cliente: ${dispatchRecord.clientName || 'Sin cliente'}`,
      `Equipo: ${dispatchRecord.equipmentName || 'Sin equipo vinculado'}`,
      `Diagnostico: ${String(project.properties['diagnosticNotes'] ?? '').trim() || 'Sin memo diagnostico'}`,
      `Reparacion: ${String(project.properties['repairNotes'] ?? '').trim() || 'Sin memo de intervencion'}`,
      `Prueba registrada: ${getProjectTechnicalTestTypeLabel(String(project.properties['testType'] ?? 'sin-pruebas'))}`,
      `Reparabilidad: ${this.normalizeNumber(project.properties['repairabilityPercent'])}%`,
      `Horas reales: ${this.normalizeNumber(project.properties['actualHours'])}`,
      `Observacion de despacho: ${dispatchRecord.notes || 'Sin observaciones'}`,
    ].join('\n');
  }

  /**
   * Persiste el informe de intervencion en el servidor
   * (POST /api/v1/projects/technical-reports). Reemplaza la generacion del
   * .txt local de las versiones anteriores: el informe queda disponible para
   * administracion y para el historial del equipo.
   */
  private persistInterventionReport(dispatchRecord: ProjectDispatchRecord, project: Project): void {
    if (!dispatchRecord.includeInterventionReport) {
      return;
    }

    const properties = project.properties ?? {};
    const testType = String(properties['testType'] ?? 'sin-pruebas').trim() || 'sin-pruebas';

    this.projectsApi
      .createTechnicalReport({
        projectId: project.id,
        projectCode: String(properties['shortCode'] ?? '').trim() || project.id,
        projectTitle: project.title,
        clientName: dispatchRecord.clientName || this.getDispatchClientName(),
        equipmentName: dispatchRecord.equipmentName || this.getDispatchEquipmentName(),
        equipmentRecordId: String(properties['equipmentRecordId'] ?? '').trim(),
        equipmentItemId: String(properties['equipmentItemId'] ?? '').trim(),
        equipmentIdentifier: String(properties['equipmentIdentifier'] ?? '').trim(),
        dispatchCode: dispatchRecord.code,
        failureDescription: String(properties['equipmentFailureDescription'] ?? '').trim(),
        diagnosticNotes: String(properties['diagnosticNotes'] ?? '').trim(),
        repairNotes: String(properties['repairNotes'] ?? '').trim(),
        testType,
        testTypeLabel: getProjectTechnicalTestTypeLabel(testType),
        repairabilityPercent: this.normalizeNumber(properties['repairabilityPercent']),
        estimatedHours: this.normalizeNumber(properties['estimatedHours']),
        actualHours: this.normalizeNumber(properties['actualHours']),
        dispatchNotes: dispatchRecord.notes,
        content: this.buildDispatchInterventionReportContent(dispatchRecord, project),
        createdBy: dispatchRecord.deliveredBy || this.resolveCurrentUserName(),
      })
      .pipe(take(1))
      .subscribe({
        error: (error) => {
          this.boardActionMessage = `El despacho quedo registrado, pero el informe de intervencion NO se guardo en el servidor: ${this.errorMessage(error)}`;
        },
      });
  }

  /**
   * Convierte el flag notifyClient en dos cosas (Fase 5c):
   *
   *  1. La notificacion interna persistida en el servidor
   *     (POST /api/v1/projects/notifications), que ya existia desde la Fase 3 y
   *     se CONSERVA: es el pendiente de seguimiento para administracion.
   *  2. El correo real al cliente con transportadora y numero de guia, que es lo
   *     que faltaba. Antes el flag solo creaba la notificacion interna y nadie
   *     le escribia al cliente (el backend no tenia SMTP).
   *
   * El destinatario NO se manda desde aqui: el backend lo resuelve del cliente
   * en BD. Si el cliente no tiene correo, el endpoint responde 422 y se muestra
   * como error visible en vez de dar el aviso por enviado.
   */
  private notifyClientDispatch(dispatchRecord: ProjectDispatchRecord): void {
    if (!dispatchRecord.notifyClient) {
      return;
    }

    const deliveryDetail = dispatchRecord.deliveryMethod === 'transportadora'
      ? `Transportadora ${dispatchRecord.carrier || 'sin nombre'} · guia ${dispatchRecord.guideNumber || 'sin guia'}`
      : `Recogido por ${dispatchRecord.pickedUpBy || 'cliente'}`;

    this.projectsApi
      .createNotification({
        type: 'despacho-cliente',
        title: `Avisar al cliente: despacho ${dispatchRecord.code}`,
        message: `${dispatchRecord.clientName || 'Cliente sin nombre'} · ${dispatchRecord.equipmentName || 'equipo sin nombre'} · ${deliveryDetail}. Pendiente notificar al cliente del envio/entrega de su equipo.`,
        targetRole: 'administrativo',
      })
      .pipe(take(1))
      .subscribe({
        error: (error) => {
          this.boardActionMessage = `El despacho quedo registrado, pero la notificacion al cliente NO se guardo en el servidor: ${this.errorMessage(error)}`;
        },
      });

    this.emailsApi
      .sendDispatchNotice({
        clientName: dispatchRecord.clientName || '',
        dispatchCode: dispatchRecord.code || '',
        equipmentName: dispatchRecord.equipmentName || '',
        carrier: dispatchRecord.carrier || '',
        guideNumber: dispatchRecord.guideNumber || '',
        deliveryNote: deliveryDetail,
        refType: 'project-dispatch',
        refID: dispatchRecord.id || dispatchRecord.code || '',
      })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          // delivered llega en false porque encolar no es enviar: emailStatus
          // es el que dice si el correo saldra o si el servidor no tiene SMTP.
          if (result.emailStatus === 'desactivado') {
            this.boardActionMessage =
              `El despacho quedo registrado, pero el correo al cliente NO salio: ` +
              `${result.warning ?? 'el servidor no tiene SMTP configurado'}. ` +
              `Quedo en el outbox de correos (/emails) y la notificacion interna si se creo.`;
          } else {
            this.boardActionMessage =
              `Aviso de despacho en cola para ${result.toEmail}; saldra en el proximo envio del servidor.`;
          }
        },
        error: (error) => {
          this.boardActionMessage =
            `El despacho quedo registrado, pero el correo al cliente NO se envio: ${this.errorMessage(error)}`;
        },
      });
  }

  /**
   * Sincroniza los memos de diagnostico/reparacion del caso con el registro
   * del equipo en recepcion (campos diagnosisMemo/repairMemo del item), para
   * que el historial tecnico del equipo incluya la intervencion.
   */
  private syncEquipmentMemos(project: Project): void {
    const properties = project.properties ?? {};
    const recordId = String(properties['equipmentRecordId'] ?? '').trim();
    const itemId = String(properties['equipmentItemId'] ?? '').trim();

    if (!recordId || !itemId) {
      return;
    }

    const diagnosisMemo = String(properties['diagnosticNotes'] ?? '').trim();
    const repairMemo = String(properties['repairNotes'] ?? '').trim();

    if (!diagnosisMemo && !repairMemo) {
      return;
    }

    this.crmEquipmentApi
      .getRecord(recordId, true)
      .pipe(take(1))
      .subscribe({
        next: (record) => {
          let changed = false;
          const nextItems = (record.items ?? []).map((item) => {
            if (String(item.id ?? '').trim() !== itemId) {
              return item;
            }

            if (String(item.diagnosisMemo ?? '') === diagnosisMemo && String(item.repairMemo ?? '') === repairMemo) {
              return item;
            }

            changed = true;
            return { ...item, diagnosisMemo, repairMemo };
          });

          if (!changed) {
            return;
          }

          this.crmEquipmentApi
            .upsertRecord({ ...record, items: nextItems })
            .pipe(take(1))
            .subscribe({
              error: (error) => {
                this.equipmentWorkflowError = `El caso se guardo, pero los memos no se sincronizaron con el equipo: ${this.errorMessage(error)}`;
              },
            });
        },
        error: (error) => {
          this.equipmentWorkflowError = `El caso se guardo, pero los memos no se sincronizaron con el equipo: ${this.errorMessage(error)}`;
        },
      });
  }

  /**
   * Precarga los memos persistidos en el registro del equipo (diagnosisMemo/
   * repairMemo) cuando el campo del caso esta vacio, segun lo conversado con
   * el cliente (informe precargado del memo).
   */
  private preloadMemosFromEquipmentItem(item: ProspectEquipmentItem): void {
    if (!this.detailProject) {
      return;
    }

    const properties = this.detailProject.properties ?? {};
    const diagnosisMemo = String(item.diagnosisMemo ?? '').trim();
    const repairMemo = String(item.repairMemo ?? '').trim();

    if (diagnosisMemo && !String(properties['diagnosticNotes'] ?? '').trim()) {
      properties['diagnosticNotes'] = diagnosisMemo;
    }

    if (repairMemo && !String(properties['repairNotes'] ?? '').trim()) {
      properties['repairNotes'] = repairMemo;
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim()
      ? error.message.trim()
      : 'error de comunicacion con el servidor';
  }

  private buildDispatchAttachmentManifest(dispatchRecord: ProjectDispatchRecord, attachments: Attachment[]): string {
    return [
      `Manifiesto de anexos ${dispatchRecord.code}`,
      'Adjuntos disponibles para respaldo del despacho:',
      ...attachments.map((attachment) => `- ${attachment.name}`),
    ].join('\n');
  }

  private buildNextDispatchCode(dateValue = new Date().toISOString().slice(0, 10)): string {
    const previewPrefix = buildCommercialDocumentCode('dispatch', 1, dateValue, 'month').slice(0, -3);
    const matchingNumbers = this.getAllProjectsSnapshot()
      .flatMap((project) => this.getDispatchHistory(project).map((record) => record.code))
      .filter((code) => code.startsWith(previewPrefix))
      .map((code) => Number(code.slice(-3)))
      .filter((value) => Number.isFinite(value));

    const nextSequence = matchingNumbers.length ? Math.max(...matchingNumbers) + 1 : 1;
    return buildCommercialDocumentCode('dispatch', nextSequence, dateValue, 'month');
  }

  private getAllProjectsSnapshot(): Project[] {
    const allProjects: Project[] = [];
    const seen = new Set<string>();

    this.projectsByColumn.forEach((projects) => {
      projects.forEach((project) => {
        if (seen.has(project.id)) {
          return;
        }

        seen.add(project.id);
        allProjects.push(project);
      });
    });

    return allProjects;
  }

  private syncMaterialDraftContext(resetDraft = false): void {
    if (!this.detailProject) {
      this.materialRequestDraft = this.buildMaterialRequestDraft(null);
      this.selectedMaterialReference = null;
      return;
    }

    const nextReference = this.materialRequestDraft.reference.trim();
    const nextCommitment = this.materialRequestDraft.commitmentDate || this.toDateInputValue(this.detailProject.properties['dueDate']);

    this.materialRequestDraft = resetDraft
      ? this.buildMaterialRequestDraft(this.detailProject, nextReference)
      : {
        ...this.materialRequestDraft,
        reference: nextReference,
        quantity: Math.max(1, Math.floor(this.materialRequestDraft.quantity || 1)),
        assignedTo: this.resolveMaterialAssignedTo(this.detailProject, this.materialRequestDraft.assignedTo),
        purpose: this.materialRequestDraft.purpose.trim() || `Repuesto para ${this.detailProject.title}`,
        workOrder: this.getProjectMaterialWorkOrder(),
        equipmentTag: this.getProjectMaterialEquipmentTag(),
        customerSite: this.getProjectMaterialCustomerSite(),
        commitmentDate: nextCommitment,
      };

    this.syncSelectedMaterialReference();
  }

  private syncSelectedMaterialReference(): void {
    const reference = this.materialRequestDraft.reference.trim();
    this.selectedMaterialReference = this.inventoryReferences.find((item) => item.reference === reference) ?? null;
  }

  private syncMaterialReservations(reservations: ReservationRecord[] = this.inventoryWorkflowService.getSnapshot().reservations): void {
    if (!this.detailProject) {
      this.materialReservations = [];
      return;
    }

    const storedIds = this.getStringArrayValue(this.detailProject.properties['materialReservationIds']);
    const storedIdSet = new Set(storedIds);
    const workOrder = this.getProjectMaterialWorkOrder();
    const fallbackReservations = storedIds.length
      ? []
      : reservations.filter((item) => Boolean(workOrder) && item.workOrder === workOrder);
    const matchedReservations = storedIds.length
      ? reservations.filter((item) => storedIdSet.has(item.id))
      : fallbackReservations;

    this.materialReservations = [...matchedReservations].sort((left, right) => {
      return new Date(right.reservedAt).getTime() - new Date(left.reservedAt).getTime();
    });

    if (!storedIds.length && matchedReservations.length) {
      this.detailProject.properties['materialReservationIds'] = matchedReservations.map((item) => item.id);
    }
  }

  private loadMaterialTechnicianOptions(): void {
    this.crmEquipmentApi.listTechnicians().pipe(take(1)).subscribe({
      next: (technicians) => {
        this.materialTechnicianOptions = this.normalizeAssigneeOptions(technicians.map((item) => item.name));
      },
      error: () => {
        this.materialTechnicianOptions = [];
      },
    });
  }

  private getMaterialAssigneeChoices(currentAssignee = ''): string[] {
    const projectAssignee = String(this.detailProject?.properties?.['assignee'] ?? '').trim();
    const currentUserName = this.resolveCurrentUserName();

    if (this.isTechnicianInventoryRole) {
      return this.normalizeAssigneeOptions([currentUserName, currentAssignee, projectAssignee]);
    }

    const technicianOptions = this.materialTechnicianOptions.length > 0
      ? this.materialTechnicianOptions
      : this.peopleNames;

    return this.normalizeAssigneeOptions([
      ...technicianOptions,
      currentAssignee,
      projectAssignee,
    ]);
  }

  private resolveMaterialAssignedTo(project: Project | null, preferredValue = ''): string {
    const preferred = String(preferredValue ?? '').trim();
    const projectAssignee = project ? String(project.properties['assignee'] ?? '').trim() : '';
    const currentUserName = this.resolveCurrentUserName();

    if (this.isTechnicianInventoryRole) {
      return currentUserName || preferred || projectAssignee;
    }

    if (preferred) {
      return preferred;
    }

    if (projectAssignee) {
      return projectAssignee;
    }

    return '';
  }

  private resolveCurrentUserName(): string {
    return this.authService.getCurrentUserName().trim();
  }

  private normalizeAssigneeOptions(values: string[]): string[] {
    const normalized: string[] = [];
    const seen = new Set<string>();

    values.forEach((value) => {
      const nextValue = String(value ?? '').trim();
      if (!nextValue) {
        return;
      }

      const key = nextValue.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      normalized.push(nextValue);
    });

    return normalized;
  }

  private normalizeDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private generateShortCode(title: string, id: string): string {
    const prefix = title
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    const suffix = id.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0');
    return `${prefix || 'PRJ'}-${suffix || '001'}`;
  }

  private syncDragAndDrop(): void {
    const dropZones = this.columnDropZones?.toArray().map((dropZoneRef) => dropZoneRef.nativeElement) ?? [];

    this.destroyDragAndDrop();

    if (!dropZones.length) {
      return;
    }

    try {
      this.dragulaInstance = dragula(dropZones, {
        moves: (_element: HTMLElement, _source: HTMLElement, handle: HTMLElement) => {
          return Boolean(handle?.closest('.project-card__drag-handle'));
        },
      });

      this.dragulaInstance.on('drop', (element: HTMLElement, target: HTMLElement | null, source: HTMLElement | null) => {
        this.handleDragulaDrop(element, target, source);
      });
    } catch {
      this.dragulaInstance = undefined;
    }
  }

  private scrollProjectDetailBodyToTop(): void {
    window.setTimeout(() => {
      if (!this.projectDetailBody?.nativeElement) {
        return;
      }

      this.projectDetailBody.nativeElement.scrollTop = 0;
    }, 0);
  }

  private destroyDragAndDrop(): void {
    if (this.dragulaInstance?.destroy) {
      this.dragulaInstance.destroy();
    }

    this.dragulaInstance = undefined;
  }

  private handleDragulaDrop(element: HTMLElement, target: HTMLElement | null, source: HTMLElement | null): void {
    const projectId = element.dataset['projectId'];
    const targetColumnId = target?.dataset['columnId'];
    const sourceColumnId = source?.dataset['columnId'];

    if (!projectId || !targetColumnId || !target || !sourceColumnId) {
      return;
    }

    if (sourceColumnId === targetColumnId) {
      return;
    }

    const targetItems = Array.from(target.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('project-drag-item'));
    const targetIndex = targetItems.findIndex((item) => item.dataset['projectId'] === projectId);

    if (targetIndex === -1) {
      return;
    }

    window.setTimeout(() => {
      this.projectService.moveProject(projectId, targetColumnId, targetIndex).subscribe({
        next: (updatedProject) => {
          const normalizedProject = this.normalizeProject(updatedProject);

          if (this.openTransitionPrompt(normalizedProject, sourceColumnId, targetColumnId, 'drag')) {
            if (this.detailProject?.id === normalizedProject.id) {
              this.detailProject = normalizedProject;
            }
            return;
          }

          if (this.detailProject?.id === updatedProject.id) {
            this.detailProject = normalizedProject;
          }
        },
        error: (error) => {
          // Sin este mensaje un 400 de transicion ilegal quedaba invisible y el
          // tecnico creia que el move habia funcionado.
          this.boardActionMessage = `No se pudo mover el caso: ${this.errorMessage(error)}`;
          this.syncDragAndDrop();
        },
      });
    }, 0);
  }

  confirmPendingTransition(answers: Record<string, string>): void {
    const context = this.pendingTransition;
    this.pendingTransition = null;

    if (!context) {
      return;
    }

    if (context.mode === 'detail') {
      if (!this.detailProject || this.detailProject.id !== context.projectId) {
        return;
      }

      const updatedProject = this.appendTransitionRun(
        this.applyProjectStatusChange(this.detailProject, context.toStatusId),
        context,
        answers,
      );
      this.detailProject = this.normalizeProject(updatedProject);
      this.initializeDispatchContext();
      return;
    }

    this.projectService.getProject(context.projectId).pipe(take(1)).subscribe((project) => {
      if (!project) {
        return;
      }

      const updatedProject = this.appendTransitionRun(
        this.applyProjectStatusChange(project, context.toStatusId),
        context,
        answers,
      );

      this.projectService.updateProject(updatedProject.id, updatedProject).subscribe({
        next: (savedProject) => {
          if (this.detailProject?.id === savedProject.id) {
            this.detailProject = this.normalizeProject(savedProject);
          }
        },
        error: (error) => {
          // El estado ya fue escrito por el drag; si esta segunda escritura
          // (respuestas del lote de pruebas) falla, el tecnico debe verlo.
          this.boardActionMessage = `El caso se movio, pero no se pudieron registrar las respuestas de la transicion: ${this.errorMessage(error)}`;
        },
      });
    });
  }

  cancelPendingTransition(): void {
    const context = this.pendingTransition;
    this.pendingTransition = null;

    if (!context) {
      return;
    }

    if (context.mode === 'detail') {
      if (!context.requiresCompletion && this.detailProject?.id === context.projectId) {
        this.detailProject = this.normalizeProject(this.applyProjectStatusChange(this.detailProject, context.toStatusId));
        this.initializeDispatchContext();
      }
      return;
    }

    if (!context.requiresCompletion) {
      return;
    }

    this.projectService.moveProject(context.projectId, context.fromStatusId, Number.MAX_SAFE_INTEGER).subscribe({
      next: (revertedProject) => {
        if (this.detailProject?.id === revertedProject.id) {
          this.detailProject = this.normalizeProject(revertedProject);
        }
      },
      error: (error) => {
        // Si la reversa falla el caso queda en la columna destino: hay que
        // decirselo al tecnico, no re-sincronizar dragula en silencio.
        this.boardActionMessage = `No se pudo revertir el movimiento del caso: ${this.errorMessage(error)}`;
        this.syncDragAndDrop();
      },
    });
  }

  private openTransitionPrompt(project: Project, fromStatusId: string, toStatusId: string, mode: 'detail' | 'drag'): boolean {
    const prompt = this.workTestBatchService.getTransitionPrompt(
      fromStatusId,
      toStatusId,
      String(project.properties['priority'] ?? ''),
    );

    if (!prompt) {
      return false;
    }

    this.pendingTransition = {
      mode,
      projectId: project.id,
      projectTitle: project.title,
      fromStatusId,
      toStatusId,
      fromStatusLabel: this.resolveBoardStatusLabel(fromStatusId),
      toStatusLabel: this.resolveBoardStatusLabel(toStatusId),
      prompt,
      requiresCompletion: prompt.rules.some((rule) => rule.requiredToContinue),
    };

    return true;
  }

  private applyProjectStatusChange(project: Project, nextStatusId: string): Project {
    const now = new Date().toISOString();
    const column = this.getBoardColumn(nextStatusId);
    const properties = {
      ...(project.properties ?? {}),
      stageEnteredAt: now,
      stageName: column?.name ?? nextStatusId,
    } as Record<string, any>;

    if (column?.equipmentStatusId) {
      const nextEquipmentStatus = resolveWarrantyBoardStatus(column.equipmentStatusId, this.hasPendingPurchaseParts(project));
      properties['equipmentRepairStatus'] = nextEquipmentStatus;
      properties['equipmentRepairStatusLabel'] = nextEquipmentStatus === column.equipmentStatusId
        ? column.equipmentStatusLabel || column.name
        : this.resolveRepairStatusLabel(nextEquipmentStatus as ProspectEquipmentRepairStatus);
      properties['equipmentLastWorkflowUpdate'] = now;
    }

    return {
      ...project,
      status: nextStatusId,
      properties,
      updatedAt: new Date(),
    };
  }

  private appendTransitionRun(project: Project, context: PendingProjectTransition, answers: Record<string, string>): Project {
    const existingRuns = Array.isArray(project.properties?.['transitionTestRuns'])
      ? (project.properties['transitionTestRuns'] as WorkTestBatchRun[])
      : [];

    const nextRun: WorkTestBatchRun = {
      id: `transition-run-${Date.now()}`,
      fromStatusId: context.fromStatusId,
      toStatusId: context.toStatusId,
      fromStatusLabel: context.fromStatusLabel,
      toStatusLabel: context.toStatusLabel,
      executedAt: new Date().toISOString(),
      executedBy: 'current-user',
      ruleIds: context.prompt.rules.map((rule) => rule.id),
      ruleNames: context.prompt.rules.map((rule) => rule.name),
      batchIds: context.prompt.batches.map((batch) => batch.id),
      batchNames: context.prompt.batches.map((batch) => batch.name),
      answers: { ...answers },
    };

    return {
      ...project,
      properties: {
        ...(project.properties ?? {}),
        transitionTestRuns: [nextRun, ...existingRuns].slice(0, 20),
      },
    };
  }

  private getBoardColumn(statusId: string): BoardColumn | undefined {
    return this.projectService.getBoardSnapshot()?.columns.find((column) => column.id === statusId);
  }

  private resolveBoardStatusLabel(statusId: string): string {
    return this.getBoardColumn(statusId)?.name ?? statusId;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const normalizedHex = hex.replace('#', '');
    const safeHex = normalizedHex.length === 3
      ? normalizedHex.split('').map((char) => `${char}${char}`).join('')
      : normalizedHex.padEnd(6, '0').slice(0, 6);

    const red = Number.parseInt(safeHex.slice(0, 2), 16);
    const green = Number.parseInt(safeHex.slice(2, 4), 16);
    const blue = Number.parseInt(safeHex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
}
