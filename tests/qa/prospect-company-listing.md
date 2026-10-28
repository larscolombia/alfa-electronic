# Empresa como identidad principal del listado

```gherkin
Feature: Listado comercial de prospectos
  Scenario: Prospecto con empresa
    Given un prospecto cuyo contacto es "Maribel Márquez Solano"
    And cuya empresa es "ALFA Electronic"
    When abro la cartera de prospectos
    Then la primera columna muestra "ALFA Electronic"
    And el nombre del contacto queda como dato secundario
  Scenario: Prospecto sin empresa
    Then la primera columna conserva el nombre del contacto como respaldo
```

QA: comprobar encabezado, ordenamiento y exportación alineados a empresa.
Mutación: volver a enlazar la primera columna directamente a `row.nombre` debe
hacer fallar la comprobación.
