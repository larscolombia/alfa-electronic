import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { ProspectEquipmentAttachment, ProspectEquipmentItem, ProspectEquipmentRecord } from "./crm-prospect-equipment.store";

@Component({
    selector: "app-crm-prospect-equipment-reception-print",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="reception-print-page">
            <div class="reception-print-controls no-print">
                <button class="btn btn-theme btn-sm" type="button" (click)="printNow()">Imprimir</button>
                <button class="btn btn-outline-secondary btn-sm" type="button" (click)="closeWindow()">Cerrar</button>
            </div>

            <div class="alert alert-info border" *ngIf="loading">Cargando formato de recepción...</div>
            <div class="alert alert-danger border" *ngIf="!loading && errorMessage">{{ errorMessage }}</div>

            <article class="reception-sheet" *ngIf="!loading && record as currentRecord">
                <header class="reception-sheet__header">
                    <h1>Formato de recepción de equipos</h1>
                    <div class="small text-secondary">Registro: {{ currentRecord.id }}</div>
                    <div class="small text-secondary">Generado: {{ formatDate(nowISO) }}</div>
                </header>

                <section class="reception-sheet__section">
                    <h2>Datos del cliente</h2>
                    <div class="sheet-grid">
                        <div><strong>Empresa:</strong> {{ currentRecord.companyName || '--' }}</div>
                        <div><strong>Sucursal:</strong> {{ currentRecord.sourceBranchName || '--' }}</div>
                        <div><strong>NIT:</strong> {{ currentRecord.nit || '--' }}</div>
                        <div><strong>Contacto:</strong> {{ currentRecord.contactName || '--' }}</div>
                        <div><strong>Cargo:</strong> {{ currentRecord.contactRole || '--' }}</div>
                        <div><strong>Teléfono:</strong> {{ currentRecord.phone || '--' }}</div>
                        <div><strong>Celular:</strong> {{ currentRecord.cellphone || '--' }}</div>
                        <div><strong>Correo:</strong> {{ currentRecord.email || '--' }}</div>
                        <div><strong>Ciudad:</strong> {{ currentRecord.city || '--' }}</div>
                        <div><strong>Dirección:</strong> {{ currentRecord.address || '--' }}</div>
                        <div><strong>Ingreso:</strong> {{ currentRecord.intakeMethod === 'transportadora' ? 'Transportadora' : 'Personal' }}</div>
                        <div><strong>Transportadora:</strong> {{ currentRecord.intakeCarrier || '--' }}</div>
                        <div><strong>Guía:</strong> {{ currentRecord.intakeTrackingNumber || '--' }}</div>
                        <div><strong>Recepción física:</strong> {{ currentRecord.intakeReceivedAt ? formatDate(currentRecord.intakeReceivedAt) : '--' }}</div>
                        <div><strong>Fecha del formato:</strong> {{ currentRecord.receptionDay || '--' }}/{{ currentRecord.receptionMonth || '--' }}/{{ currentRecord.receptionYear || '----' }}</div>
                    </div>
                </section>

                <section class="reception-sheet__section" *ngFor="let item of currentRecord.items; let i = index; trackBy: trackByItemId">
                    <h2>Equipo {{ i + 1 }} · {{ item.familyName || 'Sin familia' }} {{ item.marca || '' }} {{ item.tipo || '' }}</h2>
                    <div class="sheet-grid">
                        <div><strong>Serie:</strong> {{ item.serie || '--' }}</div>
                        <div><strong>Identificador:</strong> {{ item.receivedIdentifier || '--' }}</div>
                        <div><strong>Servicio:</strong> {{ item.serviceTypeName || '--' }}</div>
                        <div><strong>Ubicación:</strong> {{ item.storageLocationName || '--' }}</div>
                        <div><strong>Falla reportada:</strong> {{ item.failureDescription || '--' }}</div>
                        <div><strong>Accesorios:</strong> {{ item.accessories || '--' }}</div>
                        <div><strong>Técnico:</strong> {{ item.assignedTo || 'Sin asignar' }}</div>
                        <div><strong>Asignado:</strong> {{ item.assignedAt ? formatDate(item.assignedAt) : '--' }}</div>
                    </div>

                    <div class="sheet-qr" *ngIf="getItemQrAttachment(item) as qrAttachment">
                        <img [src]="qrAttachment.dataUrl" alt="QR equipo" />
                        <div class="small text-secondary">Etiqueta QR · {{ qrAttachment.fileName }}</div>
                    </div>

                    <div class="sheet-evidence" *ngIf="item.evidencePhotos.length > 0">
                        <h3>Evidencias</h3>
                        <div class="sheet-evidence-grid">
                            <figure *ngFor="let evidence of item.evidencePhotos; let evidenceIndex = index" [class.is-hidden]="evidenceIndex >= 12">
                                <img [src]="evidence.thumbnailDataUrl" alt="Evidencia" />
                                <figcaption>{{ evidence.evidenceType }} · {{ evidence.notes || 'Sin nota' }}</figcaption>
                            </figure>
                        </div>
                    </div>
                </section>

                <section class="reception-sheet__section">
                    <h2>Firmas</h2>
                    <div class="sheet-grid">
                        <div><strong>Firma cliente:</strong> {{ currentRecord.clientSignature || '--' }}</div>
                        <div><strong>Firma PIKA:</strong> {{ currentRecord.pikaSignature || '--' }}</div>
                    </div>
                </section>
            </article>
        </div>
    `,
    styles: [
        `
            .reception-print-page {
                max-width: 1024px;
                margin: 0 auto;
                padding: 1.5rem;
                color: #111827;
            }

            .reception-print-controls {
                display: flex;
                gap: 0.5rem;
                justify-content: flex-end;
                margin-bottom: 1rem;
            }

            .reception-sheet {
                border: 1px solid #d1d5db;
                border-radius: 0.5rem;
                background: #fff;
                padding: 1.25rem;
            }

            .reception-sheet__header {
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
            }

            .reception-sheet__header h1 {
                font-size: 1.35rem;
                margin: 0 0 0.25rem;
            }

            .reception-sheet__section {
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px dashed #e5e7eb;
            }

            .reception-sheet__section:last-child {
                margin-bottom: 0;
                border-bottom: 0;
            }

            .reception-sheet__section h2 {
                font-size: 1rem;
                margin: 0 0 0.5rem;
            }

            .reception-sheet__section h3 {
                font-size: 0.9rem;
                margin: 0 0 0.5rem;
            }

            .sheet-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.35rem 1rem;
                font-size: 0.9rem;
            }

            .sheet-qr {
                margin-top: 0.75rem;
                text-align: left;
            }

            .sheet-qr img {
                width: 120px;
                height: 120px;
                object-fit: contain;
                border: 1px solid #d1d5db;
                border-radius: 0.25rem;
                background: #fff;
            }

            .sheet-evidence {
                margin-top: 0.75rem;
            }

            .sheet-evidence-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 0.5rem;
            }

            .sheet-evidence-grid figure {
                margin: 0;
            }

            .sheet-evidence-grid figure.is-hidden {
                display: none;
            }

            .sheet-evidence-grid img {
                width: 100%;
                height: 90px;
                object-fit: cover;
                border: 1px solid #d1d5db;
                border-radius: 0.25rem;
                background: #f3f4f6;
            }

            .sheet-evidence-grid figcaption {
                font-size: 0.72rem;
                color: #4b5563;
                margin-top: 0.2rem;
            }

            @media (max-width: 767.98px) {
                .sheet-grid {
                    grid-template-columns: 1fr;
                }

                .sheet-evidence-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }

            @media print {
                .no-print {
                    display: none !important;
                }

                .reception-print-page {
                    max-width: none;
                    margin: 0;
                    padding: 0;
                }

                .reception-sheet {
                    border: 0;
                    border-radius: 0;
                    padding: 0;
                }
            }
        `,
    ],
})
export class CrmProspectEquipmentReceptionPrintComponent implements OnInit {
    record: ProspectEquipmentRecord | null = null;
    loading = true;
    errorMessage = "";
    nowISO = new Date().toISOString();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly crmEquipmentApi: CrmEquipmentApiService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        const recordID = String(this.route.snapshot.paramMap.get("recordId") ?? "").trim();
        if (!recordID) {
            this.errorMessage = "No se recibió el identificador de la recepción.";
            this.loading = false;
            return;
        }

        const autoPrint = this.route.snapshot.queryParamMap.get("autoprint") === "1";

        this.crmEquipmentApi.getRecord(recordID, true).subscribe({
            next: (record) => {
                this.record = record;
                this.loading = false;
                this.errorMessage = "";
                this.changeDetectorRef.detectChanges();

                if (!autoPrint) {
                    return;
                }

                setTimeout(() => {
                    this.printNow();
                }, 250);
            },
            error: () => {
                this.loading = false;
                this.errorMessage = "No fue posible cargar la recepción para imprimir.";
                this.changeDetectorRef.detectChanges();
            },
        });
    }

    trackByItemId(_: number, item: ProspectEquipmentItem): string {
        return item.id;
    }

    getItemQrAttachment(item: ProspectEquipmentItem): ProspectEquipmentAttachment | null {
        const attachments = item.attachments ?? [];
        return attachments.find((attachment) => String(attachment.attachmentType || "").trim().toLowerCase() === "qr-label") ?? null;
    }

    formatDate(value: string): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "--";
        }

        return date.toLocaleString();
    }

    printNow(): void {
        window.print();
    }

    closeWindow(): void {
        window.close();
    }
}
