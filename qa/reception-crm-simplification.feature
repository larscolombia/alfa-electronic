Feature: Simplificación de CRM y recepción

  Scenario: Registrar una empresa sin sucursales
    Given que una persona crea o consulta un prospecto o cliente
    Then no ve controles ni pestañas para gestionar sucursales

  Scenario: Crear remitente de un cliente desde recepción
    Given que la empresa seleccionada ya es cliente
    When crea un nuevo contacto remitente desde la recepción
    Then el contacto se guarda para ese cliente y queda seleccionado

  Scenario: Cerrar una recepción simplificada
    Given que hay un equipo listo para guardar
    Then puede definir su prioridad
    And no ve autorización industrial ni generación de proyectos
