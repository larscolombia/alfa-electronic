# language: es
Característica: Etiqueta QR y portada de recepción
  Escenario: QR con información operativa legible
    Dado un equipo recibido con código, fecha, empresa, identificación y descripción
    Cuando se genera su etiqueta QR
    Entonces el contenido tiene esos cinco valores en ese orden
    Y no contiene títulos ni IDs internos

  Escenario: Portada de recepción mínima
    Cuando abro la recepción de equipos
    Entonces veo "Ver proyecto", "Nuevo equipo" e "Historial"
    Y el listado no aparece hasta seleccionar "Historial"

  Escenario: Historial inicial del día
    Dado que selecciono "Historial"
    Entonces el rango inicial es "Hoy"
    Y puedo seleccionar "Esta semana", "Últimos 15 días", "Último mes" y "3 meses"
