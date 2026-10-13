# language: es
Característica: Módulo de Remisiones y Despacho (Logística)
  Como responsable de logística
  Quiero agrupar equipos listos por cliente, generar remisiones sin límite de ítems,
  previsualizar el documento, registrar evidencia y hacer seguimiento de entrega
  Para despachar los equipos intervenidos sin trabajo manual fuera del sistema

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado con rol "responsable"

  # ─── HALLAZGO 1: PANEL EQUIPOS A DESPACHAR ───────────────────────────────

  Escenario: El panel agrupa por cliente los equipos listos para salir
    Dado que existen equipos con estado "listo-entrega" de los clientes "Acme" y "Beta"
    Y existe un equipo con estado "reparacion" del cliente "Acme"
    Cuando abro la página de remisiones
    Entonces el panel "Equipos a despachar" muestra un grupo para "Acme" y otro para "Beta"
    Y el equipo en estado "reparacion" no aparece en ningún grupo

  Escenario: El panel incluye equipos en garantía y no reparables
    Dado que existen equipos con estado "garantia" y "no-reparable" listos para salir
    Cuando abro la página de remisiones
    Entonces esos equipos aparecen en el grupo de su cliente

  Escenario: Agregar equipo del panel precarga la remisión
    Dado que el panel muestra el equipo "MTR-01" del cliente "Acme"
    Cuando pulso "Agregar a remision" en ese equipo
    Entonces el formulario de remisión se abre con el cliente "Acme" precargado
    Y el ítem queda vinculado al equipmentId real del equipo

  # ─── HALLAZGO 2: ORDEN DE ENVÍO (REMISIÓN) ───────────────────────────────

  Escenario: La remisión admite más de 4 equipos en un solo documento
    Dado que estoy creando una remisión para el cliente "Acme"
    Cuando agrego 6 equipos a la remisión y la guardo
    Entonces la remisión se crea con 6 ítems
    Y el consecutivo tiene formato "E-CO-AAMM-NNNN"

  Escenario: Previsualización del documento antes de generar
    Dado que estoy creando una remisión con tipo de despacho "servientrega"
    Cuando pulso "Previsualizar"
    Entonces se muestra el modal de previsualización con la remisión formateada
    Y el tipo de despacho se muestra como "Servientrega"
    Y no se muestra ninguna alerta de "funcionalidad en desarrollo"

  Escenario: Imprimir la OC del cliente desde la pantalla de remisión
    Dado que la remisión tiene el campo "Orden de compra (OC)" diligenciado
    Cuando pulso "Imprimir OC"
    Entonces se abre la vista imprimible con los datos de la cotización del cliente

  # ─── HALLAZGO 3: REPORTE DE INTERVENCIÓN TÉCNICA ─────────────────────────

  Escenario: Reporte técnico independiente de la facturación
    Dado que existe un equipo en estado "listo-entrega" sin pago confirmado
    Cuando abro el detalle del equipo y pulso "Imprimir reporte tecnico"
    Entonces se muestra el reporte técnico imprimible
    Y no se exige confirmación de pago ni cierre de despacho

  Escenario: Reporte técnico para equipos en garantía
    Dado que existe un equipo en estado "garantia"
    Cuando abro el detalle del equipo y pulso "Imprimir reporte tecnico"
    Entonces se muestra el reporte técnico imprimible

  Escenario: Las descripciones técnicas se muestran completas
    Dado que el diagnóstico del equipo supera los 110 caracteres
    Cuando visualizo el reporte técnico
    Entonces el texto del diagnóstico y la reparación se muestra completo sin cortes

  Escenario: Equipo sin registros técnicos muestra mensaje claro
    Dado que existe un equipo sin registros de intervención
    Cuando pulso "Imprimir reporte tecnico"
    Entonces se muestra el mensaje "No hay registros tecnicos disponibles para este equipo"

  # ─── HALLAZGO 4: ACCESORIOS Y EQUIPOS ANCLADOS ───────────────────────────

  Escenario: Alerta de equipos anclados al agregar a la remisión
    Dado que el equipo "MTR-01" tiene un equipo en préstamo anclado "Motor de pruebas"
    Cuando pulso "Agregar a remision" en "MTR-01"
    Entonces se muestra una alerta indicando que incluya los equipos anclados en la misma remisión

  Escenario: El campo Accesorios es visible y editable en la remisión
    Dado que estoy creando una remisión con un ítem precargado desde el panel
    Cuando edito el campo "Accesorios" del ítem con "Cable de poder, caja"
    Entonces el valor se conserva al guardar la remisión

  # ─── HALLAZGO 5: REGISTRO DE EVIDENCIA ───────────────────────────────────

  Escenario: Registrar link de YouTube, fotos y guía en la remisión
    Dado que estoy creando una remisión
    Cuando diligencio el link de YouTube, cargo 2 fotos del despacho y diligencio transportadora y número de guía
    Y guardo la remisión
    Entonces la remisión conserva el link, las fotos, la transportadora y la guía
    Y la previsualización muestra el link y las fotos

  # ─── HALLAZGO 6: TIPOS DE DESPACHO Y REMISIÓN VALORIZADA ─────────────────

  Escenario: El tipo de despacho sale impreso en el documento
    Dado que creo una remisión con tipo de despacho "contra-entrega"
    Cuando abro la previsualización
    Entonces el documento muestra "Contra entrega"

  Escenario: Traer precios desde la cotización para remisión valorizada
    Dado que el cliente "Acme" tiene una cotización con precios para sus equipos
    Y estoy creando una remisión valorizada con los ítems de "Acme"
    Cuando pulso "Traer precios de cotizacion"
    Entonces los precios unitarios de los ítems se rellenan desde la cotización
    Y el total valorizado se calcula automáticamente

  Escenario: Marcar remisión como entregada
    Dado que existe una remisión con estado de entrega "pendiente"
    Cuando pulso "Marcar entregado"
    Entonces el estado de entrega cambia a "entregado"
    Y el botón "Marcar entregado" desaparece

  Escenario: No se puede revertir una remisión entregada
    Dado que existe una remisión con estado de entrega "entregado"
    Cuando intento cambiar el estado de entrega a "pendiente" por API
    Entonces recibo un error 400

  # ─── HALLAZGO 7: UX DE REMISIONES ────────────────────────────────────────

  Escenario: Remisiones es un ítem del menú principal
    Dado que abro el menú lateral
    Entonces "Remisiones" aparece como ítem principal al mismo nivel que Home, CRM, Financiero y Trabajo
    Y no está dentro del desplegable "Trabajo"
    Cuando pulso "Remisiones"
    Entonces navego a la página de remisiones

  Escenario: Los grupos de equipos a despachar muestran los códigos sin clic
    Dado que existen equipos listos para despacho del cliente "Acme"
    Cuando abro la página de remisiones
    Entonces los grupos de cliente aparecen expandidos por defecto
    Y cada equipo muestra su código en un badge destacado

  Escenario: Ver el detalle de una remisión entregada
    Dado que existe una remisión con estado de entrega "entregado"
    Cuando pulso "Ver detalle" en esa remisión
    Entonces se abre el modal "Detalle de entrega" en modo solo lectura
    Y muestra los ítems con identificador, descripción, accesorios, garantía y cantidad
    Y muestra transportadora, guía, orden de compra, fotos y notas

  Escenario: Agregar equipo autocompleta la orden de compra desde la cotización
    Dado que el cliente "Acme" tiene una cotización con orden de compra "OC-123"
    Y el campo "Orden de compra (OC)" de la remisión está vacío
    Cuando pulso "Agregar a remision" en un equipo de "Acme"
    Entonces el campo "Orden de compra (OC)" se rellena con "OC-123"
    Y el precio unitario del ítem se toma de la línea de cotización que coincide

  Escenario: Agregar equipo sin cotización no muestra error
    Dado que el cliente "Beta" no tiene cotizaciones
    Cuando pulso "Agregar a remision" en un equipo de "Beta"
    Entonces el ítem se agrega sin mensajes de error
    Y puedo usar el botón "Traer precios de cotizacion" manualmente
