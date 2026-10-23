import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { Subscription, combineLatest } from 'rxjs';
import { BoardColumn, Project } from '../projects/models';
import { ProjectService } from '../projects/services';
import { HrPeoplePickerService } from '../../../services/hr-people-picker.service';

interface TechnicianWorkload {
  technician: string;
  projectCount: number;
  projects: string[];
  projectLoads: number[];
  projectStages: string[];
  focus: string;
}

interface StageLegendItem {
  key: string;
  label: string;
  color: string;
}

interface ChartThemeTokens {
  bodyColor: string;
  mutedColor: string;
  subtleColor: string;
  axisLineColor: string;
  splitLineColor: string;
  tooltipBackground: string;
  tooltipBorder: string;
}

@Component({
  selector: 'app-work-workload',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  styles: [
    `
      .kpi-value {
        font-size: 1.8rem;
        font-weight: 700;
        line-height: 1.1;
      }

      .workload-chart {
        width: 100%;
        min-height: 660px;
      }

      .assignment-card {
        height: 100%;
        padding: 1rem;
        border-radius: 1rem;
        border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
        background: rgba(var(--bs-body-bg-rgb), 0.88);
        box-shadow: inset 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.03);
      }

      .assignment-card--alert {
        border-color: rgba(217, 72, 95, 0.24);
        box-shadow: inset 0 0 0 1px rgba(217, 72, 95, 0.08);
      }

      .assignment-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }

      .assignment-card__count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
        background: rgba(var(--adminuiux-theme-1-rgb), 0.12);
        color: var(--adminuiux-theme-1);
        white-space: nowrap;
      }

      .assignment-card--alert .assignment-card__count {
        background: rgba(217, 72, 95, 0.12);
        color: #b42318;
      }

      .assignment-focus {
        font-size: 0.85rem;
        color: rgba(var(--bs-body-color-rgb), 0.74);
      }

      .assignment-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .assignment-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.45rem 0.75rem;
        border-radius: 999px;
        background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.12);
        color: var(--bs-body-color);
        font-size: 0.85rem;
      }

      .capacity-note {
        font-size: 0.875rem;
        color: rgba(var(--bs-body-color-rgb), 0.75);
      }

      .stage-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        margin-top: 1rem;
      }

      .stage-legend__item {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--bs-body-color);
        font-size: 0.875rem;
        font-weight: 600;
      }

      .stage-legend__swatch {
        width: 0.85rem;
        height: 0.85rem;
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
        flex-shrink: 0;
      }

      @media (max-width: 991.98px) {
        .workload-chart {
          min-height: 820px;
        }
      }

      .project-list-body {
        max-height: 660px;
        overflow-y: auto;
      }

      .project-code-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        padding: 0.5rem;
      }

      .project-code-pill {
        display: inline-flex;
        align-items: center;
        padding: 0.35rem 0.65rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.18);
        background: rgba(var(--adminuiux-theme-1-rgb), 0.07);
        color: var(--bs-body-color);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        line-height: 1.2;
      }

      .project-code-pill:hover {
        background: rgba(var(--adminuiux-theme-1-rgb), 0.15);
        border-color: rgba(var(--adminuiux-theme-1-rgb), 0.35);
      }

      .project-code-pill.is-assigned {
        border-color: rgba(16, 185, 129, 0.35);
        background: rgba(16, 185, 129, 0.09);
      }
    `,
  ],
  template: `
    <div class="container-fluid py-3">
      <div class="row gx-3 gx-lg-4 align-items-center page-title">
        <div class="col col-sm mb-3 mb-sm-0">
          <h5 class="mb-0">Trabajo - Carga laboral</h5>
          <p class="text-secondary small mb-0">Carga operativa basada en el flujo tecnico configurado y los proyectos reales del tablero.</p>
        </div>
      </div>

      <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
        <ol class="breadcrumb mb-0">
          <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
          <li class="breadcrumb-item bi active" aria-current="page">Carga laboral</li>
        </ol>
      </nav>
    </div>

    <div class="container mt-3" id="main-content">
      @if (serverError$ | async; as serverError) {
        <div class="alert alert-danger border mb-3" role="alert" data-testid="workload-server-error">
          <strong>Los datos del tablero no pudieron sincronizarse con el servidor.</strong>
          <div>{{ serverError }}</div>
          <button type="button" class="btn btn-outline-danger btn-sm mt-2" (click)="retryServerSync()">
            Reintentar
          </button>
        </div>
      }

      <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
        <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Tecnicos activos</p>
              <p class="kpi-value mb-0">{{ workloadItems.length }}</p>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Proyectos activos</p>
              <p class="kpi-value mb-0">{{ totalProjects }}</p>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3 mb-3 mb-md-0">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Promedio por tecnico</p>
              <p class="kpi-value mb-0">{{ averageProjects | number: '1.1-1' }}</p>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="card adminuiux-card h-100">
            <div class="card-body">
              <p class="small text-secondary mb-1">Tecnico con sobrecarga</p>
              <p class="kpi-value mb-0">{{ overloadedTechnician.technician }}</p>
              <p class="small text-secondary mb-0">{{ overloadedTechnician.projectCount }} proyectos simultaneos</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
        <!-- Columna izquierda: grafico de carga laboral -->
        <div class="col-12 col-xl-7 mb-3 mb-xl-0">
          <div class="card adminuiux-card h-100">
            <div class="card-header">
              <h6 class="mb-0">Grafico de carga laboral</h6>
              <p class="text-secondary small mb-0">Cada color corresponde a una columna tecnica activa en Company -> Config. Proyectos.</p>
            </div>
            <div class="card-body">
              @if (chartInitError) {
                <div class="alert alert-warning border mb-3">
                  No fue posible inicializar el grafico. El resumen de asignaciones sigue disponible mas abajo.
                </div>
              }

              <div #workloadChart class="workload-chart" role="img" aria-label="Grafico de carga laboral por tecnico"></div>

              <div class="stage-legend">
                @for (stage of stageLegendItems; track stage.key) {
                  <span class="stage-legend__item">
                    <span class="stage-legend__swatch" [style.backgroundColor]="stage.color"></span>
                    {{ stage.label }}
                  </span>
                }
              </div>

              <p class="capacity-note mt-3 mb-0">La carga se calcula con las columnas activas para workload y las horas estimadas de cada proyecto.</p>
            </div>
          </div>
        </div>

        <!-- Columna derecha: lista compacta de proyectos para asignacion -->
        <div class="col-12 col-xl-5">
          <div class="card adminuiux-card h-100">
            <div class="card-header">
              <h6 class="mb-0">Proyectos</h6>
              <p class="text-secondary small mb-0">Haz clic en un proyecto para asignarlo a un tecnico.</p>
            </div>
            <div class="card-body p-2 project-list-body">
              @if (allProjects.length) {
                <div class="project-code-grid">
                  @for (project of allProjects; track project.id) {
                    <button
                      type="button"
                      class="project-code-pill"
                      [class.is-assigned]="getProjectAssignee(project)"
                      [title]="project.title + (getProjectAssignee(project) ? ' · ' + getProjectAssignee(project) : '')"
                      (click)="openAssignModal(project)">
                      {{ getProjectCode(project) }}
                    </button>
                  }
                </div>
              } @else {
                <div class="helper-box">No hay proyectos disponibles.</div>
              }
            </div>
          </div>
        </div>
      </div><!-- /row chart + proyectos -->

      <div class="card adminuiux-card">
        <div class="card-header">
          <h6 class="mb-0">Detalle por tecnico</h6>
          <p class="text-secondary small mb-0">Cada tarjeta agrupa proyectos activos por responsable y refleja el foco dominante segun la etapa tecnica.</p>
        </div>
        <div class="card-body">
          @if (workloadItems.length) {
            <div class="row gx-3 gy-3">
              @for (item of workloadItems; track item.technician) {
                <div class="col-12 col-lg-6">
                  <div class="assignment-card" [class.assignment-card--alert]="item.projectCount > baseCapacity">
                    <div class="assignment-card__header">
                      <div>
                        <h6 class="mb-1">{{ item.technician }}</h6>
                        <p class="assignment-focus mb-0">Foco actual: {{ item.focus }}</p>
                      </div>

                      <span class="assignment-card__count">{{ item.projectCount }} proyectos</span>
                    </div>

                    <div class="assignment-list">
                      @for (project of item.projects; track project) {
                        <span class="assignment-pill">{{ project }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="helper-box">No hay proyectos configurados en columnas que cuenten para carga laboral.</div>
          }
        </div>
      </div>

      <!-- Modal: asignar tecnico a proyecto -->
      @if (modalProject) {
        <div
          class="modal fade show d-block"
          tabindex="-1"
          style="background: rgba(0,0,0,0.5);"
          (click)="closeAssignModal()">
          <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">
                  <i class="bi bi-person-check me-2"></i>Asignar tecnico
                </h5>
                <button type="button" class="btn-close" (click)="closeAssignModal()"></button>
              </div>
              <div class="modal-body">
                <p class="mb-1 fw-semibold">{{ getProjectCode(modalProject) }}</p>
                <p class="text-secondary small mb-3">{{ modalProject.title }}</p>
                <label for="technicianSelect" class="form-label">Tecnico responsable</label>
                <select id="technicianSelect" class="form-select" [(ngModel)]="modalTechnician">
                  <option value="">-- Seleccionar --</option>
                  @for (tech of technicianOptions; track tech) {
                    <option [value]="tech">{{ tech }}</option>
                  }
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" (click)="closeAssignModal()">Cancelar</button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  [disabled]="!modalTechnician || isAssigning"
                  (click)="confirmAssign()">
                  @if (isAssigning) {
                    <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                  }
                  Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class WorkWorkloadComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('workloadChart') private readonly workloadChartRef?: ElementRef<HTMLDivElement>;

  readonly baseCapacity = 2;

  stageLegendItems: StageLegendItem[] = [];
  workloadItems: TechnicianWorkload[] = [];
  allProjects: Project[] = [];
  chartInitError = false;

  /** Ultimo error de sincronizacion del tablero (mismo subject que la vista de proyectos). */
  serverError$ = this.projectService.error$;

  /** Modal state */
  modalProject: Project | null = null;
  modalTechnician = '';
  /** Fase 6: empleados activos de RRHH que alimentan el select de técnico. */
  peopleNames: string[] = [];
  isAssigning = false;

  private chart?: ECharts;
  private themeObserver?: MutationObserver;
  private dataSubscription?: Subscription;
  private boardColumnsMap = new Map<string, BoardColumn>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly projectService: ProjectService,
    private readonly hrPeople: HrPeoplePickerService,
  ) {}

  get totalProjects(): number {
    return this.workloadItems.reduce((sum, item) => sum + item.projectCount, 0);
  }

  get averageProjects(): number {
    return this.workloadItems.length ? this.totalProjects / this.workloadItems.length : 0;
  }

  get overloadedTechnician(): TechnicianWorkload {
    if (!this.workloadItems.length) {
      return this.emptyWorkloadItem('Sin asignaciones');
    }

    return this.workloadItems.reduce((currentMax, item) => {
      return item.projectCount > currentMax.projectCount ? item : currentMax;
    }, this.workloadItems[0]);
  }

  get maxProjectSlots(): number {
    return Math.max(1, ...this.workloadItems.map((item) => item.projects.length));
  }

  get projectSlotNames(): string[] {
    return Array.from({ length: this.maxProjectSlots }, (_, index) => `Proyecto ${index + 1}`);
  }

  get technicianOptions(): string[] {
    const fromWorkload = this.workloadItems.map((item) => item.technician).filter((t) => t !== 'Sin asignar');
    // Fase 6: los técnicos salen de RRHH (hr_employees activos). Los nombres que
    // ya aparecen en cargas se conservan para no dejar en blanco lo histórico.
    // Antes había un fallback de 6 nombres inventados que ocultaba que RRHH
    // estaba vacío.
    return this.hrPeople.merge(this.peopleNames, this.modalTechnician, fromWorkload);
  }

  retryServerSync(): void {
    // Mismo patron que la vista de proyectos: recarga y el banner desaparece si vuelve a funcionar.
    this.projectService.loadProjects('board-1').subscribe();
  }

  ngOnInit(): void {
    this.projectService.loadProjects('board-1').subscribe();
    // Fase 6: el select de técnico se alimenta de RRHH, no de nombres quemados.
    // Contexto tecnica: aquí se asigna trabajo técnico a técnicos; un comercial
    // en esta lista no tiene sentido operativo.
    void this.hrPeople.refresh('tecnica').then((names) => {
      this.peopleNames = names;
    });
    this.dataSubscription = combineLatest([this.projectService.projectsWithTasks$, this.projectService.board$]).subscribe({
      next: ([projects, board]) => {
        this.allProjects = [...projects].sort((a, b) => this.getProjectCode(a).localeCompare(this.getProjectCode(b)));
        this.rebuildWorkload(projects, board?.columns ?? []);
        this.updateChartOptions();
      },
    });
  }

  ngAfterViewInit(): void {
    this.initializeChart();
  }

  ngOnDestroy(): void {
    this.dataSubscription?.unsubscribe();
    this.themeObserver?.disconnect();
    this.chart?.dispose();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.chart?.resize();
  }

  private rebuildWorkload(projects: Project[], columns: BoardColumn[]): void {
    const orderedColumns = [...columns].sort((left, right) => left.order - right.order);
    this.boardColumnsMap = new Map(orderedColumns.map((column) => [column.id, column]));
    this.stageLegendItems = orderedColumns
      .filter((column) => column.includeInWorkload)
      .map((column) => ({
        key: column.id,
        label: column.name,
        color: column.color,
      }));

    const grouped = new Map<string, Array<{ label: string; load: number; stage: string; focus: string }>>();

    for (const project of projects) {
      const column = this.boardColumnsMap.get(project.status);
      if (!column?.includeInWorkload) {
        continue;
      }

      const technician = String(project.properties['assignee'] ?? '').trim() || 'Sin asignar';
      const projectLabel = String(project.properties['shortCode'] ?? '').trim() || project.title.trim() || project.id;
      const projectLoad = this.calculateProjectLoad(project);
      const focusLabel = `${column.name} · ${String(project.properties['client'] ?? '').trim() || project.title.trim() || 'Sin cliente'}`;
      const entries = grouped.get(technician) ?? [];

      entries.push({
        label: projectLabel,
        load: projectLoad,
        stage: project.status,
        focus: focusLabel,
      });
      grouped.set(technician, entries);
    }

    this.workloadItems = Array.from(grouped.entries())
      .map(([technician, entries]) => {
        const orderedEntries = [...entries].sort((left, right) => right.load - left.load || left.label.localeCompare(right.label));

        return {
          technician,
          projectCount: orderedEntries.length,
          projects: orderedEntries.map((entry) => entry.label),
          projectLoads: orderedEntries.map((entry) => entry.load),
          projectStages: orderedEntries.map((entry) => entry.stage),
          focus: orderedEntries[0]?.focus ?? 'Sin foco activo',
        };
      })
      .sort((left, right) => right.projectCount - left.projectCount || left.technician.localeCompare(right.technician));
  }

  private calculateProjectLoad(project: Project): number {
    const estimatedHours = this.normalizeNumber(project.properties['estimatedHours']);
    const actualHours = this.normalizeNumber(project.properties['actualHours']);
    const candidateHours = estimatedHours > 0 ? estimatedHours : actualHours > 0 ? actualHours : 8;
    return Math.max(1, Math.round(candidateHours / 8));
  }

  private normalizeNumber(value: unknown): number {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private emptyWorkloadItem(technician: string): TechnicianWorkload {
    return {
      technician,
      projectCount: 0,
      projects: [],
      projectLoads: [],
      projectStages: [],
      focus: 'Sin foco activo',
    };
  }

  getProjectCode(project: Project): string {
    return String(project.properties['shortCode'] ?? '').trim() || project.title.trim() || project.id;
  }

  getProjectAssignee(project: Project): string {
    return String(project.properties['assignee'] ?? '').trim();
  }

  openAssignModal(project: Project): void {
    this.modalProject = project;
    this.modalTechnician = this.getProjectAssignee(project);
    this.isAssigning = false;
  }

  closeAssignModal(): void {
    this.modalProject = null;
    this.modalTechnician = '';
    this.isAssigning = false;
  }

  confirmAssign(): void {
    if (!this.modalProject || !this.modalTechnician) {
      return;
    }

    this.isAssigning = true;
    const projectId = this.modalProject.id;
    const technician = this.modalTechnician;

    this.projectService.updateProject(projectId, {
      properties: {
        ...this.modalProject.properties,
        assignee: technician,
      },
    }).subscribe({
      next: () => {
        this.closeAssignModal();
      },
      error: () => {
        this.isAssigning = false;
      },
    });
  }

  private initializeChart(): void {
    const chartElement = this.workloadChartRef?.nativeElement;

    if (!chartElement) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      try {
        this.chart?.dispose();
        this.chart = echarts.init(chartElement);
        this.chart.setOption(this.buildChartOptions(), true);
        this.observeThemeChanges();
      } catch (error) {
        console.error('Unable to initialize workload chart', error);
        this.ngZone.run(() => {
          this.chartInitError = true;
        });
      }
    });
  }

  private updateChartOptions(): void {
    if (!this.workloadChartRef?.nativeElement) {
      return;
    }

    const chart = this.chart;
    if (!chart) {
      this.initializeChart();
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      chart.setOption(this.buildChartOptions(), true);
      chart.resize();
    });
  }

  private buildChartOptions(): EChartsOption {
    const maxProjectLoad = Math.max(5, ...this.workloadItems.flatMap((item) => item.projectLoads), 0);
    const themeTokens = this.getChartThemeTokens();
    const yAxisRich = this.buildYAxisRichStyles(themeTokens);

    if (!this.workloadItems.length) {
      return {
        title: {
          text: 'Carga laboral por tecnico',
          left: 'center',
          textStyle: {
            fontSize: 24,
            fontWeight: 700,
            color: themeTokens.bodyColor,
          },
        },
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: 'No hay proyectos activos en columnas de carga laboral.',
            fill: themeTokens.mutedColor,
            fontSize: 15,
            fontWeight: 600,
          },
        },
      };
    }

    return {
      animationDuration: 800,
      animationEasing: 'cubicOut',
      title: {
        text: 'Carga laboral por tecnico',
        left: 'center',
        textStyle: {
          fontSize: 24,
          fontWeight: 700,
          color: themeTokens.bodyColor,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: themeTokens.tooltipBackground,
        borderColor: themeTokens.tooltipBorder,
        borderWidth: 1,
        textStyle: {
          color: themeTokens.bodyColor,
        },
        extraCssText: 'box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);',
        formatter: (params: unknown) => {
          const rows = (Array.isArray(params) ? params : [params]).filter(
            (row): row is { dataIndex: number; seriesIndex: number; marker: string; seriesName: string; value: number } => {
              return typeof row === 'object' && row !== null && 'dataIndex' in row && 'seriesIndex' in row && 'value' in row && 'marker' in row && 'seriesName' in row;
            },
          );

          if (!rows.length) {
            return '';
          }

          const item = this.workloadItems[rows[0].dataIndex];
          if (!item) {
            return '';
          }

          const values = rows
            .filter((row) => Number(row.value) > 0)
            .map((row) => {
              const projectName = item.projects[row.seriesIndex] ?? row.seriesName;
              const stage = item.projectStages[row.seriesIndex];
              return `${row.marker}<strong>${projectName}</strong>: ${row.value} pts <span style="color:${themeTokens.mutedColor}">(${this.getStageLabel(stage)})</span>`;
            })
            .join('<br/>');

          return [
            `<strong>${item.technician}</strong>`,
            values,
            `<span style="color:${themeTokens.mutedColor}">Total:</span> <strong>${item.projectCount}</strong> proyectos`,
            `<span style="color:${themeTokens.mutedColor}">Asignaciones:</span> ${item.projects.join(', ')}`,
          ].join('<br/>');
        },
      },
      legend: {
        show: false,
      },
      grid: {
        left: 115,
        right: 230,
        top: 70,
        bottom: 72,
      },
      toolbox: {
        show: true,
        right: 12,
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: {
        type: 'value',
        name: 'Carga estimada',
        min: 0,
        max: maxProjectLoad + 4,
        interval: 2,
        axisLabel: {
          formatter: '{value}',
          color: themeTokens.mutedColor,
        },
        nameTextStyle: {
          color: themeTokens.mutedColor,
          padding: [0, 0, 0, 18],
        },
        splitLine: {
          lineStyle: {
            color: themeTokens.splitLineColor,
          },
        },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: this.workloadItems.map((item) => item.technician),
        axisLine: {
          show: true,
          lineStyle: {
            color: themeTokens.axisLineColor,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          formatter: (value: string) => {
            const richKey = this.toRichKey(value);
            return `{${richKey}| }\n{value|${value}}`;
          },
          margin: 20,
          rich: yAxisRich,
        },
      },
      series: this.buildProjectSeries(themeTokens),
    };
  }

  private buildProjectSeries(themeTokens: ChartThemeTokens): Array<Record<string, unknown>> {
    return this.projectSlotNames.map((slotName, slotIndex) => ({
      name: slotName,
      type: 'bar',
      data: this.workloadItems.map((item) => {
        const value = item.projectLoads[slotIndex];
        if (typeof value !== 'number') {
          return null;
        }

        return {
          value,
          itemStyle: {
            color: this.getStageColor(item.projectStages[slotIndex]),
            borderRadius: [0, 8, 8, 0],
          },
        };
      }),
      barMaxWidth: 18,
      label: this.buildProjectLabel(slotIndex, themeTokens),
      emphasis: {
        focus: 'series',
      },
    }));
  }

  private buildProjectLabel(slotIndex: number, themeTokens: ChartThemeTokens): Record<string, unknown> {
    return {
      show: true,
      position: 'right',
      distance: 8,
      formatter: (params: unknown) => {
        const dataIndex = typeof params === 'object' && params !== null && 'dataIndex' in params ? Number(params.dataIndex) : -1;
        const value = typeof params === 'object' && params !== null && 'value' in params ? Number(params.value) : 0;
        const item = this.workloadItems[dataIndex];
        const projectName = item?.projects[slotIndex];

        if (!projectName || !value) {
          return '';
        }

        return `{project|${projectName}} {value|${value}}`;
      },
      rich: {
        project: {
          color: themeTokens.bodyColor,
          fontSize: 11,
          fontWeight: 600,
        },
        value: {
          color: themeTokens.subtleColor,
          fontSize: 11,
          padding: [0, 0, 0, 6],
        },
      },
    };
  }

  private buildYAxisRichStyles(themeTokens: ChartThemeTokens): Record<string, any> {
    const rich: Record<string, any> = {
      value: {
        lineHeight: 30,
        align: 'center',
        color: themeTokens.bodyColor,
        fontWeight: 600,
        fontSize: 13,
      },
    };

    for (const item of this.workloadItems) {
      rich[this.toRichKey(item.technician)] = {
        height: 40,
        align: 'center',
        backgroundColor: {
          image: this.createTechnicianAvatar(item.technician),
        },
      };
    }

    return rich;
  }

  private getStageColor(stageId: string | undefined): string {
    return stageId ? this.boardColumnsMap.get(stageId)?.color ?? '#94a3b8' : '#94a3b8';
  }

  private getStageLabel(stageId: string | undefined): string {
    return stageId ? this.boardColumnsMap.get(stageId)?.name ?? stageId : 'Sin etapa';
  }

  private getChartThemeTokens(): ChartThemeTokens {
    const root = this.workloadChartRef?.nativeElement.ownerDocument.documentElement ?? document.documentElement;
    const styles = getComputedStyle(root);
    const bodyColor = styles.getPropertyValue('--bs-body-color').trim() || '#334155';
    const bodyColorRgb = styles.getPropertyValue('--bs-body-color-rgb').trim();
    const bodyBgRgb = styles.getPropertyValue('--bs-body-bg-rgb').trim();
    const isDark = root.getAttribute('data-bs-theme') === 'dark';

    return {
      bodyColor,
      mutedColor: bodyColorRgb ? `rgba(${bodyColorRgb}, 0.74)` : isDark ? 'rgba(226, 232, 240, 0.74)' : '#64748b',
      subtleColor: bodyColorRgb ? `rgba(${bodyColorRgb}, 0.58)` : isDark ? 'rgba(226, 232, 240, 0.58)' : '#64748b',
      axisLineColor: bodyColorRgb ? `rgba(${bodyColorRgb}, 0.34)` : isDark ? 'rgba(226, 232, 240, 0.34)' : '#94a3b8',
      splitLineColor: bodyColorRgb ? `rgba(${bodyColorRgb}, 0.12)` : isDark ? 'rgba(226, 232, 240, 0.12)' : 'rgba(148, 163, 184, 0.26)',
      tooltipBackground: bodyBgRgb ? `rgba(${bodyBgRgb}, 0.96)` : isDark ? 'rgba(17, 24, 39, 0.96)' : 'rgba(255, 255, 255, 0.96)',
      tooltipBorder: bodyColorRgb ? `rgba(${bodyColorRgb}, 0.14)` : isDark ? 'rgba(226, 232, 240, 0.14)' : '#d0d7de',
    };
  }

  private observeThemeChanges(): void {
    const root = this.workloadChartRef?.nativeElement.ownerDocument.documentElement;

    if (!root || typeof MutationObserver === 'undefined') {
      return;
    }

    this.themeObserver?.disconnect();
    this.themeObserver = new MutationObserver((mutations) => {
      const themeChanged = mutations.some((mutation) => mutation.attributeName === 'data-bs-theme');
      if (!themeChanged) {
        return;
      }

      this.chart?.setOption(this.buildChartOptions(), true);
      this.chart?.resize();
    });
    this.themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ['data-bs-theme'],
    });
  }

  private createTechnicianAvatar(name: string): string {
    const palette = ['#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#10b981', '#3b82f6', '#ec4899'];
    const colorIndex = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
    const initials = name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="${palette[colorIndex]}" /><text x="20" y="24" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff">${initials}</text></svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private toRichKey(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, '');
  }
}