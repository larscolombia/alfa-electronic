import { ChangeDetectorRef, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { AclApiService } from "../../../services/acl-api.service";
import { HrApiService } from "../../../services/hr-api.service";

type PlaygroundStatus = "idle" | "running" | "pass" | "fail";

interface PlaygroundCheck {
    key: string;
    title: string;
    description: string;
    status: PlaygroundStatus;
    details: string;
    durationMs: number;
}

@Component({
    selector: "app-company-acl-hr-playground",
    standalone: true,
    imports: [RouterLink],
    template: `
        <div class="container-fluid py-3" id="main-content">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Playground ACL + RRHH</h5>
                    <p class="text-secondary small mb-0">Prueba integral frontend-backend para validar conectividad y operaciones criticas</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-theme me-2" routerLink="/app/company-user-roles">Ir a ACL</a>
                    <a class="btn btn-outline-theme" routerLink="/app/company-hr-employees">Ir a RRHH</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-management">Empresa</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Playground ACL + RRHH</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3 mb-4">
            <div class="card adminuiux-card mb-3">
                <div class="card-body d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
                    <div>
                        <h6 class="mb-1">Ejecucion automatizada desde frontend</h6>
                        <p class="text-secondary small mb-0">Cada prueba llama endpoints reales del backend y muestra resultado pass/fail.</p>
                    </div>
                    <button
                        class="btn btn-theme"
                        type="button"
                        data-testid="run-playground-tests"
                        [disabled]="running"
                        (click)="runAllChecks()"
                    >
                        {{ running ? 'Ejecutando pruebas...' : 'Ejecutar pruebas del playground' }}
                    </button>
                </div>
            </div>

            <div class="row gx-3 mb-3">
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Total pruebas</p>
                            <h4 class="mb-0" data-testid="playground-total">{{ checks.length }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Pruebas aprobadas</p>
                            <h4 class="mb-0 text-success" data-testid="playground-pass-count">{{ passCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Pruebas fallidas</p>
                            <h4 class="mb-0 text-danger" data-testid="playground-fail-count">{{ failCount }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            @if (summaryMessage) {
                <div
                    class="alert border mb-3"
                    [class.alert-success]="failCount === 0"
                    [class.alert-warning]="failCount > 0"
                    data-testid="playground-summary"
                >
                    {{ summaryMessage }}
                </div>
            }

            @if (running) {
                <div class="alert alert-info border mb-3" data-testid="playground-running">Pruebas en curso contra backend local...</div>
            }

            <div class="card adminuiux-card">
                <div class="card-header">
                    <h6 class="mb-0">Resultados detallados</h6>
                    <p class="text-secondary small mb-0">Incluye tiempo de respuesta y detalle devuelto por cada check</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Prueba</th>
                                    <th>Estado</th>
                                    <th>Tiempo</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (check of checks; track check.key) {
                                    <tr [attr.data-testid]="'play-test-' + check.key" [attr.data-status]="check.status">
                                        <td>
                                            <div class="fw-semibold">{{ check.title }}</div>
                                            <div class="small text-secondary">{{ check.description }}</div>
                                        </td>
                                        <td>
                                            <span class="badge rounded-pill" [class.text-bg-secondary]="check.status === 'idle'"
                                                [class.text-bg-info]="check.status === 'running'" [class.text-bg-success]="check.status === 'pass'"
                                                [class.text-bg-danger]="check.status === 'fail'" [attr.data-testid]="'status-' + check.key">
                                                {{ statusLabel(check.status) }}
                                            </span>
                                        </td>
                                        <td>{{ check.durationMs > 0 ? (check.durationMs + ' ms') : '-' }}</td>
                                        <td [attr.data-testid]="'details-' + check.key">{{ check.details || '-' }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CompanyAclHrPlaygroundComponent {
    running = false;
    summaryMessage = "";

    checks: PlaygroundCheck[] = [
        {
            key: "acl-modules",
            title: "ACL - Carga de modulos",
            description: "GET /api/v1/acl/modules",
            status: "idle",
            details: "",
            durationMs: 0,
        },
        {
            key: "acl-roles",
            title: "ACL - Carga de roles",
            description: "GET /api/v1/acl/roles",
            status: "idle",
            details: "",
            durationMs: 0,
        },
        {
            key: "acl-create-role",
            title: "ACL - Creacion de rol",
            description: "POST /api/v1/acl/roles",
            status: "idle",
            details: "",
            durationMs: 0,
        },
        {
            key: "hr-employees",
            title: "RRHH - Carga de empleados",
            description: "GET /api/v1/hr/employees",
            status: "idle",
            details: "",
            durationMs: 0,
        },
        {
            key: "hr-catalogs",
            title: "RRHH - Carga de catalogos",
            description: "GET /api/v1/hr/positions + /api/v1/hr/departments",
            status: "idle",
            details: "",
            durationMs: 0,
        },
        {
            key: "hr-sync",
            title: "RRHH - Sync de catalogos",
            description: "POST /api/v1/hr/catalogs/sync",
            status: "idle",
            details: "",
            durationMs: 0,
        },
    ];

    constructor(
        private readonly aclApi: AclApiService,
        private readonly hrApi: HrApiService,
        private readonly cdr: ChangeDetectorRef
    ) {}

    get passCount(): number {
        return this.checks.filter((check) => check.status === "pass").length;
    }

    get failCount(): number {
        return this.checks.filter((check) => check.status === "fail").length;
    }

    statusLabel(status: PlaygroundStatus): string {
        switch (status) {
            case "running":
                return "RUNNING";
            case "pass":
                return "PASS";
            case "fail":
                return "FAIL";
            default:
                return "PENDING";
        }
    }

    async runAllChecks(): Promise<void> {
        if (this.running) {
            return;
        }

        this.running = true;
        this.summaryMessage = "";
        this.resetChecks();
        this.cdr.detectChanges();

        await this.runCheck("acl-modules", async () => {
            const modules = await firstValueFrom(this.aclApi.listModules());
            if (!modules.length) {
                throw new Error("Backend no devolvio modulos ACL.");
            }
            return `${modules.length} modulos ACL cargados.`;
        });

        await this.runCheck("acl-roles", async () => {
            const roles = await firstValueFrom(this.aclApi.listRoles());
            if (!roles.length) {
                throw new Error("Backend no devolvio roles ACL.");
            }
            return `${roles.length} roles ACL cargados.`;
        });

        await this.runCheck("acl-create-role", async () => {
            const roleName = `Playground-${Date.now()}`;
            const response = await firstValueFrom(
                this.aclApi.createRole({
                    name: roleName,
                    description: "Rol temporal generado por playground.",
                })
            );

            if (!response?.role?.id || response.role.name !== roleName) {
                throw new Error("Respuesta invalida al crear rol ACL.");
            }

            return `Rol ${response.role.name} creado con ID ${response.role.id}.`;
        });

        await this.runCheck("hr-employees", async () => {
            const employees = await firstValueFrom(this.hrApi.listEmployees());
            return `${employees.length} empleados cargados desde backend.`;
        });

        await this.runCheck("hr-catalogs", async () => {
            const catalogs = await firstValueFrom(this.hrApi.catalogs());
            if (!catalogs.positions.length || !catalogs.departments.length) {
                throw new Error("Catalogos RRHH vacios o incompletos.");
            }
            return `${catalogs.positions.length} cargos y ${catalogs.departments.length} departamentos cargados.`;
        });

        await this.runCheck("hr-sync", async () => {
            const before = await firstValueFrom(this.hrApi.catalogs());
            const positions = before.positions.map((item) => item.name);
            const departments = before.departments.map((item) => item.name);

            if (!positions.length || !departments.length) {
                throw new Error("No hay catalogos para probar sincronizacion RRHH.");
            }

            const synced = await firstValueFrom(
                this.hrApi.syncCatalogs({
                    positions,
                    departments,
                })
            );

            if (!synced.positions.length || !synced.departments.length) {
                throw new Error("Sync RRHH devolvio catalogos vacios.");
            }

            return `Sync RRHH OK (${synced.positions.length} cargos, ${synced.departments.length} departamentos).`;
        });

        if (this.failCount === 0) {
            this.summaryMessage = `Playground completado: ${this.passCount}/${this.checks.length} pruebas en PASS.`;
        } else {
            this.summaryMessage = `Playground completado con alertas: ${this.passCount}/${this.checks.length} PASS y ${this.failCount} FAIL.`;
        }

        this.running = false;
        this.cdr.detectChanges();
    }

    private resetChecks(): void {
        this.checks = this.checks.map((check) => ({
            ...check,
            status: "idle",
            details: "",
            durationMs: 0,
        }));
        this.cdr.detectChanges();
    }

    private async runCheck(key: string, execute: () => Promise<string>): Promise<void> {
        const startedAt = Date.now();
        this.updateCheck(key, {
            status: "running",
            details: "Ejecutando...",
            durationMs: 0,
        });

        try {
            const details = await execute();
            this.updateCheck(key, {
                status: "pass",
                details,
                durationMs: Date.now() - startedAt,
            });
        } catch (error) {
            this.updateCheck(key, {
                status: "fail",
                details: this.toErrorMessage(error),
                durationMs: Date.now() - startedAt,
            });
        }
    }

    private updateCheck(key: string, patch: Partial<PlaygroundCheck>): void {
        this.checks = this.checks.map((check) => {
            if (check.key !== key) {
                return check;
            }

            return {
                ...check,
                ...patch,
            };
        });
        this.cdr.detectChanges();
    }

    private toErrorMessage(error: unknown): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message;
        }

        if (typeof error === "string" && error.trim()) {
            return error;
        }

        return "Error no identificado durante la prueba.";
    }
}
