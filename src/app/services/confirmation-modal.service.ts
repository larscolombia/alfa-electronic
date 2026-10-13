import { Injectable, signal } from "@angular/core";

export type ConfirmDialogVariant = "danger" | "warning" | "primary";

export type ConfirmDialogState = {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: ConfirmDialogVariant;
};

export type ConfirmDialogOptions = Partial<ConfirmDialogState> & {
    message: string;
};

@Injectable({ providedIn: "root" })
export class ConfirmationModalService {
    readonly state = signal<ConfirmDialogState | null>(null);

    private pendingResolver: ((confirmed: boolean) => void) | null = null;

    open(options: ConfirmDialogOptions): Promise<boolean> {
        if (this.pendingResolver) {
            this.pendingResolver(false);
            this.pendingResolver = null;
        }

        this.state.set({
            title: options.title ?? "Confirmar accion",
            message: options.message,
            confirmText: options.confirmText ?? "Confirmar",
            cancelText: options.cancelText ?? "Cancelar",
            variant: options.variant ?? "danger",
        });

        return new Promise<boolean>((resolve) => {
            this.pendingResolver = resolve;
        });
    }

    confirm(): void {
        this.resolveAndClose(true);
    }

    cancel(): void {
        this.resolveAndClose(false);
    }

    private resolveAndClose(confirmed: boolean): void {
        const resolver = this.pendingResolver;
        this.pendingResolver = null;
        this.state.set(null);
        resolver?.(confirmed);
    }
}
