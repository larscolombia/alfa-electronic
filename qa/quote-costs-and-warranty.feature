Feature: Costos, margen y garantía de una cotización
  Scenario: Calcular costo de mano de obra y margen
    Given una hora-hombre configurada en 50000 COP
    And un técnico estima 2 horas y repuestos por 30000 COP
    When la asesora indica que cobrará 200000 COP
    Then el costo asociado es 130000 COP
    And la utilidad es 70000 COP
    And el margen de ganancia es 35 por ciento

  Scenario: Cotizar varios equipos y abrir su historial
    Given una empresa con dos equipos seleccionados
    When se agregan sus comentarios, costos y precios
    Then la cotización conserva ambos equipos y su total
    And el botón Historial técnico completo abre el historial del equipo seleccionado con sus fotos
