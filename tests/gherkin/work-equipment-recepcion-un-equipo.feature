# language: es
Característica: Recepción de equipos registra un solo equipo a la vez (botón "Agregar equipo" oculto)
  Como técnico de recepción
  Quiero que en /app/work-equipment-reception no pueda agregar varios equipos a la vez
  Para registrar cada equipo con su propio flujo completo sin mezclar ítems

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado como "Administrador PIKA" (admin@alfa.com) en la empresa "demo-company"

  # ─── RECEPCIÓN (botón oculto) ──────────────────────────────────────────

  Escenario: Crear una recepción nueva no ofrece agregar varios equipos
    Dado que estoy en /app/work-equipment-reception
    Cuando hago clic en "Nuevo equipo" y avanzo al paso "Equipos" del wizard
    Entonces NO existe el botón [data-testid="equipment-modal-add-item"] en el DOM
    Y la tarjeta del único equipo se muestra normalmente

  Escenario: El flujo de un solo ítem queda sano con el botón oculto
    Dado que estoy en el paso "Equipos" de una recepción nueva
    Entonces existe exactamente una tarjeta .equipment-card
    Y el botón Eliminar (equipment-modal-remove-item-0) está deshabilitado

  Escenario: Editar una recepción existente tampoco ofrece agregar equipos
    Dado que existe al menos una recepción en la tabla
    Cuando hago clic en "Editar" de una fila y avanzo al paso "Equipos"
    Entonces NO existe el botón [data-testid="equipment-modal-add-item"]
    Y todas las tarjetas .equipment-card coinciden con los N equipos declarados en la fila

  # ─── CRM (funcionalidad multi-item intacta) ────────────────────────────

  Escenario: El modal de CRM conserva el registro múltiple
    Dado que el modal se instancia desde prospectos con [allowMultipleEquipment]="true"
    Cuando avanzo al paso "Equipos"
    Entonces SÍ existe el botón [data-testid="equipment-modal-add-item"]
    Y addEquipmentItem() sigue agregando ítems al draft sin cambios

  # ─── EDGE CASES / REACTIVACIÓN ─────────────────────────────────────────

  Escenario: Reactivar el registro múltiple en recepción es una sola línea
    Dado que allowMultipleEquipmentReception = false en WorkTeamsComponent
    Cuando un desarrollador la cambia a true (constante documentada con comentario)
    Entonces el botón "Agregar equipo" reaparece en recepción sin tocar el modal

  Escenario: El input del modal es seguro por defecto
    Dado que @Input() allowMultipleEquipment = false por defecto
    Cuando cualquier vista nueva use el modal sin pasar el input
    Entonces el botón queda oculto (la regla de negocio nueva es la predeterminada)
