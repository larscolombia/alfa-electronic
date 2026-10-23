import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskPriority } from '../../models';
import { HrPeoplePickerService } from '../../../../../services/hr-people-picker.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-{{ isEditMode ? 'pencil' : 'plus-circle' }} me-2"></i>
              {{ isEditMode ? 'Editar Tarea' : 'Nueva Tarea' }}
            </h5>
            <button 
              type="button" 
              class="btn-close" 
              (click)="onCancel.emit()"
              aria-label="Close"
            ></button>
          </div>

          <div class="modal-body">
            <form #taskForm="ngForm">
              <!-- Title -->
              <div class="mb-3">
                <label for="taskTitle" class="form-label">
                  Título <span class="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="taskTitle"
                  [(ngModel)]="formData.title"
                  name="title"
                  required
                  placeholder="Ingrese el título de la tarea"
                >
              </div>

              <!-- Description -->
              <div class="mb-3">
                <label for="taskDescription" class="form-label">
                  Descripción
                </label>
                <textarea 
                  class="form-control" 
                  id="taskDescription"
                  [(ngModel)]="formData.description"
                  name="description"
                  rows="3"
                  placeholder="Describa los detalles de la tarea"
                ></textarea>
              </div>

              <!-- Priority & Assignee Row -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="taskPriority" class="form-label">
                    Prioridad
                  </label>
                  <select 
                    class="form-select" 
                    id="taskPriority"
                    [(ngModel)]="formData.priority"
                    name="priority"
                  >
                    <option [value]="TaskPriority.LOW">Baja</option>
                    <option [value]="TaskPriority.MEDIUM">Media</option>
                    <option [value]="TaskPriority.HIGH">Alta</option>
                    <option [value]="TaskPriority.CRITICAL">Crítica</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label for="taskAssignee" class="form-label">
                    Asignado a
                  </label>
                  <!-- Fase 6: el responsable sale de RRHH (hr_employees activos).
                       El valor ya guardado se incluye aunque ese empleado hoy esté
                       inactivo, para no dejar la tarea sin responsable visible. -->
                  <select
                    class="form-select"
                    id="taskAssignee"
                    [(ngModel)]="formData.assignee"
                    name="assignee"
                  >
                    <option value="">Selecciona un responsable</option>
                    <option *ngFor="let person of assigneeOptions" [value]="person">{{ person }}</option>
                  </select>
                </div>
              </div>

              <!-- Due Date & Estimated Hours Row -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="taskDueDate" class="form-label">
                    Fecha límite
                  </label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="taskDueDate"
                    [(ngModel)]="dueDateString"
                    name="dueDate"
                  >
                </div>

                <div class="col-md-6">
                  <label for="taskEstimatedHours" class="form-label">
                    Horas estimadas
                  </label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="taskEstimatedHours"
                    [(ngModel)]="formData.estimatedHours"
                    name="estimatedHours"
                    min="0"
                    step="0.5"
                    placeholder="0"
                  >
                </div>
              </div>

              <!-- Tags -->
              <div class="mb-3">
                <label for="taskTags" class="form-label">
                  Etiquetas
                  <small class="text-muted">(separadas por comas)</small>
                </label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="taskTags"
                  [(ngModel)]="tagsString"
                  name="tags"
                  placeholder="ej: diseño, frontend, urgente"
                >
              </div>

              <!-- Completed (only in edit mode) -->
              <div class="mb-3" *ngIf="isEditMode">
                <div class="form-check">
                  <input 
                    type="checkbox" 
                    class="form-check-input" 
                    id="taskCompleted"
                    [(ngModel)]="formData.completed"
                    name="completed"
                  >
                  <label class="form-check-label" for="taskCompleted">
                    Tarea completada
                  </label>
                </div>

                <!-- Actual Hours (only if completed) -->
                <div class="mt-2" *ngIf="formData.completed">
                  <label for="taskActualHours" class="form-label">
                    Horas reales trabajadas
                  </label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="taskActualHours"
                    [(ngModel)]="formData.actualHours"
                    name="actualHours"
                    min="0"
                    step="0.5"
                    placeholder="0"
                  >
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              (click)="onCancel.emit()"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              (click)="handleSave()"
              [disabled]="!formData.title"
            >
              <i class="bi bi-check-lg me-1"></i>
              {{ isEditMode ? 'Guardar Cambios' : 'Crear Tarea' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal.show {
      display: block;
    }

    .modal-content {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .form-label {
      font-weight: 500;
      color: var(--bs-body-color);
    }

    .form-control:focus,
    .form-select:focus {
      border-color: var(--adminuiux-theme-1);
      box-shadow: 0 0 0 0.25rem rgba(var(--adminuiux-theme-1-rgb), 0.25);
    }
  `]
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() projectId!: string;
  
  @Output() onSave = new EventEmitter<Partial<Task>>();
  @Output() onCancel = new EventEmitter<void>();

  TaskPriority = TaskPriority;

  formData: Partial<Task> = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    assignee: '',
    dueDate: undefined,
    estimatedHours: undefined,
    actualHours: undefined,
    tags: [],
    completed: false
  };

  dueDateString = '';
  tagsString = '';

  private readonly hrPeople = inject(HrPeoplePickerService);
  /** Fase 6: empleados activos de RRHH para el select de responsable. */
  peopleNames: string[] = [];

  get assigneeOptions(): string[] {
    return this.hrPeople.merge(this.peopleNames, this.formData.assignee);
  }

  get isEditMode(): boolean {
    return !!this.task;
  }

  ngOnInit() {
    // Fase 6: el responsable se elige entre empleados reales de RRHH.
    // Contexto tecnica: tareas de trabajo dentro del proyecto son de técnicos,
    // no de comerciales.
    void this.hrPeople.refresh('tecnica').then((names) => {
      this.peopleNames = names;
    });
    if (this.task) {
      // Edit mode - populate form with task data
      this.formData = {
        title: this.task.title,
        description: this.task.description,
        priority: this.task.priority,
        assignee: this.task.assignee,
        dueDate: this.task.dueDate,
        estimatedHours: this.task.estimatedHours,
        actualHours: this.task.actualHours,
        tags: this.task.tags,
        completed: this.task.completed
      };

      if (this.task.dueDate) {
        this.dueDateString = this.formatDateForInput(this.task.dueDate);
      }

      if (this.task.tags && this.task.tags.length > 0) {
        this.tagsString = this.task.tags.join(', ');
      }
    }
  }

  handleSave() {
    if (!this.formData.title) return;

    // Parse due date
    if (this.dueDateString) {
      this.formData.dueDate = new Date(this.dueDateString);
    }

    // Parse tags
    if (this.tagsString.trim()) {
      this.formData.tags = this.tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    } else {
      this.formData.tags = [];
    }

    // Add projectId if creating new task
    if (!this.isEditMode) {
      this.formData.projectId = this.projectId;
      this.formData.createdBy = 'current-user'; // TODO: Get from auth service
    }

    this.onSave.emit(this.formData);
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
