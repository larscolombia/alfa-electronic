package remissions

// invoiceDisplayCodeSQL es el "número de factura" tal como lo conoce el usuario
// que paga: el external_number si existe; si no, serie+consecutivo con el
// consecutivo en 6 dígitos (FAC-2026-000061); y sólo como último recurso el
// reference_code. Mostrar el reference_code era un bug: en las facturas
// nacidas de cotización guarda el código COT-*, así que el indicador del
// despacho y el selector "Vincular factura" mostraban un código que la
// sincronización de pagos no resuelve y el usuario no reconoce como factura.
// Debe usarse con el alias `fi` de finance_invoices.
const invoiceDisplayCodeSQL = `COALESCE(NULLIF(btrim(COALESCE(fi.external_number, '')), ''),
	CASE
		WHEN fi.series_prefix IS NOT NULL AND btrim(fi.series_prefix) <> ''
			AND fi.sequence_number IS NOT NULL AND fi.sequence_number > 0
		THEN btrim(fi.series_prefix, '-') || '-' || lpad(fi.sequence_number::text, 6, '0')
		ELSE COALESCE(fi.reference_code, '')
	END)`
