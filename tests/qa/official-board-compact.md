# Vista oficial: modo compacto por defecto y rendimiento

```gherkin
Feature: Tablero técnico oficial estable
  Scenario: Festivos vacíos y modo compacto inicial
    Given 10000 proyectos simulados y una respuesta de festivos vacía
    When abro /app/work-projects con Playwright visible
    Then el checkbox Modo compacto está marcado
    And solo se montan 12 tarjetas por columna
    And las consultas de festivos se detienen tras tres años consultados
    When desmarco Modo compacto
    Then aparecen las tarjetas completas sin perder casos ni conteos
    And puedo abrir y cerrar una ficha
```

QA: ejecutar test-empty-holiday-cache.mjs y check-official-board-compact.mjs.
Cobertura: calendario vacío, cambios de sesión, compacto/completo, volumen,
ficha, carga diferida y conteos. Mutación: quitar la comprobación de carga
debe reintroducir las peticiones recurrentes y fallar la prueba unitaria.
Métricas: 0 errores JS; máximo 3 consultas iniciales de festivos; ninguna
consulta de inventario/equipos antes de abrir la ficha; 12 tarjetas iniciales
por columna, conservando todos los registros recibidos y filtros globales.
Las pruebas interceptan proyectos/festivos; no crean datos de negocio.
