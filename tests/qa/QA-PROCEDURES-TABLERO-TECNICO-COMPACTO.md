# QA Procedures — Tablero técnico compacto

1. Abrir **Proyectos > Flujo técnico de reparación** con equipos en al menos dos estados.
2. Confirmar que cada cabecera presenta una sola insignia numérica y que coincide con las tarjetas de la columna.
3. Verificar que no quedan dos números iguales junto al nombre de la etapa.
4. Verificar en escritorio que las columnas ocupan 220 px y que las tarjetas, nombre y contador siguen siendo legibles.
5. Reducir la ventana a móvil y confirmar que el tablero conserva desplazamiento horizontal y no corta controles.

Automatización: `npm run test:kanban-compact-columns` y `npx tsc --noEmit -p tsconfig.app.json`.

| Métrica | Meta |
| --- | --- |
| Contadores por cabecera | 1 |
| Ancho de columna | 220 px |
| Errores de tipado | 0 |

Mutación: restaurar el segundo `columnProjects.length` o aumentar el ancho a 320 px debe fallar el test de contrato. La cobertura incluye plantilla, estilo y aceptación Gherkin.
