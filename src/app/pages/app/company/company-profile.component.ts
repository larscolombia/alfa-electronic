import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { CompanyProfile, CompanySettingsApiService } from "../../../services/company-settings-api.service";

/**
 * Perfil de la empresa: logo, nombre, NIT, contacto y titulo del navegador.
 * Estos datos alimentan las cotizaciones publicas (/estimate/:token), el
 * documento impreso de factura y el <title>/favicon del SPA. El pie de pagina
 * (copyright LARS) es fijo por contrato y NO se edita aqui: no existe campo
 * para ello, a proposito.
 */
@Component({
    selector: "app-company-profile",
    standalone: true,
    imports: [FormsModule, RouterLink],
    template: `
        <!-- page title -->
        <div class="container-fluid py-3">
            <div class="row gx-3 align-items-center page-title">
                <div class="col col-sm mb-0 order-1">
                    <h5 class="mb-0">Perfil de la empresa</h5>
                    <p class="text-secondary small">
                        Estos datos se muestran en las cotizaciones, en las facturas impresas y en el navegador.
                    </p>
                </div>
            </div>
            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>Inicio</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Perfil de la empresa</li>
                </ol>
            </nav>
        </div>

        <!-- content -->
        <div class="container-fluid px-lg-4 py-3 py-lg-4">
            @if (loadError) {
                <div class="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert">
                    <span>No se pudo cargar el perfil de la empresa: {{ loadError }}</span>
                    <button type="button" class="btn btn-sm btn-outline-dark" (click)="loadProfile()">Reintentar</button>
                </div>
            }

            @if (message) {
                <div class="alert alert-success" role="status">{{ message }}</div>
            }
            @if (errorMessage) {
                <div class="alert alert-danger" role="alert">{{ errorMessage }}</div>
            }

            <form (ngSubmit)="save()" novalidate>
                <!-- Identidad -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent pt-3 pb-0"><h6 class="mb-0">Identidad de la empresa</h6></div>
                    <div class="card-body">
                        <div class="row g-4 align-items-start">
                            <div class="col-md-auto">
                                <label class="form-label small text-secondary" for="cp-logo">Logo (imagen, hasta ~1MB)</label>
                                @if (form.logoDataUrl) {
                                    <img [src]="form.logoDataUrl" alt="Logo de la empresa" style="width: 140px; max-height: 140px; object-fit: contain;" />
                                } @else {
                                    <div class="border rounded d-flex align-items-center justify-content-center text-secondary small" style="width: 140px; height: 96px;">Sin logo</div>
                                }
                                <input id="cp-logo" type="file" accept="image/*" class="form-control form-control-sm mt-2" (change)="onLogoPicked($event)" />
                                @if (logoError) {
                                    <div class="text-danger small mt-1">{{ logoError }}</div>
                                }
                                @if (form.logoDataUrl) {
                                    <button type="button" class="btn btn-sm btn-outline-secondary mt-2" (click)="removeLogo()">Quitar logo</button>
                                }
                            </div>

                            <div class="col-md">
                                <div class="row g-3">
                                    <div class="col-md-8">
                                        <label class="form-label small text-secondary" for="cp-name">Nombre de la empresa *</label>
                                        <input id="cp-name" type="text" class="form-control" [(ngModel)]="form.name" name="name" maxlength="150" placeholder="Ej.: ALFA Electronic Colombia SAS" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small text-secondary" for="cp-nit">NIT</label>
                                        <input id="cp-nit" type="text" class="form-control" [(ngModel)]="form.nit" name="nit" maxlength="20" placeholder="Ej.: 901.234.567-8" />
                                    </div>
                                </div>
                                <label class="form-label small text-secondary d-block mt-3" for="cp-tagline">Descripción / eslogan</label>
                                <textarea id="cp-tagline" class="form-control" rows="2" [(ngModel)]="form.tagline" name="tagline" maxlength="300" placeholder="Qué hace la empresa; aparece en cotizaciones y facturas."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contacto -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent pt-3 pb-0"><h6 class="mb-0">Datos de contacto</h6></div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label small text-secondary" for="cp-address">Dirección</label>
                                <input id="cp-address" type="text" class="form-control" [(ngModel)]="form.address" name="address" maxlength="200" placeholder="Calle 123 # 45-67, Bogotá" />
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small text-secondary" for="cp-phone">Teléfono</label>
                                <input id="cp-phone" type="text" class="form-control" [(ngModel)]="form.phone" name="phone" maxlength="200" placeholder="+57 601 123 4567" />
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small text-secondary">&nbsp;</label>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-secondary" for="cp-email">Correo electrónico</label>
                                <input id="cp-email" type="email" class="form-control" [(ngModel)]="form.email" name="email" maxlength="200" placeholder="contacto@empresa.co" />
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small text-secondary" for="cp-website">Sitio web</label>
                                <input id="cp-website" type="url" class="form-control" [(ngModel)]="form.website" name="website" maxlength="200" placeholder="https://www.ejemplo.com" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Redes sociales -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent pt-3 pb-0"><h6 class="mb-0">Redes sociales <span class="text-secondary small">(opcional)</span></h6></div>
                    <div class="card-body">
                        <div class="row g-3">
                            @for (network of socialNetworks; track network.name) {
                                <div class="col-md-3">
                                    <label class="form-label small text-secondary" [attr.for]="'cp-' + network.name">{{ network.label }}</label>
                                    <input [id]="'cp-' + network.name" type="url" class="form-control" [(ngModel)]="network.value" [name]="network.name" maxlength="200" placeholder="https://..." />
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <!-- Navegador -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent pt-3 pb-0"><h6 class="mb-0">Navegador y marca</h6></div>
                    <div class="card-body">
                        <div class="row g-3 align-items-end">
                            <div class="col-md-6">
                                <label class="form-label small text-secondary" for="cp-title">Título de la pestaña del navegador</label>
                                <input id="cp-title" type="text" class="form-control" [(ngModel)]="form.pageTitle" name="pageTitle" maxlength="80" placeholder="Ej.: ALFA Electronic" />
                            </div>
                            <div class="col-md-6">
                                <p class="small text-secondary mb-0">
                                    El pie de página (copyright del desarrollador) es fijo por contrato y no se edita en esta vista.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-end mb-4">
                    <button type="submit" class="btn btn-theme px-4" [disabled]="saving">
                        @if (saving) {
                            Guardando...
                        } @else {
                            Guardar cambios
                        }
                    </button>
                </div>
            </form>
        </div>
    `,
})
export class CompanyProfileComponent implements OnInit {
    form: CompanyProfile = this.emptyProfile();

    saving = false;
    message = "";
    errorMessage = "";
    loadError = "";
    logoError = "";

    /** Redes sociales editables desde el formulario. */
    socialNetworks: Array<{ name: "youtube" | "instagram" | "facebook" | "twitter"; label: string; value: string }> = [
        { name: "youtube", label: "YouTube", value: "" },
        { name: "instagram", label: "Instagram", value: "" },
        { name: "facebook", label: "Facebook", value: "" },
        { name: "twitter", label: "Twitter / X", value: "" },
    ];

    private static readonly MAX_LOGO_DATA_URL = 1 * 1024 * 1024 * 4 / 3; // igual al tope del backend

    constructor(private readonly companySettingsApi: CompanySettingsApiService) {}

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile(): void {
        this.loadError = "";
        this.companySettingsApi.getProfile().subscribe({
            next: (profile) => {
                this.form = profile;
                this.syncSocialNetworks(profile);
                this.message = "Perfil cargado correctamente.";
                this.errorMessage = "";
            },
            error: (error: Error) => {
                this.loadError = error?.message || "falló la conexión con el servidor";
                this.message = "";
            },
        });
    }

    onLogoPicked(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files[0];
        // Se limpia para poder re-seleccionar el mismo archivo si falla la validación.
        input.value = "";
        if (!file) {
            return;
        }
        this.logoError = "";

        if (!file.type.startsWith("image/")) {
            this.logoError = "El logo debe ser una imagen (PNG, JPG o SVG).";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = typeof reader.result === "string" ? reader.result : "";
            if (!dataUrl) {
                this.logoError = "No se pudo leer el archivo.";
                return;
            }
            if (dataUrl.length > CompanyProfileComponent.MAX_LOGO_DATA_URL) {
                this.logoError = "El logo supera el tamaño permitido (~1MB). Usa una imagen más ligera.";
                return;
            }
            this.form = { ...this.form, logoDataUrl: dataUrl };
        };
        reader.onerror = () => {
            this.logoError = "No se pudo leer el archivo. Intenta con otra imagen.";
        };
        reader.readAsDataURL(file);
    }

    removeLogo(): void {
        this.form = { ...this.form, logoDataUrl: "" };
        this.logoError = "";
    }

    save(): void {
        this.message = "";
        this.errorMessage = "";

        const validationError = this.validate();
        if (validationError) {
            this.errorMessage = validationError;
            return;
        }

        const payload: CompanyProfile = { ...this.form, youtube: this.socialNetworks[0].value.trim(), instagram: this.socialNetworks[1].value.trim(), facebook: this.socialNetworks[2].value.trim(), twitter: this.socialNetworks[3].value.trim() };
        this.saving = true;

        this.companySettingsApi.updateProfile(payload).subscribe({
            next: (saved) => {
                this.saving = false;
                // El backend devuelve el perfil ya validado: se adopta como estado local.
                this.form = saved;
                this.syncSocialNetworks(saved);
                this.message = "Cambios guardados. Ya están visibles en cotizaciones, facturas y navegador.";
            },
            error: (error: Error) => {
                this.saving = false;
                this.errorMessage = error?.message || "No se pudieron guardar los cambios.";
            },
        });
    }

    private validate(): string {
        const name = this.form.name.trim();
        if (!name) {
            return "El nombre de la empresa es obligatorio.";
        }
        if (name.length > 150) {
            return "El nombre de la empresa no puede superar 150 caracteres.";
        }

        const urlFields: Array<[string, string]> = [
            ["website", this.form.website.trim()],
            ["youtube", this.socialNetworks[0].value.trim()],
            ["instagram", this.socialNetworks[1].value.trim()],
            ["facebook", this.socialNetworks[2].value.trim()],
            ["twitter", this.socialNetworks[3].value.trim()],
        ];
        for (const [label, value] of urlFields) {
            if (!value) {
                continue;
            }
            // El backend exige https?://host... — se valida igual en el cliente para no gastar el request.
            if (!/^https?:\/\/\S+$/.test(value) || !/^[^@\s]+\.[^@\s]+$/.test(value.replace(/^https?:\/\//, "").split("/")[0])) {
                return `El campo "${label}" debe quedar vacío o ser una URL completa (https://...).`;
            }
        }

        const email = this.form.email.trim();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return "El correo electrónico no tiene formato válido.";
        }

        if (this.form.logoDataUrl) {
            if (!this.form.logoDataUrl.startsWith("data:image/")) {
                return "El logo debe ser una imagen; usa el selector de archivo para cargarlo.";
            }
            if (this.form.logoDataUrl.length > CompanyProfileComponent.MAX_LOGO_DATA_URL) {
                return "El logo supera el tamaño permitido (~1MB).";
            }
        }

        return "";
    }

    private syncSocialNetworks(profile: CompanyProfile): void {
        this.socialNetworks[0].value = profile.youtube;
        this.socialNetworks[1].value = profile.instagram;
        this.socialNetworks[2].value = profile.facebook;
        this.socialNetworks[3].value = profile.twitter;
    }

    private emptyProfile(): CompanyProfile {
        return {
            name: "",
            nit: "",
            tagline: "",
            logoDataUrl: "",
            address: "",
            phone: "",
            email: "",
            website: "",
            youtube: "",
            instagram: "",
            facebook: "",
            twitter: "",
            pageTitle: "ALFA Electronic",
        };
    }
}
