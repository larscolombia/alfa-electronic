import { Injectable } from "@angular/core";
import { BehaviorSubject, firstValueFrom, Observable, Subject } from "rxjs";
import {
    AdjustmentRequest,
    AuditEvent,
    CountSession,
    DiscrepancyRecord,
    DuplicateReferenceCandidate,
    InventoryOperationResult,
    InventoryPermission,
    InventoryRole,
    InventoryState,
    MovementRecord,
    MovementType,
    PurchaseLine,
    ReplenishmentItem,
    ReservationRecord,
    StockReference,
    TechnicianBagTrace,
    WeeklyShortageSnapshot,
} from "./inventory-domain.models";
import { InventoryRbacService } from "./inventory-rbac.service";
import { normalizeSearchToken } from "./parts.logic";
import { InventoryApiService } from "./inventory-api.service";

@Injectable({
    providedIn: "root",
})
export class InventoryWorkflowService {
    private readonly stateSubject = new BehaviorSubject<InventoryState>(this.emptyState());
    readonly state$ = this.stateSubject.asObservable();

    /**
     * Errores reales devueltos por el backend en operaciones fire-and-forget.
     * Los componentes suscritos pueden mostrar el mensaje real al usuario
     * en lugar de solo el resultado optimista local.
     */
    private readonly asyncErrorSubject = new Subject<string>();
    readonly asyncError$ = this.asyncErrorSubject.asObservable();

    private state: InventoryState = this.emptyState();
    private loaded = false;
    private loading = false;

    constructor(
        private readonly inventoryRbac: InventoryRbacService,
        private readonly api: InventoryApiService,
    ) {
        this.loadFromApi();
    }

    async loadFromApi(): Promise<void> {
        if (this.loading) {
            return;
        }
        this.loading = true;
        try {
            const response = await this.api.getFullState().toPromise();
            if (response) {
                this.state = {
                    references: response.references ?? [],
                    movements: response.movements ?? [],
                    adjustmentRequests: response.adjustmentRequests ?? [],
                    reservations: response.reservations ?? [],
                    maxReserveDays: response.maxReserveDays ?? 5,
                    replenishmentItems: response.replenishmentItems ?? [],
                    purchaseLines: response.purchaseLines ?? [],
                    weeklySnapshots: response.weeklySnapshots ?? [],
                    bagTraces: response.bagTraces ?? [],
                    sessions: response.sessions ?? [],
                    discrepancies: response.discrepancies ?? [],
                    auditTrail: response.auditTrail ?? [],
                };
                this.loaded = true;
                this.emitState();
            }
        } catch {
            // If API fails, keep current state (empty or previously loaded)
        } finally {
            this.loading = false;
        }
    }

    private async refreshFromApi(): Promise<void> {
        try {
            const response = await this.api.getFullState().toPromise();
            if (response) {
                this.state = {
                    references: response.references ?? [],
                    movements: response.movements ?? [],
                    adjustmentRequests: response.adjustmentRequests ?? [],
                    reservations: response.reservations ?? [],
                    maxReserveDays: response.maxReserveDays ?? 5,
                    replenishmentItems: response.replenishmentItems ?? [],
                    purchaseLines: response.purchaseLines ?? [],
                    weeklySnapshots: response.weeklySnapshots ?? [],
                    bagTraces: response.bagTraces ?? [],
                    sessions: response.sessions ?? [],
                    discrepancies: response.discrepancies ?? [],
                    auditTrail: response.auditTrail ?? [],
                };
                this.emitState();
            }
        } catch {
            // Silently fail on refresh
        }
    }

    getSnapshot(): InventoryState {
        return this.cloneState(this.state);
    }

    syncState(): void {
        // No-op: state is synced from API
    }

    // ─── DUPLICATE DETECTION ─────────────────────────────────────────────────

    findDuplicateReferenceCandidates(reference: string, designation: string): DuplicateReferenceCandidate[] {
        const normalizedReference = this.normalizeToken(reference);
        const normalizedDesignation = this.normalizeToken(designation);

        if (!normalizedReference) {
            return [];
        }

        return this.state.references
            .map((item) => {
                const itemReference = this.normalizeToken(item.reference);
                const itemDesignation = this.normalizeToken(item.designation);

                const exactMatch = itemReference === normalizedReference;
                const referenceSimilarity = this.similarity(itemReference, normalizedReference);
                const designationSimilarity = normalizedDesignation ? this.similarity(itemDesignation, normalizedDesignation) : 0;
                const startsWithMatch = itemReference.startsWith(normalizedReference) || normalizedReference.startsWith(itemReference);

                const score = exactMatch
                    ? 1
                    : Math.max(
                        referenceSimilarity,
                        startsWithMatch ? 0.9 : 0,
                        normalizedDesignation ? (referenceSimilarity + designationSimilarity) / 2 : 0
                    );

                if (score < 0.72) {
                    return undefined;
                }

                let reason = "Referencia similar";
                if (exactMatch) {
                    reason = "Coincidencia exacta";
                } else if (startsWithMatch) {
                    reason = "Prefijo/sufijo similar";
                } else if (designationSimilarity >= 0.8) {
                    reason = "Designacion con alta similitud";
                }

                return {
                    reference: item.reference,
                    designation: item.designation,
                    similarity: Number(score.toFixed(2)),
                    reason,
                } as DuplicateReferenceCandidate;
            })
            .filter((item): item is DuplicateReferenceCandidate => !!item)
            .sort((left, right) => right.similarity - left.similarity)
            .slice(0, 5);
    }

    // ─── REFERENCES ──────────────────────────────────────────────────────────

    createReference(payload: {
        reference: string;
        internalCode: string;
        manufacturerReference: string;
        designation: string;
        family: string;
        subfamily: string;
        brand: string;
        location: string;
        unitMeasure: string;
        compatibleEquipment: string;
        criticality: "alta" | "media" | "baja";
        preferredSupplierName: string;
        leadTimeDays: number;
        technicalNotes: string;
        supplierCode: string;
        minStock: number;
        targetStock: number;
    }): InventoryOperationResult {
        if (!this.hasPermission("inventory.stock.create-card")) {
            return this.permissionDenied("inventory.stock.create-card");
        }

        const reference = payload.reference.trim();
        const designation = payload.designation.trim();

        if (!reference || !designation) {
            return { ok: false, message: "Referencia y designacion son obligatorias." };
        }

        const duplicate = this.findDuplicateReferenceCandidates(reference, designation).find((item) => item.similarity >= 0.9);
        if (duplicate) {
            return {
                ok: false,
                message: `Ya existe una referencia muy similar (${duplicate.reference}). Usa la opcion de entrada a stock o corrige la nueva referencia.`,
            };
        }

        // Optimistic local update
        const newRef: StockReference = {
            reference,
            internalCode: payload.internalCode.trim() || this.generateInternalCode(payload.family.trim() || "Sin familia"),
            manufacturerReference: payload.manufacturerReference.trim(),
            designation,
            family: payload.family.trim() || "Sin familia",
            subfamily: payload.subfamily.trim(),
            brand: payload.brand.trim() || "Sin marca",
            location: payload.location.trim() || "Sin ubicacion",
            unitMeasure: payload.unitMeasure.trim() || "unidad",
            compatibleEquipment: payload.compatibleEquipment.trim(),
            criticality: payload.criticality,
            preferredSupplierName: payload.preferredSupplierName.trim(),
            leadTimeDays: Math.max(0, Math.floor(payload.leadTimeDays || 0)),
            technicalNotes: payload.technicalNotes.trim(),
            supplierCode: payload.supplierCode.trim() || "Sin codigo",
            currentStock: 0,
            minStock: Math.max(0, Math.floor(payload.minStock || 0)),
            targetStock: Math.max(0, Math.floor(payload.targetStock || 0)),
        };

        this.state.references = [newRef, ...this.state.references];
        this.emitState();

        // Async API call + refresh
        this.fireAndRefresh(this.api.createReference(payload as unknown as Record<string, unknown>));

        return { ok: true, message: `Ficha ${reference} creada correctamente.` };
    }

    // ─── STOCK ENTRY ─────────────────────────────────────────────────────────

    registerStockEntry(payload: {
        reference: string;
        quantity: number;
        location: string;
        supplierName: string;
        supplierCode: string;
        documentType: string;
        documentNumber: string;
        batchOrSerial: string;
        receivedBy: string;
        unitCost: number;
        receivedAt: string;
    }): InventoryOperationResult {
        if (!this.hasPermission("inventory.stock.register-entry") && !this.hasPermission("inventory.movements.register-entry")) {
            return this.permissionDenied("inventory.stock.register-entry");
        }

        const reference = payload.reference.trim();
        const quantity = Math.floor(payload.quantity);

        if (!reference || !Number.isFinite(quantity) || quantity <= 0) {
            return { ok: false, message: "Selecciona una referencia y una cantidad valida." };
        }

        const exists = this.state.references.some((item) => item.reference === reference);
        if (!exists) {
            return { ok: false, message: "No se encontro la referencia seleccionada." };
        }

        // Optimistic local update
        const target = this.state.references.find((item) => item.reference === reference);
        if (target) {
            target.currentStock += quantity;
            if (payload.location.trim()) {
                target.location = payload.location.trim();
            }
        }

        const supplierLabel = this.formatSupplierLabel(payload.supplierCode.trim(), payload.supplierName.trim()) || "Proveedor no informado";
        const mov: MovementRecord = {
            id: this.buildId("mov"),
            type: "entrada",
            reference,
            quantity,
            reason: `Entrada por ${payload.documentType || "documento"} ${payload.documentNumber || "sin numero"}`,
            workOrder: "",
            equipmentTag: "",
            customerSite: supplierLabel,
            movementCategory: "recepcion-stock",
            evidenceRef: `${payload.receivedBy || this.actorLabel()}`,
            requestedBy: this.actorLabel(),
            requestedAt: new Date().toISOString(),
        };
        this.state.movements = [mov, ...this.state.movements];
        this.emitState();

        this.fireAndRefresh(this.api.registerStockEntry(payload as unknown as Record<string, unknown>));

        return { ok: true, message: `Entrada registrada: ${quantity} unidad(es) en ${reference}.` };
    }

    // ─── MOVEMENTS ───────────────────────────────────────────────────────────

    submitMovement(payload: {
        type: MovementType;
        reference: string;
        quantity: number;
        reason: string;
        workOrder: string;
        equipmentTag: string;
        customerSite: string;
        movementCategory: string;
        evidenceRef: string;
    }): InventoryOperationResult {
        const reference = payload.reference.trim();
        const reason = payload.reason.trim();
        const quantity = Math.floor(payload.quantity);

        if (!reference || !reason || !Number.isFinite(quantity) || quantity <= 0) {
            return { ok: false, message: "Completa referencia, motivo y cantidad valida." };
        }

        if (!this.state.references.some((item) => item.reference === reference)) {
            return { ok: false, message: "La referencia indicada no existe en el catalogo." };
        }

        const permission = this.permissionForMovement(payload.type);

        if (!this.hasPermission(permission)) {
            if (payload.type === "entrada" || payload.type === "ajuste") {
                // Create adjustment request
                const req: AdjustmentRequest = {
                    id: this.buildId("req"),
                    type: payload.type as "entrada" | "ajuste",
                    reference,
                    quantity,
                    reason,
                    workOrder: payload.workOrder.trim(),
                    equipmentTag: payload.equipmentTag.trim(),
                    customerSite: payload.customerSite.trim(),
                    movementCategory: payload.movementCategory.trim(),
                    evidenceRef: payload.evidenceRef.trim(),
                    requestedBy: this.actorLabel(),
                    requestedAt: new Date().toISOString(),
                    status: "pendiente",
                    approvedBy: "",
                    approvedAt: "",
                };
                this.state.adjustmentRequests = [req, ...this.state.adjustmentRequests];
                this.emitState();

                this.fireAndRefresh(this.api.createAdjustmentRequest(payload as unknown as Record<string, unknown>));

                return { ok: true, message: "Solicitud enviada para aprobacion del responsable de inventario." };
            }
            return this.permissionDenied(permission);
        }

        const currentRef = this.state.references.find((item) => item.reference === reference);
        if (!currentRef) {
            return { ok: false, message: "La referencia indicada no existe en el catalogo." };
        }

        if (payload.type === "salida" && currentRef.currentStock < quantity) {
            return { ok: false, message: "No hay stock suficiente para procesar la salida solicitada." };
        }

        // Optimistic local update
        this.applyMovementLocal(currentRef, payload.type, quantity);

        const mov: MovementRecord = {
            id: this.buildId("mov"),
            type: payload.type,
            reference,
            quantity,
            reason,
            workOrder: payload.workOrder.trim(),
            equipmentTag: payload.equipmentTag.trim(),
            customerSite: payload.customerSite.trim(),
            movementCategory: payload.movementCategory.trim(),
            evidenceRef: payload.evidenceRef.trim(),
            requestedBy: this.actorLabel(),
            requestedAt: new Date().toISOString(),
        };
        this.state.movements = [mov, ...this.state.movements];
        this.emitState();

        this.fireAndRefresh(this.api.submitMovement(payload as unknown as Record<string, unknown>));

        return { ok: true, message: "Movimiento registrado correctamente." };
    }

    approveMovementRequest(requestId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.movements.approve")) {
            return this.permissionDenied("inventory.movements.approve");
        }

        const existing = this.state.adjustmentRequests.find((item) => item.id === requestId);
        if (!existing || existing.status !== "pendiente") {
            return { ok: false, message: "La solicitud no existe o ya fue aprobada." };
        }

        const currentRef = this.state.references.find((item) => item.reference === existing.reference);
        if (!currentRef) {
            return { ok: false, message: "La referencia de la solicitud ya no existe." };
        }

        if (currentRef.currentStock < existing.quantity && existing.type !== "entrada") {
            return { ok: false, message: "No hay stock suficiente para aplicar el movimiento aprobado." };
        }

        // Optimistic
        existing.status = "aprobada";
        existing.approvedBy = this.actorLabel();
        existing.approvedAt = new Date().toISOString();
        this.applyMovementLocal(currentRef, existing.type as MovementType, existing.quantity);
        this.emitState();

        this.fireAndRefresh(this.api.approveMovementRequest(requestId));

        return { ok: true, message: "Solicitud aprobada y movimiento aplicado." };
    }

    // ─── RESERVATIONS ────────────────────────────────────────────────────────

    setMaxReserveDays(days: number): InventoryOperationResult {
        if (!this.hasPermission("inventory.reservations.manage")) {
            return this.permissionDenied("inventory.reservations.manage");
        }

        const safeDays = Math.max(1, Math.floor(days));
        this.state.maxReserveDays = safeDays;
        this.emitState();

        this.fireAndRefresh(this.api.setMaxReserveDays(safeDays));

        return { ok: true, message: `Politica de reserva actualizada a ${safeDays} dia(s).` };
    }

    // Server-first: la reserva solo existe cuando el backend la persistio.
    // Devuelve el ID real de servidor (reservationId) para que los llamadores
    // nunca guarden identidades locales huérfanas en sus propiedades.
    async createReservation(payload: {
        reference: string;
        quantity: number;
        assignedTo: string;
        purpose: string;
        workOrder: string;
        equipmentTag: string;
        customerSite: string;
        priority: "critica" | "alta" | "media" | "baja";
        commitmentDate: string;
    }): Promise<InventoryOperationResult & { reservationId?: string }> {
        if (!this.hasPermission("inventory.reservations.manage")) {
            return this.permissionDenied("inventory.reservations.manage");
        }

        const reference = payload.reference.trim();
        const assignedTo = payload.assignedTo.trim();
        const purpose = payload.purpose.trim();
        const quantity = Math.floor(payload.quantity);

        if (!reference || !assignedTo || !purpose || !Number.isFinite(quantity) || quantity <= 0) {
            return { ok: false, message: "Completa referencia, tecnico, motivo y cantidad valida." };
        }

        if (!this.state.references.some((item) => item.reference === reference)) {
            return { ok: false, message: "La referencia de la reserva no existe." };
        }

        const clientReservationId = this.buildId("res");
        try {
            // Espera real al servidor; el backend valida stock y respeta esta identidad (idempotencia ante reintentos).
            const response = await firstValueFrom(
                this.api.createReservation({ ...payload, reference, assignedTo, purpose, quantity, id: clientReservationId }),
            );
            await this.refreshFromApi();
            return { ok: true, message: response.message || "Reserva creada correctamente.", reservationId: response.reservation?.id };
        } catch (error) {
            // Rechazo real del servidor (p.ej. stock insuficiente): sin mutacion local y error accionable para el usuario.
            return { ok: false, message: this.backendErrorMessage(error) };
        }
    }

    async releaseReservation(reservationId: string): Promise<InventoryOperationResult> {
        if (!this.hasPermission("inventory.reservations.manage")) {
            return this.permissionDenied("inventory.reservations.manage");
        }

        const target = this.state.reservations.find((item) => item.id === reservationId);
        if (target && target.status !== "activa") {
            return { ok: false, message: "La reserva no esta activa o no existe." };
        }

        try {
            const response = await firstValueFrom(this.api.releaseReservation(reservationId));
            await this.refreshFromApi();
            return { ok: true, message: response.message || "Reserva liberada." };
        } catch (error) {
            return { ok: false, message: this.backendErrorMessage(error) };
        }
    }

    async extendReservation(reservationId: string): Promise<InventoryOperationResult> {
        if (!this.hasPermission("inventory.reservations.manage")) {
            return this.permissionDenied("inventory.reservations.manage");
        }

        const target = this.state.reservations.find((item) => item.id === reservationId);
        if (target && target.status !== "activa") {
            return { ok: false, message: "La reserva no esta activa o no existe." };
        }

        try {
            const response = await firstValueFrom(this.api.extendReservation(reservationId));
            await this.refreshFromApi();
            return { ok: true, message: response.message || "Reserva renovada." };
        } catch (error) {
            return { ok: false, message: this.backendErrorMessage(error) };
        }
    }

    async consumeReservation(reservationId: string): Promise<InventoryOperationResult> {
        if (!this.hasPermission("inventory.reservations.manage")) {
            return this.permissionDenied("inventory.reservations.manage");
        }

        const reservation = this.state.reservations.find((r) => r.id === reservationId);
        if (reservation && reservation.status !== "activa") {
            return { ok: false, message: "Solo se pueden consumir reservas activas." };
        }

        try {
            // El servidor baja stock y registra el movimiento de salida; solo se declara éxito cuando eso ya ocurrió en BD.
            const response = await firstValueFrom(this.api.consumeReservation(reservationId));
            await this.refreshFromApi();
            return { ok: true, message: response.message || "Consumo confirmado y salida registrada automaticamente." };
        } catch (error) {
            return { ok: false, message: this.backendErrorMessage(error) };
        }
    }

    // ─── REPLENISHMENT ───────────────────────────────────────────────────────

    registerReplenishmentAttempt(payload: {
        reference: string;
        supplier: string;
        alternateSupplier: string;
        estimatedLeadDays: number;
        quotedUnitCost: number;
        resultNote: string;
        procurementOwner: string;
    }): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.manage")) {
            return this.permissionDenied("inventory.replenishment.manage");
        }

        const reference = payload.reference.trim();
        const target = this.state.replenishmentItems.find((item) => item.reference === reference);
        if (!target || target.status === "obsoleto") {
            return { ok: false, message: "El item no existe o ya esta marcado como obsoleto." };
        }

        target.attempts += 1;
        target.lastAttemptAt = new Date().toISOString();
        target.status = target.attempts >= 3 ? "escalar" : "en-gestion";
        if (payload.supplier.trim()) target.supplier = payload.supplier.trim();
        if (payload.alternateSupplier.trim()) target.alternateSupplier = payload.alternateSupplier.trim();
        if (payload.procurementOwner.trim()) target.procurementOwner = payload.procurementOwner.trim();
        if (payload.estimatedLeadDays > 0) target.estimatedLeadDays = payload.estimatedLeadDays;
        if (payload.quotedUnitCost > 0) target.lastQuotedUnitCost = payload.quotedUnitCost;
        if (payload.resultNote.trim()) target.shortageReason = payload.resultNote.trim();
        this.emitState();

        this.fireAndRefresh(this.api.registerReplenishmentAttempt(payload as unknown as Record<string, unknown>));

        return { ok: true, message: "Intento de compra registrado." };
    }

    markReplenishmentObsolete(reference: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.manage")) {
            return this.permissionDenied("inventory.replenishment.manage");
        }

        const target = this.state.replenishmentItems.find((item) => item.reference === reference);
        if (!target) {
            return { ok: false, message: "El item no existe o ya esta marcado como obsoleto." };
        }

        target.status = "obsoleto";
        this.emitState();

        this.fireAndRefresh(this.api.markReplenishmentObsolete(reference));

        return { ok: true, message: "Referencia marcada como obsoleta." };
    }

    createPurchaseLine(payload: {
        reference: string;
        component: string;
        type: string;
        brand: string;
        description: string;
        supplier: string;
        quantity: number;
        unitPrice: number;
        neededBy: string;
        requestReason: string;
        projectId: string;
        equipmentTag: string;
    }): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.manage")) {
            return this.permissionDenied("inventory.replenishment.manage");
        }

        const reference = payload.reference.trim();
        if (!reference) {
            return { ok: false, message: "La referencia es obligatoria." };
        }
        if (payload.quantity < 1) {
            return { ok: false, message: "La cantidad debe ser al menos 1." };
        }

        const now = new Date().toISOString();
        const line: PurchaseLine = {
            id: this.buildId("po"),
            reference,
            component: payload.component.trim(),
            type: payload.type.trim(),
            brand: payload.brand.trim(),
            description: payload.description.trim(),
            supplier: payload.supplier.trim(),
            quantity: payload.quantity,
            unitPrice: payload.unitPrice,
            neededBy: payload.neededBy.trim(),
            source: "manual",
            requestReason: payload.requestReason.trim(),
            generatedAt: now,
            generatedBy: this.actorLabel(),
            status: "pendiente",
        };

        this.state.purchaseLines = [line, ...this.state.purchaseLines];
        this.emitState();

        this.fireAndRefresh(
            this.api.createPurchaseLine({
                reference,
                component: payload.component,
                type: payload.type,
                brand: payload.brand,
                description: payload.description,
                supplier: payload.supplier,
                quantity: payload.quantity,
                unitPrice: payload.unitPrice,
                neededBy: payload.neededBy,
                requestReason: payload.requestReason,
                projectId: payload.projectId,
                equipmentTag: payload.equipmentTag,
            })
        );

        return { ok: true, message: `Linea de compra creada para ${reference}.` };
    }

    generatePurchaseLines(): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.generate-purchase-line")) {
            return this.permissionDenied("inventory.replenishment.generate-purchase-line");
        }

        this.fireAndRefresh(this.api.generatePurchaseLines());

        return { ok: true, message: "Lineas de compra generadas. Recargando..." };
    }

    markPurchaseLineSent(lineId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.manage")) {
            return this.permissionDenied("inventory.replenishment.manage");
        }

        const target = this.state.purchaseLines.find((line) => line.id === lineId);
        if (!target || target.status !== "pendiente") {
            return { ok: false, message: "La linea no existe o no esta pendiente." };
        }

        target.status = "enviada";
        this.emitState();

        this.fireAndRefresh(this.api.markPurchaseLineSent(lineId));

        return { ok: true, message: "Linea de compra marcada como enviada." };
    }

    closePurchaseLine(lineId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.manage")) {
            return this.permissionDenied("inventory.replenishment.manage");
        }

        const target = this.state.purchaseLines.find((line) => line.id === lineId);
        if (!target || target.status === "cerrada") {
            return { ok: false, message: "La linea no existe o ya esta cerrada." };
        }

        target.status = "cerrada";
        const ref = this.state.references.find((r) => r.reference === target.reference);
        if (ref) {
            ref.currentStock += target.quantity;
        }
        this.emitState();

        this.fireAndRefresh(this.api.closePurchaseLine(lineId));

        return { ok: true, message: `Linea cerrada y ${target.quantity} unidades de ${target.reference} ingresadas automaticamente a stock.` };
    }

    generateWeeklyShortageSnapshot(): InventoryOperationResult {
        if (!this.hasPermission("inventory.replenishment.weekly-report")) {
            return this.permissionDenied("inventory.replenishment.weekly-report");
        }

        this.fireAndRefresh(this.api.generateWeeklySnapshot());

        return { ok: true, message: "Seguimiento semanal de faltantes generado." };
    }

    // ─── BAGS ────────────────────────────────────────────────────────────────

    receiveTechnicianBag(payload: {
        bagCode: string;
        reference: string;
        quantity: number;
        technician: string;
        notes: string;
        workOrder: string;
        sealCode: string;
        originArea: string;
        receptionDocument: string;
    }): InventoryOperationResult {
        if (!this.hasPermission("inventory.bags.manage")) {
            return this.permissionDenied("inventory.bags.manage");
        }

        const bagCode = payload.bagCode.trim();
        const reference = payload.reference.trim();
        const technician = payload.technician.trim();
        const quantity = Math.floor(payload.quantity);

        if (!bagCode || !reference || !technician || !Number.isFinite(quantity) || quantity <= 0) {
            return { ok: false, message: "Completa bolsa, referencia, tecnico y cantidad valida." };
        }

        const existingReference = this.state.references.find((item) => item.reference === reference);
        if (!existingReference) {
            return { ok: false, message: "La referencia indicada no existe en catalogo." };
        }

        if (this.state.bagTraces.some((bag) => bag.bagCode === bagCode && bag.status === "recibida")) {
            return { ok: false, message: "Ya existe una bolsa activa con ese codigo." };
        }

        const bag: TechnicianBagTrace = {
            id: this.buildId("bag"),
            bagCode,
            reference,
            quantity,
            technician,
            workOrder: payload.workOrder.trim(),
            sealCode: payload.sealCode.trim(),
            originArea: payload.originArea.trim(),
            receptionDocument: payload.receptionDocument.trim(),
            receivedBy: this.actorLabel(),
            receivedAt: new Date().toISOString(),
            status: "recibida",
            releasedBy: "",
            releasedAt: "",
            notes: payload.notes.trim(),
        };
        this.state.bagTraces = [bag, ...this.state.bagTraces];
        existingReference.currentStock += quantity;
        this.emitState();

        this.fireAndRefresh(this.api.receiveTechnicianBag(payload as unknown as Record<string, unknown>));

        return { ok: true, message: "Bolsa recibida y trazabilidad registrada." };
    }

    releaseTechnicianBag(bagId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.bags.manage")) {
            return this.permissionDenied("inventory.bags.manage");
        }

        const bag = this.state.bagTraces.find((item) => item.id === bagId);
        if (!bag || bag.status !== "recibida") {
            return { ok: false, message: "La bolsa no existe o ya fue liberada." };
        }

        const currentRef = this.state.references.find((item) => item.reference === bag.reference);
        if (!currentRef) {
            return { ok: false, message: "La referencia asociada no existe." };
        }

        if (currentRef.currentStock < bag.quantity) {
            return { ok: false, message: "No hay stock suficiente para liberar la bolsa." };
        }

        bag.status = "liberada";
        bag.releasedBy = this.actorLabel();
        bag.releasedAt = new Date().toISOString();
        currentRef.currentStock -= bag.quantity;
        this.emitState();

        this.fireAndRefresh(this.api.releaseTechnicianBag(bagId));

        return { ok: true, message: "Bolsa liberada correctamente." };
    }

    // ─── SESSIONS ────────────────────────────────────────────────────────────

    createSession(payload: {
        name: string;
        scope: string;
        owner: string;
        startDate: string;
        location: string;
        cutoffDate: string;
        countingMethod: string;
        qaLead: string;
    }): InventoryOperationResult {
        if (!this.hasPermission("inventory.reconciliation.manage")) {
            return this.permissionDenied("inventory.reconciliation.manage");
        }

        const name = payload.name.trim();
        const scope = payload.scope.trim();
        const owner = payload.owner.trim();
        const startDate = payload.startDate.trim();

        if (!name || !scope || !owner || !startDate) {
            return { ok: false, message: "Nombre, alcance, responsable y fecha inicio son obligatorios." };
        }

        const session: CountSession = {
            id: this.buildId("ses"),
            name,
            scope,
            owner,
            location: payload.location.trim(),
            cutoffDate: payload.cutoffDate.trim(),
            countingMethod: payload.countingMethod.trim(),
            qaLead: payload.qaLead.trim(),
            startDate,
            endDate: "",
            status: "planificada",
        };
        this.state.sessions = [session, ...this.state.sessions];
        this.emitState();

        this.fireAndRefresh(this.api.createSession(payload as unknown as Record<string, unknown>));

        return { ok: true, message: "Sesion creada correctamente." };
    }

    openSession(sessionId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.reconciliation.manage")) {
            return this.permissionDenied("inventory.reconciliation.manage");
        }

        const target = this.state.sessions.find((item) => item.id === sessionId);
        if (!target || target.status !== "planificada") {
            return { ok: false, message: "La sesion no existe o no esta en estado planificado." };
        }

        target.status = "en-curso";
        this.emitState();

        this.fireAndRefresh(this.api.openSession(sessionId));

        return { ok: true, message: "Sesion iniciada." };
    }

    closeSession(sessionId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.reconciliation.manage")) {
            return this.permissionDenied("inventory.reconciliation.manage");
        }

        const target = this.state.sessions.find((item) => item.id === sessionId);
        if (!target || target.status !== "en-curso") {
            return { ok: false, message: "La sesion no existe o no esta en curso." };
        }

        target.status = "cerrada";
        target.endDate = new Date().toISOString().slice(0, 10);
        this.emitState();

        this.fireAndRefresh(this.api.closeSession(sessionId));

        return { ok: true, message: "Sesion cerrada con acta disponible para exportar." };
    }

    approveDifference(differenceId: string): InventoryOperationResult {
        if (!this.hasPermission("inventory.reconciliation.manage")) {
            return this.permissionDenied("inventory.reconciliation.manage");
        }

        const target = this.state.discrepancies.find((item) => item.id === differenceId);
        if (!target || !!target.approvedAt) {
            return { ok: false, message: "La diferencia no existe o ya fue aprobada." };
        }

        target.approvedBy = this.actorLabel();
        target.approvedAt = new Date().toISOString();
        this.emitState();

        this.fireAndRefresh(this.api.approveDiscrepancy(differenceId));

        return { ok: true, message: "Diferencia aprobada." };
    }

    buildClosureActCsv(sessionId: string): string {
        if (!this.hasPermission("inventory.reconciliation.export")) {
            return "";
        }

        const session = this.state.sessions.find((item) => item.id === sessionId && item.status === "cerrada");
        if (!session) {
            return "";
        }

        const rows: string[] = [];
        rows.push(["Acta de conciliacion", session.name, session.scope, session.owner, session.location || "", session.cutoffDate || "", session.countingMethod || "", session.qaLead || "", session.startDate, session.endDate].map((v) => this.csvCell(v)).join(","));
        rows.push("");
        rows.push(["Referencia", "Ubicacion", "Sistema", "Fisico", "Diferencia", "Motivo", "Aprobado por", "Fecha aprobacion"].map((v) => this.csvCell(v)).join(","));

        this.state.discrepancies.forEach((item) => {
            rows.push([item.reference, item.location, String(item.expected), String(item.counted), String(item.counted - item.expected), item.reason, item.approvedBy || "Pendiente", item.approvedAt || "Pendiente"].map((v) => this.csvCell(v)).join(","));
        });

        rows.push("");
        rows.push(["Bitacora de auditoria"].map((v) => this.csvCell(v)).join(","));
        rows.push(["Fecha", "Usuario", "Accion", "Detalle"].map((v) => this.csvCell(v)).join(","));
        this.state.auditTrail.forEach((event) => {
            rows.push([event.when, event.user, event.action, event.detail].map((v) => this.csvCell(v)).join(","));
        });

        return rows.join("\n");
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    private emitState(): void {
        this.stateSubject.next(this.cloneState(this.state));
    }

    private fireAndRefresh<T>(obs: Observable<T>): void {
        firstValueFrom(obs).then(
            () => this.refreshFromApi(),
            (error: unknown) => {
                this.asyncErrorSubject.next(this.backendErrorMessage(error));
                void this.refreshFromApi();
            },
        );
    }

    private backendErrorMessage(error: unknown): string {
        const raw = (error instanceof Error ? error.message : String(error ?? "")).trim();
        return raw ? `Error del servidor: ${raw}` : "Error del servidor al procesar la accion.";
    }

    private hasPermission(permission: InventoryPermission): boolean {
        return this.inventoryRbac.hasPermission(permission);
    }

    private permissionDenied(permission: InventoryPermission): InventoryOperationResult {
        return { ok: false, message: `No tienes permisos para esta accion (${permission}).` };
    }

    private permissionForMovement(type: MovementType): InventoryPermission {
        if (type === "entrada") return "inventory.movements.register-entry";
        if (type === "ajuste") return "inventory.movements.register-adjustment";
        return "inventory.movements.register-exit";
    }

    private applyMovementLocal(ref: StockReference, type: MovementType, quantity: number): void {
        if (type === "salida") {
            ref.currentStock = Math.max(0, ref.currentStock - quantity);
        } else {
            ref.currentStock = ref.currentStock + quantity;
        }
    }

    private actorLabel(): string {
        const role: InventoryRole = this.inventoryRbac.currentRole;
        return this.inventoryRbac.roleLabel(role);
    }

    private formatSupplierLabel(supplierCode: string, supplierName?: string): string {
        const code = supplierCode.trim();
        const name = (supplierName || "").trim();
        if (code && name) return `${code} - ${name}`;
        return code || name;
    }

    private generateInternalCode(family: string): string {
        const fam = family.toUpperCase().slice(0, 3) || "SIN";
        return `INV-${fam}-${String(this.state.references.length + 1).padStart(5, "0")}`;
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private csvCell(value: string): string {
        return `"${value.replace(/"/g, '""')}"`;
    }

    private normalizeToken(value: string): string {
        return normalizeSearchToken(value);
    }

    private similarity(left: string, right: string): number {
        if (!left || !right) return 0;
        if (left === right) return 1;
        const distance = this.levenshteinDistance(left, right);
        const maxLength = Math.max(left.length, right.length);
        return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
    }

    private levenshteinDistance(left: string, right: string): number {
        const rows = left.length + 1;
        const cols = right.length + 1;
        const matrix: number[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
        for (let r = 0; r < rows; r++) matrix[r][0] = r;
        for (let c = 0; c < cols; c++) matrix[0][c] = c;
        for (let r = 1; r < rows; r++) {
            for (let c = 1; c < cols; c++) {
                const cost = left[r - 1] === right[c - 1] ? 0 : 1;
                matrix[r][c] = Math.min(matrix[r - 1][c] + 1, matrix[r][c - 1] + 1, matrix[r - 1][c - 1] + cost);
            }
        }
        return matrix[rows - 1][cols - 1];
    }

    private emptyState(): InventoryState {
        return {
            references: [],
            movements: [],
            adjustmentRequests: [],
            reservations: [],
            maxReserveDays: 5,
            replenishmentItems: [],
            purchaseLines: [],
            weeklySnapshots: [],
            bagTraces: [],
            sessions: [],
            discrepancies: [],
            auditTrail: [],
        };
    }

    private cloneState(state: InventoryState): InventoryState {
        return {
            references: state.references.map((item) => ({ ...item })),
            movements: state.movements.map((item) => ({ ...item })),
            adjustmentRequests: state.adjustmentRequests.map((item) => ({ ...item })),
            reservations: state.reservations.map((item) => ({ ...item })),
            maxReserveDays: state.maxReserveDays,
            replenishmentItems: state.replenishmentItems.map((item) => ({ ...item })),
            purchaseLines: state.purchaseLines.map((item) => ({ ...item })),
            weeklySnapshots: state.weeklySnapshots.map((item) => ({ ...item, criticalReferences: [...item.criticalReferences] })),
            bagTraces: state.bagTraces.map((item) => ({ ...item })),
            sessions: state.sessions.map((item) => ({ ...item })),
            discrepancies: state.discrepancies.map((item) => ({ ...item })),
            auditTrail: state.auditTrail.map((item) => ({ ...item })),
        };
    }
}
