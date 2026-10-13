import { DecimalPipe } from "@angular/common";
import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from "rxjs";

import { PublicQuotePreview, PublicQuotePreviewLine } from "./crm-quote-preview.store";
import { CrmQuoteRecord, CrmQuotesApiService } from "../../../services/crm-quotes-api.service";
import { FormDraftService } from "../../../services/form-draft.service";

const CRM_QUOTE_PREVIEW_DRAFT_PREFIX = "app.crm.quote-preview";

@Component({
    selector: "app-crm-quote-preview",
    standalone: true,
    imports: [DecimalPipe, FormsModule],
    template: `
        <div class="public-estimate-page">
            <div class="estimate-wrapper">
                @if (actionMessage) {
                    <div class="alert border mb-3" [class.alert-success]="actionMessageType === 'success'" [class.alert-danger]="actionMessageType === 'danger'">
                        {{ actionMessage }}
                    </div>
                }

                @if (!quotePreview) {
                    <div class="estimate-card text-center py-5">
                        <h5 class="mb-2">No pudimos construir esta previsualizacion.</h5>
                        <p class="text-secondary mb-3">No encontramos datos para el token enviado.</p>
                        <button class="btn btn-outline-secondary" type="button" (click)="goBack()">Volver</button>
                    </div>
                } @else {
                    <div class="estimate-card">
                        <div class="estimate-header">
                            <div class="brand-block">
                                <div class="brand-logo">LARS Software Company</div>
                                <p class="mb-1">Lars Software Company</p>
                                <p class="mb-0">LARS Software Company</p>
                            </div>

                            <div class="estimate-meta">
                                <h2 class="estimate-title">ESTIMACION</h2>
                                <table class="meta-table">
                                    <tr>
                                        <th>Numero de Presupuesto</th>
                                        <td>{{ quotePreview.codigo }}</td>
                                    </tr>
                                    <tr>
                                        <th>Valido Hasta</th>
                                        <td>{{ quotePreview.validoHasta }}</td>
                                    </tr>
                                </table>

                                <span class="decision-chip" [class.status-pending]="quotePreview.estadoCliente === 'Pendiente'" [class.status-accepted]="quotePreview.estadoCliente === 'Aceptada'" [class.status-rejected]="quotePreview.estadoCliente === 'Rechazada'">
                                    {{ clientDecisionLabel }}
                                </span>
                            </div>
                        </div>

                        <div class="client-block">
                            <h6 class="mb-2">Facturado a</h6>
                            <p class="mb-1">{{ quotePreview.prospecto }}</p>
                            <p class="mb-1">{{ quotePreview.correo }}</p>
                            <p class="mb-1">{{ quotePreview.movil }}</p>
                            <p class="mb-1">{{ quotePreview.empresa }}</p>
                        </div>

                        <div class="estimate-intro">
                            <p class="mb-2">
                                En respuesta a su solicitud, hemos preparado esta propuesta que detalla una solucion estrategica
                                alineada con los objetivos del proyecto.
                            </p>
                            <ul>
                                <li>Autonomia: capacidad para resolver tareas sin supervision constante.</li>
                                <li>Experiencia: manejo de tecnologias y buenas practicas.</li>
                                <li>Calidad: entregables documentados y orientados a resultados.</li>
                                <li>Soporte: acompanamiento en identificacion y solucion de incidencias.</li>
                            </ul>
                        </div>

                        <div class="table-responsive quote-lines-wrap">
                            <table class="table quote-lines-table align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Descripcion</th>
                                        <th class="text-end">Cantidad</th>
                                        <th class="text-end">Precio unitario ({{ quotePreview.moneda }})</th>
                                        <th class="text-end">Impuesto</th>
                                        <th class="text-end">Monto ({{ quotePreview.moneda }})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (line of quotePreview.lineas; track $index) {
                                        <tr>
                                            <td><strong>Opcion {{ $index + 1 }}: {{ line.servicio }}</strong></td>
                                            <td class="text-end">{{ line.cantidad }} {{ line.unidad }}</td>
                                            <td class="text-end">{{ line.precioUnitario | number: '1.0-0' }}</td>
                                            <td class="text-end">{{ line.impuesto }}%</td>
                                            <td class="text-end fw-semibold">{{ lineAmount(line) | number: '1.0-0' }}</td>
                                        </tr>
                                        <tr class="line-description">
                                            <td colspan="5">{{ line.descripcion }}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>

                        <div class="totals-wrap">
                            <table class="totals-table">
                                <tr>
                                    <th>Subtotal</th>
                                    <td>{{ subtotal | number: '1.0-0' }}</td>
                                </tr>
                                <tr>
                                    <th>Descuento</th>
                                    <td>{{ discountAmount | number: '1.0-0' }}</td>
                                </tr>
                                <tr>
                                    <th>Impuesto</th>
                                    <td>{{ taxTotal | number: '1.0-0' }}</td>
                                </tr>
                                <tr class="total-row">
                                    <th>Total</th>
                                    <td>{{ total | number: '1.0-0' }}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="notes-grid">
                            <div>
                                <h6 class="mb-2">Nota</h6>
                                <p class="text-secondary mb-0">{{ quotePreview.nota }}</p>
                            </div>
                            <div>
                                <h6 class="mb-2">Terminos y Condiciones</h6>
                                <p class="text-secondary mb-0">{{ quotePreview.terminos }}</p>
                            </div>
                        </div>

                        <p class="small text-secondary mt-3 mb-0">Nota: El impuesto se calcula despues del descuento.</p>

                        @if (quotePreview.fechaDecision) {
                            <div class="decision-meta mt-3">
                                Decision registrada el {{ quotePreview.fechaDecision }} por {{ quotePreview.firmadoPor || "cliente" }}.
                            </div>
                        }

                        <div class="estimate-actions">
                            <button class="btn btn-link text-secondary" type="button" (click)="goBack()">Cancelar</button>
                            <button class="btn btn-outline-secondary" type="button" (click)="downloadPreview()"><i class="bi bi-download me-1"></i> Descargar</button>
                            <button class="btn btn-outline-danger" type="button" (click)="rejectQuote()" [disabled]="quotePreview.estadoCliente === 'Aceptada'">Rechazar</button>
                            <button class="btn btn-primary" type="button" (click)="openSignatureModal()" [disabled]="quotePreview.estadoCliente === 'Aceptada'">Aceptar</button>
                        </div>
                    </div>
                }
            </div>
        </div>

        @if (showSignatureModal && quotePreview) {
            <div class="modal fade show" tabindex="-1" role="dialog" aria-modal="true" style="display: block;">
                <div class="modal-dialog modal-xl modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Firma y Confirmacion de Identidad</h5>
                            <button type="button" class="btn-close" aria-label="Close" (click)="closeSignatureModal()"></button>
                        </div>

                        <div class="modal-body p-0">
                            <div class="p-3 border-bottom">
                                <div class="row gx-3 gy-3">
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Nombre *</label>
                                        <input class="form-control" [(ngModel)]="signatureForm.nombre" name="sigNombre" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Apellido *</label>
                                        <input class="form-control" [(ngModel)]="signatureForm.apellido" name="sigApellido" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Correo electronico *</label>
                                        <input class="form-control" [(ngModel)]="signatureForm.correo" name="sigCorreo" />
                                    </div>
                                    <div class="col-12 col-lg-4">
                                        <label class="form-label">Lugar *</label>
                                        <input class="form-control" [(ngModel)]="signatureForm.lugar" name="sigLugar" />
                                    </div>
                                </div>
                            </div>

                            <div class="p-3 signature-panel border-bottom">
                                <label class="form-label">Firma *</label>
                                <div class="signature-pad-area">
                                    <canvas
                                        #signatureCanvas
                                        class="signature-canvas"
                                        (pointerdown)="startSignature($event)"
                                        (pointermove)="drawSignature($event)"
                                        (pointerup)="endSignature()"
                                        (pointerleave)="endSignature()"
                                        (pointercancel)="endSignature()"></canvas>
                                </div>
                            </div>

                            @if (signatureError) {
                                <div class="px-3 pt-3">
                                    <div class="alert alert-danger border mb-0">{{ signatureError }}</div>
                                </div>
                            }

                            <div class="p-3 border-bottom d-flex gap-2 flex-wrap">
                                <button class="btn btn-outline-secondary" type="button" (click)="undoSignatureStroke()">Deshacer</button>
                                <button class="btn btn-outline-secondary" type="button" (click)="clearSignaturePad()">Limpiar</button>
                                <input #signatureUpload class="d-none" type="file" accept="image/*" (change)="onSignatureFileSelected($event)" />
                                <button class="btn btn-outline-secondary" type="button" (click)="triggerSignatureUpload(signatureUpload)">Cargar Firma</button>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button class="btn btn-link" type="button" (click)="closeSignatureModal()">Cancelar</button>
                            <button class="btn btn-primary" type="button" (click)="confirmApproval()">Firmar</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop fade show"></div>
        }
    `,
    styles: [
        `
            :host {
                display: block;
                min-height: 100vh;
                background: #e7eaef;
                color: #2f3640;
            }

            .public-estimate-page {
                padding: 20px 12px 36px;
            }

            .estimate-wrapper {
                max-width: 980px;
                margin: 0 auto;
            }

            .estimate-card {
                background: #fff;
                border: 1px solid #d7dde5;
                border-radius: 4px;
                padding: 20px;
            }

            .estimate-header {
                display: flex;
                justify-content: space-between;
                gap: 18px;
                flex-wrap: wrap;
            }

            .brand-block {
                min-width: 260px;
            }

            .brand-logo {
                width: 220px;
                height: 28px;
                border: 1px solid #d7dde5;
                border-radius: 4px;
                background: #f6f8fb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
            }

            .estimate-meta {
                text-align: right;
                min-width: 280px;
            }

            .estimate-title {
                margin: 0 0 8px;
                font-size: 34px;
                font-weight: 700;
                letter-spacing: 0.3px;
            }

            .meta-table {
                border-collapse: collapse;
                border: 1px solid #d7dde5;
                margin-left: auto;
                min-width: 260px;
            }

            .meta-table th,
            .meta-table td {
                border: 1px solid #d7dde5;
                padding: 7px 10px;
                font-size: 13px;
            }

            .meta-table th {
                text-align: left;
                font-weight: 600;
                background: #f4f7fa;
            }

            .decision-chip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 6px 18px;
                font-size: 13px;
                font-weight: 700;
                border-radius: 4px;
                text-transform: uppercase;
                margin-top: 12px;
            }

            .status-pending {
                color: #c61b1b;
                background: #fff;
                border: 1px solid #dc3545;
            }

            .status-accepted {
                color: #0f6939;
                background: #effcf4;
                border: 1px solid #198754;
            }

            .status-rejected {
                color: #a81818;
                background: #fff3f3;
                border: 1px solid #dc3545;
            }

            .client-block {
                margin-top: 16px;
                margin-bottom: 16px;
                max-width: 340px;
                font-size: 15px;
                line-height: 1.35;
            }

            .estimate-intro {
                border-top: 1px solid #eceff3;
                padding-top: 12px;
                margin-bottom: 14px;
                font-size: 15px;
                line-height: 1.55;
            }

            .estimate-intro ul {
                margin: 8px 0 0 18px;
                padding: 0;
            }

            .quote-lines-wrap {
                border: 1px solid #d7dde5;
                margin-bottom: 0;
            }

            .quote-lines-table thead th {
                background: #f7f8fb;
                border-bottom: 1px solid #d7dde5;
                font-size: 13px;
                text-transform: none;
                white-space: nowrap;
            }

            .quote-lines-table td,
            .quote-lines-table th {
                border-color: #d7dde5;
            }

            .line-description td {
                background: #fafbfd;
                font-size: 13px;
                color: #4f5d6b;
            }

            .totals-wrap {
                display: flex;
                justify-content: flex-end;
                margin: 0 0 18px;
            }

            .totals-table {
                border-collapse: collapse;
                border: 1px solid #d7dde5;
                min-width: 300px;
            }

            .totals-table th,
            .totals-table td {
                border: 1px solid #d7dde5;
                padding: 8px 10px;
                font-size: 14px;
                text-align: right;
            }

            .totals-table th {
                width: 62%;
                background: #f8f9fb;
                font-weight: 500;
            }

            .totals-table .total-row th,
            .totals-table .total-row td {
                font-weight: 700;
                background: #f5f8fc;
            }

            .notes-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 26px;
            }

            .decision-meta {
                border: 1px solid #d7dde5;
                background: #f8fafc;
                padding: 10px 12px;
                border-radius: 4px;
                font-size: 13px;
                color: #3b4a59;
            }

            .estimate-actions {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 18px;
                padding-top: 14px;
                border-top: 1px solid #eceff3;
            }

            .signature-panel {
                background: #eef2f7;
            }

            .signature-pad-area {
                border: 1px solid #ccd4de;
                border-radius: 4px;
                background: #fff;
                padding: 8px;
            }

            .signature-canvas {
                width: 100%;
                height: 180px;
                display: block;
                border: 1px solid #d8dee6;
                border-radius: 4px;
                touch-action: none;
                cursor: crosshair;
                background: #fff;
            }

            @media (max-width: 991.98px) {
                .estimate-title {
                    font-size: 28px;
                }

                .estimate-meta {
                    text-align: left;
                }

                .meta-table {
                    margin-left: 0;
                }

                .notes-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .totals-wrap {
                    justify-content: stretch;
                }

                .totals-table {
                    width: 100%;
                    min-width: 0;
                }
            }

            @media print {
                :host {
                    background: #fff;
                }

                .public-estimate-page {
                    padding: 0;
                }

                .estimate-card {
                    border: 0;
                    padding: 0;
                }

                .estimate-actions,
                .modal,
                .modal-backdrop,
                .alert {
                    display: none !important;
                }
            }
        `,
    ],
})
export class CrmQuotePreviewComponent implements AfterViewChecked {
    @ViewChild("signatureCanvas") signatureCanvasRef?: ElementRef<HTMLCanvasElement>;

    quotePreview: PublicQuotePreview | null = null;
    showSignatureModal = false;
    actionMessage = "";
    actionMessageType: "success" | "danger" = "success";
    signatureError = "";

    signatureForm = {
        nombre: "",
        apellido: "",
        correo: "",
        lugar: "",
    };

    signatureHasInk = false;

    private signatureContext: CanvasRenderingContext2D | null = null;
    private pendingCanvasInit = false;
    private isDrawingSignature = false;
    private currentStrokeHasInk = false;
    private strokeSnapshots: ImageData[] = [];
    private strokeCount = 0;
    private lastX = 0;
    private lastY = 0;
    private routeSub?: Subscription;
    private stopDraftWatch: () => void = () => undefined;
    private activeDraftKey = "";

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly crmQuotesApi: CrmQuotesApiService,
        private readonly formDraftService: FormDraftService,
        private readonly cdr: ChangeDetectorRef,
    ) {
        this.routeSub = this.route.paramMap.subscribe((params) => {
            const token = params.get("token")?.trim() ?? "";

            this.stopDraftWatch();
            this.activeDraftKey = `${CRM_QUOTE_PREVIEW_DRAFT_PREFIX}.${token || "unknown"}`;

            if (token) {
                this.restoreDraft();
                this.stopDraftWatch = this.formDraftService.watch(this.activeDraftKey, () => ({
                    showSignatureModal: this.showSignatureModal,
                    signatureForm: { ...this.signatureForm },
                }));

                this.crmQuotesApi.getPublicQuoteByToken(token).subscribe({
                    next: (apiQuote) => {
                        this.quotePreview = this.mapApiQuoteToPreview(apiQuote);
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        this.quotePreview = null;
                        this.cdr.detectChanges();
                    },
                });
                return;
            }

            // Some router transitions can emit an empty token briefly; avoid wiping a valid preview.
            if (!this.quotePreview) {
                this.quotePreview = null;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
        this.stopDraftWatch();
    }

    private mapApiQuoteToPreview(item: CrmQuoteRecord): PublicQuotePreview {
        return {
            token: item.token,
            codigo: item.codigo,
            prospecto: item.prospecto,
            empresa: item.empresa,
            correo: item.correo,
            movil: item.movil,
            fecha: item.fecha,
            validoHasta: item.validoHasta,
            estado: item.estado,
            moneda: item.moneda,
            descuentoTipo: item.descuentoTipo,
            descuentoValor: Number(item.descuentoValor ?? 0),
            lineas: item.lineas,
            nota: item.nota,
            terminos: item.terminos,
            estadoCliente: item.estadoCliente,
            fechaDecision: item.fechaDecision,
            firmadoPor: item.firmadoPor,
            firmanteCorreo: item.firmanteCorreo,
            lugarFirma: item.lugarFirma,
            firmaBase64: item.firmaBase64,
        };
    }

    ngAfterViewChecked(): void {
        if (this.pendingCanvasInit) {
            this.initializeSignatureCanvas();
        }
    }

    get subtotal(): number {
        return this.quotePreview?.lineas.reduce((acc, line) => acc + this.lineAmount(line), 0) ?? 0;
    }

    get discountAmount(): number {
        if (!this.quotePreview) {
            return 0;
        }

        const value = Math.max(0, this.quotePreview.descuentoValor);
        if (this.quotePreview.descuentoTipo === "%") {
            return Math.min(this.subtotal, (this.subtotal * value) / 100);
        }
        return Math.min(this.subtotal, value);
    }

    get taxableBase(): number {
        return Math.max(0, this.subtotal - this.discountAmount);
    }

    get taxTotal(): number {
        if (!this.quotePreview || this.subtotal <= 0) {
            return 0;
        }

        const ratio = this.taxableBase / this.subtotal;
        return this.quotePreview.lineas.reduce((acc, line) => acc + ((this.lineAmount(line) * ratio) * line.impuesto) / 100, 0);
    }

    get total(): number {
        return this.taxableBase + this.taxTotal;
    }

    get clientDecisionLabel(): string {
        if (!this.quotePreview) {
            return "EN ESPERA";
        }

        if (this.quotePreview.estadoCliente === "Aceptada") {
            return "APROBADA";
        }

        if (this.quotePreview.estadoCliente === "Rechazada") {
            return "RECHAZADA";
        }

        return "EN ESPERA";
    }

    lineAmount(line: PublicQuotePreviewLine): number {
        return Math.max(0, line.cantidad) * Math.max(0, line.precioUnitario);
    }

    goBack(): void {
        if (typeof window !== "undefined" && window.history.length > 1) {
            window.history.back();
            return;
        }

        this.router.navigateByUrl("/");
    }

    downloadPreview(): void {
        if (typeof window === "undefined") {
            return;
        }
        window.print();
    }

    rejectQuote(): void {
        if (!this.quotePreview) {
            return;
        }

        const quoteToken = this.quotePreview.token;
        const fechaDecision = this.buildNowLabel();

        this.crmQuotesApi.updatePublicDecision(quoteToken, {
            estadoCliente: "Rechazada",
            fechaDecision,
            firmadoPor: "Cliente",
        }).subscribe({
            next: (updated) => {
                this.quotePreview = this.mapApiQuoteToPreview(updated);
                this.actionMessageType = "danger";
                this.actionMessage = "La cotizacion fue rechazada por el cliente.";
            },
            error: (error) => {
                this.actionMessageType = "danger";
                this.actionMessage = this.resolveErrorMessage(error, "No se pudo registrar el rechazo en backend.");
            },
        });
    }

    openSignatureModal(): void {
        this.showSignatureModal = true;
        this.signatureError = "";
        this.actionMessage = "";
        this.pendingCanvasInit = true;

        if (this.quotePreview && !this.signatureForm.correo) {
            this.signatureForm.correo = this.quotePreview.correo;
        }
    }

    closeSignatureModal(): void {
        this.showSignatureModal = false;
        this.signatureError = "";
        this.pendingCanvasInit = false;
        this.isDrawingSignature = false;
        this.signatureContext = null;
        this.strokeSnapshots = [];
        this.strokeCount = 0;
        this.signatureHasInk = false;

        if (this.activeDraftKey) {
            this.formDraftService.save(this.activeDraftKey, {
                showSignatureModal: this.showSignatureModal,
                signatureForm: { ...this.signatureForm },
            });
        }
    }

    startSignature(event: PointerEvent): void {
        if (!this.signatureContext || !this.signatureCanvasRef) {
            return;
        }

        event.preventDefault();
        const canvas = this.signatureCanvasRef.nativeElement;
        canvas.setPointerCapture(event.pointerId);

        this.strokeSnapshots.push(this.signatureContext.getImageData(0, 0, canvas.width, canvas.height));
        const point = this.getCanvasPoint(event);
        this.lastX = point.x;
        this.lastY = point.y;
        this.currentStrokeHasInk = false;
        this.isDrawingSignature = true;
    }

    drawSignature(event: PointerEvent): void {
        if (!this.signatureContext || !this.isDrawingSignature) {
            return;
        }

        event.preventDefault();
        const point = this.getCanvasPoint(event);

        this.signatureContext.beginPath();
        this.signatureContext.moveTo(this.lastX, this.lastY);
        this.signatureContext.lineTo(point.x, point.y);
        this.signatureContext.stroke();

        this.lastX = point.x;
        this.lastY = point.y;
        this.currentStrokeHasInk = true;
    }

    endSignature(): void {
        if (!this.isDrawingSignature) {
            return;
        }

        if (this.currentStrokeHasInk) {
            this.strokeCount += 1;
            this.signatureHasInk = true;
        } else {
            this.strokeSnapshots.pop();
        }

        this.currentStrokeHasInk = false;
        this.isDrawingSignature = false;
    }

    clearSignaturePad(): void {
        this.resetSignatureCanvasBackground();
        this.strokeSnapshots = [];
        this.strokeCount = 0;
        this.signatureHasInk = false;
    }

    undoSignatureStroke(): void {
        if (!this.signatureContext || this.strokeSnapshots.length === 0) {
            return;
        }

        const snapshot = this.strokeSnapshots.pop();
        if (!snapshot) {
            return;
        }

        this.signatureContext.putImageData(snapshot, 0, 0);
        this.strokeCount = Math.max(0, this.strokeCount - 1);
        this.signatureHasInk = this.strokeCount > 0;
    }

    triggerSignatureUpload(input: HTMLInputElement): void {
        input.click();
    }

    onSignatureFileSelected(event: Event): void {
        if (typeof FileReader === "undefined") {
            return;
        }

        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file || !this.signatureContext || !this.signatureCanvasRef) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                if (!this.signatureContext || !this.signatureCanvasRef) {
                    return;
                }

                const canvas = this.signatureCanvasRef.nativeElement;
                this.resetSignatureCanvasBackground();

                const ratio = Math.min(canvas.width / image.width, canvas.height / image.height);
                const drawWidth = image.width * ratio;
                const drawHeight = image.height * ratio;
                const drawX = (canvas.width - drawWidth) / 2;
                const drawY = (canvas.height - drawHeight) / 2;

                this.signatureContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);
                this.strokeSnapshots = [];
                this.strokeCount = 1;
                this.signatureHasInk = true;
            };

            image.src = String(reader.result);
        };

        reader.readAsDataURL(file);
        target.value = "";
    }

    confirmApproval(): void {
        if (!this.quotePreview) {
            return;
        }

        const nombre = this.signatureForm.nombre.trim();
        const apellido = this.signatureForm.apellido.trim();
        const correo = this.signatureForm.correo.trim();
        const lugar = this.signatureForm.lugar.trim();

        if (!nombre || !apellido || !correo || !lugar) {
            this.signatureError = "Completa todos los campos requeridos para firmar.";
            return;
        }

        if (!this.signatureHasInk) {
            this.signatureError = "Debes registrar una firma antes de confirmar.";
            return;
        }

        const quoteToken = this.quotePreview.token;
        const fechaDecision = this.buildNowLabel();
        const firmadoPor = `${nombre} ${apellido}`;
        const firmaBase64 = this.signatureCanvasRef?.nativeElement.toDataURL("image/png") ?? "";

        this.crmQuotesApi.updatePublicDecision(quoteToken, {
            estadoCliente: "Aceptada",
            fechaDecision,
            firmadoPor,
            firmanteCorreo: correo,
            lugarFirma: lugar,
            firmaBase64,
        }).subscribe({
            next: (updated) => {
                this.quotePreview = this.mapApiQuoteToPreview(updated);
                this.showSignatureModal = false;
                this.signatureError = "";
                this.actionMessageType = "success";
                this.actionMessage = `Cotizacion aprobada por ${nombre} ${apellido}.`;
                this.formDraftService.remove(this.activeDraftKey);
            },
            error: (error) => {
                this.signatureError = this.resolveErrorMessage(error, "No se pudo registrar la aprobacion en backend.");
            },
        });
    }

    private initializeSignatureCanvas(): void {
        if (!this.showSignatureModal || !this.signatureCanvasRef) {
            return;
        }

        const canvas = this.signatureCanvasRef.nativeElement;
        const width = Math.max(340, Math.floor(canvas.getBoundingClientRect().width || 700));
        const height = Math.max(160, Math.floor(canvas.getBoundingClientRect().height || 180));

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
            return;
        }

        context.lineWidth = 2;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = "#2f3b4c";

        this.signatureContext = context;
        this.resetSignatureCanvasBackground();
        this.strokeSnapshots = [];
        this.strokeCount = 0;
        this.signatureHasInk = false;
        this.pendingCanvasInit = false;
    }

    private resetSignatureCanvasBackground(): void {
        if (!this.signatureContext || !this.signatureCanvasRef) {
            return;
        }

        const canvas = this.signatureCanvasRef.nativeElement;
        this.signatureContext.fillStyle = "#ffffff";
        this.signatureContext.fillRect(0, 0, canvas.width, canvas.height);
    }

    private getCanvasPoint(event: PointerEvent): { x: number; y: number } {
        if (!this.signatureCanvasRef) {
            return { x: 0, y: 0 };
        }

        const rect = this.signatureCanvasRef.nativeElement.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    private resolveErrorMessage(error: unknown, fallback: string): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }
        return fallback;
    }

    private buildNowLabel(): string {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hour}:${minute}`;
    }

    private restoreDraft(): void {
        const draft = this.formDraftService.load<{
            showSignatureModal?: boolean;
            signatureForm?: { nombre?: string; apellido?: string; correo?: string; lugar?: string };
        }>(this.activeDraftKey);

        if (!draft) {
            return;
        }

        this.showSignatureModal = Boolean(draft.showSignatureModal ?? this.showSignatureModal);

        if (draft.signatureForm) {
            this.signatureForm = {
                nombre: String(draft.signatureForm.nombre ?? ""),
                apellido: String(draft.signatureForm.apellido ?? ""),
                correo: String(draft.signatureForm.correo ?? ""),
                lugar: String(draft.signatureForm.lugar ?? ""),
            };
        }
    }
}
