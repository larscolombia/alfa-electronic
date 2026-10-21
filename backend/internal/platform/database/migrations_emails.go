package database

// FASE 5c — Correos transaccionales con outbox durable y puente pago→despacho.
//
// Antes de esta fase había CERO infraestructura de correo en el backend
// (grep `smtp|sendmail|mailer` = 0 resultados), así que los tres flujos que
// el cliente pidió por correo (cotización "Guardar y enviar", aviso de
// despacho con transportadora/guía y acuse de recepción) no enviaban nada y,
// peor, la UI reportaba éxito.
//
// Decisión de diseño: NO se envía en línea dentro del request. Se encola en
// `email_outbox` y un worker la barre. Motivo: si el SMTP cae o no está
// configurado, el correo no se pierde en silencio — queda como fila visible
// en `GET /emails` con su último error. Un envío en línea que falla sólo
// deja un log que nadie mira.
//
// Todo idempotente: Migrate() corre en cada arranque.
//
// Nota sobre el alcance de este archivo: el diseño de la Fase 5c autoriza una
// única línea nueva en migrations_all.go, así que las columnas del puente
// pago→despacho sobre `remissions` viven aquí junto con el outbox en vez de
// abrir un segundo archivo de migraciones.
func migrationStatementsEmails5c() []string {
	return []string{
		// Outbox de correos transaccionales. status ∈ pendiente/enviado/
		// fallido/desactivado. 'desactivado' existe a propósito: cuando
		// SMTP_HOST viene vacío el worker marca la fila con ese estado y el
		// error "SMTP no configurado" en lugar de descartarla o, peor,
		// marcarla 'enviado' (éxito falso).
		`CREATE TABLE IF NOT EXISTS email_outbox (
			company_id TEXT NOT NULL,
			id TEXT NOT NULL,
			kind VARCHAR(60) NOT NULL DEFAULT '',
			to_email VARCHAR(180) NOT NULL DEFAULT '',
			subject VARCHAR(300) NOT NULL DEFAULT '',
			body_html TEXT NOT NULL DEFAULT '',
			ref_type VARCHAR(40) NOT NULL DEFAULT '',
			ref_id VARCHAR(120) NOT NULL DEFAULT '',
			status VARCHAR(20) NOT NULL DEFAULT 'pendiente'
				CHECK (status IN ('pendiente', 'enviado', 'fallido', 'desactivado')),
			attempts INT NOT NULL DEFAULT 0,
			last_error TEXT NOT NULL DEFAULT '',
			next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			created_by VARCHAR(160) NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			sent_at TIMESTAMPTZ NULL,
			PRIMARY KEY(company_id, id)
		);`,
		// El worker barre por estado y vencimiento del backoff, sin importar
		// la empresa: el índice cubre exactamente ese acceso.
		`CREATE INDEX IF NOT EXISTS idx_email_outbox_pending ON email_outbox(status, next_attempt_at);`,
		`CREATE INDEX IF NOT EXISTS idx_email_outbox_company_created ON email_outbox(company_id, created_at DESC);`,
		// Idempotencia de los disparadores: un mismo referente (cotización,
		// remisión, recepción) no debe apilar correos duplicados si el usuario
		// pulsa dos veces el botón.
		`CREATE UNIQUE INDEX IF NOT EXISTS uq_email_outbox_ref ON email_outbox(company_id, kind, ref_type, ref_id)
			WHERE ref_type <> '' AND ref_id <> '';`,

		// Puente pago→despacho (Fase 5c). La regla del cliente es POR
		// MODALIDAD, no universal: "despachos Servientrega son solo los
		// clientes créditos... eso se puede empacar y se despacha de una...
		// si son contra entregas, se quedan ahí empacaditos en la oficina
		// hasta que el cliente paga primero".
		//
		// invoice_id: factura que debe estar Pagada antes de despachar.
		// payment_override: escape exclusivo de admin, con rastro de quién y
		// cuándo porque salta un control de plata.
		`ALTER TABLE remissions ADD COLUMN IF NOT EXISTS invoice_id BIGINT NULL;`,
		`ALTER TABLE remissions ADD COLUMN IF NOT EXISTS payment_override BOOLEAN NOT NULL DEFAULT false;`,
		`ALTER TABLE remissions ADD COLUMN IF NOT EXISTS payment_override_by VARCHAR(160) NOT NULL DEFAULT '';`,
		`ALTER TABLE remissions ADD COLUMN IF NOT EXISTS payment_override_at TIMESTAMPTZ NULL;`,
		`CREATE INDEX IF NOT EXISTS idx_remissions_company_invoice ON remissions(company_id, invoice_id);`,
	}
}
