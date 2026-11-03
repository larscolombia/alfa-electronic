import { map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { CrmQuotesApiService, CrmQuoteRecord } from "../../../../services/crm-quotes-api.service";
import { formatDate } from "../row-format.util";

function toRow(quote: CrmQuoteRecord): DataRow {
    return {
        codigo: quote.codigo ?? "",
        prospecto: quote.prospecto ?? "",
        correo: quote.correo ?? "",
        fecha: formatDate(quote.fecha),
        validoHasta: formatDate(quote.validoHasta),
        estado: quote.estado ?? "",
        decisionCliente: quote.estadoCliente ?? "",
        moneda: quote.moneda ?? "COP",
        subtotal: Number(quote.subtotal ?? 0),
        iva: Number(quote.taxTotal ?? 0),
        total: Number(quote.total ?? 0),
        descuento: Number(quote.descuentoValor ?? 0),
        firmadoPor: quote.firmadoPor ?? "",
    };
}

export function createCotizacionesEntity(quotesApi: CrmQuotesApiService): ExtractionEntityConfig {
    return {
        id: "cotizaciones",
        label: "Cotizaciones comerciales",
        description: "Cotizaciones emitidas con totales, estado comercial y decisión del cliente.",
        columns: [
            { key: "codigo", label: "Código" },
            { key: "prospecto", label: "Prospecto" },
            { key: "correo", label: "Correo" },
            { key: "fecha", label: "Fecha de emisión" },
            { key: "validoHasta", label: "Válida hasta" },
            { key: "estado", label: "Estado" },
            { key: "decisionCliente", label: "Decisión del cliente" },
            { key: "moneda", label: "Moneda" },
            { key: "subtotal", label: "Subtotal (COP)", type: "money" },
            { key: "iva", label: "IVA (COP)", type: "money" },
            { key: "total", label: "Total (COP)", type: "money" },
            { key: "descuento", label: "Descuento", type: "money" },
            { key: "firmadoPor", label: "Firmado por" },
        ],
        defaultSelectedKeys: ["codigo", "prospecto", "fecha", "total", "estado"],
        filterFields: [
            { key: "codigo", label: "Código" },
            { key: "prospecto", label: "Prospecto" },
            { key: "correo", label: "Correo" },
            { key: "estado", label: "Estado comercial" },
            { key: "decisionCliente", label: "Decisión del cliente" },
            { key: "moneda", label: "Moneda" },
        ],
        load(): Observable<DataRow[]> {
            return quotesApi.listQuotes({ limit: 500 }).pipe(map(items => items.map(toRow)));
        },
    };
}
