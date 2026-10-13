import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "app-company-hr-audit",
    standalone: true,
    imports: [RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">RRHH - Auditoria</h5>
                    <p class="text-secondary small mb-0">Bitacora de eventos y cambios en informacion de talento humano</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button">Limpiar filtros</button>
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-audit' }">Ver ficha</a>
                    <button class="btn btn-theme" type="button">Exportar log</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-hr-dashboard">Recursos Humanos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Auditoria</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Eventos recientes RRHH</h6>
                    <p class="text-secondary small mb-0">Modelo de trazabilidad por fecha, actor y accion</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Fecha y hora</th>
                                    <th>Usuario</th>
                                    <th>Modulo</th>
                                    <th>Accion</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (log of logs; track log.timestamp + '-' + log.actor) {
                                    <tr>
                                        <td>{{ log.timestamp }}</td>
                                        <td>{{ log.actor }}</td>
                                        <td>{{ log.module }}</td>
                                        <td>{{ log.action }}</td>
                                        <td>{{ log.detail }}</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Controles minimos sugeridos</h6>
                </div>
                <div class="card-body">
                    <ul class="mb-0 text-secondary">
                        <li>Registrar usuario, fecha y payload minimo de cada cambio en ficha de empleado.</li>
                        <li>No permitir eliminaciones fisicas de historial, solo anulaciones trazables.</li>
                        <li>Separar logs de consulta y logs de modificacion por nivel de riesgo.</li>
                        <li>Crear alertas automaticas para cambios de datos sensibles (salud, contrato, salida).</li>
                    </ul>
                </div>
            </div>
        </div>
    `,
})
export class CompanyHrAuditComponent {
    readonly logs = [
        {
            timestamp: "2026-04-12 08:14:10",
            actor: "rrhh.admin",
            module: "Documentos",
            action: "Carga de soporte",
            detail: "Se adjunto certificado SST para EMP-002.",
        },
        {
            timestamp: "2026-04-12 08:02:49",
            actor: "rrhh.admin",
            module: "Salud ocupacional",
            action: "Actualizacion examen",
            detail: "Se registro examen periodico para EMP-003.",
        },
        {
            timestamp: "2026-04-11 17:33:02",
            actor: "jefe.operaciones",
            module: "Empleados",
            action: "Cambio de responsable",
            detail: "EMP-004 reporta ahora a Direccion General.",
        },
    ];
}
