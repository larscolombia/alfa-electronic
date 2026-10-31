# Quality Metrics — CRM: Empleado responsable autocompletado en nuevo prospecto

> Métricas de calidad del fix de autocompletado de "Empleado responsable"
> (`#prospect-owner`) en las tres puertas de entrada al formulario.
> Fecha: 2026-10-31

---

## 1. Métricas de código

| Métrica | Valor | Objetivo | Método |
|---------|-------|----------|--------|
| Archivos TS modificados | 1 (`crm-prospects.component.ts`) + 1 script E2E | ≤ 2 | `git diff --stat` |
| Líneas agregadas al componente | ~14 (guard en constructor + guard y refresh de opciones en toggle) | mínimo viable | `git diff` |
| Archivos TS nuevos | 0 | 0 | `ls` |
| Errores de compilación TS | 0 | 0 | rebuild `ng serve` limpio / `tsc --noEmit` |
| Docs de testing nuevos | 3 (gherkin + QA procedures + quality metrics) | ≥ 1 por cambio | AGENTS.md |

## 2. Métricas de testing

| Capa | Tests | Resultado | Comando |
|------|-------|-----------|---------|
| E2E Playwright local (A: botón) | 1 escenario / 2 asserts | PASS | `npm run check:crm-prospect-owner-default` |
| E2E Playwright local (B: borrador viejo) | 1 escenario / 2 asserts | PASS | idem |
| E2E Playwright local (C: toggle nativo del summary) | 1 escenario / 2 asserts | PASS | idem |
| E2E Playwright prod (post-deploy) | 3 escenarios | ver §4 | `PW_BASE_URL=https://alfa.software.net.co ...` |

## 3. Cobertura de edge cases

| Caso | Cubierto por |
|------|--------------|
| Carga fresca + botón "Agregar Prospecto" | Escenario A (resetProspectForm ya traía el default) |
| Borrador guardado con `formEmpleado:""` | Escenario B (guard del constructor, antes de mezclar opciones) |
| Clic nativo en `<summary>` sin pasar por `openProspectForm()` | Escenario C (guard de `onProspectFormToggle` + refresh de opciones) |
| Valor ya escrito no se pisa al reabrir | Guard condicional (`if (!formEmpleado.trim())`) en constructor y toggle |
| Borrador con nombre antiguo/inactivo visible en el select | `loadEmployeeOptions()` en el toggle (optionsFor mezcla `current`) |
| name vacío → fallback a email de la sesión | `currentLoggedInEmployee()` (lógica existente, reutilizada) |

## 4. Resultado final

- Local: `OK: Empleado responsable autocompletado en los tres escenarios.`
  (A/B/C verdes; value `"Administrador PIKA"`, options `["--","Administrador PIKA"]`).
- Prod: pendiente de registro post-deploy (ver QA procedures §2.3).
