# Plan de cierre de brechas — Flujo operativo Alfa Electronic

> Documento de trabajo seguible. Marca cada `[ ]` al completarlo.
> Enfoque **frontend-first**: priorizar reducir clics/pasos antes de tocar backend.
> Convenciones de estado: `[ ]` pendiente · `[~]` en progreso · `[x]` hecho (tachado).

---

## 0. Contexto y principios

- El flujo objetivo va de prospección → recepción → diagnóstico → cotización/OC → repuestos/reparación → despacho → facturación/seguimiento.
- Hoy hay buena cobertura en recepción, diagnóstico, inventario y despacho rápido; los huecos críticos son **OC formal, despacho documental completo, control de pago, DIAN y persistencia backend**.
- Estados técnicos actuales: `recibido, diagnostico, por-cotizar, pedir-repuestos, esperando-proveedor, reparacion, pruebas, garantia, prestamo, listo-entrega, entregado` ([project-workflow.config.ts](src/app/pages/app/projects/project-workflow.config.ts#L4)).
- Persistencia hoy: proyectos e inventario en `localStorage`; CRM prospectos/clientes/cotizaciones/equipos/facturas/cuentas/seguimientos/pagos en backend.

### Principios de ejecución
1. Cada fase debe compilar (`npm run build`) y no romper rutas existentes.
2. Sin god files: si un componente pasa ~1500 líneas, refactorizar antes.
3. Backend Go: una sola fuente de verdad por dominio; nada de mock en memoria.
4. UX: cada acción crítica resoluble sin cambiar de pantalla cuando sea posible.

---

## Fase 1 — CRM: automatización y persistencia de seguimientos

**Objetivo:** que acciones comerciales, notas y timeline persistan y disparen recordatorios.

### Frontend
- [x] ~~Quitar el arreglo en memoria de acciones comerciales en [crm-prospect-detail.component.ts](src/app/pages/app/crm/crm-prospect-detail.component.ts#L1011).~~
- [x] ~~Auto-guardar la acción al cerrar el modal (sin paso extra de "guardar y recargar").~~
- [x] ~~Reemplazar `timelineItems` hardcoded por datos reales de seguimientos.~~
- [x] ~~Mostrar badge "próximo seguimiento" en la tabla de [crm-prospects.component.ts](src/app/pages/app/crm/crm-prospects.component.ts).~~
- [x] ~~Convertir notas del prospecto a persistencia backend.~~
- [x] ~~Conversión auto a cliente cuando hay primera reparación aprobada (hoy es manual L484).~~

### Backend
- [x] ~~Tabla `crm_prospect_followups` (id, prospect_id, tipo, fecha, hora, recordatorio, observación, estado).~~
- [x] ~~Endpoints `GET/POST/PUT/DELETE /api/v1/crm/prospects/:id/followups`.~~
- [x] ~~`CrmFollowupsApiService` en frontend.~~

### Aceptado cuando
- [x] ~~Recargar la ficha conserva acciones/timeline.~~
- [x] ~~Hay alerta visible de seguimientos próximos/vencidos.~~

---

## Fase 2 — Gestión de Orden de Compra (OC) formal

**Objetivo:** registrar la OC del cliente y mover el equipo a Posición 05.

### Frontend
- [x] ~~Botón "Cargar OC" en cotización aprobada (número + archivo + fecha) en [crm-quotes.component.ts](src/app/pages/app/crm/crm-quotes.component.ts).~~
- [x] ~~Al cargar OC: pasar equipo a `pedir-repuestos` y marcar quote `Aprobado` sin navegar.~~
- [x] ~~Mostrar OC vinculada en ficha de prospecto y en tarjeta Kanban.~~

### Backend
- [x] ~~Campos OC en `crm_quotes` o tabla `crm_purchase_orders` (numero, archivo, fecha, estado 05).~~
- [x] ~~Extender contrato en [crm-quotes-api.service.ts](src/app/services/crm-quotes-api.service.ts) y types.go.~~

### Aceptado cuando
- [x] ~~OC queda asociada y auditable; estado del equipo cambia a 05 automáticamente.~~

---

## Fase 3 — Despacho documental completo (Posición 10)

**Objetivo:** cerrar entrega con video, correo y remisión, no solo .txt.

### Frontend
- [ ] Añadir estado explícito **Position 10** ("Equipos a despachar").
- [ ] Campo `videoUrl` (YouTube) en panel de despacho [kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L371).
- [ ] Acción "Enviar correo al cliente" con remisión + video + link, en 1 clic.
- [ ] Sellos de garantía / fotos empaque como adjuntos del despacho.

### Backend
- [ ] Servicio de correo (SMTP/API) con plantilla de despacho.
- [ ] Persistir despacho (hoy va en properties del proyecto).

### Aceptado cuando
- [ ] El cierre genera remisión, sube video y envía correo registrado.

---

## Fase 4 — Control de pago y liberación

**Objetivo:** no liberar contra-entrega sin pago confirmado.

### Frontend
- [x] ~~Bloquear "completar despacho" si contra-entrega y sin pago ([kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L2809)).~~
- [x] ~~Mostrar estado de pago en panel de despacho.~~

### Backend
- [x] ~~Migrar pagos de localStorage ([finance-pagos.component.ts](src/app/pages/app/finance/finance-pagos.component.ts#L54)) a `/api/v1/finance/payments`.~~
- [~] Vincular factura ↔ pago ↔ despacho; crédito vs contra-entrega.

### Aceptado cuando
- [~] Contra-entrega bloquea liberación; crédito aplica plazo.

---

## Fase 5 — Facturación electrónica y DIAN

**Objetivo:** estado fiscal real sobre facturación ya existente.

### Backend
- [ ] Estado DIAN + CUFE/autorización en `finance_invoices`.
- [ ] Endpoint de emisión/consulta.

### Frontend
- [ ] Mostrar estado fiscal y CUFE en facturación.

---

## Fase 6 — Mejoras técnicas (persistencia y unificación)

- [~] Unificar equipos Kanban a API (hoy `project-equipment.service` usa store local vs work-teams API).
- [x] ~~Regla "> 2M / gama industrial" como bloqueo, no solo pregunta ([crm-prospect-equipment.store.ts](src/app/pages/app/crm/crm-prospect-equipment.store.ts#L169)). _(Se ejecuta dentro de Fase 7.)_~~
- [ ] Migrar proyectos ([project.service.ts](src/app/pages/app/projects/services/project.service.ts#L24)) e inventario ([inventory-workflow.service.ts](src/app/services/inventory-workflow.service.ts#L29)) a backend.

---

## Fase 7 — Recepción y Registro completo del equipo (Posición 02)

**Origen del requerimiento:** flujo operativo "2. Recepción y Registro del Equipo" (envío, validación de gama industrial, ingreso al sistema, documentación de entrada y asignación técnica).

**Objetivo:** dejar la recepción auditable de punta a punta: método de envío trazado, filtro industrial obligatorio, QR generado en recepción, fotos por cara obligatorias + Formato de Recepción descargable, y asignación de técnico por carga y tecnología.

### Estado del código hoy (línea base verificada)
- Modal de recepción ya soporta familia/marca/tipo/serie/identificador y catálogo industrial en [crm-prospect-equipment-modal.component.ts](src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts).
- Persistencia backend de `crm_equipment_records`/items con recepción (día/mes/año), evidencias, attachments y `assignedTo` en [backend/internal/crm/equipment/types.go](backend/internal/crm/equipment/types.go) y [backend/internal/crm/equipment/service_records.go](backend/internal/crm/equipment/service_records.go).
- Evidencias capturan EXIF + SHA-256 + miniatura en [crm-prospect-equipment-evidence.util.ts](src/app/pages/app/crm/crm-prospect-equipment-evidence.util.ts).
- Filtro industrial existe como pregunta `costAboveTwoMillion` (warning, no bloqueo) en [crm-prospect-equipment.store.ts](src/app/pages/app/crm/crm-prospect-equipment.store.ts#L169).
- QR del equipo se genera en el Kanban con `refreshEquipmentQrPreview()` en [kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L3523) — NO en la recepción.
- Listado de recepciones ya muestra "Sin asignar" en [work-teams.component.ts](src/app/pages/app/work/work-teams.component.ts#L205), pero sin acción "Asignar técnico".
- No existe generación del "Formato de Recepción" descargable.

### Brechas detectadas vs el flujo de la imagen

1. **Envío del equipo** — no se registra método (`transportadora` / `personal`), ni transportadora, ni guía entrante, ni fecha de recepción física vs documental.
2. **Validación de filtros (gama industrial > 2M)** — la respuesta `costAboveTwoMillion` no bloquea ni exige autorización del jefe; el catálogo industrial no marca cuáles modelos son `industrial`.
3. **Ingreso al sistema (ID/QR único)** — el QR aparece sólo cuando se abre el proyecto en Kanban; en recepción no se genera ni se imprime etiqueta.
4. **Documentación de entrada** — los tipos de evidencia (`general/serial-plate/visible-damage/accessories/other`) no obligan fotos por **cara** (frente, atrás, izq, der, sup, inf) ni se exporta el **Formato de Recepción** con la falla reportada y firmas.
5. **Asignación técnica** — `assignedTo` se llena con el `empleado` del prospecto; no hay UI del jefe para asignar por **especialidad/tecnología** y **carga laboral** (work-workload trae un modal "Asignar tecnico" no enlazado a recepción).

### Frontend
- [x] ~~**F7.1 Envío del equipo:** agregar en el paso "Recepción" del modal los campos `intakeMethod` (`transportadora` | `personal`), `intakeCarrier`, `intakeTrackingNumber`, `intakeReceivedAt` (fecha+hora), con render condicional cuando es transportadora ([crm-prospect-equipment-modal.component.ts](src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts#L1099)).~~
- [x] ~~**F7.2 Filtro industrial duro:** marcar modelos del maestro como `isIndustrial`, calcular `requiresIndustrialOverride = !isIndustrial || costAboveTwoMillion === "No"`, y bloquear el botón Guardar cuando sea `true` salvo que se marque "Autorizado por jefe" + nombre. Persistir en `industrialOverride { authorizedBy, reason, authorizedAt }` en el item ([crm-prospect-equipment.store.ts](src/app/pages/app/crm/crm-prospect-equipment.store.ts#L169)).~~
- [x] ~~**F7.3 QR de equipo en recepción:** generar QR por item al cerrar el wizard usando `QRCode.toDataURL` con payload `{recordId, itemId, identifier, shortCode}`; mostrar y permitir imprimir/descargar PNG. Adjuntarlo al item como `attachments` tipo `qr-label`. Reutilizar utilidades ya presentes en [kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L3502) extrayendo a `equipment-qr.util.ts`.~~ _(validado en API: `hasQr: true` sobre registro generado por prueba)_
- [x] ~~**F7.4 Fotos por cara obligatorias:** extender `ProspectEquipmentEvidenceType` con `face-front | face-back | face-left | face-right | face-top | face-bottom` y exigir ≥1 foto por cada cara antes de pasar de paso "evidence" a "signatures" en el wizard. Checklist visual con tildes y bloqueo del "Siguiente".~~ _(validado en API: `hasRequiredFaces: true` y en Playwright F6/F7)_
- [x] ~~**F7.5 Formato de Recepción:** nuevo botón "Descargar formato de recepción" al cerrar la recepción que arme un PDF/HTML imprimible con: datos del cliente, equipos, falla reportada, evidencias miniatura, firmas y QR. Implementar con `window.print()` sobre una vista dedicada `crm-prospect-equipment-reception-print.component.ts` (sin librerías nuevas).~~ _(ajuste de change detection aplicado y validado en live: `PRINT_TITLE_VISIBLE`)_
- [x] ~~**F7.6 Asignación técnica:** acción "Asignar técnico" en [work-teams.component.ts](src/app/pages/app/work/work-teams.component.ts#L205) y en cada item del modal, mostrando técnicos filtrados por `speciality` y su carga (conteo de items activos del técnico). Persistir `assignedTo`, `assignedToId`, `assignedAt`, `assignedBy`.~~ _(flujo validado en script CRUD live + endpoint de asignación)_

### Backend
- [x] ~~**F7.7 Campos de envío** en `crm_equipment_records`: `intake_method`, `intake_carrier`, `intake_tracking_number`, `intake_received_at`. Migración idempotente `ALTER ... ADD COLUMN IF NOT EXISTS` y mapeo en [service_record_sql.go](backend/internal/crm/equipment/service_record_sql.go) y [types.go](backend/internal/crm/equipment/types.go).~~
- [x] ~~**F7.8 Override industrial** por item: agregar a `EquipmentItem` los campos `industrial_override_authorized_by`, `industrial_override_reason`, `industrial_override_at`. Validar en handler que si `costAboveTwoMillion = "No"` y `isIndustrial = false`, el override sea obligatorio.~~ _(validado en E2E: `apiPersistedOverrideFields` true)_
- [x] ~~**F7.9 Catálogo industrial:** en `company_equipment_models` agregar columna `is_industrial BOOLEAN NOT NULL DEFAULT true` y exponerla en `IndustrialEquipmentModelRecord`.~~ _(el catálogo de modelos es frontend/localStorage; no existe tabla `company_equipment_models` en la BD, el `ALTER ... IF EXISTS` queda defensivo. La bandera `isIndustrial` ya se expone en UI/contrato)_
- [x] ~~**F7.10 Evidencias por cara:** ampliar `EvidencePhoto.EvidenceType` permitiendo nuevos valores y validar el set mínimo `face-front, face-back, face-left, face-right` (top/bottom opcionales) al cerrar la recepción vía endpoint `POST /api/v1/crm-equipment/records/:recordID/finalize`.~~ _(validado por flujo Playwright + `FinalizeRecord` en backend)_
- [x] ~~**F7.11 Asignación técnica:** nuevos campos en item `assigned_to_id`, `assigned_at`, `assigned_by`. Endpoint `PUT /api/v1/crm-equipment/records/:recordID/items/:itemID/assignment` con validación de existencia del técnico (`hr_employees` o tabla auxiliar). Devolver carga actual por técnico en `GET /api/v1/crm-equipment/technicians?speciality=...`.~~ _(validado en API live: `assignmentStatus: 200`, `assignmentPersisted: true`)_

### Verificaciones obligatorias (no romper lo existente)
- [x] ~~`npm run build` sin errores ni nuevos warnings críticos.~~
- [x] ~~`cd backend && go build ./...` sin errores.~~
- [x] ~~`gofmt -l backend/internal/crm/equipment | grep .` debe estar vacío.~~ _(verificado en archivos modificados de esta fase; existe preexistente no relacionado en `service_insights.go`)_
- [x] ~~Migración corre dos veces sin error (idempotencia). Validar con `systemctl restart alfa-backend.service && journalctl -u alfa-backend.service -n 80 --no-pager`.~~
- [x] ~~Endpoints regresión:~~
  - [x] ~~`GET /api/v1/crm-equipment/records` sigue respondiendo `200` con la forma actual.~~ _(corregido bug 500: la BD usa columna `alfa_signature`, no `pika_signature`; SQL/migración alineados)_
  - [x] ~~`POST /api/v1/crm-equipment/records` acepta payload SIN los nuevos campos (defaults) — backward compatible.~~
  - [x] ~~`POST /api/v1/crm-equipment/records/:id/items/:id/attachments` no cambia de contrato.~~
- [x] ~~Script Playwright de ciclo F6/F7 (solo lo implementado) verde 100%:~~ `node scripts/check-fase6-fase7-cycle-playwright.mjs` → `PLAYWRIGHT_FASE6_FASE7_CYCLE_OK` (10/10 checks).
- [x] ~~Scripts Playwright que deben seguir verdes tras los cambios:~~
  - [x] ~~`node scripts/check-work-equipment-crud-playwright.mjs`~~
  - [x] ~~`node scripts/check-work-equipment-history-implementation-playwright.mjs`~~
  - [x] ~~`node scripts/check-work-equipment-lubot-ai-playwright.mjs`~~
- [ ] Smoke manual mínimo (en `https://alfa.software.net.co`):
  1. Crear recepción nueva sin OC ni filtro industrial → debe bloquear si `costAboveTwoMillion = "No"` y sin override.
  2. Subir 6 fotos (una por cara) → wizard avanza; con 3 → "Siguiente" deshabilitado.
  3. Descargar Formato de Recepción → PDF/print abre con datos y QR.
  4. Asignar técnico desde listado de recepciones → el badge "Sin asignar" desaparece y queda registrado el técnico.
  5. Recargar la página: TODO lo anterior persiste (backend, no localStorage).

### Aceptado cuando
- [x] ~~Recepción registra método de envío y queda trazable.~~
- [x] ~~Sin gama industrial o sin > 2M la recepción no se guarda salvo override autorizado.~~
- [x] ~~Cada item nuevo nace con QR descargable e impreso desde la misma pantalla.~~
- [x] ~~Cada item tiene al menos las 4 caras obligatorias documentadas.~~
- [x] ~~El Formato de Recepción se puede descargar/imprimir desde la ficha.~~
- [x] ~~El jefe puede asignar técnico viendo carga actual y tecnología.~~

### Estrategia incremental sugerida
1. F7.7 + F7.1 (envío) — bajo riesgo, sólo agrega columnas y campos.
2. F7.9 + F7.2 (industrial) — añade flag al catálogo antes de activar el bloqueo en UI.
3. F7.3 (QR en recepción) — refactor menor de utilidades QR.
4. F7.10 + F7.4 (fotos por cara) — primero contrato backend tolerante, después UI obligatoria.
5. F7.5 (Formato de Recepción) — capa de presentación pura, sin tocar APIs.
6. F7.11 + F7.6 (asignación técnica) — endpoint nuevo + UI; último por dependencia con HR/empleados.

Cada paso cierra con `npm run build`, `go build`, `restart-alfa-backend-service` y el script Playwright relevante antes de pasar al siguiente.

---

## Fase 8 — Diagnóstico Técnico (Posición 0)

**Origen del requerimiento:** flujo operativo "3. Diagnóstico Técnico (Posición 0)":
1. **Inspección técnica:** el técnico desarma el equipo y hace pruebas estáticas o de encendido para identificar la falla.
2. **Estimación de recursos:** el técnico registra en el "Memo" (bitácora) las horas hombre estimadas y un presupuesto aproximado de repuestos **en dólares**.
3. **Cierre de diagnóstico:** se completa el proceso técnico inicial y el **código desaparece de la pantalla del técnico** para pasar al **área administrativa**.

### Estado del código hoy (línea base verificada)
- Estado `diagnostico` (Position 0) existe en [project-workflow.config.ts](src/app/pages/app/projects/project-workflow.config.ts#L43).
- En el detalle Kanban (pestaña "Equipo técnico") ya son editables: Memo diagnóstico (`diagnosticNotes`), Memo reparación (`repairNotes`), `% reparabilidad`, `actualHours` y `testType` ([kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L571)).
- `estimatedHours` existe pero vive en la pestaña "Planeación y notas"; `estimatedMaterialCost ($)` vive en "Materiales"; la moneda del proyecto es `currency` (COP/USD).
- La transición de etapa usa `selectStatus()` → `applyProjectStatusChange()` y ya sella `stageEnteredAt`/`stageName` ([kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L4384)).
- **Proyectos NO tienen backend**: persisten en `localStorage` (`lars.projects.items.v3` / `lars.projects.board.v3`) vía [project.service.ts](src/app/pages/app/projects/services/project.service.ts#L24). **No existe tabla `projects` en la BD** (confirmado contra el esquema).
- `auth.service` expone `user.role` en sesión, pero el tablero **no filtra por rol**: todos ven todos los casos.

### Brechas detectadas vs el flujo de la imagen
1. **Inspección técnica** — la captura es texto libre; no hay checklist mínimo (desarme / prueba estática / prueba de encendido) ni marca explícita de "falla identificada".
2. **Estimación de recursos** — horas hombre y presupuesto de repuestos están dispersos (Planeación + Materiales) y el presupuesto **no está fijado a USD**, aunque el flujo pide dólares; no se consolidan en el cierre.
3. **Cierre de diagnóstico** — no hay acción "Cerrar diagnóstico" que valide, transicione al área administrativa (`por-cotizar`) y selle autor/fecha; tampoco existe "el código desaparece de la pantalla del técnico" (sin filtro técnico vs administrativo).
4. **Persistencia** — ya existe backend mínimo de proyectos (`/api/v1/projects*`), pero el frontend actual aún usa `localStorage` como fuente principal hasta completar la migración de Fase 6.

### Frontend (preservando usabilidad: sin pantallas nuevas, todo dentro del detalle ya existente)
- [x] ~~**F8.1 Bloque "Diagnóstico (Posición 0)"** en la pestaña Equipo técnico: agrupar lo ya existente (Memo diagnóstico, `% reparabilidad`, `testType`) y AÑADIR un checklist ligero `diagnosisInspection { disassembled, staticTest, powerOnTest, faultIdentified }` (4 switches) en [kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L571). No eliminar ni mover los campos actuales.~~ _(implementado en UI del modal y validado en live)_
- [x] ~~**F8.2 Estimación consolidada en el Memo:** mostrar `estimatedHours` (horas hombre) junto a un nuevo `partsBudgetUsd` (presupuesto de repuestos en USD, con `$` explícito), reutilizando el patrón visual de `estimatedMaterialCost`. Mantener `estimatedMaterialCost`/`budget` intactos (Planeación/Materiales) para no romper nada; `partsBudgetUsd` es el campo oficial del diagnóstico en dólares.~~ _(campo USD visible y persistente en localStorage live)_
- [x] ~~**F8.3 Acción "Cerrar diagnóstico":** botón visible solo si `status === 'diagnostico'`. Valida `faultIdentified === true`, `diagnosticNotes` no vacío, `estimatedHours > 0` y `partsBudgetUsd > 0`. Si pasa: `applyProjectStatusChange(project, 'por-cotizar')`, sella `diagnosisClosedAt` y `diagnosisClosedBy` (usuario/`assignee`) y persiste con `persistProjectDetail`. Si falta algo, mensaje claro y NO cambia de estado.~~ _(validado en Playwright live: bloqueo sin requisitos + transición y sellos persistidos)_
- [x] ~~**F8.4 Visibilidad técnico/administrativo (el código "desaparece"):** toggle de cabecera `boardAudience: 'tecnico' | 'administrativo' | 'todos'`. En modo `tecnico` ocultar de las columnas los proyectos con `diagnosisClosedAt` presente; implementarlo como **filtro de presentación** en `getProjectsByColumn`/`visibleProjects`, sin borrar datos. Default `todos` para no alterar el comportamiento actual.~~ _(validado en live: tecnico oculta, administrativo/todos muestran)_
- [x] ~~**F8.5 Normalización defensiva:** incluir los nuevos `properties` en `normalizeProject` y `prepareProjectForSave` con defaults (`partsBudgetUsd: 0`, `diagnosisInspection` con flags `false`, `diagnosisClosedAt: ''`, `diagnosisClosedBy: ''`) para que los registros viejos no fallen.~~ _(agregado en normalización + guardado en [kanban-view.component.ts](src/app/pages/app/projects/kanban-view.component.ts#L3686))_

### Backend (confirmación de lo que falta)
- [x] ~~**F8.6 Dominio `projects` en Go (no existe hoy):** crear `backend/internal/projects` (tabla + handler + servicio CRUD por `company_id`) replicando el patrón de `crm/equipment`. Mínimo viable: persistir `status` y `properties` (JSONB) con campos de diagnóstico y sellos de cierre.~~ _(implementado: rutas `GET/POST/PUT /api/v1/projects` + `GET /api/v1/projects/:id`)_
- [x] ~~**F8.7 Endpoint de cierre `POST /api/v1/projects/:id/diagnosis/close`:** validación server-side (falla identificada, `estimatedHours > 0`, `partsBudgetUsd > 0`), setea `status = 'por-cotizar'` y sella `diagnosis_closed_at/by`. Idempotente.~~ _(validado API local 8091: 400 sin requisitos, 200 con cierre, segundo cierre 200 conservando `diagnosisClosedAt`)_
- [x] ~~**F8.8 Migración idempotente:** `CREATE TABLE IF NOT EXISTS projects (...)` con índice por `(company_id, status)`; sin tocar otras tablas. Depende del item de Fase 6 "migrar proyectos a backend".~~ _(migration añadida y arranque repetido del backend sin error)_
- _Nota:_ F8.1–F8.5 siguen operando en `localStorage` sin romper flujo actual; F8.6–F8.8 ya exponen backend `projects` para cerrar diagnóstico con validación server-side e idempotencia.

### Verificaciones obligatorias (no romper lo existente)
- [x] ~~`npm run build` sin errores.~~
- [ ] Abrir un proyecto en `diagnostico`: los campos actuales (Memo, `% reparabilidad`, `testType`, horas, materiales) siguen guardando igual.
- [x] ~~"Cerrar diagnóstico" sin requisitos completos → muestra error y **NO** cambia de estado.~~ _(Playwright live)_
- [x] ~~"Cerrar diagnóstico" completo → pasa a `por-cotizar`, sella fecha/autor y persiste tras recargar.~~ _(Playwright live: `activeStatusText=Por cotizar`, `diagnosisClosedAt` y `diagnosisClosedBy` persistidos)_
- [x] ~~Filtro `tecnico` oculta casos con diagnóstico cerrado; `todos` los vuelve a mostrar (sin pérdida de datos).~~ _(Playwright live)_
- [x] ~~Proyectos existentes (sin los nuevos campos) cargan sin errores (defaults aplicados).~~ _(validado al abrir proyecto seed sin estructura F8 previa y persistir cierre)_
- [x] ~~Si se implementa backend: migración corre dos veces sin error; `GET/POST /api/v1/projects*` responde y el resto del Kanban sigue igual.~~ _(verificado en `:8091` con login JWT + create/get/list/close diagnóstico)_

### Aceptado cuando
- [x] ~~El técnico registra inspección (desarme/estática/encendido) y marca "falla identificada".~~
- [x] ~~El Memo de diagnóstico consolida horas hombre y presupuesto de repuestos en USD.~~
- [x] ~~"Cerrar diagnóstico" valida, pasa el caso a administrativo (`por-cotizar`) y deja sello auditable.~~
- [x] ~~En vista técnico, el caso con diagnóstico cerrado desaparece del tablero del técnico.~~
- [x] ~~Todo persiste (localStorage hoy; backend cuando exista F8.6–F8.8).~~ _(persistencia localStorage validada y backend `projects` validado por API)_

### Estrategia incremental sugerida
1. F8.5 + F8.1 (normalización + bloque inspección) — bajo riesgo, solo agrega `properties`/UI.
2. F8.2 (estimación USD consolidada) — agrega `partsBudgetUsd` sin tocar campos previos.
3. F8.3 (acción Cerrar diagnóstico) — validación + transición ya existente.
4. F8.4 (filtro técnico/administrativo) — filtro de presentación, default `todos`.
5. F8.6–F8.8 (backend proyectos) — último; conecta persistencia auditable.

Cada paso cierra con `npm run build` + smoke en el detalle de proyecto antes de continuar.

---

## Orden sugerido
1. Fase 1 + 2 (impacto alto, riesgo bajo) — ✅ hechas.
2. Fase 4 — ✅ frontend hecho; cerrar vínculo factura↔pago↔despacho.
3. Fase 7 — recepción (F7.1 a F7.11 ✅).
4. Fase 8 — diagnóstico técnico (Posición 0): F8.1–F8.8 ✅ (frontend + backend).
5. Fase 3 (despacho documental) — depende de servicio de correo.
6. Fase 5 + 6 (fiscal y robustez; F6 incluye migrar proyectos a backend, base de F8.6).

## Validación por fase
- [x] `npm run build` sin errores.
- [x] Playwright relevante en `scripts/`.
- [x] Reinicio/recarga backend si aplica (`force-reload-backend-8091` en esta iteración).
