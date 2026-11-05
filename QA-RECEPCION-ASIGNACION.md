# QA: recepción y asignación técnica

## Escenarios Gherkin

```gherkin
Característica: Afectación técnica desde recepción
  Escenario: Al asignar un técnico un equipo recibido pasa a diagnóstico
    Dado un equipo recibido sin técnico
    Cuando el coordinador asigna un técnico activo
    Entonces el estado del equipo es Diagnóstico
    Y se conserva la información y fotos de su recepción

  Escenario: Consultar cola de afectación
    Dado un equipo pendiente de afectación
    Cuando el coordinador lo selecciona en Cola de afectación
    Entonces ve cliente, identificación, falla, accesorios, respuestas y fotos

  Escenario: Actualizar ubicación en cualquier estado
    Dado un equipo en cualquier estado operativo
    Cuando se actualiza su ubicación actual
    Entonces se conserva como texto libre y queda asociada al equipo
```

## Procedimiento manual

1. Abra Asignar técnico y compruebe las pestañas Pendientes, Histórico y Cola.
2. Seleccione un registro de Cola y confirme que las imágenes y datos de recepción son visibles.
3. Asigne un técnico y verifique Diagnóstico en el flujo, sin crear una segunda recepción.
4. En cada estado operativo, escriba una ubicación libre y guarde; recargue para confirmar persistencia.
5. Descargue el reporte de recepción y valide el logo Alfa a la izquierda.

## Métricas de calidad

- Cobertura: pruebas estáticas de controles y prueba Go de transición.
- Mutación objetivo: cambiar `diagnostico` por `recibido` debe hacer fallar la prueba Go.
- Criterio de aceptación: cero duplicados por guardar/asignar y 100% de pestañas solicitadas disponibles.
