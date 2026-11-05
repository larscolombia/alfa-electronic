Feature: Ficha técnica del equipo
  Scenario: Registrar evidencia adicional y enlace de video
    Given un equipo abierto en el flujo técnico
    When el usuario adjunta un archivo o registra un enlace de YouTube
    Then la evidencia queda asociada al caso junto con la recepción original

  Scenario: Registrar diagnóstico y cotización compactos
    Given un caso técnico abierto
    When el técnico escribe ambos memos y completa repuestos, horas y reparabilidad
    Then la información queda disponible para guardar en una sola vista

  Scenario: Reportar intervención
    Given un técnico que inspeccionó un equipo
    When marca ubicación, causa y pruebas realizadas
    Then el reporte conserva los checks seleccionados

  Scenario: Reordenar estados del proyecto
    Given dos estados configurados consecutivamente
    When el administrador sube el segundo estado
    Then el orden actualizado se persiste y se refleja en el tablero
