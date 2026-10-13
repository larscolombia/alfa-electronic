# Quality Metrics — CRM: Equipos del prospecto en cotizaciones

> Métricas de calidad del cambio de vinculación de equipos por UUID.
> Fecha: 2026-08-14

---

## 1. Métricas de código

| Métrica | Valor | Objetivo | Método |
|---------|-------|----------|--------|
| Archivos Go nuevos | 2 (service_record_match.go, migrations_crm_equipment_prospect_id.go) | — | `ls` |
| Archivos Go modificados | 4 (types, handler, service_records, service_record_normalize, migrations_all, migrations_crm_equipment_quotes) | ≤ 8 | git diff |
| Líneas por archivo nuevo | < 120 | ≤ 250 | `wc -l` |
| Errores de compilación Go | 0 | 0 | `go build ./...` |
| Warnings vet | 0 | 0 | `go vet ./...` |
| Errores de compilación TS | 0 | 0 | `npx tsc --noEmit -p tsconfig.app.json` |
| Archivos TS nuevos | 1 (crm-prospect-equipment-match.logic.ts) | — | `ls` |
| Archivos TS modificados | 6 (store, api service, modal, quotes, detail, prospects, work-teams) | ≤ 8 | git diff |

## 2. Métricas de testing

| Capa | Tests | Resultado | Comando |
|------|-------|-----------|---------|
| Unit Go (puros) | 3 funciones / 15 casos | PASS | `go test ./internal/crm/equipment/...` |
| Integración Go (DB real) | 4 subtests | PASS (con `RUN_DB_TESTS=1`) | ver QA-PROCEDURES |
| Unit lógica frontend | 12 asserts | PASS | `node scripts/test-prospect-equipment-logic.mjs` |
| E2E Playwright | 6 checks | Ver resultado del script | `node scripts/check-crm-quote-equipment-playwright.mjs` |

## 3. Cobertura del criterio de match

| Caso | Cubierto por |
|------|--------------|
| Match por UUID exacto | Go integración + E2E |
| Recepción directa (-9000) mismo NIT/nombre | Go integración |
| Cliente ajeno excluido | Go integración |
| Id numérico legado no matchea UUID | Go integración + unit |
| prospectId "0"/vacío = sin filtro | Unit Go + unit frontend |
| Persistencia de UUID en upsert | Go integración |
