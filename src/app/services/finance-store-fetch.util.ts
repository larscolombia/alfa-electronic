import { resolveApiBaseUrl } from "./api-base-url.util";

/**
 * Fetch autenticado para los stores estáticos de finanzas (no inyectables).
 * Sigue el patrón de worktime-calendar.util.ts (Fase 4): el token se lee de la
 * sesión persistida por AuthService; nunca se acepta identidad del cuerpo.
 */
const AUTH_STORAGE_KEY = "pika.auth.session";
const COMPANY_ID = "demo-company";

export function isBrowserEnv(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readStoredAccessToken(): string | null {
    if (!isBrowserEnv()) {
        return null;
    }
    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw) as { accessToken?: string; expiresAt?: number };
        if (typeof parsed?.accessToken !== "string" || !parsed.accessToken) {
            return null;
        }
        if (typeof parsed.expiresAt === "number" && parsed.expiresAt <= Date.now()) {
            return null;
        }
        return parsed.accessToken;
    } catch {
        return null;
    }
}

export async function financeStoreFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    headers.set("X-Company-Id", COMPANY_ID);

    const accessToken = readStoredAccessToken();
    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(`${resolveApiBaseUrl()}${path}`, { ...init, headers });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;
        try {
            const errorBody = (await response.json()) as { error?: string };
            if (errorBody?.error) {
                message = errorBody.error;
            }
        } catch {
            // Keep fallback message
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return {} as T;
    }
    return (await response.json()) as T;
}
