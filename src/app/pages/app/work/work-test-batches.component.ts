import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { BoardColumn } from '../projects/models';
import { ProjectService } from '../projects/services';
import {
  WorkTestBatch,
  WorkTestFlowRule,
  WorkTestQuestion,
  WorkTestQuestionType,
} from './work-test-batch.models';
import { WorkTestBatchService } from './work-test-batch.service';

interface QuestionDraft {
  id?: string;
  label: string;
  type: WorkTestQuestionType;
  required: boolean;
  helperText: string;
  optionsText: string;
}

interface BatchDraft {
  id?: string;
  name: string;
  description: string;
  active: boolean;
  questions: QuestionDraft[];
}

interface FlowDraft {
  id?: string;
  name: string;
  fromStatusId: string;
  toStatusId: string;
  batchIds: string[];
  requiredToContinue: boolean;
  triggerMode: WorkTestFlowRule['triggerMode'];
  active: boolean;
}

@Component({
  selector: 'app-work-test-batches',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container-fluid py-3">
      <div class="row gx-3 gx-lg-4 align-items-center page-title">
        <div class="col col-sm mb-3 mb-sm-0">
          <h5 class="mb-0">Trabajo - Lote de pruebas</h5>
          <p class="text-secondary small mb-0">Configura grupos de preguntas y asignalos a transiciones del kanban tecnico.</p>
        </div>
      </div>

      <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
          <li class="breadcrumb-item bi">Trabajo</li>
          <li class="breadcrumb-item bi active" aria-current="page">Lote de pruebas</li>
        </ol>
      </nav>
    </div>

    <div class="container mt-3" id="main-content">
      @if (successMessage) {
        <div class="alert alert-success border mb-3">{{ successMessage }}</div>
      }
      @if (errorMessage) {
        <div class="alert alert-danger border mb-3">{{ errorMessage }}</div>
      }

      <div class="row gx-3 gy-3 mb-3">
        <div class="col-12 col-md-4">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Grupos activos</p>
              <p class="h3 mb-0">{{ activeBatchCount }}</p>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Flujos activos</p>
              <p class="h3 mb-0">{{ activeFlowCount }}</p>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Columnas tecnicas</p>
              <p class="h3 mb-0">{{ boardColumns.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row gx-3 gy-3">
        <div class="col-12 col-xl-6">
          <div class="card adminuiux-card h-100">
            <div class="card-header d-flex align-items-center justify-content-between gap-2">
              <div>
                <h6 class="mb-0">Grupos de preguntas</h6>
                <p class="text-secondary small mb-0">Cada grupo representa el lote que se debe diligenciar antes de un cambio de etapa.</p>
              </div>
              <button type="button" class="btn btn-sm btn-theme" data-testid="work-test-batches-new-group" (click)="startNewBatch()">Nuevo grupo</button>
            </div>
            <div class="card-body">
              <div class="table-responsive mb-3">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th style="width: 110px">Preguntas</th>
                      <th style="width: 120px">Flujos</th>
                      <th class="text-end" style="width: 150px">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (batch of batches; track batch.id) {
                      <tr>
                        <td>
                          <div class="fw-semibold">{{ batch.name }}</div>
                          <small class="text-secondary">{{ batch.description || 'Sin descripcion' }}</small>
                        </td>
                        <td><span class="badge rounded-pill text-bg-light border">{{ batch.questions.length }}</span></td>
                        <td><span class="badge rounded-pill text-bg-primary">{{ getFlowCountForBatch(batch.id) }}</span></td>
                        <td class="text-end">
                          <div class="d-flex justify-content-end gap-1">
                            <button type="button" class="btn btn-sm btn-outline-theme" (click)="editBatch(batch)">Editar</button>
                            <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteBatch(batch.id)">Borrar</button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="text-center py-4 text-secondary">No hay grupos configurados.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="border rounded-4 p-3 bg-body-tertiary">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h6 class="mb-1">{{ batchDraft.id ? 'Editar grupo' : 'Nuevo grupo' }}</h6>
                    <p class="text-secondary small mb-0">Usa preguntas cerradas o abiertas y deja listo el lote para los cambios de columna.</p>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-secondary" data-testid="work-test-batches-clear-group" (click)="startNewBatch()">Limpiar</button>
                </div>

                <div class="row gx-3 gy-3 mb-3">
                  <div class="col-12 col-lg-7">
                    <label class="form-label">Nombre</label>
                    <input class="form-control" [(ngModel)]="batchDraft.name" />
                  </div>
                  <div class="col-12 col-lg-5 d-flex align-items-end">
                    <label class="form-check mb-0 batch-active-toggle">
                      <input class="form-check-input" type="checkbox" [(ngModel)]="batchDraft.active" />
                      <span class="form-check-label">Grupo activo</span>
                    </label>
                  </div>
                  <div class="col-12">
                    <label class="form-label">Descripcion</label>
                    <textarea class="form-control" rows="2" [(ngModel)]="batchDraft.description"></textarea>
                  </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="mb-0">Preguntas</h6>
                  <button type="button" class="btn btn-sm btn-outline-theme" data-testid="work-test-batches-add-question" (click)="addQuestionDraft()">Agregar pregunta</button>
                </div>

                <div class="question-editor-list">
                  @for (question of batchDraft.questions; track $index; let i = $index) {
                    <div class="question-editor-card">
                      <div class="row gx-3 gy-3">
                        <div class="col-12 col-xl-5">
                          <label class="form-label">Pregunta</label>
                          <input class="form-control" [(ngModel)]="question.label" />
                        </div>
                        <div class="col-12 col-md-6 col-xl-4">
                          <label class="form-label">Tipo</label>
                          <select class="form-select" [(ngModel)]="question.type">
                            @for (type of questionTypes; track type.value) {
                              <option [value]="type.value">{{ type.label }}</option>
                            }
                          </select>
                        </div>
                        <div class="col-12 col-md-6 col-xl-3 d-flex align-items-end">
                          <div class="question-editor-card__actions">
                            <label class="form-check mb-0 question-editor-card__toggle">
                              <input class="form-check-input" type="checkbox" [(ngModel)]="question.required" />
                              <span class="form-check-label">Obligatoria</span>
                            </label>
                            <button type="button" class="btn btn-sm btn-outline-danger question-editor-card__remove" (click)="removeQuestionDraft(i)">Quitar</button>
                          </div>
                        </div>
                        <div class="col-12">
                          <label class="form-label">Ayuda / contexto</label>
                          <input class="form-control" [(ngModel)]="question.helperText" />
                        </div>
                        @if (question.type === 'single-select') {
                          <div class="col-12">
                            <label class="form-label">Opciones (separadas por coma)</label>
                            <input class="form-control" [(ngModel)]="question.optionsText" />
                          </div>
                        }
                      </div>
                    </div>
                  } @empty {
                    <div class="helper-box">Agrega al menos una pregunta al lote.</div>
                  }
                </div>

                <div class="d-flex justify-content-end gap-2 mt-3">
                  <button type="button" class="btn btn-theme" data-testid="work-test-batches-save-group" (click)="saveBatch()">Guardar grupo</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-xl-6">
          <div class="card adminuiux-card h-100">
            <div class="card-header d-flex align-items-center justify-content-between gap-2">
              <div>
                <h6 class="mb-0">Flujos del kanban</h6>
                <p class="text-secondary small mb-0">Relaciona una transicion del kanban con uno o varios grupos de preguntas.</p>
              </div>
              <button type="button" class="btn btn-sm btn-theme" data-testid="work-test-batches-new-flow" (click)="startNewFlow()">Nuevo flujo</button>
            </div>
            <div class="card-body">
              <div class="table-responsive mb-3">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Flujo</th>
                      <th style="width: 150px">Transicion</th>
                      <th style="width: 110px">Grupos</th>
                      <th class="text-end" style="width: 150px">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (flow of flowRules; track flow.id) {
                      <tr>
                        <td>
                          <div class="fw-semibold">{{ flow.name }}</div>
                          <small class="text-secondary">{{ flow.triggerMode === 'always' ? 'Siempre' : 'Solo prioridad alta' }} · {{ flow.requiredToContinue ? 'Bloquea paso' : 'Solo informativo' }}</small>
                        </td>
                        <td>
                          <span class="badge text-bg-light border">{{ resolveColumnLabel(flow.fromStatusId) }}</span>
                          <i class="bi bi-arrow-right mx-1"></i>
                          <span class="badge text-bg-light border">{{ resolveColumnLabel(flow.toStatusId) }}</span>
                        </td>
                        <td><span class="badge rounded-pill text-bg-primary">{{ flow.batchIds.length }}</span></td>
                        <td class="text-end">
                          <div class="d-flex justify-content-end gap-1">
                            <button type="button" class="btn btn-sm btn-outline-theme" (click)="editFlow(flow)">Editar</button>
                            <button type="button" class="btn btn-sm btn-outline-danger" (click)="deleteFlow(flow.id)">Borrar</button>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="4" class="text-center py-4 text-secondary">No hay flujos configurados.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="border rounded-4 p-3 bg-body-tertiary">
                <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h6 class="mb-1">{{ flowDraft.id ? 'Editar flujo' : 'Nuevo flujo' }}</h6>
                    <p class="text-secondary small mb-0">Ejemplo: si cambia de Diagnostico a Pedir componentes, exigir el lote correspondiente.</p>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline-secondary" data-testid="work-test-batches-clear-flow" (click)="startNewFlow()">Limpiar</button>
                </div>

                <div class="row gx-3 gy-3 mb-3">
                  <div class="col-12">
                    <label class="form-label">Nombre</label>
                    <input class="form-control" [(ngModel)]="flowDraft.name" />
                  </div>
                  <div class="col-12 col-lg-6">
                    <label class="form-label">Desde columna</label>
                    <select class="form-select" [(ngModel)]="flowDraft.fromStatusId">
                      <option value="">Selecciona una columna</option>
                      @for (column of boardColumns; track column.id) {
                        <option [value]="column.id">{{ column.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-12 col-lg-6">
                    <label class="form-label">Hacia columna</label>
                    <select class="form-select" [(ngModel)]="flowDraft.toStatusId">
                      <option value="">Selecciona una columna</option>
                      @for (column of boardColumns; track column.id) {
                        <option [value]="column.id">{{ column.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="col-12 col-lg-6">
                    <label class="form-label">Disparador</label>
                    <select class="form-select" [(ngModel)]="flowDraft.triggerMode">
                      <option value="always">Siempre</option>
                      <option value="only-high-priority">Solo prioridad alta</option>
                    </select>
                  </div>
                  <div class="col-12 col-lg-6 d-flex align-items-end">
                    <div class="flow-flags-row">
                      <label class="form-check mb-0 flow-flag">
                        <input class="form-check-input" type="checkbox" [(ngModel)]="flowDraft.requiredToContinue" />
                        <span class="form-check-label">Obligatorio para continuar</span>
                      </label>
                      <label class="form-check mb-0 flow-flag">
                        <input class="form-check-input" type="checkbox" [(ngModel)]="flowDraft.active" />
                        <span class="form-check-label">Flujo activo</span>
                      </label>
                    </div>
                  </div>
                </div>

                <label class="form-label">Grupos asignados</label>
                <div class="flow-batch-grid mb-3">
                  @for (batch of batches; track batch.id) {
                    <label class="flow-batch-option">
                      <input type="checkbox" [checked]="flowDraft.batchIds.includes(batch.id)" (change)="toggleFlowBatch(batch.id, $any($event.target).checked)" />
                      <span>{{ batch.name }}</span>
                    </label>
                  } @empty {
                    <div class="helper-box">Primero crea al menos un grupo de preguntas.</div>
                  }
                </div>

                <div class="d-flex justify-content-end gap-2">
                  <button type="button" class="btn btn-theme" data-testid="work-test-batches-save-flow" (click)="saveFlow()">Guardar flujo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .question-editor-list {
        display: grid;
        gap: 0.75rem;
      }

      .question-editor-card {
        border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
        border-radius: 1rem;
        padding: 1rem;
        background: rgba(var(--bs-body-bg-rgb), 0.88);
      }

      .batch-active-toggle,
      .question-editor-card__toggle,
      .flow-flag {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
        min-height: 2.75rem;
      }

      .question-editor-card__actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        width: 100%;
      }

      .question-editor-card__remove {
        margin-left: auto;
      }

      .flow-flags-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        width: 100%;
      }

      .flow-batch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.75rem;
      }

      .flow-batch-option {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.75rem 0.9rem;
        border-radius: 0.85rem;
        border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.1);
        background: rgba(var(--bs-body-bg-rgb), 0.92);
        min-width: 0;
      }

      .flow-batch-option span {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      @media (max-width: 1199.98px) {
        .question-editor-card__remove {
          margin-left: 0;
        }
      }

      @media (max-width: 767.98px) {
        .batch-active-toggle,
        .question-editor-card__toggle,
        .flow-flag {
          width: 100%;
        }
      }
    `,
  ],
})
export class WorkTestBatchesComponent implements OnInit, OnDestroy {
  readonly questionTypes = [
    { value: 'text', label: 'Texto libre' },
    { value: 'boolean', label: 'Si / No' },
    { value: 'number', label: 'Numero' },
    { value: 'single-select', label: 'Lista simple' },
  ] as const;

  batches: WorkTestBatch[] = [];
  flowRules: WorkTestFlowRule[] = [];
  boardColumns: BoardColumn[] = [];

  batchDraft: BatchDraft = this.createEmptyBatchDraft();
  flowDraft: FlowDraft = this.createEmptyFlowDraft();

  successMessage = '';
  errorMessage = '';

  private subscription?: Subscription;

  constructor(
    private readonly projectService: ProjectService,
    private readonly workTestBatchService: WorkTestBatchService,
  ) {}

  get activeBatchCount(): number {
    return this.batches.filter((batch) => batch.active).length;
  }

  get activeFlowCount(): number {
    return this.flowRules.filter((rule) => rule.active).length;
  }

  ngOnInit(): void {
    this.subscription = combineLatest([this.projectService.board$, this.workTestBatchService.state$]).subscribe({
      next: ([board, state]) => {
        this.boardColumns = [...(board?.columns ?? [])].sort((left, right) => left.order - right.order);
        this.batches = [...state.batches].sort((left, right) => left.name.localeCompare(right.name));
        this.flowRules = [...state.flowRules].sort((left, right) => left.name.localeCompare(right.name));
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  startNewBatch(): void {
    this.batchDraft = this.createEmptyBatchDraft();
    this.clearMessages();
  }

  addQuestionDraft(): void {
    this.batchDraft.questions = [...this.batchDraft.questions, this.createEmptyQuestionDraft()];
  }

  removeQuestionDraft(index: number): void {
    this.batchDraft.questions = this.batchDraft.questions.filter((_, currentIndex) => currentIndex !== index);
  }

  editBatch(batch: WorkTestBatch): void {
    this.batchDraft = {
      id: batch.id,
      name: batch.name,
      description: batch.description,
      active: batch.active,
      questions: batch.questions.map((question) => ({
        id: question.id,
        label: question.label,
        type: question.type,
        required: question.required,
        helperText: question.helperText,
        optionsText: (question.options ?? []).map((option) => option.label).join(', '),
      })),
    };
    this.clearMessages();
  }

  saveBatch(): void {
    this.clearMessages();
    const name = this.batchDraft.name.trim();
    const questions = this.batchDraft.questions
      .map((question) => this.toQuestion(question))
      .filter((question): question is WorkTestQuestion => !!question);

    if (!name) {
      this.errorMessage = 'El grupo debe tener un nombre.';
      return;
    }

    if (!questions.length) {
      this.errorMessage = 'Agrega al menos una pregunta valida al grupo.';
      return;
    }

    this.workTestBatchService.upsertBatch({
      id: this.batchDraft.id,
      name,
      description: this.batchDraft.description,
      active: this.batchDraft.active,
      questions,
    });

    this.successMessage = 'Grupo de preguntas guardado correctamente.';
    this.startNewBatch();
  }

  deleteBatch(batchId: string): void {
    this.workTestBatchService.deleteBatch(batchId);
    this.successMessage = 'Grupo eliminado correctamente.';
    if (this.batchDraft.id === batchId) {
      this.startNewBatch();
    }
  }

  startNewFlow(): void {
    this.flowDraft = this.createEmptyFlowDraft();
    this.clearMessages();
  }

  editFlow(flow: WorkTestFlowRule): void {
    this.flowDraft = {
      id: flow.id,
      name: flow.name,
      fromStatusId: flow.fromStatusId,
      toStatusId: flow.toStatusId,
      batchIds: [...flow.batchIds],
      requiredToContinue: flow.requiredToContinue,
      triggerMode: flow.triggerMode,
      active: flow.active,
    };
    this.clearMessages();
  }

  toggleFlowBatch(batchId: string, checked: boolean): void {
    this.flowDraft.batchIds = checked
      ? [...new Set([...this.flowDraft.batchIds, batchId])]
      : this.flowDraft.batchIds.filter((id) => id !== batchId);
  }

  saveFlow(): void {
    this.clearMessages();

    if (!this.flowDraft.name.trim()) {
      this.errorMessage = 'El flujo debe tener un nombre.';
      return;
    }

    if (!this.flowDraft.fromStatusId || !this.flowDraft.toStatusId) {
      this.errorMessage = 'Selecciona una columna origen y una destino.';
      return;
    }

    if (this.flowDraft.fromStatusId === this.flowDraft.toStatusId) {
      this.errorMessage = 'El flujo debe cambiar entre columnas distintas.';
      return;
    }

    if (!this.flowDraft.batchIds.length) {
      this.errorMessage = 'Selecciona al menos un grupo para el flujo.';
      return;
    }

    this.workTestBatchService.upsertFlowRule({
      id: this.flowDraft.id,
      name: this.flowDraft.name,
      fromStatusId: this.flowDraft.fromStatusId,
      toStatusId: this.flowDraft.toStatusId,
      batchIds: this.flowDraft.batchIds,
      requiredToContinue: this.flowDraft.requiredToContinue,
      triggerMode: this.flowDraft.triggerMode,
      active: this.flowDraft.active,
    });

    this.successMessage = 'Flujo guardado correctamente.';
    this.startNewFlow();
  }

  deleteFlow(flowId: string): void {
    this.workTestBatchService.deleteFlowRule(flowId);
    this.successMessage = 'Flujo eliminado correctamente.';
    if (this.flowDraft.id === flowId) {
      this.startNewFlow();
    }
  }

  getFlowCountForBatch(batchId: string): number {
    return this.flowRules.filter((rule) => rule.batchIds.includes(batchId)).length;
  }

  resolveColumnLabel(columnId: string): string {
    return this.boardColumns.find((column) => column.id === columnId)?.name ?? columnId;
  }

  private createEmptyBatchDraft(): BatchDraft {
    return {
      name: '',
      description: '',
      active: true,
      questions: [this.createEmptyQuestionDraft()],
    };
  }

  private createEmptyQuestionDraft(): QuestionDraft {
    return {
      label: '',
      type: 'text',
      required: true,
      helperText: '',
      optionsText: '',
    };
  }

  private createEmptyFlowDraft(): FlowDraft {
    return {
      name: '',
      fromStatusId: '',
      toStatusId: '',
      batchIds: [],
      requiredToContinue: true,
      triggerMode: 'always',
      active: true,
    };
  }

  private toQuestion(draft: QuestionDraft): WorkTestQuestion | null {
    const label = draft.label.trim();
    if (!label) {
      return null;
    }

    const options = draft.type === 'single-select'
      ? draft.optionsText
          .split(',')
          .map((option) => option.trim())
          .filter(Boolean)
          .map((option, index) => ({
            id: draft.id ? `${draft.id}-option-${index + 1}` : `option-${Date.now()}-${index + 1}`,
            label: option,
          }))
      : [];

    if (draft.type === 'single-select' && options.length === 0) {
      return null;
    }

    return {
      id: draft.id ?? `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label,
      type: draft.type,
      required: draft.required,
      helperText: draft.helperText.trim(),
      options,
    };
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}