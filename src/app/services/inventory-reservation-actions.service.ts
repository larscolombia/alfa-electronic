import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { InventoryApiService } from "./inventory-api.service";
import { InventoryRbacService } from "./inventory-rbac.service";
import { InventoryWorkflowService } from "./inventory-workflow.service";
import { ReferenceCreateOutcome } from "./inventory-edge-api.models";

/**
 * Acciones de reserva con el servidor como fuente de verdad (INV-03/INV-04):
 * renovar y liberar aceptan reservas vencidas (renovar las reactiva con nueva
 * fecha), y consumir siempre consulta al backend para que el mensaje de error
 * ("La reserva esta vencida: renovala o liberela antes de consumirla.") llegue
 * tal cual al usuario.
 */
@Injectable({
    providedIn: "root",
})
export class InventoryReservationActionsService {
    constructor(
        private readonly api: InventoryApiService,
        private readonly rbac: InventoryRbacService,
        private readonly workflow: InventoryWorkflowService
    ) { }

    async release(id: string): Promise<ReferenceCreateOutcome> {
        if (!this.rbac.hasPermission("inventory.reservations.manage")) {
            return { ok: false, message: "No tienes permisos para esta accion (inventory.reservations.manage)." };
        }
        try {
            const response = await firstValueFrom(this.api.releaseReservation(id));
            await this.workflow.loadFromApi();
            return { ok: true, message: response?.message || "Reserva liberada." };
        } catch (error) {
            return { ok: false, message: this.message(error) };
        }
    }

    async extend(id: string): Promise<ReferenceCreateOutcome> {
        if (!this.rbac.hasPermission("inventory.reservations.manage")) {
            return { ok: false, message: "No tienes permisos para esta accion (inventory.reservations.manage)." };
        }
        try {
            const response = await firstValueFrom(this.api.extendReservation(id));
            await this.workflow.loadFromApi();
            const renewed = this.workflow.getSnapshot().reservations.find((item) => item.id === id);
            return {
                ok: true,
                message: response?.message || "Reserva renovada.",
                expiresAt: renewed?.expiresAt,
            };
        } catch (error) {
            return { ok: false, message: this.message(error) };
        }
    }

    async consume(id: string): Promise<ReferenceCreateOutcome> {
        if (!this.rbac.hasPermission("inventory.reservations.manage")) {
            return { ok: false, message: "No tienes permisos para esta accion (inventory.reservations.manage)." };
        }
        try {
            const response = await firstValueFrom(this.api.consumeReservation(id));
            await this.workflow.loadFromApi();
            return { ok: true, message: response?.message || "Consumo confirmado y salida registrada automaticamente." };
        } catch (error) {
            return { ok: false, message: this.message(error) };
        }
    }

    private message(error: unknown): string {
        return error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Error del servidor al procesar la accion.";
    }
}
