Feature: Cierre de recepción sin autorización de jefe

  Scenario: Equipo no industrial con costo menor o igual a 2 millones
    Given un equipo con costo menor o igual a 2 millones
    And el equipo no es industrial
    When la persona guarda la recepción en Cierre sin autorización de jefe
    Then la recepción se guarda sin bloquear el flujo
