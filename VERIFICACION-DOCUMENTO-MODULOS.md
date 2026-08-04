# Verificación del Documento de Análisis Funcional (ALFA ELECTRONIC)

Fecha de verificación: 2026-08-04

Se contrastaron las ~50 afirmaciones del documento de análisis (Módulo Inventario, Compras, Cotizaciones y Recepción de Equipos) contra el código real del sistema: frontend Angular (`src/app/`) y backend Go (`backend/internal/`).

**Conclusión general: el documento es ~80% cierto.** Sirve como diagnóstico de brechas (las funcionalidades que dice que faltan, en general faltan), pero no es confiable en detalle: varias de sus observaciones negativas ya están implementadas, parece evaluado en parte sobre las pantallas demo de la plantilla (no sobre los módulos funcionales reales), y omite el hallazgo más grave: el módulo de Inventario/Compras no tiene backend.

---

## Hallazgo transversal

- **Inventario/Compras no tiene backend.** Todo corre en el navegador con `localStorage` (`src/app/services/inventory-workflow.service.ts`, clave `lars.inventory.workflow.v2`) y datos seed hardcodeados. Ningún servicio de inventario usa `HttpClient`. Nada persiste en servidor. Los componentes `inventory-stock`, `inventory-dashboard`, `inventory-orders` e `inventory-order-details` son páginas demo de la plantilla AdminUIUX con datos estáticos; el módulo funcional real vive en `inventory-stock-workbench`, `inventory-movements`, `inventory-reservations`, `inventory-replenishment`, `inventory-reconciliation` e `inventory-control-center`.
- **CRM, cotizaciones y recepción de equipos sí tienen backend real** en Go/PostgreSQL (`backend/internal/crm/`, tabla `crm_equipment_records`, registrado en `backend/cmd/server/main.go`).

---

## 1. Módulo Inventario

El módulo con más imprecisiones del documento.

### Afirmaciones incorrectas del documento

- **"En la pestaña de reservas no veo la opción de poder reservar"** — FALSO. Existe formulario "Nueva reserva" completo con botón "Crear reserva" (`inventory-reservations.component.ts:114,161`) y `createReservation()` funcional (`inventory-workflow.service.ts:443-503`), con prioridad, fecha compromiso, vencimiento automático, liberar/renovar/consumir.
- **"No da la opción de incrementar o disminuir unidades manualmente"** — FALSO. Existe el tipo de movimiento "ajuste" (`inventory-movements.component.ts:84`); el responsable tiene el permiso `register-adjustment` y cualquier rol puede *solicitar* ajuste vía cola de aprobación (`inventory-workflow.service.ts:295-327`).
- **"Solo el responsable puede crear fichas y registrar entradas"** — PARCIAL. Crear ficha: solo `responsable` (`inventory-rbac.service.ts:29`). Pero registrar entradas también puede `administrativo` (rbac:50). Y `compras`/`auditor` ni siquiera ven stock (rbac:57-68), contrario a lo que asume el documento.

### Afirmaciones correctas del documento

- Sí se pueden crear fichas con datos técnicos (referencia, designación, familia, marca, proveedor, stock mínimo, ubicación) — `inventory-stock-workbench.component.ts:82-167`. Matiz: no hay campo literal "tipo".
- No existe opción de marcar componente como Nuevo/Usado (ocasión).
- Sí existe ubicación física en estantería (placeholder "Ej: R61", workbench:126).
- Las especificaciones técnicas (amperaje, potencia, voltaje) solo caben en `technicalNotes` de texto libre; no hay campos estructurados.
- La ficha tiene proveedor pero no orden de compra.
- Al validar la ficha se asigna ID interno (`INV-{FAMILIA}-{0000N}`, workbench:404). Matiz: el consecutivo es `references.length + 1`, frágil ante borrados.
- El buscador no funciona **solo en la vista demo** `/app/inventory-stock` (input sin binding, `searching: false`); el workbench real sí tiene buscador funcional por referencia/designación.
- No hay sistema de alertas push por stock mínimo: solo badge visual "Bajo mínimo" y generación automática silenciosa de líneas de compra (`inventory-workflow.service.ts:1286-1328`).
- El "Módulo de Liberación" no existe con ese nombre, pero hay equivalentes: cierre de línea de compra que ingresa stock (workflow:688-736) y "Bolsas de técnico — Recepción y liberación administrativa" (`inventory-movements.component.ts:234-313`).
- Sí existe el filtro/vista de "Cantidad insuficiente" (backlog en `inventory-replenishment.component.ts:186`).
- No se pueden modificar manualmente las líneas de compra (solo "Enviar" y "Cerrar").
- Sí existe validación anti-duplicados con similitud Levenshtein y bloqueo duro si similitud ≥ 0.9 (workflow:64-151).
- Sí existe el "Registro de Movimientos" con flujo técnico→aprobación del responsable.
- Sí existe historial de intentos de compra (`firstInsufficientAt`, `lastAttemptAt`, `attempts`; escalamiento tras 3 intentos).
- No se puede filtrar el reporte de insuficiencia por fecha (solo ordenar por antigüedad y filtrar por estado).
- Sí existe módulo de cierre/conteo físico con discrepancias, aprobación y acta exportable CSV (`inventory-reconciliation.component.ts`, workflow:1076-1162).

---

## 2. Módulo Compras

Mayormente certero pero desactualizado.

### Afirmaciones incorrectas del documento

- **"No se visualiza un módulo de compras para gestionar componentes solicitados"** — FALSO. Existe `inventory-replenishment.component.ts` con backlog de cantidad insuficiente, líneas de compra, registro de intentos (proveedor/alterno/costo/lead time) y rol "compras" en el RBAC.
- **"Las reservas congelan stock indefinidamente"** — FALSO. Las reservas no descuentan stock al crearse y tienen vencimiento: política `maxReserveDays`, `expiresAt`, auto-marcado como "vencida" (`inventory-workflow.service.ts:1340-1362`), renovación y badge de vencidas en la UI. Lo que sí falta es un módulo de alertas proactivas para reservas envejecidas.

### Afirmaciones correctas del documento

- Compras no puede sustituir el repuesto solicitado ni notificar al técnico.
- No existe el flujo/campos para que el técnico solicite compra externa (proveedor, referencia exacta, tipo, marca, cantidad, precio, plazo, memo): "Solicitar repuesto" solo permite elegir referencias ya existentes en catálogo (`kanban-view.component.ts:791-929`).
- No existe panel de validación administrativa de solicitudes de compra (las líneas pasan `pendiente → enviada → cerrada` sin aprobación).
- No hay consolidación por proveedor, ni exportación a Excel (Referencia/Cantidad), ni "bajar todo", ni unificación de líneas para nacionalización. La única exportación es el CSV del acta de conciliación.
- No hay panel resumido de repuestos pendientes de recibir (la tabla de líneas en estado "enviada" funciona como lista, pero no como panel).
- El estado del equipo no cambia automáticamente al llegar todos los repuestos (`closePurchaseLine` no toca el estado del equipo), y no hay pantalla de recepción de componentes por equipo en reparación.

---

## 3. Módulo Cotizaciones

El módulo más fiel del documento: **11 de 12 afirmaciones correctas**.

- Sí se puede crear cotización y verla en documento aparte (`crm-quotes.component.ts:72`, vista previa en `/estimate/:token`). Matiz: no genera PDF; es preview HTML imprimible con `window.print()`.
- No se pueden subir/ver fotos del equipo desde cotizaciones.
- No existe memo técnico dividido en Diagnóstico vs Reparación ni campos de "Estimado de Repuestos"/"Horas de Reparación" (el modelo `Quote` en `quotes/types.go` no tiene esos campos).
- No existen comentarios preestablecidos en lista desplegable: la descripción es un `<textarea>` libre y el botón "Plantilla de Cotización" no tiene handler (decorativo).
- La vigencia sí es editable (input `type="date"` "Válido Hasta", default +30 días).
- Las "Condiciones Generales del Servicio" no se integran como segunda página del PDF (los términos se renderizan como texto en la misma página).
- No existe botón/histórico de precios referenciales por tipo de equipo.
- Sí se puede editar una cotización ya hecha (PUT `/quotes/:quoteID`) pero no hay log de auditoría (el modelo solo tiene `CreatedAt`/`UpdatedAt`).
- Recordatorios/seguimiento: sí existe un sistema de seguimientos con recordatorio, pero a nivel **prospecto** (`crm_prospect_followups`), no vinculado a cotizaciones ni con alertas de "cotización sin confirmar". El espíritu de la afirmación se mantiene.
- No existe "Pregunta Urgente" comercial→técnico.
- No existe notificación/panel para asesoras comerciales de cotizaciones del día (el "daily quote" del dashboard es una frase motivacional).
- No existe "Cotización Automática" para ventas.

---

## 4. Módulo Recepción de Equipos

Certero con 3 errores importantes.

### Afirmaciones incorrectas del documento

- **"No se visualiza el botón de prioridad"** — FALSO. Existe: la pregunta "Diagnóstico gratis vs. urgencia/prioridad ($)" se renderiza como checkbox que se marca en rojo al activarse (`crm-prospect-equipment-modal.component.ts:615-630`, estilos 1114-1122). Es checkbox dentro del cuestionario, no botón suelto.
- **"No hay SLA visual por colores"** — FALSO. Existe en `work-teams.component.ts:224-226`: badges `sla-green` (0-2 días), `sla-yellow` (3-5), `sla-orange` (6+) según días en diagnóstico.
- **"No existe maestro de zonas y comerciales"** — PARCIAL. En el backend sí existe el catálogo `zones` real en BD (`service_catalog_crud.go`) y `crm-prospects.component.ts:981` carga zonas desde la API; pero el store `crm-zones.store.ts` es mock/localStorage y la UI de configuración de zonas guarda solo en localStorage, desconectada del backend.

### Afirmaciones correctas del documento

- Sí se pueden registrar equipos nuevos (wizard completo, guarda contra `POST /records` real).
- Al buscar cliente existente, autocompleta (nit, teléfono, dirección, ciudad, contacto, email) y carga la lista de contactos.
- No hay portal de pre-registro para el cliente ni campos de contacto obligatorios.
- El autocompletado de familia/marca viene del catálogo de modelos, **no** del historial de reparaciones previas (existe trazabilidad histórica por identificador vía `GET /insights`, pero no autocompleta la recepción). Afirmación del sistema actual matizable.
- Sí existe carga de fotos incl. móvil (`capture="environment"`), escaneo de códigos con cámara (ZXing) y evidencias con EXIF/GPS/SHA-256.
- Sí existen campos de accesorios y ubicación física.
- No existe Anclaje (Liaison) entre equipos (lo más cercano: "Equipos prestados para prueba").
- Al elegir tipo de servicio "Venta" el equipo no va directo al panel de cotizaciones.
- Código automático tipo CO26-02-169: **no existe**. El ID real es `rec-<timestamp>-<random>` generado en frontend; los códigos `CO260206` etc. son datos seed/mock. (El documento lo describe como funcionalidad del sistema actual — no lo es.)
- No hay impresión térmica de etiquetas (el QR se imprime vía popup del navegador), ni trazabilidad QR para el cliente (el payload QR solo contiene IDs internos), ni ID de por vida tipo "cédula".
- Sí existe panel de equipos sin asignar técnico (`work-teams.component.ts:211`).

---

## Veredicto final

| Módulo | Precisión del documento | Errores principales |
|---|---|---|
| Inventario | Media | Reservas sí existen, ajuste manual sí existe, RBAC distinto al descrito, evaluado sobre pantallas demo |
| Compras | Media-alta | Módulo de reposición sí existe, reservas no se congelan indefinidamente |
| Cotizaciones | Alta (11/12) | Matiz: seguimientos existen a nivel prospecto |
| Recepción | Alta | Prioridad roja sí existe, SLA por colores sí existe, zonas existen en backend |

El documento es útil como lista inicial de brechas, pero antes de usarse como insumo de requerimientos debe corregirse: (1) reevaluar inventario sobre los componentes funcionales reales y no sobre las páginas demo de la plantilla; (2) registrar que inventario/compras es una simulación frontend sin persistencia, lo que invalida cualquier afirmación sobre ese módulo en producción; (3) tachar las funcionalidades que afirma inexistentes y ya están implementadas (reservas, ajustes, prioridad, SLA, zonas).
