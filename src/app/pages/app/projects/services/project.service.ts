import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest, from } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { BoardColumn, Project, ProjectBoard, PropertyType } from '../models';
import {
  PROJECT_WORKFLOW_STATUS_OPTIONS,
  buildTechnicalBoardColumns,
  buildTechnicalProjectBoard,
  getProjectTechnicalTestTypeLabel,
  getProjectWorkflowStatusLabel,
  mapLegacyProjectStatus,
} from '../project-workflow.config';
import {
  SlaConfigApiItem,
  applySlaConfigToColumns,
  buildSlaConfigApiPayload,
  slaConfigFromApiPayload,
} from '../project-sla.logic';
import { AuthService } from '../../../../services/auth.service';
import { resolveApiBaseUrl } from '../../../../services/api-base-url.util';
import { TaskService } from './task.service';

/**
 * Project Service - Manages projects data and state
 * Currently uses mock data, will be replaced with API calls
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private taskService = inject(TaskService);
  private readonly authService = inject(AuthService);
  private readonly apiBaseUrl = resolveApiBaseUrl();
  private readonly companyID = 'demo-company';
  private readonly boardStorageKey = 'lars.projects.board.v3';
  private readonly projectsStorageKey = 'lars.projects.items.v3';

  // State management
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  private boardSubject = new BehaviorSubject<ProjectBoard | null>(null);
  public board$ = this.boardSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  // Projects with task data enriched
  public projectsWithTasks$ = combineLatest([
    this.projects$,
    this.taskService.tasks$
  ]).pipe(
    map(([projects, tasks]) => {
      return projects.map(project => {
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const completedTasks = projectTasks.filter(t => t.completed).length;
        const totalTasks = projectTasks.length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...project,
          tasks: projectTasks,
          completedTasks,
          totalTasks,
          progress,
          properties: {
            ...project.properties,
            progress // Update progress property
          }
        };
      });
    })
  );

  constructor() {
    this.initializeState();
  }

  /**
   * Initialize persisted state or technical defaults.
   */
  private initializeState(): void {
    const board = this.restoreBoard();
    const projects = this.restoreProjects(board);

    this.boardSubject.next(board);
    this.projectsSubject.next(projects);
    void this.loadSlaConfigFromApi();
  }

  /**
   * Push the current board SLA thresholds to the backend so the semaphore
   * deadlines survive per company. Local state already saved remains the
   * offline fallback when the API is unreachable.
   */
  syncSlaConfigToApi(): Observable<void> {
    const board = this.boardSubject.value;
    if (!board) {
      return of(void 0);
    }

    const payload = buildSlaConfigApiPayload(board.columns);
    return from(
      this.slaApiRequest<SlaConfigApiItem[]>('/api/v1/projects/sla-config', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
    ).pipe(map(() => void 0));
  }

  /**
   * Try to load the SLA semaphore thresholds from the API and apply them to
   * the current board columns. Falls back silently to the local board when
   * the API does not respond with a usable config.
   */
  private async loadSlaConfigFromApi(): Promise<void> {
    try {
      const items = await this.slaApiRequest<SlaConfigApiItem[]>('/api/v1/projects/sla-config', { method: 'GET' });
      if (!Array.isArray(items) || items.length === 0) {
        return;
      }

      const config = slaConfigFromApiPayload(items);
      const board = this.boardSubject.value;
      if (!board) {
        return;
      }

      const columns = applySlaConfigToColumns(board.columns, config);
      const changed = columns.some((column, index) => column !== board.columns[index]);
      if (!changed) {
        return;
      }

      const nextBoard = { ...board, columns };
      this.boardSubject.next(nextBoard);
      this.persistBoard(nextBoard);
    } catch {
      // Offline or unauthenticated: keep the localStorage/default board.
    }
  }

  private async slaApiRequest<T>(path: string, init: RequestInit): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Company-Id', this.companyID);
    const accessToken = this.authService.getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${this.apiBaseUrl}${path}`, { ...init, headers });
    if (response.status === 401) {
      this.authService.markUnauthorized();
    }

    if (!response.ok) {
      throw new Error(`SLA config request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Load projects for a board
   */
  getBoardSnapshot(): ProjectBoard | null {
    const board = this.boardSubject.value;
    if (!board) {
      return null;
    }

    return {
      ...board,
      columns: board.columns.map((column) => ({ ...column })),
      propertyTemplates: board.propertyTemplates.map((template) => ({
        ...template,
        options: template.options?.map((option) => ({ ...option })) ?? [],
      })),
    };
  }

  loadProjects(boardId: string): Observable<Project[]> {
    this.loadingSubject.next(true);
    
    // Simulate API call
    return of(this.projectsSubject.value).pipe(
      delay(500),
      map(projects => {
        this.loadingSubject.next(false);
        return projects.filter(p => p.boardId === boardId);
      })
    );
  }

  /**
   * Get projects grouped by column
   */
  getProjectsByColumn(columnId: string): Observable<Project[]> {
    return this.projects$.pipe(
      map(projects => projects.filter(p => p.status === columnId))
    );
  }

  /**
   * Create a new board column
   */
  createBoardColumn(name: string, color: string, metadata?: Partial<BoardColumn>): Observable<BoardColumn> {
    const board = this.boardSubject.value;
    if (!board) {
      throw new Error('No board loaded');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Column name is required');
    }

    const existingIds = new Set(board.columns.map((column) => column.id));
    const newColumn: BoardColumn = {
      id: this.generateColumnId(trimmedName, existingIds),
      name: trimmedName,
      color,
      order: board.columns.length + 1,
      description: '',
      equipmentStatusId: '',
      equipmentStatusLabel: '',
      greenDays: 0,
      yellowDays: 0,
      includeInWorkload: true,
      trackAging: false,
      ...metadata,
    };

    this.updateBoardColumns([...board.columns, newColumn]);
    return of(newColumn).pipe(delay(150));
  }

  /**
   * Update board column metadata
   */
  updateBoardColumn(columnId: string, updates: Partial<BoardColumn>): Observable<BoardColumn> {
    const board = this.boardSubject.value;
    if (!board) {
      throw new Error('No board loaded');
    }

    const columns = [...board.columns];
    const columnIndex = columns.findIndex((column) => column.id === columnId);

    if (columnIndex === -1) {
      throw new Error('Column not found');
    }

    const current = columns[columnIndex];
    const nextName = updates.name?.trim();

    const updatedColumn: BoardColumn = {
      ...current,
      name: nextName && nextName.length ? nextName : current.name,
      color: updates.color ?? current.color,
      description: typeof updates.description === 'string' ? updates.description.trim() : current.description,
      equipmentStatusId: typeof updates.equipmentStatusId === 'string' ? updates.equipmentStatusId.trim() : current.equipmentStatusId,
      equipmentStatusLabel: typeof updates.equipmentStatusLabel === 'string' ? updates.equipmentStatusLabel.trim() : current.equipmentStatusLabel,
      greenDays: this.normalizeWholeNumber(updates.greenDays, current.greenDays ?? 0),
      yellowDays: this.normalizeWholeNumber(updates.yellowDays, current.yellowDays ?? 0),
      includeInWorkload: typeof updates.includeInWorkload === 'boolean' ? updates.includeInWorkload : current.includeInWorkload,
      trackAging: typeof updates.trackAging === 'boolean' ? updates.trackAging : current.trackAging,
    };

    columns[columnIndex] = updatedColumn;
    this.updateBoardColumns(columns);
    return of(updatedColumn).pipe(delay(150));
  }

  /**
   * Move a column in the desired direction while preserving sequence.
   */
  moveBoardColumn(columnId: string, direction: 'up' | 'down'): Observable<BoardColumn[]> {
    const board = this.boardSubject.value;
    if (!board) {
      throw new Error('No board loaded');
    }

    const columns = [...board.columns].sort((a, b) => a.order - b.order);
    const sourceIndex = columns.findIndex((column) => column.id === columnId);

    if (sourceIndex === -1) {
      throw new Error('Column not found');
    }

    const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) {
      return of(columns);
    }

    const [movingColumn] = columns.splice(sourceIndex, 1);
    columns.splice(targetIndex, 0, movingColumn);

    const normalized = this.normalizeBoardColumns(columns);
    this.updateBoardColumns(normalized);
    return of(normalized).pipe(delay(120));
  }

  /**
   * Create new project
   */
  createProject(
    columnId: string,
    title: string,
    description = '',
    options?: { icon?: string; initialProperties?: Record<string, any> },
  ): Observable<Project> {
    const board = this.boardSubject.value;
    if (!board) {
      throw new Error('No board loaded');
    }

    const seededProperties = options?.initialProperties ?? {};
    const seededProgress = Number(seededProperties['progress']);
    const normalizedSeededProgress = Number.isFinite(seededProgress)
      ? Math.max(0, Math.min(100, seededProgress))
      : 0;

    const newProject: Project = {
      id: `project-${Date.now()}`,
      title,
      description,
      icon: options?.icon ?? 'bi-briefcase',
      status: columnId,
      boardId: board.id,
      properties: {
        shortCode: this.generateShortCode(title),
        startDate: new Date(),
        stageEnteredAt: new Date().toISOString(),
        noDeadline: false,
        category: '',
        department: '',
        client: '',
        priority: 'medium',
        assignee: '',
        notes: '',
        diagnosticNotes: '',
        repairNotes: '',
        repairabilityPercent: 0,
        publicProject: false,
        members: [],
        currency: 'COP',
        budget: 0,
        estimatedHours: 0,
        actualHours: 0,
        testType: 'sin-pruebas',
        testTypeLabel: getProjectTechnicalTestTypeLabel('sin-pruebas'),
        allowManualTime: false,
        notifyClient: false,
        equipmentRecordId: '',
        equipmentItemId: '',
        equipmentProspectId: 0,
        equipmentProspectName: '',
        equipmentDisplayName: '',
        equipmentIdentifier: '',
        equipmentSerie: '',
        equipmentReceptionLabel: '',
        equipmentServiceType: '',
        equipmentFailureDescription: '',
        equipmentLocationId: '',
        equipmentLocationName: '',
        equipmentRepairStatus: 'recibido',
        equipmentRepairStatusLabel: 'Recibido',
        equipmentLinkedAt: '',
        equipmentLastScanAt: '',
        equipmentLastScanSource: '',
        equipmentLastWorkflowUpdate: '',
        ...seededProperties,
        progress: normalizedSeededProgress,
      },
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const currentProjects = this.projectsSubject.value;
    this.commitProjects([...currentProjects, this.syncProjectWithBoard(newProject, board, false)]);

    return of(newProject).pipe(delay(300));
  }

  /**
   * Move a project within or across columns while preserving visual order.
   */
  moveProject(projectId: string, targetStatus: string, targetIndex: number): Observable<Project> {
    const board = this.boardSubject.value;
    const projects = [...this.projectsSubject.value];
    const sourceIndex = projects.findIndex((project) => project.id === projectId);

    if (sourceIndex === -1) {
      throw new Error('Project not found');
    }

    const [projectToMove] = projects.splice(sourceIndex, 1);
    const updatedProject = this.syncProjectWithBoard({
      ...projectToMove,
      status: targetStatus,
      updatedAt: new Date(),
    }, board, projectToMove.status !== targetStatus);

    const targetColumnProjects = projects.filter((project) => project.status === targetStatus);
    const safeTargetIndex = Math.max(0, Math.min(targetIndex, targetColumnProjects.length));

    let insertIndex = projects.length;

    if (targetColumnProjects.length > 0) {
      if (safeTargetIndex === targetColumnProjects.length) {
        const previousProject = targetColumnProjects[targetColumnProjects.length - 1];
        insertIndex = projects.findIndex((project) => project.id === previousProject.id) + 1;
      } else {
        const nextProject = targetColumnProjects[safeTargetIndex];
        insertIndex = projects.findIndex((project) => project.id === nextProject.id);
      }
    }

    projects.splice(insertIndex, 0, updatedProject);
    this.commitProjects(projects);

    return of(updatedProject).pipe(delay(150));
  }

  /**
   * Update project status (move between columns)
   */
  updateProjectStatus(projectId: string, newStatus: string): Observable<Project> {
    const board = this.boardSubject.value;
    const projects = this.projectsSubject.value;
    const index = projects.findIndex(p => p.id === projectId);
    
    if (index === -1) {
      throw new Error('Project not found');
    }

    const updatedProject = this.syncProjectWithBoard({
      ...projects[index],
      status: newStatus,
      updatedAt: new Date()
    }, board, projects[index].status !== newStatus);

    const updatedProjects = [...projects];
    updatedProjects[index] = updatedProject;
    this.commitProjects(updatedProjects);

    return of(updatedProject).pipe(delay(200));
  }

  /**
   * Update project details
   */
  updateProject(projectId: string, updates: Partial<Project>): Observable<Project> {
    const board = this.boardSubject.value;
    const projects = this.projectsSubject.value;
    const index = projects.findIndex(p => p.id === projectId);
    
    if (index === -1) {
      throw new Error('Project not found');
    }

    const updatedProject = this.syncProjectWithBoard({
      ...projects[index],
      ...updates,
      updatedAt: new Date()
    }, board, updates.status !== undefined && updates.status !== projects[index].status);

    const updatedProjects = [...projects];
    updatedProjects[index] = updatedProject;
    this.commitProjects(updatedProjects);

    return of(updatedProject).pipe(delay(200));
  }

  /**
   * Update project property value
   */
  updateProperty(projectId: string, propertyId: string, value: any): Observable<Project> {
    const board = this.boardSubject.value;
    const projects = this.projectsSubject.value;
    const index = projects.findIndex(p => p.id === projectId);
    
    if (index === -1) {
      throw new Error('Project not found');
    }

    const updatedProject = this.syncProjectWithBoard({
      ...projects[index],
      properties: {
        ...projects[index].properties,
        [propertyId]: value
      },
      updatedAt: new Date()
    }, board, propertyId === 'stageEnteredAt');

    const updatedProjects = [...projects];
    updatedProjects[index] = updatedProject;
    this.commitProjects(updatedProjects);

    return of(updatedProject).pipe(delay(200));
  }

  /**
   * Delete project
   */
  deleteProject(projectId: string): Observable<void> {
    const projects = this.projectsSubject.value;
    const filtered = projects.filter(p => p.id !== projectId);
    this.commitProjects(filtered);

    return of(void 0).pipe(delay(200));
  }

  resetBoardToTechnicalDefaults(): Observable<ProjectBoard> {
    const board = this.buildDefaultBoard();
    const projects = this.reconcileProjectsWithBoard(this.projectsSubject.value, board);
    this.boardSubject.next(board);
    this.projectsSubject.next(projects);
    this.persistBoard(board);
    this.persistProjects(projects);

    return of(board).pipe(delay(150));
  }

  /**
   * Get single project
   */
  getProject(projectId: string): Observable<Project | undefined> {
    return this.projects$.pipe(
      map(projects => projects.find(p => p.id === projectId))
    );
  }

  /**
   * Get single project with tasks
   */
  getProjectWithTasks(projectId: string): Observable<Project | undefined> {
    return this.projectsWithTasks$.pipe(
      map(projects => projects.find(p => p.id === projectId))
    );
  }

  /**
   * Get projects by column with tasks
   */
  getProjectsByColumnWithTasks(columnId: string): Observable<Project[]> {
    return this.projectsWithTasks$.pipe(
      map(projects => projects.filter(p => p.status === columnId))
    );
  }

  private generateShortCode(title: string): string {
    const prefix = title
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');

    const suffix = String(this.projectsSubject.value.length + 1).padStart(3, '0');
    return `${prefix || 'PRJ'}-${suffix}`;
  }

  private updateBoardColumns(columns: BoardColumn[]): void {
    const board = this.boardSubject.value;
    if (!board) {
      throw new Error('No board loaded');
    }

    const nextBoard = {
      ...board,
      columns: this.normalizeBoardColumns(columns),
    };

    this.boardSubject.next(nextBoard);
    const projects = this.reconcileProjectsWithBoard(this.projectsSubject.value, nextBoard);
    this.projectsSubject.next(projects);
    this.persistBoard(nextBoard);
    this.persistProjects(projects);
  }

  private normalizeBoardColumns(columns: BoardColumn[]): BoardColumn[] {
    const defaultColumns = new Map(buildTechnicalBoardColumns().map((column) => [column.id, column]));

    return [...columns]
      .sort((a, b) => a.order - b.order)
      .map((column, index) => ({
        ...(defaultColumns.get(column.id) ?? {
          description: '',
          equipmentStatusId: '',
          equipmentStatusLabel: '',
          greenDays: 0,
          yellowDays: 0,
          includeInWorkload: true,
          trackAging: false,
        }),
        ...column,
        order: index + 1,
        description: String(column.description ?? '').trim(),
        equipmentStatusId: String(column.equipmentStatusId ?? '').trim(),
        equipmentStatusLabel: String(column.equipmentStatusLabel ?? '').trim(),
        greenDays: this.normalizeWholeNumber(column.greenDays, 0),
        yellowDays: this.normalizeWholeNumber(column.yellowDays, 0),
        includeInWorkload: Boolean(column.includeInWorkload),
        trackAging: Boolean(column.trackAging),
      }));
  }

  private generateColumnId(name: string, existingIds: Set<string>): string {
    const baseId = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'column';

    let candidate = baseId;
    let attempt = 1;

    while (existingIds.has(candidate)) {
      attempt += 1;
      candidate = `${baseId}-${attempt}`;
    }

    return candidate;
  }

  private initializePropertyTemplates() {
    return [
      {
        id: 'priority',
        name: 'Prioridad',
        type: PropertyType.SELECT,
        options: [
          { id: 'high', name: 'Alta', color: '#ef4444' },
          { id: 'medium', name: 'Media', color: '#f59e0b' },
          { id: 'low', name: 'Baja', color: '#10b981' },
        ],
      },
      {
        id: 'assignee',
        name: 'Asignado a',
        type: PropertyType.PERSON,
      },
      {
        id: 'dueDate',
        name: 'Fecha limite',
        type: PropertyType.DATE,
      },
      {
        id: 'budget',
        name: 'Presupuesto',
        type: PropertyType.CURRENCY,
      },
      {
        id: 'progress',
        name: 'Progreso',
        type: PropertyType.PERCENTAGE,
      },
    ];
  }

  private buildDefaultBoard(): ProjectBoard {
    const board = buildTechnicalProjectBoard();
    return {
      ...board,
      propertyTemplates: this.initializePropertyTemplates(),
      columns: this.normalizeBoardColumns(board.columns),
    };
  }

  private buildDefaultProjects(boardId: string): Project[] {
    const seeded: Project[] = [
      {
        id: 'project-tech-1',
        title: 'Kayser HMI CO260206',
        description: 'Equipo en diagnostico inicial por falla de encendido y validacion de potencia.',
        icon: 'bi-cpu',
        status: 'diagnostico',
        boardId,
        properties: {
          shortCode: 'CO260206',
          startDate: new Date('2026-04-15T08:00:00'),
          stageEnteredAt: '2026-04-15T08:00:00.000Z',
          dueDate: new Date('2026-04-21T18:00:00'),
          noDeadline: false,
          category: 'Diagnostico',
          department: 'Tecnico',
          client: 'PIKA Electronic Colombia',
          priority: 'high',
          assignee: 'Giovanni Vaquero',
          notes: 'Cliente solicita respuesta prioritaria por parada de linea.',
          diagnosticNotes: 'Se energiza con 24V. Pantalla no inicia. Revisar fuente y modulo de video.',
          repairNotes: '',
          repairabilityPercent: 80,
          publicProject: false,
          members: ['Giovanni Vaquero', 'Maribel'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 10,
          actualHours: 2,
          testType: 'sin-pruebas',
          testTypeLabel: getProjectTechnicalTestTypeLabel('sin-pruebas'),
          allowManualTime: true,
          notifyClient: true,
          equipmentDisplayName: 'Pantalla Kayser',
          equipmentIdentifier: 'CO260206',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Interior 3',
          equipmentRepairStatus: 'diagnostico',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('diagnostico'),
          equipmentLastWorkflowUpdate: '2026-04-15T08:00:00.000Z',
          progress: 20,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-15T08:00:00'),
        updatedAt: new Date('2026-04-18T08:30:00'),
      },
      {
        id: 'project-tech-2',
        title: 'PLC Siemens S7-1200 CO260211',
        description: 'Diagnostico aprobado. Se requiere lista de materiales para cotizacion.',
        icon: 'bi-diagram-3',
        status: 'reparacion',
        boardId,
        properties: {
          shortCode: 'CO260211',
          startDate: new Date('2026-04-14T09:30:00'),
          stageEnteredAt: '2026-04-17T10:00:00.000Z',
          dueDate: new Date('2026-04-22T18:00:00'),
          noDeadline: false,
          category: 'Componentes',
          department: 'Tecnico',
          client: 'Tecnoempack',
          priority: 'medium',
          assignee: 'Ana Torres',
          notes: 'Pendiente cargar linea de fuente y modulo IO.',
          diagnosticNotes: 'Fuente de 5V inestable. Requiere cambio de dos reguladores y capacitor de filtrado.',
          repairNotes: '',
          repairabilityPercent: 65,
          publicProject: false,
          members: ['Ana Torres', 'Compras'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 8,
          actualHours: 1,
          testType: 'sin-pruebas',
          testTypeLabel: getProjectTechnicalTestTypeLabel('sin-pruebas'),
          allowManualTime: true,
          notifyClient: false,
          equipmentDisplayName: 'PLC Siemens S7-1200',
          equipmentIdentifier: 'CO260211',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Estanteria',
          equipmentRepairStatus: 'pedir-repuestos',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('pedir-repuestos'),
          equipmentLastWorkflowUpdate: '2026-04-17T10:00:00.000Z',
          progress: 30,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-14T09:30:00'),
        updatedAt: new Date('2026-04-18T09:00:00'),
      },
      {
        id: 'project-tech-3',
        title: 'Servo Yaskawa SGM7J CO260315',
        description: 'Material solicitado. Proyecto esperando arribo de encoder y driver.',
        icon: 'bi-gear-wide-connected',
        status: 'reparacion',
        boardId,
        properties: {
          shortCode: 'CO260315',
          startDate: new Date('2026-04-10T07:30:00'),
          stageEnteredAt: '2026-04-16T12:00:00.000Z',
          dueDate: new Date('2026-04-24T18:00:00'),
          noDeadline: false,
          category: 'Proveedor',
          department: 'Tecnico',
          client: 'Industria Andina',
          priority: 'medium',
          assignee: 'Bruno Diaz',
          notes: 'Compras confirma disponibilidad parcial del encoder.',
          diagnosticNotes: 'Encoder da lectura erratica. Driver con humedad. Se solicita cambio preventivo.',
          repairNotes: '',
          repairabilityPercent: 70,
          publicProject: false,
          members: ['Bruno Diaz', 'Compras'],
          currency: 'USD',
          budget: 0,
          estimatedHours: 16,
          actualHours: 3,
          testType: 'sin-pruebas',
          testTypeLabel: getProjectTechnicalTestTypeLabel('sin-pruebas'),
          allowManualTime: true,
          notifyClient: true,
          equipmentDisplayName: 'Servo Yaskawa SGM7J',
          equipmentIdentifier: 'CO260315',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Interior 2',
          equipmentRepairStatus: 'esperando-proveedor',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('esperando-proveedor'),
          equipmentLastWorkflowUpdate: '2026-04-16T12:00:00.000Z',
          progress: 40,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-10T07:30:00'),
        updatedAt: new Date('2026-04-18T08:45:00'),
      },
      {
        id: 'project-tech-4',
        title: 'Variador ABB ACS880 CO260401',
        description: 'Intervencion tecnica en curso con modulo de potencia ya recibido.',
        icon: 'bi-lightning-charge',
        status: 'reparacion',
        boardId,
        properties: {
          shortCode: 'CO260401',
          startDate: new Date('2026-04-08T08:15:00'),
          stageEnteredAt: '2026-04-17T14:00:00.000Z',
          dueDate: new Date('2026-04-25T18:00:00'),
          noDeadline: false,
          category: 'Reparacion',
          department: 'Tecnico',
          client: 'Plastinorte',
          priority: 'low',
          assignee: 'Carla Ruiz',
          notes: 'Se reemplazaron IGBT y condensadores del bus DC.',
          diagnosticNotes: 'Falla por sobrecorriente. Tarjeta de disparo contaminada.',
          repairNotes: 'Cambio de IGBT y limpieza completa. Pendiente cierre de disipador.',
          repairabilityPercent: 90,
          publicProject: false,
          members: ['Carla Ruiz'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 18,
          actualHours: 11,
          testType: 'laboratorio',
          testTypeLabel: getProjectTechnicalTestTypeLabel('laboratorio'),
          allowManualTime: true,
          notifyClient: false,
          equipmentDisplayName: 'Variador ABB ACS880',
          equipmentIdentifier: 'CO260401',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Banco de pruebas',
          equipmentRepairStatus: 'reparacion',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('reparacion'),
          equipmentLastWorkflowUpdate: '2026-04-17T14:00:00.000Z',
          progress: 65,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-08T08:15:00'),
        updatedAt: new Date('2026-04-18T11:00:00'),
      },
      {
        id: 'project-tech-5',
        title: 'PanelView Plus CO260512',
        description: 'Equipo reparado y en ciclo final de pruebas QA.',
        icon: 'bi-display',
        status: 'pruebas',
        boardId,
        properties: {
          shortCode: 'CO260512',
          startDate: new Date('2026-04-05T10:00:00'),
          stageEnteredAt: '2026-04-18T08:00:00.000Z',
          dueDate: new Date('2026-04-23T18:00:00'),
          noDeadline: false,
          category: 'QA',
          department: 'Tecnico',
          client: 'Molinos del Valle',
          priority: 'medium',
          assignee: 'Diego Perez',
          notes: 'Esperando corrida final con fixture HMI.',
          diagnosticNotes: 'Pantalla retroiluminacion intermitente. Fuente secundaria degradada.',
          repairNotes: 'Fuente secundaria reemplazada y tactil recalibrado.',
          repairabilityPercent: 95,
          publicProject: false,
          members: ['Diego Perez', 'QA'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 12,
          actualHours: 9,
          testType: 'banco-pruebas',
          testTypeLabel: getProjectTechnicalTestTypeLabel('banco-pruebas'),
          allowManualTime: true,
          notifyClient: true,
          equipmentDisplayName: 'PanelView Plus',
          equipmentIdentifier: 'CO260512',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Banco de pruebas',
          equipmentRepairStatus: 'pruebas',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('pruebas'),
          equipmentLastWorkflowUpdate: '2026-04-18T08:00:00.000Z',
          progress: 85,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-05T10:00:00'),
        updatedAt: new Date('2026-04-18T11:30:00'),
      },
      {
        id: 'project-tech-6',
        title: 'Drive Lenze EVS CO260612',
        description: 'Caso de garantia bajo analisis por retorno despues de 15 dias.',
        icon: 'bi-shield-check',
        status: 'reparacion',
        boardId,
        properties: {
          shortCode: 'CO260612',
          startDate: new Date('2026-04-02T08:00:00'),
          stageEnteredAt: '2026-04-16T08:00:00.000Z',
          dueDate: new Date('2026-04-22T18:00:00'),
          noDeadline: false,
          category: 'Garantia',
          department: 'Tecnico',
          client: 'Alimentos Rionegro',
          priority: 'high',
          assignee: 'Elena Gomez',
          notes: 'Cliente reporta reincidencia en arranque bajo carga.',
          diagnosticNotes: 'Pendiente validar si el entorno de planta genero la reincidencia.',
          repairNotes: 'Se audita logica de disparo y disipacion termica.',
          repairabilityPercent: 55,
          publicProject: false,
          members: ['Elena Gomez', 'Servicio campo'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 6,
          actualHours: 2,
          testType: 'multimetro-scan',
          testTypeLabel: getProjectTechnicalTestTypeLabel('multimetro-scan'),
          allowManualTime: true,
          notifyClient: true,
          equipmentDisplayName: 'Drive Lenze EVS',
          equipmentIdentifier: 'CO260612',
          equipmentServiceType: 'Garantia',
          equipmentLocationName: 'Interior 1',
          equipmentRepairStatus: 'garantia',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('garantia'),
          equipmentLastWorkflowUpdate: '2026-04-16T08:00:00.000Z',
          progress: 25,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-02T08:00:00'),
        updatedAt: new Date('2026-04-18T10:20:00'),
      },
      {
        id: 'project-tech-7',
        title: 'Kayser HMI CO260245',
        description: 'Caso similar con congelamiento de pantalla durante operacion continua.',
        icon: 'bi-cpu',
        status: 'entregado',
        boardId,
        properties: {
          shortCode: 'CO260245',
          startDate: new Date('2026-04-20T09:00:00'),
          stageEnteredAt: '2026-04-23T10:00:00.000Z',
          dueDate: new Date('2026-04-24T18:00:00'),
          noDeadline: false,
          category: 'Reparacion',
          department: 'Tecnico',
          client: 'Kayser Planta Norte',
          priority: 'medium',
          assignee: 'Ana Torres',
          notes: 'Falla recurrente en jornada extendida de produccion.',
          diagnosticNotes: 'Caida de tension de 5V sobre la placa principal tras calentamiento.',
          repairNotes: 'Cambio de regulador, recap de linea de memoria y limpieza de conectores de video.',
          repairabilityPercent: 92,
          publicProject: false,
          members: ['Ana Torres', 'QA'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 9,
          actualHours: 9,
          testType: 'banco-pruebas',
          testTypeLabel: getProjectTechnicalTestTypeLabel('banco-pruebas'),
          allowManualTime: true,
          notifyClient: true,
          equipmentDisplayName: 'Pantalla Kayser',
          equipmentIdentifier: 'CO260245',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Banco de pruebas',
          equipmentRepairStatus: 'entregado',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('entregado'),
          equipmentLastWorkflowUpdate: '2026-04-23T10:00:00.000Z',
          progress: 100,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-20T09:00:00'),
        updatedAt: new Date('2026-04-23T10:00:00'),
      },
      {
        id: 'project-tech-8',
        title: 'Kayser HMI CO260312',
        description: 'Reparacion por dano en arranque luego de pico de voltaje.',
        icon: 'bi-cpu',
        status: 'pruebas',
        boardId,
        properties: {
          shortCode: 'CO260312',
          startDate: new Date('2026-04-25T07:35:00'),
          stageEnteredAt: '2026-04-27T16:10:00.000Z',
          dueDate: new Date('2026-04-30T18:00:00'),
          noDeadline: false,
          category: 'Reparacion',
          department: 'Tecnico',
          client: 'Kayser Planta Centro',
          priority: 'high',
          assignee: 'Diego Perez',
          notes: 'Se solicito validar proteccion extra para la planta.',
          diagnosticNotes: 'Primario de fuente y circuito de arranque con dano por sobrevoltaje.',
          repairNotes: 'Reemplazo de puente rectificador, varistor y etapa de arranque; pruebas de estres completadas.',
          repairabilityPercent: 88,
          publicProject: false,
          members: ['Diego Perez', 'Servicio campo'],
          currency: 'COP',
          budget: 0,
          estimatedHours: 11,
          actualHours: 8,
          testType: 'laboratorio',
          testTypeLabel: getProjectTechnicalTestTypeLabel('laboratorio'),
          allowManualTime: true,
          notifyClient: true,
          equipmentDisplayName: 'Pantalla Kayser',
          equipmentIdentifier: 'CO260312',
          equipmentServiceType: 'Reparacion',
          equipmentLocationName: 'Interior 2',
          equipmentRepairStatus: 'pruebas',
          equipmentRepairStatusLabel: getProjectWorkflowStatusLabel('pruebas'),
          equipmentLastWorkflowUpdate: '2026-04-27T16:10:00.000Z',
          progress: 80,
        },
        createdBy: 'admin',
        createdAt: new Date('2026-04-25T07:35:00'),
        updatedAt: new Date('2026-04-27T16:10:00'),
      },
    ];

    return seeded.map((project) => this.syncProjectWithBoard(project, this.buildDefaultBoard(), false));
  }

  private restoreBoard(): ProjectBoard {
    const defaultBoard = this.buildDefaultBoard();
    if (typeof window === 'undefined') {
      return defaultBoard;
    }

    const raw = window.localStorage.getItem(this.boardStorageKey);
    if (!raw) {
      return defaultBoard;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<ProjectBoard>;
      const parsedColumns = Array.isArray(parsed.columns) ? parsed.columns : [];
      const legacyIds = new Set(['backlog', 'in-progress', 'review', 'completed']);
      const isLegacyBoard = parsedColumns.length > 0 && parsedColumns.every((column) => legacyIds.has(String(column.id ?? '').trim()));

      if (isLegacyBoard) {
        return defaultBoard;
      }

      return {
        ...defaultBoard,
        ...parsed,
        name: String(parsed.name ?? defaultBoard.name).trim() || defaultBoard.name,
        icon: String(parsed.icon ?? defaultBoard.icon).trim() || defaultBoard.icon,
        propertyTemplates: this.initializePropertyTemplates(),
        columns: parsedColumns.length ? this.normalizeBoardColumns(parsedColumns as BoardColumn[]) : defaultBoard.columns,
      };
    } catch {
      return defaultBoard;
    }
  }

  private restoreProjects(board: ProjectBoard): Project[] {
    const fallback = this.buildDefaultProjects(board.id);
    if (typeof window === 'undefined') {
      return fallback;
    }

    const raw = window.localStorage.getItem(this.projectsStorageKey);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        return fallback;
      }

      return this.reconcileProjectsWithBoard(parsed as Project[], board);
    } catch {
      return fallback;
    }
  }

  private reconcileProjectsWithBoard(projects: Project[], board: ProjectBoard): Project[] {
    return projects.map((project) => this.syncProjectWithBoard(project, board, false));
  }

  private syncProjectWithBoard(project: Project, board: ProjectBoard | null, resetStageEnteredAt: boolean): Project {
    const createdAt = this.normalizeDateValue(project.createdAt, new Date());
    const updatedAt = this.normalizeDateValue(project.updatedAt, createdAt);
    const normalizedProperties = { ...(project.properties ?? {}) } as Record<string, any>;
    const columnIds = new Set((board?.columns ?? []).map((column) => column.id));
    const legacyMappedStatus = mapLegacyProjectStatus(project.status);
    const equipmentStatus = String(normalizedProperties['equipmentRepairStatus'] ?? '').trim();
    const nextStatus = columnIds.has(project.status)
      ? project.status
      : columnIds.has(legacyMappedStatus)
        ? legacyMappedStatus
        : columnIds.has(equipmentStatus)
          ? equipmentStatus
          : board?.columns[0]?.id ?? legacyMappedStatus;
    const column = board?.columns.find((entry) => entry.id === nextStatus) ?? null;
    const stageEnteredAt = resetStageEnteredAt
      ? new Date().toISOString()
      : String(normalizedProperties['stageEnteredAt'] ?? normalizedProperties['equipmentLastWorkflowUpdate'] ?? updatedAt.toISOString()).trim() || updatedAt.toISOString();
    const syncedProperties = {
      ...normalizedProperties,
      stageEnteredAt,
      stageName: column?.name ?? getProjectWorkflowStatusLabel(nextStatus),
      repairabilityPercent: this.normalizeWholeNumber(normalizedProperties['repairabilityPercent'], 0),
      estimatedHours: this.normalizeWholeNumber(normalizedProperties['estimatedHours'], 0),
      actualHours: this.normalizeWholeNumber(normalizedProperties['actualHours'], 0),
      diagnosticNotes: String(normalizedProperties['diagnosticNotes'] ?? '').trim(),
      repairNotes: String(normalizedProperties['repairNotes'] ?? '').trim(),
      testType: String(normalizedProperties['testType'] ?? 'sin-pruebas').trim(),
      testTypeLabel: getProjectTechnicalTestTypeLabel(String(normalizedProperties['testType'] ?? 'sin-pruebas').trim()),
    } as Record<string, any>;

    if (column?.equipmentStatusId) {
      const currentRepairStatus = String(syncedProperties['equipmentRepairStatus'] ?? '').trim();
      const isKnownInternalStatus = PROJECT_WORKFLOW_STATUS_OPTIONS.some((opt) => opt.id === currentRepairStatus);
      if (resetStageEnteredAt || !isKnownInternalStatus) {
        syncedProperties['equipmentRepairStatus'] = column.equipmentStatusId;
        syncedProperties['equipmentRepairStatusLabel'] = column.equipmentStatusLabel || getProjectWorkflowStatusLabel(column.equipmentStatusId);
      }
    }

    return {
      ...project,
      boardId: board?.id ?? project.boardId,
      status: nextStatus,
      createdAt,
      updatedAt,
      attachments: Array.isArray(project.attachments) ? [...project.attachments] : [],
      properties: syncedProperties,
    };
  }

  private commitProjects(projects: Project[]): void {
    this.projectsSubject.next(projects);
    this.persistProjects(projects);
  }

  private persistBoard(board: ProjectBoard): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.boardStorageKey, JSON.stringify(board));
  }

  private persistProjects(projects: Project[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.projectsStorageKey, JSON.stringify(projects));
  }

  private normalizeDateValue(value: unknown, fallback: Date): Date {
    const parsed = value instanceof Date ? value : new Date(String(value ?? ''));
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  }

  private normalizeWholeNumber(value: unknown, fallback: number): number {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.max(0, Math.round(numeric));
  }
}
