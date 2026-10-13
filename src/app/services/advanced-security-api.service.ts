import { Injectable, inject } from "@angular/core";
import { from, Observable } from "rxjs";
import { resolveApiBaseUrl } from "./api-base-url.util";
import { AuthService } from "./auth.service";

const DEFAULT_COMPANY_ID = "demo-company";

export type SecuritySubjectType = "user" | "role";

export interface SecurityGlobalAccessRule {
    id: number;
    subjectType: SecuritySubjectType;
    subjectValue: string;
    role: string;
    reason: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SecurityRestrictedAccessRule {
    id: number;
    subjectType: SecuritySubjectType;
    subjectValue: string;
    role: string;
    office: string;
    allowedIPs: string[];
    allowedMACs: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SecurityRulesResponse {
    globalAccess: SecurityGlobalAccessRule[];
    restrictedAccess: SecurityRestrictedAccessRule[];
}

export interface SecurityGlobalAccessRuleInput {
    subjectType: SecuritySubjectType;
    subjectValue: string;
    role: string;
    reason: string;
    isActive: boolean;
}

export interface SecurityRestrictedAccessRuleInput {
    subjectType: SecuritySubjectType;
    subjectValue: string;
    role: string;
    office: string;
    allowedIPs: string[];
    allowedMACs: string[];
    isActive: boolean;
}

export interface ReplaceSecurityRulesRequest {
    globalAccess: SecurityGlobalAccessRuleInput[];
    restrictedAccess: SecurityRestrictedAccessRuleInput[];
}

@Injectable({
    providedIn: "root",
})
export class AdvancedSecurityApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly authService = inject(AuthService);

    getRules(): Observable<SecurityRulesResponse> {
        return from(this.request<SecurityRulesResponse>("/api/v1/security/restrictions", { method: "GET" }));
    }

    replaceRules(payload: ReplaceSecurityRulesRequest): Observable<SecurityRulesResponse> {
        return from(this.request<SecurityRulesResponse>("/api/v1/security/restrictions", {
            method: "PUT",
            body: JSON.stringify(payload),
        }));
    }

    private apiURL(path: string): string {
        return `${this.apiBaseUrl}${path}`;
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", DEFAULT_COMPANY_ID);

        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(this.apiURL(path), {
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
                // Keep fallback when backend sends non-JSON errors.
            }
            throw new Error(message);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return (await response.json()) as T;
    }
}
