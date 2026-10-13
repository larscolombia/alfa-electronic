import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { CrmClientRecord, CrmClientsApiService, UpsertCrmClientRequest } from "../../../services/crm-clients-api.service";
import { CrmClientContactsComponent } from "./crm-client-contacts.component";

type ClientDetailTab = "perfil" | "contactos" | "credito";
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
                <div class="col mb-3 mb-sm-0">
                    <h5 class="mb-0">{{ client?.nombre || "Cliente" }}</h5>
                    <p class="text-secondary small mb-0">Ficha comercial del cliente.</p>
                </div>
            </div>
            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/crm-clientes">Clientes</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">{{ client?.nombre || "Detalle" }}</li>
                </ol>
            </nav>
        </div>

        <div class="container-fluid mt-3" id="main-content">
            @if (!client) {
                <div class="card adminuiux-card">
                    <div class="card-body py-5 text-center">
                        <h6 class="mb-2">No encontramos el cliente solicitado.</h6>
                        <p class="text-secondary mb-3">Verifica el enlace o vuelve al listado de clientes.</p>
                        <a class="btn btn-theme" routerLink="/app/crm-clientes">Volver a clientes</a>
                    </div>
                </div>
            } @else {
                <ul class="nav nav-tabs border-bottom-0">
                    <li class="nav-item">
                        <button class="nav-link" type="button" [class.active]="activeTab === 'perfil'" (click)="activeTab = 'perfil'">Perfil</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" type="button" [class.active]="activeTab === 'contactos'" (click)="activeTab = 'contactos'">Contactos</button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" type="button" [class.active]="activeTab === 'credito'" (click)="activeTab = 'credito'">Crédito</button>
                    </li>
                </ul>

                <div class="pt-3">
                    @if (activeTab === 'perfil') {
                        <div class="row gx-3 gx-lg-4">
                            <div class="col-12 col-xl-4 mb-3 mb-xl-0">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-header border-bottom">
                                        <h6 class="mb-0">Informacion de perfil</h6>
                                    </div>
                                    <div class="card-body">
                                        @if (profileFieldErrorMessage) {
                                            <div class="alert alert-danger border py-2 px-3 mb-3">{{ profileFieldErrorMessage }}</div>
                                        }
                                        @if (profileFieldSuccessMessage) {
                                            <div class="alert alert-success border py-2 px-3 mb-3">{{ profileFieldSuccessMessage }}</div>
                                        }

                                        @for (field of editableFields; track field.key) {
                                            <div class="small text-secondary mb-1 d-flex justify-content-between align-items-center gap-2">
                                                <span>{{ field.label }}</span>
                                                <button class="btn btn-sm btn-link text-secondary p-0" type="button"
                                                    [disabled]="isSavingField"
                                                    [title]="'Editar ' + field.label"
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
                                                    <button class="btn btn-theme" type="button" [disabled]="isSavingField" (click)="saveEdit(field.key)">
                                                        <i class="bi bi-check-lg"></i>
                                                    </button>
                                                    <button class="btn btn-outline-secondary" type="button" [disabled]="isSavingField" (click)="cancelEdit()">
                                                        <i class="bi bi-x-lg"></i>
                                                    </button>
                                                </div>
                                            } @else {
                                                @if (field.key === 'website' && clientFieldValue(field.key) !== '--') {
                                                    <p class="mb-3"><a [href]="clientFieldValue(field.key)" target="_blank" rel="noopener noreferrer">{{ clientFieldValue(field.key) }}</a></p>
                                                } @else {
                                                    <p class="mb-3">{{ clientFieldValue(field.key) }}</p>
                                                }
                                            }
                                        }

                                        <div class="small text-secondary mb-1">Estado</div>
                                        <p class="mb-0">
                                            <span class="badge" [class.text-bg-success]="client.estado === 'Activo'" [class.text-bg-secondary]="client.estado === 'Inactivo'">
                                                {{ client.estado }}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div class="col-12 col-xl-8">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-header border-bottom">
                                        <h6 class="mb-0">Sucursales</h6>
                                    </div>
                                    <div class="card-body">
                                        @if ((client.branches ?? []).length === 0) {
                                            <div class="border rounded p-4 text-center text-secondary">
                                                <p class="mb-0">Este cliente no tiene sucursales registradas. Edítalo para agregar sedes.</p>
                                            </div>
                                        } @else {
                                            @for (branch of client.branches; track branch.id) {
                                                <div class="border rounded p-3 mb-3">
                                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                                        <strong>{{ branch.name }}</strong>
                                                        @if (branch.isPrimary) {
                                                            <span class="badge text-bg-theme">Principal</span>
                                                        }
                                                    </div>
                                                    <div class="row gx-3 small text-secondary">
                                                        <div class="col-12 col-sm-6 mb-1"><i class="bi bi-person me-1"></i>{{ branch.contactName || '--' }}{{ branch.contactRole ? ' · ' + branch.contactRole : '' }}</div>
                                                        <div class="col-12 col-sm-6 mb-1"><i class="bi bi-envelope me-1"></i>{{ branch.email || '--' }}</div>
                                                        <div class="col-12 col-sm-6 mb-1"><i class="bi bi-telephone me-1"></i>{{ branch.phone || '--' }}</div>
                                                        <div class="col-12 col-sm-6 mb-1"><i class="bi bi-geo-alt me-1"></i>{{ branch.city || '--' }}{{ branch.country ? ', ' + branch.country : '' }}</div>
                                                        <div class="col-12 mb-1"><i class="bi bi-map me-1"></i>{{ branch.address || '--' }}</div>
                                                    </div>
                                                </div>
                                            }
                                        }
                                        <a class="btn btn-outline-secondary btn-sm mt-1" [routerLink]="['/app/crm-clientes']" [queryParams]="{ editId: client.id }">
                                            <i class="bi bi-pencil me-1"></i> Editar sucursales
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }

                    @if (activeTab === 'contactos') {
                        <app-crm-client-contacts [clientId]="client.id" [empresa]="client.empresa" />
                    }

                    @if (activeTab === 'credito') {
                        <div class="row gx-3 gx-lg-4">
                            <div class="col-12 col-xl-5 mb-3 mb-xl-0">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-header border-bottom">
                                        <h6 class="mb-0">Estado de crédito</h6>
                                    </div>
                                    <div class="card-body">
                                        @if (!client.credito.enabled) {
                                            <div class="border rounded p-4 text-center text-secondary">
                                                Este cliente no tiene crédito habilitado.
                                                <a class="d-block mt-2 small" routerLink="/app/finance-clientes-credito">Configurar desde Clientes a crédito</a>
                                            </div>
                                        } @else {
                                            <div class="row gx-3 gy-3">
                                                <div class="col-6">
                                                    <div class="border rounded p-3 text-center">
                                                        <div class="small text-secondary mb-1">Cupo maximo</div>
                                                        <div class="fw-semibold">{{ client.credito.creditLimit | currency: 'COP' : 'symbol' : '1.0-0' }}</div>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="border rounded p-3 text-center">
                                                        <div class="small text-secondary mb-1">Cupo disponible</div>
                                                        <div class="fw-semibold text-success">{{ availableCredit | currency: 'COP' : 'symbol' : '1.0-0' }}</div>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="border rounded p-3 text-center">
                                                        <div class="small text-secondary mb-1">Cupo consumido</div>
                                                        <div class="fw-semibold text-warning">{{ client.credito.consumed | currency: 'COP' : 'symbol' : '1.0-0' }}</div>
                                                    </div>
                                                </div>
                                                <div class="col-6">
                                                    <div class="border rounded p-3 text-center">
                                                        <div class="small text-secondary mb-1">Dias en mora</div>
                                                        <div class="fw-semibold" [class.text-danger]="daysInArrears > 0" [class.text-success]="daysInArrears === 0">{{ daysInArrears }}</div>
                                                    </div>
                                                </div>
                                                <div class="col-12">
                                                    <div class="small text-secondary mb-1">Plazo de pago</div>
                                                    <p class="mb-0">{{ client.credito.paymentTermDays }} dias</p>
                                                    <div class="small text-secondary mt-2 mb-1">Ultimo pago</div>
                                                    <p class="mb-0">{{ client.credito.lastPaymentDate || 'Sin registro' }}</p>
                                                </div>
                                            </div>
                                            <div class="mt-3">
                                                <a class="btn btn-outline-secondary btn-sm" routerLink="/app/finance-clientes-credito">
                                                    <i class="bi bi-pencil me-1"></i> Editar credito
                                                </a>
                                            </div>
                                        }
                                    </div>
                                </div>
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
    activeTab: ClientDetailTab = "perfil";

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
        if (!clientId.trim()) {
            this.client = undefined;
            return;
        }
        this.crmClientsApi.getClient(clientId).subscribe({
            next: (client) => {
                this.client = client;
                this.editingField = null;
                this.editingValue = "";
                this.cdr.detectChanges();
            },
            error: () => {
                this.client = undefined;
                this.cdr.detectChanges();
            },
        });
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
