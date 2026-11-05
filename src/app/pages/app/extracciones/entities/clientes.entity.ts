import { map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { CrmClientsApiService, CrmClientRecord } from "../../../../services/crm-clients-api.service";
import { yesNo } from "../row-format.util";

function toRow(client: CrmClientRecord): DataRow {
    return {
        nombre: client.nombre || client.empresa || "",
        nit: [client.nit, client.dv].filter(Boolean).join("-"),
        empresa: client.empresa ?? "",
        correo: client.correo ?? "",
        telefono: client.officePhone ?? "",
        ciudad: client.city ?? "",
        pais: client.country ?? "",
        zona: client.zona ?? "",
        direccion: client.address ?? "",
        estado: client.estado ?? "",
        correoFacturacion: client.billingEmail ?? "",
        codigoPostal: client.postalCode ?? "",
        granContribuyente: yesNo(client.grandContributor),
        fechaRegistro: client.creado ?? "",
    };
}

export function createClientesEntity(clientsApi: CrmClientsApiService): ExtractionEntityConfig {
    return {
        id: "clientes",
        label: "Clientes y contactos",
        description: "Fichas de clientes del CRM con datos de contacto, zona fiscal y estado.",
        columns: [
            { key: "nombre", label: "Nombre / Razón social" },
            { key: "nit", label: "NIT" },
            { key: "empresa", label: "Empresa" },
            { key: "correo", label: "Correo electrónico" },
            { key: "telefono", label: "Teléfono" },
            { key: "ciudad", label: "Ciudad" },
            { key: "pais", label: "País" },
            { key: "zona", label: "Zona" },
            { key: "direccion", label: "Dirección" },
            { key: "estado", label: "Estado" },
            { key: "correoFacturacion", label: "Correo de facturación" },
            { key: "codigoPostal", label: "Código postal" },
            { key: "granContribuyente", label: "Gran contribuyente" },
            { key: "fechaRegistro", label: "Fecha de registro", type: "date" },
        ],
        defaultSelectedKeys: ["nombre", "nit", "empresa", "correo", "ciudad", "estado"],
        filterFields: [
            { key: "nombre", label: "Nombre o razón social" },
            { key: "nit", label: "NIT" },
            { key: "empresa", label: "Empresa" },
            { key: "correo", label: "Correo electrónico" },
            { key: "ciudad", label: "Ciudad" },
            { key: "pais", label: "País" },
            { key: "zona", label: "Zona" },
            { key: "estado", label: "Estado" },
            { key: "fechaRegistro", label: "Fecha de registro de la empresa", kind: "date" },
        ],
        load(): Observable<DataRow[]> {
            return clientsApi.listClients({ limit: 500 }).pipe(map(items => items.map(toRow)));
        },
    };
}
