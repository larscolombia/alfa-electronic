# Regresión del bloqueo del tablero

```gherkin
Feature: Tablero técnico estable
  Scenario: Abrir el tablero y cambiar su vista
    Given una sesión autenticada
    When abro /app/work-projects en Playwright con headless false
    Then aparecen las columnas y desaparece el indicador de carga
    And puedo alternar Modo compacto y filtrar Mis equipos
    And el hilo principal sigue respondiendo después de diez segundos
```

QA: ejecutar scripts/debug-board-visible.mjs y observar la ventana visible.
Métricas: sin errores de página; interacción < 2 s una vez montado;
máximo 40 tarjetas iniciales por columna; sin ciclo continuo de mutaciones.
Cobertura: montaje, estabilidad, cambio de modo y callback del observador global.
Mutación: volver a registrar el observador dentro de NgZone debe reproducir
el crecimiento continuo de ciclos al recrear los chips SLA sin trackBy.
