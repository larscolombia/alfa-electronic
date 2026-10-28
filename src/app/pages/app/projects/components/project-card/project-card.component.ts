import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardColumn, Project, PropertyTemplate } from '../../models';
import { describeProjectSla, getProjectTechnicalTestTypeLabel, resolveProjectSlaSeverity } from '../../project-workflow.config';

/**
 * Project Card Component - Displays a single project card
 */
@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="project-card"
      [attr.data-sla-severity]="getSlaSeverity()"
      [class.project-card--success]="getSlaSeverity() === 'success'"
      [class.project-card--warning]="getSlaSeverity() === 'warning'"
      [class.project-card--overdue]="getSlaSeverity() === 'overdue'"
      [class.project-card--critical]="getSlaSeverity() === 'critical'">
      <button type="button" class="project-card__drag-handle" aria-label="Arrastrar proyecto" title="Arrastrar proyecto">
        <i class="bi bi-grip-vertical"></i>
      </button>

      <div class="project-card__accent" [style.background]="column?.color || null"></div>

      <div class="project-card__meta-row" *ngIf="project.properties['shortCode'] || project.properties['client']">
        <span class="project-card__meta-code" *ngIf="project.properties['shortCode']">{{ project.properties['shortCode'] }}</span>
        <span class="project-card__meta-client" *ngIf="project.properties['client']">{{ project.properties['client'] }}</span>
      </div>

      <div class="card-header d-flex align-items-start gap-2 mb-2">
        <span class="project-card__icon" *ngIf="project.icon">
          <i [class]="'bi ' + project.icon"></i>
        </span>
        <h6 class="card-title mb-0 flex-grow-1">{{ project.title }}</h6>
      </div>

      <p *ngIf="project.description" class="card-description text-muted small mb-2">
        {{ project.description | slice:0:80 }}{{ project.description.length > 80 ? '...' : '' }}
      </p>

      <div class="card-badges d-flex flex-wrap gap-1 mb-2">
        <span 
          *ngIf="project.properties['priority']" 
          class="badge project-card__badge"
          [class.project-card__badge--high]="project.properties['priority'] === 'high'"
          [class.project-card__badge--medium]="project.properties['priority'] === 'medium'"
          [class.project-card__badge--low]="project.properties['priority'] === 'low'">
          <i class="bi bi-flag-fill"></i>
          {{ getPriorityLabel(project.properties['priority']) }}
        </span>

        <span *ngIf="project.properties['dueDate']" class="badge project-card__badge project-card__badge--ghost">
          <i class="bi bi-calendar-event"></i>
          {{ project.properties['dueDate'] | date:'dd/MM' }}
        </span>

        <span *ngIf="getSlaSeverity() !== 'neutral'" class="badge project-card__badge"
          [class.project-card__badge--sla-success]="getSlaSeverity() === 'success'"
          [class.project-card__badge--sla-warning]="getSlaSeverity() === 'warning'"
          [class.project-card__badge--sla-overdue]="getSlaSeverity() === 'overdue'"
          [class.project-card__badge--sla-critical]="getSlaSeverity() === 'critical'">
          <i class="bi bi-circle-fill"></i>
          {{ getSlaLabel() }}
        </span>

        <span *ngIf="project.properties['budget']" class="badge project-card__badge project-card__badge--ghost">
          <i class="bi bi-currency-dollar"></i>
          {{ project.properties['budget'] | number:'1.0-0' }}
        </span>

        <span *ngIf="project.properties['equipmentRepairStatusLabel']" class="badge project-card__badge project-card__badge--repair">
          <i class="bi bi-tools"></i>
          {{ project.properties['equipmentRepairStatusLabel'] }}
        </span>

        <span *ngIf="project.properties['purchaseOrderNumber']" class="badge project-card__badge project-card__badge--purchase-order">
          <i class="bi bi-receipt"></i>
          OC {{ project.properties['purchaseOrderNumber'] }}
        </span>

        <span *ngIf="project.properties['equipmentLocationName']" class="badge project-card__badge project-card__badge--location">
          <i class="bi bi-geo-alt"></i>
          {{ project.properties['equipmentLocationName'] }}
        </span>

        <span *ngIf="getActualHours() > 0" class="badge project-card__badge project-card__badge--ghost">
          <i class="bi bi-stopwatch"></i>
          {{ getActualHours() }}h real
        </span>

        <span *ngIf="getRepairabilityPercent() > 0" class="badge project-card__badge project-card__badge--repairability">
          <i class="bi bi-activity"></i>
          {{ getRepairabilityPercent() }}% reparable
        </span>

        <span *ngIf="project.properties['testType']" class="badge project-card__badge project-card__badge--test">
          <i class="bi bi-clipboard2-pulse"></i>
          {{ getTestTypeLabel() }}
        </span>

        <span *ngIf="project.totalTasks && project.totalTasks > 0" class="badge project-card__badge project-card__badge--tasks">
          <i class="bi bi-list-check"></i>
          {{ project.completedTasks || 0 }}/{{ project.totalTasks }}
        </span>
      </div>

      <div *ngIf="project.properties['progress'] !== undefined" class="progress-section">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <small class="text-muted">Progreso</small>
          <small class="fw-semibold">{{ project.properties['progress'] }}%</small>
        </div>
        <div class="progress project-card__progress" style="height: 6px;">
          <div 
            class="progress-bar"
            [class.bg-success]="project.properties['progress'] >= 75"
            [class.bg-warning]="project.properties['progress'] >= 50 && project.properties['progress'] < 75"
            [class.bg-danger]="project.properties['progress'] < 50"
            [style.width.%]="project.properties['progress']">
          </div>
        </div>
      </div>

      <div class="card-footer mt-2 d-flex justify-content-between align-items-center">
        <small class="text-muted project-card__footer-person">
          <i class="bi bi-person-circle"></i>
          {{ project.properties['assignee'] || 'Sin asignar' }}
        </small>
        <span class="project-card__open-hint">Abrir</span>
      </div>
    </div>
  `,
  styles: [`
    .project-card {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      background: rgba(var(--bs-body-bg-rgb), 0.96);
      border-radius: 1rem;
      padding: 0.95rem;
      padding-top: 1.1rem;
      box-shadow: 0 0.55rem 1.25rem rgba(var(--adminuiux-theme-1-rgb), 0.08);
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      touch-action: manipulation;
    }

    .project-card--success {
      border-color: rgba(var(--bs-success-rgb), 0.28);
    }

    .project-card--warning {
      border-color: rgba(var(--bs-warning-rgb), 0.35);
    }

    .project-card--overdue {
      border-color: rgba(249, 115, 22, 0.45);
    }

    .project-card--critical {
      border-color: rgba(var(--bs-danger-rgb), 0.4);
      box-shadow: 0 0.7rem 1.6rem rgba(var(--bs-danger-rgb), 0.12);
    }

    .project-card__drag-handle {
      position: absolute;
      top: 0.55rem;
      right: 0.55rem;
      width: 1.5rem;
      height: 1.5rem;
      border: 0;
      border-radius: 0.45rem;
      display: inline-grid;
      place-items: center;
      color: rgba(var(--bs-body-color-rgb), 0.4);
      background: rgba(var(--bs-body-bg-rgb), 0.98);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
      box-shadow: 0 0.35rem 0.85rem rgba(var(--adminuiux-theme-1-rgb), 0.14);
      cursor: grab;
      z-index: 3;
      transition: background-color 140ms ease, color 140ms ease;
    }

    .project-card__drag-handle:hover {
      color: rgba(var(--bs-body-color-rgb), 0.72);
      background: rgba(var(--adminuiux-theme-1-rgb), 0.12);
    }

    .project-card__drag-handle:active {
      cursor: grabbing;
    }

    .project-card__drag-handle i {
      pointer-events: none;
      font-size: 0.85rem;
      line-height: 1;
    }

    .project-card:hover {
      box-shadow: 0 1rem 2rem rgba(var(--adminuiux-theme-1-rgb), 0.14);
      transform: translateY(-3px) scale(1.01);
      border-color: rgba(var(--adminuiux-theme-1-rgb), 0.24);
    }

    .project-card:hover .project-card__accent {
      transform: scaleX(1);
      opacity: 1;
    }

    .project-card__accent {
      position: absolute;
      inset: 0 auto auto 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, var(--adminuiux-theme-1), rgba(var(--adminuiux-theme-accent-1-rgb), 0.9));
      transform: scaleX(0.3);
      transform-origin: left center;
      opacity: 0.75;
      z-index: 0;
      pointer-events: none;
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .project-card__meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
      margin-bottom: 0.7rem;
      padding-right: 2rem;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      position: relative;
      z-index: 1;
    }

    .card-header {
      padding-right: 2rem;
      position: relative;
      z-index: 1;
    }

    .project-card__meta-code {
      color: var(--adminuiux-theme-1);
      font-weight: 700;
    }

    .project-card__meta-client {
      color: rgba(var(--bs-body-color-rgb), 0.5);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .project-card__icon {
      width: 2rem;
      height: 2rem;
      border-radius: 0.7rem;
      display: grid;
      place-items: center;
      background: rgba(var(--adminuiux-theme-1-rgb), 0.12);
      color: var(--adminuiux-theme-1);
      flex-shrink: 0;
    }

    .card-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--bs-body-color);
      line-height: 1.4;
      word-wrap: break-word;
    }

    .card-description {
      font-size: 0.75rem;
      line-height: 1.4;
      margin-bottom: 0;
      color: rgba(var(--bs-body-color-rgb), 0.7);
      position: relative;
      z-index: 1;
    }

    .card-badges {
      margin-top: 0.5rem;
      position: relative;
      z-index: 1;
    }

    .project-card__badge {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 999px;
      border: 1px solid transparent;
      color: var(--bs-body-color);
    }

    .project-card__badge--high {
      background: rgba(var(--bs-danger-rgb), 0.14);
      border-color: rgba(var(--bs-danger-rgb), 0.18);
      color: var(--bs-danger);
    }

    .project-card__badge--medium {
      background: rgba(var(--bs-warning-rgb), 0.18);
      border-color: rgba(var(--bs-warning-rgb), 0.2);
      color: #9a5b00;
    }

    .project-card__badge--low {
      background: rgba(var(--bs-success-rgb), 0.14);
      border-color: rgba(var(--bs-success-rgb), 0.18);
      color: var(--bs-success);
    }

    .project-card__badge--ghost {
      background: rgba(var(--adminuiux-theme-1-rgb), 0.08);
      border-color: rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .project-card__badge--tasks {
      background: rgba(var(--bs-info-rgb), 0.14);
      border-color: rgba(var(--bs-info-rgb), 0.18);
      color: var(--bs-info);
      font-weight: 600;
    }

    .project-card__badge--repair {
      background: rgba(var(--bs-primary-rgb), 0.12);
      border-color: rgba(var(--bs-primary-rgb), 0.2);
      color: var(--bs-primary);
    }

    .project-card__badge--location {
      background: rgba(var(--adminuiux-theme-accent-1-rgb), 0.12);
      border-color: rgba(var(--adminuiux-theme-accent-1-rgb), 0.2);
      color: var(--bs-body-color);
    }

    .project-card__badge--purchase-order {
      background: rgba(var(--bs-success-rgb), 0.14);
      border-color: rgba(var(--bs-success-rgb), 0.2);
      color: var(--bs-success);
    }

    .project-card__badge--repairability {
      background: rgba(var(--bs-success-rgb), 0.14);
      border-color: rgba(var(--bs-success-rgb), 0.2);
      color: var(--bs-success);
    }

    .project-card__badge--test {
      background: rgba(var(--bs-secondary-rgb), 0.14);
      border-color: rgba(var(--bs-secondary-rgb), 0.2);
      color: var(--bs-body-color);
    }

    .project-card__badge--sla-success {
      background: rgba(var(--bs-success-rgb), 0.14);
      border-color: rgba(var(--bs-success-rgb), 0.2);
      color: var(--bs-success);
    }

    .project-card__badge--sla-warning {
      background: rgba(var(--bs-warning-rgb), 0.18);
      border-color: rgba(var(--bs-warning-rgb), 0.22);
      color: #9a5b00;
    }

    .project-card__badge--sla-overdue {
      background: rgba(249, 115, 22, 0.16);
      border-color: rgba(249, 115, 22, 0.22);
      color: #c2410c;
    }

    .project-card__badge--sla-critical {
      background: rgba(var(--bs-danger-rgb), 0.14);
      border-color: rgba(var(--bs-danger-rgb), 0.2);
      color: var(--bs-danger);
    }

    .card-badges .badge i {
      font-size: 0.65rem;
    }

    .progress-section {
      margin-top: 0.75rem;
      position: relative;
      z-index: 1;
    }

    .progress {
      border-radius: 3px;
      background-color: rgba(var(--adminuiux-theme-1-rgb), 0.08);
    }

    .progress-bar {
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .card-footer {
      padding-top: 0.5rem;
      border-top: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.08);
      position: relative;
      z-index: 1;
    }

    .card-footer small {
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .bi {
      flex-shrink: 0;
    }

    .project-card__footer-person {
      max-width: calc(100% - 3rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .project-card__open-hint {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(var(--bs-body-color-rgb), 0.45);
    }
  `]
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Input() column: BoardColumn | null = null;
  @Input() propertyTemplates: PropertyTemplate[] = [];

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja'
    };
    return labels[priority] || priority;
  }

  getSlaSeverity() {
    return resolveProjectSlaSeverity(this.column, this.getStageEnteredAt(), String(this.project.properties['priority'] ?? ''));
  }

  getSlaLabel(): string {
    return describeProjectSla(this.column, this.getStageEnteredAt(), String(this.project.properties['priority'] ?? ''));
  }

  getRepairabilityPercent(): number {
    const value = Number(this.project.properties['repairabilityPercent'] ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  getActualHours(): number {
    const value = Number(this.project.properties['actualHours'] ?? 0);
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  getTestTypeLabel(): string {
    return getProjectTechnicalTestTypeLabel(String(this.project.properties['testType'] ?? 'sin-pruebas'));
  }

  private getStageEnteredAt(): Date | null {
    const rawValue = this.project.properties['stageEnteredAt'];
    if (!rawValue) {
      return null;
    }

    const parsed = rawValue instanceof Date ? rawValue : new Date(String(rawValue));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
