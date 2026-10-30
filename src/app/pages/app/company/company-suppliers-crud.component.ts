import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import {
    ContactTitle,
    SupplierDraft,
    SupplierGrade,
    SupplierRecord,
    SuppliersCatalogService,
} from "../../../services/suppliers-catalog.service";

@Component({
    selector: "app-company-suppliers-crud",
    standalone: true,
    imports: [RouterLink, FormsModule],
    styles: [
        `
            .supplier-contact-trigger {
                cursor: pointer;
            }

            .suppliers-table-wrap {
                overflow-x: auto;
                overflow-y: visible;
            }

            .supplier-contact-tooltip {
                width: 320px;
                max-width: calc(100vw - 16px);
                z-index: 3000;
                pointer-events: auto;
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/suppliers-dashboard">Ver dashboard</a>
                    <button class="btn btn-theme" type="button" (click)="openCreateSupplierForm()">Crear proveedor</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/suppliers-dashboard">Proveedores</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">CRUD</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Total proveedores</p>
                            <h4 class="mb-0">{{ suppliers.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Confiables (A-B)</p>
                            <h4 class="mb-0">{{ reliableSuppliers }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Suscripciones activas</p>
                            <h4 class="mb-0">{{ activeSubscriptions }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col-12 col-md">
                            <h6 class="mb-0">Listado de proveedores</h6>
                            <p class="small text-secondary mb-0">Busqueda y accion rapida sobre registros existentes</p>
                        </div>
                        <div class="col-12 col-md-auto mt-2 mt-md-0">
                            <input class="form-control" type="text" placeholder="Buscar por numero, razon social o ciudad" [(ngModel)]="searchTerm" />
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive suppliers-table-wrap">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Nro</th>
                                    <th>Razon social</th>
                                    <th>Ciudad / Pais</th>
                                    <th>Contacto</th>
                                    <th>Grado</th>
                                    <th>Terminos de pago</th>
                                    <th class="text-end">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (supplier of filteredSuppliers; track supplier.id) {
                                    <tr>
                                        <td>
                                            <a class="btn btn-link btn-sm p-0" [routerLink]="['/app/suppliers-orders-history']" [queryParams]="{ supplierId: supplier.id }">
                                                {{ supplier.supplierNumber }}
                                            </a>
                                        </td>
                                        <td>{{ supplier.legalName }}</td>
                                        <td>{{ supplier.city }} / {{ supplier.country }}</td>
                                        <td>
                                            <div class="d-inline-block" (mouseenter)="showContactTooltip(supplier.id, $event)" (mouseleave)="scheduleHideTooltip(supplier.id, 1200)" (click)="$event.stopPropagation()">
                                                <span class="supplier-contact-trigger text-decoration-underline text-theme-1">
                                                    {{ supplier.title }} {{ supplier.lastName }} {{ supplier.firstName }}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge rounded-pill"
                                                [class.text-bg-success]="supplier.confidenceGrade === 'A'"
                                                [class.text-bg-primary]="supplier.confidenceGrade === 'B'"
                                                [class.text-bg-warning]="supplier.confidenceGrade === 'C'"
                                                [class.text-bg-danger]="supplier.confidenceGrade === 'D'">
                                                {{ supplier.confidenceGrade }}
                                            </span>
                                        </td>
                                        <td>{{ supplier.paymentTerms }}</td>
                                        <td class="text-end">
                                            <a class="btn btn-sm btn-outline-secondary me-2" [routerLink]="['/app/suppliers-orders-history']" [queryParams]="{ supplierId: supplier.id }">Historial</a>
                                            <button class="btn btn-sm btn-outline-theme me-2" type="button" (click)="editSupplier(supplier.id)">Editar</button>
                                            <button class="btn btn-sm btn-outline-danger" type="button" (click)="removeSupplier(supplier.id)">Eliminar</button>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="7" class="text-center text-secondary py-4">No hay resultados para el filtro aplicado.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            @if (activeTooltipSupplier) {
                <div class="supplier-contact-tooltip card shadow-sm border position-fixed" [style.left.px]="tooltipLeft" [style.top.px]="tooltipTop" (mouseenter)="keepTooltipOpen()" (mouseleave)="scheduleHideTooltip(activeTooltipSupplier.id, 260)" (click)="$event.stopPropagation()">
                    <div class="card-body p-2">
                        <p class="small text-secondary mb-1">Contacto proveedor</p>
                        <p class="mb-2"><i class="bi bi-telephone me-1"></i>{{ activeTooltipSupplier.mobilePhone }}</p>
                        <div class="d-flex gap-2">
                            <a class="btn btn-success btn-sm" [href]="getWhatsappUrl(activeTooltipSupplier)" target="_blank" rel="noopener">
                                <i class="bi bi-whatsapp me-1"></i>WhatsApp
                            </a>
                            <a class="btn btn-outline-theme btn-sm" [routerLink]="['/app/suppliers-orders-history']" [queryParams]="{ supplierId: activeTooltipSupplier.id, createOrder: 1 }">
                                Hacer pedido
                            </a>
                        </div>
                    </div>
                </div>
            }

            @if (showSupplierForm) {
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">{{ editingSupplierId === null ? 'Nuevo proveedor' : 'Editar proveedor' }}</h6>
                    <p class="text-secondary small mb-0">Campos minimos para operacion legal, contable, tecnica y de calidad</p>
                </div>
                <div class="card-body">
                    <form (ngSubmit)="saveSupplier()">
                        <h6 class="mb-3">Informacion general</h6>
                        <div class="row gx-3 gy-3 mb-3">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Nro proveedor (ID interno)</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.supplierNumber" name="supplierNumber" required />
                            </div>
                            <div class="col-12 col-md-5">
                                <label class="form-label">Razon social</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.legalName" name="legalName" required />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Clasificacion ABCD</label>
                                <select class="form-select" [(ngModel)]="draft.confidenceGrade" name="confidenceGrade">
                                    @for (grade of confidenceGrades; track grade) {
                                        <option [value]="grade">{{ grade }}</option>
                                    }
                                </select>
                            </div>

                            <div class="col-12 col-md-8">
                                <label class="form-label">Direccion principal</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.mainAddress" name="mainAddress" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Datos adicionales (piso/oficina)</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.addressExtra" name="addressExtra" />
                            </div>

                            <div class="col-12 col-md-3">
                                <label class="form-label">Codigo postal</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.postalCode" name="postalCode" />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Ciudad</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.city" name="city" />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Pais</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.country" name="country" />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Sector / Dominio</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.sector" name="sector" />
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label">Identificacion fiscal (NIT/RUT/RFC)</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.taxIdentification" name="taxIdentification" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Nro TVA Intra</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.intraVatNumber" name="intraVatNumber" />
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Idioma</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.language" name="language" />
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Divisa/Moneda</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.currency" name="currency" />
                            </div>

                            <div class="col-12 col-md-6">
                                <label class="form-label">Cuenta de proveedores</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.accountsPayableAccount" name="accountsPayableAccount" />
                            </div>
                            <div class="col-12 col-md-6">
                                <label class="form-label">Observaciones varias</label>
                                <textarea class="form-control" rows="2" [(ngModel)]="draft.notes" name="notes"></textarea>
                            </div>
                        </div>

                        <h6 class="mb-3">Contacto por defecto</h6>
                        <div class="row gx-3 gy-3 mb-3">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Contact par defaut</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.defaultContact" name="defaultContact" />
                            </div>
                            <div class="col-12 col-md-2">
                                <label class="form-label">Trato</label>
                                <select class="form-select" [(ngModel)]="draft.title" name="title">
                                    @for (title of contactTitles; track title) {
                                        <option [value]="title">{{ title }}</option>
                                    }
                                </select>
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Apellido</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.lastName" name="lastName" />
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label">Nombre</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.firstName" name="firstName" />
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label">Telefono movil/celular</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.mobilePhone" name="mobilePhone" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Cargo / Especialidad tecnica</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.contactRole" name="contactRole" />
                            </div>
                            <div class="col-12 col-md-4 d-flex align-items-end">
                                <div class="form-check form-switch mb-2 me-4">
                                    <input class="form-check-input" type="checkbox" role="switch" id="rseCompliant" [(ngModel)]="draft.rseCompliant" name="rseCompliant" />
                                    <label class="form-check-label" for="rseCompliant">RSE cumple normativa</label>
                                </div>
                                <div class="form-check form-switch mb-2">
                                    <input class="form-check-input" type="checkbox" role="switch" id="subscriptionActive" [(ngModel)]="draft.subscriptionActive" name="subscriptionActive" />
                                    <label class="form-check-label" for="subscriptionActive">Suscripcion activa</label>
                                </div>
                            </div>
                        </div>

                        <h6 class="mb-3">Informacion contable</h6>
                        <div class="row gx-3 gy-3 mb-3">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Numero contable</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.accountingNumber" name="accountingNumber" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Terminos de pago</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.paymentTerms" name="paymentTerms" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Portes / gastos de envio</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.shippingTerms" name="shippingTerms" />
                            </div>

                            <div class="col-12 col-md-4">
                                <label class="form-label">Pedido minimo requerido</label>
                                <input class="form-control" type="number" min="0" [(ngModel)]="draft.minimumOrder" name="minimumOrder" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Tasa de impuesto (IVA %)</label>
                                <input class="form-control" type="number" min="0" step="0.01" [(ngModel)]="draft.taxRate" name="taxRate" />
                            </div>
                        </div>

                        <h6 class="mb-3">Informacion de calidad</h6>
                        <div class="row gx-3 gy-3">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Responsable</label>
                                <input class="form-control" type="text" [(ngModel)]="draft.responsiblePerson" name="responsiblePerson" required />
                            </div>
                            <div class="col-12 col-md-8">
                                <label class="form-label">Notas de desempeno</label>
                                <textarea class="form-control" rows="3" [(ngModel)]="draft.performanceNotes" name="performanceNotes"></textarea>
                            </div>
                        </div>

                        <div class="text-end mt-4">
                            <button class="btn btn-outline-secondary me-2" type="button" (click)="startNew()">Limpiar</button>
                            <button class="btn btn-theme" type="submit">{{ editingSupplierId === null ? 'Guardar proveedor' : 'Actualizar proveedor' }}</button>
                        </div>
                    </form>
                </div>
            </div>
            }
        </div>
    `,
})
export class CompanySuppliersCrudComponent implements OnInit, OnDestroy {
    message = "";
    searchTerm = "";
    showSupplierForm = false;
    editingSupplierId: number | null = null;
    contactTooltipSupplierId: number | null = null;
    tooltipLeft = 16;
    tooltipTop = 16;
    private tooltipHideTimer: ReturnType<typeof setTimeout> | null = null;

    readonly confidenceGrades: SupplierGrade[] = ["A", "B", "C", "D"];
    readonly contactTitles: ContactTitle[] = ["Sr.", "Sra."];

    suppliers: SupplierRecord[] = [];

    constructor(private readonly suppliersCatalog: SuppliersCatalogService) { }

    ngOnInit(): void {
        this.suppliersCatalog.suppliers$.subscribe((items) => {
            this.suppliers = items;
        });
    }

    draft: SupplierDraft = this.createEmptyDraft();

    get filteredSuppliers(): SupplierRecord[] {
        const normalizedFilter = this.searchTerm.trim().toLowerCase();
        if (!normalizedFilter) {
            return this.suppliers;
        }

        return this.suppliers.filter((supplier) => {
            const searchableFields = [supplier.supplierNumber, supplier.legalName, supplier.city, supplier.country, supplier.confidenceGrade];
            return searchableFields.some((value) => value.toLowerCase().includes(normalizedFilter));
        });
    }

    get reliableSuppliers(): number {
        return this.suppliers.filter((supplier) => supplier.confidenceGrade === "A" || supplier.confidenceGrade === "B").length;
    }

    get activeSubscriptions(): number {
        return this.suppliers.filter((supplier) => supplier.subscriptionActive).length;
    }

    get activeTooltipSupplier(): SupplierRecord | null {
        if (this.contactTooltipSupplierId === null) {
            return null;
        }

        return this.suppliers.find((supplier) => supplier.id === this.contactTooltipSupplierId) ?? null;
    }

    showContactTooltip(supplierId: number, event?: MouseEvent): void {
        this.cancelHideTooltip();
        this.contactTooltipSupplierId = supplierId;

        if (event?.currentTarget instanceof HTMLElement) {
            this.updateTooltipPosition(event.currentTarget);
        }
    }

    keepTooltipOpen(): void {
        this.cancelHideTooltip();
    }

    scheduleHideTooltip(supplierId: number, delayMs = 420): void {
        this.cancelHideTooltip();
        this.tooltipHideTimer = setTimeout(() => {
            if (this.contactTooltipSupplierId === supplierId) {
                this.contactTooltipSupplierId = null;
            }
        }, delayMs);
    }

    @HostListener("document:click")
    closeTooltipOnOutsideClick(): void {
        this.cancelHideTooltip();
        this.contactTooltipSupplierId = null;
    }

    ngOnDestroy(): void {
        this.cancelHideTooltip();
    }

    private cancelHideTooltip(): void {
        if (this.tooltipHideTimer !== null) {
            clearTimeout(this.tooltipHideTimer);
            this.tooltipHideTimer = null;
        }
    }

    private updateTooltipPosition(anchor: HTMLElement): void {
        const rect = anchor.getBoundingClientRect();
        const estimatedWidth = 320;
        const estimatedHeight = 138;
        const margin = 8;

        let left = rect.left;
        if (left + estimatedWidth > window.innerWidth - margin) {
            left = window.innerWidth - estimatedWidth - margin;
        }
        if (left < margin) {
            left = margin;
        }

        let top = rect.bottom + 6;
        if (top + estimatedHeight > window.innerHeight - margin) {
            top = Math.max(margin, rect.top - estimatedHeight - 6);
        }

        this.tooltipLeft = left;
        this.tooltipTop = top;
    }

    getWhatsappUrl(supplier: SupplierRecord): string {
        const whatsappNumber = this.normalizeWhatsappNumber(supplier.mobilePhone);
        const text = encodeURIComponent(`Hola ${supplier.firstName}, quiero generar un nuevo pedido para ${supplier.legalName}.`);
        return `https://wa.me/${whatsappNumber}?text=${text}`;
    }

    openCreateSupplierForm(): void {
        this.startNew();
        this.showSupplierForm = true;
        this.message = "";
    }

    startNew(): void {
        this.editingSupplierId = null;
        this.draft = this.createEmptyDraft();
    }

    editSupplier(supplierId: number): void {
        const supplier = this.suppliers.find((item) => item.id === supplierId);
        if (!supplier) {
            return;
        }

        this.editingSupplierId = supplierId;
        this.showSupplierForm = true;
        this.draft = this.toDraft(supplier);
        this.message = "";
    }

    saveSupplier(): void {
        const normalizedDraft = this.normalizeDraft(this.draft);

        if (!normalizedDraft.supplierNumber || !normalizedDraft.legalName || !normalizedDraft.responsiblePerson) {
            this.message = "Completa Nro proveedor, razon social y responsable para continuar.";
            return;
        }

        if (this.editingSupplierId === null) {
            this.suppliersCatalog.createSupplier(normalizedDraft);
            this.message = "Proveedor creado correctamente.";
        } else {
            const updated = this.suppliersCatalog.updateSupplier(this.editingSupplierId, normalizedDraft);
            if (!updated) {
                this.message = "No se encontro el proveedor para actualizar.";
                return;
            }
            this.message = "Proveedor actualizado correctamente.";
        }

        this.startNew();
        this.showSupplierForm = false;
    }

    removeSupplier(supplierId: number): void {
        const removed = this.suppliersCatalog.removeSupplier(supplierId);
        if (!removed) {
            this.message = "No se encontro el proveedor a eliminar.";
            return;
        }

        if (this.editingSupplierId === supplierId) {
            this.startNew();
        }

        if (this.contactTooltipSupplierId === supplierId) {
            this.contactTooltipSupplierId = null;
        }
        this.message = "Proveedor eliminado del listado.";
    }

    private normalizeWhatsappNumber(phone: string): string {
        const normalized = phone.replace(/\D/g, "");
        return normalized || "573001112233";
    }

    private normalizeDraft(draft: SupplierDraft): SupplierDraft {
        return {
            ...draft,
            supplierNumber: draft.supplierNumber.trim(),
            legalName: draft.legalName.trim(),
            mainAddress: draft.mainAddress.trim(),
            addressExtra: draft.addressExtra.trim(),
            postalCode: draft.postalCode.trim(),
            city: draft.city.trim(),
            country: draft.country.trim(),
            taxIdentification: draft.taxIdentification.trim(),
            intraVatNumber: draft.intraVatNumber.trim(),
            language: draft.language.trim(),
            currency: draft.currency.trim(),
            defaultContact: draft.defaultContact.trim(),
            lastName: draft.lastName.trim(),
            firstName: draft.firstName.trim(),
            mobilePhone: draft.mobilePhone.trim(),
            contactRole: draft.contactRole.trim(),
            accountsPayableAccount: draft.accountsPayableAccount.trim(),
            sector: draft.sector.trim(),
            notes: draft.notes.trim(),
            accountingNumber: draft.accountingNumber.trim(),
            paymentTerms: draft.paymentTerms.trim(),
            shippingTerms: draft.shippingTerms.trim(),
            minimumOrder: Math.max(0, Number(draft.minimumOrder) || 0),
            taxRate: Math.max(0, Number(draft.taxRate) || 0),
            responsiblePerson: draft.responsiblePerson.trim(),
            performanceNotes: draft.performanceNotes.trim(),
        };
    }

    private toDraft(supplier: SupplierRecord): SupplierDraft {
        return {
            supplierNumber: supplier.supplierNumber,
            legalName: supplier.legalName,
            mainAddress: supplier.mainAddress,
            addressExtra: supplier.addressExtra,
            postalCode: supplier.postalCode,
            city: supplier.city,
            country: supplier.country,
            taxIdentification: supplier.taxIdentification,
            intraVatNumber: supplier.intraVatNumber,
            language: supplier.language,
            currency: supplier.currency,
            defaultContact: supplier.defaultContact,
            title: supplier.title,
            lastName: supplier.lastName,
            firstName: supplier.firstName,
            mobilePhone: supplier.mobilePhone,
            contactRole: supplier.contactRole,
            accountsPayableAccount: supplier.accountsPayableAccount,
            sector: supplier.sector,
            rseCompliant: supplier.rseCompliant,
            subscriptionActive: supplier.subscriptionActive,
            notes: supplier.notes,
            accountingNumber: supplier.accountingNumber,
            paymentTerms: supplier.paymentTerms,
            shippingTerms: supplier.shippingTerms,
            minimumOrder: supplier.minimumOrder,
            taxRate: supplier.taxRate,
            responsiblePerson: supplier.responsiblePerson,
            confidenceGrade: supplier.confidenceGrade,
            performanceNotes: supplier.performanceNotes,
        };
    }

    private createEmptyDraft(): SupplierDraft {
        return {
            supplierNumber: "",
            legalName: "",
            mainAddress: "",
            addressExtra: "",
            postalCode: "",
            city: "",
            country: "",
            taxIdentification: "",
            intraVatNumber: "",
            language: "Espanol",
            currency: "Pesos",
            defaultContact: "",
            title: "Sr.",
            lastName: "",
            firstName: "",
            mobilePhone: "",
            contactRole: "",
            accountsPayableAccount: "",
            sector: "",
            rseCompliant: false,
            subscriptionActive: false,
            notes: "",
            accountingNumber: "",
            paymentTerms: "Transferencia a 45 dias",
            shippingTerms: "",
            minimumOrder: 0,
            taxRate: 19,
            responsiblePerson: "",
            confidenceGrade: "A",
            performanceNotes: "",
        };
    }
}
