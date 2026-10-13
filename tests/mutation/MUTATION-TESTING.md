# Mutation Testing — Inventario + Compras

> Configuración y procedimientos para mutation testing en el backend Go.
> Fecha: 2026-08-05

---

## 1. ¿Qué es Mutation Testing?

Mutation testing evalúa la calidad de los tests introduciendo cambios pequeños (mutantes) en el código fuente y verificando si los tests los detectan. Si un test no detecta un mutante, el mutante "sobrevive" → indica un hueco en la cobertura de tests.

**Score de mutación** = (Mutantes eliminados / Total mutantes) × 100

---

## 2. Herramienta: `golang.org/x/tools/cmd/gomut`

### Instalación

```bash
go install golang.org/x/tools/cmd/gomut@latest
```

### Alternativa: `github.com/zimmski/go-mutesting`

```bash
go install github.com/zimmski/go-mutesting/mutesting@latest
```

---

## 3. Ejecución

### 3.1 Mutation testing en el paquete `inventory`

```bash
cd /var/www/alfa.software.net.co/backend

# Con go-mutesting
mutesting ./internal/inventory/ --exec ./mutest-runner.sh

# Manual: verificar que los tests detectan cambios
# 1. Modificar una función (ej: cambiar >= por > en canApplyMovement)
# 2. Ejecutar go test ./internal/inventory/
# 3. Si los tests siguen pasando → el mutante sobrevivió (hueco)
# 4. Si los tests fallan → el mutante fue eliminado (bien)
```

### 3.2 Script runner para mutesting

`backend/mutest-runner.sh` (ya existe en el repo):

```bash
#!/bin/bash
cd /var/www/alfa.software.net.co/backend
go test ./internal/inventory/ ./internal/suppliers/ ./internal/remissions/ -count=1
exit $?
```

```bash
chmod +x backend/mutest-runner.sh
```

---

## 4. Mutantes a verificar manualmente

### 4.1 Paquete `inventory` — Funciones críticas

| Función | Mutante | Test que debe detectarlo |
|---------|---------|-------------------------|
| `normalizeToken` | Quitar `.ToLower()` | TestNormalizeToken ("LM324N" → "lm324n") |
| `similarity` | Cambiar retorno a `0` siempre | TestSimilarity ("lm324n","lm324n" = 1.0) |
| `levenshtein` | Cambiar `cost` a siempre `0` | TestLevenshteinDistance ("kitten","sitting" = 3) |
| `formatSupplierLabel` | Quitar trim | TestFormatSupplierLabel ("  DGK  " → "DGK") |
| `generateInternalCode` | Cambiar formato | TestGenerateInternalCode ("CIR" → 3 chars) |
| `maxInt` | Intercambiar a y b | TestMaxInt (1,2 → 2) |
| `normalizeGrade` | Retornar siempre "A" | TestNormalizeGrade ("B" → "B") |
| `normalizeTitle` | Retornar siempre "Sra." | TestNormalizeTitle ("Sr." → "Sr.") |

### 4.2 Paquete `suppliers` — Funciones críticas

| Función | Mutante | Test que debe detectarlo |
|---------|---------|-------------------------|
| `normalizeGrade` | Aceptar "X" como válido | TestNormalizeGrade ("X" → "A") |
| `normalizeTitle` | No hacer trim | TestNormalizeTitle ("  Sra.  " → "Sra.") |

### 4.3 Lógica de negocio — Mutantes de integración

Estos requieren tests de integración con BD:

| Función | Mutante | Consecuencia |
|---------|---------|-------------|
| `CreateReference` | Quitar validación de duplicados | Se permiten duplicados |
| `RegisterStockEntry` | Cambiar `+=` por `-=` | Stock baja en vez de subir |
| `SubmitMovement` (salida) | Quitar validación de stock | Stock negativo |
| `ClosePurchaseLine` | Quitar entrada automática | Stock no se actualiza |
| `CreateReservation` | Quitar cálculo de expiresAt | Reservas sin vencimiento |
| `ReviewPurchaseRequest` (aprobar) | Quitar generación de línea | Solicitud aprobada sin línea |

### 4.4 Paquete `remissions` — Logística y despacho

Backend Go (`backend/internal/remissions/service.go`), verificación manual:
mutar → `go test ./internal/remissions/ -count=1` (o `backend/mutest-runner.sh`) → el mutante debe morir.

| Función | Mutante | Test que debe detectarlo |
|---------|---------|-------------------------|
| `Create` (totalValue) | Cambiar `+=` por `-=` | TestTotalValueCalculation/varios_con_decimales |
| `Create` (totalValue) | Quitar `* float64(item.Quantity)` | TestTotalValueCalculation/un item |
| `Create` | Quitar `DeliveryStatus: "pendiente"` | TestCreatePersistsNewEvidenceFields |
| `Create` | No copiar `DispatchPhotos`/`YoutubeLink` | TestCreatePersistsNewEvidenceFields |
| `generateConsecutive` | Cambiar `%04d` por `%d` | TestGenerateConsecutiveFormatAndSequence (regex) |
| `generateConsecutive` | Quitar `s.sequences[companyID]++` | TestGenerateConsecutiveFormatAndSequence (duplicados) |
| `UpdateDeliveryStatus` | Permitir `entregado → pendiente` | TestUpdateDeliveryStatusTransitions/revertir |
| `UpdateDeliveryStatus` | Aceptar cualquier string como status | TestUpdateDeliveryStatusInvalidStatus |
| `Get` | Quitar filtro por companyID | TestGetAndDeleteAreCompanyScoped |

Frontend lógica pura (`src/app/pages/app/remissions/remissions.logic.ts`, espejo en
`scripts/test-remission-features-logic.mjs`), verificación manual: mutar el `.mjs` espejo →
`node scripts/test-remission-features-logic.mjs` → el mutante debe morir.

| Función | Mutante | Caso que debe detectarlo |
|---------|---------|-------------------------|
| `groupDispatchReadyByClient` | Quitar `'garantia'`/`'no-reparable'` del filtro | grupos incluyen garantía y no reparables |
| `groupDispatchReadyByClient` | Quitar el filtro de estados | excluye estado `reparacion` |
| `groupDispatchReadyByClient` | Quitar orden alfabético | grupos ordenados por cliente |
| `computeRemissionTotal` | Cambiar `*` por `+` | total valorizada |
| `buildAnchoredAlert` | Retornar siempre `''` | alerta con prestados |
| `canTransitionDeliveryStatus` | Permitir `entregado → pendiente` | reversa debe ser false |
| `buildRemissionPrintModel` | Incluir precios aunque `valued` sea false | precios solo si valorizada |
| `dispatchTypeLabel` | Retornar el valor crudo | label legible "Servientrega" |

### 4.5 Fase Técnica — SLA, tiempos, repuestos, garantías, biblioteca

Backend Go, verificación: mutar → `go test ./internal/<paquete>/ -count=1` → el mutante debe morir.

| Función | Mutante | Test que debe detectarlo |
|---------|---------|-------------------------|
| `projects` sla-config Get | Retornar config vacía siempre | Sla config: GET default vs PUT+GET |
| `projects` sla-config Put | No validar días negativos | PUT con payload inválido |
| `inventory` normalizeToken | No quitar guiones | TestNormalizeToken / parts search |
| `inventory` detectRelevantChanges | Ignorar cambio de marca | cambio marca/referencia true, precio false |
| `inventory` PATCH purchase-line | Permitir editar línea cerrada | 400 en línea cerrada |

Frontend lógica pura (espejos `.mjs` en `scripts/`), verificación: mutar el espejo →
`node scripts/test-<nombre>.mjs` → el mutante debe morir.

| Función | Mutante | Caso que debe detectarlo |
|---------|---------|-------------------------|
| `applySlaConfigToColumns` | Aplicar config también a columnas sin trackAging | columnas sin trackAging intactas |
| `buildSlaSummary` | Contar tarjetas de todas las columnas juntas | conteo por columna |
| `accumulateQuarterHours` | `Math.ceil` → `Math.floor` | 16 min → 0.5 (no 0.25) |
| `calculateDailyBalance` | target 8 → 7 | balance con 7.5 horas |
| `calculateTimeKpi` | Invertir comparación rentable/deficitario | 10 est vs 12 reales |
| `summarizeByEntryType` | No agrupar "hora-extra" aparte | resumen por tipo |
| `requiresAccessoriesConfirmation` | Retornar siempre false | ítem con anchoredNote |
| `resolveWarrantyBoardStatus` | No exigir `hasPendingParts` | garantía sin pendientes → garantia |
| `warrantyMonthsRemaining` | `>` por `>=` en el límite | justo en el límite del mes |
| `normalizeSearchToken` | No quitar tildes | "Teléfono" ≡ "telefono" |
| `backupAvailableForModel` | Match exacto sin normalizar | case/espacios distintos |

---

## 5. Resultados esperados

### Score objetivo

| Paquete | Mutantes | Eliminados | Sobrevividos | Score |
|---------|----------|-----------|-------------|-------|
| inventory (helpers) | ~15 | ≥12 | ≤3 | ≥80% |
| suppliers (helpers) | ~5 | ≥4 | ≤1 | ≥80% |
| remissions (servicio Go) | ~9 | ≥8 | ≤1 | ≥80% |
| remissions (lógica FE .mjs) | ~8 | ≥7 | ≤1 | ≥80% |
| inventory (lógica BD) | ~20 | TBD | TBD | TBD |

### Interpretación

| Score | Evaluación |
|-------|-----------|
| ≥ 90% | Excelente — tests muy robustos |
| 70-89% | Bueno — algunos huecos menores |
| 50-69% | Aceptable — mejorar tests |
| < 50% | Deficiente — tests insuficientes |

---

## 6. Plan de acción para mejorar el score

1. **Agregar tests de integración con BD real** (o `sqlmock`) para las funciones de servicio que hacen queries SQL
2. **Cubrir los caminos de error** en cada función (no solo el camino feliz)
3. **Probar los límites**: cantidad 0, referencia vacía, stock negativo
4. **Verificar efectos secundarios**: ¿se registra el movimiento? ¿se actualiza el stock? ¿se crea la línea?

---

## 7. Comandos rápidos

```bash
# Coverage actual
cd /var/www/alfa.software.net.co/backend
go test ./internal/inventory/ -coverprofile=/tmp/inv.out
go tool cover -func=/tmp/inv.out

go test ./internal/suppliers/ -coverprofile=/tmp/sup.out
go tool cover -func=/tmp/sup.out

# Coverage total del backend
go test ./... -coverprofile=/tmp/all.out
go tool cover -func=/tmp/all.out | tail -1
```
