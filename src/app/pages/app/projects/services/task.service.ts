import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task, TaskPriority, TaskFilter } from '../models';

/**
 * Task Service - Manages project tasks data and state
 * Handles CRUD operations and task-related business logic
 */
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  // State management
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private filterSubject = new BehaviorSubject<TaskFilter>({});
  public filter$ = this.filterSubject.asObservable();

  // Filtered tasks based on current filter
  public filteredTasks$ = combineLatest([this.tasks$, this.filter$]).pipe(
    map(([tasks, filter]) => this.applyFilter(tasks, filter))
  );

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with mock data for FASE 1
   */
  private initializeMockData() {
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        projectId: '1',
        title: 'Diseñar interfaz de usuario para checkout',
        description: 'Crear mockups y prototipos de la página de checkout',
        completed: true,
        priority: TaskPriority.HIGH,
        assignee: 'María García',
        dueDate: new Date('2026-04-20'),
        completedAt: new Date('2026-04-18'),
        completedBy: 'María García',
        estimatedHours: 16,
        actualHours: 14,
        tags: ['diseño', 'ui/ux'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-18'),
        order: 1
      },
      {
        id: 'task-2',
        projectId: '1',
        title: 'Implementar integración con pasarela de pago',
        description: 'Integrar API de Stripe para procesamiento de pagos',
        completed: true,
        priority: TaskPriority.CRITICAL,
        assignee: 'Carlos López',
        dueDate: new Date('2026-04-25'),
        completedAt: new Date('2026-04-24'),
        completedBy: 'Carlos López',
        estimatedHours: 24,
        actualHours: 28,
        tags: ['backend', 'api'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-24'),
        order: 2
      },
      {
        id: 'task-3',
        projectId: '1',
        title: 'Pruebas de seguridad del sistema de pagos',
        description: 'Realizar pruebas de penetración y validación de seguridad',
        completed: false,
        priority: TaskPriority.CRITICAL,
        assignee: 'Ana Martínez',
        dueDate: new Date('2026-04-28'),
        estimatedHours: 20,
        tags: ['testing', 'seguridad'],
        dependencies: ['task-2'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-12'),
        order: 3
      },
      {
        id: 'task-4',
        projectId: '1',
        title: 'Documentación técnica del API',
        description: 'Crear documentación completa del API de pagos',
        completed: false,
        priority: TaskPriority.MEDIUM,
        assignee: 'Juan Pérez',
        dueDate: new Date('2026-05-05'),
        estimatedHours: 12,
        tags: ['documentación'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-05'),
        updatedAt: new Date('2026-04-05'),
        order: 4
      },
      {
        id: 'task-5',
        projectId: '1',
        title: 'Implementar notificaciones de pago',
        description: 'Sistema de notificaciones por email y SMS para confirmación de pagos',
        completed: false,
        priority: TaskPriority.HIGH,
        assignee: 'María García',
        dueDate: new Date('2026-05-10'),
        estimatedHours: 16,
        tags: ['backend', 'notificaciones'],
        dependencies: ['task-2'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-08'),
        updatedAt: new Date('2026-04-08'),
        order: 5
      },
      {
        id: 'task-6',
        projectId: '1',
        title: 'Dashboard de análisis de transacciones',
        description: 'Crear dashboard para visualizar métricas de transacciones',
        completed: false,
        priority: TaskPriority.LOW,
        dueDate: new Date('2026-05-15'),
        estimatedHours: 20,
        tags: ['frontend', 'analytics'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-10'),
        updatedAt: new Date('2026-04-10'),
        order: 6
      },
      // Tasks for project 2
      {
        id: 'task-7',
        projectId: '2',
        title: 'Recopilación de datos financieros',
        description: 'Obtener todos los registros financieros del Q1',
        completed: true,
        priority: TaskPriority.HIGH,
        assignee: 'Laura Sánchez',
        dueDate: new Date('2026-04-15'),
        completedAt: new Date('2026-04-14'),
        completedBy: 'Laura Sánchez',
        estimatedHours: 8,
        actualHours: 10,
        tags: ['datos', 'finanzas'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-14'),
        order: 1
      },
      {
        id: 'task-8',
        projectId: '2',
        title: 'Análisis de estados financieros',
        description: 'Revisar y analizar balances y estados de resultados',
        completed: false,
        priority: TaskPriority.HIGH,
        assignee: 'Roberto Torres',
        dueDate: new Date('2026-04-25'),
        estimatedHours: 24,
        tags: ['análisis', 'finanzas'],
        dependencies: ['task-7'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-12'),
        order: 2
      },
      {
        id: 'task-9',
        projectId: '2',
        title: 'Preparación de informe final',
        description: 'Elaborar informe ejecutivo de auditoría',
        completed: false,
        priority: TaskPriority.MEDIUM,
        assignee: 'Laura Sánchez',
        dueDate: new Date('2026-05-01'),
        estimatedHours: 16,
        tags: ['documentación', 'reporte'],
        dependencies: ['task-8'],
        createdBy: 'admin',
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
        order: 3
      }
    ];

    this.tasksSubject.next(mockTasks);
  }

  /**
   * Get tasks for a specific project
   */
  getTasksByProject(projectId: string): Observable<Task[]> {
    return this.tasks$.pipe(
      map(tasks => tasks.filter(task => task.projectId === projectId))
    );
  }

  /**
   * Get a single task by ID
   */
  getTaskById(taskId: string): Observable<Task | undefined> {
    return this.tasks$.pipe(
      map(tasks => tasks.find(task => task.id === taskId))
    );
  }

  /**
   * Add a new task
   */
  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Observable<Task> {
    const tasks = this.tasksSubject.value;
    const projectTasks = tasks.filter(t => t.projectId === task.projectId);
    const maxOrder = projectTasks.length > 0 
      ? Math.max(...projectTasks.map(t => t.order))
      : 0;

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: maxOrder + 1
    };

    this.tasksSubject.next([...tasks, newTask]);
    return new Observable(observer => {
      observer.next(newTask);
      observer.complete();
    });
  }

  /**
   * Update an existing task
   */
  updateTask(taskId: string, updates: Partial<Task>): Observable<Task | null> {
    const tasks = this.tasksSubject.value;
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };

    const newTasks = [...tasks];
    newTasks[taskIndex] = updatedTask;
    this.tasksSubject.next(newTasks);

    return new Observable(observer => {
      observer.next(updatedTask);
      observer.complete();
    });
  }

  /**
   * Toggle task completion status
   */
  toggleTaskCompletion(taskId: string, completedBy: string): Observable<Task | null> {
    const tasks = this.tasksSubject.value;
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    const updates: Partial<Task> = {
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : undefined,
      completedBy: !task.completed ? completedBy : undefined
    };

    return this.updateTask(taskId, updates);
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): Observable<boolean> {
    const tasks = this.tasksSubject.value;
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    
    if (filteredTasks.length === tasks.length) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    this.tasksSubject.next(filteredTasks);
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Reorder tasks
   */
  reorderTasks(projectId: string, taskIds: string[]): void {
    const tasks = this.tasksSubject.value;
    const updatedTasks = tasks.map(task => {
      if (task.projectId === projectId) {
        const newOrder = taskIds.indexOf(task.id);
        return newOrder !== -1 ? { ...task, order: newOrder } : task;
      }
      return task;
    });

    this.tasksSubject.next(updatedTasks);
  }

  /**
   * Calculate project progress based on completed tasks
   */
  calculateProjectProgress(projectId: string): Observable<{ completed: number; total: number; progress: number }> {
    return this.getTasksByProject(projectId).pipe(
      map(tasks => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { completed, total, progress };
      })
    );
  }

  /**
   * Apply filter to tasks
   */
  private applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    return tasks.filter(task => {
      if (filter.completed !== undefined && task.completed !== filter.completed) {
        return false;
      }

      if (filter.priority && task.priority !== filter.priority) {
        return false;
      }

      if (filter.assignee && task.assignee !== filter.assignee) {
        return false;
      }

      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }

  /**
   * Set filter
   */
  setFilter(filter: TaskFilter): void {
    this.filterSubject.next(filter);
  }

  /**
   * Clear filter
   */
  clearFilter(): void {
    this.filterSubject.next({});
  }

  /**
   * Get task statistics for a project
   */
  getTaskStatistics(projectId: string): Observable<{
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
    byPriority: Record<TaskPriority, number>;
    totalEstimatedHours: number;
    totalActualHours: number;
  }> {
    return this.getTasksByProject(projectId).pipe(
      map(tasks => {
        const now = new Date();
        const completed = tasks.filter(t => t.completed).length;
        const inProgress = tasks.filter(t => !t.completed).length;
        const overdue = tasks.filter(t => 
          !t.completed && t.dueDate && new Date(t.dueDate) < now
        ).length;

        const byPriority = {
          [TaskPriority.LOW]: tasks.filter(t => t.priority === TaskPriority.LOW).length,
          [TaskPriority.MEDIUM]: tasks.filter(t => t.priority === TaskPriority.MEDIUM).length,
          [TaskPriority.HIGH]: tasks.filter(t => t.priority === TaskPriority.HIGH).length,
          [TaskPriority.CRITICAL]: tasks.filter(t => t.priority === TaskPriority.CRITICAL).length
        };

        const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

        return {
          total: tasks.length,
          completed,
          inProgress,
          overdue,
          byPriority,
          totalEstimatedHours,
          totalActualHours
        };
      })
    );
  }
}
