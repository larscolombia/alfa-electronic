# Trazabilidad de prospectos

```gherkin
Feature: Timeline comercial mínima y persistente
  Scenario: Prospecto sin seguimientos
    Given un prospecto cargado desde el backend
    When abro la pestaña Trazabilidad
    Then veo el evento de creación del prospecto
  Scenario: Error cargando seguimientos
    When falla el endpoint de seguimientos
    Then el evento de creación permanece visible
```

QA: Playwright visible intercepta el endpoint de seguimientos vacío y fallido.
Cobertura: línea base y error. Mutación: borrar el evento de creación o limpiar
la línea de tiempo al fallar debe hacer fallar la comprobación.
