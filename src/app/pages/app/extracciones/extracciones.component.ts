import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { CrmClientsApiService, CrmClientRecord } from "../../../services/crm-clients-api.service";

interface ExtractionColumn {
    key: string;
    label: string;
    selected: boolean;
}

@Component({
    selector: "app-extracciones",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3 extraction-page">
            <nav aria-label="breadcrumb" class="breadcrumb-theme rounded mb-3">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item">
                        <a routerLink="/app/main-menu">
                            <i class="bi bi-house-door me-1"></i> Menú principal
                        </a>
                    </li>
                    <li class="breadcrumb-item active" aria-current="page">Extracciones</li>
                </ol>
            </nav>

            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="extraction-icon"><i class="bi bi-database-gear"></i></span>
                        <h3 class="mb-0 fw-bold">Centro de extracciones</h3>
                    </div>
                    <p class="text-secondary mb-0">
                        Construye consultas, selecciona campos y prepara tus reportes.
                    </p>
                </div>
                <a routerLink="/app/main-menu" class="btn btn-outline-secondary">
                    <i class="bi bi-arrow-left me-1"></i> Volver al menú
                </a>
            </div>

            <div class="alert alert-info d-flex gap-2 align-items-start">
                <i class="bi bi-info-circle-fill mt-1"></i>
                <div>
                    <strong>Consultas conectadas al sistema</strong>
                    <div class="small">
                        Clientes está conectado al CRM. Las demás entidades se habilitarán
                        cuando integremos sus servicios correspondientes.
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3">
                <div class="card-body">
                    <h5 class="fw-semibold mb-3">
                        <i class="bi bi-grid me-2"></i>1. Seleccionar información
                    </h5>

                    <div class="row g-3">
                        <div class="col-12 col-md-6 col-xl-4">
                            <label for="extractionEntity" class="form-label">Módulo o entidad</label>
                            <select id="extractionEntity" class="form-select"
                                [(ngModel)]="entity" (ngModelChange)="onEntityChange()">
                                <option value="clientes">Clientes y contactos</option>
                                <option value="equipos">Equipos y servicios</option>
                                <option value="cotizaciones">Cotizaciones comerciales</option>
                                <option value="inventario">Inventario y stock</option>
                                <option value="facturacion">Facturación electrónica</option>
                                <option value="compras">Compras y proveedores</option>
                                <option value="cartera">Cartera y pagos</option>
                            </select>
                        </div>
                        <div class="col-12 col-md-6 col-xl-4">
                            <label for="extractionName" class="form-label">Nombre de la consulta</label>
                            <input id="extractionName" class="form-control"
                                [(ngModel)]="queryName"
                                placeholder="Ej. Clientes de Bogotá">
                        </div>
                        <div class="col-12 col-md-6 col-xl-4">
                            <label class="form-label">Registros</label>
                            <div class="form-control bg-body-secondary">
                                {{ loading ? "Consultando..." : clients.length + " registros cargados" }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-12 col-xl-5">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <h5 class="fw-semibold mb-3">
                                <i class="bi bi-funnel me-2"></i>2. Filtros
                            </h5>

                            <div class="mb-3">
                                <label for="filterField" class="form-label">Campo</label>
                                <select id="filterField" class="form-select" [(ngModel)]="filterField">
                                    <option value="ciudad">Ciudad</option>
                                    <option value="fecha">Fecha</option>
                                    <option value="estado">Estado</option>
                                    <option value="cliente">Cliente</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="filterOperator" class="form-label">Condición</label>
                                <select id="filterOperator" class="form-select" [(ngModel)]="filterOperator">
                                    <option value="equals">Es igual a</option>
                                    <option value="contains">Contiene</option>
                                    <option value="different">Es diferente de</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="filterValue" class="form-label">Valor</label>
                                <input id="filterValue" class="form-control"
                                    [(ngModel)]="filterValue"
                                    placeholder="Escribe el valor del filtro">
                            </div>

                            <button type="button" class="btn btn-outline-primary w-100"
                                (click)="addFilter()" [disabled]="!filterValue.trim()">
                                <i class="bi bi-plus-circle me-1"></i> Agregar filtro
                            </button>

                            <div class="mt-3" *ngIf="filters.length">
                                <div class="small fw-semibold mb-2">Filtros agregados</div>
                                <div class="d-flex flex-wrap gap-2">
                                    <span class="badge rounded-pill text-bg-light border p-2"
                                        *ngFor="let filter of filters; let i = index">
                                        {{ filter.field }} · {{ filter.operator }} · {{ filter.value }}
                                        <button type="button" class="btn-close ms-2"
                                            aria-label="Eliminar filtro" (click)="removeFilter(i)">
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-7">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center gap-2 mb-3">
                                <h5 class="fw-semibold mb-0">
                                    <i class="bi bi-layout-three-columns me-2"></i>3. Columnas
                                </h5>
                                <button type="button" class="btn btn-sm btn-outline-secondary"
                                    (click)="selectAllColumns()">
                                    Seleccionar todas
                                </button>
                            </div>

                            <p class="small text-secondary">
                                Elige los campos que deseas incluir en el reporte.
                            </p>

                            <div class="row g-2">
                                <div class="col-12 col-sm-6" *ngFor="let column of columns">
                                    <label class="column-option d-flex align-items-center gap-2 p-2 rounded border">
                                        <input class="form-check-input mt-0"
                                            type="checkbox" [(ngModel)]="column.selected">
                                        <span>{{ column.label }}</span>
                                    </label>
                                </div>
                            </div>

                            <div class="small text-secondary mt-3">
                                {{ selectedColumns.length }} columnas seleccionadas
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mt-3">
                <div class="card-body">
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                        <div>
                            <h5 class="fw-semibold mb-1">
                                <i class="bi bi-table me-2"></i>4. Vista previa
                            </h5>
                            <p class="small text-secondary mb-0">
                                Aquí aparecerán los resultados de la consulta.
                            </p>
                        </div>
                        <span class="badge" [ngClass]="loading ? 'text-bg-warning' : hasExecutedQuery ? 'text-bg-success' : 'text-bg-secondary'">
                            {{ loading ? "Consultando" : hasExecutedQuery ? "Datos del CRM" : "Esperando consulta" }}
                        </span>
                    </div>

                    <div class="table-responsive border rounded">
                        <table class="table table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th *ngFor="let column of selectedColumns">{{ column.label }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let client of clients">
                                    <td *ngFor="let column of selectedColumns">
                                        {{ getColumnValue(client, column.key) }}
                                    </td>
                                </tr>
                                <tr *ngIf="!loading && hasExecutedQuery && clients.length === 0">
                                    <td [attr.colspan]="selectedColumns.length || 1"
                                        class="text-center py-5 text-secondary">
                                        <i class="bi bi-search display-6 d-block mb-2"></i>
                                        <strong>No se encontraron clientes</strong>
                                        <div class="small mt-1">
                                            Prueba con otros criterios de búsqueda.
                                        </div>
                                    </td>
                                </tr>
                                <tr *ngIf="!loading && !hasExecutedQuery">
                                    <td [attr.colspan]="selectedColumns.length || 1"
                                        class="text-center py-5 text-secondary">
                                        <i class="bi bi-database display-6 d-block mb-2"></i>
                                        <strong>Sin resultados para mostrar</strong>
                                        <div class="small mt-1">
                                            Prepara una consulta para cargar datos del CRM.
                                        </div>
                                    </td>
                                </tr>
                                <tr *ngIf="loading">
                                    <td [attr.colspan]="selectedColumns.length || 1"
                                        class="text-center py-4 text-secondary">
                                        <span class="spinner-border spinner-border-sm me-2"></span>
                                        Consultando clientes...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="d-flex flex-wrap gap-2 mt-3">
                        <button type="button" class="btn btn-theme"
                            (click)="prepareQuery()" [disabled]="loading">
                            <i class="bi bi-play-fill me-1"></i> Preparar consulta
                        </button>
                        <button type="button" class="btn btn-outline-secondary" (click)="clearFilters()">
                            <i class="bi bi-eraser me-1"></i> Limpiar filtros
                        </button>
                        <button type="button" class="btn btn-outline-success" disabled>
                            <i class="bi bi-file-earmark-excel me-1"></i> Exportar Excel
                        </button>
                        <button type="button" class="btn btn-outline-primary" disabled>
                            <i class="bi bi-filetype-csv me-1"></i> Exportar CSV
                        </button>
                    </div>

                    <div class="alert alert-warning mt-3 mb-0" *ngIf="message">
                        <i class="bi bi-info-circle me-1"></i>{{ message }}
                    </div>
                    <div class="alert alert-danger mt-3 mb-0" *ngIf="errorMessage">
                        <i class="bi bi-exclamation-triangle me-1"></i>{{ errorMessage }}
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .extraction-page { min-width: 0; }
        .extraction-icon {
            width: 42px; height: 42px; display: inline-flex;
            align-items: center; justify-content: center;
            border-radius: 12px; color: #fff;
            background: linear-gradient(145deg,#087f8c,#36c9b8);
            font-size: 1.25rem;
        }
        .column-option { cursor: pointer; min-height: 42px; }
        .column-option:hover { background: var(--bs-tertiary-bg); }
        .column-option .form-check-input { flex-shrink: 0; }
    `],
})
export class ExtraccionesComponent {
    private readonly clientsApi = inject(CrmClientsApiService);

    clients: CrmClientRecord[] = [];
    loading = false;
    errorMessage = "";
    hasExecutedQuery = false;

    entity = "clientes";
    queryName = "";
    filterField = "ciudad";
    filterOperator = "equals";
    filterValue = "";
    message = "";

    filters: Array<{ field: string; operator: string; value: string }> = [];

    columns: ExtractionColumn[] = [
        { key: "nombre", label: "Nombre / Razón social", selected: true },
        { key: "nit", label: "NIT", selected: true },
        { key: "city", label: "Ciudad", selected: true },
        { key: "country", label: "País", selected: false },
        { key: "address", label: "Dirección", selected: false },
        { key: "correo", label: "Correo electrónico", selected: true },
        { key: "billingEmail", label: "Correo de facturación", selected: false },
        { key: "officePhone", label: "Teléfono", selected: false },
        { key: "estado", label: "Estado", selected: false },
        { key: "zona", label: "Zona", selected: false },
        { key: "dv", label: "DV", selected: false },
        { key: "postalCode", label: "Código postal", selected: false },
    ];

    get selectedColumns(): ExtractionColumn[] {
        return this.columns.filter(column => column.selected);
    }

    onEntityChange(): void {
        this.filters = [];
        this.clients = [];
        this.hasExecutedQuery = false;
        this.errorMessage = "";
        this.message = this.entity === "clientes"
            ? "Clientes está disponible para consulta."
            : "Esta entidad todavía no está conectada al backend.";
    }

    addFilter(): void {
        const value = this.filterValue.trim();
        if (!value) return;

        this.filters.push({
            field: this.filterField,
            operator: this.filterOperator,
            value,
        });
        this.filterValue = "";
        this.message = "Filtro agregado a la configuración. Aún no se ejecuta contra la base de datos.";
    }

    removeFilter(index: number): void {
        this.filters.splice(index, 1);
    }

    selectAllColumns(): void {
        this.columns.forEach(column => column.selected = true);
    }

    clearFilters(): void {
        this.filters = [];
        this.filterValue = "";
        this.clients = [];
        this.hasExecutedQuery = false;
        this.errorMessage = "";
        this.message = "Se limpiaron los filtros y resultados de esta consulta.";
    }

    getColumnValue(client: CrmClientRecord, key: string): string | number {
        const value = (client as unknown as Record<string, unknown>)[key];
        if (value === null || value === undefined || value === "") {
            return "—";
        }
        if (typeof value === "boolean") {
            return value ? "Sí" : "No";
        }
        return typeof value === "string" || typeof value === "number"
            ? value
            : "—";
    }

    prepareQuery(): void {
        if (!this.selectedColumns.length) {
            this.message = "Selecciona al menos una columna.";
            return;
        }

        if (this.entity !== "clientes") {
            this.message = "Esta entidad todavía no está conectada. No se ejecutó ninguna consulta.";
            return;
        }

        const searchFilters = this.filters.filter(filter => filter.field === "cliente");
        const statusFilters = this.filters.filter(filter => filter.field === "estado");
        const unsupportedFilters = this.filters.filter(
            filter => filter.field !== "cliente" && filter.field !== "estado"
        );

        if (unsupportedFilters.length) {
            this.message = "El backend actual no admite filtros por ciudad o fecha en el listado de clientes. Retíralos para ejecutar la consulta.";
            return;
        }

        if (statusFilters.some(filter =>
            filter.operator !== "equals" ||
            !["activo", "inactivo"].includes(filter.value.trim().toLowerCase())
        )) {
            this.message = "Para filtrar por estado utiliza 'Es igual a' y escribe Activo o Inactivo.";
            return;
        }

        const status = statusFilters.length
            ? (statusFilters[statusFilters.length - 1].value.trim().toLowerCase() === "activo"
                ? "Activo" as const
                : "Inactivo" as const)
            : undefined;

        const search = searchFilters.map(filter => filter.value.trim()).filter(Boolean).join(" ");

        this.loading = true;
        this.errorMessage = "";
        this.message = "";
        this.hasExecutedQuery = false;
        this.clients = [];

        this.clientsApi.listClients({
            search: search || undefined,
            status,
            limit: 500,
        }).subscribe({
            next: (items) => {
                this.clients = items;
                this.hasExecutedQuery = true;
                this.message = `${items.length} clientes recibidos del CRM.`;
            },
            error: (error: unknown) => {
                this.errorMessage = error instanceof Error
                    ? error.message
                    : "No fue posible consultar los clientes.";
            },
            complete: () => {
                this.loading = false;
            },
        });
    }
}
