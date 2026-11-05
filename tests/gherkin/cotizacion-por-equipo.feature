Característica: Cotización de reparación por equipo
  Escenario: Cálculo visible de mano de obra y utilidad
    Dado un equipo cotizado con horas estimadas, repuestos y valor hora Colombia
    Cuando el usuario registra el valor a cobrar
    Entonces ve el costo de mano de obra, los gastos asociados, la utilidad y su porcentaje

  Escenario: Bloqueo al iniciar reparación
    Dado una cotización asociada a un equipo en reparación
    Cuando un usuario intenta editarla o anularla
    Entonces el sistema rechaza la acción y explica el motivo
