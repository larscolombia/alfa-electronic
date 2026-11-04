# Quality Metrics — Esperando Cliente

| Indicador | Meta | Evidencia |
| --- | --- | --- |
| Opción en configuración | 100% visible con nombre exacto | `test:esperando-cliente-catalog` |
| Estado aceptado por API | 100% | `TestEsperandoClienteIsAcceptedProjectStatus` |
| Transiciones esperadas | 4/4 permitidas | `TestCanTransitionRules` |
| Tipado frontend | Sin errores | `npx tsc --noEmit -p tsconfig.app.json` |
