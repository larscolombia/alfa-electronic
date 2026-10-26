Feature: Envío de línea de compra

  Scenario: Enviar una línea pendiente al proveedor
    Given que compras inicia sesión y ve una línea pendiente
    When presiona Enviar en la línea
    Then la interfaz muestra el estado enviada
