# language: es
Característica: Módulo Técnico — prioridades, tiempos, repuestos, anclados, garantías y biblioteca
  Como técnico de servicio
  Quiero plazos parametrizables, control de tiempos real, gestión de repuestos con alertas,
  validación de anclados, control de garantías y biblioteca técnica con backups
  Para trabajar sin procesos manuales fuera del sistema

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado con rol "tecnico"

  # ─── T1: PANEL DE PRIORIDADES Y PLAZOS ───────────────────────────────────

  Escenario: Los umbrales del semáforo respetan los días configurados por columna
    Dado que la columna "Diagnóstico" tiene configurados 2 días verdes y 2 amarillos
    Y la columna "Reparación" tiene configurados 5 días verdes y 3 amarillos
    Cuando un equipo lleva 4 días hábiles en cada columna
    Entonces el equipo en "Diagnóstico" se muestra en naranja (vencido)
    Y el equipo en "Reparación" se muestra en verde

  Escenario: Guardar la configuración de plazos persiste en el servidor
    Dado que estoy en la pantalla de configuración de proyectos
    Cuando cambio los días del semáforo y pulso guardar
    Entonces la configuración se envía al endpoint de sla-config
    Y al recargar el tablero los colores usan los nuevos plazos

  Escenario: El resumen de totales por estado es visible sin desplazarse
    Dado que el tablero tiene 8 columnas de estados
    Cuando abro el tablero técnico
    Entonces veo una barra de resumen con el total de equipos por estado
    Y no necesito desplazarme a la derecha para ver todos los totales

  # ─── T2: REGISTRO Y CONTROL DE TIEMPOS ───────────────────────────────────

  Escenario: El contador se activa al entrar a la ficha del equipo
    Dado que el cronómetro del sistema no está corriendo
    Cuando abro el detalle de un equipo en el tablero
    Entonces se inicia el contador de sesión de ese equipo
    Y al cerrar el detalle el contador se detiene

  Escenario: El tiempo registrado se acumula en cuartos de hora
    Dado que estuve 20 minutos en la ficha de un equipo
    Cuando cierro la ficha
    Entonces se acumulan 0.5 horas al equipo

  Escenario: El balance diario exige justificar las 8 horas
    Dado que registé 6.25 horas en el día
    Cuando veo la hoja de tiempo
    Entonces el balance diario indica "Llevas 6.25 de 8 horas (faltan 1.75)"

  Escenario: KPI de horas estimadas contra reales
    Dado que un equipo tiene 10 horas estimadas y 12 horas reales registradas
    Cuando veo la hoja de tiempo
    Entonces el KPI muestra las horas estimadas, las reales y el estado de rentabilidad

  Escenario: Registrar horas extra, permisos, ausencias y festivos
    Dado que estoy creando un registro de tiempo
    Cuando selecciono el tipo de registro "hora-extra"
    Entonces el registro se guarda con ese tipo
    Y el resumen por tipo lo acumula separado de las horas normales

  Escenario: El técnico del registro sale de la lista real de empleados
    Dado que existen empleados registrados en RRHH
    Cuando abro el selector de empleado en la hoja de tiempo
    Entonces veo los empleados reales del sistema, no una lista fija

  # ─── T4: REPUESTOS E INVENTARIO ──────────────────────────────────────────

  Escenario: La búsqueda no falla por espacios ni caracteres especiales
    Dado que existe la referencia "IGBT-FGA25N120"
    Cuando busco "igbt fga25n120"
    Entonces la referencia aparece en los resultados

  Escenario: Alerta al técnico cuando compras modifica un repuesto solicitado
    Dado que solicité el repuesto "IGBT-FGA25N120" marca "Fairchild"
    Cuando compras cambia la marca o la referencia de la línea
    Entonces veo una alerta en la ficha del equipo indicando la modificación

  Escenario: El técnico crea una línea de compra desde la ficha del equipo
    Dado que estoy en la ficha del equipo "MTR-01"
    Cuando pulso "Solicitar repuesto" y diligencio proveedor, referencia, precio y cantidad
    Entonces se crea la línea de compra asociada al equipo

  Escenario: La solicitud de repuesto no pide motivo y propone plazo de 1 día
    Dado que estoy en la ficha de un equipo cuyo proyecto no tiene fecha compromiso
    Cuando abro el formulario de solicitud de repuesto
    Entonces no veo el campo "Motivo de la solicitud"
    Y la prioridad por defecto es "Critica"
    Y la fecha compromiso por defecto es el día siguiente a hoy
    Y el plazo (lead time / needed by) por defecto es 1 día

  Escenario: La fecha compromiso de la solicitud respeta el dueDate del proyecto
    Dado que el proyecto del equipo tiene fecha compromiso "2026-09-01"
    Cuando abro el formulario de solicitud de repuesto
    Entonces la fecha compromiso por defecto es "2026-09-01"

  Escenario: El reporte técnico impreso no lista repuestos
    Dado que el equipo "MTR-01" tiene líneas de compra de repuestos registradas
    Cuando abro el reporte técnico imprimible
    Entonces el documento no muestra la sección "Repuestos"
    Y no aparece la tabla de repuestos

  # ─── T5: ANCLADOS Y PRÉSTAMOS ────────────────────────────────────────────

  Escenario: No se puede marcar entregado sin confirmar accesorios y anclados
    Dado que una remisión tiene un ítem con accesorios y un equipo anclado
    Cuando pulso "Marcar entregado"
    Entonces se me pide confirmar que se entregaron los accesorios y equipos anclados
    Y hasta no marcar la confirmación no se cambia el estado

  Escenario: El despacho del tablero exige la misma confirmación
    Dado que un equipo con accesorios está listo para despacho en el tablero
    Cuando intento completar el despacho
    Entonces el botón no se habilita hasta marcar la confirmación de accesorios

  # ─── T6: GARANTÍAS ───────────────────────────────────────────────────────

  Escenario: La posición garantía-espera-repuestos es seleccionable
    Dado que un equipo en garantía está esperando repuestos
    Cuando abro el selector de estado en el tablero
    Entonces puedo elegir "Garantia esp. repuestos"

  Escenario: Marcar garantía durante la recepción con validación
    Dado que recibo un equipo que ya fue reparado hace 2 meses con 6 meses de garantía
    Cuando marco la casilla "Es garantia" en la recepción
    Entonces se muestra el código antiguo y el historial previo
    Y el badge indica los meses de garantía restantes

  Escenario: Alerta de garantía vencida en la recepción
    Dado que recibo un equipo entregado hace 8 meses con 6 meses de garantía
    Cuando marco la casilla "Es garantia"
    Entonces veo la alerta "Garantia vencida"

  # ─── T7: BIBLIOTECA TÉCNICA Y BACKUPS ────────────────────────────────────

  Escenario: La documentación técnica no se puede borrar
    Dado que existe un manual en la biblioteca técnica
    Cuando reviso las opciones del documento
    Entonces no hay opción de eliminarlo

  Escenario: Icono de backup de software en la ficha del equipo
    Dado que existe un backup de software para el modelo "S7-1200"
    Cuando abro la ficha de un equipo de ese modelo
    Entonces veo el icono de backup encendido
    Y puedo descargar el backup directamente

  Escenario: Icono apagado cuando no hay backup del modelo
    Dado que no existe backup para el modelo "LOGO-8"
    Cuando abro la ficha de un equipo de ese modelo
    Entonces el icono de backup aparece apagado
