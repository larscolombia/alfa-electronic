import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { InventoryApiService } from "./inventory-api.service";
import { InventoryEdgeApiService } from "./inventory-edge-api.service";
import { InventoryWorkflowService } from "./inventory-workflow.service";
import { ReferenceCreateOutcome } from "./inventory-edge-api.models";

const DUPLICATE_MESSAGE_MARKER = "Posible referencia duplicada";
const ROLE_REJECTED_MARKER = "rol tecnico no autorizado";

/**
 * Alta de ficha con el servidor como fuente de verdad (INV-06): el chequeo de
 * duplicados lo hace el backend y, si lo detecta, se listan los candidatos reales
 * para decidir entre forzar (con motivo obligatorio) o usar entrada a stock.
 */
@Injectable({
    providedIn: "root",
})
export class InventoryReferenceCreateService {
    constructor(
        private readonly api: InventoryApiService,
        private readonly edge: InventoryEdgeApiService,
        private readonly workflow: InventoryWorkflowService
    ) { }

    async create(payload: Record<string, unknown>): Promise<ReferenceCreateOutcome> {
        try {
            const response = await firstValueFrom(this.api.createReference(payload));
            await this.workflow.loadFromApi();
            return { ok: true, message: response?.result?.message || `Ficha ${String(payload["reference"] ?? "")} creada correctamente.` };
        } catch (error) {
            return await this.handleCreateError(payload, error);
        }
    }

    private async handleCreateError(payload: Record<string, unknown>, error: unknown): Promise<ReferenceCreateOutcome> {
        const message = error instanceof Error ? error.message : String(error ?? "");
        if (message.includes(ROLE_REJECTED_MARKER)) {
            return { ok: false, message, roleRejected: true };
        }
        if (message.includes(DUPLICATE_MESSAGE_MARKER)) {
            const candidates = await this.fetchCandidates(payload);
            return { ok: false, message, duplicate: true, candidates };
        }
        return { ok: false, message: message || "No se pudo crear la ficha." };
    }

    private async fetchCandidates(payload: Record<string, unknown>) {
        try {
            return await firstValueFrom(
                this.edge.checkDuplicates({
                    reference: String(payload["reference"] ?? ""),
                    designation: String(payload["designation"] ?? ""),
                    internalCode: String(payload["internalCode"] ?? ""),
                    supplier: String(payload["preferredSupplierName"] ?? payload["supplierCode"] ?? ""),
                })
            );
        } catch {
            return [];
        }
    }
}
