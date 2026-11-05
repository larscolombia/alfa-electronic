import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { forkJoin } from "rxjs";
import { FINANCE_HOURLY_RATE_KEY, FinanceSettingsApiService } from "../../../services/finance-settings-api.service";

export interface QuoteCommentLine {
  id: string;
  text: string;
}

export const QUOTE_COMMENT_LINES_KEY = "commercial.quote-comment-lines";

@Component({
  selector: "app-company-quote-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid py-3">
      <div class="page-title"><h2 class="mb-1">Configuración de cotizaciones</h2><p class="text-secondary mb-0">Administra los textos reutilizables y el costo de mano de obra.</p></div>
    </div>
    <main class="container mt-3" id="main-content">
      @if (message) { <div class="alert border mb-3" [class.alert-success]="messageType === 'success'" [class.alert-danger]="messageType === 'danger'" role="status">{{ message }}</div> }
      <section class="card adminuiux-card mb-3">
        <div class="card-header"><h6 class="mb-0">Valor hora-hombre en Colombia</h6></div>
        <div class="card-body">
          <div class="row g-3 align-items-end">
            <div class="col-12 col-md-6"><label class="form-label" for="hourly-rate">Costo por hora (COP) <span class="text-danger">*</span></label><input id="hourly-rate" class="form-control" type="number" min="1" step="1" [(ngModel)]="hourlyRate" aria-describedby="hourly-rate-help" /><small id="hourly-rate-help" class="text-secondary">Valor interno utilizado para cotizar horas de trabajo en Colombia.</small></div>
            <div class="col-12 col-md-auto"><button class="btn btn-theme" type="button" [disabled]="saving || hourlyRate <= 0" (click)="saveHourlyRate()">{{ saving ? 'Guardando…' : 'Guardar valor' }}</button></div>
          </div>
        </div>
      </section>
      <section class="card adminuiux-card">
        <div class="card-header"><h6 class="mb-0">Líneas de comentarios</h6><p class="small text-secondary mb-0">Comentarios disponibles para usar en las cotizaciones.</p></div>
        <div class="card-body">
          <div class="row g-2 align-items-end mb-3"><div class="col-12 col-md"><label class="form-label" for="comment-line">Nueva línea de comentario</label><input id="comment-line" class="form-control" [(ngModel)]="draftText" maxlength="500" placeholder="Ej.: Validez de la oferta: 30 días" (keyup.enter)="addLine()" /></div><div class="col-12 col-md-auto"><button class="btn btn-outline-theme" type="button" [disabled]="!draftText.trim()" (click)="addLine()">Agregar línea</button></div></div>
          <div class="table-responsive"><table class="table align-middle mb-0"><thead><tr><th>Comentario</th><th class="text-end">Acción</th></tr></thead><tbody>@for (line of commentLines; track line.id) { <tr><td><input class="form-control" [(ngModel)]="line.text" maxlength="500" [attr.aria-label]="'Comentario ' + line.id" /></td><td class="text-end"><button class="btn btn-sm btn-outline-danger" type="button" (click)="removeLine(line.id)">Eliminar</button></td></tr> } @empty { <tr><td colspan="2" class="text-center text-secondary py-4">No hay líneas de comentarios configuradas.</td></tr> }</tbody></table></div>
        </div>
        <div class="card-footer d-flex justify-content-end gap-2"><button class="btn btn-outline-secondary" type="button" (click)="load()">Limpiar cambios</button><button class="btn btn-theme" type="button" [disabled]="saving" (click)="saveLines()">{{ saving ? 'Guardando…' : 'Guardar líneas' }}</button></div>
      </section>
    </main>
  `,
})
export class CompanyQuoteSettingsComponent implements OnInit {
  commentLines: QuoteCommentLine[] = [];
  draftText = "";
  hourlyRate = 0;
  saving = false;
  message = "";
  messageType: "success" | "danger" = "success";

  constructor(private readonly settingsApi: FinanceSettingsApiService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    forkJoin({ lines: this.settingsApi.getSetting<QuoteCommentLine[]>(QUOTE_COMMENT_LINES_KEY), rate: this.settingsApi.getSetting<number>(FINANCE_HOURLY_RATE_KEY) }).subscribe({
      next: ({ lines, rate }) => { this.commentLines = Array.isArray(lines) ? lines.filter(line => line?.text?.trim()) : []; this.hourlyRate = Number(rate) || 0; },
      error: () => this.notice("No se pudo cargar la configuración.", "danger"),
    });
  }
  addLine(): void {
    const text = this.draftText.trim();
    if (!text) return;
    this.commentLines = [...this.commentLines, { id: crypto.randomUUID(), text }];
    this.draftText = "";
  }
  removeLine(id: string): void { this.commentLines = this.commentLines.filter(line => line.id !== id); }
  saveHourlyRate(): void {
    if (this.hourlyRate <= 0) return this.notice("Ingresa un valor de hora-hombre mayor que cero.", "danger");
    this.persist(this.settingsApi.putSetting(FINANCE_HOURLY_RATE_KEY, Number(this.hourlyRate)), "Valor de hora-hombre guardado.");
  }
  saveLines(): void {
    const lines = this.commentLines.map(line => ({ ...line, text: line.text.trim() })).filter(line => line.text);
    this.commentLines = lines;
    this.persist(this.settingsApi.putSetting(QUOTE_COMMENT_LINES_KEY, lines), "Líneas de comentarios guardadas.");
  }
  private persist(request: ReturnType<FinanceSettingsApiService["putSetting"]>, success: string): void {
    this.saving = true;
    request.subscribe({ next: () => { this.saving = false; this.notice(success, "success"); }, error: () => { this.saving = false; this.notice("No se pudo guardar la configuración. Inténtalo de nuevo.", "danger"); } });
  }
  private notice(message: string, type: "success" | "danger"): void { this.message = message; this.messageType = type; }
}
