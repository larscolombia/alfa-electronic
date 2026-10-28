# Tablero técnico de laboratorio

Ruta aislada: /app/work-projects-lab. No sustituye la ruta original.

```gherkin
Feature: Carga inmediata del tablero de laboratorio
  Scenario: Cargar muchos casos
    Given 10000 proyectos simulados sin escrituras al servidor
    When abro el laboratorio con Playwright visible
    Then aparecen las columnas y los datos
    And hay como máximo 12 tarjetas iniciales por columna
    And los filtros y la carga progresiva siguen funcionando
    And la ruta original sigue disponible
```

QA: medir navegación fría, navegación interna y carga de datos por separado.
Objetivo: datos listos en menos de 1000 ms en navegación interna local;
proyección de 100000 casos en menos de 100 ms; DOM inicial acotado.
No contar placeholders como datos cargados. Informar tiempos reales sin
descontar artificialmente red o módulos. API real limita a 1000 casos por etapa;
el laboratorio solicita 12 + un centinela, y aumenta la página al pedir más.
Los conteos/filtros/SLA son parciales y se indican como tales con «+».
Los volúmenes mayores se ensayan interceptando respuestas y respetando
status/limit, sin escribir en BD. No afirmar que se descargaron todos los casos.
Cobertura: filtros, límites, conteos completos del conjunto recibido,
inmutabilidad, errores visibles y ficha diferida.
Mutación: quitar el límite de tarjetas debe fallar la prueba de volumen.
