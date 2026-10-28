# Retiro del valor del prospecto

```gherkin
Feature: Prospectos sin valor comercial estimado
  Scenario: Crear un prospecto
    When abro el formulario de prospectos
    Then no aparece el campo Valor del prospecto
    And puedo guardar con los demás datos
  Scenario: Consultar un registro histórico
    Given un prospecto con valor almacenado
    When consulto su listado o perfil
    Then no aparece su valor estimado
    And editar otros datos conserva su valor histórico
```

QA: abrir listado, alta y perfil en Playwright visible; comprobar ausencia del
campo y errores de JavaScript. Interceptar el alta para verificar el contrato
sin crear registros de producción. No modificar importes de cotizaciones.

Métricas: cero controles `formValor`, cero valores estimados visibles y cero
modificaciones a datos históricos. Cobertura: formulario, borrador, listado,
perfil y contrato de creación. Mutación: reintroducir el control o la insignia
debe hacer fallar la comprobación de regresión.
