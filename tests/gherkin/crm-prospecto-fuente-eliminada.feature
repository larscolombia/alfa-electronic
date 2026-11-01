# language: es
Característica: Campo "Fuente del Prospecto" eliminado de prospectos, clientes y BD
  Como asesor comercial
  Quiero que el campo "Fuente del Prospecto" ya no exista en ningún formulario
  ni en la base de datos
  Para simplificar el flujo de alta de prospectos y clientes sin perder funcionalidad

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado como "Administrador PIKA" (admin@alfa.com) en la empresa "demo-company"

  # ─── FORMULARIO Y DETALLE ──────────────────────────────────────────────

  Escenario: El formulario de nuevo prospecto no muestra el campo fuente
    Dado que estoy en la página de prospectos con una carga fresca (sin borrador)
    Cuando abro el formulario "Agregar prospecto"
    Entonces no existe ningún elemento #prospect-source en el DOM
    Y no aparece ninguna etiqueta "Fuente del Prospecto"

  Escenario: Crear un prospecto sigue funcionando end-to-end sin fuente
    Dado que el formulario de nuevo prospecto está abierto
    Cuando lleno NIT válido, compañía y correo y hago clic en "Guardar"
    Entonces el prospecto aparece en la lista con su nombre de compañía
    Y no hay ningún error visible en pantalla

  Escenario: El detalle del prospecto no muestra ni edita fuente
    Dado que existe un prospecto creado
    Cuando abro su página de detalle /app/crm-prospectos/:id
    Entonces no aparece ninguna etiqueta "Fuente del Prospecto"
    Y el campo no es editable en modo edición

  Escenario: La página de clientes carga sin campo fuente
    Dado que estoy autenticado
    Cuando abro la página /app/crm-clientes
    Entonces la lista de clientes se muestra correctamente
    Y no aparece ninguna etiqueta "Fuente del Prospecto"

  # ─── EDGE CASES ────────────────────────────────────────────────────────

  Escenario: Un borrador viejo con formFuente guardado no rompe la restauración
    Dado que existe un borrador guardado de prospecto con la clave "formFuente" en localStorage
    Cuando recargo la página de prospectos
    Entonces el formulario se restaura abierto sin errores
    Y no aparece ningún select de fuente

  Escenario: La conversión trabajo→prospecto ya no escribe fuente
    Dado que un técnico convierte su registro de trabajo en prospecto desde Equipos/Trabajo
    Cuando se crea el prospecto vía la API
    Entonces el registro persiste sin columna source (la columna fue eliminada de crm_prospects)

  Escenario: El catálogo "sources" deja de existir
    Dado que el backend arrancó con la migración drop-source aplicada
    Cuando se consulta GET /api/v1/crm/catalogs
    Entonces la respuesta no contiene la clave "sources"
    Y crm_catalog_items no tiene filas con catalog_type = 'sources'
