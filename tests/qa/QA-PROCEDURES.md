# QA Procedures — Inventario + Compras

> Procedimientos de aseguramiento de calidad para los módulos de Inventario y Compras.
> Fecha: 2026-08-05

---

## 1. Estrategia de Testing

### Pirámide de testing

```
        ╱  E2E (Playwright)  ╲         ← 10% — Flujos críticos de usuario
       ╱  Integration (API)    ╲       ← 30% — Endpoints + BD
      ╱  Unit Tests              ╲     ← 60% — Lógica de negocio pura
```

### Cobertura objetivo por capa

| Capa | Herramienta | Cobertura mínima | Ubicación |
|------|------------|------------------|-----------|
| Unit Go | `go test` | 80% | `backend/internal/*/service_test.go` |
| Unit Angular | `ng test --coverage` | 70% | `src/app/services/*.spec.ts` |
| Integration API | `scripts/check-*-api.mjs` | 100% endpoints | `scripts/` |
| E2E UI | Playwright | Flujos críticos | `scripts/check-*-playwright.mjs` |

---

## 2. Procedimientos de Ejecución

### 2.1 Unit Tests — Backend Go

```bash
# Ejecutar todos los tests del backend
cd /var/www/alfa.software.net.co/backend
go test ./... -v -count=1

# Solo inventario y suppliers
go test ./internal/inventory/ ./internal/suppliers/ -v

# Con cobertura
go test ./internal/inventory/ ./internal/suppliers/ -coverprofile=coverage.out
go tool cover -func=coverage.out
```

**Criterio de aceptación:** Todos los tests pasan. Coverage ≥ 80% en funciones críticas (normalizeToken, similarity, levenshtein, formatSupplierLabel, generateInternalCode).

### 2.2 Unit Tests — Frontend Angular

```bash
cd /var/www/alfa.software.net.co
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
```

**Criterio de aceptación:** Tests pasan sin errores. Coverage ≥ 70% en services.

### 2.3 Integration Tests — API

```bash
# Verificar que cada endpoint responde correctamente
node scripts/check-inventory-api.mjs
node scripts/check-suppliers-api.mjs
```

**Criterio de aceptación:** Todos los endpoints retornan 200/201 en operaciones válidas y 400/404 en operaciones inválidas.

### 2.4 E2E Tests — Playwright

```bash
node scripts/check-inventory-crud-playwright.mjs
node scripts/check-suppliers-crud-playwright.mjs
node scripts/check-purchase-request-flow-playwright.mjs
```

**Criterio de aceptación:** Todos los flujos de usuario completan sin errores.

### 2.5 Build Verification

```bash
# Backend
cd /var/www/alfa.software.net.co/backend && go build ./...

# Frontend
cd /var/www/alfa.software.net.co && npx ng build --configuration=production

# Formato Go
gofmt -l backend/internal/inventory/ backend/internal/suppliers/
```

**Criterio de aceptación:** Build exitoso sin errores. `gofmt -l` retorna vacío.

---

## 3. Checklist de QA por Módulo

### 3.1 Inventario

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Crear ficha → persiste en BD | Integration | ☐ |
| 2 | Entrada de stock → stock incrementa | Integration | ☐ |
| 3 | Salida de stock → stock decrementa | Integration | ☐ |
| 4 | Salida con stock insuficiente → error | Unit | ☐ |
| 5 | Detección de duplicados (Levenshtein) | Unit | ☐ |
| 6 | Reserva: crear → activa con vencimiento | Integration | ☐ |
| 7 | Reserva: consumir → stock baja + movimiento | Integration | ☐ |
| 8 | Reserva: renovar → vencimiento extendido | Integration | ☐ |
| 9 | Reserva: vencimiento automático | Unit | ☐ |
| 10 | Reposición: backlog automático | Integration | ☐ |
| 11 | Líneas de compra: generar → enviar → cerrar | Integration | ☐ |
| 12 | Cierre de línea → entrada automática stock | Integration | ☐ |
| 13 | Conciliación: sesión planificada → en-curso → cerrada | Integration | ☐ |
| 14 | Bolsas: recibir → liberar | Integration | ☐ |
| 15 | Aprobación de ajuste: pendiente → aprobada | Integration | ☐ |
| 16 | Auditoría: cada operación registra evento | Integration | ☐ |

### 3.2 Compras

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | CRUD proveedor: crear → persiste | Integration | ☐ |
| 2 | CRUD proveedor: editar → actualiza | Integration | ☐ |
| 3 | CRUD proveedor: eliminar → desaparece | Integration | ☐ |
| 4 | Crear proveedor sin razón social → error | Unit | ☐ |
| 5 | Orden: crear con items → persiste | Integration | ☐ |
| 6 | Orden: editar estado → trazabilidad | Integration | ☐ |
| 7 | Orden: eliminar → items y trazas eliminados | Integration | ☐ |
| 8 | Dashboard: datos reales del catálogo | E2E | ☐ |
| 9 | Aprobación línea: aprobar / rechazar | Integration | ☐ |
| 10 | Consolidación por proveedor | Integration | ☐ |
| 11 | Vincular línea a orden | Integration | ☐ |
| 12 | Solicitud compra técnico: crear → aprobar → línea auto | Integration | ☐ |
| 13 | Solicitud compra técnico: rechazar → sin línea | Integration | ☐ |

### 3.3 RRHH — Empleados

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Crear empleado válido → persiste en BD (tx empleado + catálogos) | Integration | ☐ |
| 2 | Crear empleado reutilizando cargo/departamento → sin duplicar catálogos | Integration | ☐ |
| 3 | Crear empleado sin nombre → error de validación | Integration | ☐ |
| 4 | UI "Agregar empleado" → persiste vía API y regresa al directorio | E2E | ☐ |
| 5 | Fallo del backend → feedback de error en ficha, sin navegación | E2E | ☐ |
| 6 | Recargar directorio → empleado creado sigue visible | E2E | ☐ |
| 7 | GetEmployee: existe → devuelve empleado con documento/email; no existe → errEmployeeNotFound | Integration | ☐ |
| 8 | UpdateEmployee: actualiza campos y persiste, crea catálogos nuevos sin duplicar | Integration | ☐ |
| 9 | UpdateEmployee: nombre vacío / estado inválido / email inválido → errores de validación | Integration | ☐ |
| 10 | ResetEmployeePassword: empleado con cuenta → token de 15 min persistido y ligado al signup | Integration | ☐ |
| 11 | ResetEmployeePassword: sin email → 400; email sin cuenta → 404; empleado inexistente → 404 | Integration | ☐ |
| 12 | UI "Ver ficha" → carga el empleado correcto con spinner y puebla el formulario | E2E | ☐ |
| 13 | UI editar ficha → "Actualizar empleado" persiste vía PUT y muestra alerta de éxito | E2E | ☐ |
| 14 | UI "Restablecer clave" → visible solo con empleado cargado, muestra enlace/token a compartir | E2E | ☐ |
| 15 | UI labels: "N° Documento" editable; "ID de sistema del empleado" deshabilitado | E2E | ☐ |
| 16 | Ficha completa: crear con los 33 campos poblados → GetEmployee devuelve round-trip idéntico (fechas, tarifa con decimales, flags) | Integration | ☑ |
| 17 | Ficha completa: actualizar todos los campos → GetEmployee verifica cada uno | Integration | ☑ |
| 18 | Ficha con campos opcionales vacíos → columnas DEFAULT/NULL sin error (fechas NULL → "", tarifa 0, flags false) | Integration | ☑ |
| 19 | Fecha en formato no YYYY-MM-DD (crear/actualizar) → errEmployeeDateInvalid (400) | Integration | ☑ |
| 20 | Recargar ficha tras guardar → los 33 campos se conservan (incluye clave de correo y flags de registro) | E2E | ☐ |

**Nota de persistencia de la ficha (33 campos):** `file_complete` se persiste como
`fileComplete` del request **OR** (`registration_terms_accepted` AND `registration_privacy_accepted`),
para mantener compatibilidad con clientes antiguos que solo envían el flag agregado. Las columnas
`registration_terms_accepted` y `registration_privacy_accepted` guardan cada consentimiento por
separado. Las fechas (`hire_date`, `termination_date`, `birthday`) son `DATE NULL`: "" ↔ NULL.

**Comando de ejecución (tests de integración contra BD real):**
```bash
cd /var/www/alfa.software.net.co/backend
RUN_DB_TESTS=1 go test ./internal/hr/... -run Employee -v
RUN_DB_TESTS=1 go test ./internal/hr/ -run EmployeeProfile -v   # persistencia total de la ficha
go test -race ./internal/hr/...
```

### 3.4 Persistencia

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Recargar página → datos persisten | E2E | ☐ |
| 2 | Cerrar sesión → datos persisten | E2E | ☐ |
| 3 | Multi-navegador → datos consistentes | E2E | ☐ |
| 4 | Sin localStorage → todo via API | Code Review | ☐ |

### 3.5 CRM — Contactos de cliente (lista unificada)

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Crear contacto válido → persiste en `crm_client_contacts` y aparece en la lista | Integration | ☑ |
| 2 | Crear contacto sin nombre → error de validación | Integration | ☑ |
| 3 | Crear contacto con correo inválido → error de validación | Integration | ☑ |
| 4 | Eliminar contacto → soft delete, ya no aparece en la lista; eliminar dos veces → contacto no encontrado | Integration | ☑ |
| 5 | Crear contacto en cliente inexistente → error cliente no encontrado | Integration | ☑ |
| 6 | Actualizar contacto existente → persiste todos los campos (nombre/cargo/correo/teléfono/notas) | Integration | ☑ |
| 7 | Actualizar sin nombre → error de validación; correo inválido → error de validación | Integration | ☑ |
| 8 | Actualizar contacto inexistente → contacto no encontrado; cliente inexistente → cliente no encontrado | Integration | ☑ |
| 9 | UI tab "Contactos" → UNA tabla unificada (cliente + prospectos) con badge de origen por fila y conteo total | E2E | ☐ |
| 10 | UI dedupe → mismo nombre+correo en ambas fuentes aparece una sola vez (prevalece origen cliente) | E2E | ☐ |
| 11 | UI agregar contacto → persiste vía API y muestra alerta de éxito | E2E | ☐ |
| 12 | UI edición rápida por fila (origen cliente) → lápiz, inputs inline, guarda vía PUT y refresca la fila | E2E | ☐ |
| 13 | UI edición rápida por fila (origen prospecto) → guarda vía PUT de prospectos y refresca la fila | E2E | ☐ |
| 14 | UI edición inválida (nombre vacío / correo inválido) → error en la fila, sin request al backend | E2E | ☐ |
| 15 | UI eliminar contacto (ambos orígenes) → confirmación y desaparece de la tabla | E2E | ☐ |

**Comando de ejecución (tests de integración contra BD real):**
```bash
cd /var/www/alfa.software.net.co/backend
RUN_DB_TESTS=1 go test ./internal/crm/ -run ClientContact -v
go test -race ./internal/crm/...
```

### 3.6 Tablero de proyectos — chips de resumen SLA clickeables

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Los `sla-summary-chip` son `<button>` (accesibles con teclado, Enter/Espacio) | E2E | ☐ |
| 2 | Cada chip muestra el tooltip "Ir a la columna <estado>" | E2E | ☐ |
| 3 | Clic en el chip de una columna lejana → el contenedor del tablero desplaza su scroll horizontal (`scrollLeft` cambia) | E2E | ☐ |
| 4 | Tras el clic el header de la columna destino queda visible en el viewport | E2E | ☐ |
| 5 | La columna destino muestra el resalte temporal `kanban-column--jump-highlight` (~1.6 s) y luego desaparece | E2E | ☐ |
| 6 | El clic no altera conteos, tarjetas ni abre fichas de proyecto | E2E | ☐ |

**Comando de ejecución (E2E Playwright headless):**
```bash
cd /var/www/alfa.software.net.co
npm run check:projects-sla-chips
```

### 3.7 RRHH — Foto del empleado y documentos reales del expediente

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Foto: create con `photoData` (data URL imagen) → Get devuelve round-trip idéntico | Integration | ☑ |
| 2 | Foto: update cambia la foto; update con "" limpia la foto almacenada | Integration | ☑ |
| 3 | Foto: create/update sin prefijo `data:image/` → errEmployeePhotoInvalid (400, español) | Integration | ☑ |
| 4 | Foto: create/update oversize (>~4MB base64 / 3MB binarios) → errEmployeePhotoTooLarge (400) | Integration | ☑ |
| 5 | Foto: empleado sin foto → `photoData` = "" (compatibilidad con filas antiguas) | Integration | ☑ |
| 6 | Documentos: upload → metadata con ID UUID, sizeBytes calculado del base64 y uploadedAt del servidor | Integration | ☑ |
| 7 | Documentos: list devuelve metadata SIN el contenido base64; download devuelve data idéntica a la subida | Integration | ☑ |
| 8 | Documentos: sin fileName → 400; sin data → 400; oversize (>8MB binarios) → 400 | Integration | ☑ |
| 9 | Documentos: upload/list sobre empleado inexistente → errEmployeeNotFound (404) | Integration | ☑ |
| 10 | Documentos: delete → soft delete, desaparece de list; download/delete posteriores → errDocumentNotFound (404) | Integration | ☑ |
| 11 | UI ficha: seleccionar imagen <3MB → preview inmediato en avatar; se persiste con "Actualizar empleado" | E2E | ☐ |
| 12 | UI ficha: archivo no imagen o >3MB → alerta de error, avatar sin cambios | E2E | ☐ |
| 13 | UI documentos: directorio de empleados real desde `GET /hr/employees` (sin array quemado ni localStorage) | E2E | ☐ |
| 14 | UI documentos: subir archivo real → spinner, alerta de éxito y fila nueva en la tabla | E2E | ☐ |
| 15 | UI documentos: previsualizar abre pestana nueva con el contenido real; descargar guarda con el fileName original | E2E | ☐ |
| 16 | UI documentos: eliminar con confirmación → soft delete real y desaparece de tabla/matriz | E2E | ☐ |
| 17 | UI ficha "Documentos del trabajador": resumen (total/pendientes/última carga) desde el API real; sin empleado cargado → resumen neutro | E2E | ☐ |

**Nota de contrato:** el list de documentos nunca incluye el campo `data` (evita payloads inflados);
el contenido se obtiene solo en `GET .../documents/:documentID/download`. Los pendientes del
expediente se calculan en frontend como las 4 categorías estándar (Hoja de vida, Contrato,
Certificados, Examenes) sin ningún soporte; el backend no persiste fechas de vencimiento.

**Comando de ejecución (tests de integración contra BD real):**
```bash
cd /var/www/alfa.software.net.co/backend
RUN_DB_TESTS=1 go test ./internal/hr/ -run 'EmployeePhoto|EmployeeDocument' -v
RUN_DB_TESTS=1 go test -race -cover ./internal/hr/...
```

### 3.8 Remisiones UX y reporte técnico sin repuestos

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Solicitud de repuesto: no existe el campo "Motivo de la solicitud"; el payload conserva `purpose` autogenerado | Code Review | ☑ |
| 2 | Solicitud de repuesto: prioridad por defecto "Critica"; fecha compromiso = mañana si el proyecto no tiene dueDate, o el dueDate si lo tiene | Code Review | ☑ |
| 3 | Línea de compra / solicitud de compra: `neededBy` y `leadTimeDays` con default 1 día | Code Review | ☑ |
| 4 | Reporte técnico impreso: el documento NO contiene la sección `technical-report-parts` ni la tabla de repuestos | E2E | ☐ |
| 5 | Sidebar: "Remisiones" es ítem top-level (fuera del dropdown "Trabajo") y navega a /app/remissions | E2E | ☐ |
| 6 | Panel "Equipos a despachar": grupos expandidos por defecto y código del equipo como badge `bg-dark` visible sin clic | E2E | ☐ |
| 7 | Historial: remisión "entregado" muestra botón "Ver detalle" (`view-delivered-detail`) que abre el modal solo lectura con ítems, accesorios, garantía, fotos, notas, transportadora, guía y OC | E2E | ☐ |
| 8 | Agregar equipo: si la OC está vacía se autocompleta desde la última cotización del cliente y el `unitPrice` del ítem se fija desde la línea que coincide; sin cotización → silencioso, sin error | Code Review | ☑ |

**Comando de ejecución (E2E Playwright headless):**
```bash
cd /var/www/alfa.software.net.co
npm run check:remissions-ux
npm run check:technical-report
```

---

### 3.9 Aprobación de compras de repuestos desde proyectos (2026-08-14)

> Cubre: (A) bypass de permisos frontend para rol autenticado `admin` y mapeo del rol
> operativo por defecto; (B) visibilidad y aprobación de solicitudes/líneas de compra
> creadas desde proyectos en /app/inventory-orders.

| # | Prueba | Tipo | Estado |
|---|--------|------|--------|
| 1 | Usuario autenticado con rol `admin` tiene bypass total en `hasPermission()` aunque su rol operativo persistido sea `tecnico` | Unit (`node scripts/test-inventory-rbac-logic.mjs`) | ☑ |
| 2 | Sin rol operativo persistido, `restoreRole()` mapea el rol autenticado (admin→responsable, tecnico→tecnico, etc.) en vez de siempre `tecnico` | Unit | ☑ |
| 3 | `fireAndRefresh` propaga el mensaje real del backend por `asyncError$` (no lo traga); la página de reposición lo muestra como alerta danger | Code Review + E2E | ☑ |
| 4 | `POST /purchase-lines` crea la línea con `approval_status='pendiente'`; `GET /purchase-lines` y el estado completo exponen `approvalStatus/approvedBy/approvedAt` | Code Review + E2E | ☑ |
| 5 | /app/inventory-orders muestra la sección "Solicitudes de compra de repuestos" con TODAS las `purchase_requests` (referencia, descripción, cantidad, proyecto origen, solicitante, estado, fecha) | E2E | ☐ |
| 6 | Botones Aprobar/Rechazar por solicitud llaman `POST /purchase-requests/:id/review` (action `aprobar`/`rechazar`) con confirmación y feedback | E2E | ☐ |
| 7 | Tabla de líneas muestra columna "Proyecto origen" y badge de "Aprobacion"; líneas pendientes tienen acciones Aprobar/Rechazar | E2E | ☐ |
| 8 | Aprobar una solicitud por UI cambia su estado a "aprobada" (verificable por badge y por API GET) | E2E | ☐ |
| 9 | Con sesión admin y rol operativo persistido `tecnico`, las acciones de aprobación NO están deshabilitadas (prueba E2E del fix A) | E2E | ☐ |
| 10 | No existen endpoints DELETE para purchase-requests/purchase-lines: los registros de prueba se marcan con prefijo `QA-` | Observación | ☑ |

**Comando de ejecución:**
```bash
cd /var/www/alfa.software.net.co
node scripts/test-inventory-rbac-logic.mjs
node scripts/check-purchase-requests-admin-playwright.mjs
```

---

## 4. Criterios de Aceptación para Release

### Must Have (bloqueantes)
- [ ] `go build ./...` sin errores
- [ ] `ng build --configuration=production` sin errores
- [ ] Todos los unit tests pasan (`go test ./...`)
- [ ] Coverage backend ≥ 80% en funciones críticas
- [ ] Endpoints de inventario responden correctamente
- [ ] Endpoints de proveedores responden correctamente
- [ ] No se usa localStorage como fuente de datos

### Should Have
- [ ] Tests E2E de flujos críticos pasan
- [ ] `gofmt -l` retorna vacío
- [ ] No hay warnings nuevos en el build de Angular
- [ ] Dashboard de proveedores muestra datos reales

### Nice to Have
- [ ] Mutation testing score ≥ 60%
- [ ] Tests de carga en endpoints de alto tráfico
- [ ] Screenshots de Playwright en cada flujo

---

## 5. Regresión

Antes de cada release, ejecutar en orden:

```bash
# 1. Build
cd /var/www/alfa.software.net.co/backend && go build ./...
cd /var/www/alfa.software.net.co && npx ng build --configuration=production

# 2. Unit tests
cd /var/www/alfa.software.net.co/backend && go test ./... -count=1

# 3. Formato
gofmt -l backend/internal/inventory/ backend/internal/suppliers/

# 4. Integration (si el backend está corriendo)
# node scripts/check-inventory-api.mjs
# node scripts/check-suppliers-api.mjs
```

Si algún paso falla, **no hacer release**. Investigar y corregir.

---

## 6. Reporte de Bugs

Formato estándar para reportar bugs encontrados durante QA:

```markdown
### BUG-XXX: [Título breve]
- **Módulo:** Inventario / Compras
- **Severidad:** Crítica / Alta / Media / Baja
- **Pasos para reproducir:**
  1. ...
  2. ...
- **Resultado esperado:** ...
- **Resultado actual:** ...
- **Evidencia:** Screenshot o log
- **Ambiente:** Producción / Staging / Local
```
