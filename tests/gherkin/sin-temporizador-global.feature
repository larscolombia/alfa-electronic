# language: es
Característica: Interfaz sin temporizador global
  Como usuario de la plataforma
  No quiero ver un temporizador superior resaltado en rojo
  Para trabajar sin distracciones visuales no solicitadas

  Antecedentes:
    Dado que estoy autenticado en la plataforma

  Escenario: El topbar no muestra el cronómetro global
    Cuando navego a cualquier vista de la aplicación
    Entonces el encabezado fijo no contiene el botón del cronómetro global
    Y no existe ningún elemento con la animación de pulso rojo del contador

  Escenario: El home no muestra el botón contador
    Cuando navego a "/app/dashboard"
    Entonces no existe el botón contador del home

  Escenario: El contador no arranca automáticamente
    Cuando permanezco más de 15 segundos en una vista
    Entonces no aparece ningún temporizador en el encabezado
    Y el encabezado no muestra el texto "Iniciar contador"
