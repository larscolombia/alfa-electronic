# CRM: entidad comercial única

## Criterios ejecutables

```gherkin
Feature: Promoción sin copia de datos
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
```

## Procedimiento QA

1. Crear un prospecto con todos los campos, dos contactos, una sede y un seguimiento.
2. Anotar el ID y crear una cotización y una recepción de equipo.
3. Convertirlo a cliente y verificar que URL/ID no cambian.
4. Verificar cada relación desde la ficha y desde cotizaciones/equipos.
5. Confirmar que NIT repetido no permite crear otra cuenta activa.

## Métricas de calidad

- Pérdida de relaciones tras conversión: 0.
- Cambio de ID en conversión: 0.
- Duplicados activos por `company_id + NIT`: 0 para datos nuevos.
- Suite de promoción: 100% verde antes de liberar.
