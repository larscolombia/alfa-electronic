# Mutación: tablero de proyectos

Mutaciones que debe detectar la prueba de componente al incorporarse al runner:

- Eliminar el recálculo de severidad SLA ante cambio de proyecto.
- Usar prioridad previa en vez de la prioridad de entrada.
- Omitir el recálculo al cambiar de columna.

Cada mutación debe causar fallo del escenario `proyectos-rendimiento.feature`.
