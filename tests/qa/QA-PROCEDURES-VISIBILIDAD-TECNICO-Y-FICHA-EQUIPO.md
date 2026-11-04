# QA Procedures — Visibilidad técnica y ficha de equipo

1. Seleccionar la vista **Técnico** en Proyectos: deben verse solo P0, P0.5, P1, P11, P13, P16 y P16.11.
2. Abrir un proyecto con equipo asociado y confirmar que el bloque inicial contiene código interno, servicio, falla, serie y recepción.
3. Confirmar que el QR no tiene textos laterales y está dentro de ese bloque.
4. Confirmar que no aparecen selector, búsqueda, escaneo ni botón para cambiar equipo.

| Métrica | Meta |
| --- | --- |
| Estados técnicos visibles | 7 |
| Controles redundantes de equipo | 0 |
| QR duplicados | 0 |

Mutación: incluir `recibido` en el set técnico o restaurar el selector de equipo debe fallar la revisión automatizada y la aceptación Gherkin.
