# Quality Metrics — Flujo técnico: transiciones automáticas de estado

> Métricas de calidad del cambio de transiciones automáticas del tablero
> "Flujo técnico de reparación".
> Fecha: 2026-08-14

---

## 1. Métricas de código

| Métrica | Valor | Objetivo | Método |
|---------|-------|----------|--------|
| Archivos TS nuevos | 1 (project-auto-transitions.logic.ts, ~75 líneas) | ≤ 250 líneas | `wc -l` |
| Archivos TS modificados | 1 (kanban-view.component.ts, +~60 líneas) | Mínimo indispensable | git diff |
| Errores de compilación TS | 0 | 0 | `npx tsc --noEmit -p tsconfig.app.json` |
| Lógica pura extraída del componente | 2 funciones (resolveStatusAfterPartsRequest, validateReadyForDelivery) | — | code review |
| Dependencias nuevas | 0 | 0 | package.json intacto |

## 2. Métricas de testing

| Capa | Tests | Resultado | Comando |
|------|-------|-----------|---------|
| Unit lógica frontend | 34 asserts | PASS (34/0) | `node scripts/test-auto-transitions-logic.mjs` |
| Compilación TS | — | PASS | `npx tsc --noEmit -p tsconfig.app.json` |
| E2E Playwright | 9 checks | Harness OK; checks del botón pendientes de despliegue | `node scripts/check-auto-transitions-playwright.mjs` |
| Gherkin | 12 escenarios | Documentado | `tests/gherkin/flujo-estados-automaticos.feature` |
| Mutation testing (manual) | 4 mutantes de disponibilidad de repuestos | 4/4 definidos para detección | `tests/mutation/MUTATION-TESTING-COMPRAS-TRANSICION-REPUESTOS.md` |

## 3. Cobertura de las reglas de negocio

| Regla | Cubierto por |
|-------|--------------|
| Compra externa con OC → esperando-proveedor | Unit (1 caso) + integración componente |
| Reserva de stock con OC → reparación | Unit (1 caso) + integración componente |
| Compra externa sin OC (diagnóstico/por cotizar) no libera reparación | Unit (2 casos) |
| Estados recibido/reparacion/pruebas/listo-entrega/garantia-espera-repuestos/entregado no se mueven | Unit (6 casos) |
| Estados vacío/nulo/desconocido → sin movimiento | Unit (4 casos) |
| testType real (banco-pruebas, laboratorio) aprueba cierre de pruebas | Unit (2 casos) + E2E positivo |
| testType "sin-pruebas"/vacío/ausente bloquea con mensaje | Unit (4 casos) + E2E negativo |
| Checklist con respuesta real (id o label del modal) aprueba | Unit (2 casos) |
| Checklist "Sin pruebas funcionales"/blanco/otra pregunta/no-array bloquea | Unit (5 casos) |
| Mensaje de error accionable (menciona "Prueba de cierre" y checklist) | Unit (2 casos) |
| Render del board con proyectos sembrados y cleanup | E2E |
