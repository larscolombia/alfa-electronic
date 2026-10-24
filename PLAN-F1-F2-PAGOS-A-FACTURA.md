# PLAN F1+F2: pagos fluyen a la factura + bloqueo de sobre-pago

**Objetivo:** cerrar los dos hallazgos del test `npm run check:cotizacion-a-pago`:

- **F2 (rojo en el test, check 7):** al crear/editar/eliminar un pago que referencia una
  factura real, la tabla `finance_invoices` queda ciega: `paid_amount=0`, `balance_amount`
  sin tocar y `status='Borrador'`. Todo lo que derive del estado de la factura
  (doble validación de remisión por "pago confirmado", listas de cartera) está roto.
- **F1 (hallazgo amarillo):** el backend acepta un pago de 2× el total sin validar contra
  el saldo. Falta el guardrail `amount <= balance`.

**Al terminar:** el check 7 del test debe pasar, el sobre-pago debe responder HTTP 400 con
mensaje accionable (con el saldo restante), y los tests de BD nuevos deben pasar.

---

## 1. Contexto que DEBES entender antes de tocar código

### 1.1 Cómo se enlaza un pago con una factura HOY

- `finance_payments.invoice_number` es **texto libre** (p. ej. `"FAC-2026-031"`).
- La factura real vive en `finance_invoices` y su código se arma como:
  `series_prefix || lpad(sequence_number, 3, '0')` → ver
  [backend/internal/finance/service.go:232](backend/internal/finance/service.go#L232).
- **No hay FK entre las dos tablas.** El frontend de /finance-pagos arma la lista con
  `FinanceBillingStore.buildInvoiceCode(seriesPrefix, sequenceNumber)` y guarda ese texto en
  el pago. Punto.

### 1.2 TRAMPA #1 — padding inconsistente (el error que más va a costar)

El frontend padea a **3** dígitos (`padStart(3,'0')`), pero el test Playwright padea a **6**.
Ambas formas aparecen en la BD: `"FAC-2026-031"` y `"FAC-2026-000031"` son LA MISMA factura.

> 🚫 **PROHIBIDO** comparar `invoice_number = series_prefix || seq` como cadena exacta.
> ✅ Comparar **numéricamente**: extraer el prefijo (todo hasta la última corrida de dígitos)
> y el número secuencial, y emparejar por `(upper(prefijo), sequence_number::bigint)`.

La expresión SQL canónica para normalizar ambos lados:

```sql
-- Lado factura (shape conocido):
upper(trim(series_prefix)) || '|' || sequence_number::text

-- Lado pago (cualquier padding / basura tolerable):
with m AS (SELECT regexp_match(upper(trim(invoice_number)), '^([^0-9]*)([0-9]+)$') AS parts)
SELECT m.parts[1] || '|' || (m.parts[2]::bigint)::text FROM m   -- NULL si no parsea → no cuenta
```

Verificar con 4 casos antes de continuar: `FAC-2026-31`, `FAC-2026-031`, `FAC-2026-000031`
y `FAC-2026-` (sin número → no debe emparejar con nada).

### 1.3 Semántica de estados que NO se inventa

| Tabla | Estados válidos | Fuente |
|---|---|---|
| `finance_payments.status` | `Completado`, `Parcial`, `Pendiente` | [types.go:60-65](backend/internal/finance/types.go#L60) |
| `finance_invoices.status` | `Borrador`, `Pendiente`, `Pago parcial`, `Pagado`, `Cancelado`, `Enviado` | [types.go:130-140](backend/internal/finance/types.go#L130) |

Reglas de negocio (discutidas, no negociables):

1. **Solo cuentan los pagos realizados:** `status IN ('Completado','Parcial')`.
   Un pago `Pendiente` es una intención: NO suma a `paid_amount`.
2. **Soft-delete revierte:** al borrar un pago (`soft_delete=true`) la factura debe
   recalcularse SIN ese pago (si no quedan pagos, baja de estado según §1.4).
3. **Matriz de estatus** (función pura, se prueba sin BD):

| Estado actual | Pagos contados | Resultado |
|---|---|---|
| `Cancelado` | cualquiera | **NO TOCAR NADA** (skip total) |
| `Borrador` / `Pendiente` / `Enviado` | ninguno (>0? no: 0) | se mantiene como está |
| `Borrador` / `Pendiente` / `Enviado` | parcial (`0 < pagado < total`) | → `Pago parcial` |
| cualquiera (no Cancelado) | total (`pagado >= total - ε`) | → `Pagado` |
| `Pagado` / `Pago parcial` | 0 tras borrar pagos | → `Pendiente` (nunca se queda "Pagado" sin pago) |

4. **Retenciones no restan del pagado:** el cliente retiene ReteFuente/ReteIVA/ReteICA por
   ley; la empresa los cobra después vía declaración. El monto bruto del pago (`amount`) es lo
   que suma a `paid_amount`. (Flujo operativo real, paso 9.)
5. **El guardrail de sobre-pago compara brutos:** `amount <= saldo restante` con ε=0.01
   para flotantes. Si la factura NO existe en `finance_invoices` (número libre legado), el pago
   se acepta y no se sincroniza nada — compatibilidad hacia atrás obligatoria.

### 1.4 Dónde vive cada cosa (mapa de archivos)

| Archivo | Rol | Se toca? |
|---|---|---|
| [service_payments.go](backend/internal/finance/service_payments.go) | CRUD de pagos (`CreatePayment` :98, `UpdatePayment` :170, `DeletePayment` :265) | SÍ — envolver en tx + llamar al sync + guardrail F1 |
| **`service_payment_sync.go` (NUEVO)** | resolución por código, recálculo, matriz de estados | SÍ — es el corazón del fix |
| [service.go:30-45](backend/internal/finance/service.go#L30) | errores canónicos (`errPayment*`) | SÍ — 1 error nuevo `errPaymentExceedsBalance` |
| [handler_validation.go:5](backend/internal/finance/handler_validation.go#L5) | mapa error→HTTP (400 si está en la lista) | SÍ — registrar el error nuevo en `isPaymentValidationError` |
| [service_gaps_db_test.go](backend/internal/finance/service_gaps_db_test.go) | infra de tests BD (`openTestDB`, `testCompany`) + limpieza por company | SÓLO REUSAR (no modificar) |
| **`service_payment_sync_db_test.go` (NUEVO)** | tests F1/F2 contra Postgres local | SÍ — el entregable de prueba |
| [check-cotizacion-a-pago...mjs](scripts/check-cotizacion-a-pago-integridad-playwright.mjs) | test E2E que debe quedar 26/26 verde | NO (es el contrato; si hay que cambiarlo, se detalla por qué) |

### 1.5 Qué NO toca este cambio (para no romper cosas ajenas)

- La columna `finance_invoices.locked` (la gestiona el módulo de facturación al emitir).
- `properties.paymentStatus` / `paymentVerification` del proyecto (kanban → remisión): es un
  mecanismo distinto y ya funciona; F2 solo le da la base de datos correcta.
- El flujo de notas crédito, recurrentes, Oasis export, consecutivos.
- El frontend: con el backend correcto, los selectores de /finance-pagos ya funcionan
  (leían `balanceAmount` que ahora sí se llena).

---

## 2. Pasos de ejecución (orden exacto)

### Paso 0 — Punto de partida limpio (GATE G0)

```bash
cd repo && git status --short   # debe mostrar solo cambios conocidos; si hay suciedad, reportar ANTES de tocar nada
go build ./...                  # en backend/ → 0 errores
```

> 🚫 No hacer `git reset --hard`, no revertir cambios ajenos. Si el trabajo sucio choca con
> este plan, se reporta y NO se "arregla" solo.

### Paso 1 — Función pura de matriz de estados (sin BD)

En `service_payment_sync.go` nuevo:

```go
// deriveInvoicePaymentStatus aplica la matriz §1.3 sobre el estado resultante
// de acumular pagos contados contra el total de la factura.
func deriveInvoicePaymentStatus(current InvoiceStatus, paid, total float64) InvoiceStatus { ... }

// parseInvoiceCode extrae (prefijo, secuencia) del código "FAC-2026-031".
// ok=false si no termina en una corrida de dígitos.
func parseInvoiceCode(code string) (prefix string, seq int64, ok bool) { ... }
```

Unit test sin BD (`service_payment_sync_test.go`): matriz completa §1.3 + los 4 casos de
padding de la Trampa #1. **GATE G1:** `go test ./internal/finance -run 'TestDerive|TestParse' -v`.

### Paso 2 — Resolución y recálculo (con BD, en transacción)

Mismos archivo nuevo:

```go
type queryExecutor interface {   // *sql.DB y *sql.Tx satisfacen esto
    ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
    QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

// syncInvoicesFromPayments recalcula paid/balance/status de cada factura referenciada.
// Códigos que no resuelven a una factura real se ignoran (números libres).
func (s *Service) syncInvoicesFromPayments(ctx context.Context, qe queryExecutor, companyID string, codes ...string) error { ... }

// resolveInvoiceForCode → nil si la factura no existe.
func (s *Service) resolveInvoiceForCode(ctx context.Context, companyID, code string) (*invoiceSnapshot, error) { ... }
```

Reglas internas: dedupe de códigos; skip `Cancelado`; ε=0.01 en comparaciones de dinero;
nunca tocar `locked`. **GATE G2:** compila + los tests unitarios siguen pasando.

### Paso 3 — F2: envolver el CRUD de pagos en transacción y sync

En `service_payments.go`:

1. `CreatePayment`: `BEGIN → INSERT (igual) → syncInvoicesFromPayments(tx, …, payload.InvoiceNumber) → COMMIT`. Rollback total si algo falla.
2. `UpdatePayment`: resolver ANTES del UPDATE el código anterior (`current.InvoiceNumber`) y el nuevo; `BEGIN → UPDATE → sync(código anterior + código nuevo)` (el antiguo puede necesitar recálculo si perdió el pago) `→ COMMIT`.
3. `DeletePayment`: leer primero el `invoice_number` de la fila, hacer soft-delete en tx y sync ese código.

> 🚫 No mover validaciones fuera del flujo actual; no cambiar firmas públicas de
> `Create/Update/DeletePayment`; el handler no debe notarse nada.

**GATE G3:** `go vet ./... && go build ./...` → 0 errores.

### Paso 4 — F1: guardrail de sobre-pago

En `service.go`: nuevo error canónico (mensaje accionable, en español, con el saldo restante
lo pone quien lo devuelve):

```go
errPaymentExceedsBalance = errors.New("el monto del pago supera el saldo pendiente de la factura")
```

- `CreatePayment` (tras normalizar, antes del INSERT): si resuelve a una factura real no
  cancelada → exigir `amount <= balance + 0.01`. Error con detalle:
  `"El monto X supera el saldo pendiente Y de la factura FAC-2026-NNN"`.
- `UpdatePayment`: máximo permitido = `balance + amount_actual_del_pago` (si ese pago ya
  contaba) — se puede subir un pago existente hasta agotar, no más.
- Factura inexistente → sin guardrail (compatibilidad).
- Registrar en [handler_validation.go](backend/internal/finance/handler_validation.go) dentro de `isPaymentValidationError` → HTTP **400** con el mensaje (no 500).

**GATE G4:** unit test del cálculo de máximo permitido (función pura pequeña:
`maxAllowedPaymentAmount(balance, currentCounted bool, currentAmount)`).

### Paso 5 — Tests BD (el entregable que lo comprueba todo)

Nuevo `service_payment_sync_db_test.go`, usando `openTestDB`/`testCompany` existentes
(requieren `RUN_DB_TESTS=1`; si no hay Postgres local en el entorno, se levanta uno
efímero o se usa el DSN de la máquina — ver §4):

1. **F2-create:** factura (total T) → pago parcial 50% (`Parcial`) → GET factura:
   `paidAmount=0.5T`, `balance=0.5T`, `status='Pago parcial'`.
2. **F2-complete:** segundo pago del resto (`Completado`) → `paid=T`, `balance=0`, `status='Pagado'`.
3. **F2-delete-reverts:** borrar ambos pagos (soft) → vuelve a `Pendiente`/`Borrador` según origen, `paid=0`.
4. **F1-overpay-create:** pago de 2×T → HTTP-level error en servicio: `errPaymentExceedsBalance`, factura intacta (`paid` sin cambiar).
5. **F1-overpay-update:** subir un pago existente por encima del tope → mismo error; dentro del tope (agotando el saldo) → OK.
6. **Trampa padding:** pago con `"FAC-...-000031"` (6 dígitos) y otro con 3 → ambos suman a la misma factura exactamente una vez cada uno.
7. **Pendiente no cuenta:** pago `Pendiente` no suma a `paidAmount`.
8. **Factura cancelada:** pagos contra ella NO cambian su estado.

**GATE G5 (el que manda):** `RUN_DB_TESTS=1 go test ./internal/finance -count=1 -v` → todo verde.

### Paso 6 — Verificación E2E en prod-equivalente y despliegue

```bash
cd repo && npm run check:cotizacion-a-pago   # contra https://alfa.software.net.co DESPUÉS de desplegar
# esperado: 26/26 verde (el F1 deja de ser hallazgo; el check 7 pasa)
```

Despliegue backend (solo si los GATES pasaron):

```bash
ssh root@157.173.195.42   # pw en /Users/ludwig/.lmstudio/scratchpads/em/.sshpw
cd /var/www/<repo> && git pull origin cambios-Anderson   # el repo en server vive en esa rama
go build -o alfa-backend ./cmd/server (o el target que use el servicio; verificar con `systemctl cat alfa-backend`)
sudo systemctl restart alfa-backend && curl -fsS localhost:8091/health | head  # o el puerto real del service
```

> 🚫 El frontend NO cambia en este fix → no recompilar Angular, no tocar nginx.

### Paso 7 — Cierre y commit

- `git status` limpio de artefactos temporales (nada de `.tmp`, probes, etc.).
- Commit descriptivo citando F1/F2 + gates pasados; push a `cambios-Anderson`.
- Re-ejecutar el test Playwright **contra prod** y pegar la salida final en el resumen.

---

## 3. Errores típicos de un Junior en ESTE cambio (checklist anti-fiasco)

1. ✅/❌ Comparar códigos de factura como texto exacto → rompe con padding distinto (§1.2).
2. Sumar pagos `Pendiente` al saldo pagado → infla carteras (§1.3-1).
3. Borrar el guardrail F1 "para que no estorbe" en los tests → es parte del entregable.
4. Hacer el sync SIN transacción → si el UPDATE de factura falla, queda pago escrito y
   factura ciega (el bug original con otro nombre).
5. En `UpdatePayment`, olvidar recalcular la factura del código ANTERIOR al cambio.
6. Cambiar `locked` o borrar filas en cascada → fuera de alcance, rompe emisión/Oasis.
7. Pasar por alto que `testCompany()` ya limpia `finance_payments` y `finance_invoices`
   → no inventar limpieza propia (duplica y puede pisar).
8. Confundir el gate de remisión (`properties.paymentVerification`) con F2: son capas
   distintas; este fix no modifica la lógica de /remissions ni del kanban.
9. Creer que "go test" en caché es prueba: usar `-count=1` siempre (le pasó al anterior).
10. Desplegar sin el GATE G5 verde → nunca.

## 4. Entorno de pruebas BD local

- Si `psql -h 127.0.0.1 -U postgres -d alfa` responde con pw `postgres`, usarlo directo.
- Si no: levantar uno efímero (`docker run --rm -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16`)
  y `createdb alfa`. La migración la aplica el propio test vía `database.Migrate(db)`.
- DSN por defecto del harness: `postgres://postgres:postgres@127.0.0.1:5432/alfa?sslmode=disable`
  ([service_gaps_db_test.go](backend/internal/finance/service_gaps_db_test.go)).

## 5. Criterio de terminación (determinista, sin "creo que sí")

- [ ] `go vet ./...` → 0 errores en `backend/`.
- [ ] `RUN_DB_TESTS=1 go test ./internal/finance -count=1` → todo verde, incluidos los 8 tests nuevos.
- [ ] `npm run check:cotizacion-a-pago` contra **prod** tras desplegar → **26/26 checks verdes**, 0 hallazgos F1/F2.
- [ ] Commit + push a `cambios-Anderson`; server con el binario nuevo activo y `/health` OK.
