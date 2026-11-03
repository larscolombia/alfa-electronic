import { map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { InventoryApiService } from "../../../../services/inventory-api.service";
import type { StockReference } from "../../../../services/inventory-domain.models";
import { yesNo } from "../row-format.util";

function toRow(ref: StockReference): DataRow {
    return {
        referencia: ref.reference ?? "",
        designacion: ref.designation ?? "",
        marca: ref.brand ?? "",
        familia: ref.family ?? "",
        subfamilia: ref.subfamily ?? "",
        ubicacion: ref.location ?? "",
        stockActual: Number(ref.currentStock ?? 0),
        stockMinimo: Number(ref.minStock ?? 0),
        stockMeta: Number(ref.targetStock ?? 0),
        condicion: ref.condition ?? "",
        criticidad: ref.criticality ?? "",
        proveedorPreferido: ref.preferredSupplierName ?? "",
        unidadMedida: ref.unitMeasure ?? "",
    };
}

export function createInventarioEntity(inventoryApi: InventoryApiService): ExtractionEntityConfig {
    return {
        id: "inventario",
        label: "Inventario y stock",
        description: "Referencias de repuestos con stock actual, mínimo, ubicación y criticidad.",
        columns: [
            { key: "referencia", label: "Referencia" },
            { key: "designacion", label: "Designación" },
            { key: "marca", label: "Marca" },
            { key: "familia", label: "Familia" },
            { key: "subfamilia", label: "Subfamilia" },
            { key: "ubicacion", label: "Ubicación" },
            { key: "stockActual", label: "Stock actual", type: "number" },
            { key: "stockMinimo", label: "Stock mínimo", type: "number" },
            { key: "stockMeta", label: "Stock meta", type: "number" },
            { key: "condicion", label: "Condición" },
            { key: "criticidad", label: "Criticidad" },
            { key: "proveedorPreferido", label: "Proveedor preferido" },
            { key: "unidadMedida", label: "Unidad de medida" },
        ],
        defaultSelectedKeys: ["referencia", "designacion", "marca", "familia", "ubicacion", "stockActual"],
        filterFields: [
            { key: "referencia", label: "Referencia" },
            { key: "designacion", label: "Designación" },
            { key: "marca", label: "Marca" },
            { key: "familia", label: "Familia" },
            { key: "ubicacion", label: "Ubicación" },
            { key: "condicion", label: "Condición" },
            { key: "criticidad", label: "Criticidad" },
        ],
        load(): Observable<DataRow[]> {
            return inventoryApi.listReferences().pipe(map(items => items.map(toRow)));
        },
    };
}
