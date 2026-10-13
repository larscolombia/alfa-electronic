# language: es
Característica: CRM - Contactos de la ficha de cliente
  Como usuario comercial
  Quiero ver, agregar, editar y eliminar todos los contactos asociados al cliente desde el tab "Contactos"
  Para mantener las personas de contacto del cliente y de sus prospectos unificadas en una sola lista persistida en el backend

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8091
    Y estoy autenticado con rol comercial
    Y existe el cliente "QA Empresa Contactos" en "/app/crm-clientes/:id"

  # ─── LISTA UNIFICADA DE CONTACTOS ────────────────────────────────────────

  Escenario: La lista unificada combina contactos del cliente y de sus prospectos
    Dado que el cliente tiene contactos propios registrados
    Y existen prospectos con la misma empresa del cliente que tienen contactos
    Cuando abro el tab "Contactos" de la ficha del cliente
    Entonces veo UNA sola tabla "Contactos" sin secciones separadas
    Y cada fila muestra una badge de origen "Cliente" o "Prospecto"
    Y el encabezado muestra el conteo total de contactos

  Escenario: Contactos duplicados se muestran una sola vez
    Dado que un contacto del cliente y un contacto de prospecto tienen el mismo nombre y correo (sin distinguir mayúsculas)
    Cuando abro el tab "Contactos" de la ficha del cliente
    Entonces el contacto aparece una sola vez en la lista unificada
    Y se conserva la fila con origen "Cliente"

  Escenario: Empty state unificado sin contactos
    Dado que el cliente no tiene contactos propios ni contactos de prospectos relacionados
    Cuando abro el tab "Contactos" de la ficha del cliente
    Entonces veo el mensaje "No hay contactos asociados a este cliente. Usa Agregar contacto para crear el primero."

  # ─── AGREGAR CONTACTO ────────────────────────────────────────────────────

  Escenario: Agregar contacto válido desde el tab Contactos
    Dado que abro el tab "Contactos" de la ficha del cliente
    Cuando presiono el botón "Agregar contacto"
    Y completo nombre "Maria QA", cargo "Gerente de compras", correo "maria.qa@example.com" y telefono "+57 300 123 4567"
    Y presiono "Guardar"
    Entonces el contacto se persiste en el backend en la tabla "crm_client_contacts" con origen "Cliente"
    Y el contacto aparece en la tabla unificada de la ficha
    Y veo un mensaje de confirmación de creación exitosa
    Y el formulario inline se cierra

  Escenario: Agregar contacto sin nombre es rechazado
    Dado que abro el tab "Contactos" de la ficha del cliente
    Cuando presiono el botón "Agregar contacto"
    Y dejo el campo nombre vacío y presiono "Guardar"
    Entonces recibo un error de validación indicando que el nombre es obligatorio
    Y no se crea ningún contacto en el backend
    Y el formulario inline permanece abierto con el mensaje de error visible

  Escenario: Agregar contacto con correo de formato inválido es rechazado
    Dado que abro el tab "Contactos" de la ficha del cliente
    Cuando presiono el botón "Agregar contacto"
    Y completo nombre "QA Correo" con correo "no-es-un-correo"
    Y presiono "Guardar"
    Entonces recibo un error de validación indicando que el correo no es válido
    Y no se crea ningún contacto en el backend

  # ─── EDICIÓN RÁPIDA POR FILA ─────────────────────────────────────────────

  Escenario: Editar contacto con origen cliente
    Dado que el cliente tiene el contacto "Maria QA" con origen "Cliente"
    Cuando presiono el botón editar (lápiz) de la fila del contacto
    Entonces la fila se convierte en inputs editables con los valores actuales
    Cuando cambio el cargo a "Directora de compras" y presiono "Guardar"
    Entonces el contacto se actualiza en el backend vía PUT "/clients/:id/contacts/:contactId"
    Y la fila muestra los nuevos valores sin recargar la página
    Y veo un mensaje de confirmación de actualización exitosa

  Escenario: Editar contacto con origen prospecto
    Dado que la lista unificada muestra el contacto "Pedro QA" con origen "Prospecto"
    Cuando presiono el botón editar (lápiz) de la fila del contacto
    Y cambio el telefono y presiono "Guardar"
    Entonces el contacto se actualiza en el backend vía PUT "/prospects/:prospectId/contacts/:contactId"
    Y la fila muestra los nuevos valores sin recargar la página

  Escenario: Edición rápida con nombre vacío es rechazada
    Dado que estoy editando una fila de contacto
    Cuando dejo el nombre vacío y presiono "Guardar"
    Entonces recibo un error de validación indicando que el nombre es obligatorio
    Y la fila permanece en modo edición
    Y no se envía ninguna actualización al backend

  Escenario: Cancelar edición rápida no modifica el contacto
    Dado que estoy editando una fila de contacto
    Cuando cambio algunos valores y presiono "Cancelar"
    Entonces la fila vuelve a modo lectura con los valores originales
    Y no se envía ninguna actualización al backend

  # ─── ELIMINAR CONTACTO ───────────────────────────────────────────────────

  Escenario: Eliminar contacto del cliente con confirmación
    Dado que el cliente tiene el contacto "Maria QA" registrado con origen "Cliente"
    Cuando presiono el botón eliminar de la fila del contacto
    Y confirmo la acción en el diálogo de confirmación
    Entonces el contacto queda con soft delete en el backend
    Y desaparece de la tabla unificada

  Escenario: Eliminar contacto con origen prospecto
    Dado que la lista unificada muestra el contacto "Pedro QA" con origen "Prospecto"
    Cuando presiono el botón eliminar de la fila del contacto
    Y confirmo la acción en el diálogo de confirmación
    Entonces el contacto se elimina del prospecto en el backend
    Y desaparece de la tabla unificada
