import { combineLatest, map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { SuppliersApiService, SupplierOrder } from "../../../../services/suppliers-api.service";
import { formatDate } from "../row-format.util";

function toRow(order: SupplierOrder, supplierNameById: Map<number, string>): DataRow {
    return {
        orden: order.orderNumber ?? "",
        proveedor: order.supplierId ? (supplierNameById.get(order.supplierId) ?? `#${order.supplierId}`) : "",
        equipo: order.equipment ?? "",
        cliente: order.customerName ?? "",
        cantidad: Number(order.quantity ?? 0),
        fechaSolicitud: formatDate(order.requestDate),
        estado: order.status ?? "",
        urgencia: order.urgency ?? "",
    };
}

export function createComprasEntity(suppliersApi: SuppliersApiService): ExtractionEntityConfig {
    return {
        id: "compras",
        label: "Compras y proveedores",
        description: "Órdenes de compra de repuestos con proveedor, equipo y estado del pedido.",
        columns: [
            { key: "orden", label: "N.º orden" },
            { key: "proveedor", label: "Proveedor" },
            { key: "equipo", label: "Equipo / Repuesto" },
            { key: "cliente", label: "Cliente" },
            { key: "cantidad", label: "Cantidad", type: "number" },
            { key: "fechaSolicitud", label: "Fecha de solicitud" },
            { key: "estado", label: "Estado" },
            { key: "urgencia", label: "Urgencia" },
        ],
        defaultSelectedKeys: ["orden", "proveedor", "equipo", "cantidad", "fechaSolicitud", "estado"],
        filterFields: [
            { key: "orden", label: "N.º orden" },
            { key: "proveedor", label: "Proveedor" },
            { key: "equipo", label: "Equipo / Repuesto" },
            { key: "cliente", label: "Cliente" },
            { key: "estado", label: "Estado" },
        ],
        load(): Observable<DataRow[]> {
            return combineLatest([suppliersApi.listOrders(), suppliersApi.listSuppliers()]).pipe(
                map(([orders, suppliers]) => {
                    const nameById = new Map<number, string>(
                        suppliers.map(supplier => [supplier.id, supplier.legalName]),
                    );
                    return orders.map(order => toRow(order, nameById));
                }),
            );
        },
    };
}
