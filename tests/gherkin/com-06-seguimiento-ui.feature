Feature: Seguimiento comercial visible

  Scenario: Registrar y conservar seguimiento de una cotización pendiente
    Given que el comercial inicia sesión desde la pantalla de acceso
    When crea un prospecto y registra una visita comercial futura
    Then el seguimiento se muestra en la ficha después de recargar la vista
