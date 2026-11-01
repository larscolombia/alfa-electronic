# QA Procedures — Recepción: un solo equipo a la vez (botón "Agregar equipo" oculto)

> Procedimientos de aseguramiento de calidad para ocultar el botón "Agregar equipo"
> (`data-testid="equipment-modal-add-item"`, `addEquipmentItem()`) del modal wizard
> `app-crm-prospect-equipment-modal` **solo en la vista /app/work-equipment-reception**.
> La funcionalidad multi-item del modal queda intacta; CRM sigue pasando el input en true.
> Fecha: 2026-11-01 · Commit: `901581d1` (rama `cambios-Anderson`)

---

## 1. Alcance

**Frontend (3 archivos, sin tocar Go):**
- `src/app/pages/app/crm/crm-prospect-equipment-modal.component.ts`: input nuevo
  `@Input() allowMultipleEquipment = false;` (default oculto = nueva regla de negocio)
  y condición en el botón:
  `*ngIf="currentWizardStep.key === 'equipment' && allowMultipleEquipment"`.
- `src/app/pages/app/crm/crm-prospects.component.ts`: al uso del modal se le agregó
  `[allowMultipleEquipment]="true"` (CRM conserva el registro múltiple, sin cambios de comportamiento).
- `src/app/pages/app/work/work-teams.component.ts`: constante de clase
  `readonly allowMultipleEquipmentReception = false;` + binding activo
  `[allowMultipleEquipment]="allowMultipleEquipmentReception"` + comentario HTML
  sobre el elemento explicando cómo reactivar.

**Suite nueva:** `scripts/check-work-equipment-single-add-playwright.mjs` (escenarios A/B).

## 2. Procedimientos de ejecución

### 2.1 Verificación de compilación

```bash
ng serve --proxy-config proxy.local.json   # "Application bundle generation complete" sin errores
```

**Criterio de aceptación:** 0 errores TS/Angular. Los warnings NG8107 preexistentes en
`work-teams.component.ts:285/291` (optional chaining) NO son de este cambio.

### 2.2 E2E — Playwright local (visual, nunca al API directo)

```bash
node scripts/check-work-equipment-single-add-playwright.mjs
# contra http://localhost:4200 con backend Go en :8080
```

| # | Escenario | Assert |
|---|-----------|--------|
| A | "Nuevo equipo" → paso Equipos | NO existe `equipment-modal-add-item`; 1 tarjeta `.equipment-card`; `remove-item-0` deshabilitado (flujo de un solo ítem sano) |
| B | "Editar" de una fila existente → paso Equipos | NO existe el botón; tarjetas = N equipos declarados en la fila. Si no hay datos, se reporta `skipped: true` sin fallar |

**Criterio de aceptación:** exit code 0 y `{"ok":true}` en los escenarios ejecutados.
El browser se cierra en el `finally` del script (no dejar instancias colgadas).

### 2.3 Deploy a producción (`157.173.195.42`, `/var/www/alfa.software.net.co`)

Cambio **solo frontend** → NO hace falta rebuild/restart de Go:

```bash
# 1) pull ff-only (rama cambios-Anderson)
ssh root@157.173.195.42 'cd /var/www/alfa.software.net.co && git pull --ff-only origin cambios-Anderson'
# 2) build frontend EN EL SERVER (node v20.19.0 vía nvm; el default del PATH lo rechaza Angular CLI)
ssh root@157.173.195.42 'export PATH=$HOME/.nvm/versions/node/v20.19.0/bin:$PATH && cd /var/www/alfa.software.net.co && npm run build'
```

**Criterio de aceptación:** build termina con "Output location: .../dist/demo" (los
warnings CommonJS de dayjs son preexistentes) y `curl https://alfa.software.net.co/` = 200.

### 2.4 E2E — Playwright contra producción (post-deploy)

```powershell
$env:PW_BASE_URL="https://alfa.software.net.co"; $env:PW_API_BASE_URL="https://alfa.software.net.co"
node scripts/check-work-equipment-single-add-playwright.mjs
Remove-Item Env:\PW_BASE_URL, Env:\PW_API_BASE_URL
```

**Criterio de aceptación:** escenarios A/B verdes contra prod.

### 2.5 Verificación manual (checklist)

1. `/app/work-equipment-reception` → "Nuevo equipo" → paso Equipos: NO hay botón "Agregar equipo".
2. Editar una recepción existente → paso Equipos: todos los equipos visibles, sin botón de agregar.
3. Con un solo ítem el botón Eliminar queda deshabilitado (comportamiento previo intacto).
4. Para reactivar en recepción: `allowMultipleEquipmentReception = true` (una línea, documentada).

## 3. Trampas conocidas

- **Comentario HTML DENTRO de la etiqueta del modal rompe Angular**: un `<!-- ... -->`
  entre los atributos de `<app-crm-prospect-equipment-modal>` hace que el tokenizer trate
  `-->` como cierre prematuro → error `NG5002: Opening tag not terminated`. Por eso la
  reactivación es "cambiar una línea" (la constante), no literalmente "descomentar":
  el comentario válido vive SOBRE el elemento y apunta a la constante de la clase.
- **El modal es compartido**: cualquier cambio al input debe mantener el default `false`
  (regla nueva) y que CRM siga pasando `true` explícito; si se olvida el binding en CRM,
  el registro múltiple de prospectos desaparece silenciosamente.
- **Trigger del modal en CRM ausente (preexistente)**: `openEquipmentModal()` está definida
  pero ningún template la invoca desde `a494b8f7`; el contrato multi-add de CRM se verifica
  a nivel de componente (input true), no por flujo visual. No reabrir en este cambio.
- **PowerShell**: stderr de git/ssh como error → exit code 1 falso positivo; verificar la
  línea `old..new rama -> rama` del push y el "Fast-forward" del pull.
- **Vite overlay transitorio**: tras un build fallido anterior, el `<vite-error-overlay>`
  puede interceptar clics en la primera corrida (carrera de HMR). Si aparece sin errores en
  consola ni en `ng-serve.err.log`, recargar/reintentar; no es un fallo del cambio.
