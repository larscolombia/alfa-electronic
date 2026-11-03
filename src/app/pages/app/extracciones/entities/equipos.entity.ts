import { map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { CrmEquipmentApiService } from "../../../../services/crm-equipment-api.service";
import type { ProspectEquipmentSummary } from "../../crm/crm-prospect-equipment.store";
import { formatDate, yesNo } from "../row-format.util";

function toRow(item: ProspectEquipmentSummary): DataRow {
    return {
        codigo: item.equipmentCode ?? "",
        equipo: item.displayName || `${item.marca} ${item.tipo}`.trim(),
        cliente: item.prospectName ?? "",
        marca: item.marca ?? "",
        familia: item.familyName ?? "",
        servicio: item.serviceTypeName ?? "",
        ubicacion: item.storageLocationName ?? "",
        serie: item.serie ?? "",
        estadoReparacion: item.repairStatusLabel ?? "",
        prioridadFacturacion: yesNo(item.priorityBilling),
    };
}

export function createEquiposEntity(equipmentApi: CrmEquipmentApiService): ExtractionEntityConfig {
    return {
        id: "equipos",
        label: "Equipos y servicios",
        description: "Equipos recibidos en taller con su familia, ubicación y estado de reparación.",
        columns: [
            { key: "codigo", label: "Código" },
            { key: "equipo", label: "Equipo" },
            { key: "cliente", label: "Cliente / Prospecto" },
            { key: "marca", label: "Marca" },
            { key: "familia", label: "Familia" },
            { key: "servicio", label: "Tipo de servicio" },
            { key: "ubicacion", label: "Ubicación" },
            { key: "serie", label: "Serie" },
            { key: "estadoReparacion", label: "Estado de reparación" },
            { key: "prioridadFacturacion", label: "Prioridad de facturación" },
        ],
        defaultSelectedKeys: ["codigo", "equipo", "cliente", "servicio", "ubicacion", "estadoReparacion"],
        filterFields: [
            { key: "codigo", label: "Código" },
            { key: "cliente", label: "Cliente / Prospecto" },
            { key: "marca", label: "Marca" },
            { key: "familia", label: "Familia" },
            { key: "servicio", label: "Tipo de servicio" },
            { key: "ubicacion", label: "Ubicación" },
            { key: "estadoReparacion", label: "Estado de reparación" },
        ],
        load(): Observable<DataRow[]> {
            return equipmentApi.listItems({}).pipe(map(items => items.map(toRow)));
        },
    };
}
