import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkProjectsLabComponent } from './work-projects-lab.component';

/** Isolated entry: no reception, dashboard or sidebar modules in its startup graph. */
@Component({
  selector: 'app-work-projects-lab-shell', standalone: true,
  imports: [WorkProjectsLabComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Laboratorio" class="lab-nav">
      <strong>ALFA Electronic</strong><span>Laboratorio del tablero técnico</span>
      <a href="/app/work-projects">Abrir vista original</a>
    </nav>
    <app-work-projects-lab />
  `,
  styles: [`.lab-nav { display:flex; align-items:center; gap:24px; padding:22px 28px; border-bottom:1px solid #818cf822; background:var(--bs-body-bg); } .lab-nav span { color:var(--bs-secondary-color); } .lab-nav a { margin-left:auto; }`],
})
export class WorkProjectsLabShellComponent {}
