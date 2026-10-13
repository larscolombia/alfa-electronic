# language: es
Característica: Aprobación de compras de repuestos desde proyectos
  Como usuario administrador o de compras
  Quiero que las líneas y solicitudes de compra creadas desde proyectos se listen y puedan aprobarse
  Para que las compras no se pierdan ni se bloqueen por permisos incorrectos del frontend

  Antecedentes:
    Dado que el backend está corriendo
    Y existe el usuario "admin@alfa.com" con rol autenticado "admin"

  # ─── FIX A: PERMISOS FRONTEND ─────────────────────────────────────────────

  Escenario: Admin con rol operativo técnico puede solicitar repuestos
    Dado que el usuario autenticado tiene rol "admin"
    Y su rol operativo de inventario persistido es "tecnico"
    Cuando evalúa el permiso "inventory.replenishment.manage"
    Entonces el permiso es concedido por bypass de administrador
    Y puede crear líneas de compra y reservas desde un proyecto sin "permisos denegados"

  Escenario: Rol operativo por defecto se deriva del usuario autenticado
    Dado que no hay rol operativo persistido en localStorage
    Cuando el usuario autenticado tiene rol "admin"
    Entonces el rol operativo por defecto es "responsable"

  Escenario: Técnico sin bypass sigue restringido
    Dado que el usuario autenticado tiene rol "tecnico"
    Cuando evalúa el permiso "inventory.replenishment.manage"
    Entonces el permiso es denegado
    Y el mensaje indica "No tienes permisos para esta accion"

  Escenario: Error real del backend es visible para el usuario
    Dado que el usuario registra una acción de inventario válida en el cliente
    Cuando el backend rechaza la operación con un mensaje de error
    Entonces el mensaje real del backend se muestra al usuario
    Y no se oculta tras el resultado optimista local

  # ─── FIX B: VISIBILIDAD Y APROBACIÓN ──────────────────────────────────────

  Escenario: Solicitud creada desde un proyecto aparece en el panel administrativo
    Dado que existe una solicitud de compra creada desde el proyecto "P-100"
    Cuando abro la página "Cantidad insuficiente y reposición" (/app/inventory-orders)
    Entonces la sección "Solicitudes de compra de repuestos" lista la solicitud
    Y muestra referencia, descripción, cantidad, proyecto origen, solicitante, estado y fecha

  Escenario: Aprobar solicitud de compra desde el panel
    Dado que existe una solicitud de compra con estado "pendiente"
    Cuando confirmo la acción "Aprobar" en la solicitud
    Entonces la solicitud cambia a estado "aprobada"
    Y se genera automáticamente una línea de compra aprobada vinculada

  Escenario: Rechazar solicitud de compra desde el panel
    Dado que existe una solicitud de compra con estado "pendiente"
    Cuando confirmo la acción "Rechazar" en la solicitud
    Entonces la solicitud cambia a estado "rechazada"
    Y no se genera línea de compra

  Escenario: Línea de compra creada desde proyecto requiere aprobación
    Dado que se crea una línea de compra manual con proyecto origen "P-100"
    Entonces la línea tiene estado de aprobación "pendiente"
    Y la tabla de líneas muestra el proyecto origen de la línea

  Escenario: Aprobar línea de compra pendiente
    Dado que existe una línea de compra con aprobación "pendiente"
    Cuando confirmo "Aprobar" en la línea
    Entonces la línea cambia a aprobación "aprobada"
    Y se registra el aprobador y la fecha

  Escenario: Rechazar línea de compra pendiente
    Dado que existe una línea de compra con aprobación "pendiente"
    Cuando confirmo "Rechazar" en la línea
    Entonces la línea cambia a aprobación "rechazada"

  Escenario: Línea ya revisada no puede revisarse de nuevo
    Dado que existe una línea de compra con aprobación "aprobada"
    Cuando intento aprobarla de nuevo
    Entonces el backend responde "La linea no existe o ya fue aprobada."

  Escenario: Estado vacío amigable sin solicitudes
    Dado que no existen solicitudes de compra
    Cuando abro el panel "Solicitudes de compra de repuestos"
    Entonces veo el mensaje "No hay solicitudes de compra registradas"
