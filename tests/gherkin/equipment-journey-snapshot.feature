Feature: Snapshot acumulativo del equipo
  Scenario: Un equipo industrial pasa entre modulos sin redigitacion
    Given que recepción registra dueño, contacto, equipo, accesorios y técnico
    When se crea el caso técnico desde la recepción
    Then el caso conserva los IDs y datos visibles del dueño, equipo y técnico
    When comercial registra cotización y orden de compra
    Then el snapshot técnico conserva la OC y el código de cotización
    When logística abre una remisión desde el caso listo para entrega
    Then cliente, NIT, equipo, serie, accesorios y OC vienen precargados
