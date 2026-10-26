Feature: Recepción parcial de proveedor

  Scenario: Registrar una sola unidad de una línea de dos
    Given que compras ve una línea con dos unidades pendientes
    When registra una unidad recibida desde la pantalla de compras
    Then la línea muestra 1/2 y conserva el faltante de una unidad
