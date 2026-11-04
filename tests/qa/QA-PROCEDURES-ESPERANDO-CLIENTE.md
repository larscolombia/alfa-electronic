# QA Procedures — Estado Esperando Cliente

## Alcance

Estado técnico intermedio entre **Por cotizar** y la continuación operativa tras la respuesta del cliente.

## Procedimiento manual

1. Abrir **Configuración > Configuración de proyectos** y pulsar **Nueva columna**.
2. Escribir `Esperando Cliente` como nombre y seleccionar el mismo valor en **Estado técnico asociado**.
3. Guardar y ubicar la columna inmediatamente después de **Por cotizar**.
4. En el tablero, mover un equipo de **Por cotizar** a **Esperando Cliente**.
5. Verificar que puede regresar a **Por cotizar** para corregir la oferta.
6. Verificar que, con aprobación del cliente, puede pasar a **Pedir componentes** o **En reparación**.
7. Confirmar que los equipos existentes pueden conservar sus transiciones anteriores; la nueva etapa se usa cuando se requiere esperar la respuesta del cliente.

## Evidencia automatizada

- Unitario backend: `go test ./internal/projects -run TestCanTransitionRules`
- Build frontend: `npm run build`

## Métricas de calidad

| Métrica | Objetivo |
| --- | --- |
| Transiciones críticas cubiertas | 4 permitidas |
| Catálogo visible en configuración | 1 opción exacta: `Esperando Cliente` |
| Regresión backend | 100% de `TestCanTransitionRules` aprobada |

## Prueba de mutación

Cambiar temporalmente el destino `esperando-cliente` por otro identificador en la tabla de transiciones debe hacer fallar los cuatro casos permitidos. Restaurar el cambio antes de integrar.
