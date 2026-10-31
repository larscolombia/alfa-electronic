# QA Procedures — CRM: Empleado responsable autocompletado en nuevo prospecto

> Procedimientos de aseguramiento de calidad para que el select "Empleado
> responsable" (`#prospect-owner`) del formulario "Agregar prospecto" siempre
> arranque con el empleado logueado, sin importar la puerta de entrada.
> Fecha: 2026-10-31

---

## 1. Alcance

- `CrmProspectsComponent` (`src/app/pages/app/crm/crm-prospects.component.ts`):
  - **Constructor**: al restaurar un borrador con el formulario abierto, si
    `formEmpleado` quedó vacío se completa con `currentLoggedInEmployee()`
    (name de la sesión, fallback a email) ANTES de que `loadEmployeeOptions()`
    mezcle opciones.
  - **`openProspectForm()`** (botón "Agregar Prospecto"): ya pasaba por
    `resetProspectForm()`, que asigna el default y llama a
    `loadEmployeeOptions()`. Sin cambios.
  - **`onProspectFormToggle()`** (clic nativo en el `<summary>` del
    `<details id="prospect-form-card">`): tercera puerta de entrada. Si el
    campo está vacío se completa con el empleado logueado; SIEMPRE llama a
    `loadEmployeeOptions()` + `cdr.detectChanges()`.

- **Causa raíz del fallo original (escenario C)**: un `<select>` solo puede
  mostrar valores que existen entre sus `<option>`. `hrPeople.optionsFor(current, ...)`
  mezcla el valor actual de `formEmpleado` en la lista; si se asignaba el modelo
  sin refrescar opciones, ngModel no encontraba opción coincidente y el DOM se veía
  vacío aunque el modelo tuviera valor.

## 2. Procedimientos de ejecución

### 2.1 Verificación de compilación (frontend)

```bash
npx tsc --noEmit -p tsconfig.app.json   # o ng serve / npm run build sin errores
```

**Criterio de aceptación:** 0 errores; el chunk `crm-prospects.component-*.js`
se regenera con el nuevo hash.

### 2.2 E2E — Playwright (suite local, visual)

```bash
npm run check:crm-prospect-owner-default
# = node scripts/check-crm-prospect-owner-default-playwright.mjs
```

Tres escenarios, todos contra `http://localhost:4200` con backend en `:8080`:

| # | Escenario | Puerta de entrada | Assert |
|---|-----------|-------------------|--------|
| A | Carga fresca + clic botón "Agregar Prospecto" | `openProspectForm()` → `resetProspectForm()` | `#prospect-owner` value = nombre logueado y la opción existe |
| B | Borrador viejo sembrado con `formEmpleado:""` (addInitScript) | Constructor (restauración de borrador) | idem |
| C | Carga fresca + clic directo en el `<summary>` (toggle nativo) | `onProspectFormToggle()` | idem |

**Criterio de aceptación:** exit code 0 y `{"ok":true}` en los tres escenarios.
El browser se cierra en el `finally` del script (no dejar instancias colgadas).

### 2.3 E2E — Playwright contra producción (post-deploy)

```bash
PW_BASE_URL=https://alfa.software.net.co \
PW_API_BASE_URL=https://alfa.software.net.co \
node scripts/check-crm-prospect-owner-default-playwright.mjs
```

**Criterio de aceptación:** los tres escenarios verdes contra prod.

### 2.4 Verificación manual (checklist)

1. Login como comercial → Prospectos → botón "Agregar Prospecto" → el campo ya trae tu nombre.
2. Cerrar la pestaña sin guardar, reabrir → el borrador restaura el formulario con tu nombre.
3. Con el formulario cerrado, hacer clic en el encabezado "Agregar prospecto" (summary) → se abre y el campo trae tu nombre.
4. Cambiar responsable a otro empleado, cerrar y reabrir por summary → conserva al otro (nunca se pisa un valor escrito).

## 3. Trampas conocidas

- **`addInitScript` de Playwright**: nunca referenciar constantes del scope Node
  dentro del callback (corre en contexto navegador) — pasarlas como argumentos
  del segundo parámetro. Un `ReferenceError` ahí aborta el seed silenciosamente
  y el escenario B "falla" aunque el app esté bien.
- **Backend local sin CORS**: las opciones RRHH no cargan en `:4200`; el select
  queda con solo `"--"` + el merge de `current`. El assert del value sigue siendo
  válido porque `optionsFor()` incluye siempre al empleado logueado.
- **`FormDraftService.watch()`** es de un solo sentido (componente → localStorage,
  inmediato + cada 900ms); nunca reescribe campos del componente. No es causa de
  este bug; no "arreglarlo" tocando el watch.
