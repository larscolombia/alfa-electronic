Característica: Vista técnica enfocada en el equipo
  Escenario: El técnico ve solamente sus estados operativos
    Dado que el tablero tiene estados comerciales, de recepción y técnicos
    Cuando selecciono la vista Técnico
    Entonces veo P0, P0.5, P1, P11, P13, P16 y P16.11
    Y no veo Recibido, Por cotizar, Esperando Cliente, Listo para entrega ni Entregado.

  Escenario: La ficha no duplica datos del equipo
    Dado que abro un proyecto con equipo vinculado
    Entonces veo código, servicio, falla, serie y recepción al inicio
    Y el QR aparece solo dentro del bloque de información del equipo
    Y no veo controles para cambiar o buscar el equipo.
