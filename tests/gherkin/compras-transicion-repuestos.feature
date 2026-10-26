Característica: Transición del equipo por disponibilidad de repuestos
  Como responsable del flujo operativo
  Quiero que el estado del equipo refleje la disponibilidad real de sus componentes
  Para no iniciar una reparación con una compra pendiente.

  Escenario: Repuesto externo autorizado espera al proveedor
    Dado que el equipo tiene una OC registrada y está en "Pedir componentes"
    Cuando el técnico crea una línea de compra externa
    Entonces el equipo pasa a "Esperando proveedor"
    Y no puede avanzar a "Reparación" solo por crear la línea.

  Escenario: Repuesto disponible en stock permite reparar
    Dado que el equipo tiene una OC registrada y está en "Pedir componentes"
    Cuando el técnico reserva un repuesto existente en stock
    Entonces el equipo pasa a "Reparación".

  Escenario: Solicitud externa antes de la OC no inicia reparación
    Dado que el equipo está en "Diagnóstico" o "Por cotizar"
    Cuando se registra una solicitud externa de compra
    Entonces el estado no cambia a "Reparación".

  Escenario: Recepción parcial conserva la espera
    Dado que una compra externa tiene componentes pendientes de recibir
    Cuando se registra una recepción parcial
    Entonces el equipo permanece en "Esperando proveedor".
