# QA — transición por disponibilidad de repuestos

Fuente contrastada: `TranscriptCompras.txt` @13:16–22:45. Una línea validada queda rosada; comprada, naranja; recibida, verde. El equipo pasa a posición 11 si requiere importación y solo a posición 1 cuando llegaron todos los componentes. Si solo usa stock, pasa directamente a posición 1.

| Caso | Preparación | Acción | Resultado esperado |
|---|---|---|---|
| Compra externa | OC cargada, equipo en Pedir componentes | Crear línea de compra | Esperando proveedor; sin salto a Reparación |
| Stock | OC cargada, equipo en Pedir componentes | Reservar componente disponible | Reparación |
| Sin OC | Equipo en Diagnóstico o Por cotizar | Crear solicitud externa | No cambia a Reparación ni se libera el trabajo |
| Recibo parcial | Equipo esperando dos líneas | Recibir parte de una | Sigue esperando proveedor |
| Recibo completo | Todas las líneas completas | Registrar último recibido | Habilita el CTA para devolverlo a Reparación; no se debe liberar antes |

Métrica de calidad: 100% de los 4 escenarios de lógica automatizada verdes; 0 transiciones directas de compra externa a Reparación.
