# PLAN — Eliminar mock/localStorage: todo dato de negocio respaldado en el servidor

Repo: `/Users/ludwig/Desktop/alfa/repo` · Rama de trabajo: `persistencia-servidor` (off `cambios-Anderson`)
Origen: auditoría de 10 transcripciones de requerimientos ALFA (reportes en `/Users/ludwig/Desktop/alfa/repo/persistencia/audit/`)
Versión: v2 — incorpora Recepción (Fase 8B) y Despacho/Facturación (Fase 5, ítems 6-16)

## Estado de ejecución

| Fase | Commit | Verificación | En remoto |
|---|---|---|---|
| 0 — base | — | BD local `alfa` creada y migrada | — |
| 1 — stores en memoria → Postgres | `68cbdba7` | build/vet 0, 6 tests SLA con BD real | ✅ |
| 2 — ACL aplicado + fin de `email_password` | `469fe73e` | build/vet 0, tests acl+hr con BD real, middleware montado | ✅ |
| 2b — identidad de usuario real | `170a67a5` | build/vet 0, 10 tests auth con BD real, E2E propio: `ventas`→403 y `admin`→200 en `/hr/employees` y `/users` | ✅ |
| 2c — seeds ACL denegados por defecto | `0f61dfde` | build/vet 0, tests acl+auth+hr con BD real, scopes verificados en BD | ✅ |
| 3 — tablero técnico contra la API | `12077f39` | build/vet 0, `tsc --noEmit` 0 errores, tests projects+crm/equipment sin caché, E2E con servidor real | ✅ |
| 4 — horas, timesheet y pruebas funcionales | `e89940f3` | build/vet 0, 8 tests worktime con BD real, `tsc --noEmit` 0, prueba de fuego propia: cross-session + reinicio | ✅ |
| 5a — finanzas sin mock (caja menor, garantías, retenciones, cartera) | `36b5bb90` | build/vet 0, 6 tests finance con BD real, `tsc` 0, greps de mocks y `setItem` vacíos, prueba de fuego propia cross-session + reinicio | ✅ |
| 5b — facturación como módulo | `5a4ea20e` | build/vet 0, tests finance+crm con BD real, `tsc` 0, fire test propio: Enviado→locked, PUT/DELETE→409, NC ajusta saldo, sobrevive reinicio | ✅ |
| 5c — correos con outbox, puente pago→despacho, campanita | `4f437c22` | build/vet 0, tests mailer+remissions+crm+finance con BD real, `tsc` 0, fire test propio sin SMTP: `desactivado` visible, 401 sin token, contra-entrega→409 hasta factura Pagada | ✅ |
| docs — plan, auditorías y evidencia al repo | `17af3ea6` | — | ✅ |
| extra — autor de la acción comercial desde la sesión | `e7f17e91` | — | ✅ |
| fix(hr) — `CommonModule` faltante rompía `ng build` en HEAD | `a0440452` | `ng build` pasa de NG8002 a 0 errores | ✅ |
| 6 (parcial) — consecutivos generados en el servidor | `2458ccc7` | build/vet 0, `go test ./...` con `RUN_DB_TESTS=1` (13 paquetes ok, concurrencia 8 goroutines), `ng build` 0, fire test HTTP real: 8 POST concurrentes → `[2..9]` sin duplicados, cotización con código vacío → `COT-2026-001` | ✅ |
| 6 (parcial) — maestros de equipos al servidor + ruta del CRUD | `77ab7b35` | build/vet 0, `go test ./...` con `RUN_DB_TESTS=1` `-count=1` (14 paquetes ok, +8 tests de catálogo), `tsc --noEmit` 0, `ng build` 0 | ✅ |
| 6 (resto) - 9 | pendientes | — | — |

Todo lo commiteado está subido a `origin/cambios-Anderson` (último push de código `77ab7b35`).

**Abierto de la Fase 6:** hechos el ítem 3 (consecutivos) y el ámbito *equipment* del ítem 1-2
(maestros de equipos). Los prefijos comerciales siguen en localStorage
(`company-commercial-settings.store.ts`) y **nada escribe `company_settings`**, así que el servidor
cae al fallback `COT` / `FAC-<año>-` y un prefijo personalizado en la UI no se aplica. Ese puente es
el ítem 2 de la Fase 6 y conviene hacerlo antes de demostrar cotizaciones. Pendientes también:
`company-followups-config.component.ts`, `crm-zones.store.ts`, `crm-quote-preview.store.ts`,
comisiones, y el ítem 4 (`personalization.component.ts`).

**Hecho en `77ab7b35` — maestros de equipos (cierra el "Ojo" de la Fase 8B):** el selector "Modelo
industrial" del modal de recepción sólo podía mostrar 3 modelos demo, porque el catálogo vivía en
localStorage con `DEFAULT_*` hardcodeados y `CompanyEquipmentConfigComponent` **no tenía ruta
registrada**. Evidencia del impacto real: de 46 recepciones en la BD, el 100% de los
`equipmentModelId` no vacíos eran uno de esos 3 demo (9 Yaskawa, 5 Siemens, 4 Allen-Bradley; 28
vacíos). Ahora hay 4 tablas por empresa (`company_equipment_families/_models/_service_types/
_locations`, PK `(company_id, id)`), el paquete `internal/equipmentcatalog` con
`GET /equipment-catalog` + `PUT`/`DELETE` por entidad, el store reescrito como caché respaldada por
la API (getters síncronos conservados: los consumen 5 módulos), y la ruta
`/app/company-equipment-config` con entrada "Config. Equipos" en el menú Compañía. La siembra es
**condicionada**: los `DEFAULT_*` sólo se replican en empresas que ya tienen recepciones
referenciándolos; una empresa nueva arranca con el catálogo vacío, sin datos inventados. De paso le
dio sentido al `ALTER TABLE` huérfano de `migrations_crm_equipment_quotes.go:251`.

**Ojo con los cambios de contrato para quien trabaje sobre esta rama:** `normalizeInvoice` ahora
acepta `sequenceNumber == 0` (= asignación automática), `POST /finance/invoices` ya no exige un
número mayor que cero, `UpsertQuote` acepta `codigo` vacío, y `nextInvoiceSequenceTx` desapareció
(su lugar lo ocupa `allocateInvoiceSequence`). `Migrate()` ahora toma `pg_advisory_lock`.

**Abierto de 5c:** el envío SMTP real nunca se probó contra un servidor de correo (solo `Sender`
falso en tests); la UI de la 5c no se verificó en navegador; `GET /emails` con rol no-admin no se
probó para el 403.

**Bug hallado y corregido en 5a:** el export Oasis y la cartera consultaban la tabla inexistente
`invoices` (devolvían siempre vacío); ahora `finance_invoices` con JOIN a `crm_clients` para NIT+DV.
**Semántica abierta para el dueño:** las retenciones se modelan como valores absolutos con
`suma <= amount`, aunque la UI las rotula "(%)". Confirmar con la contadora.

**Pendientes explícitos de Fase 4 (documentados, no olvidados):** `lars.hr.worktime.schedules` y
`...business-days.v1` siguen en localStorage → Fase 6 (config por empresa); los botones
"Restaurar mock"/"Guardar configuración" de RRHH solo afectan esas claves locales y se retiran en
Fase 5; la migración de localStorage no se verificó en navegador real (lógica cubierta por
reintento + dedupe por id).

**Nota sobre 2c:** el seed concedía `ver` a todo rol sobre todo módulo activo, así que `Técnico` y
`ventas` leían datos personales de empleados. Corregido en el seed y en las filas ya sembradas
(migración con marcador de una sola ejecución, porque `Migrate()` corre en cada arranque y sin la
guarda revertiría lo que el admin concediera después). Verificado en BD: `Técnico`=0, `ventas`=0,
`Superadmin`=1. **Pendiente de negocio:** decidir qué roles necesitan acceso a `administracion` y
concederlo por el panel.

**Fase 3 verificada en navegador real (2026-10-20, Chromium headless de Playwright):**
el tablero lee del servidor (`GET /projects`, `/projects/board-config`, `/projects/sla-config` → 200),
muestra un proyecto creado por API, lo conserva tras recargar **y tras borrar localStorage**, y un
segundo contexto de navegador ve el mismo tablero. `localStorage` queda reducido a
`pika.auth.session`, `pika.apiBaseUrl` y `lars.work.time.tracker.v1` (timesheet → Fase 4).
Cero errores de consola. Evidencia en `/Users/ludwig/Desktop/alfa/repo/persistencia/verificacion-fase3/`.

**Los 4 checks que fallan en `check:technical-closure-flow` son huecos preexistentes, no regresión
de la Fase 3:** ese test no crea ningún proyecto (`POST /projects` = 0 en el log), porque el puente
recepción→proyecto (`crm-prospect-equipment-modal.component.ts:2338-2363`) solo dispara para ítems
de tipo reparación; las transiciones automáticas server-side (3.6) y la notificación por cambio de
estado siguen pendientes según la auditoría. **Defecto nuevo encontrado:** esa misma llamada traga
los errores con `.pipe(catchError(() => of(null)))` — si crear el proyecto falla, la recepción
termina "bien" y el equipo nunca llega al tablero. Contradice la regla de errores visibles;
candidato a arreglo pequeño en Fase 4.

**Deuda técnica aceptada en Fase 3:** el board-config se guarda en una fila reservada
`id='board-config'` de la tabla `projects` (el agente no tenía ámbito para crear migración).
Funciona y está protegida —`ListProjects` la excluye con `AND id <> $2` y `DeleteProject` la
rechaza—, pero lo correcto es una tabla `project_board_configs` propia. Candidato a Fase 9.

**Pendientes explícitos de Fase 3:** backend de horas/timesheet (→ Fase 4; el timer ya persiste
`actualHours` vía `PUT /projects/:id`, no quedó nada en localStorage), SMTP para el correo de
`notifyClient` (hoy queda como notificación persistente), transiciones automáticas server-side
(3.6) e inmutabilidad de adjuntos al cerrar (3.3). Fuera de ámbito: `crm-quotes.component.ts:863`
hace `updateProject(...).subscribe()` sin manejador de error.

## Regla de alcance

**Va al servidor:** todo dato de negocio — equipos, tableros, horas, gastos, cuentas, comisiones,
configuración por empresa, estanterías, trazas, informes, garantías, reservas, pedidos.

**Se queda en el navegador (excepción documentada):**
- `auth.service.ts` → token JWT (estándar, y el backend ya lo valida)
- `api-base-url.util.ts` → override de URL para desarrollo local
- `theming.component.ts` / `personalization.component.ts` → SOLO preferencia visual (tema, densidad).
  Si se verifica que guardan configuración de negocio, pasan al servidor en Fase 6.

Justificación: no son datos de negocio y forzarlos a BD añadiría latencia y acoplamiento sin beneficio.

## Estado verificado (no asumido)

| Hallazgo | Evidencia |
|---|---|
| Tablero técnico vive en localStorage | `src/app/pages/app/projects/services/project.service.ts:1047,1081,1163,1171` |
| CRUD Go de proyectos existe y **nadie lo llama** | `backend/internal/projects/handler.go:22-34` registrado en `main.go:143`; grep de `/projects` en `src/app` = 0 llamadas reales |
| SLA, notificaciones e informes técnicos en memoria | `backend/internal/projects/service.go:368-370` (`slaConfigStore`, `notificationStore`, `technicalReportStore`) |
| Documentación y backups en memoria | `backend/internal/docs/service.go:9-18` |
| 34 archivos del frontend usan localStorage/sessionStorage | grep `-rl` sobre `src/app` |
| ACL configurado en UI pero **no aplicado** | `main.go:132-133` solo JWT+IP; `RequirePermission` = 0 apariciones |
| `email_password` se devuelve en plano | `migrations_hr.go:50`, `GET /hr/employees/:id` |

Convenciones del proyecto que se respetan:
- Migraciones: función `migrationStatementsXxx()` en `backend/internal/platform/database/migrations_*.go`,
  registrada en `migrationStatements()` de `migrations_all.go`. SQL idempotente (`CREATE TABLE IF NOT EXISTS`).
- Handlers: `NewHandler(service)` + `RegisterRoutes(group *echo.Group)`, montado en `main.go` sobre `protectedAPI`.
- Company scoping: `company.IDFromRequest(c)` en cada handler.
- Frontend: `*-api.service.ts` por dominio + `api-base-url.util.ts`.

---

## FASE 0 — Base y línea de partida

1. Crear rama `persistencia-servidor` desde `cambios-Anderson` (no tocar `master`, propiedad de Miguel).
2. `npm install` (node_modules ausente) para poder compilar el frontend.
3. Línea base: `go build ./...` y `go vet ./...` en `backend/`; `npx tsc --noEmit -p tsconfig.app.json`.
   Se anota el resultado ANTES de tocar nada para no atribuirse fallas preexistentes.
4. Inventario definitivo de claves de storage: grep de `setItem/getItem/removeItem` con su key literal.

**Gate:** baseline capturado y documentado.

---

## FASE 1 — Backend: mapas en memoria → Postgres  *(P0)*

Nada de esto persiste hoy un reinicio. Sin esta fase, conectar el frontend no sirve de nada.

**1.1 Nueva migración** `migrations_server_persistence.go` (+ registro en `migrations_all.go`):
- `project_sla_configs` (company_id, stage, days, config_json, updated_at)
- `project_notifications` (company_id, id, project_id, type, message, read_at, created_at)
- `project_technical_reports` (company_id, id, project_id, payload_json, created_by, created_at)
- `documents` y `software_backups` (company_id, id, equipment_model, meta_json, created_at)

**1.2 `internal/projects/service.go`**: reemplazar los 3 stores package-level (:368-370) por queries
contra las tablas nuevas, conservando las firmas públicas (`ListTechnicalReports`, `CreateTechnicalReport`,
`getSLAConfig`, `updateSLAConfig`, notificaciones) para no romper `handler.go`.

**1.3 `internal/docs/service.go`**: reemplazar `docs`/`backups` en memoria (:9-18) por Postgres.
Añadir protección de borrado y buscador (hueco reportado por el auditor de Técnica).

**Gate:** `go build ./...` + `go vet ./...` limpios; test dirigido por store nuevo; reiniciar el binario
y confirmar que los datos sobreviven (prueba manual de persistencia).

---

## FASE 2 — Seguridad: aplicar el ACL que ya existe  *(P0, riesgo habeas data)*

Reportado por Administrativa: el panel de roles se configura pero no tiene efecto.

1. Middleware `RequirePermission(module, action)` consumiendo `acl_role_field_permissions`
   (tabla ya creada en `migrations_acl_security.go:71`), montado en `protectedAPI` tras JWT.
2. Aplicarlo a rutas sensibles: `/hr/*`, `/finance/*`, `/acl/*`, `/inventory/*` (ajustes), `/suppliers/*`.
3. **Enmascarado por campo**: filtrar en el handler según permisos de campo del rol.
4. **`email_password`**: dejar de devolverlo en `GET /hr/employees/:id` y en listados. Nunca sale al cliente.
5. Ampliar el catálogo de módulos seed (`acl/service_modules.go:83-124`, hoy solo 4) a: técnico,
   cotizaciones, compras, CRM, inventario, remisiones, administración.
6. Frontend: el rol deja de elegirse en un `<select>` guardado en localStorage
   (`inventory-rbac.service.ts:16,149`); se lee del perfil autenticado.

**Gate:** request con rol sin permiso → 403 verificable; `email_password` ausente de toda respuesta.

---

## FASE 2b — Identidad de usuario real  *(P0, descubierta al verificar la Fase 2)*

La Fase 2 quedó aplicada y con tests en verde, pero **hoy no restringe a nadie**: no existe
identidad de usuario, así que todo login es admin y el middleware hace bypass para admin.

Evidencia verificada:
- No hay tabla `users` en ninguna migración (lo único parecido es `acl_user_soft_delete_events`).
- `internal/auth/service.go` tiene **0 consultas a BD**; recibe `DB` en el `Config` y no lo usa.
- El login valida una única pareja de credenciales de entorno:
  `if email != s.adminEmail || req.Password != s.adminPassword → errInvalidCredentials`.
- Emite siempre `Role: s.adminRole` (default `"admin"`), y `isAdminRole(role)` → `return next(c)`.
- Defaults peligrosos si el entorno no define las variables: `defaultAdminPassword = "1234"`,
  `defaultJWTSecret = "pika-local-dev-jwt-secret"`.
- Existe `signup` en `internal/auth/handler.go:69` pero sin persistencia no crea usuarios reales.

Trabajo:
1. Migración `users` (company_id, id, email único por empresa, password_hash, name, role,
   activo, created_at). **Nunca** contraseña en plano: hash con `golang.org/x/crypto`, que ya
   está en `go.mod`.
2. `auth.Login` consulta la BD y compara hash; emite el rol **del usuario**, no `adminRole`.
3. `signup` persiste de verdad. Decidir y documentar si el primer usuario de una empresa nace
   admin y los siguientes los crea ese admin (no auto-asignación de rol desde el cliente).
4. Sembrar la cuenta admin actual desde entorno **solo si no existe**, y que el default de
   `JWT_SECRET` falle en producción en vez de caer al secreto de desarrollo.
5. Migración de la cuenta única actual a la tabla, sin dejar a nadie fuera.

**Gate:** dos usuarios con roles distintos obtienen respuestas distintas en `/hr/employees`;
login con credencial inválida → 401; ningún JWT emite `admin` salvo la cuenta admin real.

---

## FASE 3 — Frontend: tablero técnico contra la API real  *(P0, núcleo del negocio)*

El mayor corte: 17 de 39 ítems del módulo Técnico están "no conectado".

1. `projects-api.service.ts` nuevo (patrón de `inventory-api.service.ts`) cubriendo TODO lo ya
   registrado en `handler.go:22-34`: listado, create, get, update, `diagnosis/close`,
   sla-config, notifications, technical-reports.
2. `project.service.ts`: eliminar `boardStorageKey`/`projectsStorageKey` (:1047-1171). El board se
   deriva del estado servidor. Sin fallback silencioso a localStorage: si falla, error visible.
3. `kanban-view.component.ts`:
   - Historial de despacho → backend (hoy localStorage, `project.service.ts:1166-1171`)
   - `notifyClient` deja de ser un flag (:5685) → crea notificación real + encola correo
   - Memo de diagnóstico/reparación → campos `DiagnosisMemo`/`RepairMemo` (`types.go:80-81`), hoy sin formulario
   - Prioridad manual: que `resolveProjectSlaSeverity` respete `_priority` (`project-workflow.config.ts:281`)
   - Wizard de fin de intervención invoca `POST /projects/:id/diagnosis/close` (existe y nunca se llama)
   - Informe de intervención → `POST /projects/technical-reports` en vez de generar `.txt` local (:5703-5716)
   - Adjuntos: permitir subir/eliminar desde el kanban e inmutabilidad al cerrar
4. Columnas faltantes del tablero (0.5, 11, 16, 13) en `project-workflow.config.ts:123-213`.
5. Bandeja "mis equipos" por técnico logueado: añadir filtro de técnico a `crm-equipment-api.service.ts:7-13`.
6. Transiciones automáticas (0.5→11/1, 11→1, 16→26): moverlas server-side para que no dependan
   de quién tenga el navegador abierto.

**Gate:** dos navegadores distintos ven el mismo tablero; limpiar caché no pierde nada; `tsc --noEmit` limpio.

---

## FASE 4 — Horas, timesheet y pruebas funcionales  *(P1)*

Hoy todo en localStorage con backend inexistente (`timesheet` = 0 apariciones en backend).

1. Migración: `work_time_entries` (company_id, id, user_id, project_id, equipment_id, minutes,
   quarter_ticks, worked_at) y `test_batches` (+ `test_batch_items`).
2. `internal/hr` o nuevo `internal/worktime`: CRUD + agregado semanal por técnico + total por equipo.
3. Frontend: `work-time-tracker.service.ts` (:285-293) y `work-test-batch.service.ts` (:121-167)
   contra la API; el pointage/timer del kanban (`kanban-view.component.ts:3794-3880`) registra en servidor.
4. La entrada de horas **lleva campo equipo** (hoy no lo tiene, `:6-15`).
5. Calendario laboral Colombia: tabla `holidays` (festejos reales) en vez del mock de
   `worktime-calendar.util.ts:156`; SLA sacado del map en memoria (`projects/service.go:368`).

**Gate:** horas de un técnico visibles desde otra sesión; reinicio del backend no las borra.

---

## FASE 5 — Finanzas: caja menor, cuentas, garantías, facturación  *(P1)*

1. Migración: `expenses` (+ partidas de caja menor con arqueo de billetes/monedas), `accounts`,
   `warranty_records`, `invoice_links` (vínculo factura↔equipo↔zona).
2. Backend `internal/finance`: hoy 0 endpoints para caja menor (`handler.go:20-46`). Añadir CRUD de
   gastos, cuentas, arqueo, garantías y export para contadora.
3. Frontend: `finance-accounts.store.ts` (:31,51), `finance-billing.store.ts`,
   `finance-garantias.component.ts` (:36,520 — hoy localStorage), `finance-caja-menor.component.ts`
   (:364 expenses en memoria). Quitar botones "Restaurar mock" / "Guardar liquidación mock"
   en `company-hr-worktime/health/leaves/compensation`.
4. Tarifa horaria fija de 140.000 (`finance-time-invoice.component.ts:513`) → configuración por empresa.
5. Conversión cotización → factura (no existe en ningún extremo).

Incorporado de la auditoría de Despacho y Facturación (`audit/07-despacho-facturacion.md`, 47 ítems):

6. **Retenciones doblemente rotas**: la UI captura reteFuente/reteIVA/reteICA
   (`finance-pagos.component.ts:289-310`) pero `toPaymentPayload` (:655-674) no las envía, y el
   backend las declara (`finance/types.go:88-92`) sin columnas en `finance_payments`
   (`migrations_finance_calendar.go:24-47`). Nunca se guardan → añadir columnas + payload.
7. **Pagos contra facturas ficticias**: dropdown `invoiceOptions` hardcodeado `"LARS#3377"`
   (:334-345). Debe consultar `/finance/invoices`.
8. **Cartera huérfana**: `GET /finance/portfolio` con cálculo de vencidos ya implementado
   (`finance/service.go:91-128`) y ningún frontend lo llama → cablear.
9. Dashboard "para facturar" lee contadores del store local
   (`dashboard.component.ts:1653-1661`) → API.
10. **Export Oasis incompatible**: 8 columnas con mapeo erróneo (`note`→NIT, `service.go:78-89`)
    frente a ~25 del formato 961; los botones CSV y TXT abren la misma URL
    (`finance-billing.component.ts:360-364`); sin filtro de fechas.
11. Nota crédito y bloqueo de factura emitida ("no hay reversa"): no existen.
12. Datos fiscales del cliente (DV separado, código postal, correo de facturación electrónica,
    gran contribuyente, tipo de ID): no existen.
13. Número de factura externa Oasis: campo muerto en `types.go:86`, no persistido.
14. Alerta de facturación urgente (campanita cada 10 min): `priorityBilling` es campo muerto en el
    store local (`crm-prospect-equipment.store.ts:111`) y en el `Item` del backend (`types.go:78`).
15. Correos transaccionales: 0 SMTP en el backend.
16. Puente pago → liberar despacho: no existe.

**Gate:** gasto creado por un usuario visible para la contadora en otra sesión; retenciones de un
pago recuperables tras reiniciar el backend; ninguna factura del dropdown inventada.

---

## FASE 6 — Configuración por empresa  *(P1)*

Todo esto es configuración de negocio y hoy vive por navegador, o sea por usuario.

1. Migración: `company_settings` genérica por ámbito (commercial, followups, equipment/estanterías,
   zones, quote-preview, comisiones) o tablas específicas donde el dominio lo pida.
2. Frontend → API: `company-commercial-settings.store.ts` (:153-169),
   `company-commercial-config.component.ts` (:861-883), `company-followups-config.component.ts`,
   `company-equipment-config.store.ts` (:137,285 — estanterías), `crm-zones.store.ts`,
   `crm-quote-preview.store.ts`.
3. Consecutivos **generados en el servidor**, no en el navegador:
   - Cotización: `crm-quotes.component.ts:getNextQuoteCode` usa prefijo de localStorage y máximo
     calculado sobre 200 filas → colisiones multiusuario.
   - Factura: `finance-invoice-create.component.ts:411 getNextSequenceNumber` desde localStorage;
     el backend solo valida `> 0`, así que no impide choques.
   - Remisión: **ya es server-side y atómico** (verificado: `remissions/service.go:29-31` formatea
     `E-CO-AAMM-NNNN` y `:110-119` usa `INSERT ... ON CONFLICT ... RETURNING` en transacción),
     PERO `remission_sequences` tiene `company_id` como única PK (`migrations_remissions.go:31-34`),
     así que el contador nunca se reinicia por mes y `%04d` se desborda pasado 9999.
     Fix: clave `(company_id, periodo)` con periodo `AAMM`.
4. Revisar `personalization.component.ts` (20 usos de storage): separar preferencia visual de config.

**Gate:** mismo consecutivo para dos usuarios concurrentes; estanterías idénticas en dos navegadores.

---

## FASE 7 — Compras: persistir órdenes y matar la trazabilidad ficticia  *(P1)*

1. `suppliers-api.service.ts`: `createOrder`/`updateOrder`/`addOrderTrace` (:136-171) existen y son
   código muerto — cablearlos.
2. `orders-history.component.ts`: eliminar mocks `PED-0001…` (:529-620), `createDraftOrder`/
   `saveOrderDetails` en memoria (:880-980) y `buildInitialTrace` (:1020) que **inventa eventos**
   y descarta las traces reales (:1096-1108).
3. Recepción de mercancía: endpoint + UI (remisión, qty recibida por línea, recepción parcial).
   Hoy solo entra stock al "Cerrar" la línea completa (`inventory/service.go:1136-1183`).
4. Cablear lo que el backend ya tiene y nadie usa: `GET /purchase-lines/consolidate`
   (`inventory/handler.go:81`, cliente huérfano en `inventory-api.service.ts:363`),
   `link-order` (:379), `updatePurchaseLine` PATCH (:254) con su notificación al técnico
   (`service_purchase_lines_update.go:100`).
5. Reserva descuenta disponible (`inventory/service.go:611` solo inserta).
6. Export OC a Excel/PDF (2 columnas PN+cantidad para Mouser).

**Gate:** OC creada por un usuario visible para otro; traza mostrada == traza guardada.

---

## FASE 8 — Mocks visibles en pantalla  *(P2, riesgo en demo)*

Pantan datos inventados que parecen reales:
- `dashboard.component.ts:1326-1393` → KPIs comerciales hardcodeados, 0 HttpClient
- `company-hr-audit.component.ts:87-105` → log de actividad hardcodeado
- `crm-database-upload.component.ts:68-71` → botones sin handler e historial inventado
- `crm-prospect-detail.component.ts:536` → `Cotizacion#{{420+prospect.id}}`
- suppliers dashboard `:230-231` → `delayedDeliveries=3`, `qualityIncidents=2`
- Botones "Exportar" sin `(click)` (`crm-prospect-detail.component.ts:356,519`)

Regla: o se conectan a un endpoint real, o se quitan de la UI. **Nunca dejar un número inventado.**

---

## FASE 8B — Recepción de equipos  *(P1, incorporada de `audit/02-recepcion.md`, 54 ítems)*

El flujo central SÍ persiste (`crm-prospect-equipment-modal.component.ts:2104` →
`PUT /api/v1/crm-equipment/records` → tabla `crm_equipment_records`), pero alrededor hay 12 ítems
no conectados y 12 inexistentes.

**Datos que se capturan y se pierden (prioridad máxima):**
1. Estado de garantía: `oldCode`/`firstReceptionDate`/`warrantyMonths` viven solo en un Map del
   componente (`modal:126-129,1765`); grep `oldCode` en `backend/` = 0. Se pierde al recargar.
2. Fotos de ingreso guardadas **solo como miniatura** (`crm-prospect-equipment.store.ts:31-34`,
   `modal:1866`) → invalida el caso de disputa que Maribel describió en la reunión.
3. `backendSyncStatus` nunca sale de `frontend-only`.
4. `diagnosisMemo`/`repairMemo` existen en modelo y tabla (`types.go:88-89`) pero ningún input los edita.
5. Zonas: el backend tiene CRUD real (`crm/handler.go:37-40`) pero el FE usa `crm-zones.store.ts`
   en localStorage, y `crm_equipment_records` no tiene columna `zone`.
6. Adjuntos en recepción con `accept="image/*"` (`modal:837,927`): el PDF del cliente no se puede
   subir aunque el endpoint acepte cualquier mimeType (`service_attachments.go:18`).

**Identidad del equipo:**
7. El consecutivo `CO-26-02-169` NO existe: el ID es `` `${prefix}-${Date.now()}-${random}` ``
   (`modal:3526`) y los `CO260206` que se ven en la UI son **mock** (`project.service.ts:684-999`).
8. QR permanente por equipo: se deriva de `recordId`+`itemId` y cambia en cada ingreso
   (`equipment-qr.util.ts:10-14`). Sin página pública del QR (contador de garantía + upsell);
   las únicas rutas públicas son `/crm-quotes/quotes/public/:token`.
9. Mapeo campo-por-campo del escaneo: el texto crudo va entero a `receivedIdentifier` (`modal:3654`).

**Maestros en localStorage → RESUELTO en `77ab7b35` (Fase 6):** tipos de servicio, modelos
industriales, familias y ubicaciones/estanterías salieron de `company-equipment-config.store.ts`
(`DEFAULT_*` hardcodeados bajo la clave `adminux.company.equipment.catalog.v1`) y ahora viven en 4
tablas por empresa con CRUD en `internal/equipmentcatalog`. El componente
`company-equipment-config.component.ts`, que **no tenía ruta registrada** en ningún `*.routes.ts` y
por tanto era código inaccesible, ya está en `/app/company-equipment-config` con entrada de menú.
Sigue pendiente de negocio (no de persistencia): faltan los tipos de servicio *intercambio* y
*venta nueva/usada*, las ubicaciones *Interior 4, 5 y garaje*, y el autorrelleno desde el histórico
real en vez de un catálogo fijo — eso se carga ahora desde la UI, ya no se hardcodea.

**Inexistente:** auto-asignar al técnico anterior en garantía (`findPreviousReception` no devuelve
el técnico, `warranty.logic.ts:117-127`), cotización automática para ventas, remisión interna de ALFA,
guard de permisos en la ruta de recepción (`internal-layout.routes.ts:408-415`), **SMTP (0 resultados
en todo el backend)**, preregistro del cliente con aprobación, desplegable de clientes que anuncian
un envío, extracciones por zona/asesora.

**Ya resuelto por la Fase 1:** el semáforo SLA leía `/projects/sla-config` de un mapa en memoria
(`projects/service.go:368`); ahora persiste en Postgres. Falta que los umbrales hardcodeados de
`work-teams.component.ts:32-33` consuman esa config.

---

## FASE 9 — Verificación y cierre

1. `go build ./...`, `go vet ./...`, tests dirigidos por módulo nuevo.
2. `npx tsc --noEmit` y `ng build` limpios.
3. Prueba de fuego transversal: **borrar localStorage y recargar** — el sistema debe seguir completo.
4. Prueba multi-sesión: dos navegadores, mismo usuario y usuarios distintos, datos coherentes.
5. Reiniciar el backend: nada se pierde.
6. Grep final: 0 `localStorage` fuera de las 3 excepciones documentadas; 0 mapas en memoria en servicios.
7. Reporte final con tabla por fase y evidencia.

## Riesgos

- **Sin `node_modules`** hasta Fase 0: no se puede compilar el frontend antes del `npm install`.
- **Anderson trabaja en `cambios-Anderson`**: rama nueva para no pisarlo; Fases 3 y 8 tocan
  `crm-prospect-detail` y kanban, que él modificó → rebasar con cuidado, no sobrescribir.
- **No hay entorno de BD local confirmado**: las migraciones se verifican compilando y con tests;
  la prueba contra Postgres real requiere `DATABASE_URL` (pedir acceso antes de dar por validado).
- Alcance grande: se ejecuta por fases con gate propio, cada fase commiteada por separado para
  poder revertir una sin perder las otras.
