# language: es
Característica: RRHH - Foto del empleado y documentos reales del expediente
  Como responsable de recursos humanos
  Quiero guardar la foto del trabajador y gestionar soportes documentales reales
  Para mantener el expediente laboral completo y consultable sin datos mock

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8091
    Y estoy autenticado con rol "responsable"
    Y existe el empleado "EMP-001" en el directorio de RRHH

  # ─── FOTO DEL EMPLEADO ─────────────────────────────────────────────────

  Escenario: Cargar foto real y persistirla al actualizar el empleado
    Dado que estoy en la ficha "/app/profile-professional?source=hr-employees&employeeId=EMP-001"
    Cuando selecciono un archivo de imagen menor a 3MB en "Foto del trabajador"
    Entonces la foto se previsualiza de inmediato en el avatar de la ficha
    Y cuando presiono "Actualizar empleado"
    Entonces el backend guarda el campo "photoData" como data URL en "hr_employees.photo_data"
    Y al recargar la ficha la foto sigue visible (round-trip)

  Escenario: Rechazar archivo que no es imagen
    Dado que estoy en la ficha del empleado "EMP-001"
    Cuando selecciono un archivo que no es de tipo imagen
    Entonces veo una alerta de error indicando que el archivo no es una imagen valida
    Y el avatar conserva la imagen anterior

  Escenario: Rechazar foto que supera 3MB
    Dado que estoy en la ficha del empleado "EMP-001"
    Cuando selecciono una imagen mayor a 3MB
    Entonces veo una alerta de error indicando el tamano maximo permitido
    Y el backend rechaza "photoData" mayores a ~4MB en base64 con error 400 en espanol

  Escenario: Foto invalida es rechazada por el backend
    Cuando envio un create/update de empleado con "photoData" sin prefijo "data:image/"
    Entonces el backend responde 400 indicando que la foto debe ser una imagen en formato data URL

  # ─── DOCUMENTOS DEL EMPLEADO (MODULO HR - DOCUMENTOS) ──────────────────

  Escenario: El directorio de empleados viene del backend real
    Dado que estoy en "/app/company-hr-documents"
    Cuando se carga la vista
    Entonces el selector "Empleado" lista los empleados reales de "GET /api/v1/hr/employees"
    Y no existe el boton "Restaurar mock" ni se usa localStorage

  Escenario: Subir documento real con archivo adjunto
    Dado que estoy en "/app/company-hr-documents"
    Cuando selecciono empleado, categoria, adjunto un archivo menor a 8MB y presiono "Cargar soporte"
    Entonces veo un spinner mientras se sube el archivo
    Y el backend crea el documento con "POST /api/v1/hr/employees/:employeeID/documents" (201)
    Y el registro aparece en la tabla con fecha de carga, tamano y estado "Cargado"

  Escenario: Subir documento sin archivo muestra error
    Dado que estoy en "/app/company-hr-documents"
    Cuando presiono "Cargar soporte" sin adjuntar archivo
    Entonces el boton esta deshabilitado o veo una alerta pidiendo adjuntar el soporte

  Escenario: Previsualizar documento descarga el contenido real
    Dado que el empleado "EMP-001" tiene un soporte cargado
    Cuando presiono el icono de previsualizar en la fila del documento
    Entonces se consulta "GET .../documents/:documentID/download"
    Y el archivo se abre en una pestana nueva con su contenido real

  Escenario: Descargar documento guarda el archivo con su nombre original
    Dado que el empleado "EMP-001" tiene un soporte cargado
    Cuando presiono el icono de descargar
    Entonces se descarga el archivo con el "fileName" registrado en el backend

  Escenario: Eliminar documento aplica soft delete real
    Dado que el empleado "EMP-001" tiene un soporte cargado
    Cuando presiono eliminar y confirmo
    Entonces el backend marca "soft_delete = true" (DELETE 204)
    Y el documento desaparece de la tabla y de la matriz del expediente

  Escenario: Matriz del expediente refleja las categorias cubiertas
    Dado que estoy en "/app/company-hr-documents"
    Cuando un empleado tiene soportes en todas las categorias estandar
    Entonces su estado global es "Completo"
    Y las categorias sin soporte aparecen en "Pendientes de carga"

  # ─── RESUMEN EN LA FICHA PROFESIONAL ───────────────────────────────────

  Escenario: Resumen documental de la ficha viene del API real
    Dado que estoy en la ficha del empleado "EMP-001" cargada desde el directorio
    Cuando se muestra la seccion "Documentos del trabajador"
    Entonces "Soportes registrados" es el total real de documentos del empleado
    Y "Pendientes / por vencer" cuenta las categorias estandar sin soporte
    Y "Ultima carga" muestra la fecha del documento mas reciente

  Escenario: Sin empleado cargado el resumen es neutro
    Dado que estoy en la ficha sin un empleado del directorio cargado
    Cuando se muestra la seccion "Documentos del trabajador"
    Entonces el resumen muestra total 0, pendientes 0 y ultima carga "--"
