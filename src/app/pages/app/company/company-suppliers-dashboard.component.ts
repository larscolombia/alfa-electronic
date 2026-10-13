import { Component, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SuppliersCatalogService, SupplierRecord } from "../../../services/suppliers-catalog.service";

type SupplierGrade = "A" | "B" | "C" | "D";

interface SupplierGradeMeta {
    grade: SupplierGrade;
    reliability: string;
    badgeClass: string;
    barClass: string;
}

interface SupplierSnapshot {
    supplierNumber: string;
    legalName: string;
    city: string;
    country: string;
    sector: string;
    grade: SupplierGrade;
    paymentTerms: string;
    subscriptionActive: boolean;
}

@Component({
    selector: "app-company-suppliers-dashboard",
    standalone: true,
    imports: [RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Proveedores - Dashboard</h5>
                    <p class="text-secondary small mb-0">Monitorea confiabilidad, clasificacion ABCD y desempeno operativo de proveedores.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/suppliers-crud">Abrir CRUD</a>
                    <a class="btn btn-theme" routerLink="/app/suppliers-crud">Nuevo proveedor</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Proveedores</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Total proveedores</p>
                            <h4 class="mb-0">{{ totalSuppliers }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Confiables (A-B)</p>
                            <h4 class="mb-0">{{ reliableSuppliers }}</h4>
                            <p class="small text-secondary mb-0">{{ reliableRate }}% del total</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Suscripciones activas</p>
                            <h4 class="mb-0">{{ activeSubscriptions }}</h4>
                            <p class="small text-secondary mb-0">Contratos de soporte vigentes</p>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3">
                    <div class="card adminuiux-card">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Alertas abiertas</p>
                            <h4 class="mb-0">{{ openAlerts }}</h4>
                            <p class="small text-secondary mb-0">Entregas y calidad pendientes</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-lg-5">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Clasificacion ABCD</h6>
                            <p class="text-secondary small mb-0">El grado determina el nivel de confianza del proveedor</p>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Grado</th>
                                            <th>Total</th>
                                            <th>Participacion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (grade of gradeMeta; track grade.grade) {
                                            <tr>
                                                <td>
                                                    <span class="badge rounded-pill" [class]="grade.badgeClass">{{ grade.grade }} - {{ grade.reliability }}</span>
                                                </td>
                                                <td>{{ countByGrade(grade.grade) }}</td>
                                                <td>
                                                    <div class="progress" style="height: 8px;">
                                                        <div class="progress-bar" [class]="grade.barClass" [style.width.%]="gradeShare(grade.grade)"></div>
                                                    </div>
                                                    <small class="text-secondary">{{ gradeShare(grade.grade) }}%</small>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <h6 class="mb-0">Alertas de seguimiento</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-group list-group-flush bg-none">
                                <li class="list-group-item px-0">
                                    <div class="fw-semibold">{{ delayedDeliveries }} entregas fuera de tiempo</div>
                                    <p class="small text-secondary mb-0">Revisar acuerdos logisiticos y nivel de servicio comprometido.</p>
                                </li>
                                <li class="list-group-item px-0">
                                    <div class="fw-semibold">{{ qualityIncidents }} incidentes de calidad</div>
                                    <p class="small text-secondary mb-0">Material con fallas reportadas por operaciones y mantenimiento.</p>
                                </li>
                                <li class="list-group-item px-0">
                                    <div class="fw-semibold">{{ lowConfidenceSuppliers }} proveedores en grado C-D</div>
                                    <p class="small text-secondary mb-0">Evaluar continuidad, plan de mejora o proveedores alternos.</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-7">
                    <div class="card adminuiux-card mb-3 mb-lg-4">
                        <div class="card-header">
                            <div class="row gx-3 align-items-center">
                                <div class="col">
                                    <h6 class="mb-0">Panel operativo de proveedores</h6>
                                    <p class="text-secondary small mb-0">Vista rapida de ficha maestra, terminos de pago y cobertura contractual</p>
                                </div>
                                <div class="col-auto">
                                    <a class="btn btn-sm btn-theme" routerLink="/app/suppliers-crud">Gestionar ficha maestra</a>
                                </div>
                            </div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Nro</th>
                                            <th>Razon social</th>
                                            <th>Ciudad / Pais</th>
                                            <th>Sector</th>
                                            <th>Grado</th>
                                            <th>Pago</th>
                                            <th>Suscripcion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @for (supplier of suppliers; track supplier.supplierNumber) {
                                            <tr>
                                                <td>{{ supplier.supplierNumber }}</td>
                                                <td>{{ supplier.legalName }}</td>
                                                <td>{{ supplier.city }} / {{ supplier.country }}</td>
                                                <td>{{ supplier.sector }}</td>
                                                <td>
                                                    <span class="badge rounded-pill"
                                                        [class.text-bg-success]="supplier.grade === 'A'"
                                                        [class.text-bg-primary]="supplier.grade === 'B'"
                                                        [class.text-bg-warning]="supplier.grade === 'C'"
                                                        [class.text-bg-danger]="supplier.grade === 'D'">
                                                        {{ supplier.grade }}
                                                    </span>
                                                </td>
                                                <td>{{ supplier.paymentTerms }}</td>
                                                <td>
                                                    <span class="badge" [class.text-bg-success]="supplier.subscriptionActive" [class.text-bg-secondary]="!supplier.subscriptionActive">
                                                        {{ supplier.subscriptionActive ? 'Activa' : 'Sin contrato' }}
                                                    </span>
                                                </td>
                                            </tr>
                                        }
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class CompanySuppliersDashboardComponent implements OnInit {
    private readonly suppliersCatalog = inject(SuppliersCatalogService);

    suppliers: SupplierSnapshot[] = [];

    ngOnInit(): void {
        this.suppliersCatalog.suppliers$.subscribe((records) => {
            this.suppliers = records.map((r) => ({
                supplierNumber: r.supplierNumber,
                legalName: r.legalName,
                city: r.city,
                country: r.country,
                sector: r.sector,
                grade: r.confidenceGrade as SupplierGrade,
                paymentTerms: r.paymentTerms,
                subscriptionActive: r.subscriptionActive,
            }));
        });
    }

    readonly gradeMeta: SupplierGradeMeta[] = [
        { grade: "A", reliability: "Alta", badgeClass: "text-bg-success", barClass: "bg-success" },
        { grade: "B", reliability: "Buena", badgeClass: "text-bg-primary", barClass: "bg-primary" },
        { grade: "C", reliability: "Media", badgeClass: "text-bg-warning", barClass: "bg-warning" },
        { grade: "D", reliability: "Baja", badgeClass: "text-bg-danger", barClass: "bg-danger" },
    ];

    readonly delayedDeliveries = 3;
    readonly qualityIncidents = 2;

    get totalSuppliers(): number {
        return this.suppliers.length;
    }

    get reliableSuppliers(): number {
        return this.suppliers.filter((supplier) => supplier.grade === "A" || supplier.grade === "B").length;
    }

    get lowConfidenceSuppliers(): number {
        return this.suppliers.filter((supplier) => supplier.grade === "C" || supplier.grade === "D").length;
    }

    get reliableRate(): number {
        if (this.totalSuppliers === 0) {
            return 0;
        }
        return Math.round((this.reliableSuppliers / this.totalSuppliers) * 100);
    }

    get activeSubscriptions(): number {
        return this.suppliers.filter((supplier) => supplier.subscriptionActive).length;
    }

    get openAlerts(): number {
        return this.delayedDeliveries + this.qualityIncidents + this.lowConfidenceSuppliers;
    }

    countByGrade(grade: SupplierGrade): number {
        return this.suppliers.filter((supplier) => supplier.grade === grade).length;
    }

    gradeShare(grade: SupplierGrade): number {
        if (this.totalSuppliers === 0) {
            return 0;
        }
        return Math.round((this.countByGrade(grade) / this.totalSuppliers) * 100);
    }
}
