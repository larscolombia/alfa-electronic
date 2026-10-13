import { Injectable, inject } from "@angular/core";
import { from, map, Observable } from "rxjs";
import { resolveApiBaseUrl } from "./api-base-url.util";
import { AuthService } from "./auth.service";

const DEFAULT_COMPANY_ID = "demo-company";

export interface SignupPayload {
    firstName: string;
    lastName: string;
    email: string;
    countryCode: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export interface SignupRecord {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    countryCode: string;
    phone: string;
    signupType: string;
    createdAt: string;
    updatedAt: string;
}

export interface SignupSuccessPayload {
    signupType: "Individual" | "Business";
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ForgotPasswordResponse {
    message: string;
    resetToken: string;
    expiresAt: string;
}

export interface ChangePasswordPayload {
    resetToken: string;
    newPassword: string;
    confirmPassword: string;
}

export interface OnboardingPayload {
    signupId: string;
    displayName: string;
    businessDomain: "finance" | "network" | "social" | "inventory" | "learning";
    theme: "theme-blue" | "theme-indigo" | "theme-purple" | "theme-pink" | "theme-red" | "theme-orange" | "theme-yellow" | "theme-green" | "theme-teal" | "theme-cyan";
    country: string;
    photoDataUrl: string;
    summaryAcknowledged: boolean;
}

export interface OnboardingCompletePayload {
    signupId: string;
    country: string;
}

export interface OnboardingRecord {
    signupId: string;
    displayName: string;
    businessDomain: string;
    theme: string;
    country: string;
    photoDataUrl: string;
    summaryAcknowledged: boolean;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: "root",
})
export class AuthFlowsApiService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly authService = inject(AuthService);

    signup(payload: SignupPayload): Observable<SignupRecord> {
        return from(this.request<SignupRecord>("/api/v1/auth/signup", {
            method: "POST",
            body: JSON.stringify(payload),
        }));
    }

    setSignupSuccess(signupId: string, payload: SignupSuccessPayload): Observable<SignupRecord> {
        return from(this.request<SignupRecord>(`/api/v1/auth/signup/${encodeURIComponent(signupId)}/success`, {
            method: "POST",
            body: JSON.stringify(payload),
        }));
    }

    forgotPassword(payload: ForgotPasswordPayload): Observable<ForgotPasswordResponse> {
        return from(this.request<ForgotPasswordResponse>("/api/v1/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(payload),
        }));
    }

    changePassword(payload: ChangePasswordPayload): Observable<void> {
        return from(this.request<Record<string, never>>("/api/v1/auth/change-password", {
            method: "POST",
            body: JSON.stringify(payload),
        })).pipe(map(() => void 0));
    }

    upsertOnboarding(payload: OnboardingPayload): Observable<OnboardingRecord> {
        return from(this.request<OnboardingRecord>("/api/v1/auth/onboarding", {
            method: "POST",
            body: JSON.stringify(payload),
        }));
    }

    completeOnboarding(payload: OnboardingCompletePayload): Observable<OnboardingRecord> {
        return from(this.request<OnboardingRecord>("/api/v1/auth/onboarding/complete", {
            method: "POST",
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
