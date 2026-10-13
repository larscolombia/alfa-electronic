import { EmployeeDocumentItem } from "../../../../services/hr-documents-api.service";

export type DocumentCategory = "Hoja de vida" | "Contrato" | "Certificados" | "Examenes";

export const HR_DOCUMENT_CATEGORIES: DocumentCategory[] = ["Hoja de vida", "Contrato", "Certificados", "Examenes"];

export interface EmployeeDirectoryItem {
    id: string;
    name: string;
    role: string;
}

/** Fila del registro documental: metadata del API enriquecida con el nombre del empleado. */
export interface EmployeeDocumentRow extends EmployeeDocumentItem {
    employeeName: string;
}

export interface MatrixRow {
    employee: string;
    cv: string;
    contract: string;
    certificates: string;
    medical: string;
    status: "Completo" | "Pendiente";
}

export interface PendingDocumentItem {
    employee: string;
    document: string;
    status: "Pendiente";
}

export function hasDocumentInCategory(documents: EmployeeDocumentRow[], employeeId: string, category: string): boolean {
    return documents.some((document) => document.employeeId === employeeId && document.category === category);
}

export function buildDocumentsMatrix(employees: EmployeeDirectoryItem[], documents: EmployeeDocumentRow[]): MatrixRow[] {
    return employees.map((employee) => {
        const cv = hasDocumentInCategory(documents, employee.id, "Hoja de vida") ? "Si" : "No";
        const contract = hasDocumentInCategory(documents, employee.id, "Contrato") ? "Si" : "No";
        const certificates = hasDocumentInCategory(documents, employee.id, "Certificados") ? "Si" : "No";
        const medical = hasDocumentInCategory(documents, employee.id, "Examenes") ? "Si" : "No";
        const complete = cv === "Si" && contract === "Si" && certificates === "Si" && medical === "Si";

        return {
            employee: employee.name,
            cv,
            contract,
            certificates,
            medical,
            status: complete ? "Completo" : "Pendiente",
        };
    });
}

/** Pendientes: categorias estandar sin ningun soporte cargado por empleado. */
export function buildPendingDocuments(employees: EmployeeDirectoryItem[], documents: EmployeeDocumentRow[]): PendingDocumentItem[] {
    return employees.flatMap((employee) =>
        HR_DOCUMENT_CATEGORIES.filter((category) => !hasDocumentInCategory(documents, employee.id, category)).map((category) => ({
            employee: employee.name,
            document: `${category} - sin soporte cargado`,
            status: "Pendiente" as const,
        }))
    );
}

export function formatDocumentSize(sizeBytes: number): string {
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return "--";
    }
    if (sizeBytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
    }
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Convierte un data URL en una URL de objeto para previsualizar o descargar. */
export function dataUrlToObjectUrl(dataUrl: string, mimeType: string): string {
    const base64Index = dataUrl.indexOf(",");
    const base64 = base64Index >= 0 ? dataUrl.slice(base64Index + 1) : dataUrl;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mimeType || "application/octet-stream" }));
}
