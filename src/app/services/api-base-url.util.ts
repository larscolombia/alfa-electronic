const API_BASE_QUERY_PARAM = "apiBaseUrl";
const API_BASE_STORAGE_KEY = "pika.apiBaseUrl";

function normalizeApiBase(raw: string | null): string | null {
    if (!raw) {
        return null;
    }

    try {
        const parsed = new URL(raw);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            const cleanPath = parsed.pathname.replace(/\/+$/, "");
            const apiV1Marker = "/api/v1";
            const apiMarker = "/api";
            const apiV1Index = cleanPath.indexOf(apiV1Marker);
            if (apiV1Index >= 0) {
                return `${parsed.origin}${cleanPath.slice(0, apiV1Index + apiV1Marker.length)}`;
            }

            const apiIndex = cleanPath.indexOf(apiMarker);
            if (apiIndex >= 0) {
                return `${parsed.origin}${cleanPath.slice(0, apiIndex + apiMarker.length)}`;
            }

            if (!cleanPath || cleanPath === "/") {
                return parsed.origin;
            }
            return `${parsed.origin}${cleanPath}`;
        }
    } catch {
        return null;
    }

    return null;
}

export function resolveApiBaseUrl(): string {
    const defaultBase = typeof window !== "undefined" ? window.location.origin : "http://localhost:8080";
    if (typeof window === "undefined") {
        return defaultBase;
    }

    const queryValue = new URL(window.location.href).searchParams.get(API_BASE_QUERY_PARAM);
    const queryBase = normalizeApiBase(queryValue);
    if (queryBase) {
        window.localStorage.setItem(API_BASE_STORAGE_KEY, queryBase);
        return queryBase;
    }

    const storedBase = normalizeApiBase(window.localStorage.getItem(API_BASE_STORAGE_KEY));
    if (storedBase) {
        try {
            const currentOrigin = window.location.origin;
            const storedOrigin = new URL(storedBase).origin;
            const host = window.location.hostname;
            const isLocalHost = host === "localhost" || host === "127.0.0.1";

            if (!isLocalHost && storedOrigin !== currentOrigin) {
                window.localStorage.removeItem(API_BASE_STORAGE_KEY);
            } else {
                return storedBase;
            }
        } catch {
            window.localStorage.removeItem(API_BASE_STORAGE_KEY);
        }
    }

    const host = window.location.hostname;
    const port = window.location.port;
    if ((host === "localhost" || host === "127.0.0.1") && port !== "8080") {
        return `${window.location.protocol}//${host}:8080`;
    }

    return defaultBase;
}
