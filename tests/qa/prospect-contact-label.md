# Etiqueta del contacto y posición de empresa

```gherkin
Feature: Datos comerciales sin intercambio de valores
  Scenario: Nuevo prospecto
    When abro Nuevo prospecto en /app/crm-prospectos
    Then Empresa ocupa la posición anterior de Nombre del prospecto
    And Nombre del contacto ocupa la posición anterior de Empresa
    And Empresa sigue enlazada a formCompania
    And Nombre del contacto sigue enlazado a formNombre
  Scenario: Ficha y exportación
    Then la ficha y los seguimientos usan Nombre del contacto
    And Empresa aparece antes del contacto en la ficha y el CSV
```

QA: prueba visible del formulario sin guardar datos; verificar orden DOM y
etiquetas accesibles en producción. Ejecutar test-prospect-contact-label.mjs.
Cobertura: alta, ficha, seguimiento, validaciones, CSV y bindings originales.
Métricas: cero cambios de esquema/datos; cero etiquetas antiguas en esas vistas;
cero errores JS. Intercambiar los bindings debe hacer fallar la prueba.
