import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-company-hr-dashboard",
    standalone: true,
    imports: [RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Recursos Humanos</h5>
                    <p class="text-secondary small mb-0">Vista general del modulo de talento humano</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button">Exportar</button>
                    <a class="btn btn-theme" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-dashboard', new: 1 }">Nuevo colaborador</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-profile">Company</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Recursos Humanos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3 mb-lg-4">
                @for (kpi of kpis; track kpi.label) {
                    <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                        <div class="card adminuiux-card h-100">
                            <div class="card-body">
                                <p class="text-secondary small mb-1">{{ kpi.label }}</p>
                                <h4 class="mb-1">{{ kpi.value }}</h4>
                                <p class="small mb-0 text-theme-1">{{ kpi.note }}</p>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-lg-7">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Navegacion del modulo RRHH</h6>
                            <p class="text-secondary small mb-0">Opciones sugeridas para separar funciones por proceso</p>
                        </div>
                        <div class="card-body">
                            <div class="row gx-3 gy-3">
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-employees">
                                        <strong>Empleados</strong><br />
                                        <small class="text-secondary">Ficha base, estado y responsables</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/work-workload">
                                        <strong>Carga laboral</strong><br />
                                        <small class="text-secondary">Distribucion de trabajo por colaborador y proyecto</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-dashboard' }">
                                        <strong>Ficha profesional</strong><br />
                                        <small class="text-secondary">Vista unificada del colaborador</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-compensation">
                                        <strong>Nomina y compensacion</strong><br />
                                        <small class="text-secondary">Devengado, carga prestacional y costo integral</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-worktime">
                                        <strong>Horarios y festivos</strong><br />
                                        <small class="text-secondary">Jornadas, turnos base y calendario anual</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-health">
                                        <strong>Salud ocupacional</strong><br />
                                        <small class="text-secondary">EPS, examenes medicos y alertas</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-leaves">
                                        <strong>Vacaciones y licencias</strong><br />
                                        <small class="text-secondary">Solicitudes, aprobaciones y ausencias</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-documents">
                                        <strong>Documentos</strong><br />
                                        <small class="text-secondary">Hoja de vida y soportes laborales</small>
                                    </a>
                                </div>
                                <div class="col-12 col-md-6">
                                    <a class="btn btn-light border w-100 text-start" routerLink="/app/company-hr-audit">
                                        <strong>Auditoria</strong><br />
                                        <small class="text-secondary">Trazabilidad de cambios y eventos RRHH</small>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-5">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Alertas prioritarias</h6>
                        </div>
                        <div class="card-body p-0">
                            <ul class="list-group list-group-flush">
                                @for (alert of alerts; track alert.title) {
                                    <li class="list-group-item">
                                        <p class="mb-1 fw-semibold">{{ alert.title }}</p>
                                        <p class="small text-secondary mb-0">{{ alert.detail }}</p>
                                    </li>
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CompanyHrDashboardComponent {
    readonly kpis = [
        { label: "Colaboradores activos", value: "128", note: "+4 este mes" },
        { label: "Nuevos ingresos", value: "6", note: "Ultimos 30 dias" },
        { label: "Documentos pendientes", value: "19", note: "Requieren carga o revision" },
        { label: "Examenes por vencer", value: "11", note: "Proximos 45 dias" },
    ];

    readonly alerts = [
        { title: "Contratos por renovar", detail: "7 contratos finalizan en los proximos 20 dias." },
        { title: "Aceptacion de politica", detail: "5 usuarios no tienen evidencia de aceptacion de politica de datos." },
        { title: "Inconsistencia de jornada", detail: "3 colaboradores superaron horas semanales definidas sin justificacion." },
    ];
}
