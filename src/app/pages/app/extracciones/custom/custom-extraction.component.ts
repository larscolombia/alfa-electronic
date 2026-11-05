import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";

import { ExtractionsApiService } from "../../../../services/extractions-api.service";
import { buildExportFileName, downloadCsv, downloadXlsx } from "../export-utils";
import { DataRow, ExtractionColumnDef } from "../extractions.model";
import {
    CustomColumnCatalog,
    CustomColumnKind,
    CustomColumnOption,
    CustomFilter,
    CustomFilterOp,
    CustomModuleCatalog,
    CustomQueryRequest,
    CustomTableCatalog,
    CustomTotalResult,
    SavedCustomQuery,
    fieldKey,
} from "./extractions-custom.model";
import { deleteSavedQuery, listSavedQueries, saveQuery } from "./saved-queries";

function toggleIn(set: Set<string>, key: string): Set<string> {
    const next = new Set(set);
    if (next.has(key)) {
        next.delete(key);
    } else {
        next.add(key);
    }
    return next;
}

const moneyFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

@Component({
    selector: "app-custom-extraction",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./custom-extraction.component.html",
    styles: [`
        .column-option { cursor: pointer; min-height: 42px; }
        .column-option:hover { background: var(--bs-tertiary-bg); }
        .column-option .form-check-input { flex-shrink: 0; }
    `],
})
export class CustomExtractionComponent implements OnInit {
    private readonly api = inject(ExtractionsApiService);
    private querySubscription?: Subscription;

    catalog: CustomModuleCatalog[] = [];
    loadingCatalog = false;
    catalogError = "";

    selectedModules = new Set<string>();
    selectedTables = new Set<string>();
    selectedColumns = new Set<string>();
    selectedTotals = new Set<string>();
    filters: CustomFilter[] = [];

    // Listas derivadas precomputadas: referencias estables entre detecciones
    // de cambios (evita recrear arrays en cada ciclo, que provocaba la
    // detección infinita NG0103 con las directivas de la app).
    // moduleTables: tablas de los módulos activados (selector de la sección 1).
    // availableTables: tablas efectivamente seleccionadas (columnas/filtros).
    moduleTables: CustomTableCatalog[] = [];
    availableTables: CustomTableCatalog[] = [];
    columnOptions: CustomColumnOption[] = [];
    numericOptions: CustomColumnOption[] = [];

    draftFilterKey = "";
    draftOp: CustomFilterOp = "contains";
    draftValue = "";
    draftFrom = "";
    draftTo = "";

    rows: Array<Record<string, unknown>> = [];
    resultColumns: CustomColumnCatalog[] = [];
    totals: CustomTotalResult[] = [];
    rowCount = 0;
    truncated = false;
    hasRun = false;
    loading = false;
    errorMessage = "";
    infoMessage = "";

    savedQueries: SavedCustomQuery[] = [];
    queryName = "";

    ngOnInit(): void {
        this.savedQueries = listSavedQueries();
        this.loadingCatalog = true;
        this.api.catalog().subscribe({
            next: (modules) => {
                this.catalog = modules;
                this.refreshDerived();
                this.loadingCatalog = false;
            },
            error: (error: unknown) => {
                this.loadingCatalog = false;
                this.catalogError = error instanceof Error ? error.message : "No se pudo cargar el catálogo.";
            },
        });
    }

    // refreshDerived recalcula las listas derivadas SOLO cuando cambia la
    // selección de módulos/tablas (o llega el catálogo), no en cada ciclo.
    private refreshDerived(): void {
        this.moduleTables = this.catalog
            .filter((module) => this.selectedModules.has(module.slug))
            .flatMap((module) => module.tables);

        this.availableTables = this.moduleTables.filter((table) => this.selectedTables.has(table.name));

        this.columnOptions = this.availableTables.flatMap((table) =>
            table.columns.map((column) => ({
                table: table.name,
                column: column.name,
                label: column.label,
                kind: column.kind,
                tableLabel: table.label,
                moduleLabel: table.module,
            })),
        );

        this.numericOptions = this.columnOptions.filter((column) => column.kind === "money" || column.kind === "number");

        // El borrador de filtro no puede quedar apuntando a una tabla que ya
        // no está seleccionada: es lo que producía el 422/400 del servidor.
        if (this.draftFilterKey && !this.columnOptions.some((option) => fieldKey(option) === this.draftFilterKey)) {
            this.draftFilterKey = "";
            this.draftValue = "";
            this.draftFrom = "";
            this.draftTo = "";
        }
    }

    get canAddFilter(): boolean {
        if (!this.draftFilterKey || !this.columnOptions.some((option) => fieldKey(option) === this.draftFilterKey)) {
            return false;
        }
        return this.draftOp === "between"
            ? Boolean(this.draftFrom || this.draftTo)
            : Boolean(this.draftValue.trim());
    }

    get canRun(): boolean {
        return this.selectedTables.size > 0 && this.selectedColumns.size > 0 && !this.loading;
    }

    get canExport(): boolean {
        return this.hasRun && !this.loading && this.rows.length > 0;
    }

    kindOf(key: string): CustomColumnKind | "" {
        return this.columnOptions.find((option) => fieldKey(option) === key)?.kind ?? "";
    }

    toggleModule(slug: string): void {
        this.selectedModules = toggleIn(this.selectedModules, slug);
        this.refreshDerived();
    }

    toggleColumn(key: string): void {
        this.selectedColumns = toggleIn(this.selectedColumns, key);
    }

    toggleTotal(key: string): void {
        this.selectedTotals = toggleIn(this.selectedTotals, key);
    }

    toggleTable(table: string): void {
        if (!this.selectedTables.has(table)) {
            this.selectedTables = toggleIn(this.selectedTables, table);
            this.refreshDerived();
            return;
        }
        // Al quitar una tabla se descartan sus columnas, filtros y totales.
        const next = new Set(this.selectedTables);
        next.delete(table);
        this.selectedTables = next;
        this.selectedColumns = new Set([...this.selectedColumns].filter((key) => !key.startsWith(table + ".")));
        this.selectedTotals = new Set([...this.selectedTotals].filter((key) => !key.startsWith(table + ".")));
        this.filters = this.filters.filter((filter) => filter.table !== table);
        this.refreshDerived();
    }

    trackByModule(_: number, module: CustomModuleCatalog): string {
        return module.slug;
    }

    trackByTable(_: number, table: CustomTableCatalog): string {
        return table.name;
    }

    trackByColumn(_: number, option: CustomColumnOption): string {
        return option.table + "." + option.column;
    }

    addFilter(): void {
        if (!this.canAddFilter) {
            return;
        }
        const [table, column] = this.draftFilterKey.split(".");
        this.filters.push({
            table,
            column,
            op: this.draftOp,
            value: this.draftValue.trim(),
            from: this.draftFrom,
            to: this.draftTo,
        });
        this.draftValue = "";
        this.draftFrom = "";
        this.draftTo = "";
    }

    removeFilter(index: number): void {
        this.filters.splice(index, 1);
    }

    filterLabel(filter: CustomFilter): string {
        const option = this.columnOptions.find((item) => item.table === filter.table && item.column === filter.column);
        const field = option ? `${option.tableLabel} · ${option.label}` : `${filter.table}.${filter.column}`;
        if (filter.op === "between") {
            return `${field}: ${filter.from || "…"} → ${filter.to || "…"}`;
        }
        return `${field} ${filter.op} "${filter.value}"`;
    }

    run(): void {
        if (!this.canRun) {
            return;
        }
        // Validación de cliente: nunca enviar filtros/columnas de tablas que no
        // están seleccionadas (era la causa del 422/400 del servidor).
        const droppedFilters = this.filters.filter((filter) => !this.selectedTables.has(filter.table));
        if (droppedFilters.length) {
            this.filters = this.filters.filter((filter) => this.selectedTables.has(filter.table));
            this.infoMessage = `Se descartaron ${droppedFilters.length} filtro(s) de tablas no seleccionadas.`;
        }

        this.loading = true;
        this.hasRun = false;
        this.errorMessage = "";

        this.querySubscription?.unsubscribe();
        this.querySubscription = this.api.query(this.buildRequest()).subscribe({
            next: (response) => {
                this.resultColumns = response.columns;
                this.rows = response.rows;
                this.totals = response.totals;
                this.rowCount = response.rowCount;
                this.truncated = response.truncated;
                this.hasRun = true;
                this.loading = false;
                this.infoMessage = `${response.rowCount} registros${response.truncated ? " (resultado truncado al límite)" : ""}.`;
            },
            error: (error: unknown) => {
                this.loading = false;
                this.errorMessage = error instanceof Error ? error.message : "No se pudo ejecutar la consulta.";
            },
        });
    }

    formatTotal(total: CustomTotalResult): string {
        return moneyFormatter.format(total.sum);
    }

    exportXlsx(): void {
        if (!this.canExport) {
            return;
        }
        const fileName = buildExportFileName(this.queryName, "extraccion-personalizada", "xlsx");
        downloadXlsx(this.toDataRows(), this.exportColumns(), fileName);
    }

    exportCsv(): void {
        if (!this.canExport) {
            return;
        }
        const fileName = buildExportFileName(this.queryName, "extraccion-personalizada", "csv");
        downloadCsv(this.toDataRows(), this.exportColumns(), fileName);
    }

    saveCurrentQuery(): void {
        const name = this.queryName.trim();
        if (!name) {
            return;
        }
        const query: SavedCustomQuery = {
            id: `q-${Date.now()}`,
            name,
            savedAt: new Date().toISOString(),
            tables: [...this.selectedTables],
            columns: [...this.selectedColumns],
            filters: this.filters.map((filter) => ({ ...filter })),
            totals: [...this.selectedTotals],
        };
        this.savedQueries = saveQuery(query);
        this.infoMessage = `Consulta "${name}" guardada en este navegador.`;
    }

    loadQuery(saved: SavedCustomQuery): void {
        this.selectedTables = new Set(saved.tables);
        this.selectedColumns = new Set(saved.columns.filter((key) => saved.tables.some((table) => key.startsWith(table + "."))));
        this.selectedTotals = new Set(saved.totals.filter((key) => saved.tables.some((table) => key.startsWith(table + "."))));
        this.filters = saved.filters
            .map((filter) => ({ ...filter }))
            .filter((filter) => saved.tables.includes(filter.table));
        this.queryName = saved.name;
        // Activa los módulos de las tablas guardadas para que se vean en la UI.
        const modules = new Set(this.selectedModules);
        saved.tables.forEach((table) => {
            const module = this.catalog.find((item) => item.tables.some((entry) => entry.name === table));
            if (module) {
                modules.add(module.slug);
            }
        });
        this.selectedModules = modules;
        this.refreshDerived();
        this.infoMessage = `Consulta "${saved.name}" cargada. Prepara la consulta para ver resultados.`;
    }

    removeSavedQuery(id: string): void {
        this.savedQueries = deleteSavedQuery(id);
    }

    private buildRequest(): CustomQueryRequest {
        return {
            tables: [...this.selectedTables],
            columns: [...this.selectedColumns].map((key) => this.toFieldRef(key)),
            filters: this.filters.map((filter) => ({ ...filter })),
            totals: [...this.selectedTotals].map((key) => this.toFieldRef(key)),
            limit: 5000,
        };
    }

    private toFieldRef(key: string): { table: string; column: string } {
        const [table, column] = key.split(".");
        return { table, column };
    }

    private exportColumns(): ExtractionColumnDef[] {
        return this.resultColumns.map((column) => ({
            key: column.name,
            label: this.exportLabel(column.name),
            type: column.kind === "money" ? "money" : column.kind === "number" ? "number" : column.kind === "date" ? "date" : "text",
        }));
    }

    exportLabel(key: string): string {
        const option = this.columnOptions.find((item) => fieldKey(item) === key);
        return option ? `${option.tableLabel} · ${option.label}` : key;
    }

    private toDataRows(): DataRow[] {
        return this.rows.map((row) => {
            const dataRow: DataRow = {};
            Object.entries(row).forEach(([key, value]) => {
                if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                    dataRow[key] = value;
                } else if (value !== null && value !== undefined) {
                    dataRow[key] = String(value);
                }
            });
            return dataRow;
        });
    }
}
