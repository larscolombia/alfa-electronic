import { NgFor } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

type UploadHistoryRow = {
    fileName: string;
    target: "Prospectos" | "Clientes";
    rows: number;
    uploadedAt: string;
    status: "Completado" | "Pendiente";
};

@Component({
    selector: "app-crm-database-upload",
    standalone: true,
    imports: [RouterLink, NgFor],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col mb-3 mb-sm-0">
                    <h5 class="mb-0">CRM - Carga de bases de datos</h5>
                    <p class="text-secondary small mb-0">Importa archivos para alimentar prospectos y clientes.</p>
                </div>
                <div class="col-auto">
                    <a class="btn btn-sm btn-theme" routerLink="/app/crm-prospectos">
                        <i class="bi bi-people me-1"></i> Ver prospectos
                    </a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi">
                        <a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i> Home</a>
                    </li>
                    <li class="breadcrumb-item bi active" aria-current="page">CRM</li>
                    <li class="breadcrumb-item bi active" aria-current="page">Carga de bases de datos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header border-bottom">
                    <h6 class="mb-0">Subir archivo</h6>
                </div>
                <div class="card-body">
                    <div class="row gx-3">
                        <div class="col-12 col-lg-5 mb-3">
                            <label class="form-label">Archivo</label>
                            <input type="file" class="form-control" accept=".csv,.xlsx" multiple />
                            <p class="small text-secondary mt-2 mb-0">Formatos soportados: CSV y XLSX.</p>
                        </div>
                        <div class="col-12 col-lg-3 mb-3">
                            <label class="form-label">Destino</label>
                            <select class="form-select">
                                <option selected>Prospectos</option>
                                <option>Clientes</option>
                            </select>
                        </div>
                        <div class="col-12 col-lg-4 mb-3">
                            <label class="form-label">Opciones</label>
                            <div class="d-flex gap-2">
                                <button class="btn btn-theme" type="button"><i class="bi bi-upload me-1"></i> Cargar archivos</button>
                                <button class="btn btn-outline-secondary" type="button">Limpiar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card">
                <div class="card-header border-bottom">
                    <h6 class="mb-0">Historial de cargas recientes</h6>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Archivo</th>
                                    <th>Destino</th>
                                    <th>Registros</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let row of history">
                                    <td>{{ row.fileName }}</td>
                                    <td>{{ row.target }}</td>
                                    <td>{{ row.rows }}</td>
                                    <td>{{ row.uploadedAt }}</td>
                                    <td>
                                        <span class="badge" [class.text-bg-success]="row.status === 'Completado'" [class.text-bg-warning]="row.status === 'Pendiente'">{{ row.status }}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CrmDatabaseUploadComponent {
    history: UploadHistoryRow[] = [
        {
            fileName: "prospectos_marzo.csv",
            target: "Prospectos",
            rows: 320,
            uploadedAt: "11/04/2026 09:15",
            status: "Completado",
        },
        {
            fileName: "clientes_q1.xlsx",
            target: "Clientes",
            rows: 114,
            uploadedAt: "11/04/2026 11:42",
            status: "Completado",
        },
        {
            fileName: "clientes_nuevos.csv",
            target: "Clientes",
            rows: 75,
            uploadedAt: "12/04/2026 08:03",
            status: "Pendiente",
        },
    ];
}
