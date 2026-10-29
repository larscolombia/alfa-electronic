Feature: Promoción sin copia de datos
  # CRM: entidad comercial única (crm_accounts). Un prospecto y un cliente son
  # el mismo registro en estados distintos; convertir no copia ni duplica.

  Scenario: Un prospecto se vuelve cliente
    Given una cuenta comercial en estado "prospecto" con contactos, sede y seguimiento
    When un usuario la convierte a "cliente"
    Then conserva el mismo id
    And todos sus contactos, sedes, adjuntos, equipos y cotizaciones siguen asociados
    And la ficha muestra la insignia "Cliente"

  Scenario: La ficha reutiliza todos los campos
    Given una cuenta en estado "cliente"
    When se abre su ficha comercial
    Then se muestran los datos de oportunidad como historial
    And se habilitan crédito, fiscal y facturación
