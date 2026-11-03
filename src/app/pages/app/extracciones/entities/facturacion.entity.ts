import { combineLatest, map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { FinanceBillingApiService, FinanceInvoiceRecord } from "../../../../services/finance-billing-api.service";
import { formatDate } from "../row-format.util";

function toRow(invoice: FinanceInvoiceRecord): DataRow {
    return {
        referencia: invoice.referenceCode ?? "",
        cliente: invoice.clientName ?? "",
        proyecto: invoice.projectName ?? "",
        fechaEmision: formatDate(invoice.issueDate),
        vencimiento: formatDate(invoice.dueDate),
        moneda: invoice.currencyCode ?? "COP",
        subtotal: Number(invoice.subtotal ?? 0),
        iva: Number(invoice.taxTotal ?? 0),
        total: Number(invoice.total ?? 0),
        pagado: Number(invoice.paidAmount ?? 0),
        saldoPendiente: Number(invoice.balanceAmount ?? 0),
        estado: invoice.status ?? "",
    };
}

export function createFacturacionEntity(billingApi: FinanceBillingApiService): ExtractionEntityConfig {
    return {
        id: "facturacion",
        label: "Facturación electrónica",
        description: "Facturas emitidas con totales, valores pagados y saldo pendiente.",
        columns: [
            { key: "referencia", label: "Referencia" },
            { key: "cliente", label: "Cliente" },
            { key: "proyecto", label: "Proyecto" },
            { key: "fechaEmision", label: "Fecha de emisión" },
            { key: "vencimiento", label: "Vencimiento" },
            { key: "moneda", label: "Moneda" },
            { key: "subtotal", label: "Subtotal (COP)", type: "money" },
            { key: "iva", label: "IVA (COP)", type: "money" },
            { key: "total", label: "Total (COP)", type: "money" },
            { key: "pagado", label: "Pagado (COP)", type: "money" },
            { key: "saldoPendiente", label: "Saldo pendiente (COP)", type: "money" },
            { key: "estado", label: "Estado" },
        ],
        defaultSelectedKeys: ["referencia", "cliente", "fechaEmision", "total", "pagado", "saldoPendiente"],
        filterFields: [
            { key: "referencia", label: "Referencia" },
            { key: "cliente", label: "Cliente" },
            { key: "proyecto", label: "Proyecto" },
            { key: "moneda", label: "Moneda" },
            { key: "estado", label: "Estado" },
        ],
        load(): Observable<DataRow[]> {
            return billingApi.listInvoices("").pipe(map(items => items.map(toRow)));
        },
    };
}
