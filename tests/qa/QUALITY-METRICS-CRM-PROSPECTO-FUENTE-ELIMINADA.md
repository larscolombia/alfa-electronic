# Quality Metrics — CRM: eliminación del campo "Fuente del Prospecto" (prospectos + clientes + BD)

> Métricas de calidad de la remoción completa del campo fuente (`formFuente` /
> `source`) de prospectos, clientes y base de datos.
> Fecha: 2026-10-31 · Commit: `e314d0e6` (rama `cambios-Anderson`)

---

## 1. Métricas de código

| Métrica | Valor | Objetivo | Método |
|---------|-------|----------|--------|
| Archivos modificados/creados | 16 (+197 / −118 líneas) | coherente con alcance FE+BE+BD | `git show --stat e314d0e6` |
| Frontend TS | 5 (componentes, store, API service, work-teams) | sin código muerto de fuente | grep: 0 matches reales en `src/app` |
| Backend Go | 7 (types, service, catalogs, prospects CRUD/helpers, clients CRUD) | SQL renumerado `$1..$21` consistente | build Go limpio local + prod |
| Migraciones BD | 3 (drop-source nueva idempotente, backfill corregida, registro en all.go) | DROP seguro y reversible de arranque | backend arranca sin errores en local y prod |
| Errores de compilación | 0 Go / 0 TS | 0 | `go build ./cmd/server` + bundle generation complete |
| Docs de testing nuevos | 3 (gherkin + QA procedures + quality metrics) | ≥ 1 por cambio | AGENTS.md |

## 2. Métricas de testing

| Capa | Tests | Resultado | Comando |
|------|-------|-----------|---------|
| E2E Playwright local A (formulario sin fuente) | 1 escenario / 2 asserts | PASS | `node scripts/check-crm-prospect-source-removed-playwright.mjs` |
| E2E Playwright local B (creación end-to-end) | 1 escenario / 3 asserts | PASS | idem |
| E2E Playwright local C (detalle sin fuente) | 1 escenario / 2 asserts | PASS | idem |
| E2E Playwright local D (clientes sin fuente) | 1 escenario / 2 asserts | PASS | idem |
| Migración drop-source contra BD local | DROP + DELETE catálogo | PASS (arranque limpio, stderr vacío) | rebuild + relanzar `alfa-backend.exe` |
| Deploy prod: pull ff-only + rebuild Go + restart | servicio active, `/health` 200, sin errores de migración en journalctl | PASS (2026-10-31) | ver QA procedures §2.3 |
| Bundle prod limpio | `grep -rl Fuente.del.Prospecto dist/demo/browser` → 0 matches | PASS | ssh al server |
| E2E Playwright prod (post-deploy) | 4 escenarios / 9 asserts | PASS (2026-10-31, commit `e314d0e6`) | `PW_BASE_URL=https://alfa.software.net.co node scripts/check-crm-prospect-source-removed-playwright.mjs` |

## 3. Cobertura de edge cases

| Caso | Cubierto por |
|------|--------------|
| Formulario nuevo sin select fuente ni etiqueta | Escenario A (assert de ausencia en DOM) |
| Creación end-to-end tras renumerar placeholders SQL ($1..$21) | Escenario B (guarda real vía API + aparece en lista) |
| Detalle no muestra/edita fuente | Escenario C |
| Clientes intactos tras quitar `source` de `crm_accounts` y del INSERT conversión | Escenario D |
| Borrador viejo con clave `formFuente` en localStorage | Gherkin edge case (restauración ignora claves inexistentes) |
| Conversión trabajo→prospecto sin columna source | Gherkin edge case + edición de `work-teams.component.ts` y `service_clients_crud.go` |
| Catálogo 'sources' no sembrado ni servido | Migración DELETE + remoción de `CatalogTypeSources` del seed; gherkin edge case sobre GET /crm/catalogs |

## 4. Resultado final

- Local: `OK: campo 'Fuente del Prospecto' eliminado de formulario, detalle y clientes; creación end-to-end funciona.` (A/B/C/D verdes contra `http://localhost:4200`).
- Prod (2026-10-31, commit `e314d0e6`, rebuild Go en server + restart systemd + build frontend con node v20.19.0): `OK` — los 4 escenarios verdes contra `https://alfa.software.net.co`.
  - Migración drop-source ejecutada contra BD prod sin errores (servicio active, `/health` 200).
  - Bundle servido por nginx (`dist/demo/browser`) sin la cadena "Fuente del Prospecto" (grep → 0 matches); HTTP 200 en `/`.
