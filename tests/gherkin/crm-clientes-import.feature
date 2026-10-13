# language: es
Característica: CRM Clientes - Importación masiva desde Excel
  Como usuario del CRM
  Quiero importar clientes desde un archivo Excel
  Para agilizar la carga masiva de la cartera de clientes

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8080
    Y estoy autenticado en la aplicación
    Y estoy en la página "/app/crm-clientes"

  # ─── TABLA DE CLIENTES ─────────────────────────────────────────────────

  Escenario: La tabla de clientes muestra máximo 5 columnas
    Cuando la tabla de clientes termina de cargar
    Entonces la tabla tiene exactamente 5 columnas
    Y las columnas son "Cliente", "Contacto", "Detalles", "Estado" y "Acciones"

  Escenario: Abrir ficha de cliente desde el dropdown de acciones
    Dado que existe al menos un cliente en la tabla
    Cuando abro el dropdown "Acciones" de una fila
    Y selecciono la opción "Abrir ficha"
    Entonces navego a la página "/app/crm-clientes/:id" del cliente

  # ─── PLANTILLA EXCEL ───────────────────────────────────────────────────

  Escenario: Descargar plantilla Excel de clientes
    Cuando hago clic en el botón "Importar clientes"
    Y hago clic en el botón "Descargar plantilla Excel"
    Entonces se descarga el archivo "plantilla_clientes.xlsx"
    Y la plantilla contiene los encabezados esperados y dos filas de ejemplo

  # ─── IMPORTACIÓN ───────────────────────────────────────────────────────

  Escenario: Importar archivo Excel válido
    Dado que abrí el panel "Importar clientes"
    Cuando selecciono un archivo Excel con 2 filas válidas
    Entonces la vista previa muestra "2 filas listas para importar"
    Cuando hago clic en el botón "Importar 2 clientes"
    Entonces veo el resumen "2 clientes importados"
    Y los 2 clientes nuevos aparecen en la tabla al recargar la página

  Escenario: Importar archivo con errores parciales
    Dado que abrí el panel "Importar clientes"
    Cuando selecciono un archivo Excel con 2 filas válidas y 1 fila sin nombre
    Entonces la vista previa muestra "2 filas listas para importar, 1 con errores"
    Y los errores de validación indican "Fila 4" con el mensaje "Nombre es obligatorio"
    Cuando hago clic en el botón "Importar 2 clientes"
    Entonces veo el resumen "2 clientes importados"
    Y la fila inválida no fue creada como cliente

  Escenario: El botón de importar está deshabilitado sin filas válidas
    Dado que abrí el panel "Importar clientes"
    Cuando no he seleccionado ningún archivo
    Entonces el botón de importar está deshabilitado
