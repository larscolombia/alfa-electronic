export interface OperationResultResponse {
    ok: boolean;
    message: string;
}

export interface ReferenceCreateOutcome {
    ok: boolean;
    message: string;
    /** Mensaje exacto del backend al rechazar por rol tecnico (INV-01). */
    roleRejected?: boolean;
    /** True cuando el backend detecto posible referencia duplicada (INV-06). */
    duplicate?: boolean;
    candidates?: { reference: string; designation: string; similarity: number; reason: string }[];
    /** Reserva de flujo futuro: fecha de vencimiento cuando aplica. */
    expiresAt?: string;
}
