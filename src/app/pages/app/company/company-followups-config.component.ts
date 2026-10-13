import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

type FollowUpMessageMode = "ai" | "repeat" | "custom";

interface FollowUpStep {
    id: number;
    title: string;
    subtitle: string;
}

interface FollowUpConfig {
    ruleName: string;
    description: string;
    retryCount: number;
    retryIntervalDays: number;
    stopOnReply: boolean;
    messageMode: FollowUpMessageMode;
    customMessage: string;
    activateNow: boolean;
    updatedAt: string;
}

const FOLLOWUPS_CONFIG_KEY = "adminux.company.followups.config.v1";

@Component({
    selector: "app-company-followups-config",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Config. Seguimientos</h5>
                    <p class="text-secondary small mb-0">Define reglas de seguimiento automatico para leads que no responden.</p>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi">Company</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Config. Seguimientos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (successMessage) {
                <div class="alert alert-success border mb-3">{{ successMessage }}</div>
            }
            @if (formError) {
                <div class="alert alert-danger border mb-3">{{ formError }}</div>
            }

            <div class="card adminuiux-card border overflow-hidden sw sw-theme-basic mb-3 mb-lg-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Editar Regla</h6>
                    <span class="badge text-bg-light border">Paso {{ currentStep }} de {{ steps.length }}</span>
                </div>

                <ul class="nav">
                    @for (step of steps; track step.id) {
                        <li class="nav-item">
                            <button type="button" class="nav-link" [class.active]="currentStep === step.id" [class.done]="currentStep > step.id" (click)="goToStep(step.id)">
                                <div class="num">
                                    @if (currentStep > step.id) {
                                        <i class="bi bi-check-lg"></i>
                                    } @else {
                                        {{ step.id }}
                                    }
                                </div>
                                <div>
                                    <p class="h6 mb-0">{{ step.title }}</p>
                                    <p class="opacity-75 small mb-0">{{ step.subtitle }}</p>
                                </div>
                            </button>
                        </li>
                    }
                </ul>

                <div class="card-body">
                    @if (currentStep === 1) {
                        <div class="row gx-3 gy-3">
                            <div class="col-12">
                                <label class="form-label">Nombre de la regla</label>
                                <input class="form-control" type="text" [(ngModel)]="ruleName" name="ruleName" placeholder="Ej: Clientes que no responden" maxlength="80" />
                                <p class="small text-secondary mb-0 mt-2">Un nombre que te ayude a identificar esta regla facilmente.</p>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Descripcion (opcional)</label>
                                <textarea class="form-control" rows="4" [(ngModel)]="description" name="description" placeholder="Ej: Se les envia seguimiento automatizado para activarlos"></textarea>
                                <p class="small text-secondary mb-0 mt-2">Describe cuando y por que se usa esta regla.</p>
                            </div>
                        </div>
                    }

                    @if (currentStep === 2) {
                        <div class="alert alert-info border mb-3">
                            <strong><i class="bi bi-info-circle me-1"></i>Como funciona?</strong>
                            <p class="mb-0 mt-2">Si un lead no responde despues del primer mensaje, el sistema esperara el intervalo definido y enviara los reintentos automaticamente.</p>
                        </div>

                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-lg-6">
                                <label class="form-label">Numero de reintentos</label>
                                <select class="form-select" [(ngModel)]="retryCount" name="retryCount">
                                    @for (option of retryCountOptions; track option) {
                                        <option [ngValue]="option">{{ option }} {{ option === 1 ? "reintento" : "reintentos" }}</option>
                                    }
                                </select>
                                <p class="small text-secondary mb-0 mt-2">Cuantas veces intentaremos contactar al lead?</p>
                            </div>
                            <div class="col-12 col-lg-6">
                                <label class="form-label">Intervalo entre reintentos</label>
                                <select class="form-select" [(ngModel)]="retryIntervalDays" name="retryIntervalDays">
                                    @for (days of intervalOptions; track days) {
                                        <option [ngValue]="days">{{ days }} {{ days === 1 ? "dia" : "dias" }}</option>
                                    }
                                </select>
                                <p class="small text-secondary mb-0 mt-2">Cuanto tiempo esperar entre cada reintento?</p>
                            </div>
                            <div class="col-12">
                                <div class="form-check form-switch form-check-md">
                                    <input class="form-check-input" type="checkbox" id="stopOnReply" [(ngModel)]="stopOnReply" name="stopOnReply" />
                                    <label class="form-check-label" for="stopOnReply">Detener si el lead responde</label>
                                </div>
                                <p class="small text-secondary mb-0 mt-1">Si el lead responde en cualquier momento, se detienen los reintentos.</p>
                            </div>
                        </div>

                        <div class="example-card mt-3">
                            <p class="mb-2 fw-semibold text-success"><i class="bi bi-bar-chart-steps me-2"></i>Ejemplo de como funcionara:</p>
                            <ul class="mb-0 ps-3">
                                @for (item of schedulePreview; track item) {
                                    <li>{{ item }}</li>
                                }
                            </ul>
                        </div>
                    }

                    @if (currentStep === 3) {
                        <p class="fw-semibold text-warning mb-3"><i class="bi bi-info-circle me-1"></i>Elige como quieres que sean los mensajes de reintento</p>

                        <button class="followup-option" type="button" [class.active]="messageMode === 'ai'" (click)="setMessageMode('ai')">
                            <span class="form-check-input-like" [class.active]="messageMode === 'ai'"></span>
                            <div class="flex-grow-1 text-start">
                                <div class="d-flex align-items-center gap-2 mb-1">
                                    <strong>Mensajes Inteligentes con IA</strong>
                                    <span class="badge bg-theme-1">RECOMENDADO</span>
                                </div>
                                <p class="mb-0 text-secondary">La IA analiza el contexto y genera un seguimiento natural y personalizado automaticamente.</p>
                            </div>
                        </button>

                        <button class="followup-option mt-2" type="button" [class.active]="messageMode === 'repeat'" (click)="setMessageMode('repeat')">
                            <span class="form-check-input-like" [class.active]="messageMode === 'repeat'"></span>
                            <div class="flex-grow-1 text-start">
                                <strong>Repetir mensaje original</strong>
                                <p class="mb-0 text-secondary">Reenviar exactamente el mismo mensaje original. Simple y directo.</p>
                            </div>
                        </button>

                        <button class="followup-option mt-2" type="button" [class.active]="messageMode === 'custom'" (click)="setMessageMode('custom')">
                            <span class="form-check-input-like" [class.active]="messageMode === 'custom'"></span>
                            <div class="flex-grow-1 text-start">
                                <strong>Mensaje personalizado</strong>
                                <p class="mb-0 text-secondary">Escribe tu propio mensaje para usarlo en todos los reintentos.</p>
                            </div>
                        </button>

                        @if (messageMode === "custom") {
                            <div class="mt-3">
                                <label class="form-label">Plantilla de mensaje</label>
                                <textarea
                                    class="form-control"
                                    rows="4"
                                    [(ngModel)]="customMessage"
                                    name="customMessage"
                                    placeholder="Hola [nombre], seguimos atentos para ayudarte con tu solicitud..."
                                ></textarea>
                            </div>
                        }
                    }

                    @if (currentStep === 4) {
                        <div class="mb-3">
                            <h6 class="text-success mb-1"><i class="bi bi-check-circle-fill me-2"></i>Todo listo</h6>
                            <p class="text-secondary mb-0">Tu regla de seguimiento esta configurada y lista para usarse.</p>
                        </div>

                        <div class="summary-card">
                            <p class="text-secondary mb-3"><strong>Resumen de configuracion:</strong></p>
                            <div class="row gx-3 gy-2">
                                <div class="col-12 col-md-6">
                                    <p class="text-secondary mb-1">Nombre:</p>
                                    <p class="mb-0">{{ ruleName || "Sin nombre" }}</p>
                                </div>
                                <div class="col-12 col-md-6">
                                    <p class="text-secondary mb-1">Reintentos:</p>
                                    <p class="mb-0">{{ retryCount }} veces cada {{ retryIntervalDays }} {{ retryIntervalDays === 1 ? "dia" : "dias" }}</p>
                                </div>
                                <div class="col-12 col-md-6">
                                    <p class="text-secondary mb-1">Tipo de mensaje:</p>
                                    <p class="mb-0">{{ messageModeLabel }}</p>
                                </div>
                                <div class="col-12 col-md-6">
                                    <p class="text-secondary mb-1">Detener si responde:</p>
                                    <p class="mb-0">{{ stopOnReply ? "Si" : "No" }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="form-check form-switch form-check-md mt-3 mb-0">
                            <input class="form-check-input" type="checkbox" id="activateNow" [(ngModel)]="activateNow" name="activateNow" />
                            <label class="form-check-label" for="activateNow">Activar regla ahora</label>
                        </div>
                    }
                </div>

                <div class="sw-toolbar-elm d-flex justify-content-between align-items-center gap-2">
                    <button type="button" class="btn btn-outline-theme" (click)="previousStep()" [disabled]="currentStep === 1">Atras</button>

                    @if (currentStep < steps.length) {
                        <button type="button" class="btn btn-theme" (click)="nextStep()">Continuar</button>
                    } @else {
                        <button type="button" class="btn btn-theme" (click)="saveConfiguration()">Guardar cambios</button>
                    }
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .nav-link {
                width: 100%;
                border: 0;
                background: transparent;
                cursor: pointer;
            }

            .example-card {
                border: 1px dashed rgba(var(--bs-success-rgb), 0.55);
                background: rgba(var(--bs-success-rgb), 0.08);
                border-radius: 12px;
                padding: 1rem;
            }

            .followup-option {
                width: 100%;
                border: 1px solid var(--bs-border-color);
                border-radius: 12px;
                background: transparent;
                padding: 1rem;
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                transition: 0.2s ease;
            }

            .followup-option:hover {
                border-color: rgba(var(--adminuiux-theme-1-rgb), 0.45);
                background: rgba(var(--adminuiux-theme-1-rgb), 0.06);
            }

            .followup-option.active {
                border-color: rgba(var(--adminuiux-theme-1-rgb), 0.75);
                box-shadow: 0 0 0 1px rgba(var(--adminuiux-theme-1-rgb), 0.2);
                background: rgba(var(--adminuiux-theme-1-rgb), 0.08);
            }

            .form-check-input-like {
                width: 20px;
                height: 20px;
                margin-top: 2px;
                border-radius: 50%;
                border: 2px solid rgba(var(--bs-secondary-rgb), 0.65);
                flex-shrink: 0;
                position: relative;
            }

            .form-check-input-like.active {
                border-color: var(--adminuiux-theme-1);
            }

            .form-check-input-like.active::after {
                content: "";
                position: absolute;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: var(--adminuiux-theme-1);
                inset: 3px;
            }

            .summary-card {
                border: 1px solid var(--bs-border-color);
                border-radius: 12px;
                padding: 1rem;
                background: rgba(var(--adminuiux-theme-1-rgb), 0.04);
            }
        `,
    ],
})
export class CompanyFollowupsConfigComponent {
    readonly steps: FollowUpStep[] = [
        { id: 1, title: "Informacion basica", subtitle: "Dale un nombre descriptivo a tu regla" },
        { id: 2, title: "Configuracion de reintentos", subtitle: "Define cuantos reintentos y cada cuanto tiempo" },
        { id: 3, title: "Tipo de mensaje", subtitle: "Elige como quieres enviar los mensajes" },
        { id: 4, title: "Activacion", subtitle: "Activa tu regla y listo" },
    ];

    readonly retryCountOptions: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    readonly intervalOptions: number[] = [1, 2, 3, 4, 5, 7, 10, 14, 21, 30];

    currentStep = 1;
    unlockedStep = 1;

    ruleName = "Clientes que no responden";
    description = "Se les envia seguimiento automatizado para activarlos";

    retryCount = 3;
    retryIntervalDays = 3;
    stopOnReply = true;

    messageMode: FollowUpMessageMode = "ai";
    customMessage = "";

    activateNow = true;

    formError = "";
    successMessage = "";

    constructor() {
        this.loadConfiguration();
    }

    get schedulePreview(): string[] {
        const rows: string[] = ["Dia 1: Primer mensaje enviado al lead"];
        let dayCounter = 1;

        for (let retry = 1; retry <= this.retryCount; retry += 1) {
            dayCounter += this.retryIntervalDays;
            rows.push(`Dia ${dayCounter}: Reintento #${retry}`);
        }

        return rows;
    }

    get messageModeLabel(): string {
        if (this.messageMode === "ai") {
            return "IA contextual";
        }

        if (this.messageMode === "repeat") {
            return "Repetir mensaje original";
        }

        return "Mensaje personalizado";
    }

    goToStep(step: number): void {
        if (step < 1 || step > this.steps.length) {
            return;
        }

        if (step > this.unlockedStep) {
            return;
        }

        this.formError = "";
        this.currentStep = step;
    }

    nextStep(): void {
        this.formError = "";

        if (!this.validateStep(this.currentStep)) {
            return;
        }

        if (this.currentStep >= this.steps.length) {
            return;
        }

        this.currentStep += 1;
        this.unlockedStep = Math.max(this.unlockedStep, this.currentStep);
    }

    previousStep(): void {
        this.formError = "";

        if (this.currentStep <= 1) {
            return;
        }

        this.currentStep -= 1;
    }

    setMessageMode(mode: FollowUpMessageMode): void {
        this.messageMode = mode;
        this.formError = "";
    }

    saveConfiguration(): void {
        this.formError = "";

        if (!this.validateAll()) {
            return;
        }

        const payload: FollowUpConfig = {
            ruleName: this.ruleName.trim(),
            description: this.description.trim(),
            retryCount: this.retryCount,
            retryIntervalDays: this.retryIntervalDays,
            stopOnReply: this.stopOnReply,
            messageMode: this.messageMode,
            customMessage: this.customMessage.trim(),
            activateNow: this.activateNow,
            updatedAt: new Date().toISOString(),
        };

        this.persistConfiguration(payload);
        this.successMessage = "Regla de seguimiento guardada correctamente.";
    }

    private validateAll(): boolean {
        for (let step = 1; step <= this.steps.length; step += 1) {
            if (!this.validateStep(step)) {
                this.currentStep = step;
                this.unlockedStep = Math.max(this.unlockedStep, step);
                return false;
            }
        }

        return true;
    }

    private validateStep(step: number): boolean {
        if (step === 1) {
            if (this.ruleName.trim().length < 3) {
                this.formError = "El nombre de la regla debe tener al menos 3 caracteres.";
                return false;
            }
        }

        if (step === 2) {
            if (!Number.isFinite(this.retryCount) || this.retryCount < 1 || this.retryCount > 10) {
                this.formError = "El numero de reintentos debe estar entre 1 y 10.";
                return false;
            }

            if (!Number.isFinite(this.retryIntervalDays) || this.retryIntervalDays < 1) {
                this.formError = "El intervalo entre reintentos debe ser de al menos 1 dia.";
                return false;
            }
        }

        if (step === 3 && this.messageMode === "custom" && this.customMessage.trim().length < 10) {
            this.formError = "Escribe al menos 10 caracteres para el mensaje personalizado.";
            return false;
        }

        return true;
    }

    private loadConfiguration(): void {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            return;
        }

        const savedValue = window.localStorage.getItem(FOLLOWUPS_CONFIG_KEY);
        if (!savedValue) {
            return;
        }

        try {
            const parsed = JSON.parse(savedValue) as FollowUpConfig;

            this.ruleName = this.normalizeText(parsed.ruleName, this.ruleName);
            this.description = this.normalizeText(parsed.description, this.description);

            this.retryCount = this.normalizeNumber(parsed.retryCount, this.retryCount, 1, 10);
            this.retryIntervalDays = this.normalizeNumber(parsed.retryIntervalDays, this.retryIntervalDays, 1, 30);

            this.stopOnReply = typeof parsed.stopOnReply === "boolean" ? parsed.stopOnReply : this.stopOnReply;
            this.activateNow = typeof parsed.activateNow === "boolean" ? parsed.activateNow : this.activateNow;

            this.messageMode = this.normalizeMessageMode(parsed.messageMode);
            this.customMessage = this.normalizeText(parsed.customMessage, "");

            this.unlockedStep = this.steps.length;
        } catch {
            // Keep default values if local storage payload is invalid.
        }
    }

    private persistConfiguration(config: FollowUpConfig): void {
        if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
            return;
        }

        window.localStorage.setItem(FOLLOWUPS_CONFIG_KEY, JSON.stringify(config));
    }

    private normalizeText(value: string | undefined, fallback: string): string {
        if (typeof value !== "string") {
            return fallback;
        }

        return value;
    }

    private normalizeNumber(value: number | undefined, fallback: number, min: number, max: number): number {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, Number(value)));
    }

    private normalizeMessageMode(value: FollowUpMessageMode | string | undefined): FollowUpMessageMode {
        if (value === "repeat" || value === "custom") {
            return value;
        }

        return "ai";
    }
}
