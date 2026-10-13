# QA Procedures — CRM: Equipos del prospecto en cotizaciones

> Procedimientos de aseguramiento de calidad para la vinculación de equipos
> CRM con el prospecto real (UUID) y su uso en el formulario de cotizaciones.
> Fecha: 2026-08-14

---

## 1. Alcance

- `crm_equipment_records.prospect_id` migrado de `BIGINT` a `TEXT` (UUID del prospecto).
- `GET /api/v1/crm-equipment/items` y `/records` aceptan `prospectId` (string),
  `clientNit` y `clientName`; el match es `prospect_id = UUID OR nit OR company_name`.
- El modal de recepción guarda `prospectId` con el UUID real (`prospect.backendId`).
- El formulario de cotizaciones y la pestaña "Equipos" de la ficha consultan con
  UUID + nit/nombre del cliente.

## 2. Procedimientos de ejecución

### 2.1 Unit Tests — Backend Go

```bash
cd /var/www/alfa.software.net.co/backend
go test ./internal/crm/equipment/... -v -count=1
go vet ./internal/crm/equipment/...
```

Tests de integración contra la base real (requieren la migración aplicada; se
saltan automáticamente si la columna aún es `bigint`):

```bash
cd /var/www/alfa.software.net.co/backend
RUN_DB_TESTS=1 go test ./internal/crm/equipment/... -v -count=1
```

**Criterio de aceptación:** todos los tests pasan; el test de integración crea
recepciones con UUID y `-9000`, verifica el match ampliado y limpia sus datos.

### 2.2 Unit Tests — Lógica frontend

```bash
cd /var/www/alfa.software.net.co
node scripts/test-prospect-equipment-logic.mjs
```

**Criterio de aceptación:** `12 passed, 0 failed` (importa y prueba el archivo
real `crm-prospect-equipment-match.logic.ts`).

### 2.3 Verificación de compilación

```bash
cd backend && go build ./...
npx tsc --noEmit -p tsconfig.app.json
```

### 2.4 E2E — Playwright

```bash
cd /var/www/alfa.software.net.co
node scripts/check-crm-quote-equipment-playwright.mjs
```

Flujo: crea una recepción de equipos vía API asociada al UUID de un prospecto
real, abre `/app/crm-cotizaciones`, crea una cotización, selecciona el prospecto
y verifica que el checkbox del equipo aparece. Limpieza vía API al final.

**Criterio de aceptación:** exit code 0 y todos los checks en `true`.

### 2.5 Verificación manual (checklist)

- [ ] Modal de recepción desde la ficha del prospecto guarda y persiste.
- [ ] Nueva cotización → seleccionar prospecto → aparecen los checkboxes de equipos.
- [ ] Recepción directa (-9000) del mismo NIT/empresa aparece en la cotización.
- [ ] Pestaña "Equipos" de la ficha muestra los mismos equipos que la API.
- [ ] Equipos de otra empresa no aparecen.
- [ ] Módulo Trabajo > Equipos sigue listando todas las recepciones.

## 3. Datos de prueba

| Dato | Valor |
|------|-------|
| Empresa | `demo-company` |
| Prospecto real | `Industrias Manafacturera` (UUID `60b1066e-...`) |
| Recepción migrada | `rec-1782151556891-hp1pqh` (`prospect_id` '60' → UUID) |
| Recepciones directas | `prospect_id = '-9000'` con `nit`/`company_name` del cliente |
| Usuario E2E | `admin@alfa.com` |
