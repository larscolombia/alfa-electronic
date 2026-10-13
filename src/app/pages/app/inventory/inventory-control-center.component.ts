import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { InventoryPermission, InventoryRole } from "../../../services/inventory-domain.models";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";

type BacklogStatus = "pendiente" | "en-curso" | "resuelto";

interface BacklogItem {
    topic: string;
    owner: string;
    status: BacklogStatus;
    nextStep: string;
}

interface InventoryTreeNode {
    route: string;
    label: string;
    icon: string;
    description: string;
    permission: InventoryPermission;
}

@Component({
    selector: "app-inventory-control-center",
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Inventario - Centro de control tecnico</h5>
                    <p class="text-secondary small mb-0">Vista ejecutiva del plan acordado en la reunion del 30-mar para evitar reservas indefinidas, errores de captura y faltantes cronicos.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-theme" routerLink="/app/inventory-stock">Ir a stock y fichas</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Inventario</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3">
                <div class="card-body">
                    <div class="row gx-3 gy-2 align-items-end">
                        <div class="col-12 col-md-4">
                            <label class="form-label">Perfil operativo (RBAC frontend)</label>
                            <select class="form-select" [(ngModel)]="activeRole">
                                <option *ngFor="let role of roleOptions" [value]="role">{{ roleLabel(role) }}</option>
                            </select>
                        </div>
                        <div class="col-12 col-md">
                            <div class="alert alert-info border mb-0">
                                <strong>Acceso visible:</strong>
                                {{ visibleTree.length }} modulo(s) de inventario habilitados para {{ roleLabel(activeRole) }}.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Pendientes</p>
                            <h4 class="mb-0">{{ pendingCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4 mb-3 mb-md-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">En curso</p>
                            <h4 class="mb-0">{{ inProgressCount }}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Resueltos</p>
                            <h4 class="mb-0">{{ resolvedCount }}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Arbol funcional de inventario</h6>
                    <p class="small text-secondary mb-0">Este arbol replica el flujo operativo definido en la transcripcion.</p>
                </div>
                <div class="card-body">
                    <div class="list-group list-group-flush">
                        <a *ngFor="let node of visibleTree" class="list-group-item list-group-item-action" [routerLink]="node.route">
                            <div class="d-flex align-items-start">
                                <i class="bi me-3" [ngClass]="node.icon"></i>
                                <div>
                                    <div class="fw-semibold">{{ node.label }}</div>
                                    <div class="small text-secondary">{{ node.description }}</div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card">
                <div class="card-header">
                    <h6 class="mb-0">Cobertura del to-do de reunion</h6>
                    <p class="small text-secondary mb-0">Matriz de control para no perder items criticos.</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Tema</th>
                                    <th>Responsable</th>
                                    <th>Estado</th>
                                    <th>Siguiente paso</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let item of backlog">
                                    <td>{{ item.topic }}</td>
                                    <td>{{ item.owner }}</td>
                                    <td>
                                        <span class="badge" [ngClass]="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
                                    </td>
                                    <td>{{ item.nextStep }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class InventoryControlCenterComponent {
    readonly roleOptions: InventoryRole[] = ["tecnico", "responsable", "administrativo", "compras", "auditor"];

    readonly tree: InventoryTreeNode[] = [
        {
            route: "/app/inventory-dashboard",
            label: "Inventario > Panel de control",
            icon: "bi-speedometer2",
            description: "Seguimiento integral de seguridad, backlog y cumplimiento operativo.",
            permission: "inventory.dashboard.view",
        },
        {
            route: "/app/inventory-stock",
            label: "Inventario > Stock y fichas",
            icon: "bi-box-seam",
            description: "Separacion entre alta de ficha y entrada a referencia existente.",
            permission: "inventory.stock.view",
        },
        {
            route: "/app/inventory-movements",
            label: "Inventario > Entradas, salidas y ajustes",
            icon: "bi-arrow-left-right",
            description: "Reglas de rol para evitar ajustes no autorizados.",
            permission: "inventory.movements.view",
        },
        {
            route: "/app/inventory-reservations",
            label: "Inventario > Reservas",
            icon: "bi-bookmark-check",
            description: "Control de reservas con vencimiento para eliminar congelados indefinidos.",
            permission: "inventory.reservations.view",
        },
        {
            route: "/app/inventory-orders",
            label: "Inventario > Cantidad insuficiente y reposicion",
            icon: "bi-exclamation-diamond",
            description: "Backlog de minimos con historico de intentos de compra.",
            permission: "inventory.replenishment.view",
        },
        {
            route: "/app/inventory-order-details",
            label: "Inventario > Conciliacion anual y auditoria",
            icon: "bi-clipboard-data",
            description: "Conteo fisico vs sistema y aprobacion de diferencias.",
            permission: "inventory.reconciliation.view",
        },
    ];

    readonly backlog: BacklogItem[] = [
        {
            topic: "Permisos por accion (crear ficha, ajustar, reservar)",
            owner: "Producto + Tecnologia",
            status: "resuelto",
            nextStep: "Mantener matriz de permisos alineada con negocio.",
        },
        {
            topic: "Separar alta de ficha y entrada a stock",
            owner: "Inventario",
            status: "en-curso",
            nextStep: "Formalizar checklist para alta de referencias nuevas.",
        },
        {
            topic: "Reservas con vencimiento",
            owner: "Operaciones",
            status: "en-curso",
            nextStep: "Monitorear renovaciones y vencimientos en operacion semanal.",
        },
        {
            topic: "Insuficiencia con antiguedad e intentos",
            owner: "Compras",
            status: "en-curso",
            nextStep: "Priorizar por antiguedad y escalar tras 3 intentos fallidos.",
        },
        {
            topic: "Conciliacion anual de inventario",
            owner: "Direccion tecnica",
            status: "en-curso",
            nextStep: "Operar sesiones reales y generar acta exportable de cierre.",
        },
        {
            topic: "Auditoria de movimientos",
            owner: "Calidad",
            status: "resuelto",
            nextStep: "Registrar usuario, fecha, motivo y diferencia antes/despues.",
        },
    ];

    constructor(private readonly inventoryRbac: InventoryRbacService) { }

    get activeRole(): InventoryRole {
        return this.inventoryRbac.currentRole;
    }

    set activeRole(value: InventoryRole) {
        this.inventoryRbac.setRole(value);
    }

    get visibleTree(): InventoryTreeNode[] {
        return this.tree.filter((node) => this.inventoryRbac.hasPermission(node.permission));
    }

    get pendingCount(): number {
        return this.backlog.filter((item) => item.status === "pendiente").length;
    }

    get inProgressCount(): number {
        return this.backlog.filter((item) => item.status === "en-curso").length;
    }

    get resolvedCount(): number {
        return this.backlog.filter((item) => item.status === "resuelto").length;
    }

    roleLabel(role: InventoryRole): string {
        return this.inventoryRbac.roleLabel(role);
    }

    statusClass(status: BacklogStatus): string {
        if (status === "resuelto") {
            return "text-bg-success";
        }
        if (status === "en-curso") {
            return "text-bg-warning";
        }
        return "text-bg-secondary";
    }

    statusLabel(status: BacklogStatus): string {
        if (status === "resuelto") {
            return "Resuelto";
        }
        if (status === "en-curso") {
            return "En curso";
        }
        return "Pendiente";
    }
}
