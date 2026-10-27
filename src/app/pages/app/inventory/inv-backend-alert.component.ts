import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { InventoryWorkflowService } from "../../../services/inventory-workflow.service";

/**
 * Muestra el ultimo error real devuelto por el backend en operaciones
 * asincronas (fire-and-forget del workflow). El data-testid depende del tipo
 * de error para que Playwright pueda apuntar al caso concreto:
 *   - inv-role-rejected-alert          (INV-01, 403 rol tecnico)
 *   - inv-insufficient-stock-alert     (INV-02, stock disponible/requerido)
 *   - inv-used-test-required-alert     (INV-07, usado sin prueba aprobada)
 *   - inv-backend-error-alert          (cualquier otro error del servidor)
 */
@Component({
    selector: "app-inv-backend-alert",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div
            *ngIf="message"
            class="alert alert-danger border alert-dismissible mb-3"
            [attr.data-testid]="testId"
            role="alert"
        >
            {{ message }}
            <button type="button" class="btn-close" aria-label="Cerrar" (click)="message = ''"></button>
        </div>
    `,
})
export class InvBackendAlertComponent implements OnInit, OnDestroy {
    message = "";
    private readonly subscriptions = new Subscription();

    constructor(private readonly inventoryWorkflow: InventoryWorkflowService) { }

    ngOnInit(): void {
        this.subscriptions.add(
            this.inventoryWorkflow.asyncError$.subscribe((message) => {
                this.message = message.replace(/^Error del servidor:\s*/, "");
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    get testId(): string {
        const text = this.message;
        if (text.includes("rol tecnico no autorizado")) {
            return "inv-role-rejected-alert";
        }
        if (text.includes("No hay stock suficiente")) {
            return "inv-insufficient-stock-alert";
        }
        if (text.includes("componente usado requiere prueba")) {
            return "inv-used-test-required-alert";
        }
        return "inv-backend-error-alert";
    }
}
