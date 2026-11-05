Característica: Pestañas de la ficha técnica del equipo
  Escenario: El técnico reconoce la información del caso sin navegar por pestañas antiguas
    Dado que abro una ficha técnica de un equipo recibido
    Entonces veo las pestañas Información del equipo, Repuestos, Adjuntos, Memo, Chat y Reporte de intervención
    Y no veo las pestañas Equipo técnico, Materiales, Identidad ni Planeación y notas

  Escenario: La información del equipo reúne solo sus datos operativos
    Cuando abro Información del equipo
    Entonces veo marca, tipo, serie, familia, código CO y código QR
    Y veo falla detectada, fecha de recepción, técnico asignado, plazo de reparación y fecha de entrega programada
