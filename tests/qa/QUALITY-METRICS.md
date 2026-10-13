# Quality Metrics — Inventario + Compras

> Métricas de calidad del código y los procesos de testing.
> Fecha: 2026-08-05

---

## 1. Métricas de Código

### 1.1 Backend Go

| Métrica | Valor actual | Objetivo | Método |
|---------|-------------|----------|--------|
| Archivos Go (inventario) | 3 (types, service, handler) | — | `ls backend/internal/inventory/` |
| Archivos Go (suppliers) | 3 (types, service, handler) | — | `ls backend/internal/suppliers/` |
| Líneas de código (inventario) | ~2000 | < 2500 | `wc -l backend/internal/inventory/*.go` |
| Líneas de código (suppliers) | ~700 | < 1000 | `wc -l backend/internal/suppliers/*.go` |
| Funciones exportadas (inventario) | ~40 | — | `grep "^func" backend/internal/inventory/service.go` |
| Funciones exportadas (suppliers) | ~15 | — | `grep "^func" backend/internal/suppliers/service.go` |
| Endpoints REST (inventario) | ~45 | — | `grep "group\." backend/internal/inventory/handler.go` |
| Endpoints REST (suppliers) | ~12 | — | `grep "group\." backend/internal/suppliers/handler.go` |
| Tablas PostgreSQL nuevas | 17 | — | Migraciones |
| Errores de compilación | 0 | 0 | `go build ./...` |
| Warnings de formato | 0 | 0 | `gofmt -l` |

### 1.2 Frontend Angular

| Métrica | Valor actual | Objetivo | Método |
|---------|-------------|----------|--------|
| Services nuevos | 2 (inventory-api, suppliers-api) | — | `ls src/app/services/*api*` |
| Services migrados de localStorage | 2 (inventory-workflow, suppliers-catalog) | 2 | Code review |
| Componentes modificados | 2 (kanban-view, suppliers-dashboard) | < 5 | Git diff |
| Errores de compilación | 0 | 0 | `ng build --configuration=production` |
| Warnings nuevos | 0 | 0 | Build output |

### 1.3 Complejidad Ciclomática

| Archivo | Funciones complejas (>10) | Objetivo |
|---------|--------------------------|----------|
| inventory/service.go | ~5 (GeneratePurchaseLines, ClosePurchaseLine, etc.) | < 8 |
| suppliers/service.go | ~2 (CreateOrder, UpdateOrder) | < 5 |
| inventory-workflow.service.ts | ~3 (submitMovement, createReference) | < 5 |

---

## 2. Métricas de Testing

### 2.1 Unit Tests — Backend

| Paquete | Tests | Pasan | Fallan | Coverage |
|---------|-------|-------|--------|----------|
| internal/inventory | 8 | 8 | 0 | Medir con `-coverprofile` |
| internal/suppliers | 2 | 2 | 0 | Medir con `-coverprofile` |
| internal/hr | 13 suites / 49 tests y subtests (integration, gated `RUN_DB_TESTS=1`): create, get, update, reset-password, perfil completo (round-trip 33 campos, opcionales vacíos, fechas inválidas), foto (round-trip, formato inválido, oversize, compat vacía), documentos del expediente (upload/list/download round-trip, validaciones, soft delete) | 49 | 0 | 33.6% statements (`RUN_DB_TESTS=1 go test -race -cover ./internal/hr/`) |
| internal/crm | 2 suites / 10 subtests (integration, gated `RUN_DB_TESTS=1`): client contacts create/validate/update/delete | 10 | 0 | 12.9% statements (`RUN_DB_TESTS=1 go test -race -cover ./internal/crm/...`) |

**Comando para medir coverage:**
```bash
cd /var/www/alfa.software.net.co/backend
go test ./internal/inventory/ -coverprofile=inv_cover.out
go tool cover -func=inv_cover.out | tail -1

go test ./internal/suppliers/ -coverprofile=sup_cover.out
go tool cover -func=sup_cover.out | tail -1
```

### 2.2 Unit Tests — Frontend

| Service | Tests | Pasan | Fallan | Coverage |
|---------|-------|-------|--------|----------|
| inventory-workflow.service | TBD | — | — | TBD |
| suppliers-catalog.service | TBD | — | — | TBD |
| inventory-api.service | TBD | — | — | TBD |
| suppliers-api.service | TBD | — | — | TBD |

**Comando para medir coverage:**
```bash
cd /var/www/alfa.software.net.co
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
# Reporte en: coverage/demo/
```

### 2.3 Integration Tests (API)

| Endpoint | Test existe | Pasa |
|----------|------------|------|
| GET /api/v1/inventory | ☐ | ☐ |
| POST /api/v1/inventory/references | ☐ | ☐ |
| POST /api/v1/inventory/stock-entry | ☐ | ☐ |
| POST /api/v1/inventory/movements | ☐ | ☐ |
| POST /api/v1/inventory/reservations | ☐ | ☐ |
| POST /api/v1/inventory/purchase-lines/generate | ☐ | ☐ |
| POST /api/v1/inventory/purchase-lines/:id/close | ☐ | ☐ |
| POST /api/v1/inventory/purchase-requests | ☐ | ☐ |
| POST /api/v1/inventory/purchase-requests/:id/review | ☐ | ☐ |
| GET /api/v1/inventory/purchase-lines/consolidate | ☐ | ☐ |
| POST /api/v1/inventory/purchase-lines/:id/approve | ☐ | ☐ |
| POST /api/v1/inventory/purchase-lines/:id/link-order | ☐ | ☐ |
| GET /api/v1/suppliers | ☐ | ☐ |
| POST /api/v1/suppliers | ☐ | ☐ |
| PUT /api/v1/suppliers/:id | ☐ | ☐ |
| DELETE /api/v1/suppliers/:id | ☐ | ☐ |
| GET /api/v1/suppliers/orders | ☐ | ☐ |
| POST /api/v1/suppliers/orders | ☐ | ☐ |
| POST /api/v1/suppliers/orders/:id/trace | ☐ | ☐ |
| GET /api/v1/hr/employees | ☐ | ☐ |
| POST /api/v1/hr/employees | ☑ (Go integration test) | ☑ |
| GET /api/v1/hr/employees/:id | ☑ (Go integration test) | ☑ |
| PUT /api/v1/hr/employees/:id | ☑ (Go integration test, incluye round-trip de 33 campos) | ☑ |
| PATCH /api/v1/hr/employees/soft-delete | ☐ | ☐ |
| GET /api/v1/hr/employees/:id/documents | ☑ (Go integration test, metadata sin contenido) | ☑ |
| POST /api/v1/hr/employees/:id/documents | ☑ (Go integration test, upload + validaciones) | ☑ |
| GET /api/v1/hr/employees/:id/documents/:docId/download | ☑ (Go integration test, round-trip del contenido) | ☑ |
| DELETE /api/v1/hr/employees/:id/documents/:docId | ☑ (Go integration test, soft delete) | ☑ |
| GET /api/v1/crm/clients/:id/contacts | ☑ (Go integration test) | ☑ |
| POST /api/v1/crm/clients/:id/contacts | ☑ (Go integration test) | ☑ |
| PUT /api/v1/crm/clients/:id/contacts/:contactId | ☑ (Go integration test) | ☑ |
| DELETE /api/v1/crm/clients/:id/contacts/:contactId | ☑ (Go integration test) | ☑ |

### 2.4 E2E Tests — Playwright

| Flujo | Script | Test existe | Pasa |
|-------|--------|------------|------|
| Semáforo SLA + barra resumen en tablero de proyectos | `scripts/check-sla-config-summary-playwright.mjs` (`check:sla-config-summary`) | ☑ | ☑ |
| Chips de resumen SLA clickeables (scroll a columna + resalte temporal) | `scripts/check-projects-sla-chips-playwright.mjs` (`check:projects-sla-chips`) | ☑ | ☐ (pendiente deploy) |
| Remisiones UX: menú top-level, códigos visibles, detalle de entregados | `scripts/check-remissions-ux-playwright.mjs` (`check:remissions-ux`) | ☑ | ☐ (pendiente deploy) |
| Reporte técnico sin sección de repuestos (aserción invertida) | `scripts/check-technical-report-playwright.mjs` (`check:technical-report`) | ☑ | ☐ (pendiente deploy) |
| Aprobación de compras desde proyectos (solicitudes listadas, aprobación por UI, bypass admin) | `scripts/check-purchase-requests-admin-playwright.mjs` | ☑ | ☐ (pendiente deploy) |

---

## 3. Métricas de Calidad del Proceso

### 3.1 Velocidad de Desarrollo

| Métrica | Valor |
|---------|-------|
| Módulos completados | 2 (Inventario + Compras) |
| Brechas corregidas | 6 |
| Tablas BD creadas | 17 |
| Endpoints REST creados | ~57 |
| Tests unitarios Go | 10 |
| Tests unitarios JS (lógica frontend) | 11 (`scripts/test-*.mjs`, incluye `test-inventory-rbac-logic.mjs`) |
| Tests Gherkin | 127 escenarios (10 features, incluye `compras-aprobacion.feature`) |

### 3.2 Deuda Técnica

| Item | Severidad | Estado |
|------|-----------|--------|
| Tests frontend (Angular) pendientes | Media | Pendiente |
| Tests E2E Playwright para flujos nuevos | Media | Pendiente |
| Documentación de API (OpenAPI/Swagger) | Baja | Pendiente |
| Rate limiting en endpoints | Baja | Pendiente |
| Validación de entrada más estricta | Media | Parcial |

### 3.3 Indicadores de Calidad

| Indicador | Fórmula | Actual | Objetivo |
|-----------|---------|--------|----------|
| **Densidad de bugs** | Bugs / KLOC | TBD | < 5 |
| **Cobertura de tests** | Líneas cubiertas / Total | TBD | > 80% |
| **Tasa de paso** | Tests que pasan / Total | 100% | 100% |
| **Tiempo de build** | Segundos | ~47s (frontend) | < 60s |
| **Deuda de formato** | Archivos sin gofmt | 0 | 0 |

---

## 4. Dashboard de Calidad (resumen ejecutivo)

```
┌─────────────────────────────────────────────────┐
│           QUALITY DASHBOARD                      │
├─────────────────────────────────────────────────┤
│  Backend Build       ✅ PASS                     │
│  Frontend Build      ✅ PASS                     │
│  Go Unit Tests       ✅ 10/10 PASS               │
│  Go Format           ✅ 0 issues                 │
│  Gherkin Scenarios   📝 130 documented           │
│  API Coverage        ☐ Pending integration tests │
│  Frontend Coverage   ☐ Pending Angular tests     │
│  Mutation Testing    ☐ Pending setup             │
├─────────────────────────────────────────────────┤
│  OVERALL: 🟡 PARTIAL (backend solid,             │
│           frontend tests pending)                │
└─────────────────────────────────────────────────┘
```

---

## 5. Cómo actualizar estas métricas

Cada vez que se agreguen tests o se modifique código:

1. Ejecutar `go test ./... -coverprofile=coverage.out` y actualizar la tabla de coverage
2. Ejecutar `ng test --code-coverage` y actualizar la tabla de frontend
3. Contar endpoints nuevos y actualizar la tabla de integration tests
4. Registrar bugs encontrados en la sección de deuda técnica
5. Actualizar el dashboard de calidad con el estado actual
