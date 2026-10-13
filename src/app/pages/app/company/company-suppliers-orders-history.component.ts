import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { Subscription } from "rxjs";
import { SuppliersCatalogService } from "../../../services/suppliers-catalog.service";
import { SuppliersApiService, SupplierOrder, SupplierOrderItem, SupplierOrderRequest } from "../../../services/suppliers-api.service";

type SupplierOrderStatus = "Solicitado" | "En transito" | "Recibido" | "Borrador";
type OrderItemType = "Componente" | "Placa completa" | "Kit de reparacion" | "Consumible" | "Otro";
type OrderUrgency = "Normal" | "Alta" | "Critica";

interface SupplierSummary {
    id: number;
    supplierNumber: string;
    legalName: string;
}

interface SupplierOrderRecord {
    orderNumber: string;
    supplierId: number;
    requestedBy: string;
    equipment: string;
    purpose: string;
    quantity: number;
    requestDate: string;
    status: SupplierOrderStatus;
}

interface SupplierOrderItemRecord {
    id: string;
    type: OrderItemType;
    description: string;
    partNumber: string;
    targetBoard: string;
    quantity: number;
    unit: string;
    unitCost: number;
    notes: string;
}

interface SupplierOrderDetailRecord {
    orderNumber: string;
    supplierId: number;
    requestedBy: string;
    requestDate: string;
    status: SupplierOrderStatus;
    customerName: string;
    machineModel: string;
    boardReference: string;
    diagnosis: string;
    repairObjective: string;
    urgency: OrderUrgency;
    commercialNotes: string;
    items: SupplierOrderItemRecord[];
}

interface OrderTraceRecord {
    timestamp: string;
    actor: string;
    action: string;
    status: SupplierOrderStatus;
    notes: string;
}

@Component({
    selector: "app-company-suppliers-orders-history",
    standalone: true,
    imports: [RouterLink, FormsModule],
    styles: [
        `
            .order-number-btn {
                text-decoration: underline;
            }

            .order-modal .modal-dialog {
                max-width: 1220px;
            }

            .order-items-table-wrap {
                max-height: 330px;
                overflow: auto;
            }

            .order-items-search-input {
                width: 240px;
            }

            .traceability-table-wrap {
                --trace-row-height: 44px;
                max-height: calc(44px + (var(--trace-row-height) * 5));
                overflow-y: auto;
            }

            .traceability-table-wrap thead th {
                position: sticky;
                top: 0;
                z-index: 2;
                background: #ffffff;
            }

            .traceability-table-wrap tbody tr {
                height: var(--trace-row-height);
            }

            .traceability-search-input {
                width: 240px;
            }

            .item-remove-btn {
                min-width: 38px;
            }

            .metric-card {
                border: 1px dashed rgba(95, 110, 247, 0.6);
                border-radius: 0.75rem;
                background: rgba(95, 110, 247, 0.05);
                padding: 0.75rem 0.9rem;
            }

            .metric-label {
                color: #6c757d;
                font-size: 0.72rem;
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }

            .metric-value {
                font-size: 1rem;
                font-weight: 700;
            }
        `,
    ],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col col-sm mb-3 mb-sm-0">
                    <h5 class="mb-0">Proveedores - Historial de pedidos</h5>
                    <p class="text-secondary small mb-0">Consulta compras por proveedor con foco en reparacion de placas y componentes electronicos.</p>
                </div>
                <div class="col-12 col-sm-auto text-sm-end">
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/suppliers-dashboard">Dashboard</a>
                    <a class="btn btn-theme" routerLink="/app/suppliers-crud">Volver al CRUD</a>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/suppliers-dashboard">Proveedores</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Historial de pedidos</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            @if (message) {
                <div class="alert alert-success border mb-3">{{ message }}</div>
            }

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Filtros</h6>
                    <p class="small text-secondary mb-0">Acota por proveedor y por contexto del caso: cliente, maquina, placa o componente.</p>
                </div>
                <div class="card-body">
                    <div class="row gx-3 gy-3">
                        <div class="col-12 col-md-6 col-lg-4">
                            <label class="form-label">Proveedor</label>
                            <select class="form-select" [(ngModel)]="selectedSupplierId">
                                <option [ngValue]="null">Todos los proveedores</option>
                                @for (supplier of suppliers; track supplier.id) {
                                    <option [ngValue]="supplier.id">{{ supplier.supplierNumber }} - {{ supplier.legalName }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4">
                            <label class="form-label">Buscar</label>
                            <input class="form-control" type="text" placeholder="Solicitante, cliente, placa, equipo o componente" [(ngModel)]="searchTerm" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <div class="row gx-3 align-items-center">
                        <div class="col">
                            <h6 class="mb-0">Lista completa de pedidos</h6>
                            <p class="small text-secondary mb-0">Incluye resumen de pedido y permite abrir detalle completo editable.</p>
                        </div>
                        <div class="col-auto">
                            <span class="badge text-bg-theme-1">{{ filteredOrders.length }} pedidos</span>
                        </div>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Pedido</th>
                                    <th>Proveedor</th>
                                    <th>Fecha</th>
                                    <th>Solicitado por</th>
                                    <th>Dispositivo / Equipo</th>
                                    <th>Finalidad</th>
                                    <th>Cantidad</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (order of filteredOrders; track order.orderNumber) {
                                    <tr>
                                        <td>
                                            <button class="btn btn-link btn-sm p-0 order-number-btn" type="button" (click)="openOrderDetails(order)">
                                                {{ order.orderNumber }}
                                            </button>
                                        </td>
                                        <td>{{ supplierLabel(order.supplierId) }}</td>
                                        <td>{{ order.requestDate }}</td>
                                        <td>{{ order.requestedBy }}</td>
                                        <td>{{ order.equipment }}</td>
                                        <td>{{ order.purpose }}</td>
                                        <td>{{ order.quantity }}</td>
                                        <td>
                                            <span class="badge"
                                                [class.text-bg-info]="order.status === 'Solicitado'"
                                                [class.text-bg-warning]="order.status === 'En transito'"
                                                [class.text-bg-success]="order.status === 'Recibido'"
                                                [class.text-bg-secondary]="order.status === 'Borrador'">
                                                {{ order.status }}
                                            </span>
                                        </td>
                                    </tr>
                                } @empty {
                                    <tr>
                                        <td colspan="8" class="text-center text-secondary py-4">No existen pedidos para el filtro seleccionado.</td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            @if (selectedOrder && orderDetailDraft) {
                <div class="modal fade show d-block order-modal" tabindex="-1" role="dialog" aria-modal="true" (click)="closeOrderDetails()">
                    <div class="modal-dialog modal-xl modal-dialog-scrollable" (click)="$event.stopPropagation()">
                        <div class="modal-content">
                            <div class="modal-header">
                                <div>
                                    <h5 class="modal-title mb-1">Pedido {{ selectedOrder.orderNumber }}</h5>
                                    <p class="small text-secondary mb-0">Edita en serio todo lo solicitado al proveedor para el caso de reparacion.</p>
                                </div>
                                <button type="button" class="btn-close" aria-label="Cerrar" (click)="closeOrderDetails()"></button>
                            </div>

                            <div class="modal-body">
                                @if (modalValidationMessage) {
                                    <div class="alert alert-warning border mb-3">{{ modalValidationMessage }}</div>
                                }

                                <div class="card border mb-3">
                                    <div class="card-header py-2">
                                        <h6 class="mb-0">Cabecera del caso de reparacion</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="row gx-3 gy-3">
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <label class="form-label small">Proveedor</label>
                                                <select class="form-select form-select-sm" [(ngModel)]="orderDetailDraft.supplierId" [ngModelOptions]="{ standalone: true }">
                                                    @for (supplier of suppliers; track supplier.id) {
                                                        <option [ngValue]="supplier.id">{{ supplierLabel(supplier.id) }}</option>
                                                    }
                                                </select>
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <label class="form-label small">Estado del pedido</label>
                                                <select class="form-select form-select-sm" [(ngModel)]="orderDetailDraft.status" [ngModelOptions]="{ standalone: true }">
                                                    @for (status of orderStatuses; track status) {
                                                        <option [value]="status">{{ status }}</option>
                                                    }
                                                </select>
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <label class="form-label small">Prioridad</label>
                                                <select class="form-select form-select-sm" [(ngModel)]="orderDetailDraft.urgency" [ngModelOptions]="{ standalone: true }">
                                                    @for (urgency of orderUrgencies; track urgency) {
                                                        <option [value]="urgency">{{ urgency }}</option>
                                                    }
                                                </select>
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <label class="form-label small">Fecha solicitud</label>
                                                <input class="form-control form-control-sm" type="date" [(ngModel)]="orderDetailDraft.requestDate" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <label class="form-label small">Solicitado por</label>
                                                <input class="form-control form-control-sm" type="text" [(ngModel)]="orderDetailDraft.requestedBy" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4">
                                                <label class="form-label small">Cliente final</label>
                                                <input class="form-control form-control-sm" type="text" [(ngModel)]="orderDetailDraft.customerName" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <label class="form-label small">Maquina / Equipo</label>
                                                <input class="form-control form-control-sm" type="text" placeholder="Ej: Heidelberg SM74" [(ngModel)]="orderDetailDraft.machineModel" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-12 col-md-6">
                                                <label class="form-label small">Placa / Tarjeta de destino</label>
                                                <input class="form-control form-control-sm" type="text" placeholder="Ej: Main Board Rev C" [(ngModel)]="orderDetailDraft.boardReference" [ngModelOptions]="{ standalone: true }" />
                                            </div>
                                            <div class="col-12 col-lg-6">
                                                <label class="form-label small">Diagnostico tecnico</label>
                                                <textarea class="form-control form-control-sm" rows="3" [(ngModel)]="orderDetailDraft.diagnosis" [ngModelOptions]="{ standalone: true }"></textarea>
                                            </div>
                                            <div class="col-12 col-lg-6">
                                                <label class="form-label small">Objetivo de reparacion</label>
                                                <textarea class="form-control form-control-sm" rows="3" [(ngModel)]="orderDetailDraft.repairObjective" [ngModelOptions]="{ standalone: true }"></textarea>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label small">Notas comerciales / despacho</label>
                                                <textarea class="form-control form-control-sm" rows="2" [(ngModel)]="orderDetailDraft.commercialNotes" [ngModelOptions]="{ standalone: true }"></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                    <div>
                                        <h6 class="mb-0">Items solicitados al proveedor</h6>
                                        <p class="small text-secondary mb-0">Cada linea puede ser un componente, placa completa, kit o consumible.</p>
                                    </div>
                                    <div class="d-flex flex-wrap align-items-center gap-2">
                                        <span class="small text-secondary">{{ orderItemsRows.length }} de {{ totalOrderItems }} items</span>
                                        <input
                                            class="form-control form-control-sm order-items-search-input"
                                            type="text"
                                            placeholder="Buscar articulo en pedido"
                                            [(ngModel)]="orderItemsSearchTerm"
                                            [ngModelOptions]="{ standalone: true }" />
                                        <button type="button" class="btn btn-sm btn-outline-theme" (click)="addOrderItem()">
                                            <i class="bi bi-plus-circle me-1"></i>Agregar item
                                        </button>
                                    </div>
                                </div>

                                <div class="table-responsive border rounded order-items-table-wrap">
                                    <table class="table table-sm align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Tipo</th>
                                                <th>Descripcion tecnica</th>
                                                <th>Referencia / PN</th>
                                                <th>Destino en equipo</th>
                                                <th>Cantidad</th>
                                                <th>Unidad</th>
                                                <th>Costo unitario (COP)</th>
                                                <th>Subtotal</th>
                                                <th>Notas</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (item of orderItemsRows; track item.id) {
                                                <tr>
                                                    <td>
                                                        <select class="form-select form-select-sm" [(ngModel)]="item.type" [ngModelOptions]="{ standalone: true }">
                                                            @for (itemType of orderItemTypes; track itemType) {
                                                                <option [value]="itemType">{{ itemType }}</option>
                                                            }
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="text" placeholder="Ej: IGBT FGA25N120" [(ngModel)]="item.description" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="text" placeholder="Part Number" [(ngModel)]="item.partNumber" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="text" placeholder="Tarjeta fuente, driver..." [(ngModel)]="item.targetBoard" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="number" min="1" step="1" [(ngModel)]="item.quantity" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="text" placeholder="und" [(ngModel)]="item.unit" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="number" min="0" step="100" [(ngModel)]="item.unitCost" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td class="fw-semibold">{{ formatMoney(lineSubtotal(item)) }}</td>
                                                    <td>
                                                        <input class="form-control form-control-sm" type="text" placeholder="Lote, marca, observacion" [(ngModel)]="item.notes" [ngModelOptions]="{ standalone: true }" />
                                                    </td>
                                                    <td class="text-end">
                                                        <button type="button" class="btn btn-sm btn-outline-danger item-remove-btn" (click)="removeOrderItem(item.id)">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            } @empty {
                                                <tr>
                                                    <td colspan="10" class="text-center text-secondary py-4">
                                                        {{ totalOrderItems === 0 ? "Agrega al menos un item para describir lo que se le compro al proveedor." : "No hay articulos para el filtro aplicado." }}
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>

                                <div class="row gx-3 gy-3 mt-1">
                                    <div class="col-12 col-md-3">
                                        <div class="metric-card">
                                            <div class="metric-label">Lineas de compra</div>
                                            <div class="metric-value">{{ orderDetailDraft.items.length }}</div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <div class="metric-card">
                                            <div class="metric-label">Cantidad total</div>
                                            <div class="metric-value">{{ draftTotalQuantity() }}</div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <div class="metric-card">
                                            <div class="metric-label">Subtotal estimado</div>
                                            <div class="metric-value">{{ formatMoney(draftSubtotalAmount()) }}</div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <div class="metric-card">
                                            <div class="metric-label">Estado actual</div>
                                            <div class="metric-value">
                                                <span class="badge"
                                                    [class.text-bg-info]="orderDetailDraft.status === 'Solicitado'"
                                                    [class.text-bg-warning]="orderDetailDraft.status === 'En transito'"
                                                    [class.text-bg-success]="orderDetailDraft.status === 'Recibido'"
                                                    [class.text-bg-secondary]="orderDetailDraft.status === 'Borrador'">
                                                    {{ orderDetailDraft.status }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-4">
                                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                                        <div>
                                            <h6 class="mb-0">Trazabilidad del pedido</h6>
                                            <p class="small text-secondary mb-0">Vista tipo datatable con busqueda y scroll de 5 filas visibles.</p>
                                        </div>
                                        <div class="d-flex flex-wrap align-items-center gap-2">
                                            <span class="small text-secondary">{{ traceabilityRows.length }} de {{ totalTraceabilityEvents }} eventos</span>
                                            <input
                                                class="form-control form-control-sm traceability-search-input"
                                                type="text"
                                                placeholder="Buscar en trazabilidad"
                                                [(ngModel)]="traceabilitySearchTerm"
                                                [ngModelOptions]="{ standalone: true }" />
                                        </div>
                                    </div>

                                    <div class="table-responsive traceability-table-wrap border rounded">
                                        <table class="table table-sm align-middle mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Fecha/hora</th>
                                                    <th>Usuario</th>
                                                    <th>Accion</th>
                                                    <th>Estado</th>
                                                    <th>Notas</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                @for (trace of traceabilityRows; track trace.timestamp + trace.actor + trace.action) {
                                                    <tr>
                                                        <td>{{ trace.timestamp }}</td>
                                                        <td>{{ trace.actor }}</td>
                                                        <td>{{ trace.action }}</td>
                                                        <td>{{ trace.status }}</td>
                                                        <td>{{ trace.notes }}</td>
                                                    </tr>
                                                } @empty {
                                                    <tr>
                                                        <td colspan="5" class="text-secondary text-center py-3">No hay eventos para el filtro aplicado.</td>
                                                    </tr>
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn btn-outline-secondary" (click)="closeOrderDetails()">Cancelar</button>
                                <button type="button" class="btn btn-theme" (click)="saveOrderDetails()">Guardar pedido</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-backdrop fade show"></div>
            }
        </div>
    `,
})
export class CompanySuppliersOrdersHistoryComponent implements OnInit, OnDestroy {
    private routeSub?: Subscription;
    private nextOrderSequence = 9;
    private nextOrderItemSequence = 1;
    private readonly moneyFormatter = new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    });

    message = "";
    searchTerm = "";
    selectedSupplierId: number | null = null;
    selectedOrder: SupplierOrderRecord | null = null;
    orderDetailDraft: SupplierOrderDetailRecord | null = null;
    modalValidationMessage = "";
    orderItemsSearchTerm = "";
    traceabilitySearchTerm = "";
    readonly orderStatuses: SupplierOrderStatus[] = ["Solicitado", "En transito", "Recibido", "Borrador"];
    readonly orderItemTypes: OrderItemType[] = ["Componente", "Placa completa", "Kit de reparacion", "Consumible", "Otro"];
    readonly orderUrgencies: OrderUrgency[] = ["Normal", "Alta", "Critica"];
    readonly orderTraceability: Record<string, OrderTraceRecord[]> = {};
    readonly orderDetails: Record<string, SupplierOrderDetailRecord> = {};

    readonly suppliers: SupplierSummary[] = [
        { id: 1, supplierNumber: "PRV-0001", legalName: "Electronica Andina SAS" },
        { id: 2, supplierNumber: "PRV-0002", legalName: "TecnoRepuestos del Norte" },
        { id: 3, supplierNumber: "PRV-0003", legalName: "Insumos Delta Industrial" },
    ];

    orders: SupplierOrderRecord[] = [
        {
            orderNumber: "PED-0001",
            supplierId: 1,
            requestedBy: "Ludwig Angarita",
            equipment: "Tarjetas de control PLC - linea SMT-02",
            purpose: "Reposicion de repuestos criticos",
            quantity: 12,
            requestDate: "2026-02-14",
            status: "Recibido",
        },
        {
            orderNumber: "PED-0002",
            supplierId: 1,
            requestedBy: "Danny Ramirez",
            equipment: "Fuentes industriales 24V para banco de pruebas",
            purpose: "Mantenimiento preventivo de banco electronico",
            quantity: 8,
            requestDate: "2026-03-02",
            status: "En transito",
        },
        {
            orderNumber: "PED-0003",
            supplierId: 2,
            requestedBy: "Elkin Ramirez",
            equipment: "Variadores para transportador E-19",
            purpose: "Actualizacion de control de velocidad",
            quantity: 4,
            requestDate: "2026-01-28",
            status: "Recibido",
        },
        {
            orderNumber: "PED-0004",
            supplierId: 2,
            requestedBy: "Lider de Operaciones",
            equipment: "Sensores fotoelectricos para linea de empaque",
            purpose: "Ajuste de deteccion y conteo de piezas",
            quantity: 15,
            requestDate: "2026-03-18",
            status: "Solicitado",
        },
        {
            orderNumber: "PED-0005",
            supplierId: 3,
            requestedBy: "Maria Londono",
            equipment: "Kits de conectores para equipos legacy",
            purpose: "Soporte a reparaciones de equipos obsoletos",
            quantity: 20,
            requestDate: "2026-02-08",
            status: "Recibido",
        },
        {
            orderNumber: "PED-0006",
            supplierId: 3,
            requestedBy: "Coordinacion de Abastecimiento",
            equipment: "Capacitores de alta frecuencia para osciloscopios",
            purpose: "Reposicion de inventario tecnico",
            quantity: 30,
            requestDate: "2026-03-30",
            status: "En transito",
        },
        {
            orderNumber: "PED-0007",
            supplierId: 1,
            requestedBy: "Lider de Compras",
            equipment: "Modulos de potencia IGBT para inversores",
            purpose: "Reparacion de variadores de frecuencia",
            quantity: 6,
            requestDate: "2026-04-05",
            status: "Solicitado",
        },
        {
            orderNumber: "PED-0008",
            supplierId: 2,
            requestedBy: "Danny Ramirez",
            equipment: "Reles de estado solido para tablero principal",
            purpose: "Correccion de fallas electricas recurrentes",
            quantity: 10,
            requestDate: "2026-04-10",
            status: "Solicitado",
        },
    ];

    constructor(
        private route: ActivatedRoute,
        private suppliersCatalog: SuppliersCatalogService,
        private suppliersApi: SuppliersApiService,
    ) { }

    ngOnInit(): void {
        this.seedOrderDetails();
        this.seedTraceability();
        this.loadSuppliersFromService();
        this.loadOrdersFromApi();

        this.routeSub = this.route.queryParamMap.subscribe((params) => {
            const supplierIdParam = params.get("supplierId");
            const parsedSupplierId = Number(supplierIdParam);

            if (!Number.isNaN(parsedSupplierId) && this.suppliers.some((supplier) => supplier.id === parsedSupplierId)) {
                this.selectedSupplierId = parsedSupplierId;
            } else if (!supplierIdParam) {
                this.selectedSupplierId = null;
            }

            if (params.get("createOrder") === "1" && this.selectedSupplierId !== null) {
                this.createDraftOrder(this.selectedSupplierId);
            }
        });
    }

    ngOnDestroy(): void {
        this.routeSub?.unsubscribe();
    }

    @HostListener("document:keydown.escape")
    onEscapeKey(): void {
        this.closeOrderDetails();
    }

    get filteredOrders(): SupplierOrderRecord[] {
        const normalizedFilter = this.searchTerm.trim().toLowerCase();

        return this.orders.filter((order) => {
            const matchSupplier = this.selectedSupplierId === null || order.supplierId === this.selectedSupplierId;
            if (!matchSupplier) {
                return false;
            }

            if (!normalizedFilter) {
                return true;
            }

            const detail = this.orderDetails[order.orderNumber];
            const itemSearchable = detail ? detail.items.map((item) => `${item.description} ${item.partNumber} ${item.targetBoard}`).join(" ") : "";

            const searchableText = [
                order.orderNumber,
                order.requestedBy,
                order.equipment,
                order.purpose,
                this.supplierLabel(order.supplierId),
                detail?.customerName ?? "",
                detail?.machineModel ?? "",
                detail?.boardReference ?? "",
                detail?.diagnosis ?? "",
                itemSearchable,
            ]
                .join(" ")
                .toLowerCase();
            return searchableText.includes(normalizedFilter);
        });
    }

    get totalOrderItems(): number {
        return this.orderDetailDraft?.items.length ?? 0;
    }

    get orderItemsRows(): SupplierOrderItemRecord[] {
        if (!this.orderDetailDraft) {
            return [];
        }

        const normalizedFilter = this.orderItemsSearchTerm.trim().toLowerCase();
        if (!normalizedFilter) {
            return this.orderDetailDraft.items;
        }

        return this.orderDetailDraft.items.filter((item) => {
            const searchable = [item.type, item.description, item.partNumber, item.targetBoard, item.unit, item.notes, String(item.quantity), String(item.unitCost)]
                .join(" ")
                .toLowerCase();
            return searchable.includes(normalizedFilter);
        });
    }

    get totalTraceabilityEvents(): number {
        if (!this.selectedOrder) {
            return 0;
        }

        return this.getOrderTrace(this.selectedOrder.orderNumber).length;
    }

    get traceabilityRows(): OrderTraceRecord[] {
        if (!this.selectedOrder) {
            return [];
        }

        const normalizedFilter = this.traceabilitySearchTerm.trim().toLowerCase();
        const baseRows = [...this.getOrderTrace(this.selectedOrder.orderNumber)].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        if (!normalizedFilter) {
            return baseRows;
        }

        return baseRows.filter((trace) => {
            const searchable = [trace.timestamp, trace.actor, trace.action, trace.status, trace.notes].join(" ").toLowerCase();
            return searchable.includes(normalizedFilter);
        });
    }

    lineSubtotal(item: SupplierOrderItemRecord): number {
        const quantity = Number(item.quantity);
        const unitCost = Number(item.unitCost);
        const safeQuantity = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
        const safeUnitCost = Number.isFinite(unitCost) ? Math.max(0, unitCost) : 0;
        return safeQuantity * safeUnitCost;
    }

    draftTotalQuantity(): number {
        if (!this.orderDetailDraft) {
            return 0;
        }

        return this.sumItemQuantity(this.orderDetailDraft.items);
    }

    draftSubtotalAmount(): number {
        if (!this.orderDetailDraft) {
            return 0;
        }

        return this.sumItemSubtotal(this.orderDetailDraft.items);
    }

    formatMoney(value: number): string {
        return this.moneyFormatter.format(Number.isFinite(value) ? value : 0);
    }

    supplierLabel(supplierId: number): string {
        const supplier = this.suppliers.find((item) => item.id === supplierId);
        if (!supplier) {
            return "Proveedor no registrado";
        }

        return `${supplier.supplierNumber} - ${supplier.legalName}`;
    }

    addOrderItem(): void {
        if (!this.orderDetailDraft) {
            return;
        }

        this.orderDetailDraft.items = [...this.orderDetailDraft.items, this.buildEmptyOrderItem()];
    }

    removeOrderItem(itemId: string): void {
        if (!this.orderDetailDraft) {
            return;
        }

        this.orderDetailDraft.items = this.orderDetailDraft.items.filter((item) => item.id !== itemId);
    }

    getOrderTrace(orderNumber: string): OrderTraceRecord[] {
        return this.orderTraceability[orderNumber] ?? [];
    }

    openOrderDetails(order: SupplierOrderRecord): void {
        const storedDetail = this.orderDetails[order.orderNumber] ?? this.buildOrderDetailFromOrder(order);
        this.orderDetails[order.orderNumber] = this.cloneOrderDetail(storedDetail);
        this.selectedOrder = order;
        this.orderDetailDraft = this.cloneOrderDetail(storedDetail);
        this.modalValidationMessage = "";
        this.orderItemsSearchTerm = "";
        this.traceabilitySearchTerm = "";
    }

    saveOrderDetails(): void {
        if (!this.selectedOrder || !this.orderDetailDraft) {
            return;
        }

        const previousOrder = this.selectedOrder;
        const normalizedDetail = this.normalizeOrderDetail(this.orderDetailDraft);

        if (normalizedDetail.items.length === 0) {
            this.modalValidationMessage = "Debes registrar al menos un item con descripcion o referencia para guardar el pedido.";
            return;
        }

        const updatedOrder = this.buildOrderSummaryFromDetail(normalizedDetail, previousOrder);

        this.orderDetails[updatedOrder.orderNumber] = this.cloneOrderDetail(normalizedDetail);
        this.orders = this.orders.map((order) => (order.orderNumber === updatedOrder.orderNumber ? updatedOrder : order));
        this.selectedOrder = updatedOrder;
        this.orderDetailDraft = this.cloneOrderDetail(normalizedDetail);
        this.modalValidationMessage = "";

        const totalLines = normalizedDetail.items.length;
        const totalUnits = this.sumItemQuantity(normalizedDetail.items);
        const subtotal = this.sumItemSubtotal(normalizedDetail.items);
        const changeType = previousOrder.status === updatedOrder.status ? "Edicion integral del pedido" : "Edicion integral y cambio de estado";
        const notes = `${totalLines} lineas, ${totalUnits} unidades, subtotal ${this.formatMoney(subtotal)}.`;

        this.appendTrace(updatedOrder.orderNumber, {
            timestamp: this.currentTimestamp(),
            actor: "Usuario ERP",
            action: changeType,
            status: updatedOrder.status,
            notes,
        });

        this.message = `Pedido ${updatedOrder.orderNumber} actualizado con ${totalLines} items.`;
    }

    closeOrderDetails(): void {
        this.selectedOrder = null;
        this.orderDetailDraft = null;
        this.modalValidationMessage = "";
        this.orderItemsSearchTerm = "";
        this.traceabilitySearchTerm = "";
    }

    private createDraftOrder(supplierId: number): void {
        const supplier = this.suppliers.find((item) => item.id === supplierId);
        if (!supplier) {
            return;
        }

        const orderNumber = `PED-${String(this.nextOrderSequence).padStart(4, "0")}`;
        this.nextOrderSequence += 1;

        const draftOrder: SupplierOrderRecord = {
            orderNumber,
            supplierId,
            requestedBy: "Portal de Compras",
            equipment: "Equipo pendiente de especificar",
            purpose: "Pedido rapido iniciado desde contacto con proveedor",
            quantity: 1,
            requestDate: new Date().toISOString().slice(0, 10),
            status: "Borrador",
        };

        this.orders = [draftOrder, ...this.orders];
        this.orderDetails[orderNumber] = this.buildOrderDetailFromOrder(draftOrder);
        this.orderTraceability[orderNumber] = this.buildInitialTrace(draftOrder);
        this.message = `Se creo ${orderNumber} para ${supplier.legalName}.`;
    }

    private seedOrderDetails(): void {
        for (const order of this.orders) {
            if (!this.orderDetails[order.orderNumber]) {
                this.orderDetails[order.orderNumber] = this.buildOrderDetailFromOrder(order);
            }
        }
    }

    private seedTraceability(): void {
        for (const order of this.orders) {
            if (!this.orderTraceability[order.orderNumber]) {
                this.orderTraceability[order.orderNumber] = this.buildInitialTrace(order);
            }
        }
    }

    private buildOrderDetailFromOrder(order: SupplierOrderRecord): SupplierOrderDetailRecord {
        const suggestedType: OrderItemType = /placa|tarjeta/i.test(order.equipment) ? "Placa completa" : "Componente";

        return {
            orderNumber: order.orderNumber,
            supplierId: order.supplierId,
            requestedBy: order.requestedBy,
            requestDate: order.requestDate,
            status: order.status,
            customerName: "Cliente industrial por confirmar",
            machineModel: order.equipment,
            boardReference: "Tarjeta principal",
            diagnosis: `Diagnostico preliminar para ${order.equipment.toLowerCase()}.`,
            repairObjective: order.purpose,
            urgency: order.status === "Solicitado" || order.status === "En transito" ? "Alta" : "Normal",
            commercialNotes: "",
            items: [
                {
                    id: this.nextOrderItemId(),
                    type: suggestedType,
                    description: order.equipment,
                    partNumber: "",
                    targetBoard: "Main board",
                    quantity: Math.max(1, Math.trunc(order.quantity)),
                    unit: "und",
                    unitCost: 0,
                    notes: order.purpose,
                },
            ],
        };
    }

    private buildEmptyOrderItem(): SupplierOrderItemRecord {
        return {
            id: this.nextOrderItemId(),
            type: "Componente",
            description: "",
            partNumber: "",
            targetBoard: "",
            quantity: 1,
            unit: "und",
            unitCost: 0,
            notes: "",
        };
    }

    private cloneOrderDetail(detail: SupplierOrderDetailRecord): SupplierOrderDetailRecord {
        return {
            ...detail,
            items: detail.items.map((item) => ({ ...item })),
        };
    }

    private normalizeOrderDetail(detail: SupplierOrderDetailRecord): SupplierOrderDetailRecord {
        const normalizedItems = detail.items
            .map((item) => {
                const parsedQuantity = Number(item.quantity);
                const parsedUnitCost = Number(item.unitCost);

                return {
                    id: item.id || this.nextOrderItemId(),
                    type: item.type ?? "Componente",
                    description: item.description.trim(),
                    partNumber: item.partNumber.trim(),
                    targetBoard: item.targetBoard.trim(),
                    quantity: Number.isFinite(parsedQuantity) ? Math.max(1, Math.trunc(parsedQuantity)) : 1,
                    unit: item.unit.trim() || "und",
                    unitCost: Number.isFinite(parsedUnitCost) ? Math.max(0, parsedUnitCost) : 0,
                    notes: item.notes.trim(),
                };
            })
            .filter((item) => item.description.length > 0 || item.partNumber.length > 0);

        return {
            ...detail,
            requestDate: detail.requestDate || this.currentTimestamp().slice(0, 10),
            requestedBy: detail.requestedBy.trim() || "Usuario ERP",
            customerName: detail.customerName.trim() || "Cliente por confirmar",
            machineModel: detail.machineModel.trim(),
            boardReference: detail.boardReference.trim(),
            diagnosis: detail.diagnosis.trim(),
            repairObjective: detail.repairObjective.trim(),
            commercialNotes: detail.commercialNotes.trim(),
            items: normalizedItems,
        };
    }

    private buildOrderSummaryFromDetail(detail: SupplierOrderDetailRecord, fallbackOrder: SupplierOrderRecord): SupplierOrderRecord {
        const primaryItem = detail.items[0];
        const machine = detail.machineModel.trim();
        const board = detail.boardReference.trim();
        const equipmentSummary = machine && board ? `${machine} / ${board}` : machine || board || primaryItem?.description || fallbackOrder.equipment;
        const purposeSummary = detail.repairObjective || detail.diagnosis || primaryItem?.notes || fallbackOrder.purpose;
        const totalQuantity = Math.max(1, this.sumItemQuantity(detail.items));

        return {
            orderNumber: fallbackOrder.orderNumber,
            supplierId: detail.supplierId,
            requestedBy: detail.requestedBy,
            equipment: equipmentSummary,
            purpose: purposeSummary,
            quantity: totalQuantity,
            requestDate: detail.requestDate,
            status: detail.status,
        };
    }

    private sumItemQuantity(items: SupplierOrderItemRecord[]): number {
        return items.reduce((total, item) => {
            const quantity = Number(item.quantity);
            return total + (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
        }, 0);
    }

    private sumItemSubtotal(items: SupplierOrderItemRecord[]): number {
        return items.reduce((total, item) => total + this.lineSubtotal(item), 0);
    }

    private nextOrderItemId(): string {
        const id = `ITM-${String(this.nextOrderItemSequence).padStart(4, "0")}`;
        this.nextOrderItemSequence += 1;
        return id;
    }

    private buildInitialTrace(order: SupplierOrderRecord): OrderTraceRecord[] {
        const requestDate = order.requestDate;

        return [
            {
                timestamp: `${requestDate} 08:05`,
                actor: "Portal de Compras",
                action: "Borrador creado",
                status: "Borrador",
                notes: "Registro inicial del pedido en plataforma.",
            },
            {
                timestamp: `${requestDate} 08:20`,
                actor: "Analista de Compras",
                action: "Solicitud enviada",
                status: "Solicitado",
                notes: "Validacion presupuestal completada.",
            },
            {
                timestamp: `${requestDate} 09:10`,
                actor: order.requestedBy,
                action: "Justificacion aprobada",
                status: "Solicitado",
                notes: `Finalidad registrada: ${order.purpose}.`,
            },
            {
                timestamp: `${requestDate} 11:00`,
                actor: "Coordinacion Logistica",
                action: "Programacion de despacho",
                status: "En transito",
                notes: "Proveedor confirma ventana de salida.",
            },
            {
                timestamp: `${requestDate} 16:30`,
                actor: "Proveedor",
                action: "Guia de transporte emitida",
                status: "En transito",
                notes: "Carga consolidada y en ruta.",
            },
            {
                timestamp: `${requestDate} 18:10`,
                actor: "Bodega",
                action: "Cierre de ciclo",
                status: order.status,
                notes: order.status === "Recibido" ? "Material recibido y verificado." : `Pedido permanece en estado ${order.status}.`,
            },
        ];
    }

    private appendTrace(orderNumber: string, trace: OrderTraceRecord): void {
        const currentTrace = this.orderTraceability[orderNumber] ?? [];
        this.orderTraceability[orderNumber] = [trace, ...currentTrace];
    }

    private currentTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }

    private loadSuppliersFromService(): void {
        this.suppliersCatalog.suppliers$.subscribe((suppliers) => {
            if (suppliers.length > 0) {
                this.suppliers.length = 0;
                for (const s of suppliers) {
                    this.suppliers.push({ id: s.id, supplierNumber: s.supplierNumber, legalName: s.legalName });
                }
            }
        });
    }

    private async loadOrdersFromApi(): Promise<void> {
        try {
            const apiOrders = await this.suppliersApi.listOrders().toPromise();
            if (apiOrders && apiOrders.length > 0) {
                this.orders = apiOrders.map((o) => ({
                    orderNumber: o.orderNumber,
                    supplierId: o.supplierId,
                    requestedBy: o.requestedBy,
                    equipment: o.equipment,
                    purpose: o.purpose,
                    quantity: o.quantity,
                    requestDate: o.requestDate,
                    status: o.status as SupplierOrderStatus,
                }));
                this.seedOrderDetails();
                this.seedTraceability();
            }
        } catch {
            // Keep hardcoded data as fallback
        }
    }
}
