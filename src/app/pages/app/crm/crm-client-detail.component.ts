import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { catchError, forkJoin, map, of, Subscription } from "rxjs";
import { CrmClientRecord, CrmClientsApiService, UpsertCrmClientRequest } from "../../../services/crm-clients-api.service";
import { CrmClientContactsComponent } from "./crm-client-contacts.component";
import { CrmProspectsApiService, CrmProspectRecord } from "../../../services/crm-prospects-api.service";
import { CrmFollowupsApiService, CrmProspectFollowup } from "../../../services/crm-followups-api.service";
import { CrmAttachmentsApiService, ProspectAttachment } from "../../../services/crm-attachments-api.service";

type ClientDetailTab = "perfil" | "contactos" | "acciones" | "equipos" | "cotizacion" | "archivos" | "notas" | "sucursales" | "trazabilidad";
type EditableClientField = "nombre" | "correo" | "empresa" | "nit" | "website" | "officePhone" | "country" | "city" | "address" | "zona";

type EditableClientFieldConfig = {
    key: EditableClientField;
    label: string;
    inputType?: "text" | "email" | "url";
};

@Component({
    selector: "app-crm-client-detail",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, CrmClientContactsComponent],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col mb-3 mb-sm-0 d-flex align-items-start gap-2">
                    <a class="btn btn-outline-secondary" routerLink="/app/crm-clientes"><i class="bi bi-arrow-left me-1"></i>Volver</a>
                    <div>
                    <h5 class="mb-0">{{ client?.empresa || "Cliente" }}</h5>
                    <p class="text-secondary small mb-0">Ficha comercial del cliente.</p>
                    </div>
                </div>
            </div>
            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/crm-clientes">Clientes</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">{{ client?.empresa || "Detalle" }}</li>
                </ol>
            </nav>
        </div>

        <div class="container-fluid mt-3" id="main-content">
            @if (clientLoading) {
                <div class="card adminuiux-card" aria-live="polite">
                    <div class="card-body py-5 text-center">
                        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Cargando ficha del cliente...
                    </div>
                </div>
            } @else if (!client) {
                <div class="card adminuiux-card">
                    <div class="card-body py-5 text-center">
                        <h6 class="mb-2">No encontramos el cliente solicitado.</h6>
                        <p class="text-secondary mb-3">Verifica el enlace o vuelve al listado de clientes.</p>
                        <a class="btn btn-theme" routerLink="/app/crm-clientes">Volver a clientes</a>
                    </div>
                </div>
            } @else {
                <ul class="nav nav-tabs border-bottom-0 flex-nowrap overflow-auto" role="tablist" aria-label="Secciones de la ficha del cliente">
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [attr.aria-selected]="activeTab === 'perfil'" [class.active]="activeTab === 'perfil'" (click)="activeTab = 'perfil'">Perfil</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [attr.aria-selected]="activeTab === 'contactos'" [class.active]="activeTab === 'contactos'" (click)="activeTab = 'contactos'">Contactos relacionados</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" role="tab" type="button" [attr.aria-selected]="activeTab === 'acciones'"
                            [class.active]="activeTab === 'acciones'"
                            (click)="activeTab = 'acciones'">Acciones comerciales</button>
                    </li>
                    <li class="nav-item"><button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'equipos'" (click)="activeTab = 'equipos'">Equipos</button></li>
                    <li class="nav-item"><button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'cotizacion'" (click)="activeTab = 'cotizacion'">Cotización</button></li>
                    <li class="nav-item"><button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'archivos'" (click)="activeTab = 'archivos'">Archivos</button></li>
                    <li class="nav-item"><button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'notas'" (click)="activeTab = 'notas'">Notas</button></li>
                    <li class="nav-item"><button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'sucursales'" (click)="activeTab = 'sucursales'">Sucursales</button></li>
                    <li class="nav-item"><button class="nav-link" role="tab" type="button" [class.active]="activeTab === 'trazabilidad'" (click)="activeTab = 'trazabilidad'">Trazabilidad</button></li>
                </ul>

                <div class="pt-3" role="tabpanel" aria-live="polite">
                    @if (activeTab === 'perfil') {
                        <div class="row gx-3 gx-lg-4">
                            <div class="col-12 mb-3">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-header border-bottom">
                                        <h5 class="mb-1">Información del perfil</h5>
                                        <p class="text-secondary small mb-0">Estado <span class="badge" [class.text-bg-success]="client.estado === 'Activo'" [class.text-bg-secondary]="client.estado === 'Inactivo'">{{ client.estado }}</span> · Empresa <strong>{{ client.empresa }}</strong></p>
                                    </div>
                                    <div class="card-body">
                                        @if (profileFieldErrorMessage) {
                                            <div class="alert alert-danger border py-2 px-3 mb-3">{{ profileFieldErrorMessage }}</div>
                                        }
                                        @if (profileFieldSuccessMessage) {
                                            <div class="alert alert-success border py-2 px-3 mb-3">{{ profileFieldSuccessMessage }}</div>
                                        }

                                        <div class="row gx-3 gy-3">
                                        @for (field of editableFields; track field.key) {
                                            <div class="col-12 col-md-6 col-xl-4"><div class="border rounded p-3 h-100">
                                            <div class="small text-secondary mb-1 d-flex justify-content-between align-items-center gap-2">
                                                <span>{{ field.label }}</span>
                                                <button class="btn btn-sm btn-link text-secondary p-0" type="button"
                                                    [disabled]="isSavingField"
                                                    [title]="'Editar ' + field.label"
                                                    [attr.aria-label]="'Editar ' + field.label"
                                                    (click)="startEdit(field.key)">
                                                    <i class="bi bi-pencil"></i>
                                                </button>
                                            </div>

                                            @if (editingField === field.key) {
                                                <div class="input-group input-group-sm mb-3">
                                                    <input class="form-control"
                                                        [type]="field.inputType || 'text'"
                                                        [(ngModel)]="editingValue"
                                                        [ngModelOptions]="{ standalone: true }"
                                                        [disabled]="isSavingField"
                                                        [attr.placeholder]="'Editar ' + field.label" />
                                                    <button class="btn btn-theme" type="button" aria-label="Guardar cambio" [disabled]="isSavingField" (click)="saveEdit(field.key)">
                                                        <i class="bi bi-check-lg"></i>
                                                    </button>
                                                    <button class="btn btn-outline-secondary" type="button" aria-label="Cancelar edición" [disabled]="isSavingField" (click)="cancelEdit()">
                                                        <i class="bi bi-x-lg"></i>
                                                    </button>
                                                </div>
                                            } @else {
                                                @if (field.key === 'website' && clientFieldValue(field.key) !== '--') {
                                                    <p class="mb-0"><a [href]="clientFieldValue(field.key)" target="_blank" rel="noopener noreferrer">{{ clientFieldValue(field.key) }}</a></p>
                                                } @else {
                                                    <p class="mb-0">{{ clientFieldValue(field.key) }}</p>
                                                }
                                            }</div></div>
                                        }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

                    @if (activeTab === 'contactos') {
                        <app-crm-client-contacts [clientId]="client.id" [empresa]="client.empresa" />
                    }

                    @if (activeTab === 'acciones') {
                        <div class="row gx-3 gx-lg-4">
                            <div class="col-12">
                                @if (historyLoading) {
                                    <div class="card adminuiux-card mb-3">
                                        <div class="card-body text-center py-4">
                                            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Cargando historial comercial y documentos...
                                        </div>
                                    </div>
                                }

                                @if (historyErrorMessage) {
                                    <div class="alert alert-danger">{{ historyErrorMessage }}</div>
                                }
                                @if (historyPartialError) {
                                    <div class="alert alert-warning">{{ historyPartialError }}</div>
                                }
                            </div>

                            @if (!historyLoading && !historyErrorMessage) {
                                <div class="col-12">
                                    <div class="card adminuiux-card mb-3">
                                        <div class="card-header border-bottom d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Acciones comerciales y seguimientos</h6>
                                            <span class="badge text-bg-secondary">{{ historyFollowups.length }}</span>
                                        </div>
                                        <div class="card-body">
                                            @if (historyFollowups.length === 0) {
                                                <p class="text-secondary text-center py-3 mb-0">
                                                    No hay acciones comerciales registradas para este cliente.
                                                </p>
                                            } @else {
                                                <div class="table-responsive">
                                                    <table class="table table-hover align-middle">
                                                        <thead>
                                                            <tr>
                                                                <th>Fecha</th>
                                                                <th>Hora</th>
                                                                <th>Tipo</th>
                                                                <th>Observación</th>
                                                                <th>Estado</th>
                                                                <th>Responsable</th>
                                                                <th>Prospecto</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            @for (entry of historyFollowups; track entry.followup.id) {
                                                                <tr>
                                                                    <td>{{ formatHistoryDate(entry.followup.fecha) }}</td>
                                                                    <td>{{ entry.followup.hora || '--' }}</td>
                                                                    <td>{{ entry.followup.tipo || '--' }}</td>
                                                                    <td class="text-wrap" style="min-width: 180px">{{ entry.followup.observacion || '--' }}</td>
                                                                    <td>
                                                                        <span class="badge"
                                                                            [class.text-bg-success]="entry.followup.estado === 'Completado'"
                                                                            [class.text-bg-warning]="entry.followup.estado === 'Pendiente'">
                                                                            {{ entry.followup.estado }}
                                                                        </span>
                                                                    </td>
                                                                    <td>{{ entry.followup.registradoPor || '--' }}</td>
                                                                    <td>{{ entry.prospectName }}</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="card adminuiux-card">
                                        <div class="card-header border-bottom d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0">Documentos asociados</h6>
                                            <span class="badge text-bg-secondary">{{ historyAttachments.length }}</span>
                                        </div>
                                        <div class="card-body">
                                            @if (historyAttachments.length === 0) {
                                                <p class="text-secondary text-center py-3 mb-0">
                                                    No hay documentos asociados a los prospectos de este cliente.
                                                </p>
                                            } @else {
                                                <div class="table-responsive">
                                                    <table class="table table-hover align-middle">
                                                        <thead>
                                                            <tr>
                                                                <th>Documento</th>
                                                                <th>Tipo de archivo</th>
                                                                <th>Fecha de carga</th>
                                                                <th>Cargado por</th>
                                                                <th>Prospecto</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            @for (entry of historyAttachments; track entry.attachment.id) {
                                                                <tr>
                                                                    <td>
                                                                        @if (entry.attachment.storageUrl) {
                                                                            <a [href]="entry.attachment.storageUrl"
                                                                                target="_blank" rel="noopener noreferrer">
                                                                                {{ entry.attachment.filename }}
                                                                            </a>
                                                                        } @else {
                                                                            {{ entry.attachment.filename }}
                                                                            <div class="small text-secondary">No hay enlace de descarga disponible.</div>
                                                                        }
                                                                    </td>
                                                                    <td>{{ entry.attachment.mimeType || '--' }}</td>
                                                                    <td>{{ formatHistoryDate(entry.attachment.createdAt) }}</td>
                                                                    <td>{{ entry.attachment.uploadedBy || '--' }}</td>
                                                                    <td>{{ entry.prospectName }}</td>
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    }

                    @if (activeTab === 'sucursales') {
                        <div class="row gx-3 gx-lg-4">
                            <div class="col-12 col-xl-5 mb-3 mb-xl-0">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-header border-bottom">
                                        <h6 class="mb-0">Sucursales</h6>
                                    </div>
                                    <div class="card-body">
                                        @if ((client.branches ?? []).length === 0) {
                                            <div class="border rounded p-4 text-center text-secondary">
                                                No hay sucursales registradas.
                                            </div>
                                        } @else {
                                            @for (branch of client.branches; track branch.id) {
                                                <div class="border rounded p-3 mb-2"><strong>{{ branch.name }}</strong><div class="small text-secondary">{{ branch.city || '--' }}{{ branch.country ? ', ' + branch.country : '' }} · {{ branch.address || '--' }}</div></div>
                                            }
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

                    @if (activeTab === 'equipos' || activeTab === 'cotizacion' || activeTab === 'archivos' || activeTab === 'notas' || activeTab === 'trazabilidad') {
                        <div class="card adminuiux-card">
                            <div class="card-body py-5 text-center text-secondary">
                                <i class="bi bi-info-circle fs-3 d-block mb-2" aria-hidden="true"></i>
                                Esta sección usa la misma ficha comercial y mostrará los registros relacionados cuando existan.
                            </div>
                        </div>
                    }
                </div>
            }
        </div>
    `,
})
export class CrmClientDetailComponent {
    client: CrmClientRecord | undefined;
    clientLoading = true;
    activeTab: ClientDetailTab = "perfil";

    historyLoading = false;
    historyErrorMessage = "";
    historyPartialError = "";
    historyFollowups: Array<{
        prospectName: string;
        companyName: string;
        followup: CrmProspectFollowup;
    }> = [];
    historyAttachments: Array<{
        prospectName: string;
        companyName: string;
        attachment: ProspectAttachment;
    }> = [];

    editingField: EditableClientField | null = null;
    editingValue = "";
    isSavingField = false;
    profileFieldErrorMessage = "";
    profileFieldSuccessMessage = "";

    readonly editableFields: EditableClientFieldConfig[] = [
        { key: "nombre", label: "Nombre del cliente" },
        { key: "correo", label: "Correo electronico", inputType: "email" },
        { key: "empresa", label: "Empresa" },
        { key: "nit", label: "NIT" },
        { key: "website", label: "Sitio web", inputType: "url" },
        { key: "officePhone", label: "Telefono de oficina" },
        { key: "country", label: "Pais" },
        { key: "city", label: "Ciudad" },
        { key: "address", label: "Direccion" },
        { key: "zona", label: "Zona" },
    ];

    private readonly crmClientsApi = inject(CrmClientsApiService);
    private readonly crmProspectsApi = inject(CrmProspectsApiService);
    private readonly crmFollowupsApi = inject(CrmFollowupsApiService);
    private readonly crmAttachmentsApi = inject(CrmAttachmentsApiService);
    private readonly cdr = inject(ChangeDetectorRef);
    private routeSub?: Subscription;

    constructor(private readonly route: ActivatedRoute) {
        this.routeSub = this.route.paramMap.subscribe((params) => {
            const clientId = params.get("id") ?? "";
            this.loadClient(clientId);
        });
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
    }

    clientFieldValue(field: EditableClientField): string {
        if (!this.client) return "--";
        const raw = String((this.client as unknown as Record<string, unknown>)[field] ?? "").trim();
        return raw && raw !== "--" ? raw : "--";
    }

    startEdit(field: EditableClientField): void {
        if (!this.client || this.isSavingField) return;
        const raw = String((this.client as unknown as Record<string, unknown>)[field] ?? "").trim();
        this.editingField = field;
        this.editingValue = raw === "--" ? "" : raw;
        this.profileFieldErrorMessage = "";
        this.profileFieldSuccessMessage = "";
    }

    cancelEdit(): void {
        if (this.isSavingField) return;
        this.editingField = null;
        this.editingValue = "";
        this.profileFieldErrorMessage = "";
    }

    saveEdit(field: EditableClientField): void {
        const client = this.client;
        if (!client?.id) {
            this.profileFieldErrorMessage = "No se puede guardar: cliente sin ID.";
            return;
        }

        const value = this.editingValue.trim();

        if (field === "nombre" && !value) {
            this.profileFieldErrorMessage = "El nombre del cliente es requerido.";
            return;
        }
        if (field === "correo" && value && !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(value)) {
            this.profileFieldErrorMessage = "El correo no tiene un formato valido.";
            return;
        }
        if (field === "website" && value && !/^https?:\/\//i.test(value)) {
            this.profileFieldErrorMessage = "El sitio web debe iniciar con http:// o https://.";
            return;
        }

        const payload = this.buildPayload(client, field, value);
        this.profileFieldErrorMessage = "";
        this.profileFieldSuccessMessage = "";
        this.isSavingField = true;

        this.crmClientsApi.updateClient(client.id, payload).subscribe({
            next: (updated) => {
                this.isSavingField = false;
                this.client = updated;
                this.editingField = null;
                this.editingValue = "";
                this.profileFieldSuccessMessage = `${this.editableFields.find((f) => f.key === field)?.label ?? field} actualizado.`;
                this.cdr.detectChanges();
            },
            error: (err: Error) => {
                this.isSavingField = false;
                this.profileFieldErrorMessage = err?.message || "No se pudo actualizar el campo.";
                this.cdr.detectChanges();
            },
        });
    }

    get availableCredit(): number {
        if (!this.client) return 0;
        const limit = Number(this.client.credito?.creditLimit ?? 0);
        const consumed = Number(this.client.credito?.consumed ?? 0);
        return Math.max(0, limit - consumed);
    }

    get daysInArrears(): number {
        if (!this.client?.credito?.lastPaymentDate) return 0;
        const date = new Date(`${this.client.credito.lastPaymentDate}T00:00:00`);
        if (Number.isNaN(date.getTime())) return 0;
        const today = new Date();
        const floor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const days = Math.floor((floor.getTime() - date.getTime()) / 86_400_000);
        return Math.max(0, days - Math.max(0, this.client.credito.paymentTermDays ?? 30));
    }

    private loadClient(clientId: string): void {
        this.clientLoading = true;
        if (!clientId.trim()) {
            this.client = undefined;
            this.clientLoading = false;
            return;
        }
        this.crmClientsApi.getClient(clientId).subscribe({
            next: (client) => {
                this.client = client;
                this.clientLoading = false;
                this.editingField = null;
                this.editingValue = "";
                this.loadCommercialHistory(client);
                this.cdr.detectChanges();
            },
            error: () => {
                this.client = undefined;
                this.clientLoading = false;
                this.cdr.detectChanges();
            },
        });
    }

    private loadCommercialHistory(client: CrmClientRecord): void {
        this.historyLoading = true;
        this.historyErrorMessage = "";
        this.historyPartialError = "";
        this.historyFollowups = [];
        this.historyAttachments = [];

        const companyKey = this.normalizeCompanyName(client.empresa);
        if (!companyKey) {
            this.historyLoading = false;
            this.cdr.detectChanges();
            return;
        }

        this.crmProspectsApi.listProspects().subscribe({
            next: (prospects) => {
                const related = prospects.filter(
                    (prospect) => this.normalizeCompanyName(prospect.compania) === companyKey,
                );

                if (related.length === 0) {
                    this.historyLoading = false;
                    this.cdr.detectChanges();
                    return;
                }

                let requestHadErrors = false;
                const requests = related.map((prospect) =>
                    forkJoin({
                        followups: this.crmFollowupsApi.listProspectFollowups(prospect.backendId).pipe(
                            catchError(() => {
                                requestHadErrors = true;
                                return of([] as CrmProspectFollowup[]);
                            }),
                        ),
                        attachments: this.crmAttachmentsApi.listAttachments(prospect.backendId).pipe(
                            catchError(() => {
                                requestHadErrors = true;
                                return of([] as ProspectAttachment[]);
                            }),
                        ),
                    }).pipe(map((data) => ({ prospect, ...data }))),
                );

                forkJoin(requests).subscribe({
                    next: (results) => {
                        const followups: typeof this.historyFollowups = [];
                        const attachments: typeof this.historyAttachments = [];

                        for (const result of results) {
                            for (const followup of result.followups) {
                                if (!followup.softDelete) {
                                    followups.push({
                                        prospectName: result.prospect.nombre || "--",
                                        companyName: result.prospect.compania || "",
                                        followup,
                                    });
                                }
                            }

                            for (const attachment of result.attachments) {
                                attachments.push({
                                    prospectName: result.prospect.nombre || "--",
                                    companyName: result.prospect.compania || "",
                                    attachment,
                                });
                            }
                        }

                        this.historyFollowups = followups.sort(
                            (a, b) =>
                                this.historyFollowupTimestamp(b.followup.fecha, b.followup.hora) -
                                this.historyFollowupTimestamp(a.followup.fecha, a.followup.hora),
                        );
                        this.historyAttachments = attachments.sort(
                            (a, b) =>
                                this.historyDateTimestamp(b.attachment.createdAt) -
                                this.historyDateTimestamp(a.attachment.createdAt),
                        );

                        if (requestHadErrors) {
                            this.historyPartialError =
                                "No se pudieron cargar algunos seguimientos o documentos. Los registros disponibles se muestran a continuación.";
                        }
                        this.historyLoading = false;
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        this.historyErrorMessage = "No se pudo cargar el historial comercial.";
                        this.historyLoading = false;
                        this.cdr.detectChanges();
                    },
                });
            },
            error: () => {
                this.historyErrorMessage =
                    "No se pudo consultar la lista de prospectos para relacionar su historial con este cliente.";
                this.historyLoading = false;
                this.cdr.detectChanges();
            },
        });
    }

    private normalizeCompanyName(value: string | null | undefined): string {
        return String(value ?? "").trim().toLocaleLowerCase();
    }

    private historyFollowupTimestamp(fecha: string, hora: string): number {
        const date = String(fecha ?? "").trim();
        const time = String(hora ?? "").trim();
        const parsed = new Date(`${date}T${time || "00:00"}:00`);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    private historyDateTimestamp(value: string): number {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }

    formatHistoryDate(value: string | null | undefined): string {
        const text = String(value ?? "").trim();
        if (!text) return "--";

        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[3]}/${match[2]}/${match[1]}`;

        const parsed = new Date(text);
        if (Number.isNaN(parsed.getTime())) return text;

        return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
    }

    private buildPayload(client: CrmClientRecord, field: EditableClientField, value: string): UpsertCrmClientRequest {
        const rec = client as unknown as Record<string, unknown>;
        const resolve = (f: EditableClientField): string => {
            if (f === field) return value;
            const raw = String(rec[f] ?? "").trim();
            return raw === "--" ? "" : raw;
        };
        return {
            nombre: resolve("nombre"),
            correo: resolve("correo"),
            empresa: resolve("empresa"),
            nit: resolve("nit"),
            zona: resolve("zona"),
            estado: client.estado,
            website: resolve("website"),
            officePhone: resolve("officePhone"),
            country: resolve("country"),
            city: resolve("city"),
            address: resolve("address"),
            credito: { ...client.credito },
            branches: client.branches ?? [],
        };
    }
}
