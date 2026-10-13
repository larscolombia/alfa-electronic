import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task, TaskPriority, Project } from '../projects/models';
import { TaskService, ProjectService } from '../projects/services';
import { TaskListComponent } from '../projects/components/task-list/task-list.component';
import { TaskFormComponent } from '../projects/components/task-form/task-form.component';

interface TasksByProject {
  project: Project;
  tasks: Task[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
}

@Component({
  selector: 'app-work-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskListComponent, TaskFormComponent],
  template: `
    <div class="tasks-view">
      <!-- Header -->
      <div class="tasks-header">
        <div class="tasks-header__content">
          <div class="tasks-header__identity">
            <div class="tasks-header__icon-wrap">
              <i class="bi bi-check2-square tasks-header__icon"></i>
            </div>

            <div>
              <h4 class="mb-0">Gestión de Tareas</h4>
              <small class="tasks-header__subtitle">
                Vista consolidada de todas las tareas en tus proyectos
              </small>
            </div>
          </div>

          <div class="tasks-header__stats">
            <div class="task-stat-pill">
              <span class="task-stat-pill__label">Total</span>
              <strong>{{ totalStats.total }}</strong>
            </div>
            <div class="task-stat-pill task-stat-pill--pending">
              <span class="task-stat-pill__label">Pendientes</span>
              <strong>{{ totalStats.pending }}</strong>
            </div>
            <div class="task-stat-pill task-stat-pill--completed">
              <span class="task-stat-pill__label">Completadas</span>
              <strong>{{ totalStats.completed }}</strong>
            </div>
            <div class="task-stat-pill task-stat-pill--overdue">
              <span class="task-stat-pill__label">Vencidas</span>
              <strong>{{ totalStats.overdue }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="tasks-filters mb-4">
        <div class="tasks-filters__group">
          <label class="tasks-filters__label">
            <i class="bi bi-funnel me-2"></i>
            Filtrar por:
          </label>

          <select 
            class="form-select form-select-sm tasks-filters__select"
            [(ngModel)]="filterProject"
            (change)="applyFilters()"
          >
            <option value="">Todos los proyectos</option>
            <option *ngFor="let project of projects" [value]="project.id">
              {{ project.title }}
            </option>
          </select>

          <select 
            class="form-select form-select-sm tasks-filters__select"
            [(ngModel)]="filterStatus"
            (change)="applyFilters()"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="completed">Completadas</option>
          </select>

          <select 
            class="form-select form-select-sm tasks-filters__select"
            [(ngModel)]="filterPriority"
            (change)="applyFilters()"
          >
            <option value="">Todas las prioridades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <button 
            class="btn btn-sm btn-outline-secondary"
            (click)="clearFilters()"
            *ngIf="filterProject || filterStatus || filterPriority"
          >
            <i class="bi bi-x-circle me-1"></i>
            Limpiar filtros
          </button>
        </div>

        <div class="tasks-filters__search">
          <input 
            type="text"
            class="form-control form-control-sm"
            placeholder="Buscar tareas..."
            [(ngModel)]="searchTerm"
            (input)="applyFilters()"
          >
          <i class="bi bi-search"></i>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="view-toggle mb-3">
        <div class="btn-group btn-group-sm" role="group">
          <input 
            type="radio" 
            class="btn-check" 
            name="viewMode" 
            id="view-grouped" 
            autocomplete="off"
            [checked]="viewMode === 'grouped'"
            (change)="viewMode = 'grouped'"
          >
          <label class="btn btn-outline-primary" for="view-grouped">
            <i class="bi bi-collection me-1"></i>
            Por Proyecto
          </label>

          <input 
            type="radio" 
            class="btn-check" 
            name="viewMode" 
            id="view-list" 
            autocomplete="off"
            [checked]="viewMode === 'list'"
            (change)="viewMode = 'list'"
          >
          <label class="btn btn-outline-primary" for="view-list">
            <i class="bi bi-list-ul me-1"></i>
            Lista Global
          </label>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <!-- Grouped View (By Project) -->
      <div *ngIf="!loading && viewMode === 'grouped'" class="tasks-grouped">
        <div 
          *ngFor="let group of filteredTasksByProject" 
          class="project-tasks-group mb-4"
        >
          <div class="project-tasks-group__header" (click)="navigateToProject(group.project.id)">
            <div class="d-flex align-items-center gap-2">
              <div class="project-tasks-group__icon">
                <i [class]="'bi ' + (group.project.icon || 'bi-briefcase')"></i>
              </div>
              <div>
                <h5 class="mb-0">{{ group.project.title }}</h5>
                <small class="text-muted">
                  {{ group.stats.completed }} de {{ group.stats.total }} completadas
                  <span class="ms-2 badge bg-primary">{{ group.project.progress || 0 }}%</span>
                </small>
              </div>
            </div>

            <div class="project-tasks-group__stats">
              <span class="badge bg-warning me-1" *ngIf="group.stats.pending > 0">
                {{ group.stats.pending }} pendientes
              </span>
              <span class="badge bg-danger" *ngIf="group.stats.overdue > 0">
                {{ group.stats.overdue }} vencidas
              </span>
            </div>
          </div>

          <app-task-list
            [tasks]="group.tasks"
            (onToggleTask)="handleToggleTask($event)"
            (onEditTask)="handleEditTask($event)"
            (onDeleteTask)="handleDeleteTask($event)"
            (onAddTask)="handleAddTaskToProject(group.project)"
          ></app-task-list>
        </div>

        <div *ngIf="filteredTasksByProject.length === 0" class="text-center text-muted py-5">
          <i class="bi bi-inbox display-4 d-block mb-3"></i>
          <p class="mb-0">No se encontraron tareas con los filtros aplicados</p>
        </div>
      </div>

      <!-- List View (Global) -->
      <div *ngIf="!loading && viewMode === 'list'" class="tasks-list-view">
        <app-task-list
          [tasks]="allFilteredTasks"
          (onToggleTask)="handleToggleTask($event)"
          (onEditTask)="handleEditTask($event)"
          (onDeleteTask)="handleDeleteTask($event)"
          (onAddTask)="showGlobalTaskCreation()"
        ></app-task-list>
      </div>

      <!-- Task Form Modal -->
      <app-task-form
        *ngIf="showTaskForm"
        [task]="selectedTask"
        [projectId]="selectedProjectId"
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

      <!-- Project Selection Modal (for global task creation) -->
      <div 
        *ngIf="showProjectSelection" 
        class="modal fade show d-block" 
        tabindex="-1" 
        style="background: rgba(0,0,0,0.5);"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-folder-plus me-2"></i>
                Seleccionar Proyecto
              </h5>
              <button 
                type="button" 
                class="btn-close" 
                (click)="closeProjectSelection()"
              ></button>
            </div>
            <div class="modal-body">
              <p class="text-muted">Seleccione el proyecto al que desea agregar la nueva tarea:</p>
              <div class="list-group">
                <button
                  *ngFor="let project of projects"
                  type="button"
                  class="list-group-item list-group-item-action d-flex align-items-center gap-2"
                  (click)="selectProjectForNewTask(project)"
                >
                  <i [class]="'bi ' + (project.icon || 'bi-briefcase')"></i>
                  <div class="flex-grow-1">
                    <div class="fw-semibold">{{ project.title }}</div>
                    <small class="text-muted">{{ project.totalTasks || 0 }} tareas</small>
                  </div>
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary" 
                (click)="closeProjectSelection()"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-view {
      min-height: 100%;
      padding: 1.5rem;
      background:
        radial-gradient(circle at top right, rgba(var(--adminuiux-theme-accent-1-rgb), 0.08), transparent 32%),
        linear-gradient(180deg, rgba(var(--adminuiux-theme-1-rgb), 0.04), transparent 28%),
        var(--bs-body-bg);
    }

    .tasks-header {
      background: linear-gradient(135deg, rgba(var(--adminuiux-theme-1-rgb), 0.08), rgba(var(--adminuiux-theme-accent-1-rgb), 0.12));
      padding: 1.5rem;
      border-radius: 1.25rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
      box-shadow: 0 1rem 2rem rgba(var(--adminuiux-theme-1-rgb), 0.08);
      margin-bottom: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .tasks-header__content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .tasks-header__identity {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tasks-header__icon-wrap {
      width: 3.25rem;
      height: 3.25rem;
      display: grid;
      place-items: center;
      border-radius: 1rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.14);
      color: var(--adminuiux-theme-1);
      box-shadow: inset 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.12);
      flex-shrink: 0;
    }

    .tasks-header__icon {
      font-size: 1.35rem;
    }

    h4 {
      font-weight: 600;
      color: var(--bs-body-color);
    }

    .tasks-header__subtitle {
      color: rgba(var(--bs-body-color-rgb), 0.72);
    }

    .tasks-header__stats {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .task-stat-pill {
      min-width: 7rem;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.72);
      box-shadow: inset 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.08);
      color: var(--bs-body-color);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .task-stat-pill--pending {
      background: rgba(var(--bs-warning-rgb), 0.1);
      border: 1px solid rgba(var(--bs-warning-rgb), 0.2);
    }

    .task-stat-pill--completed {
      background: rgba(var(--bs-success-rgb), 0.1);
      border: 1px solid rgba(var(--bs-success-rgb), 0.2);
    }

    .task-stat-pill--overdue {
      background: rgba(var(--bs-danger-rgb), 0.1);
      border: 1px solid rgba(var(--bs-danger-rgb), 0.2);
    }

    .task-stat-pill__label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(var(--bs-body-color-rgb), 0.55);
    }

    .tasks-filters {
      background: rgba(var(--bs-body-bg-rgb), 0.8);
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .tasks-filters__group {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex: 1;
      flex-wrap: wrap;
    }

    .tasks-filters__label {
      font-weight: 500;
      color: var(--bs-body-color);
      margin: 0;
      white-space: nowrap;
    }

    .tasks-filters__select {
      min-width: 180px;
    }

    .tasks-filters__search {
      position: relative;
      min-width: 250px;
    }

    .tasks-filters__search input {
      padding-left: 2.5rem;
    }

    .tasks-filters__search i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(var(--bs-body-color-rgb), 0.5);
    }

    .view-toggle {
      display: flex;
      justify-content: flex-end;
    }

    .project-tasks-group {
      background: rgba(var(--bs-body-bg-rgb), 0.8);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .project-tasks-group__header {
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, rgba(var(--adminuiux-theme-1-rgb), 0.06), rgba(var(--adminuiux-theme-accent-1-rgb), 0.08));
      border-bottom: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .project-tasks-group__header:hover {
      background: linear-gradient(135deg, rgba(var(--adminuiux-theme-1-rgb), 0.1), rgba(var(--adminuiux-theme-accent-1-rgb), 0.12));
    }

    .project-tasks-group__icon {
      width: 2.5rem;
      height: 2.5rem;
      display: grid;
      place-items: center;
      border-radius: 0.75rem;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.12);
      color: var(--adminuiux-theme-1);
      font-size: 1.25rem;
    }

    .project-tasks-group__stats {
      display: flex;
      gap: 0.5rem;
    }

    @media (max-width: 991.98px) {
      .tasks-view {
        padding: 1rem;
      }

      .tasks-header__content {
        flex-direction: column;
        align-items: flex-start;
      }

      .tasks-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .tasks-filters__group {
        flex-direction: column;
        align-items: stretch;
      }

      .tasks-filters__select,
      .tasks-filters__search {
        min-width: 100%;
      }
    }
  `]
})
export class WorkTasksComponent implements OnInit, OnDestroy {
  loading = true;
  viewMode: 'grouped' | 'list' = 'grouped';

  // Data
  projects: Project[] = [];
  allTasks: Task[] = [];
  tasksByProject: TasksByProject[] = [];
  filteredTasksByProject: TasksByProject[] = [];
  allFilteredTasks: Task[] = [];

  // Filters
  filterProject = '';
  filterStatus = '';
  filterPriority = '';
  searchTerm = '';

  // Stats
  totalStats = {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  };

  // Task management
  showTaskForm = false;
  selectedTask: Task | null = null;
  selectedProjectId = '';
  taskToDelete: Task | null = null;
  showProjectSelection = false;

  private destroy$ = new Subject<void>();

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    combineLatest([
      this.projectService.projectsWithTasks$,
      this.taskService.tasks$
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([projects, tasks]) => ({ projects, tasks }))
      )
      .subscribe({
        next: ({ projects, tasks }) => {
          this.projects = projects;
          this.allTasks = tasks;
          this.groupTasksByProject();
          this.calculateTotalStats();
          this.applyFilters();
          this.loading = false;
        }
      });
  }

  private groupTasksByProject() {
    this.tasksByProject = this.projects.map(project => {
      const projectTasks = this.allTasks.filter(t => t.projectId === project.id);
      const completed = projectTasks.filter(t => t.completed).length;
      const pending = projectTasks.filter(t => !t.completed).length;
      const overdue = projectTasks.filter(t => 
        !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
      ).length;

      return {
        project,
        tasks: projectTasks,
        stats: {
          total: projectTasks.length,
          completed,
          pending,
          overdue
        }
      };
    }).filter(group => group.tasks.length > 0);
  }

  private calculateTotalStats() {
    const now = new Date();
    this.totalStats = {
      total: this.allTasks.length,
      completed: this.allTasks.filter(t => t.completed).length,
      pending: this.allTasks.filter(t => !t.completed).length,
      overdue: this.allTasks.filter(t => 
        !t.completed && t.dueDate && new Date(t.dueDate) < now
      ).length
    };
  }

  applyFilters() {
    let filtered = [...this.tasksByProject];

    // Filter by project
    if (this.filterProject) {
      filtered = filtered.filter(group => group.project.id === this.filterProject);
    }

    // Filter tasks within each group
    filtered = filtered.map(group => {
      let tasks = [...group.tasks];

      // Filter by status
      if (this.filterStatus === 'pending') {
        tasks = tasks.filter(t => !t.completed);
      } else if (this.filterStatus === 'completed') {
        tasks = tasks.filter(t => t.completed);
      }

      // Filter by priority
      if (this.filterPriority) {
        tasks = tasks.filter(t => t.priority === this.filterPriority);
      }

      // Filter by search term
      if (this.searchTerm.trim()) {
        const search = this.searchTerm.toLowerCase();
        tasks = tasks.filter(t =>
          t.title.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.tags?.some(tag => tag.toLowerCase().includes(search))
        );
      }

      return {
        ...group,
        tasks,
        stats: {
          ...group.stats,
          total: tasks.length,
          completed: tasks.filter(t => t.completed).length,
          pending: tasks.filter(t => !t.completed).length
        }
      };
    }).filter(group => group.tasks.length > 0);

    this.filteredTasksByProject = filtered;

    // For list view - flatten all filtered tasks
    this.allFilteredTasks = filtered.flatMap(group => group.tasks);
  }

  clearFilters() {
    this.filterProject = '';
    this.filterStatus = '';
    this.filterPriority = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  handleToggleTask(task: Task) {
    this.taskService.toggleTaskCompletion(task.id, 'current-user').subscribe({
      next: () => {
        // Data will update automatically through observables
      }
    });
  }

  handleEditTask(task: Task) {
    this.selectedTask = task;
    this.selectedProjectId = task.projectId;
    this.showTaskForm = true;
  }

  handleDeleteTask(task: Task) {
    this.taskToDelete = task;
  }

  handleAddTaskToProject(project: Project) {
    this.selectedTask = null;
    this.selectedProjectId = project.id;
    this.showTaskForm = true;
  }

  showGlobalTaskCreation() {
    if (this.projects.length === 0) {
      alert('No hay proyectos disponibles. Cree un proyecto primero.');
      return;
    }
    this.showProjectSelection = true;
  }

  selectProjectForNewTask(project: Project) {
    this.selectedProjectId = project.id;
    this.selectedTask = null;
    this.showProjectSelection = false;
    this.showTaskForm = true;
  }

  closeProjectSelection() {
    this.showProjectSelection = false;
  }

  handleSaveTask(taskData: Partial<Task>) {
    if (this.selectedTask) {
      // Update existing task
      this.taskService.updateTask(this.selectedTask.id, taskData).subscribe({
        next: () => {
          this.closeTaskForm();
        }
      });
    } else {
      // Create new task
      this.taskService.addTask(taskData as any).subscribe({
        next: () => {
          this.closeTaskForm();
        }
      });
    }
  }

  closeTaskForm() {
    this.showTaskForm = false;
    this.selectedTask = null;
    this.selectedProjectId = '';
  }

  confirmDelete() {
    if (this.taskToDelete) {
      this.taskService.deleteTask(this.taskToDelete.id).subscribe({
        next: () => {
          this.cancelDelete();
        }
      });
    }
  }

  cancelDelete() {
    this.taskToDelete = null;
  }

  navigateToProject(projectId: string) {
    this.router.navigate(['/app/work-projects'], { 
      queryParams: { project: projectId } 
    });
  }
}
