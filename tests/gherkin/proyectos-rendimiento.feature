Característica: Renderización eficiente del tablero de proyectos

  Escenario: Una tarjeta no recalcula su presentación sin cambios de entrada
    Dado un proyecto y su columna de tablero
    Cuando Angular revisa el tablero por un evento ajeno a la tarjeta
    Entonces la tarjeta conserva su modelo de vista previamente calculado

  Escenario: Una actualización del proyecto refresca su presentación
    Dado una tarjeta renderizada
    Cuando cambia el proyecto, la columna o su estado SLA
    Entonces la tarjeta muestra el nuevo estado SLA, prioridad y métricas

