# PLAN G5 + G6 — Cierre de fujos "Flujo real (9 pasos) vs sistema"

> Plan escrito para un Junior: cada paso dice **qué archivo, qué código exacto,
> en qué orden y cómo se verifica**. No improvisar fuera de este plan.

## 0. Contexto y scope (no re-discutir)

La tabla "Flujo real vs sistema" deja dos fujos abiertos:

| Gap | Qué falta | Dónde |
|---|---|---|
| **G5** | El export Excel por proveedor existe (12 cols) pero NO existe el formato BOM de 2 columnas ("Número de parte", "Cantidad") que se sube directo a Mouser/DigiKey sin depurar a mano | `/app/inventory-orders` → `inventory-replenishment.component.ts` |
| **G6** | No existe NADA que cruce horas estimadas del diagnóstico (`projects.properties_json->>'estimatedHours'`) vs horas reales registradas (`work_time_entries.total_hours WHERE project_id=…`) | backend `internal/worktime` + vista `/app/work-timesheet` |

Los gaps G7 (puerta pago→despacho) y G9 (pagos rotan cadena factura) **ya están
resueltos en prod** por F1/F2 (commit `06cf9654`) + gate 5c existente
(`service_payment_gate5c.go`). Lo que falta es **probarlos de extremo a extremo**
con la suite E2E para que queden cerrados con evidencia, no por palabra.

### Criterio de done (determinista, sin "se ve bien")
1. `go vet ./...` → 0 errores.
2. Tests Go del paquete worktime verdes (unitarios + DB con `RUN_DB_TESTS=1`).
3. `npm run build` local → 0 errores tsc/Angular.
4. Suite E2E (`scripts/check-cotizacion-a-pago-v2.mjs`) extendida con secciones
   G5 (BOM) y G7+G9 (remisión/pago) → **todos los checks verdes contra prod**.
5. Commits por gap en `cambios-Anderson`, push OK.
6. Deploy prod: pull ff-only, rebuild Go + restart service, `npm run build` en el
   server (node v20 presente), `/health 200`.
7. Evidencia post-deploy: el bundle servido contiene las cadenas nuevas y el
   endpoint nuevo responde JSON con auth.

## 1. G6 — Backend: endpoint de desviación estimado vs real

### 1.1 Contrato (fuente única de verdad)
```
GET /api/v1/worktime/deviation?projectId=<id>&from=&to=   (from/to opcionales, YYYY-MM-DD)
200 → { "projectId", "estimatedHours": number|null, "actualHours": number,
        "deviation": number, "entryCount": int }
404 → proyecto no existe en la empresa del JWT
```
Reglas:
- `estimatedHours` = `properties_json->>'estimatedHours'` como float; si falta o
  es ≤0 → `null` (no inventar estimaciones).
- `actualHours` = `COALESCE(SUM(total_hours),0)` de `work_time_entries` con
  `company_id=$ AND project_id=$ AND total_hours > 0`, opcionalmente acotado por
  rango sobre `start_at`.
- `deviation` = actual − estimated (si no hay estimación, deviation = actual).
- Redondeo a 2 decimales (misma convención que `Summary`).

### 1.2 Archivo: `backend/internal/worktime/service.go`
- Agregar tipo `DeviationResponse` junto a los demás DTOs del paquete.
- Agregar método `(s *Service) ProjectDeviation(companyID, projectID string, from, to string)`
  **después de `Summary`** (patrón idéntico: `parseFilterDate`, args posicionales,
  errores con `%w`, `math.Round(x*100)/100`).
- Consultas:
  1. `SELECT properties_json FROM projects WHERE company_id=$1 AND id=$2` → sin fila
     devuelve `ErrNotFound`. Parsear JSONB a `map[string]any`; extraer
     `"estimatedHours"` con helper local `asFloatPtr(v any) *float64`
     (acepta float64, json.Number no aparece porque decodeo con `json.Unmarshal`
     sin UseNumber — float64 directo; descarta bool/string/nil).
  2. Agregado de horas como arriba.

### 1.3 Archivo: `backend/internal/worktime/handler.go`
- En `RegisterRoutes`: `group.GET("/deviation", h.projectDeviation)` (junto a `/summary`).
- Handler `projectDeviation(c echo.Context) error`: lee `projectId` (obligatorio →
  400 si vacío), delega a service, `respondError` existente mapea los errores.

### 1.4 Tests: `backend/internal/worktime/service_db_test.go`
Agregar `TestProjectDeviation_*` usando `openTestDB(t)` + `testCompany`:
- `...NoProject`: proyecto inexistente → `ErrNotFound`.
- `...SinEstimacion`: proyecto sin `estimatedHours`, 2 entries de 1.5h y 0.5h
  (crearlas vía `service.Create` o INSERT directo) → estimated null, actual 2,
  entryCount 2, deviation 2.
- `...ConDesviacion`: proyecto con `properties_json->'estimatedHours' = 8`,
  entries que sumen 5h → deviation −3; filtro `from/to` que excluya una entry
  cambia actual (verifica el rango).
- `...IgnoraOtrasCompaniasYProyectos`: entries de otra company o proyecto no
  cuentan.

## 2. G6 — Frontend: tarjeta "Desviación estimado vs real"

### 2.1 Archivo: `src/app/services/worktime-api.service.ts`
- Interface `WorkTimeDeviation { projectId, estimatedHours: number|null, actualHours, deviation, entryCount }`.
- Método `getProjectDeviation(projectId: string): Observable<WorkTimeDeviation>`
  con el mismo patrón fetch + JWT + `X-Company-Id` que `getSummary` (revisar cómo
  se arma la URL y propagar errores del body).

### 2.2 Archivo: `src/app/pages/app/work/work-timesheet.component.ts`
Nueva tarjeta **después de "Horas por empleado y semana"** y antes de
"Bitacora de registros":
- Selector de proyecto con los proyectos REALES de la empresa vía
  `projects-api.service.ts → listProjects()` (NO usar el array demo de labels —
  esa data es del formulario local). Guardar `{id, label}` por opción.
- Al seleccionar: `loadingDesviacion`, llamada al endpoint; estados:
  - error → texto accionable ("No se pudo cargar la desviación: <msg>").
  - `estimatedHours == null` → badge neutro "Sin estimación de diagnóstico".
  - si hay estimación: badge verde |dev| ≤ 10% del estimado, ámbar ≤ 30%, rojo > 30%.
- Mostrar siempre: horas estimadas (o "—"), horas reales, desviación con signo.
- `data-testid`: `deviation-project-select`, `deviation-result`, `deviation-badge`.
- Inyectar `ProjectsApiService` (revisar el nombre exportado exacto) +
  `WorktimeApiService` ya existe en la clase.

## 3. G5 — Export BOM de proveedor (2 columnas)

### 3.1 Archivo: `src/app/pages/app/inventory/inventory-replenishment.component.ts`
- En el template, junto al botón "Descargar Excel de repuestos" (~línea 267),
  agregar segundo botón:
  ```html
  <button class="btn btn-outline-theme" type="button" [disabled]="visiblePurchaseLines.length === 0 || !canManageReplenishment"
          (click)="downloadBomExcel()" data-testid="download-purchase-lines-bom">
      <i class="bi bi-file-earmark-spreadsheet me-1"></i>Descargar BOM proveedor (2 col)
  </button>
  ```
- Método `downloadBomExcel(): void` **junto a `downloadSupplierExcel()`** (~línea 749):
  1. `rows = this.exportRows()` (reutiliza filtro de proveedor + checkboxes; si no
     hay → feedback warning, return).
  2. Agregar por referencia: `Map<ref, qty>` — key = `line.reference` (trim),
     valor += `line.quantity`. Orden estable: orden de primera aparición.
  3. Sheet con header EXACTO `["Número de parte", "Cantidad"]` + filas `[ref, qty]`.
     Nada más: ni proveedores, ni precios (la web del proveedor los rellena).
  4. Nombre de archivo: `BOM_<proveedor|todas>_<AAAAMMDD>.xlsx`
     (`XLSX.writeFile`, mismo patrón que el export actual).
  5. Feedback success indicando referencias únicas agregadas y proveedor.

### 3.2 Regla de negocio (transcripción Paso 5)
El file debe ser subible directo a "BOM / Cargar Hoja de Cálculo" del portal del
proveedor: solo número de parte + cantidad, sin columnas informativas. Si el
mismo número aparece en varias líneas, la cantidad va SUMADA (el portal también
suma duplicados; nosotros entregamos limpio).

## 4. E2E — extender `scripts/check-cotizacion-a-pago-v2.mjs`

La suite ya usa Playwright (`chromium`) contra prod con login admin real. Agregar:

### 4.1 Sección G5 (BOM)
1. API: crear proyecto mínimo + línea de compra vía
   `POST /api/v1/inventory/purchase-lines` (revisar contrato en
   `internal/inventory/handler.go`: referencia, quantity, supplier — p.ej.
   "Mouser", 2 líneas con la MISMA referencia para probar el agregado y otra
   distinta).
2. Browser: ir a `/app/inventory-orders`, esperar tabla de líneas
   (`[data-testid=purchase-lines-table]`).
3. Filtrar por proveedor (select `#line-supplier-filter`), marcar las líneas del
   test con sus checkboxes, `page.waitForEvent("download")` + click en
   `[data-testid=download-purchase-lines-bom]`.
4. Guardar download a tmp; parsear en node con el paquete `xlsx` (ya instalado):
   - exactamente 2 columnas; header fila 1 = "Número de parte","Cantidad".
   - la referencia duplicada aparece UNA vez con cantidad sumada.
5. Limpieza: eliminar líneas/proyecto creados (endpoints DELETE existentes o
   marcar cerrada + borrar por API si existe; si no hay DELETE, documentar y
   dejarlas como datos de prueba etiquetados "e2e-g5").

### 4.2 Sección G7+G9 (remisión con puerta de pago — contra-entrega)
Usando la cadena que la suite YA construye (cotización aceptada → factura):
1. Crear remisión `POST /api/v1/remissions` con `dispatchType: "contra-entrega"`,
   contacto y cliente de la cadena (revisar campos mínimos en
   `UpsertRemissionRequest`; máximo 4 equipos por regla existente).
2. `PATCH /remissions/:id/delivery-status` → estado `entregado` **sin factura
   vinculada** → esperar HTTP 4xx con mensaje "falta vincular la factura".
3. `PUT /remissions/:id/invoice` con el id de la factura de la cadena (estado
   Borrador/parcial) → reintentar paso 2 → 4xx accionable indicando que la
   factura no está Pagada.
4. Registrar pago COMPLETO vía API de pagos (mismo flujo que los checks F1/F2) →
   `GET` factura debe reportar status "Pagado" (F2).
5. Paso 2 otra vez → HTTP 2xx: la puerta se libera solo con el pago real.
6. Limpieza determinista al final de la suite (remisión, pagos, factura…).

## 5. Orden de ejecución y verificación por paso

| # | Acción | Verificación |
|---|---|---|
| 1 | G6 backend (§1) + tests | `go vet ./...`; `RUN_DB_TESTS=1 go test ./internal/worktime/ -count=1` verde (Postgres local; si no está corriendo, levantarlo antes — la caché de Go miente con "(cached)", SIEMPRE `-count=1`) |
| 2 | G6 frontend (§2) + G5 (§3) | `npm run build` → 0 errores |
| 3 | E2E §4.1+§4.2 | script compilado: `node --check scripts/check-cotizacion-a-pago-v2.mjs` |
| 4 | Commits por gap (mensajes: `feat(worktime): G6 desviación estimado vs real (endpoint + tarjeta)` / `feat(inventory): G5 BOM proveedor 2 columnas para Mouser` / `test(e2e): secciones G5 BOM + G7/G9 remisión-pago`) | `git log --oneline -3` |
| 5 | Push a `cambios-Anderson` (token en dos variables concatenadas, NUNCA literal junto al push) | remoto == HEAD local |
| 6 | Deploy: `ssh root@157.173.195.42`: pull ff-only en `/var/www/alfa.software.net.co`; rebuild Go `cd backend && go build -o bin/alfa-backend ./cmd/server && systemctl restart alfa-backend.service` | `/health 200`, service active |
| 7 | Build frontend EN EL SERVER (node v20): `npm run build` → nginx ya apunta a `dist/demo/browser`; no tocar nginx | `curl -s https://alfa.software.net.co/ \| head` + el JS servido contiene "BOM proveedor" y la tarjeta de desviación |
| 8 | E2E completo contra prod | todos los checks verdes (incl. secciones nuevas) |
| 9 | Evidencia final al user: tabla G5/G6 ✅ con links a commits + captura/URLs para probar en UI | — |

## 6. Trampas conocidas (de sesiones previas, no volver a caer)
- FS puede duplicar archivos con mismo nombre (inodos distintos): verificar con
  `ls -laO` antes de creer que una edición "no se aplicó".
- `go test` con caché muestra "(cached)": usar `-count=1`.
- El push enmascara el token si va literal: concatenar dos variables.
- No reintroducir el gate `28ee3ab9` (vive en otra copia, no en este repo).
- La UI de work-timesheet tiene un formulario con proyectos DEMO ("Proyecto
  Atlas"…): la tarjeta G6 usa SOLO proyectos reales vía API; no mezclar.
