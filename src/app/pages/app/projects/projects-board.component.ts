import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs/operators';
import { ProjectService } from './services';
import { KanbanViewComponent } from './kanban-view.component';

@Component({
  selector: 'app-projects-board',
  standalone: true,
  imports: [CommonModule, FormsModule, KanbanViewComponent],
  template: `
    <div class="projects-board-container">
      <div class="board-header">
        <div class="board-header__content">
          <div class="board-header__identity">
            <div class="board-header__icon-wrap">
              <i class="bi bi-kanban board-header__icon"></i>
            </div>

            <div>
              <h4 class="mb-0">{{ (board$ | async)?.name || 'Proyectos' }}</h4>
              <small class="board-header__subtitle">Tablero principal del equipo con flujo visual y edición directa</small>
            </div>
          </div>

          <div class="board-header__stats">
            <label class="compact-mode-toggle" title="Muestra cada proyecto como solo su código de equipo">
              <input type="checkbox" [(ngModel)]="compactMode" />
              <span>Modo compacto</span>
            </label>
            <div class="board-stat-pill">
              <span class="board-stat-pill__label">Vista</span>
              <strong>{{ compactMode ? 'Compacto' : 'Tablero' }}</strong>
            </div>
            <div class="board-stat-pill">
              <span class="board-stat-pill__label">Items</span>
              <strong>{{ projectCount$ | async }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="loading$ | async" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
      </div>

      <app-kanban-view *ngIf="!(loading$ | async)" [compactMode]="compactMode"></app-kanban-view>
    </div>
  `,
  styles: [`
    .projects-board-container {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      background:
        radial-gradient(circle at top right, rgba(var(--adminuiux-theme-accent-1-rgb), 0.08), transparent 32%),
        linear-gradient(180deg, rgba(var(--adminuiux-theme-1-rgb), 0.04), transparent 28%),
        var(--bs-body-bg);
    }

    .board-header {
      background: linear-gradient(135deg, rgba(var(--adminuiux-theme-1-rgb), 0.08), rgba(var(--adminuiux-theme-accent-1-rgb), 0.12));
      padding: 1.5rem;
      border-radius: 1.25rem;
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.12);
      box-shadow: 0 1rem 2rem rgba(var(--adminuiux-theme-1-rgb), 0.08);
      margin-bottom: 1.5rem;
      backdrop-filter: blur(10px);
    }

    .board-header__content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .board-header__identity {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 0;
    }

    .board-header__icon-wrap {
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

    .board-header__icon {
      font-size: 1.35rem;
    }

    h4 {
      font-weight: 600;
      color: var(--bs-body-color);
    }

    .board-header__subtitle {
      color: rgba(var(--bs-body-color-rgb), 0.72);
    }

    .board-header__stats {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .board-stat-pill {
      min-width: 7.5rem;
      padding: 0.85rem 1rem;
      border-radius: 1rem;
      background: rgba(var(--bs-body-bg-rgb), 0.72);
      box-shadow: inset 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.08);
      color: var(--bs-body-color);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .board-stat-pill__label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(var(--bs-body-color-rgb), 0.55);
    }

    .compact-mode-toggle {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      cursor: pointer;
      font-size: 0.82rem;
      color: rgba(var(--bs-body-color-rgb), 0.75);
      user-select: none;
      padding: 0.4rem 0.75rem;
      border-radius: 0.6rem;
      background: rgba(var(--bs-body-bg-rgb), 0.6);
      border: 1px solid rgba(var(--adminuiux-theme-1-rgb), 0.1);
      transition: background 0.15s;
    }

    .compact-mode-toggle:hover {
      background: rgba(var(--adminuiux-theme-1-rgb), 0.07);
    }

    .compact-mode-toggle input[type="checkbox"] {
      accent-color: var(--adminuiux-theme-1);
      cursor: pointer;
    }

    @media (max-width: 991.98px) {
      .projects-board-container {
        padding: 1rem;
      }

      .board-header__content {
        flex-direction: column;
        align-items: flex-start;
      }

      .board-header__stats {
        width: 100%;
        justify-content: flex-start;
      }
    }
  `],
})
export class ProjectsBoardComponent implements OnInit {
  board$ = this.projectService.board$;
  loading$ = this.projectService.loading$;
  projectCount$ = this.projectService.projects$.pipe(map((projects) => projects.length));
  compactMode = false;

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.projectService.loadProjects('board-1').subscribe();
  }
}
