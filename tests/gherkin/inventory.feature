# language: es
Característica: Módulo de Inventario
  Como responsable de inventario
  Quiero gestionar fichas, movimientos, reservas y reposición
  Para mantener el control del stock de componentes electrónicos

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado con rol "responsable"

  # ─── FICHAS DE STOCK ─────────────────────────────────────────────────────

  Escenario: Crear ficha de referencia nueva
    Dado que no existe la referencia "TEST-GH-001"
    Cuando creo una ficha con referencia "TEST-GH-001", designación "Capacitor 100uF", familia "Capacitores", marca "Samsung", stock mínimo 5, ubicación "C01"
    Entonces la ficha se crea exitosamente
    Y el código interno se genera como "INV-CAP-00001"
    Y el stock actual es 0

  Escenario: Crear ficha duplicada es rechazado
    Dado que existe la referencia "TEST-GH-001" con designación "Capacitor 100uF"
    Cuando intento crear una ficha con referencia "TEST-GH-001" y designación "Capacitor 100uF"
    Entonces recibo un error "Ya existe una referencia muy similar"

  Escenario: Entrada de stock incrementa el stock actual
    Dado que existe la referencia "TEST-GH-001" con stock actual 0
    Cuando registro una entrada de 50 unidades para "TEST-GH-001"
    Entonces el stock actual de "TEST-GH-001" es 50
    Y se registra un movimiento tipo "entrada" con cantidad 50

  # ─── MOVIMIENTOS ─────────────────────────────────────────────────────────

  Escenario: Salida de stock decrementa el stock actual
    Dado que existe la referencia "TEST-GH-001" con stock actual 50
    Cuando registro una salida de 10 unidades para "TEST-GH-001" con motivo "Consumo en reparación"
    Entonces el stock actual de "TEST-GH-001" es 40
    Y se registra un movimiento tipo "salida" con cantidad 10

  Escenario: Salida con stock insuficiente es rechazada
    Dado que existe la referencia "TEST-GH-001" con stock actual 5
    Cuando intento registrar una salida de 999 unidades para "TEST-GH-001"
    Entonces recibo un error "No hay stock suficiente"
    Y el stock actual de "TEST-GH-001" sigue siendo 5

  Escenario: Ajuste sin permiso va a cola de aprobación
    Dado que soy técnico y no tengo permiso "inventory.movements.register-adjustment"
    Cuando solicito un ajuste de 5 unidades para "TEST-GH-001"
    Entonces se crea una solicitud de ajuste con estado "pendiente"
    Y el stock no cambia

  Escenario: Responsable aprueba solicitud de ajuste
    Dado que existe una solicitud de ajuste pendiente para "TEST-GH-001"
    Cuando el responsable aprueba la solicitud
    Entonces la solicitud cambia a estado "aprobada"
    Y el movimiento se aplica al stock

  # ─── RESERVAS ────────────────────────────────────────────────────────────

  Escenario: Crear reserva activa con vencimiento
    Dado que existe la referencia "TEST-GH-001" con stock actual 50
    Y la política de reservas es 5 días
    Cuando creo una reserva de 2 unidades para "TEST-GH-001" asignada a "Técnico A" con prioridad "alta"
    Entonces la reserva se crea con estado "activa"
    Y la fecha de vencimiento es hoy + 5 días

  Escenario: Consumir reserva descuenta stock y libera
    Dado que existe una reserva activa de 2 unidades para "TEST-GH-001"
    Y el stock actual es 50
    Cuando consumo la reserva
    Entonces el stock actual baja a 48
    Y la reserva cambia a estado "liberada"
    Y se registra un movimiento de salida tipo "consumo-tecnico"

  Escenario: Renovar reserva extiende vencimiento
    Dado que existe una reserva activa para "TEST-GH-001" con vencimiento en 3 días
    Cuando renuevo la reserva
    Entonces la nueva fecha de vencimiento es hoy + 5 días

  Escenario: Reserva vencida se marca automáticamente
    Dado que existe una reserva activa con fecha de vencimiento ayer
    Cuando se ejecuta la sincronización de estado
    Entonces la reserva cambia a estado "vencida"

  # ─── REPOSICIÓN Y LÍNEAS DE COMPRA ─────────────────────────────────────

  Escenario: Referencia con stock bajo mínimo genera item de reposición
    Dado que existe la referencia "LOW-GH-001" con stock actual 2 y stock mínimo 10
    Cuando se reconstruyen los items de reposición
    Entonces "LOW-GH-001" aparece en el backlog con estado "pendiente"

  Escenario: Generar líneas de compra automáticas
    Dado que existe un item de reposición pendiente para "LOW-GH-001" con stock 2 y mínimo 10
    Cuando genero líneas de compra
    Entonces se crea una línea de compra con cantidad 8 (10 - 2)
    Y la línea tiene estado "pendiente"

  Escenario: Cerrar línea de compra genera entrada automática de stock
    Dado que existe una línea de compra enviada para "LOW-GH-001" con cantidad 8
    Cuando cierro la línea de compra
    Entonces la línea cambia a estado "cerrada"
    Y el stock de "LOW-GH-001" incrementa en 8
    Y se registra un movimiento de entrada tipo "regularizacion"

  # ─── SOLICITUD DE COMPRA DEL TÉCNICO (Gap 5) ──────────────────────────

  Escenario: Técnico crea solicitud de compra desde kanban
    Dado que estoy en el detalle de un proyecto en el kanban
    Cuando envío una solicitud de compra con referencia "IGBT-FGA25N120", cantidad 3, proveedor "DigiKey", costo 15000, urgencia "alta"
    Entonces la solicitud se crea con estado "pendiente"
    Y la solicitud queda vinculada al proyecto actual

  Escenario: Responsable aprueba solicitud y genera línea de compra
    Dado que existe una solicitud de compra pendiente con referencia "IGBT-FGA25N120"
    Cuando el responsable aprueba la solicitud
    Entonces la solicitud cambia a estado "aprobada"
    Y se genera automáticamente una línea de compra vinculada

  Escenario: Responsable rechaza solicitud
    Dado que existe una solicitud de compra pendiente
    Cuando el responsable rechaza la solicitud con notas "No urgente"
    Entonces la solicitud cambia a estado "rechazada"
    Y no se genera línea de compra

  # ─── CONCILIACIÓN ──────────────────────────────────────────────────────

  Escenario: Crear, iniciar y cerrar sesión de conteo
    Cuando creo una sesión de conteo llamada "Inventario Agosto 2026" con alcance "Bodega principal"
    Entonces la sesión se crea con estado "planificada"
    Cuando inicio la sesión
    Entonces la sesión cambia a estado "en-curso"
    Cuando cierro la sesión
    Entonces la sesión cambia a estado "cerrada"
    Y puedo exportar el acta en CSV
