# Quality Metrics — Recepción: un solo equipo a la vez (botón "Agregar equipo" oculto)

> Métricas de calidad del cambio que oculta el botón "Agregar equipo"
> (`equipment-modal-add-item` / `addEquipmentItem()`) del modal wizard compartido,
> **solo en /app/work-equipment-reception**, conservando intacta la funcionalidad
> multi-item (CRM sigue pasando `[allowMultipleEquipment]="true"`).
> Fecha: 2026-11-01 · Commit: `901581d1` (rama `cambios-Anderson`)

---

## 1. Métricas de código

| Métrica | Valor | Objetivo | Método |
|---------|-------|----------|--------|
| Archivos modificados/creados | 4 (+157 / −1 líneas) | coherente con alcance FE-only + suite | `git show --stat 901581d1` |
| Frontend TS | 3 (modal wizard, crm-prospects, work-teams) | input con default seguro (`false`) y bindings explícitos | diff del commit |
| Backend Go / BD | 0 archivos | cambio puramente frontend; sin migraciones | `git show --stat` (sin `.go`, sin migrations) |
| Suite Playwright nueva | 1 archivo, 144 líneas (escenarios A/B) | ≥ 1 suite por cambio | `scripts/check-work-equipment-single-add-playwright.mjs` |
| Errores de compilación | 0 TS / 0 Angular | 0 | "Application bundle generation complete"; solo warnings NG8107 preexistentes en `work-teams.component.ts:285/291` |
| Docs de testing nuevos | 3 (gherkin + QA procedures + quality metrics) | ≥ 1 por cambio | AGENTS.md |

## 2. Métricas de testing

| Capa | Tests | Resultado | Comando |
|------|-------|-----------|---------|
| E2E Playwright local A (creación nueva, paso Equipos) | 1 escenario / 3 asserts (botón ausente, 1 tarjeta, remove-item-0 deshabilitado) | PASS `{"ok":true,"scenario":"creacion-nueva-sin-agregar-equipo"}` | `node scripts/check-work-equipment-single-add-playwright.mjs` contra `http://localhost:4200` |
| E2E Playwright local B (edición de registro existente) | 1 escenario / 2 asserts (botón ausente, tarjetas = N equipos de la fila) | PASS `{"ok":true,"scenario":"edicion-sin-agregar-equipo","recordId":"seed-equipment-kayser-co260206","items":1}` | idem |
| Deploy prod: pull ff-only + build frontend (node v20.19.0 vía nvm) | 4 files, +157/−1; "Output location: dist/demo"; HTTP 200 en `/` | PASS (2026-11-01). Sin rebuild/restart de Go (cambio FE-only) | ver QA procedures §2.3 |
| E2E Playwright prod (post-deploy) | 2 escenarios / 5 asserts | PASS `{"ok":true}` A y B (`recordId":"rec-1793423128649-71gbz0"`, items 1) contra `https://alfa.software.net.co` | `PW_BASE_URL=https://alfa.software.net.co node scripts/check-work-equipment-single-add-playwright.mjs` |

## 3. Cobertura de edge cases

| Caso | Cubierto por |
|------|--------------|
| Creación nueva: botón "Agregar equipo" ausente en paso Equipos y flujo de un solo ítem sano (remove deshabilitado con 1 tarjeta) | Escenario A + gherkin "Recepción nueva sin botón de agregar" |
| Edición de registro existente: todos los equipos declarados visibles, sin botón de agregar; skip documentado si no hay datos | Escenario B + gherkin "Edición de recepción existente" |
| CRM conserva el registro multi-item (input `true` explícito) | Binding en `crm-prospects.component.ts`; gherkin "CRM conserva multi-add". Nota: el modal CRM no tiene trigger visible en UI (`openEquipmentModal()` sin llamadas desde templates, preexistente desde `a494b8f7`) → verificado a nivel de componente |
| Reactivación del botón en recepción con una sola línea | Constante `allowMultipleEquipmentReception` documentada en template y clase; gherkin "Reactivación" |
| Input seguro por defecto: cualquier uso futuro del modal sin binding queda en la regla nueva (oculto) | Default `@Input() allowMultipleEquipment = false`; gherkin "Default seguro" |

## 4. Resultado final

- Local: escenarios A/B verdes contra `http://localhost:4200` (backend Go en `:8080`, `ng serve --proxy-config proxy.local.json`).
- Prod (2026-11-01, commit `901581d1`, pull ff-only + build frontend con node v20.19.0; sin tocar Go): A/B verdes contra `https://alfa.software.net.co`; HTTP 200 en `/`.
- Regla de negocio vigente: en recepción se registra **un equipo a la vez**; el multi-item del modal sigue disponible para CRM y es reactivable en recepción cambiando una línea (`allowMultipleEquipmentReception = true`).
