import { ChangeDetectorRef, Component, EventEmitter, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as XLSX from "xlsx";

import {
    BulkCreateClientsError,
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
                    <small class="text-secondary">Nombre, Empresa y Zona son obligatorios. La fila 1 debe contener los encabezados.</small>
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

                @if (validRows.length > 0) {
                    <div class="table-responsive border rounded mb-3">
                        <table class="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Empresa</th>
                                    <th>Correo</th>
                                    <th>Zona</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let row of previewRows">
                                    <td class="fw-semibold">{{ row.nombre }}</td>
                                    <td>{{ row.empresa }}</td>
                                    <td>{{ row.correo || "--" }}</td>
                                    <td>{{ row.zona }}</td>
                                    <td>{{ row.estado }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    @if (extraRowsCount > 0) {
                        <p class="small text-secondary mb-3">y {{ extraRowsCount }} más...</p>
                    }
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
                <button class="btn btn-theme me-2" type="button" [disabled]="validRows.length === 0 || isImporting" (click)="importClients()">
                    <span *ngIf="isImporting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    <i *ngIf="!isImporting" class="bi bi-upload me-1"></i>
                    {{ isImporting ? "Importando..." : "Importar " + validRows.length + " clientes" }}
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

    async onFileSelected(event: Event): Promise<void> {
        this.importSummary = "";
        this.serverErrors = [];

        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.fileName = file.name;
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });
            const parsed = parseClientImportRows(rawRows);

            this.validRows = parsed.valid;
            this.parseErrors = parsed.errors;
            if (parsed.valid.length === 0 && parsed.errors.length === 0) {
                this.parseErrors = [{ row: 0, message: "El archivo no contiene filas de datos para importar." }];
            }
        } catch {
            this.validRows = [];
            this.parseErrors = [{ row: 0, message: "No se pudo leer el archivo. Verifica que sea un Excel o CSV valido." }];
        }
        input.value = "";
        this.cdr.detectChanges();
    }

    async importClients(): Promise<void> {
        if (this.validRows.length === 0 || this.isImporting) {
            return;
        }

        this.isImporting = true;
        this.importSummary = "";
        this.serverErrors = [];

        try {
            const sentRows = this.validRows;
            const response = await this.crmClientsApi.bulkCreateClients(sentRows.map((row) => row.payload));
            const created = response.created ?? 0;
            this.serverErrors = (response.errors ?? []).map((error) => ({
                row: sentRows[error.row - 1]?.excelRow ?? error.row,
                message: error.message,
            }));
            this.importSummary = created === 1 ? "1 cliente importado." : `${created} clientes importados.`;
            if (created > 0) {
                this.validRows = [];
                this.parseErrors = [];
                this.fileName = "";
                this.imported.emit(created);
            }
        } catch (error) {
            this.serverErrors = [
                { row: 0, message: error instanceof Error && error.message.trim() ? error.message : "No se pudieron importar los clientes." },
            ];
        } finally {
            this.isImporting = false;
            this.cdr.detectChanges();
        }
    }

    close(): void {
        this.closed.emit();
    }
}
