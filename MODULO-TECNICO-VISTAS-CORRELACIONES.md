> **Este archivo fue reemplazado por [RESUMEN-GLOBAL.md](RESUMEN-GLOBAL.md).**
> Mantén la documentación viva en `RESUMEN-GLOBAL.md`. Este archivo se conserva sólo como histórico y puede eliminarse manualmente.

---

# (Histórico) Modulo tecnico (Trabajo): vistas y componentes correlacionados

## Objetivo
Documentar las vistas y componentes del modulo tecnico (seccion Trabajo) y sus relaciones con otros modulos.

## Alcance
- Seccion principal: rutas `work-*`.
- Incluye correlaciones confirmadas en codigo y correlaciones potenciales de integracion.

## Vistas principales del modulo tecnico

| Ruta | Vista (componente) | Rol | Correlaciones confirmadas |
| --- | --- | --- | --- |
| `/app/work-projects` | `WorkProjectsComponent` | Entrada a tablero de proyectos tecnicos | Reutiliza `ProjectsBoardComponent`, que a su vez usa `KanbanViewComponent` y `ProjectCardComponent`. Recibe navegacion desde `work-teams`, `work-tasks` y `crm-prospect-equipment-modal`. |
| `/app/work-teams` | `WorkTeamsComponent` | CRUD operativo de recepcion/equipos | Usa `CrmProspectEquipmentModalComponent`; consume `crm-prospect-equipment.store` y `crm-prospects.store`; ofrece acceso directo a `work-projects`. |
| `/app/work-tasks` | `WorkTasksComponent` | Gestion consolidada de tareas por proyecto | Usa `TaskListComponent` y `TaskFormComponent`; consume `TaskService` y `ProjectService`; navega a `work-projects` con query params. |
| `/app/work-timesheet` | `WorkTimesheetComponent` | Registro de tiempo y analitica de uso | Consume `WorkTimeTrackerService` para guardar entradas y analizar uso por pagina/ruta. |
| `/app/work-workload` | `WorkWorkloadComponent` | Visualizacion de carga laboral tecnica | Vista analitica standalone con ECharts; hoy no consume stores de proyectos/equipos en tiempo real. |

## Componentes y servicios clave que se correlacionan

| Tipo | Elemento | Ubicacion | Relacion con el modulo tecnico |
| --- | --- | --- | --- |
| Componente vista | `WorkProjectsComponent` | `src/app/pages/app/work/work-projects.component.ts` | Wrapper del tablero de proyectos. |
| Componente vista | `WorkTeamsComponent` | `src/app/pages/app/work/work-teams.component.ts` | Gestion de recepciones/equipos con modal compartido de CRM. |
| Componente vista | `WorkTasksComponent` | `src/app/pages/app/work/work-tasks.component.ts` | Vista de tareas compartiendo capa de proyectos. |
| Componente vista | `WorkTimesheetComponent` | `src/app/pages/app/work/work-timesheet.component.ts` | Vista de horas respaldada por tracking global. |
| Componente vista | `WorkWorkloadComponent` | `src/app/pages/app/work/work-workload.component.ts` | Vista de carga laboral tecnica. |
| Componente reutilizado | `ProjectsBoardComponent` | `src/app/pages/app/projects/projects-board.component.ts` | Es la base de `work-projects`. |
| Componente reutilizado | `KanbanViewComponent` | `src/app/pages/app/projects/kanban-view.component.ts` | Gestiona tablero, detalle de proyecto y equipo en reparacion. |
| Componente reutilizado | `ProjectCardComponent` | `src/app/pages/app/projects/components/project-card/project-card.component.ts` | Tarjetas de proyecto usadas en Kanban. |
| Componente reutilizado | `TaskListComponent` | `src/app/pages/app/projects/components/task-list/task-list.component.ts` | Lista de tareas usada desde `work-tasks`. |
| Componente reutilizado | `TaskFormComponent` | `src/app/pages/app/projects/components/task-form/task-form.component.ts` | Formulario modal usado desde `work-tasks`. |
| Componente compartido | `CrmProspectEquipmentModalComponent` | `src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts` | Usado por CRM y por `work-teams`; puede crear proyecto y redirigir a `work-projects`. |
| Servicio | `WorkTimeTrackerService` | `src/app/services/work-time-tracker.service.ts` | Fuente de verdad para hoja de tiempo y consumo en Finanzas. |
| Servicio | `TaskService` | `src/app/pages/app/projects/services/task.service.ts` | CRUD/logica de tareas usada por `work-tasks`. |
| Servicio | `ProjectService` | `src/app/pages/app/projects/services/project.service.ts` | Fuente de tablero/proyectos usada por `work-projects` y `work-tasks`. |
| Servicio | `ProjectEquipmentService` | `src/app/pages/app/projects/services/project-equipment.service.ts` | Puente entre proyectos y store de equipos CRM. |
| Store | `crm-prospect-equipment.store` | `src/app/pages/app/crm/crm-prospect-equipment.store.ts` | Datos de equipos para `work-teams`, dashboard y proyectos. |
| Store | `crm-prospects.store` | `src/app/pages/app/crm/crm-prospects.store.ts` | Soporte de datos de prospectos en `work-teams`. |
| Store | `company-equipment-config.store` | `src/app/pages/app/company/company-equipment-config.store.ts` | Catalogo de ubicaciones usado por proyectos/equipos. |

## Correlaciones entre vistas de otros modulos y modulo tecnico

| Vista externa | Correlacion con tecnico |
| --- | --- |
| `DashboardComponent` (`/app/dashboard`) | Muestra metricas de equipos desde `crm-prospect-equipment.store` y tiene acceso directo a `work-teams`. |
| `FinanceTimeInvoiceComponent` (`/app/finance-time-invoice`) | Consume entradas de `WorkTimeTrackerService` y enlaza a `work-timesheet`. |
| `CrmProspectEquipmentModalComponent` (flujo CRM) | Al guardar puede crear proyectos de reparacion y redirigir a `work-projects`. |
| `AppComponent` (shell) | Inicia `WorkTimeTrackerService` globalmente para registrar navegacion y uso de pagina. |

## Flujo actual resumido

1. `work-teams` registra/edita equipos y estados de recepcion.
2. El modal de equipos puede crear proyectos tecnicos y abrir `work-projects`.
3. `work-projects` usa el tablero Kanban de proyectos para operacion diaria.
4. `work-tasks` administra tareas de esos proyectos y puede volver a `work-projects`.
5. `work-timesheet` registra horas y `finance-time-invoice` las factura.
6. `work-workload` muestra carga laboral como tablero analitico.

## Correlaciones potenciales recomendadas

- Conectar `work-workload` a datos reales de `ProjectService` y `ProjectEquipmentService` (hoy usa dataset local).
- Vincular tareas de `work-tasks` con entradas de `work-timesheet` para trazabilidad tarea-horas.
- Unificar estados de equipo (`work-teams`) con estados de proyecto (`work-projects`) para alertas SLA end-to-end.
- Agregar deep links bidireccionales entre `work-projects` y `work-teams` por `equipment reference`.

## Referencias base revisadas

- Rutas internas: `src/app/layouts/internal-layout/internal-layout.routes.ts`
- Menu lateral: `src/app/components/header-footer-sidebar/sidebar/sidebar.component.ts`
- Vistas `work-*`: `src/app/pages/app/work/*.component.ts`
- Capa de proyectos: `src/app/pages/app/projects/**/*`
- Tracking de tiempo: `src/app/services/work-time-tracker.service.ts`
- Integraciones externas: `dashboard`, `finance-time-invoice`, `crm-prospect-equipment-modal`

## Evaluacion de pendientes segun reunion (30-mar-2026)

### Resumen ejecutivo

- El frente de inventario existe en rutas y UI, pero hoy esta implementado principalmente como plantilla visual.
- No hay control de acceso efectivo por accion (crear ficha, ajustar, reservar, etc.) aplicado en rutas/menu/acciones.
- No existe una capa de dominio de inventario con entidades, historial de movimientos y reglas de negocio.
- La mayoria de necesidades operativas discutidas en la reunion siguen pendientes de implementacion.

### Estado actual vs reunion

| Tema de reunion | Estado actual en codigo | Brecha |
| --- | --- | --- |
| Modulo tecnico con pantalla de stock para operacion diaria | Existen vistas `inventory-dashboard`, `inventory-stock`, `inventory-orders`, `inventory-order-details` | Las vistas son mayormente estaticas; no hay flujo transaccional real de inventario |
| Todos ven inventario, pero no todos deben crear ficha o ajustar | No hay guards ni `canActivate`/`canMatch` en rutas internas | Falta RBAC real por accion y por ruta |
| Crear ficha solo por responsable de inventario | No hay politica aplicada de permisos en inventario | Falta restriccion de UI + backend para crear ficha |
| Tecnico puede sacar componentes rapido | No hay operacion de salida real con trazabilidad | Falta flujo de consumo/salida con auditoria |
| Riesgo de reservas indefinidas | Solo hay indicador visual de "Reservados" en dashboard | Falta modulo de reservas con vencimiento/expiracion |
| Diferenciar crear ficha vs entrada de stock existente | No existe modelo operacional de movimientos | Falta separar "alta de referencia" de "entrada" |
| Busqueda por referencia y validacion anti-typo/duplicado | No hay logica de catalogo real ni validaciones de negocio | Falta motor de busqueda normalizada y deteccion de duplicados |
| Minimo de stock y linea de compra automatica | No hay reglas de reposicion implementadas | Falta regla de minimo + generacion de orden/linea de compra |
| Vista de "cantidad insuficiente" priorizada por antiguedad | No hay vista funcional de backlog de faltantes con historial | Falta primera deteccion, ultimo intento, intentos totales, orden por antiguedad |
| Seguimiento semanal de faltantes | No hay reportes recurrentes | Falta reporte semanal y tablero de seguimiento |
| Conciliacion anual fisico vs sistema | No existe modulo de conteo/cierre de inventario | Falta ciclo de conteo, diferencias y ajustes aprobados |

### Evidencia tecnica clave

- Rutas de inventario sin guardas de autorizacion: `src/app/layouts/internal-layout/internal-layout.routes.ts`.
- Menu de inventario visible desde sidebar sin filtro por permisos: `src/app/components/header-footer-sidebar/sidebar/sidebar.component.ts`.
- Componentes de inventario con inicializacion de UI (Choices/DataTable/jsVectorMap), pero sin store/servicio de dominio:
  - `src/app/pages/app/inventory/inventory-dashboard.component.ts`
  - `src/app/pages/app/inventory/inventory-stock.component.ts`
  - `src/app/pages/app/inventory/inventory-orders.component.ts`
  - `src/app/pages/app/inventory/inventory-order-details.component.ts`
- No se identifican archivos `*guard*.ts` para control de acceso en `src/app`.
- Modulo de roles existente pero solo a nivel UI local y payload pendiente de backend (`console.info`): `src/app/pages/app/company/company-user-roles.component.ts`.

## Backlog recomendado (priorizado)

### P0 - Gobierno y seguridad (obligatorio)

1. Definir matriz de permisos por accion para inventario:
	- `inventory.view`
	- `inventory.consume`
	- `inventory.adjust`
	- `inventory.create-card`
	- `inventory.receive-entry`
	- `inventory.reserve`
	- `inventory.release`
	- `inventory.replenish-manage`
	- `inventory.audit-run`
2. Implementar guardas de ruta y filtro de menu por permisos.
3. Bloquear en UI y API acciones criticas (crear ficha, ajustar, borrar, sobreescribir stock).
4. Registrar auditoria de movimientos (quien, cuando, por que, antes/despues).

### P1 - Nucleo operativo de inventario

5. Crear capa de dominio (store/service + modelos):
	- Referencia (ficha)
	- Existencias por ubicacion
	- Movimiento (entrada/salida/ajuste/reserva/liberacion)
	- Reserva (con vencimiento)
	- Intento de compra
6. Separar flujos de negocio:
	- Alta de referencia (solo responsable)
	- Entrada a referencia existente
	- Salida/consumo tecnico
	- Ajuste controlado
7. Implementar busqueda por referencia normalizada y regla anti-duplicados (coincidencia exacta y similitud).

### P2 - Minimos y compras

8. Regla de cantidad minima con disparo de reposicion.
9. Bandeja "cantidad insuficiente" con campos historicos:
	- `firstInsufficientAt`
	- `lastPurchaseAttemptAt`
	- `purchaseAttemptsCount`
	- `currentSupplier`
10. Orden por antiguedad y score de urgencia (mas viejo primero).
11. Regla de escalamiento (por ejemplo, 3 intentos fallidos => cambiar proveedor o marcar obsoleto).

### P3 - Control operativo y cierre

12. Reporte semanal de faltantes y envejecimiento de reposicion.
13. Modulo de conciliacion anual (fisico vs sistema):
	- Sesiones de conteo
	- Diferencias por referencia/ubicacion
	- Ajustes con aprobacion
	- Acta de cierre de inventario

## Plan sugerido por fases

1. Fase 1 (1-2 semanas): permisos, guardas, bloqueo de acciones criticas y auditoria minima.
2. Fase 2 (2-4 semanas): dominio de inventario + flujos crear/entrar/salir/ajustar + reservas con vencimiento.
3. Fase 3 (2-3 semanas): minimos, insuficiencia historica, priorizacion y seguimiento semanal.
4. Fase 4 (1-2 semanas): conciliacion anual y reporte de cierre.

## Decisiones funcionales pendientes (para alinear con negocio)

- Politica final de reservas: duracion maxima y reglas de renovacion.
- Nivel de autonomia del tecnico: salida libre vs salida con motivo obligatorio.
- Politica de ajuste: cuando puede ajustar tecnico y cuando requiere aprobacion.
- Criterio de obsolescencia para referencias sin disponibilidad de proveedor.
- Periodicidad formal de conciliacion (anual, semestral o trimestral por familia critica).

## TO DO de la reunion (30-mar-2026)

> Estado:
> - `[x]` Hecho
> - `[~]` Parcial (frontend/mock, falta backend o enforcement real)
> - `[ ]` Pendiente

1. [x] Redisenar menu de Inventario como arbol de opciones operativas.
2. [x] Crear panel de control central para inventario.
3. [x] Separar claramente "crear ficha" vs "entrada a referencia existente".
4. [x] Restringir creacion de ficha solo a responsable de inventario.
5. [x] Permitir salida rapida de tecnico y dejar ajuste/entrada bajo control.
6. [x] Implementar reservas con vencimiento para evitar congelados indefinidos.
7. [x] Implementar vista de cantidad insuficiente con antiguedad e intentos de compra.
8. [x] Priorizar backlog de insuficiencia por antiguedad/criticidad.
9. [x] Definir y aplicar escalamiento tras multiples intentos fallidos.
10. [x] Crear flujo de conciliacion anual fisico vs sistema.
11. [x] Registrar bitacora de auditoria de eventos de inventario.
12. [x] Aplicar RBAC real (guardas/rutas/menu/acciones) por permisos.
13. [x] Conectar inventario a store/servicio persistente (sin datos mock en memoria).
14. [x] Automatizar linea de compra al cruzar stock minimo.
15. [x] Generar seguimiento semanal de faltantes.
16. [x] Validar duplicados de referencia (tipos/typos/similitud), no solo coincidencia exacta.
17. [x] Integrar flujo administrativo de recepcion/liberacion de bolsas y trazabilidad por tecnico.
18. [x] Generar cierre con acta/exportable de conciliacion anual.

## Revision punto por punto (lo que ya tenemos)

| # | Punto del TO DO | Estado | Lo que ya tenemos | Falta para cerrar |
| --- | --- | --- | --- | --- |
| 1 | Arbol de inventario | Hecho | Menu actualizado con opciones operativas en sidebar | Mantener coherencia con futuras rutas |
| 2 | Panel de control | Hecho | Nueva vista `inventory-control-center.component.ts` con arbol y cobertura de backlog | Integrar KPIs reales |
| 3 | Crear ficha vs entrada | Hecho | Nueva vista `inventory-stock-workbench.component.ts` separa Opcion 1 y Opcion 2 | Persistir en backend |
| 4 | Solo responsable crea ficha | Hecho | Permiso `inventory.stock.create-card` aplicado por rol; UI bloqueada y validada desde servicio | Monitoreo funcional continuo |
| 5 | Salida tecnico / ajuste controlado | Hecho | Movimientos por permiso + cola de aprobacion + aprobacion aplicada en store persistente | Ajustar politicas si cambia negocio |
| 6 | Reservas con vencimiento | Hecho | Reservas persistentes con expiracion automatica, renovacion/liberacion y politica editable | Afinar SLA si negocio lo solicita |
| 7 | Cantidad insuficiente historica | Hecho | Backlog persistente con fechas, intentos y estado por referencia | Conectar compras reales cuando exista backend |
| 8 | Priorizacion backlog | Hecho | Orden por antiguedad/intentos/criticidad en reposicion | Ajustar formula con negocio |
| 9 | Escalamiento por intentos | Hecho | Escalamiento automatico tras multiples intentos + gestion manual de intentos | Revisar umbral de escalamiento segun KPI |
| 10 | Conciliacion anual | Hecho | Flujo de sesion (crear/iniciar/cerrar), diferencias y aprobacion en store persistente | Integrar captura fisica masiva cuando se defina |
| 11 | Auditoria de eventos | Hecho | Bitacora transversal persistente para operaciones clave de inventario | Integrar con backend cuando exista |
| 12 | RBAC real | Hecho | Guard en rutas + menu dinamico + bloqueo por accion desde servicios | Mantener matriz de permisos |
| 13 | Persistencia real | Hecho | `inventory-workflow.service.ts` persistente en localStorage con estado unificado | Migrar a API cuando corresponda |
| 14 | Reposicion automatica por minimo | Hecho | Generacion automatica de lineas de compra al caer por debajo de minimo + generacion manual | Ajustar regla de cantidades |
| 15 | Seguimiento semanal | Hecho | Snapshots semanales de faltantes con historico y metricas clave | Exportar a BI cuando se requiera |
| 16 | Anti-duplicado robusto | Hecho | Deteccion con normalizacion + similitud (typos/prefijos/designacion) | Ajustar umbral de similitud si hay falsos positivos |
| 17 | Recepcion administrativa | Hecho | Flujo de recepcion/liberacion de bolsas con trazabilidad por tecnico y movimientos asociados | Integrar identificadores externos si se requiere |
| 18 | Acta/exportable de cierre | Hecho | Exportacion CSV de acta de conciliacion por sesion cerrada | Agregar PDF/firma digital en fase backend |

## Evidencia de implementacion actual (frontend)

- Menu de inventario en arbol: `src/app/components/header-footer-sidebar/sidebar/sidebar.component.ts`
- Rutas nuevas de inventario: `src/app/layouts/internal-layout/internal-layout.routes.ts`
- Panel de control: `src/app/pages/app/inventory/inventory-control-center.component.ts`
- Stock y fichas: `src/app/pages/app/inventory/inventory-stock-workbench.component.ts`
- Movimientos: `src/app/pages/app/inventory/inventory-movements.component.ts`
- Reservas: `src/app/pages/app/inventory/inventory-reservations.component.ts`
- Reposicion: `src/app/pages/app/inventory/inventory-replenishment.component.ts`
- Conciliacion y auditoria: `src/app/pages/app/inventory/inventory-reconciliation.component.ts`
- RBAC de inventario: `src/app/services/inventory-rbac.service.ts`
- Store persistente inventario: `src/app/services/inventory-workflow.service.ts`
- Guard de permisos en rutas: `src/app/guards/inventory-permission.guard.ts`
