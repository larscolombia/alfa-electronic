import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkTestBatch, WorkTestQuestion, WorkTestTransitionPrompt } from '../../work/work-test-batch.models';

@Component({
  selector: 'app-project-transition-check-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible && prompt) {
      <div class="scanner-backdrop" (click)="cancel.emit()">
        <div class="scanner-dialog project-transition-dialog" (click)="$event.stopPropagation()">
          <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
            <div>
              <h5 class="mb-1">Lote de pruebas del flujo</h5>
              <p class="text-secondary small mb-0">
                {{ projectTitle }} va de <strong>{{ fromStatusLabel }}</strong> a <strong>{{ toStatusLabel }}</strong>.
              </p>
            </div>

            <button type="button" class="btn-close" aria-label="Cerrar" (click)="cancel.emit()"></button>
          </div>

          <div class="alert alert-info border mb-3">
            Completa el lote de pruebas configurado para esta transicion antes de continuar.
          </div>

          <div class="transition-batch-list">
            @for (batch of prompt.batches; track batch.id) {
              <section class="transition-batch-card">
                <div class="transition-batch-card__header">
                  <div>
                    <h6 class="mb-1">{{ batch.name }}</h6>
                    <p class="text-secondary small mb-0">{{ batch.description || 'Sin descripcion operativa.' }}</p>
                  </div>
                  <span class="badge text-bg-light border">{{ batch.questions.length }} preguntas</span>
                </div>

                <div class="transition-question-list">
                  @for (question of batch.questions; track question.id) {
                    <label class="transition-question">
                      <span class="transition-question__label">
                        {{ question.label }}
                        @if (question.required) {
                          <small class="text-danger">*</small>
                        }
                      </span>

                      @switch (question.type) {
                        @case ('boolean') {
                          <select class="form-select" [(ngModel)]="answers[question.id]">
                            <option value="">Selecciona una opcion</option>
                            <option value="si">Si</option>
                            <option value="no">No</option>
                          </select>
                        }
                        @case ('number') {
                          <input class="form-control" type="number" [(ngModel)]="answers[question.id]" />
                        }
                        @case ('single-select') {
                          <select class="form-select" [(ngModel)]="answers[question.id]">
                            <option value="">Selecciona una opcion</option>
                            @for (option of question.options || []; track option.id) {
                              <option [value]="option.label">{{ option.label }}</option>
                            }
                          </select>
                        }
                        @default {
                          <textarea class="form-control" rows="2" [(ngModel)]="answers[question.id]"></textarea>
                        }
                      }

                      @if (question.helperText) {
                        <small class="text-secondary">{{ question.helperText }}</small>
                      }
                    </label>
                  }
                </div>
              </section>
            }
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button type="button" class="btn btn-outline-secondary" (click)="cancel.emit()">Cancelar</button>
            <button type="button" class="btn btn-theme" [disabled]="hasMissingRequiredAnswers()" (click)="submit()">Confirmar transicion</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .project-transition-dialog {
        max-width: 920px;
      }

      .transition-batch-list {
        display: grid;
        gap: 1rem;
      }

      .transition-batch-card {
        border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
        border-radius: 1rem;
        padding: 1rem;
        background: rgba(var(--bs-body-bg-rgb), 0.92);
      }

      .transition-batch-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .transition-question-list {
        display: grid;
        gap: 0.85rem;
      }

      .transition-question {
        display: grid;
        gap: 0.4rem;
      }

      .transition-question__label {
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--bs-body-color);
      }
    `,
  ],
})
export class ProjectTransitionCheckModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() prompt: WorkTestTransitionPrompt | null = null;
  @Input() projectTitle = '';
  @Input() fromStatusLabel = '';
  @Input() toStatusLabel = '';

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<Record<string, string>>();

  answers: Record<string, string> = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prompt']) {
      this.initializeAnswers();
    }
  }

  submit(): void {
    this.confirm.emit({ ...this.answers });
  }

  hasMissingRequiredAnswers(): boolean {
    return (this.prompt?.batches ?? []).some((batch) => batch.questions.some((question) => this.isMissing(question)));
  }

  private initializeAnswers(): void {
    const nextAnswers: Record<string, string> = {};
    for (const batch of this.prompt?.batches ?? []) {
      for (const question of batch.questions) {
        nextAnswers[question.id] = '';
      }
    }
    this.answers = nextAnswers;
  }

  private isMissing(question: WorkTestQuestion): boolean {
    if (!question.required) {
      return false;
    }

    return String(this.answers[question.id] ?? '').trim().length === 0;
  }
}