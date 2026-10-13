# QA Procedures — Flujo técnico: transiciones automáticas de estado

> Procedimientos de aseguramiento de calidad para las transiciones automáticas
> del tablero "Flujo técnico de reparación" (/app/work-projects):
> (1) solicitud de repuestos avanza diagnóstico/por-cotizar → reparación;
> (2) botón "Finalizar pruebas y marcar listo" (pruebas → listo-entrega).
> Fecha: 2026-08-14

---

## 1. Alcance

- `src/app/pages/app/projects/project-auto-transitions.logic.ts` (nuevo, lógica pura):
  `resolveStatusAfterPartsRequest` y `validateReadyForDelivery`.
- `src/app/pages/app/projects/kanban-view.component.ts`:
  - `autoAdvanceAfterPartsRequest()` llamado tras crear con éxito: reserva de
    material (`createMaterialReservation`), línea de compra
    (`confirmCreatePurchaseLine` / `createManualPurchaseLine`) y solicitud de
    compra (`submitPurchaseRequest`).
  - `finishTestsAndMarkReady()` + botón en el footer del detalle, visible solo
    cuando `status === 'pruebas'`.
- No se toca drag & drop, chips de estado ni `openTransitionPrompt`.

## 2. Procedimientos de ejecución

### 2.1 Unit Tests — Lógica frontend

```bash
cd /var/www/alfa.software.net.co
node scripts/test-auto-transitions-logic.mjs
```

Importa el archivo real `project-auto-transitions.logic.ts` (Node ≥ 22.6 con
type stripping). **Criterio de aceptación:** `30 passed, 0 failed`.

### 2.2 Verificación de compilación

```bash
npx tsc --noEmit -p tsconfig.app.json
```

**Criterio de aceptación:** 0 errores.

### 2.3 E2E — Playwright

```bash
cd /var/www/alfa.software.net.co
node scripts/check-auto-transitions-playwright.mjs
```

Flujo: login API (admin@alfa.com), siembra 3 proyectos en
`lars.projects.items.v3` vía `addInitScript` (pruebas con prueba real, pruebas
"sin pruebas", diagnóstico), abre `/app/work-projects`, ejecuta el caso
positivo (tarjeta llega a `listo-entrega` + toast) y el negativo (bloqueo con
mensaje claro, tarjeta no se mueve), y limpia los proyectos sembrados.

**Criterio de aceptación:** exit code 0 y los 9 checks en `true`.

**Nota de despliegue:** el script apunta a https://alfa.software.net.co; si el
build desplegado es anterior a este cambio, los checks del botón fallan con la
observación "re-ejecutar tras el build/deploy final".

**Limitación conocida:** el auto-avance por solicitud de repuestos no se
ejercita E2E (la reserva requiere referencias de inventario reales del
entorno). Cobertura: unit tests de `resolveStatusAfterPartsRequest` +
revisión de la integración en el componente.

### 2.4 Verificación manual (checklist)

- [ ] Proyecto en diagnóstico → crear reserva de material → la tarjeta pasa a
      Reparación y aparece el toast "avanzó automáticamente".
- [ ] Proyecto en por-cotizar → crear línea de compra → la tarjeta pasa a
      Reparación.
- [ ] Proyecto ya en reparación (o más adelante) → solicitar repuestos → la
      tarjeta NO se mueve.
- [ ] Reserva rechazada por inventario → la tarjeta NO se mueve.
- [ ] Proyecto en pruebas con "Prueba de cierre" = "Banco de pruebas" → botón
      "Finalizar pruebas y marcar listo" → pasa a Listo para entrega.
- [ ] Proyecto en pruebas con "Sin pruebas" y sin checklist → botón muestra
      error claro y la tarjeta no se mueve.
- [ ] El botón no aparece en estados distintos de pruebas.
- [ ] Drag & drop y chips de estado siguen abriendo el modal de checklist de
      transición cuando aplica.

## 3. Datos de prueba

| Dato | Valor |
|------|-------|
| Empresa | `demo-company` |
| Usuario E2E | `admin@alfa.com` |
| Key localStorage tablero | `lars.projects.items.v3` |
| Ids sembrados E2E | `qa-auto-pruebas-ok-<ts>`, `qa-auto-pruebas-sin-<ts>`, `qa-auto-diagnostico-<ts>` |
| Gherkin | `tests/gherkin/flujo-estados-automaticos.feature` |
