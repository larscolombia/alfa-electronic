# QA: rendimiento del tablero de proyectos

## Caso PERF-PROJ-01: tarjeta aislada

1. Abrir `/app/work-projects` con al menos 50 tarjetas.
2. Abrir Performance en DevTools y grabar diez cambios de modo compacto y diez
   movimientos de cursor sobre el tablero.
3. Confirmar que no se registra una ráfaga sostenida de tareas largas (>50 ms).
4. Mover un proyecto y confirmar que su SLA, prioridad, horas y reparabilidad se
   actualizan sin recargar el tablero.

## Criterio de aceptación

- No hay errores Angular ni tarjetas visualmente desactualizadas.
- La interacción p75 es menor de 200 ms con el conjunto de prueba.
