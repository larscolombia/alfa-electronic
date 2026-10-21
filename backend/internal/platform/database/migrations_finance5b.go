package database

// FASE 5b — Facturación como módulo: conversión cotización→factura, nota
// crédito, bloqueo de factura emitida ("no hay reversa"), número externo
// Oasis, datos fiscales del cliente y marca de cotización facturada.
// Todo idempotente: Migrate() corre en cada arranque.
//
// Nota sobre priorityBilling: los ítems de equipo NO tienen tabla propia;
// viven serializados en crm_equipment_records.items_json (JSONB), y el campo
// `priorityBilling` del struct Item ya viaja en ese JSON. Una columna SQL
// por registro tendría granularidad equivocada (el flag es por ítem) y
// crearía un campo muerto nuevo, así que aquí no se añade columna: la
// persistencia real se verifica por test sobre el round-trip del JSONB.
func migrationStatementsFinance5b() []string {
	return []string{
		// finance_invoices: número de factura externa Oasis, tipo de documento
		// (factura o nota crédito), referencia a la factura origen de la nota
		// crédito, bandera de bloqueo de factura emitida y cotización de origen.
		// NO se toca el CHECK de status: la nota crédito reutiliza los estados
		// existentes y se distingue por document_type.
		`ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS external_number VARCHAR(80) DEFAULT '';`,
		`ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS document_type VARCHAR(20) NOT NULL DEFAULT 'factura';`,
		`ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS credit_note_ref BIGINT NULL;`,
		`ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;`,
		`ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS source_quote_id VARCHAR(80) DEFAULT '';`,
		// Backfill: facturas ya emitidas quedan bloqueadas desde la migración.
		`UPDATE finance_invoices SET locked = true WHERE status IN ('Enviado', 'Pagado', 'Pago parcial') AND locked = false;`,
		`CREATE INDEX IF NOT EXISTS idx_finance_invoices_company_source_quote ON finance_invoices(company_id, source_quote_id);`,

		// crm_clients: datos fiscales exigidos por la facturación electrónica
		// (DV separado del NIT, código postal, correo de facturación electrónica
		// distinto del correo general, gran contribuyente y tipo de identificación).
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS dv VARCHAR(4) DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS billing_email VARCHAR(180) DEFAULT '';`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS grand_contributor BOOLEAN NOT NULL DEFAULT false;`,
		`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS id_type VARCHAR(20) NOT NULL DEFAULT 'NIT';`,

		// crm_quotes: marca de cotización facturada (id de la factura generada y
		// cuándo). Sostiene la idempotencia de la conversión junto con
		// finance_invoices.source_quote_id.
		`ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS invoice_id BIGINT NULL;`,
		`ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMPTZ NULL;`,
	}
}
