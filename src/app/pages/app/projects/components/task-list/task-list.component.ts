import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, TaskPriority } from '../../models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="task-list">
      <div class="task-list__header mb-3">
        <div class="d-flex align-items-center justify-content-between">
          <div>
            <h5 class="mb-1">
              <i class="bi bi-list-check me-2"></i>
              Tareas del Proyecto
            </h5>
            <small class="text-muted">
              {{ completedCount }} de {{ tasks.length }} completadas
              <span class="badge bg-primary ms-2">{{ progressPercentage }}%</span>
            </small>
          </div>
          <button 
            class="btn btn-sm btn-primary"
            (click)="onAddTask.emit()"
            type="button"
          >
            <i class="bi bi-plus-lg me-1"></i>
            Nueva Tarea
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress mt-3" style="height: 8px;">
          <div 
            class="progress-bar bg-success" 
            role="progressbar" 
            [style.width.%]="progressPercentage"
            [attr.aria-valuenow]="progressPercentage" 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>

        <!-- Filters -->
        <div class="task-filters mt-3">
          <div class="btn-group btn-group-sm" role="group">
            <input 
              type="radio" 
              class="btn-check" 
              name="taskFilter" 
              id="filter-all" 
              autocomplete="off"
              [checked]="filterMode === 'all'"
              (change)="filterMode = 'all'"
            >
            <label class="btn btn-outline-secondary" for="filter-all">
              Todas ({{ tasks.length }})
            </label>

            <input 
              type="radio" 
              class="btn-check" 
              name="taskFilter" 
              id="filter-pending" 
              autocomplete="off"
              [checked]="filterMode === 'pending'"
              (change)="filterMode = 'pending'"
            >
            <label class="btn btn-outline-warning" for="filter-pending">
              Pendientes ({{ pendingCount }})
            </label>

            <input 
              type="radio" 
              class="btn-check" 
              name="taskFilter" 
              id="filter-completed" 
              autocomplete="off"
              [checked]="filterMode === 'completed'"
              (change)="filterMode = 'completed'"
            >
            <label class="btn btn-outline-success" for="filter-completed">
              Completadas ({{ completedCount }})
            </label>
          </div>
        </div>
      </div>

      <!-- Task List -->
      <div class="task-items">
        <div 
          *ngFor="let task of filteredTasks; trackBy: trackByTaskId"
          class="task-item"
          [class.task-item--completed]="task.completed"
          [class.task-item--overdue]="isOverdue(task)"
        >
          <div class="task-item__checkbox">
            <input 
              type="checkbox" 
              class="form-check-input" 
              [checked]="task.completed"
              (change)="onToggleTask.emit(task)"
              [id]="'task-' + task.id"
            >
          </div>

          <div class="task-item__content" (click)="onEditTask.emit(task)">
            <div class="task-item__header">
              <label [for]="'task-' + task.id" class="task-item__title">
                {{ task.title }}
              </label>
              <span class="task-item__priority" [class]="getPriorityClass(task.priority)">
                {{ getPriorityLabel(task.priority) }}
              </span>
            </div>

            <div class="task-item__meta" *ngIf="task.description || task.assignee || task.dueDate">
              <small class="text-muted d-block" *ngIf="task.description">
                {{ task.description }}
              </small>
              <div class="d-flex gap-3 mt-1">
                <small *ngIf="task.assignee" class="text-muted">
                  <i class="bi bi-person me-1"></i>
                  {{ task.assignee }}
                </small>
                <small *ngIf="task.dueDate" class="text-muted">
                  <i class="bi bi-calendar me-1"></i>
                  {{ task.dueDate | date: 'dd/MM/yyyy' }}
                </small>
                <small *ngIf="task.estimatedHours" class="text-muted">
                  <i class="bi bi-clock me-1"></i>
                  {{ task.estimatedHours }}h
                </small>
              </div>
            </div>

            <div class="task-item__tags" *ngIf="task.tags && task.tags.length > 0">
              <span 
                *ngFor="let tag of task.tags" 
                class="badge bg-secondary me-1"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="task-item__actions">
            <button 
              class="btn btn-sm btn-ghost" 
              (click)="onEditTask.emit(task)"
              type="button"
              title="Editar tarea"
            >
              <i class="bi bi-pencil"></i>
            </button>
            <button 
              class="btn btn-sm btn-ghost text-danger" 
              (click)="onDeleteTask.emit(task)"
              type="button"
              title="Eliminar tarea"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div *ngIf="filteredTasks.length === 0" class="text-center text-muted py-5">
          <i class="bi bi-inbox display-4 d-block mb-3"></i>
          <p class="mb-0">
            {{ filterMode === 'all' ? 'No hay tareas en este proyecto' : 
               filterMode === 'pending' ? 'No hay tareas pendientes' : 
               'No hay tareas completadas' }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-list {
      background: var(--bs-body-bg);
      border-radius: 0.75rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      padding: 1.25rem;
    }

    .task-list__header h5 {
      font-weight: 600;
      color: var(--bs-body-color);
      margin-bottom: 0;
    }

    .task-filters {
      display: flex;
      gap: 0.5rem;
    }

    .task-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.5);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      border-radius: 0.5rem;
      transition: all 0.2s ease;
    }

    .task-item:hover {
      border-color: rgba(var(--adminuiux-theme-1-rgb), 0.2);
      box-shadow: 0 2px 8px rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .task-item--completed {
      opacity: 0.6;
    }

    .task-item--completed .task-item__title {
      text-decoration: line-through;
    }

    .task-item--overdue:not(.task-item--completed) {
      border-left: 3px solid var(--bs-danger);
    }

    .task-item__checkbox {
      padding-top: 0.25rem;
    }

    .form-check-input {
      cursor: pointer;
      width: 1.25rem;
      height: 1.25rem;
    }

    .task-item__content {
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }

    .task-item__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .task-item__title {
      font-weight: 500;
      color: var(--bs-body-color);
      margin-bottom: 0;
      cursor: pointer;
      flex: 1;
    }

    .task-item__priority {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .priority-low {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .priority-medium {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .priority-high {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .priority-critical {
      background: rgba(220, 38, 38, 0.15);
      color: #dc2626;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .task-item__meta small {
      font-size: 0.85rem;
    }

    .task-item__tags {
      margin-top: 0.5rem;
    }

    .task-item__tags .badge {
      font-size: 0.7rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
    }

    .task-item__actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .task-item:hover .task-item__actions {
      opacity: 1;
    }

    .btn-ghost {
      background: transparent;
      border: none;
      color: var(--bs-body-color);
      padding: 0.25rem 0.5rem;
    }

    .btn-ghost:hover {
      background: rgba(var(--adminuiux-theme-1-rgb), 0.1);
    }

    @media (max-width: 767.98px) {
      .task-item {
        flex-direction: column;
      }

      .task-item__actions {
        opacity: 1;
        width: 100%;
        justify-content: flex-end;
      }

      .task-filters {
        overflow-x: auto;
      }
    }
  `]
})
export class TaskListComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() showCompleted = true;
  
  @Output() onToggleTask = new EventEmitter<Task>();
  @Output() onEditTask = new EventEmitter<Task>();
  @Output() onDeleteTask = new EventEmitter<Task>();
  @Output() onAddTask = new EventEmitter<void>();

  filterMode: 'all' | 'pending' | 'completed' = 'all';
  filteredTasks: Task[] = [];

  ngOnInit() {
    this.updateFilteredTasks();
  }

  ngOnChanges() {
    this.updateFilteredTasks();
  }

  get completedCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }

  get pendingCount(): number {
    return this.tasks.filter(t => !t.completed).length;
  }

  get progressPercentage(): number {
    if (this.tasks.length === 0) return 0;
    return Math.round((this.completedCount / this.tasks.length) * 100);
  }

  updateFilteredTasks() {
    switch (this.filterMode) {
      case 'pending':
        this.filteredTasks = this.tasks.filter(t => !t.completed);
        break;
      case 'completed':
        this.filteredTasks = this.tasks.filter(t => t.completed);
        break;
      default:
        this.filteredTasks = [...this.tasks];
    }
    
    // Sort by order
    this.filteredTasks.sort((a, b) => a.order - b.order);
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  getPriorityClass(priority: TaskPriority): string {
    return `priority-${priority}`;
  }

  getPriorityLabel(priority: TaskPriority): string {
    const labels = {
      [TaskPriority.LOW]: 'Baja',
      [TaskPriority.MEDIUM]: 'Media',
      [TaskPriority.HIGH]: 'Alta',
      [TaskPriority.CRITICAL]: 'Crítica'
    };
    return labels[priority] || priority;
  }

  isOverdue(task: Task): boolean {
    if (task.completed || !task.dueDate) return false;
    return new Date(task.dueDate) < new Date();
  }
}
