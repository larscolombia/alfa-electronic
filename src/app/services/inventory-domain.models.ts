export type InventoryRole = "tecnico" | "responsable" | "administrativo" | "compras" | "auditor";

export type InventoryPermission =
    | "inventory.dashboard.view"
    | "inventory.stock.view"
    | "inventory.stock.create-card"
    | "inventory.stock.register-entry"
    | "inventory.movements.view"
    | "inventory.movements.register-exit"
    | "inventory.movements.register-entry"
    | "inventory.movements.register-adjustment"
    | "inventory.movements.approve"
    | "inventory.reservations.view"
    | "inventory.reservations.manage"
    | "inventory.replenishment.view"
    | "inventory.replenishment.manage"
    | "inventory.replenishment.generate-purchase-line"
    | "inventory.replenishment.weekly-report"
    | "inventory.reconciliation.view"
    | "inventory.reconciliation.manage"
    | "inventory.reconciliation.export"
    | "inventory.bags.manage";

export type MovementType = "salida" | "entrada" | "ajuste";

export interface StockReference {
    reference: string;
    internalCode?: string;
    manufacturerReference?: string;
    designation: string;
    family: string;
    subfamily?: string;
    brand: string;
    location: string;
    unitMeasure?: string;
    compatibleEquipment?: string;
    criticality?: "alta" | "media" | "baja";
    preferredSupplierName?: string;
    leadTimeDays?: number;
    technicalNotes?: string;
    supplierCode: string;
    currentStock: number;
    minStock: number;
    targetStock?: number;
}

export interface DuplicateReferenceCandidate {
    reference: string;
    designation: string;
    similarity: number;
    reason: string;
}

export interface MovementRecord {
    id: string;
    type: MovementType;
    reference: string;
    quantity: number;
    reason: string;
    workOrder: string;
    equipmentTag?: string;
    customerSite?: string;
    movementCategory?: string;
    evidenceRef?: string;
    requestedBy: string;
    requestedAt: string;
}

export interface AdjustmentRequest {
    id: string;
    type: Extract<MovementType, "entrada" | "ajuste">;
    reference: string;
    quantity: number;
    reason: string;
    workOrder: string;
    equipmentTag?: string;
    customerSite?: string;
    movementCategory?: string;
    evidenceRef?: string;
    requestedBy: string;
    requestedAt: string;
    status: "pendiente" | "aprobada";
    approvedBy: string;
    approvedAt: string;
}

export interface ReservationRecord {
    id: string;
    reference: string;
    quantity: number;
    assignedTo: string;
    purpose: string;
    workOrder?: string;
    equipmentTag?: string;
    customerSite?: string;
    priority?: "critica" | "alta" | "media" | "baja";
    commitmentDate?: string;
    reservedAt: string;
    expiresAt: string;
    status: "activa" | "liberada" | "vencida";
}

export type ReplenishmentStatus = "pendiente" | "en-gestion" | "escalar" | "obsoleto";

export interface ReplenishmentItem {
    reference: string;
    description: string;
    supplier: string;
    alternateSupplier?: string;
    procurementOwner?: string;
    estimatedLeadDays?: number;
    lastQuotedUnitCost?: number;
    shortageReason?: string;
    minStock: number;
    currentStock: number;
    firstInsufficientAt: string;
    lastAttemptAt: string;
    attempts: number;
    status: ReplenishmentStatus;
}

export type PurchaseLineStatus = "pendiente" | "enviada" | "cerrada";

export interface PurchaseLine {
    id: string;
    reference: string;
    component: string;
    type: string;
    brand: string;
    description: string;
    supplier: string;
    quantity: number;
    receivedQuantity?: number;
    unitPrice: number;
    neededBy: string;
    source?: "minimo" | "manual" | "escalamiento";
    expectedDate?: string;
    requestReason?: string;
    generatedAt: string;
    generatedBy: string;
    status: PurchaseLineStatus;
    projectId?: string;
    equipmentTag?: string;
    modifiedByPurchases?: boolean;
    modifiedBy?: string;
    modifiedAt?: string;
    approvalStatus?: "pendiente" | "aprobada" | "rechazada";
    approvedBy?: string;
    approvedAt?: string;
}

export interface PurchaseRequestRecord {
    id: string;
    reference: string;
    description: string;
    quantity: number;
    supplier: string;
    estimatedCost: number;
    leadTimeDays: number;
    urgency: string;
    memo: string;
    projectId: string;
    equipmentTag: string;
    requestedBy: string;
    requestedAt: string;
    status: string;
    reviewedBy: string;
    reviewedAt: string;
    reviewNotes: string;
    purchaseLineId: string;
}

export interface WeeklyShortageSnapshot {
    id: string;
    weekKey: string;
    generatedAt: string;
    generatedBy: string;
    totalInsufficient: number;
    escalated: number;
    averageWaitingDays: number;
    criticalReferences: string[];
}

export interface TechnicianBagTrace {
    id: string;
    bagCode: string;
    reference: string;
    quantity: number;
    technician: string;
    workOrder?: string;
    sealCode?: string;
    originArea?: string;
    receptionDocument?: string;
    receivedBy: string;
    receivedAt: string;
    status: "recibida" | "liberada";
    releasedBy: string;
    releasedAt: string;
    notes: string;
}

export type SessionStatus = "planificada" | "en-curso" | "cerrada";

export interface CountSession {
    id: string;
    name: string;
    scope: string;
    owner: string;
    location?: string;
    cutoffDate?: string;
    countingMethod?: string;
    qaLead?: string;
    startDate: string;
    endDate: string;
    status: SessionStatus;
}

export interface DiscrepancyRecord {
    id: string;
    reference: string;
    location: string;
    expected: number;
    counted: number;
    reason: string;
    rootCause?: string;
    countSheet?: string;
    approvedBy: string;
    approvedAt: string;
}

export interface AuditEvent {
    when: string;
    user: string;
    action: string;
    detail: string;
}

export interface InventoryState {
    references: StockReference[];
    movements: MovementRecord[];
    adjustmentRequests: AdjustmentRequest[];
    reservations: ReservationRecord[];
    maxReserveDays: number;
    replenishmentItems: ReplenishmentItem[];
    purchaseLines: PurchaseLine[];
    weeklySnapshots: WeeklyShortageSnapshot[];
    bagTraces: TechnicianBagTrace[];
    sessions: CountSession[];
    discrepancies: DiscrepancyRecord[];
    auditTrail: AuditEvent[];
}

export interface InventoryOperationResult {
    ok: boolean;
    message: string;
}
