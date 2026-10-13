# RESUMEN GLOBAL — Sistema LARS (Angular)

> Documento de referencia único: vistas, campos, acciones, servicios, catálogos compartidos, flujos cruzados y RBAC del frontend.
> Pensado para que el agente pueda razonar sin re-explorar el árbol de carpetas.

---

## 1. Visión global

El frontend está organizado por dominios funcionales bajo `src/app/pages/app/`:

| Dominio | Carpeta | Estado |
|---|---|---|
| **Inventario** | `inventory/` | CORE — lógica + persistencia + RBAC |
| **Trabajo (técnico)** | `work/` + `projects/` | CORE — kanban, tareas, equipos, timesheet |
| **CRM** | `crm/` | Negocio — prospectos, clientes, cotizaciones, equipos recibidos |
| **Compañía** | `company/` | Negocio — catálogos maestros, RR.HH., proveedores, configs |
| **Finanzas** | `finance/` | Negocio — cuentas, pagos, facturación, garantías, crédito |
| **Dashboard** | `dashboard/` | Agregador — KPIs cross-módulo |
| Auxiliares | `calendar/`, `chat-inbox/`, `learning/`, `network/`, `social/`, `forum/`, `myprofile/`, `profiles/`, `explorer/`, `personalization/`, `timeline/`, `contactus/`, `privacypolicy/`, `termsofuse/`, `project/` | Plantilla visual del theme — sin lógica LARS |

Shell: [src/app/layouts/internal-layout/](src/app/layouts/internal-layout/) con sidebar dinámico filtrado por permisos RBAC.

---

## 2. Mapa de rutas (`internal-layout.routes.ts`)

> Archivo: [src/app/layouts/internal-layout/internal-layout.routes.ts](src/app/layouts/internal-layout/internal-layout.routes.ts)

### Inventario (todas con `inventoryPermissionGuard`)
| Ruta | Componente | Permiso `data.inventoryPermission` |
|---|---|---|
| `/app/inventory-dashboard` | `InventoryControlCenterComponent` | `inventory.dashboard.view` |
| `/app/inventory-stock` | `InventoryStockWorkbenchComponent` | `inventory.stock.view` |
| `/app/inventory-movements` | `InventoryMovementsComponent` | `inventory.movements.view` |
| `/app/inventory-orders` | `InventoryReplenishmentComponent` | `inventory.replenishment.view` |
| `/app/inventory-order-details` | `InventoryReconciliationComponent` | `inventory.reconciliation.view` |
| `/app/inventory-reservations` | **redirect → `/app/work-projects`** | (las reservas se gestionan desde el kanban) |

### Trabajo (`work-*`) y proyectos
| Ruta | Componente |
|---|---|
| `/app/work-projects` | `WorkProjectsComponent` (wrapper de `ProjectsBoardComponent` → `KanbanViewComponent`) |
| `/app/work-teams` | `WorkTeamsComponent` |
| `/app/work-tasks` | `WorkTasksComponent` |
| `/app/work-timesheet` | `WorkTimesheetComponent` |
| `/app/work-workload` | `WorkWorkloadComponent` |
| `/app/work-test-batches` | `WorkTestBatchesComponent` |
| `/app/work-garantias` | reusa `FinanceGarantiasComponent` |
| `/app/project-board` | redirect → `/app/work-projects` |
| `/app/project-projects`, `/app/project-dashboard` | wrappers visuales |

### CRM
`/app/crm-prospectos` (+ `/:id`), `/app/crm-cotizaciones`, `/app/crm-clientes`, `/app/crm-carga-bases`.

### Compañía
`/app/company-profile`, `/app/company-management`, `/app/company-user-roles`, `/app/company-commercial-config`, `/app/company-followups-config`, `/app/company-projects-config`, `/app/suppliers-dashboard`, `/app/suppliers-crud`, `/app/suppliers-orders-history`, `/app/company-hr-*` (8 rutas RR.HH.), `/app/company-help-center`, `/app/company-resources`, `/app/company-career`, `/app/company-contact-us`. La ruta `/app/company-hr-workload` redirige a `/app/work-workload`.

### Finanzas
`finance-bank`, `finance-dashboard`, `finance-caja-menor`, `finance-cuentas`, `finance-pagos`, `finance-facturacion`, `finance-facturacion-crear`, `finance-facturacion-recurrentes`, `finance-facturacion-recurrentes-crear`, `finance-facturacion-tiempo`, `finance-garantias`, `finance-clientes-credito`, `finance-rewards`, `finance-wallet`, `finance-crypto`.

---

## 3. Catálogos maestros (single source of truth)

Cualquier vista que use estos datos DEBE leer/escribir contra el store correspondiente. Ningún módulo debe duplicar.

| Catálogo | Store / Service | Llave localStorage | Consumidores principales |
|---|---|---|---|
| Workflow técnico (columnas kanban) | `ProjectService` + [company-projects-config.component.ts](src/app/pages/app/company/company-projects-config.component.ts) | `lars.projects.board.v3` | `kanban-view`, `work-workload`, `work-test-batches` |
| Familias / modelos / ubicaciones / tipos servicio | `company-equipment-config.store` | `adminux.company.equipment.config.v*` | `crm-prospect-equipment-modal`, `work-teams`, `kanban-view` (equipo) |
| Proveedores | `SuppliersCatalogService` | catálogo en memoria + `adminux.company.suppliers.v1` | `inventory-stock-workbench`, `inventory-replenishment`, `suppliers-*` |
| Prefijos documentales (cotización, factura, NC, ND…) | `company-commercial-settings.store` | `adminux.company.commercial.prefixes.v1` | `crm-quotes`, `finance-invoice-create`, `finance-time-invoice` |
| Reglas de comisiones | `company-commercial-settings.store` | `adminux.company.commercial.commissions.v1` | `crm-quotes` (informativo) |
| Reglas de seguimiento automático | (storage directo) | `adminux.company.followups.config.v1` | `crm-prospect-detail` (no auto-disparado aún) |
| Clientes CRM | `crm-clients.store` | `adminux.crm.clients.v*` | `finance-billing`, `finance-invoice-create`, `finance-credit-clients`, `finance-pagos` |
| Prospectos | `crm-prospects.store` | `adminux.crm.prospects.v*` | `crm-prospect-detail`, `crm-quotes`, `crm-prospect-equipment-modal` |
| Equipos recibidos (prospect-equipment) | `crm-prospect-equipment.store` | `adminux.crm.prospect-equipment.v*` | `work-teams`, `kanban-view` (equipo), `dashboard` |
| Zonas comerciales | `crm-zones.store` | `adminux.crm.zones.v*` | `crm-prospects`, `crm-clients`, `crm-quotes` |
| Cotizaciones | `crm-quotes.store` | `adminux.crm.quotes.v*` | `crm-prospect-detail`, `finance-invoice-create` |
| Cuentas bancarias / efectivo | `FinanceAccountsStore` | `adminux.finance.accounts.v*` | `finance-pagos`, `finance-caja-menor`, `finance-invoice-create` |
| Facturas | `FinanceBillingStore` | `adminux.finance.billing.v*` | `finance-billing`, `finance-pagos`, `finance-time-invoice` |
| Pagos | (storage directo) | `adminux.finance.payments` | `finance-pagos` |
| Garantías | (storage directo) | `adminux.finance.warranties.v2` | `finance-garantias`, `work-garantias` |
| Inventario completo | `InventoryWorkflowService` | `lars.inventory.workflow.v2` | Todo el módulo `inventory/` + `kanban-view` (materiales) + `inventory-movements` (proyecto) |
| Rol de inventario activo | `InventoryRbacService` | `lars.inventory.role.v1` | Sidebar, guard, todas las vistas inventory |
| Lotes de pruebas (test batching) | `WorkTestBatchService` | `lars.work.test-batches.v2` | `kanban-view` (transiciones), `work-test-batches` |
| Hoja de tiempo / page-tracking | `WorkTimeTrackerService` | `adminux.work.time-tracker.v*` | `work-timesheet`, `finance-time-invoice`, `dashboard` |

---

## 4. Servicios globales (`src/app/services/`)

| Servicio | Propósito | Estado |
|---|---|---|
| [inventory-workflow.service.ts](src/app/services/inventory-workflow.service.ts) | Núcleo transaccional de inventario (referencias, movimientos, reservas, reposición, conciliación, bolsas, auditoría) | Persistente `lars.inventory.workflow.v2` |
| [inventory-rbac.service.ts](src/app/services/inventory-rbac.service.ts) | RBAC por rol (5 roles) y matriz de permisos | Persistente `lars.inventory.role.v1` |
| [inventory-domain.models.ts](src/app/services/inventory-domain.models.ts) | Tipos e interfaces del dominio inventario | — |
| [suppliers-catalog.service.ts](src/app/services/suppliers-catalog.service.ts) | Catálogo de proveedores | Persistente |
| [work-time-tracker.service.ts](src/app/services/work-time-tracker.service.ts) | Hoja de tiempo manual + tracking de uso de página por ruta | Persistente; iniciado en `AppComponent` |

Guards: [src/app/guards/inventory-permission.guard.ts](src/app/guards/inventory-permission.guard.ts) — `canActivate` que valida `data.inventoryPermission` contra `InventoryRbacService`; redirige a `firstAccessibleInventoryRoute()` o `/app/dashboard`.

---

## 5. MÓDULO INVENTARIO

### 5.1 Modelos ([inventory-domain.models.ts](src/app/services/inventory-domain.models.ts))

**Tipos base**
- `InventoryRole = "tecnico" | "responsable" | "administrativo" | "compras" | "auditor"`
- `MovementType = "salida" | "entrada" | "ajuste"`
- `ReplenishmentStatus = "pendiente" | "en-gestion" | "escalar" | "obsoleto"`
- `PurchaseLineStatus = "pendiente" | "enviada" | "cerrada"`
- `SessionStatus = "planificada" | "en-curso" | "cerrada"`
- `InventoryPermission` — 20 claves (`inventory.dashboard.view`, `inventory.stock.create-card`, …)

**Interfaces**
- **`StockReference`**: `reference, internalCode, manufacturerReference, designation, family, subfamily, brand, location, unitMeasure, compatibleEquipment, criticality, preferredSupplierName, leadTimeDays, technicalNotes, supplierCode, currentStock, minStock, targetStock`
- **`DuplicateReferenceCandidate`**: `reference, designation, similarity, reason`
- **`MovementRecord`**: `id, type, reference, quantity, reason, workOrder, equipmentTag, customerSite, movementCategory, evidenceRef, requestedBy, requestedAt`
- **`AdjustmentRequest`**: campos de movement + `status, approvedBy, approvedAt`
- **`ReservationRecord`**: `id, reference, quantity, assignedTo, purpose, workOrder, equipmentTag, customerSite, priority, commitmentDate, reservedAt, expiresAt, status`
- **`ReplenishmentItem`**: `reference, description, supplier, alternateSupplier, procurementOwner, estimatedLeadDays, lastQuotedUnitCost, shortageReason, minStock, currentStock, firstInsufficientAt, lastAttemptAt, attempts, status`
- **`PurchaseLine`**: `id, reference, description, supplier, quantity, source, expectedDate, requestReason, generatedAt, generatedBy, status`
- **`WeeklyShortageSnapshot`**: `id, weekKey, generatedAt, generatedBy, totalInsufficient, escalated, averageWaitingDays, criticalReferences[]`
- **`TechnicianBagTrace`**: `id, bagCode, reference, quantity, technician, workOrder, sealCode, originArea, receptionDocument, receivedBy, receivedAt, status, releasedBy, releasedAt, notes`
- **`CountSession`**: `id, name, scope, owner, location, cutoffDate, countingMethod, qaLead, startDate, endDate, status`
- **`DiscrepancyRecord`**: `id, reference, location, expected, counted, reason, rootCause, countSheet, approvedBy, approvedAt`
- **`AuditEvent`**: `when, user, action, detail`
- **`InventoryState`**: agregado de todos los anteriores + `maxReserveDays, auditTrail[]`

### 5.2 RBAC ([inventory-rbac.service.ts](src/app/services/inventory-rbac.service.ts))

Matriz por rol:
| Rol | Permisos |
|---|---|
| **tecnico** | dashboard.view, stock.view, movements.view, **movements.register-exit**, reservations.view, reservations.manage, replenishment.view |
| **responsable** | TODOS de técnico + stock.create-card, stock.register-entry, movements.register-entry/adjustment/**approve**, replenishment.manage/generate-purchase-line/weekly-report, reconciliation.view/manage/export, bags.manage |
| **administrativo** | dashboard.view, stock.view, stock.register-entry, movements.view/register-entry, reservations.view, replenishment.view, bags.manage |
| **compras** | dashboard.view, replenishment.view/manage/generate-purchase-line/weekly-report |
| **auditor** | dashboard.view, reconciliation.view/export |

API: `setRole`, `currentRole`, `hasPermission(perm)`, `hasAnyPermission([...])`, `hasRouteAccess(path)`, `firstAccessibleInventoryRoute()`, `roleLabel(role)`.

### 5.3 Vistas

#### `inventory-control-center.component.ts` → `/app/inventory-dashboard`
Panel ejecutivo con árbol de módulos filtrado por permisos del rol activo + backlog operativo.
- **Campos**: `activeRole` (selector), `visibleTree[]` (árbol RBAC), KPIs `pendingCount/inProgressCount/resolvedCount`, tabla backlog `(topic, owner, status, nextStep)`.
- **Acciones**: `setRole(role)` → `InventoryRbacService.setRole`.
- **Permisos**: ninguno bloqueante (la vista misma se adapta).

#### `inventory-stock-workbench.component.ts` → `/app/inventory-stock`
**UI por tabs** (`activeTab: "crear" | "entrada"`).
- **Tab "Crear ficha"** (campos `draftCreate.*`):
  - Visibles: `reference, designation, family, brand, preferredSupplierId, criticality, minStock, location`.
  - Avanzados (colapsable `showAdvancedCreate`): `manufacturerReference, unitMeasure, compatibleEquipment, technicalNotes`.
  - **Auto-generado al guardar**: `internalCode = "INV-{FAM3}-{padded###}"`.
  - **Eliminados de la UI**: `subfamily`, `targetStock`, `leadTimeDays` (heredados del proveedor).
  - Lista en vivo de `duplicateCandidates` (similarity ≥ 0.72).
- **Tab "Entrada a stock"** (campos `entryDraft.*`):
  - Visibles: `reference (select), quantity, supplierId, documentType (Remision|Factura|Acta de recepcion), documentNumber, location`.
  - Auto-llenados al cambiar referencia: `location` y `supplierCode`.
  - Auto-llenados invisibles: `receivedBy = currentRole`, `receivedAt = today`.
  - **Eliminados de la UI**: `batchOrSerial, unitCost`.
- **Tabla catálogo**: `reference, internalCode, designation, family, location, currentStock, minStock, status (OK / Bajo mínimo)`.
- **Acciones**: `createCard()` → `createReference()`; `registerEntry()` → `registerStockEntry()`.
- **Permisos**: crear ficha = `inventory.stock.create-card`; entrada = `inventory.stock.register-entry` ∨ `inventory.movements.register-entry`.
- **Auditoría**: `CREATE_REFERENCE`, `REGISTER_STOCK_ENTRY`.

#### `inventory-movements.component.ts` → `/app/inventory-movements`
Movimientos con aprobación condicional + bolsas de técnico.
- **Nuevo movimiento** (`draft.*`):
  - `type` (salida|entrada|ajuste), `reference (select)`, `quantity`, `evidenceRef`, `reason`.
  - **Selector `selectedProjectId`** → auto-llena `workOrder` (`shortCode`), `equipmentTag` (`equipmentIdentifier` o `equipmentDisplayName`), `customerSite` (`equipmentProspectName` o `client`).
  - **`movementCategory` removido del draft** — se computa con `get inferredCategory()`:
    - `salida + workOrder` → `consumo-tecnico`
    - `entrada + workOrder` → `devolucion`
    - `entrada` → `regularizacion`
    - `ajuste` → `regularizacion`
    - resto → `traslado`
- **Tablas**:
  - Historial movimientos (9 cols): fecha, tipo, referencia, cantidad, orden, equipo, cliente, categoría, solicitante.
  - Solicitudes pendientes (cola de aprobación): fecha, referencia, tipo, estado, orden, acción **Aprobar**.
- **Bolsas de técnico** (sección colapsable `showBags`, oculta por defecto):
  - Form (`bagDraft.*`, 5 campos): `bagCode, reference, quantity, technician, workOrder`.
  - Tabla (7 cols): bolsa, referencia(qty), técnico, recepción (por/fecha), estado, ODS, acción **Liberar**.
- **Acciones**:
  - `submitMovement()` → `submitMovement()` (entrada/ajuste sin permiso ⇒ a cola de aprobación).
  - `approveRequest(id)` → `approveMovementRequest()`.
  - `receiveBag()` → `receiveTechnicianBag()` (genera entrada automática).
  - `releaseBag(id)` → `releaseTechnicianBag()` (genera salida automática).
- **Permisos**: salida = `movements.register-exit`; entrada = `movements.register-entry` (si no, va a aprobación); aprobar = `movements.approve`; bolsas = `bags.manage`.
- **Auditoría**: `REGISTER_MOVEMENT`, `REQUEST_MOVEMENT_APPROVAL`, `APPROVE_MOVEMENT_REQUEST`, `RECEIVE_TECHNICIAN_BAG`, `RELEASE_TECHNICIAN_BAG`.
- **Servicios extra**: `ProjectService.loadProjects("board-1")` para el selector de proyecto.

#### `inventory-replenishment.component.ts` → `/app/inventory-orders`
Backlog de insuficiencia + intentos de compra + escalamiento + POs + reportes semanales.
- **KPIs**: `visibleItems.length, escalationCount, averageWaitingDays`.
- **Filtros**: `sortMode (antiguedad|intentos|criticidad)`, `statusFilter`.
- **Form intento detallado** (`attemptDraft.*`): `reference, supplierId, alternateSupplierId, estimatedLeadDays, quotedUnitCost, resultNote, procurementOwner`.
- **Tabla backlog**: reference, stock, mínimo, proveedor actual, lead time, costo, primera insuficiencia, último intento, intentos (count), días, estado, acciones (**Intento rápido / Cargar detalle / Marcar obsoleto**).
- **Tabla líneas de compra**: referencia, proveedor, cantidad, generada por/fecha, estado, acciones (**Enviar / Cerrar**).
- **Histórico semanal**: weekKey, generado por/fecha, items, escalados, promedio días, top 3 críticos.
- **Acciones → servicio**:
  - `generatePurchaseLines()`, `generateWeeklySnapshot()`, `registerDetailedAttempt()`, `registerAttempt()` (rápido), `loadAttemptDraft()`, `markObsolete(ref)`, `markSent(lineId)`, `closeLine(lineId)`.
- **Reglas**: 3er intento ⇒ status `escalar`; cerrar PO ⇒ entrada automática + `MovementRecord`.
- **Permisos**: `replenishment.manage`, `replenishment.generate-purchase-line`, `replenishment.weekly-report`.

#### `inventory-reconciliation.component.ts` → `/app/inventory-order-details`
Sesiones de conteo físico vs sistema, aprobación de diferencias, exportación de acta.
- **KPIs**: openSessionsCount, unresolvedDiffs, auditTrail.length.
- **Form nueva sesión** (`sessionDraft.*`): name, scope, owner, location, cutoffDate, `countingMethod (conteo-ciego|conteo-dirigido|conteo-ciclico)`, qaLead, startDate.
- **Tabla sesiones**: …, estado (planificada|en-curso|cerrada), acciones **Iniciar / Cerrar / Exportar acta**.
- **Tabla diferencias**: reference, location, sistema, físico, diferencia, motivo, aprobación, acción **Aprobar ajuste**.
- **Tabla auditoría**: fecha, usuario, acción, detalle.
- **Acciones → servicio**: `createSession`, `openSession`, `closeSession`, `approveDifference`, `buildClosureActCsv` (descarga blob CSV).
- **Permisos**: `reconciliation.manage`, `reconciliation.export`.

#### `inventory-reservations.component.ts` → **redirigida a `/app/work-projects`**
Existe pero ya no se navega directo. El kanban es ahora el lugar canónico para crear/renovar/liberar/consumir reservas.

### 5.4 API pública de `InventoryWorkflowService`

```
state$ : Observable<InventoryState>
getSnapshot() : InventoryState        // sincroniza vencidas + replenishment + auto-POs
syncState() : void

// Stock
findDuplicateReferenceCandidates(ref, designation) : DuplicateReferenceCandidate[]
createReference(payload) : InventoryOperationResult
registerStockEntry(payload) : InventoryOperationResult

// Movimientos
submitMovement(payload) : InventoryOperationResult
approveMovementRequest(requestId) : InventoryOperationResult

// Reservas
setMaxReserveDays(days) : InventoryOperationResult
createReservation(payload) : InventoryOperationResult
releaseReservation(id) : InventoryOperationResult
extendReservation(id) : InventoryOperationResult
consumeReservation(id) : InventoryOperationResult     // decr stock + salida auto

// Reabastecimiento
registerReplenishmentAttempt(payload) : InventoryOperationResult
markReplenishmentObsolete(ref) : InventoryOperationResult
generatePurchaseLines() : InventoryOperationResult
markPurchaseLineSent(lineId) : InventoryOperationResult
closePurchaseLine(lineId) : InventoryOperationResult  // entrada auto + incrementa stock
generateWeeklyShortageSnapshot() : InventoryOperationResult

// Bolsas
receiveTechnicianBag(payload) : InventoryOperationResult
releaseTechnicianBag(bagId) : InventoryOperationResult

// Conciliación
createSession(payload) : InventoryOperationResult
openSession(id) : InventoryOperationResult
closeSession(id) : InventoryOperationResult
approveDifference(diffId) : InventoryOperationResult
buildClosureActCsv(sessionId) : string                 // CSV exportable
```

---

## 6. MÓDULO TRABAJO + PROYECTOS

### 6.1 Modelos clave (`src/app/pages/app/projects/models/`)

**`project.model.ts`**
- `Project`: `id, title, description?, icon?, status (columnId), properties{}, boardId, createdBy, createdAt, updatedAt, attachments?, tasks?, completedTasks?, totalTasks?, progress?`
- `Task`: `id, projectId, title, description?, completed, priority, assignee?, dueDate?, completedAt?, completedBy?, estimatedHours?, actualHours?, tags?, dependencies?, attachments?, createdBy, createdAt, updatedAt, order`
- `TaskPriority`: `LOW | MEDIUM | HIGH | CRITICAL`
- `BoardColumn`: `id, name, color, order, description?, equipmentStatusId?, equipmentStatusLabel?, greenDays?, yellowDays?, includeInWorkload?, trackAging?`
- `ProjectBoard`: `id, name, icon?, columns[], propertyTemplates[], defaultView`

**`project.properties` (extendido en kanban-view)**
- Identidad: `shortCode, startDate, noDeadline, category, department, client, notes, publicProject, members[]`
- Planificación: `priority (high|medium|low), assignee, budget, estimatedHours, actualHours, currency (COP), allowManualTime, notifyClient`
- Equipo (puente CRM): `equipmentRecordId, equipmentItemId, equipmentProspectId, equipmentDisplayName, equipmentIdentifier, equipmentSerie, equipmentServiceType, equipmentFailureDescription, equipmentLocationId, equipmentLocationName, equipmentRepairStatus, equipmentLinkedAt, equipmentLastWorkflowUpdate, equipmentQrDataUrl`
- Diagnóstico/Reparación: `diagnosticNotes, testType, testTypeLabel, repairNotes, repairabilityPercent`
- Materiales (puente Inventario): `estimatedMaterialCost, materialReservations[]`

**`project-workflow.config.ts`**
- `ProjectWorkflowStatusId`: `recibido | diagnostico | por-cotizar | pedir-repuestos | esperando-proveedor | reparacion | pruebas | garantia | prestamo | listo-entrega | entregado` (11 estados)
- `ProjectTechnicalTestType`: `banco-pruebas | laboratorio | multimetro-scan | sin-pruebas | no-reparable`
- Helpers: `buildTechnicalBoardColumns()`, `buildTechnicalProjectBoard()`.

**`work-test-batch.models.ts`**
- `WorkTestQuestion`: `id, label, type (boolean|text|number|single-select), required, helperText, options?`
- `WorkTestBatch`: `id, name, description, active, questions[], updatedAt`
- `WorkTestFlowRule`: `id, name, fromStatusId, toStatusId, batchIds[], requiredToContinue, triggerMode (always|only-high-priority), active, updatedAt`
- `WorkTestBatchRun`: `id, fromStatusId/Label, toStatusId/Label, executedAt, executedBy, ruleIds[], batchIds[], answers{}`

### 6.2 Servicios de proyectos (`pages/app/projects/services/`)

**`ProjectService`** (`providedIn: 'root'`)
- Observables: `projects$, board$, loading$, projectsWithTasks$`
- `getBoardSnapshot(): ProjectBoard | null`
- `loadProjects(boardId): Observable<Project[]>` (delay 500 ms)
- `getProjectsByColumn(columnId)`, `getProjectsByColumnWithTasks(columnId)`
- `createBoardColumn(name, color, metadata?)`, `updateBoardColumn(id, updates)`, `moveBoardColumn(id, direction)`
- `createProject(columnId, title, description, options?)` → inicializa con ~40 properties
- `moveProject(projectId, targetStatus, targetIndex)`
- `updateProjectStatus(id, newStatus)`, `updateProject(id, updates)`, `updateProperty(id, propertyId, value)`
- `deleteProject(id)`
- `resetBoardToTechnicalDefaults()`
- `getProject(id)`, `getProjectWithTasks(id)`
- Persistencia: `lars.projects.board.v3`, `lars.projects.items.v3`

**`TaskService`** — `tasks$, filter$, filteredTasks$`; `getTasksByProject, setFilter, addTask, updateTask, deleteTask, toggleTaskCompletion, getTask`. Mock data en memoria (no persiste).

**`ProjectEquipmentService`** — puente kanban ↔ `crm-prospect-equipment.store`:
- `getLocations()`, `getEquipmentOptions()`, `getEquipmentByReference("recordId::itemId")`, `findEquipmentByIdentifier(serieOrId)`, `updateEquipmentWorkflow(reference, repairStatus, locationId, updatedBy)`, `buildReference(summary)`.

### 6.3 Vistas de trabajo

#### `work-projects.component.ts` → `/app/work-projects`
Wrapper de `<projects-board>`. Sin lógica propia.

#### `work-teams.component.ts` → `/app/work-teams`
CRUD de equipos recibidos integrado con CRM.
- **Filtro**: `EquipmentFilter = "activos" | "sin_asignar" | "archivados" | "todos"`.
- **Modelo `ProspectEquipmentRecord`**: `id, prospectId, prospectName, companyName, nit, phone, address, city, contactName, contactRole, cellphone, email, createdAt, updatedAt, archived, sourceContext, assignedTo, items[], receptionDay/Month/Year`.
- **Modelo `ProspectEquipmentItem`**: `id, serviceTypeId/Name, storageLocationId/Name, familyName, marca, tipo, serie, receivedIdentifier, customerShipmentReference, accessories, borrowedEquipments[], failureDescription, evidencePhotos[], repairStatus, repairStatusUpdatedAt`.
- **SLA**: `SLA_GREEN_MAX_DAYS=2`, `SLA_YELLOW_MAX_DAYS=5`.
- **Acciones**: `archiveProspectEquipmentRecord`, `restoreProspectEquipmentRecord`, `getAllProspectEquipmentRecords`, `getProspectEquipmentRecordById`. Abre `CrmProspectEquipmentModalComponent` para crear/editar.

#### `work-tasks.component.ts` → `/app/work-tasks`
Vista consolidada de tareas por proyecto.
- **Modelo `TasksByProject`**: `project, tasks[], stats {total, completed, pending, overdue}`.
- **Filtros**: `filterProject, filterPriority, filterAssignee, filterStatus (all|pending|completed|overdue)`.
- **Servicios**: `combineLatest(TaskService.getTasksByProject, ProjectService.loadProjects)`.
- Reutiliza `TaskListComponent` y `TaskFormComponent`.

#### `work-timesheet.component.ts` → `/app/work-timesheet`
Registro manual de tiempo + analítica de uso de plataforma.
- **Form** (`CreateWorkTimesheetEntry`): `projectId, date, hours, notes`.
- **Modelo `WorkTimesheetEntry`**: `id, date, project, hours, description, category`.
- **Analítica `DailyUsage`**: `pageId, pageLabel, visits, totalSeconds`.
- **Acciones**: `submitTimeEntry`, `deleteTimeEntry`, `resetDraft`.
- **Servicio**: `WorkTimeTrackerService`.

#### `work-workload.component.ts` → `/app/work-workload`
Visualización ECharts de carga por técnico y por etapa.
- **Modelo `TechnicianWorkload`**: `technician, projectCount, projects[], projectLoads[], projectStages[], focus`.
- Solo cuenta columnas con `includeInWorkload=true`. Usa `greenDays/yellowDays` para SLA visual.
- Sin escritura — solo lectura del `ProjectService.board$ + projectsWithTasks$`.

#### `work-test-batches.component.ts` → `/app/work-test-batches`
Configuración de lotes de preguntas y reglas de transición.
- **Form `BatchDraft`**: `id?, name, description, active, questions[]`.
- **Form `QuestionDraft`**: `id?, label, type, required, helperText, optionsText`.
- **Form `FlowDraft`**: `id?, name, fromStatusId, toStatusId, batchIds[], requiredToContinue, triggerMode, active`.
- **Acciones**: `upsertBatch, deleteBatch, upsertFlowRule, deleteFlowRule`.
- **Servicio**: `WorkTestBatchService` (estado + `getTransitionPrompt` consumido por kanban).

### 6.4 Kanban — `kanban-view.component.ts` (el componente más rico del sistema)

#### Estructura de UI
- Tablero con columnas drag-drop (Dragula).
- Creación inline de proyecto por columna.
- Modal de detalle con tabs: `'equipo' | 'materiales' | 'identidad' | 'planeacion' | 'notas'`.

#### Acciones a nivel proyecto
- `startCreateProject(columnId)`, `submitCreateProject(columnId)` → `ProjectService.createProject`.
- `onProjectCardClick(event, project)` → abre detalle.
- `selectStatus(statusId)` → si hay `WorkTestFlowRule` activo, dispara modal de transición; si no, `updateProjectStatus`.
- `onProjectCardDrop()` (Dragula) → `ProjectService.moveProject(projectId, targetStatus, targetIndex)`; si hay regla activa de transición, también dispara modal.

#### Tab "Equipo"
- `onMaterialReferenceChange(...)` (sic., busca equipo por identificador o serie).
- `selectLinkedEquipment(reference)` / `searchEquipmentByIdentifier()` → `ProjectEquipmentService.findEquipmentByIdentifier`.
- `openEquipmentScanner()` → `BrowserMultiFormatReader` (ZXing) para escanear QR.
- `updateLinkedEquipmentWorkflow()` → `ProjectEquipmentService.updateEquipmentWorkflow(ref, repairStatus, locationId, updatedBy)` ⇒ sincroniza repair status + ubicación en `crm-prospect-equipment.store`.
- `generateEquipmentQrCode()` → `QRCode.toDataURL()` guarda `equipmentQrDataUrl` en project.

#### Tab "Materiales" (puente con InventoryWorkflowService)
- Form `ProjectMaterialRequestDraft`: `reference, quantity, assignedTo, purpose, workOrder, equipmentTag, customerSite, priority (critica|alta|media|baja), commitmentDate`.
  - `workOrder` se inicializa con `project.properties.shortCode`.
  - `equipmentTag` con `equipmentIdentifier`.
  - `customerSite` con `client` o `equipmentProspectName`.
- `requestMaterial()` → `InventoryWorkflowService.createReservation`.
- **Tabla de reservas activas** (sincronizada con `state$`): cantidad, asignado, prioridad, vencimiento, estado, acciones:
  - **Consumir** → `consumeMaterialReservation(id)` → `InventoryWorkflowService.consumeReservation` (decrementa stock, libera reserva, registra salida `consumo-tecnico`).
  - **Liberar** → `releaseMaterialReservation(id)` → `InventoryWorkflowService.releaseReservation`.
- Permisos derivados de `InventoryRbacService.hasPermission('inventory.reservations.manage')`.

#### Tab "Identidad / Planeación / Notas"
- Edición directa de `project.properties` mediante `ProjectService.updateProject(id, updates)`.

#### Test batching en transiciones
- Antes de cambiar status: `WorkTestBatchService.getTransitionPrompt(fromId, toId, priority)`.
- Si retorna reglas activas, abre modal con preguntas (`WorkTestBatch.questions[]`).
- Al confirmar: crea `WorkTestBatchRun {answers{}}` y aplica el cambio de status.
- `triggerMode = 'only-high-priority'` solo dispara si `priority ∈ {high, critical}`.

### 6.5 Componentes hijos

#### `project-card.component.ts`
Tarjeta visual con: `shortCode, client, priority (badge), dueDate, budget, equipmentRepairStatusLabel, equipmentLocationName, actualHours, repairabilityPercent, testType, completedTasks/totalTasks, progress%, assignee`. Clases dinámicas `--success/warning/overdue/critical` según SLA.

#### `task-list.component.ts`
Lista filtrable. Filtros: `all|pending|completed`. Outputs: `onToggleTask, onEditTask, onDeleteTask, onAddTask`.

#### `task-form.component.ts`
Modal CRUD de tarea: título, descripción, prioridad, asignado, fecha límite, horas estimadas, etiquetas, completada (solo edit). Outputs: `onSave, onCancel`.

---

## 7. MÓDULO CRM

### `crm-prospects.component.ts` → `/app/crm-prospectos`
- **Tabla**: nombre, correo, móvil, zona, valor prospecto, creado, cotizaciones, empleado asignado, estado (Pendiente|En proceso|Cerrado).
- **Acciones**: "Agregar prospecto", "Asociar equipo" (abre `CrmProspectEquipmentModalComponent` ⇐ puente con WORK), "Ver cotizaciones", "Abrir ficha".
- **Stores**: `crm-prospects.store`, `crm-prospect-equipment.store`, `crm-zones.store`.

### `crm-prospect-detail.component.ts` → `/app/crm-prospectos/:id`
Tabs: perfil, contactos-relacionados, acciones-comerciales, equipos, cotización, archivos, notas, trazabilidad.
Subtabs activity: actividad, notas, correos, llamadas, tareas, reuniones.
Acciones: crear acción comercial, agregar seguimiento, editar nota.

### `crm-prospect-equipment-modal.component.ts` ⚡ **Puente CRM ↔ WORK**
Wizard de 5 pasos:
1. **Reception**: cliente, compañía, contacto, fecha, celular, email.
2. **Equipment**: familia, marca, tipo, serie, identificador, accesorios, equipos préstamo (catálogo `company-equipment-config`).
3. **Questions**: preguntas booleanas/texto sobre prioridad, costo, urgencia.
4. **Evidence**: fotos con metadata (EXIF, GPS, timestamp).
5. **Signatures**: firmas cliente y técnico.

`sourceContext: "crm" | "work"` permite reutilización desde ambos lados. Persiste en `crm-prospect-equipment.store`. Captura QR con `BrowserMultiFormatReader`.

### `crm-quotes.component.ts` → `/app/crm-cotizaciones`
- **Tabla**: código, prospecto, total (COP), fecha, válido-hasta, estado (Borrador|Enviado|Aprobado), token público.
- **Form items línea**: servicio, descripción, cantidad, unitario, impuesto.
- **Stores**: `crm-quotes.store`, `crm-quote-preview.store`, `company-commercial-settings.store` (prefijos), `crm-prospects.store`, `crm-zones.store`, `FinanceBillingStore`.
- **Acciones**: "Crear cotización", "Exportar (PDF/CSV)", "Previsualizar pública (token)".

### `crm-clients.component.ts` → `/app/crm-clientes`
- **Tabla**: ID, nombre, correo, zona, estado (Activo|Inactivo), cupo máximo crédito, creado.
- **Form**: nombre, correo, empresa, zona, estado, crédito habilitado, límite crédito, consumido, último pago, plazo pago (días).
- **Acciones**: agregar/editar/eliminar, importar/exportar, asignación masiva de zona.
- **Store**: `crm-clients.store`.

### `crm-database-upload.component.ts` → `/app/crm-carga-bases`
Importación CSV/XLSX a prospectos o clientes (lógica backend pendiente). Historial: nombre archivo, destino, registros, fecha, estado.

---

## 8. MÓDULO COMPAÑÍA (catálogos + RR.HH.)

### Catálogos de negocio

#### `company-commercial-config.component.ts` → `/app/company-commercial-config`
- **Prefijos documentales** (tabla por DocumentType: Cotización, Factura, NC, ND…): `prefijo actual, próximo número, estado`. Form inline. Reset disponible.
- **Reglas de comisiones**: canal (Directo|Referido|Distribuidor|Renovación), línea, rango venta, tasa base, bonus desde, tasa bonus, activo.
- **Stores**: `company-commercial-settings.store`. **Crítico**: prefijos consumidos por `crm-quotes`, `finance-invoice-create`, `finance-time-invoice`.

#### `company-projects-config.component.ts` → `/app/company-projects-config`
**Maestro del workflow técnico** — sincroniza con `work-projects` y `work-workload`.
- Tabla columnas: orden, nombre, color, descripción, equipmentStatusId, greenDays, yellowDays, includeInWorkload, trackAging.
- Form: nombre, color, descripción, equipmentStatusId, SLA days, flags.
- Botón "Reset técnico" → restaura `PROJECT_WORKFLOW_STATUS_OPTIONS`.
- **Servicio**: `ProjectService.getProjectWorkflow / saveProjectWorkflow`.

#### `company-equipment-config.component.ts` → `/app/company-management` (zona equipos)
Tabs: **Familias**, **Modelos industriales**, **Tipos de servicio**, **Ubicaciones almacén**.
- `EquipmentFamilyRecord`: `id, name, description, active, count`.
- `IndustrialEquipmentModelRecord`: `familyId, brand, type, series, notes, active`.
- `EquipmentServiceTypeRecord`: `id, name, description, active`.
- `EquipmentLocationRecord`: `id, name, description, active, count`.
- **Store**: `company-equipment-config.store`.
- **Consumido por**: `crm-prospect-equipment-modal`, `kanban-view` (tab equipo).

#### `company-followups-config.component.ts` → `/app/company-followups-config`
Wizard 4 pasos: nombre/descripción → reintentos/intervalo → modo mensaje (IA|repetir|custom) → activación. Storage `adminux.company.followups.config.v1`.

### Proveedores

#### `company-suppliers-crud.component.ts` → `/app/suppliers-crud`
Master de proveedores. **Tabla**: número, razón social, ciudad, país, sector, grado (A|B|C|D), términos pago, suscripción. **Form**: número, razón social, NIT, contacto (nombre/título/email/teléfono), banco, ciudad, grado, términos pago, suscripción. **Servicio**: `SuppliersCatalogService`.

#### `company-suppliers-dashboard.component.ts` → `/app/suppliers-dashboard`
KPIs: total, confiables (A-B), suscripciones activas, alertas. Tabla clasificación ABCD con barras de reliability.

#### `company-suppliers-orders-history.component.ts` → `/app/suppliers-orders-history`
Historial órdenes a proveedor: número, proveedor, solicitante, equipo, propósito, cantidad, fecha solicitud, estado (Solicitado|En tránsito|Recibido|Borrador), urgencia (Normal|Alta|Crítica). Detalle: items (Componente|Placa|Kit|Consumible) y trazabilidad.

### Otros

- `company-profile`, `company-management`, `company-help-center`, `company-resources`, `company-career`, `company-contact-us` — mayormente template visual.
- `company-user-roles` → `/app/company-user-roles` — gestión visual de usuarios/roles (lógica RBAC se aplica vía `InventoryRbacService` actualmente).
- **HR** (`company/hr/`): `dashboard, employees, compensation, worktime, health, leaves, documents, audit` — módulo RR.HH. (visual + alguna lógica, no detallado).

---

## 9. MÓDULO FINANZAS

### Operativos / con lógica
- **`finance-cuentas`** → `FinanceAccountsStore`. CRUD de cuentas (Banco|Efectivo) con tipo producto, moneda, saldo inicial, estado.
- **`finance-caja-menor`** → consume `FinanceAccountsStore`. Tabla gastos con: item, concepto, fecha, empleado, **proyecto**, categoría, proveedor, cuenta, moneda, tipo cambio, precio, valor COP, descripción, invoice. Presupuesto mensual.
- **`finance-pagos`** → storage `adminux.finance.payments`. Tabla: orden, código, **proyecto**, factura, cliente, OC, monto, fecha, gateway, estado (Completado|Parcial|Pendiente), moneda, transactionId, cuenta, receipt, notas.
- **`finance-billing`** → `FinanceBillingStore`. Tabla facturas con estado (Borrador|Pendiente|Pago parcial|Pagado|Cancelado|Enviado), filtros por estado/cliente/fechas.
- **`finance-invoice-create`** → asistente. **Campos**: número (prefijo + secuencial vía `buildCommercialSeriesPrefix`), cliente (`getCrmClients`), proyecto (`ProjectService`), fechas, moneda, tipo cambio, modo cálculo impuesto (Después/Antes/Sin), cuenta bancaria, items líneas (nombre, descripción, cantidad, unitario, impuesto, adjunto), descuento, dirección, términos, nota, resumen (subtotal/descuento/impuesto/total), estado.
- **`finance-recurring-invoices` / `-create`** → `FinanceBillingStore.BillingRecurringInvoice`. Frecuencia (Diario|Semanal|Quincenal|Mensual|Bimensual|Trimestral). Estado (Activa|Pausada|Finalizada).
- **`finance-time-invoice`** ⚡ **Puente con `WorkTimeTrackerService`**. **Campos**: número (prefijo comercial), cliente, proyecto, empleado, rango fechas, tasa horaria, moneda, modo impuesto, cuenta, descuento, nota. **Tabla entradas** filtradas por empleado+proyecto+rango con checkbox para incluir en factura. Acciones: "Abrir hoja de tiempo" (link a `work-timesheet`), "Guardar borrador / Emitir factura" (crea `BillingInvoice`).
- **`finance-garantias`** (= `work-garantias`) → storage `adminux.finance.warranties.v2`. Tabla: código, cliente, equipo, fecha inicio, vencimiento, seguimiento hasta, propietario, notas, estado (Vigente|Por vencer|Vencida|Cerrada), phase (en-revisión|esperando-componentes|en-reparación|lista). Filtros por ventana vencimiento.
- **`finance-credit-clients`** → consume `crm-clients.store`. Form: cliente, habilitar crédito, cupo máximo, días plazo. KPIs computados: disponible, días mora, días sin pago. Helpers: `calculateAvailableCredit`, `calculateDaysInArrears`, `calculateDaysSinceLastPayment`.

### Visualización
- `finance-bank`, `finance-dashboard`, `finance-crypto`, `finance-wallet`, `finance-rewards` — dashboards con charts, sin lógica de negocio relevante.

---

## 10. DASHBOARD principal (`/app/dashboard`)

Agregador de KPIs. Lee:
- `crm-clients.store` → métricas de clientes.
- `FinanceAccountsStore` → cuentas activas.
- `crm-prospect-equipment.store` → métricas de equipos en proceso.
- `ProjectService` → proyectos en riesgo.
- Dispone de acceso directo a `work-teams`.

---

## 11. SHELL Y NAVEGACIÓN

- **Layout**: [src/app/layouts/internal-layout/](src/app/layouts/internal-layout/) — header + sidebar dinámico + footer + offcanvas (theming, notificaciones).
- **Sidebar** [src/app/components/header-footer-sidebar/sidebar/sidebar.component.ts](src/app/components/header-footer-sidebar/sidebar/sidebar.component.ts) — menú dropdown con árbol; **filtra opciones de inventario** según `InventoryRbacService.hasPermission` y `hasRouteAccess`.
- **Header**: logo PIKA, search global tabbed.
- **`AppComponent`** inicia globalmente `WorkTimeTrackerService` para registrar navegación y uso por página.

---

## 12. FLUJOS CROSS-MODULARES (críticos)

### A. Recepción de equipo → proyecto técnico
1. Comercial/Recepcionista en `crm-prospects` o `work-teams` abre **`CrmProspectEquipmentModalComponent`**.
2. Wizard 5 pasos guarda en `crm-prospect-equipment.store` (con QR opcional).
3. Modal puede crear proyecto en `ProjectService.createProject` con `properties.equipmentRecordId/equipmentItemId/...` y redirigir a `/app/work-projects`.
4. En kanban, tab "Equipo" sincroniza con `ProjectEquipmentService.updateEquipmentWorkflow` (status + ubicación).

### B. Reserva y consumo de material desde proyecto
1. En kanban tab "Materiales": form auto-puebla `workOrder/equipmentTag/customerSite` desde el proyecto.
2. `requestMaterial()` → `InventoryWorkflowService.createReservation` (status `activa`, `expiresAt = today + maxReserveDays`).
3. **Auto-vencimiento**: `getSnapshot()` ejecuta `refreshExpiredReservationsInState()` y marca vencidas.
4. Acciones desde la tabla del proyecto:
   - **Renovar** → `extendReservation` (suma `maxReserveDays`).
   - **Liberar** → `releaseReservation`.
   - **Consumir** → `consumeReservation` (decrementa `currentStock`, marca `liberada`, crea `MovementRecord type=salida category=consumo-tecnico`, audita `CONSUME_RESERVATION`).
5. La pantalla `inventory-reservations` está **redirigida** al kanban: ya no hay duplicidad de UI.

### C. Movimiento de inventario asociado a proyecto
1. En `inventory-movements`, técnico selecciona `selectedProjectId` → auto-llena `workOrder/equipmentTag/customerSite`.
2. `inferredCategory` se calcula automáticamente.
3. `submitMovement`:
   - Salida con permiso `movements.register-exit` → aplicada inmediatamente.
   - Entrada/Ajuste sin permiso → encolada como `AdjustmentRequest`.
4. Responsable aprueba en la tabla "Solicitudes pendientes" → `approveMovementRequest`.

### D. Reposición automática y cierre de PO → entrada de stock
1. `getSnapshot()` ejecuta `rebuildReplenishmentItems` (referencias con `currentStock ≤ minStock`) y `autoGeneratePurchaseLinesInternal`.
2. Compras gestiona en `inventory-replenishment`: registra intentos, marca POs como enviadas/cerradas.
3. **`closePurchaseLine`** ⇒ entrada automática: incrementa `currentStock += quantity`, crea `MovementRecord type=entrada`, audita `CLOSE_PURCHASE_LINE`.

### E. Bolsas de técnico (recepción / liberación)
1. `receiveTechnicianBag` → genera `MovementRecord type=entrada` automáticamente y status `recibida`.
2. `releaseTechnicianBag` → genera `MovementRecord type=salida` y status `liberada`.

### F. Conciliación anual física
1. `createSession` (planificada) → `openSession` (en-curso) → registro de `DiscrepancyRecord` → `approveDifference` por cada uno → `closeSession` (cerrada) → `buildClosureActCsv` para descarga.

### G. Cotización → Factura → Pago
1. `crm-quotes` genera cotización con prefijo de `company-commercial-settings.store`.
2. `finance-invoice-create` toma cliente (`crm-clients`), proyecto (`ProjectService`) y prefijo, crea `BillingInvoice`.
3. `finance-pagos` registra cobro asociado a la factura.

### H. Hoja de tiempo → Factura por horas
1. `work-timesheet` registra `WorkTimesheetEntry` mediante `WorkTimeTrackerService`.
2. `finance-time-invoice` filtra entradas por empleado+proyecto+rango, permite seleccionar y emitir factura (queda en `FinanceBillingStore`).

### I. Transición de estado en kanban con test batch
1. Usuario arrastra o cambia chip → `WorkTestBatchService.getTransitionPrompt(from, to, priority)`.
2. Si retorna reglas activas (`triggerMode` aplica), modal con `WorkTestQuestion[]`.
3. Confirmar crea `WorkTestBatchRun {answers}` y aplica `moveProject/updateProjectStatus`.

---

## 13. PERSISTENCIA — todas las llaves localStorage

| Llave | Owner | Contenido |
|---|---|---|
| `lars.inventory.workflow.v2` | `InventoryWorkflowService` | `InventoryState` completo |
| `lars.inventory.role.v1` | `InventoryRbacService` | rol activo |
| `lars.projects.board.v3` | `ProjectService` | `ProjectBoard` |
| `lars.projects.items.v3` | `ProjectService` | `Project[]` |
| `lars.work.test-batches.v2` | `WorkTestBatchService` | batches + flow rules |
| `adminux.company.commercial.prefixes.v1` | commercial-settings | prefijos documentales |
| `adminux.company.commercial.commissions.v1` | commercial-settings | reglas comisiones |
| `adminux.company.followups.config.v1` | followups-config | reglas seguimiento |
| `adminux.company.equipment.config.v*` | equipment-config | familias, ubicaciones, modelos, servicios |
| `adminux.company.suppliers.v1` | suppliers-catalog | proveedores |
| `adminux.crm.prospects.v*` | prospects.store | prospectos |
| `adminux.crm.clients.v*` | clients.store | clientes |
| `adminux.crm.zones.v*` | zones.store | zonas |
| `adminux.crm.quotes.v*` | quotes.store | cotizaciones |
| `adminux.crm.prospect-equipment.v*` | prospect-equipment.store | equipos recibidos |
| `adminux.finance.accounts.v*` | accounts.store | cuentas bancarias |
| `adminux.finance.billing.v*` | billing.store | facturas + recurrentes |
| `adminux.finance.payments` | finance-pagos | pagos |
| `adminux.finance.warranties.v2` | finance-garantias | garantías |
| `adminux.work.time-tracker.v*` | time-tracker | timesheet entries + page usage |

---

## 14. AUXILIARES (template visual del theme — sin lógica LARS)

`calendar` (FullCalendar), `chat-inbox/{inbox,compose-mail,chat}`, `learning/{dashboard,courses,institutions}`, `network/{dashboard,performance,smart-home}`, `social/{dashboard,analytics,scheduler}`, `forum`, `forum-details`, `myprofile/*` (account-settings, my-earning, my-profile, my-subscription, statement, payment, subscription-plans), `profiles/{professional,analytical,social}`, `explorer`, `personalization`, `timeline`, `contactus`, `privacypolicy`, `termsofuse`, `project/{project-dashboard,project-projects}` (wrappers que importan `ProjectsBoardComponent`).

> **No tocar a menos que se requiera convertirlos en operativos**: ya tienen sus rutas registradas pero no participan del flujo de negocio.

---

## 15. Convenciones de implementación

- **Standalone components** + inline templates en la mayoría de componentes con lógica (ojo a las advertencias de lenguaje en Angular Language Service para templates inline largos).
- **Two-way binding** con `FormsModule` + `ngModel` (no Reactive Forms en general).
- **Estado global** vía servicios `providedIn: 'root'` con `BehaviorSubject` y persistencia manual en `localStorage`.
- **Sin Docker**: ejecutar Angular dev server directo en el host.
- **Sin god files**: si un componente supera ~1500 líneas, refactorizar antes de seguir agregando.
- **No detener servidores ni puertos del usuario** sin permiso explícito.
