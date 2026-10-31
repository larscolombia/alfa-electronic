import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { Subscription, catchError, combineLatest, forkJoin, of } from "rxjs";
import {
  CrmEquipmentApiService,
  EquipmentTechnicianOption,
} from "../../../services/crm-equipment-api.service";
import {
  ProspectEquipmentItem,
  ProspectEquipmentRecord,
} from "../crm/crm-prospect-equipment.store";
import { BoardColumn, Project } from "../projects/models";
import { ProjectService } from "../projects/services";

type WorkloadTab = "queue" | "history";
interface EquipmentQueueItem {
  record: ProspectEquipmentRecord;
  item: ProspectEquipmentItem;
  receivedAt: string;
}
interface CandidateRow {
  technician: EquipmentTechnicianOption;
  total: number;
  stages: Record<string, number>;
  stageProjects: Record<string, Project[]>;
  compatible: boolean;
}
interface StagePreview {
  technician: string;
  stage: BoardColumn;
  projects: Project[];
  left: number;
  top: number;
}

@Component({
  selector: "app-work-workload",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [
    `
      .affectation-tabs {
        border-bottom: 1px solid rgba(var(--bs-body-color-rgb), 0.12);
      }
      .affectation-tab {
        border: 0;
        border-bottom: 3px solid transparent;
        background: transparent;
        padding: 0.65rem 1rem;
        color: var(--bs-secondary-color);
        font-weight: 600;
      }
      .affectation-tab.is-active {
        border-bottom-color: var(--adminuiux-theme-1);
        color: var(--bs-body-color);
      }
      .affectation-region {
        max-height: calc(100vh - 245px);
        overflow: auto;
      }
      .affectation-region thead th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: var(--bs-body-bg);
      }
      .queue-row {
        cursor: pointer;
      }
      .queue-row.is-selected {
        background: rgba(var(--adminuiux-theme-1-rgb), 0.1);
      }
      .candidate-incompatible {
        opacity: 0.48;
      }
      .candidate-least {
        box-shadow: inset 4px 0 0 #198754;
      }
      .stage-dot {
        width: 0.65rem;
        height: 0.65rem;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.25rem;
      }
      .matrix-note {
        font-size: 0.78rem;
      }
      .matrix-count {
        font-size: 1.15rem;
        font-weight: 700;
      }
      .candidate-stages {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        min-width: 13rem;
      }
      .candidate-stage {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        padding: 0.15rem 0.35rem;
        border: 1px solid rgba(var(--bs-body-color-rgb), 0.14);
        border-radius: 0.3rem;
        font-size: 0.72rem;
        line-height: 1.1;
        white-space: nowrap;
      }
      .candidate-stage {
        background: var(--bs-body-bg);
        cursor: help;
      }
      .stage-preview {
        position: fixed;
        z-index: 1080;
        width: min(23rem, calc(100vw - 1.5rem));
        max-height: min(20rem, calc(100vh - 1.5rem));
        overflow: auto;
        border: 1px solid rgba(var(--bs-body-color-rgb), 0.15);
        border-radius: 0.5rem;
        background: var(--bs-body-bg);
        box-shadow: 0 0.75rem 2rem rgba(0, 0, 0, 0.2);
      }
      @media (max-width: 991.98px) {
        .affectation-region {
          max-height: none;
          overflow: visible;
        }
      }
    `,
  ],
  template: `
    <div class="container-fluid py-3">
      <!-- Titulo y subtitulo los pinta el encabezado global (isWorkWorkloadPage) -->
      <div class="row gx-3 align-items-center page-title">
        <div class="col"></div>
        <div class="col-auto">
          <a
            class="btn btn-outline-secondary btn-sm"
            routerLink="/app/work-teams"
            >Equipo técnico</a
          >
        </div>
      </div>
    </div>
    <main class="container-fluid px-3 px-xl-4 mt-2" id="main-content">
      @if (message) {
        <div
          class="alert border mb-3"
          [class.alert-success]="messageType === 'success'"
          [class.alert-danger]="messageType === 'danger'"
          role="status"
        >
          {{ message }}
          <button
            *ngIf="messageType === 'danger'"
            class="btn btn-sm btn-outline-danger ms-2"
            (click)="retryLoad()"
          >
            Reintentar
          </button>
        </div>
      }
      <nav class="affectation-tabs d-flex gap-1 mb-3" role="tablist">
        <button
          class="affectation-tab"
          type="button"
          data-testid="workload-tab-queue"
          [class.is-active]="activeTab === 'queue'"
          (click)="setTab('queue')"
        >
          Pendientes de afectación
          <span class="badge text-bg-warning ms-1">{{
            pendingItems.length
          }}</span></button
        ><button
          class="affectation-tab"
          type="button"
          data-testid="workload-tab-history"
          [class.is-active]="activeTab === 'history'"
          (click)="setTab('history')"
        >
          Histórico
        </button>
      </nav>
      @if (activeTab === "queue") {
        <section data-testid="workload-queue-panel">
          <div class="row g-3">
            <div class="col-12 col-xl-4">
              <div class="card adminuiux-card">
                <div
                  class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center"
                >
                  <div>
                    <h6 class="mb-0">Cola de afectación</h6>
                    <p class="small text-secondary mb-0">
                      Equipos recibidos aún sin técnico.
                    </p>
                  </div>
                  <input
                    class="form-control form-control-sm"
                    style="max-width:15rem"
                    type="search"
                    placeholder="Código, cliente o equipo"
                    [(ngModel)]="queueFilter"
                  />
                </div>
                <div class="card-body p-0 affectation-region">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Equipo</th>
                        <th>Cliente</th>
                        <th>Tipo / servicio</th>
                        <th>Falla</th>
                        <th>Recepción</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (
                        entry of filteredPendingItems;
                        track entry.item.id
                      ) {
                        <tr
                          class="queue-row"
                          [class.is-selected]="
                            selectedItem &&
                            selectedItem.item.id === entry.item.id
                          "
                          (click)="selectItem(entry)"
                          [attr.data-testid]="
                            'affectation-queue-' + entry.item.id
                          "
                        >
                          <td>
                            <strong>{{ equipmentLabel(entry) }}</strong
                            ><small class="d-block text-secondary"
                              >{{ entry.item.marca || "Sin marca" }} ·
                              {{ entry.item.serie || "Sin serie" }}</small
                            >
                          </td>
                          <td>
                            {{
                              entry.record.companyName ||
                                entry.record.prospectName ||
                                "Sin cliente"
                            }}
                          </td>
                          <td>{{ itemSpeciality(entry.item) }}</td>
                          <td class="text-truncate" style="max-width:10rem">
                            {{
                              entry.item.failureDescription ||
                                "Sin falla reportada"
                            }}
                          </td>
                          <td>{{ entry.receivedAt | date: "dd/MM/yy" }}</td>
                        </tr>
                      } @empty {
                        <tr>
                          <td
                            colspan="5"
                            class="text-center text-secondary py-4"
                          >
                            No hay equipos pendientes de afectación.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="col-12 col-xl-8">
              <div
                class="card adminuiux-card h-100"
                data-testid="affectation-decision-panel"
              >
                <div class="card-header">
                  @if (selectedItem) {
                    <div class="d-flex justify-content-between gap-2">
                      <div>
                        <h6 class="mb-0">Matriz de decisión</h6>
                        <p class="small text-secondary mb-0">
                          {{ equipmentLabel(selectedItem) }} ·
                          {{ itemSpeciality(selectedItem.item) }} ·
                          {{
                            selectedItem.item.storageLocationName ||
                              "Sin ubicación"
                          }}
                        </p>
                      </div>
                      <button
                        class="btn btn-sm btn-outline-secondary"
                        (click)="sortDescending = !sortDescending"
                      >
                        Orden:
                        {{ sortDescending ? "mayor carga" : "menor carga" }}
                      </button>
                    </div>
                  } @else {
                    <h6 class="mb-0">Matriz de decisión</h6>
                    <p class="small text-secondary mb-0">
                      Seleccione un equipo de la cola.
                    </p>
                  }
                </div>
                <div class="card-body p-0 affectation-region">
                  @if (selectedItem) {
                    @if (!hasSpeciality) {
                      <div class="alert alert-warning m-3 py-2 matrix-note">
                        Sin especialidad registrada: se muestran todos los
                        técnicos de Técnica. No se simula un filtro de
                        compatibilidad.
                      </div>
                    }
                    @if (specialityFilterUnavailable) {
                      <div
                        class="alert alert-warning m-3 py-2 matrix-note"
                        role="status"
                      >
                        No hay un mapeo de técnicos para esta especialidad. Se
                        muestran todos los técnicos de Técnica para no bloquear
                        la afectación; verifica la compatibilidad antes de
                        asignar.
                      </div>
                    }
                    @if (isLoadingCandidates) {
                      <p class="text-secondary p-3 mb-0">
                        Cargando candidatos…
                      </p>
                    } @else {
                      <div>
                        <table class="table table-sm align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Técnico / especialidad</th>
                              <th>Total activos</th>
                              <th>Etapas activas</th>
                              <th>Estado</th>
                              <th class="text-end">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (
                              candidate of sortedCandidates;
                              track candidate.technician.id
                            ) {
                              <tr
                                [class.candidate-incompatible]="
                                  !candidate.compatible
                                "
                                [class.candidate-least]="
                                  candidate.compatible &&
                                  candidate.total === leastCompatibleLoad
                                "
                              >
                                <td>
                                  <strong>{{
                                    candidate.technician.name
                                  }}</strong
                                  ><small class="d-block text-secondary">{{
                                    candidate.compatible
                                      ? itemSpeciality(selectedItem.item)
                                      : "No compatible con la especialidad"
                                  }}</small>
                                </td>
                                <td>
                                  <span class="matrix-count">{{
                                    candidate.total
                                  }}</span
                                  ><small class="d-block text-secondary"
                                    >pasará a {{ candidate.total + 1 }}</small
                                  >
                                </td>
                                <td>
                                  <div class="candidate-stages">
                                    @for (stage of stages; track stage.id) {
                                      <button
                                        class="candidate-stage"
                                        type="button"
                                        (mouseenter)="
                                          showStagePreview(
                                            candidate,
                                            stage,
                                            $event
                                          )
                                        "
                                        (focus)="
                                          showStagePreview(
                                            candidate,
                                            stage,
                                            $event
                                          )
                                        "
                                        (mouseleave)="
                                          scheduleStagePreviewClose()
                                        "
                                        (blur)="scheduleStagePreviewClose()"
                                      >
                                        <span
                                          class="stage-dot mb-0"
                                          [style.background]="stage.color"
                                        ></span>
                                        {{ stage.name }}:
                                        {{ candidate.stages[stage.id] || 0 }}
                                      </button>
                                    }
                                  </div>
                                </td>
                                <td>
                                  <span
                                    class="badge"
                                    [class.text-bg-success]="
                                      loadLabel(candidate) === 'Menor carga'
                                    "
                                    [class.text-bg-warning]="
                                      loadLabel(candidate) === 'Carga media'
                                    "
                                    [class.text-bg-danger]="
                                      loadLabel(candidate) === 'Mayor carga'
                                    "
                                    >{{ loadLabel(candidate) }}</span
                                  >
                                </td>
                                <td class="text-end">
                                  @if (candidate.compatible) {
                                    <button
                                      class="btn btn-sm btn-theme"
                                      [disabled]="isAssigning"
                                      (click)="
                                        assign(
                                          selectedItem,
                                          candidate.technician
                                        )
                                      "
                                      [attr.data-testid]="
                                        'affectation-assign-' +
                                        candidate.technician.id
                                      "
                                    >
                                      Asignar
                                    </button>
                                  } @else {
                                    <span class="small text-secondary"
                                      >No elegible</span
                                    >
                                  }
                                </td>
                              </tr>
                            } @empty {
                              <tr>
                                <td colspan="5" class="text-secondary p-3">
                                  No hay técnicos activos disponibles.
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  } @else {
                    <p class="text-secondary p-3 mb-0">
                      Elija un equipo para ver carga, etapas y técnicos
                      compatibles sin salir de esta vista.
                    </p>
                  }
                </div>
              </div>
            </div>
          </div>
        </section>
      }
      @if (activeTab === "history") {
        <section data-testid="workload-history-panel">
          <div class="card adminuiux-card">
            <div
              class="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between"
            >
              <div>
                <h6 class="mb-0">Histórico de afectaciones</h6>
                <p class="small text-secondary mb-0">
                  {{ filteredAssignedItems.length }} resultado(s)
                </p>
              </div>
              <input
                class="form-control form-control-sm"
                style="max-width:18rem"
                type="search"
                placeholder="Buscar equipo, técnico o cliente"
                [(ngModel)]="historyFilter"
                (ngModelChange)="resetHistoryPage()"
                data-testid="workload-history-search"
              />
            </div>
            <div class="card-body p-0 affectation-region">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Equipo</th>
                    <th>Técnico</th>
                    <th>Cliente</th>
                    <th>Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (entry of pagedAssignedItems; track entry.item.id) {
                    <tr>
                      <td>{{ equipmentLabel(entry) }}</td>
                      <td>{{ entry.item.assignedTo }}</td>
                      <td>
                        {{
                          entry.record.companyName || entry.record.prospectName
                        }}
                      </td>
                      <td>
                        {{ entry.item.assignedAt | date: "dd/MM/yy HH:mm" }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="4" class="text-center text-secondary py-4">
                        No hay equipos afectados.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div
              class="card-footer d-flex align-items-center justify-content-between"
            >
              <span class="small text-secondary"
                >Página {{ historyPage + 1 }}</span
              >
              <div class="btn-group" aria-label="Paginación del histórico">
                <button
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  [disabled]="historyPage === 0"
                  (click)="historyPage = historyPage - 1"
                >
                  Anterior
                </button>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  type="button"
                  [disabled]="!historyHasNextPage"
                  (click)="historyPage = historyPage + 1"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </section>
      }
      @if (stagePreview) {
        <aside
          class="stage-preview"
          [style.left.px]="stagePreview.left"
          [style.top.px]="stagePreview.top"
          role="dialog"
          aria-label="Proyectos de la etapa"
          (mouseenter)="cancelStagePreviewClose()"
          (mouseleave)="scheduleStagePreviewClose()"
        >
          <div class="p-2 border-bottom">
            <strong>{{ stagePreview.stage.name }}</strong
            ><span class="text-secondary small d-block"
              >{{ stagePreview.technician }} ·
              {{ stagePreview.projects.length }} proyecto(s)</span
            >
          </div>
          @if (stagePreview.projects.length) {
            <div class="list-group list-group-flush">
              @for (project of stagePreview.projects; track project.id) {
                <button
                  class="list-group-item list-group-item-action"
                  type="button"
                  (click)="openProject(project)"
                >
                  <strong>{{ projectCode(project) }}</strong
                  ><span class="d-block small text-secondary text-truncate">{{
                    project.title
                  }}</span>
                </button>
              }
            </div>
          } @else {
            <p class="text-secondary small p-3 mb-0">
              No hay proyectos en esta etapa.
            </p>
          }
        </aside>
      }
    </main>
  `,
})
export class WorkWorkloadComponent implements OnInit, OnDestroy {
  activeTab: WorkloadTab = "queue";
  records: ProspectEquipmentRecord[] = [];
  projects: Project[] = [];
  stages: BoardColumn[] = [];
  selectedItem: EquipmentQueueItem | null = null;
  candidates: CandidateRow[] = [];
  queueFilter = "";
  historyFilter = "";
  historyPage = 0;
  readonly historyPageSize = 10;
  sortDescending = true;
  message = "";
  messageType: "success" | "danger" = "success";
  isLoadingCandidates = false;
  isAssigning = false;
  specialityFilterUnavailable = false;
  stagePreview: StagePreview | null = null;
  private stagePreviewCloseTimer?: ReturnType<typeof setTimeout>;
  private readonly subscription = new Subscription();
  constructor(
    private readonly equipmentApi: CrmEquipmentApiService,
    private readonly projectService: ProjectService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}
  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get("tab");
      if (tab === "queue" || tab === "history") this.activeTab = tab;
    });
    this.projectService.loadProjects("board-1").subscribe();
    this.subscription.add(
      combineLatest([
        this.projectService.projectsWithTasks$,
        this.projectService.board$,
      ]).subscribe(([projects, board]) => {
        this.projects = projects;
        this.stages = (board?.columns ?? []).filter(
          (column) => column.includeInWorkload,
        );
        this.recalculateCandidates();
      }),
    );
    this.loadRecords();
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.cancelStagePreviewClose();
  }
  get flattenedItems(): EquipmentQueueItem[] {
    return this.records.flatMap((record) =>
      (record.items || []).map((item) => ({
        record,
        item,
        receivedAt: record.intakeReceivedAt || record.createdAt || "",
      })),
    );
  }
  get pendingItems(): EquipmentQueueItem[] {
    return this.flattenedItems.filter(
      (entry) =>
        !String(entry.item.assignedToId || entry.item.assignedTo || "").trim(),
    );
  }
  get assignedItems(): EquipmentQueueItem[] {
    return this.flattenedItems.filter((entry) =>
      Boolean(
        String(entry.item.assignedToId || entry.item.assignedTo || "").trim(),
      ),
    );
  }
  get filteredPendingItems(): EquipmentQueueItem[] {
    const query = this.queueFilter.trim().toLowerCase();
    return !query
      ? this.pendingItems
      : this.pendingItems.filter((entry) =>
          [
            this.equipmentLabel(entry),
            entry.record.companyName,
            entry.record.prospectName,
            entry.item.marca,
            entry.item.tipo,
            entry.item.serviceTypeName,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          ),
        );
  }
  get filteredAssignedItems(): EquipmentQueueItem[] {
    const query = this.historyFilter.trim().toLowerCase();
    const items = this.assignedItems.filter((entry) =>
      !query
        ? true
        : [
            this.equipmentLabel(entry),
            entry.item.assignedTo,
            entry.record.companyName,
            entry.record.prospectName,
            entry.item.marca,
            entry.item.tipo,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          ),
    );
    return [...items].sort((left, right) =>
      String(right.item.assignedAt || "").localeCompare(
        String(left.item.assignedAt || ""),
      ),
    );
  }
  get pagedAssignedItems(): EquipmentQueueItem[] {
    const start = this.historyPage * this.historyPageSize;
    return this.filteredAssignedItems.slice(
      start,
      start + this.historyPageSize,
    );
  }
  get historyHasNextPage(): boolean {
    return (
      (this.historyPage + 1) * this.historyPageSize <
      this.filteredAssignedItems.length
    );
  }
  resetHistoryPage(): void {
    this.historyPage = 0;
  }
  get hasSpeciality(): boolean {
    return Boolean(
      this.selectedItem &&
      String(
        this.selectedItem.item.serviceTypeName ||
          this.selectedItem.item.familyName ||
          "",
      ).trim(),
    );
  }
  get leastCompatibleLoad(): number {
    const candidates = this.candidates.filter(
      (candidate) => candidate.compatible,
    );
    return candidates.length
      ? Math.min(...candidates.map((candidate) => candidate.total))
      : 0;
  }
  get sortedCandidates(): CandidateRow[] {
    return [...this.candidates].sort((a, b) => {
      const load = this.sortDescending ? b.total - a.total : a.total - b.total;
      return (
        load ||
        Number(b.compatible) - Number(a.compatible) ||
        a.technician.name.localeCompare(b.technician.name)
      );
    });
  }
  setTab(tab: WorkloadTab): void {
    this.activeTab = tab;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: "merge",
    });
  }
  equipmentLabel(entry: EquipmentQueueItem): string {
    return String(
      entry.item.equipmentCode ||
        entry.item.receivedIdentifier ||
        entry.item.serie ||
        entry.item.customerShipmentReference ||
        entry.item.id,
    ).trim();
  }
  itemSpeciality(item: ProspectEquipmentItem): string {
    return String(
      item.serviceTypeName ||
        item.familyName ||
        item.tipo ||
        "Sin especialidad",
    ).trim();
  }
  projectCode(project: Project): string {
    return String(
      project.properties?.["shortCode"] || project.title || project.id,
    ).trim();
  }
  showStagePreview(
    candidate: CandidateRow,
    stage: BoardColumn,
    event: Event,
  ): void {
    this.cancelStagePreviewClose();
    const pointer = event as MouseEvent;
    const maxLeft = Math.max(12, window.innerWidth - 380);
    const maxTop = Math.max(12, window.innerHeight - 330);
    this.stagePreview = {
      technician: candidate.technician.name,
      stage,
      projects: candidate.stageProjects[stage.id] ?? [],
      left: Math.min(maxLeft, Math.max(12, pointer.clientX || 12)),
      top: Math.min(maxTop, Math.max(12, (pointer.clientY || 12) + 12)),
    };
  }
  scheduleStagePreviewClose(): void {
    this.cancelStagePreviewClose();
    this.stagePreviewCloseTimer = setTimeout(
      () => (this.stagePreview = null),
      180,
    );
  }
  cancelStagePreviewClose(): void {
    if (this.stagePreviewCloseTimer) clearTimeout(this.stagePreviewCloseTimer);
  }
  openProject(project: Project): void {
    this.stagePreview = null;
    void this.router.navigate(["/app/work-projects", project.id]);
  }
  selectItem(entry: EquipmentQueueItem): void {
    this.selectedItem = entry;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { item: entry.item.id },
      queryParamsHandling: "merge",
    });
    this.loadCandidates(entry);
  }
  loadLabel(candidate: CandidateRow): string {
    const compatible = this.candidates
      .filter((entry) => entry.compatible)
      .map((entry) => entry.total);
    if (compatible.length < 2) return "Carga actual";
    const minimum = Math.min(...compatible);
    const maximum = Math.max(...compatible);
    if (candidate.total === minimum) return "Menor carga";
    if (candidate.total === maximum) return "Mayor carga";
    return "Carga media";
  }
  retryLoad(): void {
    this.message = "";
    this.loadRecords();
    if (this.selectedItem) this.loadCandidates(this.selectedItem);
  }
  private loadRecords(): void {
    this.equipmentApi.listRecords({ includeArchived: false }).subscribe({
      next: (records) => {
        this.records = records;
        const requested = this.route.snapshot.queryParamMap.get("item");
        const reception = this.route.snapshot.queryParamMap.get("reception");
        const entry =
          this.pendingItems.find(
            (candidate) => candidate.item.id === requested,
          ) ??
          this.pendingItems.find(
            (candidate) => candidate.record.id === reception,
          );
        if (entry) this.selectItem(entry);
      },
      error: () =>
        this.setMessage(
          "No se pudieron cargar los equipos recibidos.",
          "danger",
        ),
    });
  }
  private loadCandidates(entry: EquipmentQueueItem): void {
    this.isLoadingCandidates = true;
    this.specialityFilterUnavailable = false;
    const speciality = this.hasSpeciality
      ? this.itemSpeciality(entry.item)
      : "";
    forkJoin({
      all: this.equipmentApi.listTechnicians({ context: "tecnica" }),
      compatible: speciality
        ? this.equipmentApi
            .listTechnicians({ speciality, context: "tecnica" })
            .pipe(
              catchError(() => {
                this.specialityFilterUnavailable = true;
                return of([] as EquipmentTechnicianOption[]);
              }),
            )
        : this.equipmentApi.listTechnicians({ context: "tecnica" }),
    }).subscribe({
      next: ({ all, compatible }) => {
        // El catálogo aún no modela especialidades de técnico. Una respuesta
        // vacía no puede bloquear la afectación: se muestran técnicos de
        // Técnica y se exige la validación humana de compatibilidad.
        if (speciality && compatible.length === 0) {
          this.specialityFilterUnavailable = true;
        }
        const eligible = new Set(compatible.map((technician) => technician.id));
        this.candidates = this.makeRows(
          all,
          (technician) =>
            !speciality ||
            this.specialityFilterUnavailable ||
            eligible.has(technician.id),
        );
        this.isLoadingCandidates = false;
      },
      error: () => {
        this.candidates = [];
        this.isLoadingCandidates = false;
        this.setMessage(
          "No se pudieron cargar los técnicos candidatos.",
          "danger",
        );
      },
    });
  }
  private recalculateCandidates(): void {
    if (this.candidates.length)
      this.candidates = this.makeRows(
        this.candidates.map((candidate) => candidate.technician),
        (technician) =>
          this.candidates.find(
            (candidate) => candidate.technician.id === technician.id,
          )?.compatible ?? false,
      );
  }
  private makeRows(
    technicians: EquipmentTechnicianOption[],
    compatible: (technician: EquipmentTechnicianOption) => boolean,
  ): CandidateRow[] {
    return technicians.map((technician) => {
      const linked = this.projects.filter(
        (project) =>
          String(project.properties?.["assignee"] || "").trim() ===
          technician.name,
      );
      const stages: Record<string, number> = {};
      const stageProjects: Record<string, Project[]> = {};
      linked.forEach((project) => {
        stages[project.status] = (stages[project.status] || 0) + 1;
        (stageProjects[project.status] ??= []).push(project);
      });
      return {
        technician,
        total: linked.length,
        stages,
        stageProjects,
        compatible: compatible(technician),
      };
    });
  }
  assign(
    entry: EquipmentQueueItem,
    technician: EquipmentTechnicianOption,
  ): void {
    this.isAssigning = true;
    this.equipmentApi
      .assignItemTechnician(entry.record.id, entry.item.id, {
        assignedToId: technician.id,
        assignedTo: technician.name,
        assignedAt: new Date().toISOString(),
      })
      .subscribe({
        next: () => {
          this.syncLinkedProject(entry, technician.name);
          this.isAssigning = false;
          this.selectedItem = null;
          this.setMessage(
            `${this.equipmentLabel(entry)} fue afectado a ${technician.name}.`,
            "success",
          );
          this.loadRecords();
        },
        error: () => {
          this.isAssigning = false;
          this.setMessage(
            "No se pudo afectar el equipo. Reintente la operación.",
            "danger",
          );
        },
      });
  }
  private syncLinkedProject(
    entry: EquipmentQueueItem,
    technician: string,
  ): void {
    const project = this.projects.find(
      (candidate) =>
        String(candidate.properties?.["equipmentRecordId"] || "") ===
          entry.record.id &&
        String(candidate.properties?.["equipmentItemId"] || "") ===
          entry.item.id,
    );
    if (!project) return;
    this.projectService
      .updateProject(project.id, {
        properties: { ...project.properties, assignee: technician },
      })
      .subscribe({
        error: () =>
          this.setMessage(
            "El equipo fue afectado, pero no se pudo sincronizar el proyecto vinculado.",
            "danger",
          ),
      });
  }
  private setMessage(message: string, type: "success" | "danger"): void {
    this.message = message;
    this.messageType = type;
  }
}
