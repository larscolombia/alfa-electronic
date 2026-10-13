import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";

export interface AclModuleField {
    id: string;
    moduleId: string;
    slug: string;
    label: string;
    sortOrder: number;
}

export interface AclModule {
    id: string;
    slug: string;
    name: string;
    description: string;
    sortOrder: number;
    fields: AclModuleField[];
}

export interface AclRole {
    id: string;
    companyId: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoleRequest {
    name: string;
    description: string;
}

export interface CreateRoleResponse {
    role: AclRole;
    seedSummary: {
        moduleAccess: number;
        actionPermissions: number;
        fieldPermissions: number;
    };
}

export interface RoleActionPermission {
    action: string;
    scope: string;
}

export interface RoleFieldPermission {
    fieldId: string;
    fieldSlug?: string;
    permission: string;
}

export interface RoleModulePermission {
    moduleId: string;
    moduleSlug?: string;
    isEnabled: boolean;
    actions: RoleActionPermission[];
    fields: RoleFieldPermission[];
}

export interface RolePermissionsResponse {
    roleId: string;
    modules: RoleModulePermission[];
}

export interface UpdateRolePermissionsRequest {
    modules: RoleModulePermission[];
}

export interface UserSoftDeletePayload {
    userEmail: string;
    action: "SOFT_DELETE";
    status: "INACTIVE";
    softDelete: true;
    requestedAt: string;
    source: "company-user-roles";
}

@Injectable({
    providedIn: "root",
})
export class AclApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);

    listModules(): Observable<AclModule[]> {
        return from(this.request<{ items: AclModule[] }>("/api/v1/acl/modules", { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    listRoles(): Observable<AclRole[]> {
        return from(this.request<{ items: AclRole[] }>("/api/v1/acl/roles", { method: "GET" }))
            .pipe(map((response) => response.items ?? []));
    }

    createRole(request: CreateRoleRequest): Observable<CreateRoleResponse> {
        return from(
            this.request<CreateRoleResponse>("/api/v1/acl/roles", {
                method: "POST",
                body: JSON.stringify(request),
            })
        );
    }

    getRolePermissions(roleId: string): Observable<RolePermissionsResponse> {
        return from(
            this.request<RolePermissionsResponse>(`/api/v1/acl/roles/${encodeURIComponent(roleId)}/permissions`, {
                method: "GET",
            })
        );
    }

    updateRolePermissions(roleId: string, request: UpdateRolePermissionsRequest): Observable<void> {
        return from(
            this.request<{ status: string }>(`/api/v1/acl/roles/${encodeURIComponent(roleId)}/permissions`, {
                method: "PUT",
                body: JSON.stringify(request),
            })
        ).pipe(map(() => void 0));
    }

    softDeleteUsers(payloads: UserSoftDeletePayload[]): Observable<number> {
        return from(
            this.request<{ processed: number }>("/api/v1/users/soft-delete", {
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
