import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, from, throwError } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { Attachment, BoardColumn, Project, ProjectBoard, PropertyType } from '../models';
import {
  PROJECT_WORKFLOW_STATUS_OPTIONS,
  buildTechnicalBoardColumns,
  buildTechnicalProjectBoard,
  getProjectTechnicalTestTypeLabel,
  getProjectWorkflowStatusLabel,
  mapLegacyProjectStatus,
} from '../project-workflow.config';
import {
  applySlaConfigToColumns,
  buildSlaConfigApiPayload,
  slaConfigFromApiPayload,
} from '../project-sla.logic';
import {
  ProjectApiItem,
  ProjectsApiService,
  UpsertProjectApiRequest,
} from '../../../../services/projects-api.service';
import { TaskService } from './task.service';
import { HrPeoplePickerService } from '../../../../services/hr-people-picker.service';

/**
 * Project Service - estado del tablero tecnico respaldado por el servidor.
 *
 * Fase 3 (persistencia-servidor): la unica fuente de verdad es la API
 * /api/v1/projects (Postgres). El localStorage que usaban las versiones
 * anteriores solo se lee UNA vez para migrar los datos existentes del
 * navegador al servidor y se borra a continuacion (ver
 * migrateLegacyLocalStorage). Si la API falla, el error se publica en
 * error$ para que la UI lo muestre: no hay fallback silencioso a datos
 * locales ni a semillas mock.
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private taskService = inject(TaskService);
  private readonly projectsApi = inject(ProjectsApiService);
  private readonly hrPeople = inject(HrPeoplePickerService);

  /**
   * Valida los assignees de una lista de proyectos contra RRHH activos.
   * Si un proyecto tiene un assignee que NO existe como empleado activo,
   * se vacía (la UI mostrará "Sin asignar"). No se hace PUT: el dato en BD
   * queda intacto para auditoría, solo se normaliza la vista en memoria.
   */
  private async normalizeAssignees(projects: Project[]): Promise<Project[]> {
    let names: string[];
    try {
      names = await this.hrPeople.names();
    } catch {
      return projects; // Sin RRHH cargado, no valido — no rompo la carga.
    }

    if (names.length === 0) {
      return projects;
    }

    const nameSet = new Set(names.map((n) => n.toLowerCase()));
    return projects.map((p) => {
      const assignee = String(p.properties['assignee'] ?? '').trim();
      if (assignee && !nameSet.has(assignee.toLowerCase())) {
        return { ...p, properties: { ...p.properties, assignee: '' } };
      }
      return p;
    });
  }

  // Claves heredadas de las versiones que persistian en el navegador.
  // Solo se usan para la migracion unica al servidor.
  private readonly legacyBoardStorageKey = 'lars.projects.board.v3';
  private readonly legacyProjectsStorageKey = 'lars.projects.items.v3';

  private readonly boardId = 'board-1';

  // State management
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  private bootstrapDoneSubject = new BehaviorSubject<boolean>(false);

  /**
   * Proyectos cargados desde el servidor. La primera emision espera a que el
   * arranque contra la API termine (exito o fallo visible en error$), para que
   * los consumidores con take(1) no reciban un tablero vacio prematuro.
   */
  public projects$ = this.bootstrapDoneSubject.pipe(
    filter((done) => done),
    switchMap(() => this.projectsSubject.asObservable()),
  );

  private boardSubject = new BehaviorSubject<ProjectBoard | null>(null);
  public board$ = this.boardSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string>('');
  /** Ultimo error de sincronizacion con el servidor ('' = sin error). */
  public error$ = this.errorSubject.asObservable();

  private bootstrapPromise: Promise<void> | null = null;
  private projectIdCounter = 0;

  // Projects with task data enriched
  public projectsWithTasks$ = combineLatest([
    this.projectsSubject.asObservable(),
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
    this.boardSubject.next(this.buildDefaultBoard());
    void this.ensureBootstrapped();
  }

  // ─── Arranque contra el servidor ─────────────────────────────────────────

  private ensureBootstrapped(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrapFromServer();
    }

    return this.bootstrapPromise;
  }

  private async bootstrapFromServer(): Promise<void> {
    this.loadingSubject.next(true);

    try {
      const [boardConfig, slaItems, projectItems] = await Promise.all([
        firstValueFrom(this.projectsApi.getBoardConfig()),
        firstValueFrom(this.projectsApi.getSlaConfig()),
        firstValueFrom(this.projectsApi.listProjects()),
      ]);

      let board = this.buildDefaultBoard();
      board = this.applyServerBoardColumns(board, boardConfig);
      board = this.applyServerSlaConfig(board, slaItems);
      this.boardSubject.next(board);

      let projects = projectItems.map((item) => this.projectFromApi(item, board));
      projects = await this.migrateLegacyLocalStorage(projects, board, boardConfig);
      projects = await this.normalizeAssignees(projects);

      this.projectsSubject.next(projects);
      this.errorSubject.next('');
    } catch (error) {
      this.errorSubject.next(this.describeError(error, 'No se pudo cargar el tablero desde el servidor.'));
    } finally {
      this.loadingSubject.next(false);
      this.bootstrapDoneSubject.next(true);
    }
  }

  /** Recarga los proyectos desde el servidor (multiusuario: estado compartido). */
  refreshProjects(): Observable<Project[]> {
    return from(this.ensureBootstrapped()).pipe(
      switchMap(() => from(this.fetchProjectsIntoSubject())),
      map(() => this.projectsSubject.value),
    );
  }

  private async fetchProjectsIntoSubject(): Promise<void> {
    try {
      const items = await firstValueFrom(this.projectsApi.listProjects());
      const board = this.boardSubject.value;
      let projects = items.map((item) => this.projectFromApi(item, board));
      projects = await this.normalizeAssignees(projects);
      this.projectsSubject.next(projects);
    } catch (error) {
      this.errorSubject.next(this.describeError(error, 'No se pudieron recargar los proyectos del servidor.'));
    }
  }

  /**
   * Migracion unica de los datos que las versiones anteriores guardaban en
   * localStorage del navegador. Estrategia:
   *  - Si el servidor no tiene configuracion de columnas y el navegador si,
   *    se sube la del navegador (respeta columnas personalizadas).
   *  - Cada proyecto local cuyo id no exista en el servidor se crea en el
   *    servidor (los que ya existen ganan la version del servidor).
   *  - Solo se borran las claves locales cuando la migracion termina sin
   *    errores; si falla, se conservan y se reintentan en el proximo arranque
   *    (nunca se pierde dato del cliente en silencio).
   */
  private async migrateLegacyLocalStorage(
    serverProjects: Project[],
    board: ProjectBoard,
    serverBoardConfig: Record<string, any>,
  ): Promise<Project[]> {
    if (typeof window === 'undefined') {
      return serverProjects;
    }

    // La migración es sólo para una instalación aún vacía. Releer y recorrer
    // el snapshot heredado en cada carga cuando el servidor ya tiene proyectos
    // bloquea el hilo principal en navegadores que conservaron un localStorage
    // grande de versiones anteriores. El servidor es la fuente de verdad una
    // vez que existe al menos un proyecto.
    if (serverProjects.length > 0) {
      return serverProjects;
    }

    const rawBoard = window.localStorage.getItem(this.legacyBoardStorageKey);
    const rawProjects = window.localStorage.getItem(this.legacyProjectsStorageKey);

    if (!rawBoard && !rawProjects) {
      return serverProjects;
    }

    let activeBoard = board;
    const result = [...serverProjects];

    try {
      const serverHasColumns = Array.isArray(serverBoardConfig?.['columns']) && serverBoardConfig['columns'].length > 0;

      if (rawBoard && !serverHasColumns) {
        const parsedBoard = JSON.parse(rawBoard) as Partial<ProjectBoard>;
        const parsedColumns = Array.isArray(parsedBoard.columns) ? parsedBoard.columns as BoardColumn[] : [];
        const legacyIds = new Set(['backlog', 'in-progress', 'review', 'completed']);
        const isLegacyBoard = parsedColumns.length > 0 && parsedColumns.every((column) => legacyIds.has(String(column.id ?? '').trim()));

        if (parsedColumns.length && !isLegacyBoard) {
          const migratedColumns = this.normalizeBoardColumns(parsedColumns);
          await firstValueFrom(this.projectsApi.updateBoardConfig({ columns: migratedColumns }));
          activeBoard = this.applyServerSlaConfig({ ...activeBoard, columns: migratedColumns }, null);
          this.boardSubject.next(activeBoard);
        }
      }

      if (rawProjects) {
        const parsed = JSON.parse(rawProjects);
        if (Array.isArray(parsed)) {
          const knownIds = new Set(result.map((project) => project.id));

          for (const legacyRaw of parsed) {
            const legacy = legacyRaw as Project;
            if (!legacy?.id || knownIds.has(legacy.id)) {
              continue;
            }

            const candidate = this.syncProjectWithBoard(
              { ...legacy, attachments: Array.isArray(legacy.attachments) ? legacy.attachments : [] },
              activeBoard,
              false,
            );
            const saved = await firstValueFrom(this.projectsApi.createProject(this.toApiPayload(candidate)));
            result.push(this.projectFromApi(saved, activeBoard));
            knownIds.add(candidate.id);
          }
        }
      }

      window.localStorage.removeItem(this.legacyBoardStorageKey);
      window.localStorage.removeItem(this.legacyProjectsStorageKey);
    } catch (error) {
      this.errorSubject.next(
        `${this.describeError(error, 'La migracion de los datos locales del tablero al servidor fallo.')} `
        + 'Los datos se conservan en este navegador y se reintentara en el proximo arranque.',
      );
    }

    return result;
  }

  // ─── Mapeo servidor ↔ modelo local ───────────────────────────────────────

  private toApiPayload(project: Project): UpsertProjectApiRequest {
    const properties: Record<string, any> = { ...(project.properties ?? {}) };

    // El backend guarda el proyecto como (id, status, properties_json); los
    // campos del modelo Angular viajan dentro de properties.
    properties['title'] = project.title;
    properties['description'] = project.description ?? '';
    properties['icon'] = project.icon ?? 'bi-briefcase';
    properties['boardId'] = project.boardId || this.boardId;
    properties['createdBy'] = project.createdBy ?? '';
    properties['attachments'] = (project.attachments ?? []).map((attachment) => ({
      ...attachment,
      uploadedAt: attachment.uploadedAt instanceof Date ? attachment.uploadedAt.toISOString() : attachment.uploadedAt,
    }));

    return {
      id: project.id,
      status: project.status,
      properties,
    };
  }

  private projectFromApi(item: ProjectApiItem, board: ProjectBoard | null): Project {
    const properties: Record<string, any> = { ...(item.properties ?? {}) };

    const project: Project = {
      id: item.id,
      title: String(properties['title'] ?? '').trim() || item.id,
      description: String(properties['description'] ?? ''),
      icon: String(properties['icon'] ?? 'bi-briefcase'),
      status: item.status,
      boardId: String(properties['boardId'] ?? '').trim() || board?.id || this.boardId,
      properties,
      createdBy: String(properties['createdBy'] ?? ''),
      createdAt: this.normalizeDateValue(item.createdAt, new Date()),
      updatedAt: this.normalizeDateValue(item.updatedAt, new Date()),
      attachments: Array.isArray(properties['attachments'])
        ? (properties['attachments'] as Attachment[]).map((attachment) => ({
          ...attachment,
          uploadedAt: this.normalizeDateValue(attachment?.uploadedAt, new Date()),
        }))
        : [],
    };

    return this.syncProjectWithBoard(project, board, false);
  }

  private replaceProjectFromApi(item: ProjectApiItem): Project {
    const board = this.boardSubject.value;
    const project = this.projectFromApi(item, board);
    const projects = this.projectsSubject.value;
    const index = projects.findIndex((entry) => entry.id === project.id);

    if (index === -1) {
      this.projectsSubject.next([...projects, project]);
    } else {
      const next = [...projects];
      next[index] = project;
      this.projectsSubject.next(next);
    }

    return project;
  }

  private applyServerBoardColumns(board: ProjectBoard, boardConfig: Record<string, any> | null): ProjectBoard {
    const rawColumns = Array.isArray(boardConfig?.['columns']) ? boardConfig!['columns'] as BoardColumn[] : [];
    if (!rawColumns.length) {
      return board;
    }

    return { ...board, columns: this.normalizeBoardColumns(rawColumns) };
  }

  private applyServerSlaConfig(board: ProjectBoard, slaItems: unknown): ProjectBoard {
    if (!Array.isArray(slaItems) || slaItems.length === 0) {
      return board;
    }

    const config = slaConfigFromApiPayload(slaItems);
    return { ...board, columns: applySlaConfigToColumns(board.columns, config) };
  }

  private describeError(error: unknown, fallback: string): string {
    const message = error instanceof Error ? error.message.trim() : '';
    return message ? `${fallback} (${message})` : fallback;
  }

  // ─── API publica (misma superficie que antes, ahora contra el servidor) ──

  /**
   * Push the current board SLA thresholds to the backend so the semaphore
   * deadlines survive per company.
   */
  syncSlaConfigToApi(): Observable<void> {
    const board = this.boardSubject.value;
    if (!board) {
      return throwError(() => new Error('No board loaded'));
    }

    const payload = buildSlaConfigApiPayload(board.columns);
    return this.projectsApi.updateSlaConfig(payload).pipe(map(() => void 0));
  }

  /**
   * Load projects for a board (refresca desde el servidor en cada llamada).
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

    return from(this.ensureBootstrapped()).pipe(
      switchMap(() => from(this.fetchProjectsIntoSubject())),
      map(() => {
        this.loadingSubject.next(false);
        return this.projectsSubject.value.filter((project) => project.boardId === boardId);
      }),
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
   * Create a new board column (persistida en el servidor).
   */
  createBoardColumn(name: string, color: string, metadata?: Partial<BoardColumn>): Observable<BoardColumn> {
    const board = this.boardSubject.value;
    if (!board) {
      return throwError(() => new Error('No board loaded'));
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return throwError(() => new Error('Column name is required'));
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

    return this.persistBoardColumns([...board.columns, newColumn]).pipe(map(() => newColumn));
  }

  /**
   * Update board column metadata (persistida en el servidor).
   */
  updateBoardColumn(columnId: string, updates: Partial<BoardColumn>): Observable<BoardColumn> {
    const board = this.boardSubject.value;
    if (!board) {
      return throwError(() => new Error('No board loaded'));
    }

    const columns = [...board.columns];
    const columnIndex = columns.findIndex((column) => column.id === columnId);

    if (columnIndex === -1) {
      return throwError(() => new Error('Column not found'));
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
    return this.persistBoardColumns(columns).pipe(map(() => updatedColumn));
  }

  /**
   * Move a column in the desired direction while preserving sequence
   * (persistida en el servidor).
   */
  moveBoardColumn(columnId: string, direction: 'up' | 'down'): Observable<BoardColumn[]> {
    const board = this.boardSubject.value;
    if (!board) {
      return throwError(() => new Error('No board loaded'));
    }

    const columns = [...board.columns].sort((a, b) => a.order - b.order);
    const sourceIndex = columns.findIndex((column) => column.id === columnId);

    if (sourceIndex === -1) {
      return throwError(() => new Error('Column not found'));
    }

    const targetIndex = direction === 'up' ? sourceIndex - 1 : sourceIndex + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) {
      return this.persistBoardColumns(columns);
    }

    const [movingColumn] = columns.splice(sourceIndex, 1);
    columns.splice(targetIndex, 0, movingColumn);

    return this.persistBoardColumns(columns);
  }

  private persistBoardColumns(columns: BoardColumn[]): Observable<BoardColumn[]> {
    const board = this.boardSubject.value;
    if (!board) {
      return throwError(() => new Error('No board loaded'));
    }

    const normalized = this.normalizeBoardColumns(columns);

    return this.projectsApi.updateBoardConfig({ columns: normalized }).pipe(
      map(() => {
        const nextBoard = { ...board, columns: normalized };
        this.boardSubject.next(nextBoard);
        this.projectsSubject.next(this.reconcileProjectsWithBoard(this.projectsSubject.value, nextBoard));
        return normalized;
      }),
    );
  }

  /**
   * Create new project (persistido en el servidor).
   */
  createProject(
    columnId: string,
    title: string,
    description = '',
    options?: { icon?: string; initialProperties?: Record<string, any> },
  ): Observable<Project> {
    return from(this.ensureBootstrapped()).pipe(
      switchMap(() => {
        const board = this.boardSubject.value;
        if (!board) {
          return throwError(() => new Error('No board loaded'));
        }

        const seededProperties = options?.initialProperties ?? {};
        const seededProgress = Number(seededProperties['progress']);
        const normalizedSeededProgress = Number.isFinite(seededProgress)
          ? Math.max(0, Math.min(100, seededProgress))
          : 0;

        const newProject: Project = {
          id: this.generateProjectId(),
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

        const synced = this.syncProjectWithBoard(newProject, board, false);
        return this.projectsApi.createProject(this.toApiPayload(synced));
      }),
      map((saved) => this.replaceProjectFromApi(saved)),
    );
  }

  /**
   * Move a project within or across columns while preserving visual order
   * (persistido en el servidor).
   */
  moveProject(projectId: string, targetStatus: string, targetIndex: number): Observable<Project> {
    const projects = this.projectsSubject.value;
    const sourceIndex = projects.findIndex((project) => project.id === projectId);

    if (sourceIndex === -1) {
      return throwError(() => new Error('Project not found'));
    }

    const board = this.boardSubject.value;
    const projectToMove = projects[sourceIndex];
    const updatedProject = this.syncProjectWithBoard({
      ...projectToMove,
      status: targetStatus,
      updatedAt: new Date(),
    }, board, projectToMove.status !== targetStatus);

    return this.projectsApi.updateProject(projectId, this.toApiPayload(updatedProject)).pipe(
      map((saved) => {
        const savedProject = this.projectFromApi(saved, board);

        const next = [...this.projectsSubject.value];
        const currentIndex = next.findIndex((project) => project.id === projectId);
        if (currentIndex === -1) {
          this.projectsSubject.next([...next, savedProject]);
          return savedProject;
        }

        next.splice(currentIndex, 1);

        const targetColumnProjects = next.filter((project) => project.status === targetStatus);
        const safeTargetIndex = Math.max(0, Math.min(targetIndex, targetColumnProjects.length));

        let insertIndex = next.length;
        if (targetColumnProjects.length > 0) {
          if (safeTargetIndex === targetColumnProjects.length) {
            const previousProject = targetColumnProjects[targetColumnProjects.length - 1];
            insertIndex = next.findIndex((project) => project.id === previousProject.id) + 1;
          } else {
            const nextProject = targetColumnProjects[safeTargetIndex];
            insertIndex = next.findIndex((project) => project.id === nextProject.id);
          }
        }

        next.splice(insertIndex, 0, savedProject);
        this.projectsSubject.next(next);
        return savedProject;
      }),
    );
  }

  /**
   * Update project status (move between columns, persistido en el servidor).
   */
  updateProjectStatus(projectId: string, newStatus: string): Observable<Project> {
    return this.updateProject(projectId, { status: newStatus });
  }

  /**
   * Update project details (persistido en el servidor).
   */
  updateProject(projectId: string, updates: Partial<Project>): Observable<Project> {
    const projects = this.projectsSubject.value;
    const current = projects.find((project) => project.id === projectId);

    if (!current) {
      return throwError(() => new Error('Project not found'));
    }

    const board = this.boardSubject.value;
    const merged = this.syncProjectWithBoard({
      ...current,
      ...updates,
      updatedAt: new Date()
    }, board, updates.status !== undefined && updates.status !== current.status);

    return this.projectsApi.updateProject(projectId, this.toApiPayload(merged)).pipe(
      map((saved) => this.replaceProjectFromApi(saved)),
    );
  }

  /**
   * Update project property value (persistido en el servidor).
   */
  updateProperty(projectId: string, propertyId: string, value: any): Observable<Project> {
    const projects = this.projectsSubject.value;
    const current = projects.find((project) => project.id === projectId);

    if (!current) {
      return throwError(() => new Error('Project not found'));
    }

    return this.updateProject(projectId, {
      properties: {
        ...current.properties,
        [propertyId]: value
      },
    });
  }

  /**
   * Cierre transaccional del diagnostico en el servidor: valida falla
   * identificada, horas estimadas y presupuesto de repuestos, y mueve el
   * caso a por-cotizar (POST /projects/:id/diagnosis/close).
   */
  closeDiagnosis(projectId: string, closedBy?: string): Observable<Project> {
    return this.projectsApi.closeDiagnosis(projectId, closedBy).pipe(
      map((saved) => this.replaceProjectFromApi(saved)),
    );
  }

  /**
   * Delete project (persistido en el servidor).
   */
  deleteProject(projectId: string): Observable<void> {
    return this.projectsApi.deleteProject(projectId).pipe(
      map(() => {
        this.projectsSubject.next(this.projectsSubject.value.filter((project) => project.id !== projectId));
        return void 0;
      }),
    );
  }

  resetBoardToTechnicalDefaults(): Observable<ProjectBoard> {
    const board = this.buildDefaultBoard();

    return this.projectsApi.updateBoardConfig({ columns: board.columns }).pipe(
      map(() => {
        this.boardSubject.next(board);
        this.projectsSubject.next(this.reconcileProjectsWithBoard(this.projectsSubject.value, board));
        return board;
      }),
    );
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

  private generateProjectId(): string {
    this.projectIdCounter += 1;
    const suffix = Math.random().toString(36).slice(2, 8);
    return `project-${Date.now()}-${this.projectIdCounter}-${suffix}`;
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
