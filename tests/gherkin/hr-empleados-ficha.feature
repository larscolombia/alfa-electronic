# language: es
Característica: RRHH - Ficha de empleado (ver, editar y restablecer clave)
  Como responsable de recursos humanos
  Quiero abrir la ficha de un empleado del directorio, editarla y restablecer su clave
  Para mantener la información del colaborador actualizada y gestionar su acceso

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8091
    Y estoy autenticado con rol "responsable"
    Y existe el empleado "EMP-001" en el directorio de RRHH

  # ─── VER FICHA ───────────────────────────────────────────────────────────

  Escenario: "Ver ficha" carga el empleado correcto desde el backend
    Dado que estoy en el directorio "/app/company-hr-employees"
    Cuando presiono "Ver ficha" en la fila del empleado "EMP-001"
    Entonces navego a "/app/profile-professional?source=hr-employees&employeeId=EMP-001"
    Y veo un indicador de carga mientras se consulta el empleado
    Y la ficha muestra el nombre, cargo, departamento, estado y correo del empleado "EMP-001"
    Y el campo "ID de sistema del empleado" muestra "EMP-001"
    Y el campo "N° Documento" muestra el documento registrado del empleado

  Escenario: Ficha de un empleado inexistente muestra error claro
    Dado que navego a "/app/profile-professional?source=hr-employees&employeeId=EMP-999999"
    Cuando el backend responde que el empleado no existe
    Entonces veo una alerta de error indicando que no se pudo cargar la ficha
    Y no se muestra el botón "Restablecer clave"

  # ─── EDITAR Y GUARDAR ────────────────────────────────────────────────────

  Escenario: Editar la ficha y guardar persiste los cambios
    Dado que abrí la ficha del empleado "EMP-001"
    Cuando modifico el cargo, el departamento, el "N° Documento" y el correo electrónico
    Y presiono "Actualizar empleado"
    Entonces los cambios se persisten en el backend vía PUT /hr/employees/EMP-001
    Y veo una alerta de éxito con el nombre y el ID del empleado
    Y al recargar la ficha los valores editados se conservan

  Escenario: Persistencia total de la ficha tras recargar
    Dado que abrí la ficha del empleado "EMP-001"
    Cuando modifico campos de todas las secciones de la ficha
      | seccion      | campos                                                        |
      | identidad    | tratamiento, saludo, nombres, apellidos, usuario, iniciales    |
      | acceso       | usuario de acceso, clave de correo corporativo                 |
      | cargo        | tipo de cargo, tarifa horaria, horario asignado                |
      | salud        | alergias, tipo de sangre, EPS, caja de compensacion            |
      | emergencia   | contacto de emergencia, parentesco                             |
      | contrato     | fecha ingreso, fecha retiro, motivo retiro, cumpleanos         |
      | personales   | genero, direccion de residencia                                |
      | registro     | aceptacion de terminos y de politica de privacidad             |
    Y presiono "Actualizar empleado"
    Entonces el backend persiste los 33 campos en "hr_employees" vía PUT /hr/employees/EMP-001
    Y al recargar la ficha todos los valores editados se conservan tal cual
    Y las fechas se muestran en formato "YYYY-MM-DD" en los inputs de tipo date
    Y la tarifa horaria conserva sus decimales
    Y las iniciales quedan coherentes con el nombre si el backend no las tenia registradas

  Escenario: Guardar con fecha en formato invalido es rechazado
    Dado que abrí la ficha del empleado "EMP-001"
    Cuando el backend recibe una fecha que no cumple el formato "YYYY-MM-DD"
    Entonces responde 400 con un mensaje de validación en español
    Y la ficha muestra una alerta de error sin perder los datos del formulario

  Escenario: Guardar con estado inválido es rechazado
    Dado que abrí la ficha del empleado "EMP-001"
    Cuando el backend recibe un estado fuera de "Activo", "Inactivo" o "Licencia"
    Entonces responde 400 con un mensaje de validación en español
    Y la ficha muestra una alerta de error sin perder los datos del formulario

  # ─── RESTABLECER CLAVE ───────────────────────────────────────────────────

  Escenario: Restablecer clave de empleado con cuenta de acceso
    Dado que el empleado "EMP-001" tiene correo registrado y existe una cuenta de acceso con ese correo
    Cuando abro su ficha y presiono "Restablecer clave"
    Y confirmo la acción
    Entonces el backend genera un token de recuperación válido por 15 minutos
    Y veo una alerta de éxito con el enlace "/auth/reset-password?token=..." para compartir
    Y el token queda asociado a la cuenta de acceso del empleado

  Escenario: Restablecer clave de empleado sin correo registrado
    Dado que el empleado "EMP-002" no tiene correo electrónico en su ficha
    Cuando presiono "Restablecer clave" y confirmo
    Entonces el backend responde 400 indicando que el empleado no tiene correo registrado
    Y veo una alerta de error con ese mensaje

  Escenario: Restablecer clave de empleado sin cuenta de acceso
    Dado que el empleado "EMP-003" tiene correo registrado pero no existe cuenta de acceso con ese correo
    Cuando presiono "Restablecer clave" y confirmo
    Entonces el backend responde 404 indicando que el correo no tiene cuenta de acceso
    Y veo una alerta de error con ese mensaje

  # ─── LABELS Y CAMPOS ─────────────────────────────────────────────────────

  Escenario: Labels de identificación en la ficha
    Dado que abro la ficha de cualquier empleado
    Entonces el campo de documento se etiqueta "N° Documento" y es editable
    Y el campo de identificador interno se etiqueta "ID de sistema del empleado" y está deshabilitado
    Y los enlaces a documentos y salud del empleado usan el ID de sistema
