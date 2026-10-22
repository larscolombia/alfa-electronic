import { ChangeDetectorRef, Component, EventEmitter, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as XLSX from "xlsx";

import { firstValueFrom } from "rxjs";

import {
    BulkCreateClientsError,
    CrmClientRecord,
    CrmClientsApiService,
    UpsertCrmClientRequest,
} from "../../../services/crm-clients-api.service";
import {
    CLIENT_IMPORT_TEMPLATE_HEADERS,
    ClientImportRowError,
    ParsedClientImportRow,
    buildClientTemplateRows,
    parseClientImportRows,
} from "./crm-clients-import.util";

@Component({
    selector: "app-crm-clients-import",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="card adminuiux-card mb-3 mb-lg-4">
            <div class="card-header border-bottom">
                <h5 class="mb-0">Importar clientes desde Excel</h5>
            </div>
            <div class="card-body">
                <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
                    <button class="btn btn-outline-theme" type="button" (click)="downloadTemplate()">
                        <i class="bi bi-download me-1"></i> Descargar plantilla Excel
                    </button>
                    <span class="small text-secondary">La plantilla incluye los encabezados esperados y dos filas de ejemplo.</span>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="clientImportFile">Archivo de clientes (.xlsx, .xls, .csv)</label>
                    <input
                        class="form-control"
                        id="clientImportFile"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        [disabled]="isImporting"
                        (change)="onFileSelected($event)" />
                    <small class="text-secondary">Selecciona qué columna del Excel corresponde a cada campo. Nombre, Empresa y Zona son obligatorios.</small>
                </div>

                

                @if (fileName && (validRows.length > 0 || parseErrors.length > 0)) {
                    <div class="alert alert-info border">
                        <strong>{{ fileName }}:</strong>
                        {{ validRows.length }} filas listas para importar{{ parseErrors.length > 0 ? ", " + parseErrors.length + " con errores" : "" }}.
                    </div>
                }

                @if (parseErrors.length > 0) {
                    <div class="alert alert-danger border" style="max-height: 200px; overflow-y: auto;">
                        <strong>Errores de validación</strong>
                        <ul class="mb-0 mt-2">
                            <li *ngFor="let error of parseErrors">Fila {{ error.row }}: {{ error.message }}</li>
                        </ul>
                    </div>
                }

                @if (rawDataRows.length > 0) {
                    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div>
                            <strong>Vista previa del Excel</strong>
                            <span class="text-secondary small ms-2">
                                {{ selectedValidRows.length }} de {{ validRows.length }} clientes seleccionados
                            </span>
                        </div>
                        <label class="form-check d-flex align-items-center gap-2 mb-0">
                            <input
                                class="form-check-input"
                                type="checkbox"
                                [checked]="allValidRowsSelected"
                                [indeterminate]="selectedValidRows.length > 0 && !allValidRowsSelected"
                                [disabled]="validRows.length === 0 || isImporting"
                                (change)="toggleAllRows($event)" />
                            <span class="form-check-label">Seleccionar todos los válidos</span>
                        </label>
                    </div>
                    <div class="table-responsive border rounded mb-3" style="max-height: 420px; overflow: auto;">
                        <table class="table table-sm table-hover align-middle mb-0" style="min-width: max-content;">
                            <thead class="table-light" style="position: sticky; top: 0; z-index: 1;">
                                <tr>
                                    <th class="text-center">Importar</th>
                                    <th>Fila Excel</th>
                                    <th *ngFor="let header of sourceHeaders">{{ header }}</th>
                                    <th>Validación</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let rawRow of rawDataRows; let i = index"
                                    [class.table-danger]="!isValidExcelRow(i + 2)">
                                    <td class="text-center">
                                        <input
                                            class="form-check-input"
                                            type="checkbox"
                                            [checked]="selectedExcelRows.has(i + 2)"
                                            [disabled]="!isValidExcelRow(i + 2) || isImporting"
                                            [attr.aria-label]="'Seleccionar fila ' + (i + 2)"
                                            (change)="toggleExcelRow(i + 2, $event)" />
                                    </td>
                                    <td>{{ i + 2 }}</td>
                                    <td *ngFor="let header of sourceHeaders; let colIndex = index">
                                        {{ rawRow[colIndex] === '' || rawRow[colIndex] == null ? '—' : rawRow[colIndex] }}
                                    </td>
                                    <td>
                                        <span *ngIf="isValidExcelRow(i + 2)" class="text-success">Lista para importar</span>
                                        <span *ngIf="!isValidExcelRow(i + 2)" class="text-danger">Revisar errores</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p class="small text-secondary">
                        Se muestran las columnas originales del archivo. Las filas con errores no se pueden seleccionar.
                    </p>
                }

                @if (importSummary) {
                    <div class="alert alert-success border">{{ importSummary }}</div>
                }
                @if (serverErrors.length > 0) {
                    <div class="alert alert-danger border" style="max-height: 200px; overflow-y: auto;">
                        <strong>Errores devueltos por el servidor</strong>
                        <ul class="mb-0 mt-2">
                            <li *ngFor="let error of serverErrors">Fila {{ error.row }}: {{ error.message }}</li>
                        </ul>
                    </div>
                }
            </div>
            <div class="card-footer">
                <button class="btn btn-theme me-2" type="button" [disabled]="selectedValidRows.length === 0 || isImporting" (click)="importClients()">
                    <span *ngIf="isImporting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    <i *ngIf="!isImporting" class="bi bi-upload me-1"></i>
                    {{ isImporting ? "Importando..." : "Importar " + selectedValidRows.length + " clientes seleccionados" }}
                </button>
                <button class="btn btn-link" type="button" [disabled]="isImporting" (click)="close()">Cerrar</button>
            </div>
        </div>
    `,
})
export class CrmClientsImportComponent {
    @Output() imported = new EventEmitter<number>();
    @Output() closed = new EventEmitter<void>();

    fileName = "";
    sourceHeaders: string[] = [];
    rawDataRows: unknown[][] = [];
    columnMappings: Record<string, string> = {};
    selectedExcelRows = new Set<number>();
    validRows: ParsedClientImportRow[] = [];
    parseErrors: ClientImportRowError[] = [];
    serverErrors: BulkCreateClientsError[] = [];
    importSummary = "";
    isImporting = false;

    readonly previewLimit = 10;
    private readonly crmClientsApi = inject(CrmClientsApiService);
    private readonly cdr = inject(ChangeDetectorRef);

    get previewRows(): UpsertCrmClientRequest[] {
        return this.validRows.slice(0, this.previewLimit).map((row) => row.payload);
    }

    get extraRowsCount(): number {
        return Math.max(0, this.validRows.length - this.previewLimit);
    }

    get selectedValidRows(): ParsedClientImportRow[] {
        return this.validRows.filter((row) => this.selectedExcelRows.has(row.excelRow));
    }

    get allValidRowsSelected(): boolean {
        return this.validRows.length > 0 &&
            this.validRows.every((row) => this.selectedExcelRows.has(row.excelRow));
    }

    isValidExcelRow(excelRow: number): boolean {
        return this.validRows.some((row) => row.excelRow === excelRow);
    }

    toggleExcelRow(excelRow: number, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        if (!this.isValidExcelRow(excelRow)) return;

        const next = new Set(this.selectedExcelRows);
        if (checked) next.add(excelRow);
        else next.delete(excelRow);
        this.selectedExcelRows = next;
    }

    toggleAllRows(event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.selectedExcelRows = checked
            ? new Set(this.validRows.map((row) => row.excelRow))
            : new Set<number>();
    }

    downloadTemplate(): void {
        const data = [
            [...CLIENT_IMPORT_TEMPLATE_HEADERS],
            ...buildClientTemplateRows().map((row) =>
                CLIENT_IMPORT_TEMPLATE_HEADERS.map((header) => row[header] ?? ""),
            ),
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
        XLSX.writeFile(workbook, "plantilla_clientes.xlsx");
    }

    readonly importFields = [...CLIENT_IMPORT_TEMPLATE_HEADERS];

    async onFileSelected(event: Event): Promise<void> {
        this.importSummary = "";
        this.serverErrors = [];
        this.validRows = [];
        this.parseErrors = [];
        this.sourceHeaders = [];
        this.rawDataRows = [];
        this.columnMappings = {};
        this.selectedExcelRows = new Set<number>();

        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.fileName = file.name;
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            if (!firstSheet) {
                throw new Error("El archivo no contiene una hoja para leer.");
            }

            const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
                header: 1,
                defval: "",
                raw: false,
            });

            if (rows.length < 2) {
                this.parseErrors = [{
                    row: 0,
                    message: "El archivo debe tener una fila de encabezados y al menos una fila de datos.",
                }];
                return;
            }

            const headerRow = rows[0].map((value, index) => {
                const header = String(value ?? "").trim();
                return header || `Columna ${index + 1}`;
            });

            this.sourceHeaders = headerRow;
            this.rawDataRows = rows.slice(1).filter((row) =>
                row.some((value) => String(value ?? "").trim() !== "")
            );

            const normalize = (value: string) =>
                value.normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

            for (const field of this.importFields) {
                const expected = normalize(field);
                const match = this.sourceHeaders.find((header) =>
                    normalize(header) === expected
                );
                if (match) this.columnMappings[field] = match;
            }

            this.parseMappedRows();
        } catch (error) {
            this.validRows = [];
            this.parseErrors = [{
                row: 0,
                message: error instanceof Error
                    ? error.message
                    : "No se pudo leer el archivo. Verifica que sea Excel o CSV válido.",
            }];
        } finally {
            input.value = "";
            this.cdr.detectChanges();
        }
    }

    onMappingChange(field: string, event: Event): void {
        const select = event.target as HTMLSelectElement;
        if (select.value) {
            this.columnMappings[field] = select.value;
        } else {
            delete this.columnMappings[field];
        }
        this.parseMappedRows();
    }

    parseMappedRows(): void {
        const mappedRows = this.rawDataRows.map((row) => {
            const mapped: Record<string, unknown> = {};
            for (const field of this.importFields) {
                const sourceHeader = this.columnMappings[field];
                const sourceIndex = sourceHeader
                    ? this.sourceHeaders.indexOf(sourceHeader)
                    : -1;
                mapped[field] = sourceIndex >= 0 ? (row[sourceIndex] ?? "") : "";
            }
            return mapped;
        });

        const parsed = parseClientImportRows(mappedRows);
        this.validRows = parsed.valid;
        this.selectedExcelRows = new Set(this.validRows.map((row) => row.excelRow));
        this.parseErrors = parsed.errors;

        if (this.rawDataRows.length === 0 && this.parseErrors.length === 0) {
            this.parseErrors = [{
                row: 0,
                message: "El archivo no contiene filas de datos para importar.",
            }];
        }
        this.cdr.detectChanges();
    }

    async importClients(): Promise<void> {
        if (this.selectedValidRows.length === 0 || this.isImporting) {
            return;
        }

        this.isImporting = true;
        this.importSummary = "";
        this.serverErrors = [];

        try {
            const selectedRows = [...this.selectedValidRows];

            // No importar si no se puede consultar la base de clientes existentes.
            let existingClients: CrmClientRecord[];
            try {
                existingClients = await firstValueFrom(
                    this.crmClientsApi.listClients({ limit: 10000 })
                );
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : "Error desconocido";

                this.serverErrors = [{
                    row: 0,
                    message: "No se pudo verificar si existen clientes duplicados: " + message,
                }];
                window.alert(
                    "No se pudo comprobar si los clientes ya están registrados. " +
                    "Por seguridad, no se realizó la importación. Verifica la conexión e inténtalo nuevamente."
                );
                return;
            }

            const normalizeNit = (value: unknown): string =>
                String(value ?? "")
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

            const normalizeEmail = (value: unknown): string =>
                String(value ?? "").trim().toLowerCase();

            const describeClient = (client: CrmClientRecord): string =>
                `${client.empresa || client.nombre || "Cliente sin nombre"}` +
                ` (NIT: ${client.nit || "—"}, correo: ${client.correo || "—"})`;

            const knownNits = new Map<string, string>();
            const knownEmails = new Map<string, string>();

            for (const client of existingClients) {
                const label = describeClient(client);
                const nit = normalizeNit(client.nit);
                const email = normalizeEmail(client.correo);

                if (nit && !knownNits.has(nit)) {
                    knownNits.set(nit, label);
                }
                if (email && !knownEmails.has(email)) {
                    knownEmails.set(email, label);
                }
            }

            const rowsToImport: typeof selectedRows = [];
            const duplicateMessages: string[] = [];

            for (const row of selectedRows) {
                const client = row.payload;
                const nit = normalizeNit(client.nit);
                const email = normalizeEmail(client.correo);
                const matches: string[] = [];

                if (nit && knownNits.has(nit)) {
                    matches.push(`NIT ${client.nit} coincide con ${knownNits.get(nit)}`);
                }

                if (email && knownEmails.has(email)) {
                    matches.push(`correo ${client.correo} coincide con ${knownEmails.get(email)}`);
                }

                if (matches.length > 0) {
                    duplicateMessages.push(
                        `Fila ${row.excelRow} — ${client.empresa || client.nombre || "Cliente sin nombre"}:\n` +
                        matches.map((match) => `  • ${match}`).join("\n")
                    );
                    continue;
                }

                rowsToImport.push(row);

                // También detecta duplicados entre las filas del mismo Excel.
                const label =
                    `${client.empresa || client.nombre || "Cliente sin nombre"} ` +
                    `(fila ${row.excelRow} del Excel)`;

                if (nit) knownNits.set(nit, label);
                if (email) knownEmails.set(email, label);
            }

            if (duplicateMessages.length > 0) {
                const maxShown = 15;
                const visibleMessages = duplicateMessages.slice(0, maxShown);
                const remaining = duplicateMessages.length - visibleMessages.length;

                window.alert(
                    "CLIENTES YA REGISTRADOS\n\n" +
                    `Se encontraron ${duplicateMessages.length} fila(s) duplicada(s). ` +
                    "No se enviarán para crear nuevamente:\n\n" +
                    visibleMessages.join("\n\n") +
                    (remaining > 0 ? `\n\nY ${remaining} duplicado(s) más.` : "") +
                    (rowsToImport.length > 0
                        ? `\n\nSe continuará únicamente con ${rowsToImport.length} cliente(s) nuevo(s).`
                        : "\n\nNo hay clientes nuevos para importar.")
                );
            }

            if (rowsToImport.length === 0) {
                this.importSummary =
                    `No se importaron clientes nuevos. Se omitieron ${duplicateMessages.length} duplicado(s).`;
                return;
            }

            const response = await this.crmClientsApi.bulkCreateClients(
                rowsToImport.map((row) => row.payload)
            );

            const created = response.created ?? 0;
            this.serverErrors = (response.errors ?? []).map((error) => ({
                row: rowsToImport[error.row - 1]?.excelRow ?? error.row,
                message: error.message,
            }));

            const createdText = created === 1
                ? "1 cliente importado"
                : `${created} clientes importados`;

            this.importSummary = duplicateMessages.length > 0
                ? `${createdText}. Se omitieron ${duplicateMessages.length} duplicado(s).`
                : `${createdText}.`;

            if (created > 0) {
                this.validRows = [];
                this.selectedExcelRows = new Set<number>();
                this.parseErrors = [];
                this.fileName = "";
                this.imported.emit(created);
            }
        } catch (error) {
            this.serverErrors = [{
                row: 0,
                message: error instanceof Error && error.message.trim()
                    ? error.message
                    : "No se pudieron importar los clientes.",
            }];
        } finally {
            this.isImporting = false;
            this.cdr.detectChanges();
        }
    }

    close(): void {
        this.closed.emit();
    }
}
