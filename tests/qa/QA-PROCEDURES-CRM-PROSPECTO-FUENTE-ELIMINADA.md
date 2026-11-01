# QA Procedures — CRM: eliminación del campo "Fuente del Prospecto" (prospectos + clientes + BD)

> Procedimientos de aseguramiento de calidad para la remoción completa del
> select "Fuente del Prospecto" (`#prospect-source`, modelo `formFuente`) del
> formulario de nuevo prospecto, del detalle editable, de los clientes y de la
> base de datos (columnas `source` en `crm_prospects` / `crm_accounts`).
> Fecha: 2026-10-31 · Commit: `e314d0e6`

---

## 1. Alcance

**Frontend (5 archivos):**
- `src/app/pages/app/crm/crm-prospects.component.ts`: div fuente eliminado del
  template; `sourceOptions`, `formFuente` (prop, draft type, restore, watch-save),
  case `"fuentes"` en label switch y en `catalogTypeFromQuickTarget`, payload
  `source:` en saveProspect, reset y loadCatalogs — todo eliminado. Fila
  "Clasificación y responsable" reequilibrada a 2×`col-lg-6`.
- `src/app/pages/app/crm/crm-prospect-detail.component.ts`: `"fuente"` fuera de
  `EditableProfileField`, bloque del template, lista de campos, suscripción a
  `catalogs()`, payload y `resolveFieldValue` — eliminados.
- `src/app/services/crm-prospects-api.service.ts`: `fuente`/`source`/`sources`
  fuera de records, payloads, interfaces de catalogs y mappings.
- `src/app/pages/app/crm/crm-prospects.store.ts`: `fuente` fuera de
  `ProspectRecord` y `normalizeProspect()`.
- `src/app/pages/app/work/work-teams.component.ts`: `fuente: "Trabajo"` fuera de
  `WORK_DIRECT_PROSPECT` y del mapeo trabajo→prospecto (la propiedad ya no existe).

**Backend Go (7 archivos):** `types.go`, `service.go` (constante
`CatalogTypeSources`, columnas SELECT, seed), `service_catalog_crud.go`,
`service_catalog_helpers.go`, `service_prospects_crud.go` (INSERT/UPDATE
renumerados `$1..$21` sin `source`), `service_prospects_helpers.go`,
`service_clients_crud.go`.

**Migraciones BD (3 archivos):**
- `migrations_crm_drop_source.go` (NUEVA, idempotente): DROP COLUMN IF EXISTS en
  ambas tablas + DELETE de filas del catálogo 'sources'.
- `migrations_crm_accounts_backfill.go`: **crítico** — la primera statement
  INSERT...SELECT referencia las columnas de `crm_prospects`; sin quitar `source`
  de esa lista el backend NO arranca tras el DROP.
- `migrations_all.go`: registro de la migración nueva al final del slice.

## 2. Procedimientos de ejecución

### 2.1 Verificación de compilación

```bash
cd backend && go build -o alfa-backend.exe ./cmd/server   # Windows local (paquete main en cmd/server)
ng serve --proxy-config proxy.local.json                  # o npm run build; "Application bundle generation complete" sin errores
```

**Criterio de aceptación:** 0 errores Go y TS. Grep final: cero matches de
`formFuente|sourceOptions|catalogs\.sources|"sources"|fuente del prospecto` en
`src/app`; solo falsos positivos (equipment `Source*`, `reteFuente`) en backend.

### 2.2 E2E — Playwright local (visual, nunca al API directo)

```bash
node scripts/check-crm-prospect-source-removed-playwright.mjs
# contra http://localhost:4200 con backend Go en :8080
```

| # | Escenario | Assert |
|---|-----------|--------|
| A | Formulario nuevo prospecto abierto | no existe `#prospect-source` ni la etiqueta "Fuente del Prospecto" |
| B | Creación end-to-end (NIT válido + compañía → Guardar) | el prospecto aparece en la lista; sin errores visibles |
| C | Detalle `/app/crm-prospectos/:id` | no muestra/edita fuente |
| D | Página de clientes | carga correctamente, sin campo fuente |

**Criterio de aceptación:** exit code 0 y `{"ok":true}` en los 4 escenarios.
El browser se cierra en el `finally` del script (no dejar instancias colgadas).

### 2.3 Deploy a producción (`157.173.195.42`, `/var/www/alfa.software.net.co`)

```bash
# 1) pull ff-only (rama cambios-Anderson)
ssh root@157.173.195.42 'cd /var/www/alfa.software.net.co && git pull --ff-only origin cambios-Anderson'
# 2) rebuild Go + restart del servicio (EJECUTA la migración drop-source contra prod)
ssh root@157.173.195.42 'cd /var/www/alfa.software.net.co/backend && go build -o bin/alfa-backend ./cmd/server && systemctl restart alfa-backend.service'
# 3) build frontend EN EL SERVER (node v20.19.0 vía nvm; el default del PATH lo rechaza Angular CLI)
ssh root@157.173.195.42 'export PATH=$HOME/.nvm/versions/node/v20.19.0/bin:$PATH && cd /var/www/alfa.software.net.co && npm run build'
```

**Criterio de aceptación:** `systemctl is-active alfa-backend.service` = active,
`curl http://localhost:8080/health` = 200 sin errores de migración en journalctl,
y el bundle servido limpio:
`grep -rl Fuente.del.Prospecto /var/www/alfa.software.net.co/dist/demo/browser` → 0 matches.

### 2.4 E2E — Playwright contra producción (post-deploy)

```bash
$env:PW_BASE_URL="https://alfa.software.net.co"; $env:PW_API_BASE_URL="https://alfa.software.net.co"
node scripts/check-crm-prospect-source-removed-playwright.mjs
```

**Criterio de aceptación:** los 4 escenarios verdes contra prod.

### 2.5 Verificación manual (checklist)

1. Prospectos → "Agregar Prospecto" → el formulario NO tiene select de fuente; empleado y CIIU ocupan la fila a ancho completo.
2. Crear un prospecto real → guarda sin errores y aparece en la lista.
3. Abrir su detalle → no hay campo fuente ni en vista ni en edición.
4. Clientes → la página carga normal, sin rastro del campo.

## 3. Trampas conocidas

- **PowerShell come comillas internas en comandos ssh**: `grep -rl "Fuente del Prospecto"` llega al remoto SIN quotes (los espacios rompen el patrón). Usar regex sin espacios: `grep -rl Fuente.del.Prospecto`.
- **Strings SQL de Go con TABS**: los INSERT/UPDATE de `service_prospects_crud.go` usan tabulaciones dentro del string; un match con espacios en `edit_file_tool` falla. Copiar la indentación exacta del archivo.
- **Backfill vs DROP**: si se aplica el DROP sin editar la statement INSERT...SELECT de `migrations_crm_accounts_backfill.go`, el backend muere al arrancar (columna inexistente). Ambas ediciones viajan juntas en el mismo commit.
- **`backend/bin/alfa-backend` está tracked** y queda modificado en el server tras cada rebuild: NUNCA commitearlo; el pull ff-only no lo toca porque los commits no lo incluyen.
- **Borradores viejos**: `formFuente` puede seguir en localStorage de usuarios antiguos; la restauración ignora claves inexistentes del modelo (no rompe, ver gherkin edge case).
