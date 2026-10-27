import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { InventoryRbacService } from "../../../services/inventory-rbac.service";

/**
 * INV-01: aviso preventivo cuando el rol operativo derivado del JWT es
 * "tecnico". El selector visual de rol no existe: este componente solo lee
 * el rol que InventoryRbacService deriva del perfil autenticado.
 */
@Component({
    selector: "app-inv-role-hint",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            *ngIf="isTechnician"
            class="alert alert-warning border mb-3"
            data-testid="inv-role-blocked-hint"
            role="note"
        >
            <i class="bi bi-shield-lock me-1"></i>
            <strong>Rol tecnico (segun tu sesion):</strong>
            no puedes crear fichas de catalogo, registrar entradas de stock ni solicitar
            ajustes de stock. Para incorporar material usa una reserva o pide al
            responsable de inventario que cree la ficha o registre la entrada.
        </div>
    `,
})
export class InvRoleHintComponent {
    constructor(private readonly inventoryRbac: InventoryRbacService) { }

    get isTechnician(): boolean {
        return this.inventoryRbac.currentRole === "tecnico";
    }
}
