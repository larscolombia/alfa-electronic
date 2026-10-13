import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { forkJoin, of } from "rxjs";
import { HrApiService } from "../../../../services/hr-api.service";
import { HrDocumentsApiService } from "../../../../services/hr-documents-api.service";
import {
    DocumentCategory,
    EmployeeDirectoryItem,
    EmployeeDocumentRow,
    HR_DOCUMENT_CATEGORIES,
    buildDocumentsMatrix,
    buildPendingDocuments,
    dataUrlToObjectUrl,
    formatDocumentSize,
    MatrixRow,
    PendingDocumentItem,
} from "./company-hr-documents.util";

@Component({
    selector: "app-company-hr-documents",
    standalone: true,
    imports: [RouterLink, FormsModule],
    templateUrl: "./company-hr-documents.component.html",
})
export class CompanyHrDocumentsComponent implements OnInit {
    private readonly hrApi = inject(HrApiService);
    private readonly hrDocumentsApi = inject(HrDocumentsApiService);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly categoryOptions: DocumentCategory[] = HR_DOCUMENT_CATEGORIES;

    employees: EmployeeDirectoryItem[] = [];
    documents: EmployeeDocumentRow[] = [];

    loadingData = false;
    uploading = false;
    message = "";
    messageKind: "success" | "error" = "success";

    filterEmployeeId = "all";
    filterCategory: "all" | DocumentCategory = "all";

    draftEmployeeId = "";
    draftCategory: DocumentCategory = "Contrato";
    draftNotes = "";
    draftRequired = true;
    draftFile: File | null = null;

    ngOnInit(): void {
        this.loadDirectoryAndDocuments();
    }

    get filteredDocuments(): EmployeeDocumentRow[] {
        return this.documents
            .filter((document) => this.filterEmployeeId === "all" || document.employeeId === this.filterEmployeeId)
            .filter((document) => this.filterCategory === "all" || document.category === this.filterCategory)
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    }

    get documentsMatrix(): MatrixRow[] {
        return buildDocumentsMatrix(this.employees, this.documents);
    }

    get completeFiles(): number {
        return this.documentsMatrix.filter((row) => row.status === "Completo").length;
    }

    get pendingDocuments(): PendingDocumentItem[] {
        return buildPendingDocuments(this.employees, this.documents);
    }

    formatSize(sizeBytes: number): string {
        return formatDocumentSize(sizeBytes);
    }

    onDraftFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0] ?? null;
        this.draftFile = file;
        this.message = "";

        if (file && file.size > 8 * 1024 * 1024) {
            this.messageKind = "error";
            this.message = "El archivo supera el tamano maximo permitido (8MB).";
            this.draftFile = null;
            target.value = "";
        }
    }

    uploadDocument(): void {
        const employee = this.employees.find((item) => item.id === this.draftEmployeeId);
        if (!employee) {
            this.messageKind = "error";
            this.message = "Selecciona el empleado del soporte.";
            return;
        }
        if (!this.draftFile) {
            this.messageKind = "error";
            this.message = "Adjunta el archivo del soporte antes de cargar.";
            return;
        }

        const file = this.draftFile;
        this.uploading = true;
        this.message = "";

        this.hrDocumentsApi
            .readFileAsDataUrl(file)
            .then((dataUrl) =>
                this.hrDocumentsApi
                    .uploadDocument(employee.id, {
                        category: this.draftCategory,
                        fileName: file.name,
                        mimeType: file.type || "application/octet-stream",
                        data: dataUrl,
                        required: this.draftRequired,
                        notes: this.draftNotes.trim(),
                    })
                    .toPromise()
            )
            .then(() => {
                this.uploading = false;
                this.messageKind = "success";
                this.message = `Soporte ${file.name} cargado para ${employee.name}.`;
                this.draftFile = null;
                this.draftNotes = "";
                this.reloadDocuments();
            })
            .catch((error: Error) => {
                this.uploading = false;
                this.messageKind = "error";
                this.message = `No se pudo cargar el soporte: ${error.message}`;
                this.cdr.detectChanges();
            });
    }

    previewDocument(document: EmployeeDocumentRow): void {
        this.hrDocumentsApi.downloadDocument(document.employeeId, document.id).subscribe({
            next: (download) => {
                const objectUrl = dataUrlToObjectUrl(download.data, download.mimeType);
                window.open(objectUrl, "_blank");
            },
            error: (error: Error) => this.showError(`No se pudo previsualizar: ${error.message}`),
        });
    }

    downloadDocument(document: EmployeeDocumentRow): void {
        this.hrDocumentsApi.downloadDocument(document.employeeId, document.id).subscribe({
            next: (download) => {
                const objectUrl = dataUrlToObjectUrl(download.data, download.mimeType);
                const anchor = window.document.createElement("a");
                anchor.href = objectUrl;
                anchor.download = download.fileName || document.fileName;
                anchor.click();
                URL.revokeObjectURL(objectUrl);
            },
            error: (error: Error) => this.showError(`No se pudo descargar: ${error.message}`),
        });
    }

    removeDocument(document: EmployeeDocumentRow): void {
        const confirmed = confirm(`Se eliminara el soporte ${document.fileName} de ${document.employeeName}. Deseas continuar?`);
        if (!confirmed) {
            return;
        }

        this.hrDocumentsApi.deleteDocument(document.employeeId, document.id).subscribe({
            next: () => {
                this.documents = this.documents.filter((item) => item.id !== document.id);
                this.messageKind = "success";
                this.message = "Soporte eliminado del expediente.";
                this.cdr.detectChanges();
            },
            error: (error: Error) => this.showError(`No se pudo eliminar: ${error.message}`),
        });
    }

    resetFilters(): void {
        this.filterEmployeeId = "all";
        this.filterCategory = "all";
    }

    private loadDirectoryAndDocuments(): void {
        this.loadingData = true;
        this.hrApi.listEmployees().subscribe({
            next: (employees) => {
                this.employees = employees.map((employee) => ({
                    id: employee.id,
                    name: employee.name,
                    role: employee.role,
                }));
                this.draftEmployeeId = this.employees[0]?.id ?? "";
                this.reloadDocuments();
            },
            error: (error: Error) => {
                this.loadingData = false;
                this.showError(`No se pudo cargar el directorio de empleados: ${error.message}`);
            },
        });
    }

    private reloadDocuments(): void {
        if (!this.employees.length) {
            this.documents = [];
            this.loadingData = false;
            this.cdr.detectChanges();
            return;
        }

        const requests = this.employees.map((employee) =>
            this.hrDocumentsApi.listDocuments(employee.id)
        );

        forkJoin(requests.length ? requests : [of([])]).subscribe({
            next: (results) => {
                this.documents = results.flatMap((items, index) =>
                    items.map((item) => ({ ...item, employeeName: this.employees[index]?.name ?? item.employeeId }))
                );
                this.loadingData = false;
                this.cdr.detectChanges();
            },
            error: (error: Error) => {
                this.loadingData = false;
                this.showError(`No se pudieron cargar los documentos: ${error.message}`);
            },
        });
    }

    private showError(message: string): void {
        this.messageKind = "error";
        this.message = message;
        this.cdr.detectChanges();
    }
}
