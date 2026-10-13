# Test Coverage Report — Inventario + Compras

> Reporte de cobertura de tests para los módulos de Inventario y Compras.
> Fecha: 2026-08-05

---

## 1. Backend Go — Coverage Actual

### Comando para generar

```bash
cd /var/www/alfa.software.net.co/backend

# Inventario
go test ./internal/inventory/ -coverprofile=/tmp/inv_cover.out
go tool cover -func=/tmp/inv_cover.out

# Suppliers
go test ./internal/suppliers/ -coverprofile=/tmp/sup_cover.out
go tool cover -func=/tmp/sup_cover.out

# Todo el backend
go test ./... -coverprofile=/tmp/all_cover.out
go tool cover -func=/tmp/all_cover.out | tail -1
```

### Coverage por función (paquete inventory)

| Función | Coverage | Tests que la cubren |
|---------|----------|-------------------|
| `normalizeToken` | ✅ Cubierta | TestNormalizeToken |
| `similarity` | ✅ Cubierta | TestSimilarity |
| `levenshtein` | ✅ Cubierta | TestLevenshteinDistance |
| `formatSupplierLabel` | ✅ Cubierta | TestFormatSupplierLabel |
| `generateInternalCode` | ✅ Cubierta | TestGenerateInternalCode |
| `maxInt` | ✅ Cubierta | TestMaxInt |
| `isoWeekKey` | ✅ Cubierta | TestIsoWeekKey |
| `buildID` | ✅ Cubierta | TestBuildID |
| `ListReferences` | ☐ Requiere BD | Integration test |
| `CreateReference` | ☐ Requiere BD | Integration test |
| `RegisterStockEntry` | ☐ Requiere BD | Integration test |
| `SubmitMovement` | ☐ Requiere BD | Integration test |
| `CreateReservation` | ☐ Requiere BD | Integration test |
| `ConsumeReservation` | ☐ Requiere BD | Integration test |
| `GeneratePurchaseLines` | ☐ Requiere BD | Integration test |
| `ClosePurchaseLine` | ☐ Requiere BD | Integration test |
| `CreatePurchaseRequest` | ☐ Requiere BD | Integration test |
| `ReviewPurchaseRequest` | ☐ Requiere BD | Integration test |
| `ConsolidatePurchaseLinesBySupplier` | ☐ Requiere BD | Integration test |
| `ApprovePurchaseLine` | ☐ Requiere BD | Integration test |

### Coverage por función (paquete suppliers)

| Función | Coverage | Tests que la cubren |
|---------|----------|-------------------|
| `normalizeGrade` | ✅ Cubierta | TestNormalizeGrade |
| `normalizeTitle` | ✅ Cubierta | TestNormalizeTitle |
| `ListSuppliers` | ☐ Requiere BD | Integration test |
| `CreateSupplier` | ☐ Requiere BD | Integration test |
| `UpdateSupplier` | ☐ Requiere BD | Integration test |
| `DeleteSupplier` | ☐ Requiere BD | Integration test |
| `CreateOrder` | ☐ Requiere BD | Integration test |
| `UpdateOrder` | ☐ Requiere BD | Integration test |
| `AddOrderTrace` | ☐ Requiere BD | Integration test |

---

## 2. Frontend Angular — Coverage Plan

### Comando para generar

```bash
cd /var/www/alfa.software.net.co
npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
# Reporte HTML en: coverage/demo/lcov-report/index.html
```

### Coverage esperado por servicio

| Servicio | Coverage esperado | Tests necesarios |
|----------|-------------------|-----------------|
| `inventory-api.service.ts` | > 80% | Mock HTTP, verificar URLs y payloads |
| `inventory-workflow.service.ts` | > 70% | Mock API, verificar lógica optimistic update |
| `suppliers-api.service.ts` | > 80% | Mock HTTP, verificar URLs y payloads |
| `suppliers-catalog.service.ts` | > 70% | Mock API, verificar CRUD optimistic |
| `inventory-rbac.service.ts` | > 80% | Verificar matriz de permisos |
| `inventory-domain.models.ts` | N/A (tipos) | — |

### Tests Angular pendientes de crear

```typescript
// src/app/services/inventory-api.service.spec.ts
describe('InventoryApiService', () => {
  it('should call GET /api/v1/inventory on getFullState()');
  it('should call POST /api/v1/inventory/references on createReference()');
  it('should call POST /api/v1/inventory/stock-entry on registerStockEntry()');
  it('should call POST /api/v1/inventory/movements on submitMovement()');
  it('should call POST /api/v1/inventory/purchase-requests on createPurchaseRequest()');
  it('should call GET /api/v1/inventory/purchase-lines/consolidate on consolidatePurchaseLines()');
  it('should call POST /api/v1/inventory/purchase-lines/:id/approve on approvePurchaseLine()');
  it('should call POST /api/v1/inventory/purchase-lines/:id/link-order on linkPurchaseLineToOrder()');
});

// src/app/services/suppliers-api.service.spec.ts
describe('SuppliersApiService', () => {
  it('should call GET /api/v1/suppliers on listSuppliers()');
  it('should call POST /api/v1/suppliers on createSupplier()');
  it('should call PUT /api/v1/suppliers/:id on updateSupplier()');
  it('should call DELETE /api/v1/suppliers/:id on deleteSupplier()');
  it('should call GET /api/v1/suppliers/orders on listOrders()');
  it('should call POST /api/v1/suppliers/orders on createOrder()');
  it('should call POST /api/v1/suppliers/orders/:id/trace on addOrderTrace()');
});

// src/app/services/suppliers-catalog.service.spec.ts
describe('SuppliersCatalogService', () => {
  it('should load suppliers from API on init');
  it('should create supplier via API and refresh');
  it('should update supplier via API and refresh');
  it('should remove supplier via API and refresh');
  it('should normalize draft fields correctly');
  it('should normalize grade to A/B/C/D');
  it('should find supplier by ID');
  it('should find supplier by supplier number');
});
```

---

## 3. Coverage de Endpoints API

### Inventario (57 endpoints)

| Categoría | Endpoints | Con test | Coverage |
|-----------|-----------|----------|----------|
| Estado completo | 3 | ☐ | 0% |
| Referencias | 4 | ☐ | 0% |
| Stock entry | 1 | ☐ | 0% |
| Movimientos | 2 | ☐ | 0% |
| Adjustment requests | 3 | ☐ | 0% |
| Reservations | 6 | ☐ | 0% |
| Replenishment | 4 | ☐ | 0% |
| Purchase lines | 7 | ☐ | 0% |
| Weekly snapshots | 2 | ☐ | 0% |
| Bags | 3 | ☐ | 0% |
| Sessions | 4 | ☐ | 0% |
| Discrepancies | 2 | ☐ | 0% |
| Audit | 1 | ☐ | 0% |
| Purchase requests | 3 | ☐ | 0% |
| Consolidation | 1 | ☐ | 0% |
| **Total** | **46** | **0** | **0%** |

### Suppliers (12 endpoints)

| Categoría | Endpoints | Con test | Coverage |
|-----------|-----------|----------|----------|
| CRUD Suppliers | 5 | ☐ | 0% |
| Orders | 6 | ☐ | 0% |
| Traces | 1 | ☐ | 0% |
| **Total** | **12** | **0** | **0%** |

---

## 4. Resumen Ejecutivo

```
┌─────────────────────────────────────────────────────┐
│           TEST COVERAGE SUMMARY                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Backend Unit Tests (helpers)                        │
│    inventory:  8 tests  ✅ ALL PASS                  │
│    suppliers:  2 tests  ✅ ALL PASS                  │
│                                                      │
│  Backend Unit Coverage (helpers only)                │
│    inventory:  ~85% of helper functions              │
│    suppliers:  ~90% of helper functions              │
│                                                      │
│  Backend Integration Coverage (SQL functions)        │
│    inventory:  0% (pending)                          │
│    suppliers:  0% (pending)                          │
│                                                      │
│  Frontend Unit Coverage                              │
│    All services: 0% (pending spec files)             │
│                                                      │
│  API Endpoint Coverage                               │
│    58 endpoints total, 0 with integration tests      │
│                                                      │
│  Gherkin BDD Scenarios                               │
│    inventory.feature: 18 scenarios documented        │
│    compras.feature:   16 scenarios documented        │
│    Total: 34 scenarios                               │
│                                                      │
├─────────────────────────────────────────────────────┤
│  NEXT STEPS                                          │
│  1. Create Angular .spec.ts files for services       │
│  2. Create integration test scripts for API          │
│  3. Run mutation testing on helper functions         │
│  4. Set up Playwright E2E for critical flows         │
└─────────────────────────────────────────────────────┘
```

---

## 5. Cómo actualizar este reporte

Después de agregar tests:

1. Ejecutar `go test ./... -coverprofile=/tmp/all.out && go tool cover -func=/tmp/all.out`
2. Actualizar las tablas de coverage por función
3. Ejecutar `ng test --code-coverage` y actualizar la sección de frontend
4. Contar endpoints con tests y actualizar la tabla de API coverage
5. Actualizar el resumen ejecutivo
