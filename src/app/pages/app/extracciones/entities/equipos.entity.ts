import { map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { CrmEquipmentApiService } from "../../../../services/crm-equipment-api.service";
import type { ProspectEquipmentSummary } from "../../crm/crm-prospect-equipment.store";
import { yesNo } from "../row-format.util";

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
        fechaRecepcion: receptionDateIso(item.receptionLabel),
    };
}

/** "dd/mm/aaaa" (formato de receptionLabel) → ISO "aaaa-mm-dd"; "" si no aplica. */
function receptionDateIso(label: string): string {
    const match = String(label ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) {
        return "";
    }
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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
            { key: "fechaRecepcion", label: "Fecha de recepción", type: "date" },
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
            { key: "fechaRecepcion", label: "Fecha de recepción", kind: "date" },
        ],
        load(): Observable<DataRow[]> {
            return equipmentApi.listItems({}).pipe(map(items => items.map(toRow)));
        },
    };
}
