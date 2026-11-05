Característica: Configuración de cotizaciones y afectación técnica
  Escenario: Administrar comentarios reutilizables y costo hora-hombre
    Dado que un administrador abre Configuración de cotizaciones
    Cuando registra una línea de comentario y un valor COP por hora-hombre
    Entonces puede verlos en la tabla y los cambios quedan guardados

  Escenario: Consultar afectaciones pendientes
    Dado que existen equipos sin técnico asignado
    Cuando abre la pestaña Pendientes de afectación
    Entonces solo visualiza la matriz de decisión
    Y las pestañas se ordenan Matriz de decisión, Cola de afectación e Histórico

  Escenario: Identificar un equipo
    Cuando consulta una tarjeta o fila de carga laboral
    Entonces ve el código CO con año, mes y consecutivo
    Y no ve un código interno alterno
