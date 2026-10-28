import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProjectsApiService } from '../../../../services/projects-api.service';
import { AuthService } from '../../../../services/auth.service';
import type { Project, ProjectBoard } from '../models';
import { buildTechnicalProjectBoard, mapLegacyProjectStatus } from '../project-workflow.config';
import { applySlaConfigToColumns, slaConfigFromApiPayload } from '../project-sla.logic';

export interface LabSnapshot { board: ProjectBoard; projects: Project[]; hasMore: Set<string>; fetchedAt: number }

/** Lab-only cache. It neither constructs ProjectService nor migrates browser data. */
@Injectable({ providedIn: 'root' })
export class BoardLabDataService {
  private readonly api = inject(ProjectsApiService);
  private readonly auth = inject(AuthService);
  private snapshotToken: string | null = null;
  private snapshot?: LabSnapshot;
  private pending?: Promise<LabSnapshot>;

  peek(): LabSnapshot | undefined {
    return this.snapshot && this.snapshotToken === this.auth.getAccessToken() && Date.now() - this.snapshot.fetchedAt < 30000 ? this.snapshot : undefined;
  }

  load(force = false): Promise<LabSnapshot> {
    const cached = this.peek();
    if (!force && cached) return Promise.resolve(cached);
    if (this.pending) return this.pending;
    this.pending = this.fetch().finally(() => { this.pending = undefined; });
    return this.pending;
  }

  private async fetch(): Promise<LabSnapshot> {
    const token = this.auth.getAccessToken();
    const [config, sla] = await Promise.all([
      firstValueFrom(this.api.getBoardConfig()), firstValueFrom(this.api.getSlaConfig()),
    ]);
    const board = buildTechnicalProjectBoard();
    const columns = Array.isArray(config['columns']) && config['columns'].length ? config['columns'] : board.columns;
    board.columns = applySlaConfigToColumns([...columns].sort((a, b) => a.order - b.order), slaConfigFromApiPayload(sla));
    const pages = await Promise.all(board.columns.map(column => this.page(board, column.id, 12)));
    if (token !== this.auth.getAccessToken()) throw new Error('La sesión cambió durante la carga del tablero.');
    this.snapshotToken = token;
    this.snapshot = {
      board, projects: pages.flatMap(page => page.projects),
      hasMore: new Set(pages.filter(page => page.more).map(page => page.status)), fetchedAt: Date.now(),
    };
    return this.snapshot;
  }

  async page(board: ProjectBoard, status: string, limit: number) {
    const items = await firstValueFrom(this.api.listProjects({ status, limit: Math.min(1000, limit + 1) }));
    return { status, more: items.length >= 1000 || items.length > limit, projects: this.normalize(board, items.slice(0, limit)) };
  }

  private normalize(board: ProjectBoard, items: import('../../../../services/projects-api.service').ProjectApiItem[]): Project[] {
    const columnIds = new Set(board.columns.map(column => column.id));
    const columnsById = new Map(board.columns.map(column => [column.id, column]));
    return items.map(item => {
      const properties = item.properties ?? {};
      const legacy = mapLegacyProjectStatus(item.status);
      const status = columnIds.has(item.status) ? item.status : columnIds.has(legacy) ? legacy
        : columnIds.has(properties['equipmentRepairStatus']) ? properties['equipmentRepairStatus'] : board.columns[0]?.id;
      const column = columnsById.get(status);
      return {
        id: item.id, title: String(properties['title'] || item.id), description: String(properties['description'] || ''),
        icon: String(properties['icon'] || 'bi-briefcase'),
        status,
        boardId: String(properties['boardId'] || board.id), createdBy: String(properties['createdBy'] || ''),
        createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt),
        properties: {
          ...properties, progress: properties['progress'] ?? 0, testType: properties['testType'] || 'sin-pruebas',
          stageEnteredAt: properties['stageEnteredAt'] || properties['equipmentLastWorkflowUpdate'] || item.updatedAt,
          equipmentRepairStatusLabel: properties['equipmentRepairStatusLabel'] || column?.equipmentStatusLabel,
        },
      } as Project;
    });
  }
}
