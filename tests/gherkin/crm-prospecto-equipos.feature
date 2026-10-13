# language: es
Característica: Equipos del prospecto en cotizaciones CRM
  Como asesor comercial
  Quiero que el formulario de cotización muestre los equipos recibidos del prospecto
  seleccionado (vinculados por su UUID real o por los datos de su empresa)
  Para incluirlos en la cotización sin buscarlos manualmente

  Antecedentes:
    Dado que el backend está corriendo en el puerto 8091
    Y estoy autenticado con rol "administrador" en la empresa "demo-company"

  # ─── VINCULACIÓN POR UUID REAL ───────────────────────────────────────────

  Escenario: Registrar equipos asociados al prospecto por su UUID real
    Dado que el prospecto "Industrias Manafacturera" tiene id UUID "60b1066e-..."
    Cuando registro una recepción de equipos desde la ficha del prospecto
    Entonces el registro se guarda con prospect_id igual al UUID del prospecto
    Y no con un id numérico derivado de parseInt del UUID

  Escenario: La cotización lista los equipos del prospecto seleccionado
    Dado que el prospecto tiene 2 equipos registrados con su UUID
    Cuando abro una nueva cotización y selecciono ese prospecto
    Entonces la sección "Equipos asociados a la cotización" muestra 2 checkboxes
    Y puedo marcar los equipos para relacionarlos con la cotización

  Escenario: Prospecto sin equipos muestra estado vacío amigable
    Dado que el prospecto seleccionado no tiene equipos registrados
    Cuando abro una nueva cotización y selecciono ese prospecto
    Entonces se muestra el mensaje "El prospecto seleccionado no tiene equipos asociados"

  # ─── MATCH AMPLIADO POR CLIENTE (RECEPCIONES DIRECTAS) ──────────────────

  Escenario: Recepciones directas del mismo cliente aparecen en la cotización
    Dado que existe una recepción directa (prospect_id "-9000") con el NIT del prospecto
    Y el prospecto tiene ese mismo NIT en su ficha
    Cuando selecciono el prospecto en el formulario de cotización
    Entonces el equipo de la recepción directa aparece como checkbox disponible

  Escenario: Equipos de un cliente ajeno no aparecen
    Dado que existe una recepción directa de otra empresa con NIT diferente
    Cuando selecciono el prospecto en el formulario de cotización
    Entonces ese equipo no aparece en la lista de equipos disponibles

  # ─── FICHA DEL PROSPECTO ────────────────────────────────────────────────

  Escenario: La pestaña Equipos de la ficha lee desde la API
    Dado que el prospecto tiene equipos registrados en el backend
    Cuando abro la ficha del prospecto y entro a la pestaña "Equipos"
    Entonces los equipos se cargan desde la API con el UUID del prospecto
    Y no desde el almacenamiento local del navegador

  # ─── COMPATIBILIDAD ─────────────────────────────────────────────────────

  Escenario: Registros con ids numéricos legados no matchean UUIDs
    Dado que existe un registro de equipos con prospect_id numérico legado "60"
    Cuando consulto los equipos del prospecto con UUID "60b1066e-..."
    Entonces el registro legado no aparece en los resultados
