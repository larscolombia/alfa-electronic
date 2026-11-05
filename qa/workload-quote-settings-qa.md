# QA — Configuración de cotizaciones y carga laboral

1. En **Configuración > Config. Cotizaciones**, agregue, edite y elimine una línea de comentario; recargue y confirme persistencia.
2. Ingrese un valor positivo de hora-hombre COP, guarde, recargue y confirme el formato monetario.
3. En Carga laboral confirme el orden: Matriz de decisión, Cola de afectación, Histórico.
4. Abra Matriz de decisión: no debe mostrarse la lista/cola de equipos; la asignación se mantiene en la matriz.
5. Abra Cola de afectación, seleccione un equipo y confirme que se muestra su información completa sin botón de asignación ambiguo.
6. Revise etiquetas y ayudas usando teclado; campos y botones deben conservar foco visible.

## Métricas objetivo

| Métrica | Objetivo |
| --- | --- |
| Guardar configuración | < 30 s |
| Error de validación | < 5 % |
| Satisfacción | > 4/5 |

## Mutación propuesta

- Cambiar la condición `value > 0` por `value >= 0`: la prueba debe rechazar cero.
- Volver a insertar la cola en `pending`: el test estructural debe fallar.
- Sustituir `equipmentCode` por un identificador alterno: el test debe fallar.
