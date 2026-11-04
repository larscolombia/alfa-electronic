Característica: Tablero técnico compacto
  Como usuaria del flujo técnico
  Quiero ver una sola cantidad por estado y columnas más angostas
  Para revisar más etapas sin ruido visual ni desplazamiento innecesario.

  Escenario: Cada etapa muestra un único contador
    Dado que la columna "Recibido" contiene 13 equipos
    Cuando visualizo el tablero técnico
    Entonces veo una sola insignia con el valor "13" en la cabecera de Recibido.

  Escenario: Las columnas aprovechan mejor el espacio horizontal
    Cuando visualizo el tablero técnico en escritorio
    Entonces cada columna tiene 220 píxeles de ancho
    Y el relleno lateral no ocupa espacio innecesario.
