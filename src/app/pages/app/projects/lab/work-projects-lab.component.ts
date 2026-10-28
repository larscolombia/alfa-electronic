import { ChangeDetectionStrategy, Component, Injector, ViewChild, afterNextRender, computed, inject, signal } from '@angular/core';
import type { Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { AuthService } from '../../../../services/auth.service';
import { buildTechnicalProjectBoard } from '../project-workflow.config';
import { ProjectCardComponent } from '../components/project-card/project-card.component';
import type { KanbanViewComponent } from '../kanban-view.component';
import { BoardLabDataService } from './board-lab-data.service';
import { LabAudience, projectLabColumns } from './board-lab-projection';
import { buildSlaSummary } from '../kanban-extras.logic';
import { resolveProjectSlaSeverity } from '../project-workflow.config';
import type { Project } from '../models';

@Component({
  selector: 'app-work-projects-lab', standalone: true,
  imports: [ProjectCardComponent, NgComponentOutlet],
  templateUrl: './work-projects-lab.component.html',
  styleUrl: './work-projects-lab.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkProjectsLabComponent {
  @ViewChild(NgComponentOutlet) private detailOutlet?: NgComponentOutlet;
  readonly detailType = signal<Type<KanbanViewComponent> | null>(null);
  readonly opening = signal(false);
  private readonly data = inject(BoardLabDataService);
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly initial = this.data.peek();
  readonly board = signal(this.initial?.board ?? buildTechnicalProjectBoard());
  readonly projects = signal<Project[]>(this.initial?.projects ?? []);
  readonly ready = signal(Boolean(this.initial));
  readonly error = signal('');
  readonly compact = signal(true);
  readonly audience = signal<LabAudience>('todos');
  readonly mine = signal(false);
  readonly limits = signal(new Map<string, number>());
  readonly moreAvailable = signal(this.initial?.hasMore ?? new Set<string>());
  readonly pageLoading = signal('');
  readonly audiences: { value: LabAudience; label: string }[] = [
    { value: 'todos', label: 'Todos' }, { value: 'tecnico', label: 'Tecnico' },
    { value: 'administrativo', label: 'Administrativo' },
  ];
  readonly columns = computed(() => projectLabColumns(
    this.board().columns, this.projects(), this.audience(),
    this.mine() ? this.auth.getCurrentUserName() || '__no_user__' : '', this.limits(),
  ));
  readonly summary = computed(() => {
    const person = this.mine() ? this.auth.getCurrentUserName().trim().toLowerCase() || '__no_user__' : '';
    const projects = this.projects().filter(project => {
      if (person && String(project.properties['assignee'] ?? '').trim().toLowerCase() !== person) return false;
      const closed = Boolean(project.properties['diagnosisClosedAt']);
      return this.audience() === 'todos' || (this.audience() === 'tecnico' ? !closed : closed);
    });
    const severities = new Map<string, string>();
    return buildSlaSummary(this.board().columns, projects, (project, column) => {
      const date = new Date(project.properties['stageEnteredAt']);
      const priority = project.properties['priority'] || '';
      const key = `${column.id}|${date.getFullYear()}-${date.getMonth()}-${date.getDate()}|${priority}`;
      const cached = severities.get(key);
      if (cached) return cached;
      const severity = resolveProjectSlaSeverity(column, date, priority);
      severities.set(key, severity);
      return severity;
    });
  });

  constructor() {
    performance.mark('lab-mounted');
    void this.load();
  }

  async load(force = false): Promise<void> {
    this.error.set('');
    try {
      const snapshot = await this.data.load(force);
      this.board.set(snapshot.board);
      this.projects.set(snapshot.projects);
      this.moreAvailable.set(snapshot.hasMore);
      this.limits.set(new Map());
      this.ready.set(true);
      performance.mark('lab-data-ready');
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'No se pudo cargar el tablero'); }
  }

  async more(columnId: string): Promise<void> {
    if (this.pageLoading()) return;
    this.pageLoading.set(columnId);
    try {
      const nextLimit = Math.min(1000, (this.limits().get(columnId) || 12) + 12);
      const page = await this.data.page(this.board(), columnId, nextLimit);
      this.projects.update(projects => [...projects.filter(project => project.status !== columnId), ...page.projects]);
      this.limits.update(limits => new Map(limits).set(columnId, nextLimit));
      this.moreAvailable.update(current => {
        const next = new Set(current);
        if (page.more) next.add(columnId); else next.delete(columnId);
        return next;
      });
    } catch (error) { this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la siguiente página'); }
    finally { this.pageLoading.set(''); }
  }

  async open(project: Project): Promise<void> {
    const existing = this.detailOutlet?.componentInstance as KanbanViewComponent | null;
    if (existing) { existing.openProjectDetail(project); return; }
    this.opening.set(true);
    try {
      const module = await import('../kanban-view.component');
      const { SelectEnhancementService } = await import('../../../../services/select-enhancement.service');
      this.injector.get(SelectEnhancementService).start();
      this.detailType.set(module.KanbanViewComponent);
      afterNextRender(() => setTimeout(() => {
        const detail = this.detailOutlet?.componentInstance as KanbanViewComponent | null;
        detail?.openProjectDetail(project);
      }, 0), { injector: this.injector });
    } finally { this.opening.set(false); }
  }
}
