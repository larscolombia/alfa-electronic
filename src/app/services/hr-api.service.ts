import { Injectable, inject } from "@angular/core";
import { forkJoin, from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export interface CatalogItem {
    id: string;
    name: string;
}

export interface HrCatalogsResponse {
    positions: CatalogItem[];
    departments: CatalogItem[];
}

/** Campos extendidos de la ficha del empleado (JSON plano camelCase del backend). */
export interface EmployeeProfileFields {
    firstName: string;
    lastName: string;
    accessUser: string;
    treatment: string;
    greeting: string;
    userName: string;
    initials: string;
    emailPassword: string;
    roleType: string;
    assignedScheduleId: string;
    hourlyRate: number;
    emergencyContact: string;
    emergencyRelationship: string;
    allergies: string;
    bloodType: string;
    eps: string;
    compensationFund: string;
    /** Fechas ISO "YYYY-MM-DD" o "" cuando no hay valor (NULL en DB). */
    hireDate: string;
    terminationDate: string;
    birthday: string;
    terminationReason: string;
    residentialAddress: string;
    gender: string;
    registrationTermsAccepted: boolean;
    registrationPrivacyAccepted: boolean;
    /** Foto del empleado como data URL de imagen (data:image/...;base64,...) o "". */
    photoData: string;
}

export interface EmployeeRow extends EmployeeProfileFields {
    id: string;
    name: string;
    role: string;
    department: string;
    manager: string;
    status: string;
    documentNumber: string;
    email: string;
    fileComplete: boolean;
}

export interface CreateEmployeeRequest extends EmployeeProfileFields {
    name: string;
    role: string;
    department: string;
    manager: string;
    status: string;
    documentNumber: string;
    email: string;
    fileComplete: boolean;
}

export type UpdateEmployeeRequest = CreateEmployeeRequest;

export interface ResetEmployeePasswordResponse {
    message: string;
    resetToken: string;
    expiresAt: string;
}

export type EmployeeSoftDeletePayload = {
    employeeId: string;
    action: "SOFT_DELETE";
    status: "INACTIVO";
    softDelete: true;
    requestedAt: string;
    source: "company-hr-employees";
};

export interface SyncCatalogsRequest {
    positions: string[];
    departments: string[];
}

@Injectable({
    providedIn: "root",
})
export class HrApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listEmployees(): Observable<EmployeeRow[]> {
        return from(this.request<{ items: EmployeeRow[] }>("/api/v1/hr/employees", { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    createEmployee(request: CreateEmployeeRequest): Observable<EmployeeRow> {
        return from(
            this.request<EmployeeRow>("/api/v1/hr/employees", {
                method: "POST",
                body: JSON.stringify(request),
            })
        );
    }

    getEmployee(employeeId: string): Observable<EmployeeRow> {
        return from(
            this.request<EmployeeRow>(`/api/v1/hr/employees/${encodeURIComponent(employeeId)}`, { method: "GET" })
        );
    }

    updateEmployee(employeeId: string, request: UpdateEmployeeRequest): Observable<EmployeeRow> {
        return from(
            this.request<EmployeeRow>(`/api/v1/hr/employees/${encodeURIComponent(employeeId)}`, {
                method: "PUT",
                body: JSON.stringify(request),
            })
        );
    }

    resetEmployeePassword(employeeId: string): Observable<ResetEmployeePasswordResponse> {
        return from(
            this.request<ResetEmployeePasswordResponse>(`/api/v1/hr/employees/${encodeURIComponent(employeeId)}/reset-password`, {
                method: "POST",
                body: JSON.stringify({}),
            })
        );
    }

    listPositions(): Observable<CatalogItem[]> {
        return from(this.request<{ items: CatalogItem[] }>("/api/v1/hr/positions", { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    listDepartments(): Observable<CatalogItem[]> {
        return from(this.request<{ items: CatalogItem[] }>("/api/v1/hr/departments", { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    catalogs(): Observable<HrCatalogsResponse> {
        return forkJoin({
            positions: this.listPositions(),
            departments: this.listDepartments(),
        });
    }

    syncCatalogs(request: SyncCatalogsRequest): Observable<HrCatalogsResponse> {
        return from(
            this.request<HrCatalogsResponse>("/api/v1/hr/catalogs/sync", {
                method: "POST",
                body: JSON.stringify(request),
            })
        );
    }

    restoreCatalogDefaults(): Observable<HrCatalogsResponse> {
        return from(
            this.request<HrCatalogsResponse>("/api/v1/hr/catalogs/restore-defaults", {
                method: "POST",
                body: JSON.stringify({}),
            })
        );
    }

    softDeleteEmployees(payloads: EmployeeSoftDeletePayload[]): Observable<number> {
        return from(
            this.request<{ processed: number }>("/api/v1/hr/employees/soft-delete", {
                method: "PATCH",
                body: JSON.stringify(payloads),
            })
        )
            .pipe(map((response) => response.processed ?? 0));
    }

    private apiUrl(path: string): string {
        return `${this.apiBaseUrl}${path}`;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", this.companyID);
        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(this.apiUrl(path), {
            ...init,
            headers,
        });

        if (response.status === 401) {
            this.authService.markUnauthorized();
        }

        if (!response.ok) {
            let message = `Request failed with status ${response.status}`;
            try {
                const errorBody = (await response.json()) as { error?: string };
                if (errorBody?.error) {
                    message = errorBody.error;
                }
            } catch {
                // Keep fallback message when backend returns non-JSON error.
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
