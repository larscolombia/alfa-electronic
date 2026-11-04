# Mutation Testing — Esperando Cliente

| Mutación | Prueba que debe fallar |
| --- | --- |
| Eliminar `esperando-cliente` de `allowedProjectStatuses` | `TestEsperandoClienteIsAcceptedProjectStatus` |
| Quitar el destino desde `por-cotizar` | `TestCanTransitionRules` |
| Quitar el destino `pedir-repuestos` desde espera | `TestCanTransitionRules` |
| Cambiar el label visible | `test:esperando-cliente-catalog` |

No se incorporan mutantes permanentes al código de producción.
