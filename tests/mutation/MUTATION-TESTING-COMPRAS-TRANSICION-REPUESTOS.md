# Mutation testing — transición de compras a reparación

| Mutante aplicado a `resolveStatusAfterPartsRequest` | Caso que debe fallar |
|---|---|
| Cambiar `compra-externa` para devolver `reparacion` | `compra externa -> esperando proveedor` |
| Permitir `diagnostico` o `por-cotizar` como estado de origen | `diagnostico compra externa -> null` y `por-cotizar compra externa -> null` |
| Cambiar `stock` para devolver `esperando-proveedor` | `stock reservado -> reparacion` |
| Aceptar un origen de disponibilidad desconocido | `Origen invalido -> null` |

Ejecución: aplicar uno de los mutantes temporalmente, ejecutar `node scripts/test-auto-transitions-logic.mjs`, confirmar fallo y revertirlo. Cobertura de mutantes esperada: 4/4 detectados.
