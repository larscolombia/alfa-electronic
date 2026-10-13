# language: es
Característica: Tablero de proyectos — chips de resumen SLA clickeables
  Como usuario del tablero técnico
  Quiero que los totales por estado de la barra de resumen sean clickeables
  Para saltar directamente a la columna correspondiente sin desplazarme a mano

  Antecedentes:
    Dado que el backend está corriendo
    Y estoy autenticado con rol "admin"
    Y estoy en el tablero de proyectos "/app/work-projects"

  Escenario: Los chips de resumen son botones accesibles
    Dado que la barra de resumen SLA está visible sobre el tablero
    Cuando inspecciono los chips de totales por estado
    Entonces cada chip es un botón con su tooltip "Ir a la columna <estado>"
    Y puedo activarlo con el teclado usando Enter o Espacio

  Escenario: Clic en un chip desplaza el tablero hasta su columna
    Dado que el tablero tiene 8 columnas y la última no es visible en pantalla
    Cuando pulso el chip de resumen de la última columna
    Entonces el tablero se desplaza horizontalmente con scroll suave
    Y el encabezado de esa columna queda visible en el viewport

  Escenario: La columna destino se resalta brevemente tras el salto
    Dado que pulsé el chip de resumen de una columna
    Cuando el tablero termina de desplazarse
    Entonces la columna destino muestra un resalte temporal de menos de 2 segundos
    Y luego el resalte desaparece sin dejar cambios permanentes

  Escenario: El clic en un chip no altera el contenido del tablero
    Dado que el tablero tiene proyectos repartidos en varias columnas
    Cuando pulso el chip de resumen de cualquier columna
    Entonces los conteos de los chips y las tarjetas del tablero no cambian
    Y no se abre ninguna ficha de proyecto
