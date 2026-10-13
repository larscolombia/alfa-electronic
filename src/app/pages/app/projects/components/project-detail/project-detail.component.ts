import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Project, Task } from '../../models';
import { ProjectService, TaskService } from '../../services';
import { TaskListComponent } from '../task-list/task-list.component';
import { TaskFormComponent } from '../task-form/task-form.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, TaskListComponent, TaskFormComponent],
  template: `
    <div class="project-detail" *ngIf="project">
      <!-- Header -->
      <div class="project-detail__header mb-4">
        <div class="d-flex align-items-start justify-content-between mb-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="project-icon">
                <i class="bi bi-{{ project.icon || 'briefcase' }}"></i>
              </div>
              <div>
                <h3 class="mb-1">{{ project.title }}</h3>
                <span class="badge" [class]="getStatusClass(project.status)">
                  {{ getStatusLabel(project.status) }}
                </span>
              </div>
            </div>
            <p class="text-muted mb-0" *ngIf="project.description">
              {{ project.description }}
            </p>
          </div>
        </div>

        <!-- Project Stats -->
        <div class="row g-3">
          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-card__icon bg-primary">
                <i class="bi bi-list-check"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">{{ project.totalTasks || 0 }}</div>
                <div class="stat-card__label">Total Tareas</div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-card__icon bg-success">
                <i class="bi bi-check-circle"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">{{ project.completedTasks || 0 }}</div>
                <div class="stat-card__label">Completadas</div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-card__icon bg-warning">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">{{ taskStats?.inProgress || 0 }}</div>
                <div class="stat-card__label">En Progreso</div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-6">
            <div class="stat-card">
              <div class="stat-card__icon bg-danger">
                <i class="bi bi-exclamation-triangle"></i>
              </div>
              <div class="stat-card__content">
                <div class="stat-card__value">{{ taskStats?.overdue || 0 }}</div>
                <div class="stat-card__label">Vencidas</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Overall Progress -->
        <div class="mt-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>Progreso General del Proyecto</strong>
            <span class="badge bg-primary">{{ project.progress || 0 }}%</span>
          </div>
          <div class="progress" style="height: 12px;">
            <div 
              class="progress-bar bg-success" 
              role="progressbar" 
              [style.width.%]="project.progress || 0"
              [attr.aria-valuenow]="project.progress || 0" 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>

      <!-- Task List -->
      <app-task-list
        [tasks]="tasks"
        (onToggleTask)="handleToggleTask($event)"
        (onEditTask)="handleEditTask($event)"
        (onDeleteTask)="handleDeleteTask($event)"
        (onAddTask)="handleAddTask()"
      ></app-task-list>

      <!-- Task Form Modal -->
      <app-task-form
        *ngIf="showTaskForm"
        [task]="selectedTask"
        [projectId]="project.id"
        (onSave)="handleSaveTask($event)"
        (onCancel)="closeTaskForm()"
      ></app-task-form>

      <!-- Delete Confirmation Modal -->
      <div 
        *ngIf="taskToDelete" 
        class="modal fade show d-block" 
        tabindex="-1" 
        style="background: rgba(0,0,0,0.5);"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-exclamation-triangle text-warning me-2"></i>
                Confirmar Eliminación
              </h5>
              <button 
                type="button" 
                class="btn-close" 
                (click)="cancelDelete()"
              ></button>
            </div>
            <div class="modal-body">
              <p>¿Está seguro que desea eliminar la tarea <strong>"{{ taskToDelete.title }}"</strong>?</p>
              <p class="text-muted mb-0">Esta acción no se puede deshacer.</p>
            </div>
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="cancelDelete()"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-danger" 
                (click)="confirmDelete()"
              >
                <i class="bi bi-trash me-1"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="!project && !loading" class="text-center py-5">
      <i class="bi bi-inbox display-1 text-muted"></i>
      <p class="text-muted mt-3">Proyecto no encontrado</p>
    </div>

    <div *ngIf="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
  `,
  styles: [`
    .project-detail {
      background: var(--bs-body-bg);
    }

    .project-detail__header {
      background: linear-gradient(135deg, rgba(var(--adminuiux-theme-1-rgb), 0.08), rgba(var(--adminuiux-theme-accent-1-rgb), 0.12));
      padding: 1.5rem;
      border-radius: 1rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
    }

    .project-icon {
      width: 3rem;
      height: 3rem;
      display: grid;
      place-items: center;
      border-radius: 0.75rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.14);
      color: var(--adminuiux-theme-1);
      font-size: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.8);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      border-radius: 0.75rem;
      transition: all 0.2s ease;
    }

    .stat-card:hover {
      border-color: rgba(var(--adminuiux-theme-1-rgb), 0.2);
      box-shadow: 0 2px 8px rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .stat-card__icon {
      width: 2.5rem;
      height: 2.5rem;
      display: grid;
      place-items: center;
      border-radius: 0.5rem;
      color: white;
      font-size: 1.25rem;
    }

    .stat-card__value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--bs-body-color);
      line-height: 1;
    }

    .stat-card__label {
      font-size: 0.85rem;
      color: rgba(var(--bs-body-color-rgb), 0.7);
      margin-top: 0.25rem;
    }

    .badge {
      padding: 0.35rem 0.75rem;
      font-weight: 500;
    }

    .status-backlog {
      background-color: #64748b;
    }

    .status-in-progress {
      background-color: #3b82f6;
    }

    .status-review {
      background-color: #f59e0b;
    }

    .status-completed {
      background-color: #10b981;
    }

    @media (max-width: 767.98px) {
      .stat-card {
        padding: 0.75rem;
      }

      .stat-card__icon {
        width: 2rem;
        height: 2rem;
        font-size: 1rem;
      }

      .stat-card__value {
        font-size: 1.25rem;
      }

      .stat-card__label {
        font-size: 0.75rem;
      }
    }
  `]
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  @Input() projectId?: string;

  project: Project | null = null;
  tasks: Task[] = [];
  taskStats: any = null;
  loading = true;
  
  showTaskForm = false;
  selectedTask: Task | null = null;
  taskToDelete: Task | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    // Get project ID from route or input
    const id = this.projectId || this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.loadProject(id);
      this.loadTasks(id);
      this.loadTaskStats(id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProject(id: string) {
    this.projectService.getProjectWithTasks(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.project = project || null;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private loadTasks(projectId: string) {
    this.taskService.getTasksByProject(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
        }
      });
  }

  private loadTaskStats(projectId: string) {
    this.taskService.getTaskStatistics(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.taskStats = stats;
        }
      });
  }

  handleToggleTask(task: Task) {
    this.taskService.toggleTaskCompletion(task.id, 'current-user')
      .subscribe({
        next: () => {
          // Tasks will update automatically through observables
          if (this.projectId) {
            this.loadTaskStats(this.projectId);
          }
        }
      });
  }

  handleEditTask(task: Task) {
    this.selectedTask = task;
    this.showTaskForm = true;
  }

  handleDeleteTask(task: Task) {
    this.taskToDelete = task;
  }

  handleAddTask() {
    this.selectedTask = null;
    this.showTaskForm = true;
  }

  handleSaveTask(taskData: Partial<Task>) {
    if (this.selectedTask) {
      // Update existing task
      this.taskService.updateTask(this.selectedTask.id, taskData)
        .subscribe({
          next: () => {
            this.closeTaskForm();
            if (this.projectId) {
              this.loadTaskStats(this.projectId);
            }
          }
        });
    } else {
      // Create new task
      this.taskService.addTask(taskData as any)
        .subscribe({
          next: () => {
            this.closeTaskForm();
            if (this.projectId) {
              this.loadTaskStats(this.projectId);
            }
          }
        });
    }
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.selectedTask = null;
  }

  confirmDelete() {
    if (this.taskToDelete) {
      this.taskService.deleteTask(this.taskToDelete.id)
        .subscribe({
          next: () => {
            this.cancelDelete();
            if (this.projectId) {
              this.loadTaskStats(this.projectId);
            }
          }
        });
    }
  }

  cancelDelete() {
    this.taskToDelete = null;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'backlog': 'Backlog',
      'in-progress': 'En Progreso',
      'review': 'En Revisión',
      'completed': 'Completado'
    };
    return labels[status] || status;
  }
}
