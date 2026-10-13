# language: es
Característica: RRHH - Creación de empleados
  Como responsable de recursos humanos
  Quiero crear empleados desde el directorio de RRHH
  Para mantener la base de colaboradores persistida en el backend

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8091
    Y estoy autenticado con rol "responsable"
    Y estoy en el directorio "/app/company-hr-employees"

  # ─── CREACIÓN DESDE LA UI ────────────────────────────────────────────────

  Escenario: Crear empleado válido desde "Agregar empleado"
    Dado que presiono el botón "Agregar empleado"
    Cuando completo la ficha profesional con nombre "QA Empleado Uno", cargo "Tecnico soporte" y departamento "Operaciones"
    Y presiono "Actualizar empleado"
    Entonces el empleado se persiste en el backend con estado "Activo"
    Y veo un mensaje de confirmación de creación exitosa
    Y regreso al directorio de empleados
    Y el nuevo empleado aparece en el directorio con un ID "EMP-###" generado

  Escenario: Crear empleado reutilizando cargo y departamento existentes
    Dado que ya existe el cargo "Coordinador SST" y el departamento "Gestion Humana"
    Cuando creo un empleado con nombre "QA Empleado Dos" asignado a ese cargo y departamento
    Entonces el empleado se persiste exitosamente
    Y el catálogo de cargos sigue teniendo una sola entrada "Coordinador SST"
    Y el catálogo de departamentos sigue teniendo una sola entrada "Gestion Humana"

  Escenario: Crear empleado con cargo y departamento nuevos los agrega al catálogo
    Cuando creo un empleado con cargo "QA Cargo Nuevo" y departamento "QA Dept Nuevo"
    Entonces el empleado se persiste exitosamente
    Y "QA Cargo Nuevo" queda disponible en el catálogo de cargos
    Y "QA Dept Nuevo" queda disponible en el catálogo de departamentos

  # ─── VALIDACIONES ────────────────────────────────────────────────────────

  Escenario: Crear empleado sin nombre es rechazado
    Dado que presiono el botón "Agregar empleado"
    Cuando intento guardar la ficha sin nombre del colaborador
    Entonces recibo un error de validación "employee name is required"
    Y no se crea ningún empleado en el backend
    Y permanezco en la ficha profesional con el mensaje de error visible

  Escenario: Fallo del backend muestra feedback de error
    Dado que el endpoint de creación de empleados no responde
    Cuando intento guardar la ficha profesional de un empleado nuevo
    Entonces veo un mensaje de error indicando que no se pudo crear el empleado
    Y permanezco en la ficha profesional sin navegar al directorio

  # ─── PERSISTENCIA ────────────────────────────────────────────────────────

  Escenario: El empleado creado persiste tras recargar la página
    Dado que creé el empleado "QA Empleado Persistente"
    Cuando recargo el directorio de empleados
    Entonces "QA Empleado Persistente" sigue apareciendo en el listado
