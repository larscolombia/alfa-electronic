import { Injectable, inject } from "@angular/core";
import { Observable, from, of } from "rxjs";
import { map, catchError, take } from "rxjs/operators";

import { AuthService } from "./auth.service";
import { resolveApiBaseUrl } from "./api-base-url.util";
import { ProjectService } from "../pages/app/projects/services/project.service";
import { SuppliersCatalogService } from "./suppliers-catalog.service";

export type GlobalSearchResultType = "cliente" | "prospecto" | "proyecto" | "proveedor";

export interface GlobalSearchResult {
    id: string;
    type: GlobalSearchResultType;
    typeLabel: string;
    title: string;
    subtitle: string;
    route: string;
    color: string;
    icon: string;
}

interface BackendSearchResult {
    id: string;
    type: GlobalSearchResultType;
    title: string;
    subtitle: string;
    route: string;
    typeLabel: string;
    score: number;
}

interface PushDocument {
    id: string;
    title: string;
    body: string;
    subtitle: string;
    route: string;
}

const TYPE_META: Record<GlobalSearchResultType, { color: string; icon: string }> = {
    cliente:   { color: "linear-gradient(145deg,#1b8a6b,#26de8e)", icon: "bi-person-check-fill" },
    prospecto: { color: "linear-gradient(145deg,#2e86de,#54a0ff)", icon: "bi-funnel-fill" },
    proyecto:  { color: "linear-gradient(145deg,#e07b39,#f9a825)", icon: "bi-kanban-fill" },
    proveedor: { color: "linear-gradient(145deg,#b5860d,#f0d060)", icon: "bi-truck-front-fill" },
};

/**
 * GlobalSearchService talks to the Go search engine (inverted index + shards + replicas + BM25)
 * exposed under /api/v1/search. Clients and prospects are indexed server-side from PostgreSQL;
 * suppliers and projects live only in the browser, so they are pushed to the backend index via
 * syncFrontendData() to make them searchable with real data.
 */
@Injectable({ providedIn: "root" })
export class GlobalSearchService {
    private readonly apiBaseUrl = resolveApiBaseUrl();
    private readonly companyID = "demo-company";
    private readonly authService = inject(AuthService);
    private readonly projectService = inject(ProjectService);
    private readonly suppliersService = inject(SuppliersCatalogService);

    private clientDataSynced = false;

    search(query: string): Observable<GlobalSearchResult[]> {
		return this.searchByTypes(query);
	}

	searchProspects(query: string): Observable<GlobalSearchResult[]> {
		return this.searchByTypes(query, ["prospecto"]);
	}

	searchClients(query: string): Observable<GlobalSearchResult[]> {
		return this.searchByTypes(query, ["cliente"]);
	}

	private searchByTypes(query: string, types: GlobalSearchResultType[] = []): Observable<GlobalSearchResult[]> {
        const q = query.trim();
        if (!q) {
            return of([]);
        }
		const typeFilter = types.length > 0 ? `&types=${encodeURIComponent(types.join(","))}` : "";
		const path = `/api/v1/search?q=${encodeURIComponent(q)}&limit=24${typeFilter}`;
        return from(this.request<{ results: BackendSearchResult[] }>(path, { method: "GET" })).pipe(
            map((response) => (response.results ?? []).map((item) => this.mapResult(item))),
            catchError(() => of([] as GlobalSearchResult[])),
        );
    }

    /**
     * Pushes the browser-only datasets (suppliers + projects) to the backend search engine so
     * they become searchable server-side. Runs once per session; safe to call repeatedly.
     */
    syncFrontendData(): void {
        if (this.clientDataSynced) {
            return;
        }
        this.clientDataSynced = true;

        this.suppliersService.suppliers$.pipe(take(1)).subscribe((suppliers) => {
            const documents: PushDocument[] = suppliers.map((s) => ({
                id: String(s.id),
                title: s.legalName,
                body: [s.legalName, s.city, s.sector, s.firstName, s.lastName, s.supplierNumber, s.taxIdentification]
                    .filter(Boolean)
                    .join(" "),
                subtitle: [s.city, s.sector].filter(Boolean).join(" \u00b7 "),
                route: "/app/suppliers-crud",
            }));
            void this.pushDocuments("proveedor", documents);
        });

        this.projectService.projects$.pipe(take(1)).subscribe((projects) => {
            const documents: PushDocument[] = projects.map((p) => ({
                id: p.id,
                title: p.title,
                body: [p.title, p.description ?? ""].filter(Boolean).join(" "),
                subtitle: p.description ?? "",
                route: `/app/work-projects/${p.id}`,
            }));
            void this.pushDocuments("proyecto", documents);
        });
    }

    private async pushDocuments(type: GlobalSearchResultType, documents: PushDocument[]): Promise<void> {
        if (documents.length === 0) {
            return;
        }
        try {
            await this.request(`/api/v1/search/index/${type}`, {
                method: "POST",
                body: JSON.stringify({ documents }),
            });
        } catch {
            // Indexing is best-effort; a failure must not break the launcher.
        }
    }

    private mapResult(item: BackendSearchResult): GlobalSearchResult {
        const meta = TYPE_META[item.type] ?? TYPE_META.cliente;
        return {
            id: item.id,
            type: item.type,
            typeLabel: item.typeLabel,
            title: item.title,
            subtitle: item.subtitle,
            route: item.route,
            color: meta.color,
            icon: meta.icon,
        };
    }

    private async request<T>(path: string, init: RequestInit): Promise<T> {
        const headers = new Headers(init.headers);
        headers.set("Content-Type", "application/json");
        headers.set("X-Company-Id", this.companyID);

        const accessToken = this.authService.getAccessToken();
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        const response = await fetch(`${this.apiBaseUrl}${path}`, { ...init, headers });

        if (response.status === 401) {
            this.authService.markUnauthorized();
        }
        if (!response.ok) {
            throw new Error(`Search request failed with status ${response.status}`);
        }
        if (response.status === 204) {
            return {} as T;
        }
        return (await response.json()) as T;
    }
}
