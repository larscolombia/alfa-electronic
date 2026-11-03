import { forkJoin, map, Observable } from "rxjs";

import { ExtractionEntityConfig, DataRow } from "../extractions.model";
import { FinanceBillingApiService, FinancePortfolioItem } from "../../../../services/finance-billing-api.service";
import { FinancePaymentsApiService, FinancePaymentRecord } from "../../../../services/finance-payments-api.service";
import { formatDate, yesNo } from "../row-format.util";

interface DatedRow {
    row: DataRow;
    sortIso: string;
}

function carteraRows(items: FinancePortfolioItem[]): DatedRow[] {
    return items.map(item => ({
        row: {
            fuente: "Cartera",
            referencia: item.referenceCode ?? "",
            cliente: item.clientName ?? "",
            monto: Number(item.total ?? 0),
            saldoPendiente: Number(item.balanceAmount ?? 0),
            fecha: formatDate(item.dueDate),
            estado: item.status ?? "",
            vencido: yesNo(item.overdue),
            retencion: "",
        } satisfies DataRow,
        sortIso: item.dueDate ?? "",
    }));
}

function pagoRows(items: FinancePaymentRecord[]): DatedRow[] {
    return items.map(payment => ({
        row: {
            fuente: "Pago",
            referencia: payment.code ?? String(payment.id),
            cliente: payment.client ?? "",
            monto: Number(payment.amount ?? 0),
            saldoPendiente: "",
            fecha: formatDate(payment.paymentDate || payment.paidAt),
            estado: payment.status ?? "",
            vencido: "",
            retencion: Number(payment.reteFuente ?? 0),
        } satisfies DataRow,
        sortIso: payment.paymentDate || payment.paidAt || "",
    }));
}

export function createCarteraPagosEntity(
    billingApi: FinanceBillingApiService,
    paymentsApi: FinancePaymentsApiService,
): ExtractionEntityConfig {
    return {
        id: "cartera",
        label: "Cartera y pagos",
        description: "Saldo de cartera por factura y pagos registrados con retenciones.",
        columns: [
            { key: "fuente", label: "Fuente" },
            { key: "referencia", label: "Referencia" },
            { key: "cliente", label: "Cliente" },
            { key: "monto", label: "Monto (COP)", type: "money" },
            { key: "saldoPendiente", label: "Saldo pendiente (COP)", type: "money" },
            { key: "fecha", label: "Fecha (vencimiento / pago)" },
            { key: "estado", label: "Estado" },
            { key: "vencido", label: "Vencido" },
            { key: "retencion", label: "Retención en la fuente (COP)", type: "money" },
        ],
        defaultSelectedKeys: ["fuente", "referencia", "cliente", "monto", "saldoPendiente", "fecha", "estado"],
        filterFields: [
            { key: "fuente", label: "Fuente (Cartera / Pago)" },
            { key: "referencia", label: "Referencia" },
            { key: "cliente", label: "Cliente" },
            { key: "estado", label: "Estado" },
        ],
        load(): Observable<DataRow[]> {
            return forkJoin({
                cartera: billingApi.getPortfolio(""),
                pagos: paymentsApi.listPayments(),
            }).pipe(
                map(({ cartera, pagos }) => {
                    const dated = [...carteraRows(cartera), ...pagoRows(pagos)];
                    dated.sort((a, b) => (b.sortIso || "").localeCompare(a.sortIso || ""));
                    return dated.map(entry => entry.row);
                }),
            );
        },
    };
}
