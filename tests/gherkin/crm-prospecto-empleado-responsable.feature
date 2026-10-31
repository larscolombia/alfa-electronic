# language: es
Característica: Empleado responsable autocompletado en nuevo prospecto
  Como asesor comercial
  Quiero que al abrir el formulario "Agregar prospecto" el campo
  "Empleado responsable" ya venga completado con mi nombre (empleado logueado)
  Para no tener que buscarlo cada vez y para que todo prospecto nuevo tenga
  un responsable desde el momento cero

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado como "Administrador PIKA" (admin@alfa.com) en la empresa "demo-company"

  # ─── PUERTAS DE ENTRADA AL FORMULARIO ──────────────────────────────────

  Escenario: Abrir el formulario con el botón "Agregar Prospecto"
    Dado que estoy en la página de prospectos con una carga fresca (sin borrador)
    Cuando hago clic en el botón "Agregar Prospecto"
    Entonces el select "Empleado responsable" muestra mi nombre logueado
    Y la opción con mi nombre existe dentro del select

  Escenario: Reabrir la página con un borrador viejo sin responsable
    Dado que existe un borrador guardado de prospecto con "Empleado responsable" vacío
    Cuando recargo la página de prospectos
    Entonces el formulario se restaura abierto
    Y el select "Empleado responsable" muestra mi nombre logueado

  Escenario: Abrir el formulario haciendo clic directo en el encabezado (summary)
    Dado que estoy en la página de prospectos con una carga fresca (sin borrador)
    Cuando hago clic en el summary del card "Agregar prospecto" para abrirlo por toggle nativo
    Entonces el select "Empleado responsable" muestra mi nombre logueado
    Y la opción con mi nombre existe dentro del select

  # ─── EDGE CASES ─────────────────────────────────────────────────────────

  Escenario: Un valor ya escrito nunca se pisa al reabrir por toggle
    Dado que el formulario está abierto con "Empleado responsable" en otro empleado válido
    Cuando cierro y vuelvo a abrir el formulario por clic en el summary
    Entonces el select conserva el nombre del otro empleado (no mi nombre)

  Escenario: Borrador con un nombre antiguo no visible en RRHH sigue mostrándose
    Dado que existe un borrador guardado con "Empleado responsable" en un nombre ya inactivo
    Cuando abro el formulario por clic en el summary
    Entonces el select muestra ese nombre antiguo (optionsFor lo mezcla como valor actual)

  Escenario: El nombre logueado se toma de la sesión, no del DOM
    Dado que mi sesión tiene name "Administrador PIKA" y email "admin@alfa.com"
    Cuando se autocompleta el campo en cualquiera de las tres puertas de entrada
    Entonces el valor es "Administrador PIKA" (name con prioridad sobre email)
