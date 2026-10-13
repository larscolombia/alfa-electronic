import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, from, map, Observable, tap } from "rxjs";
import { resolveApiBaseUrl } from "./api-base-url.util";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthUser {
    email: string;
    name: string;
    role: string;
}

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: AuthUser;
}

export interface AuthSession extends LoginResponse {
    expiresAt: number;
}

const AUTH_STORAGE_KEY = "pika.auth.session";
const DEFAULT_COMPANY_ID = "demo-company";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly router = inject(Router);
    private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.loadSessionFromStorage());
    private redirectingUnauthorized = false;

    readonly session$ = this.sessionSubject.asObservable();

    login(payload: LoginPayload): Observable<AuthSession> {
        return from(this.requestLogin(payload)).pipe(
            map((response) => ({
                ...response,
                expiresAt: Date.now() + Math.max(response.expiresIn, 1) * 1000,
            })),
            tap((session) => this.persistSession(session))
        );
    }

    logout(): void {
        this.clearSession();
    }

    isAuthenticated(): boolean {
        const session = this.sessionSubject.value;
        if (!session) {
            return false;
        }

        if (session.expiresAt <= Date.now()) {
            this.clearSession();
            return false;
        }

        return true;
    }

    getAccessToken(): string | null {
        if (!this.isAuthenticated()) {
            return null;
        }
        return this.sessionSubject.value?.accessToken ?? null;
    }

    getCurrentUser(): AuthUser | null {
        if (!this.isAuthenticated()) {
            return null;
        }

        return this.sessionSubject.value?.user ?? null;
    }

    getCurrentUserName(): string {
        return this.getCurrentUser()?.name?.trim() || "";
    }

    markUnauthorized(): void {
        if (this.redirectingUnauthorized) {
            return;
        }

        const redirectTo = this.resolveRedirectTarget();
        this.clearSession();
        this.redirectToSignin(redirectTo, "session_expired");
    }

    private async requestLogin(payload: LoginPayload): Promise<LoginResponse> {
        const loginUrl = `${this.apiBaseUrl}/api/v1/auth/login`;
        const response = await fetch(`${this.apiBaseUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Company-Id": DEFAULT_COMPANY_ID,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let message = `Request failed with status ${response.status}`;
            if (response.status === 404) {
                message = `Auth endpoint not found at ${loginUrl}`;
            }
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

        return (await response.json()) as LoginResponse;
    }

    private persistSession(session: AuthSession): void {
        this.sessionSubject.next(session);
        if (this.canUseStorage()) {
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        }
    }

    private clearSession(): void {
        this.sessionSubject.next(null);
        if (this.canUseStorage()) {
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
    }

    private resolveRedirectTarget(): string | null {
        if (typeof window === "undefined") {
            return null;
        }

        const target = `${window.location.pathname}${window.location.search}${window.location.hash}`.trim();
        if (!target.startsWith("/") || target.startsWith("/auth/signin")) {
            return null;
        }

        return target;
    }

    private redirectToSignin(redirectTo: string | null, reason: string): void {
        if (typeof window === "undefined") {
            return;
        }

        if (window.location.pathname.startsWith("/auth/signin")) {
            return;
        }

        const queryParams: Record<string, string> = { reason };
        if (redirectTo) {
            queryParams["redirectTo"] = redirectTo;
        }

        this.redirectingUnauthorized = true;
        void this.router.navigate(["/auth/signin"], { queryParams }).finally(() => {
            this.redirectingUnauthorized = false;
        });
    }

    private loadSessionFromStorage(): AuthSession | null {
        if (!this.canUseStorage()) {
            return null;
        }

        try {
            const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw) as Partial<AuthSession>;
            if (
                typeof parsed.accessToken !== "string" ||
                typeof parsed.tokenType !== "string" ||
                typeof parsed.expiresIn !== "number" ||
                typeof parsed.expiresAt !== "number" ||
                !parsed.user ||
                typeof parsed.user.email !== "string" ||
                typeof parsed.user.name !== "string" ||
                typeof parsed.user.role !== "string"
            ) {
                return null;
            }

            const session: AuthSession = {
                accessToken: parsed.accessToken,
                tokenType: parsed.tokenType,
                expiresIn: parsed.expiresIn,
                expiresAt: parsed.expiresAt,
                user: {
                    email: parsed.user.email,
                    name: parsed.user.name,
                    role: parsed.user.role,
                },
            };

            if (session.expiresAt <= Date.now()) {
                this.clearSession();
                return null;
            }

            return session;
        } catch {
            return null;
        }
    }

    private canUseStorage(): boolean {
        return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
    }

}