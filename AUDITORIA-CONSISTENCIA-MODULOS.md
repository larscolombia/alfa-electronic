# Auditoría de Consistencia entre Módulos — SugarOS / ALFA

**Fecha:** 2026-10-24
**Método:** contraste de las 12 transcripciones de levantamiento (`transcripciones alfa/txt/`, ~17.300 líneas) contra el código real (frontend Angular en `src/app/`, backend Go en `backend/internal/`), ejecutado como 7 auditorías paralelas por dominio. **Todo hallazgo tiene evidencia** `archivo:línea` (código) o cita textual (transcripción).

---

## 0. Aclaración de contexto importante

Las transcripciones y el código **no describen una comercializadora de azúcar**: describen **ALFA ELECTRONIC**, empresa que **repara equipos electrónicos industriales** (variadores, pantallas, tarjetas) para ingenios y plantas. El flujo real del negocio es:

```
Prospecto → Recepción del equipo → Diagnóstico (técnico) → Cotización →
Orden de compra del cliente → Compra de repuestos → Reparación →
Pruebas/calidad → Despacho (remisión) → Facturación (Oasis/DIAN) → Cartera/pagos → Garantía
```

Evidencia: *"nosotros ya tenemos establecidas como unas 15.000 líneas de componentes electrónicos"* (`TranscriptAll.txt:18`); *"reparación de equipos, diagnóstico… cotizaciones… remisiones para el despacho de los equipos"* (`TranscriptAll.txt:579-582`). Los ingenios aparecen como **clientes** de las reparaciones, no como proveedores de azúcar. Toda esta auditoría se hace contra la voz real del cliente en las transcripciones.

---

## 1. Diagnóstico ejecutivo: por qué "los módulos no se conocen"

El síntoma que reportas (información inconsistente módulo a módulo) tiene **6 causas raíz concretas**, todas verificadas en código:

### Causa 1 — La integración es por SQL cruzado, sin contratos ni llaves foráneas
No hay imports entre paquetes de negocio ni bus de eventos en `backend/internal/` (solo `hr→auth`, `hr→acl`, `auth→security`). Los módulos se "conocen" leyendo tablas ajenas por SQL directo, y las entidades centrales **no tienen FKs**:

| Entidad | Problema | Evidencia |
|---|---|---|
| `projects` (el caso técnico, entidad central del flujo) | Tabla escaleta `id + status + properties_json`, sin FK a equipo, cliente ni cotización | `backend/internal/projects/types.go:5-11` |
| `remissions` | Sin `client_id`: guarda `client_nit/client_name` y resuelve el cliente con JOIN LATERAL por nombre/NIT `LIMIT 1` — un homónimo muestra el crédito de otro cliente en la puerta de pago | `backend/internal/remissions/service.go:41-68` |
| `remissions.items[].equipmentId` | Texto libre nunca validado contra `crm_equipment_records` | `backend/internal/remissions/types.go:60` |
| `finance_payments.invoice_number` | Texto; el sync **parsea el string** "FAC-2026-031" para emparejar pagos con facturas. Un typo rompe cartera en silencio | `backend/internal/finance/service_payment_sync.go:29-31` |
| Cotización → Remisión | Sin FK: el frontend trae TODAS las cotizaciones y adivina la correcta por coincidencia de substrings de nombre ("la más reciente") | `src/app/pages/app/remissions/remissions.component.ts:1133-1156` |
| Línea de compra → Proveedor | El proveedor se guarda como **texto libre**, sin FK a `suppliers.id` | `backend/internal/inventory/types.go:100` |

### Causa 2 — Orquestación crítica en el navegador
Las transiciones de negocio más importantes las ejecuta el frontend con fetchs encadenados, no el backend en una transacción:

- Al guardar la Orden de Compra, **el navegador** mueve el proyecto a "pedir-repuestos"; si ese PATCH falla solo queda un `console.error` — la OC queda guardada y el técnico nunca se entera (`crm-quotes.component.ts:997-1036`). Rompe la promesa del flujo: *"cuando ese equipo pasa a posición 05, vuelve y le sale al técnico"* (Comercial @43:00).
- Al guardar una remisión, **nadie actualiza el estado del equipo ni del proyecto**: el equipo despachado sigue apareciendo en "Equipos a despachar" y el proyecto queda en `listo-entrega` para siempre (`remissions.component.ts:1267-1313`; verificado por grep: solo `internal/remissions` toca la tabla `remissions`).

### Causa 3 — Vistas mock de la plantilla conviven con las reales
La plantilla AdminUIUX comprada sigue en producción, con rutas y menú activos:

- **Dashboard financiero con cifras falsas en USD** ("25486.00 USD", filtros "San Francisco/New York/India") y es la entrada del módulo desde el menú (`finance-dashboard.component.ts:177,914`; `main-menu.component.ts:388`).
- **Dashboard comercial 100% hardcodeado**: zonas Norte/Centro/Sur con `effectiveness: 80/83/64` escritos a mano (`dashboard.component.ts:1332-1426`) — justo el KPI que el cliente pidió para decidir (*"la lista de clientes que no han sido visitados en seis meses"*, Comercial @1:13).
- Tres "proyectos": el real (`/app/work-projects`) y dos mocks en inglés (`/app/project-dashboard`, `/app/project-projects` con "Keep eyes on tracking MPU", `project-projects.component.ts:23-24`).
- Basura de plantilla en el menú: "Sign up", "Maintenance", "Coming soon" y un ítem **"Error"** que navega a `/coming-soon` (`main-menu.component.ts:393`); rutas mock alcanzables: `finance-crypto`, `finance-wallet`, `finance-rewards`, `network-*`, `social-*`, `learning-*`, `forum` (`internal-layout.routes.ts:190-263`).
- Componentes muertos no ruteados de 1.400-1.900 líneas: `inventory-stock.component.ts` (1.479), `inventory-orders.component.ts` (1.419), `inventory-dashboard.component.ts` (1.936).

**Esto es exactamente lo que un usuario "dummie" ve y reporta como "no funciona":** abre una pantalla del menú, ve datos inventados en inglés, edita algo que no persiste, y concluye que el sistema está roto.

### Causa 4 — Datos que mienten silenciosamente
- `ClosePurchaseLine` **acredita a stock las unidades que NUNCA llegaron** al cerrar una línea con faltante (`inventory/service.go:1280-1304`, mensaje literal "faltante de N unidades ingresado a stock"). Contradice al cliente: *"el distribuidor no tenía eso y simplemente no nos lo envió. Y ahí quedó el tema"* (Inventario @39:22). Es inventario fantasma en BD.
- La vista "Historial de pedidos" de proveedores siembra 8 pedidos hardcodeados, y si la API falla **conserva el mock en silencio**; `saveOrderDetails()` confirma "Pedido actualizado" **sin llamar al backend** (`company-suppliers-orders-history.component.ts:807-843,1094-1113`).
- Si falla la API de clientes, el selector de facturación **cae a prospectos mock facturables** (`finance-billing.store.ts:328,782`).
- El contador `Prospect.Quotations` es un campo manual editable que **nadie incrementa** al crear cotizaciones (`crm/types.go:66`); el badge "N cot." se degrada solo.
- La columna "Estado" de remisiones muestra siempre "borrador": el campo nace así y **ningún código lo cambia jamás** (`remissions/service.go:191`).
- Operaciones de inventario muestran "creada correctamente" **antes** de la respuesta del backend (fire-and-forget); el canal de error `asyncError$` nunca se suscribe en el workbench → fallos silenciosos (`inventory-workflow.service.ts:236-238,299-301`).

### Causa 5 — ACL desigual: los módulos más sensibles no tienen gate en backend
`RequireModule` solo protege `/acl, /hr, /finance, /inventory, /suppliers, /worktime` (`cmd/server/main.go:204-229`). **CRM, projects, remissions, calendar y documentation solo piden JWT.** Las restricciones de "quién crea fichas / quién ajusta" son cosméticas (frontend) — justo el miedo del cliente: *"una persona nueva llega, entra y pum, haya algo loco ahí"* (Inventario @2:36).

### Causa 6 — Deuda estructural que impide mantener la coherencia
La regla de AGENTS.md (~250 líneas/archivo) está violada en los archivos más críticos: `crm-prospect-equipment-modal.component.ts` **4.017 líneas**, `crm-prospect-detail.component.ts` 2.305, `inventory/service.go` **2.196**, `crm-prospects.component.ts` 1.736, `crm-quotes.component.ts` 1.708, `kanban-view.component.ts` >6.000 líneas de lógica de orquestación. Además, **30 servicios frontend hardcodean `X-Company-Id: "demo-company"`** (p.ej. `crm-clients-api.service.ts:97`, `remissions.component.ts:851`), bloqueando el multi-tenant declarado en `arquitectura/modulo_acl.md:4`.

---

## 2. Tabla maestra de contraste: transcripción vs código

> Columnas: **Módulo** | **Lo que hace hoy el código** | **Lo que falta (pedido en transcripción)** | **Interconexión real con otros módulos**. El detalle y las mejoras UX de cada módulo están en la sección 3.

| Módulo | Lo que hace hoy el código | Lo que falta (voz del cliente) | ¿Intercomunicado? |
|---|---|---|---|
| **CRM / Prospectos** | CRUD real sobre `crm_prospects`; conversión manual prospecto→cliente (idempotente por nombre); seguimientos con fecha/hora; importación masiva (`crm/service_prospects_crud.go`, `service_convert.go:11-27`, `service_followups.go:93-154`) | Conversión automática al confirmar primera reparación (*"se convierte en cliente sí y solo sí me ha confirmado al menos una reparación"*, Comercial @18:15); panel de seguimiento con **alertas** (*"que el sistema le bote una alerta"*, @24:11); duplicados validados en backend (hoy solo frontend, `crm-prospects.component.ts:1019`); KPIs por zona/comercial (dashboard es mock) | Conoce a Clientes (por nombre, frágil) y a Quotes. **No** recibe nada de despacho/factura: la comercial no ve lo facturado aunque *"se le paga comisión sobre facturado"* (@1:02:02) |
| **Cotizaciones** | Real y bien cableado: consecutivo atómico `COT-año-NNN`, estados Borrador/Enviado/Aprobado, carga de OC, envío SMTP por outbox, link público con firma (`crm/quotes/handler.go`, `service_consecutives.go`, `service_quotes_send5c.go`) | Log de modificaciones (*"plazo modificado, antiguo 15, nuevo 14"*, Cotizaciones @53:05) — hoy PUT sobrescribe sin historial; badge "Facturada" en la tabla (el `invoice_id` se guarda pero no se muestra); calculadora de margen (*"me está diciendo… una pérdida del menos 61.23%"*, @20:41); plazo en días hábiles con calendario colombiano (@1:39); PDF sí o sí (*"muchos clientes tienen bloqueados… correos con links"*, @50:29); condiciones generales como 2ª página del PDF (@47:16) | → Factura: real, idempotente (`finance/service_billing_from_quote.go:58-265`). → Proyecto: orquestación frágil desde el navegador. → Remisión: **por adivinación de nombres** (`remissions.component.ts:1142-1152`). → Prospecto: contador nunca actualizado |
| **Recepción de equipos** | Real y fiel: marca/tipo/serie, accesorios, equipos anclados en préstamo, fotos por caras, QR imprimible, acuse por correo, regreso en garantía con código anterior (`crm/equipment/types.go:49-83`, `service_reception_ack5c.go`) | Filtro de viabilidad >2M COP / gama industrial (Comercial @1:22); verificación **automática** de vigencia de garantía (*"eso lo hace ella de manera manual"*, Técnica0303 @36:37); encadenamiento con código de recepción anterior en el flujo técnico | → Técnica: sí (kanban consume equipos). → Garantías financieras: **no** (dos mundos). `equipmentId` es texto libre en remisiones |
| **Técnica / Kanban** | Lo más sólido: estados = "posiciones" del cliente, transiciones validadas en **backend**, semáforo SLA configurable, puerta de materiales server-side, memo dividido diagnóstico/reparación, % reparabilidad, informe de intervención persistido (`projects/transitions.go:44-56`, `materials_gate.go:48-148`, `kanban-view.component.ts`) | Alerta al técnico cuando Compras modifica su línea (Técnica0203 @1:11:39); alerta de repuestos faltantes 1 semana antes del vencimiento (Técnica0303 @32:52); auto-avance a reparación cuando llega todo el repuesto (hoy la puerta bloquea pero nada auto-avanza); icono "hay backup de software de este modelo" en el tablero (endpoint existe, el kanban no lo consume); KPIs por técnico (garantías recibidas, tiempos, $ vs facturado) | → Inventario/Compras: real vía puerta de materiales. → CRM: sí (memos, recepción). → Despacho: **parcial y duplicado** (dos flujos de despacho que no se conocen). → Calidad: las respuestas de checklists van a un blob JSON con `executedBy: 'current-user'` hardcodeado (`kanban-view.component.ts:6609-6635`) |
| **Calidad / Pruebas** | Lotes de pruebas persistidos (`test_batches`, reglas de flujo), puerta de calidad antes de entrega (`worktime/service_testbatches.go`, `project-auto-transitions.logic.ts:54-76`) | Ejecuciones como datos de verdad: hoy las respuestas viven en `project.properties['transitionTestRuns']` (máx. 20), sin tabla servidor, sin auditoría de quién respondió → sin KPIs de calidad ni trazabilidad | **Isla funcional**: remisión/factura no verifican prueba de cierre; documentación/backups no llegan al tablero |
| **Compras de repuestos** | Solicitud desde kanban → panel de aprobación → línea de compra → recepción parcial que sí acredita stock; export BOM proveedor 2 columnas (lo pedido); reservas con vencimiento (`inventory/service.go:2008-2098`, `purchase-requests-panel.component.ts`) | Panel "repuestos no recibidos" (*"me toca entrar uno por uno"*, Compras l.552); código de pedido por proveedor (*"la compra 260-3005 del proveedor UTSURS"*, l.187); número de remisión en la recepción (l.498); columnas "necesita vs compró" para sobre-compra a stock (l.413); recompra marcada de no recibidos; bajar masivo (hoy 50 líneas = 50 clics) | → Proyectos: real (solicitud + gate). → Inventario: real al recibir. → Proveedores (`supplier_orders`): **rota** — dos sistemas de compra paralelos; el puente `link-order` existe sin UI (`inventory/service.go:2180-2196`). → Financiero: **inexistente** (no hay cuentas por pagar ni pago a proveedor) |
| **Inventario** | Backend completo y real: referencias, movimientos, reservas, bolsas por técnico, conteos, conciliación anual, rezago de mínimos con antigüedad (`inventory/service.go`, 6 vistas ruteadas) | Reposición **automática** al romper mínimo (*"él me crea una línea de compra… automáticamente"*, Inventario @5:34) — hoy es botón manual y el camino automático es código muerto (`handler.go:408`); costo/CMUP en la ficha (el `unitCost` se envía en 0, `inventory-stock-workbench.component.ts:441`); condición nuevo/usado; trazabilidad lote/serial (backend la entierra en texto, UI envía `""`); multi-bodega; consecutivo con colisión bajo concurrencia | **Semi-isla**: compras acreditan stock, pero **despachar no descuenta stock** (grep: 0 referencias a inventory en remissions) y el consumo en reparación no descuenta automáticamente |
| **Logística / Despacho** | Remisiones reales con consecutivo mensual, panel "equipos a despachar", transportadora/guía, valorizada, fotos, contacto obligatorio, **puerta pago→despacho server-side transaccional** (la pieza mejor lograda), vinculación manual de factura (`remissions/service.go`, `service_payment_gate5c.go`) | **Se implementó como regla dura el límite de 4 equipos que el cliente pidió QUITAR** (*"si voy a despachar veinte equipos me toca hacer cinco remisiones"*, Logística @17:51; código en `validation.go:13-15`); edición con log de auditoría (@22:04) — PUT existe sin auditoría y la UI ni expone editar; anulación — el estado nace "borrador" y nada lo cambia; seguimiento enviado→recibido por el cliente (@50:54); YouTube **por equipo** (hoy un link por remisión); reimpresión de la OC real del cliente (hoy "Imprimir OC" regenera la última cotización hallada por nombre difuso) | ← Equipos/Proyectos: solo lectura. → Equipos/Proyectos: **no escribe** (el despachado sigue "por despachar"). ← Cotización: fuzzy por nombre. ↔ Factura: manual vía selector. **Dos flujos de despacho paralelos**: el del kanban (`properties.dispatchHistory`) y la tabla `remissions` no se conocen |
| **Facturación** | Sólida: consecutivos por serie, bloqueo de emitidas (solo nota crédito, como pidió), conversión cotización→factura idempotente, número de factura externa Oasis editable, **export archivo plano Oasis 961 CSV/TXT** (action item central), pagos con retenciones y sync de saldo (`finance/handler_invoices.go`, `service_billing_from_quote.go:291-437`, `types.go:267-299`) | Cola "Equipos para facturar" alimentada por el despacho (*"me salen en esta otra columna"*, Despacho @42:24) — no existe; datos fiscales del vendedor vacíos en el export (`types.go:265-266`); reporte por concepto (diagnóstico de urgencia separado, @24:00); agrupación multi-línea en una factura | ← Cotización: real. → Despacho: puerta de pago real. **Despacho no genera factura** (flujo exige crear factura antes). Estado del equipo no se marca "facturado" |
| **Cartera / Pagos** | Backend real: `GET /finance/portfolio` con vencidas y saldos; pagos con retefuente/IVA/ICA y recálculo de estado (`finance/service.go:292-336`, `service_payment_sync.go`) | **Vista de cartera navegable**: el endpoint existe pero solo alimenta 3 KPIs del dashboard; no hay lista con aging, filtro por cliente ni export para *"cada viernes le doy la lista de clientes que no han pagado"* (Despacho @1:43:45); pagos↔facturas por FK (hoy por parsing de string) | → Despacho: sí (puerta de pago). → Comercial: **no** (comisiones sobre facturado sin reporte — correcto que la comercial no cobre, pero gerencia no ve el cruce) |
| **Financiero transversal** | Caja menor completa (gastos, arqueo de billetes, CSV para la contadora), cuentas bancarias reales, clientes a crédito, facturación por horas, garantías (`finance/service_expenses.go`, `finance-caja-menor.component.ts`) | Presupuesto de caja menor **por meses** (hoy un setting global único); **cuentas por pagar a proveedores** — no existe nada (solo un campo de texto `accounts_payable_account` en suppliers); reportes gerenciales de un clic (*"cuántos equipos quedaron en diagnóstico… 664 horas"*, Administrativa l.132-139); evolución de clientela por año (l.163) | Ve clientes/cotizaciones/horas. **No ve las compras al proveedor** — habría que digitarlas de nuevo y ni siquiera hay dónde |
| **Administrativa / RRHH** | Ficha ampliada de empleado real: EPS, ARL, contacto de emergencia, tipo de sangre, foto, hoja de vida, documentos (`hr/types.go:34-37`); ACL con permisos a nivel de campo (`acl_module_fields`) | Registro de exámenes médicos con periodicidad/alerta; verificar que el enmascarado por campo se aplique de verdad en las vistas HR | `hr→auth/acl` son los únicos imports Go entre módulos; CRM asigna técnicos leyendo `hr_employees` (`crm/equipment/service_assignment.go:53`) |
| **Calendario / Festivos** | Módulo `calendar` genérico por empresa; tabla `holidays` usada **solo** por worktime | SLA de reparación con calendario colombiano de festivos (*"él me calcula, según el calendario colombiano, 15 días hábiles… nos toca manualmente correr los días"*, TranscriptAll:1573-1580) — `projects` usa `GreenDays/YellowDays` crudos sin festivos | **Isla**: los festivos no alimentan SLA ni plazos de cotización |

---

## 3. Detalle por módulo: problemas y mejoras UX (Nielsen)

### 3.1 CRM y Cotizaciones

**Problemas de UX con evidencia:**
- **Botones muertos**: "Plantilla De Cotizacion" y "Exportar" no tienen `(click)` (`crm-quotes.component.ts:79-84`); igual "Importar/Exportar" en prospectos (`crm-prospects.component.ts:100-101`). Viola *feedback* (#2 Nielsen): el usuario hace clic, no pasa nada, y reporta "no funciona".
- **Vistas repetidas**: dos pantallas de carga de bases (`crm-clients-import` vs `crm-database-upload`, ruta `crm-carga-bases` en `internal-layout.routes.ts:38`).
- **"Ver cotizaciones" engañoso**: navega a la tabla sin filtro; la tabla **no tiene buscador, filtros ni paginación** con 200 cotizaciones cargadas (`crm-quotes.component.ts:94-153,1448`), aunque el backend sí soporta `?status=` (`handler.go:65-68`). Viola *flexibilidad* (#7).
- **Empty states genéricos** sin call-to-action (`crm-quotes.component.ts:148-150`). Viola *ayuda* (#10).
- **Zona como checkboxes que se comportan como radio** (`crm-quotes.component.ts:232-246`). Patrón engañoso, viola *consistencia* (#4).
- **Dashboard comercial mock** presentado como real (`dashboard.component.ts:1332-1426`). El más grave: el cliente toma decisiones de gestión con datos inventados.

**Lo más pedido por la comercial que falta:** bandeja "cotizaciones pendientes de confirmación" con alertas (reemplaza el Excel semanal), estados visibles de extremo a extremo (*"cotizado, entregado no validado, validación no satisfactoria, facturado"*, Comercial @52:00), log de modificaciones, calculadora de margen, reporte del mes cotizado/facturado por ciudad (Cotizaciones @1:29:19), vista "garantías por vencer" para recompra (@1:08).

### 3.2 Compras

- **La vista "Historial de pedidos" es un mock que simula persistir**: confirma "Pedido actualizado" sin tocar el backend (`company-suppliers-orders-history.component.ts:807-843`). Es justo la vista que debería ser el "Entregas proveedor" del cliente. Viola *visibilidad del estado* (#1) y *control del usuario* (#3).
- **Selector "Perfil operativo" decorativo** visible en 4 vistas; `setRole` se ignora con un `console.warn` invisible (`inventory-rbac.service.ts:107-113`). El usuario cree que cambió de rol.
- **Tres vocabularios de estados para el mismo flujo**: líneas `pendiente/enviada/cerrada`, solicitudes `pendiente/aprobada/rechazada`, pedidos `Solicitado/En transito/Recibido/Borrador` — el cliente lo describió con colores (rosado→naranja→verde, Compras l.153-156). Viola *consistencia* (#4).
- **Tabla de 15 columnas sin búsqueda ni paginación** (`inventory-replenishment.component.ts:279-336`); el cliente pidió ordenar por código, cliente, referencia, cantidad, precio, técnico, proveedor (l.237).
- **`confirm()` nativo del navegador** para aprobar/rechazar compras, con `reviewNotes: ""` fijo (`purchase-requests-panel.component.ts:148-153`). Viola *prevención de errores* (#5).
- **Inglés en producción**: "Lead time estimado", "BOM proveedor", breadcrumb "AdminUX" (`inventory-replenishment.component.ts:178,271,43`). Viola *match con el mundo real* (#2).

### 3.3 Logística / Despacho

- **El listado de remisiones no sirve para operar**: sin búsqueda, filtros ni paginación, sin columna de **fecha**, con columna "Estado" muerta (siempre "borrador") y sin re-imprimir remisiones pendientes ("Ver detalle" solo si ya está `entregado`, `remissions.component.ts:316-383`). El flujo real es imprimir la orden para el almacén ANTES de entregar: *"Tengo que venirme acá… buscar la última que hice… cargarla y decirle imprimir"* (Despacho @18:01).
- **Sin botones Editar ni Anular** pese a que el backend expone PUT/DELETE (`handler.go:24,30`) — código muerto peligroso (DELETE sin confirmación solo por API).
- **Dos pantallas de despacho que no se conocen**: la sección "Despacho" del kanban (con su propio `dispatchHistory`, su propio consecutivo y su propia puerta de pago, `kanban-view.component.ts:560-666`) vs `/app/remissions`. Un despacho hecho en uno es invisible para el otro. Es la evidencia más pura del problema que reportas.
- **`X-Company-Id` quemado a `"demo-company"`** (`remissions.component.ts:851`).

### 3.4 Inventario y Recepción

- **Falso éxito optimista**: "creada correctamente" antes de la respuesta del backend; errores silenciosos (`inventory-workflow.service.ts:236-238`).
- **Select plano con ~15.000 referencias** en la entrada de stock (`inventory-stock-workbench.component.ts:176-179`); la transcripción describía autocompletado. Inutilizable a esa escala (#7, #8).
- **La entrada no captura lote ni costo** aunque el backend los soporta (llegan hardcodeados, workbench l.440-441). Viola *prevención de errores* (#5): datos críticos que nunca se piden.
- Puntos a favor: empty states, botón Limpiar, obligatorios con `*`, badges de bajo mínimo — alineados al lineamiento SugarOS.

### 3.5 Técnica / Calidad

- **Garantías partidas en tres lugares**: menú "Trabajo→Garantías" y "Financiero→Garantías" cargan **el mismo componente** (`internal-layout.routes.ts:249-251` vs `:431-433`), mientras la garantía "de verdad" del técnico es la columna del kanban. Tres representaciones del mismo concepto sin conexión.
- **Vistas legacy de plantilla en producción**: `/app/project-dashboard` y `/app/project-projects` con datos demo en inglés (`project-dashboard.component.ts:23-24`).
- **Checklists sin atribución real**: `executedBy: 'current-user'` hardcodeado — el KPI por técnico que el cliente pidió nace corrupto.
- **Biblioteca técnica sin feedback de error**: `catch { /* ignore */ }` (`documentation.component.ts:139`) — si el servidor falla, muestra "No hay documentos" como si estuviera vacía. Y lee el token crudo de `localStorage` en vez del `AuthService`.
- **Jargon del software viejo expuesto**: "Position 0/0.5/11/13/16/26" en descripciones visibles (`project-workflow.config.ts:47-82`). Un técnico nuevo no sabe qué es la "posición 11".

### 3.6 Financiero / Administrativa

- **La puerta de entrada del módulo muestra datos falsos en USD** con link de compra de la plantilla (`finance-dashboard.component.ts:110-115,177`). Riesgo altísimo de decisiones sobre datos inventados.
- **Vistas repetidas**: `finance-banks` (mock, "Current Balance 256240.03 USD") vs `finance-cuentas` (real); tres dashboards + rewards sin propósito (`internal-layout.routes.ts:191-262`).
- **Cartera sin vista**: el endpoint existe, el usuario solo ve 3 números.
- **Fallback a clientes mock en facturación** (`finance-billing.store.ts:328,782`): se puede facturar a un cliente ficticio.

---

## 4. Lo que ya está bien (no tocar, solo conectar)

Para calibrar: no todo es problema. Estas piezas son sólidas y son la base sobre la que hay que construir:

- **Puerta pago→despacho**: server-side, transaccional con `FOR UPDATE`, override solo admin con rastro quién/cuándo, tests de BD de 416 líneas (`remissions/service_payment_gate5c.go`, `service_payment_gate5c_db_test.go`).
- **Conversión cotización→factura**: idempotente, con `source_quote_id`, resuelve cliente y hereda plazo (`finance/service_billing_from_quote.go:58-265`).
- **Consecutivos atómicos server-side** con tests de concurrencia (`crm/quotes/service_consecutives.go`, `service_consecutives_db_test.go:159`).
- **Puerta de materiales técnico↔inventario** en backend (`projects/materials_gate.go:48-148`).
- **Kanban técnico con transiciones validadas en servidor** y semáforo SLA configurable.
- **Export Oasis 961** (CSV/TXT) — el action item central de facturación electrónica.
- **Sync pagos→factura** con recálculo de saldo por serie+secuencia.
- **Recepción de equipos, caja menor, HR, inventario core**: reales contra PostgreSQL.

El patrón es claro: **donde se hizo backend primero (transacciones, gates server-side, idempotencia), funciona. Donde se "cableó" desde el navegador o se dejó la plantilla, miente.** La solución no es más pantallas: es mover la verdad al backend.

---

## 5. Soluciones desde código (priorizadas)

### Fase 0 — Integridad de datos (urgente, antes que cualquier mejora visual)

| # | Problema | Solución pragmática | Evidencia |
|---|---|---|---|
| 0.1 | Cerrar línea de compra acredita stock fantasma | `ClosePurchaseLine` debe cerrar **sin acreditar** el faltante y dejar la línea marcada `no-recibido / pendiente-recompra` (lo que el cliente describió) | `inventory/service.go:1280-1304` |
| 0.2 | Vista de pedidos de proveedor simula persistir | Reescribir `company-suppliers-orders-history` contra la API real o retirarla; eliminar el seed mock y el catch silencioso | `company-suppliers-orders-history.component.ts:807-843,1094-1113` |
| 0.3 | Fallback a clientes mock en facturación | Si la API falla: lista vacía + error visible, nunca mocks facturables | `finance-billing.store.ts:328,782` |
| 0.4 | Quitar el límite de 4 equipos por remisión | Eliminar la regla o parametrizarla; se reimplementó el defecto del software viejo | `remissions/validation.go:13-15`, `remissions.logic.ts:65` |
| 0.5 | Pagos↔facturas por parsing de string | Agregar `invoice_id` FK a `finance_payments`; migrar y borrar el parser de "FAC-2026-031" | `finance/service_payment_sync.go:29-31` |
| 0.6 | Cliente de remisión por nombre/NIT | Migrar `remissions` a `client_id` FK (la puerta de pago hoy puede mirar el crédito de un homónimo) | `remissions/service.go:41-68` |
| 0.7 | `projects` escaleta | Tipar columnas `equipment_record_id`, `client_id`, `quote_id` (los puentes existentes leen JSON no garantizado) | `projects/types.go:5-11` |

### Fase 1 — Mover la orquestación al backend (la consistencia que pides)

1. **Guardar OC en una transacción**: cotización aprobada + proyecto → `pedir-repuestos` + (regla del cliente) conversión automática prospecto→cliente, todo en el mismo `service_quotes` server-side. Eliminar la orquestación del navegador (`crm-quotes.component.ts:997-1036`).
2. **Guardar remisión en una transacción**: remisión + estado del equipo → `despachado` + proyecto → `entregado` + entrada en cola "para facturar". Hoy `save()` solo hace POST a remissions (`remissions.component.ts:1267-1313`).
3. **FK cotización→remisión**: selector de cotización aprobada en la UI de despacho (reemplazar `findLatestClientQuote` por `quote_id` real), y "Imprimir OC" debe servir el archivo OC cargado en la cotización, no regenerar una cotización (`remissions.component.ts:1095-1156`).
4. **Unificar el despacho**: el despacho del kanban debe **crear la remisión real** (misma tabla, mismo consecutivo), no un registro paralelo en `properties.dispatchHistory`.
5. **Unificar compras**: conectar `supplier_orders` con `inventory_purchase_lines` vía el endpoint `link-order` ya existente (darle UI) o consolidar en un solo modelo con número de pedido por proveedor ("260-3005 UTSURS").
6. **Cuentas por pagar**: facturas de compra + pagos a proveedor reutilizando `finance_payments` (hoy el pago exige factura de venta, `finance/service.go:32`).
7. **Auditoría de ediciones**: tabla de historial para remisiones y cotizaciones (quién/cuándo/qué cambió) — pedido explícito en ambos dominios (Logística @22:04, Cotizaciones @53:05).

### Fase 2 — Automatismos pedidos y nunca entregados

1. **Reposición automática al romper mínimo** (activar el camino muerto `service.go:1060-1077` desde `SubmitMovement`, o eliminarlo y hacerlo bien).
2. **Alertas**: cotización pendiente de confirmación (bandeja + notificación al entrar); compras modificó la línea del técnico; repuestos faltantes 1 semana antes del vencimiento; garantías por vencer para recompra comercial.
3. **SLA y plazos con calendario colombiano**: que `projects` y cotizaciones consuman `holidays` (hoy solo worktime la usa).
4. **Calidad como datos**: tabla `test_batch_runs` server-side con usuario real (reemplazar el blob JSON con `executedBy` hardcodeado).
5. **Icono "hay backup de software" en el kanban** consumiendo `GET /documentation/backups/model/:model` (endpoint ya existe).
6. **Auto-avance** `esperando-proveedor → reparacion` al recibirse la última línea de compra del caso.
7. **Panel "repuestos no recibidos"** agregado con fecha de compra original (Compras l.552, l.763).

### Fase 3 — Higiene estructural

1. Eliminar rutas/menú de plantilla: `finance-crypto/wallet/rewards`, `project-dashboard/projects`, `network/social/learning/forum`, ítem "Error" (`internal-layout.routes.ts:190-263,390-398,447-457`; `main-menu.component.ts:393`) y los componentes muertos de inventario (~4.800 líneas).
2. `X-Company-Id` desde el JWT/contexto, no `"demo-company"` hardcodeado (30 servicios).
3. `RequireModule` uniforme en CRM, projects, remissions (`cmd/server/main.go:216-226`).
4. Dividir los archivos monolito (regla AGENTS.md ~250 líneas): `crm-prospect-equipment-modal.component.ts` (4.017), `kanban-view.component.ts`, `inventory/service.go` (2.196), etc.
5. Actualizar docs vivos contradictorios: `MODULO-TECNICO-VISTAS-CORRELACIONES.md` y `RESUMEN-GLOBAL.md` describen rutas y fuentes de datos que ya no existen.

---

## 6. Soluciones desde UX (Nielsen aplicado)

### 6.1 Regla de oro para el "usuario dummie": ninguna pantalla puede mentir
- **Prohibido mock silencioso**: si la API falla, empty state + mensaje de error + botón reintentar. Nunca datos de ejemplo (casos: dashboard financiero, historial de pedidos, fallback de clientes en facturación, dashboards comerciales).
- **Todo botón visible hace algo o no existe**: eliminar botones sin handler ("Plantilla De Cotizacion", "Exportar", "Importar") — cada botón muerto es un ticket de "no funciona".
- **Feedback honesto**: quitar el éxito optimista fire-and-forget de inventario; mostrar spinner → confirmación del servidor → toast (ya es el patrón SugarOS, aplicarlo parejo).

### 6.2 Una sola cara por concepto (consistencia, heurística #4)
- Una sola vista de Garantías (decidir: la operativa del técnico o la financiera, y enlazar).
- Una sola pantalla de carga de bases de datos.
- Una sola pantalla de despacho (la del kanban debe abrir/crear la remisión real).
- Un solo vocabulario de estados por flujo, con los colores que el cliente ya usa (rosado→naranja→verde en compras).
- Español de negocio en toda la UI: fuera "Lead time", "BOM proveedor", "Position 11", "AdminUX", "Finance Dashboard", "priority billing".

### 6.3 Los listados son el puesto de trabajo (flexibilidad, #7)
Patrón único para TODA tabla operativa (remisiones, cotizaciones, líneas de compra, cartera): búsqueda + filtros por estado/cliente/fecha + paginación + columna de fecha + acciones por fila con tooltip + empty state con call-to-action. Hoy las tres tablas más usadas (remisiones, cotizaciones, compras) carecen de casi todo esto. El backend ya soporta filtros que la UI no expone (`quotes?status=`).

### 6.4 Prevención de errores (#5)
- Duplicados de prospectos validados en backend (hoy solo frontend, bypasseable).
- Permisos "crear ficha / ajustar inventario" verificados en backend por endpoint, no solo en la vista.
- Reemplazar `confirm()` nativo por modales con contexto (qué se aprueba, con notas).
- Selectores con autocompletado donde el catálogo supera ~50 ítems (15.000 referencias de inventario).
- Acciones destructivas (cerrar línea, marcar obsoleto, DELETE de remisión) con confirmación modal y consecuencia explicada.

### 6.5 Visibilidad del estado del sistema (#1) — la respuesta a "dice que no funciona aunque no sea cierto"
La mejor defensa contra el usuario que "no entiende" es que el sistema muestre dónde está cada cosa:
- **Badge de ciclo de vida de la cotización** en la tabla: Borrador → Enviada → Aprobada (OC) → **Facturada** → Despachada (los datos existen: `invoice_id`, remisión vinculada; solo falta mostrarlos).
- **Vista 360° del equipo** (*"todo lo que tenga contra ese equipo va a salir reflejado contra ese código"*, Despacho @24:25): recepción → diagnóstico → cotización → OC → remisión → factura → garantía en una sola ficha. Es el antídoto definitivo a "los módulos no se conocen", y todas las piezas de datos ya existen — falta la FK y la vista.
- **Cartera como lista accionable** (aging, por cliente, export del viernes) consumiendo `GET /finance/portfolio` ya implementado — trabajo barato, valor alto.
- Estados muertos: o se les da ciclo de vida real (borrador→emitida→anulada en remisiones) o se quita la columna.

---

## 7. Roadmap sugerido (pragmático, de mayor riesgo a menor)

```
Semana 1-2  Fase 0: integridad (0.1 a 0.7) + matar vistas mock del menú
            → deja de haber datos falsos y stock fantasma
Semana 3-5  Fase 1: orquestación backend (OC→proyecto→cliente;
            remisión→equipo/proyecto/cola-facturar; unificar despacho y compras)
            → los módulos "se conocen" de verdad
Semana 6-7  UX: patrón de listados + badges de ciclo de vida + vista 360° equipo
            + cartera navegable + dashboards reales
            → el usuario ve la consistencia
Semana 8+   Fase 2 (automatismos/alertas) y Fase 3 (higiene estructural)
```

**Criterio de priorización usado:** primero lo que corrompe datos o engaña al usuario (Fase 0), luego lo que rompe el flujo de punta a punta (Fase 1), luego lo que el usuario percibe (UX), al final la deuda estructural.

---

## 8. Apéndice — evidencia clave por afirmación

| Afirmación | Evidencia |
|---|---|
| Los módulos se integran por SQL cruzado, sin eventos ni contratos | Solo 3 imports Go internos: `hr→auth`, `hr→acl`, `auth→security`; todo lo demás lee tablas ajenas |
| La cotización SÍ alimenta facturación | `finance/service_billing_from_quote.go:58-265`, `SourceQuoteID` en `finance/types.go:202` |
| La cotización NO alimenta despacho de forma confiable | `remissions.component.ts:1133-1156` (matching fuzzy por substring) |
| El despacho no cierra el ciclo del equipo/proyecto | `remissions.component.ts:1267-1313` (solo POST); grep: nadie fuera de `internal/remissions` toca la tabla |
| La factura no nace del despacho | Flujo exige factura previa a la puerta de pago; no existe trigger despacho→factura |
| Financiero no ve las compras | 0 referencias a compras en `internal/finance`; `finance/service.go:32` exige factura de venta para pagos |
| El stock se infla con mercancía que no llegó | `inventory/service.go:1280-1304` |
| Dashboards de decisión son mock | `dashboard.component.ts:1332-1426`, `finance-dashboard.component.ts:177,914` |
| El límite de 4 equipos es el defecto del software viejo reimplementado | `remissions/validation.go:13-15` vs TranscriptLogistica @17:51-19:20 |
| ACL ausente en los módulos de operación diaria | `cmd/server/main.go:204-229` |
| Multi-tenant nominal | 30 servicios con `"demo-company"` hardcodeado; `arquitectura/modulo_acl.md:4` |

---

**Generado por auditoría automatizada (7 exploradores sobre código + transcripciones). Toda afirmación es verificable en las rutas citadas.**
