import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Subscription } from "rxjs";

import { AppliedFilter, DataRow, ExtractionColumnDef, ExtractionEntityConfig, FilterOperator } from "./extractions.model";
import { applyFilters, operatorLabel as describeOperator } from "./filter-engine";
import { formatDate } from "./row-format.util";
import { buildExportFileName, downloadCsv, downloadXlsx } from "./export-utils";
import { createEntityRegistry } from "./entity-registry";
import { CustomExtractionComponent } from "./custom/custom-extraction.component";

import { AppBackNavigationService } from "../../../services/app-back-navigation.service";
import { CrmClientsApiService } from "../../../services/crm-clients-api.service";
import { CrmEquipmentApiService } from "../../../services/crm-equipment-api.service";
import { CrmQuotesApiService } from "../../../services/crm-quotes-api.service";
import { InventoryApiService } from "../../../services/inventory-api.service";
import { FinanceBillingApiService } from "../../../services/finance-billing-api.service";
import { SuppliersApiService } from "../../../services/suppliers-api.service";
import { FinancePaymentsApiService } from "../../../services/finance-payments-api.service";

interface SelectableColumn extends ExtractionColumnDef {
    selected: boolean;
}

const moneyFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

@Component({
    selector: "app-extracciones",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, CustomExtractionComponent],
    templateUrl: "./extracciones.component.html",
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
    // Botón "Volver al menú": misma pila de historial que el resto de la app.
    readonly backNav = inject(AppBackNavigationService);

    private readonly registry = createEntityRegistry({
        clientsApi: inject(CrmClientsApiService),
        equipmentApi: inject(CrmEquipmentApiService),
        quotesApi: inject(CrmQuotesApiService),
        inventoryApi: inject(InventoryApiService),
        billingApi: inject(FinanceBillingApiService),
        suppliersApi: inject(SuppliersApiService),
        paymentsApi: inject(FinancePaymentsApiService),
    });

    private querySubscription?: Subscription;
    private readonly selectionByEntity = new Map<string, string[]>();

    entities: ExtractionEntityConfig[] = [];
    activeConfig!: ExtractionEntityConfig;
    columns: SelectableColumn[] = [];
    entityId = "clientes";
    queryName = "";
    modality: "independent" | "custom" = "independent";

    filters: AppliedFilter[] = [];
    filterFieldKey = "";
    filterOperator: FilterOperator = "contains";
    filterValue = "";
    filterFrom = "";
    filterTo = "";

    rows: DataRow[] = [];
    rawCount = 0;
    loading = false;
    hasExecutedQuery = false;
    message = "";
    errorMessage = "";

    constructor() {
        this.entities = this.registry.list;
        const initial = this.registry.byId.get("clientes") ?? this.entities.find(Boolean);

        if (!initial) {
            throw new Error("El registro de extracciones no tiene ninguna entidad disponible.");
        }

        this.activeConfig = initial;
        this.filterFieldKey = initial.filterFields[0]?.key ?? "";
        this.columns = this.buildColumns(initial, null);
    }

    get selectedColumns(): SelectableColumn[] {
        return this.columns.filter(column => column.selected);
    }

    get canExport(): boolean {
        return this.hasExecutedQuery && !this.loading && this.rows.length > 0 && this.selectedColumns.length > 0;
    }

    /** El campo de filtro activo es de fecha: la UI muestra rango Desde/Hasta. */
    get isDateFilterField(): boolean {
        return this.activeConfig.filterFields.find(field => field.key === this.filterFieldKey)?.kind === "date";
    }

    get canAddFilter(): boolean {
        if (this.isDateFilterField) {
            return Boolean(this.filterFrom.trim() || this.filterTo.trim());
        }
        return Boolean(this.filterValue.trim());
    }

    switchEntity(): void {
        const next = this.registry.byId.get(this.entityId);
        if (!next || next === this.activeConfig) {
            return;
        }

        this.saveCurrentSelection();
        this.querySubscription?.unsubscribe();

        this.activeConfig = next;
        this.columns = this.buildColumns(next, null);
        this.filterFieldKey = next.filterFields[0]?.key ?? "";
        this.resetResults(`Ahora estás consultando ${next.label}. Prepara la consulta para cargar datos.`);
    }

    addFilter(): void {
        if (!this.filterFieldKey) {
            return;
        }

        if (this.isDateFilterField) {
            const from = this.filterFrom.trim();
            const to = this.filterTo.trim();
            if (!from && !to) {
                return;
            }
            this.filters.push({ fieldKey: this.filterFieldKey, operator: "between", value: "", from, to });
            this.filterFrom = "";
            this.filterTo = "";
            return;
        }

        const value = this.filterValue.trim();
        if (!value) {
            return;
        }

        this.filters.push({ fieldKey: this.filterFieldKey, operator: this.filterOperator, value });
        this.filterValue = "";
    }

    removeFilter(index: number): void {
        this.filters.splice(index, 1);
    }

    clearFilters(): void {
        this.filters = [];
        this.filterValue = "";
        this.filterFrom = "";
        this.filterTo = "";
        this.resetResults("Se limpiaron los filtros y los resultados de la consulta anterior.");
    }

    selectAllColumns(): void {
        this.columns.forEach(column => column.selected = true);
    }

    clearColumnSelection(): void {
        this.columns.forEach(column => column.selected = false);
    }

    runQuery(): void {
        if (!this.selectedColumns.length) {
            this.message = "Selecciona al menos una columna antes de preparar la consulta.";
            return;
        }

        const label = this.activeConfig.label;
        this.loading = true;
        this.errorMessage = "";
        this.message = "";
        this.hasExecutedQuery = false;
        this.rows = [];
        this.rawCount = 0;

        this.querySubscription?.unsubscribe();
        this.querySubscription = this.activeConfig.load().subscribe({
            next: (items) => {
                const safeRows = Array.isArray(items) ? items : [];
                this.rawCount = safeRows.length;
                this.rows = applyFilters(safeRows, this.filters);
                this.hasExecutedQuery = true;
                this.message = `${this.rows.length} de ${safeRows.length} registros cumplen la consulta.`;
            },
            error: (error: unknown) => {
                const detail = error instanceof Error && error.message ? ` (${error.message})` : "";
                this.errorMessage = `No se pudieron cargar los datos de ${label}${detail}. Revisa tu conexión e inténtalo de nuevo.`;
            },
            complete: () => {
                this.loading = false;
            },
        });
    }

    exportCsv(): void {
        if (!this.canExport) {
            return;
        }

        try {
            const fileName = buildExportFileName(this.queryName, this.activeConfig.id, "csv");
            downloadCsv(this.rows, this.selectedColumns, fileName);
            this.message = `Archivo ${fileName} generado con ${this.rows.length} registros.`;
        } catch (error: unknown) {
            this.errorMessage = error instanceof Error && error.message
                ? `No se pudo generar el CSV: ${error.message}`
                : "No se pudo generar el archivo CSV. Inténtalo de nuevo.";
        }
    }

    exportXlsx(): void {
        if (!this.canExport) {
            return;
        }

        try {
            const fileName = buildExportFileName(this.queryName, this.activeConfig.id, "xlsx");
            downloadXlsx(this.rows, this.selectedColumns, fileName);
            this.message = `Archivo ${fileName} generado con ${this.rows.length} registros.`;
        } catch (error: unknown) {
            this.errorMessage = error instanceof Error && error.message
                ? `No se pudo generar el Excel: ${error.message}`
                : "No se pudo generar el archivo Excel. Inténtalo de nuevo.";
        }
    }

    displayValue(row: DataRow, column: ExtractionColumnDef): string {
        const value = row[column.key];

        if (value === null || value === undefined || String(value).trim() === "") {
            return "—";
        }

        if (typeof value === "boolean") {
            return value ? "Sí" : "No";
        }

        if (column.type === "date") {
            return formatDate(String(value)) || "—";
        }

        if ((column.type === "money" || column.type === "number") && typeof value === "number") {
            return moneyFormatter.format(value);
        }

        return String(value);
    }

    /** Texto del badge: rango legible para "between", valor crudo en otro caso. */
    filterSummary(filter: AppliedFilter): string {
        if (filter.operator !== "between") {
            return filter.value;
        }

        const parts = [
            filter.from?.trim() ? `desde ${formatDate(filter.from)}` : "",
            filter.to?.trim() ? `hasta ${formatDate(filter.to)}` : "",
        ].filter(Boolean);
        return parts.join(" ") || "—";
    }

    fieldLabel(key: string): string {
        return this.activeConfig.filterFields.find(field => field.key === key)?.label ?? key;
    }

    operatorLabel(operator: FilterOperator): string {
        return describeOperator(operator);
    }

    private buildColumns(config: ExtractionEntityConfig, savedKeys: string[] | null): SelectableColumn[] {
        const preferred = savedKeys ?? config.defaultSelectedKeys;

        return config.columns.map(column => ({ ...column, selected: preferred.includes(column.key) }));
    }

    private saveCurrentSelection(): void {
        this.selectionByEntity.set(
            this.activeConfig.id,
            this.selectedColumns.map(column => column.key),
        );
    }

    private resetResults(message: string): void {
        this.querySubscription?.unsubscribe();
        this.rows = [];
        this.rawCount = 0;
        this.loading = false;
        this.hasExecutedQuery = false;
        this.errorMessage = "";
        this.message = message;
    }
}
