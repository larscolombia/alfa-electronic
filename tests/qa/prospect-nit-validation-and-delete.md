# NIT y eliminación de prospectos

```gherkin
Feature: NIT obligatorio con formato y eliminación explícita
  Scenario: NIT incompleto mientras se escribe
    When escribo "9001234567" en NIT
    Then el campo se muestra inválido en rojo
    And no puedo guardar
  Scenario: Eliminar desde Acciones
    When confirmo eliminar un prospecto
    Then se envía DELETE para su UUID
```

QA: Playwright visible intercepta las operaciones para no crear ni eliminar
datos reales. La mutación que retire la clase inválida, el bloqueo o DELETE
debe fallar la prueba.
