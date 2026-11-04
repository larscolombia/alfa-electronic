Característica: Espera de respuesta del cliente sobre una cotización
  Como coordinador técnico
  Quiero identificar los equipos cuya cotización ya fue enviada
  Para no iniciar compras o reparación antes de que el cliente responda.

  Escenario: Crear una columna después de Por cotizar
    Dado que estoy en Configuración de proyectos
    Cuando creo la columna "Esperando Cliente"
    Y selecciono el estado técnico asociado "Esperando Cliente"
    Entonces puedo guardar la columna
    Y queda disponible después de "Por cotizar" en el flujo técnico.

  Escenario: Esperar aprobación antes de continuar
    Dado que un equipo está en "Por cotizar"
    Cuando la cotización se envía al cliente
    Entonces el equipo puede moverse a "Esperando Cliente"
    Y desde allí puede volver a "Por cotizar" si el cliente pide un ajuste
    Y puede continuar a "Pedir componentes" o "En reparación" tras su aprobación.
